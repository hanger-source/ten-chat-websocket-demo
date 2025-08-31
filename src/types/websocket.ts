// WebSocket 消息基础接口
export enum MessageType {
    DATA = 'DATA',
    CMD_RESULT = 'CMD_RESULT',
    AUDIO_FRAME = 'AUDIO_FRAME',
    // 根据需要添加其他消息类型
}

export interface CommandResult {
    id: string;
    type: MessageType.CMD_RESULT;
    name: string;
    src_loc: any;
    dest_locs: any[];
    success: boolean;
    errorMessage?: string;
    detail?: string;
    // 根据需要添加其他字段
}

export interface Message {
    id: string;
    type: MessageType;
    timestamp?: number;
    group_timestamp?: number;
    group_id?: string;
    is_final?: boolean;
    properties?: Record<string, any>;
    buf?: Uint8Array; // 用于 AUDIO_FRAME 等二进制数据
    sample_rate?: number; // 用于 AUDIO_FRAME
    number_of_channel?: number; // 用于 AUDIO_FRAME
}

// 会话连接状态枚举
export enum SessionConnectionState {
    IDLE = 'idle',
    CONNECTING_SESSION = 'connecting_session',
    SESSION_ACTIVE = 'session_active',
    SESSION_FAILED = 'session_failed',
}

// WebSocket 连接状态枚举
export enum WebSocketConnectionState {
    CONNECTING = 'connecting',
    OPEN = 'open',
    CLOSING = 'closing',
    CLOSED = 'closed',
}

