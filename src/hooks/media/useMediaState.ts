import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const useMediaState = () => {
    // 从 Redux 状态树中精确提取 UI 所需的数据
    const { status, requestedVideoSource, selectedVideoSource, error, isVideoEnabled } = useSelector(
        (state: RootState) => (state.localMediaStream)
    );

    return {
        status,
        requestedVideoSource,
        selectedVideoSource,
        error,
        isVideoEnabled,
    };
};

export default useMediaState;