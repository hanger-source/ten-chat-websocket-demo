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

export interface IModel {
  name: string;
  type: ModelCategory[]; // Model type is now an array of categories
  vendor: string; // Vendor of the model (e.g., "OpenAI", "Google", "Baidu")
  description?: string; // Optional description for the model
}

export const modelLibrary: IModel[] = [
  {
    name: "qwen3",
    type: ['文本生成', '推理模型'],
    vendor: "通义",
    description: "Qwen3全系列模型，实现思考模式和非思考模式的有效融合，可在对话中切换模式。",
  },
  {
    name: "qwen-plus",
    type: ['文本生成', '推理模型'],
    vendor: "通义",
    description: "通义千问超大规模语言模型的增强版，支持中文英文等不同语言输入。主干模型、latest和快照04-28已升级Qwen3系列，实现思考模式和非思考模式的有效融合，可在对话中切换模式。",
  },
  {
    name: "qwen-flash",
    type: ['文本生成', '推理模型'],
    vendor: "通义",
    description: "Qwen3系列Flash模型，实现思考模式和非思考模式的有效融合，可在对话中切换模式。复杂推理类任务性能优秀，指令遵循、文本理解等能力显著提高。支持1M上下文长度，按照上下文长度进行阶梯计费。",
  },
  {
    name: "qwen-max",
    type: ['文本生成'],
    vendor: "通义",
    description: "通义千问2.5系列千亿级别超大规模语言模型，支持中文英文等不同语言输入。随着模型的升级，qwen-max将滚动更新升级。如果希望使用固定版本，请使用历史快照版本。",
  },
  {
    name: "qwen-vision-max",
    type: ['图片理解', '全模态'],
    vendor: "通义",
    description: "通义千问视觉大模型，具备强大的图片理解能力。",
  },
  {
    name: "qwen-mt-plus",
    type: ['文本生成'],
    vendor: "通义",
    description: "基于Qwen3全面升级的旗舰级翻译大模型，支持92个语种互译，模型性能和翻译效果全面升级，并提供更稳定的术语定制、格式还原度、领域提示能力，让译文更精准、自然。",
  },
  {
    name: "qwen-mt-turbo",
    type: ['文本生成'],
    vendor: "通义",
    description: "基于Qwen3全面升级的轻量级文本翻译大模型，支持92个语种互译，模型性能和翻译效果全面升级，提供更稳定的术语定制、格式还原度、领域提示能力，让译文更精准、自然。",
  },
  {
    name: "qwen3-coder-480b-a35b-instruct",
    type: ['文本生成'],
    vendor: "通义",
    description: "基于Qwen3的代码生成模型，具有强大的Coding Agent能力，代码能力达到开源模型 SOTA。",
  },
  {
    name: "qwen3-coder-30b-a3b-instruct",
    type: ['文本生成'],
    vendor: "通义",
    description: "基于Qwen3的代码生成模型，继承Qwen3-Coder-480B-A35B-Instruct的coding agent能力，代码能力达到同尺寸规模模型SOTA。",
  },
  {
    name: "qwen-turbo",
    type: ['文本生成', '推理模型'],
    vendor: "通义",
    description: "通义千问超大规模语言模型，支持中文英文等不同语言输入。主干模型、latest和快照04-28已升级Qwen3系列，实现思考模式和非思考模式的有效融合，可在对话中切换模式。",
  },
  {
    name: "qwen2.5-7b-1m",
    type: ['文本生成'],
    vendor: "通义",
    description: "Qwen2.5系列7B模型，相较于 Qwen2，Qwen2.5 获得了显著更多的知识，并在编程能力和数学能力方面有了大幅提升。此外，新模型在指令执行、生成长文本、理解结构化数据（例如表格）以及生成结构化输出特别是 JSON 方面取得了显著改进。 上下文支持1M Token。",
  },
  {
    name: "qwen2.5-14b-1m",
    type: ['文本生成'],
    vendor: "通义",
    description: "Qwen2.5系列14B模型，相较于 Qwen2，Qwen2.5 获得了显著更多的知识，并在编程能力和数学能力方面有了大幅提升。此外，新模型在指令执行、生成长文本、理解结构化数据（例如表格）以及生成结构化输出特别是 JSON 方面取得了显著改进。 上下文长度支持1M Token。",
  },
  {
    name: "qwen-qwq-32b-preview",
    type: ['文本生成'],
    vendor: "通义",
    description: "QwQ模型是由 Qwen 团队开发的实验性研究模型，专注于增强 AI 推理能力。",
  },
  {
    name: "qwen2.5-72b",
    type: ['文本生成'],
    vendor: "通义",
    description: "Qwen2.5系列72B模型，相较于 Qwen2，Qwen2.5 获得了显著更多的知识，并在编程能力和数学能力方面有了大幅提升。此外，新模型在指令执行、生成长文本、理解结构化数据（例如表格）以及生成结构化输出特别是 JSON 方面取得了显著改进。",
  },
  {
    name: "qwen2.5-32b",
    type: ['文本生成'],
    vendor: "通义",
    description: "Qwen2.5系列32B模型，相较于 Qwen2，Qwen2.5 获得了显著更多的知识，并在编程能力和数学能力方面有了大幅提升。此外，新模型在指令执行、生成长文本、理解结构化数据（例如表格）以及生成结构化输出特别是 JSON 方面取得了显著改进。",
  },
  {
    name: "qwen2.5-14b",
    type: ['文本生成'],
    vendor: "通义",
    description: "Qwen2.5系列14B模型，相较于 Qwen2，Qwen2.5 获得了显著更多的知识，并在编程能力和数学能力方面有了大幅提升。此外，新模型在指令执行、生成长文本、理解结构化数据（例如表格）以及生成结构化输出特别是 JSON 方面取得了显著改进。",
  }
];
