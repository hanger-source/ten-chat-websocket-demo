import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {requestCamera} from "@/store/reducers/localMediaStream";

/**
 * 一个 Hook，用于管理媒体设备列表。
 * 它监听设备的动态变化（如插入或拔出），并将设备ID与 Redux 状态同步。
 */
const useMediaDevices = () => {
    const dispatch = useDispatch();
    // 使用本地状态存储所有可用的媒体设备。
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    // 从 Redux 状态中获取当前选中的摄像头设备 ID。
    // 这个 ID 已经是一个“已确认”的选择，会被 useMediaStreamManager 使用。
    const selectedCamDeviceId = useSelector((state: RootState) => state.localMediaStream.selectedCamDeviceId);

    /**
     * 获取所有可用的媒体输入设备。
     * 这个函数是可重用的，在 Hook 首次加载和设备列表变化时都会被调用。
     */
    const getDevices = async () => {
        try {
            const deviceList = await navigator.mediaDevices.enumerateDevices();
            setDevices(deviceList);
        } catch (e) {
            console.error('无法获取设备列表:', e);
        }
    };

    /**
     * useEffect 负责处理设备的动态变化。
     * 它在 Hook 挂载时启动，并设置一个监听器来响应设备的插拔。
     */
    useEffect(() => {
        // 立即获取一次设备列表
        getDevices();

        // 添加事件监听器，当设备列表发生变化时，再次调用 getDevices()。
        navigator.mediaDevices.addEventListener('devicechange', getDevices);

        // 清理函数：在组件卸载时移除监听器，防止内存泄漏。
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', getDevices);
        };
    }, []); // 空依赖数组确保只在组件挂载和卸载时执行。

    /**
     * 用户选择一个新摄像头时调用的回调。
     * 它只负责更新 Redux 中的 selectedCamDeviceId 状态，不触发任何流请求。
     */
    const setSelectedCamera = useCallback((deviceId: string) => {
        dispatch(requestCamera({ camDeviceId: deviceId }));
    }, [dispatch]);

    return {
        // 返回设备列表，UI 可以用它来渲染下拉菜单等。
        devices,
        // 返回 Redux 中当前选中的设备ID。
        selectedCamDeviceId,
        // 返回用于更新选中设备ID的方法。
        setSelectedCamera,
    };
};

export default useMediaDevices;