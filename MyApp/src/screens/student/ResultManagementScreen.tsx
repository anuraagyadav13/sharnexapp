import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import { useAuth } from '../../store/AuthContext';
import studentService from '../../services/studentService';
import { generatePDF } from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import Share from 'react-native-share';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Column widths for the pivoted table ─────────────────────────────────────
const COL_SUBJECT_W = 120;
const COL_EXAM_W = 130;

// ─── Types (verbatim from studentService.ts contract) ────────────────────────

interface SubjectMarkEntry {
  marks: number;
  maxMarks: number;
  grade: string;
}

interface ExamRow {
  examId: string;
  examName: string;
  academicYear: string;
  totalMarks: number;
  maxTotal: number;
  percentage: number;
  grade: string;
  outcome: string;
  publishedAt: string;
  subjectMarks: Record<string, SubjectMarkEntry>;
}

interface StudentInfo {
  name: string;
  rollNumber: string;
  parentName: string;
  dateOfBirth: string;
  className: string;
  section: string;
  institutionId: string;
}

interface AllResultsData {
  student: StudentInfo;
  institutionName: string;
  institutionLogoUrl: string | null;
  institutionAddress: string | null;
  subjects: Array<{ subjectId: string; subjectName: string }>;
  exams: ExamRow[];
}

// ─── HTML Transcript Template ─────────────────────────────────────────────────
// Colors here are intentionally hardcoded document-style because this HTML
// renders in the system print engine, independent of the app's live theme.

function generateTranscriptHTML(data: AllResultsData): string {
  const {
    student,
    institutionName,
    institutionLogoUrl,
    institutionAddress,
    subjects,
    exams,
  } = data;

  const logoCell = institutionLogoUrl
    ? `<img src="${institutionLogoUrl}" style="width:56px;height:56px;object-fit:contain;border-radius:8px;" alt="Logo" />`
    : `<div style="width:56px;height:56px;background:#4F46E5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:900;">${(
        institutionName || 'S'
      )
        .charAt(0)
        .toUpperCase()}</div>`;

  const examHeaders = exams
    .map(
      e =>
        `<th>${e.examName}<br/><span style="font-weight:400;font-size:9px">— ${
          e.academicYear || ''
        }</span></th>`,
    )
    .join('');

  const subjectRows = subjects
    .map(sub => {
      const cells = exams
        .map(exam => {
          const entry = exam.subjectMarks[sub.subjectId];
          if (!entry) {
            return `<td style="text-align:center;color:#aaa;">—</td>`;
          }
          const g = entry.grade || '-';
          const gradeColor =
            g === 'F' ? '#dc2626' : g !== '-' ? '#16a34a' : '#6b7280';
          return `<td style="text-align:center;">${Number(entry.marks).toFixed(
            2,
          )}/${Number(entry.maxMarks).toFixed(
            2,
          )}<br/><span style="color:${gradeColor};font-size:9px;font-weight:600;">${g}</span></td>`;
        })
        .join('');
      return `<tr><td style="font-weight:600;">${sub.subjectName}</td>${cells}</tr>`;
    })
    .join('');

  const grandTotalCells = exams
    .map(
      e =>
        `<td style="text-align:center;font-weight:700;">${Number(
          e.totalMarks,
        ).toFixed(2)}/${Number(e.maxTotal).toFixed(2)}</td>`,
    )
    .join('');

  const summaryRows = exams
    .map(e => {
      const pct = parseFloat(Number(e.percentage).toFixed(1));
      const isFail = e.outcome === 'FAIL';
      return `<tr>
        <td>${e.examName}</td>
        <td style="text-align:center;">${pct}%</td>
        <td style="text-align:center;">${e.grade}</td>
        <td style="text-align:center;font-weight:700;color:${
          isFail ? '#dc2626' : '#1a202c'
        }">${e.outcome}</td>
      </tr>`;
    })
    .join('');

  const dobDisplay = (() => {
    if (!student.dateOfBirth) return '—';
    try {
      return new Date(student.dateOfBirth).toLocaleDateString('en-IN');
    } catch {
      return student.dateOfBirth;
    }
  })();

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1a202c;padding:32px;background:#fff;}
  .letterhead{display:flex;align-items:center;gap:16px;padding-bottom:16px;}
  .inst-center{flex:1;text-align:center;}
  .inst-name{font-size:22px;font-weight:900;letter-spacing:0.02em;}
  .inst-addr{font-size:9px;color:#718096;margin-top:4px;line-height:1.5;}
  hr{border:none;border-top:2px solid #1a202c;margin:0 0 20px;}
  .student-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;margin-bottom:24px;}
  .grid-cell{padding:8px 12px;border-bottom:1px solid #e2e8f0;}
  .grid-cell:nth-child(odd){border-right:1px solid #e2e8f0;}
  .cell-label{font-size:8px;color:#718096;text-transform:uppercase;letter-spacing:0.08em;}
  .cell-value{font-size:13px;font-weight:700;margin-top:2px;}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:10px;}
  th,td{border:1px solid #cbd5e0;padding:7px 8px;vertical-align:middle;}
  th{background:#f7fafc;font-weight:700;font-size:9px;}
  .grand-total td{background:#f7fafc;font-weight:700;}
  .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#2d3748;margin-bottom:10px;}
  .signatures{display:flex;justify-content:space-around;margin-top:48px;margin-bottom:24px;}
  .sign-item{text-align:center;width:160px;}
  .sign-line{border-bottom:1px solid #1a202c;margin-bottom:6px;}
  .sign-label{font-size:8px;color:#718096;text-transform:uppercase;letter-spacing:0.08em;}
  .footer{display:flex;align-items:center;justify-content:center;gap:10px;border-top:1px solid #e2e8f0;padding-top:12px;}
  .footer-logo{width:24px;height:24px;background:#4F46E5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:900;}
  .footer-text{font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#718096;}
</style>
</head>
<body>
  <div class="letterhead">
    ${logoCell}
    <div class="inst-center">
      <div class="inst-name">${(institutionName || 'School').toUpperCase()}</div>
      <div class="inst-addr">${institutionAddress || ''}</div>
    </div>
  </div>
  <hr/>

  <div class="student-grid">
    <div class="grid-cell"><div class="cell-label">Name</div><div class="cell-value">${(
      student.name || ''
    ).toUpperCase()}</div></div>
    <div class="grid-cell"><div class="cell-label">Roll No.</div><div class="cell-value">${
      student.rollNumber || 'N/A'
    }</div></div>
    <div class="grid-cell"><div class="cell-label">Father's Name</div><div class="cell-value">${
      student.parentName || '—'
    }</div></div>
    <div class="grid-cell"><div class="cell-label">Date of Birth</div><div class="cell-value">${dobDisplay}</div></div>
    <div class="grid-cell"><div class="cell-label">Class</div><div class="cell-value">${
      student.className || '—'
    }</div></div>
    <div class="grid-cell" style="border-bottom:none;"><div class="cell-label">Section</div><div class="cell-value">${
      student.section || '—'
    }</div></div>
  </div>

  <table>
    <thead><tr>
      <th style="text-align:left;min-width:100px;">Subject Name</th>
      ${examHeaders}
    </tr></thead>
    <tbody>
      ${subjectRows}
      <tr class="grand-total"><td><strong>Grand Total</strong></td>${grandTotalCells}</tr>
    </tbody>
  </table>

  <div class="section-title">Exam Performance Summary</div>
  <table>
    <thead><tr>
      <th style="text-align:left;">Exam</th>
      <th>Percentage</th>
      <th>Grade</th>
      <th>Result</th>
    </tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <div class="signatures">
    <div class="sign-item"><div class="sign-line"></div><div class="sign-label">Class Teacher</div></div>
    <div class="sign-item"><div class="sign-line"></div><div class="sign-label">Examination In-Charge</div></div>
    <div class="sign-item"><div class="sign-line"></div><div class="sign-label">Principal</div></div>
  </div>

  <div class="footer">
    <span class="footer-logo">S</span>
    <span class="footer-text">Issued by Sharnex</span>
  </div>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<RootStackParamList, 'ResultManagement'>;
interface Props {
  navigation: NavProp;
}

const ResultManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { authState } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [allData, setAllData] = useState<AllResultsData | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExamDropdown, setShowExamDropdown] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async (refreshing = false) => {
    try {
      if (!refreshing) {
        setIsLoading(true);
      }
      setError(null);
      const res = await studentService.getStudentAllResults();
      // apiClient wraps the response in a Proxy; both res.data.data and res.data
      // target the same AllResultsData object — using the established dual-key pattern.
      const raw = (res.data?.data ?? res.data) as AllResultsData | null;
      console.log('DEBUG_RAW_RESULTS:', JSON.stringify(raw));
      setAllData(raw);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load academic results';
      setError(msg);
      console.error('[ResultManagement] fetchData error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  // ── Derived Values ─────────────────────────────────────────────────────────
  const displayedExams = useMemo((): ExamRow[] => {
    if (!allData) return [];
    if (!selectedExamId) return allData.exams;
    const found = allData.exams.find(e => e.examId === selectedExamId);
    return found ? [found] : allData.exams;
  }, [allData, selectedExamId]);

  const selectedExam = useMemo((): ExamRow | null => {
    if (!allData || !selectedExamId) return null;
    return allData.exams.find(e => e.examId === selectedExamId) ?? null;
  }, [allData, selectedExamId]);

  const publishedCount = allData?.exams?.length ?? 0;

  const tableLabel = selectedExamId
    ? (selectedExam?.examName ?? 'EXAM RESULTS').toUpperCase()
    : 'ALL EXAMS — COMBINED PERFORMANCE';

  const studentInitials = useMemo(() => {
    const name = allData?.student?.name || authState.user?.name || 'S';
    return name
      .split(' ')
      .map((w: string) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [allData, authState.user]);

  // ── PDF Generation ─────────────────────────────────────────────────────────
  const generateAndHandlePDF = useCallback(
    async (action: 'print' | 'share') => {
      if (!allData) return;
      setIsPrinting(true);
      try {
        const html = generateTranscriptHTML(allData);
        
        const file = await generatePDF({
          html: html,
          fileName: `Transcript_${allData.student.rollNumber || 'Student'}`,
          directory: 'Documents',
        });

        if (!file.filePath) {
          throw new Error('Failed to create PDF file');
        }

        if (action === 'print') {
          await RNPrint.print({ filePath: file.filePath });
        } else {
          await Share.open({
            url: `file://${file.filePath}`,
            type: 'application/pdf',
            title: 'Save or Share Academic Transcript',
          });
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Failed to generate PDF';
        Alert.alert('PDF Error', msg);
        console.error('[ResultManagement] PDF error:', err);
      } finally {
        setIsPrinting(false);
      }
    },
    [allData],
  );

  // ── Render: Grade Badge ────────────────────────────────────────────────────
  const renderGradeBadge = (grade: string | undefined) => {
    const g = grade || '-';
    const isFail = g === 'F';
    const isGood = g !== '-' && g !== 'F';
    const badgeBg = isFail
      ? theme.danger + '25'
      : isGood
      ? theme.success + '25'
      : theme.border;
    const badgeColor = isFail
      ? theme.danger
      : isGood
      ? theme.success
      : theme.subtext;
    return (
      <View style={[styles.gradeBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.gradeBadgeText, { color: badgeColor }]}>{g}</Text>
      </View>
    );
  };

  // ── Render: Pivoted Table ──────────────────────────────────────────────────
  const renderTable = () => {
    if (
      !allData ||
      displayedExams.length === 0 ||
      allData.subjects.length === 0
    ) {
      return null;
    }
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={styles.tableScroll}>
        <View>
          {/* Header row */}
          <View
            style={[
              styles.tableRow,
              styles.tableHeaderRow,
              {
                backgroundColor: theme.cardNested,
              },
            ]}>
            <View
              style={[
                styles.tableHeaderCell,
                { width: COL_SUBJECT_W, borderRightColor: theme.border },
              ]}>
              <Text style={[styles.tableHeaderText, { color: theme.subtext }]}>
                SUBJECT
              </Text>
            </View>
            {displayedExams.map(exam => (
              <View
                key={exam.examId}
                style={[
                  styles.tableHeaderCell,
                  { width: COL_EXAM_W, borderRightColor: theme.border },
                ]}>
                <Text
                  style={[styles.tableHeaderText, { color: theme.text }]}
                  numberOfLines={2}>
                  {exam.examName.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>

          {/* Subject rows */}
          {allData.subjects.map((sub, idx) => (
            <View
              key={sub.subjectId}
              style={[
                styles.tableRow,
                {
                  backgroundColor:
                    idx % 2 === 0
                      ? theme.surface
                      : theme.cardNested,
                  borderTopColor: theme.border,
                },
              ]}>
              <View
                style={[
                  styles.tableSubjectCell,
                  { width: COL_SUBJECT_W, borderRightColor: theme.border },
                ]}>
                <Text
                  style={[styles.tableSubjectText, { color: theme.text }]}
                  numberOfLines={1}>
                  {sub.subjectName.toUpperCase()}
                </Text>
              </View>
              {displayedExams.map(exam => {
                const entry = exam.subjectMarks[sub.subjectId];
                return (
                  <View
                    key={exam.examId}
                    style={[
                      styles.tableCell,
                      { width: COL_EXAM_W, borderRightColor: theme.border },
                    ]}>
                    {entry ? (
                      <>
                        <Text
                          style={[
                            styles.tableCellMarks,
                            { color: theme.text },
                          ]}>
                          {Number(entry.marks).toFixed(2)}/
                          {Number(entry.maxMarks).toFixed(2)}
                        </Text>
                        {renderGradeBadge(entry.grade)}
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.tableCellDash,
                          { color: theme.subtext },
                        ]}>
                        —
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Grand Total row — uses backend's pre-computed totalMarks/maxTotal per exam */}
          <View
            style={[
              styles.tableRow,
              styles.grandTotalRow,
              {
                backgroundColor: theme.iconBackground,
                borderTopColor: theme.primary + '50',
              },
            ]}>
            <View
              style={[
                styles.tableSubjectCell,
                { width: COL_SUBJECT_W, borderRightColor: theme.border },
              ]}>
              <Text style={[styles.grandTotalLabel, { color: theme.text }]}>
                {'GRAND\nTOTAL'}
              </Text>
            </View>
            {displayedExams.map(exam => (
              <View
                key={exam.examId}
                style={[
                  styles.tableCell,
                  { width: COL_EXAM_W, borderRightColor: theme.border },
                ]}>
                <Text
                  style={[styles.grandTotalValue, { color: theme.text }]}>
                  {Number(exam.totalMarks).toFixed(2)}/
                  {Number(exam.maxTotal).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  // ── Render: Transcript Modal ───────────────────────────────────────────────
  const renderTranscriptModal = () => {
    if (!allData) return null;
    const {
      student,
      institutionName,
      institutionAddress,
      institutionLogoUrl,
      subjects,
      exams,
    } = allData;

    const dobDisplay = (() => {
      if (!student.dateOfBirth) return '—';
      try {
        return new Date(student.dateOfBirth).toLocaleDateString('en-IN');
      } catch {
        return student.dateOfBirth;
      }
    })();

    const studentFields: [string, string][] = [
      ['NAME', (student.name || '').toUpperCase()],
      ['ROLL NO.', student.rollNumber || 'N/A'],
      ["FATHER'S NAME", student.parentName || '—'],
      ['DATE OF BIRTH', dobDisplay],
      ['CLASS', student.className || '—'],
      ['SECTION', student.section || '—'],
    ];

    return (
      <Modal
        visible={showTranscript}
        animationType="slide"
        onRequestClose={() => setShowTranscript(false)}>
        {/* The SafeAreaView and scroll use fixed document colours (#fff / #1a202c).
            The modal chrome (header) uses theme tokens. */}
        <SafeAreaView style={styles.transcriptSafeArea}>
          {/* Modal chrome — themed */}
          <View
            style={[
              styles.transcriptModalHeader,
              {
                backgroundColor: theme.surface,
                borderBottomColor: theme.border,
              },
            ]}>
            <TouchableOpacity
              onPress={() => setShowTranscript(false)}
              style={styles.transcriptCloseBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text
              style={[styles.transcriptModalTitle, { color: theme.text }]}>
              Academic Transcript
            </Text>
            <View style={styles.transcriptHeaderActions}>
              <TouchableOpacity
                style={[
                  styles.transcriptActionBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: isPrinting ? 0.6 : 1,
                  },
                ]}
                onPress={() => generateAndHandlePDF('print')}
                disabled={isPrinting}
                activeOpacity={0.8}>
                <Ionicons name="print-outline" size={14} color="#fff" />
                <Text style={styles.transcriptActionText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.transcriptActionBtn,
                  {
                    backgroundColor: theme.success,
                    opacity: isPrinting ? 0.6 : 1,
                  },
                ]}
                onPress={() => generateAndHandlePDF('share')}
                disabled={isPrinting}
                activeOpacity={0.8}>
                <Ionicons name="share-outline" size={14} color="#fff" />
                <Text style={styles.transcriptActionText}>Save PDF</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isPrinting && (
            <View
              style={[
                styles.printingBanner,
                {
                  backgroundColor: theme.primary + '15',
                  borderBottomColor: theme.border,
                },
              ]}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text
                style={[
                  styles.printingBannerText,
                  { color: theme.primary },
                ]}>
                Generating PDF…
              </Text>
            </View>
          )}

          {/* Document body — always white, document-style colours */}
          <ScrollView
            style={styles.transcriptScroll}
            contentContainerStyle={styles.transcriptScrollContent}
            showsVerticalScrollIndicator={false}>

            {/* Letterhead */}
            <View style={styles.transcriptLetterhead}>
              {institutionLogoUrl ? (
                <Image
                  source={{ uri: institutionLogoUrl }}
                  style={styles.transcriptLogo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.transcriptLogoPlaceholder}>
                  <Text style={styles.transcriptLogoInitial}>
                    {(institutionName || 'S').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.transcriptInstCenter}>
                <Text style={styles.transcriptInstName}>
                  {(institutionName || '').toUpperCase()}
                </Text>
                {!!institutionAddress && (
                  <Text style={styles.transcriptInstAddr}>
                    {institutionAddress}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.transcriptHR} />

            {/* Student info 2-column grid */}
            <View style={styles.transcriptStudentGrid}>
              {studentFields.map(([label, value]) => (
                <View key={label} style={styles.transcriptGridCell}>
                  <Text style={styles.transcriptGridLabel}>{label}</Text>
                  <Text style={styles.transcriptGridValue}>{value}</Text>
                </View>
              ))}
            </View>

            {/* Subject × Exam marks table */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              style={styles.transcriptTableScroll}>
              <View>
                {/* Table header */}
                <View
                  style={[styles.transcriptTRow, styles.transcriptTHeaderRow]}>
                  <View style={styles.transcriptSubjectTH}>
                    <Text style={styles.transcriptTHText}>SUBJECT NAME</Text>
                  </View>
                  {exams.map(e => (
                    <View key={e.examId} style={styles.transcriptExamTH}>
                      <Text style={styles.transcriptTHText}>{e.examName}</Text>
                      <Text style={styles.transcriptTHYear}>
                        — {e.academicYear}
                      </Text>
                    </View>
                  ))}
                </View>
                {/* Subject data rows */}
                {subjects.map((sub, idx) => (
                  <View
                    key={sub.subjectId}
                    style={[
                      styles.transcriptTRow,
                      { backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' },
                    ]}>
                    <View
                      style={[
                        styles.transcriptSubjectTD,
                        styles.transcriptTDTop,
                      ]}>
                      <Text style={styles.transcriptSubjectTDText}>
                        {sub.subjectName}
                      </Text>
                    </View>
                    {exams.map(exam => {
                      const entry = exam.subjectMarks[sub.subjectId];
                      return (
                        <View
                          key={exam.examId}
                          style={[
                            styles.transcriptExamTD,
                            styles.transcriptTDTop,
                          ]}>
                          {entry ? (
                            <>
                              <Text style={styles.transcriptCellMarks}>
                                {Number(entry.marks).toFixed(2)}/
                                {Number(entry.maxMarks).toFixed(2)}
                              </Text>
                              <Text
                                style={[
                                  styles.transcriptCellGrade,
                                  {
                                    color:
                                      entry.grade === 'F'
                                        ? '#dc2626'
                                        : entry.grade && entry.grade !== '-'
                                        ? '#16a34a'
                                        : '#9ca3af',
                                  },
                                ]}>
                                {entry.grade || '-'}
                              </Text>
                            </>
                          ) : (
                            <Text style={styles.transcriptCellDash}>—</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
                {/* Grand Total row */}
                <View
                  style={[styles.transcriptTRow, styles.transcriptTGrandRow]}>
                  <View
                    style={[
                      styles.transcriptSubjectTD,
                      styles.transcriptTDTop,
                    ]}>
                    <Text
                      style={[
                        styles.transcriptSubjectTDText,
                        { fontWeight: '900' },
                      ]}>
                      GRAND TOTAL
                    </Text>
                  </View>
                  {exams.map(e => (
                    <View
                      key={e.examId}
                      style={[
                        styles.transcriptExamTD,
                        styles.transcriptTDTop,
                      ]}>
                      <Text
                        style={[
                          styles.transcriptCellMarks,
                          { fontWeight: '800' },
                        ]}>
                        {Number(e.totalMarks).toFixed(2)}/
                        {Number(e.maxTotal).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Exam performance summary table */}
            <Text style={styles.transcriptSectionTitle}>
              EXAM PERFORMANCE SUMMARY
            </Text>
            <View style={styles.transcriptSummaryTable}>
              <View style={styles.transcriptSummaryHeaderRow}>
                {(['EXAM', 'PERCENTAGE', 'GRADE', 'RESULT'] as const).map(
                  h => (
                    <Text
                      key={h}
                      style={[
                        styles.transcriptSummaryCell,
                        styles.transcriptSummaryTH,
                        h === 'EXAM'
                          ? { flex: 2, textAlign: 'left' }
                          : undefined,
                      ]}>
                      {h}
                    </Text>
                  ),
                )}
              </View>
              {exams.map(e => {
                const pct = parseFloat(Number(e.percentage).toFixed(1));
                const isFail = e.outcome === 'FAIL';
                return (
                  <View key={e.examId} style={styles.transcriptSummaryDataRow}>
                    <Text
                      style={[
                        styles.transcriptSummaryCell,
                        { flex: 2, textAlign: 'left', color: '#1a202c' },
                      ]}
                      numberOfLines={1}>
                      {e.examName}
                    </Text>
                    <Text
                      style={[
                        styles.transcriptSummaryCell,
                        { color: '#1a202c' },
                      ]}>
                      {pct}%
                    </Text>
                    <Text
                      style={[
                        styles.transcriptSummaryCell,
                        { color: '#1a202c' },
                      ]}>
                      {e.grade}
                    </Text>
                    <Text
                      style={[
                        styles.transcriptSummaryCell,
                        {
                          fontWeight: '800',
                          color: isFail ? '#dc2626' : '#1a202c',
                        },
                      ]}>
                      {e.outcome}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Signature lines */}
            <View style={styles.transcriptSignatures}>
              {(
                [
                  'CLASS TEACHER',
                  'EXAMINATION IN-CHARGE',
                  'PRINCIPAL',
                ] as const
              ).map(label => (
                <View key={label} style={styles.transcriptSignItem}>
                  <View style={styles.transcriptSignLine} />
                  <Text style={styles.transcriptSignLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.transcriptFooter}>
              <View style={styles.transcriptFooterLogo}>
                <Text style={styles.transcriptFooterLogoText}>S</Text>
              </View>
              <Text style={styles.transcriptFooterText}>ISSUED BY SHARNEX</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />

      <StudentHeader
        title="Official Results"
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
        }>

        {/* ── Loading ── */}
        {isLoading && (
          <View style={styles.centreState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.centreStateText, { color: theme.subtext }]}>
              Loading academic records…
            </Text>
          </View>
        )}

        {/* ── Error ── */}
        {!isLoading && !!error && (
          <Animated.View
            entering={ZoomIn.duration(300)}
            style={styles.centreState}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={52}
              color={theme.subtext}
            />
            <Text style={[styles.centreStateTitle, { color: theme.text }]}>
              Could not load results
            </Text>
            <Text style={[styles.centreStateText, { color: theme.subtext }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={() => fetchData()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Empty ── */}
        {!isLoading && !error && (!allData || allData.exams.length === 0) && (
          <Animated.View
            entering={ZoomIn.duration(300)}
            style={[
              styles.emptyContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            <MaterialCommunityIcons
              name="clipboard-text-search-outline"
              size={64}
              color={theme.subtext}
            />
            <Text style={[styles.centreStateTitle, { color: theme.text }]}>
              No Results Yet
            </Text>
            <Text
              style={[
                styles.centreStateText,
                { color: theme.subtext, textAlign: 'center' },
              ]}>
              Your published results will appear here once the school releases
              them.
            </Text>
          </Animated.View>
        )}

        {/* ── Main content ── */}
        {!isLoading && !error && allData && allData.exams.length > 0 && (
          <>
            {/* Student card */}
            <Animated.View
              entering={FadeInUp.delay(50).springify()}
              style={[
                styles.studentCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <View style={styles.studentCardLeft}>
                <View
                  style={[
                    styles.studentAvatar,
                    { backgroundColor: theme.primary },
                  ]}>
                  <Text style={styles.studentAvatarText}>{studentInitials}</Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: theme.text }]}>
                    {allData.student.name || authState.user?.name || 'Student'}
                  </Text>
                  <View style={styles.studentBadgeRow}>
                    <View
                      style={[
                        styles.studentBadge,
                        { backgroundColor: theme.background },
                      ]}>
                      <Ionicons
                        name="ribbon-outline"
                        size={9}
                        color={theme.subtext}
                        style={{ marginRight: 3 }}
                      />
                      <Text
                        style={[
                          styles.studentBadgeText,
                          { color: theme.subtext },
                        ]}>
                        ROLL: {allData.student.rollNumber || 'N/A'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.studentBadge,
                        { backgroundColor: theme.background },
                      ]}>
                      <Ionicons
                        name="calendar-outline"
                        size={9}
                        color={theme.subtext}
                        style={{ marginRight: 3 }}
                      />
                      <Text
                        style={[
                          styles.studentBadgeText,
                          { color: theme.subtext },
                        ]}>
                        TERM: {selectedExam?.examName || 'N/A'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.studentBadge,
                        { backgroundColor: theme.background },
                      ]}>
                      <Ionicons
                        name="home-outline"
                        size={9}
                        color={theme.subtext}
                        style={{ marginRight: 3 }}
                      />
                      <Text
                        style={[
                          styles.studentBadgeText,
                          { color: theme.subtext },
                        ]}
                        numberOfLines={1}>
                        CLASS: {allData.student.className || 'N/A'}
                        {allData.student.section
                          ? `-${allData.student.section}`
                          : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.studentStatPanel,
                  { borderLeftColor: theme.border },
                ]}>
                <Text
                  style={[
                    styles.studentStatNumber,
                    { color: theme.primary },
                  ]}>
                  {publishedCount}
                </Text>
                <Text
                  style={[
                    styles.studentStatLabel,
                    { color: theme.subtext },
                  ]}>
                  {'PUBLISHED\nEXAMS'}
                </Text>
              </View>
            </Animated.View>

            {/* CHANGE EXAMINATION filter row */}
            <Animated.View
              entering={FadeInUp.delay(100).springify()}
              style={[
                styles.filterSection,
                {
                  borderTopColor: theme.border,
                  borderBottomColor: theme.border,
                },
              ]}>
              <View style={styles.filterLeft}>
                <View
                  style={[
                    styles.filterIconBox,
                    { backgroundColor: theme.primary + '18' },
                  ]}>
                  <Ionicons name="funnel" size={15} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.filterTitle, { color: theme.text }]}>
                    CHANGE EXAMINATION
                  </Text>
                  <Text
                    style={[
                      styles.filterSubtitle,
                      { color: theme.subtext },
                    ]}>
                    SELECT RESULT CONTEXT FOR DETAILED VIEW
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.examDropdownBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setShowExamDropdown(true)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.examDropdownBtnText,
                    { color: theme.text },
                  ]}
                  numberOfLines={1}>
                  {selectedExamId
                    ? (selectedExam?.examName ?? 'EXAM')
                    : 'ALL EXAMS'}
                </Text>
                <Ionicons name="chevron-down" size={15} color={theme.primary} />
              </TouchableOpacity>
            </Animated.View>

            {/* Pivoted results table */}
            <Animated.View
              entering={FadeInUp.delay(160).springify()}
              style={[
                styles.tableSection,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <View style={styles.tableSectionHeader}>
                <Text
                  style={[
                    styles.tableSectionLabel,
                    { color: theme.subtext },
                  ]}
                  numberOfLines={1}>
                  {tableLabel}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.transcriptTriggerBtn,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setShowTranscript(true)}
                  activeOpacity={0.8}>
                  <Ionicons
                    name="print-outline"
                    size={13}
                    color="#fff"
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.transcriptTriggerText}>
                    VIEW & PRINT TRANSCRIPT
                  </Text>
                </TouchableOpacity>
              </View>

              {renderTable()}
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Exam selector dropdown modal */}
      <Modal
        visible={showExamDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExamDropdown(false)}>
        <TouchableWithoutFeedback onPress={() => setShowExamDropdown(false)}>
          <View style={styles.dropdownOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdownPanel,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}>
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: theme.border },
                    !selectedExamId && {
                      backgroundColor: theme.primary + '12',
                    },
                  ]}
                  onPress={() => {
                    setSelectedExamId(null);
                    setShowExamDropdown(false);
                  }}>
                  <Text
                    style={[
                      styles.dropdownItemText,
                      {
                        color: !selectedExamId ? theme.primary : theme.text,
                        fontWeight: !selectedExamId ? '800' : '500',
                      },
                    ]}>
                    ALL EXAMS
                  </Text>
                </TouchableOpacity>
                {(allData?.exams ?? []).map(exam => {
                  const isSel = selectedExamId === exam.examId;
                  return (
                    <TouchableOpacity
                      key={exam.examId}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: theme.border },
                        isSel && { backgroundColor: theme.primary + '12' },
                      ]}
                      onPress={() => {
                        setSelectedExamId(exam.examId);
                        setShowExamDropdown(false);
                      }}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          {
                            color: isSel ? theme.primary : theme.text,
                            fontWeight: isSel ? '800' : '500',
                          },
                        ]}>
                        {exam.examName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {renderTranscriptModal()}

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },

    // Centre states (loading / error / empty)
    centreState: {
      alignItems: 'center',
      paddingVertical: 72,
      paddingHorizontal: 32,
      gap: 12,
    },
    centreStateTitle: { fontSize: 18, fontWeight: '800', marginTop: 4 },
    centreStateText: { fontSize: 13, lineHeight: 20 },
    retryBtn: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 8,
    },
    retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    emptyContainer: {
      margin: 20,
      padding: 40,
      alignItems: 'center',
      borderRadius: 20,
      borderWidth: 1,
      borderStyle: 'dashed',
      gap: 12,
    },

    // Student card
    studentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 4,
      borderRadius: 16,
      borderWidth: 1,
      padding: 14,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    studentCardLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
    },
    studentAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    studentAvatarText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
    studentBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    studentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },
    studentBadgeText: { fontSize: 9, fontWeight: '600', letterSpacing: 0.2 },
    studentStatPanel: {
      alignItems: 'center',
      paddingLeft: 14,
      borderLeftWidth: 1,
      minWidth: 72,
    },
    studentStatNumber: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
    studentStatLabel: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.4,
      textAlign: 'center',
      marginTop: 3,
      lineHeight: 13,
    },

    // Filter / change-examination section
    filterSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      marginTop: 16,
      gap: 8,
    },
    filterLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    filterIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
    filterSubtitle: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.2,
      marginTop: 1,
    },
    examDropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      minWidth: 100,
      maxWidth: 160,
    },
    examDropdownBtnText: { fontSize: 11, fontWeight: '700', flex: 1 },

    // Table section card
    tableSection: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 20,
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
    },
    tableSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexWrap: 'wrap',
      gap: 8,
    },
    tableSectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
    transcriptTriggerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 20,
    },
    transcriptTriggerText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    tableScroll: {},

    // Pivoted table cells
    tableRow: { flexDirection: 'row', borderTopWidth: 1 },
    tableHeaderRow: { borderTopWidth: 0 },
    tableHeaderCell: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRightWidth: 1,
    },
    tableHeaderText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.3,
      textAlign: 'center',
    },
    tableSubjectCell: {
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRightWidth: 1,
    },
    tableSubjectText: { fontSize: 10, fontWeight: '700' },
    tableCell: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRightWidth: 1,
      gap: 4,
    },
    tableCellDash: { fontSize: 14, fontWeight: '300' },
    tableCellMarks: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
    gradeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
      minWidth: 28,
      alignItems: 'center',
    },
    gradeBadgeText: { fontSize: 10, fontWeight: '800' },
    grandTotalRow: { borderTopWidth: 2 },
    grandTotalLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },
    grandTotalValue: { fontSize: 11, fontWeight: '800', textAlign: 'center' },

    // Exam dropdown modal
    dropdownOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.28)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: Platform.OS === 'ios' ? 215 : 190,
      paddingRight: 16,
    },
    dropdownPanel: {
      width: 230,
      borderRadius: 14,
      borderWidth: 1,
      overflow: 'hidden',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    dropdownItemText: { fontSize: 13 },

    // Transcript modal chrome (themed)
    transcriptSafeArea: { flex: 1, backgroundColor: '#ffffff' },
    transcriptModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    transcriptCloseBtn: { padding: 4, marginRight: 10 },
    transcriptModalTitle: { flex: 1, fontSize: 16, fontWeight: '800' },
    transcriptHeaderActions: { flexDirection: 'row', gap: 8 },
    transcriptActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
    },
    transcriptActionText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    printingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    printingBannerText: { fontSize: 13, fontWeight: '600' },

    // Transcript document body (fixed white document palette)
    transcriptScroll: { flex: 1, backgroundColor: '#ffffff' },
    transcriptScrollContent: {
      padding: 24,
      paddingBottom: 48,
      backgroundColor: '#ffffff',
    },
    transcriptLetterhead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 16,
    },
    transcriptLogo: { width: 56, height: 56, borderRadius: 8 },
    transcriptLogoPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#4F46E5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    transcriptLogoInitial: { color: '#fff', fontSize: 22, fontWeight: '900' },
    transcriptInstCenter: { flex: 1, alignItems: 'center' },
    transcriptInstName: {
      fontSize: 19,
      fontWeight: '900',
      color: '#1a202c',
      textAlign: 'center',
    },
    transcriptInstAddr: {
      fontSize: 9,
      color: '#718096',
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 14,
    },
    transcriptHR: { height: 2, backgroundColor: '#1a202c', marginBottom: 20 },
    transcriptStudentGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 20,
    },
    transcriptGridCell: {
      width: '50%',
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
    },
    transcriptGridLabel: {
      fontSize: 8,
      color: '#718096',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    transcriptGridValue: { fontSize: 13, fontWeight: '700', color: '#1a202c' },

    // Transcript marks table
    transcriptTableScroll: { marginBottom: 20 },
    transcriptTRow: { flexDirection: 'row' },
    transcriptTHeaderRow: { backgroundColor: '#f7fafc' },
    transcriptTGrandRow: { backgroundColor: '#f7fafc' },
    transcriptSubjectTH: {
      width: 110,
      padding: 8,
      borderWidth: 1,
      borderColor: '#cbd5e0',
    },
    transcriptExamTH: {
      width: 110,
      padding: 8,
      borderWidth: 1,
      borderColor: '#cbd5e0',
      borderLeftWidth: 0,
      alignItems: 'center',
    },
    transcriptTHText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#2d3748',
      textAlign: 'center',
    },
    transcriptTHYear: {
      fontSize: 8,
      fontWeight: '400',
      color: '#718096',
      textAlign: 'center',
    },
    transcriptSubjectTD: {
      width: 110,
      padding: 8,
      borderWidth: 1,
      borderColor: '#cbd5e0',
    },
    transcriptTDTop: { borderTopWidth: 0 },
    transcriptExamTD: {
      width: 110,
      padding: 8,
      borderWidth: 1,
      borderColor: '#cbd5e0',
      borderLeftWidth: 0,
      alignItems: 'center',
    },
    transcriptSubjectTDText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#1a202c',
    },
    transcriptCellMarks: {
      fontSize: 10,
      fontWeight: '600',
      color: '#1a202c',
      textAlign: 'center',
    },
    transcriptCellGrade: {
      fontSize: 9,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 2,
    },
    transcriptCellDash: {
      fontSize: 12,
      color: '#9ca3af',
      textAlign: 'center',
    },

    // Exam summary table
    transcriptSectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: '#2d3748',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    transcriptSummaryTable: {
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 20,
    },
    transcriptSummaryHeaderRow: {
      flexDirection: 'row',
      backgroundColor: '#f7fafc',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    transcriptSummaryDataRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    transcriptSummaryCell: {
      flex: 1,
      fontSize: 11,
      paddingHorizontal: 10,
      paddingVertical: 10,
      textAlign: 'center',
    },
    transcriptSummaryTH: {
      fontWeight: '800',
      fontSize: 9,
      color: '#2d3748',
      letterSpacing: 0.3,
    },

    // Signature lines
    transcriptSignatures: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 44,
      marginBottom: 24,
    },
    transcriptSignItem: { alignItems: 'center', width: 90 },
    transcriptSignLine: {
      width: '100%',
      borderBottomWidth: 1,
      borderBottomColor: '#1a202c',
      marginBottom: 6,
    },
    transcriptSignLabel: {
      fontSize: 7,
      color: '#718096',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      textAlign: 'center',
    },

    // Footer
    transcriptFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      paddingTop: 16,
      marginTop: 8,
    },
    transcriptFooterLogo: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#4F46E5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    transcriptFooterLogoText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    transcriptFooterText: {
      fontSize: 10,
      color: '#718096',
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
  });

export default ResultManagementScreen;
