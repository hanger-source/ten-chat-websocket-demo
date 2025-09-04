import React, { useState, useEffect, useRef } from 'react'; // 引入 useState, useEffect, useRef
import { ITextMessage, EMessageType } from '@/types/chat'; // <-- 保持为 ITextMessage
import { cn } from '@/lib/utils';
import { UserAvatarIcon } from '@/components/icons/userAvatar'; // 导入用户头像 SVG 组件

interface TextMessageBubbleProps {
    message: ITextMessage; // <-- 保持为 ITextMessage
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
        const fullText = String(message.payload.text || ''); // 显式转换为字符串
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

        // 如果是 AI 的最终文本消息，并且尚未完全显示，则在延迟后启动打字机效果
        if (!isUser && message.isFinal && (messageId !== currentMessageIdRef.current || displayedText.length < fullText.length)) {
            setDisplayedText(''); // 先清空，等待动画完成
            currentMessageIdRef.current = messageId;

            const delay = 500; // 与 fadeInUp 动画持续时间匹配的延迟

            timeoutRef.current = setTimeout(() => {
                let charIndex = 0;
                const typeChar = () => {
                    if (charIndex < fullText.length) {
                        // FIX: 直接设置显示的文本为 fullText 的子字符串，避免闭包捕获旧的 prevDisplayedText
                        setDisplayedText(fullText.substring(0, charIndex + 1));
                        charIndex++;
                        timeoutRef.current = setTimeout(typeChar, 50); // 每个字符50ms延迟
                    } else {
                        // 确保在打字机结束时，displayedText 最终设置为完整的文本
                        setDisplayedText(fullText);
                        timeoutRef.current = null; // 打字机完成
                    }
                };
                typeChar(); // 启动打字机效果
            }, delay);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [message, isUser]); // 依赖 message 和 isUser，不再依赖 displayedText.length 以避免循环

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
                    <p className="text-sm tracking-wide"> {/* <-- 恢复 p 标签的默认行为 */}
                        <span className="items-baseline"> {/* <-- 新增内联 span 容器，包裹文本和 tag */} 
                            {displayedText}
                            {/* 条件性渲染 "已打断" tag，紧跟在文字后面，不换行 */} 
                            {message.isInterrupted && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-pink-100 text-pink-700 rounded-full inline-flex items-center">已打断</span>
                            )}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TextMessageBubble;
