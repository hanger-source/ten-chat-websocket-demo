import React, { useEffect } from "react";
import { StoreProvider } from "@/store";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NewHome from "@/components/NewLayout/layouts/Home";
import { useDispatch } from "react-redux";
import useMediaStreamManager from '@/hooks/media/useMediaStreamManager'; // 导入新的 useMediaStreamManager Hook
import { requestCamera } from "@/store/reducers/localMediaStream"; // 导入新的 requestCamera action

// 新增的 AppInitializer 组件，用于处理媒体流初始化
function AppInitializer() {
  const dispatch = useDispatch();
  useMediaStreamManager(); // 在应用的根组件中调用 useMediaStreamManager
  useEffect(() => {
    // 初始启动时请求默认摄像头
    dispatch(requestCamera({ camDeviceId: null }));
  }, [dispatch]);
  return null;
}

function App() {
  return (
    <StoreProvider>
      <AppInitializer /> {/* 在 StoreProvider 内部渲染 AppInitializer */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NewHome />} />
          <Route path="/live" element={<NewHome />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors closeButton theme="light" />
    </StoreProvider>
  );
}

export default App;