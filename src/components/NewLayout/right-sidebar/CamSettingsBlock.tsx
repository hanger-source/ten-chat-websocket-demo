import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { VideoSourceType, VIDEO_SOURCE_OPTIONS } from "@/common/constant";
import { CamIconByStatus } from "@/components/Icon";
import { MonitorIcon, MonitorXIcon } from "lucide-react";
import { LocalVideoStreamPlayer } from "@/components/Agent/LocalVideoStreamPlayer";
import { useWebSocketSession } from "@/hooks/useWebSocketSession"; // Still needed for isConnected
import { useUnifiedCamera } from '@/hooks/useUnifiedCamera'; // Import the new unified hook

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
const CamSelect = (props: { currentDeviceId?: string, onDeviceChange: (deviceId: string) => void, disabled?: boolean }) => {
  const { currentDeviceId, onDeviceChange, disabled } = props;
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
  }, [currentDeviceId]);

  const onChange = (selectedValue: string) => {
    const target = items.find((item) => item.value === selectedValue);
    if (target) {
      setValue(target.value);
      onDeviceChange(target.deviceId);
    }
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full min-w-0"> {/* Add min-w-0 */}
        <SelectValue placeholder="选择摄像头" className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap" /> {/* Add text truncation styles */}
      </SelectTrigger>
      <SelectContent> {/* Reverted: Removed max-w-xs min-w-0 */}
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
const CamSettingsBlock = (props: { disabled?: boolean }) => {
  const { disabled } = props;
  // Use useUnifiedCamera Hook to get all video related data and control functions
  const {
    hasActiveStream,
    isCameraMuted,
    selectedCamDeviceId,
    currentVideoSourceType,
    toggleCameraMute,
    changeCameraDevice,
    changeVideoSourceType,
    getMediaStreamInstance, // Get the getter function
  } = useUnifiedCamera({ enableVideoSending: false }); // CamSettingsBlock only for display, not sending frames

  const localStream = getMediaStreamInstance(); // Get the MediaStream instance here

  const { isConnected } = useWebSocketSession(); // Get connection state

  // 处理摄像头权限请求和状态显示
  const [camPermission, setCamPermission] = React.useState<'granted' | 'denied' | 'prompt'>('prompt');
  React.useEffect(() => {
    const checkCamPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCamPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
        permissionStatus.onchange = () => {
          setCamPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
        };
      } catch (error) {
        console.error("[VIDEO_LOG] Error querying camera permission:", error);
        setCamPermission('denied');
      }
    };
    checkCamPermission();
  }, []);

  const getPermissionStatusText = (status: 'granted' | 'denied' | 'prompt') => {
    switch (status) {
      case 'granted':
        return '已授权';
      case 'denied':
        return '已拒绝';
      case 'prompt':
        return '待授权';
      default:
        return '未知';
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">摄像头</div>
          <div className={`w-2 h-2 rounded-full ${isCameraMuted ? 'bg-red-500' : 'bg-green-500'}`}></div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="border-secondary bg-transparent"
          onClick={toggleCameraMute} // Use useUnifiedCamera provided function
          disabled={disabled}
        >
          {currentVideoSourceType === VideoSourceType.CAMERA ? (
            <CamIconByStatus className="h-5 w-5" active={!isCameraMuted} color="purple"/>
          ) : (
            <ScreenIconByStatus className="h-5 w-5" active={!isCameraMuted} color="purple"/>
          )}
        </Button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Select value={currentVideoSourceType} onValueChange={changeVideoSourceType} disabled={disabled}> {/* Update to currentVideoSourceType and changeVideoSourceType */}
          <SelectTrigger className="w-[120px] min-w-0"> {/* Add min-w-0 */}
            <SelectValue className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap" /> {/* Add text truncation styles */}
          </SelectTrigger>
          <SelectContent> {/* Reverted: Removed max-w-xs min-w-0 */}
            {VIDEO_SOURCE_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentVideoSourceType === VideoSourceType.CAMERA && (
        <CamSelect currentDeviceId={selectedCamDeviceId} onDeviceChange={changeCameraDevice} disabled={disabled} />
        )}
      </div>
      {!isConnected && (
        <div className="my-3 w-64 mx-auto overflow-hidden rounded-lg border border-gray-200 bg-black flex items-center justify-center shadow-lg aspect-[4/3]">
          {isCameraMuted || !hasActiveStream || !localStream ? ( // Check hasActiveStream and localStream
            <p className="text-white text-sm">视频已关闭或无可用视频源</p>
          ) : (
            <LocalVideoStreamPlayer
              stream={localStream} // Use useUnifiedCamera provided localStream
              muted={true}
              fit="cover"
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
