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

  const groupedVoicesByTag = React.useMemo(() => {
    return voicesForModal.reduce((acc: Record<string, ISelectedVoiceOption[]>, voice: ISelectedVoiceOption) => {
      // Assuming voice.tag can be undefined, provide a default empty array
      (voice.tag || []).forEach((tag: string) => {
        if (!acc[tag]) {
          acc[tag] = [];
        }
        acc[tag].push(voice);
      });
      return acc;
    }, {} as Record<string, ISelectedVoiceOption[]>);
  }, [voicesForModal]);

  useEffect(() => {
    if (showModal && Object.keys(groupedVoicesByTag).length > 0) {
      const selectedVoiceFromScene = getSelectedVoiceId(voiceKeyToSelect || ''); // 获取场景中已保存的语音
      const currentSelectedVoice = tempSelectedVoiceId || selectedVoiceFromScene; // 优先使用临时选择的语音

      let initialTab = Object.keys(groupedVoicesByTag)[0]; // Default to the first tab

      if (currentSelectedVoice && currentSelectedVoice !== '未选择') {
        for (const tag in groupedVoicesByTag) {
          if (groupedVoicesByTag[tag].some(voice => voice.voice === currentSelectedVoice)) {
            initialTab = tag;
            break;
          }
        }
      }
      setActiveTab(initialTab);
      setTempSelectedVoiceId(currentSelectedVoice !== '未选择' ? currentSelectedVoice : null);
    } else if (!showModal) {
      setActiveTab(''); // Reset activeTab when modal closes
      setTempSelectedVoiceId(null); // Reset tempSelectedVoiceId when modal closes
      if (playingAudio) {
        playingAudio.pause();
        setPlayingAudio(null);
      }
    }
  }, [showModal, groupedVoicesByTag, voiceKeyToSelect, getSelectedVoiceId, tempSelectedVoiceId]); // 移除 playingAudio 作为依赖

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
      updateEditingSelectedVoice(voiceKeyToSelect, tempSelectedVoiceId);
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

        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); }} className="w-full flex flex-col flex-grow">
          <TabsList className="flex flex-wrap w-full p-0 bg-transparent">
            {Object.keys(groupedVoicesByTag).map((tag) => (
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
          {Object.entries(groupedVoicesByTag).map(([tag, voices]) => (
            <TabsContent key={tag} value={tag} className="flex-1 p-4 border border-gray-200 rounded-b-lg bg-white">
              <div className="grid grid-cols-3 gap-4 py-4 max-h-[calc(100vh-350px)] overflow-y-auto">
                {voices.map((voice: ISelectedVoiceOption) => (
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
                      <div className="text-gray-500 text-xs mt-1 leading-relaxed line-clamp-3">
                        {voice.feature && <p className="mb-1">音色特质：{voice.feature}</p>}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="text-left w-full">
                              <div className="line-clamp-3">{getPersonaVoiceDisplayName(voice.voice)}</div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-wrap break-words">
                              {getPersonaVoiceDisplayName(voice.voice)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
