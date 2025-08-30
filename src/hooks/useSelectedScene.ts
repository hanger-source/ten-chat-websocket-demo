import { useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { ISceneCard } from '@/types';
import { sceneCards } from '@/common/sceneData';
import { loadSelectedSceneNameFromLocal } from '@/common/localSceneStorage';

/**
 * Custom hook that provides and manages the currently selected ISceneCard instance.
 * Uses usehooks-ts useLocalStorage for shared state across components.
 */
export const useSelectedScene = () => {
  // 使用 usehooks-ts 的 useLocalStorage hook
  // 初始值使用 localSceneStorage.ts 的逻辑来确保一致性
  const [selectedSceneAiPersonaName, setSelectedSceneAiPersonaName] = useLocalStorage(
    'selectedAiPersonaName', // localStorage key
    loadSelectedSceneNameFromLocal() // 直接使用值，不用函数
  );

  // 所有可用的场景，使用 useMemo 确保只在 sceneCards 变化时重新计算
  const allScenes: ISceneCard[] = useMemo(() => sceneCards, []);

  // 根据 selectedSceneAiPersonaName 派生出当前选定的场景对象
  const selectedScene: ISceneCard | undefined = useMemo(() => {
    const foundScene = allScenes.find(scene => scene.aiPersonaName === selectedSceneAiPersonaName);
    return foundScene;
  }, [allScenes, selectedSceneAiPersonaName]);

  // 切换场景的函数
  const switchSelectedScene = (aiPersonaName: string) => {
    setSelectedSceneAiPersonaName(aiPersonaName);
  };

  return {
    allScenes,
    selectedScene,
    selectedSceneAiPersonaName,
    switchSelectedScene,
  };
};