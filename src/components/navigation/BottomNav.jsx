import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Clock, Users, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/home', icon: HomeIcon, label: 'Home' },
    { path: '/history', icon: Clock, label: 'History' },
    { path: '/community', icon: Users, label: 'Community' },
    { path: '/account', icon: User, label: 'Account' },
  ];

  return (
    // Base container sits at the very bottom, fixed height
    <div className="bg-white border-t border-gray-200 shadow-xl z-50 h-[65px] flex items-center justify-around w-full">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center p-2 transition-colors duration-200 w-1/4 ${
              isActive ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-500'
            }`}
          >
            <Icon size={24} className={isActive ? 'fill-emerald-50' : ''} />
            <span className="text-xs mt-0.5 font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default BottomNav;