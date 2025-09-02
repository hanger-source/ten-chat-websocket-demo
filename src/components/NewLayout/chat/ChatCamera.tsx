import React from 'react';
import { cn } from '@/lib/utils';
import { LocalVideoStreamPlayer } from "@/components/Agent/LocalVideoStreamPlayer";
import { useUnifiedCamera } from '@/hooks/useUnifiedCamera'; // Import the new unified hook
import { StreamStatus } from '../../../hooks/types'; // Import StreamStatus

interface ChatCameraProps {
  className?: string;
}

export const ChatCamera = ({ className }: ChatCameraProps) => {
  const { isCameraMuted, canvasRef, streamStatus, stream, streamError, isStreamCurrentlyActive } = useUnifiedCamera(); // Get canvasRef here and new state machine vars

  if (isCameraMuted) {
    return null;
  }

  let videoStatusText = '摄像头已静音或无可用视频源';
  if (streamStatus === StreamStatus.PENDING) {
    videoStatusText = '正在请求视频...';
  } else if (streamStatus === StreamStatus.PERMISSION_DENIED) {
    videoStatusText = '权限被拒绝，请检查浏览器设置';
  } else if (streamStatus === StreamStatus.ERROR) {
    videoStatusText = `获取视频失败: ${streamError}`;
  } else if (isCameraMuted) {
    videoStatusText = '摄像头已静音'; // 如果静音，显示此信息
  } else if (!isStreamCurrentlyActive) {
    videoStatusText = '无可用视频源';
  }

  return (
    <div className={cn("flex flex-col items-center w-full h-full border border-gray-300 rounded-lg", className)}> {/* 最外层容器 */}
      {/* Hidden canvas for video frame processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {/* Container for video and text, manages vertical layout */}
      <div className="flex flex-col items-center justify-between w-full text-white text-sm"> {/* 视频和文字的共同容器 */}
        {/* Video stream or placeholder */}
        <div className="flex-1 flex items-center justify-center w-full relative overflow-hidden bg-gray-800 rounded-t-lg"> {/* 视频流容器 */}
          {isStreamCurrentlyActive && !isCameraMuted && stream ? ( // Check isStreamCurrentlyActive, isCameraMuted and stream
            <div className="w-full h-full object-cover flex items-center justify-center"> {/* 包裹 LocalVideoStreamPlayer，并应用样式 */}
            <LocalVideoStreamPlayer stream={stream} muted={true} />
            </div>
          ) : (
            <p>{videoStatusText}</p>
          )}
        </div>
        {/* Text display block */}
        <div className="text-gray-600 text-sm p-2 h-16 flex items-center justify-center w-full bg-gradient-to-r from-blue-100 to-pink-100 cursor-default rounded-bl-lg rounded-br-lg"> {/* 文字区块 */}
          <div className="text-center w-full"> {/* 包裹文字内容并居中 */}
            已支持 <span className="font-bold">千问 vision</span> 模型<br/>识字识物看图说话，都来考考 Agent 吧
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatCamera;
