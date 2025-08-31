import React, { useRef, useEffect } from 'react';
import { IChatMessage } from '@/types/chat';
import TextMessageBubble from './TextMessageBubble';
import ImageMessageBubble from './ImageMessageBubble';
import CommandResultMessageBubble from './CommandResultMessageBubble'; // 导入新组件
// 可以根据需要导入更多消息渲染组件

interface MessageListRendererProps {
    messages: IChatMessage[];
    aiAvatarUrl?: string; // 新增 aiAvatarUrl prop
    userName?: string; // 新增用户名称 prop
    aiPersonaName?: string; // 新增 AI 角色名称 prop
}

// 消息渲染组件的映射表
const messageRenderers: Record<IChatMessage['type'], React.ComponentType<any>> = {
    'text': TextMessageBubble,
    'image': ImageMessageBubble,
    'audio': TextMessageBubble, // 音频消息可能仍然只显示文本，或有专门的音频播放UI
    'command_result': CommandResultMessageBubble, // 修改这里！
    'asr_result': TextMessageBubble, // ASR结果
    'custom_card': TextMessageBubble, // 自定义卡片，目前默认文本，未来可扩展
    'unknown': TextMessageBubble, // 未知类型默认显示为文本
};

const MessageListRenderer: React.FC<MessageListRendererProps> = ({ messages, aiAvatarUrl, userName, aiPersonaName }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 自动滚动到底部
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto px-6 py-6"> {/* 修改为 px-6 py-6 */}
            {messages.map((message) => {
                const Renderer = messageRenderers[message.type] || messageRenderers['unknown'];
                return <Renderer key={message.id} message={message} aiAvatarUrl={aiAvatarUrl} userName={userName} aiPersonaName={aiPersonaName} />;
            })}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageListRenderer;
