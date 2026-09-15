import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import teacherService from '../../services/teacherService';
import { useTheme } from '../../store/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherMarksEntry'>;

const TeacherMarksEntryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { examId, classId, subjectId, examName, className, subjectName } = route.params;
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles({ ...theme, isDarkMode });
  const { authState } = useAuth();
  
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [marks, setMarks] = useState<Record<string, { score: string, isAbsent: boolean, remark?: string }>>({});
  const [maxMarks, setMaxMarks] = useState(100);
  const [sheetStatus, setSheetStatus] = useState('DRAFT');

  useEffect(() => {
    fetchSheet();
  }, []);

  const fetchSheet = async () => {
    try {
      setIsLoading(true);
      const res = await teacherService.getRmsMarksSheet(examId, classId, subjectId);
      const data = res.data.data || {};
      
      setStudents(data.students || []);
      setMaxMarks(data.maxMarks || 100);
      setSheetStatus(data.status || 'DRAFT');
      
      // Initialize marks state
      const initialMarks: Record<string, { score: string, isAbsent: boolean, remark: string }> = {};
      (data.students || []).forEach((student: any) => {
        initialMarks[student.id] = {
          score: student.marks !== null && student.marks !== undefined ? String(student.marks) : '',
          isAbsent: student.isAbsent || false,
          remark: student.remark || student.remarks || '',
        };
      });
      setMarks(initialMarks);
    } catch (error) {
      console.error('Failed to fetch marksheet:', error);
      Alert.alert('Error', 'Failed to load marksheet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecall = async () => {
    try {
      setIsSubmitting(true);
      await teacherService.recallRmsMarks({ examId, classId, subjectId });
      Alert.alert('Recalled', 'Marks submission recalled to draft status.');
      await fetchSheet();
    } catch (error: any) {
      console.error('Failed to recall marks:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to recall marks');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScoreChange = (studentId: string, value: string) => {
    // Validate marks limits
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && (numericValue > maxMarks || numericValue < 0)) {
      Alert.alert('Validation Error', `Marks must be between 0 and ${maxMarks}.`);
      return;
    }
    
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], score: value, isAbsent: false }
    }));
  };

  const toggleAbsent = (studentId: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { 
        ...prev[studentId], 
        isAbsent: !prev[studentId].isAbsent,
        score: !prev[studentId].isAbsent ? '' : prev[studentId].score 
      }
    }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remark }
    }));
  };

  const handleSave = async (isFinal: boolean = false) => {
    if (isFinal) {
      // Validate that all students have either been graded or marked absent
      const missing = students.filter(student => {
        const studentMarks = marks[student.id];
        return !studentMarks || (!studentMarks.isAbsent && (studentMarks.score === undefined || studentMarks.score.trim() === ''));
      });
      
      if (missing.length > 0) {
        Alert.alert(
          'Validation Error',
          `Cannot submit sheet. Please enter marks or mark as absent for all students. (${missing.length} remaining)`
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      // Step 1: Bulk Save Marks (DRAFT) matching marksBulkSaveSchema
      const bulkPayload = {
        examId,
        classId,
        subjectId,
        marks: Object.entries(marks).map(([studentId, data]) => ({
          studentId,
          marksObtained: data.isAbsent ? null : (data.score !== '' ? (parseFloat(data.score) || 0) : null),
          isAbsent: !!data.isAbsent,
        })),
      };

      await teacherService.bulkSaveRmsMarks(bulkPayload);

      // Step 2: If final submission, call submit endpoint matching marksSubmitSchema strictly { examId, classId, subjectId }
      if (isFinal) {
        const submitPayload = {
          examId,
          classId,
          subjectId,
        };
        await teacherService.submitRmsMarks(submitPayload);
      }
      
      Alert.alert('Success', isFinal ? 'Marks submitted for review successfully!' : 'Marks saved as draft');
      if (isFinal) navigation.goBack();
    } catch (error: any) {
      console.error('Failed to save marks:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to save marks');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [filterType, setFilterType] = useState<'ALL' | 'ENTERED' | 'ABSENT' | 'PENDING'>('ALL');

  const calculatePercentage = (scoreStr: string, isAbsent: boolean) => {
    if (isAbsent || !scoreStr || isNaN(parseFloat(scoreStr))) return null;
    const score = parseFloat(scoreStr);
    return maxMarks > 0 ? ((score / maxMarks) * 100) : 0;
  };

  const calculateGrade = (pct: number | null) => {
    if (pct === null) return '-';
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    if (pct >= 40) return 'E';
    return 'F';
  };

  const studentRanks = useMemo(() => {
    const validScores = students
      .map(s => ({
        id: s.id,
        score: marks[s.id] && !marks[s.id].isAbsent && marks[s.id].score ? parseFloat(marks[s.id].score) : null
      }))
      .filter(item => item.score !== null && !isNaN(item.score))
      .sort((a, b) => (b.score as number) - (a.score as number));

    const ranks: Record<string, number> = {};
    validScores.forEach((item, idx) => {
      ranks[item.id] = idx + 1;
    });
    return ranks;
  }, [students, marks]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = !searchText || 
        s.name.toLowerCase().includes(searchText.toLowerCase()) || 
        (s.roll_no && String(s.roll_no).includes(searchText));
      
      const markData = marks[s.id] || { score: '', isAbsent: false };
      const isEntered = !markData.isAbsent && markData.score !== '';
      const isPending = !markData.isAbsent && markData.score === '';

      if (filterType === 'ENTERED') return matchesSearch && isEntered;
      if (filterType === 'ABSENT') return matchesSearch && markData.isAbsent;
      if (filterType === 'PENDING') return matchesSearch && isPending;
      return matchesSearch;
    });
  }, [searchText, students, marks, filterType]);

  const stats = useMemo(() => {
    const scores = Object.values(marks)
      .filter(m => !m.isAbsent && m.score !== '')
      .map(m => parseFloat(m.score));
    
    if (scores.length === 0) return { avg: 0, highest: 0, lowest: 0 };
    
    const sum = scores.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round(sum / scores.length),
      highest: Math.max(...scores),
      lowest: Math.min(...scores)
    };
  }, [marks]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      {/* Header */}
      <View style={styles.globalHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.portalTitle}>MARKS EXAMINATION PORTAL</Text>
          <Text style={styles.portalSubtitle}>{className} / <Text style={{ color: theme.primary }}>{subjectName}</Text></Text>
        </View>
        <View style={styles.lockBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          <Text style={styles.lockText}>SECURELY LOCKED</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchSheet} />}
      >
        <View style={styles.layoutContainer}>
          {/* Left Cards (Academic Context & Stats) */}
          <View style={styles.sidebarContainer}>
            {/* Academic Context */}
            <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.sidebarCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.dot} />
                <Text style={styles.sidebarCardTitle}>ACADEMIC CONTEXT</Text>
              </View>
              
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>EXAMINATION</Text>
                <Text style={styles.contextValue}>{examName}</Text>
              </View>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>SUBJECT ENTRY</Text>
                <Text style={styles.contextValue}>{subjectName}</Text>
              </View>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>MAXIMUM RANGE</Text>
                <Text style={styles.contextValue}>{maxMarks.toFixed(2)} POINTS</Text>
              </View>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>ENROLLED STUDENTS</Text>
                <Text style={styles.contextValue}>{students.length} RECORDS</Text>
              </View>
            </Animated.View>

            {/* Real-time Performance */}
            <Animated.View entering={FadeInUp.delay(200).springify()} style={[styles.sidebarCard, { backgroundColor: '#7C3AED' }]}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="stats-chart" size={16} color="#FFFFFF" />
                <Text style={[styles.sidebarCardTitle, { color: '#FFFFFF' }]}>REAL-TIME PERFORMANCE</Text>
              </View>

              <View style={styles.performanceRow}>
                <View style={styles.perfBlock}>
                  <Text style={styles.perfLabel}>AVERAGE</Text>
                  <Text style={styles.perfValue}>{stats.avg}</Text>
                </View>
                <View style={[styles.perfBlock, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 20 }]}>
                  <Text style={styles.perfLabel}>HIGH/LOW</Text>
                  <Text style={styles.perfValue}>{stats.highest} / {stats.lowest}</Text>
                </View>
              </View>

              <View style={styles.distributionContainer}>
                <Text style={styles.perfLabel}>DISTRIBUTION RANGE</Text>
                <View style={styles.distributionBarContainer}>
                  <View style={[styles.distributionBar, { width: `${(stats.avg / maxMarks) * 100}%` }]} />
                </View>
                <Text style={styles.rangeValue}>0 pts</Text>
              </View>

              <View style={styles.indicatorRow}>
                <Ionicons name="sparkles" size={14} color="#A78BFA" />
                <Text style={styles.indicatorText}>Automatic performance indicators enabled.</Text>
              </View>
            </Animated.View>
          </View>

          {/* Right Main Content (Student List) */}
          <View style={styles.mainContentContainer}>
            <Animated.View entering={FadeIn.delay(300)} style={styles.tableCard}>
              {/* Search & Meta */}
              <View style={styles.tableControls}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={16} color="#9CA3AF" />
                  <TextInput 
                    style={styles.searchInput}
                    placeholder="Locate student by name or roll number..."
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                </View>
                <View style={styles.controlRight}>
                  <View style={styles.foundBadge}>
                    <Ionicons name="people" size={14} color="#7C3AED" />
                    <Text style={styles.foundText}>{filteredStudents.length} FOUND</Text>
                  </View>
                  <View style={styles.validationBadge}>
                    <View style={styles.greenDot} />
                    <Text style={styles.validationText}>AUTO-VALIDATION ACTIVE</Text>
                  </View>
                </View>
              </View>

              {/* Filter Tabs */}
              <View style={styles.filterBarRow}>
                {[
                  { key: 'ALL', label: 'All Students' },
                  { key: 'ENTERED', label: 'Entered' },
                  { key: 'ABSENT', label: 'Absent' },
                  { key: 'PENDING', label: 'Pending' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.filterChip, filterType === item.key && styles.filterChipActive]}
                    // @ts-ignore
                    onPress={() => setFilterType(item.key)}
                  >
                    <Text style={[styles.filterChipText, filterType === item.key && styles.filterChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.thText, { flex: 0.8 }]}>ROLL</Text>
                <Text style={[styles.thText, { flex: 2 }]}>STUDENT INFO</Text>
                <Text style={[styles.thText, { flex: 1.8, textAlign: 'center' }]}>SCORE & GRADE</Text>
                <Text style={[styles.thText, { flex: 1.8 }]}>REMARK</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>RANK</Text>
              </View>

              {/* Rows */}
              {isLoading ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ margin: 40 }} />
              ) : filteredStudents.length === 0 ? (
                <Text style={styles.emptyText}>No students matching criteria.</Text>
              ) : (
                filteredStudents.map((student, index) => {
                  const markData = marks[student.id] || { score: '', isAbsent: false, remark: '' };
                  const pct = calculatePercentage(markData.score, markData.isAbsent);
                  const grade = calculateGrade(pct);
                  const rank = studentRanks[student.id];

                  return (
                    <View key={student.id} style={[styles.tableRow, index === filteredStudents.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={[styles.tdRoll, { flex: 0.8 }]}>{student.roll_no || 'N/A'}</Text>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.tdName} numberOfLines={1}>{student.name}</Text>
                        <Text style={{ fontSize: 10, color: '#9CA3AF' }}>ID: {student.id?.slice(0, 6)}</Text>
                      </View>
                      <View style={[styles.scoreCell, { flex: 1.8 }]}>
                        <View style={{ alignItems: 'center' }}>
                          <TextInput 
                            style={[styles.scoreInput, markData.isAbsent && styles.disabledInput]}
                            keyboardType="numeric"
                            value={markData.score}
                            onChangeText={(val) => handleScoreChange(student.id, val)}
                            editable={!markData.isAbsent}
                            placeholder="0.00"
                          />
                          {pct !== null && (
                            <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '700', marginTop: 2 }}>
                              {pct.toFixed(1)}% ({grade})
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity 
                          style={[styles.absBtn, markData.isAbsent && styles.absBtnActive]}
                          onPress={() => toggleAbsent(student.id)}
                        >
                          <Text style={[styles.absText, markData.isAbsent && styles.absTextActive]}>ABS</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ flex: 1.8, paddingHorizontal: 4 }}>
                        <TextInput
                          style={styles.remarkInput}
                          value={markData.remark || ''}
                          onChangeText={(val) => handleRemarkChange(student.id, val)}
                          placeholder="Add remark..."
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[styles.statusCell, { flex: 1 }]}>
                        {markData.isAbsent ? (
                          <View style={[styles.rankBadge, { backgroundColor: '#FEE2E2' }]}>
                            <Text style={[styles.rankText, { color: '#EF4444' }]}>ABS</Text>
                          </View>
                        ) : rank ? (
                          <View style={styles.rankBadge}>
                            <Ionicons name="trophy" size={10} color="#F59E0B" />
                            <Text style={styles.rankText}>#{rank}</Text>
                          </View>
                        ) : (
                          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>-</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}

              <View style={styles.tableFooter}>
                <Text style={styles.footerText}>TOTAL MANAGED RECORDS: {students.length}   |   OPTIMIZED FOR HIGH CONCURRENCY PERFORMANCE</Text>
              </View>
            </Animated.View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footerActions}>
        <TouchableOpacity 
          style={styles.saveDraftBtn} 
          onPress={() => handleSave(false)}
          disabled={isSubmitting}
        >
          <Text style={styles.saveDraftText}>Save as Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.submitMarksBtn} 
          onPress={() => handleSave(true)}
          disabled={isSubmitting}
        >
          <Text style={styles.submitMarksText}>Submit Marks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 100 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: { padding: 4, marginRight: 12 },
  headerTitleContainer: { flex: 1 },
  portalTitle: { fontSize: 10, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5 },
  portalSubtitle: { fontSize: 16, fontWeight: '800', color: theme.text, marginTop: 2 },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDarkMode ? '#065F4630' : '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  lockText: { fontSize: 10, fontWeight: '900', color: theme.isDarkMode ? '#34D399' : '#10B981' },

  layoutContainer: {
    flexDirection: Platform.OS === 'web' || SCREEN_WIDTH > 768 ? 'row' : 'column',
    padding: 16,
    gap: 16,
  },
  
  // Sidebar
  sidebarContainer: {
    width: Platform.OS === 'web' || SCREEN_WIDTH > 768 ? 320 : '100%',
    gap: 16,
  },
  sidebarCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6' },
  sidebarCardTitle: { fontSize: 12, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5 },
  
  contextItem: { marginBottom: 16 },
  contextLabel: { fontSize: 9, fontWeight: '800', color: theme.subtext, marginBottom: 4 },
  contextValue: { fontSize: 14, fontWeight: '800', color: theme.text },

  performanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  perfBlock: { flex: 1 },
  perfLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  perfValue: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },

  distributionContainer: { marginBottom: 20 },
  distributionBarContainer: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 4 },
  distributionBar: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 2 },
  rangeValue: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', textAlign: 'right', marginTop: 4 },

  indicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  indicatorText: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  // Main Table
  mainContentContainer: { flex: 1 },
  tableCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    overflow: 'hidden',
  },
  tableControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 13, color: theme.text },
  controlRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  foundBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: theme.isDarkMode ? '#7C3AED30' : '#F5F3FF', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  foundText: { fontSize: 10, fontWeight: '900', color: '#7C3AED' },
  validationBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  validationText: { fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 0.5 },

  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.isDarkMode ? '#334155' : '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  thText: { fontSize: 10, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5 },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tdRoll: { fontSize: 12, fontWeight: '500', color: theme.subtext },
  tdName: { fontSize: 14, fontWeight: '800', color: theme.text },
  scoreCell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  scoreInput: {
    width: 60,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
  },
  disabledInput: { backgroundColor: theme.isDarkMode ? '#1E293B' : '#F1F5F9', color: theme.subtext },
  absBtn: {
    backgroundColor: theme.isDarkMode ? '#334155' : '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  absBtnActive: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  absText: { fontSize: 10, fontWeight: '800', color: theme.subtext },
  absTextActive: { color: '#EF4444' },
  
  statusCell: { alignItems: 'flex-end' },
  validatedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  validatedText: { fontSize: 10, fontWeight: '900', color: '#10B981' },

  tableFooter: {
    padding: 16,
    backgroundColor: theme.isDarkMode ? '#334155' : '#F8FAFC',
    alignItems: 'center',
  },
  footerText: { fontSize: 9, fontWeight: '700', color: theme.subtext, letterSpacing: 0.5 },

  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: theme.surface,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    gap: 12,
  },
  saveDraftBtn: {
    flex: 1,
    backgroundColor: theme.isDarkMode ? '#334155' : '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveDraftText: { fontSize: 14, fontWeight: '700', color: theme.text },
  submitMarksBtn: {
    flex: 2,
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  submitMarksText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  emptyText: { textAlign: 'center', padding: 40, color: theme.subtext, fontSize: 14 },

  filterBarRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.isDarkMode ? '#334155' : '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: theme.isDarkMode ? '#7C3AED30' : '#7C3AED15',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.subtext,
  },
  filterChipTextActive: {
    color: '#7C3AED',
  },
  remarkInput: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 12,
    color: theme.text,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
});

export default TeacherMarksEntryScreen;
