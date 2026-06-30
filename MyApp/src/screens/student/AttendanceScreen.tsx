import React, { useState, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import studentService from '../../services/studentService';
import Skeleton from '../../components/common/Skeleton';

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: string;
  markedAt: string;
  notes?: string | null;
}

interface AcademicYear {
  year: string;
  presentDays: number;
  absentDays: number;
  presentPercentage: number;
}

interface AttendanceStatistics {
  attendancePercentage: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  currentMonthPercentage: number;
  lastMonthPercentage: number;
  monthlyChange: number;
  academicYear: AcademicYear;
  classAverage: number;
}

interface AttendanceData {
  records: AttendanceRecord[];
  statistics: AttendanceStatistics;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

type AttendanceScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Attendance'>;

interface Props {
  navigation: AttendanceScreenNavigationProp;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateVal: string | undefined | null): string => {
  if (!dateVal) return '----';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '----';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '----';
  }
};

const getDayName = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '----';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
  } catch {
    return '----';
  }
};

const getStatusStyle = (status: string) => {
  const s = status?.toLowerCase();
  switch (s) {
    case 'present': return { pill: styles.statusPresent, text: styles.statusTextPresent };
    case 'absent': return { pill: styles.statusAbsent, text: styles.statusTextAbsent };
    case 'late': return { pill: styles.statusLate, text: styles.statusTextLate };
    case 'excused': return { pill: styles.statusExcused, text: styles.statusTextExcused };
    default: return { pill: styles.statusExcused, text: styles.statusTextExcused };
  }
};

const getCalendarStatus = (status: string): 'present' | 'absent' | 'late' | 'excused' | 'none' => {
  switch (status?.toLowerCase()) {
    case 'present': return 'present';
    case 'absent': return 'absent';
    case 'late': return 'late';
    case 'excused': return 'excused';
    default: return 'none';
  }
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const PageSkeleton: React.FC = () => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.pageTitleWrapper}>
      <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={16} />
    </View>
    <View style={styles.card}>
      <Skeleton width="50%" height={20} style={{ marginBottom: 15 }} />
      <View style={styles.statsRow}>
        {[0, 1, 2].map(i => <Skeleton key={i} width="31%" height={80} borderRadius={8} />)}
      </View>
    </View>
    <View style={styles.card}>
      <Skeleton width="100%" height={80} borderRadius={12} />
    </View>
    <View style={styles.card}>
      <Skeleton width="100%" height={260} borderRadius={12} />
    </View>
    <View style={styles.card}>
      <Skeleton width="100%" height={180} borderRadius={12} />
    </View>
  </ScrollView>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const AttendanceScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();

  // UI state
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);


  // Data state
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar navigation state
  const now = new Date();
  const [calYear, setCalYear] = useState<number>(now.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(now.getMonth()); // 0-indexed

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAttendance = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const meRes = await studentService.getMe();
      const meData = meRes.normalized?.data;
      // Attendance endpoint uses the top-level user ID (matches JWT), not student.id
      const studentId: string = meData?.id ?? meData?.student?.id ?? '';


      if (!studentId) {
        throw new Error('Could not resolve studentId from /auth/me');
      }

      const res = await studentService.getAttendance(studentId);
      const payload = res.normalized?.data as AttendanceData;
      console.log('[Attendance] statistics:', JSON.stringify(payload?.statistics));
      setAttendanceData(payload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load attendance.';
      console.error('[Attendance] fetch failed:', message);
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleGenerateReport = useCallback(async () => {
    // The backend report endpoint requires a CSRF token (browser-session-only).
    // Direct downloads work from the web app. Mobile support needs a backend fix.
    Alert.alert(
      'Download Report',
      'PDF report generation requires your browser session.\n\nTap "Open Web" to download from sharnex.com — you\'ll be able to generate and save the PDF there.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Web',
          onPress: () => Linking.openURL('https://sharnex.com/student/attendance'),
        },
      ]
    );
  }, []);

  // ─── Derived data ────────────────────────────────────────────────────────────

  const stats = attendanceData?.statistics;
  const records = attendanceData?.records ?? [];
  const visibleRecords = showAllRecords ? records : records.slice(0, 7);

  // ─── Calendar logic ──────────────────────────────────────────────────────────

  const calendarData = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

    // Build record lookup map for current calendar month
    const recordMap: Record<string, 'present' | 'absent' | 'late' | 'excused' | 'none'> = {};
    records.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const dayKey = d.getDate().toString();
        recordMap[dayKey] = getCalendarStatus(r.status);
      }
    });

    // Cells: nulls for leading empty days + actual days
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ];

    return { cells, recordMap };
  }, [calYear, calMonth, records]);

  const navigateMonth = (dir: 1 | -1) => {
    setCalMonth(prev => {
      const next = prev + dir;
      if (next < 0) { setCalYear(y => y - 1); return 11; }
      if (next > 11) { setCalYear(y => y + 1); return 0; }
      return next;
    });
  };

  const calMonthLabel = new Date(calYear, calMonth, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // ─── Error state ─────────────────────────────────────────────────────────────

  if (!isLoading && error) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />
        <Ionicons name="cloud-offline-outline" size={52} color="#EF4444" />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' }}>
          Failed to Load Attendance
        </Text>
        <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#4F46E5', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 }}
          onPress={() => fetchAttendance()}
        >
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />

      {/* ── Global Header ── */}
      <View style={styles.globalHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
          Welcome back, {authState.user?.name?.split(' ')[0] || 'Student'}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => { }}>
            <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}>
            <Ionicons name="settings-outline" size={22} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'S'}</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <PageSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchAttendance(true)}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
        >
          {/* ── Page Title ── */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
            <Text style={styles.pageTitle}>Attendance</Text>
            <Text style={styles.pageSubtitle}>Track your daily attendance and punctuality</Text>
          </Animated.View>

          {/* ── Card 1: Summary Stats (5-box grid) ── */}
          <Animated.View entering={FadeInUp.delay(80).springify()} style={styles.card}>
            <Text style={[styles.cardHeader, { marginBottom: 14 }]}>Attendance Summary</Text>

            {/* Row 1 */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { borderLeftColor: '#4F46E5' }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#4F46E5" style={{ marginBottom: 4 }} />
                <Text style={styles.statBoxTitle}>Attendance</Text>
                <Text style={[styles.statBoxVal, { color: '#4F46E5' }]}>
                  {stats?.attendancePercentage?.toFixed(1) ?? '0.0'}%
                </Text>
              </View>

              <View style={[styles.statBox, styles.statBoxMid, { borderLeftColor: '#10B981' }]}>
                <Ionicons name="person-outline" size={16} color="#10B981" style={{ marginBottom: 4 }} />
                <Text style={styles.statBoxTitle}>Present</Text>
                <Text style={[styles.statBoxVal, { color: '#10B981' }]}>{stats?.presentDays ?? 0}</Text>
              </View>

              <View style={[styles.statBox, { borderLeftColor: '#EF4444' }]}>
                <Ionicons name="close-circle-outline" size={16} color="#EF4444" style={{ marginBottom: 4 }} />
                <Text style={styles.statBoxTitle}>Absent</Text>
                <Text style={[styles.statBoxVal, { color: '#EF4444' }]}>{stats?.absentDays ?? 0}</Text>
              </View>
            </View>

            {/* Row 2 */}
            <View style={[styles.statsRow, { marginTop: 10 }]}>
              <View style={[styles.statBox, { borderLeftColor: '#F59E0B', flex: 1 }]}>
                <Ionicons name="time-outline" size={16} color="#F59E0B" style={{ marginBottom: 4 }} />
                <Text style={styles.statBoxTitle}>Late</Text>
                <Text style={[styles.statBoxVal, { color: '#F59E0B' }]}>{stats?.lateDays ?? 0}</Text>
              </View>

              <View style={[styles.statBox, styles.statBoxMid, { borderLeftColor: '#3B82F6', flex: 1 }]}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#3B82F6" style={{ marginBottom: 4 }} />
                <Text style={styles.statBoxTitle}>Excused</Text>
                <Text style={[styles.statBoxVal, { color: '#3B82F6' }]}>{stats?.excusedDays ?? 0}</Text>
              </View>

              <View style={[styles.statBox, { borderLeftColor: '#8B5CF6', flex: 1 }]}>
                <Ionicons name="calendar-outline" size={16} color="#8B5CF6" style={{ marginBottom: 4 }} />
                <Text style={styles.statBoxTitle}>Total Days</Text>
                <Text style={[styles.statBoxVal, { color: '#8B5CF6' }]}>{stats?.totalDays ?? 0}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Card 2: Monthly Performance ── */}
          <Animated.View entering={FadeInUp.delay(140).springify()} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="trending-up-outline" size={18} color="#111827" style={{ marginRight: 6 }} />
              <Text style={styles.cardHeader}>Monthly Performance</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.monthBox, { borderColor: '#E0E7FF', backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.monthBoxLabel}>Current Month</Text>
                <Text style={[styles.monthBoxVal, { color: '#4F46E5' }]}>
                  {stats?.currentMonthPercentage?.toFixed(1) ?? '0.0'}%
                </Text>
              </View>

              <View style={[styles.monthBox, { borderColor: '#D1FAE5', backgroundColor: '#ECFDF5', marginHorizontal: 8 }]}>
                <Text style={styles.monthBoxLabel}>Last Month</Text>
                <Text style={[styles.monthBoxVal, { color: '#10B981' }]}>
                  {stats?.lastMonthPercentage?.toFixed(1) ?? '0.0'}%
                </Text>
              </View>

              <View style={[styles.monthBox, {
                borderColor: (stats?.monthlyChange ?? 0) >= 0 ? '#D1FAE5' : '#FEE2E2',
                backgroundColor: (stats?.monthlyChange ?? 0) >= 0 ? '#ECFDF5' : '#FEF2F2',
              }]}>
                <Text style={styles.monthBoxLabel}>Change</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons
                    name={(stats?.monthlyChange ?? 0) >= 0 ? 'trending-up' : 'trending-down'}
                    size={14}
                    color={(stats?.monthlyChange ?? 0) >= 0 ? '#10B981' : '#EF4444'}
                    style={{ marginRight: 2 }}
                  />
                  <Text style={[styles.monthBoxVal, {
                    color: (stats?.monthlyChange ?? 0) >= 0 ? '#10B981' : '#EF4444',
                  }]}>
                    {(stats?.monthlyChange ?? 0) >= 0 ? '+' : ''}{stats?.monthlyChange?.toFixed(1) ?? '0.0'}%
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── Card 3: Calendar ── */}
          <Animated.View entering={FadeInUp.delay(180).springify()} style={styles.card}>
            <View style={styles.cardRowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={18} color="#111827" style={{ marginRight: 6 }} />
                <Text style={styles.cardHeader}>{calMonthLabel}</Text>
              </View>
              <View style={styles.calArrows}>
                <TouchableOpacity style={styles.calBtn} onPress={() => navigateMonth(-1)}>
                  <Ionicons name="chevron-back" size={14} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.calBtn} onPress={() => navigateMonth(1)}>
                  <Ionicons name="chevron-forward" size={14} color="#111827" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Days header */}
            <View style={styles.calDaysHeader}>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                <Text key={d} style={styles.calDayText}>{d}</Text>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.calGrid}>
              {calendarData.cells.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
                }
                const status = calendarData.recordMap[day.toString()] ?? 'none';
                const isToday =
                  day === now.getDate() &&
                  calMonth === now.getMonth() &&
                  calYear === now.getFullYear();

                return (
                  <View
                    key={`${calYear}-${calMonth}-${day}`}
                    style={[
                      styles.calCell,
                      status === 'present' && styles.calCellPresent,
                      status === 'absent' && styles.calCellAbsent,
                      status === 'late' && styles.calCellLate,
                      status === 'excused' && styles.calCellExcused,
                      isToday && status === 'none' && styles.calCellToday,
                    ]}
                  >
                    <Text style={[
                      styles.calCellText,
                      status === 'present' && styles.calCellTextPresent,
                      status === 'absent' && styles.calCellTextAbsent,
                      status === 'late' && styles.calCellTextLate,
                      status === 'excused' && styles.calCellTextExcused,
                      isToday && status === 'none' && { color: '#4F46E5', fontWeight: '800' },
                    ]}>
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.calDivider} />

            {/* Legend */}
            <View style={styles.calLegend}>
              {[
                { color: '#D1FAE5', label: 'Present' },
                { color: '#FEE2E2', label: 'Absent' },
                { color: '#FEF3C7', label: 'Late' },
                { color: '#DBEAFE', label: 'Excused' },
              ].map(({ color, label }) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Card 4: Academic Year Summary ── */}
          {stats?.academicYear && (
            <Animated.View entering={FadeInUp.delay(220).springify()} style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <Ionicons name="school-outline" size={18} color="#111827" style={{ marginRight: 6 }} />
                <Text style={styles.cardHeader}>Academic Year</Text>
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>{stats.academicYear.year}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statBox, { borderLeftColor: '#10B981' }]}>
                  <Text style={styles.statBoxTitle}>Present</Text>
                  <Text style={[styles.statBoxVal, { color: '#10B981' }]}>{stats.academicYear.presentDays}</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxMid, { borderLeftColor: '#EF4444' }]}>
                  <Text style={styles.statBoxTitle}>Absent</Text>
                  <Text style={[styles.statBoxVal, { color: '#EF4444' }]}>{stats.academicYear.absentDays}</Text>
                </View>
                <View style={[styles.statBox, { borderLeftColor: '#4F46E5' }]}>
                  <Text style={styles.statBoxTitle}>Attendance</Text>
                  <Text style={[styles.statBoxVal, { color: '#4F46E5' }]}>
                    {stats.academicYear.presentPercentage?.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Card 5: Attendance Comparison ── */}
          <Animated.View entering={FadeInUp.delay(260).springify()} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="people-outline" size={18} color="#111827" style={{ marginRight: 6 }} />
              <Text style={styles.cardHeader}>Attendance Comparison</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.compBox, { borderColor: '#E0E7FF' }]}>
                <Text style={styles.compLabel}>You</Text>
                <Text style={[styles.compVal, { color: '#4F46E5' }]}>
                  {stats?.attendancePercentage?.toFixed(1) ?? '0.0'}%
                </Text>
                <Ionicons
                  name={
                    (stats?.attendancePercentage ?? 0) >= (stats?.classAverage ?? 0)
                      ? 'checkmark-circle'
                      : 'warning'
                  }
                  size={20}
                  color={
                    (stats?.attendancePercentage ?? 0) >= (stats?.classAverage ?? 0)
                      ? '#10B981'
                      : '#F59E0B'
                  }
                  style={{ marginTop: 6 }}
                />
              </View>

              <View style={[styles.compBox, { borderColor: '#D1FAE5', marginHorizontal: 12 }]}>
                <Text style={styles.compLabel}>Class Avg</Text>
                <Text style={[styles.compVal, { color: '#10B981' }]}>
                  {stats?.classAverage?.toFixed(1) ?? '0.0'}%
                </Text>
              </View>

              <View style={[styles.compBox, { borderColor: '#FEF3C7' }]}>
                <Text style={styles.compLabel}>Goal</Text>
                <Text style={[styles.compVal, { color: '#F59E0B' }]}>95.0%</Text>
              </View>
            </View>

            {(stats?.attendancePercentage ?? 0) < (stats?.classAverage ?? 0) && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning-outline" size={14} color="#B45309" style={{ marginRight: 6 }} />
                <Text style={styles.warningText}>
                  Your attendance is below the class average by{' '}
                  {((stats?.classAverage ?? 0) - (stats?.attendancePercentage ?? 0)).toFixed(1)}%
                </Text>
              </View>
            )}
          </Animated.View>

          {/* ── Card 6: Goal Progress ── */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="disc-outline" size={20} color="#111827" style={{ marginRight: 6 }} />
              <Text style={styles.cardHeader}>Academic Goal Progress</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={styles.targetTitle}>Target: 95% Attendance</Text>
              <Text style={styles.targetPercent}>{stats?.attendancePercentage?.toFixed(1) ?? '0.0'}%</Text>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, stats?.attendancePercentage ?? 0)}%` }]} />
              {/* Class average marker */}
              <View style={[styles.progressMarker, { left: `${Math.min(100, stats?.classAverage ?? 0)}%` as any }]} />
            </View>

            <View style={styles.progressMetrics}>
              <Text style={styles.metricText}>Current: {stats?.attendancePercentage?.toFixed(1) ?? '0.0'}%</Text>
              <Text style={styles.metricText}>Class: {stats?.classAverage?.toFixed(1) ?? '0.0'}%</Text>
              <Text style={styles.metricText}>
                Need: +{Math.max(0, 95 - (stats?.attendancePercentage ?? 0)).toFixed(1)}%
              </Text>
            </View>
          </Animated.View>

          {/* ── Card 7: Attendance History ── */}
          <Animated.View entering={FadeInUp.delay(340).springify()} style={styles.card}>
            <View style={styles.cardRowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={18} color="#111827" style={{ marginRight: 6 }} />
                <Text style={styles.cardHeader}>
                  {showAllRecords ? 'Full Attendance History' : 'Recent Records'}
                </Text>
              </View>
              {records.length > 7 && (
                <TouchableOpacity style={styles.viewAllBtn} onPress={() => setShowAllRecords(v => !v)}>
                  <Text style={styles.viewAllText}>{showAllRecords ? 'Show less' : 'View all'}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Table */}
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, { flex: 1.6 }]}>Date</Text>
                <Text style={[styles.thText, { flex: 0.9 }]}>Day</Text>
                <Text style={[styles.thText, { flex: 1.2 }]}>Status</Text>
                <Text style={[styles.thText, { flex: 1.3 }]}>Remark</Text>
              </View>

              {visibleRecords.length === 0 ? (
                <Text style={styles.emptyText}>No attendance records found.</Text>
              ) : (
                visibleRecords.map((row, idx) => {
                  const { pill, text } = getStatusStyle(row.status);
                  return (
                    <View key={row.id ?? idx} style={styles.tableRow}>
                      <Text style={[styles.tdTextBold, { flex: 1.6 }]}>{formatDate(row.date)}</Text>
                      <Text style={[styles.tdText, { flex: 0.9 }]}>{getDayName(row.date)}</Text>
                      <View style={[{ flex: 1.2 }, styles.tdPillWrap]}>
                        <View style={pill}>
                          <Text style={text}>{row.status}</Text>
                        </View>
                      </View>
                      <Text style={[styles.tdText, { flex: 1.3 }]} numberOfLines={1}>
                        {row.notes ?? '----'}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </Animated.View>

          {/* ── Card 8: Download Report ── */}
          <Animated.View entering={FadeInUp.delay(380).springify()} style={[styles.card, { marginBottom: 32 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="document-text-outline" size={18} color="#111827" style={{ marginRight: 6 }} />
              <Text style={styles.cardHeader}>Download Report</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
              Generate a detailed attendance report for your academic records.
            </Text>
            <TouchableOpacity
              style={[styles.pdfButton, isGeneratingReport && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? (
                <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="download-outline" size={16} color="#FFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.pdfButtonText}>
                {isGeneratingReport ? 'Generating...' : 'Generate PDF Report'}
              </Text>

            </TouchableOpacity>

          </Animated.View>

        </ScrollView>
      )}

      {/* ── Navigation Drawer ── */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAF9F9' },
  scrollContent: { paddingBottom: 20 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
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
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 16 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginHorizontal: 20, marginBottom: 16,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  cardHeader: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },

  // ── Stat Boxes ──
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: {
    flex: 1, backgroundColor: '#FAFAFA',
    borderWidth: 1, borderColor: '#E5E7EB',
    borderLeftWidth: 4, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 8,
  },
  statBoxMid: { marginHorizontal: 8 },
  statBoxTitle: { fontSize: 10, fontWeight: '700', color: '#374151', marginBottom: 2 },
  statBoxVal: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 2 },

  // ── Monthly boxes ──
  monthBox: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 10,
  },
  monthBoxLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  monthBoxVal: { fontSize: 18, fontWeight: '800' },

  // ── Calendar ──
  calArrows: { flexDirection: 'row', gap: 6 },
  calBtn: { padding: 5, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF' },
  calDaysHeader: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 2 },
  calDayText: { width: '14.28%', textAlign: 'center', fontSize: 9, fontWeight: '600', color: '#6B7280' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: '14.28%', aspectRatio: 1,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4, borderRadius: 6,
  },
  calCellPresent: { backgroundColor: '#D1FAE5' },
  calCellAbsent: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  calCellLate: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  calCellExcused: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#BFDBFE' },
  calCellToday: { borderWidth: 2, borderColor: '#4F46E5' },
  calCellText: { fontSize: 11, fontWeight: '600', color: '#111827' },
  calCellTextPresent: { color: '#059669' },
  calCellTextAbsent: { color: '#DC2626' },
  calCellTextLate: { color: '#D97706' },
  calCellTextExcused: { color: '#2563EB' },
  calDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  calLegend: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendBox: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 10, fontWeight: '600', color: '#374151' },

  // ── Academic Year badge ──
  yearBadge: {
    marginLeft: 10, backgroundColor: '#EEF2FF',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
  },
  yearBadgeText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },

  // ── Comparison boxes ──
  compBox: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 10,
    alignItems: 'center',
  },
  compLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  compVal: { fontSize: 20, fontWeight: '800' },

  // ── Warning banner ──
  warningBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFBEB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginTop: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  warningText: { fontSize: 11, color: '#92400E', fontWeight: '500', flex: 1 },

  // ── Progress bar ──
  targetTitle: { fontSize: 12, fontWeight: '700', color: '#111827' },
  targetPercent: { fontSize: 14, fontWeight: '800', color: '#4F46E5' },
  progressBarBg: {
    height: 8, backgroundColor: '#E2E8F0', borderRadius: 4,
    width: '100%', overflow: 'hidden', marginBottom: 10,
    position: 'relative',
  },
  progressBarFill: { height: '100%', borderRadius: 4, backgroundColor: '#4F46E5' },
  progressMarker: {
    position: 'absolute', top: 0, bottom: 0, width: 2,
    backgroundColor: '#10B981',
  },
  progressMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricText: { fontSize: 10, color: '#6B7280', fontWeight: '500' },

  // ── Table ──
  viewAllBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  viewAllText: { fontSize: 10, fontWeight: '600', color: '#374151' },
  table: { marginTop: 4 },
  tableHeaderRow: {
    flexDirection: 'row', backgroundColor: '#F3F4F6',
    paddingVertical: 9, paddingHorizontal: 8, borderRadius: 6, marginBottom: 4,
  },
  thText: { fontSize: 9, fontWeight: '700', color: '#374151' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  tdText: { fontSize: 10, color: '#4B5563', fontWeight: '500' },
  tdTextBold: { fontSize: 10, color: '#111827', fontWeight: '700' },
  tdPillWrap: { alignItems: 'flex-start' },

  // Status pills
  statusPresent: { backgroundColor: '#D1FAE5', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 12 },
  statusAbsent: { backgroundColor: '#FEE2E2', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 12 },
  statusLate: { backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 12 },
  statusExcused: { backgroundColor: '#DBEAFE', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 12 },
  statusTextPresent: { fontSize: 9, color: '#059669', fontWeight: '700' },
  statusTextAbsent: { fontSize: 9, color: '#DC2626', fontWeight: '700' },
  statusTextLate: { fontSize: 9, color: '#D97706', fontWeight: '700' },
  statusTextExcused: { fontSize: 9, color: '#2563EB', fontWeight: '700' },

  // ── PDF button ──
  pdfButton: {
    backgroundColor: '#4F46E5', borderRadius: 10,
    paddingVertical: 13, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
  },
  pdfButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20, fontSize: 13 },
});

export default AttendanceScreen;
