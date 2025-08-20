import React, { useEffect, useRef } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { MessageType, Location } from '@/types/websocket';
import { MESSAGE_CONSTANTS } from '@/common/constant';

interface UseVideoFrameSenderProps {
  videoStream: MediaStream | null;
  intervalMs?: number;
  srcLoc: Location;
  destLocs: Location[];
}

export const useVideoFrameSender = ({ videoStream, intervalMs = 100, srcLoc, destLocs }: UseVideoFrameSenderProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (videoStream) {
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true; // Mute local video preview
      }
      videoRef.current.srcObject = videoStream;

      const videoElement = videoRef.current;
      videoElement.onloadedmetadata = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;

            if (intervalIdRef.current) {
              clearInterval(intervalIdRef.current);
            }

            intervalIdRef.current = window.setInterval(() => {
              ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
              canvas.toBlob((blob) => {
                if (blob) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const arrayBuffer = reader.result as ArrayBuffer;
                    const uint8Array = new Uint8Array(arrayBuffer);

                    const videoFrameMessage = {
                      id: webSocketManager["generateMessageId"](), // Access private method for now
                      type: MessageType.VIDEO_FRAME,
                      name: "video_frame",
                      src_loc: srcLoc,
                      dest_locs: destLocs,
                      buf: uint8Array,
                      is_eof: false,
                      frame_timestamp: Date.now(),
                      timestamp: Date.now(),
                      properties: {
                        width: canvas.width,
                        height: canvas.height,
                        // Add other video properties if needed (e.g., format, codec)
                      },
                    };
                    // webSocketManager.sendMessage(videoFrameMessage); // Send video frame
                    // console.log("Sending video frame:", videoFrameMessage);

                    // Use sendData for now, assuming backend can handle generic data
                    webSocketManager.sendData(uint8Array, "video/webm");
                    console.log(`[VIDEO_LOG] Sending video frame: size=${uint8Array.length}`);

                  };
                  reader.readAsArrayBuffer(blob);
                }
              }, 'image/jpeg'); // 可以选择其他格式，例如 'image/webp'
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
  }, [videoStream, intervalMs, srcLoc, destLocs]);

  return { videoRef, canvasRef };
};
