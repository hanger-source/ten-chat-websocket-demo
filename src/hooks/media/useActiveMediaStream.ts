import { useState, useEffect } from 'react';
import {mediaStreamManager} from "@/manager/media/LocalMediaStreamManager";

/**
 * 一个 Hook，用于获取并订阅当前激活的媒体流实例。
 * * 这个 Hook 不依赖于 Redux 状态，而是直接通过事件订阅机制
 * 从 LocalMediaStreamManager 获取最新的 MediaStream 实例。
 * 这确保了无论流如何变更（启动、停止、设备切换），UI 都能实时响应。
 * * @returns 当前激活的 MediaStream 实例，如果没有则返回 null。
 */
const useActiveMediaStream = (): MediaStream | null => {
    // 使用本地状态存储当前的流实例。
    // 初始化时，尝试从管理器获取当前已存在的流。
    const [stream, setStream] = useState<MediaStream | null>(mediaStreamManager.getCurrentStream());

    useEffect(() => {
        // 定义事件处理器，当流实例变更时更新本地状态
        const handleStreamChange = (newStream: MediaStream | null) => {
            setStream(newStream);
        };

        // 订阅管理器中的流变更事件
        mediaStreamManager.addChangeListener(handleStreamChange);

        // 清理函数：在组件卸载或依赖项变更前，取消订阅
        return () => {
            mediaStreamManager.removeChangeListener(handleStreamChange);
        };
    }, []); // 依赖数组为空，确保只在组件挂载和卸载时执行订阅和清理

    return stream;
};

export default useActiveMediaStream;