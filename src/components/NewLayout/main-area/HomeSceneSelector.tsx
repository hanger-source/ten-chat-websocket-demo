import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "@/common/hooks";
import { setCurrentScene } from "@/store/reducers/global";
import { sceneCards } from "@/common/sceneData"; // Import sceneCards from the new file

const HomeSceneSelector = () => {
  const dispatch = useAppDispatch();
  const currentScene = useAppSelector((state) => state.global.currentScene);

  useEffect(() => {
    // Set the first scene as default when component mounts or sceneCards change
    if (!currentScene && sceneCards.length > 0) {
      dispatch(setCurrentScene(sceneCards[0]));
    }
  }, [currentScene, sceneCards, dispatch]);

  return (
    <div className="grid grid-cols-6 gap-2 mx-auto">
      {sceneCards.map((card, index) => (
        <div
          key={index}
          className={`group relative p-[1px] rounded-full text-center cursor-pointer transition-all duration-200
                     ${currentScene && currentScene.text === card.text ? 'border-none bg-gradient-to-br from-blue-400 to-pink-400 via-purple-400 bg-origin-border bg-clip-border' : 'border border-gray-200'} /* Highlight selected card */
                     hover:border-transparent /* Make border transparent on hover */
                     hover:bg-gradient-to-br hover:from-blue-400 hover:to-pink-400 hover:via-purple-400 /* Gradient background on hover */
                     hover:bg-origin-border hover:bg-clip-border /* Clip background to border box for gradient border effect */
                     hover:shadow-xl /* Keep hover shadow */
                    `}
          onClick={() => dispatch(setCurrentScene(card))}
        >
          <div className="flex items-center justify-center space-x-2 py-3 px-4 bg-white rounded-full h-full">
            {card.tag && (
              <div className={`absolute top-[-1rem] right-[-0.5rem] ${card.bgColor} text-white text-xs px-2 py-1 rounded-full rounded-bl-none`}>{card.tag}</div>
            )}
            <img className="w-8 h-8" src={card.iconSrc} alt="icon" />
            <div className={`text-sm font-light text-gray-500 truncate
                        ${currentScene && currentScene.text === card.text ? 'bg-gradient-to-br from-blue-400 to-pink-400 via-purple-400 bg-clip-text text-transparent' : ''} 
                        group-hover:bg-gradient-to-br group-hover:from-blue-400 group-hover:to-pink-400 group-hover:via-purple-400
                        group-hover:bg-clip-text group-hover:text-transparent`}>
              {card.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomeSceneSelector;
