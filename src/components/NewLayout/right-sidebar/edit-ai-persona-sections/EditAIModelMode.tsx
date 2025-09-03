import React, { useState, useEffect } from 'react';
import { IModeOption, IReplaceableModelOption } from '@/types/modeOptions'; // Only import necessary types
import { useAppSelector } from '@/common'; // 导入 useAppSelector
import { RootState } from '../../../../store'; // 导入 RootState
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Only import Button here
import ChangeModelDialog from "./ChangeModelDialog"; // Import the new component
import ConfigModelOptionDialog from "./ConfigModelOptionDialog"; // Import the new component
import { useAiPersonalEdit } from '../../../../hooks/useAiPersonalEdit';

interface EditAIModelModeProps {
  className?: string;
}

const EditAIModelMode: React.FC<EditAIModelModeProps> = ({ className }) => {
  const { editingScene, setEditingSceneMode, getEditingDefaultModeValue, getModelsForAvailableKey, getAvailableModelOptions, getPersonaModelDescription, derivedModeConfiguration } = useAiPersonalEdit();

  const [showModal, setShowModal] = useState(false);
  const [modelKeyToSelect, setModelKeyToSelect] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [modelKeyToConfig, setModelKeyToConfig] = useState<string | null>(null);

  // 从 Redux store 获取 modeOptions
  const modeOptions = useAppSelector((state: RootState) => state.global.modeOptions);

  // 添加 useEffect 来监听 editingScene 的变化
  useEffect(() => {
    // 这里不需要更新内部状态，因为模型和模式信息都直接从 editingScene 派生
  }, [editingScene]);

  const handleModeSelect = (mode: IModeOption) => {
    setEditingSceneMode(mode.value);
  };

  const handleChangeModelClick = (key: string) => {
    if (!editingScene || !getAvailableModelOptions(key)) {
      return;
    }
    setModelKeyToSelect(key);
    setShowModal(true);
  };

  const handleConfigModelClick = (key: string) => {
    if (!editingScene || !getAvailableModelOptions(key)) {
      return;
    }
    setModelKeyToConfig(key);
    setShowConfigModal(true);
  };

  const replaceableModels: IReplaceableModelOption[] = derivedModeConfiguration?.metadata?.replaceableModels || [];
  const hasReplaceableModels = replaceableModels.length > 0;
  const isChangeButtonDisabled = !editingScene || !hasReplaceableModels;

  return (
    <div className={cn("mb-6 relative", className)}>
      <div className="relative bg-white rounded-lg shadow-sm pt-4 p-4 border border-gray-200">
        <div className="absolute top-0 left-4 -translate-y-1/2 flex space-x-2 bg-white px-2 z-10">
          {modeOptions.map((mode: IModeOption) => (
            <div
              key={mode.value}
              onClick={() => handleModeSelect(mode)}
              className={`cursor-pointer px-3 py-1 rounded-md text-sm font-normal transition-colors duration-200
                ${getEditingDefaultModeValue() === mode.value
                  ? 'bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent border-transparent'
                  : 'bg-white text-gray-700 border-none hover:bg-gray-50 hover:border-b-[1px] hover:border-gray-300'
                }`
              }
            >
              {mode.name}
            </div>
          ))}
        </div>
        <div className="pt-2 text-gray-600 text-sm">
          {hasReplaceableModels && (
            <div className="flex flex-col space-y-4">
              {replaceableModels.map((replaceableModel: IReplaceableModelOption) => {
                const selectedModelName = editingScene?.selectedModels?.[replaceableModel.key] || '未选择';

                return (
                  <div key={replaceableModel.key} className="flex items-center justify-between space-x-2">
                    <div>
                      <h4 className="font-semibold mb-1">{replaceableModel.type}：{selectedModelName}</h4>
                      {getPersonaModelDescription(selectedModelName) && <p className="text-xs text-gray-500">{getPersonaModelDescription(selectedModelName)}</p>}
                    </div>
                    <div className="flex flex-col space-y-2">
                    <Button 
                      onClick={() => handleChangeModelClick(replaceableModel.key)} 
                      disabled={isChangeButtonDisabled} 
                      className="mt-2 bg-gradient-to-br from-blue-100 to-white border-none hover:border-b-[1px] hover:border-gray-300" // Blue-white gradient background
                    >
                      <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">更换模型</span>
                    </Button>
                    {getAvailableModelOptions(replaceableModel.key)?.configurableOptions && getAvailableModelOptions(replaceableModel.key)!.configurableOptions!.length > 0 && (
                    <Button 
                      onClick={() => handleConfigModelClick(replaceableModel.key)} 
                      disabled={isChangeButtonDisabled} // Same disabled logic as ChangeModel button
                      className="bg-gradient-to-br from-green-100 to-white border-none hover:border-b-[1px] hover:border-gray-300" // Green-white gradient background
                    >
                      <span className="bg-gradient-to-r from-green-700 to-teal-700 bg-clip-text text-transparent">配置</span>
                    </Button>
                    )}
                    </div>
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
      />
      <ConfigModelOptionDialog
        showModal={showConfigModal}
        setShowModal={setShowConfigModal}
        modelKeyToConfig={modelKeyToConfig}
      />
    </div>
  );
};

export default EditAIModelMode;
