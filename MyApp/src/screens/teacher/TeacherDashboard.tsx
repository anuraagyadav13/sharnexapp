import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshControl
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
  useSharedValue
} from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
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

const DashboardSkeleton = () => {
  const { theme } = useTheme();
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
        <Skeleton width="100%" height={180} borderRadius={20} />
      </View>

      <View style={styles.section}>
        <View style={styles.statsRow}>
          <Skeleton width="31%" height={110} borderRadius={16} />
          <Skeleton width="31%" height={110} borderRadius={16} />
          <Skeleton width="31%" height={110} borderRadius={16} />
        </View>
      </View>

      <View style={styles.section}>
        <Skeleton width={120} height={20} style={{ marginBottom: 20 }} />
        <View style={styles.quickActionsGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <Skeleton key={i} width="31%" height={110} borderRadius={16} />)}
        </View>
      </View>
    </ScrollView>
  );
};


type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TeacherDashboard'>;

interface Props {
  navigation: DashboardNavigationProp;
}

const IconBox = ({ name, color = '#fff', bgColor, size = 50, iconSize = 24, iconLibrary = 'Ionicons' }: any) => {
  const IconComponent = iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.iconBox, { width: size, height: size, backgroundColor: bgColor }]}>
      <IconComponent name={name} size={iconSize} color={color} />
    </View>
  );
};

const ActivityItem = ({ iconName, iconBgColor, name, action, time, isLast, iconLibrary = 'Ionicons' }: any) => {
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

const StatCard = ({ title, value, color, icon }: { title: string, value: string | number, color: string, icon: string }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.subtext }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
    </View>
  );
};

const QuickActionCard = React.memo(({ title, iconName, bgColor, delay, onPress, iconLibrary = 'Ionicons', badge }: any) => {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={[styles.quickActionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress} style={styles.quickActionTouchable}>
        <View>
          <IconBox name={iconName} bgColor={bgColor} iconLibrary={iconLibrary} />
          {!!badge && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const ScheduleCard = React.memo(({ time, title, classSection, room, color, status, isOngoing, bgStyleColor, borderStyleColor }: any) => {
  const { theme, isDarkMode } = useTheme();
  const isSpecialBg = !!bgStyleColor;
  return (
    <View style={[
      styles.scheduleCard,
      { backgroundColor: theme.surface, borderColor: theme.border },
      isSpecialBg ? {
        backgroundColor: isDarkMode ? (status === 'Ongoing' ? '#1E293B' : theme.surface) : bgStyleColor,
        borderColor: borderStyleColor,
        shadowColor: borderStyleColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6
      } : { borderColor: isDarkMode ? theme.border : `${color}40` }
    ]}>
      <View style={styles.scheduleLeftCol}>
        <View style={[styles.scheduleCardIndicator, { backgroundColor: color }]} />
        <View style={styles.scheduleTimeWrapper}>
          <Text style={[styles.scheduleTime, { color: theme.subtext }]} numberOfLines={1} adjustsFontSizeToFit>{time}</Text>
        </View>
      </View>

      <View style={styles.scheduleRightCol}>
        <View style={styles.schedulePillRow}>
          <View style={[styles.schedulePill, { backgroundColor: color }]}>
            <Text style={styles.schedulePillText}>{title}</Text>
          </View>
          {isOngoing && (
            <View style={styles.ongoingContainer}>
              <View style={[styles.ongoingDot, { backgroundColor: color }]} />
              <Text style={[styles.ongoingText, { color: color }]}>Ongoing</Text>
            </View>
          )}
          {status === 'Completed' && (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark" size={14} color={theme.subtext} />
              <Text style={[styles.scheduleStatus, { color: theme.subtext }]}>Completed</Text>
            </View>
          )}
        </View>

        <Text style={[styles.scheduleTeacher, { color: theme.text }]} numberOfLines={1}>{classSection}</Text>

        <View style={styles.scheduleBottomRow}>
          <Text style={[styles.scheduleRoom, { color: theme.subtext }]}>{room}</Text>
          {isOngoing && (
            <TouchableOpacity style={[styles.joinClassBtn, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
              <Text style={[styles.joinClassBtnText, { color }]}>Start Session →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const EventCard = React.memo(({ title, date, color }: any) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.eventCard, { borderLeftColor: color }]}>
      <View style={styles.eventCardContent}>
        <Text style={styles.eventTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.eventDateContainer}>
          <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
          <Text style={styles.eventDateText}>{date}</Text>
        </View>
      </View>
    </View>
  );
});

const TopStudentCard = React.memo(({ rank, name, className, percentage }: any) => {
  return (
    <View style={styles.topStudentCard}>
      <View style={[styles.rankCircle, { backgroundColor: rank === 1 ? '#FEF3C7' : '#F3F4F6' }]}>
        <Text style={[styles.rankText, { color: rank === 1 ? '#D97706' : '#6B7280' }]}>{rank}</Text>
      </View>
      <View style={styles.topStudentInfo}>
        <Text style={styles.topStudentName} numberOfLines={1}>{name}</Text>
        <Text style={styles.topStudentClass}>{className}</Text>
      </View>
      <Text style={styles.topStudentPercentage}>{percentage}</Text>
    </View>
  );
});

const LiveSessionBanner = ({ subject, classSection, time, color }: any) => {
  const { theme, isDarkMode } = useTheme();
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(withTiming(1, { duration: 2500 }), -1, false);
  }, []);

  const animatedShimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerValue.value, [0, 1], [-100, 250]) }],
    opacity: interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.8, 0.3]),
  }));

  return (
    <Animated.View entering={FadeInUp.springify()} style={[styles.liveBanner, {
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderColor: isDarkMode ? '#334155' : '#FDF4FF',
      borderLeftColor: color
    }]}>
      <View style={styles.liveBannerContent}>
        <View style={styles.liveIndicatorRow}>
          <View style={[styles.liveDot, { backgroundColor: color }]} />
          <Text style={[styles.liveText, { color }]}>CLASS IN PROGRESS</Text>
        </View>
        <Text style={[styles.liveSubject, { color: theme.text }]}>{subject}</Text>
        <Text style={[styles.liveClassName, { color: theme.subtext }]}>{classSection} • {time}</Text>

        <View style={[styles.liveProgressContainer, { backgroundColor: isDarkMode ? '#334155' : '#FDF4FF' }]}>
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


const HELP_CENTER_DATA = [
  {
    title: 'Getting Started',
    desc: 'Learn the basics of Sharnex and how to navigate the dashboard.',
    icon: 'rocket-launch-outline',
    color: '#3B82F6'
  },
  {
    title: 'Managing Grades',
    desc: 'Learn how to add, edit, and manage student grades and report cards.',
    icon: 'chart-bar',
    color: '#10B981'
  },
  {
    title: 'Attendance Tracking',
    desc: 'Learn how to mark attendance, generate reports, and manage absences.',
    icon: 'calendar-check',
    color: '#F59E0B'
  },
  {
    title: 'Assignment & Homework',
    desc: 'Create, assign, and track assignments and homework for students.',
    icon: 'clipboard-text-outline',
    color: '#8B5CF6'
  },
  {
    title: 'Report & Analytics',
    desc: 'Generate performance reports and analyze student data.',
    icon: 'chart-pie',
    color: '#06B6D4'
  },
  {
    title: 'Technical Support',
    desc: 'Troubleshooting login issues, app problems, and technical questions.',
    icon: 'monitor-cellphone',
    color: '#EF4444'
  },
];


const FAQ_DATA = [
  { question: 'How do I add a new student to the system?', answer: 'Navigate to the Students section, click "Add New Student", fill in the required information, and submit the form.' },
  { question: 'How can I generate attendance reports?', answer: 'Go to the Attendance page, select the date range and class, then click "Generate Report" to download the attendance data.' },
  { question: 'How do I schedule parent-teacher meetings?', answer: 'Use the Calendar feature to create events, select "Parent-Teacher Meeting" as the event type, and invite parents through the system.' },
  { question: 'Can I customize the grading system?', answer: 'Yes, you can customize grading scales and weightings in the Settings section under "Grading Preferences".' },
  { question: 'How do I submit an assignment online?', answer: 'Go to the Assignments page, select the assignment, upload your files, and click "Submit". Make sure to submit before the deadline.' },
];

const TeacherDashboard: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  // Phase 1: critical fast APIs (summary, tasks, profile)
  const [isLoading, setIsLoading] = useState(true);
  // Phase 2: slow APIs loaded independently
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
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlYWNoZXItMTc2NzcyNjc3MzEzOCIsInJvbGUiOiJURUFDSEVSIiwiaW5zdGl0dXRpb25JZCI6Imluc3RpdHV0aW9uLTE3Njc2Mzk1MDMwODkteXJmMHExcnB3IiwiZW1haWwiOiJhbnVyYWcuMjJiMDMxMTA4MEBhYmVzLmFjLmluIiwibmFtZSI6IkFOVVJBRyBZQURBViIsImlzQWN0aXZlIjp0cnVlLCJpc1ZlcmlmaWVkIjpmYWxzZSwiaWF0IjoxNzgyODE0MDM4LCJleHAiOjE3ODI4MTQ5Mzh9.2PzgHp774mX6C_2mKAP0M5hJnnAoARHatFMpFEmpqt4';
    }
    return rawToken;
  }, []);

  // ─── Phase 1: critical fast data ────────────────────────────────────────────
  // dashboard-summary + pending-tasks + profile
  // Awaited before setIsLoading(false) — these are the fast APIs (< a few seconds).
  // They clear the full-screen skeleton so the header, stats and quick-actions appear.
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

    // Parse summary
    let summaryData: any = null;
    if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
      try { const raw = await summaryRes.value.json(); summaryData = raw?.data ?? raw; } catch { }
    }

    // Parse pending tasks
    let tasksData: any[] = [];
    if (tasksRes.status === 'fulfilled' && tasksRes.value.ok) {
      try {
        const raw = await tasksRes.value.json();
        const payload = raw?.data ?? raw;
        tasksData = Array.isArray(payload) ? payload : (payload?.tasks ?? []);
      } catch { }
    }

    // Cached profile (or freshly fetched)
    const profileDataObj: any = profileResult.status === 'fulfilled' ? profileResult.value : null;

    setDashboardData(summaryData);
    setPendingTasks(tasksData);
    setProfileData(profileDataObj);
  }, []); // fetchWithCache is a module-level import — stable, not a dep

  // ─── Phase 2a: schedule (slow — ~34s on current server) ──────────────────────
  // Runs AFTER the skeleton has already cleared.
  // Shows its own section skeleton while waiting. No timeout — let it complete.
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

      // schedule is always fresh; periods served from cache when available
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

      // Merge periods + schedule
      let finalSchedule: any[] = scheduleData;
      if (periodsData.length > 0) {
        finalSchedule = periodsData.map((period: any) => {
          if (period.is_break) return { ...period, type: 'BREAK' };
          const assigned = scheduleData.find((s: any) => s.period_id === period.id);
          if (assigned) return { ...period, ...assigned, type: 'CLASS' };
          return { ...period, type: 'FREE' };
        });
      }

      // Tag each slot with runtime status
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
        } catch {
          return item;
        }
      });

      setTodaySchedule(processedSchedule);
    } catch (err: any) {
      console.error('[Dashboard] Schedule fetch error:', err?.message);
    } finally {
      setIsScheduleLoading(false);
    }
  }, []); // fetchWithCache is a module-level import — stable, not a dep

  // ─── Phase 2b: announcements (slow — ~60s on current server) ─────────────────
  // Runs AFTER the skeleton has cleared. Shows its own section skeleton.
  // No timeout — the server will eventually respond.
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
      if (!teacherId) {
        setError('Teacher ID not found');
        return;
      }

      const today = new Date();
      const todayDateStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-');

      const token = resolveToken(authState.token);
      const headers = buildHeaders(token);

      // ── PHASE 1: fast critical data ─────────────────────────────────────────
      // Wait for summary + tasks + profile, then clear the skeleton immediately.
      await fetchCritical(headers, teacherId, forceRefresh);
      setIsLoading(false);

      // ── PHASE 2: slow background data ───────────────────────────────────────
      // Each fires independently — neither blocks the other.
      // The schedule section and announcements section each show their own skeleton.
      await Promise.allSettled([
        fetchSchedule(headers, teacherId, todayDateStr, today, forceRefresh),
        fetchAnnouncements(headers)
      ]);
    } catch (err: any) {
      console.error('[TeacherDashboard] fetchDashboard failed:', err);
      setError('Failed to sync dashboard data with server.');
      setIsLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [authState.user?.id, authState.token, buildHeaders, resolveToken, fetchCritical, fetchSchedule, fetchAnnouncements]);

  // ─── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    setIsScheduleLoading(true);
    setIsAnnouncementsLoading(true);
    fetchDashboard(false);
  }, [fetchDashboard]);

  // ─── Pull-to-refresh ────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setIsScheduleLoading(true);
    setIsAnnouncementsLoading(true);
    await fetchDashboard(true); // forceRefresh=true — bypass cache
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

  // ─── Memoized navigation handlers ───────────────────────────────────────────
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



  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#6366F1']} />}
        >
          {/* Global Header */}
          <View style={styles.header}>
            <ScaleButton
              style={styles.menuHandle}
              onPress={handleOpenDrawer}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="menu" size={28} color="#1F2937" />
            </ScaleButton>
            <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 10 }}>
              <Text style={[styles.headerTitle, { marginHorizontal: 0, color: theme.text }]} numberOfLines={1}>
                Welcome, {authState.user?.name?.split(' ')[0] || 'Teacher'}
              </Text>
              {(profileData?.designation || profileData?.role) && (
                <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#6B7280', marginTop: 2, fontWeight: '500' }}>
                  {profileData?.designation || (profileData?.role === 'TEACHER' ? 'Teacher' : profileData?.role) || 'Teacher'}
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={22} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGoToAccountSettings} style={styles.iconBtn}>
                <Ionicons name="settings-outline" size={22} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleDarkMode} style={styles.iconBtn}>
                <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={22} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleGoToAccountSettings}
              >
                {authState.user?.photoUrl ? (
                  <Image
                    source={{ uri: authState.user.photoUrl }}
                    style={[styles.avatar, { shadowOpacity: 0 }]}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(authState.user?.name || 'T').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Banner */}
          <Animated.View
            entering={FadeInUp.delay(50).springify()}
            style={[styles.heroBannerRow, { backgroundColor: isDarkMode ? '#1E1B4B' : '#D9DAF9' }]}
          >
            <View style={styles.heroTextSide}>
              <Text style={[styles.heroRowTitle1, { color: isDarkMode ? '#F8FAFC' : '#1F2937' }]}>Empower <Text style={[styles.heroRowTitle2, { color: isDarkMode ? '#818CF8' : '#4F46E5' }]}>Teaching</Text></Text>
              <Text style={[styles.heroRowTitle2, { color: isDarkMode ? '#818CF8' : '#4F46E5' }]}>Management with</Text>
              <Text style={[styles.heroRowTitle3, { color: isDarkMode ? '#F8FAFC' : '#1F2937' }]}>Sharnex</Text>
              <Text style={[styles.heroRowSubtitle, { color: isDarkMode ? '#CBD5E1' : '#4B5563' }]}>Easily manage attendance, assignments, and quizzes all in one platform.</Text>
            </View>
            <View style={styles.heroImageSide}>
              <Image source={require('../../assets/laptop.png')} style={styles.heroRowImage} resizeMode="contain" />
            </View>
          </Animated.View>

          {/* Overview Stats - All in one row, student style */}
          <View style={styles.section}>
            {/* Live Session Hot-Link — served from useMemo, no re-computation on render */}
            {ongoingSession && (
              <LiveSessionBanner
                subject={ongoingSession.subject_name || ongoingSession.type}
                classSection={ongoingSession.class_name}
                time={`${ongoingSession.start_time} - ${ongoingSession.end_time}`}
                color="#D946EF"
              />
            )}

            {error ? (
              <View style={{ padding: 16, backgroundColor: '#FEE2E2', borderRadius: 12, marginHorizontal: 16 }}>
                <Text style={{ color: '#DC2626', fontWeight: '500' }}>{error}</Text>
              </View>
            ) : (
              <View style={styles.statsRow}>
                <StatCard
                  title="Total Students"
                  value={dashboardData?.stats?.totalStudents || 0}
                  color="#6366F1"
                  icon="people"
                />
                <StatCard
                  title="Attendance"
                  value={(dashboardData?.stats?.avgAttendance || 0) + "%"}
                  color="#10B981"
                  icon="bar-chart"
                />
                <StatCard
                  title="Active Quizzes"
                  value={dashboardData?.stats?.activeQuizzes || 0}
                  color="#F59E0B"
                  icon="help-circle"
                />
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={20} color="#3B82F6" style={styles.sectionIconMargin} />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.quickActionsGrid}>
              <QuickActionCard
                delay={100}
                title="Attendance"
                iconName="checkmark-circle"
                bgColor="#10B981"
                badge={classCount}
                onPress={handleGoToAttendance}
              />
              <QuickActionCard
                delay={150}
                title="Assignments"
                iconName="document-text"
                bgColor="#8B5CF6"
                badge={dashboardData?.stats?.pendingGrading || 0}
                onPress={handleGoToAssignments}
              />
              <QuickActionCard
                delay={200}
                title="Quizzes"
                iconName="time"
                bgColor="#EAB308"
                badge={dashboardData?.stats?.activeQuizzes || 0}
                onPress={handleGoToQuiz}
              />
              <QuickActionCard
                delay={250}
                title="Performance"
                iconName="bar-chart"
                bgColor="#3B82F6"
                onPress={handleGoToPerformance}
              />
              <QuickActionCard
                delay={300}
                title="Materials"
                iconName="book"
                bgColor="#10B981"
                onPress={handleGoToMaterials}
              />
              <QuickActionCard
                delay={350}
                title="Live Monitor"
                iconName="pulse"
                bgColor="#EC4899"
                onPress={handleGoToQuiz}
              />
              <QuickActionCard
                delay={400}
                title="Equipment"
                iconName="construct"
                bgColor="#F59E0B"
                onPress={handleGoToEquipment}
              />
              <QuickActionCard
                delay={450}
                title="Leave Entry"
                iconName="calendar-outline"
                bgColor="#6366F1"
                onPress={handleGoToTimetable}
              />
              <QuickActionCard
                delay={500}
                title="Exam Records"
                iconName="list-outline"
                bgColor="#F97316"
                badge={pendingTasks.filter((t: any) => t.type === 'marking').length || 0}
                onPress={handleGoToExamRecords}
              />
            </View>
          </View>

          {/* Today's Schedule (Similar to StudentDashboard) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color="#4F46E5" style={styles.sectionIconMargin} />
              <Text style={styles.sectionTitle}>Today’s Schedule</Text>
            </View>
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
                    classSection={`${item.class_name} - Sec ${item.section}`}
                    room={item.room_name || 'Classroom'}
                    color={index % 2 === 0 ? "#059669" : "#D946EF"}
                    isOngoing={item.status === 'Ongoing'}
                    status={item.status}
                    bgStyleColor={item.status === 'Ongoing' ? "#F0FDF4" : undefined}
                    borderStyleColor={item.status === 'Ongoing' ? "#86EFAC" : undefined}
                  />
                ))
              )}
            </View>
          </View>

          {/* Pending Tasks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#3B82F6" style={styles.sectionIconMargin} />
              <Text style={styles.sectionTitle}>Pending Tasks</Text>
            </View>
            <View style={styles.pendingTasksList}>
              {isLoading ? (
                <View style={{ gap: 10 }}>
                  <Skeleton width="100%" height={70} borderRadius={16} />
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
                          subjectName: task.data?.subjectName || task.data?.subject_name || 'Subject'
                        });
                      } else if (task.type === 'review') {
                        navigation.navigate('TeacherReviewSubmission', {
                          examId: task.data?.exam_id || task.data?.examId || '',
                          classId: task.data?.class_id || task.data?.classId || '',
                          examName: task.data?.exam_name || task.data?.examName || 'Examination',
                          className: task.data?.class_name || task.data?.className || 'Class'
                        });
                      } else if (task.type === 'assignment') {
                        navigation.navigate('TeacherViewSubmission', {
                          assignmentId: task.data?.id || task.data?.assignmentId || '',
                          classId: task.data?.classId || task.data?.class_id || '',
                          title: task.data?.title || 'Assignment',
                          className: task.data?.class || task.data?.className || 'Class'
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
                    <Animated.View
                      entering={FadeInUp.delay(index * 100).springify()}
                      style={styles.taskCard}
                    >
                      <View style={[styles.taskIconBg, { backgroundColor: `${task.color}15` }]}>
                        <MaterialCommunityIcons name={task.icon} size={20} color={task.color} />
                      </View>
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                    </Animated.View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {/* Performance & Events Grid */}
          <View style={[styles.section, { flexDirection: 'row', gap: 16 }]}>
            {/* Top Students */}
            <View style={{ flex: 1.1 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Top Students</Text>
              <View style={styles.cardContainer}>
                {dashboardData?.topStudents && dashboardData.topStudents.length > 0 ? (
                  dashboardData.topStudents.map((student: any, index: number) => (
                    <TopStudentCard
                      key={index}
                      rank={student.rank || (index + 1)}
                      name={student.name}
                      className={student.className || student.class_name || ''}
                      percentage={student.percentage || `${student.marks || 0}%`}
                    />
                  ))
                ) : (
                  <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#9CA3AF', fontStyle: 'italic', paddingVertical: 10, textAlign: 'center' }}>
                    No student rankings.
                  </Text>
                )}
              </View>
            </View>

            {/* Upcoming Events */}
            <View style={{ flex: 0.9 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Events</Text>
              <View style={{ gap: 10 }}>
                {dashboardData?.upcomingEvents && dashboardData.upcomingEvents.length > 0 ? (
                  dashboardData.upcomingEvents.map((event: any, index: number) => (
                    <EventCard
                      key={index}
                      title={event.title}
                      date={event.date}
                      color={event.color || '#4F46E5'}
                    />
                  ))
                ) : (
                  <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#9CA3AF', fontStyle: 'italic' }}>
                    No upcoming events.
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderSpaceBetween}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity><Text style={styles.viewAllText}>View All →</Text></TouchableOpacity>
            </View>

            <View style={styles.activityBox}>
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((item: any, index: number) => (
                  <ActivityItem
                    key={item.id || index}
                    iconLibrary={item.iconLibrary || 'Ionicons'}
                    iconName={item.icon || 'notifications'}
                    iconBgColor={item.color || '#3B82F6'}
                    name={item.title || item.name || 'Activity'}
                    action={item.description || item.action || ''}
                    time={item.time || item.createdAt || ''}
                    isLast={index === dashboardData.recentActivity.length - 1}
                  />
                ))
              ) : (
                <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#9CA3AF', fontStyle: 'italic', padding: 20, textAlign: 'center' }}>
                  No recent activity.
                </Text>
              )}
            </View>
          </View>

          {/* Important Announcements & Deadlines */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#F97316" style={styles.sectionIconMargin} />
              <Text style={styles.sectionTitle}>Announcements & Deadlines</Text>
            </View>

            <View style={styles.announcementCard}>
              <View style={StyleSheet.absoluteFill}>
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                  <Defs>
                    <SvgLinearGradient id="announcementGrad" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0" stopColor="#EA580C" stopOpacity="1" />
                      <Stop offset="1" stopColor="#FBBF24" stopOpacity="1" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" fill="url(#announcementGrad)" />
                </Svg>
              </View>

              <View style={styles.announcementContent}>
                <View style={styles.announcementList}>
                  {isAnnouncementsLoading ? (
                    <View style={{ gap: 12, paddingVertical: 8 }}>
                      <Skeleton width="100%" height={18} borderRadius={6} />
                      <Skeleton width="90%" height={18} borderRadius={6} />
                      <Skeleton width="95%" height={18} borderRadius={6} />
                    </View>
                  ) : announcements && announcements.length > 0 ? (
                    announcements.slice(0, 4).map((item: any, index: number) => (
                      <Animated.View
                        key={item.id || index}
                        entering={FadeInUp.delay(index * 150).springify()}
                        style={styles.announcementItem}
                      >
                        <Text style={styles.announcementBullet}>•</Text>
                        <Text style={styles.announcementText}>
                          <Text style={styles.boldText}>{item.title}</Text>: {item.content || item.message || ''}
                        </Text>
                      </Animated.View>
                    ))
                  ) : (
                    <View style={styles.announcementItem}>
                      <Text style={styles.announcementBullet}>•</Text>
                      <Text style={styles.announcementText}>No new announcements or deadlines posted.</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Teacher Help Center */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="school-outline" size={20} color="#4F46E5" style={styles.sectionIconMargin} />
              <Text style={styles.sectionTitle}>Teacher Help Center</Text>
            </View>

            <View style={styles.helpGrid}>
              {HELP_CENTER_DATA.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.helpCard}
                  onPress={() => Linking.openURL('https://sharnex.com/support').catch(err => console.error("Failed to open support guides:", err))}
                >
                  <View style={[styles.helpIconBg, { backgroundColor: `${item.color}15` }]}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.helpCardTitle}>{item.title}</Text>
                  <Text style={styles.helpCardDesc} numberOfLines={2}>{item.desc}</Text>
                  <View style={styles.viewGuidesRow}>
                    <Text style={[styles.viewGuidesText, { color: '#3B82F6' }]}>View Guides</Text>
                    <MaterialCommunityIcons name="open-in-new" size={10} color="#3B82F6" style={{ marginLeft: 4 }} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Frequently Asked Questions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="help-circle-outline" size={20} color="#6366F1" style={styles.sectionIconMargin} />
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            </View>
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
                      name={expandedFaq === index ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>
                  {expandedFaq === index && (
                    <Animated.View
                      entering={FadeInUp.duration(300)}
                      style={styles.faqAnswerContainer}
                    >
                      <Text style={styles.faqAnswer}>{item.answer}</Text>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Need More Help? Banner */}
          <View style={styles.section}>
            <View style={styles.helpBannerCard}>
              <View style={StyleSheet.absoluteFill}>
                <Svg height="100%" width="100%">
                  <Defs>
                    <SvgLinearGradient id="helpGrad" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0" stopColor="#8B5CF6" stopOpacity="1" />
                      <Stop offset="1" stopColor="#3B82F6" stopOpacity="1" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" fill="url(#helpGrad)" rx={20} />
                </Svg>
              </View>
              <View style={styles.helpBannerContent}>
                <Text style={styles.helpBannerTitle}>Need More Help?</Text>
                <Text style={styles.helpBannerSubtitle}>Our support team is available 24/7 to assist you.</Text>
                <View style={styles.helpBannerButtons}>
                  <TouchableOpacity
                    style={styles.helpBtnWhite}
                    onPress={() => Linking.openURL('mailto:support@sharnex.com').catch(err => console.error("Failed to email support:", err))}
                  >
                    <Text style={styles.helpBtnTextPrimary}>Contact Support</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.helpBtnWhite}
                    onPress={() => Linking.openURL('https://sharnex.com/chat').catch(err => console.error("Failed to open live chat:", err))}
                  >
                    <Text style={styles.helpBtnTextPrimary}>Live Chat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        role="teacher"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 24,
    backgroundColor: '#FAFAFF',
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  heroBannerRow: { backgroundColor: '#D9DAF9', flexDirection: 'row', alignItems: 'center', paddingVertical: 24, paddingLeft: 16, paddingRight: 0, overflow: 'hidden', minHeight: 180 },
  heroTextSide: { width: '58%', paddingRight: 8, alignItems: 'center' },
  heroRowTitle1: { fontSize: 20, fontWeight: '800', color: '#2563EB', textAlign: 'center' },
  heroRowTitle2: { fontSize: 20, fontWeight: '800', color: '#D946EF', textAlign: 'center' },
  heroRowTitle3: { fontSize: 20, fontWeight: '800', color: '#7C3AED', textAlign: 'center', marginBottom: 8 },
  heroRowSubtitle: { fontSize: 10, color: '#4B5563', lineHeight: 15, textAlign: 'center', fontWeight: '500' },
  heroImageSide: { width: '42%', justifyContent: 'center', alignItems: 'flex-start' },
  heroRowImage: { width: '100%', height: 140 },

  section: { paddingHorizontal: 20, marginTop: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionIconMargin: { marginRight: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#4F46E5', letterSpacing: -0.5 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 0, gap: 12 },
  statCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0', width: '31%', minHeight: 110 },
  statIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statTitle: { fontSize: 10, fontWeight: '700', color: '#6B7280', marginTop: 6, textAlign: 'center', width: '100%' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginTop: 2 },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  quickActionTouchable: { alignItems: 'center' },
  quickActionTitle: { fontSize: 11, fontWeight: '600', color: '#374151', marginTop: 10, textAlign: 'center' },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  scheduleList: { gap: 12 },
  scheduleCard: { backgroundColor: '#FFFFFF', borderRadius: 12, flexDirection: 'row', borderWidth: 1, borderColor: '#F8FAFC', paddingRight: 10, height: 80, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  scheduleLeftCol: { flexDirection: 'row', alignItems: 'stretch', width: 145 },
  scheduleCardIndicator: { width: 4, borderRadius: 2, marginVertical: 4, marginLeft: 16, marginRight: 16 },
  scheduleTimeWrapper: { flex: 1, justifyContent: 'center' },
  scheduleTime: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  scheduleRightCol: { flex: 1, justifyContent: 'center' },
  schedulePillRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  schedulePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  schedulePillText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scheduleStatus: { fontSize: 11, color: '#4B5563', fontWeight: '500' },
  scheduleUpNext: { fontSize: 11, color: '#4F46E5', fontWeight: '500' },
  ongoingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ongoingDot: { width: 6, height: 6, borderRadius: 3 },
  ongoingText: { fontSize: 11, fontWeight: '700' },
  scheduleTeacher: { fontSize: 13, fontWeight: '400', color: '#4B5563', marginBottom: 4 },
  scheduleBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scheduleRoom: { fontSize: 10, color: '#9CA3AF' },
  joinClassBtn: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  joinClassBtnText: { fontSize: 10, fontWeight: '600' },

  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 20, fontWeight: '500' },

  liveBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 4, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, borderWidth: 1, borderColor: '#FEE2E2' },
  liveBannerContent: { flex: 1 },
  liveIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  liveSubject: { fontSize: 16, fontWeight: '700', color: '#111827' },
  liveClassName: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  liveJoinBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginLeft: 12 },
  liveJoinBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  liveProgressContainer: { height: 8, width: '100%', backgroundColor: '#FEE2E2', borderRadius: 4, overflow: 'hidden', marginTop: 10, marginBottom: 8, borderWidth: 1, borderColor: '#FECACA' },
  liveProgressFill: { height: '100%', borderRadius: 4 },
  shimmerStreak: { position: 'absolute', top: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255, 255, 255, 0.6)', zIndex: 2 },

  pendingTasksCard: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, marginBottom: 6 },
  pendingTasksText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', letterSpacing: 0.2 },
  pendingTasksList: { gap: 12 },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  taskIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 1 },
  taskSubtitle: { fontSize: 10, color: '#6B7280', fontWeight: '500' },

  announcementCard: { backgroundColor: '#EA580C', borderRadius: 20, overflow: 'hidden', padding: 24, paddingBottom: 30, marginTop: 0, shadowColor: '#EA580C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
  announcementContent: { zIndex: 1 },
  announcementTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginBottom: 10, letterSpacing: 0.3 },
  announcementList: { gap: 12 },
  announcementItem: { flexDirection: 'row', alignItems: 'flex-start' },
  announcementBullet: { color: '#FFFFFF', fontSize: 16, marginRight: 10, fontWeight: '900', marginTop: -3 },
  announcementText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.95)', lineHeight: 19, flex: 1, fontWeight: '500' },
  boldText: { fontWeight: '800', color: '#FFFFFF' },

  helpGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  helpCard: { width: '48%', height: 204, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F8FAFC', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  helpIconBg: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  helpCardTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 18 },
  helpCardDesc: { fontSize: 10, color: '#6B7280', lineHeight: 14 },
  viewGuidesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  viewGuidesText: { fontSize: 11, fontWeight: '700', color: '#3B82F6' },

  faqList: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  faqQuestion: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 },
  faqAnswerContainer: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginHorizontal: 10, marginBottom: 16 },
  faqAnswer: { fontSize: 13, color: '#374151', lineHeight: 20 },

  helpBannerCard: { paddingVertical: 24, paddingHorizontal: 20, marginHorizontal: 0, marginTop: 32, marginBottom: 40, alignItems: 'center', shadowColor: '#5A67D8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8, overflow: 'hidden', borderRadius: 20 },
  helpBannerContent: { zIndex: 1, alignItems: 'center' },
  helpBannerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  helpBannerSubtitle: { fontSize: 12, color: '#E0E7FF', textAlign: 'center', lineHeight: 18, marginBottom: 20, paddingHorizontal: 10 },
  helpBannerButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  helpBtnWhite: { flex: 1, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  helpBtnTextPrimary: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  sectionSpacing: { height: 10 },
  iconBox: { borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F8FAFC'
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F8FAFC'
  },
  eventCardContent: { flex: 1 },
  eventTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  eventDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventDateText: { fontSize: 11, color: '#9CA3AF' },
  topStudentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: { fontSize: 12, fontWeight: '700' },
  topStudentInfo: { flex: 1 },
  topStudentName: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  topStudentClass: { fontSize: 11, color: '#6B7280' },
  topStudentPercentage: { fontSize: 13, fontWeight: '700', color: '#10B981' },
  sectionHeaderSpaceBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: '#3B82F6' },
  activityBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F8FAFC'
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityAvatarBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: { flex: 1, justifyContent: 'center' },
  activityName: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  activityAction: { fontSize: 11, color: '#6B7280', marginBottom: 4, lineHeight: 15 },
  activityDateText: { fontSize: 10, color: '#9CA3AF' },
});

export default TeacherDashboard;
