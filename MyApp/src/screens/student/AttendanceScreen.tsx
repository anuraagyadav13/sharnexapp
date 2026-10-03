import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import { StudentHeader } from '../../components/StudentHeader';
import { useTheme } from '../../store/ThemeContext';
import { Theme, withAlpha, LIGHT_COLORS } from '../../constants/theme';

import studentService from '../../services/studentService';
import Skeleton from '../../components/common/Skeleton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePDF } from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import Share from 'react-native-share';
import { toFileUri, toRawFilePath } from '../../utils/fileUtils';

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

type AttendanceScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Attendance'
>;

interface Props {
  navigation: AttendanceScreenNavigationProp;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateVal: string | undefined | null): string => {
  if (!dateVal) return '----';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '----';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

const getCalendarStatus = (
  status: string,
): 'present' | 'absent' | 'late' | 'excused' | 'none' => {
  switch (status?.toLowerCase()) {
    case 'present':
      return 'present';
    case 'absent':
      return 'absent';
    case 'late':
      return 'late';
    case 'excused':
      return 'excused';
    default:
      return 'none';
  }
};

// ─── HTML Report Generator ────────────────────────────────────────────────────

function generateAttendanceHTML(
  studentName: string,
  className: string,
  academicYear: string,
  stats: AttendanceStatistics | undefined,
  records: AttendanceRecord[]
): string {
  const summaryRows = `
    <tr><td>Attendance Rate</td><td style="font-weight:700;">${
      stats?.attendancePercentage?.toFixed(1) ?? '0.0'
    }%</td></tr>
    <tr><td>Total Days</td><td style="font-weight:700;">${
      stats?.totalDays ?? 0
    }</td></tr>
    <tr><td>Days Present</td><td style="font-weight:700;">${
      stats?.presentDays ?? 0
    }</td></tr>
    <tr><td>Days Absent</td><td style="font-weight:700;">${
      stats?.absentDays ?? 0
    }</td></tr>
    <tr><td>Days Late</td><td style="font-weight:700;">${
      stats?.lateDays ?? 0
    }</td></tr>
    <tr><td>Days Excused</td><td style="font-weight:700;">${
      stats?.excusedDays ?? 0
    }</td></tr>
    <tr><td>Class Average</td><td style="font-weight:700;">${
      stats?.classAverage?.toFixed(1) ?? '0.0'
    }%</td></tr>
  `;

  const recordRows = records
    .map(r => {
      const d = new Date(r.date);
      const formatted = isNaN(d.getTime())
        ? r.date
        : d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
      const day = isNaN(d.getTime())
        ? ''
        : d.toLocaleDateString('en-US', { weekday: 'short' });
      const st = (r.status || '').toUpperCase();
      const stColor =
        st === 'PRESENT'
          ? LIGHT_COLORS.success
          : st === 'ABSENT'
          ? LIGHT_COLORS.danger
          : st === 'LATE'
          ? LIGHT_COLORS.warning
          : LIGHT_COLORS.primary;
      return `
        <tr>
          <td>${formatted}</td>
          <td>${day}</td>
          <td><span style="color:${stColor};font-weight:700;">${st}</span></td>
          <td>${r.notes || '—'}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${LIGHT_COLORS.text};padding:32px;background:${LIGHT_COLORS.surface};}
  .header{text-align:center;margin-bottom:24px;border-bottom:2px solid ${LIGHT_COLORS.primary};padding-bottom:16px;}
  .title{font-size:22px;font-weight:800;color:${LIGHT_COLORS.text};margin-bottom:4px;}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;padding:12px;background:${LIGHT_COLORS.background};border-radius:8px;border:1px solid ${LIGHT_COLORS.border};}
  .meta-item{font-size:12px;}
  .meta-label{font-weight:700;color:${LIGHT_COLORS.subtext};}
  .section-title{font-size:14px;font-weight:700;color:${LIGHT_COLORS.text};margin:20px 0 10px;text-transform:uppercase;}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;}
  th,td{padding:8px 10px;border:1px solid ${LIGHT_COLORS.border};text-align:left;font-size:11px;}
  th{background:${LIGHT_COLORS.primary};color:${LIGHT_COLORS.onPrimary};font-weight:700;}
  tr:nth-child(even){background:${LIGHT_COLORS.background};}
  .footer{text-align:center;font-size:10px;color:${LIGHT_COLORS.subtext};margin-top:30px;border-top:1px solid ${LIGHT_COLORS.border};padding-top:12px;}
</style>
</head>
<body>
  <div class="header">
    <div class="title">OFFICIAL ATTENDANCE REPORT</div>
    <div style="font-size:11px;color:${LIGHT_COLORS.subtext};">Sharnex Academic Management Platform</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><span class="meta-label">Student:</span> ${studentName}</div>
    <div class="meta-item"><span class="meta-label">Class:</span> ${
      className || 'N/A'
    }</div>
    <div class="meta-item"><span class="meta-label">Academic Year:</span> ${
      academicYear || 'Current'
    }</div>
    <div class="meta-item"><span class="meta-label">Generated Date:</span> ${new Date().toLocaleDateString(
      'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' },
    )}</div>
  </div>

  <div class="section-title">Attendance Summary</div>
  <table>
    <thead><tr><th>Metric</th><th>Value</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <div class="section-title">Attendance Records (${records.length})</div>
  <table>
    <thead><tr><th>Date</th><th>Day</th><th>Status</th><th>Remarks</th></tr></thead>
    <tbody>${
      recordRows ||
      '<tr><td colspan="4" style="text-align:center;">No records available</td></tr>'
    }</tbody>
  </table>

  <div class="footer">
    Issued automatically by Sharnex Academic System &bull; Official Student Record
  </div>
</body>
</html>`;
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const PageSkeleton: React.FC<{ styles: any }> = ({ styles }) => (
  <ScrollView
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
  >
    <View style={styles.pageTitleWrapper}>
      <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={16} />
    </View>
    <View style={styles.card}>
      <Skeleton width="50%" height={20} style={{ marginBottom: 15 }} />
      <View style={styles.statsRow}>
        {[0, 1, 2].map(i => (
          <Skeleton key={i} width="31%" height={80} borderRadius={8} />
        ))}
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
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const { authState } = useAuth();

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return { pill: styles.statusPresent, text: styles.statusTextPresent };
      case 'absent':
        return { pill: styles.statusAbsent, text: styles.statusTextAbsent };
      case 'late':
        return { pill: styles.statusLate, text: styles.statusTextLate };
      case 'excused':
        return { pill: styles.statusExcused, text: styles.statusTextExcused };
      default:
        return { pill: {}, text: {} };
    }
  };

  // UI state
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Goal State
  const [targetAttendance, setTargetAttendance] = useState(95);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('95');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'present' | 'absent' | 'late' | 'excused'
  >('all');

  // Data state
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar navigation state
  const now = new Date();
  const [calYear, setCalYear] = useState<number>(now.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(now.getMonth());

  // Load persisted goal
  useEffect(() => {
    const loadTarget = async () => {
      try {
        const saved = await AsyncStorage.getItem('@student_attendance_target');
        if (saved) {
          const val = Number(saved);
          if (!isNaN(val) && val >= 50 && val <= 100) {
            setTargetAttendance(val);
            setGoalInput(val.toString());
          }
        }
      } catch {}
    };
    loadTarget();
  }, []);

  const handleSaveGoal = async () => {
    const num = Number(goalInput.trim());
    if (isNaN(num) || num < 50 || num > 100) {
      Alert.alert(
        'Invalid Target',
        'Please enter a target attendance between 50% and 100%.',
      );
      return;
    }
    const clamped = Math.max(50, Math.min(100, Math.round(num)));
    setTargetAttendance(clamped);
    setGoalInput(clamped.toString());
    setIsEditingGoal(false);
    try {
      await AsyncStorage.setItem(
        '@student_attendance_target',
        clamped.toString(),
      );
    } catch {}
  };

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
      const studentId: string = meData?.id ?? meData?.student?.id ?? '';

      if (!studentId) {
        throw new Error('Could not resolve studentId from /auth/me');
      }

      const res = await studentService.getAttendance(studentId);
      const payload = res.normalized?.data as AttendanceData;
      setAttendanceData(payload);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load attendance.';
      console.error('[Attendance] fetch failed:', message);
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ─── PDF Print / Share ──────────────────────────────────────────────────────

  const handleGenerateReport = useCallback(
    async (action: 'print' | 'share') => {
      setIsGeneratingReport(true);
      try {
        const meRes = await studentService.getMe();
        const meData = meRes.normalized?.data;
        const studentName = meData?.name || authState.user?.name || 'Student';
        const className =
          meData?.student?.class || meData?.student?.className || '';
        const academicYear =
          attendanceData?.statistics?.academicYear?.year ||
          `${new Date().getFullYear()}`;

        const html = generateAttendanceHTML(
          studentName,
          className,
          academicYear,
          attendanceData?.statistics,
          attendanceData?.records ?? []
        );

        const file = await generatePDF({
          html,
          fileName: `Attendance_Report_${studentName.replace(/\s+/g, '_')}`,
        });

        if (!file?.filePath) {
          throw new Error('PDF generation did not return a valid file path');
        }

        if (action === 'print') {
          await RNPrint.print({ filePath: toRawFilePath(file.filePath) });
        } else {
          await Share.open({
            url: toFileUri(file.filePath),
            type: 'application/pdf',
            title: 'Attendance Report',
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('User did not share') ||
          msg.includes('dismiss') ||
          msg.includes('cancel')
        ) {
          return;
        }
        console.error('[AttendanceScreen] PDF error:', err);
        if (action === 'print') {
          Alert.alert('Print Error', 'Could not open print preview. Please try again.');
        } else {
          Alert.alert(
            'Share Error',
            'Could not generate or share the attendance report. Please try again.',
          );
        }
      } finally {
        setIsGeneratingReport(false);
      }
    },
    [attendanceData, authState.user],
  );

  // ─── Derived data ────────────────────────────────────────────────────────────

  const stats = attendanceData?.statistics;
  const records = attendanceData?.records ?? [];

  // Filtered records based on search query and status filter
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (
        filterStatus !== 'all' &&
        (r.status || '').toLowerCase() !== filterStatus
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const dateStr = formatDate(r.date).toLowerCase();
        const dayStr = getDayName(r.date).toLowerCase();
        const notesStr = (r.notes || '').toLowerCase();
        const statusStr = (r.status || '').toLowerCase();
        return (
          dateStr.includes(q) ||
          dayStr.includes(q) ||
          notesStr.includes(q) ||
          statusStr.includes(q)
        );
      }
      return true;
    });
  }, [records, filterStatus, searchQuery]);

  const visibleRecords = showAllRecords
    ? filteredRecords
    : filteredRecords.slice(0, 7);

  // ─── Calendar logic ──────────────────────────────────────────────────────────

  const calendarData = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

    const recordMap: Record<
      string,
      'present' | 'absent' | 'late' | 'excused' | 'none'
    > = {};
    records.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const dayKey = d.getDate().toString();
        recordMap[dayKey] = getCalendarStatus(r.status);
      }
    });

    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ];

    return { cells, recordMap };
  }, [calYear, calMonth, records]);

  const navigateMonth = (dir: 1 | -1) => {
    setCalMonth(prev => {
      const next = prev + dir;
      if (next < 0) {
        setCalYear(y => y - 1);
        return 11;
      }
      if (next > 11) {
        setCalYear(y => y + 1);
        return 0;
      }
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
      <View style={styles.errorContainer}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        <Ionicons name="cloud-offline-outline" size={52} color={theme.danger} />
        <Text style={styles.errorTitle}>Failed to Load Attendance</Text>
        <Text style={styles.errorSub}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => fetchAttendance()}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />

      <StudentHeader
        title="Attendance"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      {isLoading ? (
        <PageSkeleton styles={styles} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchAttendance(true)}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          {/* ── Page Title ── */}
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.pageTitleWrapper}
          >
            <Text style={styles.pageTitle}>Attendance</Text>
            <Text style={styles.pageSubtitle}>
              Track your daily attendance and punctuality
            </Text>
          </Animated.View>

          {/* ── Card 1: Summary Stats (5-box grid) ── */}
          <Animated.View
            entering={FadeInUp.delay(80).springify()}
            style={styles.card}
          >
            <Text style={[styles.cardHeader, { marginBottom: 14 }]}>
              Attendance Summary
            </Text>

            {/* Row 1 */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { borderLeftColor: theme.primary }]}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={theme.primary}
                  style={{ marginBottom: 4 }}
                />
                <Text style={styles.statBoxTitle}>Attendance</Text>
                <Text style={[styles.statBoxVal, { color: theme.primary }]}>
                  {stats?.attendancePercentage?.toFixed(1) ?? '0.0'}%
                </Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  styles.statBoxMid,
                  { borderLeftColor: theme.success },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={theme.success}
                  style={{ marginBottom: 4 }}
                />
                <Text style={styles.statBoxTitle}>Present</Text>
                <Text style={[styles.statBoxVal, { color: theme.success }]}>
                  {stats?.presentDays ?? 0}
                </Text>
              </View>

              <View style={[styles.statBox, { borderLeftColor: theme.danger }]}>
                <Ionicons
                  name="close-circle-outline"
                  size={16}
                  color={theme.danger}
                  style={{ marginBottom: 4 }}
                />
                <Text style={styles.statBoxTitle}>Absent</Text>
                <Text style={[styles.statBoxVal, { color: theme.danger }]}>
                  {stats?.absentDays ?? 0}
                </Text>
              </View>
            </View>

            {/* Row 2 */}
            <View style={[styles.statsRow, { marginTop: 10 }]}>
              <View
                style={[
                  styles.statBox,
                  { borderLeftColor: theme.warning, flex: 1 },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={theme.warning}
                  style={{ marginBottom: 4 }}
                />
                <Text style={styles.statBoxTitle}>Late</Text>
                <Text style={[styles.statBoxVal, { color: theme.warning }]}>
                  {stats?.lateDays ?? 0}
                </Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  styles.statBoxMid,
                  { borderLeftColor: theme.primary, flex: 1 },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={theme.primary}
                  style={{ marginBottom: 4 }}
                />
                <Text style={styles.statBoxTitle}>Excused</Text>
                <Text style={[styles.statBoxVal, { color: theme.primary }]}>
                  {stats?.excusedDays ?? 0}
                </Text>
              </View>

              <View
                style={[
                  styles.statBox,
                  { borderLeftColor: theme.secondary, flex: 1 },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={theme.secondary}
                  style={{ marginBottom: 4 }}
                />
                <Text style={styles.statBoxTitle}>Total Days</Text>
                <Text style={[styles.statBoxVal, { color: theme.secondary }]}>
                  {stats?.totalDays ?? 0}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Card 2: Monthly Performance ── */}
          <Animated.View
            entering={FadeInUp.delay(140).springify()}
            style={styles.card}
          >
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="trending-up-outline"
                size={18}
                color={theme.text}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.cardHeader}>Monthly Performance</Text>
            </View>

            <View style={styles.statsRow}>
              <View
                style={[
                  styles.monthBox,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.iconBackground,
                  },
                ]}
              >
                <Text style={styles.monthBoxLabel}>Current Month</Text>
                <Text style={[styles.monthBoxVal, { color: theme.primary }]}>
                  {stats?.currentMonthPercentage?.toFixed(1) ?? '0.0'}%
                </Text>
              </View>

              <View
                style={[
                  styles.monthBox,
                  {
                    borderColor: theme.border,
                    backgroundColor: isDarkMode
                      ? withAlpha(theme.success, 0.15)
                      : withAlpha(theme.success, 0.1),
                    marginHorizontal: 8,
                  },
                ]}
              >
                <Text style={styles.monthBoxLabel}>Last Month</Text>
                <Text style={[styles.monthBoxVal, { color: theme.success }]}>
                  {stats?.lastMonthPercentage?.toFixed(1) ?? '0.0'}%
                </Text>
              </View>

              <View
                style={[
                  styles.monthBox,
                  {
                    borderColor: theme.border,
                    backgroundColor:
                      (stats?.monthlyChange ?? 0) >= 0
                        ? isDarkMode
                          ? withAlpha(theme.success, 0.15)
                          : withAlpha(theme.success, 0.1)
                        : isDarkMode
                        ? withAlpha(theme.danger, 0.15)
                        : withAlpha(theme.danger, 0.1),
                  },
                ]}
              >
                <Text style={styles.monthBoxLabel}>Change</Text>
                <View style={styles.changeRow}>
                  <Ionicons
                    name={
                      (stats?.monthlyChange ?? 0) >= 0
                        ? 'trending-up'
                        : 'trending-down'
                    }
                    size={14}
                    color={
                      (stats?.monthlyChange ?? 0) >= 0
                        ? theme.success
                        : theme.danger
                    }
                    style={{ marginRight: 2 }}
                  />
                  <Text
                    style={[
                      styles.monthBoxVal,
                      {
                        color:
                          (stats?.monthlyChange ?? 0) >= 0
                            ? theme.success
                            : theme.danger,
                      },
                    ]}
                  >
                    {(stats?.monthlyChange ?? 0) >= 0 ? '+' : ''}
                    {stats?.monthlyChange?.toFixed(1) ?? '0.0'}%
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── Card 3: Calendar ── */}
          <Animated.View
            entering={FadeInUp.delay(180).springify()}
            style={styles.card}
          >
            <View style={styles.cardRowBetween}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={theme.text}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.cardHeader}>{calMonthLabel}</Text>
              </View>
              <View style={styles.calArrows}>
                <TouchableOpacity
                  style={styles.calBtn}
                  onPress={() => navigateMonth(-1)}
                >
                  <Ionicons name="chevron-back" size={14} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calBtn}
                  onPress={() => navigateMonth(1)}
                >
                  <Ionicons name="chevron-forward" size={14} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Days header */}
            <View style={styles.calDaysHeader}>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                <Text key={d} style={styles.calDayText}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.calGrid}>
              {calendarData.cells.map((day, index) => {
                if (day === null) {
                  return (
                    <View
                      key={`empty-${index}`}
                      style={{ width: '14.28%', aspectRatio: 1 }}
                    />
                  );
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
                    <Text
                      style={[
                        styles.calCellText,
                        status === 'present' && styles.calCellTextPresent,
                        status === 'absent' && styles.calCellTextAbsent,
                        status === 'late' && styles.calCellTextLate,
                        status === 'excused' && styles.calCellTextExcused,
                        isToday &&
                          status === 'none' && {
                            color: theme.primary,
                            fontWeight: '800',
                          },
                      ]}
                    >
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
                {
                  color: isDarkMode
                    ? withAlpha(theme.success, 0.3)
                    : withAlpha(theme.success, 0.2),
                  label: 'Present',
                },
                {
                  color: isDarkMode
                    ? withAlpha(theme.danger, 0.3)
                    : withAlpha(theme.danger, 0.2),
                  label: 'Absent',
                },
                {
                  color: isDarkMode
                    ? withAlpha(theme.warning, 0.3)
                    : withAlpha(theme.warning, 0.2),
                  label: 'Late',
                },
                {
                  color: isDarkMode
                    ? withAlpha(theme.info, 0.3)
                    : withAlpha(theme.info, 0.2),
                  label: 'Excused',
                },
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
            <Animated.View
              entering={FadeInUp.delay(220).springify()}
              style={styles.card}
            >
              <View style={styles.sectionHeaderRow}>
                <Ionicons
                  name="school-outline"
                  size={18}
                  color={theme.text}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.cardHeader}>Academic Year</Text>
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>
                    {stats.academicYear.year}
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statBox, { borderLeftColor: theme.success }]}>
                  <Text style={styles.statBoxTitle}>Present</Text>
                  <Text style={[styles.statBoxVal, { color: theme.success }]}>
                    {stats.academicYear.presentDays}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statBox,
                    styles.statBoxMid,
                    { borderLeftColor: theme.danger },
                  ]}
                >
                  <Text style={styles.statBoxTitle}>Absent</Text>
                  <Text style={[styles.statBoxVal, { color: theme.danger }]}>
                    {stats.academicYear.absentDays}
                  </Text>
                </View>
                <View style={[styles.statBox, { borderLeftColor: theme.primary }]}>
                  <Text style={styles.statBoxTitle}>Attendance</Text>
                  <Text style={[styles.statBoxVal, { color: theme.primary }]}>
                    {stats.academicYear.presentPercentage?.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Card 5: Attendance Comparison ── */}
          <Animated.View
            entering={FadeInUp.delay(260).springify()}
            style={styles.card}
          >
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="people-outline"
                size={18}
                color={theme.text}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.cardHeader}>Attendance Comparison</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.compBox, { borderColor: theme.border }]}>
                <Text style={styles.compLabel}>You</Text>
                <Text style={[styles.compVal, { color: theme.primary }]}>
                  {stats?.attendancePercentage?.toFixed(1) ?? '0.0'}%
                </Text>
                <Ionicons
                  name={
                    (stats?.attendancePercentage ?? 0) >=
                    (stats?.classAverage ?? 0)
                      ? 'checkmark-circle'
                      : 'warning'
                  }
                  size={20}
                  color={
                    (stats?.attendancePercentage ?? 0) >=
                    (stats?.classAverage ?? 0)
                      ? theme.success
                      : theme.warning
                  }
                  style={{ marginTop: 6 }}
                />
              </View>

              <View
                style={[
                  styles.compBox,
                  { borderColor: theme.border, marginHorizontal: 12 },
                ]}
              >
                <Text style={styles.compLabel}>Class Avg</Text>
                <Text style={[styles.compVal, { color: theme.success }]}>
                  {stats?.classAverage?.toFixed(1) ?? '0.0'}%
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.compBox, { borderColor: theme.border }]}
                activeOpacity={0.7}
                onPress={() => setIsEditingGoal(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.compLabel}>Goal</Text>
                  <Ionicons
                    name="pencil"
                    size={11}
                    color={theme.subtext}
                    style={{ marginLeft: 3 }}
                  />
                </View>
                <Text style={[styles.compVal, { color: theme.warning }]}>
                  {targetAttendance.toFixed(1)}%
                </Text>
              </TouchableOpacity>
            </View>

            {(stats?.attendancePercentage ?? 0) <
              (stats?.classAverage ?? 0) && (
              <View style={styles.warningBanner}>
                <Ionicons
                  name="warning-outline"
                  size={14}
                  color={theme.warning}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.warningText}>
                  Your attendance is below the class average by{' '}
                  {(
                    (stats?.classAverage ?? 0) -
                    (stats?.attendancePercentage ?? 0)
                  ).toFixed(1)}
                  %
                </Text>
              </View>
            )}
          </Animated.View>

          {/* ── Card 6: Goal Progress ── */}
          <Animated.View
            entering={FadeInUp.delay(300).springify()}
            style={styles.card}
          >
            <View style={styles.cardRowBetween}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons
                  name="disc-outline"
                  size={20}
                  color={theme.text}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.cardHeader}>Academic Goal Progress</Text>
              </View>
              <TouchableOpacity
                style={styles.editGoalBtn}
                onPress={() => setIsEditingGoal(true)}
              >
                <Ionicons name="pencil-outline" size={13} color={theme.primary} />
                <Text style={styles.editGoalBtnText}>Set Goal</Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <Text style={styles.targetTitle}>
                Target: {targetAttendance}% Attendance
              </Text>
              <Text style={styles.targetPercent}>
                {stats?.attendancePercentage?.toFixed(1) ?? '0.0'}%
              </Text>
            </View>

            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(
                      100,
                      stats?.attendancePercentage ?? 0,
                    )}%`,
                  },
                ]}
              />
              {/* Target goal indicator marker */}
              <View
                style={[
                  styles.progressMarker,
                  { left: `${Math.min(100, targetAttendance)}%` as any },
                ]}
              />
            </View>

            <View style={styles.progressMetrics}>
              <Text style={styles.metricText}>
                Current: {stats?.attendancePercentage?.toFixed(1) ?? '0.0'}%
              </Text>
              <Text style={styles.metricText}>
                Class: {stats?.classAverage?.toFixed(1) ?? '0.0'}%
              </Text>
              <Text style={styles.metricText}>
                Need: +
                {Math.max(
                  0,
                  targetAttendance - (stats?.attendancePercentage ?? 0),
                ).toFixed(1)}
                %
              </Text>
            </View>
          </Animated.View>

          {/* ── Card 7: Attendance History with Search & Status Filters ── */}
          <Animated.View
            entering={FadeInUp.delay(340).springify()}
            style={styles.card}
          >
            <View style={styles.cardRowBetween}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={theme.text}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.cardHeader}>
                  {showAllRecords ? 'Full Attendance History' : 'Recent Records'}
                </Text>
              </View>
              {filteredRecords.length > 7 && (
                <TouchableOpacity
                  style={styles.viewAllBtn}
                  onPress={() => setShowAllRecords(v => !v)}
                >
                  <Text style={styles.viewAllText}>
                    {showAllRecords ? 'Show less' : 'View all'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBarContainer}>
              <Ionicons
                name="search-outline"
                size={16}
                color={theme.subtext}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search date, day, or remark..."
                placeholderTextColor={theme.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={theme.subtext}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Status Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsScroll}
            >
              {(
                [
                  'all',
                  'present',
                  'absent',
                  'late',
                  'excused',
                ] as const
              ).map(statusKey => {
                const isActive = filterStatus === statusKey;
                const count =
                  statusKey === 'all'
                    ? records.length
                    : records.filter(
                        r => (r.status || '').toLowerCase() === statusKey,
                      ).length;
                return (
                  <TouchableOpacity
                    key={statusKey}
                    style={[
                      styles.filterPill,
                      isActive && styles.filterPillActive,
                    ]}
                    onPress={() => setFilterStatus(statusKey)}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        isActive && styles.filterPillTextActive,
                      ]}
                    >
                      {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)} (
                      {count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Records Table */}
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, { flex: 1.6 }]}>Date</Text>
                <Text style={[styles.thText, { flex: 0.9 }]}>Day</Text>
                <Text style={[styles.thText, { flex: 1.2 }]}>Status</Text>
                <Text style={[styles.thText, { flex: 1.3 }]}>Remark</Text>
              </View>

              {visibleRecords.length === 0 ? (
                <Text style={styles.emptyText}>
                  No attendance records match your filter.
                </Text>
              ) : (
                visibleRecords.map((row, idx) => {
                  const { pill, text } = getStatusStyle(row.status);
                  return (
                    <View key={row.id ?? idx} style={styles.tableRow}>
                      <Text style={[styles.tdTextBold, { flex: 1.6 }]}>
                        {formatDate(row.date)}
                      </Text>
                      <Text style={[styles.tdText, { flex: 0.9 }]}>
                        {getDayName(row.date)}
                      </Text>
                      <View style={[{ flex: 1.2 }, styles.tdPillWrap]}>
                        <View style={pill}>
                          <Text style={text}>{row.status}</Text>
                        </View>
                      </View>
                      <Text
                        style={[styles.tdText, { flex: 1.3 }]}
                        numberOfLines={1}
                      >
                        {row.notes ?? '----'}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </Animated.View>

          {/* ── Card 8: Official PDF Report (Print & Share) ── */}
          <Animated.View
            entering={FadeInUp.delay(380).springify()}
            style={[styles.card, { marginBottom: 32 }]}
          >
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={theme.text}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.cardHeader}>Generate PDF Report</Text>
            </View>
            <Text style={styles.pdfReportDesc}>
              Generate a formatted PDF attendance summary and full records
              table for official school verification.
            </Text>

            <View style={styles.pdfActionRow}>
              <ScaleButton
                style={[
                  styles.pdfActionButton,
                  { backgroundColor: theme.primary },
                  isGeneratingReport && { opacity: 0.6 },
                ]}
                activeOpacity={0.85}
                scaleTo={0.96}
                disabled={isGeneratingReport}
                onPress={() => handleGenerateReport('print')}
              >
                {isGeneratingReport ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <>
                    <Ionicons
                      name="print-outline"
                      size={16}
                      color={theme.onPrimary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.pdfActionText}>Print Report</Text>
                  </>
                )}
              </ScaleButton>

              <ScaleButton
                style={[
                  styles.pdfActionButton,
                  { backgroundColor: theme.success },
                  isGeneratingReport && { opacity: 0.6 },
                ]}
                activeOpacity={0.85}
                scaleTo={0.96}
                disabled={isGeneratingReport}
                onPress={() => handleGenerateReport('share')}
              >
                {isGeneratingReport ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <>
                    <Ionicons
                      name="share-outline"
                      size={16}
                      color={theme.onPrimary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.pdfActionText}>Save / Share PDF</Text>
                  </>
                )}
              </ScaleButton>
            </View>
          </Animated.View>
        </ScrollView>
      )}

      {/* ── Edit Goal Modal ── */}
      <Modal
        visible={isEditingGoal}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingGoal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Attendance Goal</Text>
            <Text style={styles.modalSubtitle}>
              Target percentage between 50% and 100%:
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              maxLength={3}
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="e.g. 95"
              placeholderTextColor={theme.placeholder}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setIsEditingGoal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSaveBtn]}
                onPress={handleSaveGoal}
              >
                <Text style={styles.modalSaveBtnText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

const getStyles = (theme: Theme, isDarkMode: boolean) =>
  StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingBottom: 20 },

    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      padding: 32,
      backgroundColor: theme.background,
    },
    errorTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    errorSub: {
      fontSize: 13,
      color: theme.subtext,
      textAlign: 'center',
    },
    retryBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 10,
    },
    retryBtnText: {
      color: theme.onPrimary,
      fontWeight: '700',
      fontSize: 14,
    },

    pageTitleWrapper: {
      marginBottom: 16,
      paddingHorizontal: 20,
      marginTop: 16,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.primary,
      marginBottom: 4,
    },
    pageSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

    // ── Cards ──
    card: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 14,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
    },
    cardHeader: { fontSize: 14, fontWeight: '700', color: theme.text },
    cardSubheader: { fontSize: 11, color: theme.subtext, marginTop: 2 },
    cardRowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },

    // ── Stat Boxes ──
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: {
      flex: 1,
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      borderWidth: 1,
      borderColor: theme.border,
      borderLeftWidth: 4,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    statBoxMid: { marginHorizontal: 8 },
    statBoxTitle: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    statBoxVal: { fontSize: 18, fontWeight: '800', marginTop: 2 },

    // ── Monthly boxes ──
    monthBox: {
      flex: 1,
      borderRadius: 10,
      borderWidth: 1,
      paddingVertical: 12,
      paddingHorizontal: 10,
    },
    monthBoxLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.subtext,
      marginBottom: 4,
    },
    monthBoxVal: { fontSize: 18, fontWeight: '800' },
    changeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },

    // ── Calendar ──
    calArrows: { flexDirection: 'row', gap: 6 },
    calBtn: {
      padding: 5,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    calDaysHeader: {
      flexDirection: 'row',
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    calDayText: {
      width: '14.28%',
      textAlign: 'center',
      fontSize: 9,
      fontWeight: '600',
      color: theme.subtext,
    },
    calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calCell: {
      width: '14.28%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
      borderRadius: 6,
    },
    calCellPresent: {
      backgroundColor: isDarkMode
        ? withAlpha(theme.success, 0.25)
        : withAlpha(theme.success, 0.15),
    },
    calCellAbsent: {
      backgroundColor: isDarkMode
        ? withAlpha(theme.danger, 0.25)
        : withAlpha(theme.danger, 0.15),
      borderWidth: 1,
      borderColor: theme.danger,
    },
    calCellLate: {
      backgroundColor: isDarkMode
        ? withAlpha(theme.warning, 0.25)
        : withAlpha(theme.warning, 0.15),
      borderWidth: 1,
      borderColor: theme.warning,
    },
    calCellExcused: {
      backgroundColor: isDarkMode
        ? withAlpha(theme.info, 0.25)
        : withAlpha(theme.info, 0.15),
      borderWidth: 1,
      borderColor: theme.primary,
    },
    calCellToday: { borderWidth: 2, borderColor: theme.primary },
    calCellText: { fontSize: 11, fontWeight: '600', color: theme.text },
    calCellTextPresent: { color: theme.success },
    calCellTextAbsent: { color: theme.danger },
    calCellTextLate: { color: theme.warning },
    calCellTextExcused: { color: theme.primary },
    calDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 10,
    },
    calLegend: { flexDirection: 'row', justifyContent: 'space-around' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendBox: { width: 10, height: 10, borderRadius: 3 },
    legendText: { fontSize: 10, fontWeight: '600', color: theme.text },

    // ── Academic Year badge ──
    yearBadge: {
      marginLeft: 10,
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
    },
    yearBadgeText: { fontSize: 11, fontWeight: '700', color: theme.primary },

    // ── Comparison boxes ──
    compBox: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center',
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
    },
    compLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.subtext,
      marginBottom: 4,
    },
    compVal: { fontSize: 20, fontWeight: '800' },

    // ── Warning banner ──
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? withAlpha(theme.warning, 0.15)
        : withAlpha(theme.warning, 0.1),
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.warning,
    },
    warningText: {
      fontSize: 11,
      color: theme.warning,
      fontWeight: '500',
      flex: 1,
    },

    // ── Progress bar ──
    targetTitle: { fontSize: 12, fontWeight: '700', color: theme.text },
    targetPercent: { fontSize: 14, fontWeight: '800', color: theme.primary },
    progressBarBg: {
      height: 8,
      backgroundColor: isDarkMode ? theme.border : theme.iconBackground,
      borderRadius: 4,
      width: '100%',
      overflow: 'hidden',
      marginBottom: 10,
      position: 'relative',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    progressMarker: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: theme.success,
    },
    progressMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
    metricText: { fontSize: 10, color: theme.subtext, fontWeight: '500' },
    editGoalBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    editGoalBtnText: {
      fontSize: 11,
      color: theme.primary,
      fontWeight: '600',
      marginLeft: 4,
    },

    // ── Search & Filter Bar ──
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? theme.background : theme.iconBackground,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: Platform.OS === 'ios' ? 8 : 4,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 12,
      color: theme.text,
      paddingVertical: 0,
    },
    filterPillsScroll: {
      flexDirection: 'row',
      gap: 6,
      paddingBottom: 10,
    },
    filterPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterPillActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.subtext,
    },
    filterPillTextActive: {
      color: theme.onPrimary,
      fontWeight: '700',
    },

    // ── Table ──
    viewAllBtn: {
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 4,
    },
    viewAllText: { fontSize: 10, fontWeight: '600', color: theme.text },
    table: { marginTop: 4 },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: 6,
      marginBottom: 4,
    },
    thText: { fontSize: 9, fontWeight: '700', color: theme.text },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tdText: { fontSize: 10, color: theme.subtext, fontWeight: '500' },
    tdTextBold: { fontSize: 10, color: theme.text, fontWeight: '700' },
    tdPillWrap: { alignItems: 'flex-start' },

    // Status pills
    statusPresent: {
      backgroundColor: isDarkMode
        ? withAlpha(theme.success, 0.25)
        : withAlpha(theme.success, 0.15),
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 12,
    },
    statusAbsent: {
      backgroundColor: isDarkMode
        ? withAlpha(theme.danger, 0.25)
        : withAlpha(theme.danger, 0.15),
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 12,
    },
    statusLate: {
      backgroundColor: isDarkMode
        ? withAlpha(theme.warning, 0.25)
        : withAlpha(theme.warning, 0.15),
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 12,
    },
    statusExcused: {
      backgroundColor: isDarkMode
        ? withAlpha(theme.info, 0.25)
        : withAlpha(theme.info, 0.15),
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 12,
    },
    statusTextPresent: { fontSize: 9, color: theme.success, fontWeight: '700' },
    statusTextAbsent: { fontSize: 9, color: theme.danger, fontWeight: '700' },
    statusTextLate: { fontSize: 9, color: theme.warning, fontWeight: '700' },
    statusTextExcused: { fontSize: 9, color: theme.primary, fontWeight: '700' },

    // ── PDF button ──
    pdfReportDesc: {
      fontSize: 12,
      color: theme.subtext,
      marginBottom: 14,
      lineHeight: 18,
    },
    pdfActionRow: {
      flexDirection: 'row',
      gap: 12,
    },
    pdfActionButton: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
    },
    pdfActionText: {
      color: theme.onPrimary,
      fontWeight: '700',
      fontSize: 13,
    },

    emptyText: {
      textAlign: 'center',
      color: theme.subtext,
      marginTop: 20,
      fontSize: 13,
    },

    // ── Goal Modal ──
    modalBackdrop: {
      flex: 1,
      backgroundColor: withAlpha(theme.overlay, 0.5),
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
    },
    modalSubtitle: {
      fontSize: 13,
      color: theme.subtext,
      marginBottom: 16,
    },
    modalInput: {
      backgroundColor: isDarkMode ? theme.background : theme.iconBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 18,
      textAlign: 'center',
    },
    modalBtnRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
    },
    modalBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    modalCancelBtn: {
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
    },
    modalCancelBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.subtext,
    },
    modalSaveBtn: {
      backgroundColor: theme.primary,
    },
    modalSaveBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.onPrimary,
    },
  });

export default AttendanceScreen;
