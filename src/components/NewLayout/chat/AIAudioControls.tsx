import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'; // 导入图标
import { motion } from 'framer-motion'; // 导入 motion 用于动画

interface AIAudioControlsProps {
  isPlaying: boolean; // AI 是否正在播放音频
  onInterrupt: () => void; // 打断 AI 播放的回调函数
  audioLevel: number; // 用户麦克风实时音量 (0-1)
  micPermission: 'granted' | 'denied' | 'pending'; // 麦克风权限状态
  className?: string;
}

const AIAudioControls: React.FC<AIAudioControlsProps> = ({
  isPlaying,
  onInterrupt,
  audioLevel,
  micPermission,
  className,
}) => {
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
    } else {
      // 这里将是波浪动画，先清空旧的柱状图代码
      return null; // 暂时返回 null，后面会用 SVG 波浪动画替换
    }
  };

  return (
    <div className={cn("relative flex flex-col items-center justify-center min-w-[200px] min-h-[60px]", className)}>
      {/* 麦克风权限状态文本 */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2">
        {renderUserMicStatus()}
      </div>

      {/* 波浪动画 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
          {[0, 1, 2, 3, 4].map((i) => {
            const baseAmplitude = 5 + audioLevel * 20; // 根据音量调整基础振幅
            const frequency = 0.02 + i * 0.005; // 不同波浪层有不同频率
            const phaseShift = i * Math.PI / 4; // 不同波浪层有不同相位
            const color = [
              "#8A2BE2", // 蓝色紫罗兰
              "#DC143C", // 深红色
              "#FF4500", // 橙红色
              "#1E90FF", // 道奇蓝
              "#FF69B4", // 热粉色
            ][i];

            const pathData = Array.from({ length: 200 }, (_, x) => {
              const y = 30 + baseAmplitude * Math.sin(x * frequency + phaseShift);
              return `${x} ${y}`;
            }).join(" L ");

            return (
              <motion.path
                key={i}
                d={`M 0 30 L ${pathData} L 200 30 Z`}
                fill="none"
                stroke={color}
                strokeWidth={2 + audioLevel * 2} // 根据音量调整线宽
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: audioLevel > 0.01 ? 0.7 : 0, 
                  scale: 1,
                  x: i % 2 === 0 ? [0, 5, 0] : [0, -5, 0] // 模拟左右轻微晃动
                }}
                transition={{ 
                  duration: 0.8 + i * 0.1, 
                  ease: "easeInOut", 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  delay: i * 0.1 
                }}
              />
            );
          })}
        </svg>
      </div>

      {isPlaying && ( // 仅当 isPlaying 为 true 时才展示打断按钮区块
        <div className="flex items-center space-x-2 -mt-32 backdrop-blur-sm bg-white/30 rounded-md px-3 py-2"> {/* 添加模糊背景效果，增加圆角和内边距 */}
          <span className="text-sm text-[#635bff]">语音打断 或</span>
          <motion.button 
            onClick={onInterrupt} 
            className={cn("relative z-10 px-2 py-1 text-sm rounded-md", {
              "bg-gray-200 text-[#635bff] hover:bg-gray-300": true, // AI播放时保持默认颜色，悬停时加深背景
            })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            点此打断
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default AIAudioControls;
