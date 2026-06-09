import apiClient from './apiClient';
import type { Application, PaginatedResponse } from '../types';

const getApplications = async (params?: { page?: number; limit?: number; status?: string; job?: string }): Promise<PaginatedResponse<Application>> => {
  const response = await apiClient.get('/applications', { params });
  return { data: response.data?.data || [], ...response.data };
};

const getApplication = async (id: string): Promise<Application> => {
  const response = await apiClient.get(`/applications/${id}`);
  return response.data?.data || response.data;
};

const updateApplication = async (id: string, data: Partial<Application>): Promise<Application> => {
  const response = await apiClient.put(`/applications/${id}`, data);
  return response.data?.data || response.data;
};

const deleteApplication = async (id: string): Promise<void> => {
  await apiClient.delete(`/applications/${id}`);
};

const applicationService = { getApplications, getApplication, updateApplication, deleteApplication };
export default applicationService;
