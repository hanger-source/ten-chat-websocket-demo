import React, { useState, useEffect, useRef } from 'react'; // 引入 useState, useEffect, useRef
import { ITextMessage, EMessageType } from '@/types/chat'; // 修改为 ITextMessage
import { cn } from '@/lib/utils';
import { UserAvatarIcon } from '@/components/icons/userAvatar'; // 导入用户头像 SVG 组件

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
        ? "" // 用户消息的边框，设置为空，移除边框
        : "bg-gradient-to-r from-blue-300 to-pink-300"; // AI/系统消息的渐变色 (蓝粉渐变)

    const innerBgClass = isUser ? "bg-gray-200" : "bg-white"; // 内部消息内容的背景色
    const innerTextColorClass = "text-gray-800"; // 内部消息内容的文本颜色统一为灰色800（接近黑色）

    const borderRadiusClass = "rounded-xl"; // 所有气泡都使用更圆的圆角

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

    const senderName = isUser ? userName || "用户" : aiPersonaName || "AI助手"; // AI消息优先使用 aiPersonaName, 移除 message.senderName

    return (
        <div
            className={cn(
                "flex flex-col mb-4",
                "items-start" // 统一靠左显示
            )}
        >
            <div className={cn("flex items-center mb-2", "space-x-2")}> {/* 头像和名称的容器，统一 avatar 在左，名称在右 */}
                {isUser ? (
                    <UserAvatarIcon className="w-8 h-8 rounded-full object-cover mr-2" />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={aiAvatarUrl}
                        alt={isUser ? "User Avatar" : "AI Avatar"}
                        className="w-8 h-8 rounded-full object-cover mr-2"
                    />
                )}
                <span className="text-sm font-semibold text-gray-700">{senderName}</span>
            </div>
            <div className={cn(
                "relative p-[1px] max-w-[80%] rounded-lg ml-10", // 为消息气泡添加左外边距，使其向右缩进 (ml-10)
                gradientBorderClass,
                borderRadiusClass,
            )}>
                <div
                    className={cn(
                        "px-4 py-2 rounded-lg break-words", 
                        innerBgClass,
                        innerTextColorClass,
                        borderRadiusClass
                    )}
                >
                    <p className="text-sm tracking-wide">{displayedText}</p> {/* 添加 tracking-wide 调整字间距 */}
                </div>
            </div>
        </div>
    );
};

export default TextMessageBubble;
