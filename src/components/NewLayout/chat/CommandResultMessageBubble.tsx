import React from 'react';
import { ICommandResultMessage, EMessageType } from '@/types/chat';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Info, Terminal } from 'lucide-react'; // 导入图标库
import { UserAvatarIcon } from '@/components/icons/userAvatar'; // 导入用户头像 SVG 组件

interface CommandResultMessageBubbleProps {
    message: ICommandResultMessage;
    aiAvatarUrl?: string; // 新增 AI 头像 URL
    userName?: string; // 新增用户名称
    aiPersonaName?: string; // 新增 AI 角色名称 prop
}

const CommandResultMessageBubble: React.FC<CommandResultMessageBubbleProps> = ({ message, aiAvatarUrl, userName, aiPersonaName }) => {
    const { commandResult, text } = message.payload;
    const isSystem = message.role === EMessageType.SYSTEM;

    // 根据命令执行结果的成功或失败来选择样式和图标
    const isSuccess = commandResult?.success;
    const icon = isSuccess === true ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                 isSuccess === false ? <XCircle className="h-4 w-4 text-red-500" /> :
                 <Info className="h-4 w-4 text-blue-500" />; // 默认或进行中状态

    // 渐变边框和内部背景/文本颜色
    const gradientBorderClass = isSystem
        ? "bg-gradient-to-r from-blue-300 to-pink-300" // 系统消息的渐变色 (蓝粉渐变)
        : ""; // 非系统消息（用户消息）的边框，设置为空，移除边框

    const innerBgClass = isSystem ? "bg-white" : "bg-gray-200"; // 内部消息内容的背景色

    const innerTextColorClass = "text-gray-800"; // 内部消息内容的文本颜色统一为灰色800（接近黑色）

    const borderRadiusClass = "rounded-xl"; // 所有气泡都使用更圆的圆角

    const senderName = isSystem ? aiPersonaName || "AI助手" : userName || "用户"; // AI消息优先使用 aiPersonaName, 移除 message.senderName

    return (
        <div
            className={cn("flex flex-col w-full mb-4", "items-start")} // 统一靠左显示
        >
            <div className={cn("flex items-center mb-2", "space-x-2")}> {/* 头像和名称的容器，统一 avatar 在左，名称在右 */}
                {isSystem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={aiAvatarUrl}
                        alt="AI Avatar"
                        className="w-8 h-8 rounded-full object-cover mr-2"
                    />
                ) : (
                    <UserAvatarIcon className="w-8 h-8 rounded-full object-cover mr-2" />
                )}
                <span className="text-sm font-semibold text-gray-700">{senderName}</span>
            </div>
            <div className={cn(
                "relative p-[1px] rounded-xl max-w-[60%] ml-10", // 为命令结果消息气泡添加左外边距，使其向右缩进 (ml-10)
                gradientBorderClass,
                borderRadiusClass
            )}>
                <div className={cn("flex items-center px-4 py-2 rounded-xl text-sm break-words", innerBgClass, innerTextColorClass, borderRadiusClass)}> {/* 移除 ml-4，现在由父级容器处理 */}
                    <span className="mr-2">{icon}</span>
                    <div className="flex flex-col">
                        {/* 显示原始命令名称，如果有 */}
                        {commandResult?.original_cmd_name && (
                            <p className="font-semibold flex items-center">
                                <Terminal className="h-3 w-3 mr-1" />
                                {commandResult.original_cmd_name}
                            </p>
                        )}
                        {/* 显示文本内容，通常是成功或失败的描述 */}
                        <p>{text || (isSuccess ? "命令执行成功" : "命令执行失败")}</p>
                        {/* 可以根据需要显示更多详情 */}
                        {commandResult?.detail && <p className="text-xs opacity-75">{commandResult.detail}</p>}
                        {commandResult?.errorMessage && <p className="text-xs text-red-600">{commandResult.errorMessage}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandResultMessageBubble;
