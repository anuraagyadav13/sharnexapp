import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

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

const StatCard = React.memo(({ title, value, subtext1, subtext2, subtextColor, iconName, iconColor }: any) => {
  return (
    <View style={styles.statCardHalfAligned}>
      <Ionicons name={iconName} size={28} color={iconColor} style={styles.statIconNoBg} />
      <Text style={styles.statTitleHalfAligned} numberOfLines={1}>{title}</Text>
      <Text style={styles.statValueHalfAligned}>{value}</Text>
      <Text style={[styles.statSubtext1HalfAligned, { color: subtextColor }]} numberOfLines={1}>{subtext1}</Text>
      <Text style={styles.statSubtext2HalfAligned} numberOfLines={1}>{subtext2}</Text>
    </View>
  );
});

const QuickActionCard = React.memo(({ title, iconName, bgColor, delay, onPress, iconLibrary = 'Ionicons' }: any) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.quickActionCard}>
    <TouchableOpacity style={styles.quickActionTouchable} activeOpacity={0.7} onPress={onPress}>
      <IconBox name={iconName} bgColor={bgColor} iconLibrary={iconLibrary} />
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  </Animated.View>
));

const ScheduleCard = React.memo(({ time, title, classSection, room, color, status, isOngoing, bgStyleColor, borderStyleColor }: any) => {
  const isSpecialBg = !!bgStyleColor;
  return (
    <View style={[
      styles.scheduleCard,
      isSpecialBg ? {
        backgroundColor: bgStyleColor,
        borderColor: borderStyleColor,
        shadowColor: borderStyleColor,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 6
      } : { borderColor: `${color}40` }
    ]}>
      <View style={styles.scheduleLeftCol}>
        <View style={[styles.scheduleCardIndicator, { backgroundColor: color }]} />
        <View style={styles.scheduleTimeWrapper}>
          <Text style={styles.scheduleTime} numberOfLines={1}>{time}</Text>
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
              <Ionicons name="checkmark" size={14} color="#4B5563" />
              <Text style={styles.scheduleStatus}>Completed</Text>
            </View>
          )}
          {status === 'Up next' && (
            <View style={styles.statusContainer}>
              <Ionicons name="ellipse-outline" size={12} color="#4F46E5" />
              <Text style={styles.scheduleUpNext}>Up next</Text>
            </View>
          )}
        </View>

        <Text style={styles.scheduleTeacher}>{classSection}</Text>

        <View style={styles.scheduleBottomRow}>
          <Text style={styles.scheduleRoom}>{room}</Text>
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

const LiveSessionBanner = ({ subject, classSection, time, color }: any) => (
  <Animated.View entering={FadeInUp.springify()} style={[styles.liveBanner, { borderLeftColor: color }]}>
    <View style={styles.liveBannerContent}>
      <View style={styles.liveIndicatorRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>CLASS IN PROGRESS</Text>
      </View>
      <Text style={styles.liveSubject}>{subject}</Text>
      <Text style={styles.liveClassName}>{classSection} • {time}</Text>
    </View>
    <TouchableOpacity style={[styles.liveJoinBtn, { backgroundColor: color }]}>
      <Text style={styles.liveJoinBtnText}>Start Session</Text>
    </TouchableOpacity>
  </Animated.View>
);

const TeacherDashboard: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Use User ID from authState directly
        const teacherId = authState.user?.id;
        if (!teacherId) {
          setError('Teacher ID not found');
          return;
        }

        // Fetch dashboard summary and schedule
        // @ts-ignore
        const summaryRes = await apiClient.get(ENDPOINTS.TEACHER.DASHBOARD(teacherId));
        const summaryData = summaryRes.data.data || summaryRes.data;
        
        setDashboardData(summaryData);
      } catch (error: any) {
        console.error('Failed to fetch teacher dashboard:', error);
        setError('Failed to load dashboard. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.globalHeader}>
          <ScaleButton
            style={styles.menuHandle}
            onPress={() => setDrawerOpen(true)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
            scaleTo={0.85}
          >
            <Ionicons name="menu" size={28} color="#1F2937" />
          </ScaleButton>
          <Text style={styles.headerTitle} numberOfLines={1}>Welcome back, {authState.user?.name?.split(' ')[0] || 'Teacher'}</Text>
          <View style={styles.headerRight}>
            <Ionicons name="notifications-outline" size={22} color="#1F2937" />
            <Ionicons name="settings-outline" size={22} color="#1F2937" />
            <Ionicons name="moon-outline" size={22} color="#1F2937" />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
            </View>
          </View>
        </View>

        {/* Hero Banner (Similar to StudentDashboard)
        <Animated.View entering={FadeInUp.delay(50).springify()} style={styles.heroBannerRow}>
          <View style={styles.heroTextSide}>
            <Text style={styles.heroRowTitle1}>
              Empower <Text style={styles.heroRowTitle2}>Teaching</Text>
            </Text>
            <Text style={styles.heroRowTitle3}>with Sharnex</Text>
            <Text style={styles.heroRowSubtitle}>
              Easily manage attendance, assignments, and quizzes all in one platform.
            </Text>
          </View>
          <View style={styles.heroImageSide}>
            <Image
              source={require('../../assets/laptop.png')}
              style={styles.heroRowImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View> */}

        {/* Overview Stats - All in one row, student style */}
        <View style={styles.section}>
          {/* Live Session Hot-Link */}
          {(() => {
            const ongoingSession = dashboardData?.todaysSchedule?.find((s: any) => s.status === 'Ongoing');
            if (ongoingSession) {
              return (
                <LiveSessionBanner 
                  subject={ongoingSession.subject_name || ongoingSession.type}
                  classSection={ongoingSession.class_name}
                  time={`${ongoingSession.start_time} - ${ongoingSession.end_time}`}
                  color="#D946EF"
                />
              );
            }
            return null;
          })()}

          {error ? (
            <View style={{ padding: 16, backgroundColor: '#FEE2E2', borderRadius: 12, marginHorizontal: 16 }}>
              <Text style={{ color: '#DC2626', fontWeight: '500' }}>{error}</Text>
            </View>
          ) : (
            <View style={styles.statsRowHorizontalAligned}>
            <StatCard
              title="Today's Classes"
              value={dashboardData?.todaysSchedule?.length || 0}
              subtext1={`${dashboardData?.todaysSchedule?.filter((s: any) => s.status === 'Completed').length || 0} Completed`}
              subtext2={`${dashboardData?.todaysSchedule?.filter((s: any) => s.status !== 'Completed').length || 0} Remaining`}
              subtextColor="#3B82F6"
              iconName="calendar"
              iconColor="#3B82F6"
            />
            <StatCard
              title="Pending Grading"
              value={dashboardData?.stats?.pendingGrading || 0}
              subtext1="Assignments"
              subtext2="Needs Review"
              subtextColor="#F59E0B"
              iconName="clipboard"
              iconColor="#F59E0B"
            />
            <StatCard
              title="Total Students"
              value={dashboardData?.stats?.totalStudents || 84}
              subtext1="Active"
              subtext2="Enrolled"
              subtextColor="#10B981"
              iconName="people"
              iconColor="#10B981"
            />
          </View>
            )}
        </View>

        {/* Quick Actions (Similar to StudentDashboard) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={20} color="#3B82F6" style={styles.sectionIconMargin} />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard delay={100} title="Attendance" iconName="checkmark-circle" bgColor="#10B981" onPress={() => navigation.navigate('TeacherAttendance')} />
            <QuickActionCard delay={150} title="Assignments" iconName="document-text" bgColor="#8B5CF6" onPress={() => navigation.navigate('TeacherAssignment')} />
            <QuickActionCard delay={200} title="Quizzes" iconName="time" bgColor="#EAB308" onPress={() => navigation.navigate('TeacherQuiz')} />
            <QuickActionCard delay={250} title="Live Monitor" iconName="pulse" bgColor="#EC4899" onPress={() => navigation.navigate('TeacherMonitorLive', { quizId: '1' })} />
          </View>
        </View>

        {/* Today's Schedule (Similar to StudentDashboard) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#4F46E5" style={styles.sectionIconMargin} />
            <Text style={styles.sectionTitle}>Today’s Schedule</Text>
          </View>
          <View style={styles.scheduleList}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : dashboardData?.todaysSchedule?.length === 0 ? (
              <Text style={styles.emptyText}>No classes scheduled for today.</Text>
            ) : (
              dashboardData?.todaysSchedule?.map((item: any, index: number) => (
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

      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="teacher"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  iconBox: { borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },

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

  heroBannerRow: {
    backgroundColor: '#D9DAF9', flexDirection: 'row', alignItems: 'center',
    paddingVertical: 24, paddingLeft: 16, paddingRight: 0, overflow: 'hidden', minHeight: 180,
  },
  heroTextSide: { width: '58%', paddingRight: 8, alignItems: 'center' },
  heroRowTitle1: { fontSize: 20, fontWeight: '800', color: '#2563EB', textAlign: 'center' },
  heroRowTitle2: { fontSize: 20, fontWeight: '800', color: '#D946EF', textAlign: 'center' },
  heroRowTitle3: { fontSize: 20, fontWeight: '800', color: '#7C3AED', textAlign: 'center', marginBottom: 8 },
  heroRowSubtitle: { fontSize: 10, color: '#4B5563', lineHeight: 15, textAlign: 'center', fontWeight: '500' },
  heroImageSide: { width: '42%', justifyContent: 'center', alignItems: 'flex-start' },
  heroRowImage: { width: '100%', height: 140 },

  section: { paddingHorizontal: 16, marginTop: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionIconMargin: { marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  // Stats
  statsGridContainer: { gap: 12 },
  // New horizontal row for stats, perfectly aligned
  statsRowHorizontalAligned: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    marginBottom: 8,
  },
  // Remove old statsRow if not used elsewhere
  statFullCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  statFullHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statIconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statTitle: { fontSize: 15, fontWeight: '600', color: '#4B5563' },
  statFullValue: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8 },
  statFullFooter: { flexDirection: 'row', alignItems: 'center' },
  statSubtext1: { fontSize: 13, fontWeight: '600' },
  statSubtext2: { fontSize: 12, color: '#9CA3AF', marginLeft: 6 },
  statCardHalfAligned: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 10,
    flex: 1,
    marginHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    minWidth: 100,
    maxWidth: 140,
  },
  statIconNoBg: {
    marginBottom: 10,
  },
  statTitleHalfAligned: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22223B',
    marginBottom: 2,
    textAlign: 'center',
  },
  statValueHalfAligned: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
    textAlign: 'center',
  },
  statSubtext1HalfAligned: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 0,
    textAlign: 'center',
  },
  statSubtext2HalfAligned: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  quickActionCard: { width: '22%', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 4, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  quickActionTouchable: { alignItems: 'center' },
  quickActionTitle: { fontSize: 10, fontWeight: '600', color: '#374151', marginTop: 10, textAlign: 'center' },

  scheduleList: { gap: 12 },
  scheduleCard: { backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', borderWidth: 1, borderColor: '#E5E7EB', paddingRight: 10, height: 80, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
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
  joinClassBtn: { paddingHorizontal: 10, paddingVertical: 14, borderRadius: 8, borderWidth: 1 },
  joinClassBtnText: { fontSize: 10, fontWeight: '600' },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: '#D946EF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FDF4FF',
  },
  liveBannerContent: { flex: 1 },
  liveIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D946EF' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#D946EF', letterSpacing: 0.5 },
  liveSubject: { fontSize: 16, fontWeight: '700', color: '#111827' },
  liveClassName: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  liveJoinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 12,
  },
  liveJoinBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});

export default TeacherDashboard;
