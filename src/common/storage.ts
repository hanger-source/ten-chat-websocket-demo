import { IOptions, ITrulienceSettings, ISceneCard } from "@/types";
import {
  OPTIONS_KEY,
  DEFAULT_OPTIONS,
  TRULIENCE_SETTINGS_KEY,
  DEFAULT_TRULIENCE_OPTIONS,
  SCENE_STORAGE_KEY_PREFIX, // Import SCENE_STORAGE_KEY_PREFIX
} from "./constant";

export const getOptionsFromLocal = () => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(OPTIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  }
  return DEFAULT_OPTIONS;
};

export const setOptionsToLocal = (options: IOptions) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
  }
};

export const getTrulienceSettingsFromLocal = () => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(TRULIENCE_SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  }
  return DEFAULT_TRULIENCE_OPTIONS;
};

export const setTrulienceSettingsToLocal = (settings: ITrulienceSettings) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TRULIENCE_SETTINGS_KEY, JSON.stringify(settings));
  }
};

export const loadSceneFromLocal = (sceneName: string): ISceneCard | null => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(SCENE_STORAGE_KEY_PREFIX + sceneName);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error("Error parsing scene from local storage:", error);
        return null;
      }
    }
  }
  return null;
};

export const saveSceneToLocal = (scene: ISceneCard) => {
  if (typeof window !== "undefined" && scene.aiPersonaName) {
    localStorage.setItem(SCENE_STORAGE_KEY_PREFIX + scene.aiPersonaName, JSON.stringify(scene));
  }
};
