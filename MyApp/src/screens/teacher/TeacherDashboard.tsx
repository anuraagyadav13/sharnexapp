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
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.quickActionTouchable}>
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

        // Fetch dashboard summary, work items, and review items in parallel
        const [summaryRes, workRes, reviewRes, assignmentRes, quizRes] = await Promise.all([
          // @ts-ignore
          apiClient.get(ENDPOINTS.TEACHER.DASHBOARD(teacherId)),
          apiClient.get(ENDPOINTS.TEACHER.RMS_WORK_ITEMS).catch(() => ({ data: { items: [] } })),
          apiClient.get(ENDPOINTS.TEACHER.RMS_REVIEW_ITEMS).catch(() => ({ data: { items: [] } })),
          apiClient.get(ENDPOINTS.TEACHER.ASSIGNMENTS(teacherId)).catch(() => ({ data: { assignments: [] } })),
          apiClient.get(ENDPOINTS.TEACHER.TEACHER_QUIZZES(teacherId)).catch(() => ({ data: [] }))
        ]);

        // Handle normalized response appropriately
        const payload = summaryRes.normalized?.data?.summary || summaryRes.data?.summary || summaryRes.data?.data || summaryRes.data;
        setDashboardData(payload);

        // Process Pending Tasks from RMS and Assignments
        const workItems = Array.isArray(workRes.data) ? workRes.data : workRes.data?.data || workRes.data?.items || [];
        const reviewItems = Array.isArray(reviewRes.data) ? reviewRes.data : reviewRes.data?.data || reviewRes.data?.items || [];
        const assignments = Array.isArray(assignmentRes.data) ? assignmentRes.data : assignmentRes.data?.assignments || [];
        const quizzes = Array.isArray(quizRes.data) ? quizRes.data : quizRes.data?.data || [];

        const tasks: any[] = [];

        // Add Marking Tasks (Status is null, DRAFT, or REJECTED)
        workItems.filter((item: any) => !item.status || item.status === 'DRAFT' || item.status === 'REJECTED')
          .forEach((item: any) => {
            tasks.push({
              id: `mark-${item.examId}-${item.classId}-${item.subjectId}`,
              title: `Enter Marks: ${item.subjectName}`,
              subtitle: `${item.className} • ${item.examName}`,
              icon: 'border-color',
              color: item.status === 'REJECTED' ? '#EF4444' : '#6366F1',
              type: 'marking',
              data: item
            });
          });

        // Add Review Tasks (Review items with pending subjects)
        reviewItems.filter((item: any) => (item.pending_subjects || 0) > 0)
          .forEach((item: any) => {
            tasks.push({
              id: `review-${item.examId}-${item.classId}`,
              title: `Review Class Results: ${item.className}`,
              subtitle: `${item.examName} • ${item.pending_subjects} Pending`,
              icon: 'rate-review',
              color: '#F59E0B',
              type: 'review',
              data: item
            });
          });

        // Add Assignment Tasks (Ungraded submissions)
        assignments.filter((item: any) => (item.submissions || 0) > (item.graded || 0))
          .forEach((item: any) => {
            tasks.push({
              id: `assignment-${item.id}`,
              title: `Grade: ${item.title}`,
              subtitle: `${item.class} • ${item.submissions - item.graded} New Submissions`,
              icon: 'file-document-edit-outline',
              color: '#10B981',
              type: 'assignment',
              data: item
            });
          });

        // Add Quiz Tasks (Live monitoring or Results review)
        quizzes.forEach((quiz: any) => {
          if (quiz.derivedStatus === 'active') {
            tasks.push({
              id: `quiz-live-${quiz.id}`,
              title: `Monitor Live Quiz: ${quiz.title}`,
              subtitle: `${quiz.className || 'Class'} • Ends at ${quiz.dueDate ? new Date(quiz.dueDate).toLocaleTimeString() : 'N/A'}`,
              icon: 'pulse',
              color: '#EF4444',
              type: 'quiz-live',
              data: quiz
            });
          } else if (quiz.derivedStatus === 'completed') {
            tasks.push({
              id: `quiz-result-${quiz.id}`,
              title: `Review Quiz Results: ${quiz.title}`,
              subtitle: `${quiz.className || 'Class'} • ${quiz.subject}`,
              icon: 'chart-bar',
              color: '#4F46E5',
              type: 'quiz-result',
              data: quiz
            });
          } else if (quiz.status === 'draft') {
            tasks.push({
              id: `quiz-draft-${quiz.id}`,
              title: `Finish Quiz Draft: ${quiz.title}`,
              subtitle: `${quiz.subject} • Incomplete`,
              icon: 'file-edit-outline',
              color: '#9CA3AF',
              type: 'quiz-draft',
              data: quiz
            });
          }
        });

        setPendingTasks(tasks);
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
                subtext1={`${(dashboardData?.todaysSchedule || []).filter((s: any) => s.status === 'Completed').length} Completed`}
                subtext2={`${(dashboardData?.todaysSchedule || []).filter((s: any) => s.status !== 'Completed').length} Remaining`}
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
            <QuickActionCard delay={250} title="Performance" iconName="bar-chart" bgColor="#3B82F6" onPress={() => navigation.navigate('TeacherPerformance')} />
            <QuickActionCard delay={300} title="Materials" iconName="book" bgColor="#10B981" onPress={() => navigation.navigate('TeacherStudyMaterial')} />
          </View>
          <View style={[styles.quickActionsGrid, { marginTop: 12 }]}>
            <QuickActionCard delay={350} title="Live Monitor" iconName="pulse" bgColor="#EC4899" onPress={() => navigation.navigate('TeacherMonitorLive', { quizId: '1' })} />
            <QuickActionCard delay={400} title="Equipment" iconName="construct" bgColor="#F59E0B" onPress={() => navigation.navigate('TeacherEquipment')} />
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
  pendingTasksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 8,
  },
  pendingTasksText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  pendingTasksList: {
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  taskIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  taskSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  announcementCard: {
    backgroundColor: '#EA580C',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
    paddingBottom: 30,
    marginTop: 0,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  announcementContent: {
    zIndex: 1,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  announcementList: {
    gap: 12,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  announcementBullet: {
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 10,
    fontWeight: '900',
    marginTop: -3,
  },
  announcementText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 19,
    flex: 1,
    fontWeight: '500',
  },
  boldText: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  helpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  helpCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 4,
  },
  helpIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  helpCardDesc: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  viewGuidesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewGuidesText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  faqList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
    marginRight: 10,
    letterSpacing: -0.1,
  },
  faqAnswerContainer: {
    padding: 18,
    paddingTop: 0,
    backgroundColor: '#F9FAFB',
  },
  faqAnswer: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
  },
  helpBannerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  helpBannerContent: {
    zIndex: 1,
    alignItems: 'center',
  },
  helpBannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  helpBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  helpBannerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  helpBtnWhite: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  helpBtnTextPrimary: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  sectionSpacing: {
    height: 10,
  },
});

export default TeacherDashboard;
