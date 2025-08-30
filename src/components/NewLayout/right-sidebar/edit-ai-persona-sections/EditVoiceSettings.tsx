import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { cn } from '@/lib/utils'; // Import cn utility
import { IModeOption, IReplaceableVoiceOption, ISelectedVoiceOption } from '@/types/modeOptions';
import { modeOptions } from '@/common/mockModeOptionsData';
import { Button } from '@/components/ui/button'; // Import Button
import ChangeVoiceDialog from "./ChangeVoiceDialog"; // Import the new component
import { useAiPersionalEdit } from '../../../../hooks/useAiPersionalEdit';

interface EditVoiceSettingsProps {
  className?: string;
}

const EditVoiceSettings: React.FC<EditVoiceSettingsProps> = ({ className }) => {
  const { editingScene, getEditingDefaultModeValue, getSelectedVoiceId, getVoicesForAvailableKey, getAvailableVoiceConfig, getPersonaVoiceDisplayName, derivedModeConfiguration } = useAiPersionalEdit();

  // 添加 useEffect 来监听 editingScene 的变化
  useEffect(() => {
  }, [editingScene]);

  const [showModal, setShowModal] = useState(false);
  const [voiceKeyToSelect, setVoiceKeyToSelect] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

  // 从 derivedModeConfiguration 中获取可替换的音色选项
  const replaceableVoiceOption: IReplaceableVoiceOption | undefined = derivedModeConfiguration?.metadata?.replaceableVoices?.[0];
  const selectedVoiceName = getSelectedVoiceId(replaceableVoiceOption?.key || '');
  const voiceInMetadata = derivedModeConfiguration?.metadata?.voices?.find(v => v.voice === selectedVoiceName);

  const handleChangeVoiceClick = (key: string) => {
    if (!editingScene || !getAvailableVoiceConfig(key)) {
      return;
    }
    setVoiceKeyToSelect(key);
    setShowModal(true);
  };

  const currentReplaceableVoiceConfig = getAvailableVoiceConfig(voiceKeyToSelect); // 直接从 hook 获取

  const handlePlayPreview = (url: string) => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
    }
    const audio = new Audio(url);
    audio.play();
    setPlayingAudio(audio);
  };

  return (
    <div className={cn("mb-6 relative", className)}>
      <div className="relative bg-white rounded-lg shadow-sm pt-4 p-4 border border-gray-200">
        <div className="absolute top-0 left-4 -translate-y-1/2 flex space-x-2 bg-white px-2 z-10">
          <span className="px-3 py-1 rounded-md text-sm font-normal bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent border-transparent">音色</span>
        </div>
        <div className="pt-2 text-gray-600 text-sm">
          {replaceableVoiceOption ? (
            voiceInMetadata ? (
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <h4 className="font-semibold mb-1">{voiceInMetadata.name}</h4>
                  {voiceInMetadata.feature && <p className="text-xs text-gray-500 mt-1">音色特质：{voiceInMetadata.feature}</p>}
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  {voiceInMetadata.previewAudioUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => handlePlayPreview(voiceInMetadata.previewAudioUrl)}
                    >
                      试听
                    </Button>
                  )}
                  {replaceableVoiceOption && (
                    <Button
                      onClick={() => handleChangeVoiceClick(replaceableVoiceOption.key)}
                      className="mt-2 bg-gradient-to-br from-blue-100 to-white border-none hover:border-b-[1px] hover:border-gray-300"
                    >
                      <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">更换音色</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p>未选择音色。</p>
            )
          ) : (
            <p>没有可选音色。</p>
          )}
        </div>
      </div>

      <ChangeVoiceDialog
        showModal={showModal}
        setShowModal={setShowModal}
        voiceKeyToSelect={voiceKeyToSelect}
      />
    </div>
  );
};

export default EditVoiceSettings;
