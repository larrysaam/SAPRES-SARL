import apiClient from './apiClient';
import type { Job, PaginatedResponse } from '../types';

const getJobs = async (params?: { page?: number; limit?: number; isActive?: boolean }): Promise<PaginatedResponse<Job>> => {
  const response = await apiClient.get('/jobs', { params });
  return { data: response.data?.data || [], ...response.data };
};

const getJob = async (slug: string): Promise<Job> => {
  const response = await apiClient.get(`/jobs/${slug}`);
  return response.data?.data || response.data;
};

const createJob = async (job: Partial<Job>): Promise<Job> => {
  const response = await apiClient.post('/jobs', job);
  return response.data?.data || response.data;
};

const updateJob = async (jobId: string, job: Partial<Job>): Promise<Job> => {
  const response = await apiClient.put(`/jobs/${jobId}`, job);
  return response.data?.data || response.data;
};

const deleteJob = async (jobId: string): Promise<void> => {
  await apiClient.delete(`/jobs/${jobId}`);
};

const jobService = { getJobs, getJob, createJob, updateJob, deleteJob };
export default jobService;
