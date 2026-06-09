import apiClient from './apiClient';
import type { AuthResponse, User } from '../types';

const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', { email, password });
  const data: AuthResponse = response.data?.data || response.data;
  if (data.accessToken) {
    localStorage.setItem('user', JSON.stringify(data));
  }
  return data;
};

const refreshToken = async (refreshToken: string): Promise<string> => {
  const response = await apiClient.post('/auth/refresh-token', { refreshToken });
  return response.data?.data?.accessToken || response.data?.accessToken;
};

const logout = (): void => {
  localStorage.removeItem('user');
};

const getMe = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me');
  return response.data?.data || response.data;
};

const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await apiClient.put('/auth/change-password', { currentPassword, newPassword });
};

const forgotPassword = async (email: string): Promise<void> => {
  await apiClient.post('/auth/forgot-password', { email });
};

const resetPassword = async (token: string, password: string): Promise<void> => {
  await apiClient.post('/auth/reset-password', { token, password });
};

const authService = {
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};

export default authService;
