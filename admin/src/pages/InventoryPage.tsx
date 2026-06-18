import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import Modal from '../components/Modal';
import toast from '../components/Toast';
import productService from '../services/productService';
import type { Product } from '../types';

type StockMovement = {
  _id: string;
  type: 'in' | 'out';
  quantity: number;
  productName: string;
  sku: string;
  note: string;
  date: string;
};

type Supplier = {
  _id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  productsSupplied: string[];
};

const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockOutModalOpen, setStockOutModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [stockNote, setStockNote] = useState<string>('');

  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productService.getProducts({ page, limit: 10, search }),
  });

  const products = productsData?.data || [];
  const totalPages = productsData?.totalPages || 1;

  // Mock stock movements data
  const [stockMovements] = useState<StockMovement[]>([
    { _id: '1', type: 'in', quantity: 50, productName: 'Product A', sku: 'SKU-A001', note: 'Restock from supplier', date: '2024-01-15' },
    { _id: '2', type: 'out', quantity: 10, productName: 'Product B', sku: 'SKU-B002', note: 'Customer order #1234', date: '2024-01-14' },
    { _id: '3', type: 'in', quantity: 100, productName: 'Product C', sku: 'SKU-C003', note: 'New shipment arrived', date: '2024-01-13' },
  ]);

  // Mock suppliers data
  const [suppliers] = useState<Supplier[]>([
    { _id: '1', name: 'Tech Supply Co.', contact: 'John Doe', email: 'john@techsupply.com', phone: '+237 612 345 678', productsSupplied: ['Product A', 'Product C'] },
    { _id: '2', name: 'Global Parts Ltd.', contact: 'Jane Smith', email: 'jane@globalparts.com', phone: '+237 698 765 432', productsSupplied: ['Product B'] },
  ]);

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, stock }: { productId: string; stock: number }) => {
      return productService.updateProduct(productId, { stock } as Partial<Product>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock updated successfully');
      setStockInModalOpen(false);
      setStockOutModalOpen(false);
      setStockQuantity(0);
      setStockNote('');
      setSelectedProduct('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update stock');
    },
  });

  const handleStockIn = () => {
    if (!selectedProduct || stockQuantity <= 0) {
      toast.warning('Please select a product and enter a valid quantity');
      return;
    }
    const product = products.find((p) => p._id === selectedProduct);
    if (product) {
      updateStockMutation.mutate({ productId: selectedProduct, stock: product.stock + stockQuantity });
    }
  };

  const handleStockOut = () => {
    if (!selectedProduct || stockQuantity <= 0) {
      toast.warning('Please select a product and enter a valid quantity');
      return;
    }
    const product = products.find((p) => p._id === selectedProduct);
    if (product && product.stock >= stockQuantity) {
      updateStockMutation.mutate({ productId: selectedProduct, stock: product.stock - stockQuantity });
    } else {
      toast.error('Insufficient stock');
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: 'Out of Stock', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    if (stock <= 10) return { label: 'Low Stock', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    return { label: 'In Stock', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  };

  const columns: Column<Product>[] = [
    { key: 'name', header: 'Product Name', render: (item) => <span className="font-medium">{item.name}</span> },
    { key: 'sku', header: 'SKU' },
    {
      key: 'stock',
      header: 'Current Stock',
      render: (item) => {
        const status = getStockStatus(item.stock);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.badge}`}>
            {item.stock <= 0 && <ExclamationTriangleIcon className="h-3.5 w-3.5" />}
            <span className={status.color}>{item.stock} units</span>
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const status = getStockStatus(item.stock);
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
            <span className={`h-2 w-2 rounded-full ${item.stock <= 0 ? 'bg-red-500' : item.stock <= 10 ? 'bg-yellow-500' : 'bg-green-500'}`} />
            {status.label}
          </span>
        );
      },
    },
  ];

  const movementColumns: Column<StockMovement>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'in' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
          {item.type === 'in' ? <ArrowUpIcon className="h-3.5 w-3.5" /> : <ArrowDownIcon className="h-3.5 w-3.5" />}
          {item.type === 'in' ? 'Stock In' : 'Stock Out'}
        </span>
      ),
    },
    { key: 'productName', header: 'Product' },
    { key: 'sku', header: 'SKU' },
    { key: 'quantity', header: 'Quantity', render: (item) => <span className="font-medium">{item.type === 'in' ? '+' : '-'}{item.quantity}</span> },
    { key: 'note', header: 'Note' },
    { key: 'date', header: 'Date' },
  ];

  const supplierColumns: Column<Supplier>[] = [
    { key: 'name', header: 'Name', render: (item) => <span className="font-medium">{item.name}</span> },
    { key: 'contact', header: 'Contact Person' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'productsSupplied', header: 'Products Supplied', render: (item) => (
      <div className="flex flex-wrap gap-1">
        {item.productsSupplied.map((p, i) => (
          <span key={i} className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{p}</span>
        ))}
      </div>
    )},
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track stock levels and manage inventory</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStockInModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            Stock In
          </button>
          <button
            onClick={() => setStockOutModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <ArrowDownIcon className="h-4 w-4" />
            Stock Out
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {products.filter((p) => p.stock <= 10).length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                Low Stock Alerts ({products.filter((p) => p.stock <= 10).length} products)
              </h3>
              <div className="mt-2 space-y-1">
                {products
                  .filter((p) => p.stock <= 10)
                  .sort((a, b) => a.stock - b.stock)
                  .slice(0, 5)
                  .map((p) => (
                    <p key={p._id} className="text-sm text-yellow-700 dark:text-yellow-400">
                      <span className="font-medium">{p.name}</span> — {p.stock} units remaining
                      {p.stock === 0 && <span className="text-red-600 dark:text-red-400 font-semibold"> (OUT OF STOCK)</span>}
                    </p>
                  ))}
                {products.filter((p) => p.stock <= 10).length > 5 && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">...and {products.filter((p) => p.stock <= 10).length - 5} more</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Stock Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />
            Product Stock
          </h2>
        </div>
        <DataTable
          columns={columns}
          data={products}
          loading={productsLoading}
          error={productsError ? 'Failed to load products' : null}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Search products..."
          emptyMessage="No products found"
        />
      </div>

      {/* Stock Movement History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowUpIcon className="h-5 w-5 text-gray-500" />
            Stock Movement History
          </h2>
        </div>
        <DataTable
          columns={movementColumns}
          data={stockMovements}
          loading={false}
          emptyMessage="No stock movements recorded"
        />
      </div>

      {/* Suppliers Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-gray-500" />
            Suppliers
          </h2>
        </div>
        <DataTable
          columns={supplierColumns}
          data={suppliers}
          loading={false}
          emptyMessage="No suppliers found"
        />
      </div>

      {/* Stock In Modal */}
      <Modal isOpen={stockInModalOpen} onClose={() => setStockInModalOpen(false)} title="Stock In" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a product...</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name} (SKU: {p.sku}) — Current: {p.stock}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity to Add</label>
            <input
              type="number"
              min="1"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter quantity"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note / Reason</label>
            <textarea
              value={stockNote}
              onChange={(e) => setStockNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Restock from supplier, warehouse transfer..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setStockInModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStockIn}
              disabled={updateStockMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {updateStockMutation.isPending ? 'Processing...' : 'Add Stock'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stock Out Modal */}
      <Modal isOpen={stockOutModalOpen} onClose={() => setStockOutModalOpen(false)} title="Stock Out" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a product...</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name} (SKU: {p.sku}) — Current: {p.stock}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity to Remove</label>
            <input
              type="number"
              min="1"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter quantity"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note / Reason</label>
            <textarea
              value={stockNote}
              onChange={(e) => setStockNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Damaged goods, customer return, expired..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setStockOutModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStockOut}
              disabled={updateStockMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {updateStockMutation.isPending ? 'Processing...' : 'Remove Stock'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;