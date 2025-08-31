import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { WebSocketConnectionState } from '@/types/websocket';
import audioProcessorString from '@/manager/websocket/audio-processor.js?raw';

interface AudioFrameData {
    data: Float32Array;
    sampleRate: number;
    groupTimestamp?: number;
    groupId?: string;
    isNewGroup: boolean;
}

interface UseAudioPlayerReturn {
    isPlaying: boolean;
    startPlayback: () => void;
    stopPlayback: () => void;
    processAudioFrame: (frame: AudioFrameData) => void;
    // 其他控制方法，例如暂停/恢复
}

/**
 * useAudioPlayer Hook 负责管理底层的音频播放资源（AudioContext、AudioWorkletNode）
 * 并提供播放控制逻辑。它消费处理后的音频帧。
 */
export const useAudioPlayer = (): UseAudioPlayerReturn => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const websocketConnectionState = useSelector((state: RootState) => state.global.websocketConnectionState);
    const agentConnected = useSelector((state: RootState) => state.global.agentConnected);

    const initAudioContext = useCallback(async () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            try {
                const audioWorkletBlob = new Blob([audioProcessorString], { type: 'application/javascript' });
                const audioWorkletBlobUrl = URL.createObjectURL(audioWorkletBlob);
                await audioContextRef.current.audioWorklet.addModule(audioWorkletBlobUrl);
                URL.revokeObjectURL(audioWorkletBlobUrl); // Clean up the Blob URL after use
            } catch (error) {
                console.error('useAudioPlayer: Failed to add AudioWorklet module:', error);
            }
        }
        if (audioContextRef.current.state === 'suspended') {
            try {
                await audioContextRef.current.resume();
            } catch (error) {
                console.error('useAudioPlayer: Failed to resume AudioContext:', error);
            }
        }
        return audioContextRef.current;
    }, []);

    const stopPlayback = useCallback(() => {
        if (audioWorkletNodeRef.current) {
            audioWorkletNodeRef.current.port.postMessage('clear');
        }
        setIsPlaying(false);
    }, []);

    const startPlayback = useCallback(async () => {
        const audioContext = await initAudioContext();
        if (!audioContext) {
            console.error('useAudioPlayer: AudioContext not initialized, cannot setup AudioWorkletNode.');
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
        // setIsPlaying(true); // 移除：isPlaying 状态现在由 AudioWorklet Processor 控制
    }, [initAudioContext]);

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

    const processAudioFrame = useCallback((frame: AudioFrameData) => {
        if (!audioWorkletNodeRef.current || !audioContextRef.current) {
            console.warn('useAudioPlayer: AudioWorkletNode or AudioContext not initialized, cannot process audio frame.');
            return;
        }

        // 如果是新分组的第一帧，先清空 AudioWorkletNode 的缓冲区
        if (frame.isNewGroup) {
            audioWorkletNodeRef.current.port.postMessage('clear');
        }

        let float32Array = frame.data;

        // 重采样音频数据，如果采样率不匹配
        if (frame.sampleRate !== audioContextRef.current.sampleRate) {
            const resampledData = resampleAudioData(float32Array, frame.sampleRate, audioContextRef.current.sampleRate);
            float32Array = new Float32Array(resampledData);
        }

        audioWorkletNodeRef.current.port.postMessage(float32Array);
    }, [resampleAudioData]);

    useEffect(() => {
        const shouldStartAudio = (
            websocketConnectionState === WebSocketConnectionState.OPEN &&
            agentConnected === true
        );

        if (shouldStartAudio) {
            startPlayback();
        } else {
            stopPlayback();
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
            // Cleanup on unmount
            if (audioWorkletNodeRef.current) {
                audioWorkletNodeRef.current.port.postMessage('clear');
                audioWorkletNodeRef.current.disconnect();
                audioWorkletNodeRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(console.error);
                audioContextRef.current = null;
            }
        };
    }, [websocketConnectionState, agentConnected, startPlayback, stopPlayback]);

    return {
        isPlaying,
        startPlayback,
        stopPlayback,
        processAudioFrame,
    };
};
