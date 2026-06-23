export const LIBRARY_COLORS = {
  bg: '#0D1117',
  surface: '#111827',
  card: '#1A1F2E',
  border: '#2A3040',
  borderLight: '#1F2937',
  text: '#F1F5F9',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textDim: '#6B7280',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  indigo: '#6366F1',
  success: '#34D399',
  successBg: '#0A2E1A',
  successBorder: '#065F46',
  danger: '#F87171',
  dangerBg: '#3B1A1A',
  dangerBorder: '#7F1D1D',
  warning: '#F59E0B',
  warningBg: '#3B2A0A',
  purple: '#8B5CF6',
  purpleBg: '#2D1B4E',
  blueBg: '#1E3A5F',
  inputBg: '#111827',
  overlay: 'rgba(0,0,0,0.7)',
} as const;

export type AccentColor = 'blue' | 'purple' | 'red' | 'amber' | 'green';

export const ACCENT_MAP: Record<AccentColor, { bg: string; icon: string }> = {
  blue: { bg: LIBRARY_COLORS.blueBg, icon: LIBRARY_COLORS.primary },
  purple: { bg: LIBRARY_COLORS.purpleBg, icon: LIBRARY_COLORS.purple },
  red: { bg: LIBRARY_COLORS.dangerBg, icon: LIBRARY_COLORS.danger },
  amber: { bg: LIBRARY_COLORS.warningBg, icon: LIBRARY_COLORS.warning },
  green: { bg: LIBRARY_COLORS.successBg, icon: LIBRARY_COLORS.success },
};
