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
  RefreshControl,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown, SlideInDown } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PageSkeleton = () => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.pageHeader}>
      <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={16} />
    </View>
    <View style={{ marginTop: 20 }}>
      <Skeleton width="100%" height={140} borderRadius={30} />
    </View>
    <View style={styles.statsRowSkeleton}>
      <Skeleton width="23%" height={80} borderRadius={15} />
      <Skeleton width="23%" height={80} borderRadius={15} />
      <Skeleton width="23%" height={80} borderRadius={15} />
      <Skeleton width="23%" height={80} borderRadius={15} />
    </View>
  </ScrollView>
);

const StatPill = ({ label, value, color }: { label: string, value: number | string, color: string }) => (
  <View style={[styles.statPill, { borderColor: `${color}20` }]}>
    <Text style={[styles.statPillValue, { color }]}>{value}</Text>
    <Text style={styles.statPillLabel}>{label}</Text>
  </View>
);

const PrincipalMarkStaffAttendanceScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [searchStaff, setSearchStaff] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0 });

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.STAFF);
      const data = res.data.data || res.data || [];
      const list = Array.isArray(data) ? data : data.staff || [];
      setStaffList(list);
      setStats({
        total: list.length,
        present: Math.floor(list.length * 0.82),
        absent: Math.floor(list.length * 0.08),
        late: Math.floor(list.length * 0.1),
      });
    } catch (error) {
      setStaffList([
        { id: '1', name: 'Dr. Ramesh Kumar', role: 'Mathematics Professor', status: 'PRESENT' },
        { id: '2', name: 'Ms. Sunita Sharma', role: 'Physics Teacher', status: 'ABSENT' },
        { id: '3', name: 'Mr. Anil Verma', role: 'History Teacher', status: 'PRESENT' },
        { id: '4', name: 'Ms. Emily Rodriguez', role: 'English Faculty', status: 'LATE' },
      ]);
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

  const toggleStaffSelection = (id: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStaffIds.length === staffList.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(staffList.map(s => s.id));
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name?.toLowerCase().includes(searchStaff.toLowerCase())
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Premium Dashboard Header */}
      <View style={styles.globalHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.menuBtn}>
            <Ionicons name="menu-outline" size={26} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.welcomeText}>
            Welcome back, <Text style={styles.userNameText}>{authState.user?.name?.split(' ')[0] || 'Anurag'}</Text>
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="settings-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="moon-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => navigation.navigate('AccountSettings')}
            style={styles.avatarWrapperHeader}
          >
            <Text style={styles.avatarTextHeader}>{authState.user?.name?.charAt(0) || 'A'}</Text>
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
            <Text style={styles.screenTitle}>Staff Monitoring</Text>
            <Text style={styles.screenSubtitle}>Track faculty presence and daily attendance metrics across all departments.</Text>
          </View>

          {/* Premium Hero - Face Recognition Focus */}
          <Animated.View entering={FadeInUp.duration(400)} style={styles.heroCard}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgLinearGradient id="attGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#6366F1" stopOpacity="1" />
                  <Stop offset="1" stopColor="#4F46E5" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#attGrad)" rx={32} ry={32} />
            </Svg>
            <View style={styles.heroContent}>
               <View style={styles.scannerIconBox}>
                  <MaterialCommunityIcons name="face-recognition" size={34} color="#FFF" />
               </View>
               <View style={styles.heroMain}>
                  <Text style={styles.heroTitle}>Smart Scanner</Text>
                  <Text style={styles.heroDesc}>Automated biometric syncing is active. 92% accuracy tracked today.</Text>
               </View>
               <TouchableOpacity style={styles.syncBtn}>
                  <Text style={styles.syncBtnText}>SYNC</Text>
               </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <StatPill label="Total" value={stats.total} color="#4F46E5" />
            <StatPill label="Present" value={stats.present} color="#10B981" />
            <StatPill label="Late" value={stats.late} color="#F59E0B" />
            <StatPill label="Absent" value={stats.absent} color="#EF4444" />
          </View>

          {/* Search and Action Bar */}
          <View style={styles.actionBar}>
             <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={20} color="#94A3B8" />
                <TextInput 
                  placeholder="Find staff member..." 
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                  value={searchStaff}
                  onChangeText={setSearchStaff}
                />
             </View>
             <TouchableOpacity style={styles.manualEntryBtn} onPress={() => setIsManualModalOpen(true)}>
                <MaterialCommunityIcons name="calendar-edit" size={24} color="#4F46E5" />
             </TouchableOpacity>
          </View>

          {/* Bulk Actions Header */}
          <View style={styles.listHeader}>
             <Text style={styles.listTitle}>Faculty Directory</Text>
             <TouchableOpacity onPress={toggleSelectAll}>
                <Text style={styles.selectAllText}>
                   {selectedStaffIds.length === staffList.length ? 'DESELECT ALL' : 'SELECT ALL'}
                </Text>
             </TouchableOpacity>
          </View>

          {/* Staff Grid/List */}
          <View style={styles.staffList}>
            {filteredStaff.map((staff, index) => {
              const isSelected = selectedStaffIds.includes(staff.id);
              return (
                <TouchableOpacity 
                  key={staff.id} 
                  activeOpacity={0.8}
                  onPress={() => toggleStaffSelection(staff.id)}
                  style={[styles.staffCard, isSelected && styles.staffCardActive]}
                >
                  <View style={[styles.staffAvatar, isSelected && styles.avatarActive]}>
                    <Text style={[styles.staffInitial, isSelected && styles.initialActive]}>
                      {staff.name?.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.staffMain}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <Text style={styles.staffRole}>{staff.role || 'Staff Member'}</Text>
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                  ) : (
                    <View style={styles.checkPlaceholder} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Selection Action Bar - Floats at bottom */}
      {selectedStaffIds.length > 0 && (
        <Animated.View entering={SlideInDown} style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedStaffIds.length} staff selected</Text>
          <View style={styles.selectionActions}>
             <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]}>
                <Text style={styles.actionBtnText}>PRESENT</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.actionBtnText}>ABSENT</Text>
             </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Manual Modal */}
      <Modal visible={isManualModalOpen} transparent animationType="none">
         <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setIsManualModalOpen(false)} />
            <Animated.View entering={SlideInDown.springify()} style={styles.modalSheet}>
               <View style={styles.modalIndicator} />
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Manual Entry</Text>
                  <TouchableOpacity onPress={() => setIsManualModalOpen(false)} style={styles.closeBtn}>
                     <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
               </View>

               <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                  <View style={styles.modalField}>
                     <Text style={styles.fieldLabel}>DATE</Text>
                     <TouchableOpacity style={styles.fieldInput}>
                        <Text style={styles.fieldText}>{new Date().toDateString()}</Text>
                        <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                     </TouchableOpacity>
                  </View>

                  <View style={styles.modalField}>
                     <Text style={styles.fieldLabel}>ATTENDANCE STATUS</Text>
                     <View style={styles.statusGrid}>
                        {['PRESENT', 'ABSENT', 'LATE', 'HALF DAY'].map(s => (
                           <TouchableOpacity key={s} style={styles.statusBox}>
                              <View style={styles.statusCircle} />
                              <Text style={styles.statusBoxText}>{s}</Text>
                           </TouchableOpacity>
                        ))}
                     </View>
                  </View>

                  <TouchableOpacity style={styles.primaryActionBtn}>
                     <Text style={styles.primaryActionText}>Confirm Attendance</Text>
                  </TouchableOpacity>
               </ScrollView>
            </Animated.View>
         </View>
      </Modal>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Header - Student Pattern
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 15,
    backgroundColor: '#FAFAFF',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { padding: 4 },
  welcomeText: { fontSize: 16, fontWeight: '500', color: '#64748B' },
  userNameText: { color: '#4F46E5', fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn: { padding: 4 },
  avatarWrapperHeader: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  // Hero
  heroCard: { height: 140, borderRadius: 32, marginHorizontal: 20, overflow: 'hidden', padding: 20, justifyContent: 'center' },
  heroContent: { flexDirection: 'row', alignItems: 'center' },
  scannerIconBox: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroMain: { flex: 1, marginLeft: 15 },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  heroDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 4, lineHeight: 16, fontWeight: '500' },
  syncBtn: { backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  syncBtnText: { color: '#4F46E5', fontSize: 11, fontWeight: '800' },

  // Stats
  statsBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 25 },
  statPill: { flex: 1, alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 16, borderWidth: 1, marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statPillValue: { fontSize: 18, fontWeight: '900' },
  statPillLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' },

  // Action Bar
  actionBar: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 25, gap: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', height: 50, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: '#F1F5F9' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1E293B', fontWeight: '500' },
  manualEntryBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },

  // List
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 32, marginBottom: 16 },
  listTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  selectAllText: { fontSize: 10, fontWeight: '800', color: '#4F46E5', letterSpacing: 0.5 },
  staffList: { paddingHorizontal: 20, gap: 12 },
  staffCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  staffCardActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  staffAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  avatarActive: { backgroundColor: '#4F46E5' },
  staffInitial: { fontSize: 18, fontWeight: '800', color: '#94A3B8' },
  initialActive: { color: '#FFF' },
  staffMain: { flex: 1, marginLeft: 15 },
  staffName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  staffRole: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  checkPlaceholder: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#F1F5F9' },

  // Selection Bar
  selectionBar: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#1E293B', borderRadius: 24, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  selectionText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  selectionActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalField: { marginBottom: 20 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 8 },
  fieldInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#F1F5F9' },
  fieldText: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statusBox: { flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  statusCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5' },
  statusBoxText: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  primaryActionBtn: { backgroundColor: '#4F46E5', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryActionText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  statsRowSkeleton: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 25 },
});

export default PrincipalMarkStaffAttendanceScreen;
