import React from 'react';
import { ICommandResultMessage, EMessageType } from '@/types/chat';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Info, Terminal } from 'lucide-react'; // 导入图标库

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
        : "bg-gradient-to-r from-blue-400 to-indigo-400"; // 其他角色（如果未来有）的渐变色，这里保持与用户消息一致

    const innerBgClass = "bg-white"; // 内部消息内容的背景色统一改为白色

    const innerTextColorClass = isSystem
        ? (isSuccess === true ? "text-green-800" : isSuccess === false ? "text-red-800" : "text-blue-800")
        : "text-primary-foreground"; // 根据成功/失败或默认设置内部文本颜色

    const borderRadiusClass = "rounded-lg"; // 所有气泡都使用完全圆角

    const avatarSrc = isSystem ? aiAvatarUrl || "/path/to/default/ai/avatar.png" : "/path/to/default/user/avatar.png"; // 系统消息使用AI头像，用户消息使用用户默认头像
    const senderName = isSystem ? aiPersonaName || message.senderName || "系统" : userName || "用户"; // 系统消息优先使用 aiPersonaName

    return (
        <div
            className={cn("flex flex-col w-full mb-4", isSystem ? "items-start" : "items-end")}
        >
            <div className={cn("flex items-center mb-2", isSystem ? "space-x-2" : "flex-row-reverse space-x-reverse")}> {/* 头像和名称的容器 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
                <span className="text-sm font-semibold text-gray-700">{senderName}</span>
            </div>
            <div className={cn("relative p-[1px] rounded-lg max-w-[60%]", gradientBorderClass, borderRadiusClass)}> {/* 渐变边框容器，修改 max-w-[70%] 为 max-w-[60%] */}
                <div
                    className={cn(
                        "flex items-center px-4 py-3 rounded-lg text-sm break-words",
                        innerBgClass,
                        innerTextColorClass,
                        borderRadiusClass
                    )}
                >
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
