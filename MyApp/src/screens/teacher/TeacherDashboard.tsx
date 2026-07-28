import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Dimensions,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, {
  FadeInUp,
  FadeInDown,
  Layout,
  LinearTransition,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  useSharedValue,
} from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { TeacherHeader } from '../../components/TeacherHeader';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import teacherService from '../../services/teacherService';
import { API_BASE_URL } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import { fetchWithCache, CACHE_KEYS, TTL } from '../../utils/cache';

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL COLOUR PALETTE — scoped to dark mode for this screen
// Light mode reads directly from theme.* tokens from ThemeContext
// ─────────────────────────────────────────────────────────────────────────────
const TD = {
  bg: '#0F0B1E',              // page background
  surface: '#17122C',         // card surface
  surfaceRaised: '#1E1A35',   // elevated card / inner row
  border: '#271F42',          // card border
  accentPurple: '#A855F7',    // purple text / icons
  accentPurpleDark: '#7C3AED',// purple buttons / chips
  accentBlue: '#38BDF8',      // blue accents
  heroGrad1: '#3B0764',       // hero gradient start
  heroGrad2: '#1E1652',       // hero gradient end
  pillChipBg: '#26174A',      // icon-chip background for section headers
  scheduleCard: '#1C1732',    // schedule card background
  scheduleBorder: '#2A2050',  // schedule card border
  taskCard: '#17122C',        // task card
  faqCard: '#17122C',         // faq outer card
  faqBorder: '#271F42',       // faq row separator
  pendingAmber: '#D97706',    // "Pending" pill amber
  pendingAmberBg: '#3B2800',  // "Pending" pill background
  upNextAmber: '#F59E0B',     // "Up next" text
  muted: '#94A3B8',           // muted / subtext
  carouselBg: '#130F25',      // carousel area background
};

const PILL_GREEN = '#059669';
const PILL_PINK = '#D946EF';

// Screen width for carousel calculations
const SCREEN_W = Dimensions.get('window').width;
const CARD_H_PADDING = 40; // horizontal padding inside the hero card
const CAROUSEL_W = SCREEN_W - CARD_H_PADDING; // card's inner width minus padding

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
};

const formatHeroDate = (): string => {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = days[now.getDay()];
  const month = months[now.getMonth()];
  const date = now.getDate();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day}, ${month} ${date} • ${hours}:${minutes} ${ampm}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// SectionChip — reusable icon-chip header pattern (Sections 3-5)
// ─────────────────────────────────────────────────────────────────────────────
const SectionChip = ({
  iconName,
  label,
  iconLibrary = 'MaterialCommunityIcons',
}: {
  iconName: string;
  label: string;
  iconLibrary?: 'Ionicons' | 'MaterialCommunityIcons';
}) => {
  const { theme, isDarkMode } = useTheme();
  const Icon = iconLibrary === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
  const chipBg = isDarkMode ? TD.pillChipBg : theme.iconBackground;
  const purpleColor = isDarkMode ? TD.accentPurple : theme.primary;
  return (
    <View style={chipStyles.row}>
      <View style={[chipStyles.chip, { backgroundColor: chipBg }]}>
        <Icon name={iconName} size={18} color={purpleColor} />
      </View>
      <Text style={[chipStyles.label, { color: isDarkMode ? TD.accentPurple : theme.text }]}>{label}</Text>
    </View>
  );
};

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  chip: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontSize: 18, fontWeight: '800' },
});

// ─────────────────────────────────────────────────────────────────────────────
// HeroCarousel — 3-slide swipeable image carousel
// ─────────────────────────────────────────────────────────────────────────────
const CAROUSEL_IMAGES = [
  require('../../assets/animationpic1.jpg'),
  require('../../assets/animationpic2.jpg'),
  require('../../assets/animationpic3.jpg'),
];

const HeroCarousel = () => {
  const { theme, isDarkMode } = useTheme();
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const manualScrolling = useRef(false);

  const advance = useCallback(() => {
    if (manualScrolling.current) return;
    setActiveIdx(prev => {
      const next = (prev + 1) % CAROUSEL_IMAGES.length;
      scrollRef.current?.scrollTo({ x: next * CAROUSEL_W, animated: true });
      return next;
    });
  }, []);

  useEffect(() => {
    autoTimer.current = setInterval(advance, 4000);
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [advance]);

  const carouselBg = isDarkMode ? TD.carouselBg : 'rgba(255,255,255,0.15)';
  const dotActiveColor = isDarkMode ? TD.accentBlue : '#FFFFFF';
  const dotColor = isDarkMode ? '#4B3F72' : 'rgba(255,255,255,0.4)';
  const textureColor = isDarkMode ? TD.accentPurple : '#FFFFFF';

  return (
    <View style={[carouselStyles.wrapper, { backgroundColor: carouselBg }]}>
      {/* Dotted/grid paper background texture */}
      <View style={StyleSheet.absoluteFill}>
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 12 }).map((__, col) => (
            <View
              key={`${row}-${col}`}
              style={[
                carouselStyles.textureDot,
                {
                  top: row * 22 + 8,
                  left: col * 28 + 8,
                  backgroundColor: textureColor,
                  opacity: isDarkMode ? 0.15 : 0.25,
                },
              ]}
            />
          ))
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: CAROUSEL_W }}
        onScrollBeginDrag={() => { manualScrolling.current = true; }}
        onMomentumScrollEnd={e => {
          manualScrolling.current = false;
          const idx = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_W);
          setActiveIdx(idx);
        }}
      >
        {CAROUSEL_IMAGES.map((src, i) => (
          <View key={i} style={carouselStyles.slide}>
            <Image source={src} style={carouselStyles.img} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={carouselStyles.dotsRow}>
        {CAROUSEL_IMAGES.map((_, i) => (
          <View
            key={i}
            style={[
              carouselStyles.dot,
              { backgroundColor: dotColor },
              i === activeIdx ? [carouselStyles.dotActive, { backgroundColor: dotActiveColor }] : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const carouselStyles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 12,
    minHeight: 200,
  },
  textureDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  slide: {
    width: CAROUSEL_W,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  img: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
const DashboardSkeleton = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Skeleton width={30} height={30} borderRadius={6} />
        <Skeleton width="40%" height={24} borderRadius={6} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>
      <View style={styles.section}>
        <Skeleton width="100%" height={380} borderRadius={20} />
      </View>
      <View style={styles.section}>
        <Skeleton width={140} height={20} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={100} borderRadius={16} />
        <View style={{ height: 12 }} />
        <Skeleton width="100%" height={100} borderRadius={16} />
      </View>
      <View style={styles.section}>
        <Skeleton width={140} height={20} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={80} borderRadius={16} />
        <View style={{ height: 12 }} />
        <Skeleton width="100%" height={80} borderRadius={16} />
      </View>
    </ScrollView>
  );
};

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TeacherDashboard'>;
interface Props { navigation: DashboardNavigationProp; }

const IconBox = ({ name, color = '#fff', bgColor, size = 50, iconSize = 24, iconLibrary = 'Ionicons' }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const IconComponent = iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.iconBox, { width: size, height: size, backgroundColor: bgColor }]}>
      <IconComponent name={name} size={iconSize} color={color} />
    </View>
  );
};

const ActivityItem = ({ iconName, iconBgColor, name, action, time, isLast, iconLibrary = 'Ionicons' }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const IconComponent = iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.activityItem, !isLast && styles.activityItemBorder]}>
      <View style={[styles.activityAvatarBox, { backgroundColor: iconBgColor }]}>
        <IconComponent name={iconName} size={14} color="#FFF" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityName}>{name}</Text>
        <Text style={styles.activityAction} numberOfLines={2}>{action}</Text>
        <Text style={styles.activityDateText}>{time}</Text>
      </View>
    </View>
  );
};

const StatCard = ({ title, value, color, icon }: { title: string; value: string | number; color: string; icon: string }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
    </View>
  );
};

const QuickActionCard = ({ title, iconName, bgColor, delay, onPress, iconLibrary = 'Ionicons', badge }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.quickActionCard}>
      <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress} style={styles.quickActionTouchable}>
        <View>
          <IconBox name={iconName} bgColor={bgColor} iconLibrary={iconLibrary} />
          {!!badge && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Restyled ScheduleCard — mode responsive
const ScheduleCard = ({ time, title, classSection, room, color, status, isOngoing }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const isUpcoming = status === 'Upcoming';
  const isCompleted = status === 'Completed';
  return (
    <View style={[styles.scheduleCard, isOngoing ? styles.scheduleCardOngoing : null]}>
      {/* Left accent bar */}
      <View style={[styles.scheduleAccentBar, { backgroundColor: color }]} />
      <View style={styles.scheduleBody}>
        <Text style={styles.scheduleTime}>{time}</Text>
        <View style={styles.schedulePillRow}>
          <View style={[styles.schedulePill, { backgroundColor: color }]}>
            <Text style={styles.schedulePillText}>{title}</Text>
          </View>
          {isOngoing && (
            <View style={styles.statusRowInline}>
              <View style={[styles.ongoingDot, { backgroundColor: color }]} />
              <Text style={[styles.ongoingText, { color }]}>Ongoing</Text>
            </View>
          )}
          {isUpcoming && (
            <View style={styles.statusRowInline}>
              <Text style={styles.upNextCircle}>○</Text>
              <Text style={styles.upNextText}>Up next</Text>
            </View>
          )}
          {isCompleted && (
            <View style={styles.statusRowInline}>
              <Ionicons name="checkmark" size={12} color={styles.completedText.color} />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>
        <Text style={styles.scheduleTeacherName}>{classSection}</Text>
        <Text style={styles.scheduleRoomText}>{room}</Text>
      </View>
    </View>
  );
};

const LiveSessionBanner = ({ subject, classSection, time, color }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const shimmerValue = useSharedValue(0);
  useEffect(() => {
    shimmerValue.value = withRepeat(withTiming(1, { duration: 2500 }), -1, false);
  }, []);
  const animatedShimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerValue.value, [0, 1], [-100, 250]) }],
    opacity: interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.8, 0.3]),
  }));
  return (
    <Animated.View entering={FadeInUp.springify()} style={[styles.liveBanner, { borderLeftColor: color }]}>
      <View style={styles.liveBannerContent}>
        <View style={styles.liveIndicatorRow}>
          <View style={[styles.liveDot, { backgroundColor: color }]} />
          <Text style={[styles.liveText, { color }]}>CLASS IN PROGRESS</Text>
        </View>
        <Text style={styles.liveSubject}>{subject}</Text>
        <Text style={styles.liveClassName}>{classSection} • {time}</Text>
        <View style={styles.liveProgressContainer}>
          <View style={[styles.liveProgressFill, { width: '45%', backgroundColor: color }]}>
            <Animated.View style={[styles.shimmerStreak, animatedShimmerStyle]} />
          </View>
        </View>
      </View>
      <TouchableOpacity style={[styles.liveJoinBtn, { backgroundColor: color }]}>
        <Text style={styles.liveJoinBtnText}>Start</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const EventCard = ({ title, date, color }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  return (
    <View style={[styles.eventCard, { borderLeftColor: color }]}>
      <View style={styles.eventCardContent}>
        <Text style={styles.eventTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.eventDateContainer}>
          <Ionicons name="calendar-outline" size={12} color={styles.eventDateText.color} />
          <Text style={styles.eventDateText}>{date}</Text>
        </View>
      </View>
    </View>
  );
};

const TopStudentCard = ({ rank, name, className, percentage }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  return (
    <View style={styles.topStudentCard}>
      <View style={[styles.rankCircle, { backgroundColor: rank === 1 ? '#FEF3C7' : isDarkMode ? '#334155' : '#F3F4F6' }]}>
        <Text style={[styles.rankText, { color: rank === 1 ? '#D97706' : styles.topStudentName.color }]}>{rank}</Text>
      </View>
      <View style={styles.topStudentInfo}>
        <Text style={styles.topStudentName} numberOfLines={1}>{name}</Text>
        <Text style={styles.topStudentClass}>{className}</Text>
      </View>
      <Text style={styles.topStudentPercentage}>{percentage}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────
const HELP_CENTER_DATA = [
  { title: 'Getting Started', desc: 'Learn the basics of Sharnex and how to navigate the dashboard.', icon: 'check-circle-outline', color: '#3B82F6', iconLib: 'MaterialCommunityIcons' },
  { title: 'Managing Grades', desc: 'Learn how to add, edit, and manage student grades and report cards.', icon: 'chart-bar', color: '#10B981', iconLib: 'MaterialCommunityIcons' },
  { title: 'Attendance Tracking', desc: 'Learn how to mark attendance, generate reports, and manage absences.', icon: 'calendar-check', color: '#F59E0B', iconLib: 'MaterialCommunityIcons' },
  { title: 'Assignment & Homework', desc: 'Create, assign, and track assignments and homework for students.', icon: 'clipboard-text-outline', color: '#8B5CF6', iconLib: 'MaterialCommunityIcons' },
  { title: 'Report & Analytics', desc: 'Generate performance reports and analyze student data.', icon: 'chart-pie', color: '#06B6D4', iconLib: 'MaterialCommunityIcons' },
  { title: 'Technical Support', desc: 'Troubleshooting login issues, app problems, and technical questions.', icon: 'monitor-cellphone', color: '#EF4444', iconLib: 'MaterialCommunityIcons' },
];

const FAQ_DATA = [
  { question: 'How do I add a new student to the system?', answer: 'Navigate to the Students section, click "Add New Student", fill in the required information, and submit the form.' },
  { question: 'How can I generate attendance reports?', answer: 'Go to the Attendance page, select the date range and class, then click "Generate Report" to download the attendance data.' },
  { question: 'How do I schedule parent-teacher meetings?', answer: 'Use the Calendar feature to create events, select "Parent-Teacher Meeting" as the event type, and invite parents through the system.' },
  { question: 'Can I customize the grading system?', answer: 'Yes, you can customize grading scales and weightings in the Settings section under "Grading Preferences".' },
  { question: 'How do I submit an assignment online?', answer: 'Go to the Assignments page, select the assignment, upload your files, and click "Submit". Make sure to submit before the deadline.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const TeacherDashboard: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = useState(true);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const buildHeaders = useCallback((token: string | null) => ({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  }), []);

  const resolveToken = useCallback((rawToken: string | null) => {
    if (rawToken === 'COOKIE_AUTH') {
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlYWNoZXItMTc2NzcyNjc3MzEzOCIsInJvbGUiOiJURUFDSEVSIiwiaW5zdGl0dXRpb25JZCI6Imluc3RpdHV0aW9uLTE3Njc6Mzk1MDMwODkteXJmMHExcnB3IiwiZW1haWwiOiJhbnVyYWcuMjJiMDMxMTA4MEBhYmVzLmFjLmluIiwibmFtZSI6IkFOVVJBRyBZQURBViIsImlzQWN0aXZlIjp0cnVlLCJpc1ZlcmlmaWVkIjpmYWxzZSwiaWF0IjoxNzgyODE0MDM4LCJleHAiOjE3ODI4MTQ5Mzh9.2PzgHp774mX6C_2mKAP0M5hJnnAoARHatFMpFEmpqt4';
    }
    return rawToken;
  }, []);

  // ─── Phase 1: critical fast data ────────────────────────────────────────────
  const fetchCritical = useCallback(async (headers: Record<string, string>, teacherId: string, forceRefresh: boolean) => {
    const profileFetcher = async () => {
      const res = await fetch(`${API_BASE_URL}/account/teacher/profile`, { method: 'GET', headers });
      if (!res.ok) throw new Error(`profile HTTP ${res.status}`);
      const raw = await res.json();
      return raw?.data ?? raw;
    };
    const [summaryRes, tasksRes, profileResult] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/teachers/${teacherId}/dashboard-summary`, { method: 'GET', headers }),
      fetch(`${API_BASE_URL}/teachers/${teacherId}/pending-tasks`, { method: 'GET', headers }),
      fetchWithCache(CACHE_KEYS.TEACHER_PROFILE, profileFetcher, TTL.PROFILE, forceRefresh),
    ]);
    let summaryData: any = null;
    if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
      try { const raw = await summaryRes.value.json(); summaryData = raw?.data ?? raw; } catch { }
    }
    let tasksData: any[] = [];
    if (tasksRes.status === 'fulfilled' && tasksRes.value.ok) {
      try {
        const raw = await tasksRes.value.json();
        const payload = raw?.data ?? raw;
        tasksData = Array.isArray(payload) ? payload : (payload?.tasks ?? []);
      } catch { }
    }
    const profileDataObj: any = profileResult.status === 'fulfilled' ? profileResult.value : null;
    setDashboardData(summaryData);
    setPendingTasks(tasksData);
    setProfileData(profileDataObj);
  }, []);

  // ─── Phase 2a: schedule ──────────────────────────────────────────────────────
  const fetchSchedule = useCallback(async (headers: Record<string, string>, teacherId: string, todayDateStr: string, today: Date, forceRefresh: boolean) => {
    setIsScheduleLoading(true);
    try {
      const periodsFetcher = async () => {
        const res = await fetch(`${API_BASE_URL}/timetable/periods`, { method: 'GET', headers });
        if (!res.ok) throw new Error(`periods HTTP ${res.status}`);
        const raw = await res.json();
        const payload = raw?.data ?? raw;
        return payload?.periods ?? (Array.isArray(payload) ? payload : []);
      };
      const [scheduleRes, periodsResult] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/teachers/${teacherId}/schedule?date=${todayDateStr}`, { method: 'GET', headers }),
        fetchWithCache(CACHE_KEYS.PERIODS, periodsFetcher, TTL.PERIODS, forceRefresh),
      ]);
      let scheduleData: any[] = [];
      if (scheduleRes.status === 'fulfilled' && scheduleRes.value.ok) {
        try {
          const raw = await scheduleRes.value.json();
          const payload = raw?.data ?? raw;
          scheduleData = Array.isArray(payload) ? payload : (payload?.schedule ?? []);
        } catch { }
      }
      const periodsData: any[] = periodsResult.status === 'fulfilled' ? (periodsResult.value ?? []) : [];
      let finalSchedule: any[] = scheduleData;
      if (periodsData.length > 0) {
        finalSchedule = periodsData.map((period: any) => {
          if (period.is_break) return { ...period, type: 'BREAK' };
          const assigned = scheduleData.find((s: any) => s.period_id === period.id);
          if (assigned) return { ...period, ...assigned, type: 'CLASS' };
          return { ...period, type: 'FREE' };
        });
      }
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      const processedSchedule = finalSchedule.map((item: any) => {
        if (item.is_break || item.type === 'BREAK') return { ...item, status: 'Break' };
        if (item.type !== 'CLASS' || !item.start_time || !item.end_time) return item;
        try {
          const [startH, startM] = item.start_time.split(':').map(Number);
          const [endH, endM] = item.end_time.split(':').map(Number);
          const startMin = startH * 60 + startM;
          const endMin = endH * 60 + endM;
          const isOngoing = nowMinutes >= startMin && nowMinutes <= endMin;
          const isCompleted = nowMinutes > endMin;
          return { ...item, status: isOngoing ? 'Ongoing' : (isCompleted ? 'Completed' : 'Upcoming') };
        } catch { return item; }
      });
      setTodaySchedule(processedSchedule);
    } catch (err: any) {
      console.error('[Dashboard] Schedule fetch error:', err?.message);
    } finally {
      setIsScheduleLoading(false);
    }
  }, []);

  // ─── Phase 2b: announcements ─────────────────────────────────────────────────
  const fetchAnnouncements = useCallback(async (headers: Record<string, string>) => {
    setIsAnnouncementsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/announcements`, { method: 'GET', headers });
      if (res.ok) {
        try {
          const raw = await res.json();
          const payload = raw?.data ?? raw;
          const list = Array.isArray(payload) ? payload : (payload?.announcements ?? []);
          setAnnouncements(list);
        } catch { }
      }
    } catch (err: any) {
      console.error('[Dashboard] Announcements fetch error:', err?.message);
    } finally {
      setIsAnnouncementsLoading(false);
    }
  }, []);

  // ─── Orchestrator ────────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      const teacherId = authState.user?.id;
      if (!teacherId) { setError('Teacher ID not found'); return; }
      const today = new Date();
      const todayDateStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-');
      const token = resolveToken(authState.token);
      const headers = buildHeaders(token);
      await fetchCritical(headers, teacherId, forceRefresh);
      setIsLoading(false);
      await Promise.allSettled([
        fetchSchedule(headers, teacherId, todayDateStr, today, forceRefresh),
        fetchAnnouncements(headers),
      ]);
    } catch (err: any) {
      console.error('[TeacherDashboard] fetchDashboard failed:', err);
      setError('Failed to sync dashboard data with server.');
      setIsLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [authState.user?.id, authState.token, buildHeaders, resolveToken, fetchCritical, fetchSchedule, fetchAnnouncements]);

  useEffect(() => {
    setIsLoading(true);
    setIsScheduleLoading(true);
    setIsAnnouncementsLoading(true);
    fetchDashboard(false);
  }, [fetchDashboard]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setIsScheduleLoading(true);
    setIsAnnouncementsLoading(true);
    await fetchDashboard(true);
  }, [fetchDashboard]);

  // ─── Memoized derived values ─────────────────────────────────────────────────
  const ongoingSession = useMemo(
    () => todaySchedule.find((s: any) => s.status === 'Ongoing') ?? null,
    [todaySchedule],
  );
  const classCount = useMemo(
    () => todaySchedule.filter((s: any) => s.type === 'CLASS').length,
    [todaySchedule],
  );

  // ─── Navigation handlers ─────────────────────────────────────────────────────
  const handleGoToAttendance = useCallback(() => navigation.navigate('TeacherAttendance'), [navigation]);
  const handleGoToAssignments = useCallback(() => navigation.navigate('TeacherAssignment'), [navigation]);
  const handleGoToQuiz = useCallback(() => navigation.navigate('TeacherQuiz'), [navigation]);
  const handleGoToPerformance = useCallback(() => navigation.navigate('TeacherPerformance'), [navigation]);
  const handleGoToMaterials = useCallback(() => navigation.navigate('TeacherStudyMaterial'), [navigation]);
  const handleGoToEquipment = useCallback(() => navigation.navigate('TeacherEquipment'), [navigation]);
  const handleGoToTimetable = useCallback(() => navigation.navigate('TeacherTimetable'), [navigation]);
  const handleGoToExamRecords = useCallback(() => navigation.navigate('TeacherResultManagement'), [navigation]);
  const handleGoToAccountSettings = useCallback(() => navigation.navigate('AccountSettings'), [navigation]);
  const handleOpenDrawer = useCallback(() => setDrawerOpen(true), []);
  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);
  const handleToggleFaq = useCallback((idx: number) =>
    setExpandedFaq(prev => prev === idx ? null : idx), []);
  const teacherFirstName = authState.user?.name?.split(' ')[0] || '';

  // Hero date/greeting — computed once per render (static per mount, no ticker needed)
  const heroDate = useMemo(formatHeroDate, []);
  const greeting = useMemo(getGreeting, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[isDarkMode ? TD.accentPurple : theme.primary]}
              tintColor={isDarkMode ? TD.accentPurple : theme.primary}
            />
          }
        >
          {/* ── HEADER (untouched) ─────────────────────────────────────────── */}
          <TeacherHeader
            title={teacherFirstName ? `Welcome back, ${teacherFirstName}` : 'Welcome back'}
            navigation={navigation}
            onMenuPress={handleOpenDrawer}
            isDashboard={true}
          />

          {/* ── SECTION 1: HERO GREETING CARD ─────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.heroCard}>
              {/* SVG gradient background */}
              <View style={StyleSheet.absoluteFill}>
                <Svg height="100%" width="100%">
                  <Defs>
                    <SvgLinearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0" stopColor={isDarkMode ? TD.heroGrad1 : '#6D28D9'} stopOpacity="1" />
                      <Stop offset="1" stopColor={isDarkMode ? TD.heroGrad2 : '#4C1D95'} stopOpacity="1" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#heroGrad)" rx="20" ry="20" />
                </Svg>
              </View>

              {/* Date pill */}
              <View style={styles.heroPill}>
                <View style={styles.heroPillDot} />
                <Text style={styles.heroPillText}>{heroDate}</Text>
              </View>

              {/* Greeting */}
              <Text style={styles.heroGreeting}>{greeting}</Text>

              {/* First name with underline */}
              <View>
                <Text style={styles.heroName}>{teacherFirstName || 'Teacher'}</Text>
                <View style={styles.heroNameUnderline} />
              </View>

              {/* Subtitle */}
              <Text style={styles.heroSubtitle}>
                Here's your schedule, pending tasks, and everything else you need — all in one place.
              </Text>

              {/* "TODAY'S PERIODS" label + legend dots */}
              <View style={styles.heroPeriodsRow}>
                <Text style={styles.heroPeriodsLabel}>TODAY'S PERIODS</Text>
                <View style={[styles.heroLegendDot, { backgroundColor: PILL_GREEN }]} />
                <View style={[styles.heroLegendDot, { backgroundColor: PILL_PINK }]} />
              </View>

              {/* Pills row */}
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{classCount} classes today</Text>
                </View>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>
                    {ongoingSession
                      ? `${ongoingSession.subject_name || 'class'} in progress`
                      : 'no class right now'}
                  </Text>
                </View>
              </View>

              {/* Carousel */}
              <HeroCarousel />
            </View>
          </View>

          {/* Live session banner (if ongoing) */}
          {ongoingSession && (
            <View style={styles.section}>
              <LiveSessionBanner
                subject={ongoingSession.subject_name || ongoingSession.type}
                classSection={ongoingSession.class_name}
                time={`${ongoingSession.start_time} - ${ongoingSession.end_time}`}
                color={PILL_PINK}
              />
            </View>
          )}



          {/* ── SECTION 2: TODAY'S SCHEDULE ───────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.scheduleSectionTitle}>Today's Schedule</Text>
            <View style={styles.scheduleList}>
              {isScheduleLoading ? (
                <View style={{ gap: 12 }}>
                  <Skeleton width="100%" height={100} borderRadius={16} />
                  <Skeleton width="100%" height={100} borderRadius={16} />
                  <Skeleton width="100%" height={100} borderRadius={16} />
                </View>
              ) : todaySchedule?.length === 0 ? (
                <Text style={styles.emptyText}>No classes scheduled for today.</Text>
              ) : (
                todaySchedule?.map((item: any, index: number) => (
                  <ScheduleCard
                    key={index}
                    time={`${item.start_time} - ${item.end_time}`}
                    title={item.subject_name || item.type}
                    classSection={`${item.class_name}`}
                    room={`Class ${item.section || item.room_name || 'Classroom'}`}
                    color={index % 2 === 0 ? PILL_GREEN : PILL_PINK}
                    isOngoing={item.status === 'Ongoing'}
                    status={item.status}
                  />
                ))
              )}
            </View>
          </View>

          {/* ── SECTION 3: PENDING TASKS ──────────────────────────────────── */}
          <View style={styles.section}>
            <SectionChip iconName="clipboard-check-outline" label="Pending Tasks" />
            <View style={styles.pendingTasksList}>
              {isLoading ? (
                <View style={{ gap: 10 }}>
                  <Skeleton width="100%" height={70} borderRadius={16} />
                  <Skeleton width="100%" height={70} borderRadius={16} />
                </View>
              ) : pendingTasks.length === 0 ? (
                <View style={styles.pendingTasksCard}>
                  <Text style={styles.pendingTasksText}>No pending tasks!</Text>
                </View>
              ) : (
                pendingTasks.map((task, index) => (
                  <TouchableOpacity
                    key={task.id}
                    onPress={() => {
                      if (task.type === 'marking') {
                        navigation.navigate('TeacherMarksEntry', {
                          examId: task.data?.examId || task.data?.exam_id || '',
                          classId: task.data?.classId || task.data?.class_id || '',
                          subjectId: task.data?.subjectId || task.data?.subject_id || '',
                          examName: task.data?.examName || task.data?.exam_name || 'Examination',
                          className: task.data?.className || task.data?.class_name || 'Class',
                          subjectName: task.data?.subjectName || task.data?.subject_name || 'Subject',
                        });
                      } else if (task.type === 'review') {
                        navigation.navigate('TeacherReviewSubmission', {
                          examId: task.data?.exam_id || task.data?.examId || '',
                          classId: task.data?.class_id || task.data?.classId || '',
                          examName: task.data?.exam_name || task.data?.examName || 'Examination',
                          className: task.data?.class_name || task.data?.className || 'Class',
                        });
                      } else if (task.type === 'assignment') {
                        navigation.navigate('TeacherViewSubmission', {
                          assignmentId: task.data?.id || task.data?.assignmentId || '',
                          classId: task.data?.classId || task.data?.class_id || '',
                          title: task.data?.title || 'Assignment',
                          className: task.data?.class || task.data?.className || 'Class',
                        });
                      } else if (task.type === 'quiz-live') {
                        navigation.navigate('TeacherMonitorLive', { quizId: task.data.id });
                      } else if (task.type === 'quiz-result') {
                        navigation.navigate('TeacherViewQuizResult', { quizId: task.data.id });
                      } else if (task.type === 'quiz-draft') {
                        navigation.navigate('TeacherCreateQuiz', { quizId: task.data.id });
                      } else if (task.type === 'substitution') {
                        // @ts-ignore
                        navigation.navigate('TeacherTimetable');
                      }
                    }}
                  >
                    <Animated.View entering={FadeInUp.delay(index * 100).springify()} style={styles.taskCard}>
                      {/* Outlined circle icon */}
                      <View style={styles.taskRingIcon} />
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                        {/* Pending amber pill */}
                        <View style={styles.taskPendingPill}>
                          <Text style={styles.taskPendingText}>Pending</Text>
                        </View>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>





          {/* ── SECTION 4: TEACHER HELP CENTER ────────────────────────────── */}
          <View style={styles.section}>
            <SectionChip iconName="school-outline" label="Teacher Help Center" />
            <View style={styles.helpList}>
              {HELP_CENTER_DATA.map((item, index) => {
                const Icon = item.iconLib === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.helpCard}
                    onPress={() => Linking.openURL('https://sharnex.com/support').catch(err => console.error('Failed to open support guides:', err))}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.helpIconBg, { backgroundColor: `${item.color}20` }]}>
                      <Icon name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text style={styles.helpCardTitle}>{item.title}</Text>
                    <Text style={styles.helpCardDesc}>{item.desc}</Text>
                    <View style={styles.viewGuidesRow}>
                      <Text style={styles.viewGuidesText}>View Guides</Text>
                      <MaterialCommunityIcons name="open-in-new" size={12} color={styles.viewGuidesText.color} style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── SECTION 5: FAQ ────────────────────────────────────────────── */}
          <View style={styles.section}>
            <SectionChip iconName="help-circle-outline" label="Frequently Asked Questions" />
            <View style={styles.faqList}>
              {FAQ_DATA.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.faqItem, index === FAQ_DATA.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => handleToggleFaq(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    <MaterialCommunityIcons
                      name={expandedFaq === index ? 'chevron-down' : 'chevron-right'}
                      size={20}
                      color={styles.viewGuidesText.color}
                    />
                  </View>
                  {expandedFaq === index && (
                    <Animated.View entering={FadeInUp.duration(300)} style={styles.faqAnswerContainer}>
                      <Text style={styles.faqAnswer}>{item.answer}</Text>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── SECTION 6: NEED MORE HELP? ────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.helpBannerCard}>
              <View style={StyleSheet.absoluteFill}>
                <Svg height="100%" width="100%">
                  <Defs>
                    <SvgLinearGradient id="helpGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0" stopColor="#4C1D95" stopOpacity="1" />
                      <Stop offset="1" stopColor="#1E40AF" stopOpacity="1" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" fill="url(#helpGrad2)" rx={20} />
                </Svg>
              </View>
              <View style={styles.helpBannerContent}>
                <Text style={styles.helpBannerTitle}>Need More Help?</Text>
                <Text style={styles.helpBannerSubtitle}>Our support team is available 24/7 to assist you.</Text>
                <TouchableOpacity
                  style={styles.helpBtnDark}
                  onPress={() => Linking.openURL('mailto:support@sharnex.com').catch(err => console.error('Failed to email support:', err))}
                >
                  <Text style={styles.helpBtnText}>Contact Support</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.helpBtnDark, { marginTop: 10 }]}
                  onPress={() => Linking.openURL('https://sharnex.com/chat').catch(err => console.error('Failed to open live chat:', err))}
                >
                  <Text style={styles.helpBtnText}>Live Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </ScrollView>
      )}

      <NavigationDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} role="teacher" />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles — theme-aware factory; dark-specific overrides use TD.* constants
// Light mode falls back to theme.* tokens so it responds to light/dark/system
// ─────────────────────────────────────────────────────────────────────────────
const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: isDarkMode ? TD.bg : theme.background },
  container: { flex: 1, backgroundColor: isDarkMode ? TD.bg : theme.background },
  scrollContent: { paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 24,
    backgroundColor: isDarkMode ? TD.bg : theme.background,
  },

  section: { paddingHorizontal: 20, marginTop: 28 },

  // ── Hero card ──────────────────────────────────────────────────────────────
  heroCard: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    overflow: 'hidden',
    backgroundColor: isDarkMode ? TD.heroGrad1 : '#4C1D95',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
    gap: 6,
  },
  heroPillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  heroPillText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  heroGreeting: {
    fontSize: 15,
    fontStyle: 'italic',
    color: 'rgba(220,210,255,0.85)',
    fontWeight: '400',
    marginBottom: 4,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroNameUnderline: {
    height: 3,
    backgroundColor: '#A78BFA',
    borderRadius: 2,
    width: '100%',
    marginTop: 2,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(220,210,255,0.75)',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroPeriodsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  heroPeriodsLabel: {
    fontSize: 10,
    color: 'rgba(200,190,255,0.7)',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // ── Section headers ────────────────────────────────────────────────────────
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionIconMargin: { marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.text, letterSpacing: -0.3 },
  sectionHeaderSpaceBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: isDarkMode ? TD.accentBlue : theme.primary },

  // Section 2: Schedule heading
  scheduleSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: isDarkMode ? '#FFFFFF' : theme.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  // ── Stats ──────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statCard: { alignItems: 'center', backgroundColor: isDarkMode ? TD.surface : theme.surface, borderColor: isDarkMode ? TD.border : theme.border, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, borderWidth: 1, width: '31%', minHeight: 110 },
  statIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statTitle: { fontSize: 10, fontWeight: '700', color: isDarkMode ? TD.muted : theme.subtext, marginTop: 6, textAlign: 'center', width: '100%' },
  statValue: { fontSize: 16, fontWeight: '800', color: isDarkMode ? '#FFFFFF' : theme.text, marginTop: 2 },

  // ── Quick actions ──────────────────────────────────────────────────────────
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  quickActionCard: { width: '31%', backgroundColor: isDarkMode ? TD.surface : theme.surface, borderColor: isDarkMode ? TD.border : theme.border, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 4, borderWidth: 1 },
  quickActionTouchable: { alignItems: 'center' },
  quickActionTitle: { fontSize: 11, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : theme.text, marginTop: 10, textAlign: 'center' },
  badgeContainer: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: isDarkMode ? TD.bg : theme.background, zIndex: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  // ── Schedule cards ─────────────────────────────────────────────────────────
  scheduleList: { gap: 12 },
  scheduleCard: {
    backgroundColor: isDarkMode ? TD.scheduleCard : theme.surface,
    borderColor: isDarkMode ? TD.scheduleBorder : theme.border,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingVertical: 14,
  },
  scheduleCardOngoing: {
    borderColor: TD.accentPurpleDark,
    shadowColor: TD.accentPurpleDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduleAccentBar: {
    width: 4,
    borderRadius: 2,
    marginLeft: 12,
    marginRight: 14,
    minHeight: 60,
  },
  scheduleBody: { flex: 1, paddingRight: 14 },
  scheduleTime: { fontSize: 13, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : theme.text, marginBottom: 6 },
  schedulePillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  schedulePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  schedulePillText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  statusRowInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ongoingDot: { width: 6, height: 6, borderRadius: 3 },
  ongoingText: { fontSize: 11, fontWeight: '700' },
  upNextCircle: { fontSize: 12, color: TD.upNextAmber },
  upNextText: { fontSize: 11, color: TD.upNextAmber, fontWeight: '600' },
  completedText: { fontSize: 11, color: isDarkMode ? TD.muted : theme.subtext, fontWeight: '500' },
  scheduleTeacherName: { fontSize: 15, fontWeight: '700', color: isDarkMode ? '#FFFFFF' : theme.text },
  scheduleRoomText: { fontSize: 11, color: isDarkMode ? TD.muted : theme.subtext, marginTop: 2 },

  emptyText: { fontSize: 14, color: isDarkMode ? TD.muted : theme.subtext, textAlign: 'center', marginTop: 20, fontWeight: '500' },

  // ── Live session banner ────────────────────────────────────────────────────
  liveBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? TD.surface : theme.surface, borderColor: isDarkMode ? TD.border : theme.border, borderRadius: 16, padding: 16, marginBottom: 0, borderLeftWidth: 4, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, borderWidth: 1 },
  liveBannerContent: { flex: 1 },
  liveIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  liveSubject: { fontSize: 16, fontWeight: '700', color: isDarkMode ? '#FFFFFF' : theme.text },
  liveClassName: { fontSize: 13, color: isDarkMode ? TD.muted : theme.subtext, marginTop: 2 },
  liveJoinBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginLeft: 12 },
  liveJoinBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  liveProgressContainer: { height: 8, width: '100%', backgroundColor: isDarkMode ? TD.border : theme.border, borderRadius: 4, overflow: 'hidden', marginTop: 10, marginBottom: 8 },
  liveProgressFill: { height: '100%', borderRadius: 4 },
  shimmerStreak: { position: 'absolute', top: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255, 255, 255, 0.6)', zIndex: 2 },

  // ── Pending tasks ──────────────────────────────────────────────────────────
  pendingTasksCard: { backgroundColor: isDarkMode ? TD.surface : theme.surface, borderColor: isDarkMode ? TD.border : theme.border, borderRadius: 12, paddingVertical: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pendingTasksText: { fontSize: 11, color: isDarkMode ? TD.muted : theme.subtext, fontWeight: '500' },
  pendingTasksList: { gap: 12 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? TD.taskCard : theme.surface,
    borderColor: isDarkMode ? TD.border : theme.border,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  taskRingIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: isDarkMode ? TD.accentPurple : theme.primary,
    backgroundColor: 'transparent',
    marginRight: 14,
  },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '700', color: isDarkMode ? '#FFFFFF' : theme.text, marginBottom: 2 },
  taskSubtitle: { fontSize: 11, color: isDarkMode ? TD.muted : theme.subtext, fontWeight: '500', marginBottom: 6 },
  taskPendingPill: {
    alignSelf: 'flex-start',
    backgroundColor: isDarkMode ? TD.pendingAmberBg : '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  taskPendingText: { fontSize: 11, fontWeight: '700', color: isDarkMode ? TD.pendingAmber : '#D97706' },

  // ── Announcements (unchanged visually) ────────────────────────────────────
  announcementCard: { backgroundColor: '#EA580C', borderRadius: 20, overflow: 'hidden', padding: 24, paddingBottom: 30, shadowColor: '#EA580C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
  announcementContent: { zIndex: 1 },
  announcementList: { gap: 12 },
  announcementItem: { flexDirection: 'row', alignItems: 'flex-start' },
  announcementBullet: { color: '#FFFFFF', fontSize: 16, marginRight: 10, fontWeight: '900', marginTop: -3 },
  announcementText: { fontSize: 13, color: 'rgba(255,255,255,0.95)', lineHeight: 19, flex: 1, fontWeight: '500' },
  boldText: { fontWeight: '800', color: '#FFFFFF' },

  // ── Help center ────────────────────────────────────────────────────────────
  helpList: { gap: 12 },
  helpCard: {
    width: '100%',
    backgroundColor: isDarkMode ? TD.surface : theme.surface,
    borderColor: isDarkMode ? TD.border : theme.border,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  helpIconBg: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  helpCardTitle: { fontSize: 15, fontWeight: '700', color: isDarkMode ? '#FFFFFF' : theme.text, marginBottom: 6 },
  helpCardDesc: { fontSize: 12, color: isDarkMode ? TD.muted : theme.subtext, lineHeight: 16, marginBottom: 14 },
  viewGuidesRow: { flexDirection: 'row', alignItems: 'center' },
  viewGuidesText: { fontSize: 12, fontWeight: '700', color: isDarkMode ? TD.accentPurple : theme.primary },

  // ── FAQ ────────────────────────────────────────────────────────────────────
  faqList: { backgroundColor: isDarkMode ? TD.faqCard : theme.surface, borderRadius: 16, paddingHorizontal: 4, borderWidth: 1, borderColor: isDarkMode ? TD.border : theme.border },
  faqItem: { borderBottomWidth: 1, borderBottomColor: isDarkMode ? TD.faqBorder : theme.border },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  faqQuestion: { fontSize: 13, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : theme.text, flex: 1, paddingRight: 8 },
  faqAnswerContainer: { backgroundColor: isDarkMode ? '#120D24' : theme.faqAnswer, borderRadius: 10, padding: 12, marginHorizontal: 10, marginBottom: 14 },
  faqAnswer: { fontSize: 13, color: isDarkMode ? TD.muted : theme.subtext, lineHeight: 20 },

  // ── Need More Help banner ──────────────────────────────────────────────────
  helpBannerCard: { paddingVertical: 28, paddingHorizontal: 24, marginHorizontal: 0, marginBottom: 40, alignItems: 'center', overflow: 'hidden', borderRadius: 20, shadowColor: '#5A67D8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  helpBannerContent: { zIndex: 1, alignItems: 'center', width: '100%' },
  helpBannerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  helpBannerSubtitle: { fontSize: 12, color: '#E0E7FF', textAlign: 'center', lineHeight: 18, marginBottom: 20, paddingHorizontal: 10 },
  helpBtnDark: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.4)' : '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: isDarkMode ? 1 : 0,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  helpBtnText: { color: isDarkMode ? TD.accentPurple : '#4C1D95', fontSize: 14, fontWeight: '700' },

  // ── Misc shared ────────────────────────────────────────────────────────────
  iconBox: { borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardContainer: { backgroundColor: isDarkMode ? TD.surface : theme.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: isDarkMode ? TD.border : theme.border },
  eventCard: { backgroundColor: isDarkMode ? TD.surface : theme.surface, borderRadius: 12, padding: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: isDarkMode ? TD.border : theme.border },
  eventCardContent: { flex: 1 },
  eventTitle: { fontSize: 13, fontWeight: '700', color: isDarkMode ? '#FFFFFF' : theme.text, marginBottom: 4 },
  eventDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventDateText: { fontSize: 11, color: isDarkMode ? TD.muted : theme.subtext },
  topStudentCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: isDarkMode ? TD.border : theme.border },
  rankCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { fontSize: 12, fontWeight: '700' },
  topStudentInfo: { flex: 1 },
  topStudentName: { fontSize: 13, fontWeight: '700', color: isDarkMode ? '#FFFFFF' : theme.text },
  topStudentClass: { fontSize: 11, color: isDarkMode ? TD.muted : theme.subtext },
  topStudentPercentage: { fontSize: 13, fontWeight: '700', color: '#10B981' },
  activityBox: { backgroundColor: isDarkMode ? TD.surface : theme.surface, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: isDarkMode ? TD.border : theme.border },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  activityItemBorder: { borderBottomWidth: 1, borderBottomColor: isDarkMode ? TD.border : theme.border },
  activityAvatarBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityContent: { flex: 1, justifyContent: 'center' },
  activityName: { fontSize: 13, fontWeight: '700', color: isDarkMode ? '#FFFFFF' : theme.text, marginBottom: 2 },
  activityAction: { fontSize: 11, color: isDarkMode ? TD.muted : theme.subtext, marginBottom: 4, lineHeight: 15 },
  activityDateText: { fontSize: 10, color: isDarkMode ? TD.muted : theme.placeholder },

  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: { fontSize: 16, fontWeight: '500', color: theme.primary, flex: 1, textAlign: 'center', paddingTop: 12, marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: isDarkMode ? TD.pillChipBg : theme.iconBackground, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#A855F7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  sectionSpacing: { height: 10 },
});

export default TeacherDashboard;
