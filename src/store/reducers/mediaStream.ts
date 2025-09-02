import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VideoSourceType } from "@/common/constant";

// 从 hooks/types.ts 复制过来的类型定义
export enum StreamStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  ACTIVE_CAMERA = 'active_camera',
  ACTIVE_SCREEN = 'active_screen',
  PERMISSION_DENIED = 'permission_denied',
  ERROR = 'error',
}

export interface StreamDetails {
  videoSourceType: VideoSourceType;
  camDeviceId?: string;
  micDeviceId?: string;
}

export interface MediaStreamState {
  status: StreamStatus;
  error: string | null;
  lastRequestedDetails: StreamDetails | null;
  isCameraMuted: boolean; // 独立的摄像头静音状态
}

export const initialMediaStreamState: MediaStreamState = {
  status: StreamStatus.IDLE,
  error: null,
  lastRequestedDetails: null,
  isCameraMuted: false, // 默认不静音
};

const mediaStreamSlice = createSlice({
  name: 'mediaStream',
  initialState: initialMediaStreamState,
  reducers: {
    requestStream: (state, action: PayloadAction<StreamDetails | null>) => {
      state.lastRequestedDetails = action.payload;
      state.error = null;
      if (action.payload !== null) {
        state.status = StreamStatus.PENDING;
      } else {
        state.status = StreamStatus.IDLE;
      }
    },
    streamAcquired: (state, action: PayloadAction<{ details: StreamDetails }>) => {
      if (
        JSON.stringify(action.payload.details) !==
        JSON.stringify(state.lastRequestedDetails)
      ) {
        return state;
      }

      state.status = action.payload.details.videoSourceType === VideoSourceType.CAMERA
        ? StreamStatus.ACTIVE_CAMERA
        : StreamStatus.ACTIVE_SCREEN;
      state.error = null;
    },
    streamError: (state, action: PayloadAction<{ error: string }>) => {
      state.status = StreamStatus.ERROR;
      state.error = action.payload.error;
    },
    permissionDenied: (state) => {
      state.status = StreamStatus.PERMISSION_DENIED;
      state.error = 'Permission Denied';
    },
    stopStream: (state) => {
      state.status = StreamStatus.IDLE;
      state.lastRequestedDetails = null;
      state.error = null;
    },
    resetState: (state) => {
      return initialMediaStreamState;
    },
    setCameraMuted: (state, action: PayloadAction<boolean>) => {
      state.isCameraMuted = action.payload; // 直接更新独立的 isCameraMuted
    },
    setSelectedCamDeviceId: (state, action: PayloadAction<string | undefined>) => {
      if (state.lastRequestedDetails) {
        state.lastRequestedDetails.camDeviceId = action.payload;
      }
    },
    setVideoSourceType: (state, action: PayloadAction<VideoSourceType>) => {
      if (state.lastRequestedDetails) {
        state.lastRequestedDetails.videoSourceType = action.payload;
      }
    },
  },
});

export const {
  requestStream,
  streamAcquired,
  streamError,
  permissionDenied,
  stopStream,
  resetState,
  setCameraMuted,
  setSelectedCamDeviceId,
  setVideoSourceType,
} = mediaStreamSlice.actions;

export default mediaStreamSlice.reducer;
