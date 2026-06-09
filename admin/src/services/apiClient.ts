import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.accessToken) {
          config.headers.Authorization = `Bearer ${user.accessToken}`;
        }
      } catch {
        // ignore parse error
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - try refresh
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.refreshToken) {
            const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
              refreshToken: user.refreshToken,
            });
            if (refreshRes.data?.data?.accessToken) {
              user.accessToken = refreshRes.data.data.accessToken;
              localStorage.setItem('user', JSON.stringify(user));
              // Retry original request
              error.config.headers.Authorization = `Bearer ${user.accessToken}`;
              return apiClient(error.config);
            }
          }
        } catch {
          // refresh failed
        }
      }
      // Clear auth and redirect
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
