"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch, useIsCompactLayout } from "@/common";
import { webSocketManager } from "@/manager/websocket/websocket";
import {
  addChatItem,
  setVoiceType,
  setOptions,
  setWebsocketConnectionState,
} from "@/store/reducers/global";
import Avatar from "@/components/Agent/AvatarTrulience";
import TalkingheadBlock from "@/components/Agent/TalkingHead";
import { RootState } from "@/store";
import {
  IChatItem,
  EMessageType,
  EMessageDataType,
  VoiceType,
} from "@/types";
// import NetworkIndicator from "@/components/Dynamic/NetworkIndicator"; // Removed
import DynamicChatCard from "@/components/Chat/ChatCard";
import { WebSocketConnectionState } from "@/types/websocket"; // Added AudioFrame, Message
import { useMicrophoneStream } from "@/hooks/useMicrophoneStream"; // Import useMicrophoneStream
import { useWebSocketSession } from "@/hooks/useWebSocketSession"; // Import useWebSocketSession
import { useAgentSettings } from "@/hooks/useAgentSettings"; // Import useAgentSettings
import { Microphone } from "@/components/Agent/Microphone"; // Import Microphone
import AudioVisualizer from "@/components/Agent/AudioVisualizer"; // Import AudioVisualizer
import { Button } from "@/components/ui/button"; // Import Button
import { useState } from "react"; // Import useState
import VideoBlock from "@/components/Agent/VideoBlock"; // 引入 VideoBlock 组件
import { VideoSourceType } from "@/common/constant";
import {AudioFrame, Message, MessageType} from "@/types/message"; // 新增：导入 VideoSourceType

let hasInit: boolean = false;

export default function RTCCard({
  className,
  recordedChunksCount,
  downloadRecordedAudio,
}: {
  className?: string;
  recordedChunksCount: number; // Add prop
  downloadRecordedAudio: () => void; // Add prop
  onAudioDataCaptured: (audioData: Uint8Array) => void; // Add prop
}) {
  const dispatch = useAppDispatch();
  const options = useAppSelector((state: RootState) => state.global.options);
  const trulienceSettings = useAppSelector(
    (state: RootState) => state.global.trulienceSettings,
  );
  const websocketConnectionState = useAppSelector(
    (state: RootState) => state.global.websocketConnectionState,
  );
  const { userId, channel } = options;
  const [remoteAudioData, setRemoteAudioData] = React.useState<Uint8Array>();

  const isCompactLayout = useIsCompactLayout();
  const { isConnected, sessionState, defaultLocation } = useWebSocketSession();
  const { agentSettings } = useAgentSettings();
  const { mediaStreamTrack, micPermission, sendAudioFrame } = useMicrophoneStream({ isConnected, sessionState, defaultLocation, settings: agentSettings }); // Pass settings and get micPermission and sendAudioFrame
  const [audioMute, setAudioMute] = React.useState(true);
  // Live2D 控制
  const [showLive2D, setShowLive2D] = useState(false);
  const [videoSourceType, setVideoSourceType] = useState<VideoSourceType>(VideoSourceType.CAMERA); // 新增视频源类型状态
  // const onAudioDataCaptured = (audioData: Uint8Array) => {}; // Dummy function for Microphone

  // 为 VideoBlock 准备 srcLoc 和 destLocs，与音频传输保持一致
  const videoSrcLoc = React.useMemo(() => defaultLocation, [defaultLocation]); // Use useMemo to memoize the object
  const videoDestLocs = React.useMemo(() => [defaultLocation], [defaultLocation]); // Use useMemo to memoize the array

  React.useEffect(() => {
    if (!options.channel) {
      return;
    }
    init(); // 重新启用 init 调用以注册 WebSocket 消息监听器

    // Return cleanup function to disconnect only if connected and not manual disconnect
    return () => {
      // No automatic disconnect here, rely on Action.tsx stopSession
    };
  }, [options.channel]); // options.channel is the only dependency as webSocketManager.connect is removed

  const init = async () => {
    console.log("[websocket] init");
    webSocketManager.onMessage(MessageType.DATA, onTextChanged);
    webSocketManager.onMessage(MessageType.AUDIO_FRAME, onRemoteAudioTrack as (message: Message) => void);

    // await webSocketManager.connect(); // Removed automatic connect

    dispatch(
      setOptions({
        ...options,
      }),
    );
    hasInit = true;
  };

  const destory = async () => {
    console.log(`[${new Date().toISOString()}] RTCCard: Destroying WebSocket connection.`);
    webSocketManager.offMessage(MessageType.DATA, onTextChanged);
    webSocketManager.offMessage(MessageType.AUDIO_FRAME, onRemoteAudioTrack as (message: Message) => void);
    webSocketManager.disconnect();
    hasInit = false;
  };

  const onRemoteAudioTrack = (message: Message) => {
    // console.log("RTCCard: onRemoteAudioTrack called with message:", message.type);
    if (message.type === MessageType.AUDIO_FRAME) {
      // console.log("RTCCard: Full audio frame message received:", message); // Add this line to log the full message
      const audioFrame = message as AudioFrame; // Changed to AudioFrame
      // console.log(
      //   `[websocket] Received remote audio track ${audioFrame.buf.length} bytes`,
      // );
      setRemoteAudioData(audioFrame.buf); // Use audioFrame.buf for new AudioFrame
      // console.log("RTCCard: remoteAudioData updated with length:", audioFrame.buf.length);
    }
  };

  const onTextChanged = (message: Message) => {
    // console.log(`[${new Date().toISOString()}] RTCCard: onTextChanged message:`, message);
    let chatType: EMessageType | undefined;
    let chatItem: IChatItem | undefined;

    if (message.type === MessageType.DATA) {
      const dataMessage = message as Message; // Changed to Message
      if (dataMessage.content_type === "application/json" && dataMessage.data) { // Check if data exists
        try {
          const payload = JSON.parse(new TextDecoder().decode(dataMessage.data)); // Parse data as JSON
          chatType = (payload.chat_role as EMessageType) || EMessageType.AGENT;

          chatItem = {
            userId: payload.user_id || "",
            text: payload.text || "",
            data_type: payload.data_type ? (payload.data_type as EMessageDataType) : EMessageDataType.OTHER,
            type: chatType,
            isFinal: payload.is_final,
            time: payload.time || Date.now(),
            userName: payload.user_name || "",
          };
        } catch (error) {
          console.error(`[${new Date().toISOString()}] RTCCard: Error parsing JSON data:`, error);
        }
      } else if (dataMessage.data) {
        const textContent = new TextDecoder().decode(dataMessage.data); // Use dataMessage.data
        chatType = EMessageType.AGENT;
        chatItem = {
          userId: dataMessage.name || "", // Use dataMessage.name
          text: textContent,
          data_type: EMessageDataType.TEXT,
          type: chatType,
          isFinal: dataMessage.is_eof, // Use dataMessage.is_eof
          time: dataMessage.timestamp || Date.now(), // Use dataMessage.timestamp
          userName: dataMessage.name || "Agent", // Use dataMessage.name
        };
      } else {
        // console.warn(`[${new Date().toISOString()}] RTCCard: Received unexpected Message message content type: ${dataMessage.content_type || 'N/A'}`, dataMessage);
      }
    }
     else {
      // console.warn(`[${new Date().toISOString()}] RTCCard: Received unexpected message type for chat item: ${message.type || 'N/A'}`, message);
    }

    if (chatType && chatItem) {
      dispatch(addChatItem(chatItem));
    }
     else {
      // console.warn(`[${new Date().toISOString()}] RTCCard: Failed to determine chatType or chatItem for message. Message Type: ${message.type || 'N/A'}`, message);
    }
  };

  const onVoiceChange = (value: VoiceType) => {
    dispatch(setVoiceType(value));
  };

  return (
    <div className={cn("flex h-full flex-col min-h-0 bg-gray-50 flex-1 min-w-[400px]", className)}> {/* Added min-w-[400px] */}
      {(
        <div className="flex-1 min-h-[500px] z-10 relative bg-white rounded-lg shadow-lg border border-gray-200"> {/* Combined classes */}
          {/* TalkingHead 区域 */}
          <div className="h-full w-full">
            {showLive2D && (
              <div
                style={{ height: '100%', width: '100%' }}
                className="absolute inset-0"
              >
                {/* console.log("RTCCard: Passing audioTrack to TalkingHead. audioMute:", audioMute, "remoteAudioData length:", remoteAudioData?.length, "remoteAudioData content (first 20 bytes):"), remoteAudioData?.slice(0, 20) */}
                <TalkingheadBlock audioTrack={remoteAudioData} /> {/* Use remoteAudioData for TalkingHead */}
              </div>
            )}
            {/* Live2D Control Button */}
            <div className="absolute bottom-3 right-3 z-20">
              <Button
                variant="outline"
                className={cn("border-secondary bg-transparent", showLive2D ? "text-white" : "text-black")} // Dynamic text color
                onClick={() => setShowLive2D(!showLive2D)}
              >
                {showLive2D ? '隐藏 Live2D' : '显示 Live2D'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom region for microphone and video blocks */}
      <div className="w-full space-y-2 px-2 py-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto"> {/* Added overflow-y-auto */}
        {/* Microphone control area */}
        <Microphone
          onMuteChange={setAudioMute}
          isConnected={isConnected}
          sessionState={sessionState}
          defaultLocation={defaultLocation}
          recordedChunksCount={recordedChunksCount}
          downloadRecordedAudio={downloadRecordedAudio}
          onRawAudioDataAvailable={(audioData) => {
            sendAudioFrame(audioData);
            // onAudioDataCaptured(audioData);
          }} // Pass raw audio data to sendAudioFrame and onAudioDataCaptured
        />

        {/* Audio Visualizer area */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            音频可视化 {audioMute ? '(已静音)' : '(录音中)'}
          </div>
          <div className="flex h-10 flex-col items-center justify-center gap-2 self-stretch rounded-md border border-gray-200 bg-gray-50 p-2">
            {micPermission === 'granted' && !audioMute ? (
              <AudioVisualizer
                type="user"
                barWidth={3}
                minBarHeight={2}
                maxBarHeight={16} // Added missing prop
                borderRadius={2}
                gap={3}
                track={audioMute ? undefined : mediaStreamTrack}
              />
            ) : micPermission === 'denied' ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-center text-gray-500">麦克风权限被拒绝</p>
              </div>
            ) : audioMute ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-center text-gray-500">麦克风已静音</p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-center text-gray-500">请求麦克风权限中...</p>
              </div>
            )}
          </div>
        </div>

        {/* Video Block area */}
        <VideoBlock
          videoSourceType={videoSourceType}
          onVideoSourceChange={setVideoSourceType}
          srcLoc={videoSrcLoc} // 传递 srcLoc
          destLocs={videoDestLocs} // 传递 destLocs
          isConnected={isConnected} // 传递 isConnected
        />
      </div>
    </div>
  );
}
