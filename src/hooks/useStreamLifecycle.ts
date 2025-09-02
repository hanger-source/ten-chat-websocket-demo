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
      console.log("[DEBUG_STREAM_LIFECYCLE] streamMatchesDesiredDetails: One of current or desired is null/undefined. Returning false.");
      return false;
    }

    const currentVideoTrack: MediaStreamTrack | undefined = current.getVideoTracks()[0];
    const currentAudioTrack: MediaStreamTrack | undefined = current.getAudioTracks()[0];

    // 调试：打印视频/音频轨道信息
    if (currentVideoTrack) {
      console.log(`[DEBUG_STREAM_LIFECYCLE] streamMatchesDesiredDetails: Current video track - ID: ${currentVideoTrack.id}, Label: ${currentVideoTrack.label}, Kind: ${currentVideoTrack.kind}`);
    }
    if (currentAudioTrack) {
      console.log(`[DEBUG_STREAM_LIFECYCLE] streamMatchesDesiredDetails: Current audio track - ID: ${currentAudioTrack.id}, Label: ${currentAudioTrack.label}, Kind: ${currentAudioTrack.kind}`);
    }

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
    console.log(`[DEBUG_STREAM_LIFECYCLE] streamMatchesDesiredDetails: videoTypeMatches: ${videoTypeMatches}, Desired Video Source Type: ${desired.videoSourceType}, isCurrentTrackScreenShare: ${isCurrentTrackScreenShare}`);

    // 2. 判断摄像头设备ID是否匹配
    let camDeviceIdMatches = false;
    if (desired.camDeviceId === "default-cam-item") {
      // 如果期望是默认摄像头，只要当前有视频轨道就视为匹配（因为实际设备ID未知）
      camDeviceIdMatches = !!currentVideoTrack;
    } else {
      // 否则，精确匹配设备ID
      camDeviceIdMatches = !desired.camDeviceId || (currentVideoTrack && currentVideoTrack.getSettings().deviceId === desired.camDeviceId);
    }
    console.log(`[DEBUG_STREAM_LIFECYCLE] streamMatchesDesiredDetails: camDeviceIdMatches: ${camDeviceIdMatches}, Desired Cam Device ID: ${desired.camDeviceId}, Current Cam Device ID: ${currentVideoTrack?.getSettings().deviceId}`);

    // 3. 判断麦克风设备ID是否匹配
    const micDeviceIdMatches = !desired.micDeviceId || (currentAudioTrack && currentAudioTrack.getSettings().deviceId === desired.micDeviceId);
    console.log(`[DEBUG_STREAM_LIFECYCLE] streamMatchesDesiredDetails: micDeviceIdMatches: ${micDeviceIdMatches}, Desired Mic Device ID: ${desired.micDeviceId}, Current Mic Device ID: ${currentAudioTrack?.getSettings().deviceId}`);

    // 移除对静音状态的匹配，因为它现在是独立的属性
    const finalMatch = videoTypeMatches && camDeviceIdMatches && micDeviceIdMatches; // && cameraMuteStateMatches && microphoneMuteStateMatches;
    console.log(`[DEBUG_STREAM_LIFECYCLE] streamMatchesDesiredDetails: Final match result: ${finalMatch}`);
    return finalMatch;
  }, []);

  const performStreamAcquisition = useCallback(
    async (details: StreamDetails, abortSignal: AbortController['signal']) => {
      console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: ENTRY POINT. Details:', JSON.stringify(details), 'Redux Status:', status, 'Abort Signal Aborted (at entry):', abortSignal.aborted);

      if (abortSignal.aborted) {
        console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Aborted IMMEDIATELY upon entry before any API call.');
        return;
      }

      try {
        let acquiredStream: MediaStream | null = null;

        const constraints: MediaStreamConstraints = {
          video: details.videoSourceType === VideoSourceType.CAMERA ? (details.camDeviceId && details.camDeviceId !== "default-cam-item" ? { deviceId: details.camDeviceId } : true) : false,
          audio: details.micDeviceId ? { deviceId: details.micDeviceId } : true,
        };

        if (details.videoSourceType === VideoSourceType.SCREEN) {
          console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Calling navigator.mediaDevices.getDisplayMedia.');
          acquiredStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true, signal: abortSignal } as DisplayMediaStreamOptions);
          console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: navigator.mediaDevices.getDisplayMedia returned.', acquiredStream ? 'Stream ID: ' + acquiredStream.id : 'null');
          if (acquiredStream) {
            acquiredStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
              track.onended = () => {
                console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Screen share stream ended by user or system for stream:', acquiredStream?.id, '. Dispatching stopStream.');
                if (mediaStreamRef.current === acquiredStream) {
                  mediaStreamRef.current = null;
                  dispatch(stopStream());
                }
              };
            });
          }
        } else if (details.videoSourceType === VideoSourceType.CAMERA) {
          console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Calling navigator.mediaDevices.getUserMedia with constraints:', JSON.stringify(constraints));
          acquiredStream = await navigator.mediaDevices.getUserMedia({ ...constraints, signal: abortSignal } as MediaStreamConstraints);
          console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: navigator.mediaDevices.getUserMedia returned.', acquiredStream ? 'Stream ID: ' + acquiredStream.id : 'null');
          if (acquiredStream) {
            console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Acquired Camera Stream Details - ID:', acquiredStream.id, ', Active:', acquiredStream.active);
            acquiredStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
              track.onended = () => {
                console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Video track ended for stream:', acquiredStream?.id, '. Dispatching stopStream.');
                if (mediaStreamRef.current === acquiredStream) {
                  mediaStreamRef.current = null;
                  dispatch(stopStream());
                }
              };
            });
            acquiredStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
              track.onended = () => {
                console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Audio track ended for stream:', acquiredStream?.id, '. Dispatching stopStream.');
                if (mediaStreamRef.current === acquiredStream) {
                  mediaStreamRef.current = null;
                  dispatch(stopStream());
                }
              };
            });
          }
        }

        if (abortSignal.aborted) {
          console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Aborted AFTER getMediaStream but BEFORE processing.');
          if (acquiredStream) acquiredStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          return;
        }

        if (acquiredStream) {
          // 只有当获取到的流与最新的期望匹配时才更新 mediaStreamRef.current 和 Redux 状态
          // 移除竞态条件检查，由 useEffect 的 lastLaunchedDetailsRef 和 AbortController 处理
          // if (JSON.stringify(details) === JSON.stringify(lastRequestedDetails)) {
            // 如果有旧流，则停止它。这里的停止应由 useEffect 负责
            // if (mediaStreamRef.current) {
            //   mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            // }
            mediaStreamRef.current = acquiredStream;
            // 在这里不应用静音状态，因为静音现在由 useCameraMute Hook 处理
            console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Stream acquired. Dispatching streamAcquired. Stream ID:', acquiredStream.id);
            dispatch(streamAcquired({ details }));
          // } else {
          //   console.warn('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Acquired stream details do not match last requested (race condition). Stopping and ignoring.', details, lastRequestedDetails);
          //   acquiredStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          // }
        } else {
          console.warn('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: No stream acquired, user might have cancelled or permission denied implicitly.');
          dispatch(permissionDenied());
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Media stream acquisition aborted by signal. Ignoring error and not dispatching.');
          return; // It's a cancellation, not an error to report to Redux
        }
        console.error('[DEBUG_STREAM_LIFECYCLE] performStreamAcquisition: Failed to acquire media stream. Details:', error.name, error.message, error);
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

    console.log('[DEBUG_STREAM_LIFECYCLE] Main useEffect triggered. Desired:', JSON.stringify(desiredDetails), '. Current Ref Stream:', currentStream?.id, '. Redux Status:', status);

    const stopAndClearStream = (streamToStop: MediaStream | null) => {
      if (streamToStop) {
        console.log('[DEBUG_STREAM_LIFECYCLE] Stopping actual MediaStream:', streamToStop.id);
        streamToStop.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      mediaStreamRef.current = null;
    };

    // Scenario 1: No stream desired (lastRequestedDetails is null or videoSourceType is NONE)
    if (!desiredDetails || desiredDetails.videoSourceType === VideoSourceType.NONE) {
      if (currentStream) { // If there's an active physical stream, stop it
        console.log('[DEBUG_STREAM_LIFECYCLE] No stream desired. Stopping current physical stream.');
        stopAndClearStream(currentStream);
      }
      if (status !== StreamStatus.IDLE) { // If Redux state is not IDLE, dispatch stopStream
        console.log('[DEBUG_STREAM_LIFECYCLE] No stream desired, but Redux status not IDLE. Dispatching stopStream to reset Redux state.');
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
      console.log('[DEBUG_STREAM_LIFECYCLE] Current stream already matches desired intent AND Redux status is ACTIVE. Nothing to do for lifecycle.');
      // Reset last launched details since we are already active and matching
      lastLaunchedDetailsRef.current = desiredDetails;
      return; // Nothing more to do for stream lifecycle
    }

    // Scenario 3: Redux state is PENDING, and we need to manage the actual stream acquisition.
    if (status === StreamStatus.PENDING && desiredDetails) {
      const stringifiedDesired = JSON.stringify(desiredDetails);
      const stringifiedLastLaunched = JSON.stringify(lastLaunchedDetailsRef.current);

      if (stringifiedDesired !== stringifiedLastLaunched) {
        console.log('[DEBUG_STREAM_LIFECYCLE] Redux Status is PENDING and desiredDetails have changed or no acquisition launched yet. Aborting previous if any, and attempting to acquire new stream.');

        // Abort any existing acquisition (which would be for old desiredDetails or a previous PENDING state)
        if (currentAcquisitionAbortControllerRef.current) {
          console.log('[DEBUG_STREAM_LIFECYCLE] Aborting previous acquisition controller.');
          currentAcquisitionAbortControllerRef.current.abort();
        }

        const newAbortController = new AbortController();
        currentAcquisitionAbortControllerRef.current = newAbortController;
        performStreamAcquisition(desiredDetails, newAbortController.signal);
        lastLaunchedDetailsRef.current = desiredDetails; // Mark these details as "in-flight" for performStreamAcquisition
      } else {
        console.log('[DEBUG_STREAM_LIFECYCLE] Redux Status is PENDING and acquisition for these desiredDetails is already in progress. Waiting for resolution.');
      }
      return; // Regardless, if PENDING, we manage here and return.
    }

    // Scenario 4: Other states (IDLE, ERROR, PERMISSION_DENIED) or current physical stream doesn't match,
    // AND Redux state is NOT PENDING. We need to dispatch `requestStream` to initiate the PENDING state.
    if (status !== StreamStatus.PENDING) {
        console.log('[DEBUG_STREAM_LIFECYCLE] Redux status is not PENDING, but a stream is desired. Dispatching requestStream to initiate PENDING.');
        if (currentStream && !streamMatchesDesiredDetails(currentStream, desiredDetails)) {
            console.log('[DEBUG_STREAM_LIFECYCLE] Existing physical stream does not match desired intent. Stopping old stream before dispatching new request.');
            stopAndClearStream(currentStream);
        }
        // 显式过滤 desiredDetails，确保只包含 StreamDetails 中定义的属性
        const cleanedDesiredDetails: StreamDetails = {
          videoSourceType: desiredDetails.videoSourceType,
          ...(desiredDetails.camDeviceId && { camDeviceId: desiredDetails.camDeviceId }),
          ...(desiredDetails.micDeviceId && { micDeviceId: desiredDetails.micDeviceId }),
        };
        console.log('[DEBUG_STREAM_LIFECYCLE] Dispatching requestStream with CLEANED desiredDetails. Keys:', Object.keys(cleanedDesiredDetails || {}), '. Details:', cleanedDesiredDetails);
        dispatch(requestStream(cleanedDesiredDetails));
        return; // Request dispatched, now wait for Redux state to become PENDING
    }

    return () => {
      console.log('[DEBUG_STREAM_LIFECYCLE] Main useEffect cleanup function running for this instance.');
      // Abort any ongoing acquisition when the component unmounts or dependencies change significantly.
      if (currentAcquisitionAbortControllerRef.current) {
        console.log('[DEBUG_STREAM_LIFECYCLE] Aborting ongoing acquisition on cleanup.');
        currentAcquisitionAbortControllerRef.current.abort();
        currentAcquisitionAbortControllerRef.current = null;
      }
      // Stop the currently active physical stream when the hook instance is cleaned up.
      if (mediaStreamRef.current) {
        console.log('[DEBUG_STREAM_LIFECYCLE] Stopping physical MediaStream on cleanup (ID:', mediaStreamRef.current.id, ').');
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
