import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MicIcon } from "@/components/icons/mic";

// 定义用于设备选择的通用接口
interface SelectItem {
  label: string;
  value: string;
  deviceId: string;
}

// MicSelect 组件
const MicSelect = (props: { currentDeviceId?: string, onDeviceChange: (deviceId: string) => void }) => {
  const { currentDeviceId, onDeviceChange } = props;
  const [items, setItems] = React.useState<SelectItem[]>([]); // 初始化为空数组
  const [value, setValue] = React.useState(""); // 初始化为空字符串

  React.useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      const processedDevices = audioInputDevices.map((device, index) => ({
        label: device.label || `麦克风 ${device.deviceId.slice(0, 8)}`, // 模仿老 UI 的 label 生成
        value: device.deviceId || `device-${Math.random()}`, // 确保 value 不为空
        deviceId: device.deviceId
      }));

      if (processedDevices.length > 0) {
        setItems(processedDevices);
        // 默认选中第一个设备，如果 currentDeviceId 有值且在列表中，则选中 currentDeviceId
        const initialSelected = currentDeviceId && processedDevices.find(d => d.deviceId === currentDeviceId);
        if (initialSelected) {
          setValue(initialSelected.value);
        } else {
          setValue(processedDevices[0].value); // 默认选中第一个
        }
      }
    }).catch(error => {
      console.error("[AUDIO_LOG] Error enumerating devices:", error);
    });
  }, []); // 依赖数组为空，只在挂载时运行一次

  const onChange = (selectedValue: string) => {
    const target = items.find((item) => item.value === selectedValue);
    if (target) {
      setValue(target.value);
      onDeviceChange(target.deviceId);
    }
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={items.length === 0}> {/* 禁用选择器如果无设备 */}
      <SelectTrigger className="w-full">
        <SelectValue placeholder="选择麦克风" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}> {/* key 和 value 都绑定到 item.value */}
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// MicSettingsBlock 主组件
const MicSettingsBlock = () => {
  const [audioMute, setAudioMute] = React.useState(false); // Default to microphone on
  const [selectedMicDeviceId, setSelectedMicDeviceId] = React.useState<string | undefined>(undefined);

  // 处理麦克风权限请求和状态显示 (不涉及实际的媒体流传输)
  const [micPermission, setMicPermission] = React.useState<'granted' | 'denied' | 'prompt'>('prompt');
  React.useEffect(() => {
    const checkMicPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
        permissionStatus.onchange = () => {
          setMicPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');
        };
      } catch (error) {
        console.error("Error querying microphone permission:", error);
        setMicPermission('denied');
      }
    };
    checkMicPermission();
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
          <div className="text-sm font-medium">麦克风</div>
          <div className={`w-2 h-2 rounded-full ${audioMute ? 'bg-red-500' : 'bg-green-500'}`}></div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="border-secondary bg-transparent"
          onClick={() => setAudioMute(!audioMute)}
        >
          <MicIcon className="h-5 w-5" active={!audioMute} />
        </Button>
      </div>
      <MicSelect currentDeviceId={selectedMicDeviceId} onDeviceChange={setSelectedMicDeviceId} />
      {micPermission === 'denied' && (
        <p className="text-xs text-right mt-2 text-red-500">无权限</p>
      )}
    </div>
  );
};

export default MicSettingsBlock;
