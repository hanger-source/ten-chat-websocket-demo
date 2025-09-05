// 数据消息
export interface Message {
    id: string; // 消息的唯一标识符
    type: MessageType; // 消息类型，使用枚举
    src_loc?: Location; // 消息的源位置
    dest_locs: Location[]; // 消息的目的位置列表
    name?: string; // 消息名称 (可选，用于路由或语义)
    properties?: Record<string, any>; // 消息的附加属性 (可选)
    timestamp: number; // 时间戳
}

// 命令消息
export interface Command extends Message {
    type: MessageType; // 将类型改为 MessageType，允许子类精确指定
    name: string; // 命令名称，用于 Jackson 多态识别
    cmd_id: string; // Change type to string
    parent_cmd_id?: string;
}

// StartGraph 命令
export interface StartGraphCommand extends Command {
    type: MessageType.CMD_START_GRAPH; // 明确指定 type
    name: typeof CommandType.START_GRAPH; // 明确指定 name
    long_running_mode?: boolean;
    predefined_graph_name?: string;
    extension_groups_info?: any[]; // 根据 Java 定义，目前使用 any
    extensions_info?: any[]; // 根据 Java 定义，目前使用 any
    graph_json?: string; // 对应 Java 的 graphJsonDefinition
}

// StopGraph 命令
export interface StopGraphCommand extends Command {
    type: MessageType.CMD_STOP_GRAPH; // 明确指定 type
    name: typeof CommandType.STOP_GRAPH; // 明确指定 name
    graph_id?: string; // 停止特定 Engine 的 Graph ID
}

// 命令结果消息
export interface CommandResult extends Message {
    type: MessageType.CMD_RESULT;
    cmd_id: string; // Change type to string
    original_cmd_id: string; // Add original_cmd_id
    original_cmd_type: CommandType; // Add original_cmd_type
    original_cmd_name?: string; // Add original_cmd_name
    status_code: number;
    is_final: boolean;
    is_completed: boolean;
}

export interface DataMessage extends Message {
    type: MessageType.DATA;
    data: Uint8Array; // 对应 data
}

// 音频帧消息
export interface AudioFrame extends Message {
    type: MessageType.AUDIO_FRAME;
    buf: Uint8Array; // 对应 buf
    sample_rate: number;
    number_of_channel: number; // 对应 numberOfChannel
    bits_per_sample: number; // 对应 bytesPerSample
    data_fmt: AudioFrameDataFmt; // 对应 data_fmt，更改字段名为 data_fmt
    is_eof?: boolean;
    frame_timestamp: number; // 对应 frameTimestamp
    samples_per_channel?: number; // 对应 samplesPerChannel
    channel_layout?: number; // 对应 channelLayout
    line_size?: number; // 对应 lineSize
}

// 视频帧消息
export interface VideoFrame extends Message {
    type: MessageType.VIDEO_FRAME;
    data: Uint8Array; // 对应 data
    width: number;
    height: number;
    pixel_fmt: number; // Changed from pixel_format to pixel_fmt
    is_eof?: boolean;
    frame_timestamp: number; // 对应 frameTimestamp
}

// 位置信息
export interface Location {
    app_uri: string;
    graph_id: string;
    extension_name?: string; // Change to optional
}

// 消息类型枚举
export enum MessageType {
    INVALID = 'INVALID',
    CMD = 'CMD',
    CMD_RESULT = 'CMD_RESULT',
    DATA = 'DATA',
    VIDEO_FRAME = 'VIDEO_FRAME',
    AUDIO_FRAME = 'AUDIO_FRAME',
    CMD_START_GRAPH = 'CMD_START_GRAPH',
    CMD_STOP_GRAPH = 'CMD_STOP_GRAPH',
    CMD_TIMER = 'CMD_TIMER',
    CMD_TIMEOUT = 'CMD_TIMEOUT',
}

// 命令类型枚举 - 匹配后端的 GraphEventCommandType (Keep as is, but START_GRAPH/STOP_GRAPH are also names in Java Command's JsonSubTypes)
export enum CommandType {
    START_GRAPH = 'CMD_START_GRAPH',
    STOP_GRAPH = 'CMD_STOP_GRAPH',
    
    FLUSH = "flush"
}

// 音频帧数据格式枚举
export enum AudioFrameDataFmt {
    INTERLEAVE = 1,
    NON_INTERLEAVE = 2,
}