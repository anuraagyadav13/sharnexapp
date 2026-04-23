/* 
  SHARNEX PREMIUM STUDENT DASHBOARD - USER REFERENCE MERGED 
  Sync Date: 2026-04-10
*/
import React, { useCallback, useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { 
  FadeInUp, 
  FadeInDown,
  ZoomIn,
  SlideInRight,
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
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';

const DashboardSkeleton = () => {
  const { theme } = useTheme();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
         <Skeleton width={30} height={30} borderRadius={6} />
         <Skeleton width="40%" height={24} borderRadius={6} />
         <View style={{flexDirection: 'row', gap: 10}}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={32} height={32} borderRadius={16} />
         </View>
      </View>

      <View style={styles.section}>
        <Skeleton width="100%" height={160} borderRadius={16} />
      </View>

      <View style={styles.section}>
         <View style={styles.statsRow}>
            <Skeleton width="31%" height={100} borderRadius={12} />
            <Skeleton width="31%" height={100} borderRadius={12} />
            <Skeleton width="31%" height={100} borderRadius={12} />
         </View>
      </View>

      <View style={styles.section}>
         <Skeleton width={120} height={20} style={{marginBottom: 16}} />
         <View style={styles.quickActionsGrid}>
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} width="31%" height={90} borderRadius={16} />)}
         </View>
      </View>
    </ScrollView>
  );
};


type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentDashboard'>;

interface Props {
  navigation: DashboardNavigationProp;
}

// --- Icons & Badges Helpers ---
const IconBox = ({ name, color = '#fff', bgColor, size = 50, iconSize = 24, iconLibrary = 'Ionicons' }: { name: string, color?: string, bgColor: string, size?: number, iconSize?: number, iconLibrary?: string }) => {
  const IconComponent = iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.iconBox, { width: size, height: size, backgroundColor: bgColor }]}>
      <IconComponent name={name} size={iconSize} color={color} />
    </View>
  );
};

// --- Subcomponents ---

const QuickActionCard = React.memo(({ title, iconName, bgColor, delay, iconLibrary = 'Ionicons', onPress }: { title: string, iconName: string, bgColor: string, delay: number, iconLibrary?: string, onPress?: () => void }) => {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={[styles.quickActionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity style={styles.quickActionTouchable} activeOpacity={0.7} onPress={onPress}>
        <IconBox name={iconName} bgColor={bgColor} iconLibrary={iconLibrary} />
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const ScheduleCard = React.memo(({ time, title, teacher, room, color, status, isOngoing, bgStyleColor, borderStyleColor }: any) => {
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

        <Text style={[styles.scheduleTeacher, { color: theme.text }]} numberOfLines={1}>{teacher}</Text>

        <View style={styles.scheduleBottomRow}>
          <Text style={[styles.scheduleRoom, { color: theme.subtext }]}>{room}</Text>
          {isOngoing && (
            <TouchableOpacity style={[styles.joinClassBtn, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
              <Text style={[styles.joinClassBtnText, { color }]}>Join Class →</Text>
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
    <View style={[styles.eventCard, { backgroundColor: theme.surface, borderLeftColor: color, borderLeftWidth: 4, borderColor: theme.border }]}>
      <View style={styles.eventCardContent}>
        <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={1}>{title}</Text>
        <View style={styles.eventDateContainer}>
          <Ionicons name="calendar-outline" size={14} color={theme.subtext} />
          <Text style={[styles.eventDateText, { color: theme.subtext }]}>{date}</Text>
        </View>
      </View>
    </View>
  );
});

const TopStudentCard = React.memo(({ rank, name, className, percentage }: any) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.topStudentCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.rankCircle}>
        <Text style={[styles.rankText, { color: theme.primary }]}>{rank}</Text>
      </View>
      <View style={styles.topStudentInfo}>
        <Text style={[styles.topStudentName, { color: theme.text }]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.topStudentClass, { color: theme.subtext }]}>{className}</Text>
      </View>
      <Text style={[styles.topStudentPercentage, { color: theme.primary }]}>{percentage}</Text>
    </View>
  );
});

const LiveClassBanner = ({ subject, teacher, time, startTime, endTime, color }: { subject: string, teacher: string, time: string, startTime: string, endTime: string, color: string }) => {
  const { theme, isDarkMode } = useTheme();
  const [progress, setProgress] = useState(0);
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(withTiming(1, { duration: 2000 }), -1, false);
    const calculateProgress = () => {
      try {
        const now = new Date();
        const [sH, sM] = startTime.split(':').map(Number);
        const [eH, eM] = endTime.split(':').map(Number);
        const start = new Date(); start.setHours(sH, sM, 0);
        const end = new Date(); end.setHours(eH, eM, 0);
        const total = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        setProgress(Math.min(Math.max(elapsed / total, 0), 1));
      } catch (e) { setProgress(0.5); }
    };
    calculateProgress();
    const timer = setInterval(calculateProgress, 60000);
    return () => clearInterval(timer);
  }, [startTime, endTime]);

  const animatedShimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerValue.value, [0, 1], [-100, 200]) }],
    opacity: interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 1, 0.3]),
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerValue.value, [0, 0.5, 1], [0.8, 1, 0.8]),
    transform: [{ scaleY: interpolate(shimmerValue.value, [0, 0.5, 1], [1, 1.2, 1]) }],
  }));

  return (
    <Animated.View entering={FadeInUp.springify()} style={[styles.liveBanner, { 
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', 
      borderColor: isDarkMode ? '#334155' : '#FEE2E2',
      borderLeftColor: color 
    }]}>
      <View style={styles.liveBannerContent}>
        <View style={styles.liveIndicatorRow}>
          <View style={[styles.liveDot, { backgroundColor: color }]} />
          <Text style={[styles.liveText, { color }]}>LIVE NOW</Text>
        </View>
        <Text style={[styles.liveSubject, { color: theme.text }]}>{subject}</Text>
        <View style={[styles.liveTrackingContainer, { backgroundColor: isDarkMode ? '#334155' : '#FEE2E2', borderColor: isDarkMode ? '#475569' : '#FECACA' }]}>
          <Animated.View style={[styles.liveTrackingLine, { width: `${progress * 100}%` }, animatedPulseStyle]}>
             <Animated.View style={[styles.shimmerStreak, animatedShimmerStyle]} />
          </Animated.View>
        </View>
        <Text style={[styles.liveTeacher, { color: theme.subtext }]}>{teacher} • {time}</Text>
      </View>
      <TouchableOpacity style={[styles.liveJoinBtn, { backgroundColor: color }]}>
        <Text style={styles.liveJoinBtnText}>Join</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HelpCenterCard = ({ bgColor, iconName, title, desc }: { bgColor: string, iconName: string, title: string, desc: string }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.helpCenterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.helpIconContainer, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName} size={20} color="#FFFFFF" />
      </View>
      <Text style={[styles.helpCardTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.helpCardDesc, { color: theme.subtext }]}>{desc}</Text>
      <TouchableOpacity style={[styles.viewGuidesRow, { borderTopColor: theme.border }]} activeOpacity={0.7}>
        <Text style={styles.helpCardLink}>View Guides</Text>
        <Ionicons name="arrow-forward" size={14} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
};

const FAQItem = React.memo(({ question, answer, isOpen, onToggle }: { question: string, answer: string, isOpen: boolean, onToggle: () => void }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.faqItemContainer, { borderBottomColor: theme.border }]}>
      <TouchableOpacity 
        style={styles.faqHeader} 
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.faqQuestion, { color: theme.text }]}>{question}</Text>
        <Ionicons 
          name={isOpen ? "chevron-down" : "chevron-forward"} 
          size={20} 
          color={theme.primary} 
        />
      </TouchableOpacity>
      {isOpen && (
        <Animated.View entering={FadeInUp.duration(300)} style={[styles.faqAnswerContainer, { backgroundColor: theme.faqAnswer }]}>
          <Text style={[styles.faqAnswerText, { color: theme.text }]}>{answer}</Text>
        </Animated.View>
      )}
    </View>
  );
});

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


const StudentDashboard: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [topStudentsData, setTopStudentsData] = useState<any[]>([]);
  const [assignmentsData, setAssignmentsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);
  const { theme, isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const profileRes = await apiClient.get(ENDPOINTS.STUDENT.PROFILE);
        const resolvedId = profileRes.normalized?.data?.id || authState.user?.id;
        if (!resolvedId) throw new Error('No ID');

        const [dashRes, scheduleRes, assignRes] = await Promise.all([
          apiClient.get(ENDPOINTS.STUDENT.DASHBOARD(resolvedId)),
          apiClient.get(ENDPOINTS.STUDENT.SCHEDULE(resolvedId)),
          apiClient.get(ENDPOINTS.STUDENT.ASSIGNMENTS(resolvedId))
        ]);

        const dbPayload = dashRes.normalized?.data || {};
        const schedPayload = scheduleRes.normalized?.data || {};
        const assignPayload = assignRes.normalized?.data?.assignments || Array.isArray(assignRes.data) ? assignRes.data : [];

        setDashboardData(dbPayload);
        setEventsData(dbPayload.upcomingEvents || []);
        setTopStudentsData(dbPayload.topStudents || []);
        setAssignmentsData(Array.isArray(assignPayload) ? assignPayload : []);

        const slots = schedPayload.schedule || schedPayload.slots || schedPayload.timetable || (Array.isArray(schedPayload) ? schedPayload : []);
        setScheduleData(Array.isArray(slots) ? slots : []);

      } catch (error) {
        console.error('Fetch failed:', error);
        // TEMPORARY: Mock data fallback for dev work
        setDashboardData({
          attendance: { percentage: 92 },
          stats: { upcomingAssignments: 4 },
          upcomingEvents: [
            { title: 'Inter-School Debate', date: '28 May 2026', color: '#8B5CF6' },
            { title: 'Mathematics Olympiad', date: '05 Jun 2026', color: '#10B981' }
          ],
          topStudents: [
            { rank: 1, name: 'Sarah J.', percentage: '98%', color: '#8B5CF6' },
            { rank: 2, name: 'Michael C.', percentage: '96%', color: '#8B5CF6' },
          ]
        });
        setScheduleData([
          { time: '09:00', endTime: '10:00', subject: 'Advanced Mathematics', teacher: 'Dr. Sarah Smith', room: 'Lab 2', status: 'Ongoing' },
          { time: '10:15', endTime: '11:15', subject: 'Physics Core', teacher: 'Mr. Rajesh Kumar', room: 'Hall A', status: 'Upcoming' },
        ]);
        setAssignmentsData([
          { title: 'Calculus Assignment 1', subject_name: 'Mathematics', due_date: '2026-05-25' },
          { title: 'Quantum Mechanics Lab', subject_name: 'Physics', due_date: '2026-05-26' },
        ]);
      } finally { setTimeout(() => setIsLoading(false), 800); }
    };
    fetchAllData();
  }, [authState.user?.id]);

  const normalizeTime = useCallback((v: string) => {
    if (!v) return '';
    const m = v.match(/(\d{1,2}):(\d{2})/);
    return m ? `${m[1].padStart(2, '0')}:${m[2]}` : v.slice(0, 5);
  }, []);

  const calculateStatus = useCallback((s: string, e: string) => {
    try {
      if (!s || !e) return 'Upcoming';
      const now = new Date();
      const [sh, sm] = s.split(':').map(Number);
      const [eh, em] = e.split(':').map(Number);
      const start = new Date(now); start.setHours(sh, sm, 0);
      const end = new Date(now); end.setHours(eh, em, 0);
      if (now >= start && now <= end) return 'Ongoing';
      if (now > end) return 'Completed';
    } catch (err) {}
    return 'Upcoming';
  }, []);

  const processedSchedule = React.useMemo(() => {
    const dayKey = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
    return scheduleData
      .filter(s => !s.day || s.day.toUpperCase().startsWith(dayKey))
      .map(s => {
        const start = normalizeTime(s.time || s.startTime || '');
        const end = normalizeTime(s.endTime || '');
        return { 
          ...s, 
          time: start, 
          endTime: end, 
          status: calculateStatus(start, end),
          subject: typeof s.subject === 'object' ? (s.subject?.name || 'Session') : (s.subject || 'Class'),
          teacher: typeof s.teacher === 'object' ? (s.teacher?.name || 'TBA') : (s.teacher || 'TBA')
        };
      });
  }, [scheduleData, calculateStatus, normalizeTime]);

  const ongoingClass = processedSchedule.find(s => s.status === 'Ongoing');

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ScaleButton 
              style={styles.menuHandle} 
              onPress={() => setDrawerOpen(true)}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="menu" size={28} color={theme.text} />
            </ScaleButton>
            <Text style={[styles.headerTitle, { color: theme.primary }]} numberOfLines={1}>
              Welcome back, {authState.user?.name?.split(' ')[0] || 'Student'}
            </Text>
            <View style={styles.headerRight}>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.iconBackground }]}>
                <Ionicons name="notifications-outline" size={22} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconBtn, { backgroundColor: theme.iconBackground }]} 
                onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}
              >
                <Ionicons name="settings-outline" size={22} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.iconBackground }]} onPress={toggleDarkMode}>
                <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={22} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
              >
                <View style={[styles.avatar, {marginLeft: 10}]}>
                  <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'S'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

        {/* Hero Banner */}
        <Animated.View 
          entering={FadeInUp.delay(50).springify()} 
          style={[styles.heroBannerRow, { backgroundColor: isDarkMode ? '#312E81' : '#D9DAF9' }]}
        >
          <View style={styles.heroTextSide}>
            <Text style={[styles.heroRowTitle1, { color: isDarkMode ? '#F8FAFC' : '#1F2937' }]}>Transform <Text style={[styles.heroRowTitle2, { color: isDarkMode ? '#818CF8' : '#4F46E5' }]}>School</Text></Text>
            <Text style={[styles.heroRowTitle2, { color: isDarkMode ? '#818CF8' : '#4F46E5' }]}>Management with</Text>
            <Text style={[styles.heroRowTitle3, { color: isDarkMode ? '#F8FAFC' : '#1F2937' }]}>Sharnex</Text>
            <Text style={[styles.heroRowSubtitle, { color: isDarkMode ? '#CBD5E1' : '#4B5563' }]}>All-in-one platform to streamline attendance, assignments, and analytics for modern educational institutions.</Text>
          </View>
          <View style={styles.heroImageSide}>
            <Image source={require('../../assets/laptop.png')} style={styles.heroRowImage} resizeMode="contain" />
          </View>
        </Animated.View>

        {/* Stats Row */}
        {!isLoading && dashboardData && (
          <View style={styles.statsRow}>
            <StatCard title="Attendance" value={`${dashboardData.attendance?.percentage || 0}%`} color="#3B82F6" icon="calendar" />
            <StatCard title="Assignments" value={dashboardData.stats?.upcomingAssignments || 0} color="#F97316" icon="document-text" />
            <StatCard title="Avg. Score" value="85%" color="#10B981" icon="star" />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          {ongoingClass && (
            <LiveClassBanner subject={ongoingClass.subject} teacher={ongoingClass.teacher} time={`${ongoingClass.time} - ${ongoingClass.endTime}`} startTime={ongoingClass.time} endTime={ongoingClass.endTime} color="#EF4444" />
          )}
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={20} color="#3B82F6" style={styles.sectionIconMargin} />
            <Text style={[styles.sectionTitle, { color: '#3B82F6', fontSize: 18, fontWeight: '700' }]}>Quick Actions</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard delay={100} title="Ask AI" iconName="information-circle" bgColor="#8B5CF6" />
            <QuickActionCard delay={150} title="Submit Work" iconName="document-text" bgColor="#EC4899" />
            <QuickActionCard delay={200} title="Join Class" iconName="school" bgColor="#10B981" />
            <QuickActionCard delay={250} title="Download Report" iconName="file-document" bgColor="#F97316" iconLibrary="MaterialCommunityIcons" />
            <QuickActionCard delay={300} title="View Marks" iconName="stats-chart" bgColor="#D946EF" onPress={() => navigation.navigate('ResultManagement')} />
            <QuickActionCard delay={350} title="View Attendance" iconName="checkmark-circle" bgColor="#0EA5E9" onPress={() => navigation.navigate('Attendance')} />
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#4F46E5" style={styles.sectionIconMargin} /><Text style={[styles.sectionTitle, { color: '#4F46E5' }]}>Today’s Schedule</Text>
          </View>
          <View style={styles.scheduleList}>
            {isLoading ? <ActivityIndicator size="small" color="#4F46E5" /> : processedSchedule.length === 0 ? <Text style={styles.emptyText}>No classes scheduled for today.</Text> :
              processedSchedule.slice(0, 5).map((item, index) => (
                <ScheduleCard key={index} time={`${item.time} - ${item.endTime}`} title={item.subject} teacher={item.teacher} room={item.room || 'Room 1'} color={index % 2 === 0 ? "#3B82F6" : "#059669"} status={item.status} isOngoing={item.status === 'Ongoing'} bgStyleColor={item.status === 'Ongoing' ? "#F0FDF4" : undefined} borderStyleColor={item.status === 'Ongoing' ? "#86EFAC" : undefined} />
              ))
            }
          </View>
        </View>

        {/* Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#4F46E5" style={styles.sectionIconMargin} /><Text style={[styles.sectionTitle, { color: '#4F46E5' }]}>Upcoming Events</Text>
          </View>
          <View style={styles.eventList}>
            {eventsData.length === 0 ? <Text style={styles.emptyText}>No upcoming events.</Text> :
              eventsData.slice(0, 3).map((e, i) => <EventCard key={i} title={e.title} date={e.date} color={e.color || "#F97316"} />)
            }
          </View>
        </View>

        {/* Recent Assignments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#4F46E5" style={styles.sectionIconMargin} />
            <Text style={[styles.sectionTitle, { color: '#4F46E5' }]}>Recent Assignments</Text>
          </View>
          <View style={styles.assignmentList}>
            {assignmentsData.length === 0 ? (
              <Text style={styles.emptyText}>No recent assignments found.</Text>
            ) : (
              assignmentsData.slice(0, 3).map((item, index) => (
                <TouchableOpacity key={index} style={styles.assignmentCard} activeOpacity={0.8}>
                   <View style={styles.assignIconWrapper}>
                      <Ionicons name="document-text-outline" size={20} color="#6366F1" />
                   </View>
                   <View style={styles.assignContent}>
                      <Text style={styles.assignSubject} numberOfLines={1}>{item.subject_name || item.subject || 'Course'}</Text>
                      <Text style={styles.assignTitle} numberOfLines={1}>{item.title || 'Untitled Assignment'}</Text>
                      <View style={styles.assignFooter}>
                         <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                         <Text style={styles.assignDueDate}>Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}</Text>
                      </View>
                   </View>
                   <Ionicons name="chevron-forward" size={16} color="#E2E8F0" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Premium Top 5 Students Section */}
        <View style={styles.section}>
          <View style={[styles.topRankingContainer, { 
            backgroundColor: isDarkMode ? '#1E1B4B' : '#2DD4BF',
            borderColor: isDarkMode ? '#4F46E5' : '#14B8A6'
          }]}>
            <View style={styles.topRankingHeader}>
               <Text style={styles.topRankingHeaderEmoji}>🏆</Text>
               <Text style={styles.topRankingHeaderText}>Top 5 Students this year</Text>
            </View>
            
            <View style={styles.topRankingGrid}>
               {(topStudentsData && topStudentsData.length > 0 ? topStudentsData : [
                  { rank: 1, name: 'Sarah J.', percentage: '98%', color: '#8B5CF6' },
                  { rank: 2, name: 'Michael C.', percentage: '96%', color: '#8B5CF6' },
                  { rank: 3, name: 'Emily R.', percentage: '95%', color: '#8B5CF6' },
                  { rank: 4, name: 'David W.', percentage: '94%', color: '#8B5CF6' },
                  { rank: 5, name: 'Jessica L.', percentage: '93%', color: '#8B5CF6' }
               ]).slice(0, 5).map((student, index) => (
                  <View key={index} style={[styles.topRankCardWrapper, index === 4 && styles.lastTopRankCard]}>
                    <View style={[styles.topRankCard, { backgroundColor: theme.surface }]}>
                       <View style={[styles.topRankCircle, { backgroundColor: student.color || '#8B5CF6' }]}>
                          <Text style={styles.topRankCircleText}>{student.name?.charAt(0) || 'S'}</Text>
                       </View>
                       <Text style={[styles.topRankName, { color: theme.text }]} numberOfLines={1}>{student.name}</Text>
                       <Text style={[styles.topRankPercent, { color: theme.primary }]}>{student.percentage}</Text>
                       <View style={[styles.topRankBadge, { backgroundColor: isDarkMode ? theme.primary : '#FACC15' }]}>
                          <Text style={styles.topRankBadgeText}>TOP</Text>
                       </View>
                    </View>
                  </View>
               ))}
            </View>
          </View>
        </View>

        {/* Help Center */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={20} color={theme.primary} style={styles.sectionIconMargin} />
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Student Help Center</Text>
          </View>
          <View style={styles.helpCenterGrid}>
            <HelpCenterCard bgColor="#4F46E5" iconName="help" title="Assignments" desc="How to submit assignments and track progress." />
            <HelpCenterCard bgColor="#10B981" iconName="bar-chart" title="Grades" desc="Understanding your marks and GPA calculation." />
            <HelpCenterCard bgColor="#EF4444" iconName="tv-outline" title="Technical Support" desc="Troubleshooting app problems and questions." />
            <HelpCenterCard bgColor="#A855F7" iconName="book" title="Study Resources" desc="Accessing study materials and resources." />
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={20} color={theme.primary} style={styles.sectionIconMargin} />
            <Text style={[styles.sectionTitleNoMargin, { color: theme.primary }]}>Frequently Asked Questions</Text>
          </View>
          <View style={[styles.faqListContainer, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
            <FAQItem 
              question="How do I submit an assignment?" 
              answer="Go to Assignments page, select the assignment, and click Submit button." 
              isOpen={expandedFaqId === 0}
              onToggle={() => setExpandedFaqId(expandedFaqId === 0 ? null : 0)}
            />
            <FAQItem 
              question="Where can I check my grades?" 
              answer="Navigate to Grades & Reports section from the sidebar menu." 
              isOpen={expandedFaqId === 1}
              onToggle={() => setExpandedFaqId(expandedFaqId === 1 ? null : 1)}
            />
            <FAQItem 
              question="How do I view my attendance?" 
              answer="Click on Attendance in the sidebar to view your detailed attendance calendar." 
              isOpen={expandedFaqId === 2}
              onToggle={() => setExpandedFaqId(expandedFaqId === 2 ? null : 2)}
            />
            <FAQItem 
              question="Where are the quiz results?" 
              answer="Quiz results are available in the Quizzes & Tests section after completion." 
              isOpen={expandedFaqId === 3}
              onToggle={() => setExpandedFaqId(expandedFaqId === 3 ? null : 3)}
            />
          </View>
        </View>

        {/* Need Help */}
        <View style={styles.needHelpBanner}>
          <View style={StyleSheet.absoluteFill}>
            <Svg height="100%" width="100%"><Defs><SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0" stopColor="#6366F1" stopOpacity="1" /><Stop offset="1" stopColor="#4F46E5" stopOpacity="1" /></SvgLinearGradient></Defs><Rect width="100%" height="100%" fill="url(#grad)" rx="24" ry="24" /></Svg>
          </View>
          <Text style={styles.needHelpTitle}>Need More Help?</Text>
          <Text style={styles.needHelpDesc}>We're here to help you succeed! Contact us for any academic or technical questions.</Text>
          <View style={styles.needHelpButtonsRow}>
            <TouchableOpacity style={styles.helpButtonOutlined}><Text style={styles.helpButtonText}>Support</Text></TouchableOpacity>
            <TouchableOpacity style={styles.helpButtonOutlined}><Text style={styles.helpButtonText}>Ask a Teacher</Text></TouchableOpacity>
          </View>
        </View>

      </ScrollView>
      )}

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="student" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 30, paddingBottom: 24, backgroundColor: '#FAFAFF' },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#A855F7', justifyContent: 'center', alignItems: 'center', shadowColor: '#A855F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 8 },
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
  sectionHeaderSpaceBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  sectionIconMargin: { marginRight: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#4F46E5', letterSpacing: -0.5 },
  sectionTitleNoMargin: { fontSize: 20, fontWeight: '800', color: '#4F46E5', letterSpacing: -0.5, marginLeft: 0, marginBottom: 16 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  quickActionCard: { width: '31%', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 4, borderWidth: 1, borderColor: '#F8FAFC', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  quickActionTouchable: { alignItems: 'center' },
  quickActionTitle: { fontSize: 11, fontWeight: '600', color: '#374151', marginTop: 10, textAlign: 'center' },
  statCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0', width: '31%', minHeight: 110 },
  statTitle: { fontSize: 10, fontWeight: '700', color: '#6B7280', marginTop: 6, textAlign: 'center', width: '100%' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginTop: 2 },
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
  eventList: { gap: 12 },
  eventCard: { backgroundColor: '#FFFFFF', borderRadius: 14, flexDirection: 'row', borderWidth: 1, borderColor: '#F8FAFC', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  eventCardContent: { flex: 1, paddingVertical: 16, paddingHorizontal: 16 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  eventDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventDateText: { fontSize: 13, color: '#9CA3AF' },
  awardBadge: { backgroundColor: '#F97316', paddingVertical: 6, borderRadius: 16, width: 96, alignItems: 'center', justifyContent: 'center' },
  awardBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  topRankingContainer: { backgroundColor: '#2DD4BF', borderRadius: 24, paddingVertical: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: '#14B8A6' },
  topRankingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  topRankingHeaderEmoji: { fontSize: 18, marginRight: 8 },
  topRankingHeaderText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  topRankingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  topRankCardWrapper: { width: '48%', marginBottom: 12 },
  lastTopRankCard: { width: '48%', alignSelf: 'center' },
  topRankCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  topRankCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  topRankCircleText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  topRankName: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  topRankPercent: { fontSize: 14, fontWeight: '800', color: '#4F46E5', marginBottom: 6 },
  topRankBadge: { backgroundColor: '#FACC15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  topRankBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF' },
  helpCenterGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  helpCenterCard: { width: '48%', height: 204, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F8FAFC', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  helpIconContainer: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  helpCardTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 18 },
  helpCardDesc: { fontSize: 10, color: '#6B7280', lineHeight: 14 },
  viewGuidesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  helpCardLink: { fontSize: 11, fontWeight: '700', color: '#3B82F6' },
  faqListContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  faqItemContainer: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12 },
  faqAnswerContainer: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginHorizontal: 10, marginBottom: 16 },
  faqAnswerText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  faqQuestion: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 },
  needHelpBanner: { paddingVertical: 24, paddingHorizontal: 20, marginHorizontal: 20, marginTop: 32, marginBottom: 40, alignItems: 'center', shadowColor: '#5A67D8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8, overflow: 'hidden', borderRadius: 20 },
  needHelpTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, zIndex: 2 },
  needHelpDesc: { fontSize: 12, color: '#E0E7FF', textAlign: 'center', lineHeight: 18, marginBottom: 20, paddingHorizontal: 10, zIndex: 2 },
  needHelpButtonsRow: { flexDirection: 'row', gap: 12, width: '100%', zIndex: 2 },
  helpButtonOutlined: { flex: 1, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  helpButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24 },
  statIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 20, fontWeight: '500' },
  liveBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 4, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, borderWidth: 1, borderColor: '#FEE2E2' },
  liveBannerContent: { flex: 1 },
  liveIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  liveSubject: { fontSize: 16, fontWeight: '700', color: '#111827' },
  liveTeacher: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  liveJoinBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginLeft: 12 },
  liveJoinBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  liveTrackingContainer: { height: 8, width: '100%', backgroundColor: '#FEE2E2', borderRadius: 4, overflow: 'hidden', marginTop: 10, marginBottom: 8, borderWidth: 1, borderColor: '#FECACA' },
  liveTrackingLine: { height: '100%', backgroundColor: '#EF4444', borderRadius: 4 },
  shimmerStreak: { position: 'absolute', top: 0, bottom: 0, width: 60, backgroundColor: 'rgba(255, 255, 255, 0.6)', zIndex: 2 },
  iconBox: { borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  scheduleTimeWrapper: { flex: 1, justifyContent: 'center' },
  assignmentList: { gap: 12 },
  assignmentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  assignIconWrapper: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  assignContent: { flex: 1 },
  assignSubject: { fontSize: 10, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', marginBottom: 2 },
  assignTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  assignFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assignDueDate: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
});

export default StudentDashboard;
