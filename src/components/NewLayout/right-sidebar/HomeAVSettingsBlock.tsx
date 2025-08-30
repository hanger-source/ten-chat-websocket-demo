import React from 'react';
import MicSettingsBlock from "./MicSettingsBlock"; // 导入 MicSettingsBlock
import CamSettingsBlock from "./CamSettingsBlock"; // 导入 CamSettingsBlock

// HomeAVSettingsBlock 主组件
const HomeAVSettingsBlock = () => {
  return (
    <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="text-base font-semibold mb-2">音视频设置</div>

      {/* 麦克风设置 */}
      <MicSettingsBlock />

      {/* 分隔线 */}
      <div className="border-b border-gray-200 my-4"></div>

      {/* 摄像头设置 */}
      <CamSettingsBlock />
    </div>
  );
};

export default HomeAVSettingsBlock;
