import { VideoSourceType } from "@/common/constant";

export enum StreamStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  ACTIVE_CAMERA = 'active_camera',
  ACTIVE_SCREEN = 'active_screen',
  PERMISSION_DENIED = 'permission_denied',
  ERROR = 'error',
}

export interface StreamDetails {
  videoSourceType: VideoSourceType; // 使用 VideoSourceType 枚举
  camDeviceId?: string;
  micDeviceId?: string;
  isCameraMuted: boolean;
  isMicrophoneMuted: boolean;
}

export interface MediaStreamState {
  status: StreamStatus;
  stream: MediaStream | null;
  error: string | null;
  lastRequestedDetails: StreamDetails | null;
}

type StreamAcquiredAction = {
  type: 'STREAM_ACQUIRED';
  payload: { stream: MediaStream; details: StreamDetails };
};

type StreamRequestAction = {
  type: 'REQUEST_STREAM';
  payload: StreamDetails;
};

type StreamErrorAction = {
  type: 'STREAM_ERROR';
  payload: { error: string };
};

type PermissionDeniedAction = {
  type: 'PERMISSION_DENIED';
};

type StopStreamAction = {
  type: 'STOP_STREAM';
};

type ResetStateAction = {
  type: 'RESET_STATE';
};

export type MediaStreamAction =
  | StreamAcquiredAction
  | StreamRequestAction
  | StreamErrorAction
  | PermissionDeniedAction
  | StopStreamAction
  | ResetStateAction;
