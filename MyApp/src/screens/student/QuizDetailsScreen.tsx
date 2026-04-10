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
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Circle, G } from 'react-native-svg';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type QuizDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuizDetails'>;

interface Props {
  navigation: QuizDetailsNavigationProp;
  route: any; // Add route for params
}

const ScoreRow = ({ label, value, hideBorder = false, valueColor = '#111827' }: any) => (
  <View style={[styles.scoreRow, hideBorder && { borderBottomWidth: 0 }]}>
    <Text style={styles.scoreLabel}>{label}</Text>
    <Text style={[styles.scoreValue, { color: valueColor }]}>{value}</Text>
  </View>
);

const ImprovementRow = ({ label, valueText, diffSign, diffColor, hideBorder = false, iconName, labelColor = '#111827' }: any) => (
  <View style={[styles.scoreRow, hideBorder && { borderBottomWidth: 0 }]}>
    <Text style={[styles.scoreLabel, { color: labelColor }]}>{label}</Text>
    {diffSign ? (
      <View style={styles.diffWrapper}>
        <Text style={[styles.diffText, { color: diffColor }]}>{valueText}</Text>
        <Ionicons name={iconName} size={14} color={diffColor} />
      </View>
    ) : (
      <Text style={[styles.scoreValue, { color: '#000000', fontWeight: '500' }]}>{valueText}</Text>
    )}
  </View>
);

const TopicRow = ({ title, percent, color }: any) => (
  <View style={styles.topicRow}>
    <View style={styles.topicTextRow}>
       <Text style={styles.topicName}>{title}</Text>
       <Text style={styles.topicPercent}>{percent}%</Text>
    </View>
    <View style={styles.topicBarTrack}>
       <View style={[styles.topicBarFill, { width: `${percent}%`, backgroundColor: color }]} />
    </View>
  </View>
);

const LegendItem = ({ color, label }: any) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendSquare, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const QuestionCard = ({ number, question, status, options }: any) => {
  const isCorrect = status === 'correct';
  const isSkipped = status === 'skipped';
  const cardBorderColor = isCorrect ? '#10B981' : (isSkipped ? '#9CA3AF' : '#EF4444');
  const pillBg = isCorrect ? '#DCFCE7' : (isSkipped ? '#F3F4F6' : '#FEE2E2'); 
  const pillColor = isCorrect ? '#10B981' : (isSkipped ? '#6B7280' : '#EF4444');

  return (
    <View style={styles.questionCard}>
      {/* Absolute left border to avoid React Native curved border artifacts */}
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
          let bg = '#FFFFFF';
          let border = '#E5E7EB';
          let letterBg = '#F3F4F6';
          let letterColor = '#111827';

          if (opt.state === 'correct') {
            bg = '#DCFCE7';
            border = '#10B981';
            letterBg = '#10B981';
            letterColor = '#FFFFFF';
          } else if (opt.state === 'incorrect') {
            bg = '#FEE2E2';
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

const QuizDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState('topic');
  const [quizData, setQuizData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [topicQuestionIndex, setTopicQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const quizId = route?.params?.quizId;
        if (!quizId) {
          setError('Quiz ID not found');
          return;
        }

        const res = await apiClient.get(ENDPOINTS.STUDENT.QUIZ_DETAILS(quizId));
        const responseData = res.normalized?.data ?? null;
        setQuizData(responseData);
      } catch (err: any) {
        console.error('Failed to fetch quiz details:', err);
        setError('Failed to load quiz details. Please try again.');
        setQuizData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuizDetails();
  }, [route?.params?.quizId]); 

  useEffect(() => {
    const fetchQuizAnalysis = async () => {
      if (activeTab !== 'topic' || !!analysisData) return;
      
      try {
        setIsAnalysisLoading(true);
        const quizId = route?.params?.quizId;
        if (!quizId) return;

        const res = await apiClient.get(ENDPOINTS.STUDENT.QUIZ_ANALYSIS(quizId));
        const data = res.normalized?.data;
        if (data) {
          setAnalysisData(data);
        }
      } catch (err: any) {
        console.error('Failed to fetch quiz analysis:', err);
      } finally {
        setIsAnalysisLoading(false);
      }
    };
     fetchQuizAnalysis();
  }, [activeTab, route?.params?.quizId, analysisData]);

  const handleNextTopicQuestion = (total: number) => {
    if (topicQuestionIndex < total - 1) {
      setTopicQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevTopicQuestion = () => {
    if (topicQuestionIndex > 0) {
      setTopicQuestionIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    setTopicQuestionIndex(0);
  }, [selectedFilter]);

  const renderPerformanceTab = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.detailsGlobalBody}>
       <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          <View style={styles.tableWrapper}>
             <ScoreRow label="Your Score" value={`${quizData?.score || 0}/${quizData?.totalMarks || 100}`} />
             <ScoreRow label="Class Average" value={`${quizData?.classAverage || 0}%`} />
             <ScoreRow label="High Score" value={`${quizData?.highScore || 0}%`} />
             <ScoreRow label="Your Rank" value={`${quizData?.rank || 'N/A'}/${quizData?.totalStudents || 'N/A'}`} />
             <ScoreRow label="Percentage" value={`${quizData?.percentage || 0}%`} hideBorder={true} />
          </View>
       </View>

       <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Time Management</Text>
          <View style={styles.tableWrapper}>
             <ScoreRow label="Time Taken" value={quizData?.timeTaken || 'N/A'} />
             <ScoreRow label="Average Time" value={quizData?.averageTime || 'N/A'} />
             <ScoreRow label="Time Efficiency" value={`${quizData?.timeEfficiency || 0}%`} />
             <ScoreRow label="Questions/Minute" value={quizData?.questionsPerMinute || 'N/A'} hideBorder={true} />
          </View>
       </View>

       <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Improvement Areas</Text>
          <View style={styles.tableWrapper}>
             <ImprovementRow label="Compared to Last Quiz" valueText="+ 8%" diffSign={true} diffColor="#10B981" iconName="arrow-up" />
             <ImprovementRow label="Accuracy Improvement" labelColor="#10B981" valueText="+ 8%" diffSign={true} diffColor="#10B981" iconName="arrow-up" />
             <ImprovementRow label="Time Efficiency" labelColor="#10B981" valueText="+ 8%" diffSign={true} diffColor="#EF4444" iconName="arrow-down" />
             <ImprovementRow label="Recommendation" valueText="Focus on Linked List" hideBorder={true} />
          </View>
       </View>
    </Animated.View>
  );

  const renderQuestionTab = () => {

     return (
       <Animated.View entering={FadeIn.duration(300)} style={styles.detailsGlobalBody}>
           <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="pie-chart" size={16} color="#3B82F6" style={{marginRight: 6}} />
                <Text style={styles.sectionTitleNoMargin}>Topic Performance</Text>
              </View>
              <View style={styles.topicList}>
                 {(quizData?.topics || []).map((topic: any, index: number) => (
                   <TopicRow 
                     key={index}
                     title={topic.name || 'Topic'} 
                     percent={topic.percentage || 0} 
                     color={topic.color || '#3B82F6'} 
                   />
                 ))}
                 {(quizData?.topics || []).length === 0 && (
                   <Text style={{ textAlign: 'center', color: '#6B7280', padding: 20 }}>No topic data available</Text>
                 )}
              </View>
           </View>

           <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="scale-balance" size={16} color="#3B82F6" style={{marginRight: 6}} />
                <Text style={styles.sectionTitleNoMargin}>Strengths & Weaknesses</Text>
              </View>
              <View style={styles.strengthsWrapper}>
                 <View style={[styles.strengthBox, { backgroundColor: '#F0FDF4' }]}>
                    <View style={styles.strengthBoxHeader}>
                       <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                       <Text style={[styles.strengthBoxTitle, { color: '#10B981' }]}>Strong Areas</Text>
                    </View>
                    <Text style={styles.strengthBullet}>• Array operation and manipulation</Text>
                    <Text style={styles.strengthBullet}>• Stack and queue implementation</Text>
                    <Text style={styles.strengthBullet}>• Graph traversal algorithms</Text>
                    <Text style={styles.strengthBullet}>• Array operation and manipulation</Text>
                 </View>
                 <View style={[styles.strengthBox, { backgroundColor: '#FEF2F2' }]}>
                    <View style={styles.strengthBoxHeader}>
                       <Ionicons name="alert-circle" size={14} color="#EF4444" />
                       <Text style={[styles.strengthBoxTitle, { color: '#EF4444' }]}>Areas Needing Improvement</Text>
                    </View>
                    <Text style={styles.strengthBullet}>• Array operation and manipulation</Text>
                    <Text style={styles.strengthBullet}>• Stack and queue implementation</Text>
                    <Text style={styles.strengthBullet}>• Graph traversal algorithms</Text>
                    <Text style={styles.strengthBullet}>• Array operation and manipulation</Text>
                 </View>
              </View>
           </View>

           <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="school" size={16} color="#3B82F6" style={{marginRight: 6}} />
                <Text style={styles.sectionTitleNoMargin}>Study Recommendations</Text>
              </View>
              <View style={styles.recommendationsGrid}>
                 <View style={styles.recoCardWide}>
                    <Text style={[styles.recoPriority, { color: '#EF4444' }]}>Priority 1</Text>
                    <Text style={styles.recoText}>Practice Tree problems from textbook</Text>
                 </View>
                 <View style={styles.recoCardWide}>
                    <Text style={[styles.recoPriority, { color: '#F59E0B' }]}>Priority 2</Text>
                    <Text style={styles.recoText}>Practice Tree problems from textbook</Text>
                 </View>
                 <View style={styles.recoCardWide}>
                    <Text style={[styles.recoText, { marginTop: 12 }]}>Practice Tree problems from textbook</Text>
                 </View>
                 <View style={styles.recoCardWide}>
                    <Text style={[styles.recoText, { marginTop: 12 }]}>Practice Questions: 15 Linked list & Tree problems</Text>
                 </View>
              </View>
           </View>

           <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Topic Distribution</Text>
              <View style={styles.distributionWrapper}>
                 <View style={styles.chartContainer}>
                    <Svg height="120" width="120" viewBox="0 0 120 120">
                      <G transform="rotate(-90 60 60)">
                        {(quizData?.topicDistribution || []).map((segment: any, index: number) => {
                          const RADIUS = 40;
                          const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
                          const percent = segment.percentage / 100;
                          const dash = percent * CIRCUMFERENCE;
                          const offset = -(index > 0 ? (quizData.topicDistribution.slice(0, index).reduce((sum: number, s: any) => sum + (s.percentage / 100), 0) * CIRCUMFERENCE) : 0);
                          
                          return (
                            <Circle 
                              key={index} 
                              cx="60" cy="60" r={RADIUS} 
                              stroke={segment.color || '#3B82F6'} strokeWidth="24" fill="transparent" 
                              strokeDasharray={`${dash} ${CIRCUMFERENCE}`} 
                              strokeDashoffset={offset} 
                            />
                          );
                        })}
                      </G>
                    </Svg>
                 </View>
                 <View style={styles.chartLegend}>
                    {(quizData?.topicDistribution || []).map((segment: any, index: number) => (
                      <LegendItem key={index} color={segment.color || '#3B82F6'} label={segment.name || 'Topic'} />
                    ))}
                    {(quizData?.topicDistribution || []).length === 0 && (
                      <Text style={{ textAlign: 'center', color: '#6B7280', padding: 20 }}>No distribution data</Text>
                    )}
                 </View>
              </View>
           </View>
       </Animated.View>
     );
  };

  const renderTopicTab = () => {
    const questionsToDisplay = analysisData && analysisData[selectedFilter] ? analysisData[selectedFilter] : [];
    const currentQuestion = questionsToDisplay[topicQuestionIndex];
    const totalQuestions = questionsToDisplay.length;
    
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
            All ({analysisData?.all?.length || 0})
          </Text>
        </ScaleButton>
        
        <ScaleButton 
          activeOpacity={0.8} 
          style={selectedFilter === 'correct' ? styles.activeFilterPill : styles.inactiveFilterPill}
          onPress={() => setSelectedFilter('correct')}
        >
          <Text style={selectedFilter === 'correct' ? styles.activeFilterPillText : styles.inactiveFilterPillText}>
            Correct ({analysisData?.correct?.length || 0})
          </Text>
        </ScaleButton>

        <ScaleButton 
          activeOpacity={0.8} 
          style={selectedFilter === 'incorrect' ? styles.activeFilterPill : styles.inactiveFilterPill}
          onPress={() => setSelectedFilter('incorrect')}
        >
          <Text style={selectedFilter === 'incorrect' ? styles.activeFilterPillText : styles.inactiveFilterPillText}>
            Incorrect ({analysisData?.incorrect?.length || 0})
          </Text>
        </ScaleButton>

        <ScaleButton 
          activeOpacity={0.8} 
          style={selectedFilter === 'skipped' ? styles.activeFilterPill : styles.inactiveFilterPill}
          onPress={() => setSelectedFilter('skipped')}
        >
          <Text style={selectedFilter === 'skipped' ? styles.activeFilterPillText : styles.inactiveFilterPillText}>
            Skipped ({analysisData?.skipped?.length || 0})
          </Text>
        </ScaleButton>
      </View>

      {/* Question Viewing Area */}
      {isAnalysisLoading ? (
        <ActivityIndicator size="small" color="#4F46E5" style={{ marginTop: 20 }} />
      ) : (
        <>
          {currentQuestion ? (
            <>
              <QuestionCard 
                key={currentQuestion.id || topicQuestionIndex}
                number={topicQuestionIndex + 1} 
                question={currentQuestion.text || 'Question text not available'} 
                status={currentQuestion.status || 'unknown'}
                options={currentQuestion.options || []} 
              />

              {/* Navigation Buttons Row */}
              <View style={styles.analysisNavRow}>
                <ScaleButton
                  style={[styles.analysisNavBtn, topicQuestionIndex === 0 && styles.disabledBtn]}
                  onPress={handlePrevTopicQuestion}
                  disabled={topicQuestionIndex === 0}
                >
                  <Ionicons name="arrow-back" size={16} color={topicQuestionIndex === 0 ? "#9CA3AF" : "#4F46E5"} style={{marginRight: 6}} />
                  <Text style={[styles.analysisNavBtnText, topicQuestionIndex === 0 && styles.disabledBtnText]}>Previous</Text>
                </ScaleButton>

                <View style={styles.analysisPageIndicator}>
                   <Text style={styles.analysisPageText}>{topicQuestionIndex + 1} / {totalQuestions}</Text>
                </View>

                <ScaleButton
                  style={[styles.analysisNavBtn, (topicQuestionIndex === totalQuestions - 1) && styles.disabledBtn]}
                  onPress={() => handleNextTopicQuestion(totalQuestions)}
                  disabled={topicQuestionIndex === totalQuestions - 1}
                >
                  <Text style={[styles.analysisNavBtnText, (topicQuestionIndex === totalQuestions - 1) && styles.disabledBtnText]}>Next</Text>
                  <Ionicons name="arrow-forward" size={16} color={(topicQuestionIndex === totalQuestions - 1) ? "#9CA3AF" : "#4F46E5"} style={{marginLeft: 6}} />
                </ScaleButton>
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="help-circle-outline" size={60} color="#E5E7EB" />
              <Text style={styles.emptyText}>No questions found in this category</Text>
            </View>
          )}
        </>
      )}

    </Animated.View>
  )};

  if (isLoading && !quizData) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error && !quizData) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' }}>Unable to Load Quiz Details</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>{error}</Text>
        <ScaleButton
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4F46E5', borderRadius: 8 }}
          onPress={() => {
            setError(null);
            setIsLoading(true);
            const fetchQuizDetails = async () => {
              try {
                const quizId = route?.params?.quizId;
                if (!quizId) {
                  setError('Quiz ID not found');
                  return;
                }
                const res = await apiClient.get(ENDPOINTS.STUDENT.QUIZ_DETAILS(quizId));
                const responseData = res.normalized?.data ?? null;
                setQuizData(responseData);
              } catch (err: any) {
                setError('Failed to load quiz details. Please try again.');
              } finally {
                setIsLoading(false);
              }
            };
            fetchQuizDetails();
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
                     <Ionicons name="calendar-outline" size={12} color="#9CA3AF" style={{marginRight: 6}} />
                     <Text style={styles.infoMetaText}>Completed: {quizData?.completedAt ? new Date(quizData.completedAt).toLocaleDateString() : 'N/A'}</Text>
                   </View>
                   <View style={styles.infoMetaRow}>
                     <Ionicons name="time-outline" size={12} color="#9CA3AF" style={{marginRight: 6}} />
                     <Text style={styles.infoMetaText}>Time Taken: {quizData?.timeTaken || 'N/A'}</Text>
                   </View>
                   <View style={styles.infoMetaRow}>
                     <Ionicons name="help-circle-outline" size={12} color="#9CA3AF" style={{marginRight: 6}} />
                     <Text style={styles.infoMetaText}>{quizData?.totalQuestions || 0} Questions | {quizData?.duration || 0} Minutes Allowed</Text>
                   </View>
                </View>

                <View style={styles.infoRight}>
                   <View style={styles.scoreRing}>
                     <Text style={styles.ringValue}>{quizData?.percentage || 0}%</Text>
                     <Text style={styles.ringLabel}>Score</Text>
                   </View>
                   <Text style={styles.correctAnswersText}>{quizData?.correctAnswers || 0}/{quizData?.totalQuestions || 0} Correct Answers</Text>
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
                 <Text style={[styles.tabText, activeTab === 'question' && styles.tabTextActive]} numberOfLines={1}>Question Details</Text>
               </ScaleButton>
               <ScaleButton activeOpacity={0.8} scaleTo={0.98} style={[styles.tabItem, activeTab === 'topic' && styles.tabActiveBg]} onPress={() => setActiveTab('topic')}>
                 <Text style={[styles.tabText, activeTab === 'topic' && styles.tabTextActive]} numberOfLines={1}>Topic Analysis</Text>
               </ScaleButton>
            </View>

            {/* Render Section */}
            {activeTab === 'performance' ? renderPerformanceTab() : activeTab === 'question' ? renderQuestionTab() : renderTopicTab()}

          </Animated.View>

        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
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
    backgroundColor: '#4F46E5', 
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopWidth: 4,
    borderTopColor: '#3B82F6', 
    borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
    marginBottom: 20, 
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLeft: { flex: 1, marginRight: 10 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  infoMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoMetaText: { fontSize: 11, color: '#6B7280', fontWeight: '400' },

  infoRight: { alignItems: 'center', width: 80 },
  scoreRing: {
    width: 56, height: 56, borderRadius: 28, 
    borderWidth: 4, borderColor: '#818CF8', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  ringValue: { fontSize: 14, fontWeight: '800', color: '#111827' },
  ringLabel: { fontSize: 10, fontWeight: '600', color: '#111827' },
  correctAnswersText: { fontSize: 9, fontWeight: '700', color: '#111827', textAlign: 'center' },

  detailsGlobalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: '#E5E7EB',
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
    borderBottomColor: '#E5E7EB', 
    backgroundColor: '#FFFFFF' 
  },
  tabItem: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center', 
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingHorizontal: 4,
  },
  tabActiveBg: { 
    backgroundColor: '#F8FAFC', 
    borderBottomColor: '#3B82F6' 
  },
  tabText: { fontSize: 10, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  tabTextActive: { color: '#3B82F6' },

  detailsGlobalBody: { padding: 16, gap: 16, backgroundColor: '#FFFFFF' },

  sectionCard: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 8,
    padding: 16, 
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9', // crisp boundary
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#4F46E5', marginBottom: 12 },
  
  // Custom Topic Tab Styles
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitleNoMargin: { fontSize: 16, fontWeight: '700', color: '#4F46E5' },
  
  topicList: {},
  topicRow: { marginBottom: 12 },
  topicTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  topicName: { fontSize: 11, color: '#111827', fontWeight: '600' },
  topicPercent: { fontSize: 11, color: '#4F46E5', fontWeight: '700' },
  topicBarTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  topicBarFill: { height: '100%', borderRadius: 3 },

  strengthsWrapper: { flexDirection: 'row', gap: 12 },
  strengthBox: { flex: 1, borderRadius: 8, padding: 12 },
  strengthBoxHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  strengthBoxTitle: { fontSize: 11, fontWeight: '700' },
  strengthBullet: { fontSize: 9, color: '#6B7280', marginBottom: 4, lineHeight: 12 },

  recommendationsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  recoCardWide: { width: '31%', backgroundColor: '#EFF6FF', borderRadius: 6, padding: 10 },
  recoPriority: { fontSize: 9, fontWeight: '700', marginBottom: 4 },
  recoText: { fontSize: 10, color: '#4B5563', lineHeight: 14 },

  distributionWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, paddingVertical: 10 },
  chartContainer: { width: 120, height: 120 },
  chartLegend: { justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendSquare: { width: 8, height: 8, borderRadius: 2, marginRight: 8 },
  legendText: { fontSize: 10, color: '#4B5563', fontWeight: '500' },

  // Shared Styles
  tableWrapper: { width: '100%' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  scoreLabel: { fontSize: 12, color: '#111827', fontWeight: '500' },
  scoreValue: { fontSize: 12, fontWeight: '500', color: '#111827' },
  diffWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  diffText: { fontSize: 12, fontWeight: '500' },

  // NEW: Topic Tab Styles
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 2,
  },
  activeFilterPill: {
    backgroundColor: '#4F46E5', // Distinct blue-purple theme color matching SS2 exactly
    borderRadius: 20,
    paddingHorizontal: 10, 
    paddingVertical: 6,   
  },
  activeFilterPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  inactiveFilterPill: {
    backgroundColor: '#F1F5F9', // softer grey background matching SS2 exactly
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inactiveFilterPillText: {
    color: '#6B7280',
    fontSize: 9,
    fontWeight: '600',
  },

  questionCard: {
    backgroundColor: '#F8FAFC',
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
    color: '#111827',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  optionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
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
    color: '#111827',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  // Analysis Navigation Styles
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#4F46E5',
  },
  analysisPageIndicator: {
    paddingHorizontal: 12,
  },
  analysisPageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },

  // Disabled States
  disabledBtn: {
    opacity: 0.5,
  },
  disabledBtnText: {
    color: '#9CA3AF',
  },
});

export default QuizDetailsScreen;
