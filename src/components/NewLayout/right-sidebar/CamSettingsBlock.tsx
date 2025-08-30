import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { VideoSourceType, VIDEO_SOURCE_OPTIONS } from "@/common/constant";
import { CamIconByStatus } from "@/components/Icon";
import { MonitorIcon, MonitorXIcon } from "lucide-react";
import { LocalVideoStreamPlayer } from "@/components/Agent/LocalVideoStreamPlayer";
import { useAppDispatch, useAppSelector } from "@/common/hooks";
import { setSelectedCamDeviceId, setCameraMuted } from "@/store/reducers/global"; // 导入 setCameraMuted action
import { useWebSocketSession } from "@/hooks/useWebSocketSession"; // 导入 useWebSocketSession

// 定义用于设备选择的通用接口
interface SelectItem {
  label: string;
  value: string;
  deviceId: string;
}

// 默认摄像头选项
const DEFAULT_CAM_ITEM: SelectItem = {
  label: "默认",
  value: "default",
  deviceId: "default-cam-item",
};

// ScreenIconByStatus 辅助组件（从 VideoBlock.tsx 提取并简化）
const ScreenIconByStatus = React.memo((props: React.SVGProps<SVGSVGElement> & { active?: boolean; color?: string }) => {
  const { active, color, ...rest } = props;
  if (active) {
    return <MonitorIcon color={color || "#3D53F5"} {...rest} />;
  }
  return <MonitorXIcon color={color || "#667085"} {...rest} />;
});

// CamSelect 组件
const CamSelect = (props: { currentDeviceId?: string, onDeviceChange: (deviceId: string) => void }) => {
  const { currentDeviceId, onDeviceChange } = props;
  const [items, setItems] = React.useState<SelectItem[]>([DEFAULT_CAM_ITEM]);
  const [value, setValue] = React.useState("default");

  React.useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
      const processedDevices = videoInputDevices.map((item, index) => ({
        label: item.label || `摄像头 ${index + 1}`,
        value: item.deviceId || `videoinput-${index}`,
        deviceId: item.deviceId || `videoinput-id-${index}`,
      }));

      setItems([
        DEFAULT_CAM_ITEM,
        ...processedDevices,
      ]);
      if (currentDeviceId) {
        const selected = processedDevices.find(d => d.deviceId === currentDeviceId);
        if (selected) {
          setValue(selected.value);
        } else {
          setValue(DEFAULT_CAM_ITEM.value);
        }
      }
    }).catch(error => {
      console.error("[VIDEO_LOG] Error enumerating devices:", error);
    });
  }, [currentDeviceId]); // Remove items from dependency array, match old UI

  const onChange = (selectedValue: string) => {
    const target = items.find((item) => item.value === selectedValue);
    if (target) {
      setValue(target.value);
      onDeviceChange(target.deviceId);
    }
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
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
  );
};

// CamSettingsBlock 主组件
const CamSettingsBlock = () => {
  const dispatch = useAppDispatch();
  const selectedCamDeviceId = useAppSelector(state => state.global.selectedCamDeviceId);
  const isCameraMuted = useAppSelector(state => state.global.isCameraMuted); // 从 Redux 获取 isCameraMuted 状态
  const [videoSourceType, setVideoSourceType] = React.useState<VideoSourceType>(VideoSourceType.CAMERA);
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = React.useState<MediaStream | null>(null);
  const { isConnected } = useWebSocketSession(); // 获取连接状态

  // 处理摄像头权限请求和状态显示
  const [camPermission, setCamPermission] = React.useState<'granted' | 'denied' | 'prompt'>('prompt'); // Include 'prompt' state
  React.useEffect(() => {
    const checkCamPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCamPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
        permissionStatus.onchange = () => {
          setCamPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
        };
      } catch (error) {
        console.error("Error querying camera permission:", error);
        setCamPermission('denied');
      }
    };
    checkCamPermission();
  }, []);

  // 获取摄像头和屏幕共享流
  React.useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedCamDeviceId ? { deviceId: selectedCamDeviceId } : true,
        });
        setCameraStream(stream);
        console.log("[VIDEO_LOG] 摄像头流获取成功");
      } catch (error) {
        console.error("[VIDEO_LOG] 摄像头访问失败:", error);
        setCameraStream(null);
      }
    };

    const getScreenStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        console.log("[VIDEO_LOG] 屏幕共享流获取成功");
      } catch (error) {
        console.error("[VIDEO_LOG] 屏幕共享访问失败:", error);
        setScreenStream(null);
      }
    };

    // 清理旧的媒体流
    const cleanupStreams = () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
    };

    cleanupStreams(); // 在每次 effect 运行前清理

    if (videoSourceType === VideoSourceType.CAMERA) {
      getCameraStream();
    } else if (videoSourceType === VideoSourceType.SCREEN) {
      getScreenStream();
    }

    return () => {
      cleanupStreams(); // 组件卸载时清理
    };
  }, [videoSourceType, selectedCamDeviceId, dispatch]);

  // 静音/取消静音逻辑
  React.useEffect(() => {
    if (videoSourceType === VideoSourceType.CAMERA && cameraStream) {
      console.log(`[VIDEO_LOG] Camera mute status changed to: ${isCameraMuted}`);
      cameraStream.getVideoTracks().forEach(track => (track.enabled = !isCameraMuted));
    } else if (videoSourceType === VideoSourceType.SCREEN && screenStream) {
      console.log(`[VIDEO_LOG] Screen mute status changed to: ${isCameraMuted}`);
      screenStream.getVideoTracks().forEach(track => (track.enabled = !isCameraMuted));
    }
  }, [isCameraMuted, cameraStream, screenStream, videoSourceType]);

  const getPermissionStatusText = (status: 'granted' | 'denied' | 'prompt') => { // Update status type
    switch (status) {
      case 'granted':
        return '已授权';
      case 'denied':
        return '已拒绝';
      case 'prompt': // Handle 'prompt' state
        return '待授权';
      default:
        return '未知';
    }
  };

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">摄像头</div>
          <div className={`w-2 h-2 rounded-full ${isCameraMuted ? 'bg-red-500' : 'bg-green-500'}`}></div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="border-secondary bg-transparent"
          onClick={() => dispatch(setCameraMuted(!isCameraMuted))}
        >
          {videoSourceType === VideoSourceType.CAMERA ? (
            <CamIconByStatus className="h-5 w-5" active={!isCameraMuted} color="purple"/>
          ) : (
            <ScreenIconByStatus className="h-5 w-5" active={!isCameraMuted} color="purple"/>
          )}
        </Button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Select value={videoSourceType} onValueChange={(value: VideoSourceType) => setVideoSourceType(value)}>
          <SelectTrigger className="w-[120px]">
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
        {videoSourceType === VideoSourceType.CAMERA && (
          <CamSelect currentDeviceId={selectedCamDeviceId} onDeviceChange={(deviceId) => dispatch(setSelectedCamDeviceId(deviceId))} />
        )}
      </div>
      {!isConnected && (
        <div className="my-3 h-40 w-full overflow-hidden rounded-lg border border-gray-200 bg-black flex items-center justify-center shadow-lg">
          {isCameraMuted || (!cameraStream && !screenStream) ? (
            <p className="text-white text-sm">视频已关闭或无可用视频源</p>
          ) : (
            <LocalVideoStreamPlayer
              stream={videoSourceType === VideoSourceType.CAMERA ? cameraStream : screenStream}
              muted={true}
            />
          )}
        </div>
      )}
      {camPermission === 'denied' && (
        <p className="text-xs text-right mt-2 text-red-500">无权限</p>
      )}
    </div>
  );
};

export default CamSettingsBlock;
