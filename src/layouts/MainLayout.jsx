import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "../components/navigation/BottomNav";

const MainLayout = () => {
  return (
    // Use 'dvh' (dynamic viewport height) to handle mobile browser bars correctly
    <div className="flex flex-col h-dvh w-screen overflow-hidden bg-gray-50">
      
      {/* 1. MAIN CONTENT AREA */}
      {/* flex-1: Takes up all available space ABOVE the nav */}
      {/* relative: Establishes a positioning context for absolute children (Sheets, Map) */}
      <div className="flex-1 relative overflow-hidden">
        <Outlet />
      </div>

      {/* 2. BOTTOM NAVIGATION */}
      {/* flex-none: Rigid height, never shrinks */}
      {/* z-50: Ensures it stays on top if needed, though layout prevents overlap */}
      <div className="flex-none z-50">
        <BottomNav />
      </div>

    </div>
  );
};

export default MainLayout;