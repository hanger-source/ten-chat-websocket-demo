import React from 'react';
import { cn } from '@/lib/utils';
import ChatCamera from "./ChatCamera";
import ChatCard from "@/components/Chat/ChatCard";
import Draggable from 'react-draggable'; // 导入 Draggable
import ChatControls from "./ChatControls"; // 导入 ChatControls 组件

interface HomeMainChatProps {
  className?: string;
}

const HomeMainChat = ({ className }: HomeMainChatProps) => {
  const mainRef = React.useRef<HTMLDivElement>(null); // 创建 ref 来获取 main 元素的引用
  const cameraRef = React.useRef<HTMLDivElement>(null); // 创建持久的 cameraRef

  return (
    <div ref={mainRef} className={cn("flex-1 flex flex-col items-center p-4 bg-gray-50 rounded-lg relative", className)}> {/* 添加 relative 定位 */}

      {/* 用户摄像头/屏幕预览区域 - 可拖动 */}
      <Draggable nodeRef={cameraRef} bounds="parent" defaultPosition={{x: 0, y: 0}}>
        <div ref={cameraRef} className="absolute top-4 right-4 z-10 w-64 h-48 flex flex-col"> {/* 调整高度为 h-52 */}
          <ChatCamera />
        </div>
      </Draggable>

      {/* 顶部 AI 形象和会话消息列表区域的容器 */}
      <div className="flex flex-1 flex-col w-full">
        {/* AI 形象卡片 */}
        <div className="flex w-full justify-between items-start mb-4">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-blue-300 flex items-center justify-center text-white text-4xl font-bold mb-2">AI</div>
            <span className="text-lg font-semibold">情感陪伴</span>
          </div>
        </div>

        {/* 会话消息列表区域 */}
        <ChatCard className="flex-1 w-full mb-4" />
      </div>

      {/* 底部声明 */}
      <p className="text-xs text-gray-500 mt-4">AI生成内容由大模型生成，不能完全保障真实</p>
      {/* 工具栏 */}
      <ChatControls className="absolute bottom-20 right-4 z-20" /> {/* 使用 ChatControls 组件，并传递 absolute 定位样式 */}
    </div>
  );
};

export default HomeMainChat;
