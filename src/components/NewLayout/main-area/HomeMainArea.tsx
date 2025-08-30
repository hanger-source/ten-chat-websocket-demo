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

  if (isConnected) {
    return (
      <main className={cn("flex-1 bg-white shadow-none rounded-[16px] flex flex-col items-center justify-center md:px-4 relative", className)}>
        {/* Placeholder for the connected session page */}
        <HomeMainChat className="flex-1 w-full h-full" />
      </main>
    );
  }

  return (
    <main className={cn("flex-1 bg-white shadow-none rounded-[16px] flex flex-col items-center justify-center md:px-4 relative", className)}>
      {/* Main Card Content (now with padding and vertical centering) */}
      <div className="flex flex-col items-center justify-center max-w-5xl mx-auto">
        <HomeAvatarCard />
        <HomeSceneSelector />
      </div>

      <HomeInvokeButton />

      <HomeBottomDeclaration />
    </main>
  );
};

export default HomeMainArea;
