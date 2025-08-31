import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useWebSocketSession } from '@/hooks/useWebSocketSession';
import { SessionConnectionState } from '@/types/websocket'; // 导入 SessionConnectionState
import { Loader2 } from 'lucide-react'; // 导入 Loader2 用于加载动画

interface ChatInputProps {
  className?: string;
  onSendMessage: (message: { text: string; role: 'user' }) => void; // 新增回调函数，用于将用户消息添加到聊天列表
}

const ChatInput: React.FC<ChatInputProps> = ({ className, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false); // 新增 isSending 状态
  const { sendMessage, sessionState } = useWebSocketSession();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInputValue = inputValue.trim();
    if (!trimmedInputValue || sessionState !== SessionConnectionState.SESSION_ACTIVE || isSending) {
      return;
    }

    setIsSending(true); // 开始发送，设置加载状态为 true
    try {
      sendMessage('text_data', trimmedInputValue); // 使用 sendMessage 发送文本消息
      setInputValue(''); // 清空输入框
      onSendMessage({ text: trimmedInputValue, role: 'user' }); // 调用 onSendMessage 回调函数
    } finally {
      setIsSending(false); // 无论成功或失败，都结束发送状态
    }
  }, [inputValue, sendMessage, sessionState, isSending, onSendMessage]);

  const isDisabled = !inputValue.trim() || sessionState !== SessionConnectionState.SESSION_ACTIVE || isSending;

  return (
    <form onSubmit={handleInputSubmit} className={cn("flex w-full items-center space-x-2 p-4", className)}>
      <Input
        type="text"
        placeholder="输入你的消息..."
        value={inputValue}
        onChange={handleInputChange}
        className="flex-1"
        disabled={sessionState !== SessionConnectionState.SESSION_ACTIVE || isSending} // 禁用条件中添加 isSending
      />
      <Button type="submit" size="icon" disabled={isDisabled}> {/* 使用 isDisabled 变量 */}
        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {/* 添加加载指示器 */}
      </Button>
    </form>
  );
};

export default ChatInput;
