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
  ActivityIndicator
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

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PrincipalDashboard'>;

interface Props {
  navigation: DashboardNavigationProp;
}

// --- Subcomponents ---

const QuickActionCard = React.memo(({ title, desc, delay, color }: { title: string, desc: string, delay: number, color: string }) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()} style={[styles.quickActionCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <TouchableOpacity style={styles.quickActionTouchable} activeOpacity={0.7}>
      <View style={[styles.quickActionIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name="document-text" size={20} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionDesc} numberOfLines={2}>{desc}</Text>
    </TouchableOpacity>
  </Animated.View>
));

const ActivityItem = React.memo(({ iconName, iconBgColor, name, action, time, isLast, iconLibrary = 'Ionicons' }: any) => {
  const IconComponent = iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.activityItem, !isLast && styles.activityItemBorder]}>
      <View style={[styles.activityAvatarBox, { backgroundColor: iconBgColor }]}>
        <IconComponent name={iconName} size={15} color="#FFFFFF" />
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

// --- Main Screen ---
const PrincipalDashboard: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get(ENDPOINTS.PRINCIPAL.DASHBOARD);
        setDashboardData(res.data);
      } catch (error) {
        console.error('Failed to fetch Principal dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Synchronizing school data...</Text>
        </View>
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
                      <Stop offset="1" stopColor="#8B5CF6" stopOpacity="1" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#grad)" rx="16" ry="16" />
                </Svg>
              </View>
              <Text style={styles.heroTitle}>{dashboardData?.schoolName || 'Sunrise High School'}</Text>
              <Text style={styles.heroSubtitle}>Managing {dashboardData?.stats?.students || 0} Students, {dashboardData?.stats?.teachers || 0} Teachers, and {dashboardData?.stats?.classes || 0} Classes</Text>
            </Animated.View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionPadding}>
            <View style={styles.fullScreenBox}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard
                  delay={100}
                  title="Generate Report"
                  desc="Academic & financial reports"
                  color="#4F46E5"
                />
                <QuickActionCard
                  delay={150}
                  title="Add Staff"
                  desc="Register new staff members"
                  color="#10B981"
                />
                <QuickActionCard
                  delay={200}
                  title="Announcements"
                  desc="Notify teachers & parents"
                  color="#F59E0B"
                />
                <QuickActionCard
                  delay={250}
                  title="Schedule Event"
                  desc="Add to academic calendar"
                  color="#EC4899"
                />
              </View>
            </View>
          </View>

          {/* Performance & Events Grid */}
          <View style={[styles.sectionPadding, { flexDirection: 'row', gap: 16 }]}>
            {/* Top Students */}
            <View style={{ flex: 1.2 }}>
              <Text style={styles.sectionTitle}>Top Students</Text>
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
            </View>

            {/* Upcoming Events */}
            <View style={{ flex: 0.8 }}>
              <Text style={styles.sectionTitle}>Events</Text>
              <View style={styles.cardContainer}>
                {(dashboardData?.upcomingEvents && dashboardData.upcomingEvents.length > 0) ? (
                  dashboardData.upcomingEvents.map((event: any, index: number) => (
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
              <Text style={styles.sectionTitle}>Staff Activity</Text>
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
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    zIndex: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    textAlign: 'center',
    lineHeight: 18,
    zIndex: 2,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityContent: { flex: 1, justifyContent: 'center' },
  activityName: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 1 },
  activityAction: { fontSize: 11, color: '#6B7280', marginBottom: 1, lineHeight: 15 },
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
});

export default PrincipalDashboard;
