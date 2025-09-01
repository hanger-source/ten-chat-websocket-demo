import React, { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'; // 导入图标
import { motion } from 'framer-motion'; // 导入 motion 用于动画
import SiriWave from 'siriwave'; // 导入 siriwave 库
import { useAppSelector } from '@/common/hooks'; // 导入 useAppSelector

interface AIAudioControlsProps {
  isPlaying: boolean; // AI 是否正在播放音频
  onInterrupt: () => void; // 打断 AI 播放的回调函数
  audioLevel: number; // 用户麦克风实时音量 (0-1)
  micPermission: 'granted' | 'denied' | 'pending'; // 麦克风权限状态
  className?: string;
}

export const AIAudioControls: React.FC<AIAudioControlsProps> = ({
  isPlaying,
  onInterrupt,
  audioLevel,
  micPermission,
  className,
}) => {
  const siriwaveContainerRef = useRef<HTMLDivElement>(null);
  const siriwaveRef = useRef<SiriWave | null>(null);
  const isMicrophoneMuted = useAppSelector(state => state.global.isMicrophoneMuted); // 获取麦克风静音状态

  // 初始化 SiriWave
  useEffect(() => {
    if (micPermission === "granted" && siriwaveContainerRef.current) {
      if (!siriwaveRef.current) {
        siriwaveRef.current = new SiriWave({
          container: siriwaveContainerRef.current,
          width: siriwaveContainerRef.current.offsetWidth,
          height: 120, // 固定高度，根据需要调整
          style: "ios9", // 使用 iOS9 风格
          speed: 0.2, // 文档默认速度
          amplitude: 1, // 文档默认振幅
          autostart: true,
          curveDefinition: [
            { "color": "255,105,180", "supportLine": true }, // 热粉色
            { "color": "255,153,204" }, // 稍亮的粉紫色
            { "color": "204,153,255" }, // 亮紫色
            { "color": "153,102,255", "supportLine": true }, // 柔和蓝紫
            { "color": "102,102,255" },  // 稍亮的蓝色
            { "color": "102,153,255" },  // 蓝天色
            { "color": "51,153,255" }    // 明亮蓝色
          ],
          globalCompositeOperation: "lighter", // 文档推荐的波浪重叠混合模式
        });
      }
    } else if (siriwaveRef.current) {
      siriwaveRef.current.dispose();
      siriwaveRef.current = null;
    }

    return () => {
      if (siriwaveRef.current) {
        siriwaveRef.current.dispose();
        siriwaveRef.current = null;
      }
    };
  }, [micPermission]);

  // 动态更新振幅
  useEffect(() => {
    if (siriwaveRef.current) {
      // 如果麦克风静音，则振幅为 0，否则根据 audioLevel 调整振幅
      const newAmplitude = isMicrophoneMuted ? 0 : Math.min(2.5, 0.5 + audioLevel * 25); // 大幅提高基础振幅，增强音量影响，最大 2.5
      siriwaveRef.current.setAmplitude(newAmplitude);
    }
  }, [audioLevel, isMicrophoneMuted]); // 添加 isMicrophoneMuted 到依赖数组

  const renderUserMicStatus = () => {
    if (micPermission === 'denied') {
      return (
        <div className="flex items-center text-red-500">
          {/* <MicOff className="h-4 w-4 mr-1" /> */}
          <span className="text-sm">麦克风禁用</span>
        </div>
      );
    } else if (micPermission === 'pending') {
      return (
        <div className="flex items-center text-yellow-500">
          {/* <Mic className="h-4 w-4 mr-1" /> */}
          <span className="text-sm">等待权限</span>
        </div>
      );
    } else if (micPermission === 'granted' && audioLevel > 0.005) { // 有波浪动画时，不显示文本
      return null; 
    } else {
      return null; // 默认情况下，在没有动画或者权限未 granted 时不显示任何文本
    }
  };

  return (
    <div className={cn("relative flex flex-col items-center justify-center min-w-[200px] min-h-[60px]", className)}>
      {/* 麦克风权限状态文本 */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2">
        {renderUserMicStatus()}
      </div>

      {/* 波浪动画 */}
      <div
        ref={siriwaveContainerRef}
        className="absolute inset-x-0 bottom-0 h-[110px] md:h-[60px] flex items-center justify-center pointer-events-none overflow-hidden" // 调整高度和垂直定位
      ></div>

      {isPlaying && ( // 仅当 isPlaying 为 true 时才展示打断按钮区块
        <div className="flex items-center space-x-2 -mt-36 md:-mt-24 backdrop-blur-[2px] bg-white/30 rounded-md px-3 py-2"> {/* 添加模糊背景效果，增加圆角和内边距 */}
          <span className="text-sm text-[#635bff]">语音打断 或</span>
          <motion.button
            onClick={onInterrupt}
            className={cn("relative z-10 px-2 py-1 text-sm rounded-md", {
              "bg-gray-200 text-[#635bff] hover:bg-gray-300": true, // AI播放时保持默认颜色，悬停时加深背景
            })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ◼ 点此打断
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default React.memo(AIAudioControls);
