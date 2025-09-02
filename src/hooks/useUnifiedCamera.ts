import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  requestStream,
  setCameraMuted,
  setSelectedCamDeviceId,
  setVideoSourceType,
  StreamStatus,
  StreamDetails,
  MediaStreamState,
} from '@/store/reducers/mediaStream';
import { RootState } from '@/store';
import { useVideoFrameSender } from './useVideoFrameSender';
import { useWebSocketSession } from '@/hooks/useWebSocketSession';
import { VideoSourceType } from '@/common/constant';
import { useStreamLifecycle } from './useStreamLifecycle'; // 导入新的流生命周期Hook
import { useCameraMute } from './useCameraMute'; // 导入新的摄像头静音Hook

interface UseUnifiedCameraOptions {
  enableVideoSending?: boolean;
  videoSenderIntervalMs?: number;
}

export const useUnifiedCamera = (options?: UseUnifiedCameraOptions) => {
  const { enableVideoSending = true, videoSenderIntervalMs } = options || {};
  const dispatch = useDispatch();
  console.log("[DEBUG_SCREEN_SHARE] useUnifiedCamera hook called.");

  const { defaultLocation } = useWebSocketSession();

  const { isCameraMuted, lastRequestedDetails, status } = useSelector((state: RootState) => state.mediaStream);

  // 使用新的 useStreamLifecycle Hook 管理流的生命周期
  const { stream, getMediaStreamInstance, streamError } = useStreamLifecycle();

  // 使用新的 useCameraMute Hook 管理摄像头静音属性
  useCameraMute({ getMediaStreamInstance });

  // 用户交互回调 (dispatch intent 或属性)
  const toggleCameraMute = useCallback(
    () => {
      console.log('[DEBUG_SCREEN_SHARE] toggleCameraMute called. Current isCameraMuted: {}', isCameraMuted);
      dispatch(setCameraMuted(!isCameraMuted)); // 直接派发 setCameraMuted action
    },
    [dispatch, isCameraMuted],
  );

  const changeCameraDevice = useCallback((deviceId: string) => {
    console.log('[DEBUG_SCREEN_SHARE] changeCameraDevice called with deviceId: {}', deviceId);
    // 确保只传递 StreamDetails 中定义的属性
    const currentDetails: StreamDetails = {
      videoSourceType: lastRequestedDetails?.videoSourceType || VideoSourceType.CAMERA,
      camDeviceId: deviceId,
      micDeviceId: lastRequestedDetails?.micDeviceId,
    };
    dispatch(requestStream(currentDetails));
  }, [dispatch, lastRequestedDetails]);

  const changeVideoSourceType = useCallback((type: VideoSourceType) => {
    console.log('[DEBUG_SCREEN_SHARE] changeVideoSourceType called with type: {}', type);
    // 确保只传递 StreamDetails 中定义的属性
    const currentDetails: StreamDetails = {
      videoSourceType: type,
      camDeviceId: type === VideoSourceType.SCREEN ? undefined : lastRequestedDetails?.camDeviceId,
      micDeviceId: lastRequestedDetails?.micDeviceId,
    };
    dispatch(requestStream(currentDetails));
  }, [dispatch, lastRequestedDetails]);

  const { videoRef, canvasRef } = useVideoFrameSender({
    getMediaStreamInstance: getMediaStreamInstance,
    srcLoc: defaultLocation,
    destLocs: [defaultLocation],
    intervalMs: videoSenderIntervalMs,
  });
  console.log("[DEBUG_SCREEN_SHARE] useVideoFrameSender returned. videoRef.current:", videoRef.current, "canvasRef.current:", canvasRef.current);

  return {
    isCameraMuted: isCameraMuted, // 直接从 Redux 获取独立的 isCameraMuted
    selectedCamDeviceId: lastRequestedDetails?.camDeviceId, // 从 lastRequestedDetails 获取
    currentVideoSourceType: lastRequestedDetails?.videoSourceType ?? VideoSourceType.CAMERA, // 从 lastRequestedDetails 获取
    toggleCameraMute,
    changeCameraDevice,
    changeVideoSourceType,
    streamStatus: status, // 直接从 Redux 获取流状态
    stream: stream, // 从 useStreamLifecycle 获取
    streamError: streamError, // 从 useStreamLifecycle 获取错误信息
    isStreamCurrentlyActive: status === StreamStatus.ACTIVE_CAMERA || status === StreamStatus.ACTIVE_SCREEN,
    getMediaStreamInstance,
    videoRef,
    canvasRef,
  };
};
