import React from 'react';
import { useAppSelector } from "@/common/hooks";

const HomeAvatarCard = () => {
  const currentScene = useAppSelector((state) => state.global.currentScene);

  return (
    <div className="flex flex-col items-center mb-6">
      <div className={`w-36 h-36 rounded-full overflow-hidden mb-4 ${currentScene ? '' : 'border-2 border-blue-500'}`}>
        <img id="avatar-card" src={currentScene?.iconSrc || '//mediaservice-fe.volccdn.com/obj/vcloud-fe/aigc/static/image/TEACHING_ASSISTANT.a9b7ab5c.png'} alt="Avatar" className="w-full h-full object-cover" />
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-800 mb-4">{currentScene?.uiGreeting || 'Hi，欢迎体验实时对话式 AI'}</div>
        <div className="text-base text-gray-500">{currentScene?.welcomeSubText || '支持豆包 Vision 模型和 深度思考模型，超多对话场景等你开启'}</div>
      </div>
    </div>
  );
};

export default HomeAvatarCard;
