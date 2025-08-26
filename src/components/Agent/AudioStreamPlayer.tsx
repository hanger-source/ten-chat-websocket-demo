import audioProcessorString from '../../manager/websocket/audio-processor.js?raw';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { AudioFrame, MessageType, Message, WebSocketConnectionState, SessionConnectionState } from '@/types/websocket'; // Import WebSocketConnectionState and SessionConnectionState
import { useSelector } from 'react-redux'; // Import useSelector
import { RootState } from '@/store'; // Import RootState

interface AudioStreamPlayerProps {
  // 可以根据需要添加 props，例如音量控制等
}

const AudioStreamPlayer: React.FC<AudioStreamPlayerProps> = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeGroupTimestampRef = useRef<number | undefined>(undefined); // New ref to track the currently active group timestamp
  const activeGroupIdRef = useRef<string | undefined>(undefined); // New ref to track the currently active group_id

  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined); 

  const websocketConnectionState = useSelector((state: RootState) => state.global.websocketConnectionState);
  const agentConnected = useSelector((state: RootState) => state.global.agentConnected);

  const initAudioContext = useCallback(async () => { // Changed to async to await addModule
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Register AudioWorklet processor
      try {
        const audioWorkletBlob = new Blob([audioProcessorString], { type: 'application/javascript' });
        const audioWorkletBlobUrl = URL.createObjectURL(audioWorkletBlob);
        await audioContextRef.current.audioWorklet.addModule(audioWorkletBlobUrl);
        URL.revokeObjectURL(audioWorkletBlobUrl); // Clean up the Blob URL after use
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
      // Send clear command to AudioWorkletProcessor
      audioWorkletNodeRef.current.port.postMessage('clear');
    }
    // Reset local state
    setIsPlaying(false);
    activeGroupTimestampRef.current = undefined;
    activeGroupIdRef.current = undefined;
  }, []);

  // New: Resampling function
  const resampleAudioData = useCallback((
    originalAudioData: Float32Array,
    originalSampleRate: number,
    targetSampleRate: number
  ): Float32Array => {
    if (originalSampleRate === targetSampleRate) {
      return originalAudioData; // No resampling needed
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

  // New: Function to set up AudioWorklet and subscribe to WebSocket, triggered by user gesture (now WebSocket OPEN state)
  const startAudioPlayback = useCallback(async () => {
    const audioContext = await initAudioContext();
    if (!audioContext) {
      console.error('AudioStreamPlayer: AudioContext not initialized, cannot setup AudioWorkletNode.');
      return;
    }

    if (!audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current = new AudioWorkletNode(audioContext, 'audio-player-processor');
      audioWorkletNodeRef.current.connect(audioContext.destination);

      // Listen for messages from AudioWorkletProcessor (e.g., status updates)
      audioWorkletNodeRef.current.port.onmessage = (event) => {
        if (event.data === 'playing') {
          setIsPlaying(true);
        } else if (event.data === 'stopped') {
          setIsPlaying(false);
        }
      };
    }

    // Now subscribe to WebSocket messages after AudioWorklet is ready
    const handleAudioFrame = (rawMessage: Message) => {
      const message = rawMessage as AudioFrame; // Explicitly cast to AudioFrame
      const currentGroupTimestamp = message.properties?.group_timestamp;
      const currentGroupId = message.properties?.group_id;
      const lastTs = activeGroupTimestampRef.current;
      const lastId = activeGroupIdRef.current;

      // Log the incoming sample rate

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
          // Convert Uint8Array PCM to Float32Array
          const dataView = new DataView(message.buf.buffer, message.buf.byteOffset, message.buf.byteLength);
          let float32Array = new Float32Array(message.buf.byteLength / 2);
          for (let i = 0; i < float32Array.length; i++) {
            const int16 = dataView.getInt16(i * 2, true);
            float32Array[i] = int16 / 32768; // Normalize to -1 to 1
          }

          // New: Resample audio data if sample rates don't match
          if (message.sample_rate !== audioContext.sampleRate) {
            const resampledData = resampleAudioData(float32Array, message.sample_rate, audioContext.sampleRate);
            float32Array = new Float32Array(resampledData);
          }

          // Send processed audio data to AudioWorkletProcessor
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

    // Store unsubscribe function to call on unmount
    const unsubscribeWs = webSocketManager.onMessage(MessageType.AUDIO_FRAME, handleAudioFrame);
    unsubscribeRef.current = unsubscribeWs; // Store in ref for cleanup

    // Return the unsubscribe function so it can be used in useEffect cleanup (although now handled by ref)
    return unsubscribeWs; 
  }, [initAudioContext, stopAndClearPlayback, unsubscribeRef, resampleAudioData]); // Add resampleAudioData to dependencies

  useEffect(() => {
    // New: Function to check both WebSocket and Session states and handle audio playback
    const checkAndHandleAudioPlayback = () => {
      const shouldStartAudio = (
        websocketConnectionState === WebSocketConnectionState.OPEN &&
        agentConnected === true
      );

      if (shouldStartAudio) {
        console.log('AudioStreamPlayer: WebSocket OPEN and Agent CONNECTED, starting audio playback.');
        startAudioPlayback();
      } else {
        console.log('AudioStreamPlayer: WebSocket or Agent not connected, stopping audio playback.');
        stopAndClearPlayback();
      }
    };

    checkAndHandleAudioPlayback(); // Initial check and on state changes

    // This useEffect will primarily handle cleanup.
    // The actual WebSocket unsubscribe will depend on the value in `unsubscribeRef.current`.
    return () => {
      // No longer unsubscribe from connection state changes here, as it's now driven by `websocketConnectionState` and `agentConnected` dependencies
      if (unsubscribeRef.current) {
        unsubscribeRef.current(); // Call if WebSocket message subscription happened
      }
      // Clear AudioWorkletProcessor on unmount
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.port.postMessage('clear');
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }
      // Clear AudioContext on unmount
      if (audioContextRef.current) {
        stopAndClearPlayback(); // Ensure local state is also cleared
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [stopAndClearPlayback, unsubscribeRef, startAudioPlayback, websocketConnectionState, agentConnected, resampleAudioData]); // Add resampleAudioData to dependencies

  return (
    <div className="audio-stream-player">
    </div>
  );
};

export default AudioStreamPlayer;