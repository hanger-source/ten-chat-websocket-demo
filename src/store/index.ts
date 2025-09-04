"use client";

import globalReducer from "./reducers/global";
import localMediaStreamReducer from "./reducers/localMediaStream";
import audioPlayerReducer from "./reducers/audioPlayer"; // <-- 导入 audioPlayerReducer
import { configureStore } from "@reduxjs/toolkit";

export * from "./provider";

export const makeStore = () => {
  return configureStore({
    reducer: {
      global: globalReducer,
      localMediaStream: localMediaStreamReducer, // 注册新的 mediaStream slice
      audioPlayer: audioPlayerReducer, // <-- 注册新的 audioPlayer slice
    },
    devTools: import.meta.env.DEV,
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
