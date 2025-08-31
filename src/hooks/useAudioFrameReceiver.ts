import { useEffect, useRef, useCallback } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { Message, MessageType, AudioFrame } from '@/types/message'; // 导入 AudioFrame

interface AudioFrameData {
    data: Float32Array;
    sampleRate: number;
    groupTimestamp: number | undefined;
    groupId: string | undefined;
    isNewGroup: boolean;
}

interface UseAudioFrameReceiverProps {
    onFrameData: (frame: AudioFrameData) => void;
}

/**
 * useAudioFrameReceiver Hook 负责接收和处理 WebSocket AUDIO_FRAME 消息，并进行音频分组判断。
 * 它将处理后的标准化音频数据通过回调函数直接输出，不负责播放。
 */
export const useAudioFrameReceiver = ({ onFrameData }: UseAudioFrameReceiverProps) => {
    const activeGroupTimestampRef = useRef<number | undefined>(undefined);
    const activeGroupIdRef = useRef<string | undefined>(undefined);

    // 简单的线性重采样，将原始采样率的音频数据转换为目标采样率
    const resampleAudioData = useCallback((originalData: Float32Array, originalSampleRate: number, targetSampleRate: number): Float32Array => {
        if (originalSampleRate === targetSampleRate) {
            return originalData;
        }

        const ratio = targetSampleRate / originalSampleRate;
        const newLength = Math.round(originalData.length * ratio);
        const newData = new Float32Array(newLength);
        const springFactor = (originalData.length - 1) / (newLength - 1);

        for (let i = 0; i < newLength; i++) {
            const oldIndex = i * springFactor;
            const frac = oldIndex - Math.floor(oldIndex);
            const s0 = originalData[Math.floor(oldIndex)];
            const s1 = originalData[Math.ceil(oldIndex)];
            newData[i] = s0 + (s1 - s0) * frac;
        }

        return newData;
    }, []);

    const handleAudioFrame = useCallback((rawMessage: Message) => {
        if (rawMessage.type !== MessageType.AUDIO_FRAME) {
            return;
        }

        // 将 rawMessage 类型断言为 AudioFrame
        const audioFrame = rawMessage as AudioFrame;

        if (!audioFrame.buf || typeof audioFrame.sample_rate !== 'number') {
            console.warn("Invalid audio frame received: missing buf or sample_rate", audioFrame);
            return;
        }

        const pcmData = audioFrame.buf;
        const originalSampleRate = audioFrame.sample_rate;
        const currentGroupTimestamp = audioFrame.properties?.group_timestamp || undefined;
        const currentGroupId = audioFrame.properties?.group_id || undefined;

        // 判断是否是新的音频组
        const isNewGroup = currentGroupTimestamp !== activeGroupTimestampRef.current ||
                           currentGroupId !== activeGroupIdRef.current;

        // 更新当前激活的组信息
        activeGroupTimestampRef.current = currentGroupTimestamp;
        activeGroupIdRef.current = currentGroupId;

        // 将 Uint8Array PCM 数据转换为 Float32Array，并归一化到 [-1, 1]
        // 使用 DataView 确保正确处理 16-bit 小端序有符号整数
        const dataView = new DataView(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);
        const float32Array = new Float32Array(pcmData.length / 2);
        for (let i = 0; i < float32Array.length; i++) {
            const value = dataView.getInt16(i * 2, true); // true 表示小端序
            float32Array[i] = value / 32768.0;
        }

        onFrameData({
            data: float32Array,
            sampleRate: originalSampleRate,
            groupTimestamp: currentGroupTimestamp,
            groupId: currentGroupId,
            isNewGroup: isNewGroup,
        });
    }, [onFrameData, resampleAudioData]);

    useEffect(() => {
        const unsubscribeAudio = webSocketManager.onMessage(MessageType.AUDIO_FRAME, handleAudioFrame);
        return () => {
            unsubscribeAudio();
        };
    }, [handleAudioFrame]);

    return {}; // 不再返回状态或清除函数
};
