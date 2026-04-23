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
         <Skeleton width={120} height={20} style={{marginBottom: 20}} />
         <View style={styles.quickActionsGrid}>
            {[1,2,3,4,5,6,7,8,9].map(i => <Skeleton key={i} width="31%" height={110} borderRadius={16} />)}
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
        
        <View style={styles.liveProgressContainer}>
           <View style={[styles.liveProgressBar, { backgroundColor: isDarkMode ? '#334155' : '#FDF4FF' }]}>
              <View style={[styles.liveProgressFill, { width: '45%', backgroundColor: color }]}>
                 <Animated.View style={[styles.shimmerStreak, animatedShimmerStyle]} />
              </View>
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const teacherId = authState.user?.id;
        if (!teacherId) {
          setError('Teacher ID not found');
          return;
        }

        // Fetch dashboard summary and unified pending tasks in parallel
        const [summaryRes, tasksRes] = await Promise.all([
          // @ts-ignore
          apiClient.get(ENDPOINTS.TEACHER.DASHBOARD(teacherId)),
          apiClient.get(ENDPOINTS.TEACHER.PENDING_TASKS(teacherId)).catch(() => ({ data: { tasks: [] } }))
        ]);

        // Handle normalized response appropriately
        const payload = summaryRes.normalized?.data?.summary || summaryRes.data?.summary || summaryRes.data?.data || summaryRes.data;
        setDashboardData(payload);

        // Process Pending Tasks from the unified API
        const tasks = tasksRes.data?.tasks || tasksRes.data || [];
        setPendingTasks(tasks);

        // Pending tasks are now fully handled by the unified API
        setPendingTasks(tasks);
      } catch (error: any) {
        console.error('Failed to fetch teacher dashboard:', error);
        // TEMPORARY: Mock data fallback for dev work
          setDashboardData({
            stats: { totalStudents: 154, avgAttendance: 88, activeQuizzes: 3, pendingGrading: 12 },
            todaysSchedule: [
              { start_time: '08:30', end_time: '09:30', subject_name: 'Mathematics', class_name: 'Class 10', section: 'A', room_name: 'Room 201', status: 'Ongoing' },
              { start_time: '10:00', end_time: '11:00', subject_name: 'Science', class_name: 'Class 9', section: 'B', room_name: 'Lab 1', status: 'Upcoming' },
            ],
            upcomingEvents: [
              { title: 'Annual Sports Day', date: '25 May 2026', color: '#EF4444' },
              { title: 'Parent Teacher Meeting', date: '02 Jun 2026', color: '#F59E0B' },
              { title: 'Summer Vacation Starts', date: '15 Jun 2026', color: '#10B981' }
            ],
            topStudents: [
              { rank: 1, name: 'Aditya Sharma', className: '12-A', percentage: '98.5%' },
              { rank: 2, name: 'Priya Patel', className: '10-C', percentage: '97.2%' },
              { rank: 3, name: 'Rahul Verma', className: '11-B', percentage: '95.8%' }
            ]
          });
        setPendingTasks([
          { id: '1', type: 'marking', title: 'Grade Quiz: Calculus', subtitle: '32 submissions pending', icon: 'clipboard-edit-outline', color: '#8B5CF6', data: { examId: 'q1', classId: 'c1' } },
          { id: '2', type: 'assignment', title: 'Review Physics Project', subtitle: 'Due in 2 days', icon: 'file-document-outline', color: '#10B981', data: { id: 'a1', classId: 'c2' } },
        ]);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Global Header */}
          <View style={styles.header}>
            <ScaleButton 
              style={styles.menuHandle} 
              onPress={() => setDrawerOpen(true)}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="menu" size={28} color="#1F2937" />
            </ScaleButton>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Welcome, {authState.user?.name?.split(' ')[0] || 'Teacher'}
            </Text>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={22} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('TeacherProfile')} style={styles.iconBtn}>
                <Ionicons name="settings-outline" size={22} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleDarkMode} style={styles.iconBtn}>
                <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={22} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('TeacherProfile')}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
                </View>
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
              badge={dashboardData?.todaysSchedule?.length || 0}
              onPress={() => navigation.navigate('TeacherAttendance')}
            />
            <QuickActionCard
              delay={150}
              title="Assignments"
              iconName="document-text"
              bgColor="#8B5CF6"
              badge={dashboardData?.stats?.pendingGrading || 0}
              onPress={() => navigation.navigate('TeacherAssignment')}
            />
            <QuickActionCard
              delay={200}
              title="Quizzes"
              iconName="time"
              bgColor="#EAB308"
              badge={dashboardData?.stats?.activeQuizzes || 0}
              onPress={() => navigation.navigate('TeacherQuiz')}
            />
            <QuickActionCard 
              delay={250} 
              title="Performance" 
              iconName="bar-chart" 
              bgColor="#3B82F6" 
              onPress={() => navigation.navigate('TeacherResult')}
            />
            <QuickActionCard 
              delay={300} 
              title="Materials" 
              iconName="book" 
              bgColor="#10B981" 
              onPress={() => navigation.navigate('TeacherMaterial')}
            />
            <QuickActionCard 
              delay={350} 
              title="Live Monitor" 
              iconName="pulse" 
              bgColor="#EC4899" 
              onPress={() => navigation.navigate('TeacherLiveClass')}
            />
            <QuickActionCard 
              delay={400} 
              title="Equipment" 
              iconName="construct" 
              bgColor="#F59E0B" 
              onPress={() => navigation.navigate('TeacherEquipment')}
            />
            <QuickActionCard 
              delay={450} 
              title="Leave Entry" 
              iconName="calendar-outline" 
              bgColor="#6366F1" 
              onPress={() => navigation.navigate('TeacherLeave')}
            />
            <QuickActionCard
              delay={500}
              title="Exam Records"
              iconName="list-outline"
              bgColor="#F97316"
              badge={pendingTasks.filter(t => t.type === 'marking').length || 0}
              onPress={() => navigation.navigate('TeacherResult')}
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

        {/* Pending Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#3B82F6" style={styles.sectionIconMargin} />
            <Text style={styles.sectionTitle}>Pending Tasks</Text>
          </View>
          <View style={styles.pendingTasksList}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#3B82F6" style={{ marginVertical: 20 }} />
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
                        examId: task.data.examId,
                        classId: task.data.classId,
                        subjectId: task.data.subjectId,
                        examName: task.data.examName,
                        className: task.data.className,
                        subjectName: task.data.subjectName
                      });
                    } else if (task.type === 'review') {
                      navigation.navigate('TeacherReviewSubmission', {
                        examId: task.data.exam_id,
                        classId: task.data.class_id,
                        examName: task.data.exam_name,
                        className: task.data.class_name
                      });
                    } else if (task.type === 'assignment') {
                      navigation.navigate('TeacherViewSubmission', {
                        assignmentId: task.data.id,
                        classId: task.data.classId,
                        title: task.data.title,
                        className: task.data.class
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
              {(dashboardData?.topStudents || []).map((student: any, index: number) => (
                <TopStudentCard
                  key={index}
                  rank={student.rank}
                  name={student.name}
                  className={student.className}
                  percentage={student.percentage}
                />
              ))}
            </View>
          </View>

          {/* Upcoming Events */}
          <View style={{ flex: 0.9 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Events</Text>
            <View style={{ gap: 10 }}>
              {(dashboardData?.upcomingEvents || []).map((event: any, index: number) => (
                <EventCard
                  key={index}
                  title={event.title}
                  date={event.date}
                  color={event.color || '#4F46E5'}
                />
              ))}
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
            <ActivityItem 
              iconName="people" 
              iconBgColor="#3B82F6" 
              name="Ms. Anjali Verma" 
              action="Uploaded Mathematics exam results" 
              time="Today, 10:30 AM" 
              isLast={false} 
            />
            <ActivityItem 
              iconName="person-add" 
              iconBgColor="#8B5CF6" 
              name="Mr. Rajesh Kumar" 
              action="Added 5 new students to Class 11-B" 
              time="Yesterday, 3:45 PM" 
              isLast={false} 
            />
            <ActivityItem 
              iconLibrary="MaterialCommunityIcons"
              iconName="checkbox-marked-circle-outline" 
              iconBgColor="#10B981" 
              name="Ms. Emily Rodriguez" 
              action="Submitted Physics lab equipment request" 
              time="Yesterday, 11:20 AM" 
              isLast={true} 
            />
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
                {dashboardData?.upcomingEvents?.length > 0 ? (
                  dashboardData.upcomingEvents.map((event: any, index: number) => (
                    <Animated.View
                      key={index}
                      entering={FadeInUp.delay(index * 150).springify()}
                      style={styles.announcementItem}
                    >
                      <Text style={styles.announcementBullet}>•</Text>
                      <Text style={styles.announcementText}>
                        <Text style={styles.boldText}>{event.title}</Text>: {event.date}
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
              <TouchableOpacity key={index} style={styles.helpCard}>
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
                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
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
                <TouchableOpacity style={styles.helpBtnWhite}>
                  <Text style={styles.helpBtnTextPrimary}>Contact Support</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.helpBtnWhite}>
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
