import { ISceneCard } from '@/types';
import { sceneCards } from '@/common/sceneData';
import {useLocalStorage} from "usehooks-ts";
import { IModeOption, IReplaceableModelOption, IReplaceableVoiceOption } from '@/types/modeOptions'; // 导入 IModeOption, IReplaceableModelOption 和 IReplaceableVoiceOption

// Function to get a dynamic key for local storage
export const getEditingSceneKey = (aiPersonaName: string): string => `editingAiPersonaScene_${aiPersonaName}`;
const getSavedSceneKey = (aiPersonaName: string): string => `savedAiPersonaScene_${aiPersonaName}`;

// 获取第一个默认场景的辅助函数
const getDefaultSceneFromData = (): ISceneCard => {
  return sceneCards.length > 0 ? sceneCards[0] : {
    tag: null, bgColor: null, iconSrc: '', text: '', aiPersonaName: 'default-persona', // 确保有默认名称
    aiCapabilities: [], uiGreeting: '', aiResponseGreeting: '', welcomeSubText: '', prompt: '',
    selectedModels: {}, selectedVoices: {}, selectedModelsOptions: {}, defaultModeValue: '',
  };
};

/**
 * Loads an ISceneCard from local storage based on its aiPersonaName and a type (editing or saved).
 * If not found, returns a default scene from sceneData.ts.
 * @param aiPersonaName The aiPersonaName of the scene to load.
 * @param type The type of scene to load: 'editing' or 'saved'.
 * @param modeOptions All available mode options to determine default models.
 * @returns ISceneCard The loaded or default ISceneCard.
 */
export const loadSceneByNameFromLocal = (aiPersonaName: string, type: 'editing' | 'saved' = 'editing', modeOptions: IModeOption[] = []): ISceneCard => {
  // 首先尝试从 sceneData.ts 中找到与 aiPersonaName 匹配的场景作为该 aiPersonaName 的默认场景。
  const initialDefaultScene = sceneCards.find(scene => scene.aiPersonaName === aiPersonaName) || getDefaultSceneFromData();
  
  if (typeof window === 'undefined') {
    return initialDefaultScene;
  }
  const localStorageKey = type === 'editing' ? getEditingSceneKey(aiPersonaName) : getSavedSceneKey(aiPersonaName);
  try {
    const serializedScene = localStorage.getItem(localStorageKey);
    let loadedScene: ISceneCard;
    if (serializedScene === null) {
      loadedScene = initialDefaultScene;
    } else {
      loadedScene = JSON.parse(serializedScene);
    }

    // Robustness: ensure all properties exist and aiPersonaName is consistent
    const sceneToReturn: ISceneCard = {
      tag: loadedScene.tag !== undefined ? loadedScene.tag : null,
      bgColor: loadedScene.bgColor !== undefined ? loadedScene.bgColor : null,
      iconSrc: loadedScene.iconSrc || '',
      text: loadedScene.text || '',
      aiPersonaName: loadedScene.aiPersonaName || aiPersonaName,
      aiCapabilities: loadedScene.aiCapabilities || [],
      uiGreeting: loadedScene.uiGreeting || '',
      aiResponseGreeting: loadedScene.aiResponseGreeting || '',
      welcomeSubText: loadedScene.welcomeSubText || '',
      prompt: loadedScene.prompt || '',
      selectedModels: loadedScene.selectedModels || {},
      selectedVoices: loadedScene.selectedVoices || {},
      selectedModelsOptions: loadedScene.selectedModelsOptions || {},
      defaultModeValue: loadedScene.defaultModeValue || '',
    };

    // Apply default models if selectedModels are missing keys based on replaceableModels
    const currentModeConfiguration = modeOptions.find(mode => mode.value === sceneToReturn.defaultModeValue);
    if (currentModeConfiguration?.metadata?.replaceableModels) {
      currentModeConfiguration.metadata.replaceableModels.forEach((rm: IReplaceableModelOption) => {
        if (!sceneToReturn.selectedModels![rm.key] || sceneToReturn.selectedModels![rm.key] === '未选择') {
          sceneToReturn.selectedModels![rm.key] = rm.model;
        }
      });
    }

    // Apply default voices if selectedVoices are missing keys based on replaceableVoices
    if (currentModeConfiguration?.metadata?.replaceableVoices) {
      currentModeConfiguration.metadata.replaceableVoices.forEach((rv: IReplaceableVoiceOption) => {
        if (!sceneToReturn.selectedVoices![rv.key] || sceneToReturn.selectedVoices![rv.key] === '未选择') {
          sceneToReturn.selectedVoices![rv.key] = rv.voice;
        }
      });
    }

    return sceneToReturn;
  } catch (error) {
    console.error(`Error loading scene '${aiPersonaName}' (${type}) from local storage:`, error);
    return initialDefaultScene;
  }
};

/**
 * Saves the given ISceneCard to local storage using its aiPersonaName as part of the key.
 * @param scene The ISceneCard to save.
 * @param type The type of scene to save: 'editing' or 'saved'.
 */
export const saveSceneByNameToLocal = (scene: ISceneCard, type: 'editing' | 'saved' = 'editing'): void => {
  if (typeof window === 'undefined' || !scene.aiPersonaName) {
    return;
  }
  const localStorageKey = type === 'editing' ? getEditingSceneKey(scene.aiPersonaName) : getSavedSceneKey(scene.aiPersonaName);
  try {
    const serializedScene = JSON.stringify(scene);
    localStorage.setItem(localStorageKey, serializedScene);
  } catch (error) {
    console.error(`Error saving scene '${scene.aiPersonaName}' (${type}) to local storage:`, error);
  }
};
// Key for storing the selected scene's aiPersonaName globally
const SELECTED_SCENE_AI_PERSONA_NAME_KEY = 'selectedAiPersonaName';

/**
 * Loads the selected scene's aiPersonaName from local storage.
 * If not found, returns the aiPersonaName of the default scene from sceneData.ts.
 * @returns string The aiPersonaName of the selected or default scene.
 */
export const loadSelectedSceneNameFromLocal = (): string => {
  if (typeof window === 'undefined') {
    return getDefaultSceneFromData().aiPersonaName;
  }
  try {
    const storedName = localStorage.getItem(SELECTED_SCENE_AI_PERSONA_NAME_KEY);
    return storedName || getDefaultSceneFromData().aiPersonaName;
  } catch (error) {
    console.error('Error loading selected scene name from local storage:', error);
    return getDefaultSceneFromData().aiPersonaName;
  }
};
export const LAST_SAVED_SCENE_TIMESTAMP_KEY = 'lastSavedSceneTimestamp';

/**
 * Updates the timestamp of the last saved scene in local storage.
 */
export const updateLastSavedSceneTimestamp = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(LAST_SAVED_SCENE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error updating last saved scene timestamp:', error);
  }
};
