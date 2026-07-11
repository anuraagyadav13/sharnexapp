import React, { useEffect } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type PerformanceScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Performance'>;

interface Props {
  navigation: PerformanceScreenNavigationProp;
}

const PerformanceScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [performance, setPerformance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Resolve absolute Student ID
        const meRes = await studentService.getMe();
        const meData = meRes.normalized?.data;
        const studentId = meData?.student?.id || '';

        if (!studentId) throw new Error('Student record ID not found in /auth/me');

        // const [dashRes, perfRes, gradesRes] = await Promise.all([
        //   studentService.getDashboard(studentId),
        //   studentService.getPerformance(studentId),
        //   studentService.getGrades(),
        // ]);
        console.log('[Performance] studentId:', studentId);

const dashRes = await studentService.getDashboard(studentId);
const dashData = dashRes.normalized?.data || dashRes.data;

setPerformance({
  ...dashData,
  performanceMetrics: dashData?.performanceMetrics || {},
  grades: dashData?.grades || {},
});
      } catch (err: any) {
        console.error('[Performance] failed:', err?.response || err?.message || err);
        setError('Failed to load performance data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPerformance();
  }, [authState.user?.id]);

  if (isLoading && !performance) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error && !performance) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, textAlign: 'center' }}>Unable to Load Performance</Text>
        <Text style={{ fontSize: 13, color: theme.subtext, textAlign: 'center', marginTop: 8 }}>{error}</Text>
        <ScaleButton
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.primary, borderRadius: 8 }}
          onPress={() => {
            setError(null);
            setIsLoading(true);
            const fetchPerformance = async () => {
              try {
                const profileRes = await studentService.getMe();
                const studentId = profileRes.data?.id;
                if (!studentId) throw new Error('Student ID not found');
                const res = await studentService.getDashboard(studentId);
                setPerformance(res.data?.data || res.data?.stats || res.data);
              } catch (err: any) {
                setError('Failed to load performance data. Please try again.');
              } finally {
                setIsLoading(false);
              }
            };
            fetchPerformance();
          }}
          scaleTo={0.95}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </ScaleButton>
      </View>
    );
  }

  const dashStats = performance || {};
  const perfMetrics = performance?.performanceMetrics || {};
  
  const attendanceRate = dashStats.attendance?.percentage || 0;
  const assignmentRate = dashStats.stats?.assignmentRate || 75; // Fallback for missing backend field
  // 
  const quizAttempts = Array.isArray(dashStats.quizzes?.attempts)
  ? dashStats.quizzes.attempts
  : [];

const scoredQuizAttempts = quizAttempts.filter(
  (attempt: any) => typeof attempt.score === 'number',
);

const quizRate =
  scoredQuizAttempts.length > 0
    ? Math.round(
        scoredQuizAttempts.reduce(
          (sum: number, attempt: any) => sum + attempt.score,
          0,
        ) / scoredQuizAttempts.length,
      )
    : 0;
  const trendStatus = perfMetrics.trend || 'improving';

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {/* Global Header */}
      <StudentHeader 
        title="Performance"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Page Titles */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <Text style={styles.pageTitle}>Performance</Text>
           <Text style={styles.pageSubtitle}>Analyze your academic growth</Text>
        </Animated.View>

        {/* Card 1: Performance Overview */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.card}>
           <Text style={styles.cardHeader}>Performance Overview</Text>
           <View style={styles.cardDivider} />
           <View style={styles.gridContainer}>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#9333EA'}]}>{quizRate}%</Text>
                 <Text style={styles.gridLbl}>Avg Quiz Score</Text>
              </View>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#F97316'}]}>#{performance?.rank || 'N/A'}</Text>
                 <Text style={styles.gridLbl}>Class Rank</Text>
              </View>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#F59E0B'}]}>{assignmentRate}%</Text>
                 <Text style={styles.gridLbl}>Assignment Rate</Text>
              </View>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#3B82F6'}]}>{attendanceRate}%</Text>
                 <Text style={styles.gridLbl}>Attendance</Text>
              </View>
           </View>
        </Animated.View>

        {/* Card 2: Overall Performance */}
        <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.card}>
            <View style={styles.cardRowBetween}>
               <Text style={styles.cardHeader}>Overall Performance</Text>
               <View style={[styles.improvingPill, trendStatus !== 'improving' && { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                  <Ionicons 
                    name={trendStatus === 'improving' ? "arrow-up" : "trending-down"} 
                    size={12} 
                    color={trendStatus === 'improving' ? "#10B981" : "#EF4444"} 
                  />
                  <Text style={[styles.improvingText, trendStatus !== 'improving' && { color: '#EF4444' }]}>
                    {trendStatus === 'improving' ? 'Improving' : 'Attention Needed'}
                  </Text>
               </View>
            </View>
           <View style={styles.cardDivider} />

           <View style={styles.centerBlock}>
             <Text style={styles.hugePercent}>{Math.round((quizRate + assignmentRate + attendanceRate) / 3)}%</Text>
             <Text style={styles.hugeSubtitle}>Cumulative Average</Text>
           </View>

           <View style={styles.progressSection}>
             <View style={styles.progressRow}>
               <Text style={styles.progressLbl}>Syllabus Covered</Text>
               <Text style={styles.progressVal}>85%</Text>
             </View>
             <View style={styles.progressBarBg}>
               <View style={[styles.progressBarFill, { width: '85%', backgroundColor: '#F97316' }]} />
             </View>
           </View>
        </Animated.View>

        {/* Card 3: Attendance Details */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.card}>
           <Text style={styles.cardHeader}>Attendance Details</Text>
           <View style={styles.cardDivider} />
           
           <View style={styles.centerBlock}>
             <Text style={[styles.hugePercent, {color: '#000', textShadowRadius: 0, textShadowColor: 'transparent'}]}>{attendanceRate}%</Text>
             <Text style={styles.hugeSubtitle}>Current Attendance Rate</Text>
           </View>

           <View style={styles.gridContainer}>
               <View style={styles.gridBox}>
                  <Text style={[styles.gridVal, {color: '#10B981'}]}>{dashStats.attendance?.present || 0}</Text>
                  <Text style={styles.gridLbl}>Days Present</Text>
               </View>
               <View style={styles.gridBox}>
                  <Text style={[styles.gridVal, {color: '#EF4444'}]}>
                    {(dashStats.attendance?.total || 0) - (dashStats.attendance?.present || 0)}
                  </Text>
                  <Text style={styles.gridLbl}>Days Absent</Text>
               </View>
           </View>
        </Animated.View>

        {/* Card 4: Subject Performance */}
        <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.card}>
           <Text style={styles.cardHeader}>Subject Performance</Text>
           <View style={styles.cardDivider} />
           
           <View style={styles.subjectsContainer}>
             <ScrollView 
               style={styles.subjectsScroll} 
               showsVerticalScrollIndicator={false}
               nestedScrollEnabled={true}
             >
               {(performance?.grades?.subjects || []).length > 0 ? (
                 performance.grades.subjects.map((subj: any, sIdx: number) => {
                   const scoreVal = subj.percentage || (subj.score && subj.total && Math.round((subj.score/subj.total)*100)) || 0;
                   const colorIdx = sIdx % 4;
                   const colors = ['#F97316', '#3B82F6', '#9333EA', '#10B981'];
                   
                   return (
                     <View key={sIdx} style={[styles.subjectBox, { borderLeftColor: colors[colorIdx], marginBottom: 12 }]}>
                       <View style={styles.subjectRowBetween}>
                          <Text style={styles.subjectName}>{subj.name}</Text>
                          <Text style={[styles.subjectGrade, { color: colors[colorIdx] }]}>{subj.grade || 'N/A'}</Text>
                       </View>
                       
                       <View style={[styles.progressBarBg, {marginBottom: 16}]}>
                         <View style={[styles.progressBarFill, { width: `${scoreVal}%`, backgroundColor: colors[colorIdx] }]} />
                       </View>
                       
                       <View style={styles.subjectRowBetween2}>
                          <Text style={styles.subjectSubText}>Score: {scoreVal}%</Text>
                          <Text style={styles.subjectSubText}>Rank: {subj.rank || `${sIdx + 1}${sIdx === 0 ? 'st' : sIdx === 1 ? 'nd' : sIdx === 2 ? 'rd' : 'th'}`}</Text>
                       </View>
                       
                       <View style={[styles.improvingPill, {paddingLeft: 0, marginTop: 4}]}>
                          <Ionicons 
                            name={scoreVal >= 75 ? "arrow-up" : "trending-down"} 
                            size={14} 
                            color={scoreVal >= 75 ? "#10B981" : "#EF4444"} 
                          />
                          <Text style={[styles.improvingText, {marginLeft: 4, color: scoreVal >= 75 ? '#10B981' : '#EF4444'}]}>
                            {scoreVal >= 75 ? 'Improved by' : 'Down by'} {Math.abs(scoreVal - 85)}%
                          </Text>
                       </View>
                     </View>
                   );
                 })
               ) : (
                 <View style={{ padding: 20, alignItems: 'center' }}>
                   <Text style={{ color: '#6B7280', fontSize: 12 }}>No subject data tracked for this period</Text>
                 </View>
               )}
             </ScrollView>
           </View>

           {(performance?.grades?.subjects || []).length > 2 && (
             <View style={styles.scrollMoreRow}>
               <Ionicons name="chevron-down" size={14} color="#6B7280" />
               <Text style={styles.scrollMoreText}>Scroll for more subjects</Text>
             </View>
           )}
        </Animated.View>

        {/* Card 5: Academic Growth Analysis */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.card}>
           <Text style={styles.cardHeader}>Academic Growth Analysis</Text>
           <View style={styles.cardDivider} />
           
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              <View style={[styles.chartContainer, { minWidth: (perfMetrics.monthlyScores || []).length * 80 }]}>
                {(perfMetrics.monthlyScores || []).map((item: any, idx: number) => (
                  <View key={idx} style={styles.chartCol}>
                    <Text style={styles.chartTopLabel}>{item.score}%</Text>
                     <View style={styles.chartBarWrapper}>
                        <View style={{height: `${100 - item.score}%`, backgroundColor: isDarkMode ? '#334155' : '#F3F4F6'}} />
                        <View style={{height: `${item.score}%`, backgroundColor: theme.primary}} />
                     </View>
                    <Text style={styles.chartBotLabel}>{item.month}</Text>
                  </View>
                ))}
                {(!perfMetrics.monthlyScores || perfMetrics.monthlyScores.length === 0) && (
                  <Text style={{ textAlign: 'center', width: '100%', color: '#6B7280', fontSize: 12 }}>
                    Analyzing historical data for trends...
                  </Text>
                )}
              </View>
           </ScrollView>
        </Animated.View>

      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
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
    zIndex: 10,
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: theme.primary, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: theme.subtext, fontWeight: '500' },

  card: {
    backgroundColor: theme.surface, borderRadius: 12, padding: 16, marginHorizontal: 20,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    marginBottom: 16, borderWidth: 1, borderColor: theme.border
  },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeader: { fontSize: 14, fontWeight: '800', color: theme.text, marginBottom: 12 },
  cardDivider: { height: 1, backgroundColor: theme.border, width: '100%', marginBottom: 16 },

  improvingPill: { flexDirection: 'row', alignItems: 'center' },
  improvingText: { fontSize: 11, fontWeight: '700', color: '#10B981', marginLeft: 2 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  gridBox: { width: '48%', backgroundColor: theme.isDarkMode ? '#1E293B' : '#F8FAFC', borderRadius: 8, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  gridVal: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 6 },
  gridLbl: { fontSize: 10, color: theme.subtext, fontWeight: '500' },

  centerBlock: { alignItems: 'center', marginBottom: 16, marginTop: 4 },
  hugePercent: { 
    fontSize: 34, fontWeight: '900', color: theme.primary, marginBottom: 4,
    textShadowColor: theme.isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 8
  },
  hugeSubtitle: { fontSize: 11, color: theme.subtext, fontWeight: '600' },

  progressSection: { marginTop: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLbl: { fontSize: 10, fontWeight: '600', color: theme.text },
  progressVal: { fontSize: 10, fontWeight: '700', color: theme.text },
  progressBarBg: { height: 6, backgroundColor: theme.isDarkMode ? '#334155' : '#E2E8F0', borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  subjectBox: {
    backgroundColor: theme.isDarkMode ? '#1E293B' : '#F8FAFC', borderRadius: 12, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#F97316'
  },
  subjectRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subjectName: { fontSize: 14, fontWeight: '800', color: theme.text },
  subjectGrade: { fontSize: 18, fontWeight: '800', color: '#10B981' },
  subjectRowBetween2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subjectSubText: { fontSize: 11, color: theme.subtext, fontWeight: '500' },

  scrollMoreRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 4 },
  scrollMoreText: { fontSize: 10, color: theme.subtext, fontWeight: '500' },

  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  chartCol: { alignItems: 'center' },
  chartTopLabel: { fontSize: 13, fontWeight: '800', color: theme.text, marginBottom: 12 },
  chartBotLabel: { fontSize: 11, fontWeight: '600', color: theme.text, marginTop: 12 },
  chartBarWrapper: { width: 42, height: 110, borderRadius: 6, overflow: 'hidden' },
  subjectsContainer: { height: 280, marginTop: 10 },
  subjectsScroll: { flex: 1 },
});

export default PerformanceScreen;
