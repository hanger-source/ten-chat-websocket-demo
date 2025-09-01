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
      // Check if we need to get a new stream at all
      const currentStreamActive = localStreamRef.current && localStreamRef.current.getTracks().some(track => track.readyState === 'live');
      const detailsMatch = lastRequestedStreamDetailsRef.current &&
                           lastRequestedStreamDetailsRef.current.deviceId === selectedCamDeviceId &&
                           lastRequestedStreamDetailsRef.current.sourceType === currentVideoSourceType;

      // If camera is muted, stop any existing stream and return
      if (isCameraMuted) {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
          lastRequestedStreamDetailsRef.current = null;
          // Only set state to false if it's not already false to prevent unnecessary re-renders
          if (hasActiveStream) {
            setHasActiveStream(false);
          }
        }
        return;
      }

      // If stream is active and details match, no need to re-acquire a new MediaStream
      if (currentStreamActive && detailsMatch) {
        // Just ensure tracks are enabled (if they were previously disabled due to mute)
        localStreamRef.current?.getVideoTracks().forEach(track => (track.enabled = !isCameraMuted)); // Correctly respond to mute state
        // No need to call setHasActiveStream as the logical stream state hasn't changed (it's already active)
        return;
      }

      // If we reach here, we either don't have an active stream, or the details don't match,
      // so we need to acquire a new stream. First, clean up any existing one.
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        lastRequestedStreamDetailsRef.current = null;
        // Only set state to false if it's not already false to prevent unnecessary re-renders
        if (hasActiveStream) {
          setHasActiveStream(false);
        }
      }

      try {
        let stream: MediaStream | null = null;
        if (currentVideoSourceType === VideoSourceType.CAMERA) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: selectedCamDeviceId ? { deviceId: selectedCamDeviceId } : true,
          }) as MediaStream;
        } else if (currentVideoSourceType === VideoSourceType.SCREEN) {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true }) as MediaStream;
        }

        if (stream) {
          const mediaStream = stream as MediaStream;
          // @ts-ignore: Property 'id' does not exist on type 'never'. This is a known TS issue with complex control flow.
          const newStreamId = mediaStream.id;

          // If we have an existing stream in ref with the same ID, stop the new one and reuse the existing.
          // This is critical to prevent frequent re-initialization of consumers.
          // @ts-ignore: Property 'id' does not exist on type 'never'.
          if (localStreamRef.current !== null && localStreamRef.current.id === newStreamId) {
            stream.getTracks().forEach(track => track.stop()); // Stop the redundant new stream
            // Ensure the existing stream's tracks are enabled/disabled correctly
            // @ts-ignore: Property 'getVideoTracks' does not exist on type 'never'. Parameter 'track' implicitly has an 'any' type.
            localStreamRef.current.getVideoTracks().forEach(track => (track.enabled = !isCameraMuted));
            // No need to update hasActiveStream state or lastRequestedStreamDetailsRef as it's the same logical stream.
            return;
          }

          // If we reach here, it's a truly new or missing stream, so set it up.
          mediaStream.getVideoTracks().forEach(track => (track.enabled = !isCameraMuted)); // Ensure tracks are enabled for new stream, respecting mute state
          localStreamRef.current = mediaStream;
          setHasActiveStream(true); // Notify consumers that an active stream is present
          lastRequestedStreamDetailsRef.current = { deviceId: selectedCamDeviceId, sourceType: currentVideoSourceType };
        } else {
          localStreamRef.current = null;
          lastRequestedStreamDetailsRef.current = null;
          // Only set state to false if it's not already false to prevent unnecessary re-renders
          if (hasActiveStream) {
            setHasActiveStream(false);
          }
        }
      } catch (error) {
        console.error("[VIDEO_LOG] 获取媒体流失败:", error);
        localStreamRef.current = null;
        lastRequestedStreamDetailsRef.current = null;
        // Only set state to false if it's not already false to prevent unnecessary re-renders
        if (hasActiveStream) {
          setHasActiveStream(false);
        }
      }
    };

    getStream();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        // Do NOT setHasActiveStream(false) here, as hasActiveStream is managed by getStream for state updates
      }
      lastRequestedStreamDetailsRef.current = null; // Clear details on cleanup
    };
  }, [isCameraMuted, selectedCamDeviceId, currentVideoSourceType, dispatch]); // Removed hasActiveStream from dependencies

  // New getter function for the MediaStream instance, wrapped in useCallback for stability
  const getMediaStreamInstance = useCallback(() => {
    const currentStream = localStreamRef.current;
    if (!currentStream) {
      return null;
    }
    const hasLiveVideoTrack = currentStream.getVideoTracks().some(track => track.readyState === 'live');
    if (!hasLiveVideoTrack) {
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
