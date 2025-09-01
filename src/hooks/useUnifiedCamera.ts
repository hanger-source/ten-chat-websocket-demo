import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCameraMuted,
  setSelectedCamDeviceId,
  setVideoSourceType,
  selectIsCameraMuted, // Corrected selector name
  selectSelectedCamDeviceId,
  selectVideoSourceType,
} from '@/store/reducers/global';
import { useVideoFrameSender } from './useVideoFrameSender';
import { useWebSocketSession } from '@/hooks/useWebSocketSession';
import { VideoSourceType } from '@/common/constant';

let isDisplayMediaActiveCall = false; // 模块级别标志

interface UseUnifiedCameraOptions {
  enableVideoSending?: boolean;
  videoSenderIntervalMs?: number;
}

export const useUnifiedCamera = (options?: UseUnifiedCameraOptions) => {
  const { enableVideoSending = true, videoSenderIntervalMs } = options || {};
  const dispatch = useDispatch();
  const isCameraMuted = useSelector(selectIsCameraMuted);
  const selectedCamDeviceId = useSelector(selectSelectedCamDeviceId);
  const currentVideoSourceType = useSelector(selectVideoSourceType);
  const { defaultLocation } = useWebSocketSession();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null); // Use useState for the actual MediaStream instance
  const lastRequestedStreamDetailsRef = useRef<{ deviceId: string | undefined; sourceType: VideoSourceType } | null>(null); // Store last requested stream details
  const activeScreenStreamRef = useRef<MediaStream | null>(null); // Track the active screen share stream
  const localStreamRefForCurrentValue = useRef<MediaStream | null>(null); // New useRef to track the current value of localStream
  const currentEffectStreamRef = useRef<MediaStream | null>(null); // 局部 ref，用于跟踪当前 useEffect 实例所管理的流

  useEffect(() => {
    localStreamRefForCurrentValue.current = localStream;
  }, [localStream]);

  useEffect(() => {
    console.log(`[DEBUG] useEffect triggered. currentVideoSourceType: ${currentVideoSourceType}, selectedCamDeviceId: ${selectedCamDeviceId}`);

    const getStream = async () => {
      let stream: MediaStream | null = null; // 将 stream 变量的定义移到此处，使其在整个函数中可用

      const currentStreamExists = localStreamRefForCurrentValue.current !== null;
      const detailsMatch = lastRequestedStreamDetailsRef.current &&
                           lastRequestedStreamDetailsRef.current.deviceId === selectedCamDeviceId &&
                           lastRequestedStreamDetailsRef.current.sourceType === currentVideoSourceType;

      if (currentStreamExists && detailsMatch) {
        return;
      }

      if (localStreamRefForCurrentValue.current) {
        localStreamRefForCurrentValue.current.getTracks().forEach(track => {
          track.stop();
        });
        setLocalStream(null);
        lastRequestedStreamDetailsRef.current = null;
      }

      try {
        if (currentVideoSourceType === VideoSourceType.CAMERA) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: selectedCamDeviceId && selectedCamDeviceId !== "default-cam-item" ? { deviceId: selectedCamDeviceId } : true,
          }) as MediaStream;
        } else if (currentVideoSourceType === VideoSourceType.SCREEN) {
          if (isDisplayMediaActiveCall) {
            return; 
          }
          isDisplayMediaActiveCall = true; 
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true }) as MediaStream;
          if (stream) {
            stream.getVideoTracks().forEach(track => {
              track.onended = () => {
                if (localStreamRefForCurrentValue.current === stream) { // 使用 localStreamRefForCurrentValue.current 进行比较
                  localStreamRefForCurrentValue.current?.getTracks().forEach(t => t.stop()); // 停止所有轨道
                  setLocalStream(null);
                  lastRequestedStreamDetailsRef.current = null;
                }
              };
            });
          }
        }

        if (stream) {
          const mediaStream = stream as MediaStream;
          mediaStream.getVideoTracks().forEach(track => (track.enabled = !isCameraMuted));
          setLocalStream(mediaStream); // 更新 localStream 状态
          currentEffectStreamRef.current = mediaStream; // 记录当前效果负责的流
          localStreamRefForCurrentValue.current = mediaStream; // 同步更新 useRef
          lastRequestedStreamDetailsRef.current = { deviceId: selectedCamDeviceId, sourceType: currentVideoSourceType };
          console.log(`[DEBUG] Stream acquired and set to localStream. ID: ${mediaStream.id}`);
        } else {
          setLocalStream(null);
          localStreamRefForCurrentValue.current = null; // 同步更新 useRef
          lastRequestedStreamDetailsRef.current = null;
        }
      } catch (error) {
        console.error("[DEBUG] 获取媒体流失败:", error);
        setLocalStream(null);
        localStreamRefForCurrentValue.current = null; // 同步更新 useRef
        lastRequestedStreamDetailsRef.current = null;
      } finally {
        isDisplayMediaActiveCall = false; 
        const acquiredStreamId = stream ? stream.id : 'null'; 
        console.log(`[DEBUG] getStream finished. isDisplayMediaActiveCall: ${isDisplayMediaActiveCall}, acquiredStreamId: ${acquiredStreamId}, localStreamRefValue: ${localStreamRefForCurrentValue.current ? localStreamRefForCurrentValue.current.id : 'null'}`);
      }
    };

    getStream();

    return () => {
      // 只有当这个效果实例负责的流，仍然是当前全局活跃的流时，才执行清理
      if (currentEffectStreamRef.current && currentEffectStreamRef.current === localStreamRefForCurrentValue.current) {
        currentEffectStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        setLocalStream(null);
      }
      lastRequestedStreamDetailsRef.current = null; 
      if (isDisplayMediaActiveCall && currentVideoSourceType === VideoSourceType.SCREEN) {
        isDisplayMediaActiveCall = false; 
      }
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
