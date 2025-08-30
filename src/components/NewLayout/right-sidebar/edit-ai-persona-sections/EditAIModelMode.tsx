import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IModeOption, IReplaceableModelOption } from '@/types/modeOptions'; // Only import necessary types
import { modeOptions } from '@/common/mockModeOptionsData';
import { RootState } from '../../../../store';
import { setGlobalMode, setCurrentScene } from '@/store/reducers/global';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Only import Button here
import ChangeModelDialog from "./ChangeModelDialog"; // Import the new component

interface EditAIModelModeProps {
  className?: string;
}

const EditAIModelMode: React.FC<EditAIModelModeProps> = ({ className }) => {
  const dispatch = useDispatch();
  const { globalMode, currentScene } = useSelector((state: RootState) => state.global);

  const currentMode = modeOptions.find(mode => mode.value === globalMode);

  const [showModal, setShowModal] = useState(false);
  const [modelKeyToSelect, setModelKeyToSelect] = useState<string | null>(null);

  const handleModeSelect = (mode: IModeOption) => {
    dispatch(setGlobalMode(mode.value));
  };

  const handleChangeModelClick = (key: string) => {
    if (!currentScene || !currentMode?.metadata?.replaceableModels) {
      return;
    }
    setModelKeyToSelect(key);
    setShowModal(true);
  };

  const hasReplaceableModels = currentMode?.metadata?.replaceableModels && currentMode.metadata.replaceableModels.length > 0;
  const isChangeButtonDisabled = !currentScene || !hasReplaceableModels;

  const currentReplaceableModelConfig = currentMode?.metadata?.replaceableModels?.find(
    (rm: IReplaceableModelOption) => rm.key === modelKeyToSelect
  );

  return (
    <div className={cn("mb-6 relative", className)}>
      <div className="relative bg-white rounded-lg shadow-sm pt-4 p-4 border border-gray-200">
        <div className="absolute top-0 left-4 -translate-y-1/2 flex space-x-2 bg-white px-2 z-10">
          {modeOptions.map((mode: IModeOption) => (
            <div
              key={mode.value}
              onClick={() => handleModeSelect(mode)}
              className={`cursor-pointer px-3 py-1 rounded-md text-sm font-normal transition-colors duration-200
                ${globalMode === mode.value
                  ? 'bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent border-transparent'
                  : 'bg-white text-gray-700 border-none hover:bg-gray-50 hover:border-b-[1px] hover:border-gray-300'
                }`
              }
            >
              {mode.label}
            </div>
          ))}
        </div>
        <div className="pt-2 text-gray-600 text-sm">
          {currentMode?.metadata?.replaceableModels && currentMode.metadata.replaceableModels.length > 0 && (
            <div className="flex flex-col space-y-4">
              {currentMode.metadata.replaceableModels.map((replaceableModel: IReplaceableModelOption) => {
                const selectedModelName = currentScene?.selectedModels?.[replaceableModel.key] || '未选择';
                let modelDescription: string | undefined;
                
                // Try finding in modelLibrary first (need to pass modelLibrary to ChangeModelDialog if it's used there)
                // For now, let's keep modelLibrary import in ChangeModelDialog.
                const modelInLibrary = (currentMode.metadata?.models || []).find(m => m.model === selectedModelName);

                if (modelInLibrary) {
                  modelDescription = modelInLibrary.description;
                } else {
                    modelDescription = undefined;
                }

                return (
                  <div key={replaceableModel.key} className="flex items-center justify-between space-x-2">
                    <div>
                      <h4 className="font-semibold mb-1">{replaceableModel.type}：{selectedModelName}</h4>
                      {modelDescription && <p className="text-xs text-gray-500">{modelDescription}</p>}
                    </div>
                    <Button 
                      onClick={() => handleChangeModelClick(replaceableModel.key)} 
                      disabled={isChangeButtonDisabled} 
                      className="mt-2 bg-gradient-to-br from-blue-100 to-white border-none hover:border-b-[1px] hover:border-gray-300" // Blue-white gradient background
                    >
                      <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">更换模型</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ChangeModelDialog
        showModal={showModal}
        setShowModal={setShowModal}
        modelKeyToSelect={modelKeyToSelect}
        currentScene={currentScene}
        currentMode={currentMode}
        currentReplaceableModelConfig={currentReplaceableModelConfig}
      />
    </div>
  );
};

export default EditAIModelMode;
