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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
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
      {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={120} borderRadius={20} style={{ marginBottom: 16 }} />)}
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

const StaffCard = ({ item, index, delay, onDelete }: any) => {
  const navigation = useNavigation<any>();
  const displayName = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Staff Member';
  const brandColor = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 5];
  
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.staffCard}>
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
             <Ionicons name="eye-outline" size={18} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PrincipalEditStaff', { staffId: item.id, initialData: item })} style={styles.actionBtn}>
             <Ionicons name="pencil-outline" size={18} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.actionBtn, { borderColor: '#FEE2E2' }]}>
             <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}><Text style={styles.badgeText}>{item.department || 'Teacher'}</Text></View>
        <View style={[styles.badge, { backgroundColor: item.isEnrolled ? '#D1FAE5' : '#FEF3C7' }]}>
           <Text style={[styles.badgeText, { color: item.isEnrolled ? '#065F46' : '#92400E' }]}>
              {item.isEnrolled ? 'Enrolled' : 'Not Enrolled'}
           </Text>
        </View>
        <View style={styles.statusBadge}><Text style={styles.statusText}>{item.status || 'Active'}</Text></View>
      </View>

      <View style={styles.contactFooter}>
        <View style={styles.contactItem}>
          <Ionicons name="mail-outline" size={12} color="#94A3B8" />
          <Text style={styles.contactText} numberOfLines={1}>{item.email || 'no-email@school.com'}</Text>
        </View>
        <View style={styles.contactItem}>
          <Ionicons name="call-outline" size={12} color="#94A3B8" />
          <Text style={styles.contactText}>{item.phone || '+91 000000000'}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const PrincipalStaffScreen = ({ navigation }: any) => {
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
      if (!isRefreshing) setIsLoading(true);
      const [staffRes, classRes] = await Promise.all([
        apiClient.get(ENDPOINTS.PRINCIPAL.STAFF),
        apiClient.get(ENDPOINTS.PRINCIPAL.CLASSES)
      ]);
      
      const staffData = staffRes.data.data || staffRes.data.staff || staffRes.data || [];
      const statsData = staffRes.data.stats || { total: Array.isArray(staffData) ? staffData.length : 0, active: 0, onLeave: 0 };
      setStaffList(Array.isArray(staffData) ? staffData : []);
      setStats(statsData);

      const classData = classRes.data.data || classRes.data || [];
      const classList = Array.isArray(classData) ? classData : classData.classes || [];
      setClasses(classList);
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
      
      // Optimistic Update
      setClasses(prev => prev.map(c => 
        c.id === assignForm.classId ? { ...c, teacher: teacherName, teacherId: finalTeacherId } : c
      ));

      setIsLoading(true);
      await apiClient.post(`${ENDPOINTS.PRINCIPAL.CLASSES}/${assignForm.classId}/assign-teacher`, {
        teacherId: finalTeacherId
      });
      setIsAssignModalOpen(false);
      fetchData(); // Sync with server
      showToast(finalTeacherId ? 'Assignment updated successfully!' : 'Assignment removed.', 'success');
    } catch (error) {
      fetchData(); // Rollback on error
      showToast('Failed to update assignment.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    const staffMember = staffList.find(s => s.id === id);
    if (!staffMember) return;

    Alert.alert('Delete Staff', `Permanently remove ${staffMember.firstName || staffMember.name} from records?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          const originalList = [...staffList];
          setStaffList(staffList.filter(s => s.id !== id));
          
          const deleteTimer = setTimeout(async () => {
            try {
              await apiClient.delete(`${ENDPOINTS.PRINCIPAL.STAFF}/${id}`);
            } catch (error) {
              setStaffList(originalList);
              showToast('Sync failed. Staff restored.', 'error');
            }
          }, 5000);

          showToast(`Deleted ${staffMember.firstName || staffMember.name}.`, 'info', () => {
             clearTimeout(deleteTimer);
             setStaffList(originalList);
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

      {/* Standard Header */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color="#4F46E5" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Staff Management</Text>
        <View style={styles.headerRight}>
           <TouchableOpacity onPress={() => navigation.navigate('PrincipalDashboard')}>
              <Ionicons name="home-outline" size={24} color="#4F46E5" />
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
             <Text style={styles.screenTitle}>Teaching Staff</Text>
             <Text style={styles.screenSubtitle}>Manage teaching and administrative staff members.</Text>
          </View>

          {/* Quick Action Row */}
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
             <Ionicons name="search-outline" size={20} color="#94A3B8" />
             <TextInput 
               placeholder="Search by name, department or id..." 
               placeholderTextColor="#94A3B8"
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
                <StaffCard key={item.id} item={item} index={index} delay={index * 50} onDelete={handleDelete} />
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

      {/* Assign Teacher Modal */}
      <Modal visible={isAssignModalOpen} transparent animationType="fade">
         <View style={styles.assignOverlay}>
            <View style={styles.assignContent}>
               <Text style={styles.assignModalTitle}>Assign Class Teacher</Text>
               
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
                                 {assignForm.teacherId === t.id && <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />}
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

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
    backgroundColor: '#FAFAFF',
  },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { width: 40, alignItems: 'flex-end' },

  pageHeader: { paddingHorizontal: 20, marginBottom: 15, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  quickActionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  actionBtnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#2563EB', height: 42, borderRadius: 10, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  actionBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  statCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0', width: '31%' },
  statIconCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  statTitle: { fontSize: 8, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', textAlign: 'center' },
 
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, paddingHorizontal: 14, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13, color: '#1F2937', fontWeight: '500' },

  listContainer: { paddingHorizontal: 20 },
  staffCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  staffId: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
 
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  badge: { backgroundColor: '#EEF2FF', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#6366F1' },
  statusBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  statusText: { fontSize: 9, fontWeight: '700', color: '#10B981' },

  contactFooter: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 15 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  contactText: { fontSize: 11, color: '#64748B', fontWeight: '500' },

  assignmentSection: { marginTop: 30, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 15 },
  assignmentScroll: { gap: 12 },
  assignmentCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, width: 200, borderWidth: 1, borderColor: '#F1F5F9' },
  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  className: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  assignedBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  assignedText: { fontSize: 9, fontWeight: '700', color: '#059669' },
  teacherName: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 12 },
  changeBtn: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10, alignItems: 'center' },
  changeBtnText: { fontSize: 11, fontWeight: '700', color: '#6366F1' },

  assignOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  assignContent: { backgroundColor: '#FFF', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  assignModalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
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

export default PrincipalStaffScreen;
