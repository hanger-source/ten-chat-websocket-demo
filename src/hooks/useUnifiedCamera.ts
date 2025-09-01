import { useEffect, useState, useCallback, useRef } from 'react';
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
import { debounce } from '@/common/utils'; // 导入 debounce
import { createSelector } from 'reselect'; // 导入 createSelector
import { RootState } from '@/store'; // 导入 RootState

// 移除模块级别标志 isDisplayMediaActiveCall

interface UseUnifiedCameraOptions {
  enableVideoSending?: boolean;
  videoSenderIntervalMs?: number;
}

// 定义复合选择器 (移到 Hook 函数外部)
const selectUnifiedVideoSettings = createSelector(
  (state: RootState) => state.global.currentVideoSourceType,
  (state: RootState) => state.global.selectedCamDeviceId,
  (sourceType, deviceId) => ({
    sourceType: sourceType,
    deviceId: deviceId,
  })
);

export const useUnifiedCamera = (options?: UseUnifiedCameraOptions) => {
  const { enableVideoSending = true, videoSenderIntervalMs } = options || {};
  const dispatch = useDispatch();
  const isCameraMuted = useSelector(selectIsCameraMuted);

  // 使用复合选择器获取状态
  const { sourceType: currentVideoSourceType, deviceId: selectedCamDeviceId } = useSelector(selectUnifiedVideoSettings);

  const { defaultLocation } = useWebSocketSession();

  const streamRef = useRef<MediaStream | null>(null); // useRef to hold the MediaStream instance
  const [isStreamCurrentlyActive, setIsStreamCurrentlyActive] = useState(false); // New useState for UI rendering signal
  const lastRequestedStreamDetailsRef = useRef<{ deviceId: string | undefined; sourceType: VideoSourceType } | null>(null); // Store last requested stream details
  const currentEffectAbortControllerRef = useRef<AbortController | null>(null); // 局部 ref，用于跟踪当前 useEffect 实例的 AbortController

  useEffect(() => {
    currentEffectAbortControllerRef.current?.abort(); // Abort any previous effect's pending requests

    const abortController = new AbortController(); // 为每个 useEffect 实例创建 AbortController
    const signal = abortController.signal;
    console.log(`[DEBUG] useEffect triggered. currentVideoSourceType: ${currentVideoSourceType}, selectedCamDeviceId: ${selectedCamDeviceId}`);

    const getStream = async () => {
      let stream: MediaStream | null = null;

      // 延迟清理旧流，直到新流成功获取或确定获取失败
      const previousStream = streamRef.current;

      // 避免重复请求相同的流
      const detailsMatch = lastRequestedStreamDetailsRef.current &&
                           lastRequestedStreamDetailsRef.current.deviceId === selectedCamDeviceId &&
                           lastRequestedStreamDetailsRef.current.sourceType === currentVideoSourceType;
      
      if (previousStream && detailsMatch) {
        console.log("[DEBUG] Stream details match previous, returning existing stream.");
        return;
      }

      try {
        if (currentVideoSourceType === VideoSourceType.CAMERA) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: selectedCamDeviceId && selectedCamDeviceId !== "default-cam-item" ? { deviceId: selectedCamDeviceId } : true,
            // signal 不直接支持，改为在获取后检查
          }) as MediaStream;
        } else if (currentVideoSourceType === VideoSourceType.SCREEN) {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            // signal 不直接支持，改为在获取后检查
          }) as MediaStream;
          if (stream) {
            stream.getVideoTracks().forEach(track => {
              track.onended = () => {
                console.log("[DEBUG] Screen share stream ended by user.");
                if (streamRef.current === stream) {
                  streamRef.current?.getTracks().forEach(t => t.stop());
                  streamRef.current = null; // 清理引用
                  setIsStreamCurrentlyActive(false); // 更新 UI 信号
                  lastRequestedStreamDetailsRef.current = null;
                }
              };
            });
          }
        }

        // 在获取到流之后，立即检查是否已经中止
        if (signal.aborted) {
          console.warn("[DEBUG] Media stream acquisition was aborted during getStream. Stopping stream if acquired.");
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          return; // 提前返回
        }

        // 如果成功获取到新流，清理旧流并设置新流
        if (stream) {
          if (previousStream && previousStream !== stream) {
            console.log("[DEBUG] Stopping previous stream tracks.");
            previousStream.getTracks().forEach(track => track.stop());
          }
          const mediaStream = stream as MediaStream;
          mediaStream.getVideoTracks().forEach(track => (track.enabled = !isCameraMuted));
          streamRef.current = mediaStream; // 更新 streamRef
          setIsStreamCurrentlyActive(true); // 更新 UI 信号
          lastRequestedStreamDetailsRef.current = { deviceId: selectedCamDeviceId, sourceType: currentVideoSourceType };
          console.log(`[DEBUG] Stream acquired and set to localStream. ID: ${mediaStream.id}`);
        } else {
          // 如果未获取到流（例如用户取消），则清理并设置 null
          if (previousStream) {
            console.log("[DEBUG] Stopping previous stream tracks due to no new stream.");
            previousStream.getTracks().forEach(track => track.stop());
          }
          streamRef.current = null; // 更新 streamRef
          setIsStreamCurrentlyActive(false); // 更新 UI 信号
          lastRequestedStreamDetailsRef.current = null;
          console.log("[DEBUG] Stream not acquired, localStream set to null.");
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn("[DEBUG] Media stream acquisition aborted.");
          // 如果是被 AbortController 中止，不进行错误清理，因为新的 useEffect 正在处理
        } else {
          console.error("[DEBUG] 获取媒体流失败:", error);
          if (previousStream) {
            console.log("[DEBUG] Stopping previous stream tracks due to acquisition error.");
            previousStream.getTracks().forEach(track => track.stop());
          }
          streamRef.current = null; // 更新 streamRef
          setIsStreamCurrentlyActive(false); // 更新 UI 信号
          lastRequestedStreamDetailsRef.current = null;
        }
      } finally {
        // 移除 isDisplayMediaActiveCall 相关的日志
        const acquiredStreamId = stream ? stream.id : 'null';
        console.log(`[DEBUG] getStream finished. acquiredStreamId: ${acquiredStreamId}, streamRefValue: ${streamRef.current ? streamRef.current.id : 'null'}`);
      }
    };

    getStream();

    return () => {
      console.log("[DEBUG] useEffect cleanup: Aborting any pending media stream requests.");
      abortController.abort(); // 清理时中止任何正在进行的请求
      // 在清理时停止由当前 useEffect 实例管理的流，如果它仍然存在且未被新的流替换
      // 记录当前 AbortController，以便在下次 useEffect 触发时中止它
      currentEffectAbortControllerRef.current = abortController;

      // 在清理时停止由当前 useEffect 实例管理的流，如果它仍然存在且未被新的流替换
      if (streamRef.current && currentEffectAbortControllerRef.current === abortController) {
        console.log("[DEBUG] useEffect cleanup: Stopping current stream tracks.");
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null; // 清理引用
        setIsStreamCurrentlyActive(false); // 更新 UI 信号
      }
      currentEffectAbortControllerRef.current = null;
      lastRequestedStreamDetailsRef.current = null;
      // 移除 isDisplayMediaActiveCall 的清理
    };
  }, [selectedCamDeviceId, currentVideoSourceType, dispatch]);

  // Effect to handle muting/unmuting tracks
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isCameraMuted;
      });
    }
  }, [isCameraMuted, streamRef.current]); 

  const getMediaStreamInstance = useCallback(() => streamRef.current, []); // 返回 streamRef.current

  const { videoRef, canvasRef } = useVideoFrameSender({
    getMediaStreamInstance: getMediaStreamInstance, // 将返回 streamRef.current 的函数传递给 useVideoFrameSender
    srcLoc: defaultLocation,
    destLocs: [defaultLocation],
    intervalMs: videoSenderIntervalMs,
  });

  const toggleCameraMute = useCallback(() => {
    dispatch(setCameraMuted(!isCameraMuted));
  }, [dispatch, isCameraMuted]);

  const changeCameraDevice = useCallback((deviceId: string) => {
    dispatch(setSelectedCamDeviceId(deviceId));
  }, [dispatch]);

  const changeVideoSourceType = useCallback((type: VideoSourceType) => {
    dispatch(setVideoSourceType(type));
  }, [dispatch]);

  return {
    isCameraMuted,
    selectedCamDeviceId,
    currentVideoSourceType,
    toggleCameraMute,
    changeCameraDevice,
    changeVideoSourceType,
    isStreamCurrentlyActive, // 返回 UI 渲染信号
    stream: streamRef.current, // 直接返回 streamRef.current
    getMediaStreamInstance, // 依然返回函数，但其内部返回 streamRef.current
    videoRef, // Expose videoRef
    canvasRef, // Expose canvasRef
  };
};
