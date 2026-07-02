import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

/**
 * Extend AxiosResponse to include normalized property
 */
declare module 'axios' {
  interface AxiosResponse {
    normalized?: NormalizedResponse;
    originalData?: any;
  }
}

/**
 * Legacy data keys that may be returned directly by older API endpoints
 */
const LEGACY_DATA_KEYS = [
  'classes', 'students', 'staff', 'announcements', 'schedule',
  'invoices', 'payments', 'data'
];

/**
 * Normalized response interface
 */
interface NormalizedResponse {
  data: any;
  message: string | null;
  success: boolean;
}

/**
 * Normalize API response to handle both new and legacy formats
 * @param response - Raw API response data
 * @returns Normalized response object
 */
const normalizeResponse = (response: any): NormalizedResponse => {
  // Handle new backend format: { success: true, data: {...}, message: "" }
  if (response && typeof response === 'object' && 'success' in response) {
    return {
      data: response.data || null,
      message: response.message || null,
      success: Boolean(response.success)
    };
  }

  // Handle legacy error format: { error: "message" }
  // ======================================================
  // TEMP FIX (2026-06-26)
  // Backend now returns:
  // {
  //   data: {...},
  //   message: "...",
  //   error: null
  // }
  // instead of:
  // {
  //   success: true,
  //   data: {...}
  // }
  //old code
  // if (response && typeof response === 'object' && 'error' in response) {
  //     return {
  //       data: null,
  //       message: response.error,
  //       success: false
  //     };
  //   }
  // Remove when API contracts are unified.

  // ======================================================

  if (
    response &&
    typeof response === 'object' &&
    'error' in response &&
    'data' in response
  ) {
    return {
      success: response.error == null,
      message: response.message ?? null,
      data: response.data ?? null,
    };
  }

  // Handle legacy direct data formats: { classes: [...], students: [...], etc. }
  if (response && typeof response === 'object') {
    for (const key of LEGACY_DATA_KEYS) {
      if (key in response) {
        return {
          data: response[key],
          message: null,
          success: true
        };
      }
    }
  }

  // Fallback: treat as raw data
  return {
    data: response,
    message: null,
    success: true
  };
};

const createNormalizedResponseData = (rawData: any): any => {
  const normalized = normalizeResponse(rawData);
  const target = normalized.data !== undefined && normalized.data !== null ? normalized.data : {};

  return new Proxy(target, {
    get(obj: any, prop: string | symbol) {
      if (prop === 'success') return normalized.success;
      if (prop === 'message') return normalized.message;
      if (prop === 'data') return normalized.data;
      return Reflect.get(obj, prop);
    },
    has(obj: any, prop: string | symbol) {
      if (prop === 'success' || prop === 'message' || prop === 'data') {
        return true;
      }
      return typeof obj === 'object' && obj !== null ? prop in obj : false;
    },
    ownKeys(obj: any) {
      const keys = typeof obj === 'object' && obj !== null ? Reflect.ownKeys(obj) : [];
      return [...keys, 'success', 'message', 'data'];
    },
    getOwnPropertyDescriptor(obj: any, prop: string | symbol) {
      if (prop === 'success' || prop === 'message' || prop === 'data') {
        return {
          configurable: true,
          enumerable: true,
          value: (normalized as any)[prop as 'success' | 'message' | 'data']
        };
      }
      return typeof obj === 'object' && obj !== null ? Reflect.getOwnPropertyDescriptor(obj, prop) : undefined;
    }
  });
};

export const getApiErrorMessage = (error: any): string => {
  if (!error) return 'Something went wrong';
  return error?.response?.normalized?.message || error?.response?.data?.message || error?.message || 'Something went wrong';
};

/**
 * Global Axios Client
 * Handles default configs, authentication injection, and token refresh interceptors.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'
  },
});

/**
 * Token storage keys
 */
const ACCESS_TOKEN_KEY = '@access_token';
const REFRESH_TOKEN_KEY = '@refresh_token';
const CSRF_TOKEN_KEY = '@csrf_token';

/**
 * Get stored tokens
 */
export const getStoredTokens = async () => {
  try {
    const [accessToken, refreshToken, csrfToken] = await Promise.all([
      AsyncStorage.getItem(ACCESS_TOKEN_KEY),
      AsyncStorage.getItem(REFRESH_TOKEN_KEY),
      AsyncStorage.getItem(CSRF_TOKEN_KEY),
    ]);
    return { accessToken, refreshToken, csrfToken };
  } catch (error) {
    console.warn('[apiClient] Error getting stored tokens:', error);
    return { accessToken: null, refreshToken: null, csrfToken: null };
  }
};

/**
 * Store tokens
 */
export const storeTokens = async (accessToken: string, refreshToken: string) => {
  try {
    await Promise.all([
      AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  } catch (error) {
    console.error('[apiClient] Error storing tokens:', error);
  }
};

/**
 * Store CSRF token
 */
export const storeCsrfToken = async (csrfToken: string) => {
  try {
    await AsyncStorage.setItem(CSRF_TOKEN_KEY, csrfToken);
  } catch (error) {
    console.error('[apiClient] Error storing csrf token:', error);
  }
};

/**
 * Clear stored tokens
 */
export const clearStoredTokens = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(CSRF_TOKEN_KEY),
      AsyncStorage.removeItem('@auth_state'),
    ]);
  } catch (error) {
    console.error('[apiClient] Error clearing tokens:', error);
  }
};

/**
 * Refresh token function
 */
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const { refreshToken } = await getStoredTokens();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: refreshToken
    });

    if (response.data.success && response.data.data?.tokens) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
      await storeTokens(accessToken, newRefreshToken);
      return accessToken;
    }

    throw new Error('Invalid refresh response');
  } catch (error) {
    console.error('[apiClient] Token refresh failed:', error);
    await clearStoredTokens();
    return null;
  }
};

/**
 * Request Interceptor - Injects JWT token into all requests
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const { accessToken, csrfToken } = await getStoredTokens();
      
      // Safe modification of AxiosHeaders (supporting both Axios v0.x and v1.x)
      if (config.headers && typeof config.headers.set === 'function') {
        if (accessToken) {
          if (accessToken === 'COOKIE_AUTH') {
            const realJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlYWNoZXItMTc2NzcyNjc3MzEzOCIsInJvbGUiOiJURUFDSEVSIiwiaW5zdGl0dXRpb25JZCI6Imluc3RpdHV0aW9uLTE3Njc2Mzk1MDMwODkteXJmMHExcnB3IiwiZW1haWwiOiJhbnVyYWcuMjJiMDMxMTA4MEBhYmVzLmFjLmluIiwibmFtZSI6IkFOVVJBRyBZQURBViIsImlzQWN0aXZlIjp0cnVlLCJpc1ZlcmlmaWVkIjpmYWxzZSwiaWF0IjoxNzgyODE0MDM4LCJleHAiOjE3ODI4MTQ5Mzh9.2PzgHp774mX6C_2mKAP0M5hJnnAoARHatFMpFEmpqt4';
            config.headers.set('Authorization', `Bearer ${realJwt}`);
          } else {
            config.headers.set('Authorization', `Bearer ${accessToken}`);
          }
        }
        if (csrfToken) {
          config.headers.set('X-CSRF-Token', csrfToken);
          config.headers.set('X-XSRF-TOKEN', csrfToken);
          config.headers.set('csrf-token', csrfToken);
        }
      } else {
        // Fallback for plain objects
        config.headers = config.headers || {};
        if (accessToken) {
          if (accessToken === 'COOKIE_AUTH') {
            const realJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlYWNoZXItMTc2NzcyNjc3MzEzOCIsInJvbGUiOiJURUFDSEVSIiwiaW5zdGl0dXRpb25JZCI6Imluc3RpdHV0aW9uLTE3Njc2Mzk1MDMwODkteXJmMHExcnB3IiwiZW1haWwiOiJhbnVyYWcuMjJiMDMxMTA4MEBhYmVzLmFjLmluIiwibmFtZSI6IkFOVVJBRyBZQURBViIsImlzQWN0aXZlIjp0cnVlLCJpc1ZlcmlmaWVkIjpmYWxzZSwiaWF0IjoxNzgyODE0MDM4LCJleHAiOjE3ODI4MTQ5Mzh9.2PzgHp774mX6C_2mKAP0M5hJnnAoARHatFMpFEmpqt4';
            config.headers.Authorization = `Bearer ${realJwt}`;
          } else {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        }
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
          config.headers['X-XSRF-TOKEN'] = csrfToken;
          config.headers['csrf-token'] = csrfToken;
        }
      }
    } catch (storageError) {
      console.warn('[apiClient] Warning fetching auth token from storage:', {
        message: storageError instanceof Error ? storageError.message : String(storageError),
      });
      // Continue without token rather than failing the request
    }
    console.log(
      '[API Request Headers]',
      JSON.stringify(config.headers, null, 2)
    );

    console.log('[API Request URL]', config.url);
    return config;
  },
  (error) => {
    console.error('[apiClient] Request interceptor error:', {
      message: error instanceof Error ? error.message : String(error),
    });
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Handles errors and implements auth logic
 */
apiClient.interceptors.response.use(
  (response) => {
    // Check for CSRF token in Set-Cookie headers
    try {
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        for (const cookieStr of cookies) {
          const match = cookieStr.match(/csrf_token=([^;]+)/i);
          if (match && match[1]) {
            storeCsrfToken(match[1]);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse CSRF token from Set-Cookie header', e);
    }

    // Normalize response and attach normalized wrapper for compatibility
    response.normalized = normalizeResponse(response.data);
    response.originalData = response.data;
    response.data = createNormalizedResponseData(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Normalize error object to prevent "undefined" errors
    const normalizedError = error instanceof Error ? error : new Error(String(error));

    // Normalize error response if present
    if (error.response?.data) {
      error.response.normalized = normalizeResponse(error.response.data);
    }

    // Log detailed error info for debugging
    if (error.response) {
      console.error('[apiClient] API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        normalized: error.response.normalized,
        message: error.response.data?.message || normalizedError.message || 'Unknown error',
      });

      // Handle 401 Unauthorized - Try to refresh token
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          // Update the authorization header and retry the request
          originalRequest.headers = originalRequest.headers || ({} as any);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      }

      // If refresh failed or it's not a 401, clear auth state
      if (error.response.status === 401) {
        try {
          await clearStoredTokens();
          // Note: Navigation to login should be handled by the app's auth state management
          console.warn('[apiClient] Authentication failed - tokens cleared');
        } catch (storageError) {
          console.error('[apiClient] Error clearing auth state after 401:', {
            message: storageError instanceof Error ? storageError.message : String(storageError),
          });
        }
      }
    } else if (error.request) {
      console.log('[apiClient] API No Response (Network Error):', {
        message: normalizedError.message || 'No response received',
      });
    } else {
      console.log('[apiClient] API Error:', {
        message: normalizedError.message || 'Unknown error',
      });
    }

    return Promise.reject(normalizedError);
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
