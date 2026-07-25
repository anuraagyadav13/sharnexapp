import React, { useState, useEffect, useMemo } from 'react';
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
  Image,
  PermissionsAndroid,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeInUp,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import principalService from '../../services/principalService';
import Skeleton from '../../components/common/Skeleton';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import SelectionModal from '../../components/modals/SelectionModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PageSkeleton = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
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
};

const PrincipalMarkStaffAttendanceScreen = ({ navigation }: any) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [searchStaff, setSearchStaff] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, checkedOut: 0 });
  const [activeFilter, setActiveFilter] = useState('All');
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Date and UI selectors
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [manualDate, setManualDate] = useState<Date>(new Date());
  const [showManualDatePicker, setShowManualDatePicker] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState<{ visible: boolean; field: 'in' | 'out' }>({ visible: false, field: 'in' });
  const [editForm, setEditForm] = useState<{ inTime: Date; outTime: Date | null; notes: string }>({ inTime: new Date(), outTime: null, notes: '' });
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [searchLogsQuery, setSearchLogsQuery] = useState('');
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [selectedDropdownStaff, setSelectedDropdownStaff] = useState<any>(null);
  const [isManualStaffDropdownOpen, setIsManualStaffDropdownOpen] = useState(false);
  const [selectedManualStaff, setSelectedManualStaff] = useState<any>(null);
  const [manualStatus, setManualStatus] = useState('PRESENT');
  const [isUploadingFace, setIsUploadingFace] = useState(false);

  // Scanner animation progress
  const scanProgress = useSharedValue(0);

  useEffect(() => {
    scanProgress.value = withRepeat(
      withTiming(1, { duration: 2500 }),
      -1,
      true
    );
  }, []);

  const animatedScannerLineStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: scanProgress.value * 130 - 65,
        },
      ],
    };
  });

  const showToast = (msg: string, type: string) => {
    Alert.alert(type === 'success' ? 'Success' : 'Error', msg);
  };

  const handleApiError = (error: any, fallbackMessage: string) => {
    console.error('API Error Details:', error);
    let errorMsg = fallbackMessage;
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        errorMsg = 'Session expired. Please log in again.';
      } else if (status === 403) {
        errorMsg = 'Access denied. You do not have permission for this action.';
      } else if (status === 404) {
        errorMsg = 'Requested resource not found.';
      } else if (status === 500) {
        errorMsg = 'Internal server error. Please try again later.';
      } else {
        errorMsg = error.response.data?.message || error.response.normalized?.message || errorMsg;
      }
    } else if (error.request) {
      errorMsg = 'Network error. Please check your internet connection and try again.';
    } else {
      errorMsg = error.message || errorMsg;
    }
    Alert.alert('Error', errorMsg);
  };

  const checkCameraAvailability = async () => {
    if (Platform.OS === 'android') {
      try {
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setCameraAvailable(false);
          }
        }
      } catch (err) {
        console.warn('Camera permission check error:', err);
        setCameraAvailable(false);
      }
    }
  };

  useEffect(() => {
    checkCameraAvailability();
  }, []);

  const handleLaunchCameraAttendance = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera access to verify attendance.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera access is required to capture photos.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const options = {
      mediaType: 'photo' as const,
      cameraType: 'front' as const,
      quality: 0.7 as const,
      saveToPhotos: false,
    };

    launchCamera(options, async (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        if (response.errorCode === 'camera_unavailable') {
          setCameraAvailable(false);
        }
        Alert.alert('Camera Error', response.errorMessage || 'Failed to open camera');
      } else if (response.assets && response.assets.length > 0) {
        try {
          setIsUploadingFace(true);
          const asset = response.assets[0];
          const formData = new FormData();
          formData.append('file', {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'attendance.jpg',
          } as any);

          const res = await apiClient.post('/attendance/face-scan', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          const responseData = res.data?.data || res.data || {};
          const matchedName = responseData.name || responseData.teacherName || responseData.teacher?.name || 'Staff Member';
          Alert.alert('Success', `Face matched! Attendance marked for ${matchedName}.`);
          fetchData();
        } catch (error: any) {
          console.error('[MarkStaffAttendance] Face scan failed:', error);
          const errorMsg = error.response?.data?.message || error.message || 'Could not verify face.';
          Alert.alert(
            'Scan Failed',
            errorMsg,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Retry', onPress: () => handleLaunchCameraAttendance() }
            ]
          );
        } finally {
          setIsUploadingFace(false);
        }
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);

      const dateStr = selectedDate.toISOString().split('T')[0];
      const institutionId = authState.user?.institutionId || '';
      const [staffRes, logsRes] = await Promise.all([
        principalService.getTeachers(institutionId),
        apiClient.get(`${ENDPOINTS.PRINCIPAL.ATTENDANCE}?startDate=${dateStr}&endDate=${dateStr}`)
      ]);

      const staffData = staffRes.data?.data || staffRes.data || [];
      const list = Array.isArray(staffData) ? staffData : [];
      setStaffList(list);

      const logsData = logsRes.data.data || [];
      const mappedLogs = logsData.map((l: any) => {
        const staff: any = list.find((s: any) => s.id === l.teacherId);
        return {
          id: l.id,
          teacherId: l.teacherId,
          name: l.teacherName || staff?.name || 'Unknown',
          idNum: staff?.employeeId || l.teacherId?.substring(0, 8) || 'N/A',
          time: l.inTime ? new Date(l.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
          inTime: l.inTime,
          outTime: l.outTime,
          date: l.date || dateStr,
          method: l.method || 'Scan',
          status: l.outTime ? 'Checked OUT' : 'Marked IN',
          isLate: !!l.isLate,
          isPresent: true,
          notes: l.notes || '',
          workingHours: l.workingHours || '--',
          role: staff?.role || 'Staff Member',
          department: staff?.department || 'Faculty',
          auditLog: l.auditLog || l.notes || '',
        };
      });

      const absentLogs = list
        .filter((staff: any) => !mappedLogs.some((l: any) => l.teacherId === staff.id))
        .map((staff: any) => ({
          id: `absent-${staff.id}`,
          teacherId: staff.id,
          name: staff.name || 'Unknown',
          idNum: staff.employeeId || staff.id?.substring(0, 8) || 'N/A',
          time: '--',
          inTime: null,
          outTime: null,
          date: dateStr,
          method: '--',
          status: 'Absent',
          isLate: false,
          isPresent: false,
          notes: '',
          workingHours: '--',
          role: staff.role || 'Staff Member',
          department: staff.department || 'Faculty',
          auditLog: '',
        }));

      setAttendanceLogs([...mappedLogs, ...absentLogs]);

      const presentCount = logsData.length;
      const checkedOutCount = logsData.filter((l: any) => !!l.outTime).length;
      setStats({
        total: list.length,
        present: presentCount,
        absent: list.length - presentCount,
        late: logsData.filter((l: any) => l.isLate).length,
        checkedOut: checkedOutCount,
      });
    } catch (error) {
      console.error('Fetch error:', error);
      handleApiError(error, 'Failed to fetch staff data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleConfirmManualAttendance = async () => {
    if (!selectedManualStaff) {
      Alert.alert('Required', 'Please select a staff member first.');
      return;
    }

    try {
      setIsLoading(true);
      const dateStr = manualDate.toISOString().split('T')[0];
      let type = 'IN';
      let isLate = false;

      if (manualStatus === 'ABSENT') {
        type = 'OUT';
      } else if (manualStatus === 'LATE') {
        type = 'IN';
        isLate = true;
      } else if (manualStatus === 'HALF DAY') {
        // TODO: Verify if backend supports HALF_DAY status for manual attendance. Currently sending type: 'HALF_DAY'
        type = 'HALF_DAY';
      }

      const payload: any = {
        teacherId: selectedManualStaff.id,
        type: type,
        date: dateStr,
        notes: `Manual ${manualStatus} entry via Principal mobile app on ${dateStr}`
      };

      if (isLate) {
        payload.isLate = true;
      }

      await apiClient.post(`${ENDPOINTS.PRINCIPAL.ATTENDANCE}/manual`, payload);

      setIsManualModalOpen(false);
      setSelectedManualStaff(null);
      setManualStatus('PRESENT');
      await fetchData();
      Alert.alert('Success', `Attendance recorded for ${selectedManualStaff.name}.`);
    } catch (error: any) {
      handleApiError(error, 'Could not record manual attendance.');
    } finally {
      setIsLoading(false);
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
      const dateStr = selectedDate.toISOString().split('T')[0];
      await apiClient.post(`${ENDPOINTS.PRINCIPAL.ATTENDANCE}/manual`, {
        teacherIds: selectedStaffIds,
        type: type,
        date: dateStr,
        notes: `Bulk mark ${type} via mobile app on ${dateStr}`
      });
      const count = selectedStaffIds.length;
      setSelectedStaffIds([]);
      await fetchData();
      Alert.alert('Success', `Attendance ${type === 'IN' ? 'Marked' : 'Checked Out'} for ${count} staff members on ${dateStr}.`);
    } catch (error: any) {
      handleApiError(error, 'Could not process attendance.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualOut = async (logId: string, teacherId: string) => {
    try {
      setIsLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      await apiClient.post(`${ENDPOINTS.PRINCIPAL.ATTENDANCE}/manual`, {
        teacherId,
        type: 'OUT',
        date: dateStr,
        notes: `Manual OUT via action menu on ${dateStr}`
      });
      setIsActionsVisible(false);
      await fetchData();
      Alert.alert('Success', 'Staff member marked as OUT.');
    } catch (error: any) {
      handleApiError(error, 'Failed to mark OUT.');
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
              Alert.alert('Success', 'Attendance record deleted.');
            } catch (error: any) {
              handleApiError(error, 'Failed to delete record.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      if (selectedDropdownStaff && s.id !== selectedDropdownStaff.id) {
        return false;
      }
      const query = searchStaff.toLowerCase().trim();
      if (!query) return true;

      const nameMatch = s.name?.toLowerCase().includes(query);
      const emailMatch = s.email?.toLowerCase().includes(query);
      const roleMatch = s.role?.toLowerCase().includes(query) || s.position?.toLowerCase().includes(query);
      const deptMatch = s.department?.toLowerCase().includes(query);
      const idMatch = s.id?.toLowerCase().includes(query) || s.employeeId?.toLowerCase().includes(query);

      return nameMatch || emailMatch || roleMatch || deptMatch || idMatch;
    });
  }, [staffList, selectedDropdownStaff, searchStaff]);

  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter(log => {
      if (selectedDropdownStaff && log.teacherId !== selectedDropdownStaff.id) {
        return false;
      }

      const query = searchLogsQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (query) {
        const nameMatch = log.name?.toLowerCase().includes(query);
        const idMatch = log.idNum?.toLowerCase().includes(query) || log.teacherId?.toLowerCase().includes(query);
        const roleMatch = log.role?.toLowerCase().includes(query);
        const deptMatch = log.department?.toLowerCase().includes(query);
        matchesSearch = nameMatch || idMatch || roleMatch || deptMatch;
      }

      if (!matchesSearch) return false;

      if (activeFilter === 'Present') return log.isPresent;
      if (activeFilter === 'Absent') return !log.isPresent;
      if (activeFilter === 'Late') return log.isLate;
      if (activeFilter === 'Checked Out') return log.status?.includes('OUT');
      if (activeFilter === 'Half Day') return log.status === 'HALF_DAY' || log.status?.includes('Half');
      return true;
    });
  }, [attendanceLogs, selectedDropdownStaff, searchLogsQuery, activeFilter]);

  const handleSaveEditAttendance = async () => {
    if (!selectedLog) return;
    try {
      setIsLoading(true);
      const payload = {
        inTime: editForm.inTime.toISOString(),
        outTime: editForm.outTime ? editForm.outTime.toISOString() : null,
        notes: editForm.notes,
      };
      await apiClient.patch(`${ENDPOINTS.PRINCIPAL.ATTENDANCE}/${selectedLog.id}`, payload);
      setIsEditModalOpen(false);
      await fetchData();
      Alert.alert('Success', 'Attendance updated successfully.');
    } catch (error: any) {
      console.error('[EditAttendance] Failed to update:', error);
      handleApiError(error, 'Failed to update attendance record.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} translucent />

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date);
            }
          }}
        />
      )}

      {showManualDatePicker && (
        <DateTimePicker
          value={manualDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowManualDatePicker(false);
            if (date) {
              setManualDate(date);
            }
          }}
        />
      )}

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
                <TouchableOpacity
                  onPress={() => setIsViewModalOpen(false)}
                  style={styles.detailCloseIcon}
                  accessibilityLabel="Close Details"
                  accessibilityRole="button"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
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
                    <Text style={styles.detailValText}>
                      {selectedLog?.date ? new Date(selectedLog.date).toDateString() : selectedDate.toDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>STATUS</Text>
                  <View style={styles.detailValRow}>
                    <View style={[styles.statusDot, { backgroundColor: selectedLog?.status === 'Absent' ? '#EF4444' : (selectedLog?.status.includes('OUT') ? '#F59E0B' : '#10B981') }]} />
                    <Text style={styles.detailValText}>{selectedLog?.status}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.timeCard}>
                <View style={styles.timeSection}>
                  <Text style={styles.timeLabel}>CHECK IN</Text>
                  <Text style={styles.timeValue}>
                    {selectedLog?.inTime ? new Date(selectedLog.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </Text>
                </View>
                <View style={styles.timeDivider} />
                <View style={styles.timeSection}>
                  <Text style={styles.timeLabel}>CHECK OUT</Text>
                  <Text style={styles.timeValue}>
                    {selectedLog?.outTime ? new Date(selectedLog.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>LATE</Text>
                  <Text style={styles.detailValText}>{selectedLog?.isLate ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>WORKING HOURS</Text>
                  <Text style={styles.detailValText}>{selectedLog?.workingHours || '--'}</Text>
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
                  <Text style={styles.auditLogText}>
                    {selectedLog?.auditLog || selectedLog?.notes || 'No audit information available'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.detailFooter}>
              <TouchableOpacity
                style={styles.closeDetailBtn}
                onPress={() => setIsViewModalOpen(false)}
                accessibilityLabel="Close details modal"
                accessibilityRole="button"
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
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            accessibilityLabel="Open Navigation Menu"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu-outline" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.welcomeText}>
            Welcome back, <Text style={[styles.userNameHighlight, { color: theme.primary }]}>{authState.user?.name?.split(' ')[0] || 'Anurag'}</Text>
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              // TODO: Navigate to Notifications screen once added to stack
              Alert.alert('Notifications', 'Notification center is currently under development.');
            }}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => navigation.navigate('AccountSettings')}
          >
            <Ionicons name="settings-outline" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            accessibilityLabel="Toggle Dark Mode"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={toggleDarkMode}
          >
            <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AccountSettings')}
            accessibilityLabel="Profile Settings"
            accessibilityRole="button"
          >
            {authState.user?.photoUrl ? (
              <Image source={{ uri: authState.user.photoUrl }} style={styles.avatarCircle} />
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
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
        >
          <View style={styles.pageHeader}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.screenTitle}>Staff Monitoring</Text>
                <Text style={styles.screenSubtitle}>Track faculty presence and daily attendance metrics across all departments.</Text>
              </View>
              <TouchableOpacity
                style={styles.dateSelectorBtn}
                onPress={() => setShowDatePicker(true)}
                accessibilityLabel="Select Date"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="calendar" size={16} color="#FFF" />
                <Text style={styles.dateSelectorBtnText}>
                  {selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Premium Statistics Dashboard */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <Ionicons name="people" size={16} color="#6366F1" />
              </View>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Staff</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{stats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>{stats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="time" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{stats.late}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Ionicons name="log-out" size={16} color="#8B5CF6" />
              </View>
              <Text style={styles.statValue}>{stats.checkedOut}</Text>
              <Text style={styles.statLabel}>Checked Out</Text>
            </View>
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
            </View>

            <View style={styles.scannerDisplayArea}>
              {isUploadingFace ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text style={styles.uploadingText}>Verifying Face Scan...</Text>
                  <Text style={styles.uploadingSub}>Please wait while we match the biometric data.</Text>
                </View>
              ) : !cameraAvailable ? (
                <View style={styles.errorState}>
                  <View style={styles.errorIconBox}>
                    <MaterialCommunityIcons name="alert" size={24} color="#EF4444" />
                  </View>
                  <Text style={styles.errorTitle}>Camera Error</Text>
                  <Text style={styles.errorSub}>No camera found or permissions denied.</Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    accessibilityLabel="Retry camera access"
                    accessibilityRole="button"
                    onPress={async () => {
                      setIsLoading(true);
                      let hasPerm = true;
                      if (Platform.OS === 'android') {
                        try {
                          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
                          hasPerm = granted === PermissionsAndroid.RESULTS.GRANTED;
                        } catch (err) {
                          hasPerm = false;
                        }
                      }
                      setIsLoading(false);
                      if (hasPerm) {
                        setCameraAvailable(true);
                        handleLaunchCameraAttendance();
                      } else {
                        Alert.alert('Permission Denied', 'Camera permission is required.');
                      }
                    }}
                  >
                    <Ionicons name="refresh" size={16} color="#FFF" />
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.liveScannerArea}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.scannerFrame}
                    disabled={isUploadingFace}
                    onPress={handleLaunchCameraAttendance}
                    accessibilityLabel="Tap to scan face"
                    accessibilityRole="button"
                  >
                    <View style={styles.scannerCornerTL} />
                    <View style={styles.scannerCornerTR} />
                    <View style={styles.scannerCornerBL} />
                    <View style={styles.scannerCornerBR} />
                    <Animated.View
                      style={[styles.scannerLine, animatedScannerLineStyle]}
                    />
                    <View style={styles.scannerCenterIcon}>
                      <MaterialCommunityIcons name="face-recognition" size={40} color="rgba(99, 102, 241, 0.2)" />
                      <Text style={{ fontSize: 12, color: '#6366F1', fontWeight: 'bold', marginTop: 8 }}>Tap to Scan Face</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stopScannerBtn}
                    onPress={() => setCameraAvailable(false)}
                    accessibilityLabel="Deactivate scanner"
                    accessibilityRole="button"
                  >
                    <Text style={styles.stopScannerText}>Deactivate Scanner</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Attendance Log Section */}
          <View style={[styles.scannerSection, { marginTop: 25 }]}>
            <View style={styles.sectionHeaderInner}>
              <View style={styles.sectionTitleRowInner}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#4F46E5" />
                <Text style={styles.innerSectionTitle}>Logs List</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexDirection: 'row', gap: 6 }}
              >
                {['All', 'Present', 'Absent', 'Late', 'Checked Out', 'Half Day'].map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
                    onPress={() => setActiveFilter(f)}
                    accessibilityLabel={`Filter logs by ${f}`}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Staff Dropdown Selector */}
            <View style={{ marginBottom: 12 }}>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setIsStaffDropdownOpen(true)}
                accessibilityLabel="Choose staff dropdown filter"
                accessibilityRole="button"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Ionicons name="person-outline" size={18} color="#6366F1" />
                  <Text style={{ color: selectedDropdownStaff ? theme.text : theme.subtext, fontWeight: '500', fontSize: 13 }}>
                    {selectedDropdownStaff ? selectedDropdownStaff.name : 'Select Specific Staff...'}
                  </Text>
                </View>
                {selectedDropdownStaff ? (
                  <TouchableOpacity
                    onPress={() => setSelectedDropdownStaff(null)}
                    style={{ padding: 4 }}
                    accessibilityLabel="Clear staff filter"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close-circle" size={18} color={theme.subtext} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-down" size={18} color={theme.subtext} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarInner}>
              <Ionicons name="search-outline" size={16} color={theme.subtext} />
              <TextInput
                placeholder="Search in logs..."
                style={styles.innerSearchInput}
                value={searchLogsQuery}
                onChangeText={setSearchLogsQuery}
                placeholderTextColor={theme.subtext}
                accessibilityLabel="Search log input"
              />
            </View>

            <View style={styles.logsTable}>
              {/* Attendance Cards */}
              <View style={styles.logList}>
                {filteredLogs.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="clipboard-outline" size={40} color={theme.subtext} />
                    <Text style={styles.emptyStateTitle}>No Attendance Records</Text>
                    <Text style={styles.emptyStateSub}>No attendance logs found matching the current filters or search query.</Text>
                  </View>
                ) : (
                  filteredLogs.map((log) => (
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
                        {log.isPresent ? (
                          <View style={styles.logActions}>
                            <TouchableOpacity
                              style={styles.miniActionBtn}
                              accessibilityLabel="View details"
                              accessibilityRole="button"
                              onPress={() => {
                                setSelectedLog(log);
                                setIsViewModalOpen(true);
                              }}
                            >
                              <Ionicons name="eye-outline" size={16} color="#6366F1" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.miniActionBtn}
                              accessibilityLabel="Edit record"
                              accessibilityRole="button"
                              onPress={() => {
                                const defaultIn = new Date(log.date || selectedDate);
                                defaultIn.setHours(9, 0, 0, 0);
                                const defaultOut = new Date(log.date || selectedDate);
                                defaultOut.setHours(17, 0, 0, 0);

                                setSelectedLog(log);
                                setEditForm({
                                  inTime: log.inTime ? new Date(log.inTime) : defaultIn,
                                  outTime: log.outTime ? new Date(log.outTime) : null,
                                  notes: log.notes || ''
                                });
                                setIsEditModalOpen(true);
                              }}
                            >
                              <Ionicons name="pencil-outline" size={16} color="#6366F1" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.miniActionBtn}
                              accessibilityLabel="Check out manually"
                              accessibilityRole="button"
                              onPress={() => handleManualOut(log.id, log.teacherId)}
                            >
                              <Ionicons name="log-out-outline" size={16} color="#F59E0B" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.miniActionBtn, { borderColor: '#FEE2E2' }]}
                              accessibilityLabel="Delete record"
                              accessibilityRole="button"
                              onPress={() => handleDeleteAttendance(log.id)}
                            >
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.logActions}>
                            <TouchableOpacity
                              style={[
                                styles.miniActionBtn,
                                styles.selectStaffBtn,
                                selectedStaffIds.includes(log.teacherId) && {
                                  borderColor: '#10B981',
                                  backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5',
                                }
                              ]}
                              onPress={() => toggleStaffSelection(log.teacherId)}
                              accessibilityLabel="Select to mark"
                              accessibilityRole="button"
                            >
                              <Text style={[
                                styles.selectStaffText,
                                selectedStaffIds.includes(log.teacherId) && {
                                  color: '#10B981',
                                  fontWeight: 'bold',
                                }
                              ]}>
                                {selectedStaffIds.includes(log.teacherId) ? (
                                  <Ionicons name="checkmark" size={14} color="#10B981" />
                                ) : (
                                  'S'
                                )}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                      <View style={styles.logBadgeRow}>
                        <View style={[styles.logStatusPill, { backgroundColor: log.status === 'Absent' ? '#FEE2E2' : (log.status.includes('OUT') ? '#FEF3C7' : '#D1FAE5') }]}>
                          <View style={[styles.statusDot, { backgroundColor: log.status === 'Absent' ? '#EF4444' : (log.status.includes('OUT') ? '#F59E0B' : '#10B981') }]} />
                          <Text style={[styles.logStatusText, { color: log.status === 'Absent' ? '#991B1B' : (log.status.includes('OUT') ? '#92400E' : '#065F46') }]}>{log.status}</Text>
                        </View>
                        {log.isPresent && (
                          <View style={styles.methodBadge}>
                            <Ionicons name="scan-outline" size={10} color="#64748B" />
                            <Text style={styles.methodText}>{log.method}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>

          {/* Quick Mark Section */}
          <View style={[styles.scannerSection, { marginTop: 25 }]}>
            <View style={styles.sectionHeaderInner}>
              <Text style={styles.innerSectionTitle}>Quick Mark</Text>
              <TouchableOpacity
                onPress={toggleSelectAll}
                accessibilityLabel="Select all staff"
                accessibilityRole="button"
              >
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
                accessibilityLabel="Search staff input"
              />
            </View>
            <View style={styles.quickMarkList}>
              {filteredStaff.slice(0, 4).map(staff => (
                <TouchableOpacity
                  key={staff.id}
                  style={styles.quickMarkRow}
                  onPress={() => toggleStaffSelection(staff.id)}
                  accessibilityLabel={`Select ${staff.name}`}
                  accessibilityRole="button"
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
            <TouchableOpacity
              style={styles.manualActionBtn}
              onPress={() => setIsManualModalOpen(true)}
              accessibilityLabel="Mark attendance manually"
              accessibilityRole="button"
            >
              <Ionicons name="person-add-outline" size={18} color="#FFF" />
              <Text style={styles.manualActionText}>Mark Attendance Manually</Text>
            </TouchableOpacity>
          </View>

          {/* Staff Grid/List */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Full Directory</Text>
          </View>
          <View style={styles.staffList}>
            {filteredStaff.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="people-outline" size={40} color={theme.subtext} />
                <Text style={styles.emptyStateTitle}>No Staff Found</Text>
                <Text style={styles.emptyStateSub}>No faculty or staff members match the selected options or search query.</Text>
              </View>
            ) : (
              filteredStaff.map((staff, index) => {
                const isSelected = selectedStaffIds.includes(staff.id);
                return (
                  <TouchableOpacity
                    key={staff.id}
                    activeOpacity={0.8}
                    onPress={() => toggleStaffSelection(staff.id)}
                    style={[styles.staffCard, isSelected && styles.staffCardActive]}
                    accessibilityLabel={`Select ${staff.name}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
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
              })
            )}
          </View>
        </ScrollView>
      )}

      {selectedStaffIds.length > 0 && (
        <Animated.View entering={SlideInDown} style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedStaffIds.length} staff selected</Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              onPress={() => handleMarkBulkAttendance('IN')}
              style={[styles.actionBtn, { backgroundColor: '#10B981' }, isLoading && { opacity: 0.6 }]}
              disabled={isLoading}
              accessibilityLabel="Bulk mark present"
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnText}>PRESENT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleMarkBulkAttendance('OUT')}
              style={[styles.actionBtn, { backgroundColor: '#EF4444' }, isLoading && { opacity: 0.6 }]}
              disabled={isLoading}
              accessibilityLabel="Bulk mark absent"
              accessibilityRole="button"
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
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                accessibilityLabel="Close Edit Modal"
                accessibilityRole="button"
              >
                <Ionicons name="close-outline" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.editStaffCard}>
              <View style={styles.editAvatar}>
                <Text style={styles.editAvatarText}>{selectedLog?.name?.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.editStaffName}>{selectedLog?.name}</Text>
                <Text style={styles.editRecordLabel}>
                  Record for {selectedLog?.date ? new Date(selectedLog.date).toLocaleDateString() : selectedDate.toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.editInputRow}>
              <View style={styles.editInputCol}>
                <Text style={styles.editInputLabel}>IN TIME</Text>
                <TouchableOpacity
                  style={styles.timeInputBox}
                  onPress={() => setShowTimePicker({ visible: true, field: 'in' })}
                  accessibilityLabel="Edit in time"
                  accessibilityRole="button"
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
                  accessibilityLabel="Edit out time"
                  accessibilityRole="button"
                >
                  <Text style={styles.timeInputText}>
                    {editForm.outTime ? editForm.outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </Text>
                  <Ionicons name="time-outline" size={18} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            </View>

            {showTimePicker.visible && (
              <DateTimePicker
                value={showTimePicker.field === 'in' ? editForm.inTime : (editForm.outTime || editForm.inTime)}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={(event, dateValue) => {
                  setShowTimePicker(prev => ({ ...prev, visible: false }));
                  if (dateValue) {
                    const baseDate = new Date(selectedLog?.date || selectedDate);
                    baseDate.setHours(dateValue.getHours());
                    baseDate.setMinutes(dateValue.getMinutes());
                    baseDate.setSeconds(0);
                    baseDate.setMilliseconds(0);

                    setEditForm(prev => ({
                      ...prev,
                      [showTimePicker.field === 'in' ? 'inTime' : 'outTime']: baseDate
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
                  accessibilityLabel="Admin notes input"
                />
              </View>
            </View>

            <View style={styles.editModalFooter}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setIsEditModalOpen(false)}
                accessibilityLabel="Cancel edit"
                accessibilityRole="button"
              >
                <Text style={styles.editCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSaveBtn, isLoading && { opacity: 0.6 }]}
                disabled={isLoading}
                onPress={handleSaveEditAttendance}
                accessibilityLabel="Save changes"
                accessibilityRole="button"
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
              <TouchableOpacity
                onPress={() => setIsManualModalOpen(false)}
                style={styles.closeBtn}
                accessibilityLabel="Close Manual Entry Modal"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.modalField}>
                <Text style={styles.fieldLabel}>SELECT STAFF / TEACHER</Text>
                <TouchableOpacity
                  style={styles.fieldInput}
                  onPress={() => setIsManualStaffDropdownOpen(true)}
                  accessibilityLabel="Choose staff dropdown selector"
                  accessibilityRole="button"
                >
                  <Text style={[styles.fieldText, !selectedManualStaff && { color: '#94A3B8' }]}>
                    {selectedManualStaff ? selectedManualStaff.name : 'Choose a staff member...'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalField}>
                <Text style={styles.fieldLabel}>DATE</Text>
                <TouchableOpacity
                  style={styles.fieldInput}
                  onPress={() => setShowManualDatePicker(true)}
                  accessibilityLabel="Choose manual date"
                  accessibilityRole="button"
                >
                  <Text style={styles.fieldText}>{manualDate.toDateString()}</Text>
                  <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalField}>
                <Text style={styles.fieldLabel}>ATTENDANCE STATUS</Text>
                <View style={styles.statusGrid}>
                  {['PRESENT', 'ABSENT', 'LATE', 'HALF DAY'].map(s => {
                    const isSelected = manualStatus === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusBox, isSelected && { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' }]}
                        onPress={() => setManualStatus(s)}
                        accessibilityLabel={`Status ${s}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                      >
                        <View style={[styles.statusCircle, { backgroundColor: isSelected ? '#4F46E5' : '#CBD5E1' }]} />
                        <Text style={[styles.statusBoxText, isSelected && { color: '#4F46E5' }]}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.primaryActionBtn, isLoading && { opacity: 0.6 }]}
                disabled={isLoading}
                onPress={handleConfirmManualAttendance}
                accessibilityLabel="Confirm manual attendance entry"
                accessibilityRole="button"
              >
                <Text style={styles.primaryActionText}>Confirm Attendance</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <SelectionModal
        visible={isStaffDropdownOpen}
        title="Select Staff Member"
        options={staffList.map(s => s.name || 'Unknown')}
        onSelect={(name) => {
          const selected = staffList.find(s => s.name === name);
          setSelectedDropdownStaff(selected || null);
          setIsStaffDropdownOpen(false);
        }}
        onClose={() => setIsStaffDropdownOpen(false)}
      />

      <SelectionModal
        visible={isManualStaffDropdownOpen}
        title="Select Staff Member"
        options={staffList.map(s => s.name || 'Unknown')}
        onSelect={(name) => {
          const selected = staffList.find(s => s.name === name);
          setSelectedManualStaff(selected || null);
          setIsManualStaffDropdownOpen(false);
        }}
        onClose={() => setIsManualStaffDropdownOpen(false)}
      />

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  dashboardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15, backgroundColor: theme.background },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  welcomeText: { fontSize: 16, fontWeight: '500', color: theme.text },
  userNameHighlight: { color: theme.primary, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { padding: 4 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#A78BFA', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  avatarInitial: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: theme.primary, marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  scannerSection: { backgroundColor: theme.surface, marginHorizontal: 20, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  sectionHeaderInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitleRowInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  innerSectionTitle: { fontSize: 15, fontWeight: '800', color: theme.text },

  filterPills: { flexDirection: 'row', gap: 6 },
  filterPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: theme.background },
  filterPillActive: { backgroundColor: theme.primary },
  filterPillText: { fontSize: 9, fontWeight: '700', color: theme.subtext },
  filterPillTextActive: { color: '#FFF' },

  searchBarInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, height: 40, borderRadius: 10, paddingHorizontal: 12, marginBottom: 15, borderWidth: 1, borderColor: theme.border },
  innerSearchInput: { flex: 1, marginLeft: 8, fontSize: 12, color: theme.text },

  logsTable: { marginTop: 10 },
  logList: { gap: 12 },
  logCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: theme.border },
  logCardMain: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { fontSize: 14, fontWeight: '800', color: theme.primary },
  logInfo: { flex: 1, marginLeft: 12 },
  logName: { fontSize: 14, fontWeight: '700', color: theme.text },
  logSub: { fontSize: 10, color: theme.subtext, fontWeight: '600', marginTop: 2 },
  logActions: { flexDirection: 'row', gap: 6 },
  miniActionBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  logBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border },
  logStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  logStatusText: { fontSize: 10, fontWeight: '700', color: theme.subtext },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  methodText: { fontSize: 9, fontWeight: '600', color: theme.subtext },

  quickMarkList: { gap: 8 },
  quickMarkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, backgroundColor: theme.background, borderRadius: 12 },
  quickMarkName: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.text },
  selectAllBtnText: { fontSize: 10, fontWeight: '800', color: theme.primary },

  manualActionBtn: { backgroundColor: theme.isDarkMode ? '#334155' : '#1E293B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 48, borderRadius: 14, marginTop: 10 },
  manualActionText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 32, marginBottom: 16 },
  listTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
  selectAllText: { fontSize: 10, fontWeight: '800', color: theme.primary, letterSpacing: 0.5 },
  staffList: { paddingHorizontal: 20, gap: 12 },
  staffCard: { backgroundColor: theme.surface, borderRadius: 24, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  staffCardActive: { borderColor: theme.primary, backgroundColor: theme.isDarkMode ? '#312E81' : '#EEF2FF' },
  staffAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
  avatarActive: { backgroundColor: theme.primary },
  staffInitial: { fontSize: 18, fontWeight: '800', color: theme.subtext },
  initialActive: { color: '#FFF' },
  staffMain: { flex: 1, marginLeft: 15 },
  staffName: { fontSize: 15, fontWeight: '700', color: theme.text },
  staffRole: { fontSize: 11, color: theme.subtext, marginTop: 2, fontWeight: '600' },
  checkPlaceholder: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.border },

  selectionBar: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: theme.isDarkMode ? '#1E293B' : '#1E293B', borderRadius: 24, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  selectionText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  selectionActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Modal
  detailOverlay: { flex: 1, backgroundColor: theme.background },
  detailContent: { backgroundColor: theme.surface, width: '100%', height: '100%' },
  detailHeader: { padding: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 25 },
  detailHeaderInner: { flexDirection: 'row', alignItems: 'center' },
  detailAvatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },
  detailAvatarText: { fontSize: 18, fontWeight: '900', color: '#8B5CF6' },
  detailMainInfo: { flex: 1, marginLeft: 12 },
  detailName: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  detailId: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '600' },
  detailCloseIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  detailBody: { flex: 1, padding: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 9, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  detailValRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailValText: { fontSize: 13, fontWeight: '700', color: theme.text },
  timeCard: { backgroundColor: theme.background, borderRadius: 16, padding: 16, flexDirection: 'row', marginBottom: 20 },
  timeSection: { flex: 1 },
  timeLabel: { fontSize: 8, fontWeight: '800', color: theme.subtext, marginBottom: 4 },
  timeValue: { fontSize: 16, fontWeight: '900', color: theme.text },
  timeDivider: { width: 1, backgroundColor: theme.border, marginHorizontal: 15 },
  detailSection: { marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  auditLogBox: { backgroundColor: theme.background, padding: 12, borderRadius: 10, marginTop: 4 },
  auditLogText: { fontSize: 12, color: theme.subtext, fontWeight: '500', fontStyle: 'italic' },
  detailFooter: { padding: 16, borderTopWidth: 1, borderTopColor: theme.border, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  closeDetailBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDetailBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  editModalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  editModalContent: { backgroundColor: theme.surface, width: '92%', maxWidth: 400, borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20, borderWidth: 1, borderColor: theme.border },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  editHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
  editModalTitle: { fontSize: 20, fontWeight: '800', color: theme.text },
  editStaffCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.background, padding: 14, borderRadius: 18, marginBottom: 24 },
  editAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
  editAvatarText: { fontSize: 18, fontWeight: '800', color: theme.primary },
  editStaffName: { fontSize: 16, fontWeight: '700', color: theme.text },
  editRecordLabel: { fontSize: 12, color: theme.subtext, fontWeight: '500', marginTop: 2 },
  editInputRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  editInputCol: { flex: 1 },
  editInputLabel: { fontSize: 10, fontWeight: '800', color: theme.subtext, marginBottom: 10, letterSpacing: 0.8 },
  timeInputBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, height: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16 },
  timeInputText: { fontSize: 14, fontWeight: '700', color: theme.text },
  editNotesSection: { marginBottom: 28 },
  notesInputBox: { backgroundColor: theme.surface, height: 90, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 14 },
  notesInput: { flex: 1, fontSize: 13, color: theme.text, fontWeight: '500', textAlignVertical: 'top' },
  editModalFooter: { flexDirection: 'row', gap: 14 },
  editCancelBtn: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  editCancelBtnText: { fontSize: 15, fontWeight: '700', color: theme.subtext },
  editSaveBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  editSaveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: theme.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: theme.border },
  modalIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: theme.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
  modalField: { marginBottom: 20 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5, marginBottom: 8 },
  fieldInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: theme.border },
  fieldText: { fontSize: 14, color: theme.text, fontWeight: '600' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statusBox: { flex: 1, minWidth: '45%', backgroundColor: theme.background, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.border },
  statusCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary },
  statusBoxText: { fontSize: 12, fontWeight: '800', color: theme.text },
  primaryActionBtn: { backgroundColor: theme.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: theme.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryActionText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  statsRowSkeleton: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 25 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 5,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 8,
    color: theme.subtext,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginTop: 12,
    marginBottom: 4,
  },
  uploadingSub: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    width: '100%',
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    marginTop: 10,
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  dateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
    gap: 6,
    marginLeft: 10,
  },
  dateSelectorBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  selectStaffBtn: {
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  selectStaffText: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: 'bold',
  },

  // Face Scanner Refined
  scannerContainer: { backgroundColor: theme.surface, marginHorizontal: 20, marginTop: 10, borderRadius: 24, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: theme.border },
  scannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  scannerTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scannerIconSmall: { width: 32, height: 32, borderRadius: 8, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
  scannerTitleText: { fontSize: 16, fontWeight: '800', color: theme.text },
  scannerDisplayArea: { height: 220, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border, overflow: 'hidden', backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' },

  // Error State
  errorState: { alignItems: 'center', padding: 20 },
  errorIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 4 },
  errorSub: { fontSize: 12, color: theme.subtext, fontWeight: '500', marginBottom: 15 },
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9F7AEA', // Soft purple
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 8,
  },
});

export default PrincipalMarkStaffAttendanceScreen;
