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
  console.log("[DEBUG_SCREEN_SHARE] useStreamLifecycle hook called.");
  const dispatch = useDispatch();
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const currentAcquisitionAbortControllerRef = useRef<AbortController | null>(null);
  const lastLaunchedDetailsRef = useRef<StreamDetails | null>(null); // 新增：用于跟踪上次启动acquisition的details

  const { lastRequestedDetails, status, error } = useSelector((state: RootState) => state.mediaStream);

  // Helper function to check if currentStream matches desiredDetails (only intent-related parts)
  const streamMatchesDesiredDetails = useCallback((current: MediaStream | null, desired: StreamDetails | null): boolean => {
    console.log('[DEBUG_SCREEN_SHARE] streamMatchesDesiredDetails called. current stream: {}, desired details: {}', current, desired);
    if (!current || !desired) {
      console.log('[DEBUG_SCREEN_SHARE] streamMatchesDesiredDetails: No current stream or desired details, returning false.');
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
      console.log('[DEBUG_SCREEN_SHARE] streamMatchesDesiredDetails: Desired CAMERA. videoTypeMatches: {}', videoTypeMatches);
    } else if (desired.videoSourceType === VideoSourceType.SCREEN) {
      // 期望是屏幕共享，当前轨道必须是视频类型且是屏幕共享
      videoTypeMatches = currentVideoTrack && currentVideoTrack.kind === 'video' && isCurrentTrackScreenShare;
      console.log('[DEBUG_SCREEN_SHARE] streamMatchesDesiredDetails: Desired SCREEN. videoTypeMatches: {}', videoTypeMatches);
    }

    // 2. 判断摄像头设备ID是否匹配
    let camDeviceIdMatches = false;
    if (desired.camDeviceId === "default-cam-item") {
      // 如果期望是默认摄像头，只要当前有视频轨道就视为匹配（因为实际设备ID未知）
      camDeviceIdMatches = !!currentVideoTrack;
      console.log('[DEBUG_SCREEN_SHARE] streamMatchesDesiredDetails: Desired default CAM. camDeviceIdMatches: {}', camDeviceIdMatches);
    } else {
      // 否则，精确匹配设备ID
      camDeviceIdMatches = !desired.camDeviceId || (currentVideoTrack && currentVideoTrack.getSettings().deviceId === desired.camDeviceId);
      console.log('[DEBUG_SCREEN_SHARE] streamMatchesDesiredDetails: Desired specific CAM ({}). camDeviceIdMatches: {}', desired.camDeviceId, camDeviceIdMatches);
    }

    // 3. 判断麦克风设备ID是否匹配
    const micDeviceIdMatches = !desired.micDeviceId || (currentAudioTrack && currentAudioTrack.getSettings().deviceId === desired.micDeviceId);
    console.log('[DEBUG_SCREEN_SHARE] streamMatchesDesiredDetails: Desired MIC ({}). micDeviceIdMatches: {}', desired.micDeviceId, micDeviceIdMatches);

    // 移除对静音状态的匹配，因为它现在是独立的属性
    const finalMatch = videoTypeMatches && camDeviceIdMatches && micDeviceIdMatches;
    console.log('[DEBUG_SCREEN_SHARE] streamMatchesDesiredDetails: Final match result: {}', finalMatch);
    return finalMatch;
  }, []);

  const performStreamAcquisition = useCallback(
    async (details: StreamDetails, abortSignal: AbortController['signal']) => {
      console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition called for details: {}, abortSignal aborted: {}', details, abortSignal.aborted);
      if (abortSignal.aborted) {
        console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: Abort signal already aborted, returning.');
        return;
      }

      try {
        let acquiredStream: MediaStream | null = null;

        const constraints: MediaStreamConstraints = {
          video: details.videoSourceType === VideoSourceType.CAMERA ? (details.camDeviceId && details.camDeviceId !== "default-cam-item" ? { deviceId: details.camDeviceId } : true) : false,
          audio: details.micDeviceId ? { deviceId: details.micDeviceId } : true,
        };
        console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: Constraints for getUserMedia: {}', constraints);

        if (details.videoSourceType === VideoSourceType.SCREEN) {
          console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: Calling getDisplayMedia...');
          acquiredStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true, signal: abortSignal } as DisplayMediaStreamOptions);
          console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: getDisplayMedia successful. Stream ID: {}', acquiredStream?.id);
          if (acquiredStream) {
            acquiredStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
              track.onended = () => {
                console.log('[DEBUG_SCREEN_SHARE] Screen share video track ended. Stream ID: {}', acquiredStream?.id);
                if (mediaStreamRef.current === acquiredStream) {
                  mediaStreamRef.current = null;
                  console.log('[DEBUG_SCREEN_SHARE] Dispatching stopStream due to screen share track ended.');
                  dispatch(stopStream());
                }
              };
            });
          }
        } else if (details.videoSourceType === VideoSourceType.CAMERA) {
          console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: Calling getUserMedia...');
          acquiredStream = await navigator.mediaDevices.getUserMedia({ ...constraints, signal: abortSignal } as MediaStreamConstraints);
          console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: getUserMedia successful. Stream ID: {}', acquiredStream?.id);
          if (acquiredStream) {
            acquiredStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
              track.onended = () => {
                console.log('[DEBUG_SCREEN_SHARE] Camera video track ended. Stream ID: {}', acquiredStream?.id);
                if (mediaStreamRef.current === acquiredStream) {
                  mediaStreamRef.current = null;
                  console.log('[DEBUG_SCREEN_SHARE] Dispatching stopStream due to camera video track ended.');
                  dispatch(stopStream());
                }
              };
            });
            acquiredStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
              track.onended = () => {
                console.log('[DEBUG_SCREEN_SHARE] Camera audio track ended. Stream ID: {}', acquiredStream?.id);
                if (mediaStreamRef.current === acquiredStream) {
                  mediaStreamRef.current = null;
                  console.log('[DEBUG_SCREEN_SHARE] Dispatching stopStream due to camera audio track ended.');
                  dispatch(stopStream());
                }
              };
            });
          }
        }

        if (abortSignal.aborted) {
          console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: Abort signal received after stream acquisition, stopping tracks.');
          if (acquiredStream) acquiredStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          return;
        }

        if (acquiredStream) {
          mediaStreamRef.current = acquiredStream;
          console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: Dispatching streamAcquired with details: {}', details);
          dispatch(streamAcquired({ details }));
        } else {
          console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: No stream acquired, dispatching permissionDenied.');
          dispatch(permissionDenied());
        }
      } catch (error: any) {
        console.error('[DEBUG_SCREEN_SHARE] performStreamAcquisition: Error during stream acquisition: {}', error);
        if (error.name === 'AbortError') {
          console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: Acquisition aborted.');
          return; // It's a cancellation, not an error to report to Redux
        }
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: Dispatching permissionDenied.');
          dispatch(permissionDenied());
        } else {
          console.log('[DEBUG_SCREEN_SHARE] performStreamAcquisition: Dispatching streamError with error: {}', error.message);
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
    console.log('[DEBUG_SCREEN_SHARE] Main useEffect triggered. lastRequestedDetails: {}, status: {}', lastRequestedDetails, status);
    const desiredDetails = lastRequestedDetails;
    const currentStream = mediaStreamRef.current;

    const stopAndClearStream = (streamToStop: MediaStream | null) => {
      if (streamToStop) {
        console.log('[DEBUG_SCREEN_SHARE] stopAndClearStream: Stopping tracks for stream ID: {}', streamToStop.id);
        streamToStop.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      mediaStreamRef.current = null;
      console.log('[DEBUG_SCREEN_SHARE] stopAndClearStream: mediaStreamRef cleared.');
    };

    // Scenario 1: No stream desired (lastRequestedDetails is null or videoSourceType is NONE)
    if (!desiredDetails || desiredDetails.videoSourceType === VideoSourceType.NONE) {
      console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 1: No stream desired.');
      if (currentStream) { // If there's an active physical stream, stop it
        console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 1: Stopping current physical stream.');
        stopAndClearStream(currentStream);
      }
      if (status !== StreamStatus.IDLE) { // If Redux state is not IDLE, dispatch stopStream
        console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 1: Dispatching stopStream action.');
        dispatch(stopStream());
      }
      // Reset last launched details when no stream is desired
      lastLaunchedDetailsRef.current = null;
      console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 1: Reset lastLaunchedDetailsRef to null.');
      return; // Exit as no stream is desired
    }

    // From here, desiredDetails must NOT be null and desired.videoSourceType must be CAMERA or SCREEN.

    // Scenario 2: Desired stream is already active and matches the current physical stream AND Redux status is ACTIVE.
    // Only consider stream active if mediaStreamRef.current actually holds a stream AND Redux status is ACTIVE.
    if (currentStream && streamMatchesDesiredDetails(currentStream, desiredDetails) &&
        (status === StreamStatus.ACTIVE_CAMERA || status === StreamStatus.ACTIVE_SCREEN)) {
      console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 2: Desired stream already active and matching. Stream ID: {}', currentStream.id);
      // Reset last launched details since we are already active and matching
      lastLaunchedDetailsRef.current = desiredDetails;
      console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 2: lastLaunchedDetailsRef updated to current desired details.');
      return; // Nothing more to do for stream lifecycle
    }

    // Scenario 3: Redux state is PENDING, and we need to manage the actual stream acquisition.
    if (status === StreamStatus.PENDING && desiredDetails) {
      console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 3: Redux status is PENDING.');
      const stringifiedDesired = JSON.stringify(desiredDetails);
      const stringifiedLastLaunched = JSON.stringify(lastLaunchedDetailsRef.current);
      console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 3: Desired: {}, Last Launched: {}', stringifiedDesired, stringifiedLastLaunched);

      if (stringifiedDesired !== stringifiedLastLaunched) {
        console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 3: Desired details differ from last launched, initiating new acquisition.');
        // Abort any existing acquisition (which would be for old desiredDetails or a previous PENDING state)
        if (currentAcquisitionAbortControllerRef.current) {
          console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 3: Aborting previous acquisition.');
          currentAcquisitionAbortControllerRef.current.abort();
        }

        const newAbortController = new AbortController();
        currentAcquisitionAbortControllerRef.current = newAbortController;
        performStreamAcquisition(desiredDetails, newAbortController.signal);
        lastLaunchedDetailsRef.current = desiredDetails; // Mark these details as "in-flight" for performStreamAcquisition
        console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 3: New acquisition initiated. lastLaunchedDetailsRef updated.');
      } else {
        console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 3: Desired details match last launched, waiting for acquisition completion.');
      }
      return; // Regardless, if PENDING, we manage here and return.
    }

    // Scenario 4: Other states (IDLE, ERROR, PERMISSION_DENIED) or current physical stream doesn't match,
    // AND Redux state is NOT PENDING. We need to dispatch `requestStream` to initiate the PENDING state.
    if (status !== StreamStatus.PENDING) {
      console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 4: Redux status is not PENDING. Current status: {}', status);
        if (currentStream && !streamMatchesDesiredDetails(currentStream, desiredDetails)) {
            console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 4: Current physical stream does not match desired, stopping and clearing.');
            stopAndClearStream(currentStream);
        }
        // 显式过滤 desiredDetails，确保只包含 StreamDetails 中定义的属性
        const cleanedDesiredDetails: StreamDetails = {
          videoSourceType: desiredDetails.videoSourceType,
          ...(desiredDetails.camDeviceId && { camDeviceId: desiredDetails.camDeviceId }),
          ...(desiredDetails.micDeviceId && { micDeviceId: desiredDetails.micDeviceId }),
        };
        console.log('[DEBUG_SCREEN_SHARE] Main useEffect Scenario 4: Dispatching requestStream with cleaned details: {}', cleanedDesiredDetails);
        dispatch(requestStream(cleanedDesiredDetails));
        return; // Request dispatched, now wait for Redux state to become PENDING
    }

    return () => {
      console.log('[DEBUG_SCREEN_SHARE] Main useEffect cleanup. Current mediaStreamRef: {}', mediaStreamRef.current);
      // Abort any ongoing acquisition when the component unmounts or dependencies change significantly.
      if (currentAcquisitionAbortControllerRef.current) {
        console.log('[DEBUG_SCREEN_SHARE] Main useEffect cleanup: Aborting ongoing acquisition.');
        currentAcquisitionAbortControllerRef.current.abort();
        currentAcquisitionAbortControllerRef.current = null;
      }
      // Stop the currently active physical stream when the hook instance is cleaned up.
      if (mediaStreamRef.current) {
        console.log('[DEBUG_SCREEN_SHARE] Main useEffect cleanup: Stopping active physical stream. Stream ID: {}', mediaStreamRef.current.id);
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      // Also reset lastLaunchedDetailsRef on cleanup to ensure fresh start if component re-mounts.
      lastLaunchedDetailsRef.current = null;
      console.log('[DEBUG_SCREEN_SHARE] Main useEffect cleanup: lastLaunchedDetailsRef cleared.');
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
