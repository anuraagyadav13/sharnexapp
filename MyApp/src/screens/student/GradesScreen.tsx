import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';

type GradesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Grades'>;

interface Props {
  navigation: GradesScreenNavigationProp;
}

const SUBJECTS = [
  { id: 1, name: 'Mathematics', teacher: 'Mr. Aman Kumar', status: 'Excellent', assignments: 25, quizzes: 25, exams: 25, grade: '91 (A)' },
  { id: 2, name: 'Mathematics', teacher: 'Mr. Aman Kumar', status: 'Excellent', assignments: 25, quizzes: 25, exams: 25, grade: '91 (A)' },
  { id: 3, name: 'Mathematics', teacher: 'Mr. Aman Kumar', status: 'Excellent', assignments: 25, quizzes: 25, exams: 25, grade: '91 (A)' },
  { id: 4, name: 'Mathematics', teacher: 'Mr. Aman Kumar', status: 'Excellent', assignments: 25, quizzes: 25, exams: 25, grade: '91 (A)' },
];

const REPORTS = [
  { id: 1, title: 'Term 2 Final Report Card', desc: 'Complete performance report with subject grades and teacher comments', date: 'May 25, 2023' },
  { id: 2, title: 'Term 2 Final Report Card', desc: 'Complete performance report with subject grades and teacher comments', date: 'May 25, 2023' },
  { id: 3, title: 'Term 2 Final Report Card', desc: 'Complete performance report with subject grades and teacher comments', date: 'May 25, 2023' },
];

const GradesScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Title */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <Text style={styles.pageTitle}>Grades & Reports</Text>
           <Text style={styles.pageSubtitle}>View your grades and academic reports</Text>
        </Animated.View>

        {/* Subjects List */}
        {SUBJECTS.map((item, index) => (
          <Animated.View 
            key={`sub-${item.id}`} 
            entering={FadeInUp.delay(100 + (index * 50)).springify()} 
            style={styles.subjectCard}
          >
             <View style={styles.cardHeaderRow}>
               <View>
                 <Text style={styles.subjectName}>{item.name}</Text>
                 <Text style={styles.teacherName}>{item.teacher}</Text>
               </View>
               <View style={styles.statusPill}>
                 <Text style={styles.statusText}>{item.status}</Text>
               </View>
             </View>

             <View style={styles.divider} />

             <View style={styles.statsRow}>
               <View style={styles.statCol}>
                 <Text style={styles.statLabel}>Assignments</Text>
                 <Text style={styles.statValue}>{item.assignments}</Text>
               </View>
               <View style={styles.statCol}>
                 <Text style={styles.statLabel}>Quizzes</Text>
                 <Text style={styles.statValue}>{item.quizzes}</Text>
               </View>
               <View style={styles.statCol}>
                 <Text style={styles.statLabel}>Exams</Text>
                 <Text style={styles.statValue}>{item.exams}</Text>
               </View>
             </View>

             <View style={styles.gradeBox}>
               <Text style={styles.gradeLabel}>Overall Grade</Text>
               <Text style={styles.gradeValue}>{item.grade}</Text>
             </View>
          </Animated.View>
        ))}

        {/* Recent Reports Area */}
        <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.reportsWrapper}>
          <Text style={styles.reportsHeader}>Recent Reports</Text>
          
          {REPORTS.map((r, idx) => (
            <ScaleButton key={`rep-${r.id}`} activeOpacity={0.9} scaleTo={0.97} style={styles.reportItem}>
               <View style={styles.pdfIconWrap}>
                 <Ionicons name="document" size={20} color="#FFFFFF" />
                 <Text style={styles.pdfIconText}>PDF</Text>
               </View>
               <View style={styles.reportContent}>
                 <Text style={styles.reportTitle}>{r.title}</Text>
                 <Text style={styles.reportDesc} numberOfLines={2}>{r.desc}</Text>
                 <Text style={styles.reportDate}>Issued: {r.date}</Text>
               </View>
            </ScaleButton>
          ))}
        </Animated.View>

      </ScrollView>

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
    color: '#4F46E5', // Maintains system parity
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

  /* Subject Card */
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 4,
    borderTopColor: '#3B82F6',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 40, // Keeps the 3 columns compact
  },
  statCol: {
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  gradeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 14,
    gap: 20,
  },
  gradeLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  gradeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },

  /* Recent Reports Block */
  reportsWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  reportsHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  pdfIconWrap: {
    position: 'relative',
    backgroundColor: '#3B82F6',
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  pdfIconText: {
    position: 'absolute',
    bottom: 5,
    fontSize: 6,
    fontWeight: '900',
    color: '#3B82F6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden'
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  reportDesc: {
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 13,
  },
  reportDate: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 6,
  }
});

export default GradesScreen;
