import React from 'react';

const EditSystemPrompt = () => {
  return (
    <div className="wrapper-bPWIzS undefined">
      <div data-text="系统 Prompt" className="title-AIzHyH">系统 Prompt</div>
      <div>
        {/* System Prompt content goes here */}
        <textarea className="arco-textarea" placeholder="请输入你需要的 Prompt 设定" style={{ height: '382px' }}>
        </textarea>
        <p>系统 Prompt 设置区域</p>
      </div>
    </div>
  );
};

export default EditSystemPrompt;
