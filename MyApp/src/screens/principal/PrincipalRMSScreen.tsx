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
import { useAuth } from '../../store/AuthContext';
import { getCacheBustedUri } from '../../utils/image';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import principalService, { RmsExamItem } from '../../services/principalService';
import { NavigationDrawer } from '../../components/NavigationDrawer';

type PrincipalRMSNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalRMS'
>;

interface Props {
  navigation: PrincipalRMSNavigationProp;
}

type TabType = 'Exam Definitions' | 'View Results';

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
    if (!selectedExam || !selectedExam.classes) return [];
    return selectedExam.classes;
  }, [selectedExam]);

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

  const renderExamRow = ({ item }: { item: RmsExamItem }) => {
    const classCount = item.classes_count ?? item._count?.classes ?? item.classes?.length ?? 0;
    const isDraft = item.status === 'DRAFT';

    return (
      <View style={styles.examCard}>
        <View style={styles.cardHeader}>
          <View style={styles.examTitleRow}>
            <View style={styles.docIconBox}>
              <Ionicons name="document-text" size={18} color="#7C3AED" />
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
              <Ionicons name="eye-outline" size={18} color="#7C3AED" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('PrincipalEditExam', { examId: item.id })}
              activeOpacity={0.7}
              accessibilityLabel="Edit Exam"
            >
              <Ionicons name="create-outline" size={18} color="#3B82F6" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDeleteExam(item)}
              activeOpacity={0.7}
              accessibilityLabel="Delete Exam"
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
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
          <Ionicons name="add" size={16} color="#FFFFFF" />
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
          style={[styles.tabButton, activeTab === 'View Results' && styles.tabButtonActive]}
          onPress={() => setActiveTab('View Results')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'View Results' && styles.tabTextActive]}>
            View Results
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
              placeholderTextColor={theme.subtext || '#94A3B8'}
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
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>Loading exam definitions...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
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
                  tintColor="#7C3AED"
                  colors={['#7C3AED']}
                />
              }
            />
          )}
        </View>
      ) : (
        /* Tab 2: View Results Selector View */
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
                <Text
                  style={[
                    styles.selectValueText,
                    !selectedExamId && styles.selectValueDisabled,
                  ]}
                >
                  {selectedClassObj
                    ? selectedClassObj.className || `Class ${selectedClassObj.classId}`
                    : '-- SELECT CLASS --'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={theme.subtext} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Selector scope boundary state */}
          <View style={styles.resultsPlaceholderCard}>
            <Ionicons name="stats-chart-outline" size={48} color="#7C3AED" style={{ marginBottom: 12 }} />
            <Text style={styles.placeholderTitle}>Exam Results View</Text>
            <Text style={styles.placeholderSubtext}>
              {!selectedExamId
                ? 'Select a published examination above to load participating classes.'
                : !selectedClassId
                ? 'Now select a participating class to view generated student results.'
                : `Viewing results for ${selectedExam?.name} — ${selectedClassObj?.className || 'Selected Class'}.`}
            </Text>
          </View>
        </ScrollView>
      )}

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
                    <Ionicons name="checkmark" size={18} color="#7C3AED" />
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
              {availableClasses.map((cls) => (
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
                    <Ionicons name="checkmark" size={18} color="#7C3AED" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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

const getStyles = (theme: any, isDarkMode: boolean) =>
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
      backgroundColor: '#9F7AEA',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
      shadowColor: '#1E293B',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 6,
    },
    avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
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
      color: theme.subtext || '#64748B',
    },
    addExamButton: {
      backgroundColor: '#7C3AED',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addExamButtonText: {
      color: '#FFFFFF',
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
      backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    },
    tabButtonActive: {
      backgroundColor: '#7C3AED',
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#94A3B8' : '#475569',
    },
    tabTextActive: {
      color: '#FFFFFF',
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
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
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
      color: theme.subtext || '#64748B',
    },
    errorBox: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDarkMode ? '#991B1B' : '#FCA5A5',
      alignItems: 'center',
      marginVertical: 20,
    },
    errorText: {
      fontSize: 14,
      color: '#EF4444',
      textAlign: 'center',
      marginVertical: 10,
    },
    retryBtn: {
      backgroundColor: '#EF4444',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryBtnText: {
      color: '#FFFFFF',
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
      color: theme.subtext || '#64748B',
      textAlign: 'center',
      marginTop: 4,
    },
    listContent: {
      paddingBottom: 24,
    },
    examCard: {
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 10,
      shadowColor: '#000',
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
      backgroundColor: isDarkMode ? 'rgba(124, 58, 237, 0.2)' : '#F3E8FF',
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
      color: theme.subtext || '#64748B',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 16,
    },
    statusBadgeActive: {
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
    },
    statusBadgeDraft: {
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    statusTextActive: {
      color: '#10B981',
    },
    statusTextDraft: {
      color: '#F59E0B',
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
      color: theme.subtext || '#94A3B8',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    typeBadge: {
      backgroundColor: isDarkMode ? '#334155' : '#F1F5F9',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    typeBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDarkMode ? '#CBD5E1' : '#475569',
    },
    scopePill: {
      backgroundColor: isDarkMode ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    scopePillText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#7C3AED',
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
      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultsTabContent: {
      paddingBottom: 40,
    },
    filterCard: {
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
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
      color: theme.subtext || '#64748B',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    selectBox: {
      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
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
      backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    },
    selectValueText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    selectValueDisabled: {
      color: theme.subtext || '#94A3B8',
    },
    resultsPlaceholderCard: {
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    placeholderSubtext: {
      fontSize: 12,
      color: theme.subtext || '#64748B',
      textAlign: 'center',
      lineHeight: 16,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dropdownModalCard: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
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
      backgroundColor: isDarkMode ? 'rgba(124, 58, 237, 0.2)' : '#F3E8FF',
    },
    dropdownOptionText: {
      fontSize: 13,
      color: theme.text,
    },
  });

export default PrincipalRMSScreen;
