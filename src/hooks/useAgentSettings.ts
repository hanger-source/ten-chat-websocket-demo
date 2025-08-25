import { useCallback, useEffect, useState } from "react";
import { IAgentSettings } from "@/types";
import { voiceOptions } from "@/common/voiceOptions";

const STORAGE_KEY = "ten-chat-agent-settings";

const DEFAULT_AGENT_SETTINGS: IAgentSettings = {
  greeting: "",
  prompt: "",
  env: {},
  echo_cancellation: true, // Changed from echoCancellation
  noise_suppression: true, // Changed from noiseSuppression
  auto_gain_control: true, // Changed from autoGainControl
  cosy_voice_name: voiceOptions[0]?.voiceParam || "",
};

let settingsCache: IAgentSettings = loadSettingsFromLocalStorage();

function loadSettingsFromLocalStorage(): IAgentSettings {
  if (typeof window === "undefined") {
    return DEFAULT_AGENT_SETTINGS;
  }
  const savedSettings = localStorage.getItem(STORAGE_KEY);
  try {
    const parsedSettings: IAgentSettings = savedSettings
      ? JSON.parse(savedSettings)
      : {};
    // Merge with defaults to ensure all properties are present
    const mergedSettings = {
      ...DEFAULT_AGENT_SETTINGS,
      ...parsedSettings,
      // Ensure specific boolean flags are correctly merged (default to true if undefined in parsedSettings)
      echo_cancellation: parsedSettings.echo_cancellation ?? DEFAULT_AGENT_SETTINGS.echo_cancellation, // Changed
      noise_suppression: parsedSettings.noise_suppression ?? DEFAULT_AGENT_SETTINGS.noise_suppression, // Changed
      auto_gain_control: parsedSettings.auto_gain_control ?? DEFAULT_AGENT_SETTINGS.auto_gain_control, // Changed
    };
    return mergedSettings;
  } catch (e) {
    console.error("Failed to parse agent settings from localStorage", e);
    return DEFAULT_AGENT_SETTINGS;
  }
}

function saveSettingsToLocalStorage(settings: IAgentSettings) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}

export function useAgentSettings() {
  const [agentSettings, setAgentSettings] = useState<IAgentSettings>(settingsCache);

  useEffect(() => {
    // Ensure settingsCache is always up-to-date with the latest settings state
    settingsCache = agentSettings;
    saveSettingsToLocalStorage(agentSettings);
  }, [agentSettings]);

  const updateSettings = useCallback((newSettings: Partial<IAgentSettings>) => {
    setAgentSettings((prevSettings) => {
      const updated = { ...prevSettings, ...newSettings };
      return updated;
    });
  }, []);

  return {
    agentSettings,
    updateSettings,
    saveSettings: (settings: IAgentSettings) => {
      setAgentSettings(settings);
      saveSettingsToLocalStorage(settings);
    },
  };
}

// Utility function to get the latest settings without re-rendering components
export function getAgentSettings(): IAgentSettings {
  // Ensure settingsCache is the absolute latest, considering any direct updates
  settingsCache = loadSettingsFromLocalStorage();
  return settingsCache;
}
