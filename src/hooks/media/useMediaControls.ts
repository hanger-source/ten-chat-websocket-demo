import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { requestCamera, requestScreen, stopMedia } from '@/store/reducers/localMediaStream';
import { RootState } from '@/store';

const useMediaControls = () => {
  const dispatch = useDispatch();

  // 从 Redux 状态中获取当前用户意图和设备配置
  const { requestedVideoSource, selectedCamDeviceId } = useSelector(
    (state: RootState) => (state.localMediaStream)
  );

  /**
   * 切换摄像头流。
   * 如果当前意图是摄像头，则停止；否则请求摄像头流。
   */
  const toggleCamera = useCallback(() => {
    if (requestedVideoSource === 'camera') {
      dispatch(stopMedia());
    } else {
      dispatch(requestCamera({ camDeviceId: selectedCamDeviceId }));
    }
  }, [dispatch, requestedVideoSource, selectedCamDeviceId]);

  /**
   * 切换屏幕共享流。
   * 如果当前意图是屏幕共享，则停止；否则请求屏幕共享流。
   */
  const toggleScreen = useCallback(() => {
    if (requestedVideoSource === 'screen') {
      dispatch(stopMedia());
    } else {
      dispatch(requestScreen({}));
    }
  }, [dispatch, requestedVideoSource]);
  
  /**
   * 停止所有媒体流。
   */
  const stopAllMedia = useCallback(() => {
    dispatch(stopMedia());
  }, [dispatch]);

  return {
    toggleCamera,
    toggleScreen,
    stopAllMedia,
  };
};

export default useMediaControls;