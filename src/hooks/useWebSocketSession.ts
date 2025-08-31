import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { webSocketManager } from "@/manager/websocket/websocket";
import { WebSocketConnectionState, SessionConnectionState } from "@/types/websocket";
import { MESSAGE_CONSTANTS } from '@/common/constant';
import { useAppDispatch, useAppSelector } from "@/common/hooks";
import { setWebsocketConnectionState, setAgentConnected, setSelectedGraphId, setActiveGraphId, setActiveAppUri, setSessionConnectionState } from "@/store/reducers/global";
import { toast } from 'sonner';
import { RootState } from "@/store";
import {IAgentSettings, ISceneSetting} from "@/types";
import {CommandResult, CommandType, Location, Message, MessageType} from "@/types/message";
import { audioManager } from '@/manager/audio/AudioManager';

const FRONTEND_APP_URI = "mock_front://test_app";

interface UseWebSocketSessionResult {
  isConnected: boolean;
  sessionState: SessionConnectionState;
  startSession: (settings: IAgentSettings | ISceneSetting) => Promise<void>;
  stopSession: () => Promise<void>;
  sendMessage: (name: string, messageContent: string) => void;
  sendCommand: (commandType: CommandType, srcLoc?: Location, destLocs?: Location[], properties?: Record<string, any>) => void;
  defaultLocation: Location;
  activeAppUri: string;
  activeGraphId: string;
}

export const useWebSocketSession = (): UseWebSocketSessionResult => {
  const dispatch = useAppDispatch();
  const isConnected = useAppSelector((state: RootState) => state.global.agentConnected);
  const websocketConnectionState = useAppSelector((state: RootState) => state.global.websocketConnectionState);
  const sessionState = useAppSelector((state: RootState) => state.global.sessionConnectionState);
  const selectedGraphId = useAppSelector((state: RootState) => state.global.selectedGraphId);
  const graphMap = useAppSelector((state: RootState) => state.global.graphMap);
  const activeGraphId = useAppSelector((state: RootState) => state.global.activeGraphId);
  const activeAppUri = useAppSelector((state: RootState) => state.global.activeAppUri);
  const selectedGraph = selectedGraphId ? graphMap[selectedGraphId] : null;

  const options = useAppSelector((state: RootState) => state.global.options);

  const defaultLocation: Location = useMemo(() => ({
    app_uri: FRONTEND_APP_URI,
    graph_id: activeGraphId || selectedGraphId || "",
    extension_name: MESSAGE_CONSTANTS.SYS_EXTENSION_NAME,
  }), [activeGraphId, selectedGraphId]);

  const handleConnectionStateChange = useCallback(async (newState: WebSocketConnectionState) => {
    dispatch(setWebsocketConnectionState(newState));
    if (newState === WebSocketConnectionState.OPEN) {
      try {
        await audioManager.init();
        console.log("AudioManager initialized due to WebSocket OPEN.");
      } catch (error) {
        console.error("Failed to initialize AudioManager on WebSocket OPEN:", error);
      }
    } else if (newState === WebSocketConnectionState.CLOSED) {
      dispatch(setAgentConnected(false));
      dispatch(setActiveGraphId(""));
      dispatch(setActiveAppUri(""));
      dispatch(setSessionConnectionState(SessionConnectionState.IDLE));
      // 只有在 AudioManager 已经初始化时才关闭，防止竞态条件
      if (audioManager.getIsInitialized()) { 
        audioManager.close();
        console.log("AudioManager closed due to WebSocket CLOSED.");
      }
    }
  }, [dispatch]);

  const handleCommandResult = useCallback((message: Message) => {
    if (message.type !== MessageType.CMD_RESULT) {
      console.warn("useWebSocketSession: Received non-CMD_RESULT message, ignoring.", message);
      return;
    }
    const cmdResult = message as CommandResult;

    if (cmdResult.original_cmd_name === CommandType.START_GRAPH) {
      if (cmdResult.success) {
        dispatch(setSessionConnectionState(SessionConnectionState.SESSION_ACTIVE));
        dispatch(setAgentConnected(true));
        if (cmdResult.properties && cmdResult.properties.graph_id) {
          dispatch(setActiveGraphId(cmdResult.properties.graph_id));
        }
        if (cmdResult.properties && cmdResult.properties.app_uri) {
          dispatch(setActiveAppUri(cmdResult.properties.app_uri));
        }
      } else {
        dispatch(setSessionConnectionState(SessionConnectionState.IDLE));
        dispatch(setAgentConnected(false));
        toast.error(`AI 启动失败: ${cmdResult.errorMessage || cmdResult.error}`);
      }
    } else if (cmdResult.original_cmd_name === CommandType.STOP_GRAPH) {
      if (cmdResult.success) {
        dispatch(setSessionConnectionState(SessionConnectionState.IDLE));
        dispatch(setAgentConnected(false));
        dispatch(setActiveGraphId(""));
        dispatch(setActiveAppUri(""));
        toast.info("AI 已停止。");
      } else {
        toast.error(`AI 停止失败: ${cmdResult.errorMessage || cmdResult.error}`);
      }
    }
  }, [dispatch]);

  useEffect(() => {
    webSocketManager.onConnectionStateChange(handleConnectionStateChange);
    webSocketManager.onMessage(MessageType.CMD_RESULT, handleCommandResult);

    return () => {
      webSocketManager.offConnectionStateChange(handleConnectionStateChange);
      webSocketManager.offMessage(MessageType.CMD_RESULT, handleCommandResult);
    };
  }, [handleConnectionStateChange, handleCommandResult, dispatch]);

  const startSession = useCallback(async (settings: IAgentSettings | ISceneSetting) => {
    if (!selectedGraph) {
      toast.error("请先选择一个图");
      return;
    }

    const currentWebsocketConnectionState = webSocketManager.getConnectionState();
    if (currentWebsocketConnectionState !== WebSocketConnectionState.OPEN || sessionState !== SessionConnectionState.IDLE) {
      toast.error("无法启动 AI：WebSocket 未连接或 AI 已激活");
      return;
    }
    webSocketManager.sendCommand(CommandType.START_GRAPH, {
      ...defaultLocation,
      graph_id: selectedGraph.uuid,
    }, [], {
      predefined_graph_name: selectedGraph.name,
      ...settings,
      ...options,
    });
    dispatch(setSessionConnectionState(SessionConnectionState.CONNECTING_SESSION));

  }, [selectedGraph, defaultLocation, dispatch, options, sessionState]);

  const stopSession = useCallback(async () => {
    if (sessionState === SessionConnectionState.SESSION_ACTIVE || sessionState === SessionConnectionState.CONNECTING_SESSION) {
      webSocketManager.setManualDisconnectFlag(true);
      
      const destLocsForStop: Location[] = activeAppUri ? [{
        app_uri: activeAppUri,
        graph_id: activeGraphId,
      }] : [];

      webSocketManager.sendCommand(CommandType.STOP_GRAPH, defaultLocation, destLocsForStop, { location_uri: activeAppUri });
    } else {
      console.warn("useWebSocketSession: Cannot stop AI, not currently connected.");
    }
  }, [defaultLocation, dispatch, activeAppUri, activeGraphId, sessionState]);

  const sendMessage = useCallback((name: string, messageContent: string) => {
    if (websocketConnectionState === WebSocketConnectionState.OPEN) {
      const message: Message = {
        id: Date.now().toString() + Math.random().toString().substring(2, 8),
        type: MessageType.DATA,
        src_loc: defaultLocation,
        dest_locs: activeAppUri ? [{
          app_uri: activeAppUri,
          graph_id: activeGraphId,
          extension_name: MESSAGE_CONSTANTS.SYS_EXTENSION_NAME,
        }] : [],
        name: name,
        properties: { text: messageContent, is_final: true },
        timestamp: Date.now(),
      };
      webSocketManager.sendMessage(message);
    } else {
      console.warn("Cannot send message, WebSocket is not open.");
      toast.error("WebSocket 未连接，无法发送消息。");
    }
  }, [websocketConnectionState, activeAppUri, activeGraphId, defaultLocation]);

  const sendCommand = useCallback((commandType: CommandType, srcLocOverride?: Location, destLocsOverride?: Location[], properties?: Record<string, any>) => {
    if (websocketConnectionState === WebSocketConnectionState.OPEN) {
      const finalSrcLoc = srcLocOverride || defaultLocation;

      let finalDestLocs: Location[] = destLocsOverride || [];
      if (!destLocsOverride && activeAppUri) {
        finalDestLocs = [{
          app_uri: activeAppUri,
          graph_id: activeGraphId,
          extension_name: MESSAGE_CONSTANTS.SYS_EXTENSION_NAME,
        }];
      }

      webSocketManager.sendCommand(commandType, finalSrcLoc, finalDestLocs, { ...properties, graph_id: activeGraphId });
    } else {
      console.warn("Cannot send command, WebSocket is not open.");
      toast.error("WebSocket 未连接，无法发送命令。");
    }
  }, [websocketConnectionState, activeAppUri, activeGraphId, defaultLocation]);

  return {
    isConnected: isConnected,
    sessionState,
    startSession,
    stopSession,
    sendMessage,
    sendCommand,
    defaultLocation,
    activeAppUri,
    activeGraphId,
  };
};
