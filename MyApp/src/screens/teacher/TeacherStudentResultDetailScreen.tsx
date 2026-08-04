import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TeacherHeader } from '../../components/TeacherHeader';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import teacherService from '../../services/teacherService';
import { useTheme } from '../../store/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherStudentResultDetail'>;

const TeacherStudentResultDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { studentId, studentName, rollNo } = route.params;
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles({ ...theme, isDarkMode });

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  const fetchResults = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      setError(null);
      const res = await teacherService.getTeacherStudentAllResults(studentId);
      const data = res.data?.data || res.data || null;
      setResultData(data);
    } catch (err: any) {
      console.error('Failed to fetch student all results:', err);
      setError(err.response?.data?.message || err.message || "Failed to load student's multi-exam result matrix.");
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(false);
  }, [studentId]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchResults(true);
    setIsRefreshing(false);
  };

  const subjects = resultData?.subjects || [];
  const exams = resultData?.exams || [];
  const student = resultData?.student || { name: studentName, rollNumber: rollNo };

  const renderSubjectCell = (cell: any) => {
    if (!cell) {
      return <Text style={[styles.dashCell, { color: theme.subtext }]}>--</Text>;
    }

    if (cell.isAbsent) {
      return (
        <View style={styles.cellContainer}>
          <Text style={[styles.absentText, { color: theme.danger || '#EF4444' }]}>AB</Text>
          <View style={[styles.absentBadge, { backgroundColor: (theme.danger || '#EF4444') + '15', borderColor: (theme.danger || '#EF4444') + '30' }]}>
            <Text style={[styles.absentBadgeText, { color: theme.danger || '#EF4444' }]}>Absent</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cellContainer}>
        <Text style={[styles.marksText, { color: cell.isFailed ? (theme.danger || '#EF4444') : theme.text }]}>
          {cell.marks !== undefined ? Number(cell.marks).toFixed(2) : '0.00'}/{cell.maxMarks !== undefined ? Number(cell.maxMarks).toFixed(2) : '100.00'}
        </Text>
        <View style={[
          styles.gradeBadge,
          {
            backgroundColor: cell.isFailed ? (theme.danger || '#EF4444') + '15' : theme.primary + '15',
            borderColor: cell.isFailed ? (theme.danger || '#EF4444') + '30' : theme.primary + '30',
          }
        ]}>
          <Text style={[
            styles.gradeBadgeText,
            { color: cell.isFailed ? (theme.danger || '#EF4444') : theme.primary }
          ]}>
            {cell.grade || '-'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      <TeacherHeader
        title="Student Result"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Navigation & Header Info */}
        <View style={styles.topInfoSection}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={14} color={theme.subtext} />
            <Text style={[styles.backBtnText, { color: theme.subtext }]}>BACK TO CLASS ROSTER</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleRow}>
            <View style={styles.studentInfoCol}>
              <Text style={[styles.studentName, { color: theme.text }]}>
                {student.name || studentName || 'Student'}
              </Text>
              <Text style={[styles.rollNoText, { color: theme.subtext }]}>
                Roll No: {student.rollNumber || student.roll_no || rollNo || 'N/A'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.printTranscriptBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('OfficialResult', { resultId: studentId })}
            >
              <Ionicons name="print-outline" size={14} color="#FFFFFF" />
              <Text style={styles.printTranscriptText}>VIEW & PRINT TRANSCRIPT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loaderText, { color: theme.subtext }]}>Loading multi-exam matrix...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.danger || '#EF4444'} />
            <Text style={[styles.errorText, { color: theme.danger || '#EF4444' }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={() => fetchResults(false)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : exams.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="document-text-outline" size={48} color={theme.subtext} />
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              No published examination results available for this student yet.
            </Text>
          </View>
        ) : (
          <View style={[styles.matrixCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Header Row */}
                <View style={[styles.tableHeaderRow, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderBottomColor: theme.border }]}>
                  <Text style={[styles.headerCellSubject, { color: theme.subtext }]}>SUBJECT</Text>
                  {exams.map((exam: any) => (
                    <View key={exam.examId} style={styles.headerCellExam}>
                      <Text style={[styles.examHeaderName, { color: theme.text }]} numberOfLines={1}>
                        {exam.examName?.toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Subject Rows */}
                {subjects.map((subj: any, idx: number) => (
                  <View
                    key={subj.subjectId || idx}
                    style={[styles.tableBodyRow, { borderBottomColor: theme.border }]}
                  >
                    <Text style={[styles.bodyCellSubject, { color: theme.text }]}>
                      {subj.subjectName?.toUpperCase()}
                    </Text>

                    {exams.map((exam: any) => (
                      <View key={exam.examId} style={styles.bodyCellExam}>
                        {renderSubjectCell(exam.subjectMarks?.[subj.subjectId])}
                      </View>
                    ))}
                  </View>
                ))}

                {/* Total Row */}
                <View style={[styles.tableTotalRow, { backgroundColor: theme.primary + '10', borderTopColor: theme.primary + '30' }]}>
                  <Text style={[styles.totalLabelCell, { color: theme.primary }]}>TOTAL</Text>
                  {exams.map((exam: any) => (
                    <View key={exam.examId} style={styles.totalValCell}>
                      <Text style={[styles.totalValText, { color: theme.primary }]}>
                        {exam.totalMarks !== undefined ? Number(exam.totalMarks).toFixed(2) : '0.00'}/{exam.maxTotal !== undefined ? Number(exam.maxTotal).toFixed(2) : '100.00'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="teacher"
      />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { padding: 16, paddingBottom: 40 },

  topInfoSection: { marginBottom: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  studentInfoCol: { flex: 1 },
  studentName: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  rollNoText: { fontSize: 13, fontWeight: '600', marginTop: 2 },

  printTranscriptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  printTranscriptText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  loaderContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  loaderText: { marginTop: 12, fontSize: 14, fontWeight: '600' },

  errorContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorText: { fontSize: 14, textAlign: 'center', marginTop: 12, marginBottom: 16 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  emptyCard: { alignItems: 'center', justifyContent: 'center', padding: 40, borderRadius: 16, borderWidth: 1, marginTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 12, fontSize: 13, lineHeight: 18 },

  matrixCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
  },

  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  headerCellSubject: {
    width: 140,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerCellExam: {
    width: 130,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  examHeaderName: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  bodyCellSubject: {
    width: 140,
    fontSize: 13,
    fontWeight: '800',
  },
  bodyCellExam: {
    width: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cellContainer: { alignItems: 'center', gap: 4 },
  dashCell: { fontSize: 13, fontWeight: '700' },
  marksText: { fontSize: 12, fontWeight: '700' },
  gradeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  gradeBadgeText: { fontSize: 10, fontWeight: '900' },

  absentText: { fontSize: 12, fontWeight: '800' },
  absentBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  absentBadgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },

  tableTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  totalLabelCell: { width: 140, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  totalValCell: { width: 130, alignItems: 'center', justifyContent: 'center' },
  totalValText: { fontSize: 12, fontWeight: '900' },
});

export default TeacherStudentResultDetailScreen;
