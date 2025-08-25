import React from 'react';
import { useAgentSettings } from '@/hooks/useAgentSettings';
import { VoiceOption, voiceOptions } from '@/common/voiceOptions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function VoiceSelection() {
  const { agentSettings, updateSettings } = useAgentSettings();
  // const form = useFormContext(); // Removed

  const handleVoiceChange = (selectedValue: string) => {
    updateSettings({
      cosy_voice_name: selectedValue,
    });
  };

  // Find the currently selected voice option to display its '音色' in the SelectTrigger
  const selectedVoiceOption = voiceOptions.find(
    (option) => option.voiceParam === agentSettings.cosy_voice_name,
  );

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="voice-select" className="text-sm font-medium leading-none">音色选择</label>
      <Select onValueChange={handleVoiceChange} value={agentSettings.cosy_voice_name || ''}>
        <SelectTrigger id="voice-select" className="w-[180px]">
          <SelectValue placeholder="选择一个音色">
            {selectedVoiceOption ? selectedVoiceOption.voiceName : "选择一个音色"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {voiceOptions.map((option: VoiceOption) => (
            <SelectItem key={option.voiceParam} value={option.voiceParam}>
              {option.voiceName} ({option.voiceTrait})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
