import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import paymentService from '../services/paymentService';
import type { Payment } from '../types';

const PaymentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: paymentsData, isLoading, error } = useQuery({
    queryKey: ['payments', page, statusFilter],
    queryFn: () => paymentService.getPayments({ page, limit: 10, status: statusFilter || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payment> }) => paymentService.updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment updated successfully');
      setIsDetailOpen(false);
    },
    onError: () => toast.error('Failed to update payment'),
  });

  const handleVerify = (payment: Payment) => {
    updateMutation.mutate({ id: payment._id, data: { status: 'successful' } as any });
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    successful: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  const columns: Column<Payment>[] = [
    { key: 'transactionReference', header: 'Transaction Ref', render: (p) => <span className="font-medium text-indigo-600 dark:text-indigo-400">{p.transactionReference || p._id?.slice(-8).toUpperCase()}</span> },
    { key: 'order', header: 'Order', render: (p) => {
      const order = typeof p.order === 'object' ? p.order : null;
      return <span>{order ? (order as any).orderNumber || '#' + (order as any)._id?.slice(-6) : p._id?.slice(-6)}</span>;
    }},
    { key: 'provider', header: 'Provider', render: (p) => <span className="capitalize">{p.provider || 'N/A'}</span> },
    { key: 'amount', header: 'Amount', render: (p) => <span className="font-medium">{p.amount?.toLocaleString()} XAF</span> },
    { key: 'status', header: 'Status', render: (p) => (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[p.status || 'pending']}`}>{p.status || 'pending'}</span>
    )},
    { key: 'createdAt', header: 'Date', render: (p) => p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Management</h1>

      <div className="flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="successful">Successful</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={paymentsData?.data || []}
        loading={isLoading}
        error={error ? 'Failed to load payments' : null}
        page={page}
        totalPages={paymentsData?.totalPages || 1}
        onPageChange={setPage}
        actions={(payment: Payment) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setSelectedPayment(payment); setIsDetailOpen(true); }}
              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400"
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            {payment.status === 'pending' && (
              <button
                onClick={() => handleVerify(payment)}
                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400"
                title="Verify & Confirm"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      />

      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedPayment(null); }} title="Payment Details" size="md">
        {selectedPayment && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Payment Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Reference:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedPayment.transactionReference || 'N/A'}</span>
                <span className="text-gray-500 dark:text-gray-400">Provider:</span>
                <span className="capitalize text-gray-900 dark:text-gray-100">{selectedPayment.provider || 'N/A'}</span>
                <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedPayment.amount?.toLocaleString()} XAF</span>
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block w-fit ${statusColors[selectedPayment.status || 'pending']}`}>{selectedPayment.status || 'pending'}</span>
                <span className="text-gray-500 dark:text-gray-400">Provider Ref:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedPayment.providerReference || '-'}</span>
              </div>
            </div>

            {selectedPayment.status === 'pending' && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    updateMutation.mutate({ id: selectedPayment._id, data: { status: 'successful' } as any });
                  }}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  {updateMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsPage;
