import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, storeTokens, clearStoredTokens, getStoredTokens } from '../services/apiClient';

type Role = 'student' | 'teacher' | 'principal' | null;

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  role: Role;
  user: any | null;
  isLoading: boolean;
}

interface AuthContextType {
  authState: AuthState;
  login: (accessToken: string, refreshToken: string, role: Role, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@auth_state';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    refreshToken: null,
    role: null,
    user: null,
    isLoading: true, // Start as true during initial recovery
  });

  useEffect(() => {
    const loadStoredState = async () => {
      try {
        const storedStr = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (storedStr) {
          const parsed = JSON.parse(storedStr);
          if (parsed.token) {
            setAuthToken(parsed.token);
            setAuthState({
              token: parsed.token,
              refreshToken: parsed.refreshToken || null,
              role: parsed.role,
              user: parsed.user,
              isLoading: false
            });
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };
    loadStoredState();
  }, []);

  const login = async (accessToken: string, refreshToken: string, role: Role, user: any) => {
    try {
      // Store tokens separately for apiClient
      await storeTokens(accessToken, refreshToken);

      // Store auth state
      const stateToStore = {
        token: accessToken,
        refreshToken,
        role,
        user,
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stateToStore));

      // Update context state
      setAuthState({
        token: accessToken,
        refreshToken,
        role,
        user,
        isLoading: false,
      });

      // Set token in axios defaults
      setAuthToken(accessToken);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = async () => {
    try {
      // Clear all stored tokens and state
      await clearStoredTokens();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);

      // Update context state
      setAuthState({
        token: null,
        refreshToken: null,
        role: null,
        user: null,
        isLoading: false,
      });

      // Clear axios defaults
      setAuthToken(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const memoizedValue = React.useMemo(() => ({
    authState,
    login,
    logout
  }), [authState]);

  return (
    <AuthContext.Provider value={memoizedValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
