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
            console.log("useWebSocketEvents: Received command result", commandResult);

            if (commandResult.status_code === 0) {
                // Command succeeded
                toast.success(`命令 ${commandResult.original_cmd_name} 执行成功！`);
            } else {
                // Command failed
                toast.error(`命令 ${commandResult.original_cmd_name} 执行失败: ${commandResult.properties?.error_message || `状态码 ${commandResult.status_code}`}`);
            }
        };

        const unsubscribeCmdResult = webSocketManager.onMessage(MessageType.CMD_RESULT, handleCommandResult);

        // TODO: 可以在这里添加订阅其他特殊事件的逻辑

        return () => {
            unsubscribeCmdResult();
        };
    }, []);
};
