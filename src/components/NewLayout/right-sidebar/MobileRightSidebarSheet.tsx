import React from 'react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SettingsIcon } from "lucide-react";
import HomeRightSidebar from "./HomeRightSidebar"; // Import the actual sidebar content
import { useWebSocketSession } from "@/hooks/useWebSocketSession"; // Import useWebSocketSession

interface MobileRightSidebarSheetProps {
  // No props needed if it manages its own state and renders HomeRightSidebar internally
}

const MobileRightSidebarSheet: React.FC<MobileRightSidebarSheetProps> = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false); // State to control sidebar visibility
  const { isConnected } = useWebSocketSession(); // Get connection status

  return (
    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      {!isConnected && (
        <SheetTrigger asChild>
          <Button size="icon" className="rounded-full bg-gradient-to-br from-blue-400 to-pink-400 via-purple-400 text-white shadow-lg hover:from-blue-500 hover:to-pink-500 hover:via-purple-500">
            <SettingsIcon className="h-6 w-6" />
          </Button>
        </SheetTrigger>
      )}
      <SheetContent side="right" className="w-full bg-white p-4 overflow-y-auto flex flex-col pb-24">
        <SheetHeader className="px-6">
          <SheetTitle>设置</SheetTitle>
        </SheetHeader>
        <div className="flex-1 py-6 pr-6 pl-0 overflow-y-auto min-h-0">
          <HomeRightSidebar /> {/* Directly render HomeRightSidebar content */}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileRightSidebarSheet;
