import React from 'react';
import { cn } from '@/lib/utils';
import HomeAvatarCard from "./HomeAvatarCard";
import HomeSceneSelector from "./HomeSceneSelector";
import HomeInvokeButton from "./HomeInvokeButton";
import HomeBottomDeclaration from "./HomeBottomDeclaration";
import { useWebSocketSession } from "@/hooks/useWebSocketSession";
import HomeMainChat from "../chat/HomeMainChat";

interface HomeMainAreaProps {
  className?: string;
}

const HomeMainArea = ({ className }: HomeMainAreaProps) => {
  const { isConnected } = useWebSocketSession();
  console.log("[DEBUG_HOME_MAIN_AREA] HomeMainArea rendered. isConnected:", isConnected);

  return (
    <main className={cn("flex-1 bg-white shadow-none rounded-[16px] flex flex-col items-center justify-center md:px-4 relative", className)}>
      {/* 连接状态下的聊天区域 */}
      <div className={cn("absolute inset-0 flex-1 w-full h-full transition-opacity duration-500", {
        "opacity-0 pointer-events-none": !isConnected, // 当未连接时，完全透明且禁用交互
        "opacity-100 pointer-events-auto": isConnected, // 当连接时，完全不透明且启用交互
      })}>
        <HomeMainChat className="flex-1 w-full h-full" />
      </div>

      {/* 未连接状态下的初始界面 */}
      <div className={cn("absolute inset-0 flex flex-col items-center justify-center max-w-5xl mx-auto transition-opacity duration-500", {
        "opacity-0 pointer-events-none": isConnected, // 当连接时，完全透明且禁用交互
        "opacity-100 pointer-events-auto": !isConnected, // 当未连接时，完全不透明且启用交互
      })}>
        <HomeAvatarCard />
        <HomeSceneSelector />
        <HomeInvokeButton />
        <HomeBottomDeclaration />
      </div>
    </main>
  );
};

export default HomeMainArea;
