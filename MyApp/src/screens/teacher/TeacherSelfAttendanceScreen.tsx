import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { useAuth } from '../../store/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherSelfAttendance'>;

const TeacherSelfAttendanceScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (refreshing = false) => {
    try {
      if (!refreshing) setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.TEACHER.MY_ATTENDANCE);
      const data = res.data?.data || res.data || {};
      setRecords(data.records || []);
      setStats({
        percentage: data.percentage || 0,
        present: data.records?.filter((r:any) => !r.is_absent).length || 0,
        late: data.records?.filter((r:any) => r.is_late).length || 0,
      });
    } catch (error) {
      console.error('Failed to fetch self attendance history:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData(true);
  };

  const handleMarkAttendance = async (type: 'IN' | 'OUT') => {
    try {
      setIsLoading(true);
      const res = await apiClient.post(ENDPOINTS.TEACHER.MY_ATTENDANCE_MANUAL, {
        teacherId: authState.user?.id,
        type,
        notes: 'Marked via Mobile Portal'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      Alert.alert('Error', 'Failed to mark attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const todayRecord = records.find(r => new Date(r.date).toDateString() === new Date().toDateString());
  const canClockIn = !todayRecord;
  const canClockOut = todayRecord && !todayRecord.out_time;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      {/* Standardized Header Box */}
      <View style={styles.globalHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={28} color="#111827" />
        </ScaleButton>

        <Text style={styles.headerTitle} numberOfLines={1}>My Attendance</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AccountSettings')} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.iconBtn}>
            <Ionicons name="moon-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: '#A855F7' }]}>
            <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#6366F1']} />}
      >
        {/* Real-time Performance Overview */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.statsCard}>
           <View style={styles.statsMain}>
              <View style={styles.progressCircle}>
                  <Text style={styles.percentText}>{stats?.percentage || 0}%</Text>
                  <Text style={styles.percentLab}>Overall</Text>
              </View>
              <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                      <Text style={styles.statVal}>{stats?.present || 0}</Text>
                      <Text style={styles.statLab}>Present Days</Text>
                  </View>
                  <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: '#E2E8F0' }]}>
                      <Text style={[styles.statVal, { color: '#F59E0B' }]}>{stats?.late || 0}</Text>
                      <Text style={styles.statLab}>Late Marks</Text>
                  </View>
              </View>
           </View>

           {/* Clock In/Out Section */}
           <View style={styles.clockActionRow}>
              {canClockIn ? (
                <TouchableOpacity 
                  style={[styles.clockBtn, styles.clockInBtn]} 
                  onPress={() => handleMarkAttendance('IN')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-in-outline" size={20} color="#FFF" style={{marginRight: 8}} />
                  <Text style={styles.clockBtnText}>Clock In Today</Text>
                </TouchableOpacity>
              ) : canClockOut ? (
                <TouchableOpacity 
                  style={[styles.clockBtn, styles.clockOutBtn]} 
                  onPress={() => handleMarkAttendance('OUT')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-out-outline" size={20} color="#FFF" style={{marginRight: 8}} />
                  <Text style={styles.clockBtnText}>Clock Out Now</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.completedDayRow}>
                  <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
                  <Text style={styles.completedText}>Attendance completed for today</Text>
                </View>
              )}
           </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Daily Check-in Logs</Text>

        {isLoading && !isRefreshing ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
        ) : records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No attendance records found yet.</Text>
          </View>
        ) : (
          records.map((record, index) => (
            <Animated.View key={index} entering={FadeInUp.delay(200 + index * 50).springify()} style={styles.logCard}>
               <View style={styles.logDateArea}>
                  <Text style={styles.logDay}>{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                  <Text style={styles.logDate}>{new Date(record.date).getDate()}</Text>
               </View>
               <View style={styles.logInfoArea}>
                  <View style={styles.logRow}>
                      <Ionicons name="time-outline" size={14} color="#64748B" />
                      <Text style={styles.logTimeText}>{record.in_time || '--:--'} In • {record.out_time || '--:--'} Out</Text>
                  </View>
                  <View style={styles.logRow}>
                      <Ionicons name="briefcase-outline" size={14} color="#64748B" />
                      <Text style={styles.logTimeText}>{record.work_hours || '0h 0m'} Work Duration</Text>
                  </View>
               </View>
               <View style={[styles.statusTag, record.is_late ? styles.statusLate : styles.statusPresent]}>
                  <Text style={[styles.statusTagText, record.is_late ? styles.statusTextLate : styles.statusTextPresent]}>
                    {record.is_late ? 'LATE' : 'PRESENT'}
                  </Text>
               </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
  iconBtn: { padding: 4 },
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
  content: { flex: 1, paddingHorizontal: 20 },
  
  statsCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 20, 
    marginTop: -20, 
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  statsMain: { flexDirection: 'row', alignItems: 'center' },
  progressCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, borderColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  percentText: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  percentLab: { fontSize: 8, fontWeight: '700', color: '#94A3B8' },
  statsGrid: { flex: 1, flexDirection: 'row', marginLeft: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  statLab: { fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 4 },
  
  clockActionRow: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  clockBtn: { height: 50, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  clockInBtn: { backgroundColor: '#6366F1' },
  clockOutBtn: { backgroundColor: '#F59E0B' },
  clockBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  completedDayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 10 },
  completedText: { fontSize: 14, fontWeight: '700', color: '#10B981' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 30, marginBottom: 15 },
  logCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  logDateArea: { width: 50, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F1F5F9', marginRight: 15 },
  logDay: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  logDate: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  logInfoArea: { flex: 1, gap: 6 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logTimeText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  
  statusTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusPresent: { backgroundColor: '#ECFDF5' },
  statusLate: { backgroundColor: '#FFFBEB' },
  statusTagText: { fontSize: 9, fontWeight: '800' },
  statusTextPresent: { color: '#10B981' },
  statusTextLate: { color: '#D97706' },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 15, fontSize: 14, fontWeight: '600', color: '#94A3B8' },
});

export default TeacherSelfAttendanceScreen;
