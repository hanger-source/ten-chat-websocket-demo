import React, { useCallback, useState, useRef, useEffect } from 'react'; // 移除了 useEffect 的导入，因为它将不再被用于处理 audioFrames
import { cn } from '@/lib/utils';
import ChatCamera from "./ChatCamera";
// import ChatCard from "@/components/Chat/ChatCard";
import Draggable from 'react-draggable';
import ChatControls from "./ChatControls";
import { useChatMessages } from '@/hooks/useChatMessages';
import { useAudioFrameReceiver } from '@/hooks/useAudioFrameReceiver'; // 现在接受 onFrameData 回调
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useWebSocketEvents } from '@/hooks/useWebSocketEvents';
import MessageListRenderer from './MessageListRenderer';
import { useSelectedScene } from '@/hooks/useSelectedScene'; // 导入 useSelectedScene
import { isMobile } from '@/common/utils'; // 导入 isMobile 函数
import ChatInput from './ChatInput'; // 导入 ChatInput 组件
import { v4 as uuidv4 } from 'uuid'; // 导入 uuidv4 用于生成唯一 ID
import { EMessageType, ITextMessage } from '@/types/chat'; // 导入 EMessageType 和 ITextMessage
import { SessionConnectionState } from '@/types/websocket'; // 导入 SessionConnectionState
import { useWebSocketSession } from '@/hooks/useWebSocketSession'; // 导入 useWebSocketSession
import { useUserMicrophoneStream } from '@/hooks/useUserMicrophoneStream'; // 导入 useUserMicrophoneStream
import AIAudioControls from './AIAudioControls'; // 导入 AIAudioControls

interface HomeMainChatProps {
  className?: string;
}

const HomeMainChat = ({ className }: HomeMainChatProps) => {
  console.log("[DEBUG_HOME_MAIN_CHAT] HomeMainChat rendered.");
  const mainRef = React.useRef<HTMLDivElement>(null);
  const cameraRef = React.useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLFormElement>(null); // 创建 chatInputRef

  // 跟踪 ChatInput 的展开状态
  const [isChatInputExpanded, setIsChatInputExpanded] = useState(false);

  // 使用新的 Hooks
  const { chatMessages, addChatMessage, clearMessages } = useChatMessages(); // 获取 addChatMessage 和 clearMessages
  const { processAudioFrame, stopPlayback, isPlaying } = useAudioPlayer(); // 获取 isPlaying 状态
  const { sessionState, defaultLocation } = useWebSocketSession(); // 从 useWebSocketSession 获取 sessionState、defaultLocation、activeAppUri 和 activeGraphId
  // 将 processAudioFrame 直接作为回调传递给 useAudioFrameReceiver
  useAudioFrameReceiver({ onFrameData: processAudioFrame });
  useWebSocketEvents();
  const { selectedScene } = useSelectedScene(); // 获取 selectedScene
  const aiAvatarUrl = selectedScene?.iconSrc; // 提取 AI 头像 URL
  const aiPersonaName = selectedScene?.aiPersonaName; // 提取 AI 角色名称
  const userName = "我"; // 临时用户名称，可以根据实际情况从全局状态或用户配置中获取

  // 处理用户发送消息的回调函数
  const handleUserSendMessage = useCallback((message: { text: string; role: 'user' }) => {
    const newUserMessage: ITextMessage = {
      id: uuidv4(), // 生成唯一 ID
      role: EMessageType.USER,
      timestamp: Date.now(),
      type: 'text',
      payload: { text: message.text },
      isFinal: true, // 用户发送的消息通常是最终的
    };
    addChatMessage(newUserMessage); // 使用 addChatMessage 添加消息
  }, [addChatMessage]);

  // 根据是否是手机端，设置不同的头像尺寸
  const avatarSize = isMobile() ? '30%' : '15%'; // 手机端设置为 30%，非手机端保持 15%

  const isMobileDevice = isMobile(); // 获取是否是手机端

  // 处理手机端点击外部收起 ChatInput 的逻辑
  useEffect(() => {
    if (!isMobileDevice || !isChatInputExpanded) return;

    const handleClickOutside = (event: TouchEvent | MouseEvent) => {
      const target = event.target as Node;
      const isOutside = chatInputRef.current && !chatInputRef.current.contains(target);
      if (isOutside) {
        setIsChatInputExpanded(false);
      }
    };

    // 延迟添加监听器，避免立即触发
    const timeoutId = setTimeout(() => {
      document.addEventListener('touchstart', handleClickOutside, { capture: true });
      document.addEventListener('click', handleClickOutside, { capture: true });
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isMobileDevice, isChatInputExpanded]);

  // 监听 sessionState 变化，通话开始时清除聊天记录
  useEffect(() => {
    if (sessionState === SessionConnectionState.SESSION_ACTIVE) {
      console.log("排查日志: 通话开始，清除历史聊天记录"); // 添加排查日志
      clearMessages();
    }
  }, [sessionState, clearMessages]);

  return (
    <div ref={mainRef} className={cn("flex-1 flex flex-col items-center p-4 bg-gray-50 rounded-lg relative", className)}>

      {/* 用户摄像头/屏幕预览区域 - 可拖动 */}
      <Draggable nodeRef={cameraRef} bounds="parent" defaultPosition={{x: 0, y: 0}}>
        <div
          ref={cameraRef}
          className={cn(
            "z-10 flex flex-col",
            isMobileDevice
              ? "absolute bottom-[180px] right-4 w-48 h-36" // 调整为更合适的高度 (bottom-[80px])
              : "absolute top-[40px] right-8 w-64 h-48"
          )} // 根据设备类型调整定位和尺寸
        >
          <ChatCamera />
        </div>
      </Draggable>

      {/* 顶部 AI 形象和会话消息列表区域的容器 */}
      <div className="flex flex-1 flex-col w-full min-h-0 relative"> {/* 确保 relative 定位 */}
        {/* 半透明的 AI 头像背景图片 */}
        {aiAvatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={aiAvatarUrl}
            alt="AI Avatar Background"
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain z-0 rounded-full",
              isPlaying ? "animate-glow-pulse" : ""
            )}
            style={{
              width: avatarSize, // 动态调整尺寸
              height: 'auto', // 保持图片比例
              opacity: 0.50, // 设置透明度为 50%
            }}
          />
        )}
        {/* 会话消息列表区域 - 使用新的 MessageListRenderer */}
        <div className="flex-1 overflow-y-auto w-full pb-20"> {/* 添加 min-h-0 确保消息列表在 flex 布局中正确滚动 */}
          <MessageListRenderer messages={chatMessages} aiAvatarUrl={aiAvatarUrl} userName={userName} aiPersonaName={aiPersonaName} /> {/* 传递 aiAvatarUrl, userName, aiPersonaName */}
        </div>        
      </div>

      {/* 音频输入控制组件 */}
      <AIAudioControls 
        isPlaying={isPlaying} // 传递 AI 播放状态
        onInterrupt={stopPlayback} // 传递打断 AI 播放的函数
        className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20"
      />

      {/* 输入框组件 */}
      <ChatInput
        ref={chatInputRef}
        className="absolute bottom-12 left-10 z-20"
        onSendMessage={handleUserSendMessage}
        onExpandedChange={setIsChatInputExpanded}
        expanded={isChatInputExpanded}
      />
      {/* 底部声明 */}
      <p className="text-xs text-gray-500 mt-4 text-center">AI生成内容由大模型生成，不能完全保障真实</p>
      {/* 工具栏 */}
      {!isMobileDevice || !isChatInputExpanded ? (
        <ChatControls className="absolute bottom-12 right-10 z-20" />
      ) : null} {/* 条件渲染 ChatControls */}
    </div>
  );
};

export default HomeMainChat;
