import { useMemo, useCallback } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { ISceneCard } from '@/types';
import { loadSelectedSceneNameFromLocal, loadSceneByNameFromLocal, LAST_SAVED_SCENE_TIMESTAMP_KEY } from '@/common/localSceneStorage';
import { sceneCards } from '@/common/sceneData'; // 重新引入 sceneCards
import { ISceneSetting } from '@/types'; // 导入 ISceneSetting
import { IModeOption, IReplaceableVoiceOption, ISelectedVoiceOption } from '@/types/modeOptions';
import {useSelector} from "react-redux";
import {RootState} from "@/store"; // 导入相关类型

/**
 * Custom hook that provides and manages the currently selected ISceneCard instance.
 * Uses usehooks-ts useLocalStorage for shared state across components.
 */
export const useSelectedScene = () => {
  const [selectedSceneAiPersonaName, setSelectedSceneAiPersonaName] = useLocalStorage(
    'selectedAiPersonaName', // localStorage key
    loadSelectedSceneNameFromLocal() // 直接使用值，不用函数
  );

  // 监听 lastSavedSceneTimestamp 的变化
  const [lastSavedTimestamp, setLastSavedTimestamp] = useLocalStorage(LAST_SAVED_SCENE_TIMESTAMP_KEY, '0');

  const modeOptions =  useSelector((state: RootState) => state.global.modeOptions);

  // 所有可用的场景，使用 useMemo 确保只在 sceneCards 变化时重新计算
  const allScenes: ISceneCard[] = useMemo(() => sceneCards, []);

  // 根据 selectedSceneAiPersonaName 从本地存储加载当前选定的场景对象
  const selectedScene: ISceneCard | undefined = useMemo(() => {
    if (selectedSceneAiPersonaName) {
      return loadSceneByNameFromLocal(selectedSceneAiPersonaName, 'saved');
    }
    return undefined;
  }, [selectedSceneAiPersonaName, lastSavedTimestamp]); // 添加 lastSavedTimestamp 作为依赖

  const switchSelectedScene = (aiPersonaName: string) => {
    setSelectedSceneAiPersonaName(aiPersonaName);
  };

  // 新增 getSceneSetting 函数
  const getSceneSetting = useCallback((): ISceneSetting | undefined => {
    if (!selectedScene) return undefined;

    const setting: ISceneSetting = {
      greeting: selectedScene.aiResponseGreeting || '',
      prompt: selectedScene.prompt || '',
    };

    // 打平 selectedModels
    if (selectedScene.selectedModels) {
      for (const key in selectedScene.selectedModels) {
        if (Object.prototype.hasOwnProperty.call(selectedScene.selectedModels, key)) {
          setting[key] = selectedScene.selectedModels[key];
        }
      }
    }

    // 打平 selectedVoices
    if (selectedScene.selectedVoices) {
      for (const key in selectedScene.selectedVoices) {
        if (Object.prototype.hasOwnProperty.call(selectedScene.selectedVoices, key)) {
          setting[key] = selectedScene.selectedVoices[key];
        }
      }
    }

    // 打平 selectedModelsOptions
    if (selectedScene.selectedModelsOptions) {
      for (const modelKey in selectedScene.selectedModelsOptions) {
        if (Object.prototype.hasOwnProperty.call(selectedScene.selectedModelsOptions, modelKey)) {
          const options = selectedScene.selectedModelsOptions[modelKey];
          for (const optionKey in options) {
            if (Object.prototype.hasOwnProperty.call(options, optionKey)) {
              setting[`${modelKey}_${optionKey}`] = options[optionKey];
            }
          }
        }
      }
    }

    return setting;
  }, [selectedScene]);

  const getDisplayVoiceName = useCallback((scene: ISceneCard | undefined): string => {
    if (!scene || !scene.selectedVoices || Object.keys(scene.selectedVoices).length === 0) {
      return ''; // 默认值
    }

    const firstVoiceKey = Object.keys(scene.selectedVoices)[0];
    const selectedVoiceId = scene.selectedVoices[firstVoiceKey];

    // 查找当前场景的默认模式配置，如果不存在则使用第一个模式配置
    const currentModeOption = modeOptions.find(mode => mode.value === scene.defaultModeValue) || modeOptions[0];

    if (!currentModeOption || !currentModeOption.metadata || !currentModeOption.metadata.replaceableVoices || !currentModeOption.metadata.voices) {
      return ''; // 默认值
    }

    // 从 replaceableVoices 中找到匹配的 key
    const replaceableVoiceConfig = currentModeOption.metadata.replaceableVoices.find(
      (rv: IReplaceableVoiceOption) => rv.key === firstVoiceKey
    );

    if (!replaceableVoiceConfig) {
      return ''; // 默认值
    }

    // 从 voices 中找到匹配的 voiceId (即 replaceableVoiceConfig.voice) 对应的显示名称
    const voiceOption = currentModeOption.metadata.voices.find(
      (v: ISelectedVoiceOption) => v.voice === selectedVoiceId
    );

    return voiceOption?.name || '';
  }, [modeOptions]);

  return {
    allScenes, // 重新导出 allScenes
    selectedScene,
    selectedSceneAiPersonaName,
    switchSelectedScene,
    getSceneSetting, // 导出 getSceneSetting
    getDisplayVoiceName, // 导出新的 getDisplayVoiceName 函数
    setLastSavedTimestamp, // 导出 setLastSavedTimestamp
  };
};