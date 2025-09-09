import { useState, useRef, useEffect, useCallback } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { SessionConnectionState } from "@/types/websocket";
import { Location } from '@/types/message';
import { audioManager } from '@/manager/audio/AudioManager';
import { useAppSelector } from '@/common/hooks'; // 导入 useAppSelector

const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 5000,
};

interface UseUserMicrophoneStreamProps {
  defaultLocation: Location;
  sessionState: SessionConnectionState;
}

interface UseUserMicrophoneStreamReturn {
  isStreaming: boolean;
  audioLevel: number;
  micPermission: 'granted' | 'denied' | 'pending';
  error?: string;
}

// 新增 VAD 常量，参考旧版本 Microphone.tsx
const SILENCE_THRESHOLD = 0.005; // 定义静音阈值，根据需要调整
const MAX_SILENT_FRAMES = 15; // 允许通过的最大连续静音帧数，增加以避免影响 ASR 断句

export const useUserMicrophoneStream = ({ defaultLocation, sessionState}: UseUserMicrophoneStreamProps): UseUserMicrophoneStreamReturn => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);

  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionStateRef = useRef<SessionConnectionState>(sessionState);
  const isAudioProcessingActiveRef = useRef(false);
  
  const audioBufferRef = useRef<Uint8Array[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const silentFrameCountRef = useRef(0); // 新增：用于跟踪连续静音帧数
 
  const isMicrophoneMuted = useAppSelector(state => state.global.isMicrophoneMuted); // 获取麦克风静音状态

  const calculateRetryDelay = (retryCount: number): number => {
    const delay = Math.min(
      RETRY_CONFIG.BASE_DELAY * Math.pow(2, retryCount),
      RETRY_CONFIG.MAX_DELAY
    );
    return delay + Math.random() * 100;
  };

  const resetRetryState = useCallback((): void => {
    retryCountRef.current = 0;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // 新增：音频重采样函数，将 Int16Array 从原始采样率重采样到目标采样率
  const resampleInt16Data = useCallback((
    originalInt16Data: Int16Array,
    originalSampleRate: number,
    targetSampleRate: number
  ): Int16Array => {
    if (originalSampleRate === targetSampleRate) {
      return originalInt16Data;
    }

    // 将 Int16Array 转换为 Float32Array 进行重采样
    const originalFloat32Data = new Float32Array(originalInt16Data.length);
    for (let i = 0; i < originalInt16Data.length; i++) {
      originalFloat32Data[i] = originalInt16Data[i] / 32767.0; // 归一化到 -1.0 到 1.0
    }

    const ratio = targetSampleRate / originalSampleRate;
    const newLength = Math.round(originalFloat32Data.length * ratio);
    const resampledFloat32Data = new Float32Array(newLength);

    // 线性插值重采样
    for (let i = 0; i < newLength; i++) {
      const originalIndex = i / ratio;
      const indexLower = Math.floor(originalIndex);
      const indexUpper = Math.ceil(originalIndex);

      if (indexUpper >= originalFloat32Data.length) {
        resampledFloat32Data[i] = originalFloat32Data[originalFloat32Data.length - 1];
      } else if (indexLower < 0) {
        resampledFloat32Data[i] = originalFloat32Data[0];
      } else {
        const weightUpper = originalIndex - indexLower;
        const weightLower = 1 - weightUpper;
        resampledFloat32Data[i] = (
          originalFloat32Data[indexLower] * weightLower +
          originalFloat32Data[indexUpper] * weightUpper
        );
      }
    }

    // 将重采样后的 Float32Array 转换回 Int16Array
    const resampledInt16Data = new Int16Array(newLength);
    for (let i = 0; i < newLength; i++) {
      resampledInt16Data[i] = Math.max(-32768, Math.min(32767, Math.round(resampledFloat32Data[i] * 32767.0)));
    }

    return resampledInt16Data;
  }, []);

  const stopMicrophoneStream = useCallback((): void => {
    isAudioProcessingActiveRef.current = false;
    
    audioManager.stopMicrophoneStream();

    setIsStreaming(false);
    setAudioLevel(0);
    setError(undefined);
    resetRetryState();
  }, [resetRetryState]);
 
  // 声明 startMicrophoneStreamInternal，以便 handleMicrophoneError 可以引用它
  const startMicrophoneStreamInternal = useCallback(async () => {
    setError(undefined);
    resetRetryState();

    if (micPermission === 'denied' || sessionState !== SessionConnectionState.SESSION_ACTIVE) {
      setError("无法开始麦克风流：权限不足或会话未激活。");
      setIsStreaming(false);
      setMicPermission('denied');
      return;
    }

    // 如果麦克风被静音，则不启动流
    if (isMicrophoneMuted) {
      console.log("麦克风已静音，不启动麦克风流。");
      stopMicrophoneStream(); // 确保停止任何可能的现有流
      return;
    }

    try {
      // 确保 AudioManager 已初始化
      await audioManager.init();
      if (!audioManager.getIsInitialized()) {
        throw new Error("AudioManager failed to initialize.");
      }

      setMicPermission('pending');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setMicPermission('granted');

      await audioManager.startMicrophoneStream(stream);

      const unsubscribe = audioManager.onInputMessage((message) => {
        if (!isAudioProcessingActiveRef.current) return;

        // 只有当消息类型为 'audioFrame' 时才处理音频数据
        if (message.type !== 'audioFrame') {
          console.log('Received non-audioFrame message from AudioWorklet:', message);
          return;
        }

        const { frameId, data: audioData, audioLevel: currentAudioLevel } = message;
        
        setAudioLevel(currentAudioLevel || 0);
 
        const currentSrcLoc: Location = defaultLocation;
        const currentDestLocs: Location[] = [defaultLocation];
        
        // 音频数据现在是 Int16Array (48000Hz)，需要重采样到 16000Hz
        const originalInt16Data = audioData as Int16Array;
        const resampledInt16Data = resampleInt16Data(originalInt16Data, 48000, 16000);
 
        // 计算重采样后数据的平均绝对值，用于静音检测
        let sumAbs = 0;
        for (let i = 0; i < resampledInt16Data.length; i++) {
          sumAbs += Math.abs(resampledInt16Data[i]);
        }
        const averageAbs = sumAbs / resampledInt16Data.length;
 
        // 将重采样后的 Int16Array 的 buffer 转换为 Uint8Array
        const uint8AudioData = new Uint8Array(resampledInt16Data.buffer);
 
        // 如果平均绝对值低于阈值
        if (averageAbs < SILENCE_THRESHOLD * 32767) { // 注意：这里 0x7fff 等价于 32767
          silentFrameCountRef.current += 1;
          if (silentFrameCountRef.current >= MAX_SILENT_FRAMES) {
            // 连续静音帧数超过阈值，跳过发送
            return; 
          } 
        } else {
          // 检测到非静音帧，重置计数器
          silentFrameCountRef.current = 0;
        }
 
        // 无论是否静音，只要未达到最大静音帧数，都发送
        audioBufferRef.current.push(uint8AudioData);
        try {
          webSocketManager.sendAudioFrame(
            uint8AudioData,
            currentSrcLoc,
            currentDestLocs,
            "pcm_frame",
            16000, // 后端 ASR 采样率
            1,
            16,
            false
          );
        } catch (error) {
          console.error(`WebSocket发送失败: ${error}`);
          setError(`WebSocket发送失败: ${error}`);
        }
      });
      // TODO: 确保在组件卸载时取消订阅
      unsubscribeRef.current = unsubscribe;

      setIsStreaming(true);
      isAudioProcessingActiveRef.current = !isMicrophoneMuted; // 根据静音状态设置处理是否激活

    } catch (error) {
      console.error(`无法访问麦克风或启动音频流: ${error}`);
      setError(`无法访问麦克风或启动音频流: ${error}`);
      setIsStreaming(false);
      setMicPermission('denied');

      // 错误恢复机制
      if (retryCountRef.current < RETRY_CONFIG.MAX_RETRIES) {
        const delay = calculateRetryDelay(retryCountRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          retryCountRef.current++;
          startMicrophoneStreamInternal(); // 再次调用自身进行重试
        }, delay);
      } else {
        console.error('❌ 麦克风重试次数已达上限，停止重试。');
        setError('麦克风重试次数已达上限，停止重试。');
      }
    }
  }, [micPermission, sessionState, defaultLocation, resetRetryState, isMicrophoneMuted, stopMicrophoneStream, resampleInt16Data]);

  const handleMicrophoneError = useCallback((errorMessage: string): void => {
    // 这个函数现在主要用于设置错误状态，实际的重试逻辑已合并到 startMicrophoneStreamInternal
    console.error(`❌ 麦克风错误: ${errorMessage}`);
    setError(errorMessage);
    setIsStreaming(false);
    setMicPermission('denied');
    // isAudioProcessingActiveRef.current = false; // 移除，由 useEffect 统一控制
  }, []);

  useEffect(() => {
    sessionStateRef.current = sessionState;

    // 统一在这里根据 sessionState 和 isMicrophoneMuted 状态来控制流的启停
    if (sessionState === SessionConnectionState.SESSION_ACTIVE && !isMicrophoneMuted) {
      if (!isStreaming) {
        console.log("排查日志: 会话激活且麦克风未静音，启动麦克风流。");
        startMicrophoneStreamInternal();
      }
    } else if (isStreaming) { // 如果麦克风静音或会话未激活，且当前正在流式传输，则停止流
      console.log("排查日志: 会话未激活或麦克风已静音，停止麦克风流。");
      stopMicrophoneStream();
    }
 
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [sessionState, isStreaming, isMicrophoneMuted, startMicrophoneStreamInternal, stopMicrophoneStream]);

  useEffect(() => {
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result: PermissionStatus) => {
      if (result.state === 'granted') {
        setMicPermission('granted');
      } else if (result.state === 'denied') {
        setMicPermission('denied');
      } else {
        setMicPermission('pending');
      }
    }).catch(() => {
      setMicPermission('denied');
    });
  }, []);

  return {
    isStreaming,
    audioLevel,
    micPermission,
    error,
  };
};