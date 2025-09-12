import { useCallback, useEffect, useState } from "react";
import { IGlobalSettings } from "../types"; // 从 types/index.ts 导入 IGlobalSettings

const STORAGE_KEY = "ten-chat-global-settings";

const DEFAULT_GLOBAL_SETTINGS: IGlobalSettings = {
  enable_denoising: false, // 将 noiseReductionEnabled 重命名为 enable_denoising
};

let settingsCache: IGlobalSettings = loadSettingsFromLocalStorage();

function loadSettingsFromLocalStorage(): IGlobalSettings {
  if (typeof window === "undefined") {
    return DEFAULT_GLOBAL_SETTINGS;
  }
  const savedSettings = localStorage.getItem(STORAGE_KEY);
  try {
    const parsedSettings: IGlobalSettings = savedSettings
      ? JSON.parse(savedSettings)
      : {};
    return { ...DEFAULT_GLOBAL_SETTINGS, ...parsedSettings };
  } catch (e) {
    console.error("Failed to parse global settings from localStorage", e);
    return DEFAULT_GLOBAL_SETTINGS;
  }
}

function saveSettingsToLocalStorage(settings: IGlobalSettings) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}

export function useGlobalSettings() {
  const [globalSettings, setGlobalSettings] = useState<IGlobalSettings>(settingsCache);

  useEffect(() => {
    settingsCache = globalSettings;
    saveSettingsToLocalStorage(globalSettings);
  }, [globalSettings]);

  const updateGlobalSettings = useCallback((newSettings: Partial<IGlobalSettings>) => {
    setGlobalSettings((prevSettings) => {
      const updated = { ...prevSettings, ...newSettings };
      return updated;
    });
  }, []);

  return {
    globalSettings,
    updateGlobalSettings,
  };
}

export function getGlobalSettings(): IGlobalSettings {
  settingsCache = loadSettingsFromLocalStorage();
  return settingsCache;
}
