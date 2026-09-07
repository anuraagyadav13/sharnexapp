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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { TeacherHeader } from '../../components/TeacherHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import teacherService, {
  TeacherLmsAssignedSubject,
  TeacherLmsBlueprintTree,
  TeacherLmsChapter,
  TeacherLmsTopic,
  TeacherLmsSubtopic,
  TeacherLmsDailyLog,
  TeacherLmsDashboardSummary,
} from '../../services/teacherService';
import { getApiErrorMessage } from '../../services/apiClient';

type TeacherSyllabusBlueprintNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'TeacherSyllabusBlueprint'
>;

interface Props {
  navigation: TeacherSyllabusBlueprintNavigationProp;
}

type TabType = 'tree' | 'log' | 'logs';

type DeleteTarget = {
  type: 'chapter' | 'topic' | 'subtopic' | 'log';
  id: string;
  name: string;
};

const ACTION_STATUS_OPTIONS = [
  { value: 'started', label: 'Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'extended', label: 'Extended (Topic Continued)' },
  { value: 'completed', label: 'Completed' },
  { value: 'revision', label: 'Revision Session' },
];

const FILTER_ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'extended', label: 'Extended' },
  { value: 'completed', label: 'Completed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'started', label: 'Started' },
  { value: 'revision', label: 'Revision Session' },
];

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

const formatAssignedSubjectLabel = (s: TeacherLmsAssignedSubject): string => {
  const classPart = `class ${s.className}${s.section ? ` ${s.section}` : ''}`;
  const yearPart = `(${s.academicYear || ''})`;
  const codePart = `[${s.subjectCode || ''}]`;
  return `${classPart} ${yearPart} — ${s.subjectName} ${codePart}`;
};

const TeacherSyllabusBlueprintScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { authState } = useAuth();

  // Navigation drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Loading & refresh states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Assigned subjects & active selection
  const [assignedSubjects, setAssignedSubjects] = useState<TeacherLmsAssignedSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<TeacherLmsAssignedSubject | null>(null);
  const [isSubjectPickerVisible, setIsSubjectPickerVisible] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<TabType>('tree');

  // Blueprint tree & Dashboard summary & Daily logs
  const [blueprintTree, setBlueprintTree] = useState<TeacherLmsBlueprintTree | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<TeacherLmsDashboardSummary | null>(null);
  const [dailyLogs, setDailyLogs] = useState<TeacherLmsDailyLog[]>([]);

  // Expanded chapters in Tab 1
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({});

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // ----------------------------------------------------
  // Tab 2: "Log Today's Work" Form State
  // ----------------------------------------------------
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [actionStatus, setActionStatus] = useState<string>('in_progress');
  const [durationSpent, setDurationSpent] = useState<string>('1.00');
  const [periodsCount, setPeriodsCount] = useState<string>('1');
  const [coverageTitle, setCoverageTitle] = useState<string>('');
  const [classroomNotes, setClassroomNotes] = useState<string>('');
  const [homeworkAssigned, setHomeworkAssigned] = useState<string>('');
  const [nextClassPlan, setNextClassPlan] = useState<string>('');
  const [isSavingLog, setIsSavingLog] = useState<boolean>(false);

  const [isChapterPickerOpen, setIsChapterPickerOpen] = useState(false);
  const [isTopicPickerOpen, setIsTopicPickerOpen] = useState(false);
  const [isActionStatusPickerOpen, setIsActionStatusPickerOpen] = useState(false);

  // ----------------------------------------------------
  // Tab 3: "Lecture Activity Logs" Filters
  // ----------------------------------------------------
  const [searchLogsQuery, setSearchLogsQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [isFilterPickerOpen, setIsFilterPickerOpen] = useState(false);

  // ----------------------------------------------------
  // Modals: Add / Edit Chapter
  // ----------------------------------------------------
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<TeacherLmsChapter | null>(null);
  const [chapterTitleInput, setChapterTitleInput] = useState('');
  const [chapterDescInput, setChapterDescInput] = useState('');
  const [chapterHoursInput, setChapterHoursInput] = useState('6.0');
  const [chapterPeriodsInput, setChapterPeriodsInput] = useState('4');
  const [isSavingChapter, setIsSavingChapter] = useState(false);

  // Modals: Add / Edit Topic
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicParentChapter, setTopicParentChapter] = useState<TeacherLmsChapter | null>(null);
  const [editingTopic, setEditingTopic] = useState<TeacherLmsTopic | null>(null);
  const [topicTitleInput, setTopicTitleInput] = useState('');
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  // Modals: Add Subtopic
  const [isSubtopicModalOpen, setIsSubtopicModalOpen] = useState(false);
  const [subtopicParentTopic, setSubtopicParentTopic] = useState<TeacherLmsTopic | null>(null);
  const [subtopicTitleInput, setSubtopicTitleInput] = useState('');
  const [isSavingSubtopic, setIsSavingSubtopic] = useState(false);

  // Modals: Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ----------------------------------------------------
  // Fetch initial assigned subjects
  // ----------------------------------------------------
  const fetchAssignedSubjects = useCallback(async () => {
    try {
      const res = await teacherService.getLmsAssignedSubjects();
      const subjects = res.data?.data || (res.data as any) || [];
      setAssignedSubjects(subjects);
      if (subjects.length > 0) {
        setSelectedSubject((prev) => {
          if (prev && subjects.some((s: TeacherLmsAssignedSubject) => s.classSubjectId === prev.classSubjectId)) {
            return prev;
          }
          return subjects[0];
        });
      }
    } catch (err: any) {
      console.error('[TeacherLMS] Fetch assigned subjects error:', err);
      showToast(getApiErrorMessage(err) || 'Failed to load assigned subjects', 'error');
    }
  }, [showToast]);

  // ----------------------------------------------------
  // Fetch details for selected subject
  // ----------------------------------------------------
  const fetchSubjectData = useCallback(
    async (classSubjectId: string, isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const [blueprintRes, summaryRes, logsRes] = await Promise.allSettled([
          teacherService.getLmsBlueprint(classSubjectId),
          teacherService.getLmsDashboardSummary(classSubjectId),
          teacherService.getLmsDailyLogs({ classSubjectId, limit: 100 }),
        ]);

        if (blueprintRes.status === 'fulfilled') {
          const tree = blueprintRes.value.data?.data || (blueprintRes.value.data as any);
          setBlueprintTree(tree);
          if (tree?.chapters) {
            const exp: Record<string, boolean> = {};
            tree.chapters.forEach((c: TeacherLmsChapter) => {
              exp[c.id] = true;
            });
            setExpandedChapterIds(exp);
          }
        } else {
          console.error('[TeacherLMS] Fetch blueprint error:', blueprintRes.reason);
        }

        if (summaryRes.status === 'fulfilled') {
          const summary = summaryRes.value.data?.data || (summaryRes.value.data as any);
          setDashboardSummary(summary);
        } else {
          console.error('[TeacherLMS] Fetch summary error:', summaryRes.reason);
        }

        if (logsRes.status === 'fulfilled') {
          const logs = logsRes.value.data?.data || (logsRes.value.data as any) || [];
          setDailyLogs(logs);
        } else {
          console.error('[TeacherLMS] Fetch logs error:', logsRes.reason);
        }
      } catch (err: any) {
        console.error('[TeacherLMS] Subject data load error:', err);
        showToast(getApiErrorMessage(err) || 'Failed to load subject curriculum data', 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchAssignedSubjects();
  }, [fetchAssignedSubjects]);

  useEffect(() => {
    if (selectedSubject?.classSubjectId) {
      fetchSubjectData(selectedSubject.classSubjectId);
      // Reset log form fields
      setSelectedChapterId('');
      setSelectedTopicId('');
      setCoverageTitle('');
      setClassroomNotes('');
      setHomeworkAssigned('');
      setNextClassPlan('');
    }
  }, [selectedSubject, fetchSubjectData]);

  const onRefresh = useCallback(() => {
    if (selectedSubject?.classSubjectId) {
      fetchSubjectData(selectedSubject.classSubjectId, true);
    } else {
      fetchAssignedSubjects();
    }
  }, [selectedSubject, fetchSubjectData, fetchAssignedSubjects]);

  // ----------------------------------------------------
  // Stat Card Metrics Calculation
  // ----------------------------------------------------
  const stats = useMemo(() => {
    const chapters = blueprintTree?.chapters || [];
    const totalChapters = dashboardSummary?.totalChapters ?? chapters.length;
    const completedChapters =
      dashboardSummary?.completedChapters ?? chapters.filter((c) => c.status === 'completed').length;
    const completionPercent =
      dashboardSummary?.completionPercent ??
      (totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0);

    const targetHours = chapters.reduce((sum, c) => sum + (Number(c.estimatedHours ?? c.estimated_hours) || 0), 0);
    const loggedHours = Number(dashboardSummary?.loggedHours) || 0;

    const targetPeriods =
      dashboardSummary?.targetPeriods ??
      chapters.reduce((sum, c) => sum + (Number(c.estimatedPeriods ?? c.estimated_periods) || 0), 0);
    const loggedPeriods = Number(dashboardSummary?.loggedPeriods) || 0;

    let pacingStatus = dashboardSummary?.pacingStatus || 'On Track';
    if (!dashboardSummary && targetPeriods > 0) {
      const diff = loggedPeriods - targetPeriods;
      if (diff > 0 && completionPercent < 100) {
        pacingStatus = `Overrun (+${diff} Periods)`;
      } else if (completionPercent === 100) {
        pacingStatus = 'Completed';
      }
    }

    return {
      totalChapters,
      completedChapters,
      completionPercent,
      targetHours,
      loggedHours,
      targetPeriods,
      loggedPeriods,
      pacingStatus,
    };
  }, [blueprintTree, dashboardSummary]);

  // ----------------------------------------------------
  // Tab 1 Actions: Expand / Collapse Chapters
  // ----------------------------------------------------
  const toggleChapterExpand = (chapterId: string) => {
    setExpandedChapterIds((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // ----------------------------------------------------
  // Chapter Modal Handlers
  // ----------------------------------------------------
  const handleOpenAddChapterModal = () => {
    setEditingChapter(null);
    setChapterTitleInput('');
    setChapterDescInput('');
    setChapterHoursInput('6.0');
    setChapterPeriodsInput('4');
    setIsChapterModalOpen(true);
  };

  const handleOpenEditChapterModal = (ch: TeacherLmsChapter) => {
    setEditingChapter(ch);
    setChapterTitleInput(ch.title);
    setChapterDescInput(ch.description || '');
    setChapterHoursInput(String(ch.estimatedHours ?? ch.estimated_hours ?? '6.0'));
    setChapterPeriodsInput(String(ch.estimatedPeriods ?? ch.estimated_periods ?? '4'));
    setIsChapterModalOpen(true);
  };

  const handleSaveChapter = async () => {
    if (!selectedSubject?.classSubjectId) {
      showToast('Please select an assigned subject first.', 'warning');
      return;
    }
    if (!chapterTitleInput.trim()) {
      showToast('Chapter title is required.', 'warning');
      return;
    }
    setIsSavingChapter(true);
    try {
      if (editingChapter) {
        await teacherService.updateLmsChapter({
          id: editingChapter.id,
          title: chapterTitleInput.trim(),
          description: chapterDescInput.trim() || undefined,
          estimatedHours: parseFloat(chapterHoursInput) || 6.0,
          estimatedPeriods: parseInt(chapterPeriodsInput, 10) || 4,
        });
        showToast('Chapter updated successfully.', 'success');
      } else {
        await teacherService.addLmsChapter({
          classSubjectId: selectedSubject.classSubjectId,
          title: chapterTitleInput.trim(),
          description: chapterDescInput.trim() || undefined,
          estimatedHours: parseFloat(chapterHoursInput) || 6.0,
          estimatedPeriods: parseInt(chapterPeriodsInput, 10) || 4,
        });
        showToast('Chapter created successfully.', 'success');
      }
      setIsChapterModalOpen(false);
      fetchSubjectData(selectedSubject.classSubjectId);
    } catch (err: any) {
      console.error('[TeacherLMS] Save chapter error:', err);
      showToast(getApiErrorMessage(err) || 'Failed to save chapter', 'error');
    } finally {
      setIsSavingChapter(false);
    }
  };

  // ----------------------------------------------------
  // Topic Modal Handlers
  // ----------------------------------------------------
  const handleOpenAddTopicModal = (parentChapter: TeacherLmsChapter) => {
    setTopicParentChapter(parentChapter);
    setEditingTopic(null);
    setTopicTitleInput('');
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopicModal = (parentChapter: TeacherLmsChapter, topic: TeacherLmsTopic) => {
    setTopicParentChapter(parentChapter);
    setEditingTopic(topic);
    setTopicTitleInput(topic.title);
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = async () => {
    if (!topicParentChapter) return;
    if (!topicTitleInput.trim()) {
      showToast('Topic title is required.', 'warning');
      return;
    }
    setIsSavingTopic(true);
    try {
      if (editingTopic) {
        await teacherService.updateLmsTopic({
          id: editingTopic.id,
          title: topicTitleInput.trim(),
        });
        showToast('Topic updated successfully.', 'success');
      } else {
        const nextNumber = (topicParentChapter.topics?.length || 0) + 1;
        await teacherService.addLmsTopic({
          chapterId: topicParentChapter.id,
          topicNumber: nextNumber,
          title: topicTitleInput.trim(),
        });
        showToast('Topic added successfully.', 'success');
      }
      setIsTopicModalOpen(false);
      if (selectedSubject?.classSubjectId) {
        fetchSubjectData(selectedSubject.classSubjectId);
      }
    } catch (err: any) {
      console.error('[TeacherLMS] Save topic error:', err);
      showToast(getApiErrorMessage(err) || 'Failed to save topic', 'error');
    } finally {
      setIsSavingTopic(false);
    }
  };

  // ----------------------------------------------------
  // Subtopic Modal Handlers
  // ----------------------------------------------------
  const handleOpenAddSubtopicModal = (topic: TeacherLmsTopic) => {
    setSubtopicParentTopic(topic);
    setSubtopicTitleInput('');
    setIsSubtopicModalOpen(true);
  };

  const handleSaveSubtopic = async () => {
    if (!subtopicParentTopic) return;
    if (!subtopicTitleInput.trim()) {
      showToast('Subtopic title is required.', 'warning');
      return;
    }
    setIsSavingSubtopic(true);
    try {
      const nextNumber = (subtopicParentTopic.subtopics?.length || 0) + 1;
      await teacherService.addLmsSubtopic({
        topicId: subtopicParentTopic.id,
        subtopicNumber: nextNumber,
        title: subtopicTitleInput.trim(),
      });
      showToast('Subtopic added successfully.', 'success');
      setIsSubtopicModalOpen(false);
      if (selectedSubject?.classSubjectId) {
        fetchSubjectData(selectedSubject.classSubjectId);
      }
    } catch (err: any) {
      console.error('[TeacherLMS] Save subtopic error:', err);
      showToast(getApiErrorMessage(err) || 'Failed to add subtopic', 'error');
    } finally {
      setIsSavingSubtopic(false);
    }
  };

  // ----------------------------------------------------
  // Delete Modal & Actions
  // ----------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'chapter') {
        await teacherService.deleteLmsChapter(deleteTarget.id);
        showToast('Chapter deleted successfully.', 'success');
      } else if (deleteTarget.type === 'topic') {
        await teacherService.deleteLmsTopic(deleteTarget.id);
        showToast('Topic deleted successfully.', 'success');
      } else if (deleteTarget.type === 'subtopic') {
        await teacherService.deleteLmsSubtopic(deleteTarget.id);
        showToast('Subtopic deleted successfully.', 'success');
      } else if (deleteTarget.type === 'log') {
        await teacherService.deleteLmsDailyLog(deleteTarget.id);
        showToast('Daily work log deleted successfully.', 'success');
      }
      setDeleteTarget(null);
      if (selectedSubject?.classSubjectId) {
        fetchSubjectData(selectedSubject.classSubjectId);
      }
    } catch (err: any) {
      console.error('[TeacherLMS] Delete error:', err);
      showToast(getApiErrorMessage(err) || 'Failed to delete item', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ----------------------------------------------------
  // Tab 2: Save Daily Work Log
  // ----------------------------------------------------
  const handleSaveDailyLog = async () => {
    if (!selectedSubject?.classSubjectId) {
      showToast('Please select an assigned subject.', 'warning');
      return;
    }
    if (!coverageTitle.trim()) {
      showToast('Coverage Title / Today’s Summary is required.', 'warning');
      return;
    }

    setIsSavingLog(true);
    try {
      const todayIso = new Date().toISOString().split('T')[0];
      await teacherService.createLmsDailyLog({
        classSubjectId: selectedSubject.classSubjectId,
        logDate: todayIso,
        chapterId: selectedChapterId || undefined,
        topicId: selectedTopicId || undefined,
        actionType: actionStatus,
        coverageTitle: coverageTitle.trim(),
        hoursSpent: parseFloat(durationSpent) || 1.0,
        periodsCount: parseInt(periodsCount, 10) || 1,
        notes: classroomNotes.trim() || undefined,
        homeworkAssigned: homeworkAssigned.trim() || undefined,
        nextClassPlan: nextClassPlan.trim() || undefined,
      });

      showToast('✓ Daily work log saved successfully!', 'success');
      setCoverageTitle('');
      setClassroomNotes('');
      setHomeworkAssigned('');
      setNextClassPlan('');
      setDurationSpent('1.00');
      setPeriodsCount('1');

      fetchSubjectData(selectedSubject.classSubjectId);
    } catch (err: any) {
      console.error('[TeacherLMS] Save daily log error:', err);
      showToast(getApiErrorMessage(err) || 'Failed to save daily work log', 'error');
    } finally {
      setIsSavingLog(false);
    }
  };

  // ----------------------------------------------------
  // Topics available for selected chapter in Tab 2
  // ----------------------------------------------------
  const availableTopicsForForm = useMemo(() => {
    if (!selectedChapterId || !blueprintTree?.chapters) return [];
    const ch = blueprintTree.chapters.find((c) => c.id === selectedChapterId);
    return ch?.topics || [];
  }, [selectedChapterId, blueprintTree]);

  const selectedChapterLabel = useMemo(() => {
    if (!selectedChapterId || !blueprintTree?.chapters) return 'Select Target Chapter';
    const ch = blueprintTree.chapters.find((c) => c.id === selectedChapterId);
    return ch ? `Ch ${ch.chapterNumber ?? ch.chapter_number ?? ''}: ${ch.title}` : 'Select Target Chapter';
  }, [selectedChapterId, blueprintTree]);

  const selectedTopicLabel = useMemo(() => {
    if (!selectedTopicId) return '-- General / Entire Chapter --';
    const tp = availableTopicsForForm.find((t) => t.id === selectedTopicId);
    return tp ? `Topic ${tp.topicNumber ?? tp.topic_number ?? ''}: ${tp.title}` : '-- General / Entire Chapter --';
  }, [selectedTopicId, availableTopicsForForm]);

  const selectedActionStatusLabel = useMemo(() => {
    const opt = ACTION_STATUS_OPTIONS.find((o) => o.value === actionStatus);
    return opt?.label || 'In Progress';
  }, [actionStatus]);

  // ----------------------------------------------------
  // Tab 3: Filtered Logs List
  // ----------------------------------------------------
  const filteredDailyLogs = useMemo(() => {
    return dailyLogs.filter((log) => {
      if (filterAction !== 'all') {
        const logAction = (log.actionType || '').toLowerCase();
        if (logAction !== filterAction.toLowerCase()) return false;
      }

      if (searchLogsQuery.trim()) {
        const query = searchLogsQuery.toLowerCase().trim();
        const titleMatch = (log.coverageTitle || '').toLowerCase().includes(query);
        const chapterMatch = (log.chapterTitle || '').toLowerCase().includes(query);
        const topicMatch = (log.topicTitle || '').toLowerCase().includes(query);
        const notesMatch = (log.notes || '').toLowerCase().includes(query);
        if (!titleMatch && !chapterMatch && !topicMatch && !notesMatch) {
          return false;
        }
      }

      return true;
    });
  }, [dailyLogs, filterAction, searchLogsQuery]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      {/* Standard Teacher Header */}
      <TeacherHeader
        title="Syllabus Blueprint"
        navigation={navigation}
        onMenuPress={() => setIsDrawerOpen(true)}
      />

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        role="teacher"
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <View
          style={[
            styles.toastBanner,
            toastType === 'success' && styles.toastSuccess,
            toastType === 'error' && styles.toastError,
            toastType === 'warning' && styles.toastWarning,
          ]}
        >
          <Ionicons
            name={
              toastType === 'success'
                ? 'checkmark-circle'
                : toastType === 'error'
                ? 'alert-circle'
                : 'warning'
            }
            size={18}
            color={theme.white}
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
      >
        {/* Header Title Banner + ASSIGNED SUBJECT Dropdown */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Syllabus Blueprint & Daily Work Logger</Text>
            <Text style={styles.bannerSubtitle}>
              Manage curriculum chapters, time targets, and record daily lecture progress.
            </Text>
          </View>

          {/* Top-Right Assigned Subject Dropdown */}
          <View style={styles.subjectDropdownCol}>
            <Text style={styles.subjectDropdownLabel}>ASSIGNED SUBJECT:</Text>
            <TouchableOpacity
              style={styles.subjectDropdownButton}
              activeOpacity={0.7}
              onPress={() => setIsSubjectPickerVisible(true)}
            >
              <Text style={styles.subjectDropdownText} numberOfLines={1}>
                {selectedSubject
                  ? formatAssignedSubjectLabel(selectedSubject)
                  : 'Select Assigned Subject'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.text} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4 Stat Cards */}
        <View style={styles.statCardsGrid}>
          {/* Card 1: Syllabus Completion */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statCardLabel}>SYLLABUS COMPLETION</Text>
              <View style={styles.statCardValueRow}>
                <Text style={styles.statCardMainValue}>{stats.completionPercent}%</Text>
                <Text style={styles.statCardCaption}>
                  ({stats.completedChapters}/{stats.totalChapters} Chapters)
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, Math.max(0, stats.completionPercent))}%` },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Card 2: Hours Logged vs Target */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statCardLabel}>HOURS LOGGED VS TARGET</Text>
              <View style={styles.statCardValueRow}>
                <Text style={styles.statCardMainValue}>{stats.loggedHours.toFixed(2)} hrs</Text>
                <Text style={styles.statCardTargetCaption}>
                  / {stats.targetHours.toFixed(1)} hrs Target
                </Text>
              </View>
              <Text style={styles.statCardSubtext}>Total time recorded in classroom</Text>
            </View>
          </View>

          {/* Card 3: Periods Logged */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statCardLabel}>PERIODS LOGGED</Text>
              <View style={styles.statCardValueRow}>
                <Text style={styles.statCardMainValue}>{stats.loggedPeriods} Periods</Text>
                <Text style={styles.statCardTargetCaption}>/ {stats.targetPeriods} Target</Text>
              </View>
              <Text style={styles.statCardSubtext}>Standard timetable lecture count</Text>
            </View>
          </View>

          {/* Card 4: Curriculum Pacing */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statCardLabel}>CURRICULUM PACING</Text>
              <View style={styles.statCardValueRow}>
                <View
                  style={[
                    styles.pacingPill,
                    stats.pacingStatus.includes('Overrun')
                      ? styles.pacingPillOverrun
                      : styles.pacingPillOnTrack,
                  ]}
                >
                  <Text
                    style={[
                      styles.pacingPillText,
                      stats.pacingStatus.includes('Overrun')
                        ? styles.pacingPillTextOverrun
                        : styles.pacingPillTextOnTrack,
                    ]}
                  >
                    {stats.pacingStatus}
                  </Text>
                </View>
              </View>
              <Text style={styles.statCardSubtext}>Calculated from target vs actual ratio</Text>
            </View>
          </View>
        </View>

        {/* 3 Tabs Navigation Bar */}
        <View style={styles.tabsNavContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tree' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tree')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="git-network-outline"
              size={18}
              color={activeTab === 'tree' ? theme.primary : theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'tree' && styles.tabButtonTextActive]}
            >
              Syllabus Blueprint Tree
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'log' && styles.tabButtonActive]}
            onPress={() => setActiveTab('log')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={activeTab === 'log' ? theme.primary : theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'log' && styles.tabButtonTextActive]}
            >
              Log Today's Work
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'logs' && styles.tabButtonActive]}
            onPress={() => setActiveTab('logs')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={activeTab === 'logs' ? theme.primary : theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'logs' && styles.tabButtonTextActive]}
            >
              Lecture Activity Logs ({dailyLogs.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ==================================================== */}
        {/* TAB 1: Syllabus Blueprint Tree                       */}
        {/* ==================================================== */}
        {activeTab === 'tree' && (
          <View style={styles.sectionCard}>
            <View style={styles.treeHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Curriculum Chapters & Topics Breakdown</Text>
                <Text style={styles.sectionSubtitle}>
                  Define standard chapters, subtopics, and time targets for{' '}
                  {selectedSubject?.subjectName || 'Subject'}.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.primaryAddButton}
                activeOpacity={0.8}
                onPress={handleOpenAddChapterModal}
              >
                <Ionicons name="add" size={18} color={theme.white} />
                <Text style={styles.primaryAddButtonText}>+ Add Chapter</Text>
              </TouchableOpacity>
            </View>

            {isLoading && !isRefreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.loadingText}>Loading curriculum blueprint...</Text>
              </View>
            ) : !blueprintTree?.chapters || blueprintTree.chapters.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={44} color={theme.textSecondary} />
                <Text style={styles.emptyTitle}>No Chapters Added Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Click "+ Add Chapter" above to start building the curriculum roadmap.
                </Text>
              </View>
            ) : (
              <View style={styles.treeListContainer}>
                {blueprintTree.chapters.map((chapter, chIdx) => {
                  const isExpanded = expandedChapterIds[chapter.id] ?? true;
                  const chNumber = chapter.chapterNumber ?? chapter.chapter_number ?? chIdx + 1;
                  const estHours = Number(chapter.estimatedHours ?? chapter.estimated_hours ?? 0);
                  const estPeriods = Number(chapter.estimatedPeriods ?? chapter.estimated_periods ?? 0);

                  return (
                    <View key={chapter.id} style={styles.chapterCardWrapper}>
                      {/* Chapter Row Header */}
                      <View style={styles.chapterRowHeader}>
                        <View style={styles.chapterBadge}>
                          <Text style={styles.chapterBadgeText}>Ch {chNumber}</Text>
                        </View>

                        <View style={styles.chapterInfoCol}>
                          <Text style={styles.chapterTitleText} numberOfLines={1}>
                            {chapter.title}
                          </Text>
                          <Text style={styles.chapterMetaText}>
                            {estHours.toFixed(2)} hrs / {estPeriods} periods
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View
                          style={[
                            styles.statusPill,
                            chapter.status === 'completed'
                              ? styles.statusPillCompleted
                              : styles.statusPillInProgress,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              chapter.status === 'completed'
                                ? styles.statusPillTextCompleted
                                : styles.statusPillTextInProgress,
                            ]}
                          >
                            {(chapter.status || 'PENDING').toUpperCase().replace('_', ' ')}
                          </Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.chapterActionsRow}>
                          <TouchableOpacity
                            style={styles.iconActionButton}
                            onPress={() => handleOpenEditChapterModal(chapter)}
                          >
                            <Ionicons name="pencil" size={16} color={theme.textSecondary} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.addTopicPillButton}
                            onPress={() => handleOpenAddTopicModal(chapter)}
                          >
                            <Text style={styles.addTopicPillText}>+ Add Topic</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.iconActionButton}
                            onPress={() =>
                              setDeleteTarget({
                                type: 'chapter',
                                id: chapter.id,
                                name: chapter.title,
                              })
                            }
                          >
                            <Ionicons name="trash-outline" size={16} color={theme.danger} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.iconActionButton}
                            onPress={() => toggleChapterExpand(chapter.id)}
                          >
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={18}
                              color={theme.textSecondary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Nested Topics */}
                      {isExpanded && (
                        <View style={styles.topicsNestedContainer}>
                          {!chapter.topics || chapter.topics.length === 0 ? (
                            <Text style={styles.noTopicsPlaceholder}>
                              No topics added to this chapter yet. Tap "+ Add Topic" to add one.
                            </Text>
                          ) : (
                            chapter.topics.map((topic, tpIdx) => {
                              const tpNumber = topic.topicNumber ?? topic.topic_number ?? tpIdx + 1;
                              return (
                                <View key={topic.id} style={styles.topicRowWrapper}>
                                  <View style={styles.topicRowContent}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.topicTitleText}>
                                        <Text style={{ fontWeight: '700' }}>Topic {tpNumber}:</Text>{' '}
                                        {topic.title}
                                      </Text>
                                      <Text style={styles.topicStatusText}>
                                        {topic.status || 'pending'}
                                      </Text>
                                    </View>

                                    {/* Topic Actions */}
                                    <View style={styles.topicActionsRow}>
                                      <TouchableOpacity
                                        style={styles.iconActionButton}
                                        onPress={() => handleOpenEditTopicModal(chapter, topic)}
                                      >
                                        <Ionicons name="pencil" size={14} color={theme.textSecondary} />
                                      </TouchableOpacity>

                                      <TouchableOpacity
                                        style={styles.addSubtopicPillButton}
                                        onPress={() => handleOpenAddSubtopicModal(topic)}
                                      >
                                        <Text style={styles.addSubtopicPillText}>+ Subtopic</Text>
                                      </TouchableOpacity>

                                      <TouchableOpacity
                                        style={styles.iconActionButton}
                                        onPress={() =>
                                          setDeleteTarget({
                                            type: 'topic',
                                            id: topic.id,
                                            name: topic.title,
                                          })
                                        }
                                      >
                                        <Ionicons name="trash-outline" size={14} color={theme.danger} />
                                      </TouchableOpacity>
                                    </View>
                                  </View>

                                  {/* Subtopics */}
                                  {topic.subtopics && topic.subtopics.length > 0 && (
                                    <View style={styles.subtopicsContainer}>
                                      {topic.subtopics.map((sub, sIdx) => {
                                        const subNum = sub.subtopicNumber ?? sub.subtopic_number ?? sIdx + 1;
                                        return (
                                          <View key={sub.id} style={styles.subtopicRow}>
                                            <Ionicons
                                              name="return-down-forward-outline"
                                              size={14}
                                              color={theme.textSecondary}
                                              style={{ marginRight: 6 }}
                                            />
                                            <Text style={styles.subtopicTitleText}>
                                              Subtopic {subNum}: {sub.title}
                                            </Text>
                                            <TouchableOpacity
                                              style={[styles.iconActionButton, { marginLeft: 'auto' }]}
                                              onPress={() =>
                                                setDeleteTarget({
                                                  type: 'subtopic',
                                                  id: sub.id,
                                                  name: sub.title,
                                                })
                                              }
                                            >
                                              <Ionicons name="trash-outline" size={12} color={theme.danger} />
                                            </TouchableOpacity>
                                          </View>
                                        );
                                      })}
                                    </View>
                                  )}
                                </View>
                              );
                            })
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ==================================================== */}
        {/* TAB 2: Log Today's Work                             */}
        {/* ==================================================== */}
        {activeTab === 'log' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Record Daily Classroom Progress</Text>
            <Text style={styles.sectionSubtitle}>
              Log today's lecture coverage, time spent, homework assigned, and next class plan.
            </Text>

            <View style={styles.formContentContainer}>
              {/* Target Chapter Dropdown */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Target Chapter *</Text>
                <TouchableOpacity
                  style={styles.dropdownPickerButton}
                  onPress={() => setIsChapterPickerOpen(true)}
                >
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>
                    {selectedChapterLabel}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Topic Covered Dropdown */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Topic Covered</Text>
                <TouchableOpacity
                  style={styles.dropdownPickerButton}
                  onPress={() => setIsTopicPickerOpen(true)}
                >
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>
                    {selectedTopicLabel}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Action Status Dropdown */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Action Status *</Text>
                <TouchableOpacity
                  style={styles.dropdownPickerButton}
                  onPress={() => setIsActionStatusPickerOpen(true)}
                >
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>
                    {selectedActionStatusLabel}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Duration Spent & Periods Count (2 cols) */}
              <View style={styles.formRowTwoCols}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Duration Spent (Hours)</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={durationSpent}
                    onChangeText={setDurationSpent}
                    placeholder="1.00"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>Periods Count</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={periodsCount}
                    onChangeText={setPeriodsCount}
                    placeholder="1"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Coverage Title / Today's Summary */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Coverage Title / Today's Summary *</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={coverageTitle}
                  onChangeText={setCoverageTitle}
                  placeholder="e.g. Solved NCERT Exercise 4.2 Q1-Q10"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              {/* Classroom Notes / Discussion Details */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Classroom Notes / Discussion Details</Text>
                <TextInput
                  style={[styles.formTextInput, styles.formTextArea]}
                  value={classroomNotes}
                  onChangeText={setClassroomNotes}
                  placeholder="Details of concepts taught, student engagement, doubts clarified..."
                  placeholderTextColor={theme.placeholder}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Homework Assigned */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Homework Assigned</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={homeworkAssigned}
                  onChangeText={setHomeworkAssigned}
                  placeholder="e.g. Practice questions 11-20 from workbook"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              {/* Next Class Preparation Plan */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Next Class Preparation Plan</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={nextClassPlan}
                  onChangeText={setNextClassPlan}
                  placeholder="e.g. Introduce quadratic formula and proof"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              {/* Primary Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSavingLog && styles.submitButtonDisabled]}
                onPress={handleSaveDailyLog}
                disabled={isSavingLog}
                activeOpacity={0.8}
              >
                {isSavingLog ? (
                  <ActivityIndicator size="small" color={theme.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={theme.white} style={{ marginRight: 6 }} />
                    <Text style={styles.submitButtonText}>✓ Save Daily Work Log</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ==================================================== */}
        {/* TAB 3: Lecture Activity Logs (N)                     */}
        {/* ==================================================== */}
        {activeTab === 'logs' && (
          <View style={styles.sectionCard}>
            {/* Search and Action Filter Bar */}
            <View style={styles.filterSection}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={theme.placeholder} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  value={searchLogsQuery}
                  onChangeText={setSearchLogsQuery}
                  placeholder="Search logs by topic, title, or notes..."
                  placeholderTextColor={theme.placeholder}
                />
                {searchLogsQuery ? (
                  <TouchableOpacity onPress={() => setSearchLogsQuery('')}>
                    <Ionicons name="close-circle" size={18} color={theme.placeholder} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Filter Action Dropdown */}
              <View style={styles.filterActionWrapper}>
                <Text style={styles.filterActionLabel}>Filter Action:</Text>
                <TouchableOpacity
                  style={styles.filterActionButton}
                  onPress={() => setIsFilterPickerOpen(true)}
                >
                  <Text style={styles.filterActionText}>
                    {FILTER_ACTION_OPTIONS.find((o) => o.value === filterAction)?.label || 'All Actions'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.text} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Logs List */}
            {filteredDailyLogs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={44} color={theme.textSecondary} />
                <Text style={styles.emptyTitle}>No Activity Logs Found</Text>
                <Text style={styles.emptySubtitle}>
                  {dailyLogs.length === 0
                    ? 'No daily classroom lectures logged yet. Switch to "Log Today\'s Work" to add one.'
                    : 'No logs match your filter criteria.'}
                </Text>
              </View>
            ) : (
              <View style={styles.logsListContainer}>
                {filteredDailyLogs.map((log) => {
                  const hours = Number(log.hoursSpent) || 1.0;
                  const periods = Number(log.periodsCount) || 1;

                  return (
                    <View key={log.id} style={styles.logCard}>
                      {/* Top row: Date pill + Delete icon */}
                      <View style={styles.logCardTopRow}>
                        <View style={styles.logDatePill}>
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color={theme.primary}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.logDatePillText}>
                            {formatDisplayDate(log.logDate || log.createdAt)}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.iconActionButton}
                          onPress={() =>
                            setDeleteTarget({
                              type: 'log',
                              id: log.id,
                              name: log.coverageTitle,
                            })
                          }
                        >
                          <Ionicons name="trash-outline" size={18} color={theme.danger} />
                        </TouchableOpacity>
                      </View>

                      {/* Coverage Title */}
                      <Text style={styles.logCoverageTitle}>{log.coverageTitle}</Text>

                      {/* Subtitle: Chapter — Topic */}
                      <Text style={styles.logChapterTopicSubtitle}>
                        {log.chapterTitle || 'Chapter'} — {log.topicTitle || 'General / Entire Chapter'}
                      </Text>

                      {/* Hours / Periods badge + Status pill */}
                      <View style={styles.logMetricsRow}>
                        <View style={styles.logMetricsBadge}>
                          <Text style={styles.logMetricsBadgeText}>
                            {hours.toFixed(2)} hrs / {periods} Period(s)
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusPill,
                            log.actionType === 'completed'
                              ? styles.statusPillCompleted
                              : styles.statusPillInProgress,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              log.actionType === 'completed'
                                ? styles.statusPillTextCompleted
                                : styles.statusPillTextInProgress,
                            ]}
                          >
                            {(log.actionType || 'IN PROGRESS').toUpperCase().replace('_', ' ')}
                          </Text>
                        </View>
                      </View>

                      {/* Notes Body */}
                      {log.notes ? (
                        <Text style={styles.logNotesBody}>{log.notes}</Text>
                      ) : null}

                      {/* Homework Assigned Box */}
                      {log.homeworkAssigned ? (
                        <View style={styles.logHomeworkBox}>
                          <Text style={styles.logBoxLabel}>Homework Assigned:</Text>
                          <Text style={styles.logBoxContent}>{log.homeworkAssigned}</Text>
                        </View>
                      ) : null}

                      {/* Next Class Plan Box */}
                      {log.nextClassPlan ? (
                        <View style={styles.logNextPlanBox}>
                          <Text style={styles.logBoxLabel}>Next Class Plan:</Text>
                          <Text style={styles.logBoxContent}>{log.nextClassPlan}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ==================================================== */}
      {/* MODAL 1: Select Assigned Subject                     */}
      {/* ==================================================== */}
      <Modal
        visible={isSubjectPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSubjectPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Assigned Subject</Text>
              <TouchableOpacity onPress={() => setIsSubjectPickerVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {assignedSubjects.map((sub) => {
                const isSelected = selectedSubject?.classSubjectId === sub.classSubjectId;
                return (
                  <TouchableOpacity
                    key={sub.classSubjectId}
                    style={[styles.pickerItemRow, isSelected && styles.pickerItemRowActive]}
                    onPress={() => {
                      setSelectedSubject(sub);
                      setIsSubjectPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}
                      numberOfLines={2}
                    >
                      {formatAssignedSubjectLabel(sub)}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 2: Add / Edit Blueprint Chapter                */}
      {/* ==================================================== */}
      <Modal
        visible={isChapterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsChapterModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.formModalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingChapter ? 'Edit Blueprint Chapter' : 'Add Blueprint Chapter'}
              </Text>
              <TouchableOpacity onPress={() => setIsChapterModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Chapter Title *</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={chapterTitleInput}
                  onChangeText={setChapterTitleInput}
                  placeholder="e.g. Differentiation & Applications"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description / Summary</Text>
                <TextInput
                  style={[styles.formTextInput, styles.formTextArea]}
                  value={chapterDescInput}
                  onChangeText={setChapterDescInput}
                  placeholder="Key concepts covered, learning goals..."
                  placeholderTextColor={theme.placeholder}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formRowTwoCols}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Target Hours *</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={chapterHoursInput}
                    onChangeText={setChapterHoursInput}
                    placeholder="6.0"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>Target Periods *</Text>
                  <TextInput
                    style={styles.formTextInput}
                    value={chapterPeriodsInput}
                    onChangeText={setChapterPeriodsInput}
                    placeholder="4"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsChapterModalOpen(false)}
                disabled={isSavingChapter}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSaveChapter}
                disabled={isSavingChapter}
              >
                {isSavingChapter ? (
                  <ActivityIndicator size="small" color={theme.white} />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>
                    {editingChapter ? 'Save Changes' : 'Save Chapter'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 3: Add / Edit Topic to Chapter                 */}
      {/* ==================================================== */}
      <Modal
        visible={isTopicModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTopicModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.formModalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingTopic ? 'Edit Topic' : 'Add Topic to Chapter'}
              </Text>
              <TouchableOpacity onPress={() => setIsTopicModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {topicParentChapter && (
              <Text style={styles.modalSubheading}>
                Adding to: Ch {topicParentChapter.chapterNumber ?? topicParentChapter.chapter_number ?? ''}{' '}
                {topicParentChapter.title}
              </Text>
            )}

            <View style={[styles.fieldGroup, { marginTop: 12 }]}>
              <Text style={styles.fieldLabel}>Topic Title *</Text>
              <TextInput
                style={styles.formTextInput}
                value={topicTitleInput}
                onChangeText={setTopicTitleInput}
                placeholder="e.g. Properties of Definite Integrals"
                placeholderTextColor={theme.placeholder}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsTopicModalOpen(false)}
                disabled={isSavingTopic}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSaveTopic}
                disabled={isSavingTopic}
              >
                {isSavingTopic ? (
                  <ActivityIndicator size="small" color={theme.white} />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>
                    {editingTopic ? 'Save Changes' : 'Save Topic'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 4: Add Subtopic to Topic                       */}
      {/* ==================================================== */}
      <Modal
        visible={isSubtopicModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSubtopicModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.formModalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add Subtopic</Text>
              <TouchableOpacity onPress={() => setIsSubtopicModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {subtopicParentTopic && (
              <Text style={styles.modalSubheading}>
                Adding to Topic: {subtopicParentTopic.title}
              </Text>
            )}

            <View style={[styles.fieldGroup, { marginTop: 12 }]}>
              <Text style={styles.fieldLabel}>Subtopic Title *</Text>
              <TextInput
                style={styles.formTextInput}
                value={subtopicTitleInput}
                onChangeText={setSubtopicTitleInput}
                placeholder="e.g. Fundamental Theorem Analysis"
                placeholderTextColor={theme.placeholder}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsSubtopicModalOpen(false)}
                disabled={isSavingSubtopic}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSaveSubtopic}
                disabled={isSavingSubtopic}
              >
                {isSavingSubtopic ? (
                  <ActivityIndicator size="small" color={theme.white} />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Save Subtopic</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 5: Delete Confirmation Modal                   */}
      {/* ==================================================== */}
      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.deleteConfirmModalBox}>
            {/* Red Warning Circle Icon */}
            <View style={styles.deleteWarningIconBox}>
              <Ionicons name="alert" size={30} color={theme.danger} />
            </View>

            <Text style={styles.deleteConfirmTitle}>
              Delete{' '}
              {deleteTarget?.type === 'chapter'
                ? 'Chapter'
                : deleteTarget?.type === 'topic'
                ? 'Topic'
                : deleteTarget?.type === 'subtopic'
                ? 'Subtopic'
                : 'Log'}
            </Text>

            <Text style={styles.deleteWarningSubtext}>Action cannot be undone</Text>

            <Text style={styles.deleteConfirmBody}>
              Are you sure you want to delete {deleteTarget?.type || 'item'}{' '}
              <Text style={{ fontWeight: '700' }}>"{deleteTarget?.name}"</Text>?
            </Text>

            <View style={styles.deleteButtonsRow}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteDestructiveButton}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={theme.white} />
                ) : (
                  <Text style={styles.deleteDestructiveButtonText}>Yes, Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 6: Target Chapter Selector (Tab 2)             */}
      {/* ==================================================== */}
      <Modal
        visible={isChapterPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsChapterPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Target Chapter</Text>
              <TouchableOpacity onPress={() => setIsChapterPickerOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {(!blueprintTree?.chapters || blueprintTree.chapters.length === 0) ? (
                <Text style={styles.noPickerItemsText}>No chapters available for this subject.</Text>
              ) : (
                blueprintTree.chapters.map((ch, idx) => {
                  const isSelected = selectedChapterId === ch.id;
                  const num = ch.chapterNumber ?? ch.chapter_number ?? idx + 1;
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      style={[styles.pickerItemRow, isSelected && styles.pickerItemRowActive]}
                      onPress={() => {
                        setSelectedChapterId(ch.id);
                        setSelectedTopicId('');
                        setIsChapterPickerOpen(false);
                      }}
                    >
                      <Text
                        style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}
                        numberOfLines={2}
                      >
                        Ch {num}: {ch.title}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 7: Topic Covered Selector (Tab 2)              */}
      {/* ==================================================== */}
      <Modal
        visible={isTopicPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTopicPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Topic Covered</Text>
              <TouchableOpacity onPress={() => setIsTopicPickerOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {/* General / Entire Chapter Option */}
              <TouchableOpacity
                style={[styles.pickerItemRow, selectedTopicId === '' && styles.pickerItemRowActive]}
                onPress={() => {
                  setSelectedTopicId('');
                  setIsTopicPickerOpen(false);
                }}
              >
                <Text
                  style={[styles.pickerItemText, selectedTopicId === '' && styles.pickerItemTextActive]}
                >
                  -- General / Entire Chapter --
                </Text>
                {selectedTopicId === '' && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>

              {availableTopicsForForm.map((tp, idx) => {
                const isSelected = selectedTopicId === tp.id;
                const num = tp.topicNumber ?? tp.topic_number ?? idx + 1;
                return (
                  <TouchableOpacity
                    key={tp.id}
                    style={[styles.pickerItemRow, isSelected && styles.pickerItemRowActive]}
                    onPress={() => {
                      setSelectedTopicId(tp.id);
                      setIsTopicPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}
                      numberOfLines={2}
                    >
                      Topic {num}: {tp.title}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 8: Action Status Selector (Tab 2)              */}
      {/* ==================================================== */}
      <Modal
        visible={isActionStatusPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsActionStatusPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Action Status</Text>
              <TouchableOpacity onPress={() => setIsActionStatusPickerOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {ACTION_STATUS_OPTIONS.map((opt) => {
                const isSelected = actionStatus === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pickerItemRow, isSelected && styles.pickerItemRowActive]}
                    onPress={() => {
                      setActionStatus(opt.value);
                      setIsActionStatusPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 9: Filter Action Selector (Tab 3)              */}
      {/* ==================================================== */}
      <Modal
        visible={isFilterPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Filter by Action</Text>
              <TouchableOpacity onPress={() => setIsFilterPickerOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {FILTER_ACTION_OPTIONS.map((opt) => {
                const isSelected = filterAction === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pickerItemRow, isSelected && styles.pickerItemRowActive]}
                    onPress={() => {
                      setFilterAction(opt.value);
                      setIsFilterPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 32,
    },

    // Toast feedback banner
    toastBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 8,
      zIndex: 99,
    },
    toastSuccess: {
      backgroundColor: theme.success,
    },
    toastError: {
      backgroundColor: theme.danger,
    },
    toastWarning: {
      backgroundColor: theme.warning,
    },
    toastText: {
      color: theme.white,
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 8,
      flex: 1,
    },

    // Banner Header + Assigned Subject Selector
    bannerContainer: {
      marginBottom: 16,
    },
    bannerTextCol: {
      marginBottom: 10,
    },
    bannerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 4,
    },
    bannerSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    subjectDropdownCol: {
      alignSelf: 'flex-start',
      width: '100%',
    },
    subjectDropdownLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    subjectDropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      width: '100%',
    },
    subjectDropdownText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },

    // Stat Cards
    statCardsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
      marginBottom: 16,
    },
    statCard: {
      width: '50%',
      paddingHorizontal: 6,
      marginBottom: 12,
    },
    statCardInner: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      minHeight: 108,
      justifyContent: 'space-between',
    },
    statCardLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    statCardValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flexWrap: 'wrap',
      marginVertical: 2,
    },
    statCardMainValue: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      marginRight: 4,
    },
    statCardCaption: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    statCardTargetCaption: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    statCardSubtext: {
      fontSize: 10,
      color: theme.textSecondary,
      marginTop: 2,
    },
    progressBarTrack: {
      height: 6,
      backgroundColor: theme.iconBackground || theme.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: 6,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 3,
    },
    pacingPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    pacingPillOnTrack: {
      backgroundColor: theme.iconBackground,
      borderColor: theme.success,
      borderWidth: 1,
    },
    pacingPillOverrun: {
      backgroundColor: theme.iconBackground,
      borderColor: theme.warning,
      borderWidth: 1,
    },
    pacingPillText: {
      fontSize: 12,
      fontWeight: '700',
    },
    pacingPillTextOnTrack: {
      color: theme.success,
    },
    pacingPillTextOverrun: {
      color: theme.warning,
    },

    // Tabs Navigation
    tabsNavContainer: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 10,
      padding: 4,
      marginBottom: 16,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 8,
    },
    tabButtonActive: {
      backgroundColor: theme.iconBackground || theme.border,
    },
    tabButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    tabButtonTextActive: {
      color: theme.primary,
      fontWeight: '700',
    },

    // Section Card (wraps tab content)
    sectionCard: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 16,
    },

    // Tab 1: Tree Header & Items
    treeHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    primaryAddButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginLeft: 12,
    },
    primaryAddButtonText: {
      color: theme.white,
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
    },
    treeListContainer: {
      marginTop: 4,
    },
    chapterCardWrapper: {
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 10,
      backgroundColor: theme.surface,
      marginBottom: 12,
      overflow: 'hidden',
    },
    chapterRowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.cardNested || theme.surface,
    },
    chapterBadge: {
      backgroundColor: theme.iconBackground,
      borderColor: theme.primary,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 10,
    },
    chapterBadgeText: {
      color: theme.primary,
      fontSize: 11,
      fontWeight: '700',
    },
    chapterInfoCol: {
      flex: 1,
      marginRight: 8,
    },
    chapterTitleText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    chapterMetaText: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginRight: 8,
    },
    statusPillInProgress: {
      backgroundColor: theme.iconBackground,
      borderColor: theme.primary,
      borderWidth: 1,
    },
    statusPillCompleted: {
      backgroundColor: theme.iconBackground,
      borderColor: theme.success,
      borderWidth: 1,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: '700',
    },
    statusPillTextInProgress: {
      color: theme.primary,
    },
    statusPillTextCompleted: {
      color: theme.success,
    },
    chapterActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconActionButton: {
      padding: 6,
      marginLeft: 2,
    },
    addTopicPillButton: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 4,
    },
    addTopicPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.primary,
    },
    topicsNestedContainer: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderTopColor: theme.border,
      borderTopWidth: 1,
      backgroundColor: theme.surface,
    },
    noTopicsPlaceholder: {
      fontSize: 12,
      fontStyle: 'italic',
      color: theme.textSecondary,
      paddingVertical: 8,
    },
    topicRowWrapper: {
      paddingVertical: 8,
      borderBottomColor: theme.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    topicRowContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    topicTitleText: {
      fontSize: 13,
      color: theme.text,
    },
    topicStatusText: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
    topicActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addSubtopicPillButton: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
      marginLeft: 4,
    },
    addSubtopicPillText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.primary,
    },
    subtopicsContainer: {
      marginTop: 6,
      paddingLeft: 16,
      borderLeftColor: theme.border,
      borderLeftWidth: 2,
      marginLeft: 4,
    },
    subtopicRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 3,
    },
    subtopicTitleText: {
      fontSize: 12,
      color: theme.textSecondary,
      flex: 1,
    },

    // Tab 2: Form Styles
    formContentContainer: {
      marginTop: 16,
    },
    fieldGroup: {
      marginBottom: 14,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
    },
    dropdownPickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.cardNested || theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    dropdownPickerText: {
      fontSize: 13,
      color: theme.text,
      fontWeight: '500',
      flex: 1,
    },
    formRowTwoCols: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    formTextInput: {
      backgroundColor: theme.cardNested || theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: theme.text,
    },
    formTextArea: {
      minHeight: 88,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingVertical: 13,
      borderRadius: 8,
      marginTop: 8,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: theme.white,
      fontSize: 14,
      fontWeight: '700',
    },

    // Tab 3: Lecture Activity Logs
    filterSection: {
      marginBottom: 16,
      marginTop: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardNested || theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
      padding: 0,
    },
    filterActionWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterActionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
      marginRight: 8,
    },
    filterActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    filterActionText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },
    logsListContainer: {
      marginTop: 4,
    },
    logCard: {
      backgroundColor: theme.cardNested || theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12,
    },
    logCardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    logDatePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.iconBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    logDatePillText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.primary,
    },
    logCoverageTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 2,
    },
    logChapterTopicSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
      marginBottom: 8,
    },
    logMetricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    logMetricsBadge: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginRight: 8,
    },
    logMetricsBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    logNotesBody: {
      fontSize: 12,
      color: theme.text,
      lineHeight: 18,
      marginBottom: 10,
    },
    logHomeworkBox: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderLeftColor: theme.primary,
      borderLeftWidth: 3,
      borderRadius: 6,
      padding: 8,
      marginBottom: 8,
    },
    logNextPlanBox: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderLeftColor: theme.success,
      borderLeftWidth: 3,
      borderRadius: 6,
      padding: 8,
    },
    logBoxLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
      marginBottom: 2,
    },
    logBoxContent: {
      fontSize: 12,
      color: theme.text,
    },

    // Empty & Loading states
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      paddingHorizontal: 16,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginTop: 10,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
    },
    loadingText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 8,
    },

    // Modal Common Styles
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    pickerModalBox: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      width: '100%',
      maxWidth: 420,
      borderColor: theme.border,
      borderWidth: 1,
    },
    formModalBox: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 18,
      width: '100%',
      maxWidth: 440,
      borderColor: theme.border,
      borderWidth: 1,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    modalSubheading: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    pickerItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderBottomColor: theme.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pickerItemRowActive: {
      backgroundColor: theme.iconBackground,
      borderRadius: 6,
    },
    pickerItemText: {
      fontSize: 13,
      color: theme.text,
      flex: 1,
      marginRight: 8,
    },
    pickerItemTextActive: {
      color: theme.primary,
      fontWeight: '700',
    },
    noPickerItemsText: {
      fontSize: 12,
      color: theme.textSecondary,
      paddingVertical: 16,
      textAlign: 'center',
    },
    modalButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 16,
    },
    modalCancelButton: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 6,
      borderColor: theme.border,
      borderWidth: 1,
      marginRight: 10,
    },
    modalCancelButtonText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    modalConfirmButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 6,
      minWidth: 100,
      alignItems: 'center',
    },
    modalConfirmButtonText: {
      color: theme.white,
      fontSize: 13,
      fontWeight: '700',
    },

    // Delete Confirmation Modal Box
    deleteConfirmModalBox: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 20,
      width: '100%',
      maxWidth: 380,
      alignItems: 'center',
      borderColor: theme.border,
      borderWidth: 1,
    },
    deleteWarningIconBox: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: theme.iconBackground,
      borderColor: theme.danger,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    deleteConfirmTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 2,
    },
    deleteWarningSubtext: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.danger,
      marginBottom: 12,
    },
    deleteConfirmBody: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 20,
    },
    deleteButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    deleteCancelButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderColor: theme.border,
      borderWidth: 1,
      alignItems: 'center',
      marginRight: 8,
    },
    deleteCancelButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    deleteDestructiveButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: theme.danger,
      alignItems: 'center',
      marginLeft: 8,
    },
    deleteDestructiveButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.white,
    },
  });

export default TeacherSyllabusBlueprintScreen;
