
import { MediaStreamAction, MediaStreamState, StreamStatus } from './types';

export const initialMediaStreamState: MediaStreamState = {
  status: StreamStatus.IDLE,
  stream: null,
  error: null,
  lastRequestedDetails: null,
};

export function mediaStreamReducer(
  state: MediaStreamState,
  action: MediaStreamAction,
): MediaStreamState {
  switch (action.type) {
    case 'REQUEST_STREAM':
      // 如果已经处于请求中，或者已经激活，并且请求详情一致，则忽略重复请求
      if (
        state.status === StreamStatus.PENDING ||
        ((state.status === StreamStatus.ACTIVE_CAMERA ||
          state.status === StreamStatus.ACTIVE_SCREEN) &&
          JSON.stringify(state.lastRequestedDetails) ===
            JSON.stringify(action.payload))
      ) {
        return state;
      }

      // 如果是新的请求，并且有旧流，先清理旧流
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }

      return {
        ...state,
        status: StreamStatus.PENDING,
        stream: null,
        error: null,
        lastRequestedDetails: action.payload,
      };

    case 'STREAM_ACQUIRED':
      // 只有当获取到的流的详情与上次请求的详情一致时才更新状态
      if (
        JSON.stringify(action.payload.details) !==
        JSON.stringify(state.lastRequestedDetails)
      ) {
        // 如果不匹配，说明这个流是针对一个旧的或已取消的请求，立即停止它并忽略
        action.payload.stream.getTracks().forEach(track => track.stop());
        return state; // 保持当前状态不变
      }

      return {
        ...state,
        status:
          action.payload.details.videoSourceType === 'camera'
            ? StreamStatus.ACTIVE_CAMERA
            : StreamStatus.ACTIVE_SCREEN,
        stream: action.payload.stream,
        error: null,
      };

    case 'STREAM_ERROR':
      // 如果有旧流，停止它
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }
      return {
        ...state,
        status: StreamStatus.ERROR,
        stream: null,
        error: action.payload.error,
      };

    case 'PERMISSION_DENIED':
      // 如果有旧流，停止它
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }
      return {
        ...state,
        status: StreamStatus.PERMISSION_DENIED,
        stream: null,
        error: 'Permission Denied',
      };

    case 'STOP_STREAM':
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }
      return {
        ...state,
        status: StreamStatus.IDLE,
        stream: null,
        error: null,
        lastRequestedDetails: null,
      };

    case 'RESET_STATE':
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }
      return initialMediaStreamState;

    default:
      return state;
  }
}
