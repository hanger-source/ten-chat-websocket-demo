import { useMultibandTrackVolume } from "@/common/hooks";
import { useAppSelector } from "@/common/hooks"; // 导入 useAppSelector

export interface AudioVisualizerProps {
  type: "agent" | "user";
  track?: MediaStreamTrack | null;
  gap: number;
  barWidth: number;
  minBarHeight: number;
  maxBarHeight: number;
  borderRadius: number;
}

export default function AudioVisualizer(props: AudioVisualizerProps) {
  const {
    track,
    gap,
    barWidth,
    minBarHeight,
    maxBarHeight,
    borderRadius,
    type,
  } = props;

  const isMicrophoneMuted = useAppSelector(state => state.global.isMicrophoneMuted);

  // 如果麦克风静音，则强制频率为0，使可视化条保持在最小高度
  const frequencies = useMultibandTrackVolume(track, 20).map(freq => {
    // console.log(`[AUDIO_VISUALIZER_LOG] isMicrophoneMuted: ${isMicrophoneMuted}, original frequency: ${freq}`);
    return isMicrophoneMuted ? 0 : freq;
  });

  return (
    <div
      className={`flex items-center justify-center`}
      style={{ gap: `${gap}px` }}
    >
      {frequencies.map((frequency, index) => {
        const style = {
          height:
            minBarHeight + frequency * (maxBarHeight - minBarHeight) + "px",
          borderRadius: borderRadius + "px",
          width: barWidth + "px",
          transition:
            "background-color 0.35s ease-out, transform 0.25s ease-out, height 0.1s ease-out",
          backgroundColor: type === "agent" ? "#0888FF" : "#3B82F6",
          boxShadow: type === "agent" ? "0 0 10px #EAECF0" : "0 0 5px #3B82F6",
        };

        return <span key={index} style={style} />;
      })}
    </div>
  );
}