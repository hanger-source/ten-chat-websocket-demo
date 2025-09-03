import React, { useEffect, useRef } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { useWebSocketSession } from '@/hooks/useWebSocketSession';
import useMediaState from './media/useMediaState';
import useActiveMediaStream from "@/hooks/media/useActiveMediaStream"; // 导入新的 useMediaState hook

interface UseVideoFrameSenderProps {
  intervalMs?: number;
}

export const useVideoFrameSender = ({ intervalMs = 2000 }: UseVideoFrameSenderProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null); // 用于将传入的 stream 绘制到 canvas 的隐藏 video 元素
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const { isConnected,defaultLocation } = useWebSocketSession();
  const stream = useActiveMediaStream();
  const { isVideoEnabled } = useMediaState(); // 获取视频启用状态

  useEffect(() => {
    if (stream && isConnected && isVideoEnabled) {
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.style.display = 'none'; // 隐藏这个 video 元素
      }

      const videoElement = videoRef.current;
      videoElement.srcObject = stream;

      videoElement.onloadedmetadata = async () => {
        if (isConnected && isVideoEnabled && videoElement.paused) {
          try {
            await videoElement.play();
          } catch (error) {
            // Handle play error if necessary
          }
        }
      };

      videoElement.onplay = () => {
        if (canvasRef.current && isConnected && isVideoEnabled) {
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
              if (!stream || !isConnected || !isVideoEnabled) { // 检查 stream, isConnected, isVideoEnabled
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
                          defaultLocation,
                        [defaultLocation],
                        "video_frame",
                        1,
                        false
                      );
                    };
                    reader.readAsArrayBuffer(blob);
                  } else {
                    // console.warn("Failed to create blob from canvas.");
                  }
                }, 'image/jpeg', 0.8);
              } else {
                // console.warn("Video not ready or paused, skipping frame capture.");
              }
            }, intervalMs);
          }
        } else {
          // console.warn("Canvas or connection not ready, or video is disabled.");
        }
      };

      videoElement.onpause = () => {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
      };
    } else { // 当 stream 不存在，或未连接，或视频被禁用时，停止所有发送
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
  }, [stream, isVideoEnabled, intervalMs, defaultLocation, isConnected]);

  return { canvasRef }; // 只返回 canvasRef，videoRef 由内部管理
};
