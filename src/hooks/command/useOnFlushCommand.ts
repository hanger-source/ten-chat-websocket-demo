import { useEffect, useRef, useCallback } from 'react';
import { webSocketManager } from '@/manager/websocket/websocket';
import { Message, MessageType, CommandType } from '@/types/message';

/**
 * useOnFlushCommand Hook 用于监听后端发来的 FLUSH 命令消息，并在接收到时触发回调。
 *
 * @param callback 当接收到 FLUSH 命令时执行的回调函数。
 */
export const useOnFlushCommand = (callback: () => void) => {
  const callbackRef = useRef(callback);

  // 确保回调函数总是最新的，防止 stale closure 问题
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 使用 useCallback 包装消息处理函数，确保其引用稳定
  const handleFlushMessage = useCallback((message: Message) => {
    // 精确判断消息类型和名称
    if (message.type === MessageType.CMD && message.name === CommandType.FLUSH) {
      console.log("[FlushCmdLog] 收到 FLUSH 命令，触发回调。");
      callbackRef.current(); // 触发传入的回调
    }
  }, []); // 依赖稳定

  useEffect(() => {
    // 订阅 WebSocket FLUSH 命令消息
    // 我们订阅 MessageType.CMD，并在 handleFlushMessage 内部进一步检查 name 字段
    const unsubscribe = webSocketManager.onMessage(MessageType.CMD, handleFlushMessage);

    // 清理函数：在组件卸载时取消订阅
    return () => {
      console.log("[FlushCmdLog] 取消订阅 FLUSH 命令。");
      unsubscribe();
    };
  }, [handleFlushMessage]); // 依赖 handleFlushMessage
};
