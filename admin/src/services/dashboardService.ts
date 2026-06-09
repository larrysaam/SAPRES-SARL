import apiClient from './apiClient';
import type { DashboardStats } from '../types';

const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data?.data || response.data;
};

const dashboardService = {
  getDashboardStats,
};

export default dashboardService;
