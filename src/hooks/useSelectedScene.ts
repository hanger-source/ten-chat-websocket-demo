import { useMemo, useCallback } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { ISceneCard } from '@/types';
import { loadSelectedSceneNameFromLocal, loadSceneByNameFromLocal, LAST_SAVED_SCENE_TIMESTAMP_KEY } from '@/common/localSceneStorage';
import { sceneCards } from '@/common/sceneData'; // 重新引入 sceneCards
import { ISceneSetting } from '@/types'; // 导入 ISceneSetting

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
  const [lastSavedTimestamp] = useLocalStorage(LAST_SAVED_SCENE_TIMESTAMP_KEY, '0');

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
    return setting;
  }, [selectedScene]);

  return {
    allScenes, // 重新导出 allScenes
    selectedScene,
    selectedSceneAiPersonaName,
    switchSelectedScene,
    getSceneSetting, // 导出 getSceneSetting
  };
};