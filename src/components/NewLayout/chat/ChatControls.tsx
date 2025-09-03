import React from 'react';
import { cn } from '@/lib/utils';
import MicOnSvg from "@/assets/chat/audio_on.svg?react";
import CamOnSvg from "@/assets/chat/video_on.svg?react";
import HangUpSvg from "@/assets/chat/hang_up.svg?react";
import MicOffSvg from "@/assets/chat/audio_off.svg?react"; // 导入 MicOffSvg
import CamOffSvg from "@/assets/chat/video_off.svg?react"; // 导入 CamOffSvg
import { useWebSocketSession } from "@/hooks/useWebSocketSession"; // 导入 useWebSocketSession
import { useAppDispatch, useAppSelector } from "@/common/hooks"; // 导入 useAppDispatch 和 useAppSelector
import { setMicrophoneMuted } from "@/store/reducers/global"; // 导入 setMicrophoneMuted
import useMediaState from '@/hooks/media/useMediaState'; // 导入新的 useMediaState hook
import useMediaTrackControls from '@/hooks/media/useMediaTrackControls'; // 导入新的 useMediaTrackControls hook
import useMediaControls from '@/hooks/media/useMediaControls'; // 导入新的 useMediaControls hook

interface ChatControlsProps {
  className?: string;
}

const ChatControls = ({ className }: ChatControlsProps) => {
  const dispatch = useAppDispatch(); // 重新引入 dispatch
  const { stopSession } = useWebSocketSession(); // 获取 stopSession 和 sessionState
  const isMicrophoneMuted = useAppSelector(state => state.global.isMicrophoneMuted); // 重新从 Redux 获取

  const { isVideoEnabled } = useMediaState(); // 使用新的 hook 获取 isVideoEnabled
  const { toggleVideoEnabled } = useMediaTrackControls(); // 使用新的 hook 获取 toggleVideoEnabled

  const handleHangUp = () => {
    stopSession(); // 停止 WebSocket 会话
  };

  return (
    <div className={cn("flex space-x-4", className)}>
      <button
        className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center filter hover:brightness-125 transition-all duration-200 shadow-xl shadow-gray-320/50" // 添加阴影效果
        onClick={() => dispatch(setMicrophoneMuted(!isMicrophoneMuted))}
      >
        {isMicrophoneMuted ? <MicOffSvg className="h-12 w-12" /> : <MicOnSvg className="h-12 w-12" />}
      </button>
      <button
        className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center filter hover:brightness-125 transition-all duration-200 shadow-xl shadow-gray-320/50" // 添加阴影效果
        onClick={toggleVideoEnabled} // 使用新的 toggleVideoEnabled
      >
        {!isVideoEnabled ? <CamOffSvg className="h-12 w-12" /> : <CamOnSvg className="h-12 w-12" />}
      </button>
      <button
        className="w-12 h-12 rounded-full flex items-center justify-center text-white filter hover:brightness-125 transition-all duration-200 shadow-xl shadow-gray-320/50" // 添加阴影效果，红色系阴影以匹配挂断按钮
        onClick={handleHangUp} // 调用新的 handleHangUp
      >
        <HangUpSvg className="h-12 w-12" />
      </button>
    </div>
  );
};

export default ChatControls;
