// WebSocket 消息基础接口

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

