import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { WebSocketConnectionState } from '@/types/websocket';
import { audioManager } from '@/manager/audio/AudioManager'; // 导入 AudioManager

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
}

export const useAudioPlayer = (): UseAudioPlayerReturn => {
    const [isPlaying, setIsPlaying] = useState(false);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    const websocketConnectionState = useSelector((state: RootState) => state.global.websocketConnectionState);
    const agentConnected = useSelector((state: RootState) => state.global.agentConnected);

    const stopPlayback = useCallback(() => {
        audioManager.stopAudioPlayback();
        setIsPlaying(false);
    }, []);

    const startPlayback = useCallback(async () => {
        const unsubscribe = audioManager.onOutputMessage((message) => {
            if (message.type === 'playing') {
                setIsPlaying(true);
            } else if (message.type === 'stopped') {
                setIsPlaying(false);
            }
        });
        unsubscribeRef.current = unsubscribe;
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

    const processAudioFrame = useCallback((frame: AudioFrameData) => {
        const audioContext = audioManager.getAudioContext();
        if (!audioContext) {
            return;
        }

        if (frame.isNewGroup) {
            audioManager.stopAudioPlayback(); // 清空播放队列
        }

        let float32Array = frame.data;

        if (frame.sampleRate !== audioContext.sampleRate) {
            const resampledData = resampleAudioData(float32Array, frame.sampleRate, audioContext.sampleRate);
            float32Array = new Float32Array(resampledData);
        }

        audioManager.playAudioFrame(float32Array);
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
        }

        return () => {
            if (unsubscribeRef.current) {
              unsubscribeRef.current();
              unsubscribeRef.current = null;
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
