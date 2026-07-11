import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type QuizzesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Quizzes'>;

interface Props {
  navigation: QuizzesNavigationProp;
}

const QuizzesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();

  const SummaryCard = ({ delay, number, label, borderColor }: { delay: number, number: string, label: string, borderColor: string }) => {
    return (
      <Animated.View entering={FadeInUp.delay(delay).springify()} style={[styles.summaryCard, { borderTopColor: borderColor }]}>
        <Text style={styles.summaryNumber}>{number}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </Animated.View>
    );
  }

  const QuizCard = ({ 
    delay, headerTitle, headerBadge, badgeColor, badgeBg, 
    cardBadge, cardBadgeColor, cardBadgeBg, 
    actionBtnText, actionBtnColor, actionBtnBg, actionBtnBorder, actionBtnIcon, onAction,
    title, subtitle, subject, questionsCount, points, duration, teacherName
  }: any) => {
    return (
       <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.sectionContainer}>
          <View style={styles.sectionHeaderLine}>
             <Text style={styles.sectionTitle}>{headerTitle}</Text>
             {headerBadge && (
                <View style={[styles.smallBadge, { backgroundColor: badgeBg }]}>
                   <Text style={[styles.smallBadgeText, { color: badgeColor }]}>{headerBadge}</Text>
                </View>
             )}
          </View>

           <View style={styles.quizCard}>
              <View style={styles.quizCardTopRow}>
                 <Text style={styles.quizTitle} numberOfLines={1}>{title}</Text>
                 {cardBadge && (
                    <View style={[styles.cardPill, { backgroundColor: cardBadgeBg, marginLeft: 8 }]}>
                       <Text style={[styles.cardPillText, { color: cardBadgeColor }]}>{cardBadge}</Text>
                    </View>
                 )}
              </View>
              <Text style={styles.quizSubtitle} numberOfLines={2}>{subtitle || 'No description available'}</Text>

              <View style={styles.quizGrid}>
                 <View style={styles.quizGridCol}>
                    <MaterialCommunityIcons name="book" size={14} color={theme.primary} />
                    <Text style={styles.quizGridText}>{subject}</Text>
                 </View>
                 <View style={styles.quizGridCol}>
                    <Ionicons name="help-circle" size={14} color={theme.primary} />
                    <Text style={styles.quizGridText}>{questionsCount} Questions</Text>
                 </View>
                 <View style={styles.quizGridCol}>
                    <Ionicons name="star" size={14} color={theme.primary} />
                    <Text style={styles.quizGridText}>{points} Points</Text>
                 </View>
                 <View style={styles.quizGridCol}>
                    <Ionicons name="time" size={14} color={theme.primary} />
                    <Text style={styles.quizGridText}>{duration} Mins</Text>
                 </View>
              </View>

              <View style={styles.cardBottomRow}>
                 <View style={styles.instructorProfile}>
                    <Ionicons name="person" size={14} color={theme.subtext} style={{ marginRight: 6 }} />
                    <Text style={styles.instructorName}>{teacherName || 'Instructor'}</Text>
                 </View>
                 <ScaleButton 
                    style={[styles.actionBtn, { backgroundColor: actionBtnBg, borderWidth: actionBtnBorder ? 1 : 0, borderColor: actionBtnColor }]}
                    activeOpacity={0.8}
                    scaleTo={0.96}
                    onPress={onAction}
                 >
                    {actionBtnIcon && <Ionicons name={actionBtnIcon} size={14} color={actionBtnColor} style={styles.btnIconLayout} />}
                    <Text style={[styles.actionBtnText, { color: actionBtnColor }]}>{actionBtnText}</Text>
                 </ScaleButton>
              </View>
           </View>
       </Animated.View>
    );
  }

  console.log('[Quizzes] screen mounted');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    upcoming: 0,
    active: 0,
    completed: 0,
    grades: 0
  });

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await studentService.getQuizzes();
        const data = res.normalized?.data ?? null;
        const rawQuizzes = Array.isArray(data)
          ? data
          : Array.isArray(data?.quizzes)
            ? data.quizzes
            : [];

        const quizzesArray = rawQuizzes.map((quiz: any) => ({
          ...quiz,
          derivedStatus:
            quiz.derivedStatus ||
            quiz.status ||
            (quiz.hasAttempt ? 'completed' : 'available'),
        }));

        setQuizzes(quizzesArray);

        setStats({
          upcoming: quizzesArray.filter((q: any) => q.derivedStatus === 'upcoming' || q.derivedStatus === 'available').length,
          active: quizzesArray.filter((q: any) => q.derivedStatus === 'started' || q.derivedStatus === 'active' || q.derivedStatus === 'open').length,
          completed: quizzesArray.filter((q: any) => q.hasAttempt).length,
          grades: quizzesArray.filter((q: any) => q.hasAttempt && (q.score !== undefined || q.percentage !== undefined)).length
        });
      } catch (err: any) {
        console.error('[Quizzes] failed:', err?.response || err?.message || err);
        setError('Failed to load quizzes');
        setQuizzes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      <StudentHeader 
        title="Quizzes"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Quizzes</Text>
          <Text style={styles.pageSubtitle}>Take quiz and view test results</Text>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard delay={100} number={stats.upcoming.toString()} label="Upcoming Quizzes" borderColor="#3B82F6" />
          <SummaryCard delay={150} number={stats.active.toString()} label="Active Now" borderColor="#10B981" />
          <SummaryCard delay={200} number={stats.completed.toString()} label="Completed" borderColor="#F59E0B" />
          <SummaryCard delay={250} number={stats.grades.toString()} label="Grades" borderColor="#8B5CF6" />
        </View>

        <View style={styles.listsWrapper}>
           {isLoading ? (
             <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
           ) : error ? (
             <View style={styles.emptyContainer}>
               <Ionicons name="alert-circle" size={60} color="#EF4444" />
               <Text style={styles.emptyText}>{error}</Text>
             </View>
           ) : quizzes.length === 0 ? (
             <View style={styles.emptyContainer}>
               <Ionicons name="time-outline" size={60} color={theme.subtext} />
               <Text style={styles.emptyText}>No quizzes found</Text>
             </View>
           ) : (
             <>
               {quizzes.filter(q => q.derivedStatus === 'started' || q.derivedStatus === 'active').map((q, i) => (
                 <QuizCard 
                   key={q.id}
                   delay={300 + i * 50}
                   headerTitle="Active Quiz"
                   headerBadge="Started"
                   badgeColor="#10B981"
                   badgeBg="#ECFDF5"
                   title={q.title}
                   subtitle={q.description}
                   subject={q.subject}
                   questionsCount={q.questions?.length || 0}
                   points={q.totalMarks || 100}
                   duration={q.duration || q.timeLimit || 0}
                   teacherName={q.teacherName || 'Instructor'}
                   actionBtnText="Resume Quiz"
                   actionBtnColor="#FFFFFF"
                   actionBtnBg={theme.primary} 
                   actionBtnIcon="play-circle"
                   onAction={() => navigation.navigate('StartQuiz', { quizId: q.id })} 
                 />
               ))}

               {quizzes.filter(q => q.derivedStatus === 'upcoming' || q.derivedStatus === 'available').map((q, i) => (
                 <QuizCard 
                   key={q.id}
                   delay={400 + i * 50}
                   headerTitle={q.derivedStatus === 'available' ? "Available Now" : "Upcoming Quiz"}
                   headerBadge={q.derivedStatus === 'available' ? "Ready" : "Scheduled"}
                   badgeColor={q.derivedStatus === 'available' ? "#3B82F6" : "#EF4444"}
                   badgeBg={q.derivedStatus === 'available' ? "#EFF6FF" : "#FEF2F2"}
                   title={q.title}
                   subtitle={q.description}
                   subject={q.subject}
                   questionsCount={q.questions?.length || 0}
                   points={q.totalMarks || 100}
                   duration={q.duration || q.timeLimit || 0}
                   teacherName={q.teacherName || 'Instructor'}
                   cardBadge={q.startAt ? new Date(q.startAt).toLocaleDateString() : 'Available'}
                   cardBadgeColor={q.derivedStatus === 'available' ? "#10B981" : "#EF4444"}
                   cardBadgeBg={q.derivedStatus === 'available' ? "#ECFDF5" : "#FEF2F2"}
                   actionBtnText={q.derivedStatus === 'available' ? "Start Now" : "View Details"}
                   actionBtnColor={q.derivedStatus === 'available' ? "#FFFFFF" : theme.primary}
                   actionBtnBg={q.derivedStatus === 'available' ? "#10B981" : "transparent"}
                   actionBtnBorder={q.derivedStatus === 'available' ? undefined : theme.primary}
                   actionBtnIcon={q.derivedStatus === 'available' ? "play" : "eye"}
                   onAction={() => q.derivedStatus === 'available' 
                     ? navigation.navigate('StartQuiz', { quizId: q.id }) 
                     : navigation.navigate('ViewQuizDetail', { quizId: q.id })}
                 />
               ))}

               {quizzes.filter(q => q.hasAttempt || q.derivedStatus === 'completed').map((q, i)  => (
                 <QuizCard 
                   key={q.id}
                   delay={500 + i * 50}
                   headerTitle="Completed"
                   headerBadge="Result Ready"
                   badgeColor="#3B82F6"
                   badgeBg="#EFF6FF"
                   title={q.title}
                   subtitle={q.description}
                   subject={q.subject}
                   questionsCount={q.questions?.length || 0}
                   points={q.totalMarks || 100}
                   duration={q.duration || q.timeLimit || 0}
                   teacherName={q.teacherName || 'Instructor'}
                   cardBadge="Completed"
                   cardBadgeColor="#3B82F6"
                   cardBadgeBg="#EFF6FF"
                   actionBtnText="View Analytics"
                   actionBtnColor="#FFFFFF"
                   actionBtnBg="#8B5CF6" 
                   actionBtnIcon="bar-chart-outline" 
                   onAction={() => navigation.navigate('QuizDetails', { quizId: q.id })}
                 />
               ))}
             </>
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
  
  header: {
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
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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

  pageTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  pageTitle: {
    fontSize: 28, 
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
    marginBottom: 32,
    rowGap: 16,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: theme.surface,
    borderRadius: 16, 
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderTopWidth: 2, 
  },
  summaryNumber: {
    fontSize: 20, 
    fontWeight: '800',
    color: theme.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500', 
  },

  listsWrapper: {
    paddingHorizontal: 20,
    gap: 24, 
  },
  
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18, 
    fontWeight: '700',
    color: theme.text,
  },
  smallBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20, 
  },
  smallBadgeText: {
    fontSize: 11,
    fontWeight: '500', 
  },

  quizCard: {
    backgroundColor: theme.surface,
    borderRadius: 12, 
    padding: 18, 
    borderLeftWidth: 4,
    borderLeftColor: theme.primary, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.border, 
  },
  quizCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    marginBottom: 4,
  },
  quizTitle: {
    fontSize: 17, 
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  cardPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20, 
  },
  cardPillText: {
    fontSize: 11,
    fontWeight: '500', 
  },
  quizSubtitle: {
    fontSize: 13, 
    color: theme.subtext,
    marginBottom: 20, 
    fontWeight: '400',
  },

  quizGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
    marginBottom: 20, 
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
    alignItems: 'flex-end', 
  },
  instructorProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  instructorName: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '400',
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14, 
    paddingVertical: 6,
    borderRadius: 6, 
  },
  actionBtnText: {
    fontSize: 13, 
    fontWeight: '600',
  },
  btnIconLayout: {
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: theme.subtext,
  },
});

export default QuizzesScreen;
