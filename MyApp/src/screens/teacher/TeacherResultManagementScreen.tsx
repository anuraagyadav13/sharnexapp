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
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { useTheme } from '../../store/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherResultManagement'>;

const TeacherResultManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState<'entry' | 'review'>('entry');
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      setError(null);
      const [workRes, reviewRes] = await Promise.all([
        apiClient.get(ENDPOINTS.TEACHER.RMS_WORK_ITEMS).catch(() => ({ data: { items: [] } })),
        apiClient.get(ENDPOINTS.TEACHER.RMS_REVIEW_ITEMS).catch(() => ({ data: { items: [] } })),
      ]);

      const workData = workRes.data?.items || workRes.data?.data?.items || (Array.isArray(workRes.data) ? workRes.data : []);
      const reviewData = reviewRes.data?.items || reviewRes.data?.data?.items || (Array.isArray(reviewRes.data) ? reviewRes.data : []);

      setWorkItems(workData);
      setReviewItems(reviewData);
    } catch (err: any) {
      console.error('Failed to fetch RMS data:', err);
      setError('Failed to load result management data. Please try again.');
    } finally {
      if (!isRefresh) setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchData(false);
  }, []); // Ignore deps to only fetch on mount for useEffect

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

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return '#10B981';
      case 'SUBMITTED': return '#3B82F6';
      case 'REJECTED': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const renderWorkItems = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Enter Marks</Text>
          <Text style={styles.sectionSubtitle}>Submit subject marks for assigned examinations</Text>
        </View>
      </View>

      {filteredWorkItems.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color={theme.border} />
          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            {searchQuery || statusFilter !== 'ALL'
              ? 'No examinations matching your filter criteria.'
              : 'No assigned examinations found for marks entry.'}
          </Text>
          {(searchQuery || statusFilter !== 'ALL') && (
            <TouchableOpacity
              style={[styles.retryBtn, { marginTop: 16 }]}
              onPress={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
            >
              <Text style={styles.retryBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredWorkItems.map((item, index) => (
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
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status || 'DRAFT'}</Text>
                  </View>
                </View>

                <Text style={[styles.cardSubject, { color: theme.text }]} numberOfLines={1}>{item.subjectName || 'Subject'}</Text>
                <Text style={[styles.cardClass, { color: theme.subtext }]} numberOfLines={1}>{item.className} • {item.examName}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</Text>
                  <TouchableOpacity style={styles.enterMarksBtn}>
                    <Text style={[styles.enterMarksText, { color: theme.primary }]}>ENTER MARKS</Text>
                    <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );

  const renderReviewItems = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Review Marks</Text>
          <Text style={styles.sectionSubtitle}>Review and approve marks submitted by subject teachers</Text>
        </View>
      </View>

      {filteredReviewItems.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color={theme.border} />
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
                    <View style={[styles.subjectCircle, { backgroundColor: '#3B82F615' }]}>
                      <Text style={[styles.subjectInitial, { color: '#3B82F6' }]}>{item.className?.charAt(0) || 'C'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#10B98115' }]}>
                      <Text style={[styles.statusText, { color: '#10B981' }]}>{approvedSubjects}/{totalSubjects} OK</Text>
                    </View>
                  </View>

                  <Text style={[styles.cardSubject, { color: theme.text }]} numberOfLines={1}>{item.className || 'Class'}</Text>
                  <Text style={[styles.cardClass, { color: theme.subtext }]} numberOfLines={1}>{item.examName || 'Examination'}</Text>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>READY FOR REVIEW</Text>
                      <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                      <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: '#10B981' }]} />
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.reviewDoneText, { color: '#10B981' }]}>REVIEW SUBJECTS →</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Standardized Global Header */}
      <View style={styles.globalHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="menu" size={28} color="#111827" />
        </ScaleButton>

        <Text style={styles.headerTitle} numberOfLines={1}>Result Management</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AccountSettings')} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { }} style={styles.iconBtn}>
            <Ionicons name="moon-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: '#A855F7' }]}>
            <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'entry' && styles.activeTab]}
          onPress={() => setActiveTab('entry')}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={activeTab === 'entry' ? '#7C3AED' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'entry' && styles.activeTabText]}>Marks Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'review' && styles.activeTab]}
          onPress={() => setActiveTab('review')}
        >
          <Ionicons
            name="checkmark-done-circle-outline"
            size={18}
            color={activeTab === 'review' ? '#7C3AED' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>Review Marks</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar & Filter Chips */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by subject, class, or exam name..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'entry' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading && workItems.length === 0 && reviewItems.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loaderText, { color: theme.subtext }]}>Loading data...</Text>
          </View>
        ) : activeTab === 'entry' ? renderWorkItems() : renderReviewItems()}
      </ScrollView>

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="teacher"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 16 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
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
    color: '#4F46E5',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    borderBottomColor: '#7C3AED',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#7C3AED',
  },

  tabContent: { marginTop: 24 },
  sectionHeaderRow: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  sectionSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '500' },

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
    borderTopColor: '#F1F5F9',
  },
  cardDate: { fontSize: 9, color: '#9CA3AF', fontWeight: '500' },
  enterMarksBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  enterMarksText: { fontSize: 9, fontWeight: '800' },

  progressContainer: { marginTop: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 8, fontWeight: '700', color: '#9CA3AF' },
  progressValue: { fontSize: 9, fontWeight: '800', color: '#1F2937' },
  progressBarBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  reviewDoneText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 16, fontSize: 14, lineHeight: 20 },
  loaderContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  loaderText: { marginTop: 12, fontSize: 14, fontWeight: '500' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  filterScroll: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    maxHeight: 40,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#7C3AED15',
    borderColor: '#7C3AED',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#7C3AED',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default TeacherResultManagementScreen;
