import React, { useEffect, useRef } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { WebSocketConnectionState } from '@/types/websocket'; // Import WebSocketConnectionState
import { MESSAGE_CONSTANTS } from '@/common/constant';
import {Location, MessageType} from "@/types/message";

interface UseVideoFrameSenderProps {
  videoStream: MediaStream | null;
  intervalMs?: number;
  srcLoc: Location;
  destLocs: Location[];
}

export const useVideoFrameSender = ({ videoStream, intervalMs = 2000, srcLoc, destLocs }: UseVideoFrameSenderProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalIdRef = useRef<number | null>(null);

  useEffect(() => {
    const currentConnectionState = webSocketManager.getConnectionState();
    
    if (videoStream && currentConnectionState === WebSocketConnectionState.OPEN) {
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
      }
      videoRef.current.srcObject = videoStream;

      const videoElement = videoRef.current;
      videoElement.onloadedmetadata = () => {
        console.log(`[VIDEO_FRAME] 视频流已加载 - ${videoElement.videoWidth}x${videoElement.videoHeight}`);
        
        // 确保视频开始播放
        videoElement.play().catch(error => {
          console.error(`[VIDEO_FRAME] 视频播放失败:`, error);
        });
        
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // 限制Canvas尺寸以减少数据量
            const maxWidth = 640;
            const maxHeight = 480;
            
            let targetWidth = videoElement.videoWidth;
            let targetHeight = videoElement.videoHeight;
            
            // 按比例缩放以适应最大尺寸限制
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
              // 检查视频是否正在播放
              if (videoElement.readyState >= 2 && !videoElement.paused) {
                // 绘制视频帧
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                  if (blob) {
                    // 检查数据大小是否超过WebSocket帧限制
                    if (blob.size > 900000) {
                      console.warn(`[VIDEO_FRAME] 视频帧数据过大 (${blob.size} bytes)，跳过发送`);
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
                        1, // JPEG格式
                        false
                      );
                    };
                    reader.readAsArrayBuffer(blob);
                  }
                }, 'image/jpeg', 0.8);
              } else {
                // 如果视频准备好但是暂停了，尝试重新播放
                if (videoElement.readyState >= 2 && videoElement.paused) {
                  videoElement.play().catch(error => {
                    console.error(`[VIDEO_FRAME] 视频重新播放失败:`, error);
                  });
                }
              }
            }, intervalMs);
          }
        }
      };
    } else {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.remove();
      }
    };
  }, [videoStream, intervalMs, srcLoc, destLocs]); // Removed currentConnectionState from dependencies

  return { videoRef, canvasRef };
};
