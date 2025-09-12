
import React from 'react';
import { useGlobalSettings } from "@/hooks/useGlobalSettings"; // 导入 useGlobalSettings

const NoiseReductionSetting: React.FC = () => {
  const { globalSettings, updateGlobalSettings } = useGlobalSettings();
  const isEnabled = globalSettings.enable_denoising; // 使用新的属性名称

  const handleToggle = () => {
    updateGlobalSettings({ enable_denoising: !isEnabled }); // 使用新的属性名称
    console.log(`环境音降噪已${isEnabled ? '关闭' : '开启'}`);
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">环境音降噪</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">开启后可减少环境噪音干扰</p>
      </div>
      <label htmlFor="noise-reduction-toggle" className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            id="noise-reduction-toggle"
            className="sr-only"
            checked={isEnabled}
            onChange={handleToggle}
          />
          <div
            className={`block w-10 h-6 rounded-full transition-colors ${isEnabled ? 'bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600' : 'bg-gray-200 dark:bg-gray-600'}`}
          ></div>
          <div
            className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'translate-x-full' : 'translate-x-0'}`}
          ></div>
        </div>
      </label>
    </div>
  );
};

export default NoiseReductionSetting;
