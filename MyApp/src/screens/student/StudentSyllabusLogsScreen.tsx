import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { Theme, withAlpha, LIGHT_COLORS } from '../../constants/theme';
import { useAuth } from '../../store/AuthContext';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { StudentHeader } from '../../components/StudentHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import studentService, {
  StudentLmsEnrolledSubject,
  StudentLmsBlueprintTree,
  StudentLmsChapter,
  StudentLmsTopic,
  StudentLmsDailyLog,
} from '../../services/studentService';
import { getApiErrorMessage } from '../../services/apiClient';

type StudentSyllabusLogsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StudentSyllabusLogs'
>;

interface Props {
  navigation: StudentSyllabusLogsNavigationProp;
}

type FilterCategory = 'All' | 'With Homework' | 'Theory' | 'Lab' | 'Revision';

const FILTER_PILLS: FilterCategory[] = [
  'All',
  'With Homework',
  'Theory',
  'Lab',
  'Revision',
];

const formatSubjectTabLabel = (s: StudentLmsEnrolledSubject): string => {
  const code = s.subjectCode || s.code;
  return code ? `${s.subjectName} [${code}]` : s.subjectName;
};

const formatLogDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sept',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateStr);
  }
};

const formatActionStatusLabel = (status?: string | null): string => {
  if (!status) return 'In progress';
  const clean = status.toLowerCase();
  switch (clean) {
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'revision':
      return 'Revision';
    case 'started':
      return 'Started';
    case 'extended':
      return 'Extended';
    case 'theory':
      return 'Theory';
    case 'lab':
      return 'Lab';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  }
};

const formatChapterStatusLabel = (status?: string | null): string => {
  if (!status) return 'NOT STARTED';
  const clean = status.toUpperCase();
  if (clean === 'IN_PROGRESS') return 'IN PROGRESS';
  if (clean === 'COMPLETED') return 'COMPLETED';
  if (clean === 'NOT_STARTED') return 'NOT STARTED';
  return clean.replace('_', ' ');
};

const StudentSyllabusLogsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const isTwoColumn = width >= 768;
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Initial & pull-to-refresh loading states
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingSubjectData, setIsLoadingSubjectData] = useState<boolean>(false);

  // Enrolled subjects & current selection
  const [enrolledSubjects, setEnrolledSubjects] = useState<StudentLmsEnrolledSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<StudentLmsEnrolledSubject | null>(null);

  // Subject syllabus & daily logs
  const [blueprintTree, setBlueprintTree] = useState<StudentLmsBlueprintTree | null>(null);
  const [dailyLogs, setDailyLogs] = useState<StudentLmsDailyLog[]>([]);

  // Expanded chapter IDs
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({});

  // Revised log IDs set
  const [revisedLogIds, setRevisedLogIds] = useState<Set<string>>(new Set());
  const [revisingLogId, setRevisingLogId] = useState<string | null>(null);

  // Classroom logs search & filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('All');

  // Error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ----------------------------------------------------
  // Load Subject Details (Blueprint & Daily Logs)
  // ----------------------------------------------------
  const fetchSubjectData = useCallback(
    async (classSubjectId: string) => {
      setIsLoadingSubjectData(true);
      try {
        const [bpRes, logsRes] = await Promise.allSettled([
          studentService.getLmsBlueprint(classSubjectId),
          studentService.getLmsDailyLogs(classSubjectId),
        ]);

        if (bpRes.status === 'fulfilled') {
          const tree = bpRes.value.data?.data || (bpRes.value.data as any);
          setBlueprintTree(tree || null);

          if (tree?.chapters && tree.chapters.length > 0) {
            const exp: Record<string, boolean> = {};
            tree.chapters.forEach((c: StudentLmsChapter) => {
              exp[c.id] = true;
            });
            setExpandedChapterIds(exp);
          } else {
            setExpandedChapterIds({});
          }
        } else {
          console.error('[StudentLMS] Fetch blueprint error:', bpRes.reason);
          setBlueprintTree(null);
        }

        if (logsRes.status === 'fulfilled') {
          const rawLogs = logsRes.value.data?.data || (logsRes.value.data as any) || [];
          setDailyLogs(Array.isArray(rawLogs) ? rawLogs : []);
        } else {
          console.error('[StudentLMS] Fetch daily logs error:', logsRes.reason);
          setDailyLogs([]);
        }
      } catch (err) {
        console.error('[StudentLMS] Subject data error:', err);
      } finally {
        setIsLoadingSubjectData(false);
      }
    },
    []
  );

  // ----------------------------------------------------
  // Load Enrolled Subjects & Revisions
  // ----------------------------------------------------
  const fetchEnrolledSubjectsAndRevisions = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoadingEnrolled(true);
      }
      setErrorMessage(null);

      try {
        const [subjectsRes, revRes] = await Promise.allSettled([
          studentService.getLmsEnrolledSubjects(),
          studentService.getLmsRevisions(),
        ]);

        if (revRes.status === 'fulfilled') {
          const revArray = revRes.value.data?.data || (revRes.value.data as any) || [];
          if (Array.isArray(revArray)) {
            setRevisedLogIds(new Set(revArray.map((item: any) => (typeof item === 'string' ? item : item.logId || item.id))));
          }
        }

        if (subjectsRes.status === 'fulfilled') {
          const subjects = subjectsRes.value.data?.data || (subjectsRes.value.data as any) || [];
          const validSubjects: StudentLmsEnrolledSubject[] = Array.isArray(subjects) ? subjects : [];
          setEnrolledSubjects(validSubjects);

          if (validSubjects.length > 0) {
            setSelectedSubject((prev) => {
              if (prev && validSubjects.some((s) => s.classSubjectId === prev.classSubjectId)) {
                // Keep selected subject and refresh its data
                fetchSubjectData(prev.classSubjectId);
                return prev;
              }
              const firstSub = validSubjects[0];
              fetchSubjectData(firstSub.classSubjectId);
              return firstSub;
            });
          } else {
            setSelectedSubject(null);
            setBlueprintTree(null);
            setDailyLogs([]);
          }
        } else {
          const msg = getApiErrorMessage(subjectsRes.reason) || 'Failed to load enrolled subjects';
          setErrorMessage(msg);
        }
      } catch (err: any) {
        console.error('[StudentLMS] Enrolled subjects error:', err);
        setErrorMessage(getApiErrorMessage(err) || 'Failed to load enrolled subjects');
      } finally {
        if (isRefresh) {
          setIsRefreshing(false);
        } else {
          setIsLoadingEnrolled(false);
        }
      }
    },
    [fetchSubjectData]
  );

  useEffect(() => {
    fetchEnrolledSubjectsAndRevisions();
  }, [fetchEnrolledSubjectsAndRevisions]);

  const onRefresh = useCallback(() => {
    fetchEnrolledSubjectsAndRevisions(true);
  }, [fetchEnrolledSubjectsAndRevisions]);

  // ----------------------------------------------------
  // Subject Tab Selection
  // ----------------------------------------------------
  const handleSelectSubject = (subj: StudentLmsEnrolledSubject) => {
    if (selectedSubject?.classSubjectId === subj.classSubjectId) return;
    setSelectedSubject(subj);
    fetchSubjectData(subj.classSubjectId);
  };

  // ----------------------------------------------------
  // Toggle Chapter Expansion
  // ----------------------------------------------------
  const toggleChapterExpand = (chapterId: string) => {
    setExpandedChapterIds((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // ----------------------------------------------------
  // Mark as Revised Action
  // ----------------------------------------------------
  const handleToggleRevision = async (logId: string) => {
    if (revisingLogId) return;
    const currentlyRevised = revisedLogIds.has(logId);
    const newRevisedState = !currentlyRevised;

    setRevisingLogId(logId);
    try {
      await studentService.markLogAsRevised(logId, newRevisedState);
      setRevisedLogIds((prev) => {
        const next = new Set(prev);
        if (newRevisedState) {
          next.add(logId);
        } else {
          next.delete(logId);
        }
        return next;
      });
    } catch (err: any) {
      console.error('[StudentLMS] Mark as revised error:', err);
    } finally {
      setRevisingLogId(null);
    }
  };

  // ----------------------------------------------------
  // Filtered Classroom Logs
  // ----------------------------------------------------
  const filteredDailyLogs = useMemo(() => {
    return dailyLogs.filter((log) => {
      // 1. Filter Pills
      if (filterCategory === 'With Homework') {
        if (!log.homeworkAssigned || !log.homeworkAssigned.trim()) return false;
      } else if (filterCategory === 'Theory') {
        const action = (log.actionType || '').toLowerCase();
        const title = (log.coverageTitle || '').toLowerCase();
        const notes = (log.notes || '').toLowerCase();
        if (action !== 'theory' && !title.includes('theory') && !notes.includes('theory')) return false;
      } else if (filterCategory === 'Lab') {
        const action = (log.actionType || '').toLowerCase();
        const title = (log.coverageTitle || '').toLowerCase();
        const notes = (log.notes || '').toLowerCase();
        if (action !== 'lab' && !title.includes('lab') && !notes.includes('lab')) return false;
      } else if (filterCategory === 'Revision') {
        const action = (log.actionType || '').toLowerCase();
        const title = (log.coverageTitle || '').toLowerCase();
        const notes = (log.notes || '').toLowerCase();
        const isRevised = revisedLogIds.has(log.id);
        if (action !== 'revision' && !title.includes('revision') && !notes.includes('revision') && !isRevised) {
          return false;
        }
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (log.coverageTitle || '').toLowerCase().includes(q);
        const matchNotes = (log.notes || '').toLowerCase().includes(q);
        const matchChapter = (log.chapterTitle || '').toLowerCase().includes(q);
        const matchTopic = (log.topicTitle || '').toLowerCase().includes(q);
        const matchHw = (log.homeworkAssigned || '').toLowerCase().includes(q);
        const matchPlan = (log.nextClassPlan || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchChapter && !matchTopic && !matchHw && !matchPlan) {
          return false;
        }
      }

      return true;
    });
  }, [dailyLogs, filterCategory, searchQuery, revisedLogIds]);

  // Derived Values
  const chapters = useMemo(() => blueprintTree?.chapters || [], [blueprintTree]);
  const isTeacherUnassigned = useMemo(() => {
    if (!selectedSubject?.teacherName) return true;
    const name = selectedSubject.teacherName.trim().toUpperCase();
    return name === '' || name === 'UNASSIGNED';
  }, [selectedSubject]);

  const teacherDisplayName = useMemo(() => {
    if (isTeacherUnassigned) return 'UNASSIGNED';
    return (selectedSubject?.teacherName || '').toUpperCase();
  }, [isTeacherUnassigned, selectedSubject]);

  const completionPercent = useMemo(() => {
    return Math.round(selectedSubject?.completionPercent ?? 0);
  }, [selectedSubject]);

  // ----------------------------------------------------
  // Render Left Section: Curriculum Chapters & Topics
  // ----------------------------------------------------
  const renderCurriculumSection = () => {
    return (
      <View style={[styles.sectionContainer, isTwoColumn && styles.columnLeft]}>
        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Curriculum Chapters & Topics</Text>
          <Text style={styles.sectionCountBadge}>{chapters.length} Chapters</Text>
        </View>

        {/* Section Content */}
        {isLoadingSubjectData ? (
          <View style={styles.sectionLoadingBox}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : chapters.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyCardContainer}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={theme.border}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyCardTitle}>No Blueprint Chapters Defined</Text>
            <Text style={styles.emptyCardSubtitle}>
              Your teacher has not published syllabus blueprint chapters for this subject yet.
            </Text>
          </View>
        ) : (
          /* Chapters List */
          <View style={styles.chaptersListContainer}>
            {chapters.map((chapter, chIdx) => {
              const chNumber = chapter.chapterNumber ?? chapter.chapter_number ?? chIdx + 1;
              const isExpanded = !!expandedChapterIds[chapter.id];
              const estHours = parseFloat(String(chapter.estimatedHours ?? chapter.estimated_hours ?? 0)).toFixed(2);
              const estPeriods = chapter.estimatedPeriods ?? chapter.estimated_periods ?? 0;
              const chapterStatus = formatChapterStatusLabel(chapter.status);
              const isChapterCompleted = (chapter.status || '').toLowerCase() === 'completed';

              return (
                <View key={chapter.id} style={styles.chapterCard}>
                  {/* Chapter Header Row */}
                  <TouchableOpacity
                    style={styles.chapterHeaderRow}
                    activeOpacity={0.7}
                    onPress={() => toggleChapterExpand(chapter.id)}
                  >
                    <Ionicons
                      name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                      size={18}
                      color={theme.subtext}
                      style={{ marginRight: 8 }}
                    />
                    <View style={styles.chapterNumberBadge}>
                      <Text style={styles.chapterNumberBadgeText}>Ch {chNumber}</Text>
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={styles.chapterTitleText} numberOfLines={2}>
                        {chapter.title}
                      </Text>
                      <Text style={styles.chapterMetaText}>
                        {estHours} hrs • {estPeriods} periods
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.chapterStatusBadge,
                        isChapterCompleted
                          ? styles.statusBadgeCompleted
                          : styles.statusBadgeInProgress,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chapterStatusBadgeText,
                          isChapterCompleted
                            ? styles.statusBadgeTextCompleted
                            : styles.statusBadgeTextInProgress,
                        ]}
                      >
                        {chapterStatus}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Topics List */}
                  {isExpanded && (
                    <View style={styles.topicsNestedContainer}>
                      {!chapter.topics || chapter.topics.length === 0 ? (
                        <Text style={styles.noTopicsPlaceholder}>
                          No topics defined for this chapter yet.
                        </Text>
                      ) : (
                        chapter.topics.map((topic, tpIdx) => {
                          const tpNumber = topic.topicNumber ?? topic.topic_number ?? tpIdx + 1;
                          const isTopicCompleted = (topic.status || '').toLowerCase() === 'completed';

                          return (
                            <View key={topic.id} style={styles.topicRowWrapper}>
                              <View style={styles.topicRowContent}>
                                <Text style={styles.topicTitleText}>
                                  <Text style={styles.topicNumberPrefix}>{tpNumber} </Text>
                                  {topic.title}
                                </Text>

                                <View style={styles.topicStatusRow}>
                                  {isTopicCompleted ? (
                                    <>
                                      <Text style={styles.topicCompletedText}>Completed</Text>
                                      <Ionicons
                                        name="checkmark-circle"
                                        size={16}
                                        color={theme.success}
                                        style={{ marginLeft: 4 }}
                                      />
                                    </>
                                  ) : (
                                    <Text style={styles.topicPendingText}>
                                      {topic.status ? formatActionStatusLabel(topic.status) : 'Pending'}
                                    </Text>
                                  )}
                                </View>
                              </View>

                              {/* Nested Subtopics */}
                              {topic.subtopics && topic.subtopics.length > 0 && (
                                <View style={styles.subtopicsContainer}>
                                  {topic.subtopics.map((sub, sIdx) => {
                                    const subNum = sub.subtopicNumber ?? sub.subtopic_number ?? sIdx + 1;
                                    return (
                                      <View key={sub.id} style={styles.subtopicRow}>
                                        <Ionicons
                                          name="return-down-forward-outline"
                                          size={13}
                                          color={theme.subtext}
                                          style={{ marginRight: 6 }}
                                        />
                                        <Text style={styles.subtopicTitleText}>
                                          Subtopic {subNum}: {sub.title}
                                        </Text>
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
    );
  };

  // ----------------------------------------------------
  // Render Right Section: Recent Classroom Logs
  // ----------------------------------------------------
  const renderLogsSection = () => {
    return (
      <View style={[styles.sectionContainer, isTwoColumn && styles.columnRight]}>
        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Classroom Logs</Text>
          <Text style={styles.sectionCountBadge}>{filteredDailyLogs.length} Logs</Text>
        </View>

        {/* Search Input Box */}
        <View style={styles.searchBoxContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.placeholder}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchTextInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search lecture notes or topics..."
            placeholderTextColor={theme.placeholder}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pill Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {FILTER_PILLS.map((pill) => {
            const isActive = filterCategory === pill;
            return (
              <TouchableOpacity
                key={pill}
                style={[
                  styles.filterPillButton,
                  isActive && styles.filterPillButtonActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setFilterCategory(pill)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {pill}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Content */}
        {isLoadingSubjectData ? (
          <View style={styles.sectionLoadingBox}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : filteredDailyLogs.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyCardContainer}>
            <Ionicons
              name="time-outline"
              size={48}
              color={theme.border}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyCardTitle}>No Classroom Logs Found</Text>
            <Text style={styles.emptyCardSubtitle}>
              Your teacher has not submitted lecture logs for this subject yet.
            </Text>
          </View>
        ) : (
          /* Logs List */
          <View style={styles.logsListContainer}>
            {filteredDailyLogs.map((log) => {
              const isRevised = revisedLogIds.has(log.id);
              const isRevising = revisingLogId === log.id;
              const dateDisplay = formatLogDate(log.logDate);
              const statusDisplay = formatActionStatusLabel(log.actionType);

              // Chapter -> Topic Path
              let pathDisplay = '';
              if (log.chapterTitle && log.topicTitle) {
                const chPrefix = log.chapterNumber ? `Ch ${log.chapterNumber}: ` : '';
                pathDisplay = `${chPrefix}${log.chapterTitle} → ${log.topicTitle}`;
              } else if (log.chapterTitle) {
                const chPrefix = log.chapterNumber ? `Ch ${log.chapterNumber}: ` : '';
                pathDisplay = `${chPrefix}${log.chapterTitle}`;
              } else if (log.topicTitle) {
                pathDisplay = log.topicTitle;
              }

              return (
                <View key={log.id} style={styles.logCard}>
                  {/* Top Row: Date Badge & Status Badge */}
                  <View style={styles.logTopRow}>
                    <Text style={styles.logDateBadgeText}>{dateDisplay}</Text>
                    <View style={styles.logStatusBadge}>
                      <Text style={styles.logStatusBadgeText}>{statusDisplay}</Text>
                    </View>
                  </View>

                  {/* Coverage Title */}
                  <Text style={styles.logCoverageTitle}>{log.coverageTitle}</Text>

                  {/* Chapter -> Topic Breadcrumb */}
                  {pathDisplay ? (
                    <Text style={styles.logPathText}>{pathDisplay}</Text>
                  ) : null}

                  {/* Body Notes */}
                  {log.notes && log.notes.trim() ? (
                    <Text style={styles.logNotesText}>{log.notes}</Text>
                  ) : null}

                  {/* Homework Box (Only if homework exists) */}
                  {log.homeworkAssigned && log.homeworkAssigned.trim() ? (
                    <View style={styles.homeworkBox}>
                      <Text style={styles.homeworkText}>
                        <Text style={styles.homeworkLabel}>Homework: </Text>
                        {log.homeworkAssigned}
                      </Text>
                    </View>
                  ) : null}

                  {/* Next Class Plan */}
                  {log.nextClassPlan && log.nextClassPlan.trim() ? (
                    <Text style={styles.nextPlanRow}>
                      <Text style={styles.nextPlanLabel}>Next Class Plan: </Text>
                      <Text style={styles.nextPlanText}>{log.nextClassPlan}</Text>
                    </Text>
                  ) : null}

                  {/* Bottom Action: Mark as Revised */}
                  <View style={styles.logBottomRow}>
                    <TouchableOpacity
                      style={[
                        styles.markRevisedButton,
                        isRevised && styles.markRevisedButtonActive,
                      ]}
                      activeOpacity={0.7}
                      disabled={isRevising}
                      onPress={() => handleToggleRevision(log.id)}
                    >
                      {isRevising ? (
                        <ActivityIndicator
                          size="small"
                          color={isRevised ? theme.success : theme.primary}
                          style={{ marginRight: 6 }}
                        />
                      ) : (
                        <Ionicons
                          name={isRevised ? 'checkmark-circle' : 'checkmark-outline'}
                          size={15}
                          color={isRevised ? theme.success : theme.text}
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.markRevisedButtonText,
                          isRevised && styles.markRevisedButtonTextActive,
                        ]}
                      >
                        {isRevised ? 'Revised' : 'Mark as Revised'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />

      {/* Global Header */}
      <StudentHeader
        title="Syllabus & Daily Logs"
        navigation={navigation}
        onMenuPress={() => setIsDrawerOpen(true)}
      />

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
        {/* Header Block with Title & Subtitle */}
        <View style={styles.headerBlock}>
          <View style={styles.headerIconSquare}>
            <Ionicons name="school" size={24} color={theme.onPrimary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Syllabus & Daily Classroom Logs</Text>
            <Text style={styles.headerSubtitle}>
              Track curriculum progression, study materials, homework, and review topics taught by your teachers.
            </Text>
          </View>
        </View>

        {/* Global Loading / Error State */}
        {isLoadingEnrolled ? (
          <View style={styles.globalLoadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={32} color={theme.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchEnrolledSubjectsAndRevisions()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : enrolledSubjects.length === 0 ? (
          <View style={styles.emptyCardContainer}>
            <Ionicons name="book-outline" size={48} color={theme.border} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyCardTitle}>No Enrolled Subjects</Text>
            <Text style={styles.emptyCardSubtitle}>
              You are not enrolled in any subjects for this academic session yet.
            </Text>
          </View>
        ) : (
          <>
            {/* Subject Tab Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subjectTabBar}
            >
              {enrolledSubjects.map((subject) => {
                const isActive = selectedSubject?.classSubjectId === subject.classSubjectId;
                const label = formatSubjectTabLabel(subject);
                return (
                  <TouchableOpacity
                    key={subject.classSubjectId}
                    style={[
                      styles.subjectTabPill,
                      isActive && styles.subjectTabPillActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectSubject(subject)}
                  >
                    <Ionicons
                      name="book-outline"
                      size={15}
                      color={isActive ? theme.onPrimary : theme.subtext}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.subjectTabLabel,
                        isActive && styles.subjectTabLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Subject Progress Card */}
            {selectedSubject && (
              <View style={styles.progressCard}>
                {/* Top Section */}
                <View style={styles.progressTopRow}>
                  {/* Left Column: Teacher & Subject Title & Chapters Completed */}
                  <View style={styles.progressLeftCol}>
                    <Text style={styles.teacherLabel}>
                      TEACHER:{' '}
                      <Text
                        style={
                          isTeacherUnassigned
                            ? styles.teacherUnassignedText
                            : styles.teacherNamedText
                        }
                      >
                        {teacherDisplayName}
                      </Text>
                    </Text>
                    <Text style={styles.subjectProgressTitle}>
                      {selectedSubject.subjectName} Curriculum Progress
                    </Text>
                    <Text style={styles.chaptersCompletedCaption}>
                      {selectedSubject.completedChapters ?? 0} of {selectedSubject.totalChapters ?? 0} Chapters Completed
                    </Text>
                  </View>

                  {/* Right Column: Classroom Pacing & Syllabus Covered */}
                  <View style={styles.progressRightCol}>
                    <View style={styles.pacingBox}>
                      <Text style={styles.pacingLabel}>Classroom Pacing</Text>
                      <Text style={styles.pacingValue}>
                        {selectedSubject.loggedHours ?? 0} hrs / {selectedSubject.targetHours ?? 0} hrs target
                      </Text>
                    </View>

                    <View style={styles.percentBox}>
                      <Text style={styles.percentNumber}>{completionPercent}%</Text>
                      <Text style={styles.percentLabel}>Syllabus Covered</Text>
                    </View>
                  </View>
                </View>

                {/* Bottom Section: Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, Math.max(0, completionPercent))}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Two Column / Stacked Sections Container */}
            <View style={isTwoColumn ? styles.twoColumnWrapper : styles.stackedWrapper}>
              {renderCurriculumSection()}
              {renderLogsSection()}
            </View>
          </>
        )}
      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        role="student"
      />
    </View>
  );
};

// ----------------------------------------------------
// Theme-driven Styles
// ----------------------------------------------------
const getStyles = (theme: Theme, isDarkMode: boolean) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 40,
    },

    // Header Block
    headerBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    },
    headerIconSquare: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTextContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.subtext,
      marginTop: 2,
      lineHeight: 18,
    },

    // Subject Tab Bar
    subjectTabBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 16,
      gap: 10,
    },
    subjectTabPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    subjectTabPillActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    subjectTabLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    subjectTabLabelActive: {
      color: theme.onPrimary,
    },

    // Progress Card
    progressCard: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 18,
      marginBottom: 20,
    },
    progressTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 16,
    },
    progressLeftCol: {
      flex: 1,
      minWidth: 200,
    },
    teacherLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.subtext,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    teacherUnassignedText: {
      color: theme.subtext,
      fontWeight: '700',
    },
    teacherNamedText: {
      color: theme.primary,
      fontWeight: '700',
    },
    subjectProgressTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.2,
      marginBottom: 4,
    },
    chaptersCompletedCaption: {
      fontSize: 13,
      color: theme.subtext,
    },
    progressRightCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    pacingBox: {
      alignItems: 'flex-end',
    },
    pacingLabel: {
      fontSize: 12,
      color: theme.subtext,
      marginBottom: 2,
    },
    pacingValue: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    percentBox: {
      alignItems: 'center',
    },
    percentNumber: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.primary,
      lineHeight: 32,
    },
    percentLabel: {
      fontSize: 11,
      color: theme.subtext,
      marginTop: 2,
    },
    progressBarTrack: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: 4,
      marginTop: 16,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 4,
    },

    // Layout Wrappers
    twoColumnWrapper: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'flex-start',
    },
    stackedWrapper: {
      flexDirection: 'column',
      gap: 20,
    },
    columnLeft: {
      flex: 1.15,
    },
    columnRight: {
      flex: 1,
    },

    // Sections
    sectionContainer: {
      width: '100%',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    sectionCountBadge: {
      fontSize: 13,
      color: theme.subtext,
      fontWeight: '500',
    },
    sectionLoadingBox: {
      padding: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Empty States
    emptyCardContainer: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingVertical: 40,
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyCardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptyCardSubtitle: {
      fontSize: 13,
      color: theme.subtext,
      textAlign: 'center',
      maxWidth: 320,
      lineHeight: 18,
    },

    // Chapters & Topics Tree
    chaptersListContainer: {
      gap: 12,
    },
    chapterCard: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      overflow: 'hidden',
    },
    chapterHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
    },
    chapterNumberBadge: {
      backgroundColor: theme.iconBackground || theme.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    chapterNumberBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
    chapterTitleText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },
    chapterMetaText: {
      fontSize: 12,
      color: theme.subtext,
      marginTop: 2,
    },
    chapterStatusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    statusBadgeInProgress: {
      backgroundColor: withAlpha(theme.warning, 0.2),
    },
    statusBadgeCompleted: {
      backgroundColor: withAlpha(theme.success, 0.2),
    },
    chapterStatusBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    statusBadgeTextInProgress: {
      color: theme.warning,
    },
    statusBadgeTextCompleted: {
      color: theme.success,
    },

    // Nested Topics Container
    topicsNestedContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: theme.cardNested || theme.surface,
    },
    noTopicsPlaceholder: {
      fontSize: 13,
      color: theme.subtext,
      fontStyle: 'italic',
      paddingVertical: 8,
    },
    topicRowWrapper: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    topicRowContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    topicTitleText: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    topicNumberPrefix: {
      fontWeight: '700',
      color: theme.primary,
    },
    topicStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    topicCompletedText: {
      fontSize: 12,
      color: theme.subtext,
      fontWeight: '500',
    },
    topicPendingText: {
      fontSize: 12,
      color: theme.subtext,
    },
    subtopicsContainer: {
      paddingLeft: 16,
      paddingTop: 6,
      gap: 4,
    },
    subtopicRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    subtopicTitleText: {
      fontSize: 12,
      color: theme.subtext,
    },

    // Recent Classroom Logs Section
    searchBoxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 10 : 6,
      marginBottom: 12,
    },
    searchTextInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      padding: 0,
    },
    filterPillsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 14,
    },
    filterPillButton: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    filterPillButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.subtext,
    },
    filterPillTextActive: {
      color: theme.onPrimary,
    },

    // Log Cards
    logsListContainer: {
      gap: 12,
    },
    logCard: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 16,
    },
    logTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    logDateBadgeText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.primary,
    },
    logStatusBadge: {
      backgroundColor: theme.iconBackground || theme.border,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    logStatusBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.primary,
    },
    logCoverageTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginTop: 2,
    },
    logPathText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
      marginTop: 4,
    },
    logNotesText: {
      fontSize: 13,
      color: theme.textSecondary || theme.text,
      lineHeight: 18,
      marginTop: 6,
    },
    homeworkBox: {
      backgroundColor: withAlpha(theme.warning, 0.15),
      borderWidth: 1,
      borderColor: withAlpha(theme.warning, 0.3),
      borderRadius: 8,
      padding: 10,
      marginTop: 10,
    },
    homeworkText: {
      fontSize: 13,
      color: theme.warning,
      lineHeight: 18,
    },
    homeworkLabel: {
      fontWeight: '700',
      color: theme.warning,
    },
    nextPlanRow: {
      fontSize: 13,
      color: theme.subtext,
      marginTop: 8,
      lineHeight: 18,
    },
    nextPlanLabel: {
      fontWeight: '700',
      color: theme.text,
    },
    nextPlanText: {
      color: theme.text,
    },
    logBottomRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: 14,
    },
    markRevisedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    markRevisedButtonActive: {
      backgroundColor: withAlpha(theme.success, 0.2),
      borderColor: withAlpha(theme.success, 0.4),
    },
    markRevisedButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },
    markRevisedButtonTextActive: {
      color: theme.success,
      fontWeight: '700',
    },

    // Global loading & error states
    globalLoadingBox: {
      paddingVertical: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorBox: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 24,
      alignItems: 'center',
      marginVertical: 20,
    },
    errorText: {
      fontSize: 14,
      color: theme.danger,
      textAlign: 'center',
      marginVertical: 10,
    },
    retryButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 6,
    },
    retryButtonText: {
      color: theme.onPrimary,
      fontWeight: '600',
      fontSize: 14,
    },
  });

export default StudentSyllabusLogsScreen;
