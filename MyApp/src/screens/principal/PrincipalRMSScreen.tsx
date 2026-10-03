import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { Theme, withAlpha, LIGHT_COLORS } from '../../constants/theme';

import { useAuth } from '../../store/AuthContext';
import { getCacheBustedUri } from '../../utils/image';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import principalService, { RmsExamItem, RmsExamDetail } from '../../services/principalService';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type PrincipalRMSNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalRMS'
>;

interface Props {
  navigation: PrincipalRMSNavigationProp;
}

type TabType = 'Exam Definitions' | 'Analyze Results' | 'Progress Tracker';

const PrincipalRMSScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme, isDarkMode);

  const [activeTab, setActiveTab] = useState<TabType>('Exam Definitions');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<RmsExamItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);

  // --- View Results Tab state ---
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState<boolean>(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState<boolean>(false);

  // --- Progress Tracker Tab state ---
  const [trackerExamId, setTrackerExamId] = useState<string>('');
  const [isTrackerExamDropdownOpen, setIsTrackerExamDropdownOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [trackerExamDetail, setTrackerExamDetail] = useState<RmsExamDetail | null>(null);
  const [isTrackerDetailLoading, setIsTrackerDetailLoading] = useState<boolean>(false);

  const [selectedExamDetail, setSelectedExamDetail] = useState<RmsExamDetail | null>(null);
  const [isLoadingExamDetail, setIsLoadingExamDetail] = useState<boolean>(false);
  const [examDetailError, setExamDetailError] = useState<string | null>(null);

  const [examResults, setExamResults] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  const fetchExamDetail = useCallback(async (examId: string) => {
    if (!examId) {
      setSelectedExamDetail(null);
      setExamDetailError(null);
      setIsLoadingExamDetail(false);
      return;
    }

    setIsLoadingExamDetail(true);
    setExamDetailError(null);
    setSelectedExamDetail(null);

    try {
      const res = await principalService.getExamDetail(examId);
      if (res && res.data) {
        setSelectedExamDetail(res.data);
      } else {
        setExamDetailError('Unable to load participating classes.');
      }
    } catch (err: any) {
      console.error('[PrincipalRMS] Error loading exam details:', err);
      setExamDetailError(err?.message || 'Failed to load participating classes.');
    } finally {
      setIsLoadingExamDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchExamDetail(selectedExamId);
    } else {
      setSelectedExamDetail(null);
      setExamDetailError(null);
      setIsLoadingExamDetail(false);
    }
  }, [selectedExamId, fetchExamDetail]);

  const fetchResults = useCallback(async () => {
    if (!selectedExamId || !selectedClassId) return;
    setIsLoadingResults(true);
    setResultsError(null);
    try {
      const res = await principalService.getExamResultsAdmin(selectedExamId, selectedClassId);
      const data = res.data?.data || res.data || [];
      setExamResults(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      console.warn('Failed to fetch results:', err);
      setResultsError(err?.message || 'Failed to fetch results');
    } finally {
      setIsLoadingResults(false);
    }
  }, [selectedExamId, selectedClassId]);

  useEffect(() => {
    if (selectedExamId && selectedClassId) {
      fetchResults();
    } else {
      setExamResults([]);
      setResultsError(null);
    }
  }, [selectedExamId, selectedClassId, fetchResults]);

  const loadData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await principalService.getRmsExams();
      let rawList: RmsExamItem[] = [];
      if (res && res.data && Array.isArray(res.data)) {
        rawList = res.data;
      } else if (res && (res as any).exams && Array.isArray((res as any).exams)) {
        rawList = (res as any).exams;
      }
      setExams(rawList);
    } catch (err: any) {
      console.error('[PrincipalRMS] Error loading exams:', err);
      setError(err?.message || 'Unable to load exams. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter exams for Exam Definitions tab search
  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    const q = searchQuery.toLowerCase().trim();
    return exams.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.examType.toLowerCase().includes(q) ||
        e.academicYear.toLowerCase().includes(q)
    );
  }, [exams, searchQuery]);

  // Filter published/active exams for View Results dropdown
  const publishedExams = useMemo(() => {
    return exams.filter((e) => e.status !== 'DRAFT');
  }, [exams]);

  const selectedExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId);
  }, [exams, selectedExamId]);

  const availableClasses = useMemo(() => {
    if (!selectedExamDetail || !selectedExamDetail.classes) return [];
    return selectedExamDetail.classes;
  }, [selectedExamDetail]);

  const selectedClassObj = useMemo(() => {
    return availableClasses.find((c) => c.classId === selectedClassId);
  }, [availableClasses, selectedClassId]);

  const handleDeleteExam = (exam: RmsExamItem) => {
    Alert.alert(
      'Delete Exam Definition',
      `Are you sure you want to delete "${exam.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const res = await principalService.deleteExam(exam.id);
              if (res && res.message && !res.success) {
                Alert.alert('Action Blocked', res.message);
              } else {
                Alert.alert('Success', 'Exam definition deleted successfully.');
                loadData();
              }
            } catch (err: any) {
              console.error('[PrincipalRMS] Delete error:', err);
              const msg = err?.response?.data?.message || err?.message || 'Failed to delete exam.';
              Alert.alert('Cannot Delete Exam', msg);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleGenerateResults = async () => {
    if (!trackerExamId) {
      Alert.alert('Select Exam', 'Please select an exam to generate results for.');
      return;
    }
    Alert.alert(
      'Generate Results',
      'This will compute and generate official results for all classes in the selected exam. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setIsGenerating(true);
              await apiClient.post(ENDPOINTS.PRINCIPAL.RMS_GENERATE, { examId: trackerExamId });
              Alert.alert('Success', 'Results have been generated successfully. You can now publish them.');
            } catch (err: any) {
              const msg = err?.response?.data?.message || err?.message || 'Failed to generate results.';
              Alert.alert('Generation Failed', msg);
            } finally {
              setIsGenerating(false);
            }
          },
        },
      ]
    );
  };

  const handlePublishResults = async () => {
    if (!trackerExamId) {
      Alert.alert('Select Exam', 'Please select an exam to publish results for.');
      return;
    }
    Alert.alert(
      'Publish Results',
      'Publishing will make results visible to students and teachers. This action cannot be easily undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsPublishing(true);
              await apiClient.post(ENDPOINTS.PRINCIPAL.RMS_PUBLISH, { examId: trackerExamId });
              Alert.alert('Published', 'Results are now visible to all students and teachers.');
            } catch (err: any) {
              const msg = err?.response?.data?.message || err?.message || 'Failed to publish results.';
              Alert.alert('Publish Failed', msg);
            } finally {
              setIsPublishing(false);
            }
          },
        },
      ]
    );
  };

  const loadTrackerExamDetail = async (examId: string) => {
    if (!examId) { setTrackerExamDetail(null); return; }
    setIsTrackerDetailLoading(true);
    try {
      const res = await principalService.getExamDetail(examId);
      if (res?.data) setTrackerExamDetail(res.data);
    } catch (err) {
      console.warn('[RMS Tracker] Failed to load exam detail:', err);
    } finally {
      setIsTrackerDetailLoading(false);
    }
  };

  const renderExamRow = ({ item }: { item: RmsExamItem }) => {
    const classCount = item.classes_count ?? item._count?.classes ?? item.classes?.length ?? 0;
    const isDraft = item.status === 'DRAFT';

    return (
      <View style={styles.examCard}>
        <View style={styles.cardHeader}>
          <View style={styles.examTitleRow}>
            <View style={styles.docIconBox}>
              <Ionicons name="document-text" size={18} color={theme.primary} />
            </View>
            <View style={styles.examTitleCol}>
              <Text style={styles.examNameText}>{item.name}</Text>
              <Text style={styles.examYearText}>{item.academicYear}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              isDraft ? styles.statusBadgeDraft : styles.statusBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isDraft ? styles.statusTextDraft : styles.statusTextActive,
              ]}
            >
              {item.status || 'ACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBodyRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>TYPE</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{item.examType}</Text>
            </View>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>SCOPE</Text>
            <View style={styles.scopePill}>
              <Text style={styles.scopePillText}>
                {classCount} {classCount === 1 ? 'Class' : 'Classes'}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('PrincipalReviewExam', { examId: item.id })}
              activeOpacity={0.7}
              accessibilityLabel="View Exam"
            >
              <Ionicons name="eye-outline" size={18} color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('PrincipalEditExam', { examId: item.id })}
              activeOpacity={0.7}
              accessibilityLabel="Edit Exam"
            >
              <Ionicons name="create-outline" size={18} color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDeleteExam(item)}
              activeOpacity={0.7}
              accessibilityLabel="Delete Exam"
            >
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Shared Standard Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setDrawerOpen(true)}
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Result Management</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
          accessibilityLabel="Account settings"
        >
          {authState.user?.photoUrl ? (
            <Image
              source={{ uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt) }}
              style={styles.headerAvatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sub-Header Row in Screen Body */}
      <View style={styles.subHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageSubtext}>
            Manage official exam definitions and their lifecycle.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addExamButton}
          onPress={() => navigation.navigate('PrincipalCreateExam')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color={theme.onPrimary} />
          <Text style={styles.addExamButtonText}>Add New Exam</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Control */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Exam Definitions' && styles.tabButtonActive]}
          onPress={() => setActiveTab('Exam Definitions')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'Exam Definitions' && styles.tabTextActive]}>
            Exam Definitions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Analyze Results' && styles.tabButtonActive]}
          onPress={() => setActiveTab('Analyze Results')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'Analyze Results' && styles.tabTextActive]}>
            Analyze Results
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Progress Tracker' && styles.tabButtonActive]}
          onPress={() => setActiveTab('Progress Tracker')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'Progress Tracker' && styles.tabTextActive]}>
            Tracker
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {activeTab === 'Exam Definitions' ? (
        <View style={styles.tabContent}>
          {/* Search Bar */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exams by name, type, or year..."
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.subtext} />
              </TouchableOpacity>
            )}
          </View>

          {/* List View */}
          {isLoading && !isRefreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.loadingText}>Loading exam definitions...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={24} color={theme.danger} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredExams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={theme.subtext} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching exams found' : 'No Exam Definitions'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try searching with a different term or year.'
                  : 'Click "+ Add New Exam" to create your first examination.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredExams}
              keyExtractor={(item) => item.id}
              renderItem={renderExamRow}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => loadData(true)}
                  tintColor={theme.primary}
                  colors={[theme.primary]}
                />
              }
            />
          )}
        </View>
      ) : (
        /* Tab 2: Analyze Results Selector View */
        activeTab === 'Analyze Results' ? (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.resultsTabContent}>
          <View style={styles.filterCard}>
            {/* Target Examination Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TARGET EXAMINATION</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setIsExamDropdownOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectValueText}>
                  {selectedExam
                    ? `${selectedExam.name} (${selectedExam.academicYear})`
                    : '-- SELECT PUBLISHED EXAM --'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            {/* Target Class Dropdown */}
            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <Text style={styles.fieldLabel}>TARGET CLASS</Text>
              <TouchableOpacity
                style={[
                  styles.selectBox,
                  !selectedExamId && styles.selectBoxDisabled,
                ]}
                onPress={() => {
                  if (selectedExamId) setIsClassDropdownOpen(true);
                }}
                disabled={!selectedExamId}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                  {isLoadingExamDetail && (
                    <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 8 }} />
                  )}
                  <Text
                    style={[
                      styles.selectValueText,
                      !selectedExamId && styles.selectValueDisabled,
                      examDetailError ? { color: theme.danger } : null,
                    ]}
                    numberOfLines={1}
                  >
                    {isLoadingExamDetail
                      ? 'Loading classes...'
                      : examDetailError
                      ? 'Failed to load classes'
                      : selectedClassObj
                      ? selectedClassObj.className || `Class ${selectedClassObj.classId}`
                      : '-- SELECT CLASS --'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={theme.subtext} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Selector scope boundary state */}
          {!selectedExamId || !selectedClassId ? (
            <View style={styles.resultsPlaceholderCard}>
              <Ionicons name="stats-chart-outline" size={48} color={theme.primary} style={{ marginBottom: 12 }} />
              <Text style={styles.placeholderTitle}>Exam Results View</Text>
              <Text style={styles.placeholderSubtext}>
                {!selectedExamId
                  ? 'Select a published examination above to load participating classes.'
                  : 'Now select a participating class to view generated student results.'}
              </Text>
            </View>
          ) : (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsHeaderTitle}>Results for {selectedClassObj?.className}</Text>
              {isLoadingResults ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={{ marginTop: 12, color: theme.subtext }}>Fetching results...</Text>
                </View>
              ) : resultsError ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="alert-circle-outline" size={48} color={theme.danger} />
                  <Text style={{ marginTop: 12, color: theme.danger }}>{resultsError}</Text>
                </View>
              ) : examResults.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="document-text-outline" size={48} color={theme.subtext} />
                  <Text style={{ marginTop: 12, color: theme.subtext }}>No results found for this class.</Text>
                </View>
              ) : (
                examResults.map((result, idx) => (
                  <View key={result.studentId || idx} style={styles.resultRow}>
                    <View style={styles.resultStudentInfo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(result.studentName || 'S').charAt(0)}</Text>
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.resultStudentName}>{result.studentName}</Text>
                        <Text style={styles.resultStudentRoll}>Roll No: {result.rollNumber || 'N/A'}</Text>
                      </View>
                    </View>
                    <View style={styles.resultScoreInfo}>
                      <Text style={styles.resultScoreValue}>
                        {result.percentage !== undefined ? `${Number(result.percentage).toFixed(1)}%` : '-'}
                      </Text>
                      <Text style={[styles.resultGradeValue, { color: result.grade === 'F' ? theme.danger : theme.success }]}>
                        {result.grade || 'N/A'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
        ) : (
        /* Tab 3: Progress Tracker */
        <ScrollView style={styles.tabContent} contentContainerStyle={[styles.resultsTabContent, { paddingBottom: 40 }]}>
          {/* Exam Selector */}
          <View style={styles.filterCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>SELECT EXAM</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setIsTrackerExamDropdownOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectValueText}>
                  {exams.find(e => e.id === trackerExamId)
                    ? `${exams.find(e => e.id === trackerExamId)!.name} (${exams.find(e => e.id === trackerExamId)!.academicYear})`
                    : '-- SELECT EXAM --'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={theme.subtext} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tracker Stats Grid */}
          {trackerExamId && (
            <View style={{ marginTop: 12 }}>
              {isTrackerDetailLoading ? (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={{ marginTop: 12, color: theme.subtext, fontSize: 13 }}>Loading exam details...</Text>
                </View>
              ) : trackerExamDetail ? (
                <>
                  {/* Summary Stats Row */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <View style={[styles.filterCard, { flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 16 }]}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: theme.primary }}>
                        {trackerExamDetail.classes?.length ?? 0}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: theme.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>
                        Classes Mapped
                      </Text>
                    </View>
                    <View style={[styles.filterCard, { flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 16 }]}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: theme.success }}>
                        {trackerExamDetail.classes?.reduce((acc: number, c: any) => acc + (c.subjects?.length ?? 0), 0) ?? 0}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: theme.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>
                        Subject Entries
                      </Text>
                    </View>
                  </View>

                  {/* Per-Class Status Grid */}
                  <Text style={[styles.fieldLabel, { marginBottom: 10 }]}>CLASS PROGRESS</Text>
                  {trackerExamDetail.classes?.map((cls: any, idx: number) => (
                    <View
                      key={cls.classId || idx}
                      style={[styles.filterCard, { flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 14 }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{cls.className || `Class ${cls.classId}`}</Text>
                        <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
                          {cls.subjects?.length ?? 0} subjects configured
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: withAlpha(theme.primary, 0.2),
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>Mapped</Text>
                      </View>
                    </View>
                  ))}

                  {(!trackerExamDetail.classes || trackerExamDetail.classes.length === 0) && (
                    <View style={{ padding: 32, alignItems: 'center' }}>
                      <Ionicons name="school-outline" size={40} color={theme.subtext} />
                      <Text style={{ marginTop: 10, color: theme.subtext, fontSize: 13 }}>No classes linked to this exam.</Text>
                    </View>
                  )}
                </>
              ) : null}
            </View>
          )}

          {!trackerExamId && (
            <View style={styles.resultsPlaceholderCard}>
              <Ionicons name="git-network-outline" size={48} color={theme.primary} style={{ marginBottom: 12 }} />
              <Text style={styles.placeholderTitle}>Global Progress Tracker</Text>
              <Text style={styles.placeholderSubtext}>
                Select an exam above to monitor submission and class-level progress.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          {trackerExamId && (
            <View style={{ gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.addExamButton, { paddingVertical: 14, borderRadius: 12, justifyContent: 'center', backgroundColor: theme.primary }]}
                onPress={handleGenerateResults}
                disabled={isGenerating}
                activeOpacity={0.8}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <Ionicons name="play-circle-outline" size={18} color={theme.onPrimary} />
                )}
                <Text style={[styles.addExamButtonText, { fontSize: 14, marginLeft: 8 }]}>
                  {isGenerating ? 'Generating...' : 'Generate Results'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addExamButton, { paddingVertical: 14, borderRadius: 12, justifyContent: 'center', backgroundColor: theme.success }]}
                onPress={handlePublishResults}
                disabled={isPublishing}
                activeOpacity={0.8}
              >
                {isPublishing ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={18} color={theme.onPrimary} />
                )}
                <Text style={[styles.addExamButtonText, { fontSize: 14, marginLeft: 8 }]}>
                  {isPublishing ? 'Publishing...' : 'Publish Results'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        )
      )}

      {/* Tracker Exam Modal Dropdown */}
      <Modal
        visible={isTrackerExamDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTrackerExamDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsTrackerExamDropdownOpen(false)}
        >
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>Select Exam</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => {
                  setTrackerExamId('');
                  setTrackerExamDetail(null);
                  setIsTrackerExamDropdownOpen(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>-- SELECT EXAM --</Text>
              </TouchableOpacity>
              {exams.map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  style={[
                    styles.dropdownOption,
                    trackerExamId === exam.id && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    setTrackerExamId(exam.id);
                    setIsTrackerExamDropdownOpen(false);
                    loadTrackerExamDetail(exam.id);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>
                    {exam.name} ({exam.academicYear})
                  </Text>
                  {trackerExamId === exam.id && (
                    <Ionicons name="checkmark" size={18} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Target Examination Modal Dropdown */}
      <Modal
        visible={isExamDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsExamDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsExamDropdownOpen(false)}
        >
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>Select Published Exam</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => {
                  setSelectedExamId('');
                  setSelectedClassId('');
                  setIsExamDropdownOpen(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>-- SELECT PUBLISHED EXAM --</Text>
              </TouchableOpacity>
              {publishedExams.map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  style={[
                    styles.dropdownOption,
                    selectedExamId === exam.id && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedExamId(exam.id);
                    setSelectedClassId('');
                    setIsExamDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>
                    {exam.name} ({exam.academicYear})
                  </Text>
                  {selectedExamId === exam.id && (
                    <Ionicons name="checkmark" size={18} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Target Class Modal Dropdown */}
      <Modal
        visible={isClassDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsClassDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsClassDropdownOpen(false)}
        >
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>Select Class</Text>
            {isLoadingExamDetail ? (
              <View style={{ paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={{ marginTop: 8, fontSize: 13, color: theme.subtext }}>
                  Loading participating classes...
                </Text>
              </View>
            ) : examDetailError ? (
              <View style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}>
                <Ionicons name="alert-circle-outline" size={28} color={theme.danger} style={{ marginBottom: 6 }} />
                <Text style={{ fontSize: 13, color: theme.danger, textAlign: 'center', marginBottom: 12 }}>
                  {examDetailError}
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 }}
                  onPress={() => fetchExamDetail(selectedExamId)}
                >
                  <Text style={{ color: theme.onPrimary, fontWeight: '600', fontSize: 13 }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSelectedClassId('');
                    setIsClassDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>-- SELECT CLASS --</Text>
                </TouchableOpacity>
                {availableClasses.length === 0 ? (
                  <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: theme.subtext }}>
                      No participating classes found for this exam.
                    </Text>
                  </View>
                ) : (
                  availableClasses.map((cls) => (
                    <TouchableOpacity
                      key={cls.classId}
                      style={[
                        styles.dropdownOption,
                        selectedClassId === cls.classId && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedClassId(cls.classId);
                        setIsClassDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>
                        {cls.className || `Class ${cls.classId}`}
                      </Text>
                      {selectedClassId === cls.classId && (
                        <Ionicons name="checkmark" size={18} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Navigation Drawer Component */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="principal"
      />
    </View>
  );
};

const getStyles = (theme: Theme, isDarkMode: boolean) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === 'ios' ? 50 : 30,
    },
    appHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerBtn: {
      padding: 4,
    },
    appHeaderTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
      shadowColor: theme.border,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 6,
    },
    avatarText: { color: theme.onPrimary, fontWeight: 'bold', fontSize: 16 },
    headerAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginLeft: 4,
    },
    subHeaderRow: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.background,
    },
    pageSubtext: {
      fontSize: 12,
      color: theme.subtext,
    },
    addExamButton: {
      backgroundColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addExamButtonText: {
      color: theme.onPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 8,
      backgroundColor: theme.background,
      gap: 10,
    },
    tabButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: isDarkMode ? theme.surface : theme.border,
    },
    tabButtonActive: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.subtext,
    },
    tabTextActive: {
      color: theme.onPrimary,
      fontWeight: '700',
    },
    tabContent: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
    },
    centerContainer: {
      paddingVertical: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.subtext,
    },
    errorBox: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: withAlpha(theme.danger, 0.15),
      borderWidth: 1,
      borderColor: theme.danger,
      alignItems: 'center',
      marginVertical: 20,
    },
    errorText: {
      fontSize: 14,
      color: theme.danger,
      textAlign: 'center',
      marginVertical: 10,
    },
    retryBtn: {
      backgroundColor: theme.danger,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryBtnText: {
      color: theme.onPrimary,
      fontWeight: '600',
      fontSize: 13,
    },
    emptyContainer: {
      paddingVertical: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginTop: 12,
    },
    emptySubtext: {
      fontSize: 13,
      color: theme.subtext,
      textAlign: 'center',
      marginTop: 4,
    },
    listContent: {
      paddingBottom: 24,
    },
    examCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 10,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 10,
      marginBottom: 10,
    },
    examTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    docIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: withAlpha(theme.primary, 0.2),
      justifyContent: 'center',
      alignItems: 'center',
    },
    examTitleCol: {
      justifyContent: 'center',
    },
    examNameText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    examYearText: {
      fontSize: 11,
      color: theme.subtext,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 16,
    },
    statusBadgeActive: {
      backgroundColor: withAlpha(theme.success, 0.2),
    },
    statusBadgeDraft: {
      backgroundColor: withAlpha(theme.warning, 0.2),
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    statusTextActive: {
      color: theme.success,
    },
    statusTextDraft: {
      color: theme.warning,
    },
    cardBodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    metaItem: {
      justifyContent: 'center',
    },
    metaLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.subtext,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    typeBadge: {
      backgroundColor: isDarkMode ? theme.surface : theme.border,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    typeBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
    },
    scopePill: {
      backgroundColor: withAlpha(theme.primary, 0.15),
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    scopePillText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.primary,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    actionBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: isDarkMode ? theme.surface : theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultsTabContent: {
      paddingBottom: 40,
    },
    filterCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 14,
    },
    fieldGroup: {
      width: '100%',
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.subtext,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    selectBox: {
      backgroundColor: isDarkMode ? theme.surface : theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectBoxDisabled: {
      opacity: 0.5,
      backgroundColor: isDarkMode ? theme.surface : theme.background,
    },
    selectValueText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    selectValueDisabled: {
      color: theme.subtext,
    },
    resultsPlaceholderCard: {
      backgroundColor: theme.surface,
      marginHorizontal: 16,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    placeholderTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    placeholderSubtext: {
      fontSize: 14,
      color: theme.subtext,
      textAlign: 'center',
      lineHeight: 20,
    },
    resultsContainer: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 32,
    },
    resultsHeaderTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    resultStudentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    resultStudentName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },
    resultStudentRoll: {
      fontSize: 12,
      color: theme.subtext,
      marginTop: 2,
    },
    resultScoreInfo: {
      alignItems: 'flex-end',
    },
    resultScoreValue: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    resultGradeValue: {
      fontSize: 14,
      fontWeight: '700',
      marginTop: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: withAlpha(theme.overlay, 0.5),
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dropdownModalCard: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
    },
    dropdownModalTitle: {
      fontSize: 15,
      fontWeight: '700',
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
      backgroundColor: withAlpha(theme.primary, 0.2),
    },
    dropdownOptionText: {
      fontSize: 13,
      color: theme.text,
    },
  });

export default PrincipalRMSScreen;
