import React from 'react';

const HomeSceneSelector = () => {
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
        <div
          key={index}
          className="group relative p-[1px] rounded-full text-center cursor-pointer transition-all duration-200
                     border border-gray-200 /* Default grey border */
                     hover:border-transparent /* Make border transparent on hover */
                     hover:bg-gradient-to-br hover:from-blue-400 hover:to-pink-400 hover:via-purple-400 /* Gradient background on hover */
                     hover:bg-origin-border hover:bg-clip-border /* Clip background to border box for gradient border effect */
                     hover:shadow-md /* Keep hover shadow */
                    "
        >
          <div className="flex items-center justify-center space-x-2 py-3 px-4 bg-white rounded-full h-full">
            {card.tag && (
              <div className={`absolute top-[-1rem] right-[-0.5rem] ${card.bgColor} text-white text-xs px-2 py-1 rounded-full rounded-bl-none`}>{card.tag}</div>
            )}
            <img className="w-8 h-8" src={card.iconSrc} alt="icon" />
            <div className="text-sm font-light text-gray-500 truncate
                        group-hover:bg-gradient-to-br group-hover:from-blue-400 group-hover:to-pink-400 group-hover:via-purple-400
                        group-hover:bg-clip-text group-hover:text-transparent">
              {card.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomeSceneSelector;
