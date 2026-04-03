import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

/**
 * Global Axios Client
 * Handles default configs, authentication injection, and token refresh interceptors.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure typical Request interceptors (Token injection)
apiClient.interceptors.request.use(
  async (config) => {
    // Example: const token = await AsyncStorage.getItem('auth_token');
    // if (token) { config.headers.Authorization = `Bearer ${token}`; }
    return config;
  },
  (error) => Promise.reject(error)
);

// Configure Response interceptors (Error handling, Refresh tokens)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors globally
    return Promise.reject(error);
  }
);

export default apiClient;
