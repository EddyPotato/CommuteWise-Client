import React from "react";
import { NavLink } from "react-router-dom";
import { Map, MessageSquare, History, User } from "lucide-react";

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center w-full h-full transition-colors ${
        isActive ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
      }`
    }
  >
    <Icon size={24} strokeWidth={2.5} />
    <span className="text-[10px] mt-1 font-semibold">{label}</span>
  </NavLink>
);

const BottomNav = () => {
  return (
    <div className="h-[65px] bg-white border-t border-gray-200 flex justify-between items-center px-4 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] z-50">
      <NavItem to="/" icon={Map} label="Explore" />
      <NavItem to="/forum" icon={MessageSquare} label="Community" />
      <NavItem to="/history" icon={History} label="History" />
      <NavItem to="/account" icon={User} label="Account" />
    </div>
  );
};

export default BottomNav;
