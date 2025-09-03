// IMediaStreamManager.ts

/**
 * 媒体流管理器的接口。
 * 任何实现此接口的类都必须提供以下功能。
 */
export interface IMediaStreamManager {
    /**
     * 获取摄像头和麦克风流。
     * @param camDeviceId 期望的摄像头设备ID。
     * @param micDeviceId 期望的麦克风设备ID。
     * @returns 一个 Promise，成功时解析为 MediaStream。
     */
    getCameraStream(camDeviceId: string | null, micDeviceId: string | null): Promise<MediaStream>;

    /**
     * 获取屏幕共享流。
     * @param micDeviceId 期望的麦克风设备ID。
     * @returns 一个 Promise，成功时解析为 MediaStream。
     */
    getScreenStream(micDeviceId: string | null): Promise<MediaStream>;

    /**
     * 停止当前激活的所有媒体轨道，并清除流。
     */
    stopAllStreams(): void;

    /**
     * 获取当前激活的媒体流实例。
     * @returns 如果有流则返回 MediaStream，否则返回 null。
     */
    getCurrentStream(): MediaStream | null;
}