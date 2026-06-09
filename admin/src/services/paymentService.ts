import apiClient from './apiClient';
import type { Payment, PaginatedResponse } from '../types';

const getPayments = async (params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Payment>> => {
  const response = await apiClient.get('/payments', { params });
  return { data: response.data?.data || [], ...response.data };
};

const getPayment = async (id: string): Promise<Payment> => {
  const response = await apiClient.get(`/payments/${id}`);
  return response.data?.data || response.data;
};

const updatePayment = async (id: string, data: Partial<Payment>): Promise<Payment> => {
  const response = await apiClient.put(`/payments/${id}`, data);
  return response.data?.data || response.data;
};

const paymentService = { getPayments, getPayment, updatePayment };
export default paymentService;
