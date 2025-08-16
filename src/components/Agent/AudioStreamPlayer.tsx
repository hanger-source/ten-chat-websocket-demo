import React, { useRef, useEffect, useState, useCallback } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { AudioFrame, MessageType, Message } from '@/types/websocket';

interface AudioStreamPlayerProps {
  // 可以根据需要添加 props，例如音量控制等
}

const AudioStreamPlayer: React.FC<AudioStreamPlayerProps> = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<{ buffer: AudioBuffer; groupTimestamp: number | undefined }[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const nextPlaybackTimeRef = useRef<number>(0); // Changed name from nextStartTimeRef to nextPlaybackTimeRef for clarity
  const [isPlaying, setIsPlaying] = useState(false);
  const activeGroupTimestampRef = useRef<number | undefined>(undefined); // New ref to track the currently active group timestamp
  const currentSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const activeGroupIdRef = useRef<string | undefined>(undefined); // New ref to track the currently active group_id

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current.resume(); // 确保音频上下文是运行状态
      console.log('AudioContext initialized and resumed.');
    }
    return audioContextRef.current;
  }, []);

  const stopAndClearPlayback = useCallback(() => {
    if (audioContextRef.current) {
      // 停止当前正在播放的 AudioBufferSourceNode
      if (currentSourceNodeRef.current) {
        currentSourceNodeRef.current.stop();
        currentSourceNodeRef.current.disconnect(); // 断开连接
        currentSourceNodeRef.current = null;
        console.log('AudioStreamPlayer: Current source node explicitly stopped.');
      }

      // 清空所有待处理的音频源（如果有）
      audioQueueRef.current = [];
      isPlayingRef.current = false;
      setIsPlaying(false);
      nextPlaybackTimeRef.current = 0; // 重置起始时间
      activeGroupTimestampRef.current = undefined; // Reset active group timestamp
      activeGroupIdRef.current = undefined; // Reset active group_id
      console.log('AudioStreamPlayer: Playback stopped and queue cleared. New queue length:', audioQueueRef.current.length);
    }
  }, []);

  const processAudioBuffer = useCallback(async (audioData: Uint8Array, sampleRate: number, numberOfChannels: number, groupTimestamp: number | undefined) => {
    const audioContext = initAudioContext();
    if (!audioContext) return;

    // 将 Uint8Array (PCM) 转换为 Float32Array
    // 假设是 16-bit little-endian PCM
    const dataView = new DataView(audioData.buffer, audioData.byteOffset, audioData.byteLength);
    const float32Array = new Float32Array(audioData.byteLength / 2); // 16-bit PCM = 2 bytes per sample
    for (let i = 0; i < float32Array.length; i++) {
      const int16 = dataView.getInt16(i * 2, true); // true for little-endian
      float32Array[i] = int16 / 32768; // Normalize to -1 to 1
    }

    const audioBuffer = audioContext.createBuffer(numberOfChannels, float32Array.length / numberOfChannels, sampleRate);
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const nowBuffering = audioBuffer.getChannelData(channel);
      // 交错数据需要处理，这里简化为单声道或直接复制
      if (numberOfChannels === 1) {
        nowBuffering.set(float32Array);
      } else {
        // 对于多声道，需要根据实际数据格式进行交错处理
        // 这是一个简化的示例，假设数据是交错的
        for (let i = 0; i < nowBuffering.length; i++) {
          nowBuffering[i] = float32Array[i * numberOfChannels + channel];
        }
      }
    }

    audioQueueRef.current.push({ buffer: audioBuffer, groupTimestamp }); // Push object with buffer and groupTimestamp
    if (!isPlayingRef.current) {
      playNextBuffer();
    }
  }, [initAudioContext]);

  const playNextBuffer = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const audioBuffer = audioQueueRef.current.shift();
    console.log('AudioStreamPlayer: Shifting buffer from queue. Remaining queue length:', audioQueueRef.current.length);
    if (audioBuffer) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer.buffer; // Corrected: should be audioBuffer.buffer from the object
      source.connect(audioContext.destination);

      currentSourceNodeRef.current = source; // Store the current source node

      const currentTime = audioContext.currentTime;
      let startTime = nextPlaybackTimeRef.current;

      // Ensure startTime is not in the past relative to current audio context time
      startTime = Math.max(startTime, currentTime); 

      source.start(startTime); // Start with the adjusted time
      console.log('AudioStreamPlayer: Starting audio source at:', startTime, 'duration:', audioBuffer.buffer.duration); // Corrected duration
      nextPlaybackTimeRef.current = startTime + audioBuffer.buffer.duration; // Corrected duration
      isPlayingRef.current = true;
      setIsPlaying(true);

      source.onended = () => {
        // 当一个 buffer 播放完毕后，尝试播放下一个
        playNextBuffer();
      };
    }
  }, []);

  useEffect(() => {
    const handleAudioFrame = (rawMessage: Message) => {
      const message = rawMessage as AudioFrame; // Explicitly cast to AudioFrame
      console.log('AudioStreamPlayer: Received audio frame (full message)', message);

      const currentGroupTimestamp = message.properties?.group_timestamp; // Get group_timestamp from properties (corrected)
      const currentGroupId = message.properties?.group_id; // Get group_id from properties
      const lastTs = activeGroupTimestampRef.current;
      const lastId = activeGroupIdRef.current; 
      // console.log(`排查日志: AudioStreamPlayer: handleAudioFrame - currentGroupTimestamp: ${currentGroupTimestamp}, lastGroupTimestampRef.current: ${lastTs}, currentGroupId: ${currentGroupId}, activeGroupIdRef.current: ${lastId}`);
      console.log(`AudioStreamPlayer: Received audio frame with ${message.buf?.byteLength || 0} bytes.`); // Add logging

      let isNewGroup = false;

      if (typeof currentGroupTimestamp === 'number') {
        // 如果有 group_timestamp，优先使用 group_timestamp 判断新组
        if (lastTs === undefined || currentGroupTimestamp > lastTs) {
          isNewGroup = true;
        }
      } else if (typeof currentGroupId === 'string') {
        // 如果没有 group_timestamp，使用 group_id 判断新组
        if (lastId === undefined || currentGroupId !== lastId) {
          isNewGroup = true;
        }
      }

      if (isNewGroup) {
        // console.log(`排查日志: AudioStreamPlayer: New group (timestamp: ${currentGroupTimestamp}, id: ${currentGroupId}) detected. Calling stopPlayback() and updating refs.`);
        stopAndClearPlayback(); // Stop current playback and clear queue
        activeGroupTimestampRef.current = currentGroupTimestamp; // Set the new active group timestamp
        activeGroupIdRef.current = currentGroupId; // Set the new active group_id
      } else if ((typeof currentGroupTimestamp === 'number' && currentGroupTimestamp < lastTs!) || (typeof currentGroupId === 'string' && currentGroupId !== lastId && typeof lastId !== 'undefined')) {
        // 忽略旧的 group_timestamp 或不同但已存在 group_id 的消息
        // console.log(`排查日志: AudioStreamPlayer: Discarding audio frame from old/mismatched group.`);
        return; // Important: discard old frames
      }

      // Process the current frame ONLY if it belongs to the *active* group.
      // If group_timestamp and group_id are undefined (e.g., first frame and no group info), we still process it.
      // If group_timestamp exists and matches lastTs, then process.
      // If group_timestamp is undefined but group_id exists and matches lastId, then process.
      const shouldProcess = (
        (typeof currentGroupTimestamp === 'undefined' && typeof currentGroupId === 'undefined') || // First frame ever, no group info yet
        (typeof currentGroupTimestamp === 'number' && currentGroupTimestamp === lastTs) || // Belongs to current active group by timestamp
        (typeof currentGroupTimestamp === 'undefined' && typeof currentGroupId === 'string' && currentGroupId === lastId) // Belongs to current active group by id (if no timestamp)
      );

      if (message.buf && typeof message.sample_rate === 'number' && typeof message.number_of_channel === 'number' && shouldProcess) {
        // 假设 bits_per_sample 总是 16
        // 过滤掉空的音频帧
        if (message.buf.byteLength > 0) {
          // console.log('AudioStreamPlayer: Calling processAudioBuffer with new audio data for current group.');
          processAudioBuffer(message.buf, message.sample_rate, message.number_of_channel, currentGroupTimestamp); // Pass number_of_channel
        } else {
          // console.log('AudioStreamPlayer: Received empty audio frame for current group, skipping playback.');
        }
      } else {
        console.warn('AudioStreamPlayer: Incomplete or mismatched group audio frame received, skipping.', message);
      }
    };

    const unsubscribe = webSocketManager.onMessage(MessageType.AUDIO_FRAME, handleAudioFrame);

    return () => {
      unsubscribe();
      // 清理音频上下文
      if (audioContextRef.current) {
        // 在组件卸载时确保停止播放并清理
        stopAndClearPlayback();
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [processAudioBuffer, stopAndClearPlayback]); // Add stopPlayback to dependency array

  return (
    <div className="audio-stream-player">
      {/* 音频播放状态由 ChatCard 统一管理，此处不再显示 */}
    </div>
  );
};

export default AudioStreamPlayer;