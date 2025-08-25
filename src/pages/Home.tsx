import React from "react";
import { useAppSelector, EMobileActiveTab } from "@/common";
import Header from "@/components/Layout/Header";
import Action from "@/components/Layout/Action";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ChatCard from "@/components/Chat/ChatCard";
import { useWebSocketSession } from "@/hooks/useWebSocketSession";
import { performanceMonitor } from "@/common/utils";
import AuthInitializer from "@/components/authInitializer"; // Add AuthInitializer import
import RTCCard from "@/components/Dynamic/RTCCard"; // Import RTCCard
import { RootState } from "@/store"; // Import RootState
import { WebSocketConnectionState } from "@/types/websocket"; // Import WebSocketConnectionState
import { useAudioRecorder } from "@/hooks/useAudioRecorder"; // 启用 useAudioRecorder hook
import { VoiceSelection } from "@/components/Settings/VoiceSelection"; // Import VoiceSelection

function Home() {
  try {
    const mobileActiveTab = useAppSelector(
      (state) => state.global.mobileActiveTab,
    );
    const websocketConnectionState = useAppSelector((state: RootState) => state.global.websocketConnectionState); // Get from Redux

    const { recordedChunksCount, onAudioDataCaptured, downloadRecordedAudio } = useAudioRecorder(); // 启用 useAudioRecorder hook

    return (
      <AuthInitializer>
        <div className="relative mx-auto flex flex-1 min-h-screen flex-col md:h-screen bg-gray-50">
          <Header className="h-[60px]" />
          <Action />
          <div className="mx-2 mb-2 flex flex-col md:flex-row md:gap-2 flex-1">
            {/* RTC 区域 - 使用固定宽度，移除 flex-1 限制 */}
            <div className={cn(
              "m-0 w-full rounded-b-lg bg-white shadow-lg border border-gray-200 md:w-[400px] md:rounded-lg",
              {
                ["hidden md:block"]: mobileActiveTab === EMobileActiveTab.CHAT,
              },
            )}>
              <div className="flex h-full flex-col min-h-0 bg-gray-50 w-full">
                <RTCCard className="flex-1" recordedChunksCount={recordedChunksCount} downloadRecordedAudio={downloadRecordedAudio} onAudioDataCaptured={onAudioDataCaptured} />
              </div>
            </div>

            {/* 聊天区域 */}
            <div className="m-0 w-full rounded-b-lg bg-white shadow-lg border border-gray-200 md:rounded-lg md:flex-1 relative"> {/* Add relative positioning */}
              <div className="h-full flex flex-col">
                <div className="p-4 border-b relative z-20 flex items-center justify-between"> {/* Add border-b, relative, z-20, pr-24, and pb-10 */}
                  <div className=""> {/* Position VoiceSelection here, remove z-index as parent has it */}
                    {/* Placeholder for other content that might be on the left */}
                  </div>
                  <div> {/* Wrap VoiceSelection in a div to ensure proper centering with justify-between */}
                    <VoiceSelection />
                  </div>
                  {/* <ConnectionTest /> */}
                </div>
                <div className="flex-1"> {/* Removed border-b here */}
                  <ChatCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthInitializer>
    );
  } catch (error) {
    console.error('Home component error:', error);
    return (
      <div className="relative mx-auto flex flex-1 min-h-screen flex-col md:h-screen bg-gray-50">
        <div className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-center">
          <h1 className="text-xl font-semibold">Ten Chat WebSocket</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">应用加载中...</h2>
            <p className="text-gray-600">正在初始化组件...</p>
            <p className="text-red-500 mt-2">错误: {error instanceof Error ? error.message : String(error)}</p>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;