import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import { useAuth } from '../../store/AuthContext';
import studentService from '../../services/studentService';
import { generatePDF } from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import Share from 'react-native-share';
import { toFileUri, toRawFilePath } from '../../utils/fileUtils';

// Navigation type
export type OfficialResultScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OfficialResult'
>;
export type OfficialResultScreenRouteProp = RouteProp<
  RootStackParamList,
  'OfficialResult'
>;

interface Props {
  navigation: OfficialResultScreenNavigationProp;
  route: OfficialResultScreenRouteProp;
}

// ─── HTML Marksheet Template ──────────────────────────────────────────────────

function generateMarksheetHTML(
  resultData: any,
  studentName: string,
  rollNo: string,
  className: string,
  examName: string,
  examType: string,
  academicYear: string,
  percentage: number,
  grade: string,
  outcome: string,
  subjectsList: any[],
): string {
  const institutionName =
    resultData?.institution_name ||
    resultData?.institutionName ||
    'Sharnex Academy';
  const logoInitial = institutionName.charAt(0).toUpperCase();

  const subjectRows = subjectsList
    .map((s: any) => {
      const sName = s.subject_name || s.name || s.subjectName || 'Subject';
      const obtained = Number(
        s.marks_obtained ?? s.marks ?? s.obtainedMarks ?? 0,
      );
      const max = Number(s.max_marks ?? s.maxMarks ?? s.totalMarks ?? 100);
      const sGrade = s.grade || '-';
      const sPct =
        s.percentage != null
          ? Math.round(Number(s.percentage))
          : max > 0
          ? Math.round((obtained / max) * 100)
          : 0;
      const isFailed = s.is_failed || sGrade === 'F';
      const isAbsent = s.is_absent;
      const gradeColor = isFailed ? '#dc2626' : '#16a34a';

      return `
      <tr>
        <td style="font-weight:600;">${sName}</td>
        <td style="text-align:center;">${obtained.toFixed(2)}</td>
        <td style="text-align:center;">${max.toFixed(2)}</td>
        <td style="text-align:center;font-weight:700;color:${gradeColor};">${
        isAbsent ? 'ABSENT' : sGrade
      }</td>
        <td style="text-align:center;">${sPct}%</td>
        <td style="text-align:center;font-weight:700;color:${
          isFailed ? '#dc2626' : '#16a34a'
        };">${isFailed ? 'FAILED' : 'PASSED'}</td>
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
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#1a202c;padding:32px;background:#fff;}
  .letterhead{display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:2px solid #1a202c;}
  .logo-box{width:54px;height:54px;background:#4F46E5;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:900;}
  .inst-center{flex:1;text-align:center;}
  .inst-name{font-size:22px;font-weight:900;letter-spacing:0.02em;color:#1e1b4b;}
  .inst-title{font-size:12px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;}
  .student-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin:20px 0;}
  .grid-cell{padding:10px 14px;border-bottom:1px solid #e2e8f0;}
  .grid-cell:nth-child(odd){border-right:1px solid #e2e8f0;}
  .cell-label{font-size:9px;color:#718096;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;}
  .cell-value{font-size:13px;font-weight:700;margin-top:2px;color:#0f172a;}
  table{width:100%;border-collapse:collapse;margin:20px 0;font-size:11px;}
  th,td{border:1px solid #cbd5e0;padding:8px 10px;vertical-align:middle;}
  th{background:#f8fafc;font-weight:700;font-size:10px;color:#475569;}
  .summary-card{display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;padding:14px 20px;border-radius:8px;margin:20px 0;}
  .summary-item{text-align:center;}
  .summary-label{font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;}
  .summary-val{font-size:18px;font-weight:900;color:#0f172a;margin-top:2px;}
  .signatures{display:flex;justify-content:space-around;margin-top:50px;margin-bottom:24px;}
  .sign-item{text-align:center;width:150px;}
  .sign-line{border-bottom:1px solid #1a202c;margin-bottom:6px;}
  .sign-label{font-size:9px;color:#718096;text-transform:uppercase;letter-spacing:0.08em;}
  .footer{text-align:center;border-top:1px solid #e2e8f0;padding-top:14px;font-size:10px;color:#94a3b8;}
</style>
</head>
<body>
  <div class="letterhead">
    <div class="logo-box">${logoInitial}</div>
    <div class="inst-center">
      <div class="inst-name">${institutionName.toUpperCase()}</div>
      <div class="inst-title">OFFICIAL STATEMENT OF MARKS</div>
    </div>
  </div>

  <div class="student-grid">
    <div class="grid-cell"><div class="cell-label">Student Name</div><div class="cell-value">${studentName.toUpperCase()}</div></div>
    <div class="grid-cell"><div class="cell-label">Roll Number</div><div class="cell-value">${rollNo}</div></div>
    <div class="grid-cell"><div class="cell-label">Class & Section</div><div class="cell-value">${className}</div></div>
    <div class="grid-cell"><div class="cell-label">Academic Year / Term</div><div class="cell-value">${academicYear}</div></div>
    <div class="grid-cell" style="border-bottom:none;"><div class="cell-label">Examination</div><div class="cell-value">${examName} (${examType})</div></div>
    <div class="grid-cell" style="border-bottom:none;"><div class="cell-label">Result Status</div><div class="cell-value" style="color:${
      outcome === 'PASS' ? '#16a34a' : '#dc2626'
    }">${outcome}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;">Subject</th>
        <th>Marks Obtained</th>
        <th>Max Marks</th>
        <th>Grade</th>
        <th>Percentage</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${subjectRows}
    </tbody>
  </table>

  <div class="summary-card">
    <div class="summary-item"><div class="summary-label">Total Percentage</div><div class="summary-val">${percentage}%</div></div>
    <div class="summary-item"><div class="summary-label">Overall Grade</div><div class="summary-val">${grade}</div></div>
    <div class="summary-item"><div class="summary-label">Final Outcome</div><div class="summary-val" style="color:${
      outcome === 'PASS' ? '#16a34a' : '#dc2626'
    }">${outcome}</div></div>
  </div>

  <div class="signatures">
    <div class="sign-item"><div class="sign-line"></div><div class="sign-label">Class Teacher</div></div>
    <div class="sign-item"><div class="sign-line"></div><div class="sign-label">Exam Controller</div></div>
    <div class="sign-item"><div class="sign-line"></div><div class="sign-label">Principal</div></div>
  </div>

  <div class="footer">
    Issued by Sharnex Academic Result Management System &bull; Official Marksheet
  </div>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const OfficialResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotPublished, setIsNotPublished] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const fetchResultData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);
        setIsNotPublished(false);

        const examId = (route?.params?.examId ||
          (route?.params as any)?.resultId) as string;
        if (!examId) {
          throw new Error('Exam ID is required');
        }

        const response = await studentService.getOfficialResult(examId);
        const data = response.data?.data || response.data;

        if (!data) {
          setIsNotPublished(true);
        } else {
          setResultData(data);
        }
      } catch (err: any) {
        console.error('Error fetching result:', err);
        const status = err?.response?.status;
        const message =
          err?.response?.data?.message || err?.message || '';
        if (status === 404 || message.toLowerCase().includes('not found')) {
          setIsNotPublished(true);
        } else {
          setError(message || 'Failed to load result');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [route?.params],
  );

  useEffect(() => {
    fetchResultData();
  }, [fetchResultData]);

  const studentName =
    resultData?.student_name ||
    resultData?.studentName ||
    authState.user?.name ||
    'Student';
  const rollNo = resultData?.roll_no || resultData?.rollNumber || 'N/A';
  const className = resultData?.class_name
    ? `${resultData.class_name}${
        resultData.section ? ` (${resultData.section})` : ''
      }`
    : resultData?.className || 'N/A';
  const examName =
    resultData?.exam_name || resultData?.examName || 'Examination';
  const examType = resultData?.exam_type || resultData?.examType || 'EXAM';
  const academicYear = resultData?.academic_year || resultData?.term || 'N/A';
  const percentage =
    resultData?.percentage != null
      ? Math.round(Number(resultData.percentage))
      : 0;
  const grade = resultData?.grade || resultData?.overallGrade || 'N/A';
  const outcome = resultData?.outcome || resultData?.status || 'PASS';
  const subjectsList: any[] = resultData?.subjects || [];

  const handleGenerateAndHandlePDF = async (action: 'print' | 'share') => {
    if (!resultData) return;
    try {
      setIsGeneratingPDF(true);
      const html = generateMarksheetHTML(
        resultData,
        studentName,
        rollNo,
        className,
        examName,
        examType,
        academicYear,
        percentage,
        grade,
        outcome,
        subjectsList,
      );

      const file = await generatePDF({
        html,
        fileName: `Marksheet_${studentName.replace(/\s+/g, '_')}_${rollNo}`,
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
          title: `${examName} Marksheet`,
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
      console.error('[OfficialResultScreen] PDF error:', err);
      if (action === 'print') {
        Alert.alert('Print Error', 'Could not open print preview. Please try again.');
      } else {
        Alert.alert(
          'Share Error',
          'Could not generate or share the marksheet. Please try again.',
        );
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const onRefresh = () => fetchResultData(true);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading Official Marksheet...</Text>
      </View>
    );
  }

  if (isNotPublished) {
    return (
      <View style={styles.emptyContainer}>
        <StudentHeader
          title="Official Marksheet"
          navigation={navigation}
          onMenuPress={() => setDrawerOpen(true)}
        />
        <View style={styles.centerBox}>
          <Ionicons
            name="lock-closed-outline"
            size={64}
            color={theme.subtext}
          />
          <Text style={styles.notPublishedTitle}>Result Not Published</Text>
          <Text style={styles.notPublishedSubtitle}>
            The institution has not released the official marksheet for this
            examination yet. Please check back later.
          </Text>
          <ScaleButton
            style={[styles.backBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
            scaleTo={0.95}
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color={theme.onPrimary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.backBtnText}>Go Back</Text>
          </ScaleButton>
        </View>
        <NavigationDrawer
          isOpen={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          role="student"
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <StudentHeader
          title="Official Marksheet"
          navigation={navigation}
          onMenuPress={() => setDrawerOpen(true)}
        />
        <View style={styles.centerBox}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={theme.danger}
          />
          <Text style={styles.errorTitle}>{error}</Text>
          <ScaleButton
            style={[styles.backBtn, { backgroundColor: theme.primary }]}
            onPress={() => fetchResultData()}
            scaleTo={0.95}
          >
            <Ionicons
              name="refresh"
              size={18}
              color={theme.onPrimary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.backBtnText}>Retry</Text>
          </ScaleButton>
        </View>
        <NavigationDrawer
          isOpen={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          role="student"
        />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <StudentHeader
        title="Official Marksheet"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <Animated.View
          entering={FadeInUp.delay(100).springify()}
          style={styles.profileCard}
        >
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Text style={styles.avatarText}>
                {studentName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{studentName}</Text>
              <Text style={styles.profileMeta}>
                ROLL: {rollNo} CLASS: {className}{' '}
                <Text style={styles.examBadge}>{examType}</Text>
              </Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scorePercent}>{percentage}%</Text>
              <Text style={styles.scoreGrade}>GRADE {grade}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.sectionCard}
        >
          <Text style={styles.sectionTitle}>
            SUBJECT-WISE PERFORMANCE SHEET
          </Text>
          <View style={styles.subjectRowHeader}>
            <Text style={styles.subjectColSubject}>SUBJECT</Text>
            <Text style={styles.subjectColMarks}>MARKS</Text>
            <Text style={styles.subjectColMax}>MAX</Text>
            <Text style={styles.subjectColGrade}>GRADE</Text>
            <Text style={styles.subjectColProgress}>PROGRESS</Text>
          </View>
          {subjectsList.map((subject: any, idx: number) => {
            const sName =
              subject.subject_name ||
              subject.name ||
              subject.subjectName ||
              'Subject';
            const obtained = Number(
              subject.marks_obtained ??
                subject.marks ??
                subject.obtainedMarks ??
                0,
            );
            const max = Number(
              subject.max_marks ??
                subject.maxMarks ??
                subject.totalMarks ??
                100,
            );
            const sGrade = subject.grade || 'N/A';
            const sPct =
              subject.percentage != null
                ? Math.round(Number(subject.percentage))
                : max > 0
                ? Math.round((obtained / max) * 100)
                : 0;

            return (
              <View
                style={styles.subjectRow}
                key={subject.subject_id || subject.id || idx}
              >
                <Text style={styles.subjectColSubjectLink}>{sName}</Text>
                <Text style={styles.subjectColMarks}>{obtained.toFixed(2)}</Text>
                <Text style={styles.subjectColMax}>{max.toFixed(2)}</Text>
                <Text style={styles.subjectColGrade}>{sGrade}</Text>
                <View style={styles.subjectColProgressBar}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(100, sPct)}%`,
                        backgroundColor: subject.is_failed
                          ? theme.danger
                          : theme.primary,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.subjectColProgressText,
                    subject.is_failed && { color: theme.danger },
                  ]}
                >
                  {sPct}%
                </Text>
              </View>
            );
          })}
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={styles.statusRow}
        >
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <Text
              style={[
                styles.statusValue,
                outcome === 'PASS'
                  ? { color: theme.success }
                  : { color: theme.danger },
              ]}
            >
              {outcome}
            </Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>TOTAL SUBJECTS</Text>
            <Text style={styles.statusValue}>
              {subjectsList.length} Evaluated
            </Text>
          </View>
        </Animated.View>

        {/* Marksheet PDF Action Buttons */}
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.pdfButtonRow}
        >
          <ScaleButton
            style={[
              styles.pdfActionBtn,
              { backgroundColor: theme.primary },
              isGeneratingPDF && { opacity: 0.6 },
            ]}
            onPress={() => handleGenerateAndHandlePDF('print')}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <ActivityIndicator size="small" color={theme.onPrimary} />
            ) : (
              <>
                <Ionicons
                  name="print-outline"
                  size={18}
                  color={theme.onPrimary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.pdfActionBtnText}>Print Marksheet</Text>
              </>
            )}
          </ScaleButton>

          <ScaleButton
            style={[
              styles.pdfActionBtn,
              { backgroundColor: theme.success },
              isGeneratingPDF && { opacity: 0.6 },
            ]}
            onPress={() => handleGenerateAndHandlePDF('share')}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <ActivityIndicator size="small" color={theme.onPrimary} />
            ) : (
              <>
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={theme.onPrimary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.pdfActionBtnText}>Save / Share PDF</Text>
              </>
            )}
          </ScaleButton>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingBottom: 40 },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: '600',
      color: theme.subtext,
    },
    emptyContainer: { flex: 1, backgroundColor: theme.background },
    centerBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
    },
    notPublishedTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    notPublishedSubtitle: {
      fontSize: 13,
      color: theme.subtext,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    errorTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.danger,
      marginTop: 16,
      marginBottom: 24,
      textAlign: 'center',
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
    },
    backBtnText: { color: theme.onPrimary, fontWeight: '700', fontSize: 14 },
    profileCard: {
      backgroundColor: theme.surface,
      margin: 16,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
    },
    profileRow: { flexDirection: 'row', alignItems: 'center' },
    profileAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: { color: theme.onPrimary, fontSize: 20, fontWeight: '800' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 16, fontWeight: '800', color: theme.text },
    profileMeta: { fontSize: 11, color: theme.subtext, marginTop: 4 },
    examBadge: { color: theme.primary, fontWeight: '700' },
    scoreBox: { alignItems: 'flex-end', justifyContent: 'center' },
    scorePercent: { fontSize: 22, fontWeight: '900', color: theme.primary },
    scoreGrade: { fontSize: 11, fontWeight: '800', color: theme.subtext },
    sectionCard: {
      backgroundColor: theme.surface,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.subtext,
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    subjectRowHeader: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      alignItems: 'center',
    },
    subjectColSubject: {
      flex: 2,
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
    },
    subjectColMarks: {
      flex: 1,
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
      textAlign: 'center',
    },
    subjectColMax: {
      flex: 1,
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
      textAlign: 'center',
    },
    subjectColGrade: {
      flex: 1,
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
      textAlign: 'center',
    },
    subjectColProgress: {
      flex: 1.5,
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
      textAlign: 'right',
    },
    subjectRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      alignItems: 'center',
    },
    subjectColSubjectLink: {
      flex: 2,
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    subjectColProgressBar: { flex: 1, height: 6, marginHorizontal: 4 },
    progressBar: { height: 6, borderRadius: 3 },
    subjectColProgressText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
      width: 32,
      textAlign: 'right',
    },
    statusRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      gap: 12,
      marginBottom: 16,
    },
    statusBox: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
    },
    statusLabel: { fontSize: 10, fontWeight: '800', color: theme.subtext },
    statusValue: {
      fontSize: 16,
      fontWeight: '900',
      color: theme.text,
      marginTop: 4,
    },
    pdfButtonRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      gap: 12,
      marginTop: 8,
      marginBottom: 20,
    },
    pdfActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      elevation: 3,
    },
    pdfActionBtnText: {
      color: theme.onPrimary,
      fontWeight: '700',
      fontSize: 13,
    },
  });

export default OfficialResultScreen;
