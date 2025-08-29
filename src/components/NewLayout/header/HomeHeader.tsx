import React from 'react';
import { cn } from '@/lib/utils';
import NetworkIndicator from "@/components/Dynamic/NetworkIndicator";
import { useAppSelector } from "@/common/hooks";
import { RootState } from "@/store";

const HomeHeader = () => {
  const websocketConnectionState = useAppSelector((state: RootState) => state.global.websocketConnectionState);

  return (
    <header
      className={cn(
        "flex items-center justify-between bg-white shadow-sm border-b border-gray-200 p-2 md:p-4",
      )}
    >
      <div className="flex items-center space-x-2">
        {/* Logo Placeholder */}
        {/* <LogoIcon className="hidden h-5 md:block" />
        <SmallLogoIcon className="block h-4 md:hidden" /> */}
        <h1 className="text-sm font-bold md:text-xl text-gray-800">
          实时对话
        </h1>
      </div>
      <NetworkIndicator connectionState={websocketConnectionState} />
    </header>
  );
};

export default HomeHeader;
