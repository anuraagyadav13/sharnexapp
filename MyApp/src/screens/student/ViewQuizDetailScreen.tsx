import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import studentService from '../../services/studentService';

type ViewQuizDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ViewQuizDetail'>;

interface Props {
  navigation: ViewQuizDetailNavigationProp;
  route: any;
}

const ViewQuizDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const { authState } = useAuth();

  const [quizData, setQuizData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const quizId = route?.params?.quizId;

  const fetchQuiz = async () => {
    if (!quizId) {
      setError('Quiz ID not provided');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await studentService.getQuizDetails(quizId);
      const data = res.normalized?.data ?? res.data?.data ?? res.data ?? null;
      if (data) {
        setQuizData(data);
      } else {
        setError('Quiz data not found');
      }
    } catch (err: any) {
      console.error('Failed to load quiz details:', err);
      setError('Failed to load quiz details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const questionsCount = quizData?.questions?.length || 0;

  // Determine derived status (consistent with backend and QuizzesScreen list)
  const rawStatus = quizData?.derivedStatus || (
    quizData?.dueDate && new Date(quizData.dueDate) < new Date() ? 'expired' : 'open'
  );

  const isCompleted = quizData?.hasAttempt || rawStatus === 'completed';
  const isExpired = rawStatus === 'expired' && !quizData?.hasAttempt;
  const isUpcoming = rawStatus === 'upcoming';
  const isDraft = rawStatus === 'draft';
  const isOpen = rawStatus === 'open' && !isCompleted && !isExpired;

  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return null;
    }
  };

  const startTimeStr = formatDateTime(quizData?.startAt) || 'Available immediately';
  const dueDateStr = formatDateTime(quizData?.dueDate) || 'No Due Date';

  if (isLoading) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !quizData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error || 'Quiz not found'}</Text>
        <ScaleButton
          style={styles.retryButton}
          activeOpacity={0.8}
          scaleTo={0.95}
          onPress={fetchQuiz}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </ScaleButton>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {/* Global Header */}
      <StudentHeader 
        title="Quiz Details"
        navigation={navigation}
        isStackScreen={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>

        {/* Blue Hero Container */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.heroContainer}>
          <ScaleButton
            style={styles.backButton}
            activeOpacity={0.7}
            scaleTo={0.9}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </ScaleButton>

          <Text style={styles.heroTitle}>{quizData?.title || 'Quiz Details'}</Text>
          <Text style={styles.heroSubtitle}>
            {quizData?.subject ? `${quizData.subject} • ${quizData.className || 'General'}` : 'Review instructions before starting'}
          </Text>
        </Animated.View>

        <View style={styles.contentWrapper}>

          {/* Top Info Highlights Card */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.topHighlightsCard}>
            <View style={styles.highlightCol}>
              <View style={[styles.highlightIconBg, { backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF' }]}>
                <Ionicons name="time" size={14} color={theme.primary} />
              </View>
              <Text style={styles.highlightVal}>{quizData?.timeLimit ? `${quizData.timeLimit} min` : 'Untimed'}</Text>
              <Text style={styles.highlightLbl}>Duration</Text>
            </View>

            <View style={styles.highlightCol}>
              <View style={[styles.highlightIconBg, { backgroundColor: isDarkMode ? '#701A7530' : '#FAD1E8' }]}>
                <Ionicons name="help-circle" size={14} color="#C026D3" />
              </View>
              <Text style={styles.highlightVal}>{questionsCount}</Text>
              <Text style={styles.highlightLbl}>Questions</Text>
            </View>

            <View style={styles.highlightCol}>
              <View style={[styles.highlightIconBg, { backgroundColor: isDarkMode ? '#065F4630' : '#DCFCE7' }]}>
                <Ionicons name="star" size={14} color="#10B981" />
              </View>
              <Text style={styles.highlightVal}>{questionsCount}</Text>
              <Text style={styles.highlightLbl}>Max Points</Text>
            </View>
          </Animated.View>

          {/* Complete Information */}
          <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.infoCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="information-circle" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={styles.cardHeaderTitle}>Complete Information</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoRowLeft}>Subject</Text>
              <Text style={styles.infoRowRight}>{quizData?.subject || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLeft}>Class</Text>
              <Text style={styles.infoRowRight}>
                {quizData?.className ? `${quizData.className}${quizData.classSection ? ` (${quizData.classSection})` : ''}` : 'N/A'}
              </Text>
            </View>
            {quizData?.teacherName ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoRowLeft}>Teacher</Text>
                <Text style={styles.infoRowRight}>{quizData.teacherName}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLeft}>Total Questions</Text>
              <Text style={styles.infoRowRight}>{questionsCount}</Text>
            </View>

            <View style={styles.warningPill}>
              <Ionicons name="information-circle" size={16} color="#F97316" style={{ marginRight: 6 }} />
              <Text style={styles.warningPillText}>
                {quizData?.maxAttempts ? `${quizData.maxAttempts} Attempt Allowed` : 'Single Attempt Allowed'}
              </Text>
            </View>
          </Animated.View>

          {/* Important Instructions */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.infoCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="document-text-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={styles.cardHeaderTitle}>Important Instructions</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.instructionItem}>
              <Ionicons name="play-circle-outline" size={16} color={theme.primary} style={styles.instIcon} />
              <Text style={styles.instText}><Text style={styles.instBold}>Start Time:</Text> {startTimeStr}</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="calendar-outline" size={16} color={theme.primary} style={styles.instIcon} />
              <Text style={styles.instText}><Text style={styles.instBold}>Due Date:</Text> {dueDateStr}</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="time-outline" size={16} color={theme.primary} style={styles.instIcon} />
              <Text style={styles.instText}>
                <Text style={styles.instBold}>Time Limit:</Text> {quizData?.timeLimit ? `${quizData.timeLimit} minutes once started` : 'Untimed test'}
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color={theme.primary} style={styles.instIcon} />
              <Text style={styles.instText}>
                <Text style={styles.instBold}>Submission:</Text> Quiz submits automatically when time expires.
              </Text>
            </View>
          </Animated.View>

          {/* Action Button - Branches strictly on derivedStatus */}
          <Animated.View entering={FadeInUp.delay(250).springify()} style={{ marginTop: 8 }}>
            {isCompleted ? (
              <ScaleButton
                style={styles.actionBtnPrimary}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('QuizResult', { quizId, timestamp: Date.now() })}
              >
                <Ionicons name="bar-chart-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>View Result</Text>
              </ScaleButton>
            ) : isExpired ? (
              <View style={styles.actionBtnDisabled}>
                <Ionicons name="lock-closed" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnDisabledText}>Expired</Text>
              </View>
            ) : isUpcoming ? (
              <View style={styles.actionBtnDisabled}>
                <Ionicons name="time-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnDisabledText}>Starts on {startTimeStr}</Text>
              </View>
            ) : isDraft ? (
              <View style={styles.actionBtnDisabled}>
                <Ionicons name="alert-circle-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnDisabledText}>Not Available</Text>
              </View>
            ) : (
              <ScaleButton
                style={styles.actionBtnPrimary}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('StartQuiz', { quizId })}
              >
                <Ionicons name="play-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Start Quiz Now</Text>
              </ScaleButton>
            )}
          </Animated.View>

        </View>

      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },

  heroContainer: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 11, color: '#E0E7FF', fontWeight: '500', lineHeight: 16 },

  contentWrapper: { paddingHorizontal: 16, marginTop: 16 },

  topHighlightsCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 10,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    marginBottom: 16, borderWidth: 1, borderColor: theme.border,
    borderTopWidth: 4, borderTopColor: theme.primary,
  },
  highlightCol: { flex: 1, alignItems: 'center' },
  highlightIconBg: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  highlightVal: { fontSize: 13, fontWeight: '800', color: theme.text, marginBottom: 2 },
  highlightLbl: { fontSize: 10, color: theme.subtext, fontWeight: '500' },

  infoCard: {
    backgroundColor: theme.surface, borderRadius: 12, padding: 14,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    marginBottom: 16, borderWidth: 1, borderColor: theme.border
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardHeaderTitle: { fontSize: 15, fontWeight: '700', color: theme.primary },
  divider: { height: 1, backgroundColor: theme.border, width: '100%', marginBottom: 12 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoRowLeft: { fontSize: 12, color: theme.subtext, fontWeight: '500' },
  infoRowRight: { fontSize: 12, color: theme.text, fontWeight: '600' },

  warningPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#C2410C30' : '#FFF7ED',
    alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 4
  },
  warningPillText: { color: '#F97316', fontSize: 10, fontWeight: '600' },

  instructionItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  instIcon: { marginRight: 8, marginTop: 2 },
  instText: { flex: 1, fontSize: 11, color: theme.text, lineHeight: 18 },
  instBold: { fontWeight: '700' },

  actionBtnPrimary: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnDisabled: {
    backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionBtnDisabledText: {
    color: theme.subtext,
    fontSize: 14,
    fontWeight: '700',
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
});

export default ViewQuizDetailScreen;
