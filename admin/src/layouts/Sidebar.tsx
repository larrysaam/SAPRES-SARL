import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
 
  ArchiveBoxIcon,
  UserGroupIcon,
  DocumentTextIcon,
 
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.jpg'; // Adjust the path to your logo image  

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['super_admin', 'hr_admin', 'sales_admin', 'content_admin', 'inventory_admin'] },
    { name: 'Products', href: '/products', icon: CubeIcon, roles: ['super_admin', 'sales_admin', 'inventory_admin'] },
    { name: 'Orders', href: '/orders', icon: ShoppingCartIcon, roles: ['super_admin', 'sales_admin'] },
    // { name: 'Payments', href: '/payments', icon: CreditCardIcon, roles: ['super_admin', 'sales_admin'] },
    { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon, roles: ['super_admin', 'inventory_admin'] },
    { name: 'Recruitment', href: '/recruitment', icon: UserGroupIcon, roles: ['super_admin', 'hr_admin'] },
    { name: 'Content', href: '/content', icon: DocumentTextIcon, roles: ['super_admin', 'content_admin'] },
    { name: 'Users', href: '/users', icon: UserGroupIcon, roles: ['super_admin'] },
    // { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['super_admin'] },
    // { name: 'Notifications', href: '/notifications', icon: BellIcon, roles: ['super_admin', 'hr_admin', 'sales_admin', 'content_admin', 'inventory_admin'] },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, roles: ['super_admin', 'sales_admin'] },
  ];

  const filteredNavigation = navigation.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex flex-col h-screen w-72 bg-white dark:bg-gray-900 border-r-2 border-gray-900 dark:border-gray-200 shadow-[2px_0px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_0px_0px_0px_rgba(255,255,255,0.2)]">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b-2 border-gray-900 dark:border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10  rounded-lg border-2  dark:border-gray-200 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
            <img src={logo} alt="SAPRES Logo" />
          </div>
          <div>
            <h1 className="font-black text-gray-900 dark:text-white text-lg leading-tight">SAPRES</h1>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t-2 border-gray-900 dark:border-gray-200 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-bold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
        >
          {theme === 'dark' ? (
            <SunIcon className="h-5 w-5 text-emerald-400" />
          ) : (
            <MoonIcon className="h-5 w-5 text-emerald-600" />
          )}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* User Info */}
        <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-900 dark:border-gray-200">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase truncate">
            {user?.email || 'guest@sapres.sn'}
          </p>
          <p className="text-sm font-black text-gray-900 dark:text-white truncate capitalize">
            {user?.firstName} {user?.lastName}
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg font-bold text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
