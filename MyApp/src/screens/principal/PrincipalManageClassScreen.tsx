import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Toast, { ToastType } from '../../components/Toast';
import { useTheme } from '../../store/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TabButton = ({ title, active, onPress }: any) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{title}</Text>
      {active && <View style={styles.tabIndicator} />}
    </TouchableOpacity>
  );
};

const PrincipalManageClassScreen = ({ navigation, route }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { classId, className } = route.params;
  const [activeTab, setActiveTab] = useState('Overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [classDetails, setClassDetails] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  const fetchAllData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);

      const [detailsRes, subjectsRes, studentsRes] = await Promise.all([
        apiClient.get(`${ENDPOINTS.PRINCIPAL.CLASSES}/${classId}`),
        apiClient.get(`/classes/${classId}/subjects`),
        apiClient.get(`/classes/${classId}/students`),
      ]);

      setClassDetails(detailsRes.data.data || detailsRes.data);
      setSubjects(subjectsRes.data.classSubjects || []);
      setStudents(studentsRes.data.data || []);

    } catch (error) {
      console.error('Failed to fetch class details:', error);
      showToast('Failed to load class information', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [classId]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAllData();
  };

  const renderOverview = () => (
    <Animated.View entering={FadeInUp.springify()} style={styles.tabContent}>
      {/* Detail Card */}
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={styles.classBadge}>
            <MaterialCommunityIcons name="google-classroom" size={24} color="#FFF" />
          </View>
          <View>
            <Text style={styles.detailTitle}>{classDetails?.name}</Text>
            <Text style={styles.detailSubtitle}>Grade {classDetails?.grade} • Section {classDetails?.section}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>ROOM</Text>
            <Text style={styles.infoValue}>{classDetails?.room || 'TBA'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>ACADEMIC YEAR</Text>
            <Text style={styles.infoValue}>{classDetails?.academicYear || '2023-24'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>CAPACITY</Text>
            <Text style={styles.infoValue}>{classDetails?.capacity || '50'}</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.miniStatCard}>
          <Ionicons name="people-outline" size={20} color="#6366F1" />
          <Text style={styles.miniStatVal}>{students.length}</Text>
          <Text style={styles.miniStatLabel}>Students</Text>
        </View>
        <View style={styles.miniStatCard}>
          <Ionicons name="book-outline" size={20} color="#10B981" />
          <Text style={styles.miniStatVal}>{subjects.length}</Text>
          <Text style={styles.miniStatLabel}>Subjects</Text>
        </View>
        <View style={styles.miniStatCard}>
          <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
          <Text style={styles.miniStatVal}>85%</Text>
          <Text style={styles.miniStatLabel}>Attendance</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Administrative Actions</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('PrincipalEditClass', { classId })}
        >
          <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? '#6366F120' : '#EEF2FF' }]}>
            <Ionicons name="create-outline" size={20} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Edit Class Details</Text>
            <Text style={styles.actionDesc}>Change room, grade, or section info</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="calendar-outline" size={20} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Class Schedule</Text>
            <Text style={styles.actionDesc}>Manage weekly periods and timing</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(prev => ({ ...prev, visible: false }))}
        />
      )}

      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Manage {className}</Text>
        <TouchableOpacity style={styles.headerActionBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {isLoading && !isRefreshing ? (
          <View style={{ padding: 20 }}>
            <Skeleton width="100%" height={150} borderRadius={24} style={{ marginBottom: 20 }} />
            <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 20 }} />
            <Skeleton width="100%" height={300} borderRadius={24} />
          </View>
        ) : (
          <>
            {/* Class Info Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.infoBadge, { backgroundColor: isDarkMode ? '#6366F120' : '#EEF2FF' }]}>
                <Text style={[styles.badgeLabel, { color: '#6366F1' }]}>Section: {classDetails?.section || '--'}</Text>
              </View>
              <View style={[styles.infoBadge, { backgroundColor: isDarkMode ? '#8B5CF620' : '#F5F3FF' }]}>
                <Text style={[styles.badgeLabel, { color: '#8B5CF6' }]}>Grade: {classDetails?.grade || '--'}</Text>
              </View>
              <View style={[styles.infoBadge, { backgroundColor: isDarkMode ? '#10B98120' : '#ECFDF5' }]}>
                <Text style={[styles.badgeLabel, { color: '#10B981' }]}>Students: {students.length}</Text>
              </View>
              <View style={[styles.infoBadge, { backgroundColor: isDarkMode ? '#F59E0B20' : '#FFFBEB' }]}>
                <Text style={[styles.badgeLabel, { color: '#F59E0B' }]}>Teacher: {classDetails?.teacher_name || '0'}</Text>
              </View>
            </View>

            <View style={styles.tabContent}>
              <Text style={styles.mainSectionTitle}>Student List</Text>

              <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, { flex: 2 }]}>NAME</Text>
                <Text style={[styles.columnHeader, { flex: 1 }]}>ROLL NO</Text>
                <Text style={[styles.columnHeader, { flex: 1.5 }]}>ADMISSION DATE</Text>
              </View>

              <View style={styles.tableBody}>
                {students.length > 0 ? (
                  students.map((student, index) => (
                    <View key={student.id || index} style={styles.tableRow}>
                      <Text style={[styles.rowText, { flex: 2, fontWeight: '700' }]}>{student.name}</Text>
                      <Text style={[styles.rowText, { flex: 1 }]}>{student.roll_number || student.rollNo || '--'}</Text>
                      <Text style={[styles.rowText, { flex: 1.5, color: '#64748B' }]}>{student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '--'}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No students found</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: theme.background,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: theme.border },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.text, flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerActionBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 20 },
  tabButton: { paddingVertical: 8, alignItems: 'center' },
  tabButtonActive: {},
  tabButtonText: { fontSize: 14, fontWeight: '600', color: theme.subtext },
  tabButtonTextActive: { color: theme.primary, fontWeight: '800' },
  tabIndicator: { width: '100%', height: 3, backgroundColor: theme.primary, borderRadius: 1.5, marginTop: 4 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 25 },
  infoBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeLabel: { fontSize: 11, fontWeight: '800' },
  tabContent: { paddingHorizontal: 20, paddingBottom: 40 },
  mainSectionTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: theme.surface, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  columnHeader: { fontSize: 10, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5 },
  tableBody: { backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border, alignItems: 'center' },
  rowText: { fontSize: 13, color: theme.text },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: theme.subtext, fontSize: 14, fontWeight: '600' },
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  actionDesc: {
    fontSize: 12,
    color: theme.subtext,
    marginTop: 2,
  },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: theme.subtext, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: theme.text },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  miniStatCard: { flex: 1, backgroundColor: theme.surface, padding: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  miniStatVal: { fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 6 },
  miniStatLabel: { fontSize: 11, fontWeight: '600', color: theme.subtext, marginTop: 2 },

  // Missing styles
  detailCard: { backgroundColor: theme.surface, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: theme.border },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  classBadge: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  detailTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
  detailSubtitle: { fontSize: 12, color: theme.subtext, marginTop: 2 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 16 },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default PrincipalManageClassScreen;
