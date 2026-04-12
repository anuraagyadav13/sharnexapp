import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export const COLORS = {
  light: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    subtext: '#6B7280',
    primary: '#4F46E5',
    border: '#F1F5F9',
    card: '#FFFFFF',
    faqAnswer: '#F0FDF4',
    iconBackground: '#F3F4F6',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    subtext: '#94A3B8',
    primary: '#818CF8',
    border: '#334155',
    card: '#1E293B',
    faqAnswer: '#1E40AF30', // Subtle indigo tint
    iconBackground: '#334155',
  }
};

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  theme: typeof COLORS.light;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDarkMode(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
