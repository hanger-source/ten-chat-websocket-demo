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
      console.log(`[DEBUG] useEffect triggered. Stream prop: ${stream ? stream.id : 'null'}, videoRef.current: ${videoRef.current ? 'exists' : 'null'}`);
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        console.log(`[DEBUG] srcObject set for stream: ${stream.id}`);
      }
    }, [stream]);

    const handlePlay = () => {
      console.log(`[DEBUG] Video started playing. Stream ID: ${stream ? stream.id : 'null'}`);
    };

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full"
        style={{ objectFit: fit }}
        onClick={onClick}
        onPlay={handlePlay} // Add onPlay event listener
      />
    );
  },
);

LocalVideoStreamPlayer.displayName = "LocalVideoStreamPlayer";
