export interface IModeOption {
  value: string;
  label: string;
  description: string;
  metadata?: IModeMetadata; // New: To store mode-specific metadata
}

export const STANDARD_DIALOGUE_MODE_VALUE = "standard_dialogue";

export interface IModeMetadata {
  replaceableModels?: IReplaceableModelOption[];
  models?: ISelectedModelOption[];
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
