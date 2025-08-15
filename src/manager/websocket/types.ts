// 移除 AGEventEmitter 导入
// import { AGEventEmitter } from "../../common";

// tion 接口，对应后端 `com.tenframework.core.message.Location`
export interface ILocation { // 将 Location 重命名为 ILocation
    app_uri: string;
    graph_id: string;
    extension_name: string;
}

// ocket 消息类型枚举，对应后端 `com.tenframework.core.message.MessageType`
export enum WebSocketMessageType { // 将 MessageType 重命名为 WebSocketMessageType
    Invalid = "invalid",
    Command = "cmd",
    CommandResult = "cmd_result",
    CommandCloseApp = "cmd_close_app",
    CommandStartGraph = "cmd_start_graph",
    CommandStopGraph = "cmd_stop_graph",
    CommandTimer = "cmd_timer",
    CommandTimeout = "cmd_timeout",
    Data = "data",
    VideoFrame = "video_frame",
    AudioFrame = "audio_frame",
}

// ocket 连接状态枚举
/*
export enum WebSocketConnectionState {
    DISCONNECTED = "DISCONNECTED",
    CONNECTING = "CONNECTING",
    CONNECTED = "CONNECTED",
    ERROR = "ERROR",
}
*/
// 对应后端 `com.tenframework.core.message.Message` 接口
export interface IBaseMessage { // 将 BaseMessage 重命名为 IBaseMessage
    type: WebSocketMessageType; // 使用 WebSocketMessageType
    name?: string;
    source_location?: ILocation; // 使用 ILocation
    destination_locations?: ILocation[]; // 使用 ILocation
    properties?: Record<string, unknown>;
    timestamp?: number;
}

// ，对应后端 `com.tenframework.core.message.AudioFrame` 类
export interface IAudioFrame extends IBaseMessage { // 将 AudioFrameMessage 重命名为 IAudioFrame
    type: WebSocketMessageType.AudioFrame; // 使用 WebSocketMessageType
    buf: Uint8Array; // 音频数据的字节数组 (与 sendAudioFrame 对齐)
    is_eof: boolean; // 是否文件结束
    sample_rate: number; // 采样率
    channels: number; // 声道数
    bits_per_sample: number; // 每采样位数
    format?: string; // 音频格式
    samples_per_channel?: number; // 每声道采样数
}

//  消息的 JSON 负载类型
export interface IDataMessageChatPayload {
    text?: string;
    is_final?: boolean; // s_final
    user_id?: string; // ser_id
    chat_role?: string; // hat_role
    user_name?: string; // ser_name
    time?: number;
    stream_id?: string; // Payload 移动过来
    text_ts?: number; // Payload 移动过来
    data_type?: string; // Payload 移动过来
    data?: { // Payload 移动过来
        image_url?: string;
        text?: string; // for reasoning
        action?: string;
        data?: Record<string, unknown>;
    };
}

// (基本结构)
export interface IDataMessageBase extends IBaseMessage {
    type: WebSocketMessageType.Data;
    data: Uint8Array; // 数据的字节数组，始终存在
    is_eof?: boolean;
    content_type?: string; // 例如 "application/octet-stream", "text/plain", "application/json"
    encoding?: string;
    data_type?: string; // 例如 "raw", "binary", "json", "text"
}

// (原始二进制数据)
export interface IDataMessageRaw extends IDataMessageBase {
    // 当 content_type 不是 "application/json" 时
    content_type?: Exclude<string, "application/json">;
}

// (JSON 负载)
// ata 仍然是原始 Uint8Array，json_payload 是解析后的对象
export interface IDataMessageJson extends IDataMessageBase {
    content_type: "application/json"; // 明确 content_type 为 "application/json"
    json_payload: IDataMessageChatPayload; // JSON 负载的实际类型
}

// 所有可能的消息类型 (用于函数参数和返回值)
export type IDataMessage = IDataMessageRaw | IDataMessageJson;

// 对应后端 `com.tenframework.core.message.Command` 类
export interface ICommandMessage extends IBaseMessage {
    type: WebSocketMessageType.Command;
    command_id: string; // ommandId` (long), 转换为 string 避免精度问题
    parent_command_id?: string; // arentCommandId` (long), 转换为 string 避免精度问题
    args?: Record<string, unknown>; // ap<String, Object>` 类型
}

// 口，对应后端 `com.tenframework.core.message.CommandResult` 类
export interface ICommandResultMessage extends IBaseMessage {
    type: WebSocketMessageType.CommandResult;
    command_id: string; // ommandId` (long), 转换为 string 避免精度问题
    result?: Record<string, unknown>; // ap<String, Object>` 类型
    is_final?: boolean; // 是否最终结果
    error?: string; // 错误信息
    error_code?: number; // 错误代码
}

// 所有可能的消息类型
export type WebSocketMessage =
    | IAudioFrame
    | IDataMessage // ataMessage 联合类型
    | ICommandMessage
    | ICommandResultMessage;

// et 事件枚举
export enum WebSocketEvents {
    Connected = "connected",
    Disconnected = "disconnected",
    Error = "error",
    AudioFrameReceived = "audioFrameReceived",
    DataReceived = "dataReceived",
    CommandReceived = "commandReceived",
    CommandResultReceived = "commandResultReceived",
}

export interface IWebSocketManagerService { // IWebSocketService 和 IWebSocketClient
  connect(
    url: string,
    onOpen: () => void,
    onMessage: (message: WebSocketMessage) => void,
    onClose: () => void,
    onError: (error: Event | Error) => void,
    params?: Record<string, string>, // ing，解决 URLSearchParams 类型问题
    appUri?: string,
    graphId?: string,
  ): Promise<void>; //  方法返回 Promise<void>
  disconnect(): void;
  sendMessage(message: WebSocketMessage): void;
  sendAudioFrame(
    audioData: Uint8Array,
    name?: string,
    sampleRate?: number,
    channels?: number,
    bitsPerSample?: number,
    isEof?: boolean,
  ): void;
  sendData(data: Uint8Array | string | IDataMessageChatPayload, contentType?: string): void; // Data 签名以匹配实现
  isConnected(): boolean;
  getConnectionState(): WebSocketConnectionState;
  on(
    event: WebSocketEvents.AudioFrameReceived,
    listener: (audioFrame: IAudioFrame) => void,
  ): void;
  on(
    event: WebSocketEvents.DataReceived,
    listener: (dataMessage: IDataMessage) => void,
  ): void;
  on(
    event: WebSocketEvents.CommandReceived,
    listener: (command: ICommandMessage) => void,
  ): void;
  on(
    event: WebSocketEvents.CommandResultReceived,
    listener: (commandResult: ICommandResultMessage) => void,
  ): void;
  on(
    event:
      | WebSocketEvents.Connected
      | WebSocketEvents.Disconnected
      | WebSocketEvents.Error,
    listener: (error?: Event | Error) => void,
  ): void;
  off(
    event: WebSocketEvents.AudioFrameReceived,
    listener: (audioFrame: IAudioFrame) => void,
  ): void;
  off(
    event: WebSocketEvents.DataReceived,
    listener: (dataMessage: IDataMessage) => void,
  ): void;
  off(
    event: WebSocketEvents.CommandReceived,
    listener: (command: ICommandMessage) => void,
  ): void;
  off(
    event: WebSocketEvents.CommandResultReceived,
    listener: (commandResult: ICommandResultMessage) => void,
  ): void;
  off(
    event:
      | WebSocketEvents.Connected
      | WebSocketEvents.Disconnected
      | WebSocketEvents.Error,
    listener: (error?: Event | Error) => void,
  ): void;
}

// tPayload，其字段已合并到 IDataMessageChatPayload 中
