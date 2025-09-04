export enum EMessageType {
    AGENT = "agent",
    USER = "user",
    ASSISTANT = "assistant", // 新增 assistant 角色
    SYSTEM = "system", // 新增 system 角色
}

export enum EMessageDataType {
    TEXT = "text",
    REASON = "reason",
    IMAGE = "image",
    IMAGE_URL = "image_url", // 修正：用于表示图片 URL 数据类型
}

// 基础聊天消息接口，包含所有消息类型共有的属性
export interface IBaseChatMessage {
    id: string;
    role: EMessageType; // 使用 EMessageType
    timestamp: number;
    end_of_segment?: boolean;
    group_timestamp?: number;
    group_id?: string;
    isFinal?: boolean; // 兼容字段，从 properties 获取
    data_type?: EMessageDataType; // 兼容旧的IChatItem字段
    asrRequestId?: string; // 新增：用于关联同一段语音识别的 ASR 结果，如果适用
    isInterrupted?: boolean; // 新增：表示消息是否已被中断
}

// 文本消息
export interface ITextMessage extends IBaseChatMessage {
    type: 'text';
    payload: {
        text: string;
        asrText?: string; // ASR 文本通常会更新到文本消息上
    };
}

// 图片消息
export interface IImageMessage extends IBaseChatMessage {
    type: 'image';
    payload: {
        imageUrl: string;
        text?: string; // 图片可以附带文本描述
    };
}

// 命令结果消息
export interface ICommandResultMessage extends IBaseChatMessage {
    type: 'command_result';
    payload: {
        commandResult: any; // 存储原始 CommandResult
        text?: string; // 可能也需要一个文本展示
    };
}

// 如果 ASR 结果需要单独作为一条消息显示 (例如，用户ASR消息)
export interface IAsrResultMessage extends IBaseChatMessage {
    type: 'asr_result';
    payload: {
        asrText: string;
    };
    isFinal?: boolean; // 新增：用于指示 ASR 结果是否为最终结果
    asr_request_id?: string; // 新增：用于关联同一段语音识别的 ASR 结果
}

// 自定义卡片消息
export interface ICustomCardMessage extends IBaseChatMessage {
    type: 'custom_card';
    payload: {
        customCardData: any; // 任意自定义数据
        text?: string; // 可能也需要一个文本展示
    };
}

// 音频消息
export interface IAudioMessage extends IBaseChatMessage {
    type: 'audio';
    payload: {
        text?: string; // 用于显示音频状态或相关文本，例如 "AI 正在说话..."
        audioUrl?: string; // 如果有直接的音频 URL 用于播放（虽然目前播放通过流处理）
    };
}

// 未知消息类型 (fallback)
export interface IUnknownMessage extends IBaseChatMessage {
    type: 'unknown';
    payload: {
        text?: string; // 未知消息也尝试显示文本
    };
}

// 所有的聊天消息类型构成一个判别联合
export type IChatMessage = ITextMessage
                         | IImageMessage
                         | ICommandResultMessage
                         | IAsrResultMessage
                         | ICustomCardMessage
                         | IAudioMessage // 添加 IAudioMessage
                         | IUnknownMessage;