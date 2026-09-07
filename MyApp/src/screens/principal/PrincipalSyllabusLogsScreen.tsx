import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  Image,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { getCacheBustedUri } from '../../utils/image';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import principalService, {
  LmsTeacherItem,
  LmsClassItem,
  LmsDailyLogItem,
  LmsMatrixItem,
  LmsPagination,
  LmsBlueprintTree,
} from '../../services/principalService';
import { getApiErrorMessage } from '../../services/apiClient';

type PrincipalSyllabusLogsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalSyllabusLogs'
>;

interface Props {
  navigation: PrincipalSyllabusLogsNavigationProp;
}

type TabType = 'audit_logs' | 'syllabus_matrix' | 'teacher_frequency';

interface ToastState {
  message: string;
  type: 'warning' | 'success' | 'error';
}

const formatDisplayDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
};

const formatDateDDMMYYYY = (isoDate?: string | null): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoDate;
};

const PrincipalSyllabusLogsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Drawer
  const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('audit_logs');

  // Loading & Refreshing
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Server Data
  const [teachers, setTeachers] = useState<LmsTeacherItem[]>([]);
  const [classes, setClasses] = useState<LmsClassItem[]>([]);
  const [allLogs, setAllLogs] = useState<LmsDailyLogItem[]>([]);
  const [classSubjects, setClassSubjects] = useState<LmsMatrixItem[]>([]);
  const [pagination, setPagination] = useState<LmsPagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filters (Tab 1)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Dropdown Modals (Tab 1)
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);

  // Daily Log Inspect Modal
  const [selectedLogForModal, setSelectedLogForModal] = useState<LmsDailyLogItem | null>(null);

  // Blueprint Inspect Modal (Tab 2)
  const [selectedSubjectForInspection, setSelectedSubjectForInspection] = useState<LmsMatrixItem | null>(null);
  const [inspectionTree, setInspectionTree] = useState<LmsBlueprintTree | null>(null);
  const [isInspectionLoading, setIsInspectionLoading] = useState<boolean>(false);
  const [isLocking, setIsLocking] = useState<boolean>(false);

  // Teacher Ping States (Tab 3)
  const [pingingTeacherId, setPingingTeacherId] = useState<string | null>(null);
  const [pingSentTeacherIds, setPingSentTeacherIds] = useState<Record<string, boolean>>({});

  // Toast Notification
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'warning' | 'success' | 'error' = 'warning') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch Institution LMS Data
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const res = await principalService.getInstitutionLMS({
          page: currentPage,
          limit: 50,
          teacherId: selectedTeacherId,
          classId: selectedClassId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: searchQuery.trim() || undefined,
        });

        const data = res.data?.data || (res.data as any);
        if (data) {
          setTeachers(data.teachers || []);
          setClasses(data.classes || []);
          setAllLogs(data.logs || []);
          setClassSubjects(data.matrix || []);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } catch (err: any) {
        console.error('[LMS] Fetch error:', err);
        showToast(getApiErrorMessage(err) || 'Failed to load LMS data', 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, selectedTeacherId, selectedClassId, startDate, endDate, searchQuery, showToast]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Derived Analytics Metrics
  const totalTeachers = teachers.length;
  const totalLogsCount = pagination.total || allLogs.length;
  const averageCompletion = useMemo(() => {
    if (classSubjects.length === 0) return 0;
    const sum = classSubjects.reduce((acc, item) => {
      const total = Number(item.totalChapters) || 0;
      const comp = Number(item.completedChapters) || 0;
      return acc + (total > 0 ? (comp / total) * 100 : 0);
    }, 0);
    return Math.round(sum / classSubjects.length);
  }, [classSubjects]);

  const overrunCount = useMemo(() => {
    return classSubjects.filter(
      (item) => item.pacingColor === 'amber' || item.pacingStatus === 'Overrun'
    ).length;
  }, [classSubjects]);

  // Blueprint Inspection Handler
  const handleInspectBlueprint = async (item: LmsMatrixItem) => {
    setSelectedSubjectForInspection(item);
    setIsInspectionLoading(true);
    try {
      const res = await principalService.getSyllabusBlueprintTree(item.classSubjectId);
      const tree = res.data?.data || (res.data as any);
      setInspectionTree(tree);
    } catch (err: any) {
      console.error('[LMS] Inspect Blueprint error:', err);
      showToast(getApiErrorMessage(err) || 'Failed to load syllabus blueprint tree', 'error');
    } finally {
      setIsInspectionLoading(false);
    }
  };

  // Toggle Blueprint Lock in Modal
  const handleToggleLock = async () => {
    if (!selectedSubjectForInspection) return;
    const hasCompletedChapters = inspectionTree?.chapters?.some((c) => c.status === 'completed');
    if (!selectedSubjectForInspection.isLocked && !hasCompletedChapters) {
      showToast(
        'No chapters in this syllabus are marked as Completed yet. Only completed chapters can be locked.',
        'warning'
      );
      return;
    }

    setIsLocking(true);
    const newLockState = !selectedSubjectForInspection.isLocked;
    try {
      await principalService.toggleBlueprintLock(
        selectedSubjectForInspection.classSubjectId,
        newLockState
      );
      setSelectedSubjectForInspection((prev) => (prev ? { ...prev, isLocked: newLockState } : null));
      setClassSubjects((prev) =>
        prev.map((cs) =>
          cs.classSubjectId === selectedSubjectForInspection.classSubjectId
            ? { ...cs, isLocked: newLockState }
            : cs
        )
      );
      if (inspectionTree?.chapters) {
        setInspectionTree((prev) =>
          prev
            ? {
                ...prev,
                chapters: prev.chapters.map((c) => ({
                  ...c,
                  isLocked: newLockState ? c.status === 'completed' : false,
                })),
              }
            : null
        );
      }
      showToast(
        newLockState ? 'Completed chapters locked successfully.' : 'Syllabus blueprint unlocked.',
        'success'
      );
    } catch (err: any) {
      console.error('[LMS] Lock toggle error:', err);
      showToast(getApiErrorMessage(err) || 'Failed to update blueprint lock status.', 'error');
    } finally {
      setIsLocking(false);
    }
  };

  // Toggle Individual Chapter Lock
  const handleToggleChapterLock = async (
    chapterId: string,
    currentLockState: boolean,
    chapterStatus: string
  ) => {
    if (!currentLockState && chapterStatus !== 'completed') {
      showToast(
        'Only chapters that are already marked as Completed can be locked. In-progress or newly created chapters cannot be locked.',
        'warning'
      );
      return;
    }
    const newLockState = !currentLockState;
    try {
      await principalService.toggleChapterLock(chapterId, newLockState);
      setInspectionTree((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          chapters: prev.chapters.map((c) => (c.id === chapterId ? { ...c, isLocked: newLockState } : c)),
        };
      });
      showToast(
        newLockState ? 'Chapter locked successfully.' : 'Chapter unlocked successfully.',
        'success'
      );
    } catch (err: any) {
      console.error('[LMS] Chapter lock toggle error:', err);
      showToast(getApiErrorMessage(err) || 'Failed to toggle chapter lock', 'error');
    }
  };

  // Direct Toggle on Row
  const handleToggleLockDirect = async (item: LmsMatrixItem) => {
    if (!item.isLocked && (!item.completedChapters || Number(item.completedChapters) === 0)) {
      showToast(
        'No chapters in this syllabus are marked as Completed yet. Only completed chapters can be locked.',
        'warning'
      );
      return;
    }
    const newLockState = !item.isLocked;
    try {
      await principalService.toggleBlueprintLock(item.classSubjectId, newLockState);
      setClassSubjects((prev) =>
        prev.map((cs) => (cs.classSubjectId === item.classSubjectId ? { ...cs, isLocked: newLockState } : cs))
      );
      showToast(
        newLockState ? 'Completed chapters locked successfully.' : 'Syllabus unlocked.',
        'success'
      );
    } catch (err: any) {
      console.error('[LMS] Direct lock error:', err);
      showToast(getApiErrorMessage(err) || 'Failed to toggle lock state.', 'error');
    }
  };

  // Send Reminder Ping (Tab 3)
  const handleSendReminder = async (teacherId: string, teacherName: string) => {
    setPingingTeacherId(teacherId);
    try {
      await principalService.sendTeacherReminderPing(teacherId);
      setPingSentTeacherIds((prev) => ({ ...prev, [teacherId]: true }));
      showToast(`🔔 Reminder ping sent successfully to ${teacherName || 'teacher'}!`, 'success');
      setTimeout(() => {
        setPingSentTeacherIds((prev) => ({ ...prev, [teacherId]: false }));
      }, 5000);
    } catch (err: any) {
      console.error('[LMS] Send reminder error:', err);
      showToast(getApiErrorMessage(err) || 'Failed to send reminder ping.', 'error');
    } finally {
      setPingingTeacherId(null);
    }
  };

  // Export Matrix CSV (Tab 2)
  const handleExportCSV = async () => {
    try {
      const RNFS = require('react-native-fs');
      let ShareLib: any = null;
      try {
        ShareLib = require('react-native-share').default || require('react-native-share');
      } catch {}

      const headers = [
        'Class & Section',
        'Subject',
        'Subject Code',
        'Assigned Teacher',
        'Total Chapters',
        'Completed Chapters',
        'Completion %',
        'Target Hours',
        'Logged Hours',
        'Pacing Status',
        'Lock Status',
      ];
      const rows = classSubjects.map((item) => [
        `"${item.className} (${item.section})"`,
        `"${item.subjectName}"`,
        `"${item.subjectCode || ''}"`,
        `"${item.teacherName || 'Unassigned'}"`,
        item.totalChapters,
        item.completedChapters,
        `"${item.completionPercent || 0}%"`,
        item.targetHours,
        item.loggedHours || 0,
        `"${item.pacingStatus || 'On Track'}"`,
        `"${item.isLocked ? 'LOCKED' : 'UNLOCKED'}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const filename = `syllabus_matrix_${new Date().toISOString().split('T')[0]}.csv`;
      const path = `${RNFS.DocumentDirectoryPath}/${filename}`;

      await RNFS.writeFile(path, csvContent, 'utf8');

      if (ShareLib) {
        await ShareLib.open({
          url: `file://${path}`,
          type: 'text/csv',
          title: 'Export Matrix CSV',
        });
      } else {
        Alert.alert('Export Successful', `Matrix exported to ${path}`);
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share' && error?.name !== 'Error') {
        Alert.alert('Error', 'Failed to export syllabus matrix CSV.');
      }
    }
  };

  const selectedTeacherName = useMemo(() => {
    if (selectedTeacherId === 'all') return 'All Teachers';
    const t = teachers.find((item) => String(item.id) === String(selectedTeacherId));
    return t ? t.name : 'All Teachers';
  }, [selectedTeacherId, teachers]);

  const selectedClassName = useMemo(() => {
    if (selectedClassId === 'all') return 'All Classes';
    const c = classes.find((item) => String(item.id) === String(selectedClassId));
    return c ? `${c.name} Section ${c.section}` : 'All Classes';
  }, [selectedClassId, classes]);

  return (
    <View style={styles.safeContainer}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Shared Standard Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setDrawerOpen(true)}
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Syllabus & Daily Logs</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
          accessibilityLabel="Account settings"
        >
          {authState.user?.photoUrl ? (
            <Image
              source={{
                uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt),
              }}
              style={styles.headerAvatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
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
        {/* Screen Title Block */}
        <View style={styles.titleBlock}>
          <View style={styles.titleIconBox}>
            <Ionicons name="school-outline" size={26} color={theme.onPrimary} />
          </View>
          <View style={styles.titleTextBox}>
            <Text style={styles.mainTitle}>Institution LMS & Teacher Activity Tracker</Text>
            <Text style={styles.mainSubtitle}>
              Monitor syllabus completion, inspect teacher daily lecture logs, lock blueprints, and
              track curriculum pacing across all classes.
            </Text>
          </View>
        </View>

        {/* 4 Stat Cards */}
        <View style={styles.statsGrid}>
          {/* Active Teachers */}
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              <Text style={styles.statCardLabel}>ACTIVE TEACHERS</Text>
              <View style={styles.statIconBadgePurple}>
                <Ionicons name="people-outline" size={16} color={theme.primary} />
              </View>
            </View>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{totalTeachers}</Text>
              <Text style={styles.statSubtext}>Teachers Logging Daily</Text>
            </View>
          </View>

          {/* Lecture Logs */}
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              <Text style={styles.statCardLabel}>LECTURE LOGS</Text>
              <View style={styles.statIconBadgeBlue}>
                <Ionicons name="document-text-outline" size={16} color={theme.primary} />
              </View>
            </View>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{totalLogsCount}</Text>
              <Text style={styles.statSubtext}>Activity Logs Recorded</Text>
            </View>
          </View>

          {/* Avg Syllabus Progress */}
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              <Text style={styles.statCardLabel}>AVG SYLLABUS PROGRESS</Text>
              <View style={styles.statIconBadgeGreen}>
                <Ionicons name="checkmark-circle-outline" size={16} color={theme.success} />
              </View>
            </View>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{averageCompletion}%</Text>
              <Text style={styles.statSubtext}>Institution-wide Pacing</Text>
            </View>
          </View>

          {/* Pacing Alerts */}
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              <Text style={styles.statCardLabel}>PACING ALERTS</Text>
              <View style={styles.statIconBadgeAmber}>
                <Ionicons name="warning-outline" size={16} color={theme.warning} />
              </View>
            </View>
            <View style={styles.pacingAlertBox}>
              <Ionicons name="warning-outline" size={14} color={theme.warning} />
              <Text style={styles.pacingAlertText}>
                {overrunCount} Subject Overrunning Target
              </Text>
            </View>
          </View>
        </View>

        {/* 3 Tabs Navigation with Live Counts */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'audit_logs' && styles.tabButtonActive]}
              onPress={() => setActiveTab('audit_logs')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="clipboard-outline"
                size={16}
                color={activeTab === 'audit_logs' ? theme.primary : theme.subtext}
              />
              <Text style={[styles.tabText, activeTab === 'audit_logs' && styles.tabTextActive]}>
                1. All Teacher Daily Logs Audit ({pagination.total || allLogs.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'syllabus_matrix' && styles.tabButtonActive]}
              onPress={() => setActiveTab('syllabus_matrix')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="school-outline"
                size={16}
                color={activeTab === 'syllabus_matrix' ? theme.primary : theme.subtext}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'syllabus_matrix' && styles.tabTextActive,
                ]}
              >
                2. Class Syllabus Progress Matrix ({classSubjects.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'teacher_frequency' && styles.tabButtonActive]}
              onPress={() => setActiveTab('teacher_frequency')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={activeTab === 'teacher_frequency' ? theme.primary : theme.subtext}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'teacher_frequency' && styles.tabTextActive,
                ]}
              >
                3. Teacher Logging Activity & Frequency
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Loading Spinner for Content */}
        {isLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading LMS data...</Text>
          </View>
        )}

        {!isLoading && (
          <>
            {/* TAB 1: ALL TEACHER DAILY LOGS AUDIT */}
            {activeTab === 'audit_logs' && (
              <View style={styles.tabContentSection}>
                {/* Filters Box */}
                <View style={styles.filterCard}>
                  {/* Search Input */}
                  <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
                    <TextInput
                      placeholder="Search institution-wide logs..."
                      placeholderTextColor={theme.placeholder}
                      value={searchQuery}
                      onChangeText={(text) => {
                        setSearchQuery(text);
                        setCurrentPage(1);
                      }}
                      style={styles.searchInput}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color={theme.subtext} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Dropdowns Row */}
                  <View style={styles.filterDropdownRow}>
                    <TouchableOpacity
                      style={styles.filterDropdownBtn}
                      onPress={() => setIsTeacherModalOpen(true)}
                    >
                      <Text style={styles.filterDropdownText} numberOfLines={1}>
                        {selectedTeacherName}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={theme.subtext} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.filterDropdownBtn}
                      onPress={() => setIsClassModalOpen(true)}
                    >
                      <Text style={styles.filterDropdownText} numberOfLines={1}>
                        {selectedClassName}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={theme.subtext} />
                    </TouchableOpacity>
                  </View>

                  {/* Dates Row */}
                  <View style={styles.filterDateRow}>
                    <TouchableOpacity
                      style={styles.datePickerBtn}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={14} color={theme.subtext} />
                      <Text style={styles.datePickerText}>
                        {startDate ? formatDateDDMMYYYY(startDate) : 'dd-mm-yyyy'}
                      </Text>
                      {startDate ? (
                        <TouchableOpacity
                          onPress={() => {
                            setStartDate('');
                            setCurrentPage(1);
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="close" size={14} color={theme.subtext} />
                        </TouchableOpacity>
                      ) : null}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.datePickerBtn}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={14} color={theme.subtext} />
                      <Text style={styles.datePickerText}>
                        {endDate ? formatDateDDMMYYYY(endDate) : 'dd-mm-yyyy'}
                      </Text>
                      {endDate ? (
                        <TouchableOpacity
                          onPress={() => {
                            setEndDate('');
                            setCurrentPage(1);
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="close" size={14} color={theme.subtext} />
                        </TouchableOpacity>
                      ) : null}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Logs List */}
                {allLogs.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="document-text-outline" size={40} color={theme.subtext} />
                    <Text style={styles.emptyCardText}>
                      No daily lecture logs found matching your filters.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.logsList}>
                    {allLogs.map((log) => (
                      <TouchableOpacity
                        key={log.id}
                        style={styles.logCard}
                        onPress={() => setSelectedLogForModal(log)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.logCardHeader}>
                          <View style={styles.logCardHeaderLeft}>
                            <View style={styles.logDateBadge}>
                              <Text style={styles.logDateBadgeText}>
                                {formatDisplayDate(log.logDate)}
                              </Text>
                            </View>
                            <View style={styles.logTeacherInfo}>
                              <View style={styles.logTeacherNameRow}>
                                <Text style={styles.logTeacherName}>{log.teacherName}</Text>
                                <View style={styles.classSubjectBadge}>
                                  <Text style={styles.classSubjectBadgeText}>
                                    {log.className} ({log.section}) — {log.subjectName}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.logChapterTopic}>
                                {log.chapterTitle || 'General Chapter'} —{' '}
                                {log.topicTitle || 'General Topic'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.inspectActionBadge}>
                            <Text style={styles.inspectActionBadgeText}>Inspect Log →</Text>
                          </View>
                        </View>

                        <Text style={styles.logCoverageTitle}>{log.coverageTitle}</Text>
                        <Text style={styles.logNotes} numberOfLines={2}>
                          {log.notes || 'No extra notes recorded.'}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <View style={styles.paginationRow}>
                        <Text style={styles.paginationInfo}>
                          Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Logs)
                        </Text>
                        <View style={styles.paginationBtnGroup}>
                          <TouchableOpacity
                            style={[
                              styles.paginationBtn,
                              currentPage <= 1 && styles.paginationBtnDisabled,
                            ]}
                            disabled={currentPage <= 1}
                            onPress={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          >
                            <Text style={styles.paginationBtnText}>Previous</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.paginationBtnPrimary,
                              currentPage >= pagination.totalPages && styles.paginationBtnDisabled,
                            ]}
                            disabled={currentPage >= pagination.totalPages}
                            onPress={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                          >
                            <Text style={styles.paginationBtnPrimaryText}>Next</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: CLASS SYLLABUS PROGRESS MATRIX */}
            {activeTab === 'syllabus_matrix' && (
              <View style={styles.tabContentSection}>
                {/* Section Header & Export Button */}
                <View style={styles.matrixHeaderCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matrixTitle}>
                      Class-Subject Syllabus Progress & Administrative Lock Controls
                    </Text>
                    <Text style={styles.matrixSubtitle}>
                      Click any row to inspect the full chapter/topic blueprint tree and toggle
                      administrative locks.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={handleExportCSV}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="document-text-outline" size={14} color={theme.onPrimary} />
                    <Text style={styles.exportBtnText}>Export Matrix CSV</Text>
                  </TouchableOpacity>
                </View>

                {/* Matrix List Cards */}
                {classSubjects.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="school-outline" size={40} color={theme.subtext} />
                    <Text style={styles.emptyCardText}>No syllabus matrix records found.</Text>
                  </View>
                ) : (
                  <View style={styles.matrixList}>
                    {classSubjects.map((item) => {
                      const totalCh = Number(item.totalChapters) || 0;
                      const compCh = Number(item.completedChapters) || 0;
                      const compPct = totalCh > 0 ? Math.round((compCh / totalCh) * 100) : 0;

                      return (
                        <TouchableOpacity
                          key={item.classSubjectId}
                          style={styles.matrixCard}
                          onPress={() => handleInspectBlueprint(item)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.matrixCardTop}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.matrixClassName}>
                                {item.className} ({item.section})
                              </Text>
                              <Text style={styles.matrixSubjectName}>
                                {item.subjectName} {item.subjectCode ? `[${item.subjectCode}]` : '[]'}
                              </Text>
                              <Text style={styles.matrixTeacherName}>
                                Teacher: {item.teacherName || 'Unassigned'}
                              </Text>
                            </View>

                            <TouchableOpacity
                              style={[
                                styles.lockBadge,
                                item.isLocked ? styles.lockBadgeLocked : styles.lockBadgeUnlocked,
                              ]}
                              onPress={() => handleToggleLockDirect(item)}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name={item.isLocked ? 'lock-closed' : 'lock-open-outline'}
                                size={12}
                                color={item.isLocked ? theme.danger : theme.success}
                              />
                              <Text
                                style={[
                                  styles.lockBadgeText,
                                  { color: item.isLocked ? theme.danger : theme.success },
                                ]}
                              >
                                {item.isLocked ? 'LOCKED' : 'UNLOCKED'}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* Progress Row */}
                          <View style={styles.matrixProgressRow}>
                            <Text style={styles.matrixProgressRatio}>
                              {compCh} / {totalCh} Chapters
                            </Text>
                            <View style={styles.matrixProgressBarWrap}>
                              <Text style={styles.matrixProgressPercent}>{compPct}%</Text>
                              <View style={styles.matrixProgressBarBg}>
                                <View
                                  style={[
                                    styles.matrixProgressBarFill,
                                    { width: `${Math.min(compPct, 100)}%` },
                                  ]}
                                />
                              </View>
                            </View>
                            <TouchableOpacity
                              style={styles.inspectTreeBtn}
                              onPress={() => handleInspectBlueprint(item)}
                            >
                              <Text style={styles.inspectTreeBtnText}>Inspect Tree</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* TAB 3: TEACHER LOGGING ACTIVITY & FREQUENCY */}
            {activeTab === 'teacher_frequency' && (
              <View style={styles.tabContentSection}>
                {teachers.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="people-outline" size={40} color={theme.subtext} />
                    <Text style={styles.emptyCardText}>No teacher activity records available.</Text>
                  </View>
                ) : (
                  <View style={styles.teachersGrid}>
                    {teachers.map((t) => {
                      const logsThisMonth = Number(t.logsThisMonth) || 0;
                      const totalLogs = Number(t.totalLogs) || 0;
                      const assignedClassesCount = Number(t.assignedClassesCount) || 0;
                      const isHighCompliance = logsThisMonth >= 5;
                      const isPinging = pingingTeacherId === t.id;
                      const isSent = Boolean(pingSentTeacherIds[t.id]);

                      return (
                        <View key={t.id} style={styles.teacherCard}>
                          {/* Top Row: Name + Compliance Badge */}
                          <View style={styles.teacherCardTop}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.teacherName}>{t.name}</Text>
                              <Text style={styles.teacherEmail}>{t.email}</Text>
                            </View>
                            <View
                              style={[
                                styles.complianceBadge,
                                isHighCompliance
                                  ? styles.complianceBadgeHigh
                                  : styles.complianceBadgeNeeds,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.complianceBadgeText,
                                  { color: isHighCompliance ? theme.success : theme.warning },
                                ]}
                              >
                                {isHighCompliance ? 'High Compliance' : 'Needs Reminder'}
                              </Text>
                            </View>
                          </View>

                          {/* 4 Stats Grid */}
                          <View style={styles.teacherStatsGrid}>
                            <View style={styles.teacherStatCell}>
                              <Text style={styles.teacherStatLabel}>This Month</Text>
                              <Text style={styles.teacherStatValuePurple}>{logsThisMonth} Logs</Text>
                            </View>
                            <View style={styles.teacherStatCell}>
                              <Text style={styles.teacherStatLabel}>All-Time</Text>
                              <Text style={styles.teacherStatValue}>{totalLogs} Logs</Text>
                            </View>
                            <View style={styles.teacherStatCell}>
                              <Text style={styles.teacherStatLabel}>Classes</Text>
                              <Text style={styles.teacherStatValue}>{assignedClassesCount} Assigned</Text>
                            </View>
                            <View style={styles.teacherStatCell}>
                              <Text style={styles.teacherStatLabel}>Last Log Date</Text>
                              <Text style={styles.teacherStatValueSmall}>
                                {t.lastLogDate || 'No Logs'}
                              </Text>
                            </View>
                          </View>

                          {/* Action Button: Send Reminder Ping */}
                          <TouchableOpacity
                            style={[
                              styles.reminderPingBtn,
                              isSent && styles.reminderPingBtnSent,
                              isPinging && styles.reminderPingBtnPinging,
                            ]}
                            disabled={isPinging}
                            onPress={() => handleSendReminder(t.id, t.name)}
                            activeOpacity={0.8}
                          >
                            {isPinging ? (
                              <View style={styles.btnRow}>
                                <ActivityIndicator size="small" color={theme.primary} />
                                <Text style={styles.reminderPingBtnText}>Sending Ping...</Text>
                              </View>
                            ) : isSent ? (
                              <View style={styles.btnRow}>
                                <Ionicons name="checkmark-circle" size={16} color={theme.onPrimary} />
                                <Text style={styles.reminderPingBtnTextSent}>✓ Reminder Sent</Text>
                              </View>
                            ) : (
                              <View style={styles.btnRow}>
                                <Text style={styles.reminderPingBtnText}>🔔 Send Reminder Ping</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate ? new Date(startDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date && event.type !== 'dismissed') {
              const yyyy = date.getFullYear();
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              const dd = String(date.getDate()).padStart(2, '0');
              setStartDate(`${yyyy}-${mm}-${dd}`);
              setCurrentPage(1);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate ? new Date(endDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date && event.type !== 'dismissed') {
              const yyyy = date.getFullYear();
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              const dd = String(date.getDate()).padStart(2, '0');
              setEndDate(`${yyyy}-${mm}-${dd}`);
              setCurrentPage(1);
            }
          }}
        />
      )}

      {/* Teacher Filter Modal */}
      <Modal
        visible={isTeacherModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTeacherModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsTeacherModalOpen(false)}
        >
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>Select Teacher</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              <TouchableOpacity
                style={[
                  styles.dropdownOption,
                  selectedTeacherId === 'all' && styles.dropdownOptionSelected,
                ]}
                onPress={() => {
                  setSelectedTeacherId('all');
                  setCurrentPage(1);
                  setIsTeacherModalOpen(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>All Teachers</Text>
                {selectedTeacherId === 'all' && (
                  <Ionicons name="checkmark" size={16} color={theme.primary} />
                )}
              </TouchableOpacity>
              {teachers.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.dropdownOption,
                    selectedTeacherId === t.id && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedTeacherId(t.id);
                    setCurrentPage(1);
                    setIsTeacherModalOpen(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{t.name}</Text>
                  {selectedTeacherId === t.id && (
                    <Ionicons name="checkmark" size={16} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Class Filter Modal */}
      <Modal
        visible={isClassModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsClassModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsClassModalOpen(false)}
        >
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>Select Class</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              <TouchableOpacity
                style={[
                  styles.dropdownOption,
                  selectedClassId === 'all' && styles.dropdownOptionSelected,
                ]}
                onPress={() => {
                  setSelectedClassId('all');
                  setCurrentPage(1);
                  setIsClassModalOpen(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>All Classes</Text>
                {selectedClassId === 'all' && (
                  <Ionicons name="checkmark" size={16} color={theme.primary} />
                )}
              </TouchableOpacity>
              {classes.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.dropdownOption,
                    selectedClassId === c.id && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedClassId(c.id);
                    setCurrentPage(1);
                    setIsClassModalOpen(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>
                    {c.name} Section {c.section}
                  </Text>
                  {selectedClassId === c.id && (
                    <Ionicons name="checkmark" size={16} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* INSPECT DAILY LOG MODAL */}
      <Modal
        visible={Boolean(selectedLogForModal)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLogForModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.inspectModalCard}>
            {selectedLogForModal && (
              <>
                <View style={styles.inspectModalHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.logDateBadge}>
                      <Text style={styles.logDateBadgeText}>
                        Logged on {formatDisplayDate(selectedLogForModal.logDate)}
                      </Text>
                    </View>
                    <Text style={styles.inspectModalTitle}>
                      {selectedLogForModal.coverageTitle}
                    </Text>
                    <Text style={styles.inspectModalSubtitle}>
                      Teacher: <Text style={{ fontWeight: '700' }}>{selectedLogForModal.teacherName}</Text> |{' '}
                      {selectedLogForModal.className} ({selectedLogForModal.section}) —{' '}
                      {selectedLogForModal.subjectName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedLogForModal(null)}
                  >
                    <Ionicons name="close" size={20} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                  {/* Grid: Chapter / Topic / Hours / Periods */}
                  <View style={styles.inspectGrid}>
                    <View style={styles.inspectGridCell}>
                      <Text style={styles.inspectGridLabel}>CHAPTER</Text>
                      <Text style={styles.inspectGridValue}>
                        {selectedLogForModal.chapterTitle || 'General Syllabus'}
                      </Text>
                    </View>
                    <View style={styles.inspectGridCell}>
                      <Text style={styles.inspectGridLabel}>TOPIC</Text>
                      <Text style={styles.inspectGridValue}>
                        {selectedLogForModal.topicTitle || 'General Topic'}
                      </Text>
                    </View>
                    <View style={styles.inspectGridCell}>
                      <Text style={styles.inspectGridLabel}>HOURS SPENT</Text>
                      <Text style={styles.inspectGridValue}>
                        {selectedLogForModal.hoursSpent || 0} Hours
                      </Text>
                    </View>
                    <View style={styles.inspectGridCell}>
                      <Text style={styles.inspectGridLabel}>PERIODS COUNT</Text>
                      <Text style={styles.inspectGridValue}>
                        {selectedLogForModal.periodsCount || 0} Periods
                      </Text>
                    </View>
                  </View>

                  {/* Lecture Notes */}
                  <View style={styles.inspectDetailSection}>
                    <Text style={styles.inspectSectionHeader}>LECTURE NOTES / COVERAGE DETAILS</Text>
                    <View style={styles.inspectBoxNormal}>
                      <Text style={styles.inspectBoxText}>
                        {selectedLogForModal.notes || 'No extra notes recorded.'}
                      </Text>
                    </View>
                  </View>

                  {/* Homework */}
                  {Boolean(selectedLogForModal.homeworkAssigned) && (
                    <View style={styles.inspectDetailSection}>
                      <Text style={styles.inspectSectionHeader}>
                        HOMEWORK / ASSIGNMENTS ASSIGNED
                      </Text>
                      <View style={styles.inspectBoxPurple}>
                        <Text style={styles.inspectBoxTextPurple}>
                          {selectedLogForModal.homeworkAssigned}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Next Class Plan */}
                  {Boolean(selectedLogForModal.nextClassPlan) && (
                    <View style={styles.inspectDetailSection}>
                      <Text style={styles.inspectSectionHeader}>NEXT CLASS LESSON PLAN</Text>
                      <View style={styles.inspectBoxBlue}>
                        <Text style={styles.inspectBoxTextBlue}>
                          {selectedLogForModal.nextClassPlan}
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Bottom Dismiss Action */}
                <View style={styles.inspectModalFooter}>
                  <TouchableOpacity
                    style={styles.closeInspectionBtn}
                    onPress={() => setSelectedLogForModal(null)}
                  >
                    <Text style={styles.closeInspectionBtnText}>Close Inspection</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* INSPECT BLUEPRINT MODAL (TAB 2) */}
      <Modal
        visible={Boolean(selectedSubjectForInspection)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSubjectForInspection(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.blueprintModalCard}>
            {selectedSubjectForInspection && (
              <>
                <View style={styles.blueprintModalHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={styles.blueprintTitleRow}>
                      <Text style={styles.blueprintTitle}>
                        {selectedSubjectForInspection.className} (
                        {selectedSubjectForInspection.section}) —{' '}
                        {selectedSubjectForInspection.subjectName}
                      </Text>
                      <View
                        style={[
                          styles.lockBadge,
                          selectedSubjectForInspection.isLocked
                            ? styles.lockBadgeLocked
                            : styles.lockBadgeUnlocked,
                        ]}
                      >
                        <Text
                          style={[
                            styles.lockBadgeText,
                            {
                              color: selectedSubjectForInspection.isLocked
                                ? theme.danger
                                : theme.success,
                            },
                          ]}
                        >
                          {selectedSubjectForInspection.isLocked
                            ? '🔒 LOCKED BY ADMIN'
                            : '🔓 UNLOCKED'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.blueprintTeacher}>
                      Assigned Teacher:{' '}
                      <Text style={{ fontWeight: '700' }}>
                        {selectedSubjectForInspection.teacherName || 'Unassigned'}
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.blueprintHeaderActions}>
                    <TouchableOpacity
                      style={[
                        styles.toggleLockBtn,
                        selectedSubjectForInspection.isLocked
                          ? styles.toggleLockBtnUnlock
                          : styles.toggleLockBtnLock,
                      ]}
                      disabled={isLocking}
                      onPress={handleToggleLock}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.toggleLockBtnText}>
                        {isLocking
                          ? 'Updating...'
                          : selectedSubjectForInspection.isLocked
                          ? '🔓 Unlock Blueprint'
                          : '🔒 Lock Blueprint'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={() => setSelectedSubjectForInspection(null)}
                    >
                      <Ionicons name="close" size={20} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Blueprint Chapters Tree */}
                {isInspectionLoading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={styles.loadingText}>Loading syllabus blueprint tree...</Text>
                  </View>
                ) : (
                  <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                    {inspectionTree?.chapters && inspectionTree.chapters.length > 0 ? (
                      inspectionTree.chapters.map((ch) => (
                        <View key={ch.id} style={styles.chapterCard}>
                          <View style={styles.chapterCardTop}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.chapterTitle}>
                                <Text style={{ color: theme.primary, fontWeight: '800' }}>
                                  Ch {ch.chapterNumber}:
                                </Text>{' '}
                                {ch.title}
                              </Text>
                            </View>

                            <View style={styles.chapterMetaRow}>
                              {ch.status === 'completed' ? (
                                <TouchableOpacity
                                  style={[
                                    styles.chLockBtn,
                                    ch.isLocked ? styles.chLockBtnLocked : styles.chLockBtnUnlocked,
                                  ]}
                                  onPress={() =>
                                    handleToggleChapterLock(ch.id, ch.isLocked, ch.status)
                                  }
                                >
                                  <Text
                                    style={[
                                      styles.chLockBtnText,
                                      { color: ch.isLocked ? theme.danger : theme.text },
                                    ]}
                                  >
                                    {ch.isLocked ? '🔒 Completed (Locked)' : '🔓 Lock Completed'}
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <View style={styles.chUnlockedBadge}>
                                  <Text style={styles.chUnlockedBadgeText}>
                                    🔓 Unlocked (
                                    {ch.status === 'in_progress' ? 'In Progress' : 'Pending'})
                                  </Text>
                                </View>
                              )}

                              <Text style={styles.chHoursText}>
                                {ch.estimatedHours} hrs / {ch.estimatedPeriods} periods
                              </Text>

                              <View
                                style={[
                                  styles.chStatusBadge,
                                  ch.status === 'completed'
                                    ? styles.chStatusBadgeCompleted
                                    : styles.chStatusBadgeInProgress,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.chStatusBadgeText,
                                    {
                                      color:
                                        ch.status === 'completed' ? theme.success : theme.warning,
                                    },
                                  ]}
                                >
                                  {ch.status?.replace('_', ' ')}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Nested Topics */}
                          {ch.topics && ch.topics.length > 0 && (
                            <View style={styles.topicsTree}>
                              {ch.topics.map((tp) => (
                                <View key={tp.id} style={styles.topicItem}>
                                  <View style={styles.topicRow}>
                                    <Text style={styles.topicTitle}>
                                      Topic {tp.topicNumber}: {tp.title}
                                    </Text>
                                    <Text style={styles.topicStatus}>{tp.status}</Text>
                                  </View>

                                  {/* Subtopics */}
                                  {tp.subtopics && tp.subtopics.length > 0 && (
                                    <View style={styles.subtopicsTree}>
                                      {tp.subtopics.map((stp) => (
                                        <View key={stp.id} style={styles.subtopicRow}>
                                          <Text style={styles.subtopicTitle}>• {stp.title}</Text>
                                          <Text style={styles.subtopicStatus}>{stp.status}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  )}
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyCard}>
                        <Text style={styles.emptyCardText}>
                          No chapters defined in this blueprint yet.
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* FLOATING TOAST BANNER */}
      {toast && (
        <View
          style={[
            styles.toastContainer,
            toast.type === 'error'
              ? styles.toastError
              : toast.type === 'success'
              ? styles.toastSuccess
              : styles.toastWarning,
          ]}
        >
          <Ionicons
            name={
              toast.type === 'error'
                ? 'close-circle'
                : toast.type === 'success'
                ? 'checkmark-circle'
                : 'warning'
            }
            size={18}
            color={theme.onPrimary}
          />
          <Text style={styles.toastText}>{toast.message}</Text>
          <TouchableOpacity onPress={() => setToast(null)} style={styles.toastCloseBtn}>
            <Ionicons name="close" size={16} color={theme.onPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="principal"
      />
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === 'ios' ? 50 : 30,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    // Header
    appHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.background,
    },
    headerBtn: {
      padding: 4,
    },
    appHeaderTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    headerAvatarImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: theme.onPrimary,
      fontWeight: '700',
      fontSize: 14,
    },

    // Title Block
    titleBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginTop: 16,
      marginBottom: 16,
      gap: 12,
    },
    titleIconBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleTextBox: {
      flex: 1,
    },
    mainTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    mainSubtitle: {
      fontSize: 12,
      color: theme.subtext,
      marginTop: 2,
      lineHeight: 16,
    },

    // 4 Stat Cards
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 10,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      minWidth: '46%',
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statCardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statCardLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.subtext,
      letterSpacing: 0.5,
    },
    statIconBadgePurple: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: theme.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statIconBadgeBlue: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: theme.iconBoxBlueBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statIconBadgeGreen: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: theme.cardNested,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statIconBadgeAmber: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: theme.cardNested,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statValueRow: {
      marginTop: 10,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '900',
      color: theme.text,
    },
    statSubtext: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.subtext,
      marginTop: 2,
    },
    pacingAlertBox: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.cardNested,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    pacingAlertText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.warning,
    },

    // Tabs
    tabsContainer: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: 16,
    },
    tabsScroll: {
      paddingHorizontal: 16,
      gap: 16,
    },
    tabButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabButtonActive: {
      borderBottomColor: theme.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.subtext,
    },
    tabTextActive: {
      color: theme.primary,
    },

    // Tab content container
    tabContentSection: {
      paddingHorizontal: 16,
    },

    // Loading / Empty
    loadingBox: {
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.subtext,
      marginTop: 8,
    },
    emptyCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      marginVertical: 12,
    },
    emptyCardText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.subtext,
      marginTop: 10,
      textAlign: 'center',
    },

    // Filter Card (Tab 1)
    filterCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 14,
      gap: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardNested,
      borderRadius: 10,
      paddingHorizontal: 10,
      height: 40,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
      paddingVertical: 0,
    },
    filterDropdownRow: {
      flexDirection: 'row',
      gap: 8,
    },
    filterDropdownBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.cardNested,
      borderRadius: 10,
      paddingHorizontal: 10,
      height: 38,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterDropdownText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
      marginRight: 4,
    },
    filterDateRow: {
      flexDirection: 'row',
      gap: 8,
    },
    datePickerBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.cardNested,
      borderRadius: 10,
      paddingHorizontal: 10,
      height: 36,
      borderWidth: 1,
      borderColor: theme.border,
    },
    datePickerText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.text,
    },

    // Logs List (Tab 1)
    logsList: {
      gap: 12,
    },
    logCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    logCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 10,
      marginBottom: 10,
    },
    logCardHeaderLeft: {
      flex: 1,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    logDateBadge: {
      backgroundColor: theme.iconBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    logDateBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.primary,
    },
    logTeacherInfo: {
      flex: 1,
    },
    logTeacherNameRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
    },
    logTeacherName: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    classSubjectBadge: {
      backgroundColor: theme.cardNested,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 12,
    },
    classSubjectBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
    },
    logChapterTopic: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.subtext,
      marginTop: 2,
    },
    inspectActionBadge: {
      backgroundColor: theme.cardNested,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginLeft: 6,
    },
    inspectActionBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.subtext,
    },
    logCoverageTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    logNotes: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.subtext,
      lineHeight: 16,
    },

    // Pagination
    paginationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    paginationInfo: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.subtext,
    },
    paginationBtnGroup: {
      flexDirection: 'row',
      gap: 8,
    },
    paginationBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    paginationBtnDisabled: {
      opacity: 0.4,
    },
    paginationBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    paginationBtnPrimary: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    paginationBtnPrimaryText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.onPrimary,
    },

    // Tab 2 Matrix Header Card
    matrixHeaderCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    matrixTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.text,
    },
    matrixSubtitle: {
      fontSize: 11,
      color: theme.subtext,
      marginTop: 2,
    },
    exportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.primary,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
    },
    exportBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.onPrimary,
    },

    // Matrix List Cards (Tab 2)
    matrixList: {
      gap: 10,
    },
    matrixCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    matrixCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    matrixClassName: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.text,
    },
    matrixSubjectName: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
      marginTop: 2,
    },
    matrixTeacherName: {
      fontSize: 11,
      color: theme.subtext,
      marginTop: 2,
    },
    lockBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
    },
    lockBadgeLocked: {
      backgroundColor: theme.cardNested,
      borderColor: theme.danger,
    },
    lockBadgeUnlocked: {
      backgroundColor: theme.cardNested,
      borderColor: theme.success,
    },
    lockBadgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    matrixProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: 8,
    },
    matrixProgressRatio: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.subtext,
    },
    matrixProgressBarWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    matrixProgressPercent: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.text,
    },
    matrixProgressBarBg: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.border,
      overflow: 'hidden',
    },
    matrixProgressBarFill: {
      height: '100%',
      backgroundColor: theme.primary,
    },
    inspectTreeBtn: {
      backgroundColor: theme.iconBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    inspectTreeBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.primary,
    },

    // Tab 3 Teachers Grid
    teachersGrid: {
      gap: 12,
    },
    teacherCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    teacherCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 10,
      marginBottom: 10,
    },
    teacherName: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
    },
    teacherEmail: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.subtext,
      marginTop: 2,
    },
    complianceBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
    },
    complianceBadgeHigh: {
      backgroundColor: theme.cardNested,
      borderColor: theme.success,
    },
    complianceBadgeNeeds: {
      backgroundColor: theme.cardNested,
      borderColor: theme.warning,
    },
    complianceBadgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    teacherStatsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    teacherStatCell: {
      flex: 1,
      minWidth: '46%',
      backgroundColor: theme.cardNested,
      borderRadius: 10,
      padding: 8,
      borderWidth: 1,
      borderColor: theme.cardNestedBorder,
    },
    teacherStatLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
    },
    teacherStatValue: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.text,
      marginTop: 2,
    },
    teacherStatValuePurple: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.primary,
      marginTop: 2,
    },
    teacherStatValueSmall: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
      marginTop: 2,
    },
    reminderPingBtn: {
      backgroundColor: theme.iconBackground,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reminderPingBtnSent: {
      backgroundColor: theme.success,
    },
    reminderPingBtnPinging: {
      opacity: 0.7,
    },
    btnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    reminderPingBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
    reminderPingBtnTextSent: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.onPrimary,
    },

    // Modal Generic Overlay
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    dropdownModalCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
    },
    dropdownModalTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 10,
    },
    dropdownOption: {
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownOptionSelected: {
      backgroundColor: theme.iconBackground,
    },
    dropdownOptionText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },

    // Inspect Daily Log Modal
    inspectModalCard: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
    },
    inspectModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 12,
      marginBottom: 12,
    },
    inspectModalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
      marginTop: 4,
    },
    inspectModalSubtitle: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.subtext,
      marginTop: 2,
    },
    modalCloseBtn: {
      padding: 4,
    },
    inspectGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: theme.cardNested,
      borderRadius: 12,
      padding: 10,
      gap: 8,
      marginBottom: 12,
    },
    inspectGridCell: {
      width: '47%',
    },
    inspectGridLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.subtext,
    },
    inspectGridValue: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.text,
      marginTop: 2,
    },
    inspectDetailSection: {
      marginBottom: 12,
    },
    inspectSectionHeader: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.subtext,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    inspectBoxNormal: {
      backgroundColor: theme.cardNested,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inspectBoxText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.text,
      lineHeight: 16,
    },
    inspectBoxPurple: {
      backgroundColor: theme.iconBackground,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inspectBoxTextPurple: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
      lineHeight: 16,
    },
    inspectBoxBlue: {
      backgroundColor: theme.iconBoxBlueBg,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inspectBoxTextBlue: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
      lineHeight: 16,
    },
    inspectModalFooter: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      alignItems: 'flex-end',
    },
    closeInspectionBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
    },
    closeInspectionBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.onPrimary,
    },

    // Inspect Blueprint Modal
    blueprintModalCard: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
    },
    blueprintModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 10,
      marginBottom: 10,
    },
    blueprintTitleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
    },
    blueprintTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    blueprintTeacher: {
      fontSize: 11,
      color: theme.subtext,
      marginTop: 2,
    },
    blueprintHeaderActions: {
      alignItems: 'flex-end',
      gap: 6,
    },
    toggleLockBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    toggleLockBtnLock: {
      backgroundColor: theme.danger,
    },
    toggleLockBtnUnlock: {
      backgroundColor: theme.success,
    },
    toggleLockBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.onPrimary,
    },

    // Blueprint Chapters
    chapterCard: {
      backgroundColor: theme.cardNested,
      borderRadius: 12,
      padding: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.cardNestedBorder,
    },
    chapterCardTop: {
      gap: 4,
    },
    chapterTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    chapterMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    chLockBtn: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
    },
    chLockBtnLocked: {
      backgroundColor: theme.surface,
      borderColor: theme.danger,
    },
    chLockBtnUnlocked: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    chLockBtnText: {
      fontSize: 10,
      fontWeight: '700',
    },
    chUnlockedBadge: {
      backgroundColor: theme.surface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chUnlockedBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.subtext,
    },
    chHoursText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.subtext,
    },
    chStatusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    chStatusBadgeCompleted: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.success,
    },
    chStatusBadgeInProgress: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.warning,
    },
    chStatusBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    topicsTree: {
      marginTop: 8,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: theme.primary,
      gap: 6,
    },
    topicItem: {
      gap: 2,
    },
    topicRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    topicTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
      marginRight: 6,
    },
    topicStatus: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.subtext,
      textTransform: 'capitalize',
    },
    subtopicsTree: {
      paddingLeft: 8,
      gap: 2,
      marginTop: 2,
    },
    subtopicRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    subtopicTitle: {
      fontSize: 10,
      fontWeight: '500',
      color: theme.subtext,
    },
    subtopicStatus: {
      fontSize: 9,
      color: theme.subtext,
      textTransform: 'capitalize',
    },

    // Toast Floating Banner
    toastContainer: {
      position: 'absolute',
      bottom: 24,
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      gap: 8,
    },
    toastWarning: {
      backgroundColor: theme.warning,
    },
    toastSuccess: {
      backgroundColor: theme.success,
    },
    toastError: {
      backgroundColor: theme.danger,
    },
    toastText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
      color: theme.onPrimary,
      lineHeight: 16,
    },
    toastCloseBtn: {
      padding: 4,
    },
  });

export default PrincipalSyllabusLogsScreen;
