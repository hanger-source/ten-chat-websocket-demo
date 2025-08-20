"use client";

import * as React from "react";
import { CamIconByStatus } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { VIDEO_SOURCE_OPTIONS, VideoSourceType, MESSAGE_CONSTANTS } from "@/common/constant";
import { MonitorIcon, MonitorXIcon } from "lucide-react";
import { LocalVideoStreamPlayer } from "./LocalVideoStreamPlayer";
import { useVideoFrameSender } from "@/hooks/useVideoFrameSender";
import { Location } from "@/types/websocket";


export const ScreenIconByStatus = (
  props: React.SVGProps<SVGSVGElement> & { active?: boolean; color?: string },
) => {
  const { active, color, ...rest } = props
  if (active) {
    return <MonitorIcon color={color || "#3D53F5"} {...rest} />
  }
  return <MonitorXIcon color={color || "#667085"} {...rest} />
}

export function VideoDeviceWrapper(props: {
  children: React.ReactNode
  title: string
  Icon: (
    props: React.SVGProps<SVGSVGElement> & { active?: boolean },
  ) => React.ReactNode
  onIconClick: () => void
  videoSourceType: VideoSourceType
  onVideoSourceChange: (value: VideoSourceType) => void
  isActive: boolean
  select?: React.ReactNode
}) {
  const { Icon, onIconClick, isActive, select, children, onVideoSourceChange, videoSourceType } = props

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">{props.title}</div>
          <div className="w-[120px]"> {/* Changed from w-[250px] to w-[120px] */}
            <Select value={videoSourceType} onValueChange={onVideoSourceChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_SOURCE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="border-secondary bg-transparent"
            onClick={onIconClick}
          >
            <Icon className="h-5 w-5" active={isActive} />
          </Button>
          {select}
        </div>
      </div>
      {children}
    </div>
  )
}

export default function VideoBlock(props: {
  videoSourceType: VideoSourceType,
  onVideoSourceChange: (value: VideoSourceType) => void,
}) {
  const { videoSourceType, onVideoSourceChange } = props;
  const [videoMute, setVideoMute] = React.useState(false);
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = React.useState<MediaStream | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | undefined>(undefined);

  const srcLoc: Location = {
    app_uri: "client_app",
    graph_id: "client_graph",
    extension_name: MESSAGE_CONSTANTS.SYS_EXTENSION_NAME,
  };
  const destLocs: Location[] = [{
    app_uri: "server_app",
    graph_id: "server_graph",
    extension_name: "video_extension",
  }];

  const { canvasRef } = useVideoFrameSender({
    videoStream: videoMute ? null : (videoSourceType === VideoSourceType.CAMERA ? cameraStream : screenStream),
    srcLoc,
    destLocs,
  });

  // 获取摄像头和屏幕共享流
  React.useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedDeviceId ? { deviceId: selectedDeviceId } : true,
        });
        setCameraStream(stream);
        // console.log("[VIDEO_LOG] Camera stream obtained:", stream);
      } catch (error) {
        console.error("[VIDEO_LOG] Error accessing camera:", error);
        setCameraStream(null);
      }
    };

    const getScreenStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        // console.log("[VIDEO_LOG] Screen stream obtained:", stream);
      } catch (error) {
        console.error("[VIDEO_LOG] Error accessing screen:", error);
        setScreenStream(null);
      }
    };

    if (videoSourceType === VideoSourceType.CAMERA) {
      // console.log("[VIDEO_LOG] Attempting to get camera stream...");
      getCameraStream();
    } else if (videoSourceType === VideoSourceType.SCREEN) {
      // console.log("[VIDEO_LOG] Attempting to get screen stream...");
      getScreenStream();
    }

    return () => {
      // Clean up streams when component unmounts or videoSourceType changes
      if (cameraStream) {
        // console.log("[VIDEO_LOG] Stopping camera stream tracks.", cameraStream);
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      if (screenStream) {
        // console.log("[VIDEO_LOG] Stopping screen stream tracks.", screenStream);
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
    };
  }, [videoSourceType, selectedDeviceId]);

  // 静音/取消静音逻辑
  React.useEffect(() => {
    if (videoSourceType === VideoSourceType.CAMERA && cameraStream) {
      console.log(`[VIDEO_LOG] Camera mute status changed to: ${videoMute}`);
      cameraStream.getVideoTracks().forEach(track => (track.enabled = !videoMute));
    } else if (videoSourceType === VideoSourceType.SCREEN && screenStream) {
      console.log(`[VIDEO_LOG] Screen mute status changed to: ${videoMute}`);
      screenStream.getVideoTracks().forEach(track => (track.enabled = !videoMute));
    }
  }, [videoMute, cameraStream, screenStream, videoSourceType]);

  const onClickMute = () => {
    setVideoMute(!videoMute);
  };

  interface SelectItem {
    label: string
    value: string
    deviceId: string
  }

  const DEFAULT_ITEM: SelectItem = {
    label: "默认",
    value: "default",
    deviceId: "",
  }

  const CamSelect = (props: { currentDeviceId?: string, onDeviceChange: (deviceId: string) => void }) => {
    const { currentDeviceId, onDeviceChange } = props;
    const [items, setItems] = React.useState<SelectItem[]>([DEFAULT_ITEM])
    const [value, setValue] = React.useState("default")

    React.useEffect(() => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
        setItems([
          DEFAULT_ITEM,
          ...videoInputDevices.map((item) => ({
            label: item.label,
            value: item.label,
            deviceId: item.deviceId,
          })),
        ]);
        if (currentDeviceId) {
          const selected = videoInputDevices.find(d => d.deviceId === currentDeviceId);
          if (selected) {
            setValue(selected.label);
          }
        }
      }).catch(error => {
        console.error("[VIDEO_LOG] Error enumerating devices:", error);
      });
    }, [currentDeviceId]);

    const onChange = (selectedValue: string) => {
      const target = items.find((item) => item.value === selectedValue);
      if (target) {
        setValue(target.value);
        onDeviceChange(target.deviceId);
      }
    };

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full"> {/* Changed from w-[180px] to w-full */}
          <SelectValue placeholder="选择摄像头" />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.deviceId} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <VideoDeviceWrapper
      title="视频"
      Icon={videoSourceType === VideoSourceType.CAMERA ? CamIconByStatus : ScreenIconByStatus}
      onIconClick={onClickMute}
      isActive={!videoMute}
      videoSourceType={videoSourceType}
      onVideoSourceChange={onVideoSourceChange}
      select={
        videoSourceType === VideoSourceType.CAMERA ? (
          <CamSelect
            currentDeviceId={selectedDeviceId}
            onDeviceChange={setSelectedDeviceId}
          />
        ) : (
          <div className="w-[180px]" />
        )
      }
    >
      <div className="my-3 h-60 w-full overflow-hidden rounded-lg">
        <LocalVideoStreamPlayer
          stream={videoSourceType === VideoSourceType.CAMERA ? cameraStream : screenStream}
          muted={true}
        />
      </div>
      {/* 用于在后台捕获视频帧的 Canvas 元素 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </VideoDeviceWrapper>
  );
}
