import React, { useState, useEffect, useRef, useCallback } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { Message, MessageType } from '@/types/message';
import { IChatMessage, ITextMessage, IImageMessage, IAsrResultMessage, EMessageType } from '@/types/chat';
import { parseWebSocketMessage } from '@/utils/messageParser';

interface UseChatMessagesReturn {
    chatMessages: IChatMessage[];
    addChatMessage: (message: IChatMessage) => void; // 添加 addChatMessage 函数到返回接口
    clearMessages: () => void; // 新增 clearMessages 函数到返回接口
}

export const useChatMessages = (): UseChatMessagesReturn => {
    const [chatMessages, setChatMessages] = useState<IChatMessage[]>([]);
    const lastAiMessageIdRef = useRef<string | undefined>(undefined); // 用于跟踪最后一条 AI 消息的 ID，以便进行 ASR 更新

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
                let targetMessageIndex = -1;
                for (let i = newMessages.length - 1; i >= 0; i--) {
                    const msg = newMessages[i];
                    // 查找最近的 AGENT/ASSISTANT 的文本或图片消息来更新 ASR 文本
                    if ((msg.role === EMessageType.AGENT || msg.role === EMessageType.ASSISTANT) && (msg.type === 'text' || msg.type === 'image')) {
                        targetMessageIndex = i;
                        break;
                    }
                }

                if (targetMessageIndex !== -1) {
                    const messageToUpdate = newMessages[targetMessageIndex];
                    if (messageToUpdate.type === 'text') {
                        const updatedMessage: ITextMessage = {
                            ...messageToUpdate,
                            payload: { ...messageToUpdate.payload, text: parsedMessage.payload.asrText }
                        };
                        newMessages[targetMessageIndex] = updatedMessage;
                    } else if (messageToUpdate.type === 'image') {
                        // ASR 结果也可能更新图片消息的文本描述
                        const updatedMessage: IImageMessage = {
                            ...messageToUpdate,
                            payload: { ...messageToUpdate.payload, text: parsedMessage.payload.asrText }
                        };
                        newMessages[targetMessageIndex] = updatedMessage;
                    }
                    return newMessages;
                }
                // 如果没有找到合适的 AI 消息来更新，则忽略此 ASR 结果
                return newMessages;
            }

            // Grouping logic for text/image messages
            const currentGroupTimestamp = parsedMessage.group_timestamp;

            // 检查是否是当前消息组的延续，并且类型匹配，且不是片段的结束
            const isContinuationOfText = lastMessage &&
                                         lastMessage.type === 'text' &&
                                         parsedMessage.type === 'text' &&
                                         lastMessage.group_timestamp === currentGroupTimestamp &&
                                         !parsedMessage.end_of_segment &&
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
                lastAiMessageIdRef.current = parsedMessage.id;
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
        lastAiMessageIdRef.current = undefined; // 清除最后一条 AI 消息 ID
    }, []);

    return {
        chatMessages,
        addChatMessage: (message: IChatMessage) => {
            setChatMessages(prev => [...prev, message]);
        },
        clearMessages, // 返回 clearMessages 函数
    };
};
