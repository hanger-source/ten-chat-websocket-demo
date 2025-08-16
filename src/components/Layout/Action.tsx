"use client";

import * as React from "react";

import { LoadingButton } from "@/components/Button/LoadingButton";
import { setAgentConnected, setMobileActiveTab } from "@/store/reducers/global";
import {
  useAppDispatch,
  useAppSelector,
  apiPing,
  apiStartService,
  apiStopService,
  MOBILE_ACTIVE_TAB_MAP,
  EMobileActiveTab,
  isEditModeOn,
  useGraphs,
} from "@/common";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { RemotePropertyCfgSheet } from "@/components/Chat/ChatCfgPropertySelect";
import { RemoteGraphSelect } from "@/components/Chat/ChatCfgGraphSelect";
import { RemoteModuleCfgSheet } from "@/components/Chat/ChatCfgModuleSelect";
import { TrulienceCfgSheet } from "../Chat/ChatCfgTrulienceSetting";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import SettingsDialog from "@/components/Settings/SettingsDialog";
import { useAgentSettings, getAgentSettings } from "@/hooks/useAgentSettings";
import { z } from "zod";
import { useWebSocketSession } from "@/hooks/useWebSocketSession";
import { SessionConnectionState } from "@/types/websocket";
import { webSocketManager } from "@/manager/websocket/websocket"; // Corrected import path
import { CommandType } from "@/types/websocket";

// 定义 agentSettingSchema 的类型
const agentSettingSchema = z.object({
  greeting: z.string().optional(),
  prompt: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  echoCancellation: z.boolean().optional(),
  noiseSuppression: z.boolean().optional(),
  autoGainControl: z.boolean().optional(),
});

type AgentSettingFormValues = z.infer<typeof agentSettingSchema>;

// 导入类型
interface IPingResponse {
  message: string;
}

export default function Action(props: { className?: string }) {
  const { className } = props;
  const dispatch = useAppDispatch();
  const agentConnected = useAppSelector((state) => state.global.agentConnected);
  const channel = useAppSelector((state) => state.global.options.channel);
  const userId = useAppSelector((state) => state.global.options.userId);
  const language = useAppSelector((state) => state.global.language);
  const voiceType = useAppSelector((state) => state.global.voiceType);
  const selectedGraphId = useAppSelector(
    (state) => state.global.selectedGraphId,
  );
  const graphList = useAppSelector((state) => state.global.graphList);
  const mobileActiveTab = useAppSelector(
    (state) => state.global.mobileActiveTab,
  );
  const [loading, setLoading] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const { agentSettings, saveSettings } = useAgentSettings();
  const { isConnected, sessionState, defaultLocation, startSession, stopSession } = useWebSocketSession();

  const selectedGraph = React.useMemo(() => {
      return graphList.find((graph) => graph.uuid === selectedGraphId);
  }, [graphList, selectedGraphId]);

  const docUrl = selectedGraph?.docUrl;

  console.log("Action.tsx: selectedGraph:", selectedGraph); // 排查日志
  console.log("Action.tsx: docUrl:", docUrl); // 排查日志

  React.useEffect(() => {
    if (channel) {
      // No longer need to check agent connected here, useWebSocketSession handles it
    }
  }, [channel]);

  // Removed checkAgentConnected function
  const onClickConnect = React.useCallback(async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    if (agentConnected) {
      try {
        // Disconnect logic
        // Instead of direct sendCommand, call stopSession from useWebSocketSession
        await stopSession(); // Call stopSession
        // setAgentConnected(false) and toast will be handled by stopSession's CMD_RESULT handler
      } catch (error) {
        console.error("Error during connection or session start/stop:", error);
        toast.error("断开连接失败");
      }
    } else {
      const selectedGraph = graphList.find(
        (graph) => graph.uuid === selectedGraphId,
      );
      if (!selectedGraph) {
        toast.error("Please select a graph first");
        setLoading(false);
        return;
      }

      const latestSettings = getAgentSettings(); // Directly get latest settings
      try {
        await webSocketManager.connect(); // Ensure WebSocket is connected
        await startSession(latestSettings); // Pass latest settings

      } catch (error) {
        console.error("Error during connection or session start:", error);
        toast.error("AI 连接或启动失败");
      }
    }
    setLoading(false);
  }, [loading, agentConnected, graphList, selectedGraphId, isConnected, sessionState, startSession, stopSession, webSocketManager]); // Removed agentSettings from dependencies

  // Removed startPing and stopPing functions

  const onChangeMobileActiveTab = (tab: string) => {
    dispatch(setMobileActiveTab(tab as EMobileActiveTab));
  };

  return (
    <>
      {/* Action Bar */}
      <div
        className={cn(
          "mx-2 mt-2 flex items-center justify-between rounded-t-lg bg-white shadow-sm border border-gray-200 p-2 md:m-2 md:rounded-lg",
          className,
        )}
      >
        {/* -- Description Part */}
        <div className="hidden md:block">
          <span className="ml-2 text-xs text-gray-600 whitespace-nowrap">
            实时对话式 AI 智能体
          </span>
        </div>

        <div className="flex w-full flex-col md:flex-row md:items-center justify-between md:justify-end">
          {/* -- Tabs Section */}
          <Tabs
            defaultValue={mobileActiveTab}
            className="md:hidden w-full md:flex-row"
            onValueChange={onChangeMobileActiveTab}
          >
            <TabsList className="flex justify-center md:justify-start">
              {Object.values(EMobileActiveTab).map((tab) => (
                <TabsTrigger key={tab} value={tab} className="w-24 text-sm">
                  {MOBILE_ACTIVE_TAB_MAP[tab]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* -- Graph Select Part */}
          <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-2 mt-2 md:mt-0">
            <RemoteGraphSelect />
            {isEditModeOn && (
              <>
                <TrulienceCfgSheet />
                <RemoteModuleCfgSheet />
                <RemotePropertyCfgSheet />
              </>
            )}

            {/* -- Action Button */}
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">设置</span>
              </Button>
              <LoadingButton
                onClick={onClickConnect}
                variant={!agentConnected ? "default" : "destructive"}
                size="sm"
                disabled={!selectedGraphId && !agentConnected}
                className="w-fit min-w-24"
                loading={loading}
                svgProps={{ className: "h-4 w-4 text-muted-foreground" }}
              >
                {loading ? "连接中" : !agentConnected ? "连接" : "断开"}
              </LoadingButton>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        defaultValues={agentSettings}
        docUrl={docUrl} // Pass docUrl here
        onSubmit={(values: AgentSettingFormValues) => {
          saveSettings({
            greeting: values.greeting || "",
            prompt: values.prompt || "",
            env: values.env || {}, // Directly use values.env
            echoCancellation: values.echoCancellation ?? true,
            noiseSuppression: values.noiseSuppression ?? true,
            autoGainControl: values.autoGainControl ?? true,
          });
          toast.success("设置已保存");
        }}
      />
    </>
  );
}
