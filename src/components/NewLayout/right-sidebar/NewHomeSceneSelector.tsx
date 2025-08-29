import React from 'react';

const NewHomeSceneSelector = () => {
  const sceneCards = [
    {
      tag: '视觉理解',
      bgColor: 'bg-blue-500',
      iconSrc: '//mediaservice-fe.volccdn.com/obj/vcloud-fe/aigc/static/image/TEACHING_ASSISTANT.a9b7ab5c.png',
      text: 'AI助手',
    },
    {
      tag: '联网查询',
      bgColor: 'bg-green-500',
      iconSrc: '//mediaservice-fe.volccdn.com/obj/vcloud-fe/aigc/static/image/ToyAvatar.8c3d6ff5.png',
      text: '智能玩具',
    },
    {
      tag: null,
      bgColor: null,
      iconSrc: '//mediaservice-fe.volccdn.com/obj/vcloud-fe/aigc/static/image/VIRTUAL_GIRL_FRIEND.06549a31.png',
      text: '情感陪伴',
    },
    {
      tag: '屏幕识别',
      bgColor: 'bg-yellow-500',
      iconSrc: '//mediaservice-fe.volccdn.com/obj/vcloud-fe/aigc/static/image/SCREEN_READER.d17a401c.png',
      text: '读屏助手',
    },
    {
      tag: null,
      bgColor: null,
      iconSrc: '//mediaservice-fe.volccdn.com/obj/vcloud-fe/aigc/static/image/CHILDREN_ENCYCLOPEDIA.c67b59b8.png',
      text: '儿童百科',
    },
    {
      tag: null,
      bgColor: null,
      iconSrc: '//mediaservice-fe.volccdn.com/obj/vcloud-fe/aigc/static/image/TRANSLATE.37b522cd.png',
      text: '同声传译',
    },
    {
      tag: null,
      bgColor: null,
      iconSrc: '//mediaservice-fe.volccdn.com/obj/vcloud-fe/aigc/static/image/CUSTOMER_SERVICE.26318f78.png',
      text: '智能客服',
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-2 mx-auto">
      {sceneCards.map((card, index) => (
        <div key={index} className="relative py-3 px-4 border border-gray-200 rounded-full text-center cursor-pointer hover:shadow-md transition-shadow">
          {card.tag && (
            <div className={`absolute top-[-0.5rem] right-[-0.5rem] ${card.bgColor} text-white text-xs px-2 py-1 rounded-bl-lg`}>{card.tag}</div>
          )}
          <div className="flex items-center justify-center space-x-2">
            <img className="w-8 h-8" src={card.iconSrc} alt="icon" />
            <div className="text-xs font-medium text-gray-700 truncate">{card.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewHomeSceneSelector;
