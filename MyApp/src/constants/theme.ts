export const COLORS = {
  primary: '#3B82F6',   // Blue 500
  secondary: '#8B5CF6', // Purple 500
  background: '#FAF9F6', // Neutral background
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E5E7EB',
};

export const SIZES = {
  base: 8,
  font: 14,
  radius: 8,
  padding: 16,
};

export const LIGHT_COLORS = {
  ...COLORS,
  background: '#FAF9F6',
  surface: '#FFFFFF',
  text: '#111827',
  subtext: '#6B7280',
  primary: '#4F46E5',
  border: '#E5E7EB',
  card: '#FFFFFF',
  faqAnswer: '#F0FDF4',
  iconBackground: '#F3F4F6',
  placeholder: '#94A3B8',
};

export const DARK_COLORS = {
  ...COLORS,
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  subtext: '#94A3B8',
  primary: '#818CF8',
  border: '#334155',
  card: '#1E293B',
  faqAnswer: '#1E40AF30',
  iconBackground: '#334155',
  placeholder: '#64748B',
};

export type ThemeMode = 'light' | 'dark' | 'system';
