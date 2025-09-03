import React, { useMemo } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { VideoSourceType, VIDEO_SOURCE_OPTIONS } from "@/common/constant";
import { CamIconByStatus } from "@/components/Icon";
import { MonitorIcon, MonitorXIcon, AlertCircle } from "lucide-react";
import { LocalVideoStreamPlayer } from "@/components/Agent/LocalVideoStreamPlayer";
import { useWebSocketSession } from "@/hooks/useWebSocketSession"; // Still needed for isConnected
import useMediaState from '@/hooks/media/useMediaState'; // 导入新的 useMediaState hook
import useMediaDevices from '@/hooks/media/useMediaDevices'; // 导入新的 useMediaDevices hook
import useMediaControls from '@/hooks/media/useMediaControls'; // 导入新的 useMediaControls hook
import useMediaTrackControls from '@/hooks/media/useMediaTrackControls'; // 导入新的 useMediaTrackControls hook
import useActiveMediaStream from '@/hooks/media/useActiveMediaStream'; // 导入新的 useActiveMediaStream hook
import { useDispatch } from 'react-redux'; // Import useDispatch
import { StreamStatus, requestCamera, requestScreen } from '@/store/reducers/localMediaStream'; // 更新 StreamStatus 及相关 action 导入路径

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
const CamSelect = (props: { currentDeviceId: string | null, onDeviceChange: (deviceId: string | null) => void, disabled?: boolean }) => {
  const { currentDeviceId, onDeviceChange, disabled } = props;
  const [items, setItems] = React.useState<SelectItem[]>([DEFAULT_CAM_ITEM]);
  // 使用 currentDeviceId 初始化 value，并监听其变化
  const [value, setValue] = React.useState(currentDeviceId === null ? DEFAULT_CAM_ITEM.value : currentDeviceId);

  React.useEffect(() => {
    // 当 currentDeviceId 变化时，更新内部 value 状态
    if (currentDeviceId === null) {
      setValue(DEFAULT_CAM_ITEM.value);
    } else {
      const selected = items.find(d => d.deviceId === currentDeviceId);
      if (selected) {
        setValue(selected.value);
      } else {
        setValue(DEFAULT_CAM_ITEM.value);
      }
    }
  }, [currentDeviceId, items]);

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
    }).catch(error => {
      console.error("[DEBUG_CAMERA] Error enumerating devices:", error);
    });
  }, []); // 仅在挂载时枚举设备一次，设备变化通过 useMediaDevices 处理

  const onChange = (selectedValue: string) => {
    const target = items.find((item) => item.value === selectedValue);
    if (target) {
      setValue(target.value);
      // 调用上层 hook 提供的设备切换函数
      onDeviceChange(target.deviceId === DEFAULT_CAM_ITEM.deviceId ? null : target.deviceId);
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
  const dispatch = useDispatch(); // Get dispatch

  React.useEffect(() => {
    console.log('[DEBUG_CAMERA] CamSettingsBlock mounted');
    return () => {
      console.log('[DEBUG_CAMERA] CamSettingsBlock unmounted');
    };
  }, []);

  // 使用新的 Hooks 来获取状态和控制函数
  const { status, error, selectedVideoSource, isVideoEnabled } = useMediaState();
  const { selectedCamDeviceId, setSelectedCamera } = useMediaDevices();
  const { toggleCamera, toggleScreen } = useMediaControls(); // 暂时保留，但我们会用 requestCamera/Screen 替代
  const { toggleVideoEnabled } = useMediaTrackControls();
  const activeStream = useActiveMediaStream(); // 获取实际的媒体流

  const { isConnected } = useWebSocketSession(); // Get connection state

  let videoStatusText = '视频已关闭或无可用视频源';
  if (status === StreamStatus.PENDING) {
    videoStatusText = '正在请求视频...';
  } else if (status === StreamStatus.PERMISSION_DENIED) {
    videoStatusText = '权限被拒绝，请检查浏览器设置';
  } else if (status === StreamStatus.ERROR) {
    videoStatusText = `获取视频失败: ${error}`;
  } else if (activeStream && isVideoEnabled) {
    videoStatusText = '视频已激活';
  } else if (!isVideoEnabled) {
    videoStatusText = '视频已关闭';
  } else if (!activeStream) {
    videoStatusText = '无可用视频源';
  }

  const handleVideoSourceChange = (value: string) => {
    if (value === VideoSourceType.CAMERA) {
      dispatch(requestCamera({ camDeviceId: selectedCamDeviceId }));
    } else if (value === VideoSourceType.SCREEN) {
      dispatch(requestScreen({}));
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">摄像头</div>
          <div className={`w-2 h-2 rounded-full ${!isVideoEnabled ? 'bg-red-500' : 'bg-green-500'}`}></div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="border-secondary bg-transparent"
          onClick={toggleVideoEnabled} // 使用新的 toggleVideoEnabled
          disabled={disabled}
        >
          {selectedVideoSource === VideoSourceType.CAMERA ? (
            <CamIconByStatus className="h-5 w-5" active={isVideoEnabled} color="purple"/>
          ) : (
            <ScreenIconByStatus className="h-5 w-5" active={isVideoEnabled} color="purple"/>
          )}
        </Button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Select value={selectedVideoSource || "none"} onValueChange={handleVideoSourceChange} disabled={disabled}> {/* 使用 requestedVideoSource */}
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
        {selectedVideoSource === VideoSourceType.CAMERA && (
        <CamSelect currentDeviceId={selectedCamDeviceId} onDeviceChange={setSelectedCamera} disabled={disabled} />
        )}
      </div>
      {!isConnected && (
        <div className="my-3 w-full mx-auto overflow-hidden rounded-lg border border-gray-200 bg-black flex items-center justify-center shadow-lg aspect-[4/3]"> {/* Change w-64 to w-full */}
          {activeStream && isVideoEnabled && status === StreamStatus.ACTIVE ? ( // 使用 activeStream, isVideoEnabled 和 status
            <LocalVideoStreamPlayer
              stream={activeStream} // Use activeStream
              muted={true}
              fit="cover"
            />
          ) : (
            <p className="text-white text-sm">{videoStatusText}</p>
          )}
        </div>
      )}
      {status === StreamStatus.PERMISSION_DENIED && (
        <p className="text-xs text-right mt-2 text-red-500">无权限</p>
      )}
    </div>
  );
};

export default CamSettingsBlock;
