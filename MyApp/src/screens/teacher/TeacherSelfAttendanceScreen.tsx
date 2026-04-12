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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>My Attendance History</Text>
          <Text style={styles.headerSubtitle}>Personal Tracking Portal</Text>
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
  header: { 
    backgroundColor: '#6366F1', 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 25, 
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: { marginRight: 15, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 12, color: '#E0E7FF', fontWeight: '500' },
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
  progressCircle: { width: 80, height: 80, borderRadius: 40, borderOrigin: 'center', borderWidth: 6, borderColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  percentText: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  percentLab: { fontSize: 8, fontWeight: '700', color: '#94A3B8' },
  statsGrid: { flex: 1, flexDirection: 'row', marginLeft: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  statLab: { fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 4 },

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
