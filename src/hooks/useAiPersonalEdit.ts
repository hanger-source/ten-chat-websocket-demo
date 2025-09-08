import React, { useCallback, useMemo, useEffect } from 'react'; // 重新引入 useEffect
import { useLocalStorage } from 'usehooks-ts'; // 导入 useLocalStorage
import { ISceneCard } from '@/types';
import { loadSceneByNameFromLocal, saveSceneByNameToLocal, getEditingSceneKey } from '@/common/localSceneStorage'; // 导入本地存储辅助函数和 getEditingSceneKey
import { useSelectedScene } from './useSelectedScene'; // 导入 useSelectedScene
import {
  IModeOption,
  ISelectedModelOption,
  IReplaceableModelOption,
  ISelectedVoiceOption,
  IReplaceableVoiceOption,
  ModelCategory,
  IConfigurableOption // 导入 IConfigurableOption
} from '@/types/modeOptions'; // 导入模式相关的类型
import {useSelector} from "react-redux";
import {RootState} from "@/store"; // 导入模式选项数据

/**
 * Custom hook that provides and manages an editable ISceneCard instance (editingScene) internally.
 * This hook is completely decoupled from Redux, any global state, or global modes.
 * It strictly operates on its internally managed editingScene state,
 * which is loaded from and saved to local storage directly, based on an internally managed aiPersonaName.
 * It also derives mode configurations based on editingScene's defaultModeValue.
 */
export const useAiPersonalEdit = () => {
  // 直接使用 useSelectedScene 的值，避免重复的 localStorage 管理
  const { selectedSceneAiPersonaName, switchSelectedScene, setLastSavedTimestamp } = useSelectedScene();
  const editingSceneAiPersonaName = selectedSceneAiPersonaName;

  const modeOptions =  useSelector((state: RootState) => state.global.modeOptions);

  // 使用 useLocalStorage 来管理 editingScene (代表临时编辑状态)
  const [editingScene, setEditingScene] = useLocalStorage<ISceneCard>(
    getEditingSceneKey(editingSceneAiPersonaName), // localStorage key
    // 初始值在组件首次挂载时加载对应 selectedSceneAiPersonaName 的“已保存”场景
    () => loadSceneByNameFromLocal(editingSceneAiPersonaName, 'saved', modeOptions)
  );

  // 当 selectedSceneAiPersonaName 变化时（包括刷新），重置 editingScene 为该角色的“已保存”状态
  useEffect(() => {
    const savedScene = loadSceneByNameFromLocal(editingSceneAiPersonaName, 'saved', modeOptions);
    // 将“已保存”场景写入本地存储作为“编辑中”状态，以清除旧的临时编辑
    saveSceneByNameToLocal(savedScene, 'editing');
    setEditingScene(savedScene); // 同时更新当前 state
  }, [editingSceneAiPersonaName, setEditingScene, modeOptions]);

  const switchEditingScene = useCallback((aiPersonaName: string) => {
    switchSelectedScene(aiPersonaName);
  }, [switchSelectedScene]);

  // 手动保存当前编辑的场景 (保存为 “已保存” 场景)
  const saveEditingScene = useCallback(() => {
    if (editingScene && editingScene.aiPersonaName && editingScene.aiPersonaName === editingSceneAiPersonaName) {
      saveSceneByNameToLocal(editingScene, 'saved'); // 保存为 "saved" 类型
      setLastSavedTimestamp(Date.now().toString()); // 通过 setLastSavedTimestamp 更新时间戳
      // 保存后，将当前的 editingScene 也更新到编辑状态，保持同步
      const updatedSavedScene = loadSceneByNameFromLocal(editingSceneAiPersonaName, 'saved');
      saveSceneByNameToLocal(updatedSavedScene, 'editing'); // 更新 editing 状态为 saved 状态
      setEditingScene(updatedSavedScene); // 更新当前 state
    }
  }, [editingScene, editingSceneAiPersonaName, setEditingScene, setLastSavedTimestamp]); // 添加 setLastSavedTimestamp 作为依赖

  // --- 更新 editingScene 内部状态的方法 ---

  const updateEntireEditingScene = useCallback((newScene: ISceneCard) => {
    setEditingScene(newScene);
  }, [setEditingScene]);

  const updateEditingSceneField = useCallback(<K extends keyof ISceneCard>(field: K, value: ISceneCard[K]) => {
    setEditingScene(prevEditingScene => ({
      ...prevEditingScene,
      [field]: value
    }));
  }, [setEditingScene]);

  const updateEditingSelectedModel = useCallback((modelKey: string, modelId: string) => {
    setEditingScene(prevEditingScene => {
      const newSelectedModels = {
        ...(prevEditingScene.selectedModels || {}),
        [modelKey]: modelId,
      };
      return { ...prevEditingScene, selectedModels: newSelectedModels };
    });
  }, [setEditingScene]);

  const updateEditingSelectedVoice = useCallback((voiceKey: string, voiceId: string, modelKey: string, selectedVoiceModel: string) => {
    setEditingScene(prevEditingScene => {
      const newSelectedVoices = {
        ...(prevEditingScene.selectedVoices || {}),
        [voiceKey]: voiceId,
        [modelKey]: selectedVoiceModel,
      };
      return { ...prevEditingScene, selectedVoices: newSelectedVoices };
    });
  }, [setEditingScene]);

  const updateEditingModelOptions = useCallback((modelKey: string, config: Record<string, any>) => {
    setEditingScene(prevEditingScene => {
      const newSelectedModelsOptions = {
        ...(prevEditingScene.selectedModelsOptions || {}),
        [modelKey]: config,
      };
      return { ...prevEditingScene, selectedModelsOptions: newSelectedModelsOptions };
    });
  }, [setEditingScene]);

  // --- 模式相关的逻辑：根据 editingScene 的 defaultModeValue 派生 currentMode ---
  const derivedModeConfiguration: IModeOption | undefined = useMemo(
    () => modeOptions.find(mode => mode.value === editingScene.defaultModeValue),
    [editingScene.defaultModeValue]
  );

  // --- 更新 editingScene 的 defaultModeValue (即更新当前模式) ---
  const setEditingSceneMode = useCallback((modeValue: string) => {
    updateEditingSceneField('defaultModeValue', modeValue);
  }, [updateEditingSceneField]);

  // --- 从 editingScene 中读取属性的纯函数 ---
  const getPrompt = useCallback((): string => {
    return editingScene.prompt || '';
  }, [editingScene.prompt, editingScene]); // 增加 editingScene.prompt 作为依赖

  const getAiResponseGreeting = useCallback((): string => {
    return editingScene.aiResponseGreeting || '';
  }, [editingScene.aiResponseGreeting, editingScene]); // 增加 editingScene.aiResponseGreeting 作为依赖

  const getSelectedModelId = useCallback((modelKey: string): string => {
    return editingScene.selectedModels?.[modelKey] || '未选择';
  }, [editingScene.selectedModels, editingScene]); // 增加 editingScene.selectedModels 作为依赖

  const getSelectedVoiceId = useCallback((voiceKey: string): string => {
    return editingScene.selectedVoices?.[voiceKey] || '未选择';
  }, [editingScene.selectedVoices, editingScene]); // 增加 editingScene.selectedVoices 作为依赖

  const getEditingDefaultModeValue = useCallback((): string => { // 重命名以区分
    return editingScene.defaultModeValue || '';
  }, [editingScene.defaultModeValue, editingScene]); // 增加 editingScene.defaultModeValue 作为依赖

  // --- 辅助数据获取和派生方法 (基于 editingScene 和 derivedModeConfiguration) ---

  const getModelsForAvailableKey = useCallback((modelKey: string | null): ISelectedModelOption[] => {
    if (!derivedModeConfiguration || !modelKey || !derivedModeConfiguration.metadata?.replaceableModels || !editingScene) return [];
    const availableModelConfig = derivedModeConfiguration.metadata.replaceableModels.find(
      (rm: IReplaceableModelOption & { key: string }) => rm.key === modelKey
    );
    if (!availableModelConfig) return [];
    const modelsFromMetadata = derivedModeConfiguration.models || [];
    return modelsFromMetadata.filter((modelOption: ISelectedModelOption) => {
      return modelOption.type.some((t: ModelCategory) => availableModelConfig.type === t);
    });
  }, [derivedModeConfiguration, editingScene]);

  const getVoicesForAvailableKey = useCallback((voiceKey: string | null): ISelectedVoiceOption[] => {
    if (!derivedModeConfiguration || !voiceKey || !derivedModeConfiguration.metadata?.replaceableVoices || !editingScene) return [];
    return derivedModeConfiguration.voices || [];
  }, [derivedModeConfiguration, editingScene]);

  const getAvailableModelOptions = useCallback((modelKey: string | null): IReplaceableModelOption | undefined => {
    if (!derivedModeConfiguration || !modelKey || !derivedModeConfiguration.metadata?.replaceableModels || !editingScene) return undefined;
    return derivedModeConfiguration.metadata.replaceableModels.find((rm: IReplaceableModelOption) => rm.key === modelKey);
  }, [derivedModeConfiguration, editingScene]);

  const getAvailableVoiceConfig = useCallback((voiceKey: string | null): IReplaceableVoiceOption | undefined => {
    if (!derivedModeConfiguration || !voiceKey || !derivedModeConfiguration.metadata?.replaceableVoices || !editingScene) return undefined;
    return derivedModeConfiguration.metadata.replaceableVoices.find((rv: IReplaceableVoiceOption) => rv.key === voiceKey);
  }, [derivedModeConfiguration, editingScene]);

  const getPersonaModelDescription = useCallback((modelName: string, modelType: ModelCategory): string => {
    const metadataModel = derivedModeConfiguration?.models?.find(m => m.model === modelName && m.type.includes(modelType));
    return metadataModel?.description || '暂无描述';
  }, [derivedModeConfiguration]);

  const getFilteredConfigurableOptions = useCallback((modelKey: string | null, selectedModelId: string | null): IConfigurableOption[] => {
    if (!derivedModeConfiguration || !modelKey || !selectedModelId) return [];

    const availableModelConfig = derivedModeConfiguration.metadata?.replaceableModels?.find(
      (rm: IReplaceableModelOption) => rm.key === modelKey
    );

    if (!availableModelConfig || !availableModelConfig.configurableOptions) return [];

    return availableModelConfig.configurableOptions.filter(option => {
      return !option.supportModels || option.supportModels.includes(selectedModelId);
    });
  }, [derivedModeConfiguration]);

  const getPersonaVoiceDisplayName = useCallback((voiceName: string): string => {
    const metadataVoice = derivedModeConfiguration?.voices?.find(v => v.voice === voiceName);
    return metadataVoice?.name || '暂无描述';
  }, [derivedModeConfiguration]);

  const getEditingSelectedVoiceInfo = useCallback((voiceKey: string): ISelectedVoiceOption | undefined => {
    const selectedVoiceId = editingScene?.selectedVoices?.[voiceKey];
    if (selectedVoiceId && derivedModeConfiguration?.voices) {
      return derivedModeConfiguration.voices.find(v => v.voice === selectedVoiceId);
    }
    return undefined;
  }, [editingScene, derivedModeConfiguration]);


  // 返回对象
  return {
    editingScene, // Hook 提供这个内部维护的编辑场景
    editingSceneAiPersonaName, // 提供当前正在编辑场景的名称
    switchEditingScene, // 提供切换正在编辑场景的方法
    saveEditingScene, // 提供手动保存场景的方法
    updateEntireEditingScene,
    updateEditingSceneField,
    updateEditingSelectedModel,
    updateEditingSelectedVoice,
    updateEditingModelOptions, // New: Add this method
    setEditingSceneMode, // 提供更新模式的方法
    getPrompt,
    getAiResponseGreeting,
    getSelectedModelId,
    getSelectedVoiceId,
    getEditingDefaultModeValue, // 提供获取模式的方法
    getModelsForAvailableKey,
    getVoicesForAvailableKey,
    getAvailableModelOptions, // Rename this
    getAvailableVoiceConfig,
    getPersonaModelDescription,
    getFilteredConfigurableOptions,
    getPersonaVoiceDisplayName,
    getEditingSelectedVoiceInfo,
    derivedModeConfiguration, // 暴露 derivedModeConfiguration
  };
};
