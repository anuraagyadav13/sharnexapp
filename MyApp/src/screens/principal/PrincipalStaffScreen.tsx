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
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import ScaleButton from '../../components/animations/ScaleButton';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

const StatCard = React.memo(({ iconBg, iconColor, icon, value, label }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statIconTextBox}>
      <View style={[styles.statIconBoxSquare, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
));

const StaffCard = ({ item, delay }: any) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.staffCard}>
    {/* Header */}
    <View style={styles.staffCardHeader}>
      <View style={styles.staffBox}>
        <Text style={styles.staffBoxText}>{item.code}</Text>
      </View>
      <View style={styles.staffCardTitleContainer}>
        <Text style={styles.staffCardTitle}>{item.name}</Text>
        <Text style={styles.staffCardSubtitle}>ID : {item.idNumber}</Text>
      </View>
      <View style={styles.staffCardActions}>
        <TouchableOpacity style={styles.actionBtnIcon}><Ionicons name="eye" size={16} color="#111827" /></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnIcon}><Ionicons name="create-outline" size={16} color="#111827" /></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnIcon}><Ionicons name="trash" size={16} color="#111827" /></TouchableOpacity>
      </View>
    </View>
    
    <View style={styles.staffCardDivider} />
    
    {/* Body */}
    <View style={styles.staffCardInfoContainer}>
      <View style={[styles.staffCardInfoCol, { paddingLeft: 0 }]}>
        <Text style={[styles.staffCardInfoLabel, { textTransform: 'uppercase' }]}>Department</Text>
        <View style={styles.deptPill}>
          <Text style={styles.deptPillText}>{item.department}</Text>
        </View>
      </View>
      <View style={styles.verticalDivider} />
      <View style={[styles.staffCardInfoCol, { paddingLeft: 12 }]}>
        <Text style={styles.staffCardInfoLabel}>Position</Text>
        <Text style={styles.staffCardInfoValue}>{item.position}</Text>
      </View>
      <View style={styles.verticalDivider} />
      <View style={[styles.staffCardInfoCol, { paddingLeft: 12 }]}>
        <Text style={styles.staffCardInfoLabel}>Face Enrollment</Text>
        <View style={styles.enrollPill}>
          <Text style={styles.enrollPillText}>{item.faceEnrollment}</Text>
        </View>
      </View>
    </View>
    
    {/* Footer */}
    <View style={styles.staffCardFooterRow}>
      <View style={styles.statusView}>
        <View style={[styles.statusDot, { backgroundColor: item.status === 'Active' ? '#10B981' : '#F59E0B' }]} />
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
      <Text style={styles.staffEmailText}>{item.email}</Text>
    </View>
  </Animated.View>
);

const ClassAssignmentCard = ({ item, delay, onAssign }: any) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.assignmentCard}>
    <View style={styles.assignmentHeader}>
      <Text style={styles.assignmentTitle}>{item.className}</Text>
      <View style={styles.assignedPill}>
        <Text style={styles.assignedPillText}>{item.status}</Text>
      </View>
    </View>
    <Text style={styles.assignmentTeacherName}>{item.teacherName}</Text>
    <Text style={styles.assignmentSubtitle}>Class Teacher</Text>
    <TouchableOpacity style={styles.changeTeacherBtn} onPress={onAssign}>
      <Text style={styles.changeTeacherBtnText}>Change Teacher</Text>
    </TouchableOpacity>
  </Animated.View>
);

const PrincipalStaffScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  
  // Fetch staff from API
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiClient.get(ENDPOINTS.PRINCIPAL.STAFF);
        const data = res.data.data || res.data;
        // Map API response to component's expected format
        const staff = data.staff || data || [];
        setStaffList(staff);
      } catch (err: any) {
        console.error('Failed to fetch staff:', err);
        setError(err.message || 'Failed to load staff data');
        setStaffList([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAssignments = async () => {
      try {
        setIsLoadingAssignments(true);
        const res = await apiClient.get(ENDPOINTS.PRINCIPAL.CLASSES);
        const data = res.data.data || res.data;
        // Map API response to component's expected format
        const assignments = (data.classes || data || []).map((cls: any) => ({
          className: cls.name || cls.className,
          teacherName: cls.classTeacher?.name || 'Not Assigned',
          status: cls.classTeacher ? 'Assigned' : 'Not Assigned',
          classId: cls.id,
          teacherId: cls.classTeacher?.id
        }));
        setAssignmentsList(assignments);
      } catch (err: any) {
        console.error('Failed to fetch assignments:', err);
        setError(err.message || 'Failed to load assignments data');
        setAssignmentsList([]);
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    fetchStaff();
    fetchAssignments();
  }, []);

  // Handle assign class teacher
  const handleAssignTeacher = async () => {
    if (!selectedClass || !selectedTeacher) {
      Alert.alert('Error', 'Please select both class and teacher');
      return;
    }

    try {
      await apiClient.post(`${ENDPOINTS.PRINCIPAL.CLASSES}/${selectedClass}/assign-teacher`, {
        teacherId: selectedTeacher
      });

      // Update assignments list
      setAssignmentsList(assignmentsList.map(assignment =>
        assignment.classId === selectedClass
          ? { ...assignment, teacherName: staffList.find(s => s.id === selectedTeacher)?.name || 'Assigned', status: 'Assigned' }
          : assignment
      ));

      setAssignModalOpen(false);
      setSelectedClass('');
      setSelectedTeacher('');
      Alert.alert('Success', 'Class teacher assigned successfully');
    } catch (err: any) {
      console.error('Failed to assign teacher:', err);
      Alert.alert('Error', 'Failed to assign class teacher');
    }
  };

  // Retry function
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Re-fetch data
    const fetchStaff = async () => {
      try {
        const res = await apiClient.get(ENDPOINTS.PRINCIPAL.STAFF);
        const data = res.data.data || res.data;
        const staff = data.staff || data || [];
        setStaffList(staff);
      } catch (err: any) {
        setError(err.message || 'Failed to load staff data');
        setStaffList([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();
  };

  // Filter staff by search
  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.globalHeader}>
        <TouchableOpacity style={styles.menuHandle} onPress={() => setDrawerOpen(true)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Ionicons name="menu" size={26} color="#4B5563" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Welcome back, {authState.user?.name?.split(' ')[0] || 'Admin'}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnTransparent}><Ionicons name="notifications-outline" size={20} color="#4B5563" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent} onPress={() => navigation.navigate('AccountSettings')}><Ionicons name="settings-outline" size={20} color="#4B5563" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent}><Ionicons name="moon-outline" size={20} color="#4B5563" /></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}><View style={styles.avatar}><Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'A'}</Text></View></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionPadding}>
          
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.screenTitle}>Teaching Staff</Text>
                <Text style={styles.screenSubtitle}>Manage teaching and administrative staff members.</Text>
              </View>
              <TouchableOpacity style={styles.markAttendanceBtn} activeOpacity={0.8} onPress={() => navigation.navigate('PrincipalMarkStaffAttendance')}>
                <Text style={styles.markAttendanceBtnText}>Mark Attendance</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stat Cards */}
          <View style={styles.statCardsRow}>
            <StatCard
              iconBg="#F3E8FF"
              iconColor="#A855F7"
              icon="people"
              value={staffList.length.toString()}
              label="Total Teachers"
            />
            <StatCard
              iconBg="#EFF6FF"
              iconColor="#3B82F6"
              icon="school"
              value={assignmentsList.filter(a => a.status === 'Assigned').length.toString()}
              label="Assigned Classes"
            />
            <StatCard
              iconBg="#ECFDF5"
              iconColor="#10B981"
              icon="person-add"
              value={staffList.filter(s => s.status === 'Active').length.toString()}
              label="Active Staff"
            />
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarRow}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search staff by name, department or id..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filters Row */}
          <View style={styles.filtersRow}>
            <TouchableOpacity style={styles.filterDropdown}>
              <Text style={styles.filterDropdownText}>All Departments</Text>
              <Ionicons name="chevron-down" size={14} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterDropdown}>
              <Text style={styles.filterDropdownText}>All Status</Text>
              <Ionicons name="chevron-down" size={14} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addStaffBtn} onPress={() => navigation.navigate('PrincipalAddStaff')}>
              <Text style={styles.addStaffBtnText}>+ Add Staff</Text>
            </TouchableOpacity>
          </View>

          {/* Staff Directory */}
          <Text style={styles.sectionHeading}>Staff Directory</Text>
          <View style={styles.listContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 40 }} />
            ) : error && filteredStaff.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.emptyText}>Failed to load staff</Text>
                <TouchableOpacity onPress={handleRetry}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredStaff.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No staff found</Text>
              </View>
            ) : (
              filteredStaff.map((item, index) => (
                <StaffCard key={item.id} item={item} delay={100 + index * 50} />
              ))
            )}
          </View>

          {/* Assignments */}
          <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Class Teacher Assignments</Text>
          <View style={styles.assignmentsGridContainer}>
            {isLoadingAssignments ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 40 }} />
            ) : assignmentsList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="school-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No classes found</Text>
              </View>
            ) : (
              assignmentsList.map((item, index) => (
                <ClassAssignmentCard
                  key={item.classId || index}
                  item={item}
                  delay={200 + index * 50}
                  onAssign={() => {
                    setSelectedClass(item.classId);
                    setAssignModalOpen(true);
                  }}
                />
              ))
            )}
          </View>

        </View>
      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />

      {/* Assign Class Teacher Modal */}
      <Modal visible={isAssignModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(200)} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Class Teacher</Text>

            <View style={styles.modalFormRow}>
              <Text style={styles.modalLabel}>Class</Text>
              <TouchableOpacity style={styles.modalSelect} onPress={() => {}}>
                <Text style={styles.modalSelectText}>
                  {assignmentsList.find(a => a.classId === selectedClass)?.className || 'Select Class'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFormRow}>
              <Text style={styles.modalLabel}>Teacher</Text>
              <TouchableOpacity style={styles.modalSelect} onPress={() => {}}>
                <Text style={styles.modalSelectText}>
                  {staffList.find(s => s.id === selectedTeacher)?.name || 'Select Teacher'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => {
                setAssignModalOpen(false);
                setSelectedClass('');
                setSelectedTeacher('');
              }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAssignTeacher}>
                <Text style={styles.modalSaveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  sectionPadding: { paddingHorizontal: 16 },

  // Header 
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
    zIndex: 10
  },
  menuHandle: { paddingRight: 4, paddingVertical: 8 },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#A78BFA',
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  titleSection: { marginTop: 20, marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#3B82F6', letterSpacing: -0.25 },
  screenSubtitle: { color: '#6B7280', fontSize: 11, marginTop: 4, lineHeight: 16 },
  markAttendanceBtn: { 
    backgroundColor: '#3B82F6', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 14,
    shadowColor: '#1E293B', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 20, 
    elevation: 6,
    justifyContent: 'center',
  },
  markAttendanceBtnText: { color: '#FFF', fontWeight: '600', fontSize: 12 },

  statCardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  statIconTextBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  statIconBoxSquare: { width: 20, height: 20, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827', alignSelf: 'flex-start', marginLeft: 28 },

  searchBarRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 44, 
    marginBottom: 12, 
    shadowColor: '#1E293B', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 20, 
    elevation: 6 
  },
  searchBarInput: { flex: 1, fontSize: 13, color: '#111827' },

  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterDropdownText: { fontSize: 11, color: '#4B5563', fontWeight: '500' },
  addStaffBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  addStaffBtnText: { color: '#FFF', fontWeight: '600', fontSize: 12 },

  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  
  // Staff Card
  listContainer: { gap: 12 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 12,
  },
  retryText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 8,
  },
  staffCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  staffCardHeader: { flexDirection: 'row', alignItems: 'center' },
  staffBox: { width: 32, height: 32, borderRadius: 6, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  staffBoxText: { color: '#FFF', fontWeight: '700', fontSize: 11 },
  staffCardTitleContainer: { flex: 1, marginLeft: 12 },
  staffCardTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  staffCardSubtitle: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  staffCardActions: { flexDirection: 'row', gap: 12 },
  actionBtnIcon: { padding: 2 },
  
  staffCardDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  staffCardInfoContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  staffCardInfoCol: { flex: 1, alignItems: 'flex-start' },
  staffCardInfoLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', marginBottom: 6 },
  staffCardInfoValue: { fontSize: 11, color: '#111827', fontWeight: '600', marginLeft: 2 },
  deptPill: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  deptPillText: { color: '#3B82F6', fontSize: 10, fontWeight: '600' },
  enrollPill: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  enrollPillText: { color: '#10B981', fontSize: 10, fontWeight: '600' },
  verticalDivider: { width: 1, height: 36, backgroundColor: '#F3F4F6', marginHorizontal: 2 },

  staffCardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  statusView: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  staffEmailText: { fontSize: 11, color: '#4B5563' },

  // Assignment Cards
  assignmentsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  assignmentCard: {
    width: '48%', // roughly 2 columns with gap
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#10B981', // green border
    borderRadius: 16,
    padding: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  assignmentTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  assignedPill: { backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  assignedPillText: { fontSize: 9, color: '#FFF', fontWeight: '600' },
  assignmentTeacherName: { fontSize: 12, fontWeight: '600', color: '#111827', marginBottom: 2 },
  assignmentSubtitle: { fontSize: 10, color: '#9CA3AF', marginBottom: 8 },
  changeTeacherBtn: { 
    backgroundColor: '#EFF6FF', 
    paddingVertical: 14,
    paddingHorizontal: 20, 
    borderRadius: 8, 
    alignItems: 'center',
    marginTop: 4,
  },
  changeTeacherBtnText: { fontSize: 11, color: '#3B82F6', fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, width: '100%', maxWidth: 400, padding: 24, paddingBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 20 },
  modalFormRow: { marginBottom: 20 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  modalSelect: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10 },
  modalSelectText: { fontSize: 13, color: '#374151' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 24, gap: 20 },
  modalCancelText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  modalSaveBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 8 },
  modalSaveBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

});


export default PrincipalStaffScreen;
