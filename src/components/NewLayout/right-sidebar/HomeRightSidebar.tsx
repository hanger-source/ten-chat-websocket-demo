import React from 'react';
import HomeAVSettingsBlock from "./HomeAVSettingsBlock"; // Updated import path
// import { VideoSourceType } from "@/common/constant"; // Removed

interface HomeRightSidebarProps {
  // No audio/video related props here
}

const HomeRightSidebar = () => {
  const aiPersonaName = "AI助手";
  const aiCapabilities = [
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
    <aside className="w-80 p-4 bg-white shadow-md rounded-[16px] ml-4">
      {/* AI 人设模块 */}
      <div className="mb-4 p-4 rounded-lg border border-gray-200 bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-base font-semibold">AI 人设：{aiPersonaName}</div>
        </div>
        <div className="text-sm text-gray-700 mb-4">音色：标准女声</div>
        <div className="mt-auto p-0.5 rounded-md bg-gradient-to-r from-blue-100 to-pink-100">
          <button className="w-full h-full px-4 py-2 text-sm bg-gradient-to-r from-blue-50 to-pink-50 rounded-md hover:from-blue-100 hover:to-pink-100 transition-colors duration-200">
            <span className="bg-gradient-to-r from-blue-800 to-purple-800 bg-clip-text text-transparent">
              修改 AI 人设
            </span>
          </button>
        </div>
      </div>

      {/* AI 能力模块 */}
      <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
        <div className="text-base font-semibold mb-2">AI 能力</div>
        <div className="flex flex-wrap gap-4">
          {aiCapabilities.map((capability, index) => {
            const color = tagColors[index % tagColors.length];
            return (
              <span key={index} className={`${color.bg} ${color.text} text-xs font-medium px-2.5 py-1.5 rounded-full`}>
                {capability}
              </span>
            );
          })}
        </div>
      </div>

      {/* 音视频设置模块 */}
      <HomeAVSettingsBlock />
    </aside>
  );
};

export default HomeRightSidebar;
