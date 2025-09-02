import { useEffect, useCallback, useRef, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCameraMuted,
  setSelectedCamDeviceId,
  setVideoSourceType,
  selectIsCameraMuted, // Corrected selector name
} from '@/store/reducers/global';
import { useVideoFrameSender } from './useVideoFrameSender';
import { useWebSocketSession } from '@/hooks/useWebSocketSession';
import { VideoSourceType } from '@/common/constant';
import { createSelector } from 'reselect'; // 导入 createSelector
import { RootState } from '@/store'; // 导入 RootState
import { StreamStatus, MediaStreamState, MediaStreamAction, StreamDetails } from './types';
import { initialMediaStreamState, mediaStreamReducer } from './reducer';
import { Location } from '@/types/message'; // 导入 Location 类型

interface UseUnifiedCameraOptions {
  enableVideoSending?: boolean;
  videoSenderIntervalMs?: number;
}

export const useUnifiedCamera = (options?: UseUnifiedCameraOptions) => {
  const { enableVideoSending = true, videoSenderIntervalMs } = options || {};
  const dispatch = useDispatch();

  const { defaultLocation } = useWebSocketSession(); // 解构 activeAppUri 和 activeGraphId

  const currentEffectAbortControllerRef = useRef<AbortController | null>(null); // 局部 ref，用于跟踪当前 useEffect 实例的 AbortController

  const [state, dispatchMediaStream] = useReducer(mediaStreamReducer, initialMediaStreamState);

  const performStreamAcquisition = useCallback(async (details: StreamDetails, abortSignal: AbortController['signal']) => {
    console.log("[DEBUG] Attempting to acquire stream with details:", details);
    let stream: MediaStream | null = null;
    try {
      if (details.videoSourceType === VideoSourceType.CAMERA) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: details.camDeviceId && details.camDeviceId !== "default-cam-item" ? { deviceId: details.camDeviceId } : true,
        });
      } else if (details.videoSourceType === VideoSourceType.SCREEN) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        if (stream) {
          stream.getVideoTracks().forEach(track => {
            track.onended = () => {
              console.log("[DEBUG] Screen share stream ended by user.");
              dispatchMediaStream({ type: 'STOP_STREAM' });
            };
          });
        }
      }

      if (abortSignal.aborted) {
        console.warn("[DEBUG] Media stream acquisition was aborted during getStream. Stopping stream if acquired.");
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        return;
      }

      if (stream) {
        // Only dispatch if the request details still match what was last requested by the state machine
        // This is a crucial check against race conditions if multiple requests were in flight
        // The reducer also has a check, but this provides an earlier exit
        if (JSON.stringify(details) === JSON.stringify(state.lastRequestedDetails)) {
          stream.getVideoTracks().forEach(track => (track.enabled = !details.isCameraMuted));
          dispatchMediaStream({ type: 'STREAM_ACQUIRED', payload: { stream, details } });
        } else {
          console.warn("[DEBUG] Acquired stream details do not match last requested. Stopping and ignoring.", details, state.lastRequestedDetails);
          stream.getTracks().forEach(track => track.stop());
        }
      } else {
        // User cancelled screen share or camera permission denied implicitly
        dispatchMediaStream({ type: 'PERMISSION_DENIED' }); // Treat as permission denied if no stream and not an explicit error
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn("[DEBUG] Media stream acquisition aborted.");
        // No need to dispatch error, state machine handles the transition based on the next valid state
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        dispatchMediaStream({ type: 'PERMISSION_DENIED' });
      } else {
        console.error("[DEBUG] 获取媒体流失败:", error);
        dispatchMediaStream({ type: 'STREAM_ERROR', payload: { error: error.message } });
      }
    }
  }, [dispatchMediaStream, state.lastRequestedDetails]);

  useEffect(() => {
    currentEffectAbortControllerRef.current?.abort(); // Abort any previous effect's pending requests

    const abortController = new AbortController(); // 为每个 useEffect 实例创建 AbortController
    const signal = abortController.signal;
    const { videoSourceType: currentVideoSourceTypeState, camDeviceId: selectedCamDeviceIdState, isCameraMuted: isCameraMutedState } = state.lastRequestedDetails || { videoSourceType: VideoSourceType.CAMERA, camDeviceId: undefined, isCameraMuted: false, isMicrophoneMuted: false };
    console.log(`[DEBUG] useEffect triggered. currentVideoSourceType: ${currentVideoSourceTypeState}, selectedCamDeviceId: ${selectedCamDeviceIdState}`);

    // Dispatch initial request to the state machine
    // 只有当状态发生变化时才 dispatch REQUEST_STREAM，避免无限循环
    const currentRequestedDetails = state.lastRequestedDetails || { videoSourceType: VideoSourceType.CAMERA, camDeviceId: undefined, isCameraMuted: false, isMicrophoneMuted: false };
    const newRequestedDetails: StreamDetails = {
      videoSourceType: currentVideoSourceTypeState,
      camDeviceId: selectedCamDeviceIdState,
      micDeviceId: undefined, // Microphone is handled separately, or can be added to details if unified
      isCameraMuted: isCameraMutedState,
      isMicrophoneMuted: false, // Assuming mic mute is not part of this stream request initially
    };

    if (state.status === StreamStatus.IDLE || JSON.stringify(newRequestedDetails) !== JSON.stringify(currentRequestedDetails)) {
      dispatchMediaStream({ type: 'REQUEST_STREAM', payload: newRequestedDetails });
    }

    // Effect will react to PENDING state to perform actual acquisition
    if (state.status === StreamStatus.PENDING && state.lastRequestedDetails) {
      performStreamAcquisition(state.lastRequestedDetails, signal);
    }

    return () => {
      console.log("[DEBUG] useEffect cleanup: Aborting any pending media stream requests.");
      abortController.abort(); // 清理时中止任何正在进行的请求
      currentEffectAbortControllerRef.current = null; // 在清理时清除 ref，避免内存泄漏

      // 在清理时，如果当前流是由此 useEffect 实例发起的，则停止它
      if (state.stream && currentEffectAbortControllerRef.current === abortController) {
        console.log("[DEBUG] useEffect cleanup: Stopping current stream tracks via RESET_STATE.");
        dispatchMediaStream({ type: 'RESET_STATE' }); // Use RESET_STATE for full cleanup
      }
    };
  }, [dispatch, dispatchMediaStream, state.status, state.lastRequestedDetails, performStreamAcquisition]);

  // Effect to handle muting/unmuting tracks
  useEffect(() => {
    if (state.stream) {
      state.stream.getVideoTracks().forEach(track => {
        track.enabled = !(state.lastRequestedDetails?.isCameraMuted ?? false);
      });
    }
  }, [state.stream, state.lastRequestedDetails?.isCameraMuted]);

  // Effect to synchronize useReducer state to Redux global state
  useEffect(() => {
    if (state.lastRequestedDetails) {
      dispatch(setCameraMuted(state.lastRequestedDetails.isCameraMuted));
      dispatch(setSelectedCamDeviceId(state.lastRequestedDetails.camDeviceId || "")); // Ensure deviceId is string
      dispatch(setVideoSourceType(state.lastRequestedDetails.videoSourceType));
    }
  }, [dispatch, state.lastRequestedDetails]);

  const getMediaStreamInstance = useCallback(() => state.stream, [state.stream]);

  const { videoRef, canvasRef } = useVideoFrameSender({
    getMediaStreamInstance: getMediaStreamInstance,
    srcLoc: defaultLocation, // 传递 defaultLocation 字符串
    destLocs: [defaultLocation], // 传递 defaultLocation 字符串数组
    intervalMs: videoSenderIntervalMs,
  });

  const toggleCameraMute = useCallback(() => {
    const currentDetails = state.lastRequestedDetails || { videoSourceType: VideoSourceType.CAMERA, isCameraMuted: false, isMicrophoneMuted: false };
    dispatchMediaStream({
      type: 'REQUEST_STREAM',
      payload: { ...currentDetails, isCameraMuted: !currentDetails.isCameraMuted },
    });
  }, [dispatchMediaStream, state.lastRequestedDetails]);

  const changeCameraDevice = useCallback((deviceId: string) => {
    const currentDetails = state.lastRequestedDetails || { videoSourceType: VideoSourceType.CAMERA, isCameraMuted: false, isMicrophoneMuted: false };
    dispatchMediaStream({
      type: 'REQUEST_STREAM',
      payload: { ...currentDetails, camDeviceId: deviceId, videoSourceType: VideoSourceType.CAMERA },
    });
  }, [dispatchMediaStream, state.lastRequestedDetails]);

  const changeVideoSourceType = useCallback((type: VideoSourceType) => {
    const currentDetails = state.lastRequestedDetails || { videoSourceType: VideoSourceType.CAMERA, isCameraMuted: false, isMicrophoneMuted: false };
    dispatchMediaStream({
      type: 'REQUEST_STREAM',
      payload: { ...currentDetails, videoSourceType: type, camDeviceId: type === VideoSourceType.SCREEN ? undefined : currentDetails.camDeviceId },
    });
  }, [dispatchMediaStream, state.lastRequestedDetails]);

  return {
    isCameraMuted: state.lastRequestedDetails?.isCameraMuted ?? false, // 从状态机获取静音状态
    selectedCamDeviceId: state.lastRequestedDetails?.camDeviceId,
    currentVideoSourceType: state.lastRequestedDetails?.videoSourceType ?? VideoSourceType.CAMERA, // 替换 VideoSourceType.NONE 为 VideoSourceType.CAMERA
    toggleCameraMute,
    changeCameraDevice,
    changeVideoSourceType,
    streamStatus: state.status,
    stream: state.stream,
    streamError: state.error,
    isStreamCurrentlyActive: state.status === StreamStatus.ACTIVE_CAMERA || state.status === StreamStatus.ACTIVE_SCREEN,
    getMediaStreamInstance,
    videoRef,
    canvasRef,
  };
};
