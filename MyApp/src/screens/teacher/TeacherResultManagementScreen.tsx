import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { TeacherHeader } from '../../components/TeacherHeader';
import { useAuth } from '../../store/AuthContext';
import teacherService from '../../services/teacherService';
import { useTheme } from '../../store/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherResultManagement'>;

import { Alert, Modal } from 'react-native';

const TeacherResultManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles({ ...theme, isDarkMode });
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState<'entry' | 'review' | 'view_result'>('entry');
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [classStudentsData, setClassStudentsData] = useState<any>(null);
  const [classStudentsError, setClassStudentsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Audit Modal State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[] | null>(null);
  const [isFetchingAudit, setIsFetchingAudit] = useState(false);
  const [activeAuditSubject, setActiveAuditSubject] = useState<string>('');

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      setError(null);
      setReviewError(null);
      setClassStudentsError(null);

      const [workRes, reviewRes, classStudentsRes] = await Promise.all([
        teacherService.getRmsWorkItems().catch((err: any) => {
          console.warn('Work items fetch notice:', err?.message);
          return { data: { items: [] } };
        }),
        teacherService.getRmsReviewItems().catch((err: any) => {
          if (err.response?.status === 403 || err.message?.includes('403') || err.message?.includes('Unauthorized')) {
            setReviewError('NOT_CLASS_TEACHER');
          }
          return { data: { items: [] } };
        }),
        teacherService.getTeacherClassStudents().catch((err: any) => {
          const status = err.response?.status;
          if (status === 403 || status === 404 || err.message?.includes('403') || err.message?.includes('404') || err.message?.includes('Unauthorized')) {
            setClassStudentsError('NOT_CLASS_TEACHER');
          }
          return { data: null };
        }),
      ]);

      const workData = workRes.data?.items || workRes.data?.data?.items || (Array.isArray(workRes.data) ? workRes.data : []);
      const reviewData = reviewRes.data?.items || reviewRes.data?.data?.items || (Array.isArray(reviewRes.data) ? reviewRes.data : []);
      const classData = classStudentsRes.data?.data || classStudentsRes.data || null;

      setWorkItems(workData);
      setReviewItems(reviewData);
      setClassStudentsData(classData);
    } catch (err: any) {
      console.error('Failed to fetch RMS data:', err);
      setError('Failed to load result management data. Please try again.');
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchData(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData(true);
    setIsRefreshing(false);
  }, [fetchData]);

  const handleRecallMarks = async (item: any) => {
    try {
      setIsLoading(true);
      await teacherService.recallRmsMarks({
        examId: item.examId,
        classId: item.classId,
        subjectId: item.subjectId,
      });
      Alert.alert('Recalled', 'Marks submission recalled to draft status.');
      await fetchData(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to recall marks.';
      Alert.alert('Recall Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAudit = async (item: any) => {
    try {
      setActiveAuditSubject(`${item.subjectName} (${item.className})`);
      setIsFetchingAudit(true);
      setShowAuditModal(true);
      const res = await teacherService.getRmsAudit(item.examId || item.marksId || '1');
      const logs = res.data?.data || res.data?.logs || res.data || [];
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (err: any) {
      setAuditLogs([]);
    } finally {
      setIsFetchingAudit(false);
    }
  };

  const filteredWorkItems = workItems.filter(item => {
    const matchesSearch = !searchQuery ||
      item.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.className?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.examName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (item.status || 'DRAFT').toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReviewItems = reviewItems.filter(item => {
    const matchesSearch = !searchQuery ||
      item.className?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.examName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // State Machine 1: MARKS STATUS
  const getMarksStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return { bg: theme.primary + '18', text: theme.primary, icon: 'shield-checkmark-outline', label: 'MARKS: APPROVED' };
      case 'SUBMITTED': return { bg: theme.primary + '15', text: theme.primary, icon: 'checkmark-circle-outline', label: 'MARKS: SUBMITTED' };
      case 'REJECTED': return { bg: (theme.danger || '#EF4444') + '18', text: theme.danger || '#EF4444', icon: 'return-up-back-outline', label: 'MARKS: REJECTED' };
      case 'NOT_STARTED': return { bg: theme.border, text: theme.subtext, icon: 'ellipse-outline', label: 'MARKS: NOT STARTED' };
      default: return { bg: theme.primary + '10', text: theme.primary, icon: 'create-outline', label: 'MARKS: DRAFT' };
    }
  };

  // State Machine 2: RESULTS STATUS
  const getResultsStatusStyle = (isPublished: boolean, template: string | null) => {
    if (isPublished) {
      return { bg: theme.primary + '18', text: theme.primary, icon: 'globe-outline', label: `RESULT: PUBLISHED · ${template || 'CLASSIC'}` };
    }
    return { bg: theme.primary + '12', text: theme.text, icon: 'checkmark-done-outline', label: 'RESULT: READY FOR REVIEW' };
  };

  const renderWorkItems = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Marks Entry</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>Submit subject marks for assigned examinations</Text>
        </View>
      </View>

      {filteredWorkItems.length === 0 && !isLoading ? (
        <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="document-text-outline" size={48} color={theme.subtext} />
          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            {searchQuery || statusFilter !== 'ALL'
              ? 'No examinations matching your filter criteria.'
              : 'No assigned examinations found for marks entry.'}
          </Text>
          {(searchQuery || statusFilter !== 'ALL') && (
            <TouchableOpacity
              style={[styles.retryBtn, { marginTop: 16, backgroundColor: theme.primary }]}
              onPress={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
            >
              <Text style={styles.retryBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredWorkItems.map((item, index) => {
            const marksStyle = getMarksStatusStyle(item.status);
            const isSubmitted = item.status === 'SUBMITTED';

            return (
              <Animated.View
                key={`${item.examId}-${item.classId}-${item.subjectId}-${index}`}
                entering={FadeInUp.delay(index * 50).springify()}
                style={styles.cardWrapper}
              >
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('TeacherMarksEntry', {
                    examId: item.examId,
                    classId: item.classId,
                    subjectId: item.subjectId,
                    examName: item.examName || 'Examination',
                    className: item.className || 'Class',
                    subjectName: item.subjectName || 'Subject'
                  })}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.subjectCircle, { backgroundColor: theme.primary + '15' }]}>
                      <Text style={[styles.subjectInitial, { color: theme.primary }]}>{item.subjectName?.charAt(0) || 'S'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: marksStyle.bg }]}>
                      <Ionicons name={marksStyle.icon as any} size={11} color={marksStyle.text} />
                      <Text style={[styles.statusText, { color: marksStyle.text }]}>{marksStyle.label}</Text>
                    </View>
                  </View>

                  <Text style={[styles.cardSubject, { color: theme.text }]} numberOfLines={1}>{item.subjectName || 'Subject'}</Text>
                  <Text style={[styles.cardClass, { color: theme.subtext }]} numberOfLines={1}>{`${item.className || 'Class'} • ${item.examName || 'Exam'}`}</Text>

                  {/* Actions Row */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity style={styles.auditIconBtn} onPress={() => handleViewAudit(item)}>
                      <Ionicons name="time-outline" size={14} color={theme.subtext} />
                      <Text style={[styles.auditIconText, { color: theme.subtext }]}>History</Text>
                    </TouchableOpacity>

                    {isSubmitted && (
                      <TouchableOpacity style={styles.recallMiniBtn} onPress={() => handleRecallMarks(item)}>
                        <Ionicons name="refresh-outline" size={12} color={theme.primary} />
                        <Text style={[styles.recallMiniText, { color: theme.primary }]}>Recall</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                    <Text style={[styles.cardDate, { color: theme.subtext }]}>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</Text>
                    <TouchableOpacity style={styles.enterMarksBtn}>
                      <Text style={[styles.enterMarksText, { color: theme.primary }]}>ENTER MARKS</Text>
                      <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderReviewItems = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Review Marks</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>Review and approve marks submitted by subject teachers</Text>
        </View>
      </View>

      {reviewError === 'NOT_CLASS_TEACHER' ? (
        <View style={[styles.permissionNoticeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.permissionIconCircle, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="shield-half-outline" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.permissionTitle, { color: theme.text }]}>Class Teacher Authorization Required</Text>
          <Text style={[styles.permissionDesc, { color: theme.subtext }]}>
            You are signed in as a subject teacher. Reviewing and publishing full class result cards is restricted to assigned homeroom/class teachers.
          </Text>
        </View>
      ) : filteredReviewItems.length === 0 && !isLoading ? (
        <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color={theme.subtext} />
          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            {searchQuery ? 'No classes matching your search.' : 'No classes found for marks review.'}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredReviewItems.map((item, index) => {
            const itemSubjects = Array.isArray(item.subjects) ? item.subjects : null;
            const totalSubjects = itemSubjects ? (itemSubjects.length || 1) : (item.totalSubjects ?? item.subjectsCount ?? 1);
            const approvedSubjects = itemSubjects
              ? (itemSubjects.filter((s: any) => s.status === 'APPROVED' || s.status === 'SUBMITTED').length || itemSubjects.length)
              : (item.approvedSubjects ?? item.approvedCount ?? item.reviewedSubjects ?? item.submittedSubjects ?? item.completedSubjects ?? item.readySubjects ?? totalSubjects);
            const progress = totalSubjects > 0 ? (approvedSubjects / totalSubjects) * 100 : 0;
            const resultsStyle = getResultsStatusStyle(item.isPublished, item.publishedTemplate);

            return (
              <Animated.View
                key={`${item.examId}-${item.classId}-${index}`}
                entering={FadeInUp.delay(index * 50).springify()}
                style={styles.cardWrapper}
              >
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('TeacherReviewSubmission', {
                    examId: item.examId,
                    classId: item.classId,
                    examName: item.examName || 'Examination',
                    className: item.className || 'Class'
                  })}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.subjectCircle, { backgroundColor: theme.primary + '15' }]}>
                      <Text style={[styles.subjectInitial, { color: theme.primary }]}>{item.className?.charAt(0) || 'C'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: resultsStyle.bg }]}>
                      <Ionicons name={resultsStyle.icon as any} size={11} color={resultsStyle.text} />
                      <Text style={[styles.statusText, { color: resultsStyle.text }]}>{resultsStyle.label}</Text>
                    </View>
                  </View>

                  <Text style={[styles.cardSubject, { color: theme.text }]} numberOfLines={1}>{item.className || 'Class'}</Text>
                  <Text style={[styles.cardClass, { color: theme.subtext }]} numberOfLines={1}>{item.examName || 'Examination'}</Text>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabelRow}>
                      <Text style={[styles.progressLabel, { color: theme.subtext }]}>SUBJECT APPROVAL READINESS</Text>
                      <Text style={[styles.progressValue, { color: theme.text }]}>{Math.round(progress)}%</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                      <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
                    </View>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                    <Text style={[styles.reviewDoneText, { color: theme.primary }]}>REVIEW SUBJECTS →</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderViewResultTab = () => {
    const classObj = classStudentsData?.class;
    const studentsList = classStudentsData?.students || [];

    const filteredStudents = studentsList.filter((s: any) => {
      if (!searchQuery) return true;
      const nameMatch = s.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const rollMatch = String(s.roll_no || s.rollNumber || '').includes(searchQuery);
      return nameMatch || rollMatch;
    });

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>View Result</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>
              {classObj
                ? `Students of ${classObj.name}${classObj.section ? ` - ${classObj.section}` : ''}`
                : 'View results of students belonging to your homeroom class'}
            </Text>
          </View>
        </View>

        {classStudentsError === 'NOT_CLASS_TEACHER' ? (
          <View style={[styles.permissionNoticeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.permissionIconCircle, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="school-outline" size={40} color={theme.primary} />
            </View>
            <Text style={[styles.permissionTitle, { color: theme.text }]}>Not Assigned as Class Teacher</Text>
            <Text style={[styles.permissionDesc, { color: theme.subtext }]}>
              You are currently signed in as a subject teacher. Accessing class student result rosters is restricted to assigned homeroom class teachers.
            </Text>
          </View>
        ) : filteredStudents.length === 0 && !isLoading ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="people-outline" size={48} color={theme.subtext} />
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              {searchQuery ? 'No students match your search query.' : 'No students enrolled in your class roster yet.'}
            </Text>
          </View>
        ) : (
          <View style={[styles.rosterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.rosterHeaderRow, { borderBottomColor: theme.border }]}>
              <Ionicons name="people-outline" size={16} color={theme.primary} />
              <Text style={[styles.rosterCountText, { color: theme.subtext }]}>
                {filteredStudents.length} STUDENTS
              </Text>
            </View>
            <View style={styles.rosterList}>
              {filteredStudents.map((student: any, idx: number) => (
                <View
                  key={student.student_id || student.id || idx}
                  style={[styles.rosterRowItem, { borderBottomColor: theme.border }]}
                >
                  <View style={styles.rosterLeft}>
                    <View style={[styles.rosterAvatarCircle, { backgroundColor: theme.primary }]}>
                      <Text style={styles.rosterAvatarText}>
                        {student.name?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.rosterStudentName, { color: theme.text }]}>
                        {student.name?.toUpperCase()}
                      </Text>
                      <Text style={[styles.rosterRollNo, { color: theme.subtext }]}>
                        ROLL NO: {student.roll_no || student.rollNumber || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.viewResultBtn, { backgroundColor: theme.primary }]}
                    onPress={() => navigation.navigate('TeacherStudentResultDetail', {
                      studentId: student.student_id || student.id,
                      studentName: student.name,
                      rollNo: student.roll_no || student.rollNumber,
                    })}
                  >
                    <Text style={styles.viewResultBtnText}>VIEW RESULT</Text>
                    <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      {/* Standardized Global Header */}
      <TeacherHeader
        title="Result Management"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'entry' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('entry')}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={activeTab === 'entry' ? theme.primary : theme.subtext}
          />
          <Text style={[styles.tabText, { color: activeTab === 'entry' ? theme.primary : theme.subtext }]}>Marks Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'review' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('review')}
        >
          <Ionicons
            name="checkmark-done-circle-outline"
            size={18}
            color={activeTab === 'review' ? theme.primary : theme.subtext}
          />
          <Text style={[styles.tabText, { color: activeTab === 'review' ? theme.primary : theme.subtext }]}>Review Marks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'view_result' && { borderBottomColor: theme.primary }]}
          onPress={() => setActiveTab('view_result')}
        >
          <Ionicons
            name="school-outline"
            size={18}
            color={activeTab === 'view_result' ? theme.primary : theme.subtext}
          />
          <Text style={[styles.tabText, { color: activeTab === 'view_result' ? theme.primary : theme.subtext }]}>View Result</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Search Bar & Filter Chips */}
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.subtext} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by student, subject, or class name..."
            placeholderTextColor={theme.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>

        {activeTab === 'entry' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
          >
            {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((status) => {
              const isActive = statusFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive 
                        ? (isDarkMode ? theme.primary + '30' : theme.primary + '15') 
                        : (isDarkMode ? '#334155' : '#F3F4F6'),
                      borderColor: isActive ? theme.primary : 'transparent',
                    }
                  ]}
                  onPress={() => setStatusFilter(status)}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.filterChipText, 
                    { 
                      color: isActive ? theme.primary : theme.subtext,
                      fontWeight: isActive ? '800' : '600',
                    }
                  ]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={() => fetchData()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading && workItems.length === 0 && reviewItems.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loaderText, { color: theme.subtext }]}>Loading examinations...</Text>
          </View>
        ) : activeTab === 'entry' ? renderWorkItems() : activeTab === 'review' ? renderReviewItems() : renderViewResultTab()}
      </ScrollView>

      {/* Audit History Modal */}
      <Modal visible={showAuditModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Examination Audit Trail</Text>
                <Text style={[styles.modalSub, { color: theme.subtext }]}>{activeAuditSubject}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAuditModal(false)}>
                <Ionicons name="close" size={24} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            {isFetchingAudit ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={{ marginTop: 10, color: theme.subtext, fontSize: 12 }}>Loading audit trail...</Text>
              </View>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Ionicons name="time-outline" size={36} color={theme.subtext} />
                <Text style={{ color: theme.subtext, marginTop: 10, fontSize: 13 }}>No audit logs recorded for this marksheet.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 320, marginTop: 8 }}>
                {auditLogs.map((log: any, idx: number) => (
                  <View key={log.id || idx} style={[styles.logItem, { borderBottomColor: theme.border }]}>
                    <View style={styles.logTopRow}>
                      <Text style={[styles.logUser, { color: theme.text }]}>{log.changed_by_name || 'Faculty'}</Text>
                      <Text style={[styles.logTime, { color: theme.subtext }]}>{log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}</Text>
                    </View>
                    <Text style={[styles.logChange, { color: theme.primary }]}>
                      Status: {log.old_status || 'DRAFT'} → {log.new_status || 'SUBMITTED'}
                      {log.old_marks !== undefined && log.new_marks !== undefined ? ` (Score: ${log.old_marks} → ${log.new_marks})` : ''}
                    </Text>
                    {log.change_reason ? (
                      <Text style={[styles.logReason, { color: theme.subtext }]}>Reason: {log.change_reason}</Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
  scrollContent: { paddingBottom: 40, paddingHorizontal: 16 },

  globalHeader: {
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
  iconBtn: { padding: 4 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  activeTab: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.subtext,
  },
  activeTabText: {
    color: theme.primary,
  },

  tabContent: { marginTop: 24 },
  sectionHeaderRow: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: theme.text },
  sectionSubtitle: { fontSize: 12, color: theme.subtext, marginTop: 4, fontWeight: '500' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardWrapper: { width: '48.5%', marginBottom: 16 },
  card: {
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    backgroundColor: theme.surface,
    borderColor: theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectCircle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectInitial: { fontSize: 13, fontWeight: '800' },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cardSubject: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  cardClass: { fontSize: 11, fontWeight: '500', marginBottom: 12 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  cardDate: { fontSize: 9, color: theme.subtext, fontWeight: '500' },
  enterMarksBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  enterMarksText: { fontSize: 9, fontWeight: '800' },

  progressContainer: { marginTop: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 8, fontWeight: '700', color: theme.subtext },
  progressValue: { fontSize: 9, fontWeight: '800', color: theme.text },
  progressBarBg: { height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: theme.isDarkMode ? '#334155' : '#F1F5F9' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  reviewDoneText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 16, fontSize: 14, lineHeight: 20, color: theme.subtext },
  loaderContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  loaderText: { marginTop: 12, fontSize: 14, fontWeight: '500', color: theme.subtext },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    marginTop: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: theme.text,
  },
  filterScroll: {
    marginTop: 12,
    marginBottom: 4,
    marginHorizontal: -16,
  },
  filterScrollContent: {
    paddingLeft: 16,
    paddingRight: 32,
    alignItems: 'center',
    paddingVertical: 4,
  },
  filterChip: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  auditIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: theme.border + '30',
  },
  auditIconText: {
    fontSize: 10,
    fontWeight: '600',
  },
  recallMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: theme.primary + '12',
  },
  recallMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },

  permissionNoticeCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 4,
  },
  permissionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  logItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logUser: {
    fontSize: 12,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 10,
  },
  logChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  logReason: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },

  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // View Result Tab Roster Styles
  rosterCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
  },
  rosterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rosterCountText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rosterList: {
    paddingHorizontal: 16,
  },
  rosterRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rosterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rosterAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosterAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  rosterStudentName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rosterRollNo: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  viewResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewResultBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default TeacherResultManagementScreen;
