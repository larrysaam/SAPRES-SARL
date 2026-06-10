import apiClient from './apiClient';
import type { Blog, PaginatedResponse } from '../types';

const getBlogs = async (params?: { page?: number; limit?: number; isPublished?: boolean }): Promise<PaginatedResponse<Blog>> => {
  const response = await apiClient.get('/blogs', { params });
  const result = response.data?.data || response.data;
  if (Array.isArray(result)) {
    return { success: true, message: 'Blogs retrieved', data: result as Blog[], page: 1, limit: 10, totalDocuments: 0, totalPages: 1 };
  }
  return {
    success: true,
    message: 'Blogs retrieved',
    data: (result?.data || result || []) as Blog[],
    page: result?.page || 1,
    limit: result?.limit || 10,
    totalDocuments: result?.total || result?.totalDocuments || 0,
    totalPages: result?.totalPages || 1,
  };
};

const getBlog = async (slug: string): Promise<Blog> => {
  const response = await apiClient.get(`/blogs/${slug}`);
  return response.data?.data || response.data;
};

const createBlog = async (blog: Partial<Blog>): Promise<Blog> => {
  const response = await apiClient.post('/blogs', blog);
  return response.data?.data || response.data;
};

const updateBlog = async (blogId: string, blog: Partial<Blog>): Promise<Blog> => {
  const response = await apiClient.put(`/blogs/${blogId}`, blog);
  return response.data?.data || response.data;
};

const deleteBlog = async (blogId: string): Promise<void> => {
  await apiClient.delete(`/blogs/${blogId}`);
};

const blogService = { getBlogs, getBlog, createBlog, updateBlog, deleteBlog };
export default blogService;
