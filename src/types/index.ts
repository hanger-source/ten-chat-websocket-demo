export type Language = "en-US" | "zh-CN" | "ja-JP" | "ko-KR";
export type VoiceType = "male" | "female";

export interface ColorItem {
  active: string;
  default: string;
}

export interface IOptions {
  channel: string;
  userName: string;
  userId: number;
}
export interface IAgentSettings {
  greeting?: string;
  prompt?: string;
  env?: Record<string, string>;
  echo_cancellation?: boolean;
  noise_suppression?: boolean;
  auto_gain_control?: boolean;
  cosy_voice_name?: string;
}
export enum EMessageType {
  AGENT = "agent",
  USER = "user",
}

export enum EMessageDataType {
  TEXT = "text",
  REASON = "reason",
  IMAGE = "image",
  OTHER = "other",
}

export interface ISceneCard {
  tag: string | null;
  bgColor: string | null;
  iconSrc: string;
  text: string;
  aiPersonaName: string;
  aiCapabilities: string[];
  uiGreeting: string; // New: Short greeting for UI display
  aiResponseGreeting: string; // New: Longer greeting for AI response
  welcomeSubText: string;
  prompt: string; // New: To store the prompt for the AI
  selectedModels?: Record<string, string>; // New: To store dynamically selected models for the scene
  selectedVoices?: Record<string, string>; // New: To store dynamically selected voices for the scene
  selectedModelsOptions?: Record<string, Record<string, any>>; // New: To store configurable options for each selected model
  defaultModeValue?: string; // New: To store the default mode associated with this scene
  selectedModeValue?: string; // New: To store the selected mode associated with this scene
}

export interface ISceneSetting {
  greeting: string; // Mapped from uiGreeting
  prompt: string; // Mapped from prompt
  [key: string]: string | undefined; // For flattened selectedModels and selectedVoices
}

export interface IChatItem {
  id: string;
  userId: number | string;
  userName?: string;
  text: string;
  data_type: EMessageDataType;
  type: EMessageType;
  isFinal?: boolean;
  time: number;
}

export interface GraphOptionItem {
  label: string;
  value: string;
}

export interface LanguageOptionItem {
  label: string;
  value: Language;
}

export interface VoiceOptionItem {
  label: string;
  value: VoiceType;
}

export interface OptionType {
  value: string;
  label: string;
}

export interface IPdfData {
  fileName: string;
  collection: string;
}
