import { IconProps } from "../types";
import UserAvatarSvg from "../../../assets/chat/user.svg?react"; // 使用 ?react 明确指示 Vite 导入为 React 组件

export const UserAvatarIcon = (props: IconProps) => {
  return <UserAvatarSvg {...props} />;
};
