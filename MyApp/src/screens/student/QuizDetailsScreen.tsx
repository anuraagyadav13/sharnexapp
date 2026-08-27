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
import { RootStackParamList } from '../../../App';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type QuizDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuizDetails'>;

interface Props {
  navigation: QuizDetailsNavigationProp;
  route: any;
}

const formatSeconds = (seconds: number | null | undefined): string => {
  if (seconds == null || isNaN(seconds)) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

const QuizDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const ScoreRow = ({ label, value, hideBorder = false, valueColor = theme.text }: any) => (
    <View style={[styles.scoreRow, hideBorder && { borderBottomWidth: 0 }]}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={[styles.scoreValue, { color: valueColor }]}>{value}</Text>
    </View>
  );

  const ImprovementRow = ({ label, valueText, diffSign, diffColor, hideBorder = false, iconName, labelColor = theme.text }: any) => (
    <View style={[styles.scoreRow, hideBorder && { borderBottomWidth: 0 }]}>
      <Text style={[styles.scoreLabel, { color: labelColor }]}>{label}</Text>
      {diffSign ? (
        <View style={styles.diffWrapper}>
          <Text style={[styles.diffText, { color: diffColor }]}>{valueText}</Text>
          <Ionicons name={iconName} size={14} color={diffColor} />
        </View>
      ) : (
        <Text style={[styles.scoreValue, { color: theme.text, fontWeight: '500' }]}>{valueText}</Text>
      )}
    </View>
  );

  const QuestionCard = ({ number, question, status, options }: any) => {
    const isCorrect = status === 'correct';
    const isSkipped = status === 'skipped';
    const cardBorderColor = isCorrect ? '#10B981' : (isSkipped ? '#9CA3AF' : '#EF4444');
    const pillBg = isCorrect ? (isDarkMode ? '#065F4630' : '#DCFCE7') : (isSkipped ? (isDarkMode ? '#334155' : '#F3F4F6') : (isDarkMode ? '#7F1D1D30' : '#FEE2E2')); 
    const pillColor = isCorrect ? (isDarkMode ? '#34D399' : '#10B981') : (isSkipped ? (isDarkMode ? '#94A3B8' : '#6B7280') : (isDarkMode ? '#FCA5A5' : '#EF4444'));

    return (
      <View style={styles.questionCard}>
        <View style={[styles.cardLeftBorder, { backgroundColor: cardBorderColor }]} />
        
        <View style={styles.questionHeader}>
          <Text style={styles.questionText}>
            {number}. {question}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
            <Text style={[styles.statusPillText, { color: pillColor }]}>
              {isCorrect ? 'Correct' : (isSkipped ? 'Skipped' : 'Incorrect')}
            </Text>
          </View>
        </View>

        <View style={styles.optionsBox}>
          <Text style={styles.optionsTitle}>Options</Text>
          {options.map((opt: any, index: number) => {
            let bg = theme.surface;
            let border = theme.border;
            let letterBg = isDarkMode ? '#334155' : '#F3F4F6';
            let letterColor = theme.text;

            if (opt.state === 'correct') {
              bg = isDarkMode ? '#065F4630' : '#DCFCE7';
              border = '#10B981';
              letterBg = '#10B981';
              letterColor = '#FFFFFF';
            } else if (opt.state === 'incorrect') {
              bg = isDarkMode ? '#7F1D1D30' : '#FEE2E2';
              border = '#EF4444';
              letterBg = '#EF4444';
              letterColor = '#FFFFFF';
            }

            return (
              <View key={index} style={[styles.optionItem, { backgroundColor: bg, borderColor: border }]}>
                 <View style={[styles.optionLetterBox, { backgroundColor: letterBg }]}>
                   <Text style={[styles.optionLetterText, { color: letterColor }]}>{opt.letter}</Text>
                 </View>
                 <Text style={styles.optionText}>{opt.text}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState<'performance' | 'question'>('performance');
  const [quizData, setQuizData] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const quizId = route?.params?.quizId;
      if (!quizId) {
        setError('Quiz ID not found');
        return;
      }

      const res = await studentService.getQuizDetails(quizId);
      const detailsData = res.normalized?.data ?? res.data?.data ?? res.data ?? null;

      let resultData: any = null;
      try {
        const resultRes = await studentService.getQuizResult(quizId);
        resultData = resultRes.normalized?.data ?? resultRes.data?.data ?? resultRes.data ?? null;
      } catch (resErr) {
        console.error('Could not fetch quiz result for details:', resErr);
      }

      if (resultData) {
        setQuizData({
          ...detailsData,
          ...resultData.quiz,
          ...resultData.statistics,
          attempt: resultData.attempt,
          questionReview: resultData.questionReview || [],
        });
      } else {
        setQuizData(detailsData);
      }
    } catch (err: any) {
      console.error('Failed to fetch quiz details:', err);
      setError('Failed to load quiz details. Please try again.');
      setQuizData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizDetails();
  }, [route?.params?.quizId]);

  useEffect(() => {
    setQuestionIndex(0);
  }, [selectedFilter]);

  const questionReviewList = quizData?.questionReview || [];

  const filteredQuestions = questionReviewList.filter((q: any) => {
    if (selectedFilter === 'correct') return q.isCorrect === true;
    if (selectedFilter === 'incorrect') return q.isCorrect === false && q.submittedAnswer !== null;
    if (selectedFilter === 'skipped') return q.submittedAnswer === null;
    return true; // 'all'
  });

  const countAll = questionReviewList.length;
  const countCorrect = questionReviewList.filter((q: any) => q.isCorrect === true).length;
  const countIncorrect = questionReviewList.filter((q: any) => q.isCorrect === false && q.submittedAnswer !== null).length;
  const countSkipped = questionReviewList.filter((q: any) => q.submittedAnswer === null).length;

  const handleNextQuestion = (total: number) => {
    if (questionIndex < total - 1) {
      setQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex(prev => prev - 1);
    }
  };

  const renderPerformanceTab = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.detailsGlobalBody}>
       <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          <View style={styles.tableWrapper}>
             <ScoreRow label="Your Score" value={`${quizData?.score ?? 0} / ${quizData?.totalQuestions ?? 0}`} />
             <ScoreRow label="Total Questions" value={`${quizData?.totalQuestions ?? 0}`} />
             <ScoreRow label="Correct Answers" value={`${quizData?.correctCount ?? 0}`} />
             <ScoreRow label="Incorrect Answers" value={`${quizData?.incorrectCount ?? 0}`} />
             <ScoreRow label="Unanswered" value={`${quizData?.unansweredCount ?? 0}`} />
             <ScoreRow label="Percentage" value={`${quizData?.percentage ?? 0}%`} hideBorder={true} />
          </View>
       </View>

       <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Time Management</Text>
          <View style={styles.tableWrapper}>
             <ScoreRow label="Time Taken" value={formatSeconds(quizData?.attempt?.timeTakenSeconds)} />
             <ScoreRow label="Time Allowed" value={quizData?.timeLimit ? `${quizData.timeLimit} Minutes` : 'N/A'} hideBorder={true} />
          </View>
       </View>

       <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Result Summary</Text>
          <View style={styles.tableWrapper}>
             <ImprovementRow 
                label="Result Status" 
                valueText={(quizData?.percentage ?? 0) >= 80 ? "Excellent Mastery" : (quizData?.percentage ?? 0) >= 50 ? "Good Progress" : "Needs Review"} 
                diffSign={false} 
             />
             <ImprovementRow 
                label="Accuracy" 
                labelColor={(quizData?.percentage ?? 0) >= 70 ? "#10B981" : "#EF4444"} 
                valueText={`${quizData?.percentage ?? 0}% Accuracy`} 
                diffSign={true} 
                diffColor={(quizData?.percentage ?? 0) >= 70 ? "#10B981" : "#EF4444"} 
                iconName={(quizData?.percentage ?? 0) >= 70 ? "checkmark-circle" : "alert-circle"} 
                hideBorder={true}
             />
          </View>
       </View>
    </Animated.View>
  );

  const renderQuestionTab = () => {
    const currentQ = filteredQuestions[questionIndex];
    const totalQ = filteredQuestions.length;

    let processedOptions: any[] = [];
    if (currentQ?.options) {
      processedOptions = currentQ.options.map((opt: any, i: number) => {
        const optText = typeof opt === 'string' ? opt : (opt?.text || opt?.id || '');
        const isCorrectOpt = optText === currentQ.correctAnswer;
        const isSubmittedOpt = optText === currentQ.submittedAnswer;

        let state = 'normal';
        if (isCorrectOpt) {
          state = 'correct';
        } else if (isSubmittedOpt && !currentQ.isCorrect) {
          state = 'incorrect';
        }

        return {
          letter: String.fromCharCode(65 + i),
          text: optText,
          state,
        };
      });
    }

    const questionStatus = currentQ?.isCorrect
      ? 'correct'
      : (currentQ?.submittedAnswer === null ? 'skipped' : 'incorrect');

    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.detailsGlobalBody}>
        {/* Filters Row */}
        <View style={styles.filterPillsRow}>
          <ScaleButton 
            activeOpacity={0.8} 
            style={selectedFilter === 'all' ? styles.activeFilterPill : styles.inactiveFilterPill}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={selectedFilter === 'all' ? styles.activeFilterPillText : styles.inactiveFilterPillText}>
              All ({countAll})
            </Text>
          </ScaleButton>
          
          <ScaleButton 
            activeOpacity={0.8} 
            style={selectedFilter === 'correct' ? styles.activeFilterPill : styles.inactiveFilterPill}
            onPress={() => setSelectedFilter('correct')}
          >
            <Text style={selectedFilter === 'correct' ? styles.activeFilterPillText : styles.inactiveFilterPillText}>
              Correct ({countCorrect})
            </Text>
          </ScaleButton>

          <ScaleButton 
            activeOpacity={0.8} 
            style={selectedFilter === 'incorrect' ? styles.activeFilterPill : styles.inactiveFilterPill}
            onPress={() => setSelectedFilter('incorrect')}
          >
            <Text style={selectedFilter === 'incorrect' ? styles.activeFilterPillText : styles.inactiveFilterPillText}>
              Incorrect ({countIncorrect})
            </Text>
          </ScaleButton>

          <ScaleButton 
            activeOpacity={0.8} 
            style={selectedFilter === 'skipped' ? styles.activeFilterPill : styles.inactiveFilterPill}
            onPress={() => setSelectedFilter('skipped')}
          >
            <Text style={selectedFilter === 'skipped' ? styles.activeFilterPillText : styles.inactiveFilterPillText}>
              Skipped ({countSkipped})
            </Text>
          </ScaleButton>
        </View>

        {currentQ ? (
          <>
            <QuestionCard 
              key={currentQ.questionIndex ?? questionIndex}
              number={(currentQ.questionIndex != null ? currentQ.questionIndex : questionIndex) + 1} 
              question={currentQ.questionText || 'Question text not available'} 
              status={questionStatus}
              options={processedOptions} 
            />

            {/* Navigation Buttons Row */}
            <View style={styles.analysisNavRow}>
              <ScaleButton
                style={[styles.analysisNavBtn, questionIndex === 0 && styles.disabledBtn]}
                onPress={handlePrevQuestion}
                disabled={questionIndex === 0}
              >
                <Ionicons name="arrow-back" size={16} color={questionIndex === 0 ? "#9CA3AF" : theme.primary} style={{marginRight: 6}} />
                <Text style={[styles.analysisNavBtnText, questionIndex === 0 && styles.disabledBtnText]}>Previous</Text>
              </ScaleButton>

              <View style={styles.analysisPageIndicator}>
                 <Text style={styles.analysisPageText}>{questionIndex + 1} / {totalQ}</Text>
              </View>

              <ScaleButton
                style={[styles.analysisNavBtn, (questionIndex === totalQ - 1) && styles.disabledBtn]}
                onPress={() => handleNextQuestion(totalQ)}
                disabled={questionIndex === totalQ - 1}
              >
                <Text style={[styles.analysisNavBtnText, (questionIndex === totalQ - 1) && styles.disabledBtnText]}>Next</Text>
                <Ionicons name="arrow-forward" size={16} color={(questionIndex === totalQ - 1) ? "#9CA3AF" : theme.primary} style={{marginLeft: 6}} />
              </ScaleButton>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={60} color={theme.subtext} />
            <Text style={styles.emptyText}>No questions found in this category</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  if (isLoading && !quizData) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error && !quizData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <ScaleButton
          style={styles.retryButton}
          activeOpacity={0.8}
          scaleTo={0.95}
          onPress={fetchQuizDetails}
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

          <Text style={styles.heroTitle}>Quiz Details</Text>
          <Text style={styles.heroSubtitle}>Track your progress all quizzes with detailed insights</Text>
        </Animated.View>

        {/* Global Wrapper for everything below hero */}
        <View style={styles.contentWrapper}>
          
          {/* Main Info Card */}
          <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.infoCard}>
             <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                   <Text style={styles.infoTitle}>{quizData?.title || 'Quiz Result'}</Text>
                   
                   <View style={styles.infoMetaRow}>
                     <Ionicons name="calendar-outline" size={12} color={theme.subtext} style={{marginRight: 6}} />
                     <Text style={styles.infoMetaText}>Completed: {quizData?.attempt?.submittedAt ? new Date(quizData.attempt.submittedAt).toLocaleDateString() : 'N/A'}</Text>
                   </View>
                   <View style={styles.infoMetaRow}>
                     <Ionicons name="time-outline" size={12} color={theme.subtext} style={{marginRight: 6}} />
                     <Text style={styles.infoMetaText}>Time Taken: {formatSeconds(quizData?.attempt?.timeTakenSeconds)}</Text>
                   </View>
                   <View style={styles.infoMetaRow}>
                     <Ionicons name="help-circle-outline" size={12} color={theme.subtext} style={{marginRight: 6}} />
                     <Text style={styles.infoMetaText}>{quizData?.totalQuestions ?? quizData?.statistics?.totalQuestions ?? 0} Questions | {quizData?.timeLimit ?? 0} Minutes Allowed</Text>
                   </View>
                </View>

                <View style={styles.infoRight}>
                   <View style={styles.scoreRing}>
                     <Text style={styles.ringValue}>{quizData?.percentage ?? 0}%</Text>
                     <Text style={styles.ringLabel}>Score</Text>
                   </View>
                   <Text style={styles.correctAnswersText}>{quizData?.correctCount ?? 0}/{quizData?.totalQuestions ?? 0} Correct</Text>
                </View>
             </View>
          </Animated.View>

          {/* Unified Global Details Card */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.detailsGlobalCard}>
            
            {/* Tabs Section */}
            <View style={styles.tabsContainer}>
               <ScaleButton activeOpacity={0.8} scaleTo={0.98} style={[styles.tabItem, activeTab === 'performance' && styles.tabActiveBg]} onPress={() => setActiveTab('performance')}>
                 <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]} numberOfLines={1}>Performance Analysis</Text>
               </ScaleButton>
               <ScaleButton activeOpacity={0.8} scaleTo={0.98} style={[styles.tabItem, activeTab === 'question' && styles.tabActiveBg]} onPress={() => setActiveTab('question')}>
                 <Text style={[styles.tabText, activeTab === 'question' && styles.tabTextActive]} numberOfLines={1}>Question Review</Text>
               </ScaleButton>
            </View>

            {/* Render Section */}
            {activeTab === 'performance' ? renderPerformanceTab() : renderQuestionTab()}

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
    paddingTop: 10,
    paddingBottom: 36, 
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 12, color: '#E0E7FF', fontWeight: '400' },

  contentWrapper: { paddingHorizontal: 16, marginTop: 16 },

  infoCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderTopWidth: 4,
    borderTopColor: theme.primary, 
    borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20, 
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLeft: { flex: 1, paddingRight: 10 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 8 },
  infoMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoMetaText: { fontSize: 11, color: theme.subtext, fontWeight: '500' },

  infoRight: { alignItems: 'center', width: 80 },
  scoreRing: {
    width: 56, height: 56, borderRadius: 28, 
    borderWidth: 4, borderColor: '#818CF8', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  ringValue: { fontSize: 14, fontWeight: '800', color: theme.text },
  ringLabel: { fontSize: 10, fontWeight: '600', color: theme.text },
  correctAnswersText: { fontSize: 9, fontWeight: '700', color: theme.text, textAlign: 'center' },

  detailsGlobalCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: theme.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },

  tabsContainer: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border, 
    backgroundColor: theme.surface 
  },
  tabItem: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center', 
    paddingVertical: 14,
    backgroundColor: theme.surface,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingHorizontal: 4,
  },
  tabActiveBg: { 
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', 
    borderBottomColor: theme.primary 
  },
  tabText: { fontSize: 11, fontWeight: '600', color: theme.subtext, textAlign: 'center' },
  tabTextActive: { color: theme.primary },

  detailsGlobalBody: { padding: 16, gap: 16, backgroundColor: theme.surface },

  sectionCard: {
    backgroundColor: theme.surface, 
    borderRadius: 8,
    padding: 16, 
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border, 
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.primary, marginBottom: 12 },
  
  tableWrapper: { width: '100%' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  scoreLabel: { fontSize: 12, color: theme.text, fontWeight: '500' },
  scoreValue: { fontSize: 12, fontWeight: '500', color: theme.text },
  diffWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  diffText: { fontSize: 12, fontWeight: '500' },

  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 2,
  },
  activeFilterPill: {
    backgroundColor: theme.primary, 
    borderRadius: 20,
    paddingHorizontal: 10, 
    paddingVertical: 6,   
  },
  activeFilterPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  inactiveFilterPill: {
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', 
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inactiveFilterPillText: {
    color: theme.subtext,
    fontSize: 10,
    fontWeight: '600',
  },

  questionCard: {
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
    lineHeight: 18,
    marginRight: 10,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  optionsBox: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
  },
  optionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionLetterBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: 10,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 12,
    color: theme.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  analysisNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  analysisNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  analysisNavBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },
  analysisPageIndicator: {
    paddingHorizontal: 12,
  },
  analysisPageText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.subtext,
  },

  disabledBtn: {
    opacity: 0.5,
  },
  disabledBtnText: {
    color: theme.subtext,
  },
  emptyText: {
    fontSize: 14,
    color: theme.subtext,
    marginTop: 8,
  },

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
});

export default QuizDetailsScreen;
