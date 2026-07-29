import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  LayoutAnimation,
  Image,
  Modal,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { usePermissions } from '../../hooks/usePermissions';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Circle, Path } from 'react-native-svg';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import principalService from '../../services/principalService';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Toast, { ToastType } from '../../components/Toast';
import { getCacheBustedUri } from '../../utils/image';


type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PrincipalDashboard'>;

interface Props {
  navigation: DashboardNavigationProp;
}

const { width } = Dimensions.get('window');

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning ☀️';
  if (hour < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
};

// --- Main Screen ---
const PrincipalDashboard: React.FC<Props> = ({ navigation }) => {
  const { theme, themeMode, setThemeMode, isDarkMode } = useTheme();
  const [isThemeModalOpen, setThemeModalOpen] = useState(false);
  const styles = getStyles(theme, isDarkMode);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActivityCollapsed, setIsActivityCollapsed] = useState(false);
  const [isApprovalsCollapsed, setIsApprovalsCollapsed] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'info'
  });
  const [stats, setStats] = useState<{ students: number; staff: number; attendance: number | null }>({
    students: 0,
    staff: 0,
    attendance: null,
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  const toggleSection = (section: 'activity' | 'approvals') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (section === 'activity') setIsActivityCollapsed(!isActivityCollapsed);
    if (section === 'approvals') setIsApprovalsCollapsed(!isApprovalsCollapsed);
  };

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'N/A';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch {
      return 'N/A';
    }
  };

  const handleApprovalAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      setApprovals(prev => prev.filter(item => item.id !== id));
      if (action === 'APPROVED') {
        await principalService.approveEquipmentRequest(id, 'Approved from Dashboard');
        showToast('Request approved successfully', 'success');
      } else {
        await principalService.rejectEquipmentRequest(id, 'Rejected from Dashboard');
        showToast('Request rejected', 'info');
      }
    } catch (err) {
      console.error('[Dashboard] Approval action failed:', err);
      showToast('Failed to process request', 'error');
      fetchDashboard();
    }
  };

  const fetchDashboard = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);

      const [metricsRes, announceRes, attendRes, attendSummaryRes] = await Promise.all([
        // Primary source for all metric cards + pending approvals
        apiClient.get(ENDPOINTS.PRINCIPAL.DASHBOARD_METRICS).catch(() => ({ data: null })),
        // Upcoming events / announcements
        apiClient.get(ENDPOINTS.STUDENT.ANNOUNCEMENTS).catch(() => ({ data: { announcements: [] } })),
        // Recent staff activity feed
        apiClient.get(ENDPOINTS.PRINCIPAL.ATTENDANCE, { params: { limit: 10 } }).catch(() => ({ data: { data: [] } })),
        // Attendance fallback (avgAttendancePercent)
        apiClient.get(ENDPOINTS.PRINCIPAL.ATTENDANCE_SUMMARY).catch(() => ({ data: null })),
      ]);

      // ── /institution/dashboard-metrics ────────────────────────────────────
      const metricsAny = metricsRes as any;
      const mRaw = metricsAny.data?.data ?? metricsAny.data ?? {};
      const metrics = mRaw.metrics ?? {};

      // Store full metrics response as dashboardData for trend fields etc.
      setDashboardData(mRaw);

      // ── STUDENTS ──────────────────────────────────────────────────────────
      const totalStudents = metrics.totalStudents ?? metrics.students ?? 0;

      // ── STAFF ─────────────────────────────────────────────────────────────
      const totalStaff = metrics.teachingStaff ?? metrics.totalTeachers ?? metrics.staff ?? 0;

      // ── ATTENDANCE ────────────────────────────────────────────────────────
      let attendanceRate: number | null = null;
      const rawRate = metrics.attendanceRate ?? metrics.attendance ?? null;
      if (typeof rawRate === 'string') {
        const parsed = parseFloat(rawRate.replace('%', '').trim());
        if (!isNaN(parsed)) attendanceRate = Math.round(parsed);
      } else if (typeof rawRate === 'number') {
        attendanceRate = Math.round(rawRate);
      }
      // Fallback: /institution/attendance-summary → avgAttendancePercent
      if (attendanceRate === null) {
        const summaryAny = attendSummaryRes as any;
        const summaryData = summaryAny.data?.data ?? summaryAny.data ?? null;
        const summaryRate = summaryData?.avgAttendancePercent ?? null;
        if (typeof summaryRate === 'number') attendanceRate = Math.round(summaryRate);
      }

      setStats({ students: totalStudents, staff: totalStaff, attendance: attendanceRate });

      // ── PENDING APPROVALS ─────────────────────────────────────────────────
      const metricsApprovals = Array.isArray(mRaw.pendingApprovals) ? mRaw.pendingApprovals : [];
      setApprovals(metricsApprovals.map((e: any) => ({
        id: e.id || Math.random().toString(),
        request: e.request || e.equipment_name || e.item || 'Equipment Request',
        submittedBy: e.by || e.teacher_name || 'Teacher',
        date: e.date || formatDate(e.created_at),
        status: e.status,
      })));

      // ── ANNOUNCEMENTS / UPCOMING EVENTS ───────────────────────────────────
      const rawAnnounce = announceRes.data?.announcements || announceRes.data?.data || announceRes.data;
      const announceList = Array.isArray(rawAnnounce) ? rawAnnounce : (rawAnnounce?.announcements || []);
      setAnnouncements(announceList);

      // ── RECENT STAFF ACTIVITY ─────────────────────────────────────────────
      const attendData = attendRes.data?.data || [];
      setActivities(attendData.map((a: any) => {
        const timeStr = a.outTime || a.inTime;
        let formattedTime = 'Just now';
        if (timeStr) {
          try {
            const d = new Date(timeStr);
            formattedTime = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          } catch (e) { }
        }
        return {
          id: a.id || Math.random().toString(),
          name: a.teacherName || 'Staff Member',
          action: `Clocked ${a.outTime ? 'out' : 'in'} (${a.method || 'Biometric'})`,
          time: formattedTime,
          color: a.outTime ? '#8B5CF6' : '#10B981',
          icon: a.outTime ? 'exit-outline' : 'enter-outline',
        };
      }));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const { requestNotifications } = usePermissions();

  useEffect(() => {
    fetchDashboard();
    // Contextual Notification Permission Request on first meaningful dashboard load
    requestNotifications().catch(() => {});
  }, [requestNotifications]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
  };

  const visibleActivities = activities.slice(0, 5);
  const upcomingEvents = (dashboardData?.upcomingEvents || announcements).map((a: any) => ({
    title: a.title,
    date: a.date || new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    color: a.color || (a.priority === 'high' ? '#EF4444' : '#6366F1')
  }));

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(prev => ({ ...prev, visible: false }))}
        />
      )}

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
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          {/* Top Header — DO NOT MODIFY */}
          <View style={styles.globalHeader}>
            <ScaleButton
              style={styles.menuHandle}
              onPress={() => setDrawerOpen(true)}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              activeOpacity={0.7}
              scaleTo={0.85}
            >
              <Ionicons name="menu" size={28} color={theme.text} />
            </ScaleButton>

            <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
              Welcome back, {authState.user?.name?.split(' ')[0] || 'Admin'}
            </Text>

            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtnTransparent}>
                <Ionicons name="notifications-outline" size={22} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtnTransparent}
                onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}
              >
                <Ionicons name="settings-outline" size={22} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtnTransparent}
                onPress={() => setThemeModalOpen(true)}
              >
                <Ionicons name="moon-outline" size={22} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
              >
                {authState.user?.photoUrl ? (
                  <Image source={{ uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt) }} style={styles.headerAvatarImage} />
                ) : (

                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Banner */}
          <View style={styles.sectionPadding}>
            <Animated.View entering={FadeInUp.delay(50).springify()} style={styles.heroBanner}>
              <View style={StyleSheet.absoluteFill}>
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                  <Defs>
                    <SvgLinearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor={isDarkMode ? '#312E81' : '#4338CA'} />
                      <Stop offset="45%" stopColor={isDarkMode ? '#4338CA' : '#4F46E5'} />
                      <Stop offset="80%" stopColor={isDarkMode ? '#581C87' : '#7C3AED'} />
                      <Stop offset="100%" stopColor={isDarkMode ? '#6B21A8' : '#8B5CF6'} />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                      <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#heroGrad)" rx={24} ry={24} />
                  {/* Layered decorative glowing shapes & wave lines */}
                  <Circle cx="92%" cy="10%" r="110" fill="url(#glowGrad)" />
                  <Circle cx="85%" cy="90%" r="70" fill="#FFFFFF" fillOpacity={0.06} />
                  <Circle cx="10%" cy="85%" r="50" fill="#FFFFFF" fillOpacity={0.05} />
                  <Path
                    d="M-20 80 Q 80 20 180 100 T 380 40"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="3"
                    fill="none"
                  />
                  <Path
                    d="M-10 120 Q 100 60 200 130 T 400 70"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="2"
                    fill="none"
                  />
                </Svg>
              </View>

              <View style={styles.heroContent}>
                <View style={styles.heroTopRow}>
                  <View style={styles.heroBadge}>
                    <Ionicons name="sparkles" size={13} color="#FBBF24" />
                    <Text style={styles.heroBadgeText}>Institution Control Center</Text>
                  </View>
                  <View style={styles.heroTimePill}>
                    <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.heroGreetingTag}>{getGreeting()}</Text>
                  </View>
                </View>

                <View style={styles.heroMainRow}>
                  <View style={styles.heroTextCol}>
                    <Text style={styles.heroTitle}>Welcome back,{'\n'}{authState.user?.name?.split(' ')[0] || 'Principal'} 👋</Text>
                    <Text style={styles.heroSubtitle}>Overview of your institution's daily metrics & operations.</Text>
                  </View>

                  <View style={styles.heroGraphicBox}>
                    <View style={styles.heroGlassCircle}>
                      <MaterialCommunityIcons name="shield-crown" size={30} color="#FFFFFF" />
                    </View>
                  </View>
                </View>

                {/* Hero Bottom Quick Stats Glass Bar */}
                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStatChip}>
                    <Ionicons name="school" size={13} color="#A5B4FC" />
                    <Text style={styles.heroStatChipText}>{stats.students} Students</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStatChip}>
                    <Ionicons name="people" size={13} color="#DDD6FE" />
                    <Text style={styles.heroStatChipText}>{stats.staff} Staff</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStatChip}>
                    <Ionicons name="checkmark-circle" size={13} color="#6EE7B7" />
                    <Text style={styles.heroStatChipText}>{stats.attendance !== null ? `${stats.attendance}% Attendance` : 'Live Tracking'}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Metric Cards */}
          <View style={[styles.sectionPadding, { marginTop: 16 }]}>
            <View style={styles.metricRow}>
              <MetricCard
                title="STUDENTS"
                value={stats.students}
                trend={dashboardData?.stats?.students?.trend}
                icon="school"
                color="#4F46E5"
              />
              <MetricCard
                title="STAFF"
                value={stats.staff}
                trend={dashboardData?.stats?.teachers?.trend}
                icon="people"
                color="#8B5CF6"
              />
              <MetricCard
                title="ATTENDANCE"
                value={stats.attendance !== null ? `${stats.attendance}%` : null}
                trend={dashboardData?.stats?.attendance?.trend}
                icon="calendar"
                color="#10B981"
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionPadding}>
            <View style={styles.fullScreenBox}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionTitleDot, { backgroundColor: theme.primary }]} />
                <Text style={styles.sectionTitle}>Quick Actions</Text>
              </View>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard
                  delay={100}
                  title="Staff"
                  desc="Manage your team"
                  color="#4F46E5"
                  icon="people"
                  onPress={() => navigation.navigate('PrincipalStaff')}
                />
                <QuickActionCard
                  delay={150}
                  title="Students"
                  desc="Enroll & track"
                  color="#10B981"
                  icon="school"
                  onPress={() => navigation.navigate('PrincipalStudentDetails')}
                />
                <QuickActionCard
                  delay={200}
                  title="Announce"
                  desc="Notify everyone"
                  color="#F59E0B"
                  icon="megaphone"
                  onPress={() => navigation.navigate('PrincipalAnnouncements')}
                />
                <QuickActionCard
                  delay={250}
                  title="Calendar"
                  desc="Schedule events"
                  color="#EC4899"
                  icon="calendar"
                  onPress={() => navigation.navigate('PrincipalCalendar')}
                />
              </View>
            </View>
          </View>

          {/* Upcoming Events */}
          <View style={[styles.sectionPadding, { marginTop: 4 }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionTitleDot, { backgroundColor: '#6366F1' }]} />
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
            </View>
            <View style={styles.cardContainer}>
              {(upcomingEvents && upcomingEvents.length > 0) ? (
                upcomingEvents.map((event: any, index: number) => (
                  <EventCard
                    key={index}
                    title={event.title}
                    date={event.date}
                    color={event.color}
                  />
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <View style={[styles.emptyIconCircle, { backgroundColor: '#6366F115' }]}>
                    <Ionicons name="calendar-outline" size={24} color="#6366F1" />
                  </View>
                  <Text style={styles.emptyStateTitle}>No upcoming events</Text>
                  <Text style={styles.emptyText}>Check back later for new scheduled events</Text>
                </View>
              )}
            </View>
          </View>

          {/* Recent Staff Activity */}
          <View style={[styles.sectionPadding, { marginTop: 4 }]}>
            <View style={styles.sectionHeaderSpaceBetween}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSection('activity')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <View style={[styles.sectionTitleDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.sectionTitle}>Staff Activity</Text>
                <Ionicons name={isActivityCollapsed ? "chevron-down" : "chevron-up"} size={16} color={theme.subtext} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {!isActivityCollapsed && (
              <View style={styles.activityBox}>
                {visibleActivities.length > 0 ? (
                  visibleActivities.map((item, idx) => (
                    <ActivityItem
                      key={item.id}
                      initial={item.name.charAt(0)}
                      iconBgColor={item.color}
                      name={item.name}
                      action={item.action}
                      time={item.time}
                      isLast={idx === visibleActivities.length - 1}
                    />
                  ))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <View style={[styles.emptyIconCircle, { backgroundColor: '#10B98115' }]}>
                      <Ionicons name="people-outline" size={24} color="#10B981" />
                    </View>
                    <Text style={styles.emptyStateTitle}>No recent activity</Text>
                    <Text style={styles.emptyText}>Staff check-ins will appear here</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Pending Approvals */}
          <View style={[styles.sectionPadding, { marginTop: 4, marginBottom: 32 }]}>
            <View style={styles.sectionHeaderSpaceBetween}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSection('approvals')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <View style={[styles.sectionTitleDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.sectionTitle}>Pending Approvals</Text>
                <Ionicons name={isApprovalsCollapsed ? "chevron-down" : "chevron-up"} size={16} color={theme.subtext} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('PrincipalEquipment')}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {!isApprovalsCollapsed && (
              <View style={styles.approvalsContainer}>
                {approvals.length > 0 ? (
                  approvals.map((app, idx) => (
                    <View key={app.id} style={[styles.approvalCard, idx === approvals.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={[styles.approvalIconBox, { backgroundColor: '#F59E0B' + (isDarkMode ? '25' : '15') }]}>
                        <Ionicons name="document-text-outline" size={20} color="#F59E0B" />
                      </View>
                      <View style={styles.approvalInfo}>
                        <Text style={styles.approvalRequest} numberOfLines={1}>{app.request}</Text>
                        <Text style={styles.approvalBy}>By {app.submittedBy} • {app.date}</Text>
                      </View>
                      <View style={styles.approvalActions}>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => handleApprovalAction(app.id, 'APPROVED')}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="checkmark-sharp" size={14} color="#10B981" />
                          <Text style={styles.approveBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleApprovalAction(app.id, 'REJECTED')}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-sharp" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <View style={[styles.emptyIconCircle, { backgroundColor: '#10B98115' }]}>
                      <Ionicons name="checkmark-circle-outline" size={28} color="#10B981" />
                    </View>
                    <Text style={styles.emptyStateTitle}>All caught up!</Text>
                    <Text style={styles.emptyText}>All pending requests have been processed.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}
      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="principal"
      />

      {/* Theme Selection Modal */}
      <Modal
        visible={isThemeModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setThemeModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setThemeModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Theme</Text>
            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={async () => {
                await setThemeMode('light');
                setThemeModalOpen(false);
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="sunny-outline" size={20} color={themeMode === 'light' ? theme.primary : theme.text} />
                <Text style={[styles.optionText, themeMode === 'light' && styles.optionTextSelected]}>Light</Text>
              </View>
              {themeMode === 'light' && <Ionicons name="checkmark" size={20} color={theme.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={async () => {
                await setThemeMode('dark');
                setThemeModalOpen(false);
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="moon-outline" size={20} color={themeMode === 'dark' ? theme.primary : theme.text} />
                <Text style={[styles.optionText, themeMode === 'dark' && styles.optionTextSelected]}>Dark</Text>
              </View>
              {themeMode === 'dark' && <Ionicons name="checkmark" size={20} color={theme.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={async () => {
                await setThemeMode('system');
                setThemeModalOpen(false);
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="settings-outline" size={20} color={themeMode === 'system' ? theme.primary : theme.text} />
                <Text style={[styles.optionText, themeMode === 'system' && styles.optionTextSelected]}>System Default</Text>
              </View>
              {themeMode === 'system' && <Ionicons name="checkmark" size={20} color={theme.primary} />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// --- Subcomponents ---

const DashboardSkeleton = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.globalHeader}>
        <Skeleton width={30} height={30} borderRadius={6} />
        <Skeleton width="40%" height={24} borderRadius={6} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={34} height={34} borderRadius={17} />
        </View>
      </View>

      <View style={styles.sectionPadding}>
        <Skeleton width="100%" height={145} borderRadius={20} style={{ marginBottom: 16 }} />
      </View>

      <View style={styles.sectionPadding}>
        <View style={styles.metricRow}>
          <Skeleton width="31%" height={135} borderRadius={18} />
          <Skeleton width="31%" height={135} borderRadius={18} />
          <Skeleton width="31%" height={135} borderRadius={18} />
        </View>
      </View>

      <View style={styles.sectionPadding}>
        <View style={styles.fullScreenBox}>
          <Skeleton width={120} height={20} style={{ marginBottom: 16 }} />
          <View style={styles.quickActionsGrid}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} width="48%" height={90} borderRadius={16} />)}
          </View>
        </View>
      </View>

      <View style={styles.sectionPadding}>
        <Skeleton width="100%" height={180} borderRadius={20} />
      </View>
    </ScrollView>
  );
};

const QuickActionCard = React.memo(({ title, desc, delay, color, icon = 'document-text', onPress }: { title: string, desc: string, delay: number, color: string, icon?: string, onPress?: () => void }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.quickActionCard}>
      <TouchableOpacity style={styles.quickActionTouchable} activeOpacity={0.7} onPress={onPress}>
        <View style={styles.quickActionHeader}>
          <View style={[styles.quickActionIconBox, { backgroundColor: color + (isDarkMode ? '25' : '15') }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <View style={[styles.quickActionArrowBox, { backgroundColor: theme.background }]}>
            <Ionicons name="arrow-forward" size={12} color={theme.subtext} />
          </View>
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDesc} numberOfLines={2}>{desc}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const ActivityItem = React.memo(({ initial, iconBgColor, name, action, time, isLast }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const isClockOut = action.toLowerCase().includes('out');

  return (
    <View style={[styles.activityItem, !isLast && styles.activityItemBorder]}>
      <View style={{ position: 'relative' }}>
        <View style={[styles.activityAvatarBox, { backgroundColor: iconBgColor + (isDarkMode ? '30' : '15') }]}>
          <Text style={[styles.activityInitial, { color: iconBgColor }]}>{initial}</Text>
        </View>
        <View style={[styles.activityStatusDot, { backgroundColor: isClockOut ? '#8B5CF6' : '#10B981' }]} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityName}>{name}</Text>
        <View style={styles.activityActionRow}>
          <Ionicons name={isClockOut ? "exit-outline" : "enter-outline"} size={13} color={isClockOut ? '#8B5CF6' : '#10B981'} />
          <Text style={styles.activityAction}>{action}</Text>
        </View>
      </View>
      <View style={styles.activityTimeBadge}>
        <Ionicons name="time-outline" size={11} color={theme.subtext} />
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </View>
  );
});

const parseDateParts = (dateStr: string) => {
  if (!dateStr) return { day: '--', month: '' };
  const parts = dateStr.trim().split(' ');
  if (parts.length >= 2) {
    return { day: parts[0], month: parts[1].toUpperCase() };
  }
  return { day: dateStr, month: '' };
};

const EventCard = React.memo(({ title, date, color }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const dateParts = parseDateParts(date);

  return (
    <View style={[styles.eventCard, { borderLeftColor: color }]}>
      <View style={[styles.eventDateChip, { backgroundColor: color + (isDarkMode ? '25' : '12') }]}>
        <Text style={[styles.eventDateDay, { color }]}>{dateParts.day}</Text>
        {dateParts.month ? <Text style={[styles.eventDateMonth, { color }]}>{dateParts.month}</Text> : null}
      </View>
      <View style={styles.eventCardContent}>
        <Text style={styles.eventTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.eventDateContainer}>
          <Ionicons name="time-outline" size={12} color={theme.subtext} />
          <Text style={styles.eventDateText}>{date}</Text>
        </View>
      </View>
      <View style={[styles.eventIconBadge, { backgroundColor: color + (isDarkMode ? '20' : '10') }]}>
        <Ionicons name="chevron-forward-outline" size={14} color={color} />
      </View>
    </View>
  );
});

// MetricCard: value=null → shows "—" with a "No data" label
const MetricCard = React.memo(({ title, value, trend, icon, color }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const hasValue = value !== null && value !== undefined;
  return (
    <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.metricCard}>
      <View style={styles.metricHeaderRow}>
        <View style={[styles.metricIconBox, { backgroundColor: color + (isDarkMode ? '25' : '15') }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        {trend ? (
          <View style={[styles.trendBadge, { backgroundColor: color + (isDarkMode ? '20' : '12') }]}>
            <Ionicons name="trending-up" size={10} color={color} style={{ marginRight: 2 }} />
            <Text style={[styles.trendText, { color }]}>{trend}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metricContentCenter}>
        <Text style={[styles.metricValue, !hasValue && styles.metricValueEmpty]}>
          {hasValue ? value : '—'}
        </Text>
        <Text style={styles.metricTitle}>{title}</Text>
        {!hasValue && <Text style={styles.metricNoData}>No data</Text>}
      </View>

      <View style={styles.sparklineRow}>
        <View style={[styles.sparkBar, { height: 6, backgroundColor: color, opacity: 0.3 }]} />
        <View style={[styles.sparkBar, { height: 10, backgroundColor: color, opacity: 0.5 }]} />
        <View style={[styles.sparkBar, { height: 8, backgroundColor: color, opacity: 0.4 }]} />
        <View style={[styles.sparkBar, { height: 14, backgroundColor: color, opacity: 0.9 }]} />
        <View style={[styles.sparkBar, { height: 11, backgroundColor: color, opacity: 0.7 }]} />
      </View>
    </Animated.View>
  );
});

const getStyles = (theme: any, isDarkMode: boolean = false) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  loadingText: { marginTop: 12, color: theme.primary, fontSize: 14, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: theme.subtext, fontSize: 12, paddingTop: 4 },
  emptyStateTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginTop: 8 },
  emptyIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  cardContainer: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: theme.border,
    ...(isDarkMode
      ? {}
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.05,
          shadowRadius: 14,
          elevation: 3,
        }),
  },

  // Used for standard section padding
  sectionPadding: {
    paddingHorizontal: 16,
    marginTop: 20,
  },

  // Header (DO NOT MODIFY structure/styles that break header layout)
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    zIndex: 10,
    ...(isDarkMode
      ? {}
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 4,
        }),
  },
  menuHandle: { paddingRight: 4, paddingVertical: 10 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBtnTransparent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#818CF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  headerAvatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: 4,
  },

  // Hero Banner (Redesigned)
  heroBanner: {
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 18,
    overflow: 'hidden',
    minHeight: 185,
    justifyContent: 'space-between',
    ...(isDarkMode
      ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }
      : {
          shadowColor: '#4338CA',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.28,
          shadowRadius: 22,
          elevation: 10,
        }),
  },
  heroContent: {
    zIndex: 2,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  heroGreetingTag: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
    lineHeight: 29,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 17,
  },
  heroGraphicBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlassCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  heroStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  // Metric Cards
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 135,
    justifyContent: 'space-between',
    ...(isDarkMode
      ? {}
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3,
        }),
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricContentCenter: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginVertical: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.5,
  },
  metricValueEmpty: {
    color: theme.subtext,
    fontSize: 22,
    fontWeight: '300',
  },
  metricNoData: {
    fontSize: 9,
    color: theme.subtext,
    marginTop: 2,
    fontWeight: '500',
  },
  metricTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 9,
    fontWeight: '700',
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 14,
    marginTop: 4,
  },
  sparkBar: {
    width: 4,
    borderRadius: 2,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitleDot: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: theme.primary,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
  sectionHeaderSpaceBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  // Quick Actions
  fullScreenBox: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    ...(isDarkMode
      ? {}
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.05,
          shadowRadius: 14,
          elevation: 4,
        }),
  },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  quickActionCard: {
    width: '48%',
    backgroundColor: theme.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  quickActionTouchable: { flex: 1 },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickActionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionArrowBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickActionTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 2 },
  quickActionDesc: { fontSize: 11, color: theme.subtext, lineHeight: 15 },

  // Activity List
  activityBox: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    ...(isDarkMode
      ? {}
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.05,
          shadowRadius: 14,
          elevation: 4,
        }),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  activityAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: theme.surface,
  },
  activityInitial: {
    fontSize: 15,
    fontWeight: '700',
  },
  activityContent: { flex: 1, justifyContent: 'center' },
  activityName: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 2 },
  activityActionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activityAction: { fontSize: 11, color: theme.subtext },
  activityTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  activityTime: { fontSize: 11, color: theme.subtext, fontWeight: '600' },

  // Event Card (Timeline Style)
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
    ...(isDarkMode
      ? {}
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }),
  },
  eventDateChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDateDay: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  eventDateMonth: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  eventCardContent: { flex: 1 },
  eventTitle: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 4 },
  eventDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventDateText: { fontSize: 11, color: theme.subtext },
  eventIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Approvals
  approvalsContainer: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
    ...(isDarkMode
      ? {}
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.05,
          shadowRadius: 14,
          elevation: 4,
        }),
  },
  approvalCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  approvalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  approvalInfo: { flex: 1 },
  approvalRequest: { fontSize: 13, fontWeight: '700', color: theme.text },
  approvalBy: { fontSize: 11, color: theme.subtext, marginTop: 2, fontWeight: '500' },
  approvalActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: isDarkMode ? '#065F4640' : '#DCFCE7',
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  rejectBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: isDarkMode ? '#991B1B40' : '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Theme Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  optionTextSelected: {
    color: theme.primary,
    fontWeight: '700',
  },
});

export default PrincipalDashboard;
