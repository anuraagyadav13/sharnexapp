import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherMarkAttendance'>;

const MOCK_STUDENTS_DATA = [
  { id: 1, name: 'Alex Johnson', stdId: 'STU-2025-001' },
  { id: 2, name: 'Alex Johnson', stdId: 'STU-2025-001' },
  { id: 3, name: 'Alex Johnson', stdId: 'STU-2025-001' },
  { id: 4, name: 'Alex Johnson', stdId: 'STU-2025-001' },
  { id: 5, name: 'Alex Johnson', stdId: 'STU-2025-001' },
  { id: 6, name: 'Alex Johnson', stdId: 'STU-2025-001' },
  { id: 7, name: 'Alex Johnson', stdId: 'STU-2025-001' },
  { id: 8, name: 'Alex Johnson', stdId: 'STU-2025-001' },
];

const TeacherMarkAttendanceScreen: React.FC<Props> = ({ navigation }) => {
  const [attendanceState, setAttendanceState] = useState<Record<number, 'P' | 'A' | 'L'>>({});

  const markAll = (status: 'P' | 'A') => {
    const newState: Record<number, 'P' | 'A' | 'L'> = {};
    MOCK_STUDENTS_DATA.forEach(s => {
      newState[s.id] = status;
    });
    setAttendanceState(newState);
  };

  const toggleStatus = (id: number, status: 'P' | 'A' | 'L') => {
    setAttendanceState(prev => ({ ...prev, [id]: status }));
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <View style={styles.menuHandle} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Welcome back, Anurag</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>A</Text>
          </View>
        </View>
      </View>

      {/* Blue Header Section */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.blueHeader}>
         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
         </TouchableOpacity>
         <Text style={styles.blueTitle}>Mark Attendance</Text>
         <View style={styles.classRow}>
            <Text style={styles.classTitle}>Class - 1</Text>
            <View style={styles.todayBtn}>
               <Text style={styles.todayBtnText}>Today</Text>
            </View>
         </View>
         <Text style={styles.blueSubtitle}>Class Teacher - Mr. John • 35 Students</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Main Content Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.mainCard}>
           
           <Text style={styles.cardTitle}>Mark Attendance</Text>

           {/* Mark All Buttons */}
           <View style={styles.markAllRow}>
              <TouchableOpacity 
                 style={[styles.markAllBtn, styles.markAllBtnPresent]} 
                 activeOpacity={0.7}
                 onPress={() => markAll('P')}
              >
                 <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={{marginRight: 6}} />
                 <Text style={styles.markAllPresentText}>Mark All{'\n'}Present</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                 style={[styles.markAllBtn, styles.markAllBtnAbsent]} 
                 activeOpacity={0.7}
                 onPress={() => markAll('A')}
              >
                 <Ionicons name="checkmark-circle" size={16} color="#EF4444" style={{marginRight: 6}} />
                 <Text style={styles.markAllAbsentText}>Mark All{'\n'}Absent</Text>
              </TouchableOpacity>
           </View>

           {/* Title */}
           <Text style={[styles.cardTitle, {marginTop: 24, marginBottom: 20}]}>Students</Text>

           {/* List */}
           {MOCK_STUDENTS_DATA.map((student, index) => {
             const initials = student.name.split(' ').map(n => n[0]).join('');
             const currentStatus = attendanceState[student.id];
             
             return (
               <Animated.View key={index} entering={FadeInUp.delay(150 + index * 50).springify()} style={styles.studentRow}>
                  <View style={styles.studentInfoLeft}>
                     <View style={styles.avatarCircle}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                     </View>
                     <View>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentId}>ID: {student.stdId}</Text>
                     </View>
                  </View>
                  
                  {/* Status Toggles */}
                  <View style={styles.toggleGroup}>
                     {/* P Toggle */}
                     <TouchableOpacity 
                        style={[
                           styles.toggleBtn, 
                           currentStatus === 'P' ? styles.toggleBtnPresentActive : styles.toggleBtnPresent
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleStatus(student.id, 'P')}
                     >
                        <Text style={[
                           styles.toggleText,
                           currentStatus === 'P' ? styles.toggleTextActive : styles.toggleTextPresent
                        ]}>P</Text>
                     </TouchableOpacity>

                     {/* A Toggle */}
                     <TouchableOpacity 
                        style={[
                           styles.toggleBtn, 
                           currentStatus === 'A' ? styles.toggleBtnAbsentActive : styles.toggleBtnAbsent
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleStatus(student.id, 'A')}
                     >
                        <Text style={[
                           styles.toggleText,
                           currentStatus === 'A' ? styles.toggleTextActive : styles.toggleTextAbsent
                        ]}>A</Text>
                     </TouchableOpacity>

                     {/* L Toggle */}
                     <TouchableOpacity 
                        style={[
                           styles.toggleBtn, 
                           // Note: matching screenshot perfectly where 'L' is filled orange all the time
                           // or just when selected. We will make it filled orange if selected or default to match screen.
                           // Actually the screenshot has L solid orange. We'll set it here to match.
                           currentStatus === 'L' || !currentStatus ? styles.toggleBtnLeaveActive : styles.toggleBtnLeave
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleStatus(student.id, 'L')}
                     >
                        <Text style={[
                           styles.toggleText,
                           currentStatus === 'L' || !currentStatus ? styles.toggleTextActive : styles.toggleTextLeave
                        ]}>L</Text>
                     </TouchableOpacity>
                  </View>
               </Animated.View>
             );
           })}

        </Animated.View>
      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.bottomBar}>
         <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{marginRight: 6}} />
            <Text style={styles.submitBtnText}>Submit Attendance</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
         </TouchableOpacity>
      </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 110 }, 

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
  headerTitle: { fontSize: 16,
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
    paddingTop: 8,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  classRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  classTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  todayBtn: {
    backgroundColor: '#79A4F2', // matching light blue
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  todayBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  blueSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#E2E8F0',
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },

  markAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  markAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  markAllBtnPresent: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  markAllPresentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22C55E',
    textAlign: 'center',
  },
  markAllBtnAbsent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  markAllAbsentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
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
    marginRight: 10,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 9,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },

  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  
  toggleBtnPresent: { backgroundColor: '#ECFDF5' },
  toggleBtnPresentActive: { backgroundColor: '#10B981' },
  toggleTextPresent: { color: '#10B981' },

  toggleBtnAbsent: { backgroundColor: '#FEF2F2' },
  toggleBtnAbsentActive: { backgroundColor: '#EF4444' },
  toggleTextAbsent: { color: '#EF4444' },

  toggleBtnLeave: { backgroundColor: '#FEF3C7' }, // pale yellow orange
  toggleBtnLeaveActive: { backgroundColor: '#F59E0B' }, // solid orange
  toggleTextLeave: { color: '#F59E0B' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#F8FAFC',
  },
  submitBtn: {
    flex: 2.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 12,
  
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,},
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});

export default TeacherMarkAttendanceScreen;
