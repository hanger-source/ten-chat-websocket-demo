import React from 'react';
import { cn } from '@/lib/utils';
import HomeAvatarCard from "./HomeAvatarCard";
import HomeSceneSelector from "./HomeSceneSelector";
import HomeInvokeButton from "./HomeInvokeButton";
import HomeBottomDeclaration from "./HomeBottomDeclaration";

interface HomeMainAreaProps {
  className?: string;
}

const HomeMainArea = ({ className }: HomeMainAreaProps) => {
  return (
    <main className={cn("flex-1 bg-white shadow-lg rounded-[16px] flex flex-col items-center justify-center px-4", className)}>
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
