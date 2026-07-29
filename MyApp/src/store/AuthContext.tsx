import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, storeTokens, clearStoredTokens, getStoredTokens } from '../services/apiClient';
import { clearCache } from '../utils/cache';

import accountService from '../services/accountService';
import teacherService from '../services/teacherService';
import principalService from '../services/principalService';

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
  updateUser: (userUpdates: any) => void;
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

  const extractPhotoUrl = (obj: any): string | undefined => {
    if (!obj || typeof obj !== 'object') return undefined;
    const candidate =
      obj.photoUrl ||
      obj.avatarUrl ||
      obj.photo ||
      obj.avatar ||
      obj.logo ||
      obj.logoUrl ||
      obj.profilePhoto ||
      obj.profileImage ||
      obj.image ||
      obj.url;

    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      const trimmed = candidate.trim();
      if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('file://') ||
        trimmed.startsWith('data:')
      ) {
        return trimmed;
      }
      const baseDomain = 'https://www.sharnex.com';
      return trimmed.startsWith('/') ? `${baseDomain}${trimmed}` : `${baseDomain}/${trimmed}`;
    }
    return undefined;
  };

  const hydrateUserPhoto = async (userRole: Role, currentUser: any) => {
    try {
      if (!userRole) return;
      const normalizedRole = String(userRole || currentUser?.role || '').toLowerCase();
      let rawPhoto: string | undefined;

      if (normalizedRole === 'teacher' || normalizedRole === 'staff') {
        const [personalRes, profRes] = await Promise.all([
          teacherService.getPersonalInfo().catch(() => null),
          teacherService.getProfile().catch(() => null),
        ]);
        const pRaw = personalRes?.data?.data ?? personalRes?.data ?? {};
        const prRaw = profRes?.data?.data ?? profRes?.data ?? {};
        rawPhoto = extractPhotoUrl(pRaw) || extractPhotoUrl(prRaw);
      } else if (
        normalizedRole === 'institution' ||
        normalizedRole === 'principal' ||
        normalizedRole === 'institution_admin' ||
        normalizedRole === 'central_admin'
      ) {
        const [instRes, accRes] = await Promise.all([
          principalService.getInstitutionProfile().catch(() => null),
          accountService.getProfile().catch(() => null),
        ]);
        const instRaw = (instRes as any)?.data?.data ?? (instRes as any)?.data ?? instRes;
        const accRaw = accRes?.data?.data ?? accRes?.data ?? {};
        rawPhoto = extractPhotoUrl(instRaw) || extractPhotoUrl(accRaw);
      } else {
        const res = await accountService.getProfile().catch(() => null);
        const raw = res?.data?.data ?? res?.data ?? {};
        rawPhoto = extractPhotoUrl(raw);
      }

      if (rawPhoto) {
        updateUser({ photoUrl: rawPhoto, photoUpdatedAt: Date.now() });
      }
    } catch (err) {
      console.warn('[AuthContext] Photo hydration failed:', err);
    }
  };

  useEffect(() => {
    const loadStoredState = async () => {
      try {
        const storedStr = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (storedStr) {
          const parsed = JSON.parse(storedStr);
          if (parsed.token) {
            setAuthToken(parsed.token);
            const photoFromUser = extractPhotoUrl(parsed.user);
            const initialUser = photoFromUser && !parsed.user?.photoUrl
              ? { ...parsed.user, photoUrl: photoFromUser }
              : parsed.user;

            setAuthState({
              token: parsed.token,
              refreshToken: parsed.refreshToken || null,
              role: parsed.role,
              user: initialUser,
              isLoading: false,
            });

            hydrateUserPhoto(parsed.role, initialUser).catch(err =>
              console.warn('[AuthContext] Session-restore photo hydration failed:', err)
            );
            return;
          }
        }
        setAuthState(prev => ({ ...prev, isLoading: false }));
      } catch (e) {
        console.error('Failed to load auth state', e);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };
    loadStoredState();
  }, []);

  const login = async (accessToken: string, refreshToken: string, role: Role, user: any) => {
    try {
      const effectiveAccessToken = accessToken || "COOKIE_AUTH";
      const effectiveRefreshToken = refreshToken || "COOKIE_AUTH";

      await storeTokens(effectiveAccessToken, effectiveRefreshToken);

      const userPhoto = extractPhotoUrl(user);
      const initialUser = userPhoto && !user?.photoUrl ? { ...user, photoUrl: userPhoto } : user;

      const stateToStore = {
        token: effectiveAccessToken,
        refreshToken: effectiveRefreshToken,
        role,
        user: initialUser,
      };

      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(stateToStore)
      );

      setAuthState({
        token: effectiveAccessToken,
        refreshToken: effectiveRefreshToken,
        role,
        user: initialUser,
        isLoading: false,
      });

      setAuthToken(effectiveAccessToken);

      hydrateUserPhoto(role, initialUser).catch(err =>
        console.warn('[AuthContext] Login photo hydration failed:', err)
      );
    } catch (error) {
      console.error("Error during login:", error);
    }
  };
//changes till here
  const logout = async () => {
    try {
      // Clear all cached API data first — prevents stale data leaking
      // between sessions if a different teacher logs in next.
      clearCache();

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

  const updateUser = (userUpdates: any) => {
    setAuthState(prev => {
      if (!prev.user) return prev;
      
      const updatedUser = { ...prev.user, ...userUpdates };
      const nextState = { ...prev, user: updatedUser };
      
      // Persist the changes to async storage so it persists across reloads
      AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          token: nextState.token,
          refreshToken: nextState.refreshToken,
          role: nextState.role,
          user: updatedUser
        })
      ).catch(e => console.error('Error persisting updated user to storage', e));
      
      return nextState;
    });
  };

  const memoizedValue = React.useMemo(() => ({
    authState,
    login,
    logout,
    updateUser
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
