import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type QuizResultNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuizResult'>;

interface Props {
  navigation: QuizResultNavigationProp;
  route: any; // Add route for params
}

const QuizResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { authState } = useAuth();
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizResult = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const quizId = route?.params?.quizId;
        if (!quizId) {
          setError('Quiz ID not found');
          return;
        }

        const res = await apiClient.get(ENDPOINTS.STUDENT.QUIZ_RESULT(quizId));
        const responseData = res.normalized?.data ?? null;
        setQuizResult(responseData);
      } catch (err: any) {
        console.error('Failed to fetch quiz result:', err);
        setError('Failed to load quiz results. Please try again.');
        setQuizResult(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuizResult();
  }, [route?.params?.quizId]);

  const OptionRow = ({ letter, text, state }: { letter: string, text: string, state: 'normal' | 'correct-selected' | 'right-answer' | 'wrong-selected' }) => {
    let boxStyle: any = styles.optionItem;
    let circleStyle: any = styles.optionLetterBox;
    let circleTextStyle: any = styles.optionLetterText;
    let mainTextStyle: any = styles.optionTextMain;

    if (state === 'correct-selected') {
      boxStyle = [styles.optionItem, { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' }];
      circleStyle = [styles.optionLetterBox, { backgroundColor: '#4F46E5' }];
      circleTextStyle = [styles.optionLetterText, { color: '#FFFFFF' }];
      mainTextStyle = [styles.optionTextMain, { color: '#4F46E5', fontWeight: '700' }];
    } else if (state === 'right-answer') {
      boxStyle = [styles.optionItem, { borderColor: '#10B981', backgroundColor: '#ECFDF5' }];
      circleStyle = [styles.optionLetterBox, { backgroundColor: '#10B981' }];
      circleTextStyle = [styles.optionLetterText, { color: '#FFFFFF' }];
      mainTextStyle = [styles.optionTextMain, { color: '#10B981', fontWeight: '700' }];
    } else if (state === 'wrong-selected') {
      boxStyle = [styles.optionItem, { borderColor: '#F43F5E', backgroundColor: '#FFF1F2' }];
      circleStyle = [styles.optionLetterBox, { backgroundColor: '#F43F5E' }];
      circleTextStyle = [styles.optionLetterText, { color: '#FFFFFF' }];
      mainTextStyle = [styles.optionTextMain, { color: '#F43F5E', fontWeight: '700' }];
    }

    return (
      <View style={boxStyle}>
        <View style={circleStyle}>
          <Text style={circleTextStyle}>{letter}</Text>
        </View>
        <Text style={mainTextStyle}>{text}</Text>
      </View>
    );
  };

  if (isLoading && !quizResult) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error && !quizResult) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' }}>Unable to Load Quiz Results</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>{error}</Text>
        <ScaleButton
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4F46E5', borderRadius: 8 }}
          onPress={() => {
            setError(null);
            setIsLoading(true);
            const fetchQuizResult = async () => {
              try {
                const quizId = route?.params?.quizId;
                if (!quizId) {
                  setError('Quiz ID not found');
                  return;
                }
                const res = await apiClient.get(ENDPOINTS.STUDENT.QUIZ_RESULT(quizId));
                const responseData = res.normalized?.data ?? null;
                setQuizResult(responseData);
              } catch (err: any) {
                setError('Failed to load quiz results. Please try again.');
              } finally {
                setIsLoading(false);
              }
            };
            fetchQuizResult();
          }}
          scaleTo={0.95}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </ScaleButton>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
         <ScaleButton style={styles.menuHandle} onPress={() => navigation.goBack()}>
           <Ionicons name="arrow-back" size={22} color="#1F2937" />
         </ScaleButton>
         <Text style={styles.headerTitle} numberOfLines={1}>Welcome back, {authState.user?.name?.split(' ')[0] || 'Student'}</Text>
         <View style={styles.headerRight}>
           <Ionicons name="notifications-outline" size={20} color="#1F2937" />
           <Ionicons name="settings-outline" size={20} color="#1F2937" />
           <Ionicons name="moon-outline" size={20} color="#1F2937" />
           <View style={styles.avatar}>
             <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'S'}</Text>
           </View>
         </View>
      </View>

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
          <Text style={styles.heroTitle}>{quizResult?.quiz?.title || 'Quiz Result'}</Text>
          <View style={styles.heroRow}>
             <Text style={styles.heroSubtitle}>Subject: {quizResult?.quiz?.subject || 'N/A'}</Text>
             <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>Quiz Completed</Text>
             </View>
          </View>
        </Animated.View>

        {/* Global Wrapper for everything below hero */}
        <View style={styles.contentWrapper}>
          
          {/* Summary Stats Card */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.summaryCard}>
            
            {/* Circle Progress */}
            <View style={styles.ringWrapper}>
               <View style={styles.scoreRing}>
                 <Text style={styles.scoreNumberMain}>{quizResult?.statistics?.percentage || 0}%</Text>
                 <Text style={styles.scoreNumberSub}>Score</Text>
               </View>
            </View>
            
            <View style={styles.performancePill}>
               <Text style={styles.performancePillText}>
                 {(quizResult?.statistics?.percentage || 0) >= 80 ? 'Outstanding' : (quizResult?.statistics?.percentage || 0) >= 50 ? 'Good' : 'Needs Review'}
               </Text>
            </View>

            <View style={styles.statsGridRow}>
               <View style={styles.statsGridCol}>
                  <Text style={[styles.statsGridVal, {color: '#05D59A'}]}>{quizResult?.statistics?.correctCount || 0}/{quizResult?.statistics?.totalQuestions || 0}</Text>
                  <Text style={styles.statsGridLbl}>Correct Answers</Text>
               </View>
               <View style={styles.statsGridCol}>
                  <Text style={[styles.statsGridVal, {color: '#F43F5E'}]}>{quizResult?.statistics?.incorrectCount || 0}/{quizResult?.statistics?.totalQuestions || 0}</Text>
                  <Text style={styles.statsGridLbl}>Wrong Answers</Text>
               </View>
            </View>
            <View style={styles.statsGridRow}>
               <View style={styles.statsGridCol}>
                  <Text style={[styles.statsGridVal, {color: '#3B82F6'}]}>
                    {quizResult?.attempt?.timeTakenSeconds ? `${Math.floor(quizResult.attempt.timeTakenSeconds / 60)}m ${quizResult.attempt.timeTakenSeconds % 60}s` : 'N/A'}
                  </Text>
                  <Text style={styles.statsGridLbl}>Time Used</Text>
               </View>
               <View style={styles.statsGridCol}>
                  <Text style={[styles.statsGridVal, {color: '#9333EA'}]}>{quizResult?.attempt?.submittedAt ? new Date(quizResult.attempt.submittedAt).toLocaleDateString() : 'N/A'}</Text>
                  <Text style={styles.statsGridLbl}>Date Completed</Text>
               </View>
            </View>

          </Animated.View>

          {/* Question Review Section Header */}
          <Animated.View entering={FadeIn.delay(150)} style={styles.sectionTitleRow}>
            <Ionicons name="help-circle" size={18} color="#3B82F6" />
            <Text style={styles.sectionTitleText}>Question Review</Text>
          </Animated.View>

          {/* Dynamic Question Cards */}
          {(quizResult?.questionReview || []).map((question: any, index: number) => (
            <Animated.View 
              key={question.id || index}
              entering={FadeInUp.delay(200 + index * 50).springify()} 
              style={[styles.questionCard, question.isCorrect ? styles.cardBorderCorrect : styles.cardBorderIncorrect]}
            >
              <View style={styles.questionHeader}>
                <View style={styles.questionNumberCircle}>
                  <Text style={styles.questionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.questionMainText}>
                  {question.questionText || 'Question text not available'}
                </Text>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>{question.marks || 0}/{question.maxMarks || 1} Points</Text>
                </View>
              </View>

              <View style={styles.optionsList}>
                {(question.options || []).map((option: any, optIndex: number) => {
                  let state: 'normal' | 'correct-selected' | 'right-answer' | 'wrong-selected' = 'normal';
                  const optText = typeof option === 'string' ? option : option.text || option.id;
                  
                  if (question.submittedAnswer === optText && question.isCorrect) state = 'correct-selected';
                  else if (question.correctAnswer === optText) state = 'right-answer';
                  else if (question.submittedAnswer === optText && !question.isCorrect) state = 'wrong-selected';
                  
                  return (
                    <OptionRow 
                      key={optIndex} 
                      letter={String.fromCharCode(65 + optIndex)} 
                      text={optText} 
                      state={state} 
                    />
                  );
                })}
              </View>

              {/* Result Tag */}
              <View style={[styles.resultFeedbackPill, {backgroundColor: question.isCorrect ? '#D1FAE5' : '#FFE4E6'}]}>
                 <Ionicons name={question.isCorrect ? "checkmark-circle" : "close-circle"} size={14} color={question.isCorrect ? "#10B981" : "#F43F5E"} style={{marginRight: 4}} />
                 <Text style={[styles.resultFeedbackText, {color: question.isCorrect ? '#10B981' : '#F43F5E'}]}>
                   Your Answer: {question.submittedAnswer || 'Skipped'} - {question.isCorrect ? 'Correct!' : 'Incorrect!'}
                 </Text>
              </View>
            </Animated.View>
          ))}

          {(quizResult?.questionReview || []).length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="help-circle-outline" size={60} color="#E5E7EB" />
              <Text style={styles.emptyText}>No question details available</Text>
            </View>
          )}

          {/* Action Footer Container */}
          <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.actionFooter}>
             
             <View style={styles.splitButtonsRow}>
                <ScaleButton style={[styles.footerBtnHalf, {backgroundColor: '#4F46E5'}]} activeOpacity={0.8} scaleTo={0.95} onPress={() => navigation.navigate('QuizDetails', { quizId: route?.params?.quizId })}>
                   <Ionicons name="bar-chart-outline" size={16} color="#FFFFFF" style={{marginRight: 6}} />
                   <Text style={styles.footerBtnHalfText}>View Analytics</Text>
                </ScaleButton>

                <ScaleButton style={[styles.footerBtnHalf, {backgroundColor: '#9333EA'}]} activeOpacity={0.8} scaleTo={0.95}>
                   <Ionicons name="download-outline" size={16} color="#FFFFFF" style={{marginRight: 6}} />
                   <Text style={styles.footerBtnHalfText}>Download Results</Text>
                </ScaleButton>
             </View>

             <ScaleButton style={styles.backBtnFull} activeOpacity={0.8} scaleTo={0.96} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={18} color="#4F46E5" style={{marginRight: 8}} />
                <Text style={styles.backBtnFullText}>Back To Quiz</Text>
             </ScaleButton>
             
          </Animated.View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAF9F9' }, 
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 12,
    backgroundColor: '#FAFAFF', 
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: { fontSize: 14, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#A855F7', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  heroContainer: {
    backgroundColor: '#4E5EEE', 
    paddingHorizontal: 20,
    paddingTop: 24, 
    paddingBottom: 36, 
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 12, letterSpacing: -0.5 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroSubtitle: { fontSize: 11, color: '#E0E7FF', fontWeight: '500' },
  completedBadge: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  completedBadgeText: { color: '#4E5EEE', fontSize: 10, fontWeight: '700' },

  contentWrapper: { paddingHorizontal: 16, marginTop: 16 }, 

  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, paddingBottom: 24,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  ringWrapper: { marginBottom: 12 },
  scoreRing: { 
    width: 86, height: 86, borderRadius: 43, borderWidth: 6, borderColor: '#05D59A',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' 
  },
  scoreNumberMain: { fontSize: 18, fontWeight: '800', color: '#111827' },
  scoreNumberSub: { fontSize: 10, fontWeight: '500', color: '#6B7280' },
  
  performancePill: { backgroundColor: '#05D59A', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, marginBottom: 24 },
  performancePillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  statsGridRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10, gap: 10 },
  statsGridCol: { 
    flex: 1, alignItems: 'center', justifyContent: 'center', 
    backgroundColor: '#FAF9F9', borderWidth: 1, borderColor: '#F3F4F6',
    borderRadius: 8, paddingVertical: 14 
  },
  statsGridVal: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  statsGridLbl: { fontSize: 9, color: '#6B7280', fontWeight: '500' },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitleText: { fontSize: 16, fontWeight: '700', color: '#4F46E5', marginLeft: 8 },

  questionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9',
    borderLeftWidth: 4, 
  },
  cardBorderCorrect: { borderLeftColor: '#05D59A' },
  cardBorderIncorrect: { borderLeftColor: '#F43F5E' },

  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  questionNumberCircle: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#4F46E5',
    justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2,
  },
  questionNumberText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  questionMainText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#111827', lineHeight: 18, marginRight: 8 },
  pointsBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  pointsBadgeText: { color: '#10B981', fontSize: 8, fontWeight: '800' },

  optionsList: { gap: 8, marginBottom: 16 },
  optionItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF'
  },
  
  optionLetterBox: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  optionLetterText: { fontSize: 10, fontWeight: '700', color: '#4B5563' },
  optionTextMain: { fontSize: 12, color: '#4B5563', fontWeight: '500' },

  resultFeedbackPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  resultFeedbackText: { fontSize: 10, fontWeight: '700' },

  actionFooter: { marginTop: 12, gap: 12 },
  splitButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  footerBtnHalf: {
     flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
     borderRadius: 6, paddingVertical: 12,
     shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  footerBtnHalfText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  backBtnFull: {
     flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
     borderWidth: 1, borderColor: '#4F46E5', borderRadius: 6, paddingVertical: 12, backgroundColor: '#FFFFFF'
  },
  backBtnFullText: { color: '#4F46E5', fontSize: 14, fontWeight: '700' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },

});

export default QuizResultScreen;
