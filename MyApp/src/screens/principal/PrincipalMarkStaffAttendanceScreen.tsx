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
  ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';


const PrincipalMarkStaffAttendanceScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [searchStaff, setSearchStaff] = useState('');
  const [searchLogs, setSearchLogs] = useState('');
  const [selectedTab, setSelectedTab] = useState('All');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState('IN');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState('03/31/2026');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get(ENDPOINTS.PRINCIPAL.STAFF);
        const data = res.data.data || res.data;
        setStaffList(data.staff || data || []);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
        setStaffList([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();
  }, []);

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

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.globalHeader}>
        <View style={styles.headerRight}>
          <Text style={styles.headerTitle}>Welcome back, {authState.user?.name?.split(' ')[0] || 'Admin'}</Text>
          <TouchableOpacity style={styles.iconBtnTransparent}>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtnTransparent}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}
          >
            <Ionicons name="settings-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent}>
            <Ionicons name="moon-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'A'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Blue Title Section */}
        <View style={styles.blueHeaderBlock}>
          <View style={styles.blueHeaderRow}>
            <TouchableOpacity style={styles.backArrowBox} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.blueScreenTitle}>Staff Attendance</Text>
          <Text style={styles.blueScreenSubtitle}>Face Recognition Attendance • Principal Portal</Text>
        </View>

        <View style={styles.cardsGrid}>
          
          {/* Card 1: Face Recognition */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}><Ionicons name="camera-outline" size={14} color="#4F46E5" /></View>
              <Text style={styles.cardTitle}>Face Recognition</Text>
            </View>
            <View style={styles.dashedContainer}>
              <View style={styles.errorIconCircle}>
                <Ionicons name="warning" size={16} color="#FFF" />
              </View>
              <Text style={styles.errorTitle}>Camera Error</Text>
              <Text style={styles.errorSubtitle}>No camera found on this device.</Text>
              <TouchableOpacity style={styles.retryBtn}>
                <Ionicons name="refresh" size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Card 2: Today's Attendance */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.cardContainer}>
            <View style={styles.cardHeaderWithTabs}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.cardIconBox, { backgroundColor: '#EFF6FF' }]}><Ionicons name="checkmark-circle-outline" size={14} color="#3B82F6" /></View>
                <Text style={styles.cardTitle}>Today's Attendance</Text>
              </View>
              <View style={styles.tabsContainer}>
                {['All', 'Present', 'Absent', 'Late'].map(tab => (
                  <TouchableOpacity 
                    key={tab} 
                    style={[styles.tabBtn, selectedTab === tab && styles.tabBtnActive]}
                    onPress={() => setSelectedTab(tab)}
                  >
                    <Text style={[styles.tabBtnText, selectedTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput style={styles.searchInput} placeholder="Search in logs..." placeholderTextColor="#9CA3AF" value={searchLogs} onChangeText={setSearchLogs} />
            </View>

            <View style={styles.emptyLogsContainer}>
              <View style={styles.emptyLogsIconCircle}><Text style={{color: '#FFF', fontWeight: 'bold'}}>!</Text></View>
              <Text style={styles.emptyLogsText}>No attendance records found</Text>
            </View>
          </Animated.View>

          {/* Card 3: Quick Mark */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.cardContainer}>
            <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
              <Text style={styles.cardTitle}>Quick Mark</Text>
              <TouchableOpacity onPress={toggleSelectAll}>
                <Text style={styles.selectAllText}>
                  {selectedStaffIds.length === staffList.length ? 'DESELECT ALL' : 'SELECT ALL'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput style={styles.searchInput} placeholder="Search Staff..." placeholderTextColor="#9CA3AF" value={searchStaff} onChangeText={setSearchStaff} />
            </View>

            {selectedStaffIds.length > 0 && (
              <View style={styles.selectionToolbar}>
                <Text style={styles.selectionCountText}>{selectedStaffIds.length} selected</Text>
                <View style={styles.selectionActions}>
                  <TouchableOpacity style={styles.markInBtn}>
                    <Text style={styles.markInBtnText}>IN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.markOutBtn}>
                    <Text style={styles.markOutBtnText}>OUT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.staffListContainer}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#4F46E5" style={{ marginVertical: 20 }} />
              ) : staffList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No staff found</Text>
                </View>
              ) : (
                staffList.map((staff, idx) => {
                  const isSelected = selectedStaffIds.includes(staff.id);
                  return (
                    <TouchableOpacity 
                      key={staff.id} 
                      style={[styles.staffListItem, isSelected && styles.staffListItemSelected]}
                      onPress={() => toggleStaffSelection(staff.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.staffAvatar, isSelected && styles.staffAvatarSelected]}>
                        <Text style={[styles.staffAvatarText, isSelected && styles.staffAvatarTextSelected]}>
                          {staff.name?.charAt(0).toUpperCase() || 'S'}
                        </Text>
                      </View>
                      <Text style={styles.staffNameText}>{staff.name}</Text>
                      {isSelected && (
                        <View style={styles.checkmarkIconBox}>
                          <Ionicons name="checkmark-circle" size={18} color="#4F46E5" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </Animated.View>

          {/* Card 4: Manual Entry Form */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: '#F3F4F6' }]}><Ionicons name="refresh-outline" size={14} color="#6B7280" /></View>
              <Text style={styles.cardTitle}>Manual Entry Form</Text>
            </View>
            
            <View style={styles.manualEntryContainer}>
              <TouchableOpacity style={styles.manualMarkBtn} onPress={() => setIsManualModalOpen(true)}>
                <Ionicons name="person-add" size={16} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.manualMarkBtnText}>Mark Attendance Manually</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

        </View>
      </ScrollView>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />

      {/* Manual Attendance Modal */}
      <Modal visible={isManualModalOpen} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View entering={FadeInUp.duration(300)} style={styles.modalContent}>
            
            <View style={styles.modalHeaderContainer}>
              <Text style={styles.modalHeaderTitle}>Manual Attendance</Text>
              <TouchableOpacity onPress={() => setIsManualModalOpen(false)}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Teacher</Text>
            <View style={styles.dropdownInput}>
              <Text style={styles.dropdownPlaceholder}>Select a teacher</Text>
              <Ionicons name="chevron-down" size={16} color="#4B5563" />
            </View>

            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity 
              style={styles.dateInput} 
              activeOpacity={0.7}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Text style={styles.dateText}>{selectedDate}</Text>
              <Ionicons name="calendar-outline" size={16} color="#4B5563" />
            </TouchableOpacity>

            {showCalendar && (
              <Animated.View entering={FadeInUp.duration(200)} style={styles.calendarDropdown}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity><Ionicons name="chevron-back" size={16} color="#111827" /></TouchableOpacity>
                  <Text style={styles.calendarMonthText}>March 2026</Text>
                  <TouchableOpacity><Ionicons name="chevron-forward" size={16} color="#111827" /></TouchableOpacity>
                </View>
                <View style={styles.calendarDaysRow}>
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <Text key={d} style={styles.calendarDayLabel}>{d}</Text>
                  ))}
                </View>
                <View style={styles.calendarGrid}>
                  {/* Empty cells for starting day offset (March 1st, 2026 is Sunday) */}
                  {Array.from({ length: 31 }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `03/${day.toString().padStart(2, '0')}/2026`;
                    const isSelected = selectedDate === dateStr;
                    return (
                      <TouchableOpacity 
                        key={day} 
                        style={[styles.calendarDayCell, isSelected && styles.calendarDayCellSelected]}
                        onPress={() => {
                          setSelectedDate(dateStr);
                          setShowCalendar(false);
                        }}
                      >
                        <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>{day}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            <Text style={styles.inputLabel}>Attendance Type</Text>
            <View style={styles.attendanceTypeGroup}>
              <TouchableOpacity 
                style={[styles.typeBtn, attendanceType === 'IN' && styles.typeBtnActive]}
                onPress={() => setAttendanceType('IN')}
              >
                <Text style={[styles.typeBtnText, attendanceType === 'IN' && styles.typeBtnTextActive]}>Check IN</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, attendanceType === 'OUT' && styles.typeBtnActive]}
                onPress={() => setAttendanceType('OUT')}
              >
                <Text style={[styles.typeBtnText, attendanceType === 'OUT' && styles.typeBtnTextActive]}>Check OUT</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Add any relevant notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsManualModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalMarkBtn}>
                <Text style={styles.modalMarkBtnText}>{attendanceType === 'IN' ? 'Mark IN' : 'Mark OUT'}</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFB' }, // slightly different background color for this web-like view
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },

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
  headerTitle: { fontSize: 18, fontWeight: '400', color: '#4F46E5', marginRight: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatarContainer: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    marginLeft: 8,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#A78BFA',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  // Blue Title Section
  blueHeaderBlock: {
    backgroundColor: '#4F46E5', // vibrant blue/indigo
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
  },
  blueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backArrowBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueScreenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  blueScreenSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Grid
  cardsGrid: {
    paddingHorizontal: 24,
    gap: 20,
    // On tablet, this could be flexDirection: row, flexWrap: wrap. For mobile, column.
    // In React Native, without dimensions check we'll just stack them, but use nice styling.
  },

  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cardIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

  // Card 1
  dashedContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  errorSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20, textAlign: 'center' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF6', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 8 },
  retryBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  // Card 2
  cardHeaderWithTabs: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 20, padding: 4 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 14, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,},
  tabBtnText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  tabBtnTextActive: { color: '#FFF' },

  searchBarContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 8, 
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  searchInput: { flex: 1, fontSize: 13, color: '#111827' },

  emptyLogsContainer: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLogsIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyLogsText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },

  // Card 3
  selectAllText: { color: '#4F46E5', fontSize: 11, fontWeight: '700' },
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    marginTop: -8, // tuck slightly closer to the search bar
  },
  selectionCountText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 12,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  markInBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,},
  markInBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  markOutBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  markOutBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  staffListContainer: { gap: 8 },
  staffListItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: 'transparent' 
  },
  staffListItemSelected: {
    backgroundColor: '#FFF',
    borderColor: '#E0E7FF',
  },
  staffAvatar: { width: 32, height: 32, borderRadius: 6, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  staffAvatarSelected: {
    backgroundColor: '#4F46E5',
  },
  staffAvatarText: { color: '#4B5563', fontWeight: '700', fontSize: 13 },
  staffAvatarTextSelected: {
    color: '#FFF',
  },
  staffNameText: { fontSize: 13, fontWeight: '600', color: '#111827' },
  checkmarkIconBox: {
    marginLeft: 'auto',
  },

  // Card 4
  manualEntryContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  manualMarkBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8 },
  manualMarkBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 24,
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownPlaceholder: {
    fontSize: 13,
    color: '#374151',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 13,
    color: '#111827',
  },
  calendarDropdown: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 6,
    padding: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarMonthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  calendarDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarDayLabel: {
    width: 32,
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.28%', // 100 / 7
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: 2,
  },
  calendarDayCellSelected: {
    backgroundColor: '#8B5CF6',
  },
  calendarDayText: {
    fontSize: 13,
    color: '#111827',
  },
  calendarDayTextSelected: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  attendanceTypeGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  typeBtnActive: {
    borderColor: '#22C55E',
    backgroundColor: '#FFF',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeBtnTextActive: {
    color: '#22C55E',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 80,
    fontSize: 13,
    color: '#111827',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  modalMarkBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalMarkBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },

});

export default PrincipalMarkStaffAttendanceScreen;
