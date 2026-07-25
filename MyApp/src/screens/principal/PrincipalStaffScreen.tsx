import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient, { getApiErrorMessage } from '../../services/apiClient';
import principalService from '../../services/principalService';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Toast, { ToastType } from '../../components/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PageSkeleton = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeader}>
        <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={16} />
      </View>
      <View style={styles.statsRow}>
        <Skeleton width="31%" height={100} borderRadius={16} />
        <Skeleton width="31%" height={100} borderRadius={16} />
        <Skeleton width="31%" height={100} borderRadius={16} />
      </View>
      <View style={{ marginTop: 30 }}>
        {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={120} borderRadius={20} style={{ marginBottom: 16 }} />)}
      </View>
    </ScrollView>
  );
};

const StatCard = ({ title, value, color, icon }: { title: string, value: string | number, color: string, icon: string }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle} numberOfLines={1}>{title}</Text>
    </View>
  );
};

const StaffCard = ({ item, index, delay, onToggleStatus }: any) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation<any>();
  const displayName = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Staff Member';
  const brandColor = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 5];

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={[styles.staffCard, !item.isActive && { opacity: 0.7 }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatarBox, { backgroundColor: brandColor + '15' }]}>
          <Text style={[styles.avatarText, { color: brandColor }]}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{displayName}</Text>
          <Text style={styles.staffId}>ID: {item.id?.substring(0, 8)}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => navigation.navigate('PrincipalStaffDetails', { staffId: item.id })} style={styles.actionBtn}>
            <Ionicons name="eye-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PrincipalEditStaff', { staffId: item.id, initialData: item })} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onToggleStatus(item.id, item.isActive)} style={styles.actionBtn}>
            <Ionicons name={item.isActive ? "ban-outline" : "checkmark-circle-outline"} size={18} color={item.isActive ? "#EF4444" : "#10B981"} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}><Text style={styles.badgeText}>{item.department || 'General'}</Text></View>
        <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#E0F2FE' : '#FEE2E2' }]}><Text style={[styles.statusText, { color: item.isActive ? '#0284C7' : '#EF4444' }]}>{item.isActive ? 'Active' : 'Inactive'}</Text></View>
      </View>

      <View style={styles.contactFooter}>
        <View style={styles.contactItem}>
          <Ionicons name="mail-outline" size={12} color={theme.subtext} />
          <Text style={styles.contactText} numberOfLines={1}>{item.email || 'no-email@school.com'}</Text>
        </View>
        <View style={styles.contactItem}>
          <Ionicons name="call-outline" size={12} color={theme.subtext} />
          <Text style={styles.contactText}>{item.phone || '+91 000000000'}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const PrincipalStaffScreen = ({ navigation }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0 });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({ classId: '', teacherId: '' });
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType; onUndo?: () => void }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType = 'info', onUndo?: () => void) => {
    setToast({ visible: true, message, type, onUndo });
  };

  const fetchData = async () => {
    try {
      const institutionId = authState.user?.institutionId || '';
      if (!institutionId) return;

      if (!isRefreshing) setIsLoading(true);
      const [staffRes, classRes, assignmentsRes] = await Promise.all([
        principalService.getTeachers(institutionId),
        principalService.getClasses(),
        principalService.getClassAssignments(institutionId),
      ]);

      const staffResAny = staffRes as any;
      const classResAny = classRes as any;
      const assignmentsResAny = assignmentsRes as any;

      const staffData = staffResAny.data?.data ?? staffResAny.data ?? [];
      const teachersList = Array.isArray(staffData) ? staffData : (staffData.staff || []);
      setStaffList(teachersList);

      const classData = classResAny.data?.classes ?? (Array.isArray(classResAny.data) ? classResAny.data : (classResAny.data?.data ?? []));
      const assignmentsList = assignmentsResAny.data?.data ?? assignmentsResAny.data ?? [];

      const combinedClasses = classData.map((cls: any) => {
        const assignment = assignmentsList.find((a: any) => a.classId === cls.id);
        return {
          ...cls,
          teacherId: assignment ? assignment.teacherId : null,
          teacher: assignment ? assignment.teacherName : cls.classTeacherName,
        };
      });
      setClasses(combinedClasses);

      setStats({
        total: teachersList.length,
        active: teachersList.filter((t: any) => t.isActive).length,
        onLeave: 0
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Error loading data.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleOpenAssign = (cls: any) => {
    setSelectedClassForAssign(cls);
    setAssignForm({ classId: cls.id, teacherId: cls.teacherId || '' });
    setIsAssignModalOpen(true);
  };

  const handleUpdateAssignment = async (overrideId?: string) => {
    try {
      const finalTeacherId = overrideId !== undefined ? overrideId : assignForm.teacherId;
      const selectedTeacher = staffList.find(t => t.id === finalTeacherId);
      const teacherName = selectedTeacher ? (selectedTeacher.name || `${selectedTeacher.firstName} ${selectedTeacher.lastName}`) : 'Not Assigned';

      setClasses(prev => prev.map(c =>
        c.id === assignForm.classId ? { ...c, teacher: teacherName, teacherId: finalTeacherId } : c
      ));

      setIsLoading(true);
      await apiClient.post(`${ENDPOINTS.PRINCIPAL.CLASSES}/${assignForm.classId}/assign-teacher`, {
        teacherId: finalTeacherId
      });
      setIsAssignModalOpen(false);
      fetchData();
      showToast(finalTeacherId ? 'Assignment updated successfully!' : 'Assignment removed.', 'success');
    } catch (error) {
      fetchData();
      showToast('Failed to update assignment.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = (id: string, currentActive: boolean) => {
    const staffMember = staffList.find(s => s.id === id);
    if (!staffMember) return;

    const action = currentActive ? 'deactivate' : 'reactivate';
    Alert.alert(
      `${currentActive ? 'Deactivate' : 'Reactivate'} Staff`,
      `Are you sure you want to ${action} this staff member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: currentActive ? 'Deactivate' : 'Reactivate',
          style: currentActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setIsLoading(true);
              setStaffList(prev => prev.map(s => s.id === id ? { ...s, isActive: !currentActive } : s));

              await principalService.updateTeacherStatus(id, !currentActive);

              showToast(`Staff member ${currentActive ? 'deactivated' : 'activated'} successfully.`, 'success');
              fetchData();
            } catch (error: any) {
              setStaffList(prev => prev.map(s => s.id === id ? { ...s, isActive: currentActive } : s));
              const errorMsg = getApiErrorMessage(error);
              showToast(errorMsg || `Failed to ${action} staff member.`, 'error');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} translucent />

      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(prev => ({ ...prev, visible: false }))}
          onUndo={toast.onUndo}
        />
      )}

      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.primary} />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Staff Management</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('PrincipalDashboard')}>
            <Ionicons name="home-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
          >
            {authState.user?.photoUrl ? (
              <Image source={{ uri: authState.user.photoUrl }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !isRefreshing ? (
        <PageSkeleton />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
        >
          <View style={styles.pageHeader}>
            <Text style={styles.screenTitle}>Staff Managment</Text>
            <Text style={styles.screenSubtitle}>Manage teaching and administrative staff members.</Text>
          </View>

          <View style={styles.quickActionRow}>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => navigation.navigate('PrincipalMarkStaffAttendance')}
            >
              <Ionicons name="calendar-outline" size={16} color="#FFF" />
              <Text style={styles.actionBtnText}>Mark Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => navigation.navigate('PrincipalAddStaff')}
            >
              <Ionicons name="add-outline" size={18} color="#FFF" />
              <Text style={styles.actionBtnText}>Add New Staff</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <StatCard title="Total Teachers" value={stats.total} color="#8B5CF6" icon="account-group-outline" />
            <StatCard title="Assigned Classes" value={classes.filter(c => c.teacher || c.teacherName || c.teacher_name).length} color="#10B981" icon="account-check-outline" />
            <StatCard title="Total Students" value={classes.reduce((acc, curr) => acc + (curr.studentCount || 0), 0)} color="#3B82F6" icon="account-group-outline" />
          </View>

          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={20} color={theme.subtext} />
            <TextInput
              placeholder="Search by name, department or id..."
              placeholderTextColor={theme.subtext}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.listContainer}>
            {staffList
              .filter(s =>
                s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.id?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((item, index) => (
                <StaffCard key={item.id} item={item} index={index} delay={index * 50} onToggleStatus={handleToggleStatus} />
              ))}
          </View>

          <View style={styles.assignmentSection}>
            <Text style={styles.sectionTitle}>Class Teacher Assignments</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assignmentScroll}>
              {classes.map(cls => (
                <View key={cls.id} style={styles.assignmentCard}>
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.className}>{cls.className || cls.name}</Text>
                    <View style={[styles.assignedBadge, { backgroundColor: cls.teacher ? '#D1FAE5' : '#FEE2E2' }]}>
                      <Text style={[styles.assignedText, { color: cls.teacher ? '#059669' : '#EF4444' }]}>
                        {cls.teacher ? 'Assigned' : 'Vacant'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.teacherName}>{cls.teacher || cls.teacherName || cls.teacher_name || 'Not Assigned'}</Text>
                  <TouchableOpacity
                    style={styles.changeBtn}
                    onPress={() => handleOpenAssign(cls)}
                  >
                    <Text style={styles.changeBtnText}>Change Teacher</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      )}

      <Modal visible={isAssignModalOpen} transparent animationType="fade">
        <View style={styles.assignOverlay}>
          <View style={styles.assignContent}>
            <Text style={styles.assignModalTitle}>Assign Class Teacher</Text>

            <View style={styles.assignField}>
              <Text style={styles.assignLabel}>Class</Text>
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{selectedClassForAssign?.className || selectedClassForAssign?.name}</Text>
                <Ionicons name="chevron-down" size={18} color={theme.subtext} />
              </View>
            </View>

            <View style={styles.assignField}>
              <Text style={styles.assignLabel}>Teacher</Text>
              <View style={styles.pickerBox}>
                <ScrollView style={{ maxHeight: 300 }}>
                  <TouchableOpacity
                    style={styles.removeAssignmentBtn}
                    onPress={() => handleUpdateAssignment('')}
                  >
                    <Ionicons name="person-remove-outline" size={20} color="#EF4444" />
                    <Text style={styles.removeAssignmentText}>Remove Assignment</Text>
                  </TouchableOpacity>

                  {staffList.length === 0 ? (
                    <View style={styles.emptyTeachersBox}>
                      <Text style={styles.emptyTeachersText}>No teachers found</Text>
                    </View>
                  ) : (
                    staffList.map((t, idx) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.teacherOption, assignForm.teacherId === t.id && styles.teacherOptionActive]}
                        onPress={() => setAssignForm(prev => ({ ...prev, teacherId: t.id }))}
                      >
                        <View style={styles.teacherIndexBox}>
                          <Text style={styles.teacherIndexText}>{idx + 1}</Text>
                        </View>
                        <View style={styles.teacherDetails}>
                          <Text style={[styles.teacherNameText, assignForm.teacherId === t.id && styles.teacherNameTextActive]}>
                            {t.name || (t.firstName ? `${t.firstName} ${t.lastName}` : 'Unknown Teacher')}
                          </Text>
                          <Text style={styles.teacherEmailText}>{t.email}</Text>
                        </View>
                        {assignForm.teacherId === t.id && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>

            <View style={styles.assignFooter}>
              <TouchableOpacity style={styles.assignCancelBtn} onPress={() => setIsAssignModalOpen(false)}>
                <Text style={styles.assignCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.assignSaveBtn} onPress={() => handleUpdateAssignment()}>
                <Text style={styles.assignSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: theme.background,
  },
  headerTitle: { fontSize: 16, fontWeight: '500', color: theme.primary, flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  pageHeader: { paddingHorizontal: 20, marginBottom: 15, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: theme.primary, marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  quickActionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  actionBtnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.primary, height: 42, borderRadius: 10, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  actionBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  statCard: { alignItems: 'center', backgroundColor: theme.surface, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: theme.border, width: '31%' },
  statIconCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: theme.text },
  statTitle: { fontSize: 8, fontWeight: '700', color: theme.subtext, textTransform: 'uppercase', textAlign: 'center' },

  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, marginHorizontal: 20, paddingHorizontal: 14, height: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13, color: theme.text, fontWeight: '500' },

  listContainer: { paddingHorizontal: 20 },
  staffCard: { backgroundColor: theme.surface, borderRadius: 20, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 15, fontWeight: '800', color: theme.text },
  staffId: { fontSize: 10, color: theme.subtext, fontWeight: '600', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },

  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  badge: { backgroundColor: theme.background, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 9, fontWeight: '700', color: theme.primary },
  statusBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  statusText: { fontSize: 9, fontWeight: '700', color: '#10B981' },

  contactFooter: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border, gap: 15 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  contactText: { fontSize: 11, color: theme.subtext, fontWeight: '500' },

  assignmentSection: { marginTop: 30, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 15 },
  assignmentScroll: { gap: 12 },
  assignmentCard: { backgroundColor: theme.surface, borderRadius: 20, padding: 16, width: 200, borderWidth: 1, borderColor: theme.border },
  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  className: { fontSize: 13, fontWeight: '800', color: theme.text },
  assignedBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  assignedText: { fontSize: 9, fontWeight: '700', color: '#059669' },
  teacherName: { fontSize: 12, fontWeight: '700', color: theme.subtext, marginBottom: 12 },
  changeBtn: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10, alignItems: 'center' },
  changeBtnText: { fontSize: 11, fontWeight: '700', color: theme.primary },

  assignOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  assignContent: { backgroundColor: theme.surface, width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: theme.border },
  assignModalTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 20 },
  assignField: { marginBottom: 18 },
  assignLabel: { fontSize: 12, fontWeight: '700', color: theme.subtext, marginBottom: 8 },
  readOnlyBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.background, height: 50, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.border },
  readOnlyText: { fontSize: 14, fontWeight: '600', color: theme.text },
  pickerBox: { backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 5 },
  teacherOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  teacherOptionActive: { backgroundColor: theme.isDarkMode ? '#312E81' : '#EEF2FF', borderColor: theme.primary },
  teacherIndexBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  teacherIndexText: { fontSize: 11, fontWeight: '800', color: theme.subtext },
  teacherDetails: { flex: 1 },
  teacherNameText: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 2 },
  teacherNameTextActive: { color: theme.primary },
  teacherEmailText: { fontSize: 11, color: theme.subtext, fontWeight: '500' },
  removeAssignmentBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 12, backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECACA', gap: 10 },
  removeAssignmentText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  emptyTeachersBox: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTeachersText: { fontSize: 14, color: theme.subtext, fontWeight: '500', fontStyle: 'italic' },
  assignFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 15, marginTop: 15 },
  assignCancelBtn: { paddingHorizontal: 15, paddingVertical: 10 },
  assignCancelText: { fontSize: 15, fontWeight: '700', color: theme.subtext },
  assignSaveBtn: { backgroundColor: theme.primary, paddingHorizontal: 25, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  assignSaveText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  headerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 4,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});

export default PrincipalStaffScreen;
