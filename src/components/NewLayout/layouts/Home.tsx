import React, { useEffect } from 'react';
import HomeHeader from "../header/HomeHeader";
import HomeMainArea from "../main-area/HomeMainArea";
import HomeRightSidebar from "../right-sidebar/HomeRightSidebar";
import {useAppDispatch} from "@/common";
import {initializeGraphData} from "@/store/reducers/global";
import MobileRightSidebarSheet from "@/components/NewLayout/right-sidebar/MobileRightSidebarSheet"; // Import new mobile sidebar sheet with absolute path

const Home = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(initializeGraphData());
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-pink-50">
      <HomeHeader />
      <div className="flex flex-1 md:py-4 md:px-4 items-stretch lg:space-x-4">
        {/* 在小屏幕上，主区域占据全部宽度，侧边栏隐藏 */}
        <HomeMainArea className="flex-1" />
        {/* 侧边栏在桌面端正常显示，在移动端通过抽屉展示 */}
        <HomeRightSidebar className="hidden lg:block w-75" /> {/* 桌面端侧边栏 */}
      </div>
      {/* 移动端侧边栏触发按钮 (仅在小屏幕显示) */}
      <div className="lg:hidden fixed top-14 right-4">
        <MobileRightSidebarSheet />
      </div>
    </div>
  );
};

export default Home;
