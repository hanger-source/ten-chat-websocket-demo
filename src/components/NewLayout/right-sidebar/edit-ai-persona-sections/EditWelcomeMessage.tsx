import React from 'react';

const EditWelcomeMessage = () => {
  return (
    <div className="wrapper-bPWIzS undefined">
      <div data-text="欢迎语" className="title-AIzHyH">欢迎语</div>
      <div>
        {/* Welcome message content goes here */}
        <textarea className="arco-textarea" placeholder="请输入欢迎语" style={{ height: '30px' }}></textarea>
        <p>欢迎语设置区域</p>
      </div>
    </div>
  );
};

export default EditWelcomeMessage;
