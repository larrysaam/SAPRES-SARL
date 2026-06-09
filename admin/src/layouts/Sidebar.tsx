import React from 'react';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  BellIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['super-admin', 'hr-admin', 'sales-admin', 'content-admin', 'inventory-admin'] },
    { name: 'Products', href: '/products', icon: CubeIcon, roles: ['super-admin', 'sales-admin', 'inventory-admin'] },
    { name: 'Orders', href: '/orders', icon: ShoppingCartIcon, roles: ['super-admin', 'sales-admin'] },
    { name: 'Payments', href: '/payments', icon: CreditCardIcon, roles: ['super-admin', 'sales-admin'] },
    { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon, roles: ['super-admin', 'inventory-admin'] },
    { name: 'Recruitment', href: '/recruitment', icon: UserGroupIcon, roles: ['super-admin', 'hr-admin'] },
    { name: 'Content', href: '/content', icon: DocumentTextIcon, roles: ['super-admin', 'content-admin'] },
    { name: 'Users', href: '/users', icon: UserGroupIcon, roles: ['super-admin'] },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['super-admin'] },
    { name: 'Notifications', href: '/notifications', icon: BellIcon, roles: ['super-admin', 'hr-admin', 'sales-admin', 'content-admin', 'inventory-admin'] },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, roles: ['super-admin', 'sales-admin'] },
  ];

  const filteredNavigation = navigation.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex flex-col w-64 bg-gray-800 text-white">
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <span className="text-2xl font-semibold">SAPRES Admin</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {filteredNavigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
          >
            <item.icon className="h-6 w-6 mr-3" aria-hidden="true" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="px-2 py-4">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
