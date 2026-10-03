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
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { Theme, withAlpha, LIGHT_COLORS } from '../../constants/theme';
import { TeacherHeader } from '../../components/TeacherHeader';
import apiClient from '../../services/apiClient';
import teacherService from '../../services/teacherService';
import { ENDPOINTS } from '../../constants/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherViewQuizResult'>;

const TeacherViewQuizResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { quizId } = route.params;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const res = await teacherService.getQuizResults(quizId);
        setData(res.data);
      } catch (error) {
        console.error('Failed to fetch quiz results:', error);
        Alert.alert('Error', 'Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [quizId]);

  const rawResults = 
    data?.data?.attempts || 
    data?.results || 
    (Array.isArray(data?.data) ? data.data : null) || 
    (Array.isArray(data) ? data : []);

  const results = Array.isArray(rawResults) ? rawResults : [];

  const metrics = data?.data?.metrics || data?.metrics;
  const analytics = data?.analytics || {
    avg: metrics?.averageScore ?? (results.length > 0 ? Number((results.reduce((sum: number, r: any) => sum + Number(r.score || 0), 0) / results.length).toFixed(1)) : 0),
    highest: metrics?.highestScore ?? (results.length > 0 ? Math.max(...results.map((r: any) => Number(r.score || 0))) : 0),
    lowest: metrics?.lowestScore ?? (results.length > 0 ? Math.min(...results.map((r: any) => Number(r.score || 0))) : 0),
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />

      {/* Global Header */}
      <TeacherHeader
        title="Quiz Results"
        navigation={navigation}
        isStackScreen={true}
      />

      {/* Blue Header Section */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.blueHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={theme.onPrimary} />
        </TouchableOpacity>
        <Text style={styles.blueTitle}>{data?.quiz?.title || 'Exam Result Analysis'}</Text>
        <Text style={styles.blueSubtitle}>{data?.quiz?.subject || 'Analyze student performance'}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Stats Cards Row */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.statsRow}>

          {/* Participants Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: theme.primary }]}>
              <Ionicons name="person" size={20} color={theme.onPrimary} />
            </View>
            <View style={styles.statTextCol}>
              <Text style={styles.statLabel}>Participants</Text>
              <Text style={styles.statValue}>{results.length}</Text>
            </View>
          </View>

          {/* Avg Score Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: theme.success }]}>
              <Ionicons name="analytics" size={20} color={theme.onPrimary} />
            </View>
            <View style={styles.statTextCol}>
              <Text style={styles.statLabel}>Avg. Score</Text>
              <Text style={styles.statValue}>{analytics.avg}%</Text>
            </View>
          </View>

          {/* Highest Score Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: theme.warning }]}>
              <Ionicons name="trophy" size={20} color={theme.onPrimary} />
            </View>
            <View style={styles.statTextCol}>
              <Text style={styles.statLabel}>Highest</Text>
              <Text style={styles.statValue}>{analytics.highest}%</Text>
            </View>
          </View>

        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.contentWrapper}>
          <Text style={styles.sectionTitle}>Students Performance</Text>

          {/* Table Container */}
          <View style={styles.tableContainer}>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, { flex: 2 }]}>Student</Text>
              <Text style={[styles.thText, { flex: 1.2, textAlign: 'center' }]}>Score</Text>
              <Text style={[styles.thText, { flex: 1.8, textAlign: 'center' }]}>Time Taken</Text>
              <Text style={[styles.thText, { flex: 2, textAlign: 'right' }]}>Status</Text>
            </View>

            {/* Table Rows */}
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ padding: 40 }} />
            ) : results.length === 0 ? (
              <Text style={{ textAlign: 'center', padding: 40, color: theme.subtext }}>No submissions yet</Text>
            ) : (
              results.map((student: any, index: number) => (
                <View key={student.studentId} style={[styles.tableRow, index === results.length - 1 && styles.lastTableRow]}>
                  <Text style={[styles.tdTextStudent, { flex: 2 }]} numberOfLines={1}>{student.studentName}</Text>
                  <Text style={[styles.tdTextBase, { flex: 1.2, textAlign: 'center' }]}>{student.score}%</Text>
                  <Text style={[styles.tdTextBase, { flex: 1.8, textAlign: 'center' }]}>{student.timeTaken}</Text>
                  <View style={[styles.tdStatusWrapper, { flex: 2, alignItems: 'flex-end' }]}>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>Completed</Text>
                    </View>
                  </View>
                </View>
              ))
            )}

          </View>
        </Animated.View>

      </ScrollView>

    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: theme.surface,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10, width: 28 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
    marginTop: 4,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.border,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  avatarText: { color: theme.onPrimary, fontWeight: 'bold', fontSize: 16 },

  blueHeader: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: withAlpha(theme.onPrimary, 0.25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  blueTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.onPrimary,
    marginBottom: 6,
  },
  blueSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: withAlpha(theme.onPrimary, 0.8),
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: theme.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statTextCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    color: theme.subtext,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '800',
  },

  contentWrapper: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 20,
  },

  tableContainer: {
    backgroundColor: theme.surface,
    borderRadius: 6,
    shadowColor: theme.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: withAlpha(theme.border, 0.5),
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  thText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.subtext,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  lastTableRow: {
    borderBottomWidth: 0,
  },
  tdTextStudent: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.text,
  },
  tdTextBase: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.text,
  },
  tdStatusWrapper: {
    justifyContent: 'center',
  },
  statusPill: {
    backgroundColor: withAlpha(theme.success, 0.15),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    color: theme.success,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default TeacherViewQuizResultScreen;
