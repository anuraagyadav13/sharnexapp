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
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import principalService from '../../services/principalService';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Toast, { ToastType } from '../../components/Toast';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PrincipalDashboard'>;

interface Props {
  navigation: DashboardNavigationProp;
}



const { width } = Dimensions.get('window');

// --- Main Screen ---
const PrincipalDashboard: React.FC<Props> = ({ navigation }) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const [isThemeModalOpen, setThemeModalOpen] = useState(false);
  const styles = getStyles(theme);
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
      // Confirmed shape:
      //   { metrics: { totalStudents, teachingStaff, attendanceRate: "79.4%", ... },
      //     pendingApprovals: [...], institution: {...}, principal: {...} }
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
      // metrics.attendanceRate is a string "79.4%" — parse the number out
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
      // metrics endpoint returns pendingApprovals directly, already formatted
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

  useEffect(() => {
    fetchDashboard();
  }, []);

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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

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
                  <Image source={{ uri: authState.user.photoUrl }} style={styles.headerAvatarImage} />
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
                <Svg height="100%" width="100%">
                  <Defs>
                    <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0" stopColor="#4F46E5" stopOpacity="1" />
                      <Stop offset="1" stopColor="#6366F1" stopOpacity="1" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#grad)" rx="16" ry="16" />
                </Svg>
              </View>
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.heroBadgeText}>Institution Portal</Text>
                </View>
                <Text style={styles.heroTitle}>Welcome to{'\n'}Your Dashboard</Text>
                <Text style={styles.heroSubtitle}>Manage your institution, staff, and students efficiently</Text>
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
                <View style={styles.sectionTitleDot} />
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
                  <Ionicons name="calendar-outline" size={32} color={theme.subtext} style={{ opacity: 0.5 }} />
                  <Text style={styles.emptyText}>No upcoming events</Text>
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
                    <Ionicons name="people-outline" size={32} color={theme.subtext} style={{ opacity: 0.5 }} />
                    <Text style={styles.emptyText}>No recent staff activity</Text>
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
                      <View style={styles.approvalInfo}>
                        <Text style={styles.approvalRequest} numberOfLines={1}>{app.request}</Text>
                        <Text style={styles.approvalBy}>By {app.submittedBy} • {app.date}</Text>
                      </View>
                      <View style={styles.approvalActions}>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => handleApprovalAction(app.id, 'APPROVED')}
                        >
                          <Ionicons name="checkmark" size={16} color="#10B981" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleApprovalAction(app.id, 'REJECTED')}
                        >
                          <Ionicons name="close" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="checkmark-circle-outline" size={32} color={theme.subtext} style={{ opacity: 0.5 }} />
                    <Text style={styles.emptyText}>All requests are processed</Text>
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
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.globalHeader}>
        <Skeleton width={30} height={30} borderRadius={6} />
        <Skeleton width="40%" height={24} borderRadius={6} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>

      <View style={styles.sectionPadding}>
        <Skeleton width="100%" height={140} borderRadius={16} style={{ marginBottom: 16 }} />
      </View>

      <View style={styles.sectionPadding}>
        <View style={styles.metricRow}>
          <Skeleton width="31%" height={110} borderRadius={20} />
          <Skeleton width="31%" height={110} borderRadius={20} />
          <Skeleton width="31%" height={110} borderRadius={20} />
        </View>
      </View>

      <View style={styles.sectionPadding}>
        <View style={styles.fullScreenBox}>
          <Skeleton width={120} height={20} style={{ marginBottom: 16 }} />
          <View style={styles.quickActionsGrid}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} width="48%" height={80} borderRadius={12} />)}
          </View>
        </View>
      </View>

      <View style={styles.sectionPadding}>
        <Skeleton width="100%" height={180} borderRadius={16} />
      </View>
    </ScrollView>
  );
};

const QuickActionCard = React.memo(({ title, desc, delay, color, icon = 'document-text', onPress }: { title: string, desc: string, delay: number, color: string, icon?: string, onPress?: () => void }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={[styles.quickActionCard]}>
      <TouchableOpacity style={styles.quickActionTouchable} activeOpacity={0.7} onPress={onPress}>
        <View style={[styles.quickActionIconBox, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDesc} numberOfLines={2}>{desc}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const ActivityItem = React.memo(({ initial, iconBgColor, name, action, time, isLast }: any) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={[styles.activityItem, !isLast && styles.activityItemBorder]}>
      <View style={[styles.activityAvatarBox, { backgroundColor: iconBgColor + '20' }]}>
        <Text style={[styles.activityInitial, { color: iconBgColor }]}>{initial}</Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityName}>{name}</Text>
        <Text style={styles.activityAction}>{action}</Text>
      </View>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  );
});

const EventCard = React.memo(({ title, date, color }: any) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={[styles.eventCard, { borderLeftColor: color }]}>
      <View style={[styles.eventAccent, { backgroundColor: color + '15' }]}>
        <Ionicons name="calendar" size={16} color={color} />
      </View>
      <View style={styles.eventCardContent}>
        <Text style={styles.eventTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.eventDateContainer}>
          <Ionicons name="time-outline" size={12} color={theme.subtext} />
          <Text style={styles.eventDateText}>{date}</Text>
        </View>
      </View>
    </View>
  );
});

// MetricCard: value=null → shows "—" with a "No data" label
const MetricCard = React.memo(({ title, value, trend, icon, color }: any) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const hasValue = value !== null && value !== undefined;
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>

      <View style={styles.metricContentCenter}>
        <Text style={[styles.metricValue, !hasValue && styles.metricValueEmpty]}>
          {hasValue ? value : '—'}
        </Text>
        <Text style={styles.metricTitle}>{title}</Text>
        {!hasValue && <Text style={styles.metricNoData}>No data</Text>}
      </View>

      {trend ? (
        <View style={[styles.trendBadge, { backgroundColor: color + '12' }]}>
          <Text style={[styles.trendText, { color }]}>{trend}</Text>
        </View>
      ) : <View style={{ height: 18 }} />}
    </View>
  );
});

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  loadingText: { marginTop: 12, color: theme.primary, fontSize: 14, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: theme.subtext, fontSize: 13, paddingTop: 8 },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  cardContainer: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },

  // Used for edge-to-edge feeling but standard padding
  sectionPadding: {
    paddingHorizontal: 16,
    marginTop: 20,
  },

  // Header (no background box for edge-to-edge light aesthetic)
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: theme.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10
  },
  menuHandle: { paddingRight: 4, paddingVertical: 10 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  iconBtnTransparent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9F7AEA', // Soft purple
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  headerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 4,
  },

  // Hero Banner
  heroBanner: {
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    zIndex: 2,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
    zIndex: 2,
    maxWidth: '85%',
  },
  heroContent: {
    zIndex: 2,
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
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 130,
    paddingVertical: 14,
  },
  metricIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricContentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.5,
  },
  metricValueEmpty: {
    color: theme.subtext,
    fontSize: 24,
    fontWeight: '300',
  },
  metricNoData: {
    fontSize: 9,
    color: theme.subtext,
    marginTop: 2,
    fontWeight: '500',
    opacity: 0.7,
  },
  metricTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 3,
  },
  trendBadge: {
    marginTop: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 9,
    fontWeight: '700',
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
    height: 18,
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
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  quickActionCard: {
    width: '48%',
    backgroundColor: theme.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionTouchable: { alignItems: 'flex-start' },
  quickActionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionTitle: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 3 },
  quickActionDesc: { fontSize: 10, color: theme.subtext, lineHeight: 14 },

  // Activity List
  activityBox: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
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
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInitial: {
    fontSize: 15,
    fontWeight: '700',
  },
  activityContent: { flex: 1, justifyContent: 'center' },
  activityName: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 2 },
  activityAction: { fontSize: 11, color: theme.subtext, lineHeight: 15 },
  activityTime: { fontSize: 11, color: theme.subtext, fontWeight: '600' },

  // Event Card
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  eventAccent: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCardContent: { flex: 1 },
  eventTitle: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 4 },
  eventDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventDateText: { fontSize: 11, color: theme.subtext },

  // Approvals
  approvalsContainer: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
  },
  approvalCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  approvalInfo: { flex: 1 },
  approvalRequest: { fontSize: 14, fontWeight: '700', color: theme.text },
  approvalBy: { fontSize: 11, color: theme.subtext, marginTop: 2, fontWeight: '500' },
  approvalActions: { flexDirection: 'row', gap: 10 },
  approveBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },

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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.border,
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
