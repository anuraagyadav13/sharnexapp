import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type QuizResultNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuizResult'>;
type QuizResultRouteProp = RouteProp<RootStackParamList, 'QuizResult'>;

interface Props {
  navigation: QuizResultNavigationProp;
  route: QuizResultRouteProp;
}

const QuizResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [quizResult, setQuizResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizResult();
  }, [route?.params?.quizId]);

  const fetchQuizResult = async (isRef = false) => {
    try {
      if (isRef) {
        setIsRefreshing(true);
      } else {
        if (!quizResult) setIsLoading(true);
      }
      setError(null);
      const quizId = route?.params?.quizId;
      if (!quizId) {
        throw new Error('Quiz ID is required');
      }

      const res = await studentService.getQuizResult(quizId);
      const responseData = res.normalized?.data ?? res.data ?? null;

      if (!responseData) {
        throw new Error('No result data returned');
      }

      setQuizResult(responseData);
    } catch (err: any) {
      console.error('[QuizResult] failed to fetch:', err);
      if (!isRef || !quizResult) {
        setError(err.message || 'Failed to load quiz results. Please try again.');
        setQuizResult(null);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchQuizResult(true);
  };

  const formatTimeTaken = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined || isNaN(Number(seconds))) {
      return 'N/A';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs} seconds`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (error || !quizResult) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={56} color={theme.danger} />
        <Text style={styles.errorText}>{error || 'Result not available'}</Text>
        <ScaleButton style={styles.retryButton} activeOpacity={0.8} scaleTo={0.95} onPress={() => fetchQuizResult(false)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </ScaleButton>
      </View>
    );
  }

  const { quiz, attempt, statistics, questionReview = [] } = quizResult;
  const scorePercentage = statistics?.percentage ?? attempt?.score ?? 0;
  const timeTakenDisplay = formatTimeTaken(attempt?.timeTakenSeconds);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      <StudentHeader
        title="Quiz Result"
        navigation={navigation}
        isStackScreen={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        
        {/* Screen Hero Banner */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.heroContainer}>
          <ScaleButton
            style={styles.backButton}
            activeOpacity={0.7}
            scaleTo={0.9}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </ScaleButton>

          <Text style={styles.heroTitle}>{quiz?.title || 'Quiz Result'}</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroSubtitle}>Subject: {quiz?.subject || 'General'}</Text>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.contentWrapper}>
          
          {/* Summary Stat Cards Grid */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.summaryCard}>
            
            {/* Score Ring */}
            <View style={styles.ringWrapper}>
              <View style={[styles.scoreRing, { borderColor: scorePercentage >= 50 ? theme.success : theme.danger }]}>
                <Text style={styles.scoreNumberMain}>{scorePercentage}%</Text>
                <Text style={styles.scoreNumberSub}>Score</Text>
              </View>
            </View>

            <View style={[styles.performancePill, { backgroundColor: scorePercentage >= 80 ? theme.success : scorePercentage >= 50 ? theme.primary : theme.danger }]}>
              <Text style={styles.performancePillText}>
                {scorePercentage >= 80 ? 'Outstanding' : scorePercentage >= 50 ? 'Passed' : 'Needs Review'}
              </Text>
            </View>

            <View style={styles.statsGridRow}>
              <View style={styles.statsGridCol}>
                <Text style={[styles.statsGridVal, { color: theme.success }]}>
                  {statistics?.correctCount || 0}/{statistics?.totalQuestions || 0}
                </Text>
                <Text style={styles.statsGridLbl}>Correct</Text>
              </View>
              <View style={styles.statsGridCol}>
                <Text style={[styles.statsGridVal, { color: theme.danger }]}>
                  {statistics?.incorrectCount || 0}/{statistics?.totalQuestions || 0}
                </Text>
                <Text style={styles.statsGridLbl}>Incorrect</Text>
              </View>
            </View>

            <View style={styles.statsGridRow}>
              <View style={styles.statsGridCol}>
                <Text style={[styles.statsGridVal, { color: theme.primary }]}>{timeTakenDisplay}</Text>
                <Text style={styles.statsGridLbl}>Time Taken</Text>
              </View>
              <View style={styles.statsGridCol}>
                <Text style={[styles.statsGridVal, { color: theme.secondary }]}>
                  {attempt?.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'N/A'}
                </Text>
                <Text style={styles.statsGridLbl}>Submitted Date</Text>
              </View>
            </View>

          </Animated.View>

          {/* Section Header */}
          <Animated.View entering={FadeIn.delay(150)} style={styles.sectionTitleRow}>
            <Ionicons name="help-circle-outline" size={20} color={theme.primary} />
            <Text style={styles.sectionTitleText}>Question Review</Text>
          </Animated.View>

          {/* Question Review Cards */}
          {questionReview.map((question: any, idx: number) => {
            const isCorrect = Boolean(question.isCorrect);

            return (
              <Animated.View
                key={idx}
                entering={FadeInUp.delay(200 + idx * 50).springify()}
                style={[
                  styles.questionCard,
                  { borderLeftColor: isCorrect ? theme.success : theme.danger },
                ]}
              >
                <View style={styles.questionHeader}>
                  <View style={[styles.questionNumberCircle, { backgroundColor: theme.primary }]}>
                    <Text style={styles.questionNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.questionMainText}>
                    {question.questionText || `Question ${idx + 1}`}
                  </Text>
                  <View style={[styles.pointsBadge, { backgroundColor: isDarkMode ? '#065F4630' : '#ECFDF5' }]}>
                    <Text style={[styles.pointsBadgeText, { color: theme.success }]}>
                      {question.marks || 0}/{question.maxMarks || 1} Marks
                    </Text>
                  </View>
                </View>

                {/* Options Review Breakdown */}
                <View style={styles.optionsList}>
                  {(question.options || []).map((option: any, optIdx: number) => {
                    const optText = typeof option === 'string' ? option : option.text || option.id;
                    const letter = String.fromCharCode(65 + optIdx);

                    const isSubmitted = question.submittedAnswer === optText;
                    const isRightAnswer = question.correctAnswer === optText;

                    let itemBg = theme.surface;
                    let itemBorder = theme.border;
                    let itemTextColor = theme.text;
                    let letterBg = isDarkMode ? '#334155' : '#F1F5F9';
                    let letterColor = theme.text;

                    if (isRightAnswer) {
                      itemBg = isDarkMode ? '#065F4630' : '#ECFDF5';
                      itemBorder = theme.success;
                      itemTextColor = theme.success;
                      letterBg = theme.success;
                      letterColor = '#FFFFFF';
                    } else if (isSubmitted && !isCorrect) {
                      itemBg = isDarkMode ? '#7F1D1D30' : '#FEF1F2';
                      itemBorder = theme.danger;
                      itemTextColor = theme.danger;
                      letterBg = theme.danger;
                      letterColor = '#FFFFFF';
                    }

                    return (
                      <View key={optIdx} style={[styles.optionItem, { backgroundColor: itemBg, borderColor: itemBorder }]}>
                        <View style={[styles.optionLetterBox, { backgroundColor: letterBg }]}>
                          <Text style={[styles.optionLetterText, { color: letterColor }]}>{letter}</Text>
                        </View>
                        <Text style={[styles.optionTextMain, { color: itemTextColor }]}>{optText}</Text>
                        {isRightAnswer && (
                          <Ionicons name="checkmark-circle" size={16} color={theme.success} style={{ marginLeft: 6 }} />
                        )}
                        {isSubmitted && !isCorrect && (
                          <Ionicons name="close-circle" size={16} color={theme.danger} style={{ marginLeft: 6 }} />
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Answer Result Feedback Pill */}
                <View
                  style={[
                    styles.resultFeedbackPill,
                    { backgroundColor: isCorrect ? (isDarkMode ? '#065F4630' : '#ECFDF5') : (isDarkMode ? '#7F1D1D30' : '#FEF1F2') },
                  ]}
                >
                  <Ionicons
                    name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={14}
                    color={isCorrect ? theme.success : theme.danger}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.resultFeedbackText, { color: isCorrect ? theme.success : theme.danger }]}>
                    Your Answer: {question.submittedAnswer || 'Not answered'} — {isCorrect ? 'Correct' : 'Incorrect'}
                  </Text>
                </View>
              </Animated.View>
            );
          })}

          {/* Navigation Action Buttons */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.actionFooter}>
            <ScaleButton
              style={styles.backBtnFull}
              activeOpacity={0.8}
              scaleTo={0.96}
              onPress={() => navigation.navigate('Quizzes')}
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.backBtnFullText}>Back to Quizzes</Text>
            </ScaleButton>
          </Animated.View>

        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },

  heroContainer: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  completedBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  contentWrapper: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 16,
  },

  summaryCard: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  ringWrapper: { marginBottom: 12 },
  scoreRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumberMain: { fontSize: 20, fontWeight: '800', color: theme.text },
  scoreNumberSub: { fontSize: 10, fontWeight: '500', color: theme.subtext },

  performancePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  performancePillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  statsGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    gap: 10,
  },
  statsGridCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  statsGridVal: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  statsGridLbl: { fontSize: 10, color: theme.subtext, fontWeight: '500' },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sectionTitleText: { fontSize: 16, fontWeight: '700', color: theme.text, marginLeft: 8 },

  questionCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderLeftWidth: 4,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  questionNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  questionNumberText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  questionMainText: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.text, lineHeight: 20 },
  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pointsBadgeText: { fontSize: 10, fontWeight: '800' },

  optionsList: { gap: 8, marginBottom: 12 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionLetterBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  optionLetterText: { fontSize: 11, fontWeight: '700' },
  optionTextMain: { flex: 1, fontSize: 13, fontWeight: '600' },

  resultFeedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  resultFeedbackText: { fontSize: 11, fontWeight: '700' },

  actionFooter: { marginTop: 8 },
  backBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 14,
    elevation: 3,
  },
  backBtnFullText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: theme.subtext,
    fontWeight: '500',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 15,
    color: theme.danger,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 20,
    fontWeight: '600',
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

export default QuizResultScreen;
