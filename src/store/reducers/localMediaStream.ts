import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ------------------------------------
// 1. 类型定义：清晰且严谨的状态
// ------------------------------------

// 视频源类型
export type VideoSource = 'camera' | 'screen';

// 核心状态机，精确描述生命周期
export enum StreamStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  ACTIVE = 'active',
  ERROR = 'error',
  PERMISSION_DENIED = 'permission_denied',
}

// 整个媒体流状态树
export interface MediaState {
  // 用户的意图：始终代表用户想要什么流。这是副作用 Hook 的驱动源。
  requestedVideoSource: VideoSource | null;

  // 应用的现实：代表当前实际选择的流类型，但并不一定激活。这是 UI 渲染的唯一依据。
  selectedVideoSource: VideoSource | null;

  // 选中的设备 ID，作为配置参数
  selectedCamDeviceId: string | null;

  isVideoEnabled: boolean;

  // 核心状态，驱动 UI 渲染和 Hook 逻辑
  status: StreamStatus;
  // 错误信息
  error: string | null;
}

const initialState: MediaState = {
  requestedVideoSource: null,
  selectedVideoSource: null,
  selectedCamDeviceId: null,
  //   视频轨道启用状态，用于控制静音/关闭摄像头
  isVideoEnabled: true,
  status: StreamStatus.IDLE,
  error: null,
};

// ------------------------------------
// 2. Reducer：定义所有状态转换
// ------------------------------------
const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    // 【用户操作】请求摄像头流
    requestCamera: (state, action: PayloadAction<{ camDeviceId: string | null; }>) => {
      // 更新用户的意图和配置
      state.requestedVideoSource = 'camera';
      state.selectedVideoSource = 'camera';
      state.selectedCamDeviceId = action.payload.camDeviceId;
      // 更新状态，表示正在处理请求
      state.status = StreamStatus.PENDING;
      state.error = null;
    },

    // 【用户操作】请求屏幕共享流
    requestScreen: (state, action: PayloadAction<{}>) => {
      // 更新用户的意图和配置
      state.requestedVideoSource = 'screen';
      state.selectedVideoSource = 'screen'
      state.selectedCamDeviceId = null; 
      // 更新状态，表示正在处理请求
      state.status = StreamStatus.PENDING;
      state.error = null;
    },

    // 【用户操作】切换视频轨道状态。
    toggleVideo: (state) => {
        state.isVideoEnabled = !state.isVideoEnabled;
    },

    // 【用户操作】停止所有流
    stopMedia: (state) => {
      // 清除意图和现实，重置状态
      state.status = StreamStatus.IDLE;
      state.error = null;
    },
    
    // 【副作用 Hook 调用】流成功获取
    mediaReady: (state) => {
      // 只有在成功时，才将意图同步到现实中
      state.selectedVideoSource = state.requestedVideoSource;
      state.status = StreamStatus.ACTIVE;
      state.error = null;
    },

    // 【副作用 Hook 调用】流获取失败
    mediaFailed: (state, action: PayloadAction<string>) => {
      state.status = StreamStatus.ERROR;
      state.error = action.payload;
      // 失败后，清除意图和现实
      state.requestedVideoSource = null;
    },
    
    // 【副作用 Hook 调用】权限被拒绝
    permissionDenied: (state) => {
      state.status = StreamStatus.PERMISSION_DENIED;
      state.error = 'Permission Denied';
      // 权限拒绝后，清除意图和现实
      state.requestedVideoSource = null;
    },

    // 完整的状态重置
    resetState: () => initialState,
  },
});

export const {
  requestCamera,
  requestScreen,
  toggleVideo,
  stopMedia,
  mediaReady,
  mediaFailed,
  permissionDenied,
  resetState,
} = mediaSlice.actions;

export default mediaSlice.reducer;