import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherQuiz'>;

const MOCK_QUIZZES = [
  {
    id: 1,
    subject: 'Mathematics',
    status: 'Completed',
    title: 'Mid-Term Examination',
    date: 'Oct 25, 2023',
    duration: '90 Minutes',
    class: 'Class 10-A',
    questions: 30,
    maxMarks: 60,
    participants: '30/30',
    avgScore: '87.3%',
  },
  {
    id: 2,
    subject: 'Mathematics',
    status: 'Ongoing',
    title: 'Mid-Term Examination',
    date: 'Oct 25, 2023',
    duration: '90 Minutes',
    class: 'Class 10-A',
    questions: 30,
    maxMarks: 60,
    participants: '30/30',
    avgScore: '87.3%',
  },
  {
    id: 3,
    subject: 'Mathematics',
    status: 'Upcoming',
    title: 'Mid-Term Examination',
    date: 'Oct 25, 2023',
    duration: '90 Minutes',
    class: 'Class 10-A',
    questions: 30,
    maxMarks: 60,
    participants: '30/30',
    avgScore: '87.3%',
  },
];

const TeacherQuizScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoading(true);
        const teacherId = authState.user?.id;
        if (!teacherId) return;

        const res = await apiClient.get(ENDPOINTS.TEACHER.TEACHER_QUIZZES(teacherId));
        setQuizzes(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch quizzes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuizzes();
  }, [authState.user?.id]);

  const renderStatusPill = (status: string) => {
    let bgColor = '#EEF2FF';
    let textColor = '#4F46E5';

    if (status === 'Ongoing' || status === 'active') {
      bgColor = '#ECFDF5';
      textColor = '#10B981';
      status = 'Ongoing';
    } else if (status === 'Upcoming' || status === 'draft') {
      bgColor = '#FFFbeb';
      textColor = '#F59E0B';
      status = status === 'draft' ? 'Draft' : 'Upcoming';
    }

    return (
      <View style={[styles.statusPill, { backgroundColor: bgColor }]}>
        <Text style={[styles.statusPillText, { color: textColor }]}>{status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Page Title Wrapper */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
          <Text style={styles.pageTitle}>Quiz Management</Text>
          <Text style={styles.pageSubtitle}>Create, schedule, and manage all exams and quizzes</Text>
        </Animated.View>

        {/* Section Header */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>All Exams</Text>
          <TouchableOpacity style={styles.newQuizBtn} activeOpacity={0.8} onPress={() => navigation.navigate('TeacherCreateQuiz')}>
            <Text style={styles.newQuizText}>+ New Quiz</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quiz List */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
          ) : quizzes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No quizzes found</Text>
              <Text style={styles.emptySubtext}>Click + button above to create your first quiz</Text>
            </View>
          ) : (
            quizzes.map((quiz, index) => {
              const status = quiz.derivedStatus || quiz.status;
              const questionCount = quiz.questions?.length || 0;
              const duration = quiz.timeLimit || 0;
              const startTime = quiz.startAt ? new Date(quiz.startAt).toLocaleDateString() : 'TBD';

              return (
              <Animated.View key={quiz.id || index} entering={FadeInUp.delay(150 + index * 100).springify()} style={styles.quizCard}>

                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectText}>{quiz.subject || 'Subject'}</Text>
                  </View>
                  {renderStatusPill(status)}
                </View>

                {/* Title */}
                <Text style={styles.quizTitle}>{quiz.title}</Text>
                <Text style={styles.quizMeta}>
                  {quiz.className || `Class: ${quiz.classId}`} • {questionCount} Questions • {duration} Min
                </Text>

                {/* Meta Information */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.metaText}>{startTime}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.metaText}>{duration} Min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.metaText}>{quiz.className || 'All Students'}</Text>
                  </View>
                </View>

                {/* Grid Info */}
                <View style={styles.gridContainer}>
                  {/* Questions */}
                  <View style={styles.gridItem}>
                    <View style={styles.gridIconCircle}>
                      <Ionicons name="help-circle" size={16} color="#4F46E5" />
                    </View>
                    <View>
                      <Text style={styles.gridLabel}>Questions</Text>
                      <Text style={styles.gridValue}>{questionCount}</Text>
                    </View>
                  </View>

                  {/* Max Marks */}
                  <View style={styles.gridItem}>
                    <View style={styles.gridIconCircle}>
                      <Ionicons name="star" size={14} color="#4F46E5" />
                    </View>
                    <View>
                      <Text style={styles.gridLabel}>Max Marks</Text>
                      <Text style={styles.gridValue}>{questionCount}</Text>
                    </View>
                  </View>

                  {/* Status Indicator */}
                  <View style={styles.gridItem}>
                    <View style={styles.gridIconCircle}>
                      <Ionicons name="flag-outline" size={16} color="#4F46E5" />
                    </View>
                    <View>
                      <Text style={styles.gridLabel}>Status</Text>
                      <Text style={styles.gridValue}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                    </View>
                  </View>

                  {/* Created Date */}
                  <View style={styles.gridItem}>
                    <View style={styles.gridIconCircle}>
                      <Ionicons name="calendar" size={14} color="#4F46E5" />
                    </View>
                    <View>
                      <Text style={styles.gridLabel}>Created</Text>
                      <Text style={styles.gridValue}>{quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'N/A'}</Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  {(quiz.status === 'Completed' || quiz.status === 'expired') && (
                    <React.Fragment>
                      <TouchableOpacity style={styles.actionBtnPrimary} activeOpacity={0.8} onPress={() => navigation.navigate('TeacherViewQuizResult', { quizId: quiz.id.toString() })}>
                        <Ionicons name="bar-chart" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnPrimaryText}>View Results</Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  )}
                  {(quiz.status === 'Ongoing' || quiz.status === 'active') && (
                    <React.Fragment>
                      <TouchableOpacity style={styles.actionBtnPrimary} activeOpacity={0.8} onPress={() => navigation.navigate('TeacherMonitorLive', { quizId: quiz.id.toString() })}>
                        <Ionicons name="desktop-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnPrimaryText}>Monitor Live</Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  )}
                  {(quiz.status === 'Upcoming' || quiz.status === 'draft') && (
                    <React.Fragment>
                      <TouchableOpacity style={styles.actionBtnPrimary} activeOpacity={0.8}>
                        <Ionicons name="create-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnPrimaryText}>Edit Quiz</Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  )}
                </View>

              </Animated.View>
            );
          })
        )}
        </View>

      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="teacher"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
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

  pageTitleWrapper: { marginBottom: 20, paddingHorizontal: 16, marginTop: 24 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#4F46E5', marginBottom: 6 },
  pageSubtitle: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  newQuizBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  newQuizText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  listContainer: {
    paddingHorizontal: 16,
  },
  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 20,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '46%',
  },
  gridIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  gridLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,

    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionBtnSecondaryText: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  subjectBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quizMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
});

export default TeacherQuizScreen;
