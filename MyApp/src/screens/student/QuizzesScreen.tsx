import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type QuizzesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Quizzes'>;

interface Props {
  navigation: QuizzesNavigationProp;
}

type FilterType = 'all' | 'upcoming' | 'open' | 'completed' | 'grades';

const QuizzesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState({
    upcoming: 0,
    open: 0,
    completed: 0,
    grades: 0,
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async (isRef = false) => {
    try {
      if (isRef) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const res = await studentService.getQuizzes();
      const data = res.normalized?.data ?? res.data ?? null;
      const rawQuizzes = Array.isArray(data)
        ? data
        : Array.isArray(data?.quizzes)
          ? data.quizzes
          : [];

      // Filter out draft quizzes (enforce student view constraint)
      const studentQuizzes = rawQuizzes
        .map((quiz: any) => ({
          ...quiz,
          derivedStatus:
            quiz.derivedStatus ||
            quiz.status ||
            (quiz.hasAttempt ? 'completed' : 'open'),
        }))
        .filter((q: any) => q.derivedStatus !== 'draft');

      setQuizzes(studentQuizzes);

      setStats({
        upcoming: studentQuizzes.filter((q: any) => q.derivedStatus === 'upcoming').length,
        open: studentQuizzes.filter((q: any) => q.derivedStatus === 'open').length,
        completed: studentQuizzes.filter((q: any) => q.hasAttempt || q.derivedStatus === 'completed').length,
        grades: studentQuizzes.filter((q: any) => (q.hasAttempt || q.derivedStatus === 'completed') && (q.score !== undefined || q.percentage !== undefined)).length,
      });
    } catch (err: any) {
      console.error('[Quizzes] failed:', err?.response || err?.message || err);
      setError('Failed to load quizzes. Please try again.');
      setQuizzes([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchQuizzes(true);
  };

  const handleFilterToggle = (filter: FilterType) => {
    setActiveFilter(prev => (prev === filter ? 'all' : filter));
  };

  const getFilteredQuizzes = () => {
    switch (activeFilter) {
      case 'upcoming':
        return quizzes.filter(q => q.derivedStatus === 'upcoming');
      case 'open':
        return quizzes.filter(q => q.derivedStatus === 'open');
      case 'completed':
        return quizzes.filter(q => q.hasAttempt || q.derivedStatus === 'completed');
      case 'grades':
        return quizzes.filter(q => q.hasAttempt || q.derivedStatus === 'completed');
      case 'all':
      default:
        return quizzes;
    }
  };

  const filteredQuizzes = getFilteredQuizzes();

  const SummaryCard = ({
    delay,
    number,
    label,
    borderColor,
    filterType,
  }: {
    delay: number;
    number: string;
    label: string;
    borderColor: string;
    filterType: FilterType;
  }) => {
    const isSelected = activeFilter === filterType;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleFilterToggle(filterType)}
        style={styles.summaryCardWrapper}
      >
        <Animated.View
          entering={FadeInUp.delay(delay).springify()}
          style={[
            styles.summaryCard,
            { borderTopColor: borderColor },
            isSelected && { backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF', borderColor: theme.primary },
          ]}
        >
          <Text style={[styles.summaryNumber, isSelected && { color: theme.primary }]}>{number}</Text>
          <Text style={[styles.summaryLabel, isSelected && { color: theme.primary, fontWeight: '700' }]}>{label}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return { text: 'Active Now', color: theme.success, bg: isDarkMode ? '#065F4630' : '#ECFDF5' };
      case 'upcoming':
        return { text: 'Upcoming', color: theme.warning, bg: isDarkMode ? '#78350F30' : '#FEF3C7' };
      case 'completed':
        return { text: 'Completed', color: theme.primary, bg: isDarkMode ? '#312E81' : '#EEF2FF' };
      case 'expired':
        return { text: 'Expired', color: theme.subtext, bg: isDarkMode ? '#334155' : '#F1F5F9' };
      default:
        return { text: status, color: theme.subtext, bg: theme.surface };
    }
  };

  const handleQuizAction = (quiz: any) => {
    if (quiz.derivedStatus === 'open') {
      navigation.navigate('StartQuiz', { quizId: quiz.id });
    } else if (quiz.hasAttempt || quiz.derivedStatus === 'completed') {
      navigation.navigate('QuizResult', { quizId: quiz.id, timestamp: Date.now() });
    } else {
      navigation.navigate('ViewQuizDetail', { quizId: quiz.id });
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      <StudentHeader
        title="Quizzes"
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
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Quizzes & Tests</Text>
          <Text style={styles.pageSubtitle}>Take quiz and view test results</Text>
        </View>

        {/* Interactive KPI Summary Cards */}
        <View style={styles.summaryGrid}>
          <SummaryCard
            delay={100}
            number={stats.upcoming.toString()}
            label="Upcoming Quizzes"
            borderColor={theme.warning}
            filterType="upcoming"
          />
          <SummaryCard
            delay={150}
            number={stats.open.toString()}
            label="Active Now"
            borderColor={theme.success}
            filterType="open"
          />
          <SummaryCard
            delay={200}
            number={stats.completed.toString()}
            label="Completed"
            borderColor={theme.primary}
            filterType="completed"
          />
          <SummaryCard
            delay={250}
            number={stats.grades.toString()}
            label="Grades"
            borderColor={theme.secondary}
            filterType="grades"
          />
        </View>

        {/* Active Filter Pill Bar */}
        <View style={styles.filterBarRow}>
          <Text style={styles.filterBarTitle}>
            {activeFilter === 'all'
              ? 'All Quizzes'
              : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Quizzes`}
            <Text style={styles.filterCount}> ({filteredQuizzes.length})</Text>
          </Text>
          {activeFilter !== 'all' && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveFilter('all')}
              style={styles.clearFilterBtn}
            >
              <Ionicons name="close-circle-outline" size={14} color={theme.primary} />
              <Text style={styles.clearFilterText}>Show All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quiz List Container */}
        <View style={styles.listsWrapper}>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={54} color={theme.danger} />
              <Text style={styles.emptyText}>{error}</Text>
              <ScaleButton style={styles.retryBtn} onPress={() => fetchQuizzes(false)} scaleTo={0.95}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </ScaleButton>
            </View>
          ) : filteredQuizzes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={54} color={theme.subtext} />
              <Text style={styles.emptyText}>No quizzes match the selected filter</Text>
            </View>
          ) : (
            filteredQuizzes.map((quiz, index) => {
              const badge = renderStatusBadge(quiz.derivedStatus);
              const questionCount = Array.isArray(quiz.questions) ? quiz.questions.length : (quiz.questionsCount || 0);
              const durationMinutes = quiz.timeLimit || quiz.duration || 0;
              const dateDisplay = quiz.startAt
                ? new Date(quiz.startAt).toLocaleDateString()
                : quiz.dueDate
                  ? new Date(quiz.dueDate).toLocaleDateString()
                  : 'Not scheduled';

              let actionText = 'View Details';
              let actionIcon = 'eye';
              let actionBg = theme.primary;
              let actionColor = '#FFFFFF';

              if (quiz.derivedStatus === 'open') {
                actionText = 'Start Quiz';
                actionIcon = 'play';
                actionBg = theme.success;
              } else if (quiz.hasAttempt || quiz.derivedStatus === 'completed') {
                actionText = 'View Result';
                actionIcon = 'bar-chart-outline';
                actionBg = theme.secondary;
              } else if (quiz.derivedStatus === 'expired') {
                actionText = 'Expired';
                actionIcon = 'lock-closed';
                actionBg = theme.border;
                actionColor = theme.subtext;
              }

              return (
                <Animated.View
                  key={quiz.id}
                  entering={FadeInUp.delay(100 + index * 50).springify()}
                  style={styles.quizCard}
                >
                  <View style={styles.quizCardTopRow}>
                    <Text style={styles.quizTitle} numberOfLines={1}>
                      {quiz.title}
                    </Text>
                    <View style={[styles.cardPill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.cardPillText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                  </View>

                  <Text style={styles.quizSubtitle} numberOfLines={2}>
                    {quiz.description || 'No description available'}
                  </Text>

                  <View style={styles.quizGrid}>
                    <View style={styles.quizGridCol}>
                      <MaterialCommunityIcons name="book-open-variant" size={14} color={theme.primary} />
                      <Text style={styles.quizGridText}>{quiz.subject || 'General'}</Text>
                    </View>
                    <View style={styles.quizGridCol}>
                      <Ionicons name="help-circle-outline" size={14} color={theme.primary} />
                      <Text style={styles.quizGridText}>{questionCount} Questions</Text>
                    </View>
                    <View style={styles.quizGridCol}>
                      <Ionicons name="calendar-outline" size={14} color={theme.primary} />
                      <Text style={styles.quizGridText}>{dateDisplay}</Text>
                    </View>
                    <View style={styles.quizGridCol}>
                      <Ionicons name="time-outline" size={14} color={theme.primary} />
                      <Text style={styles.quizGridText}>{durationMinutes} Mins</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <View style={styles.instructorProfile}>
                      <Ionicons name="person-outline" size={14} color={theme.subtext} style={{ marginRight: 6 }} />
                      <Text style={styles.instructorName}>{quiz.teacherName || 'Instructor'}</Text>
                    </View>
                    <ScaleButton
                      style={[styles.actionBtn, { backgroundColor: actionBg }]}
                      activeOpacity={0.8}
                      scaleTo={0.96}
                      onPress={() => handleQuizAction(quiz)}
                    >
                      <Ionicons name={actionIcon} size={14} color={actionColor} style={styles.btnIconLayout} />
                      <Text style={[styles.actionBtnText, { color: actionColor }]}>{actionText}</Text>
                    </ScaleButton>
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>

      </ScrollView>

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

  pageTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 10,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: theme.subtext,
    fontWeight: '500',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
    rowGap: 12,
  },
  summaryCardWrapper: {
    width: '48%',
  },
  summaryCard: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
    borderTopWidth: 3,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
    marginTop: 2,
  },

  filterBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  filterBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  filterCount: {
    color: theme.subtext,
    fontWeight: '500',
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFilterText: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },

  listsWrapper: {
    paddingHorizontal: 20,
    gap: 16,
  },

  quizCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  quizCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
  },
  cardPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
  },
  cardPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quizSubtitle: {
    fontSize: 13,
    color: theme.subtext,
    marginBottom: 16,
    fontWeight: '400',
  },

  quizGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    marginBottom: 16,
  },
  quizGridCol: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizGridText: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '400',
    marginLeft: 6,
  },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 12,
  },
  instructorProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  instructorName: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  btnIconLayout: {
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: theme.subtext,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default QuizzesScreen;
