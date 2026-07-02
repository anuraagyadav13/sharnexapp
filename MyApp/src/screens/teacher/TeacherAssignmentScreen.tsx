import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  RefreshControl,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInUp, FadeIn, Layout, ZoomIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { useTheme } from '../../store/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherAssignment'>;

const TeacherAssignmentScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssignments = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const teacherId = authState.user?.id;
      if (!teacherId) return;

      const res = await apiClient.get(ENDPOINTS.TEACHER.ASSIGNMENTS(teacherId));
      setAssignments(res.data.assignments || []);
    } catch (error) {
      console.error('Failed to fetch teacher assignments:', error);
      Alert.alert('Error', 'Failed to synchronize assignments.');
    } finally {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [authState.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchAssignments(true); // silent fetch on focus to get any edits made
    }, [fetchAssignments])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAssignments(true);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Assignment',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(ENDPOINTS.TEACHER.DELETE_ASSIGNMENT(id));
              setAssignments(prev => prev.filter(a => a.id !== id));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete assignment');
            }
          }
        }
      ]
    );
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.class.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assignments, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#EF4444';
      default: return '#4F46E5';
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {/* Global Header */}
      <View style={[styles.globalHeader, { backgroundColor: theme.surface }]}>
        <ScaleButton 
          style={styles.menuHandle} 
          onPress={() => setDrawerOpen(true)}
        >
          <Ionicons name="menu" size={28} color={theme.text} />
        </ScaleButton>
        <Text style={[styles.headerTitle, { color: theme.primary }]} numberOfLines={1}>
          Assignments
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AccountSettings')} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleDarkMode} style={styles.iconBtn}>
            <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: '#A855F7' }]}>
             <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Welcome Section */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.topSection}>
          <Text style={[styles.welcomeText, { color: theme.subtext }]}>Manage your tasks</Text>
          <View style={styles.titleRow}>
             <Text style={[styles.pageTitle, { color: theme.text }]}>Class Assignments</Text>
             <TouchableOpacity 
               style={[styles.addBtn, { backgroundColor: theme.primary }]} 
               onPress={() => navigation.navigate('TeacherCreateAssignment')}
             >
               <Ionicons name="add" size={20} color="#FFF" />
               <Text style={styles.addBtnText}>Create New</Text>
             </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={20} color={theme.subtext} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by title, subject or class..."
              placeholderTextColor={theme.subtext + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.subtext} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Assignment List */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.subtext }]}>Fetching assignments...</Text>
            </View>
          ) : filteredAssignments.length === 0 ? (
            <Animated.View entering={ZoomIn.duration(400)} style={styles.emptyContainer}>
               <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + '10' }]}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={60} color={theme.primary} />
               </View>
               <Text style={[styles.emptyTitle, { color: theme.text }]}>No assignments found</Text>
               <Text style={[styles.emptyDesc, { color: theme.subtext }]}>
                 {searchQuery ? "Try a different search term." : "Start by creating your first assignment for your students."}
               </Text>
            </Animated.View>
          ) : (
            filteredAssignments.map((item: any, index: number) => {
              const progressPercent = item.total > 0 ? (item.submissions / item.total) * 100 : 0;
              const statusColor = getStatusColor(item.status);

              return (
                <Animated.View 
                   key={item.id} 
                   entering={FadeInUp.delay(index * 50).springify().damping(15)}
                   layout={Layout.springify()}
                   style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                   {/* Card Header */}
                   <View style={styles.cardHeader}>
                      <View style={[styles.subjectTag, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={[styles.subjectTagText, { color: theme.primary }]}>{item.subject}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
                      </View>
                   </View>

                   <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                   
                   <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={14} color={theme.subtext} />
                        <Text style={[styles.metaText, { color: theme.subtext }]}>{item.class}</Text>
                      </View>
                      <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color={theme.subtext} />
                        <Text style={[styles.metaText, { color: theme.subtext }]}>Due: {item.dueDate}</Text>
                      </View>
                   </View>

                   {/* Progress Section */}
                   <View style={styles.progressBox}>
                      <View style={styles.progressHeader}>
                        <Text style={[styles.progressLabel, { color: theme.subtext }]}>Submissions</Text>
                        <Text style={[styles.progressValue, { color: theme.text }]}>{item.submissions}/{item.total}</Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: theme.background }]}>
                        <Animated.View 
                          style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: statusColor }]} 
                        />
                      </View>
                   </View>

                   {/* Footer Actions */}
                   <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                        onPress={() => navigation.navigate('TeacherViewSubmission', { 
                          assignmentId: item.id,
                          assignmentTitle: item.title,
                          className: item.class,
                          dueDate: item.dueDate,
                          maxMarks: item.maxPoints
                        })}
                      >
                         <Ionicons name="eye-outline" size={16} color="#FFF" />
                         <Text style={styles.actionTextMain}>View Submissions</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.footerRight}>
                        <TouchableOpacity 
                          style={[styles.iconActionBtn, { backgroundColor: theme.background }]}
                          onPress={() => navigation.navigate('TeacherEditAssignment', { assignmentId: item.id })}
                        >
                           <Ionicons name="create-outline" size={18} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.iconActionBtn, { backgroundColor: '#FEE2E2' }]} 
                          onPress={() => handleDelete(item.id, item.title)}
                        >
                           <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                   </View>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="teacher" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold' },

  topSection: { padding: 16 },
  welcomeText: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  pageTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800', marginLeft: 4 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '500', marginLeft: 8 },

  listContainer: { paddingHorizontal: 20 },
  loaderContainer: { marginTop: 60, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },

  card: { borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subjectTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  subjectTagText: { fontSize: 11, fontWeight: '800' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '900' },
  
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '600' },
  metaDivider: { width: 1, height: 12 },

  progressBox: { marginBottom: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressValue: { fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 8, borderRadius: 4, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  actionTextMain: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 12 },
  iconActionBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  emptyContainer: { marginTop: 40, alignItems: 'center', padding: 20 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 }
});

export default TeacherAssignmentScreen;
