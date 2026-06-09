import apiClient from './apiClient';
import type { Settings } from '../types';

const getSettings = async (): Promise<Settings> => {
  const response = await apiClient.get('/settings');
  return response.data?.data || response.data;
};

const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  const response = await apiClient.put('/settings', settings);
  return response.data?.data || response.data;
};

const settingsService = { getSettings, updateSettings };
export default settingsService;
