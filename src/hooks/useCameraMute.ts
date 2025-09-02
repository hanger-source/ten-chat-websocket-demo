import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { StreamStatus } from '@/store/reducers/mediaStream';

interface UseCameraMuteOptions {
  getMediaStreamInstance: () => MediaStream | null;
}

export const useCameraMute = ({ getMediaStreamInstance }: UseCameraMuteOptions) => {
  const isCameraMuted = useSelector((state: RootState) => state.mediaStream.isCameraMuted);
  const streamStatus = useSelector((state: RootState) => state.mediaStream.status);

  useEffect(() => {
    const currentStream = getMediaStreamInstance();
    console.log('[DEBUG_CAMERA_MUTE] useEffect triggered. isCameraMuted:', isCameraMuted, ', Stream Status:', streamStatus, ', Current Stream ID:', currentStream?.id);

    if (currentStream && (streamStatus === StreamStatus.ACTIVE_CAMERA || streamStatus === StreamStatus.ACTIVE_SCREEN)) {
      const videoTracks = currentStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoTrack: MediaStreamTrack = videoTracks[0];
        // 只有在需要时才改变 enabled 状态，避免不必要的 DOM 操作
        if (videoTrack.enabled === isCameraMuted) {
          console.log('[DEBUG_CAMERA_MUTE] Adjusting video track enabled state to:', !isCameraMuted);
          videoTrack.enabled = !isCameraMuted;
        }
      } else {
        console.warn('[DEBUG_CAMERA_MUTE] No video tracks found in current active stream.');
      }
    } else {
      console.log('[DEBUG_CAMERA_MUTE] No active stream or stream not in ACTIVE state. Skipping mute adjustment.');
    }
  }, [isCameraMuted, streamStatus, getMediaStreamInstance]);
};
