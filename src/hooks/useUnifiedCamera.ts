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

  const [localStream, setLocalStream] = useState<MediaStream | null>(null); // Use useState for the actual MediaStream instance
  const lastRequestedStreamDetailsRef = useRef<{ deviceId: string | undefined; sourceType: VideoSourceType } | null>(null); // Store last requested stream details
  const localStreamRefForCurrentValue = useRef<MediaStream | null>(null); // New useRef to track the current value of localStream
  const currentEffectStreamRef = useRef<MediaStream | null>(null); // 局部 ref，用于跟踪当前 useEffect 实例所管理的流
  const debouncedGetStreamRef = useRef<(() => Promise<void>) | null>(null); // 用于存储防抖后的 getStreamInternal 函数

  useEffect(() => {
    localStreamRefForCurrentValue.current = localStream;
  }, [localStream]);

  useEffect(() => {
    const abortController = new AbortController(); // 为每个 useEffect 实例创建 AbortController
    const signal = abortController.signal;
    console.log(`[DEBUG] useEffect triggered. currentVideoSourceType: ${currentVideoSourceType}, selectedCamDeviceId: ${selectedCamDeviceId}`);

    const getStream = async () => {
      let stream: MediaStream | null = null;

      // 延迟清理旧流，直到新流成功获取或确定获取失败
      const previousStream = localStreamRefForCurrentValue.current;

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
                if (localStreamRefForCurrentValue.current === stream) {
                  localStreamRefForCurrentValue.current?.getTracks().forEach(t => t.stop());
                  setLocalStream(null);
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
          setLocalStream(mediaStream); // 更新 localStream 状态
          currentEffectStreamRef.current = mediaStream; // 记录当前效果负责的流
          localStreamRefForCurrentValue.current = mediaStream; // 同步更新 useRef
          lastRequestedStreamDetailsRef.current = { deviceId: selectedCamDeviceId, sourceType: currentVideoSourceType };
          console.log(`[DEBUG] Stream acquired and set to localStream. ID: ${mediaStream.id}`);
        } else {
          // 如果未获取到流（例如用户取消），则清理并设置 null
          if (previousStream) {
            console.log("[DEBUG] Stopping previous stream tracks due to no new stream.");
            previousStream.getTracks().forEach(track => track.stop());
          }
          setLocalStream(null);
          localStreamRefForCurrentValue.current = null;
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
          setLocalStream(null);
          localStreamRefForCurrentValue.current = null;
          lastRequestedStreamDetailsRef.current = null;
        }
      } finally {
        // 移除 isDisplayMediaActiveCall 相关的日志
        const acquiredStreamId = stream ? stream.id : 'null';
        console.log(`[DEBUG] getStream finished. acquiredStreamId: ${acquiredStreamId}, localStreamRefValue: ${localStreamRefForCurrentValue.current ? localStreamRefForCurrentValue.current.id : 'null'}`);
      }
    };

    getStream();

    return () => {
      console.log("[DEBUG] useEffect cleanup: Aborting any pending media stream requests.");
      abortController.abort(); // 清理时中止任何正在进行的请求

      // 只有当这个效果实例负责的流，仍然是当前全局活跃的流时，才执行清理
      // 并且只有当新的 useEffect 没有成功设置流时才清理。
      // 在这里不再执行 setLocalStream(null)，避免瞬时闪烁
      if (currentEffectStreamRef.current && currentEffectStreamRef.current === localStreamRefForCurrentValue.current) {
        console.log("[DEBUG] useEffect cleanup: Stopping current stream tracks.");
        currentEffectStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        // setLocalStream(null); // 不在此处设置 null，等待新流的设置或错误处理
      }
      lastRequestedStreamDetailsRef.current = null;
      // 移除 isDisplayMediaActiveCall 的清理
    };
  }, [selectedCamDeviceId, currentVideoSourceType, dispatch]);

  // Effect to handle muting/unmuting tracks
  useEffect(() => {
    if (localStreamRefForCurrentValue.current) { // 使用 localStreamRefForCurrentValue.current
      localStreamRefForCurrentValue.current.getVideoTracks().forEach(track => {
        track.enabled = !isCameraMuted;
      });
    }
  }, [isCameraMuted, localStreamRefForCurrentValue.current]); 

  const getMediaStreamInstance = useCallback(() => localStream, [localStream]); // 重新引入 getMediaStreamInstance，并直接返回 localStream

  const { videoRef, canvasRef } = useVideoFrameSender({
    getMediaStreamInstance: getMediaStreamInstance, // 将 getMediaStreamInstance 函数本身传递给 useVideoFrameSender
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

  // 计算 hasActiveStream
  const hasActiveStream = !!localStreamRefForCurrentValue.current &&
                          localStreamRefForCurrentValue.current.active &&
                          localStreamRefForCurrentValue.current.getVideoTracks().some(track => track.readyState === 'live' && track.enabled);

  return {
    hasActiveStream, // 返回计算属性
    isCameraMuted,
    selectedCamDeviceId,
    currentVideoSourceType,
    toggleCameraMute,
    changeCameraDevice,
    changeVideoSourceType,
    localStream, // 直接返回 localStream
    getMediaStreamInstance, // 返回 getMediaStreamInstance 函数
    videoRef, // Expose videoRef
    canvasRef, // Expose canvasRef
  };
};
