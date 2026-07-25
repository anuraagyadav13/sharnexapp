import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type AssignmentGradeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AssignmentGrade'>;

interface Props {
  navigation: AssignmentGradeNavigationProp;
  route?: any;
}

const AssignmentGradeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  const assignmentId = route?.params?.assignmentId;
  const [gradeData, setGradeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGradeData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use student assignments list to find the specific grade info
        const profileRes = await studentService.getProfile();
        const studentId = profileRes.normalized?.data?.id || profileRes.normalized?.data?.student?.id || authState.user?.id;
        
        if (!studentId) throw new Error('Student ID not found');
        
        const res = await studentService.getAssignments(studentId);
        const assignments = res.normalized?.data || res.data?.assignments || res.data?.data || [];
        
        const currentAssignment = assignments.find((a: any) => a.id === assignmentId);
        
        if (!currentAssignment) {
          throw new Error('Grade information not found');
        }
        
        setGradeData(currentAssignment);
      } catch (err: any) {
        console.error('Failed to fetch grade details:', err);
        setError('Failed to load grade details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (assignmentId) {
      fetchGradeData();
    }
  }, [assignmentId]);

  const getMarksPercentage = () => {
    if (!gradeData?.marksObtained || !gradeData?.maxPoints) return 0;
    return (gradeData.marksObtained / gradeData.maxPoints) * 100;
  };

  const getGradeLetter = () => {
    const p = getMarksPercentage();
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    return 'D';
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {/* Global Header */}
      <StudentHeader 
        title="Assignment Grade"
        navigation={navigation}
        isStackScreen={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Blue Hero Header */}
        <View style={styles.heroSection}>
          <ScaleButton 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            scaleTo={0.9}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </ScaleButton>
          
          <Text style={styles.heroTitle}>Assignment Grade</Text>
          <Text style={styles.heroSubtitle}>View your graded assignment results</Text>
        </View>

        <View style={styles.cardsContainer}>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#4361EE" style={{ marginTop: 40 }} />
          ) : error ? (
            <View style={{ padding: 20, backgroundColor: '#FEE2E2', borderRadius: 12 }}>
              <Text style={{ color: '#DC2626', textAlign: 'center' }}>{error}</Text>
            </View>
          ) : (
            <>
              {/* Header Info Section inside body */}
              <Animated.View entering={FadeInUp.delay(50).springify()} style={styles.headerInfoSection}>
                <View style={styles.badgeContainer}>
                  <View style={styles.gradedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#00C48C" />
                    <Text style={styles.gradedBadgeText}>Completed & Graded</Text>
                  </View>
                </View>
                
                 <View style={styles.submittedDateContainer}>
                  <Ionicons name="calendar-outline" size={14} color={theme.subtext} />
                  <Text style={styles.submittedDateText}>
                    Submitted on {gradeData?.submittedAt ? new Date(gradeData.submittedAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>

                <Text style={styles.assignmentMainTitle}>{gradeData?.title || 'Assignment Results'}</Text>
              </Animated.View>

              {/* Card 1: Assignment Grade */}
              <Animated.View entering={FadeInUp.delay(100).springify()} style={[styles.card, styles.gradeCard]}>
                <View style={styles.cardRibbonHeader}>
                  <Ionicons name="ribbon-outline" size={18} color="#00C48C" />
                  <Text style={styles.cardHeaderTitle}>Assignment Grade</Text>
                </View>

                <View style={styles.gradeCenterCol}>
                  <Text style={styles.gradeLetter}>{getGradeLetter()}</Text>
                  <Text style={styles.marksWrapper}>
                    <Text style={styles.marksObtained}>{gradeData?.marksObtained || 0} </Text>
                    <Text style={styles.marksTotal}>/ {gradeData?.maxPoints || 0} Marks</Text>
                  </Text>
                </View>
              </Animated.View>

              {/* Card 2: Instructor Feedback */}
              <Animated.View entering={FadeInUp.delay(200).springify()} style={[styles.card, styles.feedbackCard]}>
                <View style={styles.cardFeedbackHeader}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.primary} />
                  <Text style={styles.cardHeaderTitleFeed}>Instructor Feedback</Text>
                </View>

                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackText}>
                    {gradeData?.feedback ? `"${gradeData.feedback}"` : '"No specific feedback provided by the instructor."'}
                  </Text>
                </View>
                
                <View style={styles.divider} />

                <View style={styles.instructorProfile}>
                  <View style={styles.instructorAvatar}>
                    <Text style={styles.instructorAvatarText}>{gradeData?.teacherName?.charAt(0) || 'T'}</Text>
                  </View>
                  <View style={styles.instructorMeta}>
                    <Text style={styles.instructorName}>{gradeData?.teacherName || 'Instructor'}</Text>
                    <Text style={styles.instructorRole}>Subject Expert</Text>
                  </View>
                </View>
              </Animated.View>
            </>
          )}

        </View>
      </ScrollView>

    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 16,
    backgroundColor: theme.surface, 
  },
  globalHeaderTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.primary,
    marginRight: 'auto', 
    marginLeft: 32, 
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  scrollContent: {
    paddingBottom: 40, 
  },

  heroSection: {
    backgroundColor: theme.primary, 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  cardsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24, 
    paddingBottom: 40,
    gap: 20,
  },

  headerInfoSection: {
    marginBottom: 6, 
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  gradedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#34D399', 
    backgroundColor: theme.isDarkMode ? '#065F4630' : '#ECFDF5', 
  },
  gradedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.isDarkMode ? '#34D399' : '#00C48C',
    marginLeft: 6,
  },
  submittedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  submittedDateText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.text,
    marginLeft: 6,
  },
  assignmentMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
  },

  card: {
    backgroundColor: theme.surface,
    borderRadius: 16, 
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#1E293B', 
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08, 
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.border, 
  },
  
  gradeCard: {
    borderTopWidth: 5,
    borderTopColor: '#00C48C', 
    alignItems: 'center',
  },
  cardRibbonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    marginLeft: 8,
  },
  gradeCenterCol: {
    alignItems: 'center',
  },
  gradeLetter: {
    fontSize: 64,
    fontWeight: '800',
    color: '#00C48C',
    lineHeight: 74,
  },
  marksWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  marksObtained: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  marksTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.subtext,
  },
  
  feedbackCard: {
    borderTopWidth: 5,
    borderTopColor: theme.primary, 
    paddingBottom: 24, 
  },
  cardFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderTitleFeed: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginLeft: 10,
  },
  feedbackBox: {
    backgroundColor: theme.isDarkMode ? '#334155' : '#F8FAFC',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  feedbackText: {
    fontSize: 13,
    color: theme.text,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginBottom: 20,
    marginHorizontal: -20, 
  },
  instructorProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary, 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  instructorAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instructorMeta: {
    justifyContent: 'center',
  },
  instructorName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 2,
  },
  instructorRole: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
  },
});

export default AssignmentGradeScreen;
