import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
// Import our easy-to-use teacherService for talking to the server
import teacherService from '../../services/teacherService';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import RNFS from 'react-native-fs';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherViewAttendance'>;

const CustomCalendarPickerOverlay = ({ visible, onClose, onSelect, selectedDate }: any) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [currentDate, setCurrentDate] = React.useState(new Date(selectedDate));

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View entering={FadeIn.duration(300)} style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 15 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 10 }}><Ionicons name="chevron-back" size={20} color="#4F46E5" /></TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B' }}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={{ padding: 10 }}><Ionicons name="chevron-forward" size={20} color="#4F46E5" /></TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
            {days.map(d => <Text key={d} style={{ width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 10 }}>{d}</Text>)}
            {calendarDays.map((d, i) => {
              const isToday = d && new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();
              const isSelected = d && new Date(selectedDate).toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();
              return (
                <TouchableOpacity key={i} disabled={!d} onPress={() => { if (d) { onSelect(new Date(currentDate.getFullYear(), currentDate.getMonth(), d)); onClose(); } }} style={{ width: `${100 / 7}%`, height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: isSelected ? '#4F46E5' : 'transparent', borderWidth: isToday ? 1 : 0, borderColor: '#4F46E5' }}>
                  {d && <Text style={{ fontSize: 14, fontWeight: isSelected || isToday ? '900' : '500', color: isSelected ? '#FFFFFF' : isToday ? '#4F46E5' : '#1E293B' }}>{d}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 10, padding: 15, backgroundColor: '#F1F5F9', borderRadius: 16, alignItems: 'center' }}><Text style={{ color: '#64748B', fontWeight: '800' }}>Cancel</Text></TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const TeacherViewAttendanceScreen: React.FC<Props> = ({ navigation, route }) => {
  const { classId } = route.params;
  const { authState } = useAuth();
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isCalendarVisible, setIsCalendarVisible] = React.useState(false);
  const [attendance, setAttendance] = React.useState<any[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [stats, setStats] = React.useState({ total: 0, present: 0, absent: 0 });

  const fetchAttendance = React.useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      // Ask the server: "give me attendance for this class on this date", plus fetching class roster
      const [res, rosterRes] = await Promise.all([
        teacherService.getAttendance(classId, dateStr),
        teacherService.getClassStudents(classId)
      ]);

      // Map Roster array to a state
      const rosterData = rosterRes.data?.data || rosterRes.data?.students || rosterRes.data || [];
      setStudents(rosterData);

      // The server responds with: { data: { attendance: [...] } }
      // Our API client normalizes it, so res.data.data is the real stuff
      const payload = res.data?.data ?? res.data;
      const data: any[] = payload?.attendance ?? payload?.records ?? [];

      // Map mappedNames into attendance records directly before saving slightly easier logic in render
      const mappedData = data.map(record => {
        const rosterStudent = rosterData.find((s: any) => s.id === record.studentId || s.studentId === record.studentId || (s.user && s.user.id === record.studentId));
        return {
          ...record,
          studentName: rosterStudent?.name || rosterStudent?.user?.name || rosterStudent?.studentName || 'Student',
          rollNo: rosterStudent?.rollNo || rosterStudent?.rollNumber || record.studentId.slice(0, 8)
        };
      });

      setAttendance(mappedData);

      // Calculate the summary numbers from the list of students
      setStats({
        total: mappedData.length,
        // Count anyone marked as 'present' or 'late' as being there
        present: mappedData.filter((a: any) => a.status === 'present' || a.status === 'late').length,
        absent: mappedData.filter((a: any) => a.status === 'absent').length,
      });
    } catch (err) {
      console.error('Failed to fetch attendance records:', err);
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  }, [classId, selectedDate]);

  React.useEffect(() => {
    fetchAttendance(false);
  }, [fetchAttendance]);

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await fetchAttendance(true);
    setIsRefreshing(false);
  }, [fetchAttendance]);

  const handleExport = async () => {
    try {
      Alert.alert('Exporting', 'Generating CSV file...');
      
      let csvContent = 'Name,Roll No,Status,Date,Marked At\n';
      attendance.forEach(record => {
        const dateStr = selectedDate.toLocaleDateString();
        const timeStr = record.markedAt ? new Date(record.markedAt).toLocaleTimeString() : '';
        const safeName = (record.studentName || 'Student').replace(/,/g, ''); // Escaping commas just in case
        csvContent += `${safeName},${record.rollNo},${record.status},${dateStr},${timeStr}\n`;
      });

      const datePart = selectedDate.toISOString().split('T')[0];
      const fileName = `Attendance_${classId.slice(0,8)}_${datePart}.csv`;
      const path = Platform.OS === 'android' 
        ? `${RNFS.DownloadDirectoryPath}/${fileName}` 
        : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(path, csvContent, 'utf8');
      
      Alert.alert('Success', `Attendance CSV saved locally!\n\nPath: ${path}`);
    } catch (e: any) {
      console.error('Attendance Export error', e);
      Alert.alert('Error', 'Failed to export the attendance.');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <View style={styles.menuHandle} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Welcome back, {authState.user?.name?.split(' ')[0] || 'Teacher'}</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
          </View>
        </View>
      </View>

      {/* Blue Header Section */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.blueHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.blueTitle}>Attendance Details</Text>
            <Text style={styles.blueSubtitle}>{stats.total} Students Recorded • {selectedDate.toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity style={styles.dateSelector} onPress={() => setIsCalendarVisible(true)}>
            <Ionicons name="calendar" size={18} color="#FFF" />
            <Text style={styles.dateSelectorText}>Select Date</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >

        {/* Main Content Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.mainCard}>

          {/* Summary Stats Grid */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { borderTopColor: '#4F46E5' }]}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={[styles.statBox, { borderTopColor: '#EF4444' }]}>
              <Text style={styles.statNumber}>{stats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={[styles.statBox, { borderTopColor: '#22C55E' }]}>
              <Text style={styles.statNumber}>{stats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.sectionTitle}>Student Attendance</Text>

          {/* List */}
          {isLoading ? (
            <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />
          ) : attendance.length === 0 ? (
            <Text style={styles.emptyText}>No attendance records found for today.</Text>
          ) : (
            attendance.map((student, index) => {
              // Handle both camelCase (studentName) and snake_case (student_name) — the API might use either
              const name = student.studentName ?? student.student_name ?? student.name ?? 'Student';
              const rollNo = student.rollNo ?? student.roll_no ?? student.roll_number;
              const studentId = student.studentId ?? student.student_id ?? '';
              const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
              const isPresent = student.status === 'present' || student.status === 'late';

              return (
                <Animated.View key={studentId || index} entering={FadeInUp.delay(150 + index * 50).springify()} style={styles.studentRow}>
                  <View style={styles.studentInfoLeft}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                    <View>
                      <Text style={styles.studentName}>{name}</Text>
                      {/* Show roll number if available, otherwise show a short ID */}
                      <Text style={styles.studentId}>ID: {rollNo ?? studentId.slice(0, 8)}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusPill, isPresent ? styles.statusPillPresent : styles.statusPillAbsent]}>
                    <Text style={[styles.statusText, isPresent ? styles.statusTextPresent : styles.statusTextAbsent]}>
                      {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Unknown'}
                    </Text>
                  </View>
                </Animated.View>
              );
            })
          )}

        </Animated.View>
      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.bottomBar}>
        <TouchableOpacity style={styles.exportBtn} activeOpacity={0.8} onPress={handleExport}>
          <Ionicons name="download-outline" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>

      <CustomCalendarPickerOverlay
        visible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        onSelect={setSelectedDate}
        selectedDate={selectedDate}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 100 }, // enough padding for bottom bar

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
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  blueHeader: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  blueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  blueSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E0E7FF',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  dateSelectorText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 3,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },

  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  studentInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPillPresent: {
    backgroundColor: '#ECFDF5',
  },
  statusPillAbsent: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPresent: {
    color: '#10B981',
  },
  statusTextAbsent: {
    color: '#EF4444',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  exportBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,

    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
});

export default TeacherViewAttendanceScreen;
