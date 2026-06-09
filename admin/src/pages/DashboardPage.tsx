import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import dashboardService from '../services/dashboardService';
import Skeleton from '../components/Skeleton';
import type { DashboardStats } from '../types';

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getDashboardStats,
  });

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          Failed to load dashboard data. Please try again later.
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Sales Revenue',
      value: stats ? `${stats.totalSalesRevenue.toLocaleString()} XAF` : '...',
      icon: CurrencyDollarIcon,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? '...',
      icon: ShoppingCartIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Pending Orders',
      value: stats?.pendingOrders ?? '...',
      icon: ClockIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      label: 'Low Stock Alerts',
      value: stats?.lowStockAlerts?.length ?? '...',
      icon: ExclamationTriangleIcon,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'New Applications',
      value: stats?.newApplications ?? '...',
      icon: UserGroupIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  const maxSalesRevenue = stats?.salesPerMonth
    ? Math.max(...stats.salesPerMonth.map((s) => s.revenue), 1)
    : 1;
  const maxOrdersCount = stats?.ordersPerWeek
    ? Math.max(...stats.ordersPerWeek.map((o) => o.count), 1)
    : 1;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 space-y-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex items-center gap-4"
                >
                  <div className={`p-3 rounded-lg ${card.bg}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </p>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Per Month Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Sales Per Month
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : stats?.salesPerMonth && stats.salesPerMonth.length > 0 ? (
            <div className="flex items-end gap-3 h-48">
              {stats.salesPerMonth.map((item) => {
                const height = (item.revenue / maxSalesRevenue) * 100;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.revenue.toLocaleString()}
                    </span>
                    <div className="w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-t relative" style={{ height: '100%' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-indigo-500 dark:bg-indigo-400 rounded-t transition-all duration-500"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sales data available</p>
          )}
        </div>

        {/* Orders Per Week Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingCartIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Orders Per Week
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : stats?.ordersPerWeek && stats.ordersPerWeek.length > 0 ? (
            <div className="flex items-end gap-3 h-48">
              {stats.ordersPerWeek.map((item) => {
                const height = (item.count / maxOrdersCount) * 100;
                return (
                  <div key={item.week} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.count}</span>
                    <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-t relative" style={{ height: '100%' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-emerald-500 dark:bg-emerald-400 rounded-t transition-all duration-500"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                      {item.week}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No order data available</p>
          )}
        </div>
      </div>

      {/* Recent Activity and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.slice(0, 8).map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {activity.user?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{activity.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.user} &middot; {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            Low Stock Alerts
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
            <div className="space-y-3">
              {stats.lowStockAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{alert.productName}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Current stock: {alert.currentStock}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">
                    LOW
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No low stock alerts</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;