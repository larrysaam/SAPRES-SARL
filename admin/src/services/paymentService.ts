import apiClient from './apiClient';
import type { Payment, PaginatedResponse } from '../types';

const getPayments = async (params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Payment>> => {
  const response = await apiClient.get('/payments', { params });
  // Backend wraps in ApiResponse: { success, message, data: { data: [...], pagination: { page, limit, total, pages } } }
  const apiData = response.data?.data;
  const payments = Array.isArray(apiData?.data) ? apiData.data : (Array.isArray(apiData) ? apiData : []);
  const pagination = apiData?.pagination || {};
  return {
    data: payments,
    page: pagination.page || 1,
    limit: pagination.limit || 10,
    totalDocuments: pagination.total || 0,
    totalPages: pagination.pages || 1,
    success: response.data?.success !== false,
    message: response.data?.message || 'Payments fetched successfully',
  };
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
