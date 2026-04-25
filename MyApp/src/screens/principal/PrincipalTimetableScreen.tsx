import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown, SlideInRight } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOP_TABS = ['Weekly Schedule', 'Leaves & Covers', 'Academic Setup'];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const PageSkeleton = () => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.pageHeader}>
      <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={16} />
    </View>
    <View style={styles.tabSwitcherSkeleton}>
      <Skeleton width="100%" height={50} borderRadius={15} />
    </View>
    <View style={{ marginTop: 20 }}>
      {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={100} borderRadius={24} style={{ marginBottom: 16 }} />)}
    </View>
  </ScrollView>
);

const StatCard = ({ title, value, color, icon }: { title: string, value: string | number, color: string, icon: string }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle} numberOfLines={1}>{title}</Text>
  </View>
);

const PrincipalTimetableScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Weekly Schedule');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timetableData, setTimetableData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState('MON');

  const fetchTimetable = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.TIMETABLE);
      setTimetableData(res.normalized?.data || res.data.data || res.data);
    } catch (error) {
      setTimetableData({
        stats: { scheduled: 42, activeLeaves: 2, substitutions: 5 },
        periods: [
          { id: '1', name: 'Period 1', time: '09:00 - 09:45', subject: 'Mathematics', teacher: 'Dr. Ramesh Kumar', room: 'Room 302' },
          { id: '2', name: 'Period 2', time: '09:45 - 10:30', subject: 'Physics', teacher: 'Ms. Sunita Sharma', room: 'Lab 2' },
          { id: 'break', name: 'LUNCH BREAK', time: '10:30 - 11:15', isBreak: true },
          { id: '3', name: 'Period 3', time: '11:15 - 12:00', subject: 'Chemistry', teacher: 'Mr. Anil Verma', room: 'Room 304' },
        ],
        activeLeaves: [
          { id: 'l1', teacher: 'Mr. Rajesh', date: 'Today', status: 'PENDING COVER', type: 'Sick Leave' },
          { id: 'l2', teacher: 'Ms. Nidhi', date: 'Apr 24', status: 'COVERED', type: 'Casual Leave' },
        ]
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTimetable();
  };

  const renderScheduleTab = () => (
    <Animated.View entering={FadeInUp}>
      <View style={styles.daySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
          {DAYS.map(day => (
            <TouchableOpacity 
              key={day} 
              style={[styles.dayCard, selectedDay === day && styles.dayCardActive]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayCardText, selectedDay === day && styles.dayCardTextActive]}>{day}</Text>
              {selectedDay === day && <View style={styles.activeDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.listContainer}>
        {timetableData?.periods?.map((period: any, index: number) => (
          <Animated.View key={period.id} entering={FadeInUp.delay(index * 50)} style={[styles.periodCard, period.isBreak && styles.breakCard]}>
            <View style={styles.periodTimeSide}>
              <Text style={styles.timeLabel}>{period.time.split(' - ')[0]}</Text>
              <View style={styles.timeConnector} />
              <Text style={styles.timeLabel}>{period.time.split(' - ')[1]}</Text>
            </View>
            
            <View style={styles.periodMain}>
              {period.isBreak ? (
                <View style={styles.breakContent}>
                   <MaterialCommunityIcons name="coffee-outline" size={20} color="#94A3B8" />
                   <Text style={styles.breakTitle}>{period.name}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.periodHeader}>
                    <Text style={styles.subjectTitle}>{period.subject}</Text>
                    <View style={styles.roomBadge}><Text style={styles.roomText}>{period.room || 'R-101'}</Text></View>
                  </View>
                  <View style={styles.instructorRow}>
                    <View style={styles.miniAvatar}><Text style={styles.miniAvatarText}>{period.teacher?.charAt(0)}</Text></View>
                    <Text style={styles.instructorName}>{period.teacher}</Text>
                  </View>
                </>
              )}
            </View>
            
            {!period.isBreak && (
              <TouchableOpacity style={styles.periodAction}>
                 <Ionicons name="notifications-outline" size={18} color="#6366F1" />
              </TouchableOpacity>
            )}
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderLeaveTab = () => (
    <Animated.View entering={SlideInRight} style={styles.panel}>
      <View style={styles.statsRow}>
        <StatCard title="Total Leaves" value={timetableData?.stats?.activeLeaves || 0} color="#EF4444" icon="account-off-outline" />
        <StatCard title="Substituted" value={timetableData?.stats?.substitutions || 0} color="#10B981" icon="account-switch-outline" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Leave Applications</Text>
        <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>+ Assign Cover</Text></TouchableOpacity>
      </View>

      {timetableData?.activeLeaves?.map((leave: any, index: number) => (
        <View key={leave.id} style={styles.leaveCard}>
          <View style={styles.leaveHeader}>
             <View style={styles.leaveAvatar}><Text style={styles.leaveAvatarText}>{leave.teacher?.charAt(0)}</Text></View>
             <View style={styles.leaveMain}>
                <Text style={styles.leaveTeacherName}>{leave.teacher}</Text>
                <Text style={styles.leaveType}>{leave.type || 'General Leave'}</Text>
             </View>
             <View style={[styles.statusBadge, { backgroundColor: leave.status === 'COVERED' ? '#DCFCE7' : '#FEE2E2' }]}>
                <Text style={[styles.statusBadgeText, { color: leave.status === 'COVERED' ? '#10B981' : '#EF4444' }]}>{leave.status}</Text>
             </View>
          </View>
          <View style={styles.leaveFooter}>
             <View style={styles.leaveDateInfo}>
                <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                <Text style={styles.leaveDateText}>{leave.date}</Text>
             </View>
             <TouchableOpacity style={styles.coverBtn}>
                <Text style={styles.coverBtnText}>{leave.status === 'COVERED' ? 'View Cover' : 'Assign Now'}</Text>
             </TouchableOpacity>
          </View>
        </View>
      ))}
    </Animated.View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Global Header - Student Pattern */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color="#4F46E5" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Institutional Schedule</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}>
            <View style={styles.avatarHeader}>
              <Text style={styles.avatarTextHeader}>{authState.user?.name?.charAt(0) || 'A'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !isRefreshing ? (
        <PageSkeleton />
      ) : (
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
        >
          <View style={styles.pageHeader}>
            <Text style={styles.screenTitle}>Academic Timetable</Text>
            <Text style={styles.screenSubtitle}>Monitor daily operations, periods distribution, and faculty availability.</Text>
          </View>

          {/* Premium Tab Switcher */}
          <View style={styles.tabSwitcher}>
            {TOP_TABS.map(tab => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'Weekly Schedule' && renderScheduleTab()}
          {activeTab === 'Leaves & Covers' && renderLeaveTab()}
          {activeTab === 'Academic Setup' && (
            <View style={styles.setupPanel}>
               <MaterialCommunityIcons name="cog-outline" size={60} color="#D1D5DB" />
               <Text style={styles.setupTitle}>Structure Configuration</Text>
               <Text style={styles.setupDesc}>Academic year and period configurations are managed from the centralized admin dashboard.</Text>
               <TouchableOpacity style={styles.setupActionBtn}><Text style={styles.setupActionText}>Request Changes</Text></TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header - Student Pattern
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 24,
    backgroundColor: '#FAFAFF',
  },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatarHeader: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  // Tabs
  tabSwitcher: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, padding: 6, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 25 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
  tabBtnActive: { backgroundColor: '#4F46E5', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#FFF' },

  // Day Picker
  daySelector: { marginBottom: 20 },
  dayScroll: { paddingHorizontal: 20, gap: 10 },
  dayCard: { width: 60, height: 70, backgroundColor: '#FFF', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  dayCardActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  dayCardText: { fontSize: 13, fontWeight: '800', color: '#94A3B8' },
  dayCardTextActive: { color: '#4F46E5' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4F46E5', marginTop: 4 },

  // List
  listContainer: { paddingHorizontal: 20 },
  periodCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
  breakCard: { backgroundColor: '#F8FAFC', borderStyle: 'dashed' },
  periodTimeSide: { alignItems: 'center', width: 60 },
  timeLabel: { fontSize: 11, fontWeight: '800', color: '#1E293B' },
  timeConnector: { width: 2, height: 20, backgroundColor: '#E2E8F0', marginVertical: 4 },
  periodMain: { flex: 1, marginLeft: 15 },
  periodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  roomBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roomText: { fontSize: 9, fontWeight: '800', color: '#64748B' },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { fontSize: 10, fontWeight: '800', color: '#4F46E5' },
  instructorName: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  breakContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakTitle: { fontSize: 14, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  periodAction: { padding: 8 },

  // Panel
  panel: { paddingHorizontal: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, gap: 15 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 15, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  statIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#1F2937' },
  statTitle: { fontSize: 10, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  actionBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  // Leave Card
  leaveCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  leaveHeader: { flexDirection: 'row', alignItems: 'center' },
  leaveAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  leaveAvatarText: { color: '#EF4444', fontSize: 18, fontWeight: '800' },
  leaveMain: { flex: 1, marginLeft: 15 },
  leaveTeacherName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  leaveType: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
  leaveFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  leaveDateInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leaveDateText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  coverBtn: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  coverBtnText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },

  // Setup
  setupPanel: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  setupTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 20 },
  setupDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  setupActionBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 14, marginTop: 25 },
  setupActionText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  tabSwitcherSkeleton: { paddingHorizontal: 20, marginBottom: 25 },
});

export default PrincipalTimetableScreen;
