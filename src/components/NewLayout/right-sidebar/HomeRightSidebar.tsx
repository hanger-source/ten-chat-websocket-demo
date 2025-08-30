import React from 'react';
import HomeAVSettingsBlock from "./HomeAVSettingsBlock"; // Updated import path
import EditAIPersonaSheet from "./EditAIPersonaSheet"; // Import EditAIPersonaSheet
import { useSelectedScene } from "@/hooks/useSelectedScene";
import { useWebSocketSession } from "@/hooks/useWebSocketSession"; // 导入 useWebSocketSession
import { cn } from '@/lib/utils'; // 导入 cn 工具函数

interface HomeRightSidebarProps {
  className?: string;
}

const HomeRightSidebar = ({ className }: HomeRightSidebarProps) => {
  const { selectedScene, selectedSceneAiPersonaName } = useSelectedScene();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false); // State to control drawer visibility
  const { isConnected } = useWebSocketSession(); // 获取连接状态

  const aiPersonaName = selectedSceneAiPersonaName;
  const aiCapabilities = selectedScene?.aiCapabilities || [
    "视觉理解",
    "时间感知",
    "图片生成",
    "行程规划",
  ];

  const tagColors = [
    { bg: "bg-blue-100", text: "text-blue-800" },
    { bg: "bg-green-100", text: "text-green-800" },
    { bg: "bg-purple-100", text: "text-purple-800" },
    { bg: "bg-yellow-100", text: "text-yellow-800" },
    { bg: "bg-red-100", text: "text-red-800" },
    { bg: "bg-indigo-100", text: "text-indigo-800" },
  ];

  return (
    <div className={className}> {/* Changed from <aside> to <div> */}
      {/* AI 人设模块 */}
      <div className="mb-4 p-4 rounded-lg border border-gray-200 bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-base font-semibold">AI 人设：{aiPersonaName}</div>
        </div>
        <div className="text-sm text-gray-700 mb-4">音色：标准女声</div>
        <div className="mt-auto p-0.5 rounded-md bg-gradient-to-r from-blue-100 to-pink-100">
          <button 
            className={cn("w-full h-full px-4 py-2 text-sm bg-gradient-to-r from-blue-50 to-pink-50 rounded-md transition-colors duration-200", {
              "hover:from-blue-100 hover:to-pink-100": !isConnected, // 未连接时才有hover效果
              "cursor-not-allowed": isConnected, // 连接时鼠标样式变为禁用
            })}
            onClick={() => setIsDrawerOpen(true)} // Open the drawer on click
            disabled={isConnected} // 在连接状态下禁用按钮
          >
            <span className="bg-gradient-to-r from-blue-800 to-purple-800 bg-clip-text text-transparent">
              修改 AI 人设
            </span>
          </button>
        </div>
      </div>

      {/* AI 能力模块 */}
      <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
        <div className="text-base font-semibold mb-2">AI 能力</div>
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
          {aiCapabilities.map((capability, index) => {
            const color = tagColors[index % tagColors.length];
            return (
              <span key={index} className={`${color.bg} ${color.text} text-xs font-medium px-2.5 py-1.5 rounded-full text-center flex-none`}>
                {capability}
              </span>
            );
          })}
        </div>
      </div>

      {/* 音视频设置模块 */}
      <HomeAVSettingsBlock />

      {/* 编辑 AI 人设抽屉 */}
      <EditAIPersonaSheet isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
};

export default HomeRightSidebar;
