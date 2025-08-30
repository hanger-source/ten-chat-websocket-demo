import React, { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import EditAIPersonaScenes from "./edit-ai-persona-sections/EditAIPersonaScenes";
import EditVoiceSettings from "./edit-ai-persona-sections/EditVoiceSettings";
import EditSystemPrompt from "./edit-ai-persona-sections/EditSystemPrompt";
import EditWelcomeMessage from "./edit-ai-persona-sections/EditWelcomeMessage";
import { ISceneCard } from '@/types'; // Import ISceneCard
import EditAIModelMode from "./edit-ai-persona-sections/EditAIModelMode";
import { useAiPersonalEdit } from '../../../hooks/useAiPersonalEdit';
import { useSelectedScene } from '../../../hooks/useSelectedScene'; // 导入 useSelectedScene

interface EditAIPersonaSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditAIPersonaSheet: React.FC<EditAIPersonaSheetProps> = ({ isOpen, onClose }) => {
  const { editingScene, saveEditingScene } = useAiPersonalEdit(); // 引入 useAiPersionalEdit Hook
  const { switchSelectedScene } = useSelectedScene(); // 引入 useSelectedScene Hook
  const [triangleLeft, setTriangleLeft] = useState<string>('50%');
  const [scenePositions, setScenePositions] = useState<{ [key: string]: number }>({}); // 新增状态来存储场景位置

  const handleCapsuleClick = useCallback((card: ISceneCard, ref: HTMLDivElement | null) => {
    // 不再需要 setSelectedCapsuleRef
    switchSelectedScene(card.aiPersonaName);
  }, [switchSelectedScene]);

  useEffect(() => {
    if (editingScene && scenePositions[editingScene.aiPersonaName] !== undefined) {
      const position = scenePositions[editingScene.aiPersonaName];
      setTriangleLeft(`${position}px`);
    } else {
      setTriangleLeft('50%'); // 如果没有选中的场景或位置信息，则居中显示
    }
  }, [editingScene, scenePositions]); // 依赖 editingScene 和 scenePositions

  const handleSave = useCallback(() => {
    saveEditingScene();
    onClose();
  }, [saveEditingScene, onClose]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[960px] bg-gradient-to-bl from-[#e1e5ff] to-white shadow-sm pb-24" overlayClassName="bg-transparent">
        <SheetHeader>
          <SheetTitle>选择 你所需要的 <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">AI 人设</span></SheetTitle>
          <SheetDescription>我们已经为您配置好对应人设的 基本参数，您也可以根据自己的需求 进行自定义设置</SheetDescription>
        </SheetHeader>
        <div className="flex-1 py-6 pr-6 pl-0">
          <EditAIPersonaScenes onCapsuleClick={handleCapsuleClick} onScenePositionsChange={setScenePositions} /> {/* 传递 onScenePositionsChange */}

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
            <Button variant="outline" onClick={onClose} className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none" style={{ outline: 'none', boxShadow: 'none' }}>取消</Button>
          </SheetClose>
          <Button className="bg-gradient-to-br from-blue-400 to-pink-400 via-purple-400 text-white transition-all duration-200 shadow-lg hover:shadow-lg hover:scale-100 transform-gpu will-change-[transform,background-color,color]" onClick={handleSave}>保存</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default EditAIPersonaSheet;
