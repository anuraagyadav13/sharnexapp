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

      const resultId = route?.params?.resultId as string;
      if (!resultId) {
        throw new Error('Result ID is required');
      }

      const response = await studentService.getOfficialResult(resultId);
      const data = response.data.data || response.data;

      setResultData(data);
    } catch (err: any) {
      console.error('Error fetching result:', err);
      setError(err.message || 'Failed to load result');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleShareMarksheet = async () => {
    if (!resultData) return;
    try {
      const subjects = resultData.subjects || [];
      const lines = [
        '📋 OFFICIAL ACADEMIC MARKSHEET',
        '═══════════════════════════════',
        `Student   : ${resultData.studentName || authState.user?.name || 'Student'}`,
        resultData.rollNumber ? `Roll No   : ${resultData.rollNumber}` : '',
        resultData.className ? `Class     : ${resultData.className}` : '',
        resultData.term ? `Term      : ${resultData.term}` : '',
        resultData.examType ? `Exam Type : ${resultData.examType}` : '',
        `Overall   : ${resultData.totalPercentage || 0}% (Grade ${resultData.overallGrade || 'N/A'})`,
        `Status    : ${resultData.status || 'N/A'}`,
        '',
        '📊 Subject-wise Performance',
        '-------------------------------',
        ...subjects.map((s: any) =>
          `${(s.name || s.subjectName || 'Subject').padEnd(18)}: ${(s.marks || s.obtainedMarks || 0).toFixed(1)}/${(s.maxMarks || s.totalMarks || 100).toFixed(1)} (${Math.round(((s.marks || s.obtainedMarks || 0) / (s.maxMarks || s.totalMarks || 100)) * 100)}%) Grade: ${s.grade || '-'}`
        ),
        '-------------------------------',
        `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      ].filter(Boolean);

      await Share.share({
        message: lines.join('\n'),
        title: `${resultData.examType || 'Official'} Marksheet`,
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

  if (error) {
    return (
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
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />
      {/* Global Header */}
      <StudentHeader 
        title="Official Result"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
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
            <View style={styles.profileCircle}><Text style={styles.profileInitials}>
              {resultData?.studentName?.charAt(0) || 'S'}
            </Text></View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{resultData?.studentName || 'Student'}</Text>
              <Text style={styles.profileMeta}>
                ROLL: {resultData?.rollNumber || 'N/A'}   TERM: {resultData?.term || 'N/A'}   CLASS: {resultData?.className || 'N/A'}   <Text style={styles.examBadge}>{resultData?.examType || 'EXAM'}</Text>
              </Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scorePercent}>{resultData?.totalPercentage || 0}%</Text>
              <Text style={styles.scoreGrade}>GRADE {resultData?.overallGrade || 'N/A'}</Text>
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
          {(resultData?.subjects || []).map((subject: any, idx: number) => (
            <View style={styles.subjectRow} key={subject.id || idx}>
              <Text style={styles.subjectColSubjectLink}>{subject.name || subject.subjectName}</Text>
              <Text style={styles.subjectColMarks}>{(subject.marks || subject.obtainedMarks || 0).toFixed(2)}</Text>
              <Text style={styles.subjectColMax}>{(subject.maxMarks || subject.totalMarks || 100).toFixed(2)}</Text>
              <Text style={styles.subjectColGrade}>{subject.grade || 'N/A'}</Text>
              <View style={styles.subjectColProgressBar}>
                <View style={[styles.progressBar, {
                  width: `${Math.min(100, ((subject.marks || subject.obtainedMarks || 0) / (subject.maxMarks || subject.totalMarks || 100)) * 100)}%`
                }]} />
              </View>
              <Text style={styles.subjectColProgressText}>
                {Math.round(((subject.marks || subject.obtainedMarks || 0) / (subject.maxMarks || subject.totalMarks || 100)) * 100)}%
              </Text>
            </View>
          ))}
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.statusRow}>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <Text style={styles.statusValue}>{resultData?.status || 'PENDING'}</Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>TOTAL SUBJECTS</Text>
            <Text style={styles.statusValue}>{(resultData?.subjects || []).length} Subjects Evaluated</Text>
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
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="student" />
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
});

export default OfficialResultScreen;
