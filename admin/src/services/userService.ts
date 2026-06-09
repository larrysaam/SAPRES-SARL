import apiClient from './apiClient';
import type { User, PaginatedResponse } from '../types';

const getUsers = async (params?: { page?: number; limit?: number; role?: string; isActive?: boolean }): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get('/users', { params });
  return { data: response.data?.data || [], ...response.data };
};

const getUser = async (userId: string): Promise<User> => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data?.data || response.data;
};

const createUser = async (user: { firstName: string; lastName: string; email: string; phone?: string; password: string; role: string }): Promise<User> => {
  const response = await apiClient.post('/users', user);
  return response.data?.data || response.data;
};

const updateUser = async (userId: string, user: Partial<User>): Promise<User> => {
  const response = await apiClient.put(`/users/${userId}`, user);
  return response.data?.data || response.data;
};

const updateUserStatus = async (userId: string, isActive: boolean): Promise<User> => {
  const response = await apiClient.patch(`/users/${userId}/status`, { isActive });
  return response.data?.data || response.data;
};

const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/users/${userId}`);
};

const userService = { getUsers, getUser, createUser, updateUser, updateUserStatus, deleteUser };
export default userService;
