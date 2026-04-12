import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [workRes, reviewRes] = await Promise.all([
        apiClient.get(ENDPOINTS.TEACHER.RMS_WORK_ITEMS).catch(() => ({ data: { items: [] } })),
        apiClient.get(ENDPOINTS.TEACHER.RMS_REVIEW_ITEMS).catch(() => ({ data: { items: [] } })),
      ]);
      
      setWorkItems(workRes.data.items || workRes.data.data?.items || []);
      setReviewItems(reviewRes.data.items || reviewRes.data.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch RMS data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

      {workItems.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color={theme.border} />
          <Text style={[styles.emptyText, { color: theme.subtext }]}>No assigned examinations found for marks entry.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {workItems.map((item, index) => (
            <Animated.View 
              key={`${item.examId}-${item.classId}-${item.subjectId}`} 
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
                  examName: item.examName,
                  className: item.className,
                  subjectName: item.subjectName
                })}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.subjectCircle, { backgroundColor: theme.primary + '15' }]}>
                    <Text style={[styles.subjectInitial, { color: theme.primary }]}>{item.subjectName?.charAt(0)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status || 'DRAFT'}</Text>
                  </View>
                </View>

                <Text style={[styles.cardSubject, { color: theme.text }]} numberOfLines={1}>{item.subjectName}</Text>
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

      {reviewItems.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color={theme.border} />
          <Text style={[styles.emptyText, { color: theme.subtext }]}>No classes found for marks review.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {reviewItems.map((item, index) => {
            const progress = item.totalSubjects > 0 ? (item.approvedSubjects / item.totalSubjects) * 100 : 0;
            return (
              <Animated.View 
                key={`${item.examId}-${item.classId}`} 
                entering={FadeInUp.delay(index * 50).springify()} 
                style={styles.cardWrapper}
              >
                <TouchableOpacity 
                  style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('TeacherReviewSubmission', { 
                    examId: item.examId, 
                    classId: item.classId,
                    examName: item.examName,
                    className: item.className
                  })}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.subjectCircle, { backgroundColor: '#3B82F615' }]}>
                      <Text style={[styles.subjectInitial, { color: '#3B82F6' }]}>{item.className?.charAt(0)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#10B98115' }]}>
                      <Text style={[styles.statusText, { color: '#10B981' }]}>{item.approvedSubjects}/{item.totalSubjects} OK</Text>
                    </View>
                  </View>

                  <Text style={[styles.cardSubject, { color: theme.text }]} numberOfLines={1}>{item.className}</Text>
                  <Text style={[styles.cardClass, { color: theme.subtext }]} numberOfLines={1}>{item.examName}</Text>
                  
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
                    <Text style={[styles.reviewDoneText, { color: '#10B981' }]}>FULLY REVIEWED</Text>
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

      {/* Header */}
      <View style={styles.globalHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Result Management</Text>
        <View style={styles.headerRight}>
          <View style={styles.avatar}>
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

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchData} tintColor={theme.primary} />
        }
      >
        {isLoading && workItems.length === 0 && reviewItems.length === 0 ? (
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

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
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectInitial: { fontSize: 14, fontWeight: '800' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
});

export default TeacherResultManagementScreen;
