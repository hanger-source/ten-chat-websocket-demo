import React, { useEffect } from "react";
import { StoreProvider } from "@/store";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NewHome from "@/components/NewLayout/layouts/Home";
import { useDispatch } from "react-redux";
import { requestStream, StreamDetails } from "@/store/reducers/mediaStream";
import { VideoSourceType } from "./common/constant";

// 新增的 AppInitializer 组件，用于处理媒体流初始化
function AppInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const defaultDetails: StreamDetails = {
      videoSourceType: VideoSourceType.CAMERA,
      camDeviceId: undefined,
      micDeviceId: undefined,
    };
    console.log('[DEBUG] AppInitializer: Initializing media stream request with default camera (COLD START).');
    dispatch(requestStream(defaultDetails));
  }, [dispatch]);

  return null; // 这个组件不渲染任何UI
}

function App() {
  return (
    <StoreProvider>
      <AppInitializer /> {/* 在 StoreProvider 内部渲染 AppInitializer */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<NewHome />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors closeButton theme="light" />
    </StoreProvider>
  );
}

export default App;