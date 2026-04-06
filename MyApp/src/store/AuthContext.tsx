import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/apiClient';

type Role = 'student' | 'teacher' | 'principal' | null;

interface AuthState {
  token: string | null;
  role: Role;
  user: any | null;
  isLoading: boolean;
}

interface AuthContextType {
  authState: AuthState;
  login: (token: string, role: Role, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@sharnex_auth_state';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
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

  const login = async (token: string, role: Role, user: any) => {
    setAuthToken(token);
    const newState = { token, role, user, isLoading: false };
    setAuthState(newState);
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save login state', e);
    }
  };

  const logout = async () => {
    setAuthToken(null);
    setAuthState({ token: null, role: null, user: null, isLoading: false });
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear auth state', e);
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
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
