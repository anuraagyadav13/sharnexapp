import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import RNFS from 'react-native-fs';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherQuiz'>;


const TeacherQuizScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuizzes = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const teacherId = authState.user?.id;
      if (!teacherId) return;

      const res = await apiClient.get(ENDPOINTS.TEACHER.TEACHER_QUIZZES(teacherId));
      setQuizzes(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  }, [authState.user?.id]);

  useEffect(() => {
    fetchQuizzes(false);
  }, [fetchQuizzes]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchQuizzes(true);
    setIsRefreshing(false);
  }, [fetchQuizzes]);

  const handleDeleteQuiz = (quizId: string) => {
    Alert.alert(
      'Delete Quiz',
      'Are you sure you want to delete this quiz? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(ENDPOINTS.TEACHER.DELETE_QUIZ(quizId));
              Alert.alert('Success', 'Quiz deleted successfully');
              fetchQuizzes();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete quiz');
            }
          }
        }
      ]
    );
  };

  const handleDuplicateQuiz = async (quizId: string) => {
    try {
      await apiClient.post(ENDPOINTS.TEACHER.DUPLICATE_QUIZ(quizId));
      Alert.alert('Success', 'Quiz duplicated successfully');
      fetchQuizzes();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to duplicate quiz');
    }
  };

  const downloadQuizExport = async (quizId: string) => {
    try {
      Alert.alert('Exporting', 'Downloading exam data...');
      const response = await apiClient.get(ENDPOINTS.TEACHER.QUIZ_ATTEMPTS_EXPORT(quizId), {
        responseType: 'text' // usually CSV mapping
      });

      const exportData = response.data?.data || response.data;
      const csvContent = typeof exportData === 'string' ? exportData : JSON.stringify(exportData);
      
      const fileName = `Exam_Export_${quizId.slice(0, 8)}.csv`;
      const path = Platform.OS === 'android' 
        ? `${RNFS.DownloadDirectoryPath}/${fileName}` 
        : `${RNFS.DocumentDirectoryPath}/${fileName}`;
        
      await RNFS.writeFile(path, csvContent, 'utf8');
      
      Alert.alert('Success', `Export saved to downloads as ${fileName}\n\nPath: ${path}`);
    } catch (error: any) {
      console.error('Export error', error);
      Alert.alert('Error', 'Failed to export exam data.');
    }
  };

  const renderStatusPill = (status: string) => {
    let bgColor = '#F3F4F6';
    let textColor = '#374151';

    if (status === 'Ongoing' || status === 'active') {
      bgColor = '#DCFCE7';
      textColor = '#15803D';
      status = 'Ongoing';
    } else if (status === 'Upcoming' || status === 'draft') {
      bgColor = '#FEF3C7';
      textColor = '#B45309';
      status = status === 'draft' ? 'Draft' : 'Upcoming';
    } else if (status === 'Completed' || status === 'expired') {
      bgColor = '#DBEAFE';
      textColor = '#1D4ED8';
      status = 'Completed';
    }

    return (
      <View style={[styles.statusPill, { backgroundColor: bgColor, borderRadius: 20 }]}>
        <Text style={[styles.statusPillText, { color: textColor, fontWeight: '700' }]}>{status}</Text>
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

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >

        {/* Page Title Wrapper */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
          <Text style={styles.pageTitle}>Quiz Management</Text>
          <Text style={styles.pageSubtitle}>Create, schedule, and manage all exams and quizzes</Text>
        </Animated.View>

        {/* Section Header */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quiz Repository</Text>
          <TouchableOpacity style={styles.newQuizBtn} activeOpacity={0.8} onPress={() => navigation.navigate('TeacherCreateQuiz')}>
            <Ionicons name="add-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.newQuizText}>Create Quiz</Text>
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
              const rawStatus = quiz.derivedStatus || quiz.status || '';
              const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
              const displayStatus = rawStatus.toLowerCase();
              const questionCount = quiz.questions?.length || 0;
              const duration = quiz.timeLimit || 0;
              const startTime = quiz.startAt ? new Date(quiz.startAt).toLocaleDateString() : 'TBD';

              return (
              <Animated.View key={quiz.id || index} entering={FadeInUp.delay(150 + index * 100).springify()} style={styles.quizCard}>

                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={[styles.subjectBadge, { borderRadius: 20 }]}>
                    <Text style={styles.subjectText}>{quiz.subject || 'Subject'}</Text>
                  </View>
                  {renderStatusPill(status)}
                </View>

                {/* Title */}
                <Text style={styles.quizTitle}>{quiz.title}</Text>
                <Text style={styles.quizMeta}>
                  {quiz.className || `Class: ${quiz.classId}`} • {questionCount} Questions • {duration} Min
                </Text>

                {/* Meta Information Row */}
                <View style={styles.metaRowHorizontal}>
                  <View style={styles.metaItemCompact}>
                    <Ionicons name="calendar-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.metaTextCompact}>{startTime}</Text>
                  </View>
                  <View style={styles.metaItemCompact}>
                    <Ionicons name="time-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.metaTextCompact}>{duration} Min</Text>
                  </View>
                  <View style={styles.metaItemCompact}>
                    <Ionicons name="people-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.metaTextCompact}>{quiz.className || quiz.classId || 'N/A'}</Text>
                  </View>
                </View>

                {/* Stats Grid (More Horizontal) */}
                <View style={styles.statsHorizontalBox}>
                  <View style={styles.statCell}>
                    <Ionicons name="help-circle" size={14} color="#64748B" />
                    <Text style={styles.statValueCell}>{questionCount} Qs</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Ionicons name="trophy" size={12} color="#D97706" />
                    <Text style={styles.statValueCell}>{questionCount} Marks</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Ionicons name="people" size={14} color="#2563EB" />
                    <Text style={styles.statValueCell}>{quiz.participantCount || 0}/{quiz.enrolledCount || 0}</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Ionicons name="bar-chart" size={12} color="#059669" />
                    <Text style={styles.statValueCell}>{quiz.avgScore !== null && quiz.avgScore !== undefined ? `${quiz.avgScore}%` : '0%'}</Text>
                  </View>
                </View>

                {/* Grading Progress (for completed/ongoing) */}
                {(displayStatus === 'completed' || displayStatus === 'ongoing' || displayStatus === 'active' || displayStatus === 'published') && (
                  <View style={styles.gradingSection}>
                    <Text style={styles.gradingTitle}>Grading Progress</Text>
                    <View style={styles.gradingBarBg}>
                      <View style={[styles.gradingBarFill, { width: `${(quiz.gradedCount || 0) / (quiz.participantCount || 1) * 100}%` }]} />
                    </View>
                    <View style={styles.gradingLabels}>
                      <Text style={styles.gradingLabelText}>{quiz.gradedCount || 0}/{quiz.participantCount || 0}</Text>
                      <Text style={styles.gradingLabelText}>{Math.round((quiz.gradedCount || 0) / (quiz.participantCount || 1) * 100)}%</Text>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={[styles.actionRow, { marginTop: 12 }]}>
                  {(displayStatus === 'completed' || displayStatus === 'expired') && (
                    <View style={[styles.actionRowImage, { flex: 1 }]}>
                      <TouchableOpacity 
                        style={[styles.btnPrimaryImage, { backgroundColor: '#4F46E5', flex: 1.5 }]} 
                        activeOpacity={0.8} 
                        onPress={() => navigation.navigate('TeacherViewQuizResult', { quizId: quiz.id.toString() })}
                      >
                        <Text style={styles.btnPrimaryText}>View Results</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.btnExportImage, { flex: 0.5 }]} 
                        activeOpacity={0.8}
                        onPress={() => downloadQuizExport(quiz.id.toString())}
                      >
                        <Text style={styles.btnExportText}>Export</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {(displayStatus === 'ongoing' || displayStatus === 'active' || displayStatus === 'published') && (
                    <TouchableOpacity 
                      style={[styles.btnPrimaryImage, { backgroundColor: '#4F46E5', flex: 1 }]} 
                      activeOpacity={0.8} 
                      onPress={() => navigation.navigate('TeacherMonitorLive', { quizId: quiz.id.toString() })}
                    >
                      <Ionicons name="desktop-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.btnPrimaryText}>Monitor Live</Text>
                    </TouchableOpacity>
                  )}
                  {(displayStatus === 'upcoming' || displayStatus === 'draft') && (
                    <View style={{ flex: 1, gap: 10 }}>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity 
                          style={[styles.btnPrimaryImage, { backgroundColor: '#4F46E5', flex: 1.5 }]} 
                          activeOpacity={0.8}
                          onPress={() => navigation.navigate('TeacherCreateQuiz', { initialQuiz: quiz })}
                        >
                          <Ionicons name="create-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.btnPrimaryText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.btnExportImage, { flex: 1 }]} 
                          activeOpacity={0.8}
                          onPress={() => handleDuplicateQuiz(quiz.id.toString())}
                        >
                          <Ionicons name="copy-outline" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
                          <Text style={styles.btnExportText}>Copy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.btnExportImage, { flex: 0.5, borderColor: '#F43F5E' }]} 
                          activeOpacity={0.8}
                          onPress={() => handleDeleteQuiz(quiz.id.toString())}
                        >
                          <Ionicons name="trash-outline" size={16} color="#F43F5E" />
                        </TouchableOpacity>
                      </View>
                    </View>
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24,
  },
  metaRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaTextCompact: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  statsHorizontalBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValueCell: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '700',
  },
   actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,

    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  actionBtnSecondaryText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
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
  gradingSection: {
    marginBottom: 20,
  },
  gradingTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  gradingBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  gradingBarFill: {
    height: '100%',
    backgroundColor: '#6366F1', // Indigo/Purple mix
    borderRadius: 3,
  },
  gradingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gradingLabelText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  actionRowImage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btnPrimaryImage: {
    flex: 4.5,
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnExportImage: {
    flex: 1.2,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnExportText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  subjectBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quizMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
});

export default TeacherQuizScreen;
