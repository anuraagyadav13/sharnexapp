import { Theme as NavigationTheme } from '@react-navigation/native';
export type Theme = ThemeTokens;

export interface ThemeTokens {
  background: string;
  surface: string;
  surfaceHigh: string;
  text: string;
  subtext: string;
  textSecondary: string;
  placeholder: string;

  primary: string;
  primaryBg: string;
  primaryPressed: string;
  onPrimary: string;
  secondary: string;
  secondaryBg: string;
  accent: string;

  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  info: string;
  infoBg: string;

  border: string;
  overlay: string;
  shadow: string;

  card: string;
  cardSurface: string;
  cardNested: string;
  cardNestedBorder: string;

  iconBackground: string;
  iconBoxPurpleBg: string;
  iconBoxBlueBg: string;

  faqContainerBg: string;
  faqAnswer: string;
  faqBorder: string;

  heroBg: string;
  heroBorder: string;

  topRankingBg: string;
  topRankingBorder: string;

  pillCompletedBg: string;
  scheduleOngoingBg: string;
  scheduleOngoingBorder: string;

  sparkle: string;
  gradHero: string[];
  gradHelp: string[];
  needHelpBtnText: string;

  statusBarStyle: 'dark-content' | 'light-content';
}

export const SIZES = {
  base: 8,
  font: 14,
  radius: 8,
  padding: 16,
};

// Base semantic colors (used internally to build palettes)
const BASE_COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  background: '#FAF9F6',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E5E7EB',
  onPrimary: '#FFFFFF',
};

export const LIGHT_COLORS: ThemeTokens = {
  ...BASE_COLORS,
  background: '#F5F3FF',
  surface: '#FFFFFF',
  surfaceHigh: '#FFFFFF',
  text: '#111827',
  subtext: '#6B7280',
  textSecondary: '#6B7280',
  placeholder: '#94A3B8',

  primary: '#4F46E5',
  primaryBg: '#EDE9FE',
  primaryPressed: '#4338CA',
  onPrimary: '#FFFFFF',
  secondary: '#8B5CF6',
  secondaryBg: '#F3F4F6',
  accent: '#7C3AED',

  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  info: '#3B82F6',
  infoBg: '#EFF6FF',

  border: '#E5E7EB',
  overlay: 'rgba(0,0,0,0.5)',
  shadow: '#000000',

  card: '#FFFFFF',
  cardSurface: '#FFFFFF',
  cardNested: '#F9F5FF',
  cardNestedBorder: '#E5E7EB',

  iconBackground: '#EDE9FE',
  iconBoxPurpleBg: '#EDE9FE',
  iconBoxBlueBg: '#EFF6FF',

  faqContainerBg: '#FFFFFF',
  faqAnswer: '#F5F3FF',
  faqBorder: '#E5E7EB',

  heroBg: '#F5F3FF',
  heroBorder: '#E9D5FF',

  topRankingBg: '#EDE9FE',
  topRankingBorder: '#C4B5FD',

  pillCompletedBg: '#E5E7EB',
  scheduleOngoingBg: '#FAF5FF',
  scheduleOngoingBorder: '#7C3AED',

  sparkle: '#7C3AED',
  gradHero: ['#3B0764', '#2E1065'],
  gradHelp: ['#581C87', '#1E40AF'],
  needHelpBtnText: '#4C1D95',

  statusBarStyle: 'dark-content',
};

export const DARK_COLORS: ThemeTokens = {
  background: '#1D1930',
  surface: '#2A2440',
  surfaceHigh: '#362F52',
  text: '#EFEBFA',
  subtext: '#BFB8D6',
  textSecondary: '#BFB8D6',
  placeholder: '#A098BE',

  primary: '#9a7ceeff',
  primaryPressed: '#A58CEB',
  accent: '#B9A3F5',
  onPrimary: '#1F1440',
  secondary: '#D8CCFA',

  primaryBg: '#403568',
  iconBackground: '#403568',
  iconBoxPurpleBg: '#403568',
  topRankingBg: '#403568',
  scheduleOngoingBg: '#403568',
  secondaryBg: '#403568',

  success: '#7BD3A0',
  successBg: '#37404F',
  warning: '#E8C07A',
  warningBg: '#483D49',
  danger: '#F28B9B',
  dangerBg: '#4A344F',
  info: '#8AB4F0',
  infoBg: '#393B5C',
  iconBoxBlueBg: '#393B5C',

  sparkle: '#B9A3F5',
  topRankingBorder: '#5E5390',
  pillCompletedBg: '#3A3454',
  scheduleOngoingBorder: '#B9A3F5',
  heroBg: '#1D1930',
  faqAnswer: '#1D1930',

  border: '#4A4268',
  cardNestedBorder: '#4A4268',
  faqBorder: '#4A4268',
  heroBorder: '#4A4268',
  card: '#2A2440',
  cardSurface: '#2A2440',
  cardNested: '#362F52',
  faqContainerBg: '#2A2440',

  overlay: 'rgba(10,6,20,0.65)',
  shadow: '#000000',
  statusBarStyle: 'light-content',

  gradHero: ['#403568', '#2A2440'],
  gradHelp: ['#4B3A7A', '#2E3D6B'],
  needHelpBtnText: '#1F1440'
};

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Convert a hex color (#RGB, #RRGGBB) or existing rgba() string to rgba with given alpha [0–1].
 * Use this everywhere instead of `theme.X + '15'` string suffix hacks.
 */
export function withAlpha(color: string, alpha: number): string {
  if (!color) return `rgba(0,0,0,${alpha})`;
  if (color.startsWith('rgba(')) {
    // Replace the existing alpha
    return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
  }
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const buildNavigationTheme = (tokens: ThemeTokens, isDark: boolean): NavigationTheme => ({
  dark: isDark,
  colors: {
    primary: tokens.primary,
    background: tokens.background,
    card: tokens.surface,
    text: tokens.text,
    border: tokens.border,
    notification: tokens.danger,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
});
