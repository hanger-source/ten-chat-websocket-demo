import {
  IOptions,
  ColorItem,
  LanguageOptionItem,
  VoiceOptionItem,
} from "@/types";
export const OPTIONS_KEY = "__options__";
export const DEFAULT_OPTIONS: IOptions = {
  channel: "",
  userName: "",
  userId: 0,
};

export const LANGUAGE_OPTIONS: LanguageOptionItem[] = [
  {
    label: "English",
    value: "en-US",
  },
  {
    label: "Chinese",
    value: "zh-CN",
  },
  {
    label: "Korean",
    value: "ko-KR",
  },
  {
    label: "Japanese",
    value: "ja-JP",
  },
];
export const VOICE_OPTIONS: VoiceOptionItem[] = [
  {
    label: "Male",
    value: "male",
  },
  {
    label: "Female",
    value: "female",
  },
];

export enum VideoSourceType {
  CAMERA = "camera",
  SCREEN = "screen",
  NONE = "none", // 新增 NONE 类型
}

export const VIDEO_SOURCE_OPTIONS = [
  {
    label: "摄像头",
    value: VideoSourceType.CAMERA,
  },
  {
    label: "屏幕共享",
    value: VideoSourceType.SCREEN,
  },
];

export const COLOR_LIST: ColorItem[] = [
  {
    active: "#0888FF",
    default: "#143354",
  },
  {
    active: "#563FD8",
    default: "#2C2553",
  },
  {
    active: "#18A957",
    default: "#173526",
  },
  {
    active: "#FFAB08",
    default: "#423115",
  },
  {
    active: "#FD5C63",
    default: "#462629",
  },
  {
    active: "#E225B2",
    default: "#481C3F",
  },
];

export type VoiceTypeMap = {
  [voiceType: string]: string;
};

export type VendorNameMap = {
  [vendorName: string]: VoiceTypeMap;
};

export type LanguageMap = {
  [language: string]: VendorNameMap;
};

export enum EMobileActiveTab {
  AGENT = "agent",
  CHAT = "chat",
}

export const MOBILE_ACTIVE_TAB_MAP = {
  [EMobileActiveTab.AGENT]: "Agent",
  [EMobileActiveTab.CHAT]: "Chat",
};

export const isLLM = (extensionName: string) => {
  return extensionName === "llm" || extensionName === "v2v";
};

export const isEditModeOn = import.meta.env.VITE_EDIT_GRAPH_MODE === "true";

// ocket 消息相关常量
export const TEN_MSGPACK_EXT_TYPE_MSG = -1; // 对应后端的 MessageUtils.TEN_MSGPACK_EXT_TYPE_MSG

export const MESSAGE_CONSTANTS = {
  NOT_APPLICABLE: 'N/A',
  SYS_EXTENSION_NAME: 'client_connection',
  PROPERTY_CLIENT_LOCATION_URI: '__client_location_uri__',
  PROPERTY_CLIENT_APP_URI: '__client_app_uri__',
  PROPERTY_CLIENT_GRAPH_ID: '__client_graph_id__',
  PROPERTY_CLIENT_GRAPH_NAME: '__client_graph_name__',
  PROPERTY_CLIENT_CHANNEL_ID: '__channel_id__',
  PROPERTY_MESSAGE_PRIORITY: '__message_priority__',
  DATA_NAME_ECHO_DATA: 'echo_data',
} as const;
