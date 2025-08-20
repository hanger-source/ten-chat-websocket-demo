"use client";

import * as React from "react";

interface LocalVideoStreamPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  fit?: "cover" | "contain" | "fill";
  onClick?: () => void;
}

export const LocalVideoStreamPlayer = React.forwardRef(
  (props: LocalVideoStreamPlayerProps, ref: React.Ref<HTMLVideoElement>) => {
    const { stream, muted = true, fit = "cover", onClick = () => {} } = props;
    const videoRef = React.useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full bg-black rounded-lg"
        style={{ objectFit: fit }}
        onClick={onClick}
      />
    );
  },
);

LocalVideoStreamPlayer.displayName = "LocalVideoStreamPlayer";
