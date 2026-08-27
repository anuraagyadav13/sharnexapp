import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type StartQuizNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StartQuiz'>;
type StartQuizRouteProp = RouteProp<RootStackParamList, 'StartQuiz'>;

interface Props {
  navigation: StartQuizNavigationProp;
  route: StartQuizRouteProp;
}

const StartQuizScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [quizData, setQuizData] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionIndex: number]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [questionIndex: number]: boolean }>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initQuiz();
  }, []);

  // Timer countdown effect with client auto-submit at 00:00
  useEffect(() => {
    if (timeRemaining > 0 && !isLoading && !isSubmitting) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto-submit when timer reaches zero
            handleSubmitQuiz(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, isLoading, isSubmitting]);

  const initQuiz = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const quizId = route?.params?.quizId;
      if (!quizId) {
        throw new Error('Quiz ID is required');
      }

      // Step 1: Validate quiz start eligibility on server (POST /api/quizzes/[id]/start)
      let verifiedStartAt: string | null = null;
      try {
        const startRes = await studentService.startQuiz(quizId);
        const startData = startRes.normalized?.data || startRes.data;
        verifiedStartAt = startData?.startedAt || new Date().toISOString();
        setStartedAt(verifiedStartAt);
      } catch (startErr: any) {
        const message = startErr.response?.data?.message || startErr.message || 'Unable to start quiz';
        const maxAttempts = startErr.response?.data?.maxAttempts;
        const currentAttempts = startErr.response?.data?.currentAttempts;

        if (currentAttempts !== undefined && maxAttempts !== undefined) {
          throw new Error(`Maximum attempts reached (${currentAttempts}/${maxAttempts}). You cannot attempt this quiz again.`);
        }
        throw new Error(message);
      }

      // Step 2: Fetch quiz content and sanitized questions (GET /api/quizzes/[id])
      const detailsRes = await studentService.getQuizDetails(quizId);
      const data = detailsRes.normalized?.data || detailsRes.data;

      if (!data) {
        throw new Error('Quiz content not available');
      }

      setQuizData(data);

      // Set time limit in seconds
      const durationMinutes = Number(data.timeLimit) || Number(data.duration) || 15;
      setTimeRemaining(durationMinutes * 60);

    } catch (err: any) {
      console.error('[StartQuiz] error:', err);
      setError(err.message || 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (questionIndex: number, optionValue: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionValue,
    }));
  };

  const toggleMarkForReview = (questionIndex: number) => {
    setMarkedForReview(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quizData?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async (isAutoSubmit = false) => {
    if (isSubmitting) return;

    const questions = quizData?.questions || [];
    const formattedAnswers = Object.entries(selectedAnswers).map(([indexStr, optionValue]) => ({
      questionIndex: Number(indexStr),
      selectedOption: optionValue,
    }));

    if (!isAutoSubmit && formattedAnswers.length === 0) {
      Alert.alert('No Answers Selected', 'Please answer at least one question before submitting your quiz.');
      return;
    }

    if (!isAutoSubmit) {
      Alert.alert(
        'Submit Quiz',
        `Are you sure you want to submit your quiz? You have answered ${formattedAnswers.length} of ${questions.length} questions.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', style: 'default', onPress: () => processSubmission(formattedAnswers, isAutoSubmit) },
        ]
      );
    } else {
      processSubmission(formattedAnswers, isAutoSubmit);
    }
  };

  const processSubmission = async (answersPayload: Array<{ questionIndex: number; selectedOption: string }>, isAutoSubmit: boolean) => {
    try {
      setIsSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const quizId = route?.params?.quizId;
      const submitPayload = {
        answers: answersPayload,
        startedAt: startedAt || new Date().toISOString(),
      };

      await studentService.submitQuiz(quizId, submitPayload);

      // On success navigate to results screen
      navigation.navigate('QuizResult', { quizId, timestamp: Date.now() });

    } catch (err: any) {
      console.error('[StartQuiz] submission error:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Submission failed. Please try again.';

      Alert.alert(
        isAutoSubmit ? 'Auto-Submission Error' : 'Submission Error',
        serverMsg,
        [
          {
            text: 'OK',
            onPress: () => {
              if (isAutoSubmit) {
                // Retry auto submission once after brief delay
                setTimeout(() => processSubmission(answersPayload, true), 3000);
              }
            },
          },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Validating quiz session...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={56} color={theme.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <ScaleButton style={styles.retryButton} activeOpacity={0.8} scaleTo={0.95} onPress={initQuiz}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </ScaleButton>
      </View>
    );
  }

  const questions = quizData?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const questionsLeft = Math.max(0, questions.length - answeredCount);
  const currentSelectedOption = selectedAnswers[currentQuestionIndex];
  const isCurrentMarked = Boolean(markedForReview[currentQuestionIndex]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      <StudentHeader
        title="Quiz"
        navigation={navigation}
        isStackScreen={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Screen Header Hero Banner */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.heroContainer}>
          <View style={styles.heroTopRow}>
            <ScaleButton
              style={styles.backButton}
              activeOpacity={0.7}
              scaleTo={0.9}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </ScaleButton>

            <View style={styles.timerChip}>
              <Ionicons name="time-outline" size={16} color={theme.warning} style={{ marginRight: 4 }} />
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{quizData?.title || 'Quiz Session'}</Text>
          <Text style={styles.heroSubtitle}>
            Subject: {quizData?.subject || 'General'} • Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </Animated.View>

        <View style={styles.contentWrapper}>
          
          {/* Quick Statistics Panel */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.statsCard}>
            <Text style={styles.statsTitle}>Quick Statistics</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: theme.success }]}>{answeredCount}</Text>
                <Text style={styles.statLbl}>Answered</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: theme.warning }]}>{reviewCount}</Text>
                <Text style={styles.statLbl}>Review</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: theme.primary }]}>{questionsLeft}</Text>
                <Text style={styles.statLbl}>Questions Left</Text>
              </View>
            </View>
          </Animated.View>

          {/* Interactive Question Jump Grid */}
          <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.gridContainer}>
            <Text style={styles.gridTitle}>Question Navigation</Text>
            <View style={styles.jumpGrid}>
              {questions.map((_: any, idx: number) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isFlagged = Boolean(markedForReview[idx]);

                let itemBg = theme.surface;
                let itemBorder = theme.border;
                let itemTextColor = theme.text;

                if (isCurrent) {
                  itemBg = theme.primary;
                  itemBorder = theme.primary;
                  itemTextColor = '#FFFFFF';
                } else if (isFlagged) {
                  itemBg = isDarkMode ? '#78350F40' : '#FEF3C7';
                  itemBorder = theme.warning;
                  itemTextColor = theme.warning;
                } else if (isAnswered) {
                  itemBg = isDarkMode ? '#065F4640' : '#ECFDF5';
                  itemBorder = theme.success;
                  itemTextColor = theme.success;
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => setCurrentQuestionIndex(idx)}
                    style={[styles.gridCell, { backgroundColor: itemBg, borderColor: itemBorder }]}
                  >
                    <Text style={[styles.gridCellText, { color: itemTextColor }]}>{idx + 1}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Question Display Card */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>Q{currentQuestionIndex + 1}</Text>
              </View>
              <Text style={styles.questionTextMain}>
                {currentQuestion?.text || currentQuestion?.question || 'Question content'}
              </Text>
            </View>

            {/* Options List */}
            <View style={styles.optionsList}>
              {(currentQuestion?.options || []).map((option: any, optIdx: number) => {
                const optionValue = typeof option === 'string' ? option : option.text || option.id;
                const isSelected = currentSelectedOption === optionValue;
                const letter = String.fromCharCode(65 + optIdx);

                return (
                  <ScaleButton
                    key={optIdx}
                    activeOpacity={0.8}
                    scaleTo={0.98}
                    onPress={() => handleOptionSelect(currentQuestionIndex, optionValue)}
                    style={[
                      styles.optionItem,
                      isSelected && {
                        borderColor: theme.primary,
                        backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF',
                      },
                    ]}
                  >
                    <View style={[styles.optionLetterBox, isSelected && { backgroundColor: theme.primary }]}>
                      <Text style={[styles.optionLetterText, isSelected && { color: '#FFFFFF' }]}>
                        {letter}
                      </Text>
                    </View>
                    <Text style={[styles.optionTextMain, isSelected && { color: theme.primary, fontWeight: '700' }]}>
                      {optionValue}
                    </Text>
                  </ScaleButton>
                );
              })}
            </View>

            {/* Flag for Review Button */}
            <ScaleButton
              style={[
                styles.flagButton,
                isCurrentMarked && { backgroundColor: isDarkMode ? '#78350F30' : '#FEF3C7', borderColor: theme.warning },
              ]}
              activeOpacity={0.8}
              scaleTo={0.97}
              onPress={() => toggleMarkForReview(currentQuestionIndex)}
            >
              <Ionicons
                name={isCurrentMarked ? 'flag' : 'flag-outline'}
                size={16}
                color={theme.warning}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.flagButtonText, { color: theme.warning }]}>
                {isCurrentMarked ? 'Marked for Review' : 'Mark for Review'}
              </Text>
            </ScaleButton>
          </Animated.View>

          {/* Footer Controls */}
          <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.actionFooter}>
            <View style={styles.navigationRow}>
              <ScaleButton
                style={[styles.navBtn, currentQuestionIndex === 0 && styles.disabledBtn]}
                activeOpacity={0.8}
                scaleTo={0.95}
                onPress={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <Ionicons name="arrow-back" size={16} color={currentQuestionIndex === 0 ? theme.subtext : theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.navBtnText, { color: currentQuestionIndex === 0 ? theme.subtext : theme.primary }]}>Previous</Text>
              </ScaleButton>

              <ScaleButton
                style={[styles.navBtn, { backgroundColor: theme.primary, borderColor: theme.primary }, currentQuestionIndex === questions.length - 1 && styles.disabledBtn]}
                activeOpacity={0.8}
                scaleTo={0.95}
                onPress={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                <Text style={[styles.navBtnText, { color: '#FFFFFF' }]}>Next</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </ScaleButton>
            </View>

            <ScaleButton
              style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
              activeOpacity={0.8}
              scaleTo={0.95}
              onPress={() => handleSubmitQuiz(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Submit Quiz</Text>
                </>
              )}
            </ScaleButton>
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
    paddingBottom: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },

  contentWrapper: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 16,
  },

  statsCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
    marginTop: 2,
  },

  gridContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 2,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  jumpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCellText: {
    fontSize: 13,
    fontWeight: '700',
  },

  questionCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
    marginTop: 2,
  },
  questionBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  questionTextMain: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    lineHeight: 22,
  },

  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  optionLetterBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: isDarkMode ? '#334155' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
  optionTextMain: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },

  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingVertical: 10,
    backgroundColor: theme.surface,
  },
  flagButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },

  actionFooter: {
    gap: 12,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: theme.surface,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.success,
    borderRadius: 8,
    paddingVertical: 14,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 16,
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
    marginTop: 16,
    marginBottom: 24,
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

  disabledBtn: {
    opacity: 0.5,
  },
});

export default StartQuizScreen;
