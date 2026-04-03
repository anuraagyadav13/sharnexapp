import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../types/navigation';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';

type PrincipalReviewExamNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalReviewExam'
>;
type PrincipalReviewExamRouteProp = RouteProp<RootStackParamList, 'PrincipalReviewExam'>;

interface Props {
  navigation: PrincipalReviewExamNavigationProp;
  route: PrincipalReviewExamRouteProp;
}

const PrincipalReviewExamScreen: React.FC<Props> = ({ navigation, route }) => {
  const { examId } = route.params;
  const [isDrawerOpen, setDrawerOpen] = React.useState(false);

  // Mock exam data - in real app, fetch by examId
  const exam = {
    id: examId,
    name: 'Unit Test',
    type: 'UNIT_TEST',
    year: '2026',
    scope: '1 Classes',
    status: 'ACTIVE' as const,
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.topHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={26} color="#111827" />
        </ScaleButton>

        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          Review: {exam.name}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtnTransparent}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(300)} style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Exam Review</Text>
          <Text style={styles.pageSubtitle}>
            Review marks and performance for {exam.name}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(350).delay(80)} style={styles.examCard}>
          <View style={styles.examHeader}>
            <View style={styles.examIconBox}>
              <Ionicons name="document-text" size={18} color="#A855F7" />
            </View>
            <View style={styles.examDetails}>
              <Text style={styles.examName}>{exam.name}</Text>
              <Text style={styles.examType}>{exam.type} • {exam.year}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.statusText, { color: '#15803D' }]}>{exam.status}</Text>
            </View>
          </View>

          <View style={styles.examMeta}>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Scope</Text>
              <Text style={styles.metaValue}>{exam.scope}</Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Total Students</Text>
              <Text style={styles.metaValue}>25</Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>Submitted</Text>
              <Text style={styles.metaValue}>23</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(120)} style={styles.studentsList}>
          <Text style={styles.sectionTitle}>Student Marks</Text>

          {/* Mock student entries */}
          {[
            { name: 'Alice Johnson', rollNo: '001', marks: '85/100', status: 'Approved' },
            { name: 'Bob Smith', rollNo: '002', marks: '92/100', status: 'Approved' },
            { name: 'Charlie Brown', rollNo: '003', marks: '78/100', status: 'Pending' },
          ].map((student, index) => (
            <View key={index} style={styles.studentRow}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentRoll}>Roll: {student.rollNo}</Text>
              </View>
              <Text style={styles.studentMarks}>{student.marks}</Text>
              <View style={[styles.statusPill, {
                backgroundColor: student.status === 'Approved' ? '#DCFCE7' : '#E0E7FF'
              }]}>
                <Text style={[styles.statusText, {
                  color: student.status === 'Approved' ? '#15803D' : '#4338CA'
                }]}>{student.status}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(450).delay(180)} style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Approve All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="close-circle" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Reject All</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="principal"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 8,
  },
  menuHandle: { paddingRight: 4, paddingVertical: 8 },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },

  pageTitleContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  pageSubtitle: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 16,
  },
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  examIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  examDetails: { flex: 1 },
  examName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  examType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  examMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaBlock: { flex: 1 },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  studentsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  studentInfo: { flex: 1 },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  studentRoll: {
    fontSize: 12,
    color: '#64748B',
  },
  studentMarks: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },

  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
});

export default PrincipalReviewExamScreen;