import React from 'react';
import { cn } from '@/lib/utils'; // Import cn utility

interface EditVoiceSettingsProps {
  className?: string;
}

const EditVoiceSettings: React.FC<EditVoiceSettingsProps> = ({ className }) => {
  return (
    <div className={cn("wrapper-bPWIzS undefined", className)}>
      <div data-text="音色" className="title-AIzHyH">音色</div>
      <div>
        {/* Voice settings content goes here */}
        <p>音色设置区域</p>
      </div>
    </div>
  );
};

export default EditVoiceSettings;
