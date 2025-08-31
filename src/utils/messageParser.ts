import { Message, MessageType, CommandResult } from '@/types/message'; // 修正导入路径
import { WebSocketConnectionState } from '@/types/websocket'; // 仅当需要时，单独导入 WebSocketConnectionState
import { IChatMessage, IBaseChatMessage, ITextMessage, IImageMessage, ICommandResultMessage, IAsrResultMessage, IUnknownMessage, EMessageDataType, EMessageType } from '@/types/chat';

/**
 * 解析原始 WebSocket 消息并将其转换为标准化的 IChatMessage 格式。
 * @param rawMessage 原始 WebSocket 消息
 * @returns 标准化后的 IChatMessage
 */
export function parseWebSocketMessage(rawMessage: Message): IChatMessage | null {
    if (!rawMessage || !rawMessage.type) {
        console.warn("Invalid raw message received:", rawMessage);
        return null;
    }

    // 基础消息属性，所有类型都将继承这些属性
    const baseProps: IBaseChatMessage = {
        id: rawMessage.id || Date.now().toString(),
        role: EMessageType.AGENT, // 默认角色，后面会根据消息内容调整
        timestamp: rawMessage.timestamp || Date.now(),
        group_timestamp: rawMessage.properties?.group_timestamp || undefined,
        group_id: rawMessage.properties?.group_id || undefined,
        isFinal: rawMessage.properties?.end_of_segment === true, // 修正：使用 end_of_segment 来判断是否是最终消息
        data_type: rawMessage.properties?.data_type || undefined, // 修正：添加 data_type 的解析
    };

    switch (rawMessage.type) {
        case MessageType.DATA:
            const properties = rawMessage.properties || {};
            const role = properties.role || EMessageType.AGENT;
            const text = properties.text || properties.audio_text || '';
            const dataType = properties.type || EMessageDataType.TEXT; // 修正：从 properties.type 获取数据类型
            const imageUrl = dataType === EMessageDataType.IMAGE_URL ? (properties.data as string) : properties.image_url || undefined;
            const endOfSegment = properties.end_of_segment || false;
            const asrRequestId = properties.asr_request_id || undefined; // 从后端原始数据中获取 asr_request_id

            // 优先处理 ASR 消息：当原始消息的 name 为 "asr_result" 且包含 text 时
            if (rawMessage.name === "asr_result" && properties.text) {
                const asrRole = properties.role || EMessageType.USER; // ASR 结果通常是用户说的，默认为 USER
                return {
                    ...baseProps,
                    role: asrRole as EMessageType,
                    type: 'asr_result',
                    payload: {
                        asrText: properties.text, // 使用 properties.text 作为 ASR 文本
                    },
                    isFinal: endOfSegment, // 将 endOfSegment 映射到 isFinal
                    data_type: dataType, // 兼容旧的IChatItem字段
                    asrRequestId: asrRequestId, // 设置 asrRequestId
                } as IAsrResultMessage;
            }

            // 处理图片消息
            if (imageUrl) {
                return {
                    ...baseProps,
                    role: role as EMessageType,
                    type: 'image',
                    payload: {
                        imageUrl: imageUrl,
                        text: text, // 图片可能附带文本描述
                    },
                    end_of_segment: endOfSegment,
                    data_type: dataType,
                } as IImageMessage;
            }

            // 处理普通文本消息
            if (text) {
                return {
                    ...baseProps,
                    role: role as EMessageType,
                    type: 'text',
                    payload: {
                        text: text,
                    },
                    end_of_segment: endOfSegment,
                    data_type: dataType,
                } as ITextMessage;
            }

            // 如果是 DATA 消息，但文本、图片和 audio_text 都为空，则不处理这条消息
            if (!text && !imageUrl && !properties.audio_text) {
                console.log("Received DATA message with empty text, image, and audio_text, filtering out.", rawMessage);
                return null;
            }
            // 如果是 DATA 消息，但没有文本或图片，则返回未知消息
            console.log("Received DATA message without text or image, returning as unknown:", rawMessage);
            return {
                ...baseProps,
                role: role as EMessageType,
                type: 'unknown',
                payload: {
                    text: "[未知数据消息]"
                },
                end_of_segment: endOfSegment,
                data_type: dataType,
            } as IUnknownMessage;

        case MessageType.CMD_RESULT:
            // 暂时不展示命令结果消息
            return null;

        case MessageType.AUDIO_FRAME:
            // 音频帧消息不直接转换为聊天消息，由 useAudioFrameReceiver 处理
            return null;

        default:
            console.warn("Unhandled WebSocket message type, returning as unknown:", rawMessage.type, rawMessage);
            return {
                ...baseProps,
                role: EMessageType.SYSTEM, // 未知消息也视为系统消息
                type: 'unknown',
                payload: {
                    text: `[未知消息类型: ${rawMessage.type}]`
                },
            } as IUnknownMessage;
    }
}
