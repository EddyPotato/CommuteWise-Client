import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "../components/navigation/BottomNav";

const MainLayout = () => {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      {/* CONTENT AREA (Flex-1 fills remaining space) */}
      <div className="flex-1 relative overflow-hidden">
        {/* The Outlet renders the current page (e.g., Home, History) */}
        <Outlet />
      </div>

      {/* BOTTOM NAVIGATION (Fixed height, sits at bottom) */}
      <div className="flex-none z-50">
        <BottomNav />
      </div>
    </div>
  );
};

export default MainLayout;
