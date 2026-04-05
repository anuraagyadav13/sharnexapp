import React from 'react';
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
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherViewAttendance'>;

const MOCK_STUDENTS = [
  { id: 1, name: 'Alex Johnson', stdId: 'STU-2025-001', status: 'Present' },
  { id: 2, name: 'Alex Johnson', stdId: 'STU-2025-001', status: 'Present' },
  { id: 3, name: 'Alex Johnson', stdId: 'STU-2025-001', status: 'Absent' },
  { id: 4, name: 'Alex Johnson', stdId: 'STU-2025-001', status: 'Absent' },
  { id: 5, name: 'Alex Johnson', stdId: 'STU-2025-001', status: 'Present' },
  { id: 6, name: 'Alex Johnson', stdId: 'STU-2025-001', status: 'Present' },
  { id: 7, name: 'Alex Johnson', stdId: 'STU-2025-001', status: 'Present' },
  { id: 8, name: 'Alex Johnson', stdId: 'STU-2025-001', status: 'Present' },
  { id: 9, name: 'Alex Johnson', stdId: 'STU-2025-001', status: 'Present' },
];

const TeacherViewAttendanceScreen: React.FC<Props> = ({ navigation }) => {
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
         <Text style={styles.blueTitle}>Attendance Details - Class - 1</Text>
         <Text style={styles.blueSubtitle}>Class Teacher - Mr. John • 35 Students • December 15, 2025</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Main Content Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.mainCard}>
           
           {/* Summary Stats Grid */}
           <View style={styles.statsRow}>
              <View style={[styles.statBox, { borderTopColor: '#4F46E5' }]}>
                 <Text style={styles.statNumber}>32</Text>
                 <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={[styles.statBox, { borderTopColor: '#EF4444' }]}>
                 <Text style={styles.statNumber}>2</Text>
                 <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={[styles.statBox, { borderTopColor: '#22C55E' }]}>
                 <Text style={styles.statNumber}>30</Text>
                 <Text style={styles.statLabel}>Present</Text>
              </View>
           </View>

           {/* Title */}
           <Text style={styles.sectionTitle}>Student Attendance</Text>

           {/* List */}
           {MOCK_STUDENTS.map((student, index) => {
             const initials = student.name.split(' ').map(n => n[0]).join('');
             const isPresent = student.status === 'Present';
             
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
                  <View style={[styles.statusPill, isPresent ? styles.statusPillPresent : styles.statusPillAbsent]}>
                     <Text style={[styles.statusText, isPresent ? styles.statusTextPresent : styles.statusTextAbsent]}>
                        {student.status}
                     </Text>
                  </View>
               </Animated.View>
             );
           })}

        </Animated.View>
      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.bottomBar}>
         <TouchableOpacity style={styles.exportBtn} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={16} color="#4F46E5" style={{marginRight: 6}} />
            <Text style={styles.exportBtnText}>Export</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.doneBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{marginRight: 6}} />
            <Text style={styles.doneBtnText}>Done</Text>
         </TouchableOpacity>
      </Animated.View>

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
    elevation: 4,},
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TeacherViewAttendanceScreen;
