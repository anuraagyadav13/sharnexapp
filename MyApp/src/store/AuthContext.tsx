import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Enterprise Auth State Management
 * This context provides a global store for user authentication state (session tokens, role, user info).
 * Replace with Redux/Zustand if the application complexity scales significantly.
 */

type Role = 'student' | 'teacher' | 'principal' | null;

interface AuthState {
  token: string | null;
  role: Role;
  isLoading: boolean;
}

interface AuthContextType {
  authState: AuthState;
  login: (token: string, role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    role: null,
    isLoading: false,
  });

  const login = (token: string, role: Role) => {
    setAuthState({ token, role, isLoading: false });
  };

  const logout = () => {
    setAuthState({ token: null, role: null, isLoading: false });
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
