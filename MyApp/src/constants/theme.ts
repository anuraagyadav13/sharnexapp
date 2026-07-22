export const COLORS = {
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
};

export const SIZES = {
  base: 8,
  font: 14,
  radius: 8,
  padding: 16,
};

// Brand accent colours – constant in both modes (they are identity colours, not semantic)
export const BRAND = {
  accentPurple: '#A855F7',       // text / icon purple
  accentPurpleDark: '#7C3AED',   // button / badge background
  accentBlue: '#38BDF8',         // blue text / icon
  accentBlueDark: '#2563EB',     // blue pill background
  onAccent: '#FFFFFF',           // white on any accent background
  gradMotiStart: '#3B0764',      // motivational banner gradient start
  gradMotiEnd: '#2E1065',        // motivational banner gradient end
  gradHelpStart: '#581C87',      // need-help banner gradient start
  gradHelpEnd: '#1E40AF',        // need-help banner gradient end
  needHelpBtnText: '#4C1D95',    // contact support button text
};

export const LIGHT_COLORS = {
  ...COLORS,
  // --- base semantic ---
  background: '#F5F3FF',         // very light purple tint so hero banner feels warm in light mode
  surface: '#FFFFFF',
  text: '#111827',
  subtext: '#6B7280',
  primary: '#4F46E5',
  border: '#E5E7EB',
  card: '#FFFFFF',
  faqAnswer: '#F5F3FF',
  iconBackground: '#EDE9FE',     // light purple tint for icon boxes
  placeholder: '#94A3B8',
  // --- dashboard-specific surface layers ---
  heroBg: '#F5F3FF',             // hero banner background
  heroBorder: '#E9D5FF',         // hero separator line
  cardSurface: '#FFFFFF',        // main section cards
  cardNested: '#F9F5FF',         // inner row items (quiz rows, assignment rows)
  cardNestedBorder: '#E5E7EB',
  iconBoxPurpleBg: '#EDE9FE',    // purple icon box background
  iconBoxBlueBg: '#EFF6FF',      // blue icon box background
  topRankingBg: '#EDE9FE',       // top students outer container
  topRankingBorder: '#C4B5FD',
  pillCompletedBg: '#E5E7EB',    // completed schedule pill
  scheduleOngoingBg: '#FAF5FF',  // ongoing card tint
  scheduleOngoingBorder: '#7C3AED',
  faqContainerBg: '#FFFFFF',
  faqBorder: '#E5E7EB',
  sparkle: '#7C3AED',
  statusBarStyle: 'dark-content' as const,
};

export const DARK_COLORS = {
  ...COLORS,
  // --- base semantic ---
  background: '#0F0B1E',
  surface: '#1E293B',
  text: '#F8FAFC',
  subtext: '#94A3B8',
  primary: '#818CF8',
  border: '#334155',
  card: '#17122C',
  faqAnswer: '#120D24',
  iconBackground: '#26174A',
  placeholder: '#64748B',
  // --- dashboard-specific surface layers ---
  heroBg: '#0F0B1E',
  heroBorder: '#1A1433',
  cardSurface: '#17122C',
  cardNested: '#120D24',
  cardNestedBorder: '#271F42',
  iconBoxPurpleBg: '#26174A',
  iconBoxBlueBg: '#0F2942',
  topRankingBg: '#1E1B4B',
  topRankingBorder: '#3730A3',
  pillCompletedBg: '#3F3F46',
  scheduleOngoingBg: '#1D1435',
  scheduleOngoingBorder: '#7C3AED',
  faqContainerBg: '#17122C',
  faqBorder: '#271F42',
  sparkle: '#A855F7',
  statusBarStyle: 'light-content' as const,
};

export type ThemeMode = 'light' | 'dark' | 'system';
