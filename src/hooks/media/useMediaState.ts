import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const useMediaState = () => {
    // 从 Redux 状态树中精确提取 UI 所需的数据
    const { status, requestedVideoSource, activeVideoSource, error } = useSelector(
        (state: RootState) => ({
            status: state.localMediaStream.status,
            requestedVideoSource: state.localMediaStream.requestedVideoSource,
            activeVideoSource: state.localMediaStream.activeVideoSource,
            error: state.localMediaStream.error,
        })
    );

    return {
        status,
        requestedVideoSource,
        activeVideoSource,
        error,
    };
};

export default useMediaState;