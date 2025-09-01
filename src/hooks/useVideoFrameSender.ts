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

  useEffect(() => {
    // Ensure `getMediaStreamInstance` is a function before calling it
    if (typeof getMediaStreamInstance !== 'function') {
      return;
    }

    const videoStream = getMediaStreamInstance();

    if (videoStream && isConnected) {
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
      }

      const videoElement = videoRef.current;
      videoElement.srcObject = videoStream;

      videoElement.onloadedmetadata = async () => {
        if (isConnected && videoElement.paused) {
          try {
            await videoElement.play();
          } catch (error) {
          }
        }
      };

      videoElement.onplay = () => {
        if (canvasRef.current && isConnected) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
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
              const currentVideoStream = getMediaStreamInstance();
              if (!currentVideoStream || !isConnected) {
                if (intervalIdRef.current) {
                  clearInterval(intervalIdRef.current);
                  intervalIdRef.current = null;
                }
                return;
              }

              if (videoElement.readyState >= 2 && !videoElement.paused) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

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
              } else {
              }
            }, intervalMs);
          }
        } else {
        }
      };

      videoElement.onpause = () => {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
      };
    } else {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }
    };
  }, [getMediaStreamInstance, intervalMs, srcLoc, destLocs, isConnected]);

  return { videoRef, canvasRef };
};
