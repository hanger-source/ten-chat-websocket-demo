import React, { useRef, useEffect } from 'react';
import { ISceneCard } from '@/types';
import { useSelectedScene } from '../../../../hooks/useSelectedScene';
import { useAiPersonalEdit } from '../../../../hooks/useAiPersonalEdit';

interface EditAIPersonaScenesProps {
  onCapsuleClick: (card: ISceneCard, ref: HTMLDivElement | null) => void;
}

const EditAIPersonaScenes: React.FC<EditAIPersonaScenesProps> = ({ onCapsuleClick }) => {
  const { allScenes } = useSelectedScene(); // 重新引入 useSelectedScene 并获取 allScenes
  const { editingScene, switchEditingScene } = useAiPersonalEdit();

  const capsuleRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  return (
    <div className="flex space-x-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory scroll-px-6">
      {allScenes.map((card: ISceneCard) => {
        const ref = (capsuleRefs.current[card.aiPersonaName] = capsuleRefs.current[card.aiPersonaName] || null);
        return (
          <div
            key={card.aiPersonaName}
            ref={(el) => { capsuleRefs.current[card.aiPersonaName] = el; }}
            onClick={() => {
              onCapsuleClick(card, capsuleRefs.current[card.aiPersonaName]);
            }}
            className={`group relative rounded-xl cursor-pointer transition-all duration-200 w-28 h-28 border-2
              ${editingScene?.aiPersonaName === card.aiPersonaName // 如果是选中状态
                ? 'bg-gradient-to-br from-purple-400 to-pink-400 border-transparent bg-origin-border bg-clip-border shadow-md'
                : 'border-gray-200 bg-white hover:border-transparent hover:bg-gradient-to-br hover:from-blue-400 hover:to-pink-400 hover:via-purple-400 hover:bg-origin-border hover:bg-clip-border hover:shadow-xl'
              }`
            }
          >
            <div className={`flex flex-col items-center justify-center h-full w-full rounded-xl p-4 bg-white`}>
              <img className="w-16 h-16 mb-2" src={card.iconSrc} alt={card.uiGreeting} />
              <div className={`text-sm font-medium
                ${editingScene?.aiPersonaName === card.aiPersonaName
                  ? 'bg-gradient-to-br from-blue-400 to-pink-400 via-purple-400 bg-clip-text text-transparent'
                  : 'text-gray-800 group-hover:bg-gradient-to-br group-hover:from-blue-400 group-hover:to-pink-400 group-hover:via-purple-400 group-hover:bg-clip-text group-hover:text-transparent'
                }`
              }>
                {card.aiPersonaName}
              </div>
              {editingScene?.aiPersonaName === card.aiPersonaName && (
                <svg
                  className="absolute bottom-0 right-0 w-6 h-6 p-1 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              )}
            </div>
          </div>
        );
      })}
      {/* Custom scene capsule for future expansion */}
      <div className="relative flex flex-col items-center justify-center p-4 rounded-xl cursor-not-allowed bg-gray-50 border border-gray-200 text-gray-400 w-28 h-28">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 mb-2 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300 to-white text-white">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-400">自定义</div>
        </div>
      </div>
    </div>
  );
};

export default EditAIPersonaScenes;

