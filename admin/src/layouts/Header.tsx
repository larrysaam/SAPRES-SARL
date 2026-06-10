import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BellIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b-2 border-gray-900 dark:border-gray-200 shadow-[0_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[0_2px_0px_0px_rgba(255,255,255,0.2)]">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Left: Breadcrumb / Title */}
        <div className="flex items-center gap-2">
          <nav className="hidden sm:flex items-center gap-2 text-sm">
            <span className="font-bold text-gray-900 dark:text-white capitalize">
              {user?.firstName || 'Admin'}
            </span>
            <span className="text-gray-400 dark:text-gray-500">/</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Dashboard
            </span>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-lg border-2 border-gray-900 dark:border-gray-200 bg-emerald-50 dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-gray-700 transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
              3
            </span>
          </Link>

          {/* User avatar */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-gray-900 dark:border-gray-200 bg-emerald-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
            <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-xs font-black">
              {user?.firstName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span className="hidden sm:inline text-sm font-bold">{user?.role?.replace('_', ' ') || 'Guest'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
