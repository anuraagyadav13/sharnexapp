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
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, SlideInDown } from 'react-native-reanimated';
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
  const [activeFilter, setActiveFilter] = useState('All');
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<{ visible: boolean; field: 'in' | 'out' }>({ visible: false, field: 'in' });
  const [editForm, setEditForm] = useState({ inTime: new Date(), outTime: new Date(), notes: '' });
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true); // Simulated camera state
  
  const showToast = (msg: string, type: string) => {
    Alert.alert(type === 'success' ? 'Success' : 'Error', msg);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const [staffRes, logsRes] = await Promise.all([
        apiClient.get(ENDPOINTS.PRINCIPAL.STAFF),
        apiClient.get(`${ENDPOINTS.PRINCIPAL.ATTENDANCE}?startDate=${today}&endDate=${today}`)
      ]);

      const staffData = staffRes.data.data || staffRes.data || [];
      const list = Array.isArray(staffData) ? staffData : staffData.staff || [];
      setStaffList(list);

      const logsData = logsRes.data.data || [];
      setAttendanceLogs(logsData.map((l: any) => ({
        id: l.id,
        teacherId: l.teacherId,
        name: l.teacherName || 'Unknown',
        idNum: l.teacherId?.substring(0, 8) || 'N/A',
        time: l.inTime ? new Date(l.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
        method: l.method || 'Scan',
        status: l.outTime ? 'Checked OUT' : 'Marked IN'
      })));

      const presentCount = logsData.length;
      setStats({
        total: list.length,
        present: presentCount,
        absent: list.length - presentCount,
        late: logsData.filter((l: any) => l.isLate).length,
      });
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

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

  const handleMarkBulkAttendance = async (type: 'IN' | 'OUT') => {
    try {
      setIsLoading(true);
      await apiClient.post(`${ENDPOINTS.PRINCIPAL.ATTENDANCE}/manual`, {
        teacherIds: selectedStaffIds,
        type: type,
        notes: `Bulk mark ${type} via mobile app`
      });
      setSelectedStaffIds([]);
      await fetchData();
      Alert.alert('Success', `Attendance ${type === 'IN' ? 'Marked' : 'Checked Out'} for ${selectedStaffIds.length} staff members.`);
    } catch (error: any) {
      Alert.alert('Action Failed', error.response?.data?.message || 'Could not process attendance.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualOut = async (logId: string, teacherId: string) => {
    try {
      setIsLoading(true);
      await apiClient.post(`${ENDPOINTS.PRINCIPAL.ATTENDANCE}/manual`, {
        teacherId,
        type: 'OUT',
        notes: 'Manual OUT via action menu'
      });
      setIsActionsVisible(false);
      await fetchData();
      Alert.alert('Success', 'Staff member marked as OUT.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark OUT.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAttendance = async (logId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to permanently remove this attendance record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setIsLoading(true);
              await apiClient.delete(`${ENDPOINTS.PRINCIPAL.ATTENDANCE}/${logId}`);
              setIsActionsVisible(false);
              await fetchData();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete record.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredStaff = staffList.filter(s => 
    s.name?.toLowerCase().includes(searchStaff.toLowerCase())
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Attendance Detail View Modal */}
      <Modal visible={isViewModalOpen} transparent animationType="slide">
         <View style={styles.detailOverlay}>
            <View style={styles.detailContent}>
               <View style={[styles.detailHeader, { backgroundColor: '#8B5CF6' }]}>
                  <View style={styles.detailHeaderInner}>
                     <View style={styles.detailAvatar}>
                        <Text style={styles.detailAvatarText}>{selectedLog?.name?.charAt(0)}</Text>
                     </View>
                     <View style={styles.detailMainInfo}>
                        <Text style={styles.detailName}>{selectedLog?.name}</Text>
                        <Text style={styles.detailId}>Teacher ID: {selectedLog?.idNum}</Text>
                     </View>
                     <TouchableOpacity onPress={() => setIsViewModalOpen(false)} style={styles.detailCloseIcon}>
                        <Ionicons name="close" size={20} color="#FFF" />
                     </TouchableOpacity>
                  </View>
               </View>

               <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.detailRow}>
                     <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>DATE</Text>
                        <View style={styles.detailValRow}>
                           <Ionicons name="calendar-outline" size={16} color="#8B5CF6" />
                           <Text style={styles.detailValText}>{new Date().toDateString()}</Text>
                        </View>
                     </View>
                     <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>STATUS</Text>
                        <View style={styles.detailValRow}>
                           <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                           <Text style={styles.detailValText}>{selectedLog?.status}</Text>
                        </View>
                     </View>
                  </View>

                  <View style={styles.timeCard}>
                     <View style={styles.timeSection}>
                        <Text style={styles.timeLabel}>CHECK IN</Text>
                        <Text style={styles.timeValue}>{selectedLog?.time}</Text>
                     </View>
                     <View style={styles.timeDivider} />
                     <View style={styles.timeSection}>
                        <Text style={styles.timeLabel}>CHECK OUT</Text>
                        <Text style={styles.timeValue}>—</Text>
                     </View>
                  </View>

                  <View style={styles.detailSection}>
                     <Text style={styles.detailLabel}>VERIFICATION METHOD</Text>
                     <View style={styles.detailValRow}>
                        <Ionicons name="create-outline" size={16} color="#F59E0B" />
                        <Text style={styles.detailValText}>{selectedLog?.method || 'Manual Entry'}</Text>
                     </View>
                  </View>

                  <View style={styles.detailSection}>
                     <Text style={styles.detailLabel}>NOTES / AUDIT LOG</Text>
                     <View style={styles.auditLogBox}>
                        <Text style={styles.auditLogText}>Bulk manual IN</Text>
                     </View>
                  </View>
               </ScrollView>

               <View style={styles.detailFooter}>
                  <TouchableOpacity 
                    style={styles.closeDetailBtn} 
                    onPress={() => setIsViewModalOpen(false)}
                  >
                     <Text style={styles.closeDetailBtnText}>Close Detail</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

      {/* Premium Dashboard Header */}
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
            <Text style={styles.screenTitle}>Staff Monitoring</Text>
            <Text style={styles.screenSubtitle}>Track faculty presence and daily attendance metrics across all departments.</Text>
          </View>

          {/* Dynamic Face Recognition Scanner */}
          <View style={styles.scannerContainer}>
             <View style={styles.scannerHeader}>
                <View style={styles.scannerTitleBox}>
                   <View style={styles.scannerIconSmall}>
                      <Ionicons name="camera" size={16} color="#6366F1" />
                   </View>
                   <Text style={styles.scannerTitleText}>Face Recognition</Text>
                </View>
                <TouchableOpacity onPress={() => setIsViewModalOpen(false)}>
                   <Ionicons name="close" size={20} color="#CBD5E1" />
                </TouchableOpacity>
             </View>

             <View style={styles.scannerDisplayArea}>
                {!cameraAvailable ? (
                   <View style={styles.errorState}>
                      <View style={styles.errorIconBox}>
                         <MaterialCommunityIcons name="alert" size={24} color="#EF4444" />
                      </View>
                      <Text style={styles.errorTitle}>Camera Error</Text>
                      <Text style={styles.errorSub}>No camera found on this device.</Text>
                      <TouchableOpacity 
                        style={styles.retryBtn}
                        onPress={() => {
                          setIsLoading(true);
                          setTimeout(() => {
                            setIsLoading(false);
                            setCameraAvailable(true);
                          }, 1500);
                        }}
                      >
                         <Ionicons name="refresh" size={16} color="#FFF" />
                         <Text style={styles.retryText}>Retry</Text>
                      </TouchableOpacity>
                   </View>
                ) : (
                   <View style={styles.liveScannerArea}>
                      <View style={styles.scannerFrame}>
                         <View style={styles.scannerCornerTL} />
                         <View style={styles.scannerCornerTR} />
                         <View style={styles.scannerCornerBL} />
                         <View style={styles.scannerCornerBR} />
                         <Animated.View 
                           style={[styles.scannerLine]} 
                         />
                         <View style={styles.scannerCenterIcon}>
                            <MaterialCommunityIcons name="face-recognition" size={40} color="rgba(99, 102, 241, 0.2)" />
                         </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.stopScannerBtn}
                        onPress={() => setCameraAvailable(false)}
                      >
                         <Text style={styles.stopScannerText}>Deactivate Scanner</Text>
                      </TouchableOpacity>
                   </View>
                )}
             </View>
          </View>

          {/* Today's Attendance Log Section */}
          <View style={[styles.scannerSection, { marginTop: 25 }]}>
             <View style={styles.sectionHeaderInner}>
                <View style={styles.sectionTitleRowInner}>
                   <Ionicons name="checkmark-circle-outline" size={20} color="#4F46E5" />
                   <Text style={styles.innerSectionTitle}>Today's Attendance</Text>
                </View>
                <View style={styles.filterPills}>
                   {['All', 'Present', 'Absent', 'Late'].map(f => (
                      <TouchableOpacity 
                        key={f} 
                        style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
                        onPress={() => setActiveFilter(f)}
                      >
                         <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>{f}</Text>
                      </TouchableOpacity>
                   ))}
                </View>
             </View>

             <View style={styles.searchBarInner}>
                <Ionicons name="search-outline" size={16} color="#94A3B8" />
                <TextInput placeholder="Search in logs..." style={styles.innerSearchInput} />
             </View>

             <View style={styles.logsTable}>
                {/* Attendance Cards */}
                <View style={styles.logList}>
                  {attendanceLogs.map((log, index) => (
                    <View 
                      key={log.id} 
                      style={styles.logCard}
                    >
                      <View style={styles.logCardMain}>
                         <View style={styles.miniAvatar}>
                            <Text style={styles.miniAvatarText}>{log.name.charAt(0)}</Text>
                         </View>
                         <View style={styles.logInfo}>
                            <Text style={styles.logName}>{log.name}</Text>
                            <Text style={styles.logSub}>{log.idNum} • {log.time}</Text>
                         </View>
                         <View style={styles.logActions}>
                            <TouchableOpacity 
                              style={styles.miniActionBtn}
                              onPress={() => {
                                setSelectedLog(log);
                                setIsViewModalOpen(true);
                              }}
                            >
                               <Ionicons name="eye-outline" size={16} color="#6366F1" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.miniActionBtn}
                              onPress={() => {
                                setSelectedLog(log);
                                setEditForm({
                                  inTime: new Date(),
                                  outTime: new Date(),
                                  notes: 'Manual OUT via action menu'
                                });
                                setIsEditModalOpen(true);
                              }}
                            >
                               <Ionicons name="pencil-outline" size={16} color="#6366F1" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.miniActionBtn}
                              onPress={() => handleManualOut(log.id, log.teacherId)}
                            >
                               <Ionicons name="log-out-outline" size={16} color="#F59E0B" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.miniActionBtn, { borderColor: '#FEE2E2' }]}
                              onPress={() => handleDeleteAttendance(log.id)}
                            >
                               <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                         </View>
                      </View>
                      <View style={styles.logBadgeRow}>
                         <View style={styles.logStatusPill}>
                            <View style={[styles.statusDot, { backgroundColor: log.status.includes('OUT') ? '#EF4444' : '#10B981' }]} />
                            <Text style={styles.logStatusText}>{log.status}</Text>
                         </View>
                         <View style={styles.methodBadge}>
                            <Ionicons name="scan-outline" size={10} color="#64748B" />
                            <Text style={styles.methodText}>{log.method}</Text>
                         </View>
                      </View>
                    </View>
                  ))}
                </View>
             </View>
          </View>

          {/* Quick Mark Section */}
          <View style={[styles.scannerSection, { marginTop: 25 }]}>
             <View style={styles.sectionHeaderInner}>
                <Text style={styles.innerSectionTitle}>Quick Mark</Text>
                <TouchableOpacity onPress={toggleSelectAll}>
                   <Text style={styles.selectAllBtnText}>SELECT ALL</Text>
                </TouchableOpacity>
             </View>
             <View style={styles.searchBarInner}>
                <Ionicons name="search-outline" size={16} color="#94A3B8" />
                <TextInput 
                   placeholder="Search Staff..." 
                   style={styles.innerSearchInput}
                   value={searchStaff}
                   onChangeText={setSearchStaff}
                />
             </View>
             <View style={styles.quickMarkList}>
                {filteredStaff.slice(0, 4).map(staff => (
                   <TouchableOpacity 
                      key={staff.id} 
                      style={styles.quickMarkRow}
                      onPress={() => toggleStaffSelection(staff.id)}
                   >
                      <View style={styles.miniAvatar}><Text style={styles.miniAvatarText}>{staff.name.charAt(0)}</Text></View>
                      <Text style={styles.quickMarkName}>{staff.name}</Text>
                      {selectedStaffIds.includes(staff.id) && <Ionicons name="checkmark-circle" size={18} color="#4F46E5" />}
                   </TouchableOpacity>
                ))}
             </View>
          </View>

          {/* Manual Entry Form Section */}
          <View style={[styles.scannerSection, { marginTop: 25, paddingBottom: 20 }]}>
             <View style={styles.sectionHeaderInner}>
                <View style={styles.sectionTitleRowInner}>
                   <Ionicons name="create-outline" size={20} color="#4F46E5" />
                   <Text style={styles.innerSectionTitle}>Manual Entry Form</Text>
                </View>
             </View>
             <TouchableOpacity style={styles.manualActionBtn} onPress={() => setIsManualModalOpen(true)}>
                <Ionicons name="person-add-outline" size={18} color="#FFF" />
                <Text style={styles.manualActionText}>Mark Attendance Manually</Text>
             </TouchableOpacity>
          </View>

          {/* Staff Grid/List */}
          <View style={styles.listHeader}>
             <Text style={styles.listTitle}>Full Directory</Text>
          </View>
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

      {selectedStaffIds.length > 0 && (
        <Animated.View entering={SlideInDown} style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedStaffIds.length} staff selected</Text>
          <View style={styles.selectionActions}>
             <TouchableOpacity 
               onPress={() => handleMarkBulkAttendance('IN')}
               style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
             >
                <Text style={styles.actionBtnText}>PRESENT</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => handleMarkBulkAttendance('OUT')}
               style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
             >
                <Text style={styles.actionBtnText}>ABSENT</Text>
             </TouchableOpacity>
          </View>
        </Animated.View>
      )}


      {/* Edit Attendance Modal */}
      <Modal visible={isEditModalOpen} transparent animationType="fade">
         <View style={styles.editModalOverlay}>
            <View style={styles.editModalContent}>
               <View style={styles.editModalHeader}>
                  <View style={styles.editHeaderLeft}>
                     <View style={styles.editIconBox}>
                        <Ionicons name="time-outline" size={20} color="#4F46E5" />
                     </View>
                     <Text style={styles.editModalTitle}>Edit Attendance</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                     <Ionicons name="close-outline" size={24} color="#94A3B8" />
                  </TouchableOpacity>
               </View>

               <View style={styles.editStaffCard}>
                  <View style={styles.editAvatar}>
                     <Text style={styles.editAvatarText}>{selectedLog?.name?.charAt(0)}</Text>
                  </View>
                  <View>
                     <Text style={styles.editStaffName}>{selectedLog?.name}</Text>
                     <Text style={styles.editRecordLabel}>Record for {new Date().toLocaleDateString()}</Text>
                  </View>
               </View>

               <View style={styles.editInputRow}>
                  <View style={styles.editInputCol}>
                     <Text style={styles.editInputLabel}>IN TIME</Text>
                     <TouchableOpacity 
                       style={styles.timeInputBox}
                       onPress={() => setShowTimePicker({ visible: true, field: 'in' })}
                     >
                        <Text style={styles.timeInputText}>
                           {editForm.inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Ionicons name="time-outline" size={18} color="#4F46E5" />
                     </TouchableOpacity>
                  </View>
                  <View style={styles.editInputCol}>
                     <Text style={styles.editInputLabel}>OUT TIME</Text>
                     <TouchableOpacity 
                       style={styles.timeInputBox}
                       onPress={() => setShowTimePicker({ visible: true, field: 'out' })}
                     >
                        <Text style={styles.timeInputText}>
                           {editForm.outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Ionicons name="time-outline" size={18} color="#4F46E5" />
                     </TouchableOpacity>
                  </View>
               </View>

               {showTimePicker.visible && (
                 <DateTimePicker
                   value={showTimePicker.field === 'in' ? editForm.inTime : editForm.outTime}
                   mode="time"
                   is24Hour={false}
                   display="default"
                   onChange={(event, selectedDate) => {
                     setShowTimePicker({ visible: false, field: 'in' });
                     if (selectedDate) {
                       setEditForm(prev => ({
                         ...prev,
                         [showTimePicker.field === 'in' ? 'inTime' : 'outTime']: selectedDate
                       }));
                     }
                   }}
                 />
               )}

               <View style={styles.editNotesSection}>
                  <Text style={styles.editInputLabel}>ADMIN NOTES</Text>
                  <View style={styles.notesInputBox}>
                     <TextInput 
                       style={styles.notesInput}
                       multiline
                       value={editForm.notes}
                       onChangeText={(t) => setEditForm(prev => ({ ...prev, notes: t }))}
                     />
                  </View>
               </View>

               <View style={styles.editModalFooter}>
                  <TouchableOpacity 
                    style={styles.editCancelBtn} 
                    onPress={() => setIsEditModalOpen(false)}
                  >
                     <Text style={styles.editCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.editSaveBtn} 
                    onPress={() => {
                      // Logic to save changes
                      setIsEditModalOpen(false);
                      showToast('Attendance updated successfully', 'success');
                    }}
                  >
                     <Text style={styles.editSaveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

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

  dashboardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15, backgroundColor: '#FAFAFF' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  welcomeText: { fontSize: 16, fontWeight: '500', color: '#1E293B' },
  userNameHighlight: { color: '#4F46E5', fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { padding: 4 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#A78BFA', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  avatarInitial: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  scannerSection: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  sectionHeaderInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitleRowInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  innerSectionTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  
  filterPills: { flexDirection: 'row', gap: 6 },
  filterPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F1F5F9' },
  filterPillActive: { backgroundColor: '#4F46E5' },
  filterPillText: { fontSize: 9, fontWeight: '700', color: '#64748B' },
  filterPillTextActive: { color: '#FFF' },

  searchBarInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', height: 40, borderRadius: 10, paddingHorizontal: 12, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9' },
  innerSearchInput: { flex: 1, marginLeft: 8, fontSize: 12, color: '#1E293B' },

  logsTable: { marginTop: 10 },
  logList: { gap: 12 },
  logCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  logCardMain: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { fontSize: 14, fontWeight: '800', color: '#4F46E5' },
  logInfo: { flex: 1, marginLeft: 12 },
  logName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  logSub: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  logActions: { flexDirection: 'row', gap: 6 },
  miniActionBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  logBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  logStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  logStatusText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  methodText: { fontSize: 9, fontWeight: '600', color: '#94A3B8' },

  quickMarkList: { gap: 8 },
  quickMarkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, backgroundColor: '#F8FAFC', borderRadius: 12 },
  quickMarkName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1E293B' },
  selectAllBtnText: { fontSize: 10, fontWeight: '800', color: '#4F46E5' },

  manualActionBtn: { backgroundColor: '#1E293B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 48, borderRadius: 14, marginTop: 10 },
  manualActionText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

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

  selectionBar: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#1E293B', borderRadius: 24, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  selectionText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  selectionActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Modal
  detailOverlay: { flex: 1, backgroundColor: '#FFF' },
  detailContent: { backgroundColor: '#FFF', width: '100%', height: '100%' },
  detailHeader: { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 25 },
  detailHeaderInner: { flexDirection: 'row', alignItems: 'center' },
  detailAvatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  detailAvatarText: { fontSize: 18, fontWeight: '900', color: '#8B5CF6' },
  detailMainInfo: { flex: 1, marginLeft: 12 },
  detailName: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  detailId: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '600' },
  detailCloseIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  detailBody: { flex: 1, padding: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  detailValRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailValText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  timeCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, flexDirection: 'row', marginBottom: 20 },
  timeSection: { flex: 1 },
  timeLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8', marginBottom: 4 },
  timeValue: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  timeDivider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 15 },
  detailSection: { marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  auditLogBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginTop: 4 },
  auditLogText: { fontSize: 12, color: '#64748B', fontWeight: '500', fontStyle: 'italic' },
  detailFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  editModalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  editModalContent: { backgroundColor: '#FFF', width: '92%', maxWidth: 400, borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20 },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  editHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  editModalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  editStaffCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 18, marginBottom: 24 },
  editAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  editAvatarText: { fontSize: 18, fontWeight: '800', color: '#4F46E5' },
  editStaffName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  editRecordLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  editInputRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  editInputCol: { flex: 1 },
  editInputLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 10, letterSpacing: 0.8 },
  timeInputBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16 },
  timeInputText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  editNotesSection: { marginBottom: 28 },
  notesInputBox: { backgroundColor: '#FFF', height: 90, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14 },
  notesInput: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '500', textAlignVertical: 'top' },
  editModalFooter: { flexDirection: 'row', gap: 14 },
  editCancelBtn: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  editCancelBtnText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  editSaveBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  editSaveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
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

  // Face Scanner Refined
  scannerContainer: { backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 10, borderRadius: 24, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  scannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  scannerTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scannerIconSmall: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  scannerTitleText: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  scannerDisplayArea: { height: 220, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  
  // Error State
  errorState: { alignItems: 'center', padding: 20 },
  errorIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  errorSub: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 15 },
  retryBtn: { backgroundColor: '#8B5CF6', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, height: 38, borderRadius: 10 },
  retryText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  // Live State
  liveScannerArea: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  scannerFrame: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  scannerCornerTL: { position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderLeftWidth: 3, borderTopWidth: 3, borderColor: '#6366F1', borderTopLeftRadius: 10 },
  scannerCornerTR: { position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderRightWidth: 3, borderTopWidth: 3, borderColor: '#6366F1', borderTopRightRadius: 10 },
  scannerCornerBL: { position: 'absolute', bottom: 0, left: 0, width: 20, height: 20, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: '#6366F1', borderBottomLeftRadius: 10 },
  scannerCornerBR: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRightWidth: 3, borderBottomWidth: 3, borderColor: '#6366F1', borderBottomRightRadius: 10 },
  scannerLine: { position: 'absolute', width: '90%', height: 2, backgroundColor: 'rgba(99, 102, 241, 0.5)', top: '50%' },
  scannerCenterIcon: { opacity: 0.5 },
  stopScannerBtn: { marginTop: 20 },
  stopScannerText: { color: '#6366F1', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});

export default PrincipalMarkStaffAttendanceScreen;
