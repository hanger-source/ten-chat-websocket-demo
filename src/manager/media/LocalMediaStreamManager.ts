import { IMediaStreamManager } from './IMediaStreamManager';

// 定义一个事件监听器类型，用于处理流的变更。
type StreamChangeListener = (stream: MediaStream | null) => void;

/**
 * 媒体流管理器，实现为一个单例。
 * 它是应用中唯一与浏览器媒体设备API直接交互的类，负责流的生命周期管理和事件通知。
 */
export class LocalMediaStreamManager implements IMediaStreamManager {
    // 单例实例
    private static instance: LocalMediaStreamManager;
    // 存储当前激活的媒体流
    private stream: MediaStream | null = null;
    // 监听器数组，用于通知流的变更
    private listeners: StreamChangeListener[] = [];

    // 私有构造函数，确保只能通过 getInstance() 创建实例。
    private constructor() {}

    /**
     * 获取或创建单例实例。
     */
    public static getInstance(): LocalMediaStreamManager {
        if (!LocalMediaStreamManager.instance) {
            LocalMediaStreamManager.instance = new LocalMediaStreamManager();
        }
        return LocalMediaStreamManager.instance;
    }

    /**
     * 获取摄像头流。
     */
    public async getCameraStream(camDeviceId: string | null): Promise<MediaStream> {
        const constraints = {
            video: camDeviceId ? { deviceId: { exact: camDeviceId } } : true,
            audio: false,
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);

        this.stopAndReplaceStream(newStream);

        return newStream;
    }

    /**
     * 获取屏幕共享流。
     */
    public async getScreenStream(): Promise<MediaStream> {
        const constraints = {
            video: true,
            audio: false,
        };
        const newStream = await navigator.mediaDevices.getDisplayMedia(constraints);

        this.stopAndReplaceStream(newStream);

        return newStream;
    }

    /**
     * 停止所有媒体轨道，并清除流。
     */
    public stopAllStreams(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.notifyListeners();
        }
    }

    /**
     * 获取当前激活的媒体流实例。
     */
    public getCurrentStream(): MediaStream | null {
        return this.stream;
    }

    /**
     * 订阅流变更事件。
     */
    public addChangeListener(listener: StreamChangeListener): void {
        this.listeners.push(listener);
    }

    /**
     * 取消订阅流变更事件。
     */
    public removeChangeListener(listener: StreamChangeListener): void {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    /**
     * 内部方法：停止旧流，设置新流并添加监听器。
     */
    private stopAndReplaceStream(newStream: MediaStream): void {
        // 先停止旧流，确保不会有多个流同时运行
        this.stopAllStreams();

        this.stream = newStream;

        // 为新流的每个轨道添加 onended 监听器。
        // 这是为了处理流被外部中断（如拔出摄像头）的场景。
        this.stream.getTracks().forEach(track => {
            track.onended = () => {
                // 当任何一个轨道结束时，停止整个流。
                this.stopAllStreams();
            };
        });

        this.notifyListeners();
    }

    /**
     * 内部方法：通知所有监听者流已变更。
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.stream));
    }
}

// 导出单例实例，方便在任何地方导入
export const mediaStreamManager = LocalMediaStreamManager.getInstance();