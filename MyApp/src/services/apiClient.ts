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

import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure typical Request interceptors (Token injection)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const authStateStr = await AsyncStorage.getItem('@sharnex_auth_state');
      if (authStateStr) {
        const authState = JSON.parse(authStateStr);
        if (authState.token) {
          config.headers.Authorization = `Bearer ${authState.token}`;
        }
      }
    } catch (e) {
      console.error('Error fetching token from storage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Configure Response interceptors (Error handling, Refresh tokens)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Potentially handle refresh token or logout here
      // For now, let's just clear storage and reject
      try {
        await AsyncStorage.removeItem('@sharnex_auth_state');
      } catch (e) {
        console.error('Error clearing auth state on 401', e);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Set the Bearer token for all subsequent requests
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;

