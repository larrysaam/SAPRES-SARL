import apiClient from './apiClient';
import type { Product, PaginatedResponse } from '../types';

const getProducts = async (params?: { page?: number; limit?: number; search?: string; category?: string; featured?: boolean; status?: string }): Promise<PaginatedResponse<Product>> => {
  const response = await apiClient.get('/products', { params });
  return { data: response.data?.data || [], ...response.data };
};

const getProduct = async (slug: string): Promise<Product> => {
  const response = await apiClient.get(`/products/${slug}`);
  return response.data?.data || response.data;
};

const createProduct = async (product: Partial<Product>): Promise<Product> => {
  const response = await apiClient.post('/products', product);
  return response.data?.data || response.data;
};

const updateProduct = async (productId: string, product: Partial<Product>): Promise<Product> => {
  const response = await apiClient.put(`/products/${productId}`, product);
  return response.data?.data || response.data;
};

const deleteProduct = async (productId: string): Promise<void> => {
  await apiClient.delete(`/products/${productId}`);
};

const productService = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};

export default productService;
