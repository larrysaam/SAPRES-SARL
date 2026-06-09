import apiClient from './apiClient';
import type { Order, PaginatedResponse } from '../types';

const getOrders = async (params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Order>> => {
  const response = await apiClient.get('/orders', { params });
  return { data: response.data?.data || [], ...response.data };
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
