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
  Image,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import { useAuth } from '../../store/AuthContext';
import studentService from '../../services/studentService';

// Navigation type
export type OfficialResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OfficialResult'>;
export type OfficialResultScreenRouteProp = RouteProp<RootStackParamList, 'OfficialResult'>;

interface Props {
  navigation: OfficialResultScreenNavigationProp;
  route: OfficialResultScreenRouteProp;
}

const OfficialResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isNotPublished, setIsNotPublished] = useState(false);

  // Fetch result data on mount
  useEffect(() => {
    fetchResultData();
  }, []);

  const fetchResultData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      setIsNotPublished(false);

      const examId = (route?.params?.examId || (route?.params as any)?.resultId) as string;
      if (!examId) {
        throw new Error('Exam ID is required');
      }

      const response = await studentService.getOfficialResult(examId);
      const data = response.data?.data || response.data;

      if (!data) {
        setIsNotPublished(true);
      } else {
        setResultData(data);
      }
    } catch (err: any) {
      console.error('Error fetching result:', err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message || '';
      if (status === 404 || message.toLowerCase().includes('not found')) {
        setIsNotPublished(true);
      } else {
        setError(message || 'Failed to load result');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const studentName = resultData?.student_name || resultData?.studentName || authState.user?.name || 'Student';
  const rollNo = resultData?.roll_no || resultData?.rollNumber || 'N/A';
  const className = resultData?.class_name 
    ? `${resultData.class_name}${resultData.section ? ` (${resultData.section})` : ''}`
    : (resultData?.className || 'N/A');
  const examName = resultData?.exam_name || resultData?.examName || 'Examination';
  const examType = resultData?.exam_type || resultData?.examType || 'EXAM';
  const academicYear = resultData?.academic_year || resultData?.term || 'N/A';
  const percentage = resultData?.percentage != null ? Math.round(Number(resultData.percentage)) : 0;
  const grade = resultData?.grade || resultData?.overallGrade || 'N/A';
  const outcome = resultData?.outcome || resultData?.status || 'PASS';
  const subjectsList: any[] = resultData?.subjects || [];

  const handleShareMarksheet = async () => {
    if (!resultData) return;
    try {
      const lines = [
        '📋 OFFICIAL ACADEMIC MARKSHEET',
        '═══════════════════════════════',
        resultData.institution_name ? `Institution : ${resultData.institution_name}` : '',
        `Student     : ${studentName}`,
        rollNo !== 'N/A' ? `Roll No     : ${rollNo}` : '',
        className !== 'N/A' ? `Class       : ${className}` : '',
        `Academic Yr : ${academicYear}`,
        `Exam        : ${examName} (${examType})`,
        `Overall     : ${percentage}% (Grade: ${grade})`,
        `Outcome     : ${outcome}`,
        '',
        '📊 Subject-wise Performance',
        '-------------------------------',
        ...subjectsList.map((s: any) => {
          const sName = s.subject_name || s.name || s.subjectName || 'Subject';
          const obtained = Number(s.marks_obtained ?? s.marks ?? s.obtainedMarks ?? 0);
          const max = Number(s.max_marks ?? s.maxMarks ?? s.totalMarks ?? 100);
          const sGrade = s.grade || '-';
          const sPct = s.percentage != null ? Math.round(Number(s.percentage)) : Math.round((obtained / max) * 100);
          return `${sName.padEnd(18)}: ${obtained.toFixed(1)}/${max.toFixed(1)} (${sPct}%) Grade: ${sGrade}${s.is_absent ? ' [ABSENT]' : s.is_failed ? ' [FAILED]' : ''}`;
        }),
        '-------------------------------',
        `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      ].filter(Boolean);

      await Share.share({
        message: lines.join('\n'),
        title: `${examName} Marksheet`,
      });
    } catch (err: any) {
      if (err?.message !== 'Share was not shared') {
        Alert.alert('Error', err?.message || 'Failed to share marksheet.');
      }
    }
  };

  const onRefresh = () => fetchResultData(true);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading official result...</Text>
      </View>
    );
  }

  if (isNotPublished) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />
        <StudentHeader 
          title="Official Result"
          navigation={navigation}
          isStackScreen={true}
        />
        <View style={styles.emptyNoticeContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="document-text-outline" size={56} color={theme.primary} />
          </View>
          <Text style={[styles.emptyNoticeTitle, { color: theme.text }]}>Marksheet Not Published Yet</Text>
          <Text style={[styles.emptyNoticeDesc, { color: theme.subtext }]}>
            The official marksheet for this examination has not been published yet by your school administration. Please check back later.
          </Text>
          <ScaleButton
            style={styles.backActionButton}
            activeOpacity={0.8}
            scaleTo={0.95}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.backActionButtonText}>Back to Results</Text>
          </ScaleButton>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />
        <StudentHeader 
          title="Official Result"
          navigation={navigation}
          isStackScreen={true}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <ScaleButton
            style={styles.retryButton}
            activeOpacity={0.8}
            scaleTo={0.95}
            onPress={() => fetchResultData()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </ScaleButton>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />
      {/* Global Header */}
      <StudentHeader 
        title="Official Result"
        navigation={navigation}
        isStackScreen={true}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.resultCard}>
          <View style={styles.profileRow}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitials}>
                {studentName.charAt(0)}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{studentName}</Text>
              <Text style={styles.profileMeta}>
                ROLL: {rollNo}   CLASS: {className}   <Text style={styles.examBadge}>{examType}</Text>
              </Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scorePercent}>{percentage}%</Text>
              <Text style={styles.scoreGrade}>GRADE {grade}</Text>
            </View>
          </View>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SUBJECT-WISE PERFORMANCE SHEET</Text>
          <View style={styles.subjectRowHeader}>
            <Text style={styles.subjectColSubject}>SUBJECT</Text>
            <Text style={styles.subjectColMarks}>MARKS</Text>
            <Text style={styles.subjectColMax}>MAX</Text>
            <Text style={styles.subjectColGrade}>GRADE</Text>
            <Text style={styles.subjectColProgress}>PROGRESS</Text>
          </View>
          {subjectsList.map((subject: any, idx: number) => {
            const sName = subject.subject_name || subject.name || subject.subjectName || 'Subject';
            const obtained = Number(subject.marks_obtained ?? subject.marks ?? subject.obtainedMarks ?? 0);
            const max = Number(subject.max_marks ?? subject.maxMarks ?? subject.totalMarks ?? 100);
            const sGrade = subject.grade || 'N/A';
            const sPct = subject.percentage != null ? Math.round(Number(subject.percentage)) : (max > 0 ? Math.round((obtained / max) * 100) : 0);

            return (
              <View style={styles.subjectRow} key={subject.subject_id || subject.id || idx}>
                <Text style={styles.subjectColSubjectLink}>{sName}</Text>
                <Text style={styles.subjectColMarks}>{obtained.toFixed(2)}</Text>
                <Text style={styles.subjectColMax}>{max.toFixed(2)}</Text>
                <Text style={styles.subjectColGrade}>{sGrade}</Text>
                <View style={styles.subjectColProgressBar}>
                  <View style={[styles.progressBar, {
                    width: `${Math.min(100, sPct)}%`,
                    backgroundColor: subject.is_failed ? '#EF4444' : theme.primary
                  }]} />
                </View>
                <Text style={[styles.subjectColProgressText, subject.is_failed && { color: '#EF4444' }]}>
                  {sPct}%
                </Text>
              </View>
            );
          })}
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.statusRow}>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <Text style={[styles.statusValue, outcome === 'PASS' ? { color: '#10B981' } : { color: '#EF4444' }]}>
              {outcome}
            </Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>TOTAL SUBJECTS</Text>
            <Text style={styles.statusValue}>{subjectsList.length} Evaluated</Text>
          </View>
        </Animated.View>

        {/* Marksheet Export Button */}
        <Animated.View entering={FadeInUp.delay(400).springify()} style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 20 }}>
          <ScaleButton
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.primary,
              paddingVertical: 14,
              borderRadius: 12,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 4,
            }}
            onPress={handleShareMarksheet}
          >
            <Ionicons name="share-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Share / Download Official Marksheet</Text>
          </ScaleButton>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  globalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, backgroundColor: theme.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 8, zIndex: 10 },
  menuHandle: { paddingRight: 4, paddingVertical: 10 },
  headerTitle: { fontSize: 18, fontWeight: '500', color: theme.primary, flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 4, elevation: 6 },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  scrollContent: { paddingBottom: 40 },
  resultCard: { backgroundColor: theme.surface, borderRadius: 16, margin: 16, padding: 20, borderWidth: 1, borderColor: theme.border },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  profileCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  profileInitials: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 22 },
  profileInfo: { flex: 1 },
  profileName: { fontWeight: 'bold', fontSize: 18, color: theme.text },
  profileMeta: { color: theme.subtext, fontSize: 13, marginTop: 2 },
  examBadge: { backgroundColor: theme.primary + '15', color: theme.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, fontSize: 12, overflow: 'hidden', marginLeft: 6 },
  scoreBox: { alignItems: 'center', backgroundColor: theme.primary + '10', borderRadius: 10, padding: 10, minWidth: 70 },
  scorePercent: { fontWeight: 'bold', fontSize: 22, color: theme.primary },
  scoreGrade: { color: theme.primary, fontWeight: 'bold', fontSize: 13 },
  sectionCard: { backgroundColor: theme.surface, borderRadius: 16, margin: 16, marginTop: 0, padding: 20, borderWidth: 1, borderColor: theme.border },
  sectionTitle: { fontWeight: 'bold', fontSize: 15, color: theme.primary, marginBottom: 10 },
  subjectRowHeader: { flexDirection: 'row', marginBottom: 6 },
  subjectColSubject: { flex: 2, fontWeight: 'bold', color: theme.subtext, fontSize: 13 },
  subjectColMarks: { flex: 1, fontWeight: 'bold', color: theme.subtext, fontSize: 13, textAlign: 'center' },
  subjectColMax: { flex: 1, fontWeight: 'bold', color: theme.subtext, fontSize: 13, textAlign: 'center' },
  subjectColGrade: { flex: 1, fontWeight: 'bold', color: theme.subtext, fontSize: 13, textAlign: 'center' },
  subjectColProgress: { flex: 1, fontWeight: 'bold', color: theme.subtext, fontSize: 13, textAlign: 'center' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  subjectColSubjectLink: { flex: 2, color: theme.primary, fontWeight: 'bold', textDecorationLine: 'underline' },
  subjectColProgressBar: { flex: 1, height: 8, backgroundColor: theme.border, borderRadius: 4, marginHorizontal: 6, overflow: 'hidden' },
  progressBar: { height: 8, backgroundColor: theme.primary, borderRadius: 4 },
  subjectColProgressText: { width: 36, textAlign: 'right', color: theme.primary, fontWeight: 'bold', fontSize: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 16, marginTop: 0 },
  statusBox: { backgroundColor: theme.surface, borderRadius: 12, padding: 16, flex: 1, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  statusLabel: { color: theme.subtext, fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  statusValue: { color: theme.primary, fontWeight: 'bold', fontSize: 15 },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.subtext,
    fontWeight: '500',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Not published / Empty Notice
  emptyNoticeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyNoticeTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyNoticeDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  backActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 3,
  },
  backActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default OfficialResultScreen;
