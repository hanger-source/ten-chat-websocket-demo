import React from 'react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import EditAIPersonaScenes from "./edit-ai-persona-sections/EditAIPersonaScenes";
import EditAIModelSettings from "./edit-ai-persona-sections/EditAIModelSettings";
import EditVoiceSettings from "./edit-ai-persona-sections/EditVoiceSettings";
import EditSystemPrompt from "./edit-ai-persona-sections/EditSystemPrompt";
import EditWelcomeMessage from "./edit-ai-persona-sections/EditWelcomeMessage";
import EditInfoText from "./edit-ai-persona-sections/EditInfoText";

interface EditAIPersonaSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditAIPersonaSheet: React.FC<EditAIPersonaSheetProps> = ({ isOpen, onClose }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[1200px] bg-gradient-to-bl from-[#e1e5ff] to-white shadow-sm pb-24 overflow-y-auto" overlayClassName="bg-transparent">
        <SheetHeader>
          <SheetTitle>选择 你所需要的 <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">AI 人设</span></SheetTitle>
          <SheetDescription>我们已经为您配置好对应人设的 基本参数，您也可以根据自己的需求 进行自定义设置</SheetDescription>
        </SheetHeader>
        <div className="flex-1 py-6 pr-6 pl-0">
          <EditAIPersonaScenes />
          <div className="configuration-aMrIwU">
            <div className="anchor-N6r2Po" style={{ left: '50px' }}></div>
            <EditAIModelSettings />
            <EditVoiceSettings />
          </div>
          <EditSystemPrompt />
          <EditWelcomeMessage />
          <EditInfoText />
        </div>
        <SheetFooter className="mt-auto">
          <SheetClose asChild>
            <Button variant="outline" onClick={onClose}>取消</Button>
          </SheetClose>
          <Button onClick={() => { /* 保存逻辑 */ onClose(); }}>保存</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default EditAIPersonaSheet;
