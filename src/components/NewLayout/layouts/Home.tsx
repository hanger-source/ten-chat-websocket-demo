import React, { useEffect } from 'react';
import HomeHeader from "../header/HomeHeader";
import HomeMainArea from "../main-area/HomeMainArea";
import HomeRightSidebar from "../right-sidebar/HomeRightSidebar";
import {useAppDispatch} from "@/common";
import {initializeGraphData} from "@/store/reducers/global";

const Home = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeGraphData());
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-pink-50">
      <HomeHeader />
      <div className="flex flex-1 py-4 px-4 items-stretch">
        <HomeMainArea />
        <HomeRightSidebar />
      </div>
    </div>
  );
};

export default Home;
