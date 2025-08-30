import { IModeOption, ISelectedModelOption, IModeMetadata, ModelCategory } from "./modeData";

export const modeOptions: IModeOption[] = [
  {
    value: "standard_dialogue",
    label: "标准对话",
    description: "基于标准组件构建的对话能力。",
    metadata: {
      replaceableModels: [{
        type: "文本生成",
        key: 'textModel',
        model: "qwen-max"
      },{
        type: "视频理解",
        key: 'visionModel',
        model: "qwen-vl-max"
      }],
      models :[
        {
          name: "通义千问-Plus-Character",
          model: 'qwen-plus-character',
          type: ['文本生成'],
          tag: ['角色扮演模型'],
          vendor: "通义",
          description: "通义千问系列角色扮演模型，本模型是动态更新版本，模型更新会提前通知，适合拟人化的角色扮演，同时优化了限定人设指令遵循、话题推进、倾听共情等能力，支持个性化角色的深度还原。",
        },
        {
        name: "通义千问3",
        model: 'qwen3',
        type: ['文本生成', '推理模型'],
        tag: ['语言模型'],
        vendor: "通义",
        description: "Qwen3全系列模型，实现思考模式和非思考模式的有效融合，可在对话中切换模式。",
      },
      {
        name: "通义千问plus",
        model: 'qwen-plus',
        type: ['文本生成', '推理模型'],
        tag: ['语言模型'],
        vendor: "通义",
        description: "通义千问超大规模语言模型的增强版，支持中文英文等不同语言输入。主干模型、latest和快照04-28已升级Qwen3系列，实现思考模式和非思考模式的有效融合，可在对话中切换模式。",
      },
      {
        name: "通义千问flash",
        model: 'qwen-flash',
        type: ['文本生成', '推理模型'],
        tag: ['语言模型'],
        vendor: "通义",
        description: "Qwen3系列Flash模型，实现思考模式和非思考模式的有效融合，可在对话中切换模式。复杂推理类任务性能优秀，指令遵循、文本理解等能力显著提高。支持1M上下文长度，按照上下文长度进行阶梯计费。",
      },
      {
        name: "通义千问max",
        model: 'qwen-max',
        type: ['文本生成'],
        tag: ['语言模型'],
        vendor: "通义",
        description: "通义千问2.5系列千亿级别超大规模语言模型，支持中文英文等不同语言输入。随着模型的升级，qwen-max将滚动更新升级。如果希望使用固定版本，请使用历史快照版本。",
      },
      {
        name: "通义千问turbo",
        model: 'qwen-turbo',
        type: ['文本生成'],
        tag: ['语言模型'],
        vendor: "通义",
        description: "通义千问超大规模语言模型，支持中文英文等不同语言输入。主干模型、latest和快照04-28已升级Qwen3系列，实现思考模式和非思考模式的有效融合，可在对话中切换模式。",
      },{
        name: "通义千问 vl max",
        model: 'qwen-vl-max',
        type: ["视频理解"],
        tag: ['视觉语言模型'],
        vendor: "通义",
        description: "通义千问VL-Max（qwen-vl-max），即通义千问超大规模视觉语言模型。相比增强版，再次提升视觉推理能力和指令遵循能力，提供更高的视觉感知和认知水平。在更多复杂任务上提供最佳的性能。",
      },{
        name: "通义千问 vl plus",
        model: 'qwen-vl-plus',
        type: ["视频理解"],
        tag: ['视觉语言模型'],
        vendor: "通义",
        description: "通义千问VL-Plus（qwen-vl-plus），即通义千问大规模视觉语言模型增强版。大幅提升细节识别能力和文字识别能力，支持超百万像素分辨率和任意长宽比规格的图像。在广泛的视觉任务上提供卓越的性能。",
      }],
    },
  },
  {
    value: "instant_response",
    label: "即时响应",
    description: "基于实时api构建的实时对话，追求自然流畅的对话体验。",
    metadata: {},
  },
  {
    value: "fai_workflow",
    label: "FAI工作流",
    description: "专为FAI工作流设计，支持复杂的任务协作和自动化处理。",
    metadata: {},
  },
];
