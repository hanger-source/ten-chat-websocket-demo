import { useEffect } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { Message, MessageType, CommandResult, CommandType } from '@/types/message'; // 修改导入路径到 @/types/message
import { toast } from 'sonner';

/**
 * useWebSocketEvents Hook 负责订阅非 UI 相关的特殊 WebSocket 消息事件（如 CMD_RESULT），
 * 并触发相应的副作用，例如显示 toast 通知。
 */
export const useWebSocketEvents = (
    cmdType?: CommandType, // 可选：指定要监听的命令类型
    onCommandResultProcessed?: (commandResult: CommandResult) => string | undefined | null // 可选：自定义 toast 消息的回调
) => {
    useEffect(() => {
        const handleCommandResult = (rawMessage: Message) => {
            const commandResult = rawMessage as CommandResult;
            console.log("useWebSocketEvents: Received command result", commandResult);

            // 如果指定了 cmdType，则只处理匹配的命令结果
            if (cmdType && commandResult.original_cmd_type !== cmdType) {
                return;
            }

            let toastMessage: string | undefined | null;
            if (onCommandResultProcessed) {
                toastMessage = onCommandResultProcessed(commandResult);
            } else {
                // 如果没有提供自定义回调，则使用默认消息
                if (commandResult.status_code === 0) {
                    toastMessage = `命令 ${commandResult.original_cmd_type} 执行成功！`;
                } else {
                    toastMessage = `命令 ${commandResult.original_cmd_type} 执行失败: ${commandResult.properties?.error_message || `状态码 ${commandResult.status_code}`}`;
                }
            }

            if (toastMessage) {
                if (commandResult.status_code === 0) {
                    toast.success(toastMessage, { duration: 2000 });
                } else {
                    toast.error(toastMessage, { duration: 2000 });
                }
            }
        };

        const unsubscribeCmdResult = webSocketManager.onMessage(MessageType.CMD_RESULT, handleCommandResult);

        // TODO: 可以在这里添加订阅其他特殊事件的逻辑

        return () => {
            unsubscribeCmdResult();
        };
    }, [cmdType, onCommandResultProcessed]); // 依赖于 cmdType 和 onCommandResultProcessed
};
