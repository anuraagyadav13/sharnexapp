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
  ...BASE_COLORS,
  background: '#14121A',
  surface: '#1E1A29',
  surfaceHigh: '#272235',
  text: '#ECE9F4',
  subtext: '#B5B0C4',
  textSecondary: '#B5B0C4',
  placeholder: '#8A849B',

  primary: '#AD97E8',
  primaryBg: '#2E2745',
  primaryPressed: '#9680D6',
  onPrimary: '#1A1230',
  secondary: '#C9B9F2',
  secondaryBg: '#2E2745',
  accent: '#AD97E8',

  success: '#7BD3A0',
  successBg: '#1E3329',
  warning: '#E8C07A',
  warningBg: '#3A3020',
  danger: '#F28B9B',
  dangerBg: '#3D2229',
  info: '#8AB4F0',
  infoBg: '#1F2D45',

  border: '#332E42',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: '#000000',

  card: '#1E1A29',
  cardSurface: '#1E1A29',
  cardNested: '#272235',
  cardNestedBorder: '#332E42',

  iconBackground: '#2E2745',
  iconBoxPurpleBg: '#2E2745',
  iconBoxBlueBg: '#1F2D45',

  faqContainerBg: '#1E1A29',
  faqAnswer: '#1E1A29',
  faqBorder: '#332E42',

  heroBg: '#14121A',
  heroBorder: '#332E42',

  topRankingBg: '#2E2745',
  topRankingBorder: '#4A3F73',

  pillCompletedBg: '#2E2A3B',
  scheduleOngoingBg: '#2E2745',
  scheduleOngoingBorder: '#AD97E8',

  sparkle: '#AD97E8',
  gradHero: ['#2E2745', '#1E1A29'],
  gradHelp: ['#3A2F63', '#243456'],
  needHelpBtnText: '#1A1230',

  statusBarStyle: 'light-content',
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
