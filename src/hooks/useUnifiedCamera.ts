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

  const [hasActiveStream, setHasActiveStream] = useState<boolean>(false); // Changed to boolean state
  const localStreamRef = useRef<MediaStream | null>(null); // Use useRef for the actual MediaStream instance
  const lastRequestedStreamDetailsRef = useRef<{ deviceId: string | undefined; sourceType: VideoSourceType } | null>(null); // Store last requested stream details

  useEffect(() => {
    const getStream = async () => {
      const currentStreamExists = localStreamRef.current !== null;
      const detailsMatch = lastRequestedStreamDetailsRef.current &&
                           lastRequestedStreamDetailsRef.current.deviceId === selectedCamDeviceId &&
                           lastRequestedStreamDetailsRef.current.sourceType === currentVideoSourceType;

      if (currentStreamExists && detailsMatch) {
        if (!hasActiveStream) {
          setHasActiveStream(true);
        }
        return;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        localStreamRef.current = null;
        lastRequestedStreamDetailsRef.current = null;
        setHasActiveStream(false); // Set to false immediately on cleanup
      }

      try {
        let stream: MediaStream | null = null;
        if (currentVideoSourceType === VideoSourceType.CAMERA) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: selectedCamDeviceId && selectedCamDeviceId !== "default-cam-item" ? { deviceId: selectedCamDeviceId } : true,
          }) as MediaStream;
        } else if (currentVideoSourceType === VideoSourceType.SCREEN) {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true }) as MediaStream;
        }

        if (stream) {
          const mediaStream = stream as MediaStream;
          // @ts-ignore: Property 'id' does not exist on type 'never'. This is a known TS issue with complex control flow.
          const newStreamId = mediaStream.id;

          // @ts-ignore: Property 'id' does not exist on type 'never'.
          if (localStreamRef.current !== null && localStreamRef.current.id === newStreamId) {
            stream.getTracks().forEach(track => track.stop()); // Stop the redundant new stream
            return;
          }

          mediaStream.getVideoTracks().forEach(track => (track.enabled = !isCameraMuted));
          localStreamRef.current = mediaStream;
          setHasActiveStream(true); // Notify consumers that an active stream is present
          lastRequestedStreamDetailsRef.current = { deviceId: selectedCamDeviceId, sourceType: currentVideoSourceType };
        } else {
          localStreamRef.current = null;
          lastRequestedStreamDetailsRef.current = null;
          setHasActiveStream(false); // If no stream is acquired, ensure hasActiveStream is false
        }
      } catch (error) {
        console.error("[VIDEO_LOG] 获取媒体流失败:", error);
        localStreamRef.current = null;
        lastRequestedStreamDetailsRef.current = null;
        setHasActiveStream(false); // On error, ensure hasActiveStream is false
      }
    };

    getStream();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        localStreamRef.current = null;
      }
      lastRequestedStreamDetailsRef.current = null; // Clear details on cleanup
      setHasActiveStream(false); // Ensure hasActiveStream is false on cleanup
    };
  }, [selectedCamDeviceId, currentVideoSourceType, dispatch]); // Removed isCameraMuted from dependencies as mute/unmute is handled in a separate effect

  // Effect to handle muting/unmuting tracks
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isCameraMuted;
      });
      const anyTrackEnabledAndLive = localStreamRef.current.getVideoTracks().some(track => track.readyState === 'live' && track.enabled);
      if (anyTrackEnabledAndLive !== hasActiveStream) {
        setHasActiveStream(anyTrackEnabledAndLive); // Sync hasActiveStream with actual track status
      }
    } else {
      if (hasActiveStream) {
        setHasActiveStream(false);
      }
    }
  }, [isCameraMuted]); // Removed hasActiveStream from dependencies here to prevent loops and ensure main useEffect drives primary state

  const getMediaStreamInstance = useCallback(() => {
    const currentStream = localStreamRef.current;
    if (!currentStream) {
      return null;
    }
    const hasLiveAndEnabledVideoTrack = currentStream.getVideoTracks().some(track => track.readyState === 'live' && track.enabled);
    if (!hasLiveAndEnabledVideoTrack) {
      return null;
    }
    return currentStream;
  }, []);

  const { videoRef, canvasRef } = useVideoFrameSender({
    getMediaStreamInstance: getMediaStreamInstance, // Pass the function itself
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
    hasActiveStream, // Return the boolean state
    isCameraMuted,
    selectedCamDeviceId,
    currentVideoSourceType,
    toggleCameraMute,
    changeCameraDevice,
    changeVideoSourceType,
    getMediaStreamInstance, // Return the getter function
    videoRef, // Expose videoRef
    canvasRef, // Expose canvasRef
  };
};
