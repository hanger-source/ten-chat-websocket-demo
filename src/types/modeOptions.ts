import { IVideoResourceOptions } from "pixi.js";

export interface IModeOption {
  value: string;
  label: string;
  description: string;
  metadata?: IModeMetadata; // New: To store mode-specific metadata
}

export interface IModeMetadata {
  replaceableModels?: IReplaceableModelOption[];
  replaceableVoices?: IReplaceableVoiceOption[];
  models?: ISelectedModelOption[];
  voices?: ISelectedVoiceOption[];
}

export interface ISelectedModelOption {
  name: string;
  model: string;
  tag: string[];
  type: ModelCategory[];
  vendor: string;
  description: string;
}

export interface IReplaceableModelOption {
  type: ModelCategory;
  model: string;
  key: string;
}

export interface ISelectedVoiceOption {
  name: string;
  voice: string;
  tag: string[];
  previewAudioUrl: string;
  feature?: string;
}

export interface IReplaceableVoiceOption {
  voice: string;
  key: string;
}

export type ModelCategory =
  | '文本生成'
  | '全模态'
  | '推理模型'
  | '音频理解'
  | '视频理解'
  | '视频生成'
  | '图片处理'
  | '图片理解'
  | '图片生成'
  | '向量模型'
  | '语音合成'
  | '语音识别'
  | '排序模型';
