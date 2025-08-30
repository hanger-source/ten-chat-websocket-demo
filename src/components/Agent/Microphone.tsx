"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MicIcon } from "@/components/icons/mic";
import MicrophoneDeviceSelect from "@/components/Agent/MicrophoneDeviceSelect"; // Import MicrophoneDeviceSelect
import { SessionConnectionState } from "@/types/websocket";
import { useAgentSettings } from "@/hooks/useAgentSettings";
import {Location} from "@/types/message"; // Import useAgentSettings
import { useAppDispatch, useAppSelector } from "@/common/hooks"; // 导入 useAppDispatch 和 useAppSelector
import { setMicrophoneMuted } from "@/store/reducers/global"; // 导入 setMicrophoneMuted action

const SILENCE_THRESHOLD = 0.005; // 定义静音阈值，根据需要调整
const MAX_SILENT_FRAMES = 15; // 允许通过的最大连续静音帧数，增加以避免影响 ASR 断句

interface MicrophoneProps {
  isConnected: boolean;
  sessionState: SessionConnectionState;
  defaultLocation: Location;
  onRawAudioDataAvailable?: (audioData: Uint8Array) => void; // New prop for raw audio data
}

export const Microphone: React.FC<MicrophoneProps> = ({
  isConnected,
  sessionState,
  onRawAudioDataAvailable, // Destructure new prop
}) => {
  const dispatch = useAppDispatch();
  const isMicrophoneMuted = useAppSelector(state => state.global.isMicrophoneMuted);
  const selectedMicDeviceId = useAppSelector(state => state.global.selectedMicDeviceId); // 从 Redux 获取 selectedMicDeviceId
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [microphone, setMicrophone] = useState<MediaStreamAudioSourceNode | null>(null);
  const [scriptProcessor, setScriptProcessor] = useState<ScriptProcessorNode | null>(null);
  const [mediaStreamTrack, setMediaStreamTrack] = useState<MediaStreamTrack | null>(null);
  const silentFrameCountRef = useRef(0); // 将 useState 替换为 useRef

  // 移除 audioMuteRef 及其相关的 useEffect
  const isConnectedRef = useRef(isConnected);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]); // 依赖 Redux 状态

  const { agentSettings, updateSettings } = useAgentSettings(); // Use agent settings

  useEffect(() => {
    // console.log(`[MICROPHONE_LOG] useEffect triggered. isMicrophoneMuted: ${isMicrophoneMuted}, isConnected: ${isConnected}, sessionState: ${sessionState}`);
    if (!isMicrophoneMuted && isConnected && sessionState === SessionConnectionState.SESSION_ACTIVE) { // 使用 Redux 状态
      startMicrophone();
    } else {
      stopMicrophone();
    }
    return () => {
    };
  }, [isMicrophoneMuted, isConnected, sessionState, agentSettings.auto_gain_control, agentSettings.noise_suppression, agentSettings.echo_cancellation, selectedMicDeviceId]); // 添加 selectedMicDeviceId 依赖

  // 新增 useEffect，直接控制 mediaStreamTrack 的 enabled 属性
  useEffect(() => {
    if (mediaStreamTrack) {
      // console.log(`[MICROPHONE_LOG] mediaStreamTrack enabled status changed to: ${!isMicrophoneMuted}`);
      mediaStreamTrack.enabled = !isMicrophoneMuted;
    }
  }, [isMicrophoneMuted, mediaStreamTrack]);

  const startMicrophone = async () => {
    try {
      // 配置音频约束，禁用音频处理
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: agentSettings.echo_cancellation,
        noiseSuppression: agentSettings.noise_suppression,
        autoGainControl: agentSettings.auto_gain_control,
        // 设置较高的采样率以获得更好的音质
        sampleRate: 16000,
        channelCount: 1,
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMicDeviceId ? { deviceId: selectedMicDeviceId, ...audioConstraints } : audioConstraints // 使用 selectedMicDeviceId
      });

      const track = stream.getAudioTracks()[0];
      setMediaStreamTrack(track);

      // 检查实际应用的约束
      const settings = track.getSettings();
      console.log("音频设置:", {
        echoCancellation: settings.echoCancellation,
        noiseSuppression: settings.noiseSuppression,
        autoGainControl: settings.autoGainControl,
        sampleRate: settings.sampleRate,
        channelCount: settings.channelCount,
      });

      const context = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 16000 }); // 修正 window.webkitAudioContext 的类型转换错误, 并指定采样率
      setAudioContext(context);

      const source = context.createMediaStreamSource(stream);
      setMicrophone(source);

      // Create a ScriptProcessorNode to process audio data
      const processor = context.createScriptProcessor(2048, 1, 1); // bufferSize, inputChannels, outputChannels
      setScriptProcessor(processor);

      processor.onaudioprocess = (event) => {
        // console.log(`[MICROPHONE_LOG] onaudioprocess triggered. isMicrophoneMuted: ${isMicrophoneMuted}`);
        if (!isMicrophoneMuted && isConnectedRef.current && sessionState === SessionConnectionState.SESSION_ACTIVE) { // 直接使用 isMicrophoneMuted
          const inputBuffer = event.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputBuffer.length);
          for (let i = 0; i < inputBuffer.length; i++) {
            // Convert float to 16-bit PCM
            pcmData[i] = Math.max(-1, Math.min(1, inputBuffer[i])) * 0x7fff;
          }
          const pcmUint8 = new Uint8Array(pcmData.buffer);

          // 计算PCM数据的平均绝对值，用于静音检测
          let sumAbs = 0;
          for (let i = 0; i < pcmData.length; i++) {
            sumAbs += Math.abs(pcmData[i]);
          }
          const averageAbs = sumAbs / pcmData.length;

          // 如果平均绝对值低于阈值
          if (averageAbs < SILENCE_THRESHOLD * 0x7fff) {
            // 增加静音帧计数器
            silentFrameCountRef.current += 1; // 直接更新 ref 的 current 值
            // console.log(`排查日志: MicrophoneBlock: 检测到静音帧 (平均幅度: ${averageAbs.toFixed(2)})，当前连续静音帧数: ${silentFrameCountRef.current}`);

            // 如果连续静音帧数超过阈值，则跳过发送
            if (silentFrameCountRef.current >= MAX_SILENT_FRAMES) {
              // console.log(`排查日志: MicrophoneBlock: 连续静音帧数 (${silentFrameCountRef.current}) 超过阈值 (${MAX_SILENCE_THRESHOLD})，跳过发送。`); // 修正日志中的阈值名称
            } else {
              // 否则，即使是静音帧也发送，以保持ASR的连续性
              onRawAudioDataAvailable?.(pcmUint8);
            }
          } else {
            // 检测到非静音帧，重置计数器并发送
            silentFrameCountRef.current = 0; // 直接更新 ref 的 current 值
            onRawAudioDataAvailable?.(pcmUint8);
          }
        }
      };

      source.connect(processor);
      processor.connect(context.destination);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      dispatch(setMicrophoneMuted(true)); // 如果出错，静音麦克风，更新 Redux 状态
    }
  };

  const stopMicrophone = () => {
    // console.log('MicrophoneBlock: stopMicrophone called');
    if (microphone) {
      microphone.disconnect();
      // console.log('MicrophoneBlock: microphone disconnected');
      setMicrophone(null); // Ensure state is updated to null
    }
    if (scriptProcessor) {
      scriptProcessor.onaudioprocess = null; // Explicitly stop processing
      scriptProcessor.disconnect();
      // console.log('MicrophoneBlock: scriptProcessor disconnected and onaudioprocess set to null');
      setScriptProcessor(null); // Ensure state is updated to null
    }
    if (audioContext) {
      audioContext.close().then(() => {
        // console.log('MicrophoneBlock: audioContext closed');
        setAudioContext(null);
      }).catch(error => {
        // console.error('MicrophoneBlock: Failed to close audioContext', error);
      });
    }
    if (mediaStreamTrack) {
      mediaStreamTrack.stop();
      setMediaStreamTrack(null);
      // console.log('MicrophoneBlock: mediaStreamTrack stopped');
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center gap-3"> {/* Use gap for spacing */} 
        <div className="text-sm font-medium">麦克风</div>
        <MicrophoneDeviceSelect />
        <Button
          variant="outline"
          size="icon"
          className="border-secondary bg-transparent"
          onClick={() => dispatch(setMicrophoneMuted(!isMicrophoneMuted))} // 直接 dispatch action
        >
          <MicIcon className="h-5 w-5" active={!isMicrophoneMuted} />
        </Button>
          {/* Removed: Download Button */}
          {/* <Button
            variant="outline"
            size="sm"
            onClick={downloadRecordedAudio}
            disabled={recordedChunksCount === 0}
          >
            下载录音 ({recordedChunksCount})
          </Button> */}
        </div>
    </div>
  );
};
