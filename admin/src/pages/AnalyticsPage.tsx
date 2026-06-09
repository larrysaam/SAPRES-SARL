import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { CardSkeleton } from '../components/Skeleton';
import { toast } from '../components/Toast';
import dashboardService from '../services/dashboardService';
import productService from '../services/productService';
import orderService from '../services/orderService';
import type { DashboardStats } from '../types';

const AnalyticsPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getDashboardStats,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productService.getProducts({ limit: 100 }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'all'],
    queryFn: () => orderService.getOrders({ limit: 100 }),
  });

  const exportCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} exported`);
  };

  const maxRevenue = stats?.salesPerMonth ? Math.max(...stats.salesPerMonth.map((s) => s.revenue), 1) : 1;

  const totalProducts = productsData?.data?.length || 0;
  const totalStock = productsData?.data?.reduce((sum: number, p: any) => sum + (p.stock || 0), 0) || 0;
  const lowStockItems = productsData?.data?.filter((p: any) => p.stock <= 10).length || 0;
  const outOfStockItems = productsData?.data?.filter((p: any) => p.stock === 0).length || 0;

  const totalRevenue = stats?.totalSalesRevenue || 0;
  const totalOrders = stats?.totalOrders || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* Sales Reports */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Report</h2>
              <button
                onClick={() => exportCSV('sales-report', ['Metric', 'Value'], [['Total Revenue', totalRevenue.toString()], ['Total Orders', totalOrders.toString()], ['Average Order Value', avgOrderValue.toFixed(2)]])}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <ArrowDownTrayIcon className="h-4 w-4" /> Export CSV
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalRevenue.toLocaleString()} XAF</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalOrders}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Order Value</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{avgOrderValue.toLocaleString()} XAF</p>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Tracking</h2>
            {stats?.salesPerMonth && stats.salesPerMonth.length > 0 ? (
              <div className="flex items-end gap-3 h-48">
                {stats.salesPerMonth.map((item) => (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{item.revenue.toLocaleString()}</span>
                    <div className="w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-t relative" style={{ height: '100%' }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 dark:bg-indigo-400 rounded-t transition-all duration-500" style={{ height: `${(item.revenue / maxRevenue) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 truncate w-full text-center">{item.month}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 text-center py-8">No revenue data</p>}
          </div>

          {/* Best Selling Products */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Best Selling Products</h2>
              <button onClick={() => exportCSV('best-sellers', ['Product', 'Orders', 'Revenue'], [['Sample Product', '10', '500000']])} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><ArrowDownTrayIcon className="h-4 w-4" /> Export</button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Product sales data will appear here once orders are processed.</p>
          </div>

          {/* Inventory Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3"><p className="text-xs text-gray-500">Total Products</p><p className="text-lg font-bold text-gray-900 dark:text-white">{totalProducts}</p></div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3"><p className="text-xs text-gray-500">Total Stock</p><p className="text-lg font-bold text-gray-900 dark:text-white">{totalStock}</p></div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3"><p className="text-xs text-yellow-600">Low Stock Items</p><p className="text-lg font-bold text-yellow-700">{lowStockItems}</p></div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3"><p className="text-xs text-red-600">Out of Stock</p><p className="text-lg font-bold text-red-700">{outOfStockItems}</p></div>
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Reports</h2>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => exportCSV('sales-report-full', ['Metric', 'Value'], [['Total Sales', totalRevenue.toString()], ['Orders', totalOrders.toString()], ['Avg Value', avgOrderValue.toFixed(2)]])} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Sales Report (CSV)</button>
              <button onClick={() => exportCSV('inventory-report', ['Total Products', totalProducts.toString()], [['Total Stock', totalStock.toString()], ['Low Stock', lowStockItems.toString()], ['Out of Stock', outOfStockItems.toString()]])} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Inventory Report (CSV)</button>
              <button onClick={() => exportCSV('orders-report', ['Total', totalOrders.toString()], [['Pending', (stats?.pendingOrders || 0).toString()]])} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Orders Report (CSV)</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
