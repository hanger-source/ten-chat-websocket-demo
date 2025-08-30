import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/common/hooks"; // 导入 useAppDispatch 和 useAppSelector
import { setSelectedMicDeviceId } from "@/store/reducers/global"; // 导入 setSelectedMicDeviceId action

// 设备选择组件
function MicrophoneDeviceSelect() {
  const dispatch = useAppDispatch();
  const selectedMicDeviceId = useAppSelector(state => state.global.selectedMicDeviceId);
  const [devices, setDevices] = React.useState<Array<{label: string, value: string, deviceId: string}>>([]);
  // const [selectedDevice, setSelectedDevice] = React.useState("default"); // 移除本地 selectedDevice

  React.useEffect(() => {
    // 获取麦克风设备列表
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const audioDevices = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            label: device.label || `麦克风 ${device.deviceId.slice(0, 8)}`,
            value: device.deviceId || `device-${Math.random()}`, // 确保 value 不为空
            deviceId: device.deviceId
          }));

        if (audioDevices.length > 0) {
          setDevices(audioDevices);
          // 如果 Redux 中没有选中的麦克风，则默认选中第一个
          if (!selectedMicDeviceId) {
            dispatch(setSelectedMicDeviceId(audioDevices[0].deviceId));
          }
        }
      })
      .catch(error => {
        console.error('获取设备列表失败:', error);
      });
  }, [dispatch, selectedMicDeviceId]); // 添加 dispatch 和 selectedMicDeviceId 依赖

  const handleDeviceChange = (deviceId: string) => {
    dispatch(setSelectedMicDeviceId(deviceId)); // dispatch action 更新 Redux 状态
    console.log('切换到设备:', deviceId);
  };

  return (
    <Select value={selectedMicDeviceId || ""} onValueChange={handleDeviceChange}> {/* 使用 Redux 状态 */}
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="选择麦克风" />
      </SelectTrigger>
      <SelectContent>
        {devices.map((device) => (
          <SelectItem key={device.value} value={device.value}>
            {device.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default MicrophoneDeviceSelect;
