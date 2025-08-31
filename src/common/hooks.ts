"use client";
import { useState, useEffect, useRef } from "react";
import type { AppDispatch, AppStore, RootState } from "../store";
import { useDispatch, useSelector, useStore } from "react-redux";
import { Graph } from "@/common/graph";
import { initializeGraphData } from "@/store/reducers/global";

const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number,
) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
};

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
// 移除冗余的 useMultibandTrackVolume hook

export function useMultibandTrackVolume(
  track?: MediaStreamTrack | null,
  bands: number = 20,
  loPass: number = 100,
  hiPass: number = 600
) {
  const [frequencyBands, setFrequencyBands] = useState<number[]>([]);
  const lastBandsRef = useRef<Float32Array[]>([]);

  useEffect(() => {
    if (!track) {
      return setFrequencyBands(new Array(bands).fill(0));
    }

    const ctx = new AudioContext({
      sampleRate: 48000,
      latencyHint: 'interactive',
    });

    const mediaStream = new MediaStream([track]);
    const source = ctx.createMediaStreamSource(mediaStream);
    const analyser = ctx.createAnalyser();

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;

    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const updateVolume = debounce(() => {
      analyser.getFloatFrequencyData(dataArray);
      let frequencies: Float32Array = new Float32Array(dataArray.length);
      for (let i = 0; i < dataArray.length; i++) {
        frequencies[i] = dataArray[i];
      }
      frequencies = frequencies.slice(loPass, hiPass);

      const normalizedFrequencies = frequencies.map(f => {
        const normalized = Math.max(0, (f + 90) / 80);
        return Math.pow(normalized, 1.2);
      });

      const chunkSize = Math.ceil(normalizedFrequencies.length / bands);
      const chunks: Float32Array[] = [];
      for (let i = 0; i < bands; i++) {
        chunks.push(
          normalizedFrequencies.slice(i * chunkSize, (i + 1) * chunkSize)
        );
      }

      // const hasSignificantChange = chunks.some((chunk, index) => {
      //   const lastChunk = lastBandsRef.current[index];
      //   if (!lastChunk || chunk.length !== lastChunk.length) return true;
      //   return chunk.some((value, i) => Math.abs(value - lastChunk[i]) > 0.005);
      // });

      // if (hasSignificantChange) {
        lastBandsRef.current = chunks;
        const summedChunks = chunks.map((bandFrequencies) => {
          const sum = bandFrequencies.reduce((a, b) => a + b, 0);
          if (sum <= 0) {
            return 0;
          }
          return Math.sqrt(sum / bandFrequencies.length);
        });
        setFrequencyBands(summedChunks);
    }, 8);

    const interval = setInterval(updateVolume, 16);

    return () => {
      source.disconnect();
      clearInterval(interval);
      ctx.close().catch(console.warn);
    };
  }, [track, loPass, hiPass, bands]);

  return frequencyBands;
}

export const useAutoScroll = (ref: React.RefObject<HTMLElement | null>) => {
  const callback: MutationCallback = (mutationList, observer) => {
    mutationList.forEach((mutation) => {
      switch (mutation.type) {
        case "childList":
          if (!ref.current) {
            return;
          }
          ref.current.scrollTop = ref.current.scrollHeight;
          break;
      }
    });
  };

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const observer = new MutationObserver(callback);
    observer.observe(ref.current, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [ref]);
};

// export const useSmallScreen = () => {
//   const screens = useBreakpoint();

//   const xs = useMemo(() => {
//     return !screens.sm && screens.xs
//   }, [screens])

//   const sm = useMemo(() => {
//     return !screens.md && screens.sm
//   }, [screens])

//   return {
//     xs,
//     sm,
//     isSmallScreen: xs || sm
//   }
// }

export const usePrevious = (value: unknown) => {
  const ref = useRef<unknown>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

const useGraphs = () => {
  const dispatch = useAppDispatch();
  const initialize = async () => {
    console.log('useGraphs: initialize function called');
    const result = await dispatch(initializeGraphData());
    console.log('useGraphs: initializeGraphData dispatch result:', result);
  };

  const update = async (graph: Graph, updates: Partial<Graph>) => {
    await null
  };

  return {
    initialize,
    updateGraph: update,
  };
};

export { useGraphs };
