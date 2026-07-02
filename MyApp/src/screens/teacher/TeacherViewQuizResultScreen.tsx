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
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherViewQuizResult'>;

const TeacherViewQuizResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { authState } = useAuth();
  const { quizId } = route.params;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get(ENDPOINTS.TEACHER.QUIZ_RESULTS(quizId));
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

  const results = data?.results || [];
  const analytics = data?.analytics || { avg: 0, highest: 0, lowest: 0 };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <View style={styles.menuHandle} />
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

      {/* Blue Header Section */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.blueHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.blueTitle}>{data?.quiz?.title || 'Exam Result Analysis'}</Text>
        <Text style={styles.blueSubtitle}>{data?.quiz?.subject || 'Analyze student performance'}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Stats Cards Row */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.statsRow}>

          {/* Participants Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#4F46E5' }]}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.statTextCol}>
              <Text style={styles.statLabel}>Participants</Text>
              <Text style={styles.statValue}>{results.length}</Text>
            </View>
          </View>

          {/* Avg Score Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#10B981' }]}>
              <Ionicons name="analytics" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.statTextCol}>
              <Text style={styles.statLabel}>Avg. Score</Text>
              <Text style={styles.statValue}>{analytics.avg}%</Text>
            </View>
          </View>

          {/* Highest Score Card */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="trophy" size={20} color="#FFFFFF" />
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
              <ActivityIndicator size="large" color="#4F46E5" style={{ padding: 40 }} />
            ) : results.length === 0 ? (
              <Text style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>No submissions yet</Text>
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
  menuHandle: { paddingRight: 10, paddingVertical: 10, width: 28 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
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
    paddingTop: 12,
    paddingBottom: 24,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  blueSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#E0E7FF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '800',
  },

  contentWrapper: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 20,
  },

  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  thText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastTableRow: {
    borderBottomWidth: 0,
  },
  tdTextStudent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  tdTextBase: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  tdStatusWrapper: {
    justifyContent: 'center',
  },
  statusPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },

});

export default TeacherViewQuizResultScreen;
