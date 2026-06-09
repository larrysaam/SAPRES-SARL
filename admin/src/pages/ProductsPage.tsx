import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Skeleton from '../components/Skeleton';
import { toast } from '../components/Toast';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import type { Product, Category } from '../types';

type FormData = {
  name: string;
  sku: string;
  brand: string;
  category: string;
  price: number;
  discountPrice: number | '';
  stock: number;
  status: 'draft' | 'published' | 'archived';
  shortDescription: string;
  description: string;
  specifications: string;
  featured: boolean;
  currency: 'XAF' | 'USD' | 'EUR';
};

const emptyForm: FormData = {
  name: '',
  sku: '',
  brand: '',
  category: '',
  price: 0,
  discountPrice: '',
  stock: 0,
  status: 'draft',
  shortDescription: '',
  description: '',
  specifications: '[]',
  featured: false,
  currency: 'XAF',
};

const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ ...emptyForm });
  const [categoryName, setCategoryName] = useState('');

  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products', page, search, categoryFilter, statusFilter],
    queryFn: () =>
      productService.getProducts({
        page,
        limit: 10,
        search: search || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => productService.createProduct(data as Partial<Product>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
      setIsCreateOpen(false);
      setFormData({ ...emptyForm });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create product';
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      productService.updateProduct(id, data as Partial<Product>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
      setIsEditOpen(false);
      setSelectedProduct(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to update product';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
      setDeleteId(null);
      setIsDeleteOpen(false);
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      categoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
      setCategoryName('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create category');
    },
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      brand: product.brand || '',
      category: (product.category as Category)?._id || '',
      price: product.price || 0,
      discountPrice: product.discountPrice ?? '',
      stock: product.stock ?? 0,
      status: product.status || 'draft',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      specifications: JSON.stringify(product.specifications || [], null, 2),
      featured: product.featured ?? false,
      currency: product.currency || 'XAF',
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'price' || name === 'discountPrice' || name === 'stock') {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const buildPayload = (): Record<string, unknown> => {
    let specs: Record<string, string>[] = [];
    try {
      specs = JSON.parse(formData.specifications);
      if (!Array.isArray(specs)) specs = [];
    } catch {
      specs = [];
    }
    return {
      name: formData.name,
      sku: formData.sku,
      brand: formData.brand,
      category: formData.category,
      price: formData.price,
      discountPrice: formData.discountPrice === '' ? undefined : formData.discountPrice,
      stock: formData.stock,
      status: formData.status,
      shortDescription: formData.shortDescription,
      description: formData.description,
      specifications: specs,
      featured: formData.featured,
      currency: formData.currency,
    };
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(buildPayload());
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct?._id) {
      updateMutation.mutate({ id: selectedProduct._id, data: buildPayload() });
    }
  };

  const renderForm = (isEdit: boolean) => (
    <form onSubmit={isEdit ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleFormChange} required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU *</label>
          <input type="text" name="sku" value={formData.sku} onChange={handleFormChange} required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Brand *</label>
          <input type="text" name="brand" value={formData.brand} onChange={handleFormChange} required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category *</label>
          <select name="category" value={formData.category} onChange={handleFormChange} required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500">
            <option value="">Select a category</option>
            {(categories as Category[]).map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price *</label>
          <input type="number" name="price" value={formData.price || ''} onChange={handleFormChange} required min="0" step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Price</label>
          <input type="number" name="discountPrice" value={formData.discountPrice} onChange={handleFormChange} min="0" step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock *</label>
          <input type="number" name="stock" value={formData.stock} onChange={handleFormChange} required min="0"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select name="status" value={formData.status} onChange={handleFormChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
          <select name="currency" value={formData.currency} onChange={handleFormChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500">
            <option value="XAF">XAF</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Short Description *</label>
        <textarea name="shortDescription" value={formData.shortDescription} onChange={handleFormChange} required rows={2}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description *</label>
        <textarea name="description" value={formData.description} onChange={handleFormChange} required rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Specifications (JSON array)</label>
        <textarea name="specifications" value={formData.specifications} onChange={handleFormChange} rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-indigo-500"
          placeholder='[{"label": "Power", "value": "500W"}]' />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="featured" checked={formData.featured} onChange={handleFormChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured Product</label>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
          Cancel
        </button>
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {isEdit
            ? (updateMutation.isPending ? 'Saving...' : 'Update Product')
            : (createMutation.isPending ? 'Creating...' : 'Create Product')}
        </button>
      </div>
    </form>
  );

  const columns = [
    { key: 'name', header: 'Name', render: (p: Product) => <span className="font-medium">{p.name}</span> },
    { key: 'sku', header: 'SKU' },
    { key: 'brand', header: 'Brand' },
    {
      key: 'price', header: 'Price',
      render: (p: Product) => (
        <span>
          {p.discountPrice ? (
            <><span className="line-through text-gray-400 mr-1">{p.price?.toLocaleString()}</span><span className="text-green-600 dark:text-green-400 font-medium">{p.discountPrice?.toLocaleString()} XAF</span></>
          ) : <span>{p.price?.toLocaleString()} XAF</span>}
        </span>
      ),
    },
    { key: 'stock', header: 'Stock', render: (p: Product) => (
      <span className={p.stock !== undefined && p.stock < 10 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>{p.stock}</span>
    )},
    { key: 'category', header: 'Category', render: (p: Product) => <span>{(p.category as Category)?.name || 'N/A'}</span> },
    { key: 'status', header: 'Status', render: (p: Product) => {
      const colors: Record<string, string> = {
        published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      };
      return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[p.status] || colors.draft}`}>{p.status || 'draft'}</span>;
    }},
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
        <div className="flex gap-3">
          <button onClick={() => setIsCategoryOpen(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            Manage Categories
          </button>
          <button onClick={() => { setFormData({ ...emptyForm }); setIsCreateOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
            <PlusIcon className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option value="">All Categories</option>
          {(categories as Category[]).map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={productsData?.data || []}
        loading={productsLoading}
        error={productsError ? 'Failed to load products' : null}
        page={page}
        totalPages={productsData?.totalPages || 1}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        searchPlaceholder="Search products..."
        actions={(product: Product) => (
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400" title="Edit"><PencilIcon className="h-4 w-4" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(product._id!); }}
              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400" title="Delete"><TrashIcon className="h-4 w-4" /></button>
          </div>
        )}
      />

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Product" size="xl">
        {renderForm(false)}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setSelectedProduct(null); }} title="Edit Product" size="xl">
        {renderForm(true)}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setDeleteId(null); }} title="Delete Product" size="sm">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Are you sure you want to delete this product? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => { setIsDeleteOpen(false); setDeleteId(null); }}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}</button>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)} title="Manage Categories" size="lg">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Existing Categories</h3>
            {categoriesLoading ? (
              <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-3/4" /></div>
            ) : (categories as Category[]).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No categories yet. Create one below.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(categories as Category[]).map((cat) => (
                  <div key={cat._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span className="text-sm text-gray-900 dark:text-gray-100">{cat.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add New Category</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <input type="text" value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <button onClick={() => { if (categoryName.trim()) createCategoryMutation.mutate({ name: categoryName.trim() }); }}
                disabled={createCategoryMutation.isPending || !categoryName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {createCategoryMutation.isPending ? '...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsPage;
