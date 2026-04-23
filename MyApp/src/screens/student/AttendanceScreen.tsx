import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { ActivityIndicator } from 'react-native';
import Skeleton from '../../components/common/Skeleton';

const PageSkeleton = () => {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.pageTitleWrapper}>
        <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={16} />
      </View>
      <View style={styles.card}>
         <Skeleton width="40%" height={20} style={{marginBottom: 15}} />
         <View style={styles.statsRow}>
            <Skeleton width="31%" height={80} borderRadius={8} />
            <Skeleton width="31%" height={80} borderRadius={8} />
            <Skeleton width="31%" height={80} borderRadius={8} />
         </View>
      </View>
      <View style={styles.card}>
         <Skeleton width="100%" height={250} borderRadius={12} />
      </View>
      <View style={styles.card}>
         <Skeleton width="100%" height={200} borderRadius={12} />
      </View>
    </ScrollView>
  );
};

type AttendanceScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Attendance'>;

interface Props {
  navigation: AttendanceScreenNavigationProp;
}

const AttendanceScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllRecords, setShowAllRecords] = useState(false);

  React.useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // 1. Resolve student ID reliably
        const profileRes = await apiClient.get(ENDPOINTS.STUDENT.PROFILE);
        const studentId = profileRes.normalized?.data?.id || profileRes.normalized?.data?.student?.id || authState.user?.id;

        if (!studentId) {
          throw new Error('Student ID not found');
        }

        // 2. Fetch specific student attendance
        const res = await apiClient.get(ENDPOINTS.STUDENT.ATTENDANCE(studentId));
        // Handle various response types including normalized
        const attendancePayload = res.normalized?.data || res.data?.data || res.data;
        setAttendanceData(attendancePayload);
      } catch (err: any) {
        console.error('Failed to fetch attendance:', err);
        // TEMPORARY: Mock data fallback
        setAttendanceData({
          attendancePercentage: 92.5,
          presentDays: 148,
          absentDays: 12,
          records: [
            { date: '2026-05-22', status: 'Present', notes: 'In time' },
            { date: '2026-05-21', status: 'Present', notes: 'In time' },
            { date: '2026-05-20', status: 'Absent', notes: 'Medical leave' },
            { date: '2026-05-19', status: 'Present', notes: 'In time' },
            { date: '2026-05-18', status: 'Present', notes: 'Late by 5 mins' },
          ]
        });
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };
    fetchAttendance();
  }, [authState.user?.id]);

  // Calendar data starting 1 on Sunday, padded to 35 slots to prevent flex wrap spreading
  const daysInMonth = Array.from({ length: 35 }, (_, i) => i < 31 ? i + 1 : null);

  const getDayStyle = (day: number | null) => {
    if (day === null) return null;
    
    // Get current month/year for matching
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    
    if (attendanceData?.records) {
      const dateStr = `${currentYear}-${currentMonth}-${day.toString().padStart(2, '0')}`;
      const record = attendanceData.records.find((r: any) => r.date && r.date.startsWith(dateStr));
      if (record) {
        const status = record.status?.toLowerCase();
        if (status === 'present' || status === 'late') return 'present';
        if (status === 'absent') return 'absent';
      }
    }
    return 'none';
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return '----';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '----';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return '----'; }
  };

  const stats = attendanceData || {};
  const recentRecords = showAllRecords ? (attendanceData?.records || []) : (attendanceData?.records?.slice(0, 5) || []);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <ScaleButton 
          style={styles.menuHandle} 
          onPress={() => setDrawerOpen(true)}
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Welcome back, {authState.user?.name?.split(' ')[0] || 'Student'}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}>
            <Ionicons name="settings-outline" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'S'}</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <PageSkeleton />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Title */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <Text style={styles.pageTitle}>Attendance</Text>
           <Text style={styles.pageSubtitle}>Track your daily attendance and punctuality</Text>
        </Animated.View>

        {/* Card 1: Attendance Rate Blocks */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.card}>
           <Text style={[styles.cardHeader, {marginBottom: 14}]}>Attendance Rate</Text>
           
           <View style={styles.statsRow}>
              <View style={[styles.statBox, {borderLeftColor: '#3B82F6'}]}>
                 <Text style={styles.statBoxTitle} numberOfLines={1} adjustsFontSizeToFit>Attendance Rate</Text>
                 <Text style={styles.statBoxVal} adjustsFontSizeToFit numberOfLines={1}>{stats.attendancePercentage?.toFixed(1) || '0.0'} %</Text>
              </View>
 
              <View style={[styles.statBox, styles.statBoxMid, {borderLeftColor: '#10B981'}]}>
                 <Text style={styles.statBoxTitle} numberOfLines={1} adjustsFontSizeToFit>Days Present</Text>
                 <Text style={styles.statBoxSub} numberOfLines={2}>Academic Session</Text>
                 <Text style={styles.statBoxVal} adjustsFontSizeToFit numberOfLines={1}>{stats.presentDays || 0}</Text>
              </View>
 
              <View style={[styles.statBox, {borderLeftColor: '#EF4444'}]}>
                 <Text style={styles.statBoxTitle} numberOfLines={1} adjustsFontSizeToFit>Days Absent</Text>
                 <Text style={styles.statBoxSub} numberOfLines={2}>Requires Attention</Text>
                 <Text style={styles.statBoxVal} adjustsFontSizeToFit numberOfLines={1}>{stats.absentDays || 0}</Text>
              </View>
           </View>
        </Animated.View>
 
        {/* Card 2: Calendar */}
        <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.card}>
           <View style={styles.cardRowBetween}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                 <Ionicons name="calendar-outline" size={18} color="#111827" style={{marginRight: 6}} />
                 <Text style={styles.cardHeader}>
                    {new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                 </Text>
              </View>
              <View style={styles.calArrows}>
                 <TouchableOpacity style={styles.calBtn}>
                    <Ionicons name="chevron-back" size={14} color="#111827" />
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.calBtn}>
                    <Ionicons name="chevron-forward" size={14} color="#111827" />
                 </TouchableOpacity>
              </View>
           </View>
 
           {/* Days of week */}
           <View style={styles.calDaysHeader}>
             {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
               <Text key={d} style={styles.calDayText}>{d}</Text>
             ))}
           </View>
 
           {/* Grid */}
           <View style={styles.calGrid}>
             {daysInMonth.map((day, index) => {
               if (day === null) {
                 return <View key={`empty-${index}`} style={{ width: '13%' }} />;
               }
               const stType = getDayStyle(day);
               return (
                 <View key={day} style={[
                   styles.calCell, 
                   stType === 'present' && styles.calCellPresent,
                   stType === 'absent' && styles.calCellAbsent,
                   stType === 'weekend' && styles.calCellWeekend
                 ]}>
                   <Text style={[
                     styles.calCellText,
                     stType === 'present' && styles.calCellTextPresent,
                     stType === 'absent' && styles.calCellTextAbsent,
                   ]}>{day}</Text>
                 </View>
               )
             })}
           </View>
 
           <View style={styles.calDivider} />
           
           <View style={styles.calLegend}>
             <View style={styles.legendItem}>
                <View style={[styles.legendBox, {backgroundColor: '#A7F3D0'}]} />
                <Text style={styles.legendText}>Present</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendBox, {backgroundColor: '#FECACA'}]} />
                <Text style={styles.legendText}>Absent</Text>
             </View>
           </View>
        </Animated.View>
 
        {/* Card 3: Recent Records */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.card}>
           <View style={styles.cardRowBetween}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                 <Ionicons name="time-outline" size={18} color="#111827" style={{marginRight: 6}} />
                 <Text style={styles.cardHeader}>{showAllRecords ? 'Full Attendance History' : 'Recent Attendance Records'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.viewAllBtn}
                onPress={() => setShowAllRecords(!showAllRecords)}
              >
                 <Text style={styles.viewAllText}>{showAllRecords ? 'Show less' : 'View all'}</Text>
              </TouchableOpacity>
           </View>
 
           <View style={styles.table}>
              {/* Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, {flex: 1.5}]}>Date</Text>
                <Text style={[styles.thText, {flex: 1.2}]}>Status</Text>
                <Text style={[styles.thText, {flex: 1.2}]}>Remark</Text>
              </View>
              
              {/* Rows */}
              {recentRecords.length === 0 ? (
                <Text style={styles.emptyText}>No recent records found.</Text>
              ) : (
                recentRecords.map((row: any, idx: number) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tdTextBold, {flex: 1.5}]}>{formatDate(row.date)}</Text>
                    <View style={[{flex: 1.2}, styles.tdPillWrap]}>
                      <View style={row.status.toLowerCase() === 'present' ? styles.statusPresent : styles.statusAbsent}>
                        <Text style={row.status.toLowerCase() === 'present' ? styles.statusTextPresent : styles.statusTextAbsent}>{row.status}</Text>
                      </View>
                    </View>
                    <Text style={[styles.tdText, {flex: 1.2}]} numberOfLines={1}>{row.notes || '----'}</Text>
                  </View>
                ))
              )}
           </View>
        </Animated.View>

        {/* Card 4: Academic Goal Progress */}
        <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.card}>
           <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
             <Ionicons name="disc-outline" size={20} color="#111827" style={{marginRight: 6}} />
             <Text style={styles.cardHeader}>Academic Goal Progress</Text>
           </View>

           <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
              <Text style={styles.targetTitle}>Target : 95 % Attendance</Text>
              <Text style={styles.targetPercent}>{stats.attendancePercentage?.toFixed(1) || '0.0'} %</Text>
           </View>

           <View style={styles.progressBarBg}>
             <View style={[styles.progressBarFill, {width: `${Math.min(100, stats.attendancePercentage || 0)}%`}]} />
           </View>

           <View style={styles.progressMetrics}>
              <Text style={styles.metricText}>Current : {stats.attendancePercentage?.toFixed(1) || '0.0'} %</Text>
              <Text style={styles.metricText}>Goal : 95.0 %</Text>
              <Text style={styles.metricText}>Gap : {Math.max(0, 95 - (stats.attendancePercentage || 0)).toFixed(1)} %</Text>
           </View>
        </Animated.View>

      </ScrollView>
      )}

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAF9F9' },
  scrollContent: { paddingBottom: 40 },

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

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 20,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    marginBottom: 16, borderWidth: 1, borderColor: '#FAFAFA' // Slightly softer border
  },
  cardHeader: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },

  /* Card 1 Stats */
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statBoxMid: {
    marginHorizontal: 8,
  },
  statBoxTitle: { fontSize: 10, fontWeight: '700', color: '#111827', marginBottom: 4 },
  statBoxSub: { fontSize: 8, color: '#9CA3AF', marginBottom: 12, lineHeight: 10 },
  statBoxVal: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 'auto' },

  /* Card 2 Calendar */
  calArrows: { flexDirection: 'row', gap: 6 },
  calBtn: { padding: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  calDaysHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  calDayText: { width: '13%', textAlign: 'center', fontSize: 9, fontWeight: '600', color: '#6B7280' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 0 },
  calCell: {
    width: '13%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
    marginBottom: 6, borderRadius: 6,
  },
  calCellWeekend: { borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  calCellPresent: { backgroundColor: '#D1FAE5' },
  calCellAbsent: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#F87171' },
  calCellText: { fontSize: 11, fontWeight: '600', color: '#111827' },
  calCellTextPresent: { color: '#059669' },
  calCellTextAbsent: { color: '#EF4444' },
  calDivider: { height: 1, backgroundColor: '#E5E7EB', marginTop: 4, marginBottom: 10 },
  calLegend: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 10, fontWeight: '600', color: '#111827' },

  /* Card 3 Table */
  viewAllBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  viewAllText: { fontSize: 10, fontWeight: '600', color: '#374151' },
  table: { marginTop: 4 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, marginBottom: 4 },
  thText: { fontSize: 10, fontWeight: '700', color: '#111827' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tdText: { fontSize: 10, color: '#4B5563', fontWeight: '500' },
  tdTextBold: { fontSize: 10, color: '#111827', fontWeight: '700' },
  tdPillWrap: { alignItems: 'flex-start' },
  statusPresent: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusAbsent: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusTextPresent: { fontSize: 9, color: '#059669', fontWeight: '600' },
  statusTextAbsent: { fontSize: 9, color: '#DC2626', fontWeight: '600' },

  /* Card 4 Target Progress */
  targetTitle: { fontSize: 12, fontWeight: '700', color: '#111827' },
  targetPercent: { fontSize: 14, fontWeight: '800', color: '#3B82F6' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, width: '100%', overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', borderRadius: 3, backgroundColor: '#3B82F6' },
  progressMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricText: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20, fontSize: 13 },
});

export default AttendanceScreen;
