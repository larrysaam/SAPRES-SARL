import React, { useState } from 'react';
import { TableSkeleton } from './Skeleton';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRowClick?: (item: T) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  error,
  onRowClick,
  page = 1,
  totalPages = 1,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Search...',
  actions,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };

  if (error) {
    return (
      <div className="brutal-card p-6">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <svg className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="font-bold text-sm">Error loading data</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="brutal-card overflow-hidden animate-pop-in">
      {/* Search */}
      {onSearch && (
        <div className="p-4 border-b-2 border-gray-900 dark:border-gray-200">
          <div className="relative max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-900 dark:border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 md:px-6 py-3.5 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="px-4 md:px-6 py-3.5 text-right text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 md:px-6 py-4">
                  <TableSkeleton rows={5} cols={columns.length} />
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 md:px-6 py-16">
                  <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <p className="font-bold text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item._id || idx}
                  onClick={() => onRowClick?.(item)}
                  className={`${
                    onRowClick ? 'cursor-pointer' : ''
                  } hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors duration-100 ${
                    idx % 2 === 0 ? 'bg-white dark:bg-gray-800/50' : 'bg-gray-50 dark:bg-gray-800/30'
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 md:px-6 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {col.render ? col.render(item) : item[col.key] ?? '-'}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 md:px-6 py-3.5 whitespace-nowrap text-right text-sm">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-t-2 border-gray-900 dark:border-gray-200 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold rounded-lg border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold rounded-lg border-2 border-gray-900 dark:border-gray-200 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
