import React from 'react'; // 移除了 useEffect 的导入，因为它将不再被用于处理 audioFrames
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

interface HomeMainChatProps {
  className?: string;
}

const HomeMainChat = ({ className }: HomeMainChatProps) => {
  const mainRef = React.useRef<HTMLDivElement>(null);
  const cameraRef = React.useRef<HTMLDivElement>(null);

  // 使用新的 Hooks
  const { chatMessages } = useChatMessages();
  const { processAudioFrame, stopPlayback, isPlaying } = useAudioPlayer(); // 获取 isPlaying 状态
  // 将 processAudioFrame 直接作为回调传递给 useAudioFrameReceiver
  useAudioFrameReceiver({ onFrameData: processAudioFrame });
  useWebSocketEvents();
  const { selectedScene } = useSelectedScene(); // 获取 selectedScene
  const aiAvatarUrl = selectedScene?.iconSrc; // 提取 AI 头像 URL
  const aiPersonaName = selectedScene?.aiPersonaName; // 提取 AI 角色名称
  const userName = "我"; // 临时用户名称，可以根据实际情况从全局状态或用户配置中获取

  // 根据是否是手机端，设置不同的头像尺寸
  const avatarSize = isMobile() ? '30%' : '15%'; // 手机端设置为 30%，非手机端保持 15%

  return (
    <div ref={mainRef} className={cn("flex-1 flex flex-col items-center p-4 bg-gray-50 rounded-lg relative", className)}>

      {/* 用户摄像头/屏幕预览区域 - 可拖动 */}
      <Draggable nodeRef={cameraRef} bounds="parent" defaultPosition={{x: 0, y: 0}}>
        <div ref={cameraRef} className="absolute bottom-[220px] right-4 z-10 w-64 h-48 flex flex-col"> {/* 修改定位到 ChatControls 上方，并添加阴影 */}
          <ChatCamera />
        </div>
      </Draggable>

      {/* 顶部 AI 形象和会话消息列表区域的容器 */}
      <div className="flex flex-1 flex-col w-full relative"> {/* 确保 relative 定位 */}
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
        <MessageListRenderer messages={chatMessages} aiAvatarUrl={aiAvatarUrl} userName={userName} aiPersonaName={aiPersonaName} /> {/* 传递 aiAvatarUrl, userName, aiPersonaName */}
      </div>

      {/* 底部声明 */}
      <p className="text-xs text-gray-500 mt-4">AI生成内容由大模型生成，不能完全保障真实</p>
      {/* 工具栏 */}
      <ChatControls className="absolute bottom-20 right-4 z-20" />
    </div>
  );
};

export default HomeMainChat;
