import apiClient from './apiClient';
import type { Category } from '../types';

const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get('/categories');
  return response.data?.data || response.data || [];
};

const getCategory = async (slug: string): Promise<Category> => {
  const response = await apiClient.get(`/categories/${slug}`);
  return response.data?.data || response.data;
};

const createCategory = async (category: Partial<Category>): Promise<Category> => {
  const response = await apiClient.post('/categories', category);
  return response.data?.data || response.data;
};

const updateCategory = async (categoryId: string, category: Partial<Category>): Promise<Category> => {
  const response = await apiClient.put(`/categories/${categoryId}`, category);
  return response.data?.data || response.data;
};

const deleteCategory = async (categoryId: string): Promise<void> => {
  await apiClient.delete(`/categories/${categoryId}`);
};

const categoryService = { getCategories, getCategory, createCategory, updateCategory, deleteCategory };
export default categoryService;
