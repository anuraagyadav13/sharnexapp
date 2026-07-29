/*
  SHARNEX PREMIUM STUDENT DASHBOARD
  Theme-aware: all colours via theme tokens — no hardcoded hex values.
*/
import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { StudentHeader } from '../../components/StudentHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { BRAND } from '../../constants/theme';
import studentService from '../../services/studentService';
import Skeleton from '../../components/common/Skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StudentDashboard'
>;
interface Props {
  navigation: DashboardNavigationProp;
}

// ---------------------------------------------------------------------------
// getStyles — called once per render in each component with the active theme
// ---------------------------------------------------------------------------
const getStyles = (theme: any) =>
  StyleSheet.create({
    // CONTAINERS
    mainContainer: { flex: 1, backgroundColor: theme.background },
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingBottom: 40 },

    // SKELETON HEADER
    skeletonHeader: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 30,
      paddingBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    // SECTION WRAPPER
    section: { paddingHorizontal: 16, marginTop: 24 },

    // HERO BANNER
    heroBanner: {
      backgroundColor: theme.heroBg,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 16,
      position: 'relative',
      overflow: 'hidden',
      minHeight: 210,
      borderBottomWidth: 1,
      borderBottomColor: theme.heroBorder,
    },
    sparkleOverlay: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: 'none',
    },
    sparkleDot: {
      position: 'absolute',
      borderRadius: 2,
      backgroundColor: theme.sparkle,
    },
    heroTextSide: { width: '60%', paddingRight: 8 },
    heroTitleRow: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      lineHeight: 28,
    },
    heroAccentBar: {
      width: 3,
      height: 28,             // matches heroTitleRow lineHeight
      backgroundColor: BRAND.accentPurple,
      borderRadius: 2,
      marginRight: 8,         // gap between bar and animated word
      alignSelf: 'center',   // vertically centre within the row
    },
    animatedWordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,           // tight spacing after "Achieve"
      marginBottom: 10,       // breathing room before subtitle
    },
    heroSubtitle: {
      fontSize: 10.5,
      color: theme.subtext,
      lineHeight: 15,
      fontWeight: '400',
    },
    heroImageSide: { width: '40%', justifyContent: 'center', alignItems: 'center' },
    heroImage: { width: '100%', height: 135 },

    // STATS ROW
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginTop: 20,
      gap: 6,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.cardSurface,
      borderColor: theme.cardNestedBorder,
      borderWidth: 1,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 2,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 72,
    },
    statValue: {
      color: BRAND.accentPurple,
      fontSize: 16,
      fontWeight: '800',
    },
    statTopBadge: {
      backgroundColor: BRAND.accentPurpleDark,
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
      marginTop: 6,
    },
    statTopBadgeText: {
      color: BRAND.onAccent,
      fontSize: 9,
      fontWeight: '800',
    },

    // SCHEDULE
    sectionHeaderCol: { marginBottom: 14 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerIconBoxPurple: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.iconBoxPurpleBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitlePurple: {
      fontSize: 18,
      fontWeight: '700',
      color: BRAND.accentPurple,
    },
    sectionSubtitle: { fontSize: 12, color: theme.subtext, marginTop: 4 },
    scheduleList: { gap: 12 },
    scheduleCard: {
      backgroundColor: theme.cardSurface,
      borderColor: theme.cardNestedBorder,
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
    },
    scheduleCardOngoing: {
      backgroundColor: theme.scheduleOngoingBg,
      borderColor: theme.scheduleOngoingBorder,
      borderWidth: 1.5,
      shadowColor: BRAND.accentPurpleDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    scheduleRowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    scheduleTimeText: { fontSize: 12, color: theme.subtext, fontWeight: '500' },
    schedulePillAndStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    schedulePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
    pillCompleted: { backgroundColor: theme.pillCompletedBg },
    pillOngoing: { backgroundColor: BRAND.accentPurpleDark },
    pillUpcoming: { backgroundColor: BRAND.accentBlueDark },
    schedulePillText: {
      fontSize: 11,
      fontWeight: '700',
      color: BRAND.onAccent,
    },
    statusRowInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusTextCompleted: { fontSize: 11, color: theme.subtext, fontWeight: '500' },
    ongoingDotPurple: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: BRAND.accentPurple,
    },
    statusTextOngoing: {
      fontSize: 11,
      color: BRAND.accentPurple,
      fontWeight: '700',
    },
    statusTextUpcoming: {
      fontSize: 11,
      color: BRAND.accentBlue,
      fontWeight: '500',
    },
    scheduleRowBottom: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    scheduleInfoLeft: { flex: 1 },
    scheduleTeacherName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    scheduleRoomText: { fontSize: 11, color: theme.subtext, marginTop: 2 },
    joinClassBtnPurple: {
      backgroundColor: BRAND.accentPurpleDark,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
    },
    joinClassBtnText: { fontSize: 11, fontWeight: '700', color: BRAND.onAccent },

    // MOTIVATIONAL BANNER
    motivationalBanner: {
      marginHorizontal: 16,
      marginTop: 24,
      borderRadius: 16,
      padding: 20,
      backgroundColor: BRAND.gradMotiStart, // fallback if SVG unavailable
      position: 'relative',
      overflow: 'hidden',
    },
    motivationalTitle1: {
      fontSize: 18,
      fontWeight: '800',
      color: BRAND.onAccent,
      zIndex: 2,
    },
    motivationalTitle2: {
      fontSize: 18,
      fontWeight: '800',
      color: BRAND.onAccent,
      marginTop: 2,
      zIndex: 2,
    },
    motivationalBody: {
      fontSize: 11.5,
      color: '#E2E8F0',
      lineHeight: 17,
      marginTop: 10,
      zIndex: 2,
    },

    // QUIZZES & ASSIGNMENTS
    quizAssignCard: {
      backgroundColor: theme.cardSurface,
      borderColor: theme.cardNestedBorder,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    headerIconBoxBlue: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.iconBoxBlueBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitleBlue: {
      fontSize: 18,
      fontWeight: '700',
      color: BRAND.accentBlue,
    },
    quizEmptyContainer: {
      borderWidth: 1,
      borderColor: theme.cardNestedBorder,
      borderStyle: 'dashed',
      borderRadius: 12,
      paddingVertical: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    quizEmptyText: {
      fontSize: 13,
      color: theme.placeholder,
      fontWeight: '500',
    },
    quizList: { gap: 10, marginTop: 4 },
    quizItemRow: {
      backgroundColor: theme.cardNested,
      borderRadius: 12,
      padding: 12,
    },
    quizTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
    quizSubtext: { fontSize: 11, color: theme.subtext, marginTop: 2 },
    assignmentListStacked: { gap: 10, marginTop: 4 },
    assignmentItemCard: {
      backgroundColor: theme.cardNested,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    assignmentIconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: theme.iconBoxBlueBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    assignmentContentRight: { flex: 1 },
    assignmentItemTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
    assignmentItemSubtext: { fontSize: 11, color: theme.subtext, marginTop: 2 },

    // TOP PERFORMERS NEW UI
    podiumContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingTop: 40,
      marginBottom: 32,
      gap: 16,
    },
    podiumCard: {
      backgroundColor: theme.cardSurface,
      borderRadius: 16,
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingBottom: 16,
      paddingTop: 36,
      width: '28%',
      borderColor: theme.cardNestedBorder,
      borderWidth: 1,
    },
    podiumCard1: {
      height: 140,
      borderColor: '#10B981',
      borderWidth: 2,
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 6,
      zIndex: 10,
    },
    podiumCard2: { height: 120 },
    podiumCard3: { height: 110 },
    podiumAvatarWrapper: {
      position: 'absolute',
      top: -32,
      alignItems: 'center',
    },
    podiumAvatarWrapper1: { top: -40 },
    podiumAvatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
      borderWidth: 2,
      backgroundColor: theme.cardSurface,
    },
    podiumAvatar1: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderColor: '#10B981',
      borderWidth: 3,
    },
    podiumAvatar2: { borderColor: '#3B82F6' },
    podiumAvatar3: { borderColor: '#F97316' },
    podiumRankBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      marginTop: -12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    podiumRankBadge1: { backgroundColor: '#10B981' },
    podiumRankBadge2: { backgroundColor: '#3B82F6' },
    podiumRankBadge3: { backgroundColor: '#F97316' },
    podiumRankText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: '800',
    },
    podiumName: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    podiumPercent: {
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 6,
    },
    podiumPercent1: { color: '#10B981', fontSize: 22 },
    podiumPercent2: { color: '#3B82F6' },
    podiumPercent3: { color: '#F97316' },
    podiumTopPill: {
      backgroundColor: BRAND.accentPurple,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
    },
    podiumTopPill2: { backgroundColor: '#DBEAFE' },
    podiumTopPillText: {
      fontSize: 9,
      fontWeight: '900',
      color: '#FFF',
    },
    podiumTopPillText2: { color: '#2563EB' },

    topPerformersHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    topPerformersTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: BRAND.accentPurple,
    },
    performerListContainer: { gap: 12 },
    performerListCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 16,
    },
    performerListCard4: { backgroundColor: '#E0F2FE' },
    performerListCard5: { backgroundColor: '#F3E8FF' },
    performerRank: {
      fontSize: 15,
      fontWeight: '800',
      color: '#94A3B8',
      width: 24,
      textAlign: 'center',
    },
    performerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginHorizontal: 12,
    },
    performerInfo: { flex: 1 },
    performerName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    performerDeptPill: {
      backgroundColor: 'rgba(255,255,255,0.7)',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
    },
    performerDeptText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#64748B',
    },
    performerRightInfo: { alignItems: 'flex-end' },
    performerPercent: {
      fontSize: 17,
      fontWeight: '800',
      color: BRAND.accentPurple,
    },
    performerPercent4: { color: '#0284C7' },
    performerStatusText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#94A3B8',
      marginTop: 2,
    },

    // FAQ
    faqCardContainer: {
      backgroundColor: theme.faqContainerBg,
      borderColor: theme.faqBorder,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
    },
    faqList: { marginTop: 8 },
    faqItemContainer: {
      borderBottomWidth: 1,
      borderBottomColor: theme.faqBorder,
    },
    faqHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
    },
    faqQuestion: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.text,
      flex: 1,
      paddingRight: 10,
    },
    faqAnswerContainer: {
      backgroundColor: theme.faqAnswer,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    faqAnswerText: { fontSize: 12, color: theme.subtext, lineHeight: 18 },

    // NEED HELP CTA
    needHelpBanner: {
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 32,
      borderRadius: 20,
      paddingVertical: 28,
      paddingHorizontal: 20,
      alignItems: 'center',
      backgroundColor: BRAND.gradHelpStart, // SVG gradient on top
      position: 'relative',
      overflow: 'hidden',
    },
    needHelpTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: BRAND.onAccent,
      zIndex: 2,
    },
    needHelpDesc: {
      fontSize: 12,
      color: '#E0E7FF',
      textAlign: 'center',
      lineHeight: 18,
      marginTop: 8,
      marginBottom: 20,
      paddingHorizontal: 10,
      zIndex: 2,
    },
    contactSupportBtn: {
      backgroundColor: BRAND.onAccent,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 8,
      zIndex: 2,
    },
    contactSupportBtnText: {
      color: BRAND.needHelpBtnText,
      fontSize: 13,
      fontWeight: '700',
    },

    // EMPTY STATE
    emptyText: {
      fontSize: 13,
      color: theme.subtext,
      textAlign: 'center',
      marginTop: 12,
      fontWeight: '500',
    },
  });

// ---------------------------------------------------------------------------
// TypewriterWord — hero animated cycling word (no new packages)
// Gradient approximated via Reanimated interpolateColor (blue ↔ purple)
// ---------------------------------------------------------------------------
const TYPEWRITER_WORDS = ['Progress', 'Growth', 'Success', 'Mastery'];
const TYPE_MS = 90;    // ms per character typed
const HOLD_MS = 2000;  // ms word stays visible after fully typed
const DEL_MS = 45;     // ms per character deleted
const BLINK_MS = 500;  // cursor blink period

const TypewriterWord: React.FC<{ style: any }> = ({ style }) => {
  const [displayed, setDisplayed] = useState('');
  const [cursorOn, setCursorOn] = useState(true);
  const colorProgress = useSharedValue(0); // 0=blue, 1=purple

  const wordIdxRef = useRef(0);
  const charIdxRef = useRef(0);
  const phaseRef = useRef<'typing' | 'hold' | 'deleting'>('typing');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Independent blink ticker
    blinkRef.current = setInterval(() => setCursorOn(v => !v), BLINK_MS);

    const tick = () => {
      const word = TYPEWRITER_WORDS[wordIdxRef.current];

      if (phaseRef.current === 'typing') {
        charIdxRef.current += 1;
        setDisplayed(word.slice(0, charIdxRef.current));
        if (charIdxRef.current >= word.length) {
          phaseRef.current = 'hold';
          timerRef.current = setTimeout(tick, HOLD_MS);
        } else {
          timerRef.current = setTimeout(tick, TYPE_MS);
        }

      } else if (phaseRef.current === 'hold') {
        phaseRef.current = 'deleting';
        timerRef.current = setTimeout(tick, DEL_MS);

      } else {
        // deleting
        charIdxRef.current -= 1;
        setDisplayed(word.slice(0, charIdxRef.current));
        if (charIdxRef.current <= 0) {
          const next = (wordIdxRef.current + 1) % TYPEWRITER_WORDS.length;
          wordIdxRef.current = next;
          charIdxRef.current = 0;
          phaseRef.current = 'typing';
          // Alternate colour: even index → blue, odd → purple
          colorProgress.value = withTiming(next % 2 === 0 ? 0 : 1, {
            duration: 500,
            easing: Easing.inOut(Easing.ease),
          });
          timerRef.current = setTimeout(tick, TYPE_MS);
        } else {
          timerRef.current = setTimeout(tick, DEL_MS);
        }
      }
    };

    timerRef.current = setTimeout(tick, 900); // initial settle delay

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (blinkRef.current !== null) clearInterval(blinkRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    color: interpolateColor(colorProgress.value, [0, 1], ['#60A5FA', '#A78BFA']),
  }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Animated.Text style={[style, animStyle]}>{displayed}</Animated.Text>
      <Animated.Text style={[style, animStyle, { opacity: cursorOn ? 1 : 0 }]}>{'|'}</Animated.Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// DashboardSkeleton
// ---------------------------------------------------------------------------
const DashboardSkeleton = ({ theme }: { theme: any }) => {
  const s = getStyles(theme);
  return (
    <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
      <View style={s.skeletonHeader}>
        <Skeleton width={30} height={30} borderRadius={6} />
        <Skeleton width="40%" height={24} borderRadius={6} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>
      <View style={s.section}>
        <Skeleton width="100%" height={180} borderRadius={16} />
      </View>
      <View style={s.statsRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} width="18%" height={70} borderRadius={12} />
        ))}
      </View>
      <View style={s.section}>
        <Skeleton width={140} height={20} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={100} borderRadius={14} />
      </View>
    </ScrollView>
  );
};

// ---------------------------------------------------------------------------
// FAQItem
// ---------------------------------------------------------------------------
interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  isLast?: boolean;
  theme: any;
}

const FAQItem = React.memo(
  ({ question, answer, isOpen, onToggle, isLast, theme }: FAQItemProps) => {
    const s = getStyles(theme);
    return (
      <View style={[s.faqItemContainer, isLast ? { borderBottomWidth: 0 } : null]}>
        <TouchableOpacity style={s.faqHeader} onPress={onToggle} activeOpacity={0.7}>
          <Text style={s.faqQuestion}>{question}</Text>
          <Ionicons
            name={isOpen ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={BRAND.accentPurple}
          />
        </TouchableOpacity>
        {isOpen && (
          <View style={s.faqAnswerContainer}>
            <Text style={s.faqAnswerText}>{answer}</Text>
          </View>
        )}
      </View>
    );
  },
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatDueDate = (dateStr: string) => {
  if (!dateStr) return 'Jul 11, 2026, 08:49 AM';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month} ${day}, ${year}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  } catch {
    return dateStr;
  }
};

// ---------------------------------------------------------------------------
// StudentDashboard
// ---------------------------------------------------------------------------
const StudentDashboard: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const s = useMemo(() => getStyles(theme), [theme]);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [assignmentsData, setAssignmentsData] = useState<any[]>([]);
  const [quizzesData, setQuizzesData] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);

  const fetchAllData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const userId = authState?.user?.id;
        let resolvedId = userId;

        try {
          const profileRes = await studentService.getProfile();
          resolvedId =
            profileRes?.normalized?.data?.id || profileRes?.data?.id || userId;
        } catch {
          // use fallback userId
        }

        if (resolvedId) {
          const [dashRes, scheduleRes, assignRes, quizRes, leaderboardRes] =
            await Promise.allSettled([
              studentService.getDashboard(resolvedId),
              studentService.getSchedule(resolvedId),
              studentService.getAssignments(resolvedId),
              studentService.getQuizzes(),
              studentService.getLeaderboard(5),
            ]);

          if (dashRes.status === 'fulfilled' && dashRes.value) {
            setDashboardData(
              dashRes.value?.normalized?.data || dashRes.value?.data || {},
            );
          }
          if (scheduleRes.status === 'fulfilled' && scheduleRes.value) {
            const p =
              scheduleRes.value?.normalized?.data || scheduleRes.value?.data || {};
            const slots =
              p.schedule || p.slots || p.timetable ||
              (Array.isArray(p) ? p : []);
            setScheduleData(Array.isArray(slots) ? slots : []);
          }
          if (assignRes.status === 'fulfilled' && assignRes.value) {
            const p =
              assignRes.value?.normalized?.data?.assignments ||
              assignRes.value?.data?.assignments ||
              (Array.isArray(assignRes.value?.data) ? assignRes.value.data : []);
            setAssignmentsData(Array.isArray(p) ? p : []);
          }
          if (quizRes.status === 'fulfilled' && quizRes.value) {
            const p =
              quizRes.value?.normalized?.data?.quizzes ||
              quizRes.value?.data?.quizzes ||
              (Array.isArray(quizRes.value?.data) ? quizRes.value.data : []);
            setQuizzesData(Array.isArray(p) ? p : []);
          }
          if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value) {
            const p =
              leaderboardRes.value?.normalized?.data ||
              leaderboardRes.value?.data ||
              [];
            setLeaderboardData(Array.isArray(p) ? p : (Array.isArray(p.leaderboard) ? p.leaderboard : []));
          }
        }
      } catch (error) {
        console.error('Fetch failed:', error);
        setDashboardData({});
        setScheduleData([]);
        setAssignmentsData([]);
        setQuizzesData([]);
        setLeaderboardData([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [authState?.user?.id],
  );

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const normalizeTime = useCallback((v: string) => {
    if (!v) return '';
    const m = v.match(/(\d{1,2}):(\d{2})/);
    return m ? `${m[1].padStart(2, '0')}:${m[2]}` : v.slice(0, 5);
  }, []);

  const calculateStatus = useCallback((start: string, end: string) => {
    try {
      if (!start || !end) return 'Upcoming';
      const now = new Date();
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const s = new Date(now); s.setHours(sh, sm, 0);
      const e = new Date(now); e.setHours(eh, em, 0);
      if (now >= s && now <= e) return 'Ongoing';
      if (now > e) return 'Completed';
    } catch { }
    return 'Upcoming';
  }, []);

  const processedSchedule = useMemo(() => {
    if (!scheduleData || !Array.isArray(scheduleData) || scheduleData.length === 0) {
      return [];
    }
    const dayKey = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
    return scheduleData
      .filter(
        item =>
          item &&
          (!item.day ||
            (typeof item.day === 'string' &&
              item.day.toUpperCase().startsWith(dayKey))),
      )
      .map(item => {
        const start = normalizeTime(item.time || item.startTime || '');
        const end = normalizeTime(item.endTime || '');
        return {
          ...item,
          time: start || '09:00',
          endTime: end || '09:45',
          status: item.status || calculateStatus(start, end),
          subject:
            typeof item.subject === 'object'
              ? item.subject?.name || 'Class'
              : item.subject || 'Class',
          teacher:
            typeof item.teacher === 'object'
              ? item.teacher?.name || 'Teacher'
              : item.teacher || 'Teacher',
          room: item.room || 'Classroom',
        };
      });
  }, [scheduleData, calculateStatus, normalizeTime]);


  const top5Students = useMemo(() => {
    if (
      leaderboardData &&
      Array.isArray(leaderboardData) &&
      leaderboardData.length > 0
    ) {
      return leaderboardData.slice(0, 5).map((student: any) => {
        // Map backend fields to the UI design requirements.
        // We look for common profile picture fields, class names for department, etc.
        const realImg = student.profile_picture_url || student.avatar || student.image_url || student.photo_url || student.img;
        const fallbackImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=random&color=fff`;

        return {
          ...student,
          img: realImg || fallbackImg,
          dept: student.class_name || student.department || student.dept || 'Class',
          statusText: student.trend || student.status || student.statusText || 'STABLE',
          percentage: student.score || (typeof student.percentage === 'number' ? `${student.percentage}%` : student.percentage) || '0%',
        };
      });
    }
    return [];
  }, [leaderboardData]);

  const filteredAssignments = useMemo(() => {
    if (!assignmentsData || !Array.isArray(assignmentsData) || assignmentsData.length === 0) {
      return [];
    }
    return assignmentsData
      .filter(
        (item: any) =>
          item && !item.is_submitted && !item.submitted && item.status !== 'graded',
      )
      .slice(0, 3);
  }, [assignmentsData]);

  const upcomingQuizzes = useMemo(() => {
    if (!quizzesData || !Array.isArray(quizzesData) || quizzesData.length === 0) return [];
    return quizzesData
      .filter(
        (q: any) =>
          q &&
          (q.derivedStatus === 'open' ||
            q.derivedStatus === 'upcoming' ||
            q.status === 'open' ||
            q.status === 'upcoming'),
      )
      .sort(
        (a: any, b: any) =>
          new Date(a?.startAt || a?.created_at || 0).getTime() -
          new Date(b?.startAt || b?.created_at || 0).getTime(),
      )
      .slice(0, 3);
  }, [quizzesData]);

  const faqData = useMemo(
    () => [
      { question: 'How do I submit an assignment?', answer: 'Go to Assignments page, select the assignment, and click Submit button.' },
      { question: 'Where can I check my grades?', answer: 'Navigate to Result  section from the sidebar menu.' },
      { question: 'How do I view my attendance?', answer: 'Click on Attendance in the sidebar to view your detailed attendance calendar.' },
      { question: 'Where are the quiz results?', answer: 'Quiz results are available in the Quizzes & Tests section after completion.' },
    ],
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={s.mainContainer}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor="transparent"
        translucent
      />

      {isLoading ? (
        <DashboardSkeleton theme={theme} />
      ) : (
        <ScrollView
          style={s.container}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchAllData(true)}
              tintColor={BRAND.accentPurple}
              colors={[BRAND.accentPurple]}
            />
          }
        >
          {/* Header */}
          <StudentHeader
            title={`Hi, ${authState?.user?.name?.split(' ')[0] || 'Student'}`}
            navigation={navigation}
            onMenuPress={() => setDrawerOpen(true)}
            isDashboard={true}
          />

          {/* 1. Hero Banner */}
          <View style={s.heroBanner}>
            <View style={s.sparkleOverlay}>
              <View style={[s.sparkleDot, { top: 15, left: '15%', opacity: 0.4, width: 3, height: 3 }]} />
              <View style={[s.sparkleDot, { top: 40, left: '45%', opacity: 0.6, width: 4, height: 4 }]} />
              <View style={[s.sparkleDot, { top: 80, left: '25%', opacity: 0.3, width: 3, height: 3 }]} />
              <View style={[s.sparkleDot, { bottom: 20, left: '55%', opacity: 0.5, width: 3, height: 3 }]} />
              <View style={[s.sparkleDot, { top: 25, right: '10%', opacity: 0.4, width: 3, height: 3 }]} />
            </View>
            <View style={s.heroTextSide}>
              <Text style={s.heroTitleRow}>Helping Every</Text>
              <Text style={s.heroTitleRow}>Student</Text>
              <Text style={s.heroTitleRow}>Achieve</Text>
              {/* Accent bar + animated word on the same row */}
              <View style={s.animatedWordRow}>
                <View style={s.heroAccentBar} />
                <TypewriterWord style={s.heroTitleRow} />
              </View>
              <Text style={s.heroSubtitle}>
                One simple portal for attendance, assignments, grades, and everything
                so students always know what's next and never miss a beat.
              </Text>
            </View>
            {/* <View style={s.heroImageSide}>
              <Image
                source={require('../../assets/laptop.png')}
                style={s.heroImage}
                resizeMode="contain"
              />
            </View> */}
          </View>


          {/* 3. Today's Schedule */}
          <View style={s.section}>
            <View style={s.sectionHeaderCol}>
              <View style={s.sectionHeaderRow}>
                <View style={s.headerIconBoxPurple}>
                  <Ionicons name="calendar-outline" size={18} color={BRAND.accentPurple} />
                </View>
                <Text style={s.sectionTitlePurple}>Today's Schedule</Text>
              </View>
              <Text style={s.sectionSubtitle}>Your classes and schedule details for today</Text>
            </View>

            <View style={s.scheduleList}>
              {processedSchedule.length === 0 ? (
                <Text style={s.emptyText}>No classes scheduled for today.</Text>
              ) : (
                processedSchedule.slice(0, 5).map((item, index) => {
                  const isOngoing = item.status === 'Ongoing';
                  const isCompleted = item.status === 'Completed';
                  const isUpcoming = item.status === 'Upcoming';
                  return (
                    <View
                      key={index}
                      style={[s.scheduleCard, isOngoing ? s.scheduleCardOngoing : null]}
                    >
                      <View style={s.scheduleRowTop}>
                        <Text style={s.scheduleTimeText}>{`${item.time} - ${item.endTime}`}</Text>
                        <View style={s.schedulePillAndStatusRow}>
                          <View
                            style={[
                              s.schedulePill,
                              isCompleted ? s.pillCompleted : null,
                              isOngoing ? s.pillOngoing : null,
                              isUpcoming ? s.pillUpcoming : null,
                            ]}
                          >
                            <Text style={s.schedulePillText}>{item.subject}</Text>
                          </View>
                          {isCompleted && (
                            <View style={s.statusRowInline}>
                              <Ionicons name="checkmark" size={12} color={theme.subtext} />
                              <Text style={s.statusTextCompleted}>Completed</Text>
                            </View>
                          )}
                          {isOngoing && (
                            <View style={s.statusRowInline}>
                              <View style={s.ongoingDotPurple} />
                              <Text style={s.statusTextOngoing}>Ongoing</Text>
                            </View>
                          )}
                          {isUpcoming && (
                            <View style={s.statusRowInline}>
                              <Ionicons name="ellipse-outline" size={10} color={BRAND.accentBlue} />
                              <Text style={s.statusTextUpcoming}>Up next</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={s.scheduleRowBottom}>
                        <View style={s.scheduleInfoLeft}>
                          <Text style={s.scheduleTeacherName}>{item.teacher}</Text>
                          <Text style={s.scheduleRoomText}>{item.room || 'Classroom'}</Text>
                        </View>
                        {isOngoing && (
                          <TouchableOpacity style={s.joinClassBtnPurple} activeOpacity={0.8}>
                            <Text style={s.joinClassBtnText}>Join Class →</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* 4. Motivational Banner */}
          <View style={s.motivationalBanner}>
            <View style={StyleSheet.absoluteFill}>
              <Svg height="100%" width="100%">
                <Defs>
                  <SvgLinearGradient id="motiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0" stopColor={BRAND.gradMotiStart} stopOpacity="1" />
                    <Stop offset="1" stopColor={BRAND.gradMotiEnd} stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#motiGrad)" rx="16" ry="16" />
              </Svg>
            </View>
            <Text style={s.motivationalTitle1}>SMALL STEPS EVERY DAY</Text>
            <Text style={s.motivationalTitle2}>LEAD TO BIG RESULTS</Text>
            <Text style={s.motivationalBody}>
              Every little effort counts toward your long-term goals. Stay motivated and
              track your daily progress to achieve greatness.
            </Text>
          </View>

          {/* 5. Upcoming Quizzes + Recent Assignments */}
          <View style={s.section}>
            {/* Quizzes */}
            <View style={s.quizAssignCard}>
              <View style={s.cardHeaderRow}>
                <View style={s.headerIconBoxPurple}>
                  <MaterialCommunityIcons name="flask" size={18} color={BRAND.accentPurple} />
                </View>
                <Text style={s.sectionTitlePurple}>Upcoming Quizzes</Text>
              </View>
              {upcomingQuizzes.length === 0 ? (
                <View style={s.quizEmptyContainer}>
                  <Text style={s.quizEmptyText}>No upcoming quizzes!</Text>
                </View>
              ) : (
                <View style={s.quizList}>
                  {upcomingQuizzes.map((quiz: any, idx: number) => (
                    <View key={idx} style={s.quizItemRow}>
                      <Text style={s.quizTitle}>{quiz.title || quiz.name}</Text>
                      <Text style={s.quizSubtext}>
                        {quiz.subject_name || quiz.subject} • {quiz.startAt || quiz.date || 'Upcoming'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Assignments */}
            <View style={[s.quizAssignCard, { marginTop: 16 }]}>
              <View style={s.cardHeaderRow}>
                <View style={s.headerIconBoxBlue}>
                  <Ionicons name="document-text" size={18} color={BRAND.accentBlue} />
                </View>
                <Text style={s.sectionTitleBlue}>Recent Assignments</Text>
              </View>
              <View style={s.assignmentListStacked}>
                {filteredAssignments.length === 0 ? (
                  <Text style={s.emptyText}>No recent assignments.</Text>
                ) : (
                  filteredAssignments.map((item: any, index: number) => (
                    <View key={index} style={s.assignmentItemCard}>
                      <View style={s.assignmentIconBox}>
                        <Ionicons name="document-text" size={18} color={BRAND.accentBlue} />
                      </View>
                      <View style={s.assignmentContentRight}>
                        <Text style={s.assignmentItemTitle}>{item.title || item.name || 'Maths'}</Text>
                        <Text style={s.assignmentItemSubtext}>
                          {`${item.subject_name || item.subject || 'English'} • Due ${formatDueDate(item.due_date || item.dueDate)}`}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>

          {/* 6. Top Performers */}
          <View style={s.section}>
            <View style={s.topPerformersHeaderRow}>
              <Text style={s.topPerformersTitle}>Top Performers</Text>
            </View>

            {top5Students.length >= 3 && (
              <View style={s.podiumContainer}>
                {/* 2nd Place */}
                <View style={[s.podiumCard, s.podiumCard2]}>
                  <View style={[s.podiumAvatarWrapper, s.podiumAvatarWrapper2]}>
                    <Image source={{ uri: top5Students[1].img || 'https://i.pravatar.cc/150' }} style={[s.podiumAvatar, s.podiumAvatar2]} />
                    <View style={[s.podiumRankBadge, s.podiumRankBadge2]}>
                      <Text style={s.podiumRankText}>2nd</Text>
                    </View>
                  </View>
                  <Text style={s.podiumName} numberOfLines={1}>{top5Students[1].name || 'Student'}</Text>
                  <Text style={[s.podiumPercent, s.podiumPercent2]}>{top5Students[1].percentage}</Text>
                  <View style={[s.podiumTopPill, s.podiumTopPill2]}>
                    <Text style={[s.podiumTopPillText, s.podiumTopPillText2]}>TOP</Text>
                  </View>
                </View>

                {/* 1st Place */}
                <View style={[s.podiumCard, s.podiumCard1]}>
                  <View style={[s.podiumAvatarWrapper, s.podiumAvatarWrapper1]}>
                    <Image source={{ uri: top5Students[0].img || 'https://i.pravatar.cc/150' }} style={[s.podiumAvatar, s.podiumAvatar1]} />
                    <View style={[s.podiumRankBadge, s.podiumRankBadge1]}>
                      <Ionicons name="ribbon" size={10} color="#FFF" />
                      <Text style={s.podiumRankText}>1st</Text>
                    </View>
                  </View>
                  <Text style={s.podiumName} numberOfLines={1}>{top5Students[0].name || 'Student'}</Text>
                  <Text style={[s.podiumPercent, s.podiumPercent1]}>{top5Students[0].percentage}</Text>
                  <View style={s.podiumTopPill}>
                    <Text style={s.podiumTopPillText}>TOP</Text>
                  </View>
                </View>

                {/* 3rd Place */}
                <View style={[s.podiumCard, s.podiumCard3]}>
                  <View style={[s.podiumAvatarWrapper, s.podiumAvatarWrapper3]}>
                    <Image source={{ uri: top5Students[2].img || 'https://i.pravatar.cc/150' }} style={[s.podiumAvatar, s.podiumAvatar3]} />
                    <View style={[s.podiumRankBadge, s.podiumRankBadge3]}>
                      <Text style={s.podiumRankText}>3rd</Text>
                    </View>
                  </View>
                  <Text style={s.podiumName} numberOfLines={1}>{top5Students[2].name || 'Student'}</Text>
                  <Text style={[s.podiumPercent, s.podiumPercent3]}>{top5Students[2].percentage}</Text>
                </View>
              </View>
            )}

            <View style={s.performerListContainer}>
              {top5Students.slice(3).map((student: any, index: number) => {
                const rank = index + 4;
                const isRank4 = rank === 4;
                return (
                  <View key={index} style={[s.performerListCard, isRank4 ? s.performerListCard4 : s.performerListCard5]}>
                    <Text style={s.performerRank}>{rank}</Text>
                    <Image source={{ uri: student.img || 'https://i.pravatar.cc/150' }} style={s.performerAvatar} />
                    <View style={s.performerInfo}>
                      <Text style={s.performerName}>{student.name || 'Student'}</Text>
                      <View style={s.performerDeptPill}>
                        <Text style={s.performerDeptText}>{student.dept || 'Department'}</Text>
                      </View>
                    </View>
                    <View style={s.performerRightInfo}>
                      <Text style={[s.performerPercent, isRank4 ? s.performerPercent4 : null]}>{student.percentage || '0%'}</Text>
                      <Text style={s.performerStatusText}>{student.statusText || 'STABLE'}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 7. FAQ */}
          <View style={s.section}>
            <View style={s.faqCardContainer}>
              <View style={s.cardHeaderRow}>
                <View style={s.headerIconBoxPurple}>
                  <Ionicons name="help-circle-outline" size={18} color={BRAND.accentPurple} />
                </View>
                <Text style={s.sectionTitlePurple}>Frequently Asked Questions</Text>
              </View>
              <View style={s.faqList}>
                {faqData.map((faq, index) => (
                  <FAQItem
                    key={index}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={expandedFaqId === index}
                    onToggle={() =>
                      setExpandedFaqId(expandedFaqId === index ? null : index)
                    }
                    isLast={index === faqData.length - 1}
                    theme={theme}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* 8. Need Help CTA */}
          <View style={s.needHelpBanner}>
            <View style={StyleSheet.absoluteFill}>
              <Svg height="100%" width="100%">
                <Defs>
                  <SvgLinearGradient id="helpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0" stopColor={BRAND.gradHelpStart} stopOpacity="1" />
                    <Stop offset="1" stopColor={BRAND.gradHelpEnd} stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#helpGrad)" rx="20" ry="20" />
              </Svg>
            </View>
            <Text style={s.needHelpTitle}>Need Help?</Text>
            <Text style={s.needHelpDesc}>
              Our support team is here to assist you with any questions or concerns.
            </Text>
            <TouchableOpacity style={s.contactSupportBtn} activeOpacity={0.8}>
              <Text style={s.contactSupportBtnText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
    </View>
  );
};

export default StudentDashboard;
