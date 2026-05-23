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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

// Navigation type
export type OfficialResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OfficialResult'>;
export type OfficialResultScreenRouteProp = RouteProp<RootStackParamList, 'OfficialResult'>;

interface Props {
  navigation: OfficialResultScreenNavigationProp;
  route: OfficialResultScreenRouteProp;
}

const OfficialResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch result data on mount
  useEffect(() => {
    fetchResultData();
  }, []);

  const fetchResultData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const resultId = route?.params?.resultId as string;
      if (!resultId) {
        throw new Error('Result ID is required');
      }

      const response = await apiClient.get(ENDPOINTS.STUDENT.OFFICIAL_RESULT(resultId));
      const data = response.data.data || response.data;

      setResultData(data);
    } catch (err: any) {
      console.error('Error fetching result:', err);
      setError(err.message || 'Failed to load result');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
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
          onPress={fetchResultData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </ScaleButton>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />
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
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Official Result</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
      </ScrollView>
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="student" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAF9F9' },
  globalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 8, zIndex: 10 },
  menuHandle: { paddingRight: 4, paddingVertical: 10 },
  headerTitle: { fontSize: 18, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#9F7AEA', justifyContent: 'center', alignItems: 'center', marginLeft: 4, shadowColor: '#1E293B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 6 },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  scrollContent: { paddingBottom: 40 },
  resultCard: { backgroundColor: '#fff', borderRadius: 16, margin: 16, padding: 20, shadowColor: '#1E293B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 6 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  profileCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  profileInitials: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
  profileInfo: { flex: 1 },
  profileName: { fontWeight: 'bold', fontSize: 18, color: '#1F2937' },
  profileMeta: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  examBadge: { backgroundColor: '#E0E7FF', color: '#4F46E5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, fontSize: 12, overflow: 'hidden', marginLeft: 6 },
  scoreBox: { alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10, minWidth: 70 },
  scorePercent: { fontWeight: 'bold', fontSize: 22, color: '#10B981' },
  scoreGrade: { color: '#6366F1', fontWeight: 'bold', fontSize: 13 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, margin: 16, marginTop: 0, padding: 20, shadowColor: '#1E293B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 6 },
  sectionTitle: { fontWeight: 'bold', fontSize: 15, color: '#4F46E5', marginBottom: 10 },
  subjectRowHeader: { flexDirection: 'row', marginBottom: 6 },
  subjectColSubject: { flex: 2, fontWeight: 'bold', color: '#6B7280', fontSize: 13 },
  subjectColMarks: { flex: 1, fontWeight: 'bold', color: '#6B7280', fontSize: 13, textAlign: 'center' },
  subjectColMax: { flex: 1, fontWeight: 'bold', color: '#6B7280', fontSize: 13, textAlign: 'center' },
  subjectColGrade: { flex: 1, fontWeight: 'bold', color: '#6B7280', fontSize: 13, textAlign: 'center' },
  subjectColProgress: { flex: 1, fontWeight: 'bold', color: '#6B7280', fontSize: 13, textAlign: 'center' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  subjectColSubjectLink: { flex: 2, color: '#4F46E5', fontWeight: 'bold', textDecorationLine: 'underline' },
  subjectColProgressBar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, marginHorizontal: 6, overflow: 'hidden' },
  progressBar: { height: 8, backgroundColor: '#10B981', borderRadius: 4 },
  subjectColProgressText: { width: 36, textAlign: 'right', color: '#10B981', fontWeight: 'bold', fontSize: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 16, marginTop: 0 },
  statusBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flex: 1, marginHorizontal: 4, alignItems: 'center', shadowColor: '#1E293B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 6 },
  statusLabel: { color: '#6B7280', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  statusValue: { color: '#10B981', fontWeight: 'bold', fontSize: 15 },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F9',
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
    backgroundColor: '#4F46E5',
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
