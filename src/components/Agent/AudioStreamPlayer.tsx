import audioProcessorString from '../../manager/websocket/audio-processor.js?raw';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { WebSocketConnectionState, SessionConnectionState } from '@/types/websocket';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Message, MessageType } from "@/types/websocket"; // 修正导入路径和类型

interface AudioStreamPlayerProps {
  // 可以根据需要添加 props，例如音量控制等
}

const AudioStreamPlayer: React.FC<AudioStreamPlayerProps> = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeGroupTimestampRef = useRef<number | undefined>(undefined);
  const activeGroupIdRef = useRef<string | undefined>(undefined);

  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

  const websocketConnectionState = useSelector((state: RootState) => state.global.websocketConnectionState);
  const agentConnected = useSelector((state: RootState) => state.global.agentConnected);

  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      try {
        const audioWorkletBlob = new Blob([audioProcessorString], { type: 'application/javascript' });
        const audioWorkletBlobUrl = URL.createObjectURL(audioWorkletBlob);
        await audioContextRef.current.audioWorklet.addModule(audioWorkletBlobUrl);
        URL.revokeObjectURL(audioWorkletBlobUrl);
      } catch (error) {
        console.error('AudioStreamPlayer: Failed to add AudioWorklet module:', error);
      }
    }
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error('AudioStreamPlayer: Failed to resume AudioContext:', error);
      }
    }
    return audioContextRef.current;
  }, []);

  const stopAndClearPlayback = useCallback(() => {
    if (audioContextRef.current && audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.port.postMessage('clear');
    }
    setIsPlaying(false);
    activeGroupTimestampRef.current = undefined;
    activeGroupIdRef.current = undefined;
  }, []);

  const resampleAudioData = useCallback((
    originalAudioData: Float32Array,
    originalSampleRate: number,
    targetSampleRate: number
  ): Float32Array => {
    if (originalSampleRate === targetSampleRate) {
      return originalAudioData;
    }

    const ratio = targetSampleRate / originalSampleRate;
    const newLength = Math.round(originalAudioData.length * ratio);
    const resampledData = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIndex = i / ratio;
      const indexLower = Math.floor(originalIndex);
      const indexUpper = Math.ceil(originalIndex);

      if (indexUpper >= originalAudioData.length) {
        resampledData[i] = originalAudioData[originalAudioData.length - 1];
      } else if (indexLower < 0) {
        resampledData[i] = originalAudioData[0];
      } else {
        const weightUpper = originalIndex - indexLower;
        const weightLower = 1 - weightUpper;
        resampledData[i] = (
          originalAudioData[indexLower] * weightLower +
          originalAudioData[indexUpper] * weightUpper
        );
      }
    }
    return resampledData;
  }, []);

  const startAudioPlayback = useCallback(async () => {
    const audioContext = await initAudioContext();
    if (!audioContext) {
      console.error('AudioStreamPlayer: AudioContext not initialized, cannot setup AudioWorkletNode.');
      return;
    }

    if (!audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current = new AudioWorkletNode(audioContext, 'audio-player-processor');
      audioWorkletNodeRef.current.connect(audioContext.destination);

      audioWorkletNodeRef.current.port.onmessage = (event) => {
        if (event.data === 'playing') {
          setIsPlaying(true);
        } else if (event.data === 'stopped') {
          setIsPlaying(false);
        }
      };
    }

    const handleAudioFrame = (rawMessage: Message) => { // 修正参数类型
      const message = rawMessage; // 不再需要类型断言
      const currentGroupTimestamp = message.properties?.group_timestamp;
      const currentGroupId = message.properties?.group_id;
      const lastTs = activeGroupTimestampRef.current;
      const lastId = activeGroupIdRef.current;

      let isNewGroup = false;

      if (typeof currentGroupTimestamp === 'number') {
        if (lastTs === undefined || currentGroupTimestamp > lastTs) {
          isNewGroup = true;
        }
      } else if (typeof currentGroupId === 'string') {
        if (lastId === undefined || currentGroupId !== lastId) {
          isNewGroup = true;
        }
      }

      if (isNewGroup) {
        stopAndClearPlayback();
        activeGroupTimestampRef.current = currentGroupTimestamp;
        activeGroupIdRef.current = currentGroupId;
      } else if ((typeof currentGroupTimestamp === 'number' && currentGroupTimestamp < lastTs!) || (typeof currentGroupId === 'string' && currentGroupId !== lastId && typeof lastId !== 'undefined')) {
        return;
      }

      const shouldProcess = (
        (typeof currentGroupTimestamp === 'undefined' && typeof currentGroupId === 'undefined') ||
        (typeof currentGroupTimestamp === 'number' && currentGroupTimestamp === lastTs) ||
        (typeof currentGroupTimestamp === 'undefined' && typeof currentGroupId === 'string' && currentGroupId === lastId)
      );

      if (message.buf && typeof message.sample_rate === 'number' && typeof message.number_of_channel === 'number' && shouldProcess) {
        if (message.buf.byteLength > 0) {
          const dataView = new DataView(message.buf.buffer, message.buf.byteOffset, message.buf.byteLength);
          let float32Array = new Float32Array(message.buf.byteLength / 2);
          for (let i = 0; i < float32Array.length; i++) {
            const int16 = dataView.getInt16(i * 2, true);
            float32Array[i] = int16 / 32768;
          }

          if (message.sample_rate !== audioContext.sampleRate) {
            const resampledData = resampleAudioData(float32Array, message.sample_rate, audioContext.sampleRate);
            float32Array = new Float32Array(resampledData);
          }

          if (audioWorkletNodeRef.current) {
            audioWorkletNodeRef.current.port.postMessage(float32Array);
            setIsPlaying(true);
          } else {
            console.warn('AudioStreamPlayer: AudioWorkletNode not initialized, cannot send audio data.');
          }
        } else {
          console.log('AudioStreamPlayer: Received empty audio frame for current group, skipping.');
        }
      } else {
        console.warn('AudioStreamPlayer: Incomplete or mismatched group audio frame received, skipping.', message);
      }
    };

    const unsubscribeWs = webSocketManager.onMessage(MessageType.AUDIO_FRAME, handleAudioFrame);
    unsubscribeRef.current = unsubscribeWs;

    return unsubscribeWs;
  }, [initAudioContext, stopAndClearPlayback, unsubscribeRef, resampleAudioData]);

  useEffect(() => {
    const shouldStartAudio = (
      websocketConnectionState === WebSocketConnectionState.OPEN &&
      agentConnected === true
    );

    if (shouldStartAudio) {
      startAudioPlayback();
    } else {
      stopAndClearPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.port.postMessage('clear');
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }
      if (audioContextRef.current) {
        stopAndClearPlayback();
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [websocketConnectionState, agentConnected, startAudioPlayback, stopAndClearPlayback, resampleAudioData]);

  return (
    <div className="audio-stream-player">
    </div>
  );
};

export default AudioStreamPlayer;