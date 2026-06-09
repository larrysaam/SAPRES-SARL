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

const uploadImages = async (productId: string, images: { publicId: string; secureUrl: string; format: string; bytes: number }[]): Promise<{ images: any[] }> => {
  const response = await apiClient.post(`/products/${productId}/images`, { images });
  return response.data?.data || response.data;
};

const deleteImage = async (productId: string, publicId: string): Promise<void> => {
  await apiClient.delete(`/products/${productId}/images/${publicId}`);
};

const uploadDatasheet = async (productId: string, datasheet: { publicId: string; secureUrl: string; format: string; bytes: number }): Promise<{ datasheet: any }> => {
  const response = await apiClient.post(`/products/${productId}/datasheets`, { datasheet });
  return response.data?.data || response.data;
};

const productService = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  deleteImage,
  uploadDatasheet,
};

export default productService;
