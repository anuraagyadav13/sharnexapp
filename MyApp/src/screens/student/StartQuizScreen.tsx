import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';
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
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  const [quizData, setQuizData] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch quiz data on mount
  useEffect(() => {
    fetchQuizData();
  }, []);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !isLoading) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
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
  }, [timeRemaining, isLoading]);

  const fetchQuizData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const quizId = route?.params?.quizId;
      if (!quizId) {
        throw new Error('Quiz ID is required');
      }

      // 1. Validate and start attempt on server to get verified timestamp
      const startRes = await studentService.startQuiz(quizId);
      const startData = startRes.normalized?.data || startRes.data;
      const verifiedStart = startData?.startedAt;
      setStartedAt(verifiedStart);

      // 2. Fetch quiz questions and content
      const response = await studentService.getStartQuiz(quizId);
      const data = response.normalized?.data || response.data;
      
      setQuizData(data);
      // Ensure we have a valid duration (default to 60 mins if missing or invalid)
      const duration = Number(data.duration) || Number(data.timeLimit) || 60;
      setTimeRemaining(duration * 60); 
    } catch (err: any) {
      console.error('Error fetching quiz:', err);
      setError(err.message || 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, optionId: number | string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId as any
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
    const answers = Object.entries(selectedAnswers).map(([questionId, optionId]) => {
      const qIndex = questions.findIndex((q: any) => q.id?.toString() === questionId.toString());
      return {
        questionIndex: qIndex !== -1 ? qIndex : 0,
        selectedOption: optionId
      };
    }).filter(a => a.questionIndex !== -1);

    // If it's a manual submit, we require at least one answer.
    // If it's an auto-submit (timer out), we submit whatever they have (even if empty).
    if (!isAutoSubmit && answers.length === 0) {
      Alert.alert('Info', 'Please answer at least one question before submitting');
      return;
    }

    try {
      setIsSubmitting(true);

      const quizId = route?.params?.quizId;
      
      await studentService.submitQuiz(quizId, {
        answers,
        startedAt,
        timeSpent: ((Number(quizData?.duration) || 60) * 60) - timeRemaining,
        isAutoSubmitted: isAutoSubmit
      });

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      navigation.navigate('QuizResult', { quizId: route?.params?.quizId, timestamp: Date.now() });
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      // For auto-submit, we might want to retry or at least show a specific error
      Alert.alert('Error', isAutoSubmit ? 'Time is up but submission failed. Retrying...' : 'Failed to submit quiz. Please try again.');
      
      if (isAutoSubmit) {
        // Simple retry logic for auto-submit
        setTimeout(() => handleSubmitQuiz(true), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!quizData?.questions?.length) return 0;
    return ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading quiz...</Text>
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
          onPress={fetchQuizData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </ScaleButton>
      </View>
    );
  }

  const currentQuestion = quizData?.questions?.[currentQuestionIndex];
  const selectedOption = selectedAnswers[currentQuestion?.id];

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {/* Global Header */}
      <StudentHeader 
        title="Quiz"
        navigation={navigation}
        isStackScreen={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Blue Hero Header Container */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.heroContainer}>
          <ScaleButton 
            style={styles.backButton} 
            activeOpacity={0.7} 
            scaleTo={0.9} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </ScaleButton>

          <Text style={styles.heroTitle}>{quizData?.title || 'Quiz'}</Text>
          <Text style={styles.heroSubtitle}>
            Question {currentQuestionIndex + 1} of {quizData?.questions?.length || 0} • {quizData?.totalPoints || 0} Points Total
          </Text>
        </Animated.View>

        {/* Global Wrapper for everything below hero */}
        <View style={styles.contentWrapper}>
          
          {/* Top Timer Info Card */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.timerCard}>
             {/* Timer Box */}
             <View style={styles.timerBox}>
                <MaterialCommunityIcons name="clock" size={16} color="#F59E0B" style={{marginRight: 6}} />
                <View>
                  <Text style={styles.timerTextMain}>{formatTime(timeRemaining)}</Text>
                  <Text style={styles.timerTextSub}>Time Remaining</Text>
                </View>
             </View>

             {/* Progress Number */}
             <View style={styles.questionCounterBlock}>
               <Text style={styles.counterCurrent}>{currentQuestionIndex + 1}</Text>
               <Text style={styles.counterTotal}>of {quizData?.questions?.length || 0}</Text>
             </View>
          </Animated.View>

          {/* Progress Bar (Outside Card) */}
          <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.progressContainer}>
             <View style={styles.progressLabelRow}>
               <Text style={styles.progressLabel}>Quiz Progress</Text>
               <Text style={styles.progressLabel}>{Math.round(getProgressPercentage())}%</Text>
             </View>
             <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${getProgressPercentage()}%` }]} />
             </View>
          </Animated.View>

          {/* Actual Question Card */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionNumberCircle}>
                <Text style={styles.questionNumberText}>{currentQuestionIndex + 1}</Text>
              </View>
              <Text style={styles.questionMainText}>
                {currentQuestion?.question || 'Question not available'}
              </Text>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>{currentQuestion?.points || 0} Points</Text>
              </View>
            </View>

            <View style={styles.optionsList}>
              {(currentQuestion?.options || []).map((option: any, index: number) => {
                const optionId = option.id || index + 1;
                const isSelected = selectedOption === optionId;
                const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                return (
                  <ScaleButton
                    key={optionId}
                    activeOpacity={0.8}
                    scaleTo={0.98}
                    onPress={() => handleAnswerSelect(currentQuestion.id, optionId)}
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                  >
                     <View style={[styles.optionLetterBox, isSelected && styles.optionLetterBoxSelected]}>
                       <Text style={[styles.optionLetterText, isSelected && styles.optionLetterTextSelected]}>
                         {letters[index] || String.fromCharCode(65 + index)}
                       </Text>
                     </View>
                     <Text style={[styles.optionTextMain, isSelected && styles.optionTextMainSelected]}>
                       {option.text || option.option}
                     </Text>
                  </ScaleButton>
                );
              })}
            </View>

            <ScaleButton style={styles.flagButton} activeOpacity={0.8} scaleTo={0.97}>
              <Ionicons name="flag" size={14} color="#F59E0B" style={{marginRight: 6}} />
              <Text style={styles.flagButtonText}>Flag for Review</Text>
            </ScaleButton>
          </Animated.View>

          {/* Bottom Action Footer */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.actionFooter}>
            <View style={styles.navigationRow}>
               <ScaleButton
                 style={[styles.prevBtn, currentQuestionIndex === 0 && styles.disabledBtn]}
                 activeOpacity={0.8}
                 scaleTo={0.95}
                 onPress={handlePrevQuestion}
                 disabled={currentQuestionIndex === 0}
               >
                 <Ionicons name="arrow-back" size={16} color={currentQuestionIndex === 0 ? theme.subtext : theme.primary} style={{marginRight: 6}} />
                 <Text style={[styles.prevBtnText, currentQuestionIndex === 0 && styles.disabledBtnText]}>Previous</Text>
               </ScaleButton>

               <ScaleButton
                 style={[styles.nextBtn, currentQuestionIndex === (quizData?.questions?.length || 0) - 1 && styles.disabledBtn]}
                 activeOpacity={0.8}
                 scaleTo={0.95}
                 onPress={handleNextQuestion}
                 disabled={currentQuestionIndex === (quizData?.questions?.length || 0) - 1}
               >
                 <Text style={[styles.nextBtnText, currentQuestionIndex === (quizData?.questions?.length || 0) - 1 && styles.disabledBtnText]}>Next</Text>
                 <Ionicons name="arrow-forward" size={16} color={currentQuestionIndex === (quizData?.questions?.length || 0) - 1 ? "#9CA3AF" : "#FFFFFF"} style={{marginLeft: 6}} />
               </ScaleButton>
            </View>

            <ScaleButton
              style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
              activeOpacity={0.8}
              scaleTo={0.95}
              onPress={() => handleSubmitQuiz()}
              disabled={isSubmitting}
            >
              <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </Text>
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

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 12,
    backgroundColor: theme.surface, 
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: { fontSize: 14, fontWeight: '500', color: theme.primary, flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  heroContainer: {
    backgroundColor: theme.primary, 
    paddingHorizontal: 20,
    paddingTop: 24, 
    paddingBottom: 36, 
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 12, color: '#E0E7FF', fontWeight: '500' },

  contentWrapper: { paddingHorizontal: 16, marginTop: 16 }, 

  timerCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: theme.border
  },
  
  timerBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.isDarkMode ? '#7F1D1D30' : '#FFFBEB', 
    borderWidth: 1, borderColor: theme.isDarkMode ? '#EF444450' : '#FDE68A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  timerTextMain: { fontSize: 13, fontWeight: '800', color: theme.text, marginBottom: 2 },
  timerTextSub: { fontSize: 9, color: theme.subtext, fontWeight: '500' },
  
  questionCounterBlock: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  counterCurrent: { fontSize: 26, fontWeight: '400', color: theme.primary, lineHeight: 30 },
  counterTotal: { fontSize: 12, color: theme.subtext, fontWeight: '500' },

  progressContainer: { marginTop: 24, marginBottom: 20, paddingHorizontal: 2 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 11, fontWeight: '700', color: theme.text },
  progressBarTrack: { height: 6, backgroundColor: theme.isDarkMode ? '#334155' : '#E5E7EB', borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressBarFill: { width: '0%', height: '100%', backgroundColor: theme.primary, borderRadius: 3 },

  questionCard: {
    backgroundColor: theme.surface, borderRadius: 12, padding: 16,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    marginBottom: 20, borderWidth: 1, borderColor: theme.border
  },
  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  questionNumberCircle: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: theme.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2,
  },
  questionNumberText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  questionMainText: { flex: 1, fontSize: 13, fontWeight: '700', color: theme.text, lineHeight: 18, marginRight: 8 },
  pointsBadge: { backgroundColor: theme.isDarkMode ? '#065F4630' : '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  pointsBadgeText: { color: '#10B981', fontSize: 9, fontWeight: '800' },

  optionsList: { gap: 10, marginBottom: 20 },
  optionItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface
  },
  optionItemSelected: { borderColor: theme.isDarkMode ? '#312E81' : theme.primary, backgroundColor: theme.isDarkMode ? '#1E1B4B' : '#EEF2FF' }, 
  
  optionLetterBox: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: theme.isDarkMode ? '#334155' : '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  optionLetterBoxSelected: { backgroundColor: theme.primary },
  optionLetterText: { fontSize: 11, fontWeight: '700', color: theme.text },
  optionLetterTextSelected: { color: '#FFFFFF' },
  
  optionTextMain: { fontSize: 13, color: theme.text, fontWeight: '500' },
  optionTextMainSelected: { color: theme.primary, fontWeight: '700' },

  flagButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.isDarkMode ? '#7F1D1D30' : '#FFFBEB', borderWidth: 1, borderColor: theme.isDarkMode ? '#EF444450' : '#FDE68A', borderRadius: 8, paddingVertical: 10,
  },
  flagButtonText: { color: '#F59E0B', fontSize: 13, fontWeight: '700' },

  actionFooter: { gap: 12 },
  navigationRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  prevBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.primary, borderRadius: 6, paddingVertical: 10, backgroundColor: theme.surface
  },
  prevBtnText: { color: theme.primary, fontSize: 13, fontWeight: '700' },
  
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.primary, borderRadius: 6, paddingVertical: 10,
  },
  nextBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F97316', borderRadius: 6, paddingVertical: 12,
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

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

  // Disabled States
  disabledBtn: {
    opacity: 0.5,
  },
  disabledBtnText: {
    opacity: 0.5,
    color: theme.subtext,
  },
});

export default StartQuizScreen;
