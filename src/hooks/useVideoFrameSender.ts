import React, { useEffect, useRef } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { WebSocketConnectionState } from '@/types/websocket';
import { MESSAGE_CONSTANTS } from '@/common/constant';
import { Location, MessageType } from "@/types/message";
import { useWebSocketSession } from '@/hooks/useWebSocketSession';

interface UseVideoFrameSenderProps {
  getMediaStreamInstance: () => MediaStream | null;
  intervalMs?: number;
  srcLoc: Location;
  destLocs: Location[];
}

export const useVideoFrameSender = ({ getMediaStreamInstance, intervalMs = 2000, srcLoc, destLocs }: UseVideoFrameSenderProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const { isConnected } = useWebSocketSession();

  // Effect for setting up the hidden video element and managing its stream lifecycle
  useEffect(() => {
    const videoStream = getMediaStreamInstance();

    if (!videoStream || !isConnected) {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        // Check if parentElement exists before trying to removeChild
        if (videoRef.current.parentElement) {
          videoRef.current.parentElement.removeChild(videoRef.current);
        }
        videoRef.current = null;
      }
      return;
    }

    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
      document.body.appendChild(videoRef.current); // Append to DOM
    }

    const videoElement = videoRef.current;
    if (videoElement.srcObject !== videoStream) { // Only update srcObject if different
      videoElement.srcObject = videoStream;
    }

    const onLoadedMetadata = async () => {
      if (isConnected && videoElement.paused) {
        try {
          await videoElement.play();
        } catch (error) {
        }
      }
    };

    const onPlay = () => {
      // Do NOT start interval here, let the canvas effect handle it
    };

    const onPause = () => {
      // Do NOT clear interval here, let the canvas effect handle it
    };

    videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
    videoElement.addEventListener('play', onPlay);
    videoElement.addEventListener('pause', onPause);

    return () => {
      videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
      videoElement.removeEventListener('play', onPlay);
      videoElement.removeEventListener('pause', onPause);
      if (videoRef.current && videoRef.current.parentElement) { // Use videoRef.current for cleanup
         videoRef.current.srcObject = null;
         videoRef.current.parentElement.removeChild(videoRef.current);
         videoRef.current = null;
      }
    };
  }, [getMediaStreamInstance, isConnected]); // Dependencies: only stream and connection state

  // Effect for canvas drawing and frame sending interval
  useEffect(() => {
    const canvas = canvasRef.current;
    const videoElement = videoRef.current; // Get current video element from its ref

    // Conditions for starting the interval
    const canStartInterval = (
      !!canvas &&
      !!videoElement &&
      isConnected &&
      !videoElement.paused &&
      videoElement.readyState >= 2 &&
      videoElement.videoWidth > 0 && // Ensure video has dimensions
      videoElement.videoHeight > 0
    );

    if (!canStartInterval) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const maxWidth = 640;
    const maxHeight = 480;
    let targetWidth = videoElement.videoWidth;
    let targetHeight = videoElement.videoHeight;

    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const aspectRatio = targetWidth / targetHeight;
      if (targetWidth > targetHeight) {
        targetWidth = maxWidth;
        targetHeight = Math.round(maxWidth / aspectRatio);
      } else {
        targetHeight = maxHeight;
        targetWidth = Math.round(maxHeight * aspectRatio);
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    intervalIdRef.current = window.setInterval(() => {
      // Re-check conditions inside the interval callback as well, using current values
      const currentVideoStream = getMediaStreamInstance();
      if (!currentVideoStream || !isConnected || !videoRef.current || videoRef.current.paused || videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          if (blob.size > 900000) {
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const uint8Array = new Uint8Array(arrayBuffer);
            webSocketManager.sendVideoFrame(
              uint8Array,
              canvas.width,
              canvas.height,
              srcLoc,
              destLocs,
              "video_frame",
              1,
              false
            );
          };
          reader.readAsArrayBuffer(blob);
        } else {
        }
      }, 'image/jpeg', 0.8);
    }, intervalMs);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [canvasRef.current, videoRef.current, isConnected, intervalMs, srcLoc, destLocs, getMediaStreamInstance]);

  return { videoRef, canvasRef };
};
