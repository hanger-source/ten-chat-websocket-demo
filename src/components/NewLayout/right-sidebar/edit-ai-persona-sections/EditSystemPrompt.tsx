import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { setCurrentScene } from '@/store/reducers/global';
import { Textarea } from '@/components/ui/textarea'; // 导入 Textarea 组件

interface EditSystemPromptProps {
  className?: string;
}

const EditSystemPrompt: React.FC<EditSystemPromptProps> = ({ className }) => {
  const dispatch = useDispatch();
  const { currentScene } = useSelector((state: RootState) => state.global);
  const [systemPrompt, setSystemPrompt] = useState(currentScene?.prompt || '');

  useEffect(() => {
    setSystemPrompt(currentScene?.prompt || '');
  }, [currentScene]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setSystemPrompt(newPrompt);
    if (currentScene) {
      const updatedScene = { ...currentScene, prompt: newPrompt };
      dispatch(setCurrentScene(updatedScene));
    }
  };

  return (
    <div className={cn("mb-6 relative", className)}>
      <div className="relative bg-white rounded-lg shadow-sm pt-4 p-4 border border-gray-200">
        <div className="absolute top-0 left-4 -translate-y-1/2 flex space-x-2 bg-white px-2 z-10">
          <span className="px-3 py-1 rounded-md text-sm font-normal bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent border-transparent">系统提示词</span>
        </div>
        <div className="pt-2 text-gray-600 text-sm">
          <Textarea
            placeholder="请输入你需要的 Prompt 设定"
            value={systemPrompt}
            onChange={handlePromptChange}
            className="min-h-[200px] focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none"
          />
        </div>
      </div>
    </div>
  );
};

export default EditSystemPrompt;
