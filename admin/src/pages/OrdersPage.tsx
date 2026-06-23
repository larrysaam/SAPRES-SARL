import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from '../components/Toast';
import orderService from '../services/orderService';
import type { Order } from '../types';

// Actual database statuses (uppercase for matching)
const ORDER_STATUSES = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// Helper function to format status to display format
const formatStatusDisplay = (status: string): string => {
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['orders', page, statusFilter, search],
    queryFn: () =>
      orderService.getOrders({
        page,
        limit: 10,
        status: statusFilter || undefined,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) =>
      orderService.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (selectedOrder) {
        orderService.getOrder(selectedOrder._id!).then((updated) => setSelectedOrder(updated));
      }
      toast.success('Order updated successfully');
      setUpdatingStatus(null);
    },
    onError: () => {
      toast.error('Failed to update order');
      setUpdatingStatus(null);
    },
  });

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    updateMutation.mutate({ id: orderId, data: { status: newStatus as any } });
  };

  const statusColors: Record<string, string> = {
    PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    PAID: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    PROCESSING: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    SHIPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (o: Order) => (
        <span className="font-medium text-indigo-600 dark:text-indigo-400">{o.orderNumber || o._id?.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o: Order) => {
        return <span>{o.customerName || o.customerEmail || 'N/A'}</span>;
      },
    },
    {
      key: 'total',
      header: 'Total',
      render: (o: Order) => <span className="font-medium">{o.total?.toLocaleString()} XAF</span>,
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      render: (o: Order) => <span className="capitalize">{o.paymentMethod || 'N/A'}</span>,
    },
    {
      key: 'orderStatus',
      header: 'Status',
      render: (o: Order) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[o.status || 'PENDING_PAYMENT']}`}>
          {formatStatusDisplay(o.status || 'PENDING_PAYMENT')}
        </span>
      ),
    },
    
    {
      key: 'createdAt',
      header: 'Date',
      render: (o: Order) => (
        <span className="text-gray-500 dark:text-gray-400">
          {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{formatStatusDisplay(s)}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={ordersData?.data || []}
        loading={isLoading}
        error={error ? 'Failed to load orders' : null}
        page={page}
        totalPages={ordersData?.totalPages || 1}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        actions={(order: Order) => (
          <button
            onClick={(e) => { e.stopPropagation(); handleViewDetails(order); }}
            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        )}
      />

      {/* Order Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedOrder(null); }} title={`Order #${selectedOrder?.orderNumber || selectedOrder?._id?.slice(-8).toUpperCase()}`} size="xl">
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status Update */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Update Status:</label>
              <select
                value={selectedOrder.status || 'PENDING_PAYMENT'}
                onChange={(e) => handleStatusChange(selectedOrder._id!, e.target.value)}
                disabled={updatingStatus === selectedOrder._id}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{formatStatusDisplay(s)}</option>
                ))}
              </select>
              {updatingStatus === selectedOrder._id && (
                <ArrowPathIcon className="h-4 w-4 animate-spin text-indigo-500" />
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Customer Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(selectedOrder as any).customer && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                    <span className="text-gray-900 dark:text-gray-100">{(selectedOrder as any).customer?.name || 'N/A'}</span>
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="text-gray-900 dark:text-gray-100">{(selectedOrder as any).customer?.email || 'N/A'}</span>
                    <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                    <span className="text-gray-900 dark:text-gray-100">{(selectedOrder as any).customer?.phone || 'N/A'}</span>
                  </>
                )}
                <span className="text-gray-500 dark:text-gray-400">Payment Method:</span>
                <span className="text-gray-900 dark:text-gray-100 capitalize">{selectedOrder.paymentMethod || 'N/A'}</span>
                <span className="text-gray-500 dark:text-gray-400">Payment Status:</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full inline-block w-fit ${paymentStatusColors[selectedOrder.paymentStatus || 'pending']}`}>
                  {selectedOrder.paymentStatus || 'pending'}
                </span>
              </div>
            </div>

            {/* Order Items */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.product?.name || item.name || 'Product'}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">{item.price?.toLocaleString()} XAF</td>
                          <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                            {((item.price || 0) * (item.quantity || 1)).toLocaleString()} XAF
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right text-gray-700 dark:text-gray-300">Total</td>
                        <td className="px-4 py-2 text-sm font-bold text-right text-gray-900 dark:text-white">
                          {selectedOrder.total?.toLocaleString()} XAF
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Timeline */}
            {(selectedOrder as any).timeline && (selectedOrder as any).timeline.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Order Timeline</h3>
                <div className="space-y-3">
                  {(selectedOrder as any).timeline.map((entry: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${entry.status === 'DELIVERED' || entry.status === 'PAID' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        {idx < (selectedOrder as any).timeline.length - 1 && <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {formatStatusDisplay(entry.status || entry.action || 'Update')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Payment Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Method:</span>
                <span className="text-gray-900 dark:text-gray-100 capitalize">{selectedOrder.paymentMethod || 'N/A'}</span>
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full inline-block w-fit ${paymentStatusColors[selectedOrder.paymentStatus || 'pending']}`}>
                  {selectedOrder.paymentStatus || 'pending'}
                </span>
                {(selectedOrder as any).paymentRef && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">Reference:</span>
                    <span className="text-gray-900 dark:text-gray-100">{(selectedOrder as any).paymentRef}</span>
                  </>
                )}
                <span className="text-gray-500 dark:text-gray-400">Total:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.total?.toLocaleString()} XAF</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersPage;
