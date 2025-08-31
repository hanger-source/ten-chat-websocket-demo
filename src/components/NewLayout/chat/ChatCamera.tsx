import React from 'react';
import { cn } from '@/lib/utils';
import { VideoSourceType } from "@/common/constant";
import { useWebSocketSession } from "@/hooks/useWebSocketSession";
import { useAppSelector } from "@/common/hooks";
import { LocalVideoStreamPlayer } from "@/components/Agent/LocalVideoStreamPlayer";
import { isMobile } from "@/common/utils"; // 导入 isMobile 函数
import { useDispatch } from 'react-redux'; // 导入 useDispatch
import { setCameraMuted } from '@/store/reducers/global'; // 导入 setCameraMuted action

interface ChatCameraProps {
  className?: string;
}

const ChatCamera = ({ className }: ChatCameraProps) => {
  const { isConnected } = useWebSocketSession(); // 只保留 isConnected，如果ChatCamera仅用于显示，其他props可能不需要
  const selectedCamDeviceId = useAppSelector(state => state.global.selectedCamDeviceId);
  const isCameraMuted = useAppSelector(state => state.global.isCameraMuted); // 从 Redux 获取 isCameraMuted
  const dispatch = useDispatch(); // 获取 dispatch 函数

  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);

  // 在组件挂载时检测是否为手机端，并设置摄像头静音状态
  React.useEffect(() => {
    if (isMobile()) {
      dispatch(setCameraMuted(true));
    }
  }, [dispatch]); // 仅在组件挂载时运行一次

  React.useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedCamDeviceId ? { deviceId: selectedCamDeviceId } : true,
        });
        // 确保获取到的流处于启用状态
        stream.getVideoTracks().forEach(track => (track.enabled = !isCameraMuted)); // 根据 isCameraMuted 设置 track.enabled
        setCameraStream(stream);
      } catch (error) {
        console.error("[CHAT_CAMERA_LOG] 摄像头访问失败:", error);
        setCameraStream(null);
      }
    };

    // 清理旧的媒体流
    const cleanupStream = () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    };

    if (!isCameraMuted) { // 只有在摄像头未静音时才获取流
      getCameraStream();
    } else {
      cleanupStream(); // 如果摄像头静音，则清理当前流
    }

    return () => {
      cleanupStream(); // 组件卸载或依赖项变化时清理流
    };
  }, [selectedCamDeviceId, isCameraMuted]); // 依赖 selectedCamDeviceId 和 isCameraMuted

  if (isCameraMuted) {
    return null; // Don't render anything if camera is muted
  }

  return (
    <div className={cn("flex flex-col items-center w-full h-full border border-gray-300 rounded-lg", className)}> {/* 最外层容器 */}
      {/* Container for video and text, manages vertical layout */}
      <div className="flex flex-col items-center justify-between w-full text-white text-sm"> {/* 视频和文字的共同容器 */}
        {/* Video stream or placeholder */}
        <div className="flex-1 flex items-center justify-center w-full relative overflow-hidden bg-gray-800 rounded-t-lg"> {/* 视频流容器 */}
          {isCameraMuted ? (
            <p>摄像头已静音</p>
          ) : cameraStream ? (
            <div className="w-full h-full object-cover flex items-center justify-center"> {/* 包裹 LocalVideoStreamPlayer，并应用样式 */}
              <LocalVideoStreamPlayer stream={cameraStream} muted={true} />
            </div>
          ) : (
            <p>正在加载视频流...</p>
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
