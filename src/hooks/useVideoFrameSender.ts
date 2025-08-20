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

export const useVideoFrameSender = ({ videoStream, intervalMs = 1000, srcLoc, destLocs }: UseVideoFrameSenderProps) => {
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

                    // Replaced with sendVideoFrame
                    webSocketManager.sendVideoFrame(
                      uint8Array,
                      canvas.width,
                      canvas.height,
                      srcLoc,
                      destLocs,
                      "video_frame", // name
                      // format: "jpeg", // format (assuming image/jpeg from canvas.toBlob) - Backend expects int pixelFormat
                      0, // Temporary placeholder for pixelFormat. Please provide the correct integer mapping for "jpeg" or other formats.
                      false // isEof
                    );
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
