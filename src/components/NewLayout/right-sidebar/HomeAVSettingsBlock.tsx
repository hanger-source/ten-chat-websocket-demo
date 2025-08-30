import React from 'react';
import MicSettingsBlock from "./MicSettingsBlock"; // 导入 MicSettingsBlock
import CamSettingsBlock from "./CamSettingsBlock"; // 导入 CamSettingsBlock
import { useWebSocketSession } from "@/hooks/useWebSocketSession"; // 导入 useWebSocketSession
import { cn } from '@/lib/utils'; // 导入 cn 工具函数

// HomeAVSettingsBlock 主组件
const HomeAVSettingsBlock = () => {
  const { isConnected } = useWebSocketSession(); // 获取连接状态
  return (
    <div className={cn("mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden", {
      "opacity-50 cursor-not-allowed": isConnected, // 当连接时，降低透明度，鼠标样式变为禁用
    })}>
      <div className="text-base font-semibold mb-2">音视频设置</div>

      {/* 麦克风设置 */}
      <MicSettingsBlock disabled={isConnected} />

      {/* 分隔线 */}
      <div className="border-b border-gray-200 my-4"></div>

      {/* 摄像头设置 */}
      <CamSettingsBlock disabled={isConnected} />
    </div>
  );
};

export default HomeAVSettingsBlock;
