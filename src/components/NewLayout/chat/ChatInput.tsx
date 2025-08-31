import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { useWebSocketSession } from '@/hooks/useWebSocketSession';
import { SessionConnectionState } from '@/types/websocket';
import { isMobile } from '@/common/utils';

interface ChatInputProps {
  className?: string;
  onSendMessage: (message: { text: string; role: 'user' }) => void;
  onExpandedChange?: (isExpanded: boolean) => void;
  expanded?: boolean; // 外部控制的展开状态
}

const ChatInput = React.forwardRef<HTMLFormElement, ChatInputProps>(
  ({ className, onSendMessage, onExpandedChange, expanded }, ref) => {
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isExpanded, setIsExpanded] = useState(expanded || false); // 使用外部初始值
    const { sendMessage, sessionState } = useWebSocketSession();
    
    const isMobileDevice = isMobile();
    const isExternalUpdate = useRef(false); // 用于跟踪是否是外部更新
    const prevExpanded = useRef(expanded); // 跟踪上一次的外部值

    // 监听外部传入的 expanded 状态
    useEffect(() => {
      // 只有当外部值真正改变时才更新
      if (expanded !== undefined && expanded !== prevExpanded.current) {
        prevExpanded.current = expanded;
        isExternalUpdate.current = true; // 标记为外部更新
        setIsExpanded(expanded);
      }
    }, [expanded]);

    // 通知父组件状态变化（只在非外部更新时通知）
    useEffect(() => {
      if (isExternalUpdate.current) {
        // 重置标记，不通知父组件（避免循环）
        isExternalUpdate.current = false;
        return;
      }
      onExpandedChange?.(isExpanded);
    }, [isExpanded, onExpandedChange]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmedValue = inputValue.trim();
      if (!trimmedValue || sessionState !== SessionConnectionState.SESSION_ACTIVE || isSending) {
        return;
      }

      setIsSending(true);
      try {
        sendMessage('text_data', trimmedValue);
        setInputValue('');
        onSendMessage({ text: trimmedValue, role: 'user' });
      } finally {
        setIsSending(false);
      }
    }, [inputValue, sendMessage, sessionState, isSending, onSendMessage]);

    const handleExpand = useCallback(() => {
      setIsExpanded(true);
    }, []);

    const handleCollapse = useCallback(() => {
      setIsExpanded(false);
    }, []);

    const isDisabled = !inputValue.trim() || sessionState !== SessionConnectionState.SESSION_ACTIVE || isSending;

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        onMouseEnter={!isMobileDevice ? handleExpand : undefined}
        onMouseLeave={!isMobileDevice ? handleCollapse : undefined}
        className={cn(
          "flex items-center z-20 transition-all duration-300 ease-in-out",
          isExpanded 
            ? "w-[320px] h-12 px-4 py-2" 
            : "w-12 h-12 justify-center rounded-full shadow-xl bg-transparent",
          className
        )}
      >
        {isExpanded ? (
          <div 
            className="flex items-center space-x-2 w-full"
            onTouchStart={(e) => {
              if (isMobileDevice) {
                e.stopPropagation();
              }
            }}
            onMouseDown={(e) => {
              if (isMobileDevice) {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              if (isMobileDevice) {
                e.stopPropagation();
              }
            }}
          >
            <Input
              type="text"
              placeholder="输入你的消息..."
              value={inputValue}
              onChange={handleInputChange}
              className="flex-1 rounded-full shadow-xl"
              disabled={sessionState !== SessionConnectionState.SESSION_ACTIVE || isSending}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isDisabled} 
              className="rounded-full shadow-xl"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <MessageCircle
            className="h-8 w-8 text-gray-500 cursor-pointer"
            onClick={isMobileDevice ? handleExpand : undefined}
          />
        )}
      </form>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;