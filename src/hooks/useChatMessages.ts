import React, { useState, useEffect, useRef, useCallback } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { Message, MessageType } from '@/types/message';
import { IChatMessage, ITextMessage, IImageMessage, IAsrResultMessage, EMessageType } from '@/types/chat';
import { parseWebSocketMessage } from '@/utils/messageParser';
import { v4 as uuidv4 } from 'uuid';

interface UseChatMessagesReturn {
    chatMessages: IChatMessage[];
    addChatMessage: (message: IChatMessage) => void; // 添加 addChatMessage 函数到返回接口
    clearMessages: () => void; // 新增 clearMessages 函数到返回接口
}

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

                // 尝试通过 asrRequestId 查找需要更新的消息
                let targetMessageIndex = -1;
                if (asrRequestId) {
                    targetMessageIndex = newMessages.findIndex(msg =>
                        msg.asrRequestId === asrRequestId &&
                        msg.role === asrRole && // 角色必须一致
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
                        lastAsrRequestIdRef.current = undefined;
                    } else {
                        // 只有在当前 asrRequestId 与正在跟踪的相同，且不是最终结果时，才更新 ref
                        if (lastAsrRequestIdRef.current === asrRequestId) {
                            lastAsrRequestIdRef.current = asrRequestId; // 保持对当前 ASR 请求的跟踪
                        }
                    }
                    return newMessages;
                } else if (!isFinalAsr && asrRequestId) {
                    // 如果是中间 ASR 结果，但没有找到匹配的消息，并且有 asrRequestId，则创建一个新的非最终 AI 消息
                    // 只有当这是当前 asrRequestId 的第一个中间结果，或者 asrRequestId 发生变化时才创建新消息
                    if (lastAsrRequestIdRef.current !== asrRequestId) {
                        const newAsrMessage: ITextMessage = {
                            id: parsedMessage.id || uuidv4(),
                            role: asrRole as EMessageType, // 使用解析后的 asrRole
                            timestamp: Date.now(),
                            type: 'text',
                            payload: { text: asrText },
                            isFinal: false,
                            asrRequestId: asrRequestId,
                        };
                        newMessages.push(newAsrMessage);
                        lastAsrRequestIdRef.current = asrRequestId; // 跟踪新的 asrRequestId
                    }
                    return newMessages; // 即使没有创建新消息，也要返回，避免后续逻辑干扰
                } else if (isFinalAsr) {
                    // 如果是最终 ASR 结果，但没有找到匹配的消息，则创建一个新的最终 AI 消息
                    const newAsrMessage: ITextMessage = {
                            id: parsedMessage.id || uuidv4(),
                            role: asrRole as EMessageType, // 使用解析后的 asrRole
                            timestamp: Date.now(),
                            type: 'text',
                            payload: { text: asrText },
                            isFinal: true,
                            asrRequestId: asrRequestId,
                    };
                    newMessages.push(newAsrMessage);
                    lastAsrRequestIdRef.current = undefined; // 最终消息，清除 ref
                    return newMessages;
                }

                return newMessages;
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
    }, []);

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
