"use client";

import * as React from "react";
import { webSocketManager } from "@/manager/websocket/websocket"; // cketManager
// oFrame类型
// MessageType类型
import {AudioFrame, Message, MessageType} from "@/types/message"; // Message类型

export interface StreamPlayerProps {
  style?: React.CSSProperties;
  fit?: "cover" | "contain" | "fill";
  onClick?: () => void;
  mute?: boolean;
  wsManager?: typeof webSocketManager;
}

export const LocalStreamPlayer = React.forwardRef(
  (props: StreamPlayerProps, ref) => {
    const {
      mute = false,
      style = {},
      fit = "cover",
      onClick = () => {},
      wsManager = webSocketManager, // webSocketManager
    } = props;
    const vidDiv = React.useRef<HTMLDivElement>(null);

    // 态和引用
    const audioContextRef = React.useRef<AudioContext | null>(null);
    const audioQueueRef = React.useRef<Uint8Array[]>([]);
    const isPlayingRef = React.useRef<boolean>(false);

    React.useLayoutEffect(() => {
      // oContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); // Cast to any to resolve type error
      }

      // cket的AudioFrameReceived事件
      const handleAudioFrame = (message: Message) => {
        if (message.type === MessageType.AUDIO_FRAME) {
          const audioFrame = message as AudioFrame;
          audioQueueRef.current.push(audioFrame.buf);
          if (!isPlayingRef.current && !mute) {
            playNextAudioChunk();
          }
        }
      };

      wsManager.onMessage(MessageType.AUDIO_FRAME, handleAudioFrame);

      return () => {
        wsManager.offMessage(MessageType.AUDIO_FRAME, handleAudioFrame);
        // Context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        audioQueueRef.current = [];
        isPlayingRef.current = false;
      };
    }, [wsManager, mute]);

    // rray转换为AudioBuffer并播放
    const playNextAudioChunk = async () => {
      if (audioQueueRef.current.length === 0 || !audioContextRef.current || mute) {
        isPlayingRef.current = false;
        return;
      }

      isPlayingRef.current = true;
      const audioData = audioQueueRef.current.shift();
      if (!audioData) {
        isPlayingRef.current = false;
        return;
      }

      try {
        // rray数据转换为Float32Array，假设后端发送的是PCM 16-bit
        // TODO: 需要根据实际后端发送的音频编码格式进行调整，目前假设是单声道16kHz PCM
        const int16Array = new Int16Array(audioData.buffer, audioData.byteOffset, audioData.byteLength / Int16Array.BYTES_PER_ELEMENT);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768; // 32768 = 2^15
        }

        const audioBuffer = audioContextRef.current.createBuffer(
          1, // channels
          float32Array.length, // frameLength
          audioContextRef.current.sampleRate // sampleRate
        );
        audioBuffer.copyToChannel(float32Array, 0);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);

        source.onended = () => {
          // 完毕，继续播放下一个
          playNextAudioChunk();
        };

        source.start();
      } catch (error) {
        console.error("ecoding or playing audio chunk:", error);
        isPlayingRef.current = false;
        // 试播放下一个，避免阻塞
        playNextAudioChunk();
      }
    };

    return (
      <div
        className="relative h-full w-full overflow-hidden"
        style={style}
        ref={vidDiv}
        onClick={onClick}
      />
    );
  },
);
