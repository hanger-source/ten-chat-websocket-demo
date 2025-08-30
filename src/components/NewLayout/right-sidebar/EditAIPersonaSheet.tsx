import React, { useState, useEffect } from 'react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import EditAIPersonaScenes from "./edit-ai-persona-sections/EditAIPersonaScenes";
import EditVoiceSettings from "./edit-ai-persona-sections/EditVoiceSettings";
import EditSystemPrompt from "./edit-ai-persona-sections/EditSystemPrompt";
import EditWelcomeMessage from "./edit-ai-persona-sections/EditWelcomeMessage";
import { ISceneCard } from '@/types'; // Import ISceneCard
import EditAIModelMode from "./edit-ai-persona-sections/EditAIModelMode";

interface EditAIPersonaSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditAIPersonaSheet: React.FC<EditAIPersonaSheetProps> = ({ isOpen, onClose }) => {
  const [triangleLeft, setTriangleLeft] = useState<string>('50%');
  const [selectedCapsuleRef, setSelectedCapsuleRef] = useState<HTMLDivElement | null>(null);

  const handleCapsuleClick = (card: ISceneCard, ref: HTMLDivElement | null) => {
    setSelectedCapsuleRef(ref);
  };

  useEffect(() => {
    if (selectedCapsuleRef) {
      const capsuleRect = selectedCapsuleRef.getBoundingClientRect();
      // Assuming the parent container for EditAIPersonaScenes is the `div.flex-1`
      // We need to calculate the relative left position from this container
      const parentContainer = selectedCapsuleRef.closest('.flex-1.py-6.pr-6.pl-0');
      if (parentContainer) {
        const parentRect = parentContainer.getBoundingClientRect();
        const relativeLeft = (capsuleRect.left + (capsuleRect.width / 2)) - parentRect.left;
        // Adjust for the triangle's own width (20px total, so -10px from center)
        setTriangleLeft(`${relativeLeft}px`);
      } else {
        // Fallback if parent not found (shouldn't happen if structure is correct)
        setTriangleLeft('50%');
      }
    }
  }, [selectedCapsuleRef]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[1200px] bg-gradient-to-bl from-[#e1e5ff] to-white shadow-sm pb-24 overflow-y-auto" overlayClassName="bg-transparent">
        <SheetHeader>
          <SheetTitle>选择 你所需要的 <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">AI 人设</span></SheetTitle>
          <SheetDescription>我们已经为您配置好对应人设的 基本参数，您也可以根据自己的需求 进行自定义设置</SheetDescription>
        </SheetHeader>
        <div className="flex-1 py-6 pr-6 pl-0">
          <EditAIPersonaScenes onCapsuleClick={handleCapsuleClick} />

          {/* New container for all settings */}
          <div className="relative mt-4 bg-white p-6 rounded-lg shadow-md">
            {/* Triangle pointing up from the top-middle of this container */}
            <div className="absolute top-[-17px] w-0 h-0 border-l-[18px] border-r-[18px] border-b-[18px] border-l-transparent border-r-transparent border-b-white" style={{ left: triangleLeft, transform: 'translateX(-50%)' }}></div>

            {/* All settings components go here */}
            <div className="flex space-x-4 mb-6">
              <EditAIModelMode className="flex-1" />
              <EditVoiceSettings className="flex-1" />
            </div>
            <EditSystemPrompt />
            <EditWelcomeMessage />
          </div>
        </div>
        <SheetFooter className="mt-auto">
          <SheetClose asChild>
            <Button variant="outline" onClick={onClose} className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none ring-0" style={{ outline: 'none', boxShadow: 'none' }}>取消</Button>
          </SheetClose>
          <Button onClick={() => { /* 保存逻辑 */ onClose(); }}>保存</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default EditAIPersonaSheet;
