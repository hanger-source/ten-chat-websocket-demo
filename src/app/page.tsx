"use client";

import dynamic from "next/dynamic";

import AuthInitializer from "@/components/authInitializer";
import { useAppSelector, EMobileActiveTab, useIsCompactLayout } from "@/common";
import Header from "@/components/Layout/Header";
import Action from "@/components/Layout/Action";
import { cn } from "@/lib/utils";

const DynamicRTCCard = dynamic(() => import("@/components/Dynamic/RTCCard"), {
  ssr: false,
});
const DynamicChatCard = dynamic(() => import("@/components/Chat/ChatCard"), {
  ssr: false,
});

export default function Home() {
  const mobileActiveTab = useAppSelector(
    (state) => state.global.mobileActiveTab
  );
  const isCompactLayout = useIsCompactLayout();

  return (
    <AuthInitializer>
      <div className="relative mx-auto flex flex-1 min-h-screen flex-col md:h-screen bg-gray-50">
        <Header className="h-[60px]" />
        <Action />
        <div className={cn(
          "mx-2 mb-2 flex h-full max-h-[calc(100vh-108px-24px)] flex-col md:flex-row md:gap-2 flex-1",
          {
            ["flex-col-reverse"]: isCompactLayout
          }
        )}>
          <DynamicRTCCard
            className={cn(
              "m-0 w-full rounded-b-lg bg-white shadow-lg border border-gray-200 md:w-[480px] md:rounded-lg flex-1 flex",
              {
                ["hidden md:flex"]: mobileActiveTab === EMobileActiveTab.CHAT,
              }
            )}
          />

          {(
            <DynamicChatCard
              className={cn(
                "m-0 w-full rounded-b-lg bg-white shadow-lg border border-gray-200 md:rounded-lg flex-1 min-h-0",
                {
                  ["hidden md:flex"]: mobileActiveTab === EMobileActiveTab.AGENT,
                }
              )}
            />
          )}

        </div>
      </div>
    </AuthInitializer>
  );
}
