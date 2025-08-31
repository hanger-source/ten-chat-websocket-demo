import { useEffect } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { Message, MessageType, CommandResult } from '@/types/message'; // 修改导入路径到 @/types/message
import { toast } from 'sonner';

/**
 * useWebSocketEvents Hook 负责订阅非 UI 相关的特殊 WebSocket 消息事件（如 CMD_RESULT），
 * 并触发相应的副作用，例如显示 toast 通知。
 */
export const useWebSocketEvents = () => {
    useEffect(() => {
        const handleCommandResult = (rawMessage: Message) => {
            const commandResult = rawMessage as CommandResult;

            if (!commandResult) {
                console.warn("useWebSocketEvents: Received invalid CMD_RESULT message:", rawMessage);
                return;
            }

            if (commandResult.success) {
                // toast.success(commandResult.detail || '命令执行成功！', { duration: 3000 });
            } else {
                toast.error(commandResult.errorMessage || '命令执行失败！', { duration: 5000 });
            }
        };

        const unsubscribeCmdResult = webSocketManager.onMessage(MessageType.CMD_RESULT, handleCommandResult);

        // TODO: 可以在这里添加订阅其他特殊事件的逻辑

        return () => {
            unsubscribeCmdResult();
        };
    }, []);
};
