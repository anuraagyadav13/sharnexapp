import React, { useState, useEffect, useRef } from 'react';
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
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { TeacherHeader } from '../../components/TeacherHeader';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherMonitorLive'>;

const TeacherMonitorLiveScreen: React.FC<Props> = ({ navigation, route }) => {
  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles({ ...theme, isDarkMode });
  const { quizId } = route.params;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLiveStatus = async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.TEACHER.QUIZ_LIVE(quizId));
      setData(res.data);
    } catch (error) {
      console.error('Failed to monitor live quiz:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus(true);
    
    // Set up polling every 10 seconds
    intervalRef.current = setInterval(() => {
      fetchLiveStatus();
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [quizId]);

  const students = data?.students || [];

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
      <TeacherHeader
        title="Monitor Live"
        navigation={navigation}
        isStackScreen={true}
      />

      {/* Blue Header Section */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.blueHeader}>
         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
         </TouchableOpacity>
         <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.blueTitle}>Live Exam Monitoring</Text>
              <Text style={styles.blueSubtitle}>
                {data?.submitted || 0}/{data?.totalStudents || 0} Submitted • {data?.inProgress || 0} Active
              </Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
         </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         
         <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.contentWrapper}>
            <Text style={styles.sectionTitle}>Room Activity ({data?.totalStudents || 0})</Text>

            {/* List */}
            {isLoading && !data ? (
               <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
            ) : students.length === 0 ? (
               <Text style={styles.emptyText}>No students in this class.</Text>
            ) : (
               students.map((participant: any, index: number) => (
                  <View key={index} style={styles.participantCard}>
                     
                     {/* Header */}
                     <View style={styles.cardHeader}>
                        <View style={styles.participantAvatar}>
                           <Text style={styles.participantAvatarText}>
                             {participant.name?.charAt(0) || 'S'}
                           </Text>
                        </View>
                        <View style={styles.nameInfo}>
                           <Text style={styles.name}>{participant.name}</Text>
                           <Text style={styles.rollNo}>Progress: {participant.progress}</Text>
                        </View>
                        <View style={[
                          styles.progressPill, 
                          participant.status === 'Submitted' && { backgroundColor: '#D1FAE5' },
                          participant.status === 'In Progress' && { backgroundColor: '#DBEAFE' },
                          participant.status === 'Not Started' && { backgroundColor: '#F3F4F6' },
                        ]}>
                           <Text style={[
                             styles.progressPillText,
                             participant.status === 'Submitted' && { color: '#10B981' },
                             participant.status === 'In Progress' && { color: '#3B82F6' },
                             participant.status === 'Not Started' && { color: '#9CA3AF' },
                           ]}>
                             {participant.status}
                           </Text>
                        </View>
                     </View>

                     {/* Stats Grid */}
                     <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                           <Text style={styles.statLabel}>Current Progress</Text>
                           <Text style={styles.statValue}>{participant.progress}</Text>
                        </View>
                        <View style={styles.statBox}>
                           <Text style={styles.statLabel}>Time Remaining</Text>
                           <Text style={styles.statValue}>{participant.timeRemaining}</Text>
                        </View>
                     </View>

                  </View>
               ))
            )}

         </Animated.View>

      </ScrollView>

    </View>
  );
};


const getStyles = (theme: any) => StyleSheet.create({
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10, width: 28 },
  headerTitle: { fontSize: 16,
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    color: '#EF4444',
    fontSize: 10,
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

  participantCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  nameInfo: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 2,
  },
  rollNo: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '600',
  },
  progressPill: {
    backgroundColor: theme.isDarkMode ? '#065F4630' : '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressPillText: {
    color: theme.isDarkMode ? '#34D399' : '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    backgroundColor: theme.isDarkMode ? '#334155' : '#F3F4F6',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    width: '48%', 
  },
  statLabel: {
    fontSize: 11,
    color: theme.subtext,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '800',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: theme.subtext,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TeacherMonitorLiveScreen;
