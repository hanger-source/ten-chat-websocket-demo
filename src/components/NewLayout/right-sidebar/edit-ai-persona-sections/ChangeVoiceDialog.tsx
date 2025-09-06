import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAiPersonalEdit } from '../../../../hooks/useAiPersonalEdit';
import { IModeOption, ISelectedVoiceOption, IReplaceableVoiceOption } from '@/types/modeOptions';

const BASE_TEXT_GRADIENT = "bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text";
const TEXT_GRADIENT_CLASSES = `${BASE_TEXT_GRADIENT} text-transparent`;

const BASE_BORDER_GRADIENT = "bg-gradient-to-br from-blue-400 to-pink-400 via-purple-400";
const BORDER_GRADIENT_CLASSES = BASE_BORDER_GRADIENT;

interface ChangeVoiceDialogProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  voiceKeyToSelect: string | null;
}

const ChangeVoiceDialog: React.FC<ChangeVoiceDialogProps> = (props) => {
  const {
    showModal,
    setShowModal,
    voiceKeyToSelect,
  } = props;
  const { editingScene, updateEditingSelectedVoice, getSelectedVoiceId, getVoicesForAvailableKey, getAvailableVoiceConfig, getPersonaVoiceDisplayName } = useAiPersonalEdit();
  const [activeTab, setActiveTab] = useState<string>('');
  const [hoveredVoiceId, setHoveredVoiceId] = useState<string | null>(null);
  const [tempSelectedVoiceId, setTempSelectedVoiceId] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

  const voicesForModal = React.useMemo(() => getVoicesForAvailableKey(voiceKeyToSelect), [getVoicesForAvailableKey, voiceKeyToSelect]);

  // 更改：先按 voiceModelName 分组，再按 tag 分组
  const groupedVoicesByModelAndTag = React.useMemo(() => {
      return voicesForModal.reduce((accModel: Record<string, Record<string, ISelectedVoiceOption[]>>, voice: ISelectedVoiceOption) => {
          const modelName = voice.voiceModelName || '未知模型'; // 使用 voiceModelName 作为第一级分组键
          if (!accModel[modelName]) {
              accModel[modelName] = {};
          }
          (voice.tag || []).forEach((tag: string) => {
              if (!accModel[modelName][tag]) {
                  accModel[modelName][tag] = [];
              }
              accModel[modelName][tag].push(voice);
          });
          return accModel;
      }, {} as Record<string, Record<string, ISelectedVoiceOption[]>>);
  }, [voicesForModal]);

  const [activeModelTab, setActiveModelTab] = useState<string>(''); // 新增：用于管理语音模型名称的 Tab 状态
  const [activeTagTab, setActiveTagTab] = useState<string>(''); // 更改：用于管理标签的 Tab 状态

  useEffect(() => {
    if (showModal && Object.keys(groupedVoicesByModelAndTag).length > 0) {
      const selectedVoiceFromScene = getSelectedVoiceId(voiceKeyToSelect || ''); // 获取场景中已保存的语音
      const currentSelectedVoice = tempSelectedVoiceId || selectedVoiceFromScene; // 优先使用临时选择的语音

      let initialModelTab = activeModelTab || Object.keys(groupedVoicesByModelAndTag)[0]; // Default to the first model tab, or retain current if exists
      if (!groupedVoicesByModelAndTag[initialModelTab]) { // If current model tab is no longer valid, default to first
          initialModelTab = Object.keys(groupedVoicesByModelAndTag)[0];
      }

      let initialTagTab = '';
      if (groupedVoicesByModelAndTag[initialModelTab] && Object.keys(groupedVoicesByModelAndTag[initialModelTab]).length > 0) {
          initialTagTab = Object.keys(groupedVoicesByModelAndTag[initialModelTab])[0];
      }
      
      // If a voice is already selected, try to find its model and tag
      if (currentSelectedVoice && currentSelectedVoice !== '未选择') {
        let found = false;
        for (const modelName in groupedVoicesByModelAndTag) {
          const tagsInModel = groupedVoicesByModelAndTag[modelName];
          if (tagsInModel) {
            for (const tag in tagsInModel) {
              if (tagsInModel[tag].some(voice => voice.voice === currentSelectedVoice)) {
                initialModelTab = modelName;
                initialTagTab = tag;
                found = true;
                break;
              }
            }
          }
          if (found) break;
        }
      }
      setActiveModelTab(initialModelTab);
      setActiveTagTab(initialTagTab);
      setTempSelectedVoiceId(currentSelectedVoice !== '未选择' ? currentSelectedVoice : null);
    } else if (!showModal) {
      setActiveModelTab(''); // Reset activeModelTab when modal closes
      setActiveTagTab(''); // Reset activeTagTab when modal closes
      setTempSelectedVoiceId(null); // Reset tempSelectedVoiceId when modal closes
      if (playingAudio) {
        playingAudio.pause();
        setPlayingAudio(null);
      }
    }
  }, [showModal, groupedVoicesByModelAndTag, voiceKeyToSelect, getSelectedVoiceId, tempSelectedVoiceId]); // 移除 activeModelTab 作为依赖，因为它在内部被设置

  const handleSelectVoice = (selectedVoice: string) => {
    setTempSelectedVoiceId(selectedVoice);
  };

  const handlePlayPreview = (url: string) => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
    }
    const audio = new Audio(url);
    audio.play();
    setPlayingAudio(audio);
  };

  const handleConfirm = () => {
    if (editingScene && voiceKeyToSelect && tempSelectedVoiceId) {
      const replaceableVoiceConfig = getAvailableVoiceConfig(voiceKeyToSelect);
      const selectedVoiceOption = voicesForModal.find(voice => voice.voice === tempSelectedVoiceId);

      if (replaceableVoiceConfig && selectedVoiceOption) {
        updateEditingSelectedVoice(
          voiceKeyToSelect,
          tempSelectedVoiceId,
          replaceableVoiceConfig.model_key,
          selectedVoiceOption.voiceModel || ''
        );
      } else {
        // Fallback for when config or selected voice isn't found, though it should ideally not happen
        updateEditingSelectedVoice(voiceKeyToSelect, tempSelectedVoiceId, '', '');
      }
      setShowModal(false);
    } else {
      setShowModal(false);
    }
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            音色选择
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeModelTab} onValueChange={(value) => {
          setActiveModelTab(value);
          // 当主 Tab 切换时，更新子 Tab 为新模型下的第一个标签
          const newModelTags = groupedVoicesByModelAndTag[value];
          if (newModelTags && Object.keys(newModelTags).length > 0) {
            setActiveTagTab(Object.keys(newModelTags)[0]);
          } else {
            setActiveTagTab(''); // 如果没有标签，则设置为空
          }
        }} className="w-full flex flex-col flex-grow">
          <TabsList className="flex flex-wrap w-full p-0 bg-transparent">
            {Object.keys(groupedVoicesByModelAndTag).map((modelName) => (
              <TabsTrigger 
                key={modelName} 
                value={modelName} 
                className={`flex-grow-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 
                  ${activeModelTab === modelName 
                    ? `bg-white shadow ${BASE_TEXT_GRADIENT} !text-transparent`
                    : 'bg-transparent text-gray-600 hover:bg-gray-50 border-b-2 border-transparent'} 
                `}
              >{modelName}</TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(groupedVoicesByModelAndTag).map(([modelName, tags]) => (
            <TabsContent key={modelName} value={modelName} className="flex-1 p-4 border border-gray-200 rounded-b-lg bg-white">
              <Tabs value={activeTagTab} onValueChange={(value) => { setActiveTagTab(value); }} className="w-full flex flex-col flex-grow">
                <TabsList className="flex flex-wrap w-full p-0 bg-transparent">
                  {Object.keys(tags).map((tag) => (
                    <TabsTrigger 
                      key={tag} 
                      value={tag} 
                      className={`flex-grow-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 
                        ${activeTagTab === tag 
                          ? `bg-white shadow ${BASE_TEXT_GRADIENT} !text-transparent`
                          : 'bg-transparent text-gray-600 hover:bg-gray-50 border-b-2 border-transparent'} 
                      `}
                    >{tag}</TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value={activeTagTab} className="flex-1 p-4 border border-gray-200 rounded-b-lg bg-white">
                  <div className="grid grid-cols-3 gap-4 py-4 max-h-[calc(100vh-550px)] overflow-y-auto">
                    {tags[activeTagTab] && tags[activeTagTab].map((voice: ISelectedVoiceOption) => (
                      <div
                        key={voice.voice}
                        onClick={() => handleSelectVoice(voice.voice)}
                        onMouseEnter={() => setHoveredVoiceId(voice.voice)}
                        onMouseLeave={() => setHoveredVoiceId(null)}
                        className={`group relative p-0.5 rounded-md cursor-pointer transition-colors duration-200
                          ${(voice.voice === tempSelectedVoiceId)
                            ? BORDER_GRADIENT_CLASSES
                            : `hover:${BORDER_GRADIENT_CLASSES}`}
                        `}
                      >
                        <div
                          className={`px-3 py-2 border border-transparent rounded-md text-sm break-words h-full w-full 
                            ${(voice.voice === tempSelectedVoiceId)
                              ? 'bg-white'
                              : 'bg-gray-50 group-hover:bg-white'} 
                          `}
                        >
                          <div className={`font-semibold 
                            ${(voice.voice === tempSelectedVoiceId) 
                              ? TEXT_GRADIENT_CLASSES
                              : (voice.voice === hoveredVoiceId 
                                  ? TEXT_GRADIENT_CLASSES
                                  : 'text-gray-800')
                            }
                          `}>{voice.name}</div> 
                          <div className="text-gray-500 text-sm mt-1 leading-relaxed line-clamp-3">
                            {voice.feature && <p className="mb-1 text-sm">{voice.feature}</p>}
                          </div>
                          {voice.previewAudioUrl && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-2" 
                              onClick={(e) => { 
                                e.stopPropagation(); // Prevent selecting voice when clicking play
                                handlePlayPreview(voice.previewAudioUrl);
                              }}
                            >
                              试听
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
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

export default ChangeVoiceDialog;
