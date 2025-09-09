import React, { useState, useEffect } from 'react';
import { useWebSocketSession } from "@/hooks/useWebSocketSession";
import { useSelectedScene } from "@/hooks/useSelectedScene";
import { webSocketManager } from "@/manager/websocket/websocket";
import { toast } from 'sonner';
import { useAppSelector } from "@/common";
import { SessionConnectionState } from "@/types/websocket";

const HomeInvokeButton = () => {
  const { isConnected, startSession, stopSession, sessionState } = useWebSocketSession();
  const selectedGraphId = useAppSelector((state) => state.global.selectedGraphId);
  const graphList = useAppSelector((state) => state.global.graphList);

  // 将 loading 状态直接与 sessionState 的 CONNECTING 状态关联
  const isLoading = sessionState === SessionConnectionState.CONNECTING_SESSION;
  const [dots, setDots] = useState('');

  const { getSceneSetting } = useSelectedScene();

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isLoading) { // 只有在连接中时才显示点点点动画
      interval = setInterval(() => {
        setDots(prev => (prev.length < 3 ? prev + '.' : ''));
      }, 500);
    } else {
      setDots('');
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]); // 依赖于 isLoading

  const handleClick = async () => {
    if (isLoading) return; // 连接中时，禁止重复点击

    if (isConnected) {
      // 已经连接，则断开连接
      try {
        await stopSession();
      } catch (error) {
        console.error("Error stopping session:", error);
        toast.error("断开连接失败");
      }
    } else {
      // 未连接，则开始会话
      const selectedGraph = graphList.find(
        (graph) => graph.uuid === selectedGraphId,
      );
      if (!selectedGraph) {
        toast.error("请先选择一个图");
        return;
      }
      const latestSettings = getSceneSetting();
      if (!latestSettings) {
        toast.error("获取场景设置失败，请检查。");
        return;
      }
      try {
        await webSocketManager.connect(); // 确保 WebSocket 已连接
        await startSession(latestSettings);
      } catch (error) {
        console.error("Error starting session:", error);
        toast.error("AI 连接或启动失败");
      }
    }
  };

  return (
    <div className="mt-8 flex flex-col items-center">
      <button
        className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-red-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow 
          ${isConnected || isLoading ? 'animate-glow-pulse' : 'hover:animate-glow-pulse'}`}
        onClick={handleClick}
      >
        {/* SVG Icon */}
        <svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path opacity="0.4" fillRule="evenodd" clipRule="evenodd" d="M13.0418 1.56292C13.1724 1.05839 13.8882 1.05669 14.0212 1.56059L14.1533 2.06099C14.3392 2.76566 14.8896 3.316 15.5943 3.50196L16.0946 3.63402C16.5985 3.767 16.5968 4.48284 16.0923 4.61342L15.6006 4.74069C14.8917 4.92416 14.3372 5.4761 14.1503 6.18409L14.0212 6.67326C13.8882 7.17716 13.1724 7.17546 13.0418 6.67093L12.9175 6.19049C12.7331 5.47828 12.177 4.92211 11.4648 4.73777L10.9843 4.61342C10.4798 4.48284 10.4781 3.767 10.982 3.63402L11.4711 3.50493C12.1791 3.31808 12.7311 2.76352 12.9146 2.05464L13.0418 1.56292Z" fill="white"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M5.33601 6.83179C5.56453 5.94887 6.81725 5.94589 7.04996 6.82772L7.28106 7.70342C7.6065 8.93658 8.56959 9.89968 9.80276 10.2251L10.6785 10.4562C11.5603 10.6889 11.5573 11.9416 10.6744 12.1702L9.81387 12.3929C8.57334 12.714 7.60285 13.6799 7.27587 14.9188L7.04996 15.7749C6.81725 16.6567 5.56453 16.6537 5.33601 15.7708L5.1184 14.93C4.79581 13.6837 3.82251 12.7104 2.57615 12.3878L1.73535 12.1702C0.852431 11.9416 0.849454 10.6889 1.73128 10.4562L2.58733 10.2303C3.82632 9.90333 4.79221 8.93284 5.11329 7.69231L5.33601 6.83179Z" fill="white"/>
          <path d="M11.7303 30.5828C13.4822 30.5828 15.7439 29.4157 17.3328 28.4364C19.4607 27.1252 21.753 25.3112 23.7877 23.3288L23.795 23.3215L24.441 22.6753C26.4235 20.6408 28.2373 18.3483 29.5487 16.2205C30.5279 14.6315 31.6951 12.3698 31.6951 10.6179C31.6951 8.7432 30.3545 6.75336 29.7781 5.98492C29.3283 5.38525 27.7571 3.42847 26.422 3.42847C25.8737 3.42847 25.2834 3.78728 24.5074 4.59199C23.8211 5.30352 23.1626 6.18794 22.7311 6.80464C22.1514 7.63258 21.6154 8.49942 21.2215 9.24569C20.5838 10.4539 20.51 10.972 20.51 11.2566C20.51 11.831 20.8101 12.3293 21.4017 12.7374C21.7912 13.0061 22.2588 13.2084 22.711 13.4041C23.016 13.536 23.503 13.7465 23.6888 13.8946C23.6239 14.1691 23.3407 14.832 22.5752 15.9559C21.8618 17.0032 20.9394 18.1381 20.1061 18.9939C19.2504 19.8271 18.1156 20.7496 17.0681 21.463C15.9445 22.2282 15.2816 22.5116 15.0069 22.5765C14.859 22.3907 14.6483 21.9038 14.5163 21.5988C14.3208 21.1466 14.1185 20.6789 13.8497 20.2894C13.4416 19.6978 12.9434 19.3979 12.3689 19.3979C12.0843 19.3979 11.5662 19.4716 10.3578 20.1092C9.61174 20.5031 8.74477 21.0391 7.91693 21.6187C7.30026 22.0504 6.41583 22.709 5.70415 23.3951C4.8996 24.171 4.54078 24.7614 4.54078 25.3097C4.54078 26.6447 6.49741 28.216 7.09711 28.6658C7.86567 29.2422 9.85549 30.5828 11.7303 30.5828Z" fill="white"/>
        </svg>
      </button>
      <span className="mt-2 text-lg font-semibold text-gray-800">
        {isConnected ? '停止通话' : isLoading ? `连接中${dots}` : '开始通话'}
      </span>
    </div>
  );
};

export default HomeInvokeButton;
