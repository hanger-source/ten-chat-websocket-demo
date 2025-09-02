import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { StreamStatus } from '@/store/reducers/mediaStream';

interface UseCameraMuteProps {
  getMediaStreamInstance: () => MediaStream | null;
}

export const useCameraMute = ({ getMediaStreamInstance }: UseCameraMuteProps) => {
  const dispatch = useDispatch();
  const { isCameraMuted, status: streamStatus } = useSelector((state: RootState) => state.mediaStream);

  useEffect(() => {
    const currentStream = getMediaStreamInstance();
    if (currentStream && (streamStatus === StreamStatus.ACTIVE_CAMERA || streamStatus === StreamStatus.ACTIVE_SCREEN)) {
      const videoTracks = currentStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoTrack: MediaStreamTrack = videoTracks[0];
        if (videoTrack.enabled === isCameraMuted) {
          videoTrack.enabled = !isCameraMuted;
        }
      }
    }
  }, [isCameraMuted, streamStatus, getMediaStreamInstance]);
};
