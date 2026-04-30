import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown, SlideInDown } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient, { getApiErrorMessage } from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Toast, { ToastType } from '../../components/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PageSkeleton = () => (
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
      {[1, 2].map(i => <Skeleton key={i} width="100%" height={180} borderRadius={24} style={{ marginBottom: 16 }} />)}
    </View>
  </ScrollView>
);

const StatCard = ({ title, value, color, icon }: { title: string, value: string | number, color: string, icon: string }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle} numberOfLines={1}>{title}</Text>
  </View>
);

const ClassCard = ({ item, index, delay, onDelete, onAssign }: any) => {
  const navigation = useNavigation<any>();
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.classCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="google-classroom" size={24} color="#6366F1" />
        </View>
        <View style={styles.classMainInfo}>
          <Text style={styles.className}>{item.className || item.name}</Text>
          <Text style={styles.classSubtitle}>Section {item.section || '--'}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.circleActionBtn}
            onPress={() => navigation.navigate('PrincipalManageClass', { classId: item.id, className: item.className || item.name })}
          >
            <Ionicons name="eye-outline" size={18} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.circleActionBtn}
            onPress={() => navigation.navigate('PrincipalEditClass', { classId: item.id })}
          >
            <Ionicons name="pencil-outline" size={18} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleActionBtn, { borderColor: '#FEE2E2' }]} onPress={() => onDelete(item.id)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>ACADEMIC YEAR</Text>
          <Text style={styles.metricVal}>{item.academicYear || item.academic_year || '2026'}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>GRADE</Text>
          <Text style={styles.metricVal}>{item.grade || '--'}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>STUDENTS</Text>
          <View style={styles.statusPill}><Text style={styles.statusText}>{item.studentCount || 0}</Text></View>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.teacherInfo}>
          <View style={styles.teacherAvatar}>
             <Text style={styles.teacherInitial}>{item.teacher?.charAt(0) || 'T'}</Text>
          </View>
          <View>
            <Text style={styles.teacherLabel}>TEACHER</Text>
            <Text style={styles.teacherName}>{item.teacher || item.teacherName || item.teacher_name || 'Not Assigned'}</Text>
          </View>
        </View>

      </View>
    </Animated.View>
  );
};

const PrincipalClassesScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType; onUndo?: () => void }>({
    visible: false,
    message: '',
    type: 'info'
  });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({ classId: '', teacherId: '' });

  const showToast = (message: string, type: ToastType = 'info', onUndo?: () => void) => {
    setToast({ visible: true, message, type, onUndo });
  };

  const [newClassForm, setNewClassForm] = useState({
    name: '',
    section: '',
    grade: '',
    academicYear: '2026',
    room: '',
  });

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const [res, staffRes] = await Promise.all([
        apiClient.get(ENDPOINTS.PRINCIPAL.CLASSES),
        apiClient.get(ENDPOINTS.PRINCIPAL.STAFF)
      ]);

      const data = res.data.data || res.data || [];
      const classList = Array.isArray(data) ? data : data.classes || [];
      const uniqueClasses = Array.from(new Map(classList.map((c: any) => [c.id, c])).values());
      setClasses(uniqueClasses);

      const staffData = staffRes.data.data || staffRes.data.staff || staffRes.data || [];
      setTeachers(Array.isArray(staffData) ? staffData : []);
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

  const handleAddClass = async () => {
    if (!newClassForm.name) {
      showToast('Class Name is a required field.', 'warning');
      return;
    }
    
    try {
      setIsLoading(true);
      // Redirect to the correct classes creation endpoint to fix 405 error
      await apiClient.post('/classes', {
        name: newClassForm.name,
        section: newClassForm.section,
        grade: newClassForm.grade,
        academicYear: newClassForm.academicYear,
        room: newClassForm.room,
      });
      setIsAddModalOpen(false);
      setNewClassForm({ name: '', section: '', grade: '', academicYear: '2026', room: '' });
      onRefresh();
      showToast('Class unit created successfully!', 'success');
    } catch (error: any) {
      console.error('Add class error:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to create class. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssign = (cls: any) => {
    setSelectedClassForAssign(cls);
    setAssignForm({ classId: cls.id, teacherId: cls.teacherId || '' });
    setIsAssignModalOpen(true);
  };

  const handleUpdateAssignment = async (overrideId?: string) => {
    try {
      const finalTeacherId = overrideId !== undefined ? overrideId : assignForm.teacherId;
      const selectedTeacher = teachers.find(t => t.id === finalTeacherId);
      const teacherName = selectedTeacher ? (selectedTeacher.name || `${selectedTeacher.firstName} ${selectedTeacher.lastName}`) : 'Not Assigned';
      
      const institutionId = authState.user?.institutionId || authState.user?.tenantId;
      await apiClient.post(`/tenants/${institutionId}/class-assignments`, {
        classId: assignForm.classId,
        teacherId: assignForm.teacherId
      });
      setIsAssignModalOpen(false);
      fetchData(); // Sync with server
      showToast('Teacher assigned successfully!', 'success');
    } catch (error) {
      console.error('Failed to update assignment:', error);
      fetchData(); // Rollback on error
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    const classToDelete = classes.find(c => c.id === id);
    if (!classToDelete) return;

    Alert.alert('Delete Class', `Are you sure you want to permanently delete ${classToDelete.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          const originalClasses = [...classes];
          setClasses(classes.filter(c => c.id !== id));
          
          // Delayed Delete Pattern: Wait 5 seconds before hitting the DB
          const deleteTimer = setTimeout(async () => {
            try {
              await apiClient.delete(`${ENDPOINTS.PRINCIPAL.CLASSES}/${id}`);
              // Note: We don't show another toast if successful to keep it clean
            } catch (error) {
              console.error('Permanent delete failed:', error);
              // If DB delete fails, we should probably inform them and restore
              setClasses(originalClasses);
              showToast('Sync failed. Class restored.', 'error');
            }
          }, 5000);

          showToast(`Deleted ${classToDelete.name}.`, 'info', () => {
            // UNDO LOGIC: Cancel the timer and restore state
            clearTimeout(deleteTimer);
            setClasses(originalClasses);
          });
      } }
    ]);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />
      
      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
          onUndo={toast.onUndo}
        />
      )}

      {/* Premium Dashboard Header - EXACT Match */}
      <View style={styles.dashboardHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)}>
            <Ionicons name="menu-outline" size={28} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.welcomeText}>
            Welcome back, <Text style={styles.userNameHighlight}>{authState.user?.name?.split(' ')[0] || 'Anurag'}</Text>
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="moon-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => navigation.navigate('AccountSettings')}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarInitial}>{authState.user?.name?.charAt(0) || 'A'}</Text>
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
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
        >
          <View style={styles.pageHeader}>
            <View style={styles.titleRow}>
               <View style={{ flex: 1 }}>
                  <Text style={styles.screenTitle}>Classes Management</Text>
                  <Text style={styles.screenSubtitle}>Manage classes, sections, and academic structure.</Text>
               </View>
               <TouchableOpacity 
                 style={styles.addNewBtn}
                 onPress={() => navigation.navigate('PrincipalAddClass')}
               >
                  <Ionicons name="add" size={18} color="#FFF" />
                  <Text style={styles.addNewBtnText}>Add New Class</Text>
               </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row - Match Screenshot Content */}
          <View style={styles.statsRow}>
            <StatCard title="Total Classes" value={classes.length} color="#8B5CF6" icon="google-classroom" />
            <StatCard title="Total Students" value={classes.reduce((s, c) => s + (parseInt(c.studentCount || c.student_count || 0)), 0)} color="#3B82F6" icon="account-group-outline" />
            <StatCard title="Assigned Teachers" value={classes.filter(c => c.teacher || c.teacher_name).length} color="#10B981" icon="account-check-outline" />
          </View>

          {/* Search Bar - Student Pattern */}
          <View style={styles.searchWrapper}>
             <Ionicons name="search-outline" size={20} color="#94A3B8" />
             <TextInput 
               placeholder="Find classes or sections..." 
               placeholderTextColor="#94A3B8"
               style={styles.searchInput}
               value={searchQuery}
               onChangeText={setSearchQuery}
             />
          </View>

          {/* Classes List */}
          <View style={styles.listContainer}>
            {classes
              .filter(c => (c.className || c.name)?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item, index) => (
                <ClassCard key={item.id} item={item} index={index} delay={index * 50} onDelete={handleDelete} onAssign={handleOpenAssign} />
              ))}
          </View>
        </ScrollView>
      )}

      {/* Assign Teacher Modal */}
      <Modal visible={isAssignModalOpen} transparent animationType="fade">
         <View style={styles.assignOverlay}>
            <View style={styles.assignContent}>
               <Text style={styles.assignTitle}>Assign Class Teacher</Text>
               
               <View style={styles.assignField}>
                  <Text style={styles.assignLabel}>Class</Text>
                  <View style={styles.readOnlyBox}>
                     <Text style={styles.readOnlyText}>{selectedClassForAssign?.className || selectedClassForAssign?.name}</Text>
                     <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                  </View>
               </View>

               <View style={styles.assignField}>
                  <Text style={styles.assignLabel}>Teacher</Text>
                  <View style={styles.pickerBox}>
                     <ScrollView style={styles.pickerList}>
              {teachers.length === 0 ? (
                <View style={styles.emptyTeachersBox}>
                   <Text style={styles.emptyTeachersText}>No teachers found</Text>
                </View>
              ) : (
                teachers.map((t, idx) => (
                  <TouchableOpacity 
                    key={t.id} 
                    style={styles.teacherOption}
                    onPress={() => setAssignForm({ ...assignForm, teacherId: t.id })}
                  >
                    <View style={styles.teacherIndexBox}>
                       <Text style={styles.teacherIndexText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.teacherDetails}>
                       <Text style={styles.teacherNameText}>
                          {t.name || (t.firstName ? `${t.firstName} ${t.lastName}` : 'Unknown Teacher')}
                       </Text>
                       <Text style={styles.teacherEmailText}>{t.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
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
                  <TouchableOpacity style={styles.assignSaveBtn} onPress={handleUpdateAssignment}>
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

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header - Student Pattern
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 15,
    backgroundColor: '#FAFAFF',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  welcomeText: { fontSize: 16, fontWeight: '500', color: '#4F46E5' },
  userNameHighlight: { color: '#4F46E5', fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { padding: 4 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#A78BFA', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  avatarInitial: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  addNewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4F46E5', paddingHorizontal: 12, height: 40, borderRadius: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  addNewBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  statCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0', width: '31%', minHeight: 100 },
  statIconCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginTop: 2 },
  statTitle: { fontSize: 8, fontWeight: '700', color: '#6B7280', marginTop: 6, textAlign: 'center', width: '100%', textTransform: 'uppercase' },

  // Search
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, paddingHorizontal: 14, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', marginTop: 20, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13, color: '#1F2937', fontWeight: '500' },

  // Cards
  listContainer: { paddingHorizontal: 20 },
  classCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  classMainInfo: { flex: 1, marginLeft: 10 },
  className: { fontSize: 15, fontWeight: '700', color: '#111827' },
  classSubtitle: { fontSize: 11, color: '#94A3B8', marginTop: 1, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 6 },
  circleActionBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  metricsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricItem: { alignItems: 'center', flex: 1 },
  metricDivider: { width: 1, height: 30, backgroundColor: '#F1F5F9' },
  metricLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginBottom: 4 },
  metricVal: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  statusPill: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#4F46E5' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  teacherInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teacherAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  teacherInitial: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  teacherLabel: { fontSize: 8, color: '#94A3B8', fontWeight: '800' },
  teacherName: { fontSize: 12, color: '#1E293B', fontWeight: '700' },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  manageBtnText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#FFF' },
  modalSheet: { flex: 1, backgroundColor: '#FFF', padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 30 },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  inputSection: { marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 15 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 8 },
  premiumInput: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 14, color: '#1E293B', fontWeight: '600', borderWidth: 1, borderColor: '#F1F5F9' },
  primarySubmitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  changeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
  changeBtnText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },

  assignOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  assignContent: { backgroundColor: '#FFF', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  assignTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
  assignField: { marginBottom: 18 },
  assignLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  readOnlyBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', height: 50, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  readOnlyText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  pickerBox: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 5 },
  teacherOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  teacherOptionActive: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  teacherIndexBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  teacherIndexText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  teacherDetails: { flex: 1 },
  teacherNameText: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  teacherNameTextActive: { color: '#4F46E5' },
  teacherEmailText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  removeAssignmentBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 12, backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECACA', gap: 10 },
  removeAssignmentText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  emptyTeachersBox: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTeachersText: { fontSize: 14, color: '#94A3B8', fontWeight: '500', fontStyle: 'italic' },
  assignFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 15, marginTop: 15 },
  assignCancelBtn: { paddingHorizontal: 15, paddingVertical: 10 },
  assignCancelText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  assignSaveBtn: { backgroundColor: '#2563EB', paddingHorizontal: 25, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  assignSaveText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

export default PrincipalClassesScreen;
