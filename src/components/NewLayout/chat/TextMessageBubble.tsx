import React, { useState, useEffect, useRef } from 'react'; // 引入 useState, useEffect, useRef
import { ITextMessage, EMessageType } from '@/types/chat'; // 修改为 ITextMessage
import { cn } from '@/lib/utils';

interface TextMessageBubbleProps {
    message: ITextMessage; // 修改为 ITextMessage
    aiAvatarUrl?: string; // 新增 AI 头像 URL
    userName?: string; // 新增用户名称
    // isPlaying?: boolean; // 移除 isPlaying prop
    aiPersonaName?: string; // 新增 AI 角色名称 prop
}

const TextMessageBubble: React.FC<TextMessageBubbleProps> = ({ message, aiAvatarUrl, userName, aiPersonaName }) => {
    const isUser = message.role === EMessageType.USER;
    const [displayedText, setDisplayedText] = useState('');
    const currentMessageIdRef = useRef<string | undefined>(undefined);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // const backgroundColorClass = isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'; // 不再直接用于背景色
    // const textColorClass = isUser ? 'text-white' : 'text-gray-800'; // 不再直接用于背景色

    const gradientBorderClass = isUser
        ? "bg-gradient-to-r from-blue-400 to-indigo-400" // 用户消息的渐变色 (与 NewLayout 主题蓝色协调)
        : "bg-gradient-to-r from-blue-300 to-pink-300"; // AI/系统消息的渐变色 (蓝粉渐变)

    const innerBgClass = "bg-white"; // 内部消息内容的背景色统一改为白色
    const innerTextColorClass = isUser ? "text-primary-foreground" : "text-gray-800"; // 内部消息内容的文本颜色

    const borderRadiusClass = "rounded-lg"; // 所有气泡都使用完全圆角

    useEffect(() => {
        const fullText = message.payload.text || '';
        const messageId = message.id;

        // 清除任何进行中的定时器
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // 如果是新消息，或者消息角色是用户，或者消息不是最终片段 (例如 ASR 实时更新)，则直接显示完整文本
        if (messageId !== currentMessageIdRef.current || isUser || !message.isFinal) {
            setDisplayedText(fullText);
            currentMessageIdRef.current = messageId;
            return;
        }

        // 如果是 AI 的最终文本消息，并且尚未完全显示，则启动打字机效果
        if (displayedText.length < fullText.length) {
            let charIndex = displayedText.length;
            const typeChar = () => {
                if (charIndex < fullText.length) {
                    setDisplayedText(prev => prev + fullText[charIndex]);
                    charIndex++;
                    timeoutRef.current = setTimeout(typeChar, 50); // 每个字符50ms延迟
                }
            };
            timeoutRef.current = setTimeout(typeChar, 50);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [message, isUser, displayedText.length]); // 依赖 message, isUser, displayedText.length

    const avatarSrc = isUser ? "/path/to/default/user/avatar.png" : aiAvatarUrl || "/path/to/default/ai/avatar.png"; // 替换为实际的用户默认头像路径
    const senderName = isUser ? userName || "用户" : aiPersonaName || message.senderName || "AI助手"; // AI消息优先使用 aiPersonaName

    return (
        <div
            className={cn(
                "flex flex-col mb-4",
                isUser ? "items-end" : "items-start"
            )}
        >
            <div className={cn("flex items-center mb-2", isUser ? "flex-row-reverse space-x-reverse" : "space-x-2")}> {/* 头像和名称的容器 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
                <span className="text-sm font-semibold text-gray-700">{senderName}</span>
            </div>
            <div className={cn("relative p-[1px] max-w-[60%] rounded-lg", gradientBorderClass, borderRadiusClass)}> {/* 渐变边框容器，修改 max-w-[70%] 为 max-w-[60%] */}
                <div
                    className={cn(
                        "px-4 py-3 rounded-lg break-words",
                        innerBgClass,
                        innerTextColorClass,
                        borderRadiusClass
                    )}
                >
                    <p className="text-sm">{displayedText}</p>
                </div>
            </div>
        </div>
    );
};

export default TextMessageBubble;
