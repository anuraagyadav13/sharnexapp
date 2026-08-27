import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';
import Svg, { Circle, G } from 'react-native-svg';

type PerformanceScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Performance'>;

interface Props {
  navigation: PerformanceScreenNavigationProp;
}

const PerformanceScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [performance, setPerformance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedQuizMonth, setSelectedQuizMonth] = useState<string>('');
  const [selectedAttMonth, setSelectedAttMonth] = useState<string>('');

  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      setInsightsError(null);

      const parsedData = await studentService.getInsights();

      if (
        !parsedData ||
        (!parsedData.strengths?.length &&
          !parsedData.improve?.length &&
          !parsedData.actions?.length &&
          !parsedData.motivation)
      ) {
        throw new Error("Couldn't generate insights right now, try again");
      }

      setInsights(parsedData);
    } catch (err: any) {
      console.error('[AI Insights] failed:', err?.response || err?.message || err);
      setInsightsError(err?.message || "Couldn't generate insights right now, try again");
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchPerformance = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const res = await studentService.getPerformance();
      const rawData = res?.normalized?.data ?? res?.data ?? res;

      setPerformance(rawData || {});
    } catch (err: any) {
      console.error('[Performance] failed to fetch student performance:', err?.response || err?.message || err);
      setError(err?.message || 'Failed to load performance data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchPerformance(true);
    if (insights) {
      fetchInsights();
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [authState.user?.id]);

  const summary = performance?.summary || {};
  const overallScore = summary?.overallScore != null ? Math.round(summary.overallScore) : 0;
  const quizAverage = summary?.quizAverage != null ? Math.round(summary.quizAverage) : 0;
  const attendancePercentage = summary?.attendancePercentage != null ? Math.round(summary.attendancePercentage) : 0;
  const quizCompletionRate = summary?.quizCompletionRate != null ? Math.round(summary.quizCompletionRate) : 0;
  const quizzesAttempted = summary?.quizzesAttempted ?? 0;
  const quizzesAvailable = summary?.quizzesAvailable ?? 0;

  const subjectsList = Array.isArray(performance?.subjects) ? performance.subjects : [];
  const monthlyTrendList: Array<{ month: string; score: number }> = Array.isArray(performance?.monthlyTrend)
    ? performance.monthlyTrend
    : [];
  const attendanceByMonthList: Array<{
    month: string;
    present: number;
    late: number;
    absent: number;
    excused: number;
  }> = Array.isArray(performance?.attendanceByMonth) ? performance.attendanceByMonth : [];

  // Default active month selections when data loads
  useEffect(() => {
    if (monthlyTrendList.length > 0 && !selectedQuizMonth) {
      setSelectedQuizMonth(monthlyTrendList[monthlyTrendList.length - 1].month);
    }
    if (attendanceByMonthList.length > 0 && !selectedAttMonth) {
      setSelectedAttMonth(attendanceByMonthList[attendanceByMonthList.length - 1].month);
    }
  }, [performance]);

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
          onPress={() => fetchPerformance()}
          scaleTo={0.95}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </ScaleButton>
      </View>
    );
  }

  // Monthly Quiz Trend active calculations
  const activeQuizIdx = monthlyTrendList.findIndex(m => m.month === selectedQuizMonth);
  const currentQuizItem = activeQuizIdx >= 0 ? monthlyTrendList[activeQuizIdx] : monthlyTrendList[monthlyTrendList.length - 1];
  const prevQuizItem = activeQuizIdx > 0 ? monthlyTrendList[activeQuizIdx - 1] : null;
  const quizDiff = currentQuizItem && prevQuizItem ? Math.round(currentQuizItem.score - prevQuizItem.score) : 0;
  const currentQuizScore = currentQuizItem?.score != null ? Math.round(currentQuizItem.score) : 0;

  // Attendance Breakdown active calculations
  const activeAttIdx = attendanceByMonthList.findIndex(m => m.month === selectedAttMonth);
  const currentAttItem = activeAttIdx >= 0 ? attendanceByMonthList[activeAttIdx] : attendanceByMonthList[attendanceByMonthList.length - 1];
  const prevAttItem = activeAttIdx > 0 ? attendanceByMonthList[activeAttIdx - 1] : null;
  const attDiff = currentAttItem && prevAttItem ? Math.round(currentAttItem.present - prevAttItem.present) : 0;

  const presentPct = currentAttItem?.present != null ? Math.round(currentAttItem.present) : 0;
  const latePct = currentAttItem?.late != null ? Math.round(currentAttItem.late) : 0;
  const absentPct = currentAttItem?.absent != null ? Math.round(currentAttItem.absent) : 0;
  const excusedPct = currentAttItem?.excused != null ? Math.round(currentAttItem.excused) : 0;

  // SVG Circumference for donut calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.292

  // Attendance donut segment calculations
  const totalAttSum = (presentPct + latePct + absentPct + excusedPct) || 100;
  const pNorm = (presentPct / totalAttSum) * 100;
  const lNorm = (latePct / totalAttSum) * 100;
  const aNorm = (absentPct / totalAttSum) * 100;
  const eNorm = (excusedPct / totalAttSum) * 100;

  const pDash = (circumference * pNorm) / 100;
  const lDash = (circumference * lNorm) / 100;
  const aDash = (circumference * aNorm) / 100;
  const eDash = (circumference * eNorm) / 100;

  const pOffset = 0;
  const lOffset = -pDash;
  const aOffset = -(pDash + lDash);
  const eOffset = -(pDash + lDash + aDash);

  const insightsData = insights?.insights || insights?.data || insights || {};
  const strengthsList: string[] = Array.isArray(insightsData?.strengths)
    ? insightsData.strengths
    : Array.isArray(insightsData?.strengthsList)
    ? insightsData.strengthsList
    : typeof insightsData?.strengths === 'string'
    ? [insightsData.strengths]
    : [];

  const improveList: string[] = Array.isArray(insightsData?.improve)
    ? insightsData.improve
    : Array.isArray(insightsData?.areasToImprove)
    ? insightsData.areasToImprove
    : Array.isArray(insightsData?.improvements)
    ? insightsData.improvements
    : typeof insightsData?.improve === 'string'
    ? [insightsData.improve]
    : [];

  const actionsList: string[] = Array.isArray(insightsData?.actions)
    ? insightsData.actions
    : Array.isArray(insightsData?.recommendedActions)
    ? insightsData.recommendedActions
    : Array.isArray(insightsData?.tips)
    ? insightsData.tips
    : typeof insightsData?.actions === 'string'
    ? [insightsData.actions]
    : [];

  const motivationText: string = typeof insightsData?.motivation === 'string'
    ? insightsData.motivation
    : typeof insightsData?.quote === 'string'
    ? insightsData.quote
    : typeof insightsData?.motivationalQuote === 'string'
    ? insightsData.motivationalQuote
    : '';

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {/* Global Header (DO NOT MODIFY) */}
      <StudentHeader 
        title="Performance"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        
        {/* 1. Page Title & Subtitle */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
          <Text style={styles.pageTitle}>Performance Trend</Text>
          <Text style={styles.pageSubtitle}>Track your academic progress over time</Text>
        </Animated.View>

        {/* 2. Stat Cards Row (2x2 Grid) */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.statGridContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Overall Score</Text>
            <Text style={[styles.statValue, { color: theme.primary }]}>{overallScore}%</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Quiz Average</Text>
            <Text style={[styles.statValue, { color: '#9333EA' }]}>{quizAverage}%</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Attendance</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{attendancePercentage}%</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Quiz Completion</Text>
            <Text style={[styles.statValue, { color: '#F97316' }]}>{quizCompletionRate}%</Text>
            <Text style={styles.statSubText}>{quizzesAttempted} of {quizzesAvailable} quizzes</Text>
          </View>
        </Animated.View>

        {/* 3. Subject-wise Performance Card */}
        <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.card}>
          <Text style={styles.cardHeader}>Subject-wise Performance</Text>
          <View style={styles.cardDivider} />

          {subjectsList.length > 0 ? (
            subjectsList.map((subj: any, sIdx: number) => {
              const hasScore = subj.averageScore != null;
              const scoreVal = hasScore ? Math.round(subj.averageScore) : 0;
              const attempts = subj.attempts ?? 0;

              return (
                <View key={sIdx} style={styles.subjectItemContainer}>
                  <View style={styles.subjectRowBetween}>
                    <Text style={styles.subjectName}>{subj.subject || 'Subject'}</Text>
                    {hasScore && (
                      <Text style={styles.subjectScoreText}>{scoreVal}%</Text>
                    )}
                  </View>

                  {!hasScore ? (
                    <Text style={styles.noAttemptText}>
                      No attempts yet — take a quiz to see your score here
                    </Text>
                  ) : (
                    <>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, scoreVal))}%`, backgroundColor: theme.primary }]} />
                      </View>
                      <Text style={styles.subjectAttemptCaption}>
                        {attempts} {attempts === 1 ? 'attempt' : 'attempts'}
                      </Text>
                    </>
                  )}
                </View>
              );
            })
          ) : (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.subtext, fontSize: 13 }}>No subject performance tracked yet</Text>
            </View>
          )}
        </Animated.View>

        {/* 4. Monthly Quiz Trend Card */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.card}>
          <View style={styles.cardRowBetween}>
            <Text style={styles.cardHeader}>Monthly Quiz Trend</Text>
            {prevQuizItem && (
              <View style={[styles.badgePill, quizDiff >= 0 ? styles.badgeSuccess : styles.badgeDanger]}>
                <Ionicons 
                  name={quizDiff >= 0 ? "arrow-up" : "trending-down"} 
                  size={12} 
                  color={quizDiff >= 0 ? "#10B981" : "#EF4444"} 
                />
                <Text style={[styles.badgeText, { color: quizDiff >= 0 ? "#10B981" : "#EF4444" }]}>
                  {quizDiff >= 0 ? `+${quizDiff}%` : `${quizDiff}%`} vs prev month
                </Text>
              </View>
            )}
          </View>
          <View style={styles.cardDivider} />

          {/* Month Selector Chips */}
          {monthlyTrendList.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScrollContainer}>
              {monthlyTrendList.map((m, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.chip, (selectedQuizMonth === m.month || (!selectedQuizMonth && idx === monthlyTrendList.length - 1)) && styles.chipActive]}
                  onPress={() => setSelectedQuizMonth(m.month)}
                >
                  <Text style={[styles.chipText, (selectedQuizMonth === m.month || (!selectedQuizMonth && idx === monthlyTrendList.length - 1)) && styles.chipTextActive]}>
                    {m.month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Donut Chart (react-native-svg) */}
          <View style={styles.chartCenterContainer}>
            <View style={styles.donutWrapper}>
              <Svg width={140} height={140} viewBox="0 0 140 140">
                <G rotation="-90" origin="70, 70">
                  {/* Background Circle */}
                  <Circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={isDarkMode ? '#334155' : '#E2E8F0'}
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Progress Circle */}
                  <Circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={theme.primary}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (circumference * Math.min(100, Math.max(0, currentQuizScore))) / 100}
                    strokeLinecap="round"
                  />
                </G>
              </Svg>
              <View style={styles.donutCenterOverlay}>
                <Text style={styles.donutScoreText}>{currentQuizScore}%</Text>
                <Text style={styles.donutMonthText}>{currentQuizItem?.month || ''}</Text>
              </View>
            </View>
          </View>

          {/* Monthly Score Indicator List */}
          <View style={styles.monthScoresRow}>
            {monthlyTrendList.map((m, idx) => {
              const isSelected = selectedQuizMonth === m.month || (!selectedQuizMonth && idx === monthlyTrendList.length - 1);
              return (
                <View key={idx} style={[styles.monthScoreBadge, isSelected && styles.monthScoreBadgeActive]}>
                  <View style={[styles.dotIndicator, { backgroundColor: isSelected ? theme.primary : theme.subtext }]} />
                  <Text style={[styles.monthScoreLabel, isSelected && { color: theme.primary, fontWeight: '700' }]}>
                    {m.month}: {Math.round(m.score)}%
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* 5. Attendance Breakdown Card */}
        <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.card}>
          <View style={styles.cardRowBetween}>
            <Text style={styles.cardHeader}>Attendance Breakdown</Text>
            {prevAttItem && (
              <View style={[styles.badgePill, attDiff >= 0 ? styles.badgeSuccess : styles.badgeDanger]}>
                <Ionicons 
                  name={attDiff >= 0 ? "arrow-up" : "trending-down"} 
                  size={12} 
                  color={attDiff >= 0 ? "#10B981" : "#EF4444"} 
                />
                <Text style={[styles.badgeText, { color: attDiff >= 0 ? "#10B981" : "#EF4444" }]}>
                  {attDiff >= 0 ? `+${attDiff}%` : `${attDiff}%`} vs prev month
                </Text>
              </View>
            )}
          </View>
          <View style={styles.cardDivider} />

          {/* Month Selector Chips */}
          {attendanceByMonthList.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScrollContainer}>
              {attendanceByMonthList.map((m, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.chip, (selectedAttMonth === m.month || (!selectedAttMonth && idx === attendanceByMonthList.length - 1)) && styles.chipActive]}
                  onPress={() => setSelectedAttMonth(m.month)}
                >
                  <Text style={[styles.chipText, (selectedAttMonth === m.month || (!selectedAttMonth && idx === attendanceByMonthList.length - 1)) && styles.chipTextActive]}>
                    {m.month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* 4 Stat Tiles */}
          <View style={styles.attGridContainer}>
            <View style={styles.attGridTile}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.attTileVal}>{presentPct}%</Text>
              <Text style={styles.attTileLbl}>Present</Text>
            </View>

            <View style={styles.attGridTile}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.attTileVal}>{latePct}%</Text>
              <Text style={styles.attTileLbl}>Late</Text>
            </View>

            <View style={styles.attGridTile}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.attTileVal}>{absentPct}%</Text>
              <Text style={styles.attTileLbl}>Absent</Text>
            </View>

            <View style={styles.attGridTile}>
              <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
              <Text style={styles.attTileVal}>{excusedPct}%</Text>
              <Text style={styles.attTileLbl}>Excused</Text>
            </View>
          </View>

          {/* Multi-Segment Donut Chart & Legend */}
          <View style={styles.attChartRow}>
            <View style={styles.donutWrapper}>
              <Svg width={140} height={140} viewBox="0 0 140 140">
                <G rotation="-90" origin="70, 70">
                  {/* Segment 1: Present (Green) */}
                  {pNorm > 0 && (
                    <Circle
                      cx="70"
                      cy="70"
                      r={radius}
                      stroke="#10B981"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray={`${pDash} ${circumference}`}
                      strokeDashoffset={pOffset}
                    />
                  )}
                  {/* Segment 2: Late (Orange) */}
                  {lNorm > 0 && (
                    <Circle
                      cx="70"
                      cy="70"
                      r={radius}
                      stroke="#F59E0B"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray={`${lDash} ${circumference}`}
                      strokeDashoffset={lOffset}
                    />
                  )}
                  {/* Segment 3: Absent (Red) */}
                  {aNorm > 0 && (
                    <Circle
                      cx="70"
                      cy="70"
                      r={radius}
                      stroke="#EF4444"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray={`${aDash} ${circumference}`}
                      strokeDashoffset={aOffset}
                    />
                  )}
                  {/* Segment 4: Excused (Gray) */}
                  {eNorm > 0 && (
                    <Circle
                      cx="70"
                      cy="70"
                      r={radius}
                      stroke="#6B7280"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray={`${eDash} ${circumference}`}
                      strokeDashoffset={eOffset}
                    />
                  )}
                </G>
              </Svg>
              <View style={styles.donutCenterOverlay}>
                <Text style={styles.donutScoreText}>{presentPct}%</Text>
                <Text style={styles.donutMonthText}>Present</Text>
              </View>
            </View>

            {/* Legend List */}
            <View style={styles.legendList}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendLabel}>Present:</Text>
                <Text style={styles.legendValue}>{presentPct}%</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendLabel}>Late:</Text>
                <Text style={styles.legendValue}>{latePct}%</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendLabel}>Absent:</Text>
                <Text style={styles.legendValue}>{absentPct}%</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
                <Text style={styles.legendLabel}>Excused:</Text>
                <Text style={styles.legendValue}>{excusedPct}%</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* 6. AI Insights Card */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.card}>
          <View style={styles.cardRowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={18} color="#9333EA" />
              <Text style={styles.cardHeader}>AI Insights</Text>
            </View>

            <TouchableOpacity
              style={[styles.aiBtn, insightsLoading && { opacity: 0.7 }]}
              onPress={fetchInsights}
              disabled={insightsLoading}
            >
              {insightsLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.aiBtnText}>
                  {insights ? "Refresh insights" : "Get AI insights"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.cardDivider} />

          {/* Placeholder State */}
          {!insights && !insightsLoading && !insightsError && (
            <Text style={styles.aiPlaceholderText}>
              Tap "Get AI insights" for a personalized breakdown of your strengths, areas to improve, and study tips based on your quizzes, attendance, and completion rate.
            </Text>
          )}

          {/* Error State */}
          {insightsError && !insightsLoading && (
            <View style={styles.aiErrorBox}>
              <Ionicons name="warning-outline" size={18} color="#EF4444" />
              <Text style={styles.aiErrorText}>{insightsError}</Text>
            </View>
          )}

          {/* Success State */}
          {insights && !insightsLoading && (
            <View style={styles.insightsContent}>
              {/* Section 1: Strengths */}
              {strengthsList.length > 0 && (
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: '#10B981' }]}>🏆 Strengths</Text>
                  {strengthsList.map((item, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Section 2: Improve */}
              {improveList.length > 0 && (
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: '#F97316' }]}>🎯 Areas to Improve</Text>
                  {improveList.map((item, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Section 3: Recommended Actions */}
              {actionsList.length > 0 && (
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: '#3B82F6' }]}>💡 Recommended Actions</Text>
                  {actionsList.map((item, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Section 4: Motivation */}
              {!!motivationText && (
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: '#9333EA' }]}>🚀 Motivation</Text>
                  <View style={styles.motivationBox}>
                    <Text style={styles.motivationText}>"{motivationText}"</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </Animated.View>

      </ScrollView>

      {/* Global Navigation Drawer (DO NOT MODIFY) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: theme.primary, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: theme.subtext, fontWeight: '500' },

  card: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeader: { fontSize: 15, fontWeight: '800', color: theme.text },
  cardDivider: { height: 1, backgroundColor: theme.border, width: '100%', marginBottom: 16 },

  // Stat Grid
  statGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: { fontSize: 11, fontWeight: '600', color: theme.subtext, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  statSubText: { fontSize: 10, color: theme.subtext, fontWeight: '500' },

  // Subject Items
  subjectItemContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  subjectRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectName: { fontSize: 14, fontWeight: '700', color: theme.text },
  subjectScoreText: { fontSize: 14, fontWeight: '800', color: theme.primary },
  noAttemptText: { fontSize: 12, fontStyle: 'italic', color: theme.subtext, marginTop: 4 },
  subjectAttemptCaption: { fontSize: 11, color: theme.subtext, fontWeight: '500', marginTop: 6 },

  progressBarBg: { height: 7, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', borderRadius: 4, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  // Chips
  chipScrollContainer: { gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: theme.subtext },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  // Badges
  badgePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  badgeSuccess: { backgroundColor: '#D1FAE5' },
  badgeDanger: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 10, fontWeight: '700' },

  // Donut Charts
  chartCenterContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  donutWrapper: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  donutCenterOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutScoreText: { fontSize: 22, fontWeight: '900', color: theme.text },
  donutMonthText: { fontSize: 11, fontWeight: '600', color: theme.subtext },

  // Month Scores Indicator List
  monthScoresRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 },
  monthScoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' },
  monthScoreBadgeActive: { borderWidth: 1, borderColor: theme.primary },
  dotIndicator: { width: 6, height: 6, borderRadius: 3 },
  monthScoreLabel: { fontSize: 11, color: theme.subtext, fontWeight: '500' },

  // Attendance Grid & Chart Layout
  attGridContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginVertical: 12 },
  attGridTile: { flex: 1, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderRadius: 8, padding: 10, alignItems: 'center' },
  attTileVal: { fontSize: 14, fontWeight: '800', color: theme.text, marginTop: 4 },
  attTileLbl: { fontSize: 10, color: theme.subtext, fontWeight: '500' },

  attChartRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 12 },
  legendList: { gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, color: theme.subtext, fontWeight: '500' },
  legendValue: { fontSize: 12, color: theme.text, fontWeight: '700' },

  // AI Insights Styles
  aiBtn: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  aiPlaceholderText: {
    fontSize: 12,
    color: theme.subtext,
    lineHeight: 18,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  aiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDarkMode ? '#311414' : '#FEE2E2',
    padding: 10,
    borderRadius: 8,
  },
  aiErrorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  insightsContent: {
    gap: 14,
    marginTop: 4,
  },
  insightSection: {
    gap: 6,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 12,
    color: theme.text,
    fontWeight: 'bold',
  },
  bulletText: {
    fontSize: 12,
    color: theme.text,
    flex: 1,
    lineHeight: 18,
  },
  motivationBox: {
    backgroundColor: isDarkMode ? '#1E1B4B' : '#F3E8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#9333EA',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  motivationText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: theme.text,
    lineHeight: 18,
    fontWeight: '600',
  },
});

export default PerformanceScreen;
