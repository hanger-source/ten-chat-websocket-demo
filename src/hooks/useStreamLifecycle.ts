import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  streamAcquired,
  streamError,
  permissionDenied,
  stopStream,
  StreamStatus,
  StreamDetails,
  MediaStreamState,
  requestStream, // 导入 requestStream
} from '@/store/reducers/mediaStream';
import { RootState } from '@/store';
import { VideoSourceType } from '@/common/constant';

interface UseStreamLifecycleResult {
  stream: MediaStream | null;
  streamStatus: StreamStatus;
  streamError: string | null;
  getMediaStreamInstance: () => MediaStream | null;
}

export const useStreamLifecycle = (): UseStreamLifecycleResult => {
  const dispatch = useDispatch();
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const currentAcquisitionAbortControllerRef = useRef<AbortController | null>(null);
  const lastLaunchedDetailsRef = useRef<StreamDetails | null>(null); // 新增：用于跟踪上次启动acquisition的details

  const { lastRequestedDetails, status, error } = useSelector((state: RootState) => state.mediaStream);

  // Helper function to check if currentStream matches desiredDetails (only intent-related parts)
  const streamMatchesDesiredDetails = useCallback((current: MediaStream | null, desired: StreamDetails | null): boolean => {
    if (!current || !desired) {
      return false;
    }

    const currentVideoTrack: MediaStreamTrack | undefined = current.getVideoTracks()[0];
    const currentAudioTrack: MediaStreamTrack | undefined = current.getAudioTracks()[0];

    // 1. 判断视频源类型是否匹配
    let videoTypeMatches = false;
    const isCurrentTrackScreenShare = currentVideoTrack && (
      currentVideoTrack.label.includes('web-contents-media-stream') || // Chromium 特征
      currentVideoTrack.label.includes('screen') || // 常见屏幕共享标签
      currentVideoTrack.label.includes('display')   // 某些浏览器可能包含
    );

    if (desired.videoSourceType === VideoSourceType.CAMERA) {
      // 期望是摄像头，当前轨道必须是视频类型且不是屏幕共享
      videoTypeMatches = currentVideoTrack && currentVideoTrack.kind === 'video' && !isCurrentTrackScreenShare;
    } else if (desired.videoSourceType === VideoSourceType.SCREEN) {
      // 期望是屏幕共享，当前轨道必须是视频类型且是屏幕共享
      videoTypeMatches = currentVideoTrack && currentVideoTrack.kind === 'video' && isCurrentTrackScreenShare;
    }

    // 2. 判断摄像头设备ID是否匹配
    let camDeviceIdMatches = false;
    if (desired.camDeviceId === "default-cam-item") {
      // 如果期望是默认摄像头，只要当前有视频轨道就视为匹配（因为实际设备ID未知）
      camDeviceIdMatches = !!currentVideoTrack;
    } else {
      // 否则，精确匹配设备ID
      camDeviceIdMatches = !desired.camDeviceId || (currentVideoTrack && currentVideoTrack.getSettings().deviceId === desired.camDeviceId);
    }

    // 3. 判断麦克风设备ID是否匹配
    const micDeviceIdMatches = !desired.micDeviceId || (currentAudioTrack && currentAudioTrack.getSettings().deviceId === desired.micDeviceId);

    // 移除对静音状态的匹配，因为它现在是独立的属性
    const finalMatch = videoTypeMatches && camDeviceIdMatches && micDeviceIdMatches;
    return finalMatch;
  }, []);

  const performStreamAcquisition = useCallback(
    async (details: StreamDetails, abortSignal: AbortController['signal']) => {
      if (abortSignal.aborted) {
        return;
      }

      try {
        let acquiredStream: MediaStream | null = null;

        const constraints: MediaStreamConstraints = {
          video: details.videoSourceType === VideoSourceType.CAMERA ? (details.camDeviceId && details.camDeviceId !== "default-cam-item" ? { deviceId: details.camDeviceId } : true) : false,
          audio: details.micDeviceId ? { deviceId: details.micDeviceId } : true,
        };

        if (details.videoSourceType === VideoSourceType.SCREEN) {
          acquiredStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true, signal: abortSignal } as DisplayMediaStreamOptions);
          if (acquiredStream) {
            acquiredStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
              track.onended = () => {
                if (mediaStreamRef.current === acquiredStream) {
                  mediaStreamRef.current = null;
                  dispatch(stopStream());
                }
              };
            });
          }
        } else if (details.videoSourceType === VideoSourceType.CAMERA) {
          acquiredStream = await navigator.mediaDevices.getUserMedia({ ...constraints, signal: abortSignal } as MediaStreamConstraints);
          if (acquiredStream) {
            acquiredStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
              track.onended = () => {
                if (mediaStreamRef.current === acquiredStream) {
                  mediaStreamRef.current = null;
                  dispatch(stopStream());
                }
              };
            });
            acquiredStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
              track.onended = () => {
                if (mediaStreamRef.current === acquiredStream) {
                  mediaStreamRef.current = null;
                  dispatch(stopStream());
                }
              };
            });
          }
        }

        if (abortSignal.aborted) {
          if (acquiredStream) acquiredStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          return;
        }

        if (acquiredStream) {
          // 移除竞态条件检查，由 useEffect 的 lastLaunchedDetailsRef 和 AbortController 处理
          // if (JSON.stringify(details) === JSON.stringify(lastRequestedDetails)) {
            // 如果有旧流，则停止它。这里的停止应由 useEffect 负责
            // if (mediaStreamRef.current) {
            //   mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            // }
            mediaStreamRef.current = acquiredStream;
            // 在这里不应用静音状态，因为静音现在由 useCameraMute Hook 处理
            dispatch(streamAcquired({ details }));
          // } else {
          //   acquiredStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          // }
        } else {
          dispatch(permissionDenied());
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return; // It's a cancellation, not an error to report to Redux
        }
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          dispatch(permissionDenied());
        } else {
          dispatch(streamError({ error: error.message }));
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          mediaStreamRef.current = null;
        }
      }
    },
    [dispatch, lastRequestedDetails, status],
  );

  useEffect(() => {
    const desiredDetails = lastRequestedDetails;
    const currentStream = mediaStreamRef.current;

    const stopAndClearStream = (streamToStop: MediaStream | null) => {
      if (streamToStop) {
        streamToStop.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      mediaStreamRef.current = null;
    };

    // Scenario 1: No stream desired (lastRequestedDetails is null or videoSourceType is NONE)
    if (!desiredDetails || desiredDetails.videoSourceType === VideoSourceType.NONE) {
      if (currentStream) { // If there's an active physical stream, stop it
        stopAndClearStream(currentStream);
      }
      if (status !== StreamStatus.IDLE) { // If Redux state is not IDLE, dispatch stopStream
        dispatch(stopStream());
      }
      // Reset last launched details when no stream is desired
      lastLaunchedDetailsRef.current = null;
      return; // Exit as no stream is desired
    }

    // From here, desiredDetails must NOT be null and desired.videoSourceType must be CAMERA or SCREEN.

    // Scenario 2: Desired stream is already active and matches the current physical stream AND Redux status is ACTIVE.
    // Only consider stream active if mediaStreamRef.current actually holds a stream AND Redux status is ACTIVE.
    if (currentStream && streamMatchesDesiredDetails(currentStream, desiredDetails) &&
        (status === StreamStatus.ACTIVE_CAMERA || status === StreamStatus.ACTIVE_SCREEN)) {
      // Reset last launched details since we are already active and matching
      lastLaunchedDetailsRef.current = desiredDetails;
      return; // Nothing more to do for stream lifecycle
    }

    // Scenario 3: Redux state is PENDING, and we need to manage the actual stream acquisition.
    if (status === StreamStatus.PENDING && desiredDetails) {
      const stringifiedDesired = JSON.stringify(desiredDetails);
      const stringifiedLastLaunched = JSON.stringify(lastLaunchedDetailsRef.current);

      if (stringifiedDesired !== stringifiedLastLaunched) {

        // Abort any existing acquisition (which would be for old desiredDetails or a previous PENDING state)
        if (currentAcquisitionAbortControllerRef.current) {
          currentAcquisitionAbortControllerRef.current.abort();
        }

        const newAbortController = new AbortController();
        currentAcquisitionAbortControllerRef.current = newAbortController;
        performStreamAcquisition(desiredDetails, newAbortController.signal);
        lastLaunchedDetailsRef.current = desiredDetails; // Mark these details as "in-flight" for performStreamAcquisition
      } else {
      }
      return; // Regardless, if PENDING, we manage here and return.
    }

    // Scenario 4: Other states (IDLE, ERROR, PERMISSION_DENIED) or current physical stream doesn't match,
    // AND Redux state is NOT PENDING. We need to dispatch `requestStream` to initiate the PENDING state.
    if (status !== StreamStatus.PENDING) {
        if (currentStream && !streamMatchesDesiredDetails(currentStream, desiredDetails)) {
            stopAndClearStream(currentStream);
        }
        // 显式过滤 desiredDetails，确保只包含 StreamDetails 中定义的属性
        const cleanedDesiredDetails: StreamDetails = {
          videoSourceType: desiredDetails.videoSourceType,
          ...(desiredDetails.camDeviceId && { camDeviceId: desiredDetails.camDeviceId }),
          ...(desiredDetails.micDeviceId && { micDeviceId: desiredDetails.micDeviceId }),
        };
        dispatch(requestStream(cleanedDesiredDetails));
        return; // Request dispatched, now wait for Redux state to become PENDING
    }

    return () => {
      // Abort any ongoing acquisition when the component unmounts or dependencies change significantly.
      if (currentAcquisitionAbortControllerRef.current) {
        currentAcquisitionAbortControllerRef.current.abort();
        currentAcquisitionAbortControllerRef.current = null;
      }
      // Stop the currently active physical stream when the hook instance is cleaned up.
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      // Also reset lastLaunchedDetailsRef on cleanup to ensure fresh start if component re-mounts.
      lastLaunchedDetailsRef.current = null;
    };
  }, [dispatch, lastRequestedDetails, status, performStreamAcquisition, streamMatchesDesiredDetails]);

  const getMediaStreamInstance = useCallback(() => mediaStreamRef.current, []);

  return {
    stream: mediaStreamRef.current,
    streamStatus: status,
    streamError: error,
    getMediaStreamInstance,
  };
};
