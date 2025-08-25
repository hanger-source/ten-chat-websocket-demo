import React, { useEffect, useState } from "react"; // Import useState
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
// import { VoiceSelection } from "@/components/Settings/VoiceSelection"; // Removed: VoiceSelection is moved out of here
import { useAgentSettings, getAgentSettings } from "@/hooks/useAgentSettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { IAgentSettings } from "@/types"; // Import IAgentSettings
import { Switch } from "@/components/ui/switch";
import { ExternalLink } from "lucide-react"; // Import ExternalLink icon
import { PlayCircle, SlidersHorizontal } from "lucide-react"
import { Separator } from "../ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"

const agentSettingSchema = z.object({
  greeting: z.string().optional(),
  prompt: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(), // Add env to schema
  echo_cancellation: z.boolean().optional(),
  noise_suppression: z.boolean().optional(),
  auto_gain_control: z.boolean().optional(),
  cosy_voice_name: z.string().optional(), // Add cosy_voice_name to schema
});

type AgentSettingFormValues = z.infer<typeof agentSettingSchema>;

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues: AgentSettingFormValues;
  onSubmit: (values: AgentSettingFormValues) => void;
  docUrl?: string; // Add docUrl prop here
}

export default function SettingsDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  docUrl, // Destructure docUrl prop
}: SettingsDialogProps) {
  const { agentSettings, saveSettings } = useAgentSettings();
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false); // New state for advanced settings dialog
  const [advancedEnvJson, setAdvancedEnvJson] = useState(
    JSON.stringify(agentSettings.env, null, 2), // Initialize with existing env JSON
  );

  const form = useForm<AgentSettingFormValues>({
    resolver: zodResolver(agentSettingSchema),
    defaultValues: {
      greeting: agentSettings.greeting || "",
      prompt: agentSettings.prompt || "",
      echo_cancellation: agentSettings.echo_cancellation,
      noise_suppression: agentSettings.noise_suppression,
      auto_gain_control: agentSettings.auto_gain_control,
      cosy_voice_name: agentSettings.cosy_voice_name || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        greeting: agentSettings.greeting || "",
        prompt: agentSettings.prompt || "",
        echo_cancellation: agentSettings.echo_cancellation,
        noise_suppression: agentSettings.noise_suppression,
        auto_gain_control: agentSettings.auto_gain_control,
        cosy_voice_name: agentSettings.cosy_voice_name || "",
      });
      // Update advancedEnvJson when the main dialog opens or agentSettings change
      setAdvancedEnvJson(JSON.stringify(agentSettings.env, null, 2));
    }
  }, [open, agentSettings, form]);

  const handleSubmit = (data: AgentSettingFormValues) => {
    const newSettings: IAgentSettings = {
      greeting: data.greeting || "",
      prompt: data.prompt || "",
      env: { ...agentSettings.env, ...data.env }, // Merge existing env with new env data
      echo_cancellation: data.echo_cancellation ?? true, // Changed from echoCancellation
      noise_suppression: data.noise_suppression ?? true, // Changed from noiseSuppression
      auto_gain_control: data.auto_gain_control ?? true, // Changed from autoGainControl
      cosy_voice_name: data.cosy_voice_name || "", // Changed from cosyVoiceName
    };

    saveSettings(newSettings);
    onOpenChange(false);
    toast.success("设置已保存");
  };

  const handleAdvancedSettingsSave = () => {
    try {
      const parsedEnv = JSON.parse(advancedEnvJson);
      if (typeof parsedEnv !== "object" || parsedEnv === null) {
        throw new Error("无效的 JSON 格式，请提供一个对象。");
      }
      // Update only the env part of the settings
      const newSettings: IAgentSettings = { ...agentSettings, env: parsedEnv };
      saveSettings(newSettings);
      setShowAdvancedSettings(false);
      toast.success("高级设置已保存");
    } catch (e: any) {
      toast.error("保存失败: " + (e.message || "无效的 JSON"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>智能体设置</DialogTitle>
          <DialogDescription>
            管理您的 AI 智能体设置.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 py-4">
            <FormField
              control={form.control}
              name="greeting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>问候语</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>提示语</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入提示词，留空则使用默认提示词"
                      className="resize-none"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 py-4">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between text-sm font-medium cursor-pointer py-2">
                    <span>音频处理设置 (可能影响音质)</span>
                    <SlidersHorizontal className="h-4 w-4" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <FormField
                      control={form.control}
                      name="auto_gain_control"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm"> 
                          <div className="space-y-0.5">
                            <FormLabel>启用自动增益控制 (AGC)</FormLabel>
                            <FormDescription>
                              自动调整麦克风输入音量，确保音量保持一致。
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="echo_cancellation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>启用回声消除</FormLabel>
                            <FormDescription>
                              减少麦克风捕捉到的扬声器回声。
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="noise_suppression"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>启用噪音抑制</FormLabel>
                            <FormDescription>
                              减少背景噪音，例如风扇或键盘声。
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdvancedSettings(true)}
                >
                  高级设置
                </Button>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="submit">保存</Button>
              {docUrl && (
                <a href={docUrl} target="_blank" rel="noopener noreferrer" title="查看说明文档">
                  <span className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    <span>说明文档</span>
                  </span>
                </a>
              )}
            </DialogFooter>
          </form>
        </Form>

        <Dialog
          open={showAdvancedSettings}
          onOpenChange={setShowAdvancedSettings}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>高级设置 (JSON)</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto">
              <Textarea
                value={advancedEnvJson}
                onChange={(e) => setAdvancedEnvJson(e.target.value)}
                className="h-full min-h-[300px] font-mono text-xs"
                placeholder="请输入 JSON 格式的高级设置"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedSettings(false)}
              >
                取消
              </Button>
              <Button onClick={handleAdvancedSettingsSave}>保存高级设置</Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
