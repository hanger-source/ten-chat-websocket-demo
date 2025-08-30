import React from 'react';
import { cn } from '@/lib/utils';
import MicOnSvg from "@/assets/chat/audio_on.svg?react";
import CamOnSvg from "@/assets/chat/video_on.svg?react";
import HangUpSvg from "@/assets/chat/hang_up.svg?react";
import MicOffSvg from "@/assets/chat/audio_off.svg?react"; // 导入 MicOffSvg
import CamOffSvg from "@/assets/chat/video_off.svg?react"; // 导入 CamOffSvg
import { MicIcon } from "@/components/icons/mic"; // 导入 MicIcon
import { CamIconByStatus } from "@/components/Icon"; // 导入 CamIconByStatus
import { useWebSocketSession } from "@/hooks/useWebSocketSession"; // 导入 useWebSocketSession
import { useAppDispatch, useAppSelector } from "@/common/hooks"; // 导入 useAppDispatch 和 useAppSelector
import { setMicrophoneMuted, setCameraMuted } from "@/store/reducers/global"; // 导入 setMicrophoneMuted 和 setCameraMuted action

interface ChatControlsProps {
  className?: string;
}

const ChatControls = ({ className }: ChatControlsProps) => {
  const { stopSession, sessionState } = useWebSocketSession(); // 获取 stopSession 和 sessionState
  const dispatch = useAppDispatch();
  const isMicrophoneMuted = useAppSelector(state => state.global.isMicrophoneMuted);
  const isCameraMuted = useAppSelector(state => state.global.isCameraMuted);

  console.log("[CHAT_CONTROLS_LOG] Current sessionState:", sessionState);

  return (
    <div className={cn("flex space-x-4", className)}>
      <button
        className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center filter hover:brightness-125 transition-all duration-200"
        onClick={() => dispatch(setMicrophoneMuted(!isMicrophoneMuted))}
      >
        {isMicrophoneMuted ? <MicOffSvg className="h-12 w-12" /> : <MicOnSvg className="h-12 w-12" />}
      </button>
      <button
        className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center filter hover:brightness-125 transition-all duration-200"
        onClick={() => dispatch(setCameraMuted(!isCameraMuted))}
      >
        {isCameraMuted ? <CamOffSvg className="h-12 w-12" /> : <CamOnSvg className="h-12 w-12" />}
      </button>
      <button
        className="w-12 h-12 rounded-full flex items-center justify-center text-white filter hover:brightness-125 transition-all duration-200"
        onClick={stopSession} // 添加 onClick 事件，调用 stopSession
      >
        <HangUpSvg className="h-12 w-12" />
      </button>
    </div>
  );
};

export default ChatControls;
