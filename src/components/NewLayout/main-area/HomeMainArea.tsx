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

  return (
    <main className={cn("flex-1 bg-white shadow-none rounded-[16px] flex flex-col items-center justify-center md:px-4 relative", className)}>
      {/* 连接状态下的聊天区域 */}
      <div className={cn("flex-1 w-full h-full", {
        "hidden": !isConnected, // 根据 isConnected 控制可见性
      })}>
        <HomeMainChat className="flex-1 w-full h-full" />
      </div>

      {/* 未连接状态下的初始界面 */}
      <div className={cn("flex flex-col items-center justify-center max-w-5xl mx-auto", {
        "hidden": isConnected, // 根据 isConnected 控制可见性
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
