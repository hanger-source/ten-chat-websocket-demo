import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { toggleVideo } from '@/store/reducers/localMediaStream';

/**
 * 一个 Hook，用于提供音视频轨道的开关控制。
 * 它将 UI 操作直接映射到 Redux 的 Action，实现音视频状态的同步。
 */
const useMediaTrackControls = () => {
  const dispatch = useDispatch();


  /**
   * 切换视频轨道的启用状态。
   * 触发 Redux action，由 useMediaStreamManager 监听并执行实际操作。
   */
  const toggleVideoEnabled = useCallback(() => {
    dispatch(toggleVideo());
  }, [dispatch]);

  return { toggleVideoEnabled };
};

export default useMediaTrackControls;