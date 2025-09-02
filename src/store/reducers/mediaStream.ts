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
      console.log('[DEBUG_MEDIA_STREAM] requestStream reducer. Payload:', action.payload, '. Payload Keys:', Object.keys(action.payload || {}), '. Current state:', state);
      state.lastRequestedDetails = action.payload;
      state.error = null;
      if (action.payload !== null) {
        state.status = StreamStatus.PENDING;
      } else {
        state.status = StreamStatus.IDLE;
      }
      console.log('[DEBUG_MEDIA_STREAM] requestStream reducer. New state:', state);
    },
    streamAcquired: (state, action: PayloadAction<{ details: StreamDetails }>) => {
      console.log('[DEBUG_MEDIA_STREAM] streamAcquired reducer. Payload:', action.payload, '. Current state:', state);
      if (
        JSON.stringify(action.payload.details) !==
        JSON.stringify(state.lastRequestedDetails)
      ) {
        console.log('[DEBUG_MEDIA_STREAM] streamAcquired reducer. Mismatch in requested details, returning current state.');
        return state;
      }

      state.status = action.payload.details.videoSourceType === VideoSourceType.CAMERA
        ? StreamStatus.ACTIVE_CAMERA
        : StreamStatus.ACTIVE_SCREEN;
      state.error = null;
      console.log('[DEBUG_MEDIA_STREAM] streamAcquired reducer. New state:', state);
    },
    streamError: (state, action: PayloadAction<{ error: string }>) => {
      console.log('[DEBUG_MEDIA_STREAM] streamError reducer. Payload:', action.payload, '. Current state:', state);
      state.status = StreamStatus.ERROR;
      state.error = action.payload.error;
      console.log('[DEBUG_MEDIA_STREAM] streamError reducer. New state:', state);
    },
    permissionDenied: (state) => {
      console.log('[DEBUG_MEDIA_STREAM] permissionDenied reducer. Current state:', state);
      state.status = StreamStatus.PERMISSION_DENIED;
      state.error = 'Permission Denied';
      console.log('[DEBUG_MEDIA_STREAM] permissionDenied reducer. New state:', state);
    },
    stopStream: (state) => {
      console.log('[DEBUG_MEDIA_STREAM] stopStream reducer. Current state:', state);
      state.status = StreamStatus.IDLE;
      state.lastRequestedDetails = null;
      state.error = null;
      console.log('[DEBUG_MEDIA_STREAM] stopStream reducer. New state:', state);
    },
    resetState: (state) => {
      console.log('[DEBUG_MEDIA_STREAM] resetState reducer. Current state:', state);
      return initialMediaStreamState;
    },
    setCameraMuted: (state, action: PayloadAction<boolean>) => {
      console.log('[DEBUG_MEDIA_STREAM] setCameraMuted reducer. Payload:', action.payload, '. Current state:', state);
      state.isCameraMuted = action.payload; // 直接更新独立的 isCameraMuted
      console.log('[DEBUG_MEDIA_STREAM] setCameraMuted reducer. New state:', state);
    },
    setSelectedCamDeviceId: (state, action: PayloadAction<string | undefined>) => {
      console.log('[DEBUG_MEDIA_STREAM] setSelectedCamDeviceId reducer. Payload:', action.payload, '. Current state:', state);
      if (state.lastRequestedDetails) {
        state.lastRequestedDetails.camDeviceId = action.payload;
      }
      console.log('[DEBUG_MEDIA_STREAM] setSelectedCamDeviceId reducer. New state:', state);
    },
    setVideoSourceType: (state, action: PayloadAction<VideoSourceType>) => {
      console.log('[DEBUG_MEDIA_STREAM] setVideoSourceType reducer. Payload:', action.payload, '. Current state:', state);
      if (state.lastRequestedDetails) {
        state.lastRequestedDetails.videoSourceType = action.payload;
      }
      console.log('[DEBUG_MEDIA_STREAM] setVideoSourceType reducer. New state:', state);
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
