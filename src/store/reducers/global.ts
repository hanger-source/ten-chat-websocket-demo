import {
  IOptions,
  IChatItem,
  Language,
  VoiceType,
} from "@/types";
import { WebSocketConnectionState } from "@/types/websocket"; // Corrected import path for WebSocketConnectionState
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  EMobileActiveTab,
  DEFAULT_OPTIONS,
  COLOR_LIST,
  isEditModeOn,
} from "@/common/constant";
import {
  apiReloadPackage,
  apiFetchGraphs,
  apiLoadApp,
  GraphInfo, // 添加 GraphInfo 导入
} from "@/common/request";
import {
  setOptionsToLocal,
} from "@/common/storage";
import { IModeOption } from "@/types/modeOptions"; // 添加 IModeOption 导入

export interface InitialState {
  options: IOptions;
  roomConnected: boolean;
  agentConnected: boolean;
  websocketConnectionState: WebSocketConnectionState;
  themeColor: string;
  language: Language;
  voiceType: VoiceType;
  chatItems: IChatItem[];
  selectedGraphId: string;
  graphList: GraphInfo[];
  graphMap: Record<string, GraphInfo>;
  mobileActiveTab: EMobileActiveTab;
  activeGraphId: string;
  activeAppUri: string; // New: To store the active app_uri from backend
  modeOptions: IModeOption[]; // 添加 modeOptions 字段
}

const getInitialState = (): InitialState => {

  return {
    options: DEFAULT_OPTIONS,
    themeColor: COLOR_LIST[0].active,
    roomConnected: false,
    agentConnected: false,
    websocketConnectionState: WebSocketConnectionState.CLOSED, // ocket连接状态, changed from "closed"
    language: "en-US",
    voiceType: "male",
    chatItems: [],
    selectedGraphId: "",
    graphList: [],
    graphMap: {},
    mobileActiveTab: EMobileActiveTab.AGENT,
    activeGraphId: "", // Initialize activeGraphId
    activeAppUri: "", // Initialize activeAppUri
    modeOptions: [], // 初始化 modeOptions 为空数组
  };
};

export const globalSlice = createSlice({
  name: "global",
  initialState: getInitialState(),
  reducers: {
    setOptions: (state, action: PayloadAction<Partial<IOptions>>) => {
      state.options = { ...state.options, ...action.payload };
      setOptionsToLocal(state.options);
    },
    setThemeColor: (state, action: PayloadAction<string>) => {
      state.themeColor = action.payload;
      document.documentElement.style.setProperty(
        "--theme-color",
        action.payload,
      );
    },
    setRoomConnected: (state, action: PayloadAction<boolean>) => {
      state.roomConnected = action.payload;
    },
    addChatItem: (state, action: PayloadAction<IChatItem>) => {
      const { userId, text, isFinal, type, time } = action.payload;
      const LastFinalIndex = state.chatItems.findLastIndex((el) => {
        return el.userId == userId && el.isFinal;
      });
      const LastNonFinalIndex = state.chatItems.findLastIndex((el) => {
        return el.userId == userId && !el.isFinal;
      });
      const LastFinalItem = state.chatItems[LastFinalIndex];
      const LastNonFinalItem = state.chatItems[LastNonFinalIndex];
      if (LastFinalItem) {
        // has last final Item
        if (time <= LastFinalItem.time) {
          // discard
          console.log(
            "[test] addChatItem, time < last final item, discard!:",
            text,
            isFinal,
            type,
          );
          return;
        } else {
          if (LastNonFinalItem) {
            console.log(
              "[test] addChatItem, update last item(none final):",
              text,
              isFinal,
              type,
            );
            state.chatItems[LastNonFinalIndex] = action.payload;
          } else {
            console.log(
              "[test] addChatItem, add new item:",
              text,
              isFinal,
              type,
            );
            state.chatItems.push(action.payload);
          }
        }
      } else {
        // no last final Item
        if (LastNonFinalItem) {
          console.log(
            "[test] addChatItem, update last item(none final):",
            text,
            isFinal,
            type,
          );
          state.chatItems[LastNonFinalIndex] = action.payload;
        } else {
          console.log("[test] addChatItem, add new item:", text, isFinal, type);
          state.chatItems.push(action.payload);
        }
      }
      state.chatItems.sort((a, b) => a.time - b.time);
    },
    setAgentConnected: (state, action: PayloadAction<boolean>) => {
      state.agentConnected = action.payload;
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
    setSelectedGraphId: (state, action: PayloadAction<string>) => {
      state.selectedGraphId = action.payload;
    },
    setGraphList: (state, action: PayloadAction<GraphInfo[]>) => {
      state.graphList = action.payload;
      console.log('Redux: graphList updated', action.payload);

      // Also populate graphMap with all fetched graphs
      action.payload.forEach(graph => {
        state.graphMap[graph.uuid] = graph;
      });
      console.log('Redux: graphMap populated with all graphs from list', state.graphMap);

      // If selectedGraphId is empty OR existing selectedGraphId is not in the new graphList, set to the first graph's UUID
      const currentSelectedGraphExists = action.payload.some(graph => graph.uuid === state.selectedGraphId);
      if (!state.selectedGraphId || !currentSelectedGraphExists) {
        if (action.payload.length > 0) {
          state.selectedGraphId = action.payload[0].uuid;
          console.log('Redux: selectedGraphId auto-set/reset to first graph', state.selectedGraphId);
        } else {
          state.selectedGraphId = ""; // No graphs available, clear selected ID
          console.log('Redux: No graphs available, selectedGraphId cleared.');
        }
      }
    },
    setVoiceType: (state, action: PayloadAction<VoiceType>) => {
      state.voiceType = action.payload;
    },
    setMobileActiveTab: (state, action: PayloadAction<EMobileActiveTab>) => {
      state.mobileActiveTab = action.payload;
    },
    // Socket连接状态的reducer
    setWebsocketConnectionState: (
      state,
      action: PayloadAction<WebSocketConnectionState>,
    ) => {
      state.websocketConnectionState = action.payload;
      if (action.payload === WebSocketConnectionState.CLOSED) {
        state.agentConnected = false; // Reset agentConnected if WebSocket closes
      }
    },
    reset: (state) => {
      Object.assign(state, getInitialState());
      document.documentElement.style.setProperty(
        "--theme-color",
        COLOR_LIST[0].active,
      );
    },
    setActiveGraphId: (state, action: PayloadAction<string>) => {
      state.activeGraphId = action.payload;
      console.log('Redux: activeGraphId set to', action.payload);
    },
    setActiveAppUri: (state, action: PayloadAction<string>) => {
      state.activeAppUri = action.payload;
      console.log('Redux: activeAppUri set to', action.payload);
    },
    setModeOptions: (state, action: PayloadAction<IModeOption[]>) => {
      state.modeOptions = action.payload;
      console.log('Redux: modeOptions updated', action.payload);
    },
  },
});

// Initialize graph data
const initializeGraphData = createAsyncThunk(
  "global/initializeGraphData",
  async (_, { dispatch }) => {
    if (isEditModeOn) {
      // only for development, below requests depend on dev-server
      await apiReloadPackage();
      await apiLoadApp();
      const graphInfos = await apiFetchGraphs(); // 获取 graphInfos
      console.log("initializeGraphData: fetchedGraphInfos (dev mode):", graphInfos); // 排查日志
      
      const modeOptions: IModeOption[] = graphInfos.map(graphInfo => ({
        value: graphInfo.name,
        label: graphInfo.name,
        name: graphInfo.name, // 确保添加 name 属性
        description: "", // Or extract from graphInfo.metadata if available
        metadata: graphInfo.metadata || {},
      }));
      dispatch(setModeOptions(modeOptions));

      const graphs: GraphInfo[] = graphInfos.map(graphInfo => ({
        uuid: graphInfo.uuid,
        name: graphInfo.name,
        autoStart: graphInfo.autoStart,
        docUrl: graphInfo.docUrl,
      }));
      dispatch(setGraphList(graphs));

    } else {
      const graphInfos = await apiFetchGraphs(); // 获取 graphInfos
      console.log("initializeGraphData: fetchedGraphInfos (prod mode):", graphInfos); // 排查日志
      
      const modeOptions: IModeOption[] = graphInfos.map(graphInfo => ({
        value: graphInfo.name,
        label: graphInfo.name,
        name: graphInfo.name, // 确保添加 name 属性
        description: "", // Or extract from graphInfo.metadata if available
        metadata: graphInfo.metadata || {},
      }));
      dispatch(setModeOptions(modeOptions));

      const graphs: GraphInfo[] = graphInfos.map(graphInfo => ({
        uuid: graphInfo.uuid,
        name: graphInfo.name,
        autoStart: graphInfo.autoStart,
        docUrl: graphInfo.docUrl,
      }));
      dispatch(setGraphList(graphs));
    }
  },
);

export const {
  reset,
  setOptions,
  setAgentConnected,
  setVoiceType,
  addChatItem,
  setThemeColor,
  setLanguage,
  setSelectedGraphId,
  setGraphList,
  setMobileActiveTab,
  setWebsocketConnectionState, // ducer
  setActiveGraphId,
  setActiveAppUri,
  setModeOptions,
} = globalSlice.actions;

export { initializeGraphData };

export default globalSlice.reducer;
