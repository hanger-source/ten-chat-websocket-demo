import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ISceneCard } from '@/types';
import { loadSceneByNameFromLocal, saveSceneByNameToLocal } from '@/common/localSceneStorage'; // 导入本地存储辅助函数
import { useSelectedScene } from './useSelectedScene'; // 导入 useSelectedScene
import {
  IModeOption,
  ISelectedModelOption,
  IReplaceableModelOption,
  ISelectedVoiceOption,
  IReplaceableVoiceOption,
  ModelCategory
} from '@/types/modeOptions'; // 导入模式相关的类型
import { modeOptions } from '@/common/mockModeOptionsData'; // 导入模式选项数据

/**
 * Custom hook that provides and manages an editable ISceneCard instance (editingScene) internally.
 * This hook is completely decoupled from Redux, any global state, or global modes.
 * It strictly operates on its internally managed editingScene state,
 * which is loaded from and saved to local storage directly, based on an internally managed aiPersonaName.
 * It also derives mode configurations based on editingScene's defaultModeValue.
 */
export const useAiPersionalEdit = () => {
  // 直接使用 useSelectedScene 的值，避免重复的 localStorage 管理
  const { selectedSceneAiPersonaName, switchSelectedScene } = useSelectedScene();
  const editingSceneAiPersonaName = selectedSceneAiPersonaName;

  const [editingScene, setEditingScene] = useState<ISceneCard>(
    () => {
      const initialScene = loadSceneByNameFromLocal(editingSceneAiPersonaName);
      return initialScene;
    }
  );

  useEffect(() => {
    const loadedScene = loadSceneByNameFromLocal(editingSceneAiPersonaName);
    setEditingScene(loadedScene);
  }, [editingSceneAiPersonaName]);

  // 移除自动保存逻辑，改为手动保存
  // useEffect(() => {
  //   if (editingScene && editingScene.aiPersonaName && editingScene.aiPersonaName === editingSceneAiPersonaName) {
  //     console.log('useAiPersionalEdit - saving scene:', editingScene.aiPersonaName);
  //     saveSceneByNameToLocal(editingScene);
  //   } else if (editingScene && editingScene.aiPersonaName) {
  //     console.log('useAiPersionalEdit - SKIPPING save - scene mismatch:', editingScene.aiPersonaName, 'vs', editingSceneAiPersonaName);
  //   }
  // }, [editingScene, editingSceneAiPersonaName]);

  const switchEditingScene = useCallback((aiPersonaName: string) => {
    switchSelectedScene(aiPersonaName);
  }, [switchSelectedScene]);

  // 手动保存当前编辑的场景
  const saveEditingScene = useCallback(() => {
    if (editingScene && editingScene.aiPersonaName && editingScene.aiPersonaName === editingSceneAiPersonaName) {
      saveSceneByNameToLocal(editingScene);
    }
  }, [editingScene, editingSceneAiPersonaName]);

  // --- 更新 editingScene 内部状态的方法 ---

  const updateEntireEditingScene = useCallback((newScene: ISceneCard) => {
    setEditingScene(newScene);
  }, []);

  const updateEditingSceneField = useCallback(<K extends keyof ISceneCard>(field: K, value: ISceneCard[K]) => {
    setEditingScene(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateEditingSelectedModel = useCallback((modelKey: string, modelId: string) => {
    setEditingScene(prev => ({
      ...prev,
      selectedModels: {
        ...(prev.selectedModels || {}),
        [modelKey]: modelId,
      },
    }));
  }, []);

  const updateEditingSelectedVoice = useCallback((voiceKey: string, voiceId: string) => {
    setEditingScene(prev => ({
      ...prev,
      selectedVoices: {
        ...(prev.selectedVoices || {}),
        [voiceKey]: voiceId,
      },
    }));
  }, []);

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
    const modelsFromMetadata = derivedModeConfiguration.metadata.models || [];
    return modelsFromMetadata.filter((modelOption: ISelectedModelOption) => {
      return modelOption.type.some((t: ModelCategory) => availableModelConfig.type.includes(t));
    });
  }, [derivedModeConfiguration, editingScene]);

  const getVoicesForAvailableKey = useCallback((voiceKey: string | null): ISelectedVoiceOption[] => {
    if (!derivedModeConfiguration || !voiceKey || !derivedModeConfiguration.metadata?.replaceableVoices || !editingScene) return [];
    return derivedModeConfiguration.metadata.voices || [];
  }, [derivedModeConfiguration, editingScene]);

  const getAvailableModelConfig = useCallback((modelKey: string | null): IReplaceableModelOption | undefined => {
    if (!derivedModeConfiguration || !modelKey || !derivedModeConfiguration.metadata?.replaceableModels || !editingScene) return undefined;
    return derivedModeConfiguration.metadata.replaceableModels.find((rm: IReplaceableModelOption) => rm.key === modelKey);
  }, [derivedModeConfiguration, editingScene]);

  const getAvailableVoiceConfig = useCallback((voiceKey: string | null): IReplaceableVoiceOption | undefined => {
    if (!derivedModeConfiguration || !voiceKey || !derivedModeConfiguration.metadata?.replaceableVoices || !editingScene) return undefined;
    return derivedModeConfiguration.metadata.replaceableVoices.find((rv: IReplaceableVoiceOption) => rv.key === voiceKey);
  }, [derivedModeConfiguration, editingScene]);

  const getPersonaModelDescription = useCallback((modelName: string): string => {
    const metadataModel = derivedModeConfiguration?.metadata?.models?.find(m => m.model === modelName);
    return metadataModel?.description || '暂无描述';
  }, [derivedModeConfiguration]);

  const getPersonaVoiceDisplayName = useCallback((voiceName: string): string => {
    const metadataVoice = derivedModeConfiguration?.metadata?.voices?.find(v => v.voice === voiceName);
    return metadataVoice?.name || '暂无描述';
  }, [derivedModeConfiguration]);

  const getEditingSelectedVoiceInfo = useCallback((voiceKey: string): ISelectedVoiceOption | undefined => {
    const selectedVoiceId = editingScene?.selectedVoices?.[voiceKey];
    if (selectedVoiceId && derivedModeConfiguration?.metadata?.voices) {
      return derivedModeConfiguration.metadata.voices.find(v => v.voice === selectedVoiceId);
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
    setEditingSceneMode, // 提供更新模式的方法
    getPrompt,
    getAiResponseGreeting,
    getSelectedModelId,
    getSelectedVoiceId,
    getEditingDefaultModeValue, // 提供获取模式的方法
    getModelsForAvailableKey,
    getVoicesForAvailableKey,
    getAvailableModelConfig,
    getAvailableVoiceConfig,
    getPersonaModelDescription,
    getPersonaVoiceDisplayName,
    getEditingSelectedVoiceInfo,
    derivedModeConfiguration, // 暴露 derivedModeConfiguration
  };
};
