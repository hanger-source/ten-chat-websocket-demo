"use client";

import React, { useRef, useEffect } from 'react';

interface LocalVideoStreamPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  fit?: 'contain' | 'cover' | 'fill';
}

export const LocalVideoStreamPlayer: React.FC<LocalVideoStreamPlayerProps> = ({ stream, muted = true, fit = 'contain' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleCanPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        // Autoplay was prevented. Show a "Play" button to the user.
      });
    }
  };

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      onCanPlay={handleCanPlay}
      style={{ objectFit: fit, width: '100%', height: '100%' }}
    />
  );
};
