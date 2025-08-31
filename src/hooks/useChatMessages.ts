import React, { useState, useEffect, useRef, useCallback } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { Message, MessageType } from '@/types/message';
import { IChatMessage, ITextMessage, IImageMessage, IAsrResultMessage, EMessageType } from '@/types/chat';
import { ICommandResultMessage, ICustomCardMessage, IAudioMessage, IUnknownMessage } from '@/types/chat'; // 导入所有缺失的聊天消息类型
import { parseWebSocketMessage } from '@/utils/messageParser';
import { v4 as uuidv4 } from 'uuid';

interface UseChatMessagesReturn {
    chatMessages: IChatMessage[];
    addChatMessage: (message: IChatMessage) => void; // 添加 addChatMessage 函数到返回接口
    clearMessages: () => void; // 新增 clearMessages 函数到返回接口
}

// 类型守卫函数，用于缩小 IChatMessage 的类型
const isTextMessage = (message: IChatMessage): message is ITextMessage => message.type === 'text';
const isAsrResultMessage = (message: IChatMessage): message is IAsrResultMessage => message.type === 'asr_result';
const isImageMessage = (message: IChatMessage): message is IImageMessage => message.type === 'image';
const isCommandResultMessage = (message: IChatMessage): message is ICommandResultMessage => message.type === 'command_result';
const isCustomCardMessage = (message: IChatMessage): message is ICustomCardMessage => message.type === 'custom_card';
const isAudioMessage = (message: IChatMessage): message is IAudioMessage => message.type === 'audio';
const isUnknownMessage = (message: IChatMessage): message is IUnknownMessage => message.type === 'unknown';

export const useChatMessages = (): UseChatMessagesReturn => {
    const [chatMessages, setChatMessages] = useState<IChatMessage[]>([]);
    const lastAsrRequestIdRef = useRef<string | undefined>(undefined); // 新增：用于跟踪当前正在处理的 ASR 请求的 ID

    const processMessage = useCallback((rawMessage: Message) => {
        const parsedMessage = parseWebSocketMessage(rawMessage);

        if (!parsedMessage) {
            return;
        }

        setChatMessages(prevMessages => {
            const newMessages = [...prevMessages];
            let lastMessage = newMessages[newMessages.length - 1];

            // ASR Result Handling: Update the latest AI text/image message
            if (parsedMessage.type === 'asr_result' && parsedMessage.payload.asrText) {
                const asrText = parsedMessage.payload.asrText;
                const isFinalAsr = parsedMessage.isFinal;
                const asrRequestId = parsedMessage.asrRequestId; // 从 parsedMessage 中获取 asrRequestId
                const asrRole = parsedMessage.role; // 获取 ASR 消息的角色，通常是 USER

                // 尝试通过 asrRequestId 查找是否有相同 asrRequestId 且 !isFinal 的消息需要更新
                let targetMessageIndex = -1;
                if (asrRequestId) {
                    targetMessageIndex = newMessages.findIndex(msg =>
                        msg.asrRequestId === asrRequestId &&
                        msg.role === asrRole &&
                        !msg.isFinal // 只更新非最终消息
                    );
                }

                if (targetMessageIndex !== -1) {
                    // 找到了匹配的非最终 ASR 消息，进行更新
                    const messageToUpdate = newMessages[targetMessageIndex];
                    if (messageToUpdate.type === 'text') {
                        const updatedMessage: ITextMessage = {
                            ...messageToUpdate,
                            payload: { ...messageToUpdate.payload, text: asrText },
                            isFinal: isFinalAsr, // 根据 ASR 结果更新 isFinal 标志
                        };
                        newMessages[targetMessageIndex] = updatedMessage;
                    } else if (messageToUpdate.type === 'image') {
                        const updatedMessage: IImageMessage = {
                            ...messageToUpdate,
                            payload: { ...messageToUpdate.payload, text: asrText },
                            isFinal: isFinalAsr, // 根据 ASR 结果更新 isFinal 标志
                        };
                        newMessages[targetMessageIndex] = updatedMessage;
                    }

                    // 如果是最终 ASR 结果，则清除 lastAsrRequestIdRef
                    if (isFinalAsr) {
                        // 如果是最终 ASR 结果，确保 isFinal 状态被设置
                        if (newMessages[targetMessageIndex]) {
                            (newMessages[targetMessageIndex] as IAsrResultMessage).isFinal = true;
                        }
                    } else {
                    }
                    return newMessages;
                } else { // 如果没有找到匹配的消息，无论是中间结果还是最终结果，都添加为新消息
                    const newAsrMessage: ITextMessage = { // 使用 ITextMessage 因为它是文本内容
                        id: parsedMessage.id || uuidv4(),
                        role: asrRole as EMessageType,
                        timestamp: Date.now(),
                        type: 'text',
                        payload: { text: asrText },
                        isFinal: isFinalAsr, // 使用传入的 isFinal 状态
                        asrRequestId: asrRequestId,
                    };
                    newMessages.push(newAsrMessage);
                    // 如果是最终消息，则不需要跟踪 asrRequestId
                    if (isFinalAsr) {
                        lastAsrRequestIdRef.current = undefined;
                    }
                    return newMessages;
                }

            }

            // Grouping logic for text/image messages
            const currentGroupTimestamp = parsedMessage.group_timestamp;

            // 检查是否是当前消息组的延续，并且类型匹配，且不是片段的结束
            const isContinuationOfText = lastMessage &&
                                         lastMessage.type === 'text' &&
                                         parsedMessage.type === 'text' &&
                                         lastMessage.group_timestamp === currentGroupTimestamp &&
                                         (lastMessage.role === parsedMessage.role);

            // 如果是文本消息的延续，则追加文本
            if (isContinuationOfText) {
                const updatedLastMessage: ITextMessage = {
                    ...(lastMessage as ITextMessage),
                    payload: {
                        ...(lastMessage as ITextMessage).payload,
                        text: ((lastMessage as ITextMessage).payload.text || '') + (parsedMessage.payload.text || '')
                    }
                };
                newMessages[newMessages.length - 1] = updatedLastMessage;
                return newMessages;
            }

            // 否则，添加为新消息
            newMessages.push(parsedMessage);
            // 如果是新的 AI 文本或图片消息，跟踪其 ID 以便可能的 ASR 更新
            if ((parsedMessage.type === 'text' || parsedMessage.type === 'image') && (parsedMessage.role === EMessageType.AGENT || parsedMessage.role === EMessageType.ASSISTANT)) {
                // lastAiMessageIdRef.current = parsedMessage.id; // This line is removed
            }
            return newMessages;
        });
    }, [lastAsrRequestIdRef, setChatMessages, parseWebSocketMessage]);

    useEffect(() => {
        const unsubscribeData = webSocketManager.onMessage(MessageType.DATA, processMessage);
        const unsubscribeCmdResult = webSocketManager.onMessage(MessageType.CMD_RESULT, processMessage);

        return () => {
            unsubscribeData();
            unsubscribeCmdResult();
        };
    }, [processMessage]);

    const clearMessages = useCallback(() => {
        setChatMessages([]);
        // lastAiMessageIdRef.current = undefined; // This line is removed
    }, []);

    return {
        chatMessages,
        addChatMessage: (message: IChatMessage) => {
            setChatMessages(prev => [...prev, message]);
        },
        clearMessages, // 返回 clearMessages 函数
    };
};
