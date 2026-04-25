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
  UIManager
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Toast, { ToastType } from '../../components/Toast';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PrincipalDashboard'>;

interface Props {
  navigation: DashboardNavigationProp;
}

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Main Screen ---
const PrincipalDashboard: React.FC<Props> = ({ navigation }) => {
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
  const [isTopStudentsCollapsed, setIsTopStudentsCollapsed] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  const toggleSection = (section: 'activity' | 'approvals' | 'topStudents') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (section === 'activity') setIsActivityCollapsed(!isActivityCollapsed);
    if (section === 'approvals') setIsApprovalsCollapsed(!isApprovalsCollapsed);
    if (section === 'topStudents') setIsTopStudentsCollapsed(!isTopStudentsCollapsed);
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

  const fetchDashboard = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      
      const [dashRes, announceRes, attendRes, equipRes] = await Promise.all([
        apiClient.get(ENDPOINTS.PRINCIPAL.DASHBOARD).catch(() => ({ data: {} })),
        apiClient.get(ENDPOINTS.STUDENT.ANNOUNCEMENTS).catch(() => ({ data: { announcements: [] } })),
        apiClient.get(ENDPOINTS.PRINCIPAL.ATTENDANCE, { params: { limit: 10 } }).catch(() => ({ data: { data: [] } })),
        apiClient.get(ENDPOINTS.PRINCIPAL.EQUIPMENT_REQUESTS, { params: { status: 'PENDING', limit: 5 } }).catch(() => ({ data: { data: [] } }))
      ]);

      const dData = dashRes.data?.data || dashRes.data || {};
      setDashboardData(dData);
      setAnnouncements(announceRes.data?.announcements || []);
      
      // Map Attendance to Activity Items
      const attendData = attendRes.data?.data || [];
          setActivities(attendData.map((a: any) => {
            const timeStr = a.outTime || a.inTime;
            let formattedTime = 'Just now';
            if (timeStr) {
              try {
                const d = new Date(timeStr);
                formattedTime = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
              } catch (e) {}
            }
            return {
              id: a.id || Math.random().toString(),
              name: a.teacherName || 'Staff Member',
              action: `Clocked ${a.outTime ? 'out' : 'in'} (${a.method || 'Biometric'})`,
              time: formattedTime,
              color: a.outTime ? '#8B5CF6' : '#10B981',
              icon: a.outTime ? 'exit-outline' : 'enter-outline'
            };
          }));

      // Map Equipment Requests to Approvals
      const equipData = equipRes.data?.data || [];
      if (Array.isArray(equipData)) {
        setApprovals(equipData.map((e: any) => ({
          id: e.id || Math.random().toString(),
          request: e.equipment_name || e.item || 'Equipment Request',
          submittedBy: e.teacher_name || 'Teacher',
          date: formatDate(e.created_at),
          status: e.status
        })));
      }

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
        >
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
            
            <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
              Welcome back, {authState.user?.name?.split(' ')[0] || 'Admin'}
            </Text>
            
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtnTransparent}>
                <Ionicons name="notifications-outline" size={22} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconBtnTransparent}
                onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}
              >
                <Ionicons name="settings-outline" size={22} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtnTransparent}>
                <Ionicons name="moon-outline" size={22} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
                </View>
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
                <Text style={styles.heroTitle}>Welcome to Institution Portal</Text>
                <Text style={styles.heroSubtitle}>Manage your institution, staff, and students efficiently</Text>
              </View>
            </Animated.View>
          </View>

          {/* Metric Cards - Optimized Single Row */}
          <View style={[styles.sectionPadding, { marginTop: 16 }]}>
            <View style={styles.metricRow}>
              <MetricCard 
                title="STUDENTS"
                value={dashboardData?.stats?.students?.value || 0}
                trend={dashboardData?.stats?.students?.trend}
                subValue={dashboardData?.stats?.students?.subTrend}
                icon="school"
                color="#4F46E5"
              />
              <MetricCard 
                title="STAFF"
                value={dashboardData?.stats?.teachers?.value || 0}
                trend={dashboardData?.stats?.teachers?.trend}
                subValue={dashboardData?.stats?.teachers?.subTrend}
                icon="people"
                color="#8B5CF6"
              />
              <MetricCard 
                title="ATTENDANCE"
                value={`${dashboardData?.stats?.attendance?.value || 0}%`}
                trend={dashboardData?.stats?.attendance?.trend}
                subValue={dashboardData?.stats?.attendance?.subTrend}
                icon="calendar"
                color="#10B981"
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionPadding}>
            <View style={styles.fullScreenBox}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard
                  delay={100}
                  title="Staff Management"
                  desc="Manage your school team"
                  color="#4F46E5"
                  icon="people"
                  onPress={() => navigation.navigate('PrincipalStaff')}
                />
                <QuickActionCard
                  delay={150}
                  title="Student Management"
                  desc="Enroll & track students"
                  color="#10B981"
                  icon="school"
                  onPress={() => navigation.navigate('PrincipalStudents')}
                />
                <QuickActionCard
                  delay={200}
                  title="Announcements"
                  desc="Notify teachers & parents"
                  color="#F59E0B"
                  icon="megaphone"
                  onPress={() => navigation.navigate('PrincipalAnnouncements')}
                />
                <QuickActionCard
                  delay={250}
                  title="Schedule Event"
                  desc="Add to academic calendar"
                  color="#EC4899"
                  icon="calendar"
                  onPress={() => navigation.navigate('PrincipalCalendar')}
                />
              </View>
            </View>
          </View>

          {/* Performance & Events Grid */}
          <View style={[styles.sectionPadding, { flexDirection: 'column', gap: 20 }]}>
            {/* Top Students */}
            <View>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => toggleSection('topStudents')}
                style={styles.sectionHeaderSpaceBetween}
              >
                <Text style={styles.sectionTitle}>Top Students</Text>
                <Ionicons name={isTopStudentsCollapsed ? "chevron-down" : "chevron-up"} size={20} color="#6B7280" />
              </TouchableOpacity>
              
              {!isTopStudentsCollapsed && (
                <View style={styles.cardContainer}>
                  {(dashboardData?.topStudents && dashboardData.topStudents.length > 0) ? (
                    dashboardData.topStudents.map((student: any, index: number) => (
                      <TopStudentCard
                        key={index}
                        rank={student.rank}
                        name={student.name}
                        className={student.className}
                        percentage={student.percentage}
                      />
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No data available</Text>
                  )}
                </View>
              )}
            </View>

            {/* Upcoming Events */}
            <View>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
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
                  <Text style={styles.emptyText}>No upcoming events</Text>
                )}
              </View>
            </View>
          </View>

          {/* Recent Staff Activity */}
          <View style={[styles.sectionPadding, { marginTop: 24 }]}>
            <View style={styles.sectionHeaderSpaceBetween}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => toggleSection('activity')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Text style={styles.sectionTitle}>Recent Staff Activity</Text>
                <Ionicons name={isActivityCollapsed ? "chevron-down" : "chevron-up"} size={18} color="#6B7280" />
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
                  <Text style={styles.emptyText}>No recent staff activity</Text>
                )}
              </View>
            )}
          </View>

          {/* Pending Approvals - Requested UI */}
          <View style={[styles.sectionPadding, { marginTop: 24, marginBottom: 20 }]}>
            <View style={styles.sectionHeaderSpaceBetween}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => toggleSection('approvals')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Text style={styles.sectionTitle}>Pending Approvals</Text>
                <Ionicons name={isApprovalsCollapsed ? "chevron-down" : "chevron-up"} size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity>
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
                           <TouchableOpacity style={styles.approveBtn}>
                              <Ionicons name="checkmark" size={16} color="#10B981" />
                           </TouchableOpacity>
                           <TouchableOpacity style={styles.rejectBtn}>
                              <Ionicons name="close" size={16} color="#EF4444" />
                           </TouchableOpacity>
                        </View>
                     </View>
                   ))
                 ) : (
                   <Text style={styles.emptyText}>All requests are processed</Text>
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
    </View>
  );
};

// --- Subcomponents ---

const DashboardSkeleton = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
    <View style={styles.globalHeader}>
       <Skeleton width={30} height={30} borderRadius={6} />
       <Skeleton width="40%" height={24} borderRadius={6} />
       <View style={{flexDirection: 'row', gap: 10}}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={32} height={32} borderRadius={16} />
       </View>
    </View>

    <View style={styles.sectionPadding}>
       <View style={styles.metricRow}>
          <Skeleton width="31%" height={100} borderRadius={12} />
          <Skeleton width="31%" height={100} borderRadius={12} />
          <Skeleton width="31%" height={100} borderRadius={12} />
       </View>
    </View>

    <View style={styles.sectionPadding}>
       <View style={styles.fullScreenBox}>
          <Skeleton width={120} height={20} style={{marginBottom: 16}} />
          <View style={styles.quickActionsGrid}>
            {[1,2,3,4].map(i => <Skeleton key={i} width="48%" height={80} borderRadius={12} />)}
          </View>
       </View>
    </View>

    <View style={styles.sectionPadding}>
       <View style={{flexDirection: 'row', gap: 16}}>
          <View style={{flex: 1}}>
             <Skeleton width="100%" height={200} borderRadius={16} />
          </View>
          <View style={{flex: 1}}>
             <Skeleton width="100%" height={200} borderRadius={16} />
          </View>
       </View>
    </View>
  </ScrollView>
);

const QuickActionCard = React.memo(({ title, desc, delay, color, icon = 'document-text', onPress }: { title: string, desc: string, delay: number, color: string, icon?: string, onPress?: () => void }) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()} style={[styles.quickActionCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <TouchableOpacity style={styles.quickActionTouchable} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.quickActionIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionDesc} numberOfLines={2}>{desc}</Text>
    </TouchableOpacity>
  </Animated.View>
));

const ActivityItem = React.memo(({ initial, iconBgColor, name, action, time, isLast }: any) => {
  return (
    <View style={[styles.activityItem, !isLast && styles.activityItemBorder]}>
      <View style={[styles.activityAvatarBox, { backgroundColor: iconBgColor + '20' }]}>
        <Text style={[styles.activityInitial, { color: iconBgColor }]}>{initial}</Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityName}>{name}</Text>
        <Text style={styles.activityAction}>{action}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </View>
  );
});

const EventCard = React.memo(({ title, date, color }: any) => (
  <View style={[styles.eventCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <View style={styles.eventCardContent}>
      <Text style={styles.eventTitle}>{title}</Text>
      <View style={styles.eventDateContainer}>
        <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
        <Text style={styles.eventDateText}>{date}</Text>
      </View>
    </View>
  </View>
));

const MetricCard = React.memo(({ title, value, trend, icon, color }: any) => {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconBox, { backgroundColor: color + '12' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      
      <View style={styles.metricContentCenter}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>

      {trend ? (
        <View style={styles.trendBadge}>
          <Text style={[styles.trendText, { color: color }]}>{trend}</Text>
        </View>
      ) : <View style={{ height: 14 }} />}
    </View>
  );
});

const TopStudentCard = React.memo(({ rank, name, className, percentage }: any) => (
  <View style={styles.topStudentCard}>
    <View style={styles.rankCircle}>
      <Text style={styles.rankText}>{rank}</Text>
    </View>
    <View style={styles.topStudentInfo}>
      <Text style={styles.topStudentName}>{name}</Text>
      <Text style={styles.topStudentClass}>{className}</Text>
    </View>
    <Text style={styles.topStudentPercentage}>{percentage}</Text>
  </View>
));

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, color: '#6366F1', fontSize: 14, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, paddingVertical: 20 },
  cardContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },

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
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10
  },
  menuHandle: { paddingRight: 4, paddingVertical: 10 },
  headerTitle: { fontSize: 18,
    fontWeight: '500',
    color: '#4F46E5',
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

  // Hero Banner
  heroBanner: {
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    zIndex: 2,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    zIndex: 2,
    maxWidth: '80%',
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F8FAFC',
    minHeight: 120,
  },
  metricIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricContentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  metricTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  trendBadge: {
    marginTop: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  trendText: {
    fontSize: 8,
    fontWeight: '700',
  },

  // Sections
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 14 },
  sectionHeaderSpaceBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: '#3B82F6' },

  // Quick Actions
  fullScreenBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionTouchable: { alignItems: 'flex-start' },
  quickActionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF', // Very light indigo/blue
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  quickActionDesc: { fontSize: 10, color: '#6B7280', lineHeight: 14 },

  // Activity List
  activityBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 36,
    elevation: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0', // slate-200, more visible divider
  },
  activityAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInitial: {
    fontSize: 14,
    fontWeight: '700',
  },
  activityContent: { flex: 1, justifyContent: 'center' },
  activityName: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 1 },
  activityAction: { fontSize: 11, color: '#6B7280', marginBottom: 1, lineHeight: 15 },
  activityTime: { fontSize: 11, color: '#9CA3AF' },

  // Event Card Styles
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  eventCardContent: { flex: 1 },
  eventTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  eventDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventDateText: { fontSize: 11, color: '#9CA3AF' },

  // Top Student Card Styles
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
    backgroundColor: '#F59E0B20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  topStudentInfo: { flex: 1 },
  topStudentName: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  topStudentClass: { fontSize: 11, color: '#6B7280' },
  topStudentPercentage: { fontSize: 13, fontWeight: '700', color: '#10B981' },
  
  // Approvals
  approvalsContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#1E293B', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 36, elevation: 12, overflow: 'hidden' },
  approvalCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  approvalInfo: { flex: 1 },
  approvalRequest: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  approvalBy: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  approvalActions: { flexDirection: 'row', gap: 10 },
  approveBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
});

export default PrincipalDashboard;
