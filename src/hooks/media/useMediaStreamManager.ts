import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {RootState} from "@/store";
import {mediaStreamManager} from "@/manager/media/LocalMediaStreamManager";
import {mediaFailed, mediaReady} from "@/store/reducers/localMediaStream";
import {permissionDenied} from "@/store/reducers/mediaStream";

/**
 * 核心副作用 Hook，负责将 Redux 状态与底层媒体流服务同步。
 * 这个 Hook 应该在应用的根组件中只被调用一次。
 */
const useMediaStreamManager = () => {
  const dispatch = useDispatch();

  // 监听 Redux 状态中所有驱动媒体流生命周期和视频状态的属性。
  const { requestedVideoSource, selectedCamDeviceId, isVideoEnabled } = useSelector((state: RootState) => ({
    requestedVideoSource: state.localMediaStream.requestedVideoSource,
    selectedCamDeviceId: state.localMediaStream.selectedCamDeviceId,
    isVideoEnabled: state.localMediaStream.isVideoEnabled,
  }));

  /**
   * 主要的 useEffect，负责流的创建和销毁。
   * 它将所有与流获取相关的逻辑集中在一起。
   */
  useEffect(() => {
    // 异步函数，用于执行媒体流获取操作。
    const getStream = async () => {
      try {
        if (requestedVideoSource === 'camera') {
          const stream = await mediaStreamManager.getCameraStream(selectedCamDeviceId);
          dispatch(mediaReady());
        } else if (requestedVideoSource === 'screen') {
          const stream = await mediaStreamManager.getScreenStream();
          dispatch(mediaReady());
        }
      } catch (error: any) {
        // 根据错误类型 dispatch 不同的 action。
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          dispatch(permissionDenied());
        } else {
          dispatch(mediaFailed(error.message));
        }
      }
    };

    // 如果有请求，则开始执行副作用。
    if (requestedVideoSource !== null) {
      getStream();
    }

    // 清理函数，在依赖项变化或组件卸载时停止所有流。
    return () => {
      mediaStreamManager.stopAllStreams();
    };
  }, [requestedVideoSource, selectedCamDeviceId, dispatch]);

  /**
   * 第二个 useEffect，专门负责控制视频轨道的启用状态。
   * 这个 Hook 仅在 isVideoEnabled 变化时运行。
   */
  useEffect(() => {
    const stream = mediaStreamManager.getCurrentStream();
    if (stream) {
        // 根据 Redux 状态控制底层视频轨道的启用状态。
        stream.getVideoTracks().forEach(track => (track.enabled = isVideoEnabled));
    }
  }, [isVideoEnabled]);
};

export default useMediaStreamManager;