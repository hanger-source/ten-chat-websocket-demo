import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAiPersonalEdit } from '../../../../hooks/useAiPersonalEdit';
import { IModeOption, ISelectedModelOption, IReplaceableModelOption, ModelCategory } from '@/types/modeOptions';

const BASE_TEXT_GRADIENT = "bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text";
const TEXT_GRADIENT_CLASSES = `${BASE_TEXT_GRADIENT} text-transparent`;

const BASE_BORDER_GRADIENT = "bg-gradient-to-br from-blue-400 to-pink-400 via-purple-400";
const BORDER_GRADIENT_CLASSES = BASE_BORDER_GRADIENT;

interface ChangeModelDialogProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  modelKeyToSelect: string | null;
}

const ChangeModelDialog: React.FC<ChangeModelDialogProps> = (props) => {
  const {
    showModal,
    setShowModal,
    modelKeyToSelect,
  } = props;
  const { editingScene, updateEditingSelectedModel, getSelectedModelId, getModelsForAvailableKey, getAvailableModelConfig, getPersonaModelDescription } = useAiPersonalEdit();
  const [activeTab, setActiveTab] = useState<string>('');
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(null);
  const [tempSelectedModelId, setTempSelectedModelId] = useState<string | null>(null);

  const modelsForModal = React.useMemo(() => getModelsForAvailableKey(modelKeyToSelect), [getModelsForAvailableKey, modelKeyToSelect]);

  const groupedModelsByTag = React.useMemo(() => {
    return modelsForModal.reduce((acc: Record<string, ISelectedModelOption[]>, model: ISelectedModelOption) => {
      model.tag.forEach((tag: string) => {
        if (!acc[tag]) {
          acc[tag] = [];
        }
        acc[tag].push(model);
      });
      return acc;
    }, {} as Record<string, ISelectedModelOption[]>);
  }, [modelsForModal]);

  useEffect(() => {
    if (showModal && Object.keys(groupedModelsByTag).length > 0) {
      const selectedModel = getSelectedModelId(modelKeyToSelect || '');
      let initialTab = Object.keys(groupedModelsByTag)[0]; // Default to the first tab

      if (selectedModel && selectedModel !== '未选择') {
        for (const tag in groupedModelsByTag) {
          if (groupedModelsByTag[tag].some(model => model.model === selectedModel)) {
            initialTab = tag;
            break;
          }
        }
      }
      setActiveTab(initialTab);
      setTempSelectedModelId(selectedModel !== '未选择' ? selectedModel : null);
    } else if (!showModal) {
      setActiveTab(''); // Reset activeTab when modal closes
      setTempSelectedModelId(null); // Reset tempSelectedModelId when modal closes
    }
  }, [showModal, groupedModelsByTag, modelKeyToSelect, getSelectedModelId]);

  const handleSelectModel = (selectedModel: string) => {
    setTempSelectedModelId(selectedModel);
  };

  const handleConfirm = () => {
    if (editingScene && modelKeyToSelect && tempSelectedModelId) {
      updateEditingSelectedModel(modelKeyToSelect, tempSelectedModelId);
      setShowModal(false);
    } else {
      // If no model is selected, just close the modal
      setShowModal(false);
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}> {/* Simplified onOpenChange */}
      <DialogContent className="sm:max-w-[800px]"> {/* Removed overflow-hidden */}
        <DialogHeader>
          <DialogTitle>
            模型选择
          </DialogTitle>
          <DialogDescription>
            选择一个适合您当前场景的 AI 模型。
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); }} className="w-full flex flex-col flex-grow"> {/* Removed overflow-hidden and h-full */}
          <TabsList className="flex flex-wrap w-full p-0 bg-transparent"> {/* Adjusted padding and background for tab list */}
            {Object.keys(groupedModelsByTag).map((tag) => (
              <TabsTrigger 
                key={tag} 
                value={tag} 
                className={`flex-grow-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 
                  ${activeTab === tag 
                    ? `bg-white shadow ${BASE_TEXT_GRADIENT} !text-transparent`
                    : 'bg-transparent text-gray-600 hover:bg-gray-50 border-b-2 border-transparent'} 
                `}
              >{tag}</TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(groupedModelsByTag).map(([tag, models]) => (
            <TabsContent key={tag} value={tag} className="flex-1 p-4 border border-gray-200 rounded-b-lg bg-white"> {/* Added border and rounded-b-lg to content */}
              <div className="grid grid-cols-3 gap-4 py-4 max-h-[calc(100vh-350px)] overflow-y-auto"> {/* Changed to grid layout with 3 columns, added max height and scroll */}
                {models.map((model: ISelectedModelOption) => (
                  <div
                    key={model.name}
                    onClick={() => handleSelectModel(model.model)}
                    onMouseEnter={() => setHoveredModelId(model.model)}
                    onMouseLeave={() => setHoveredModelId(null)}
                    className={`group relative p-0.5 rounded-md cursor-pointer transition-colors duration-200
                      ${(model.model === tempSelectedModelId)
                        ? BORDER_GRADIENT_CLASSES // Applied abstracted gradient for selected border
                        : `hover:${BORDER_GRADIENT_CLASSES}`}
                    `}
                  >
                    <div
                      className={`px-3 py-2 border border-transparent rounded-md text-sm break-words h-full w-full 
                        ${(model.model === tempSelectedModelId)
                          ? 'bg-white' // Inner white background for selected
                          : 'bg-gray-50 group-hover:bg-white'}
                      `}
                    >
                      <div className={`font-semibold 
                        ${(model.model === tempSelectedModelId) 
                          ? TEXT_GRADIENT_CLASSES // Selected state: gradient text
                          : (model.model === hoveredModelId 
                              ? TEXT_GRADIENT_CLASSES // Hover state: gradient text
                              : 'text-gray-800')
                        }
                      `}>{model.name}</div> 
                      <div className="text-gray-500 text-xs mt-1 leading-relaxed line-clamp-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="text-left w-full">
                              <div className="line-clamp-3">{getPersonaModelDescription(model.model)}</div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-wrap break-words">
                              {getPersonaModelDescription(model.model)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowModal(false)} className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none" style={{ outline: 'none', boxShadow: 'none' }}>取消</Button>
          <Button className={`${BORDER_GRADIENT_CLASSES} text-white transition-all duration-200 shadow-lg hover:shadow-lg hover:scale-100 transform-gpu will-change-[transform,background-color,color]`} onClick={handleConfirm}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeModelDialog;
