import apiClient from './apiClient';
import type { Order, PaginatedResponse } from '../types';

const getOrders = async (params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Order>> => {
  const response = await apiClient.get('/orders', { params });
  // Backend wraps in ApiResponse: { success, message, data: { data: [...], pagination: { page, limit, total, pages } } }
  const apiData = response.data?.data;
  const orders = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);
  const pagination = apiData?.pagination || {};
  return {
    data: orders,
    page: pagination.page || (response.data?.page || 1),
    limit: pagination.limit || (response.data?.limit || 10),
    totalDocuments: pagination.total || (response.data?.total || 0),
    totalPages: pagination.pages || (response.data?.pages || 1),
    success: response.data?.success !== false,
    message: response.data?.message || 'Orders fetched successfully',
  };
};

const getOrder = async (id: string): Promise<Order> => {
  const response = await apiClient.get(`/orders/${id}`);
  return response.data?.data || response.data;
};

const updateOrder = async (id: string, data: Partial<Order>): Promise<Order> => {
  const response = await apiClient.patch(`/orders/${id}`, data);
  return response.data?.data || response.data;
};

const deleteOrder = async (id: string): Promise<void> => {
  await apiClient.delete(`/orders/${id}`);
};

const orderService = {
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
};

export default orderService;
