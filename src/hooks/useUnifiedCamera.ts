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

      // If stream exists and details match, no need to re-acquire or clean up the stream itself.
      // Mute/unmute state will be handled by the separate useEffect.
      if (currentStreamExists && detailsMatch) {
        // Ensure hasActiveStream is true if stream exists, regardless of mute state for this effect
        if (!hasActiveStream) {
          setHasActiveStream(true);
        }
        return;
      }

      // If we reach here, we either don't have an existing stream, or the details don't match.
      // So, we need to acquire a new stream. First, clean up any existing one if present.
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        localStreamRef.current = null;
        lastRequestedStreamDetailsRef.current = null;
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
            // Tracks' enabled state will be managed by the separate mute/unmute effect.
            // No need to update hasActiveStream state or lastRequestedStreamDetailsRef as it's the same logical stream.
            return;
          }

          // If we reach here, it's a truly new or missing stream, so set it up.
          // Initialize tracks' enabled state based on current isCameraMuted
          mediaStream.getVideoTracks().forEach(track => (track.enabled = !isCameraMuted));
          localStreamRef.current = mediaStream;
          setHasActiveStream(true); // Notify consumers that an active stream is present
          lastRequestedStreamDetailsRef.current = { deviceId: selectedCamDeviceId, sourceType: currentVideoSourceType };
        } else {
          localStreamRef.current = null;
          lastRequestedStreamDetailsRef.current = null;
          if (hasActiveStream) {
            setHasActiveStream(false);
          }
        }
      } catch (error) {
        console.error("[VIDEO_LOG] 获取媒体流失败:", error);
        localStreamRef.current = null;
        lastRequestedStreamDetailsRef.current = null;
        if (hasActiveStream) {
          setHasActiveStream(false);
        }
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
    };
  }, [selectedCamDeviceId, currentVideoSourceType, dispatch]); // Removed isCameraMuted and hasActiveStream from dependencies

  // New effect to handle muting/unmuting independently
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isCameraMuted;
      });
      // Update hasActiveStream based on whether any track is now enabled
      const anyTrackEnabled = localStreamRef.current.getVideoTracks().some(track => track.enabled);
      if (anyTrackEnabled !== hasActiveStream) {
        setHasActiveStream(anyTrackEnabled);
      }
    } else {
      // If there's no stream, ensure hasActiveStream is false
      if (hasActiveStream) {
        setHasActiveStream(false);
      }
    }
  }, [isCameraMuted, hasActiveStream]);

  // New getter function for the MediaStream instance, wrapped in useCallback for stability
  const getMediaStreamInstance = useCallback(() => {
    const currentStream = localStreamRef.current;
    if (!currentStream) {
      return null;
    }
    const videoTracksInfo = currentStream.getVideoTracks().map(track => ({ id: track.id, enabled: track.enabled, readyState: track.readyState }));
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
