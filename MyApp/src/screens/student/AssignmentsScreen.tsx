import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type AssignmentsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Assignments'>;

interface Props {
  navigation: AssignmentsNavigationProp;
}

const AssignmentsScreen: React.FC<Props> = ({ navigation }) => {
    console.log('[Assignments] screen mounted');
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SummaryCard = ({ number, label, bgColor, iconName, lineColor, delay, library = 'MaterialCommunityIcons' }: any) => {
    const IconComponent = library === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
    return (
      <Animated.View 
        entering={FadeInUp.delay(delay).springify()} 
        style={[styles.summaryCard, { borderTopColor: lineColor || bgColor }]}
      >
        <View style={[styles.summaryIconBox, { backgroundColor: bgColor }]}>
          <IconComponent name={iconName} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.summaryTextCol}>
          <Text style={styles.summaryNumber}>{number}</Text>
          <Text style={styles.summaryLabel}>{label}</Text>
        </View>
      </Animated.View>
    );
  };

  const AssignmentCard = ({ category, status, title, subtitle, dueDate, deadlineRelative, isDelayed, delay, onPressView, onPressSubmit, onPressDownload }: any) => {
    const isPending = status === 'Pending';
    return (
      <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.assignmentCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{category}</Text>
          </View>
          <View style={[styles.statusBadge, !isPending && styles.statusBadgeSubmitted]}>
            <Text style={[styles.statusBadgeText, !isPending && styles.statusBadgeTextSubmitted]}>{status}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
        
        <View style={styles.cardBottomRow}>
          <View style={styles.cardDateCol}>
            <Text style={styles.cardDueDate}>Due Date : {dueDate}</Text>
            <Text style={[styles.cardRelativeDate, isDelayed && { color: theme.danger }]}>
              {deadlineRelative}
            </Text>
          </View>

          <View style={styles.cardActionCol}>
             <ScaleButton style={styles.btnView} activeOpacity={0.7} scaleTo={0.95} onPress={onPressView}>
               <Ionicons name="eye" size={14} color={theme.primary} style={styles.btnIconLayout} />
               <Text style={styles.btnViewText}>View</Text>
             </ScaleButton>
             
             {isPending ? (
               <ScaleButton style={[styles.btnSubmit, {backgroundColor: theme.primary}]} activeOpacity={0.8} scaleTo={0.95} onPress={onPressSubmit}>
                 <Ionicons name="send" size={13} color="#FFFFFF" style={styles.btnIconLayout} />
                 <Text style={styles.btnSubmitText}>Submit</Text>
               </ScaleButton>
             ) : (
               <ScaleButton style={[styles.btnSubmit, {backgroundColor: theme.success}]} activeOpacity={0.8} scaleTo={0.95} onPress={onPressDownload}>
                 <Ionicons name="download-outline" size={14} color="#FFFFFF" style={styles.btnIconLayout} />
                 <Text style={styles.btnSubmitText}>Download</Text>
               </ScaleButton>
             )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const [summary, setSummary] = useState({
    pending: 0,
    submitted: 0,
    graded: 0,
    upcoming: 0
  });


  const fetchAssignments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      console.log('[Assignments] starting fetch');
      const meRes = await studentService.getMe();
      const meData = meRes.normalized?.data;

      console.log('[Assignments] /auth/me data:', JSON.stringify(meData));

      const studentId = meData?.id || '';

      if (!studentId) {
        throw new Error('Student account ID not found in /auth/me');
      }

      const res = await studentService.getAssignments(studentId);

      console.log('[Assignments] raw data:', JSON.stringify(res.normalized?.data));

      const rawData = res.normalized?.data;
      const data =
        rawData?.assignments ||
        rawData?.data ||
        rawData ||
        [];

      const assignmentsArray = Array.isArray(data) ? data : [];
      setAssignments(assignmentsArray);

      const stats = {
        pending: assignmentsArray.filter((a: any) => {
          const status = String(a.status || '').toLowerCase();
          return status === 'pending' || status === 'overdue';
        }).length,
        submitted: assignmentsArray.filter((a: any) => {
          const status = String(a.status || '').toLowerCase();
          return Boolean(a.submission_id || a.submissionId || a.is_submitted || a.isSubmitted || status === 'submitted');
        }).length,
        graded: assignmentsArray.filter((a: any) => {
          const status = String(a.status || '').toLowerCase();
          return Boolean(a.graded_at || a.gradedAt || a.grade || status === 'graded');
        }).length,
        upcoming: assignmentsArray.filter((a: any) => {
          const status = String(a.status || '').toLowerCase();
          return status === 'upcoming';
        }).length,
      };

      setSummary(stats);
    } catch (err: any) {
      console.error('[Assignments] failed:', err?.response || err?.message || err);
      setError(err.message || 'Failed to load assignments. Please try again.');
      setAssignments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => fetchAssignments(true);

  useEffect(() => {
    console.log('[Assignments] useEffect running');
    fetchAssignments();
  }, [authState.user?.id]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {/* Global Header */}
      <StudentHeader 
        title="Assignments"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        
        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Assignments</Text>
          <Text style={styles.pageSubtitle}>View and manage your course assignments</Text>
        </View>

        {/* Top Summaries Grid 2x2 */}
        <View style={styles.summaryGrid}>
          <SummaryCard delay={100} number={summary.pending} label="Pending" bgColor="#F97316" lineColor="#3B82F6" iconName="clock-outline" />
          <SummaryCard delay={150} number={summary.submitted} label="Submitted" bgColor="#10B981" lineColor="#10B981" iconName="check-decagram" />
          <SummaryCard delay={200} number={summary.graded} label="Graded" bgColor="#8B5CF6" lineColor="#F59E0B" iconName="star" />
          <SummaryCard delay={250} number={summary.upcoming} label="Upcoming" bgColor="#3B82F6" lineColor="#8B5CF6" iconName="calendar-plus" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Assignments</Text>
        </View>

        {/* Assignment Cards List */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle" size={60} color={theme.danger} />
              <Text style={styles.emptyText}>{error}</Text>
              {/* <ScaleButton 
                style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4F46E5', borderRadius: 8 }}
                onPress={() => {
                  setError(null);
                  setIsLoading(true);
                  const fetchAssignments = async () => {
                    try {
                      const profileRes = await apiClient.get(ENDPOINTS.STUDENT.PROFILE);
                      const studentId = profileRes.data?.id;
                      if (!studentId) throw new Error('Student ID not found');
                      const res = await apiClient.get(ENDPOINTS.STUDENT.ASSIGNMENTS(studentId));
                      const assignmentsArray = res.data?.assignments || res.data?.data || res.data || [];
                      setAssignments(Array.isArray(assignmentsArray) ? assignmentsArray : []);
                      const stats = {
                        pending: assignmentsArray.filter((a: any) => a.status === 'pending' || a.status === 'overdue').length,
                        submitted: assignmentsArray.filter((a: any) => a.submission_id).length,
                        graded: assignmentsArray.filter((a: any) => a.graded_at).length,
                        upcoming: assignmentsArray.filter((a: any) => a.status === 'upcoming').length,
                      };
                      setSummary(stats);
                    } catch (err: any) {
                      setError('Failed to load assignments. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  };
                  fetchAssignments();
                }}
                scaleTo={0.95}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
              </ScaleButton> */}
              <ScaleButton
                style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.primary, borderRadius: 8 }}
                onPress={() => fetchAssignments()}
                scaleTo={0.95}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
              </ScaleButton>
            </View>
          ) : assignments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={60} color={theme.border} />
              <Text style={styles.emptyText}>No assignments found</Text>
            </View>
          ) : (
            assignments.map((item, index) => (
              <AssignmentCard 
                key={item.id}
                delay={300 + index * 50}
                category={item.subject || 'General'}
                status={item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase() : 'Unknown'}
                title={item.title || 'Untitled assignment'}
                subtitle={item.description || 'No description available'}
                dueDate={item.due_date || item.dueDate || 'N/A'}
                deadlineRelative={item.is_overdue || item.isOverdue ? 'Overdue' : 'Due'}
                isDelayed={item.is_overdue || item.isOverdue}
                onPressView={() => navigation.navigate('AssignmentDetails', { assignmentId: item.id })}
                onPressSubmit={() => navigation.navigate('AssignmentSubmit', { assignmentId: item.id })}
                onPressDownload={() => {
                  const url = item.file_url || item.submission_file_url;
                  if (url) {
                    Linking.openURL(url).catch(() => {
                      Alert.alert('Error', 'Could not open the download link.');
                    });
                  } else {
                    Alert.alert('Coming Soon', 'The download link for this assignment is currently being processed by the school system.');
                  }
                }}
              />
            ))
          )}
        </View>

      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60, // Adjust for iOS statusbar
    paddingBottom: 16,
    backgroundColor: theme.surface, // Using pure white for better contrast with shadow
    shadowColor: theme.text,
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
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: theme.subtext,
    fontWeight: '500',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 32,
    rowGap: 16,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: theme.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: theme.border, 
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTextCol: {
    justifyContent: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
  },

  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },

  listContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  assignmentCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary, 
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.border, 
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20, 
    backgroundColor: theme.isDarkMode ? '#1E3A8A' : '#EFF6FF',
    borderWidth: 1,
    borderColor: theme.isDarkMode ? '#3B82F6' : '#93C5FD',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500', 
    color: theme.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20, 
    backgroundColor: theme.isDarkMode ? '#78350F30' : '#FFFBEB',
    borderWidth: 1,
    borderColor: theme.isDarkMode ? '#D97706' : '#FCD34D',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#F59E0B',
  },
  statusBadgeSubmitted: {
    backgroundColor: theme.isDarkMode ? '#065F4630' : '#ECFDF5',
    borderColor: theme.isDarkMode ? '#34D399' : '#6EE7B7',
  },
  statusBadgeTextSubmitted: {
    color: theme.isDarkMode ? '#34D399' : '#10B981',
  },
  
  cardTitle: {
    fontSize: 17, 
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13, 
    color: theme.subtext,
    marginBottom: 20, 
    fontWeight: '400',
  },
  
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardDateCol: {
    flex: 1,
  },
  cardActionCol: {
    flexDirection: 'row',
    gap: 10,
  },
  
  cardDueDate: {
    fontSize: 12,
    color: theme.subtext,
    marginBottom: 4,
    fontWeight: '400', 
  },
  cardRelativeDate: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.danger,
  },

  btnView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 6,
    borderRadius: 6, 
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  btnViewText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  btnIconLayout: {
    marginRight: 4,
  },
  btnSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnSubmitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: theme.subtext,
  },
});

export default AssignmentsScreen;
