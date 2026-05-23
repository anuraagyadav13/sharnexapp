import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';

const formatNative = (date: Date, pattern: string) => {
  if (pattern === 'yyyy-MM-dd') {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (pattern === 'MM/dd/yyyy') {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${m}/${d}/${y}`;
  }
  if (pattern === 'EEEE, MMMM dd, yyyy') {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: '2-digit',
      year: 'numeric'
    }).format(date);
  }
  return date.toDateString();
};

const addDaysNative = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const { width, height } = Dimensions.get('window');

// --- Custom Calendar Picker Component (Overlay Version for stability) ---
const CustomCalendarPickerOverlay = ({ visible, onClose, onSelect, initialDate }: { visible: boolean, onClose: () => void, onSelect: (date: Date) => void, initialDate: Date }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysCount = daysInMonth(month, year);
        const offset = firstDayOfMonth(month, year);
        const days = [];
        for (let i = 0; i < offset; i++) days.push(null);
        for (let i = 1; i <= daysCount; i++) days.push(new Date(year, month, i));
        return days;
    }, [currentMonth]);
    const changeMonth = (offset: number) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const yearName = currentMonth.getFullYear();

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill}>
            <TouchableOpacity activeOpacity={1} style={styles.calModalOverlay} onPress={onClose}>
                <Animated.View entering={FadeInUp.springify()} style={styles.calContainer}>
                    <View style={styles.calHeader}>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#94A3B8" /></TouchableOpacity>
                        <Text style={styles.calTitle}>Select Date</Text>
                        <View style={{width: 24}} />
                    </View>
                    <View style={styles.calMonthNav}>
                        <TouchableOpacity onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={20} color="#1E293B" /></TouchableOpacity>
                        <Text style={styles.calMonthText}>{monthName} {yearName}</Text>
                        <TouchableOpacity onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={20} color="#1E293B" /></TouchableOpacity>
                    </View>
                    <View style={styles.calGrid}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <View key={`${d}-${i}`} style={styles.calDayBox}><Text style={styles.calDayLabel}>{d}</Text></View>
                        ))}
                        {calendarDays.map((date, idx) => (
                            <TouchableOpacity key={idx} disabled={!date} 
                                style={[styles.calDateBox, date?.toDateString() === initialDate.toDateString() && styles.calDateActive]}
                                onPress={() => { if(date) { onSelect(date); onClose(); } }}
                            >
                                <Text style={[styles.calDateText, !date && {opacity: 0}, date?.toDateString() === initialDate.toDateString() && {color: '#FFF'}]}>
                                    {date ? date.getDate() : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

const ScheduleCard = ({ item, index }: { item: any, index: number }) => {
  const isFree = item.type === 'FREE' || (!item.subject_name && !item.subject);
  const isSubstitution = item.assignment_type === 'substitute' || item.status === 'SUBSTITUTION';
  const startTime = item.start_time || item.time?.split('-')[0]?.trim() || '';
  const endTime = item.end_time || item.time?.split('-')[1]?.trim() || '';
  const status = (item.status || 'UPCOMING').toUpperCase(); 

  const statusColors: any = {
    'ONGOING': '#10B981',
    'COMPLETED': '#64748B',
    'UPCOMING': '#6366F1',
    'REGULAR': '#6366F1'
  };

  if (isFree) {
    return (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={[styles.card, styles.freeCard]}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#94A3B8" />
          <Text style={styles.freeTitle}>Free Period - No class assigned</Text>
          <Text style={styles.freeTime}>{item.label || item.period_number || `P${index + 1}`}</Text>
        </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={[styles.card, isSubstitution && styles.substitutionCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.periodCircle}>
          <Text style={styles.pLabel}>{item.label || `P${index + 1}`}</Text>
          <Text style={styles.pNum}>{item.period_number || index + 1}</Text>
        </View>
        <View style={styles.cardInfo}>
           <View style={styles.tagLine}>
                <Text style={styles.timeTag}>{startTime && endTime ? `${startTime} - ${endTime}` : (item.time || 'TBD')}</Text>
                <View style={[styles.statusTag, { backgroundColor: statusColors[status] || '#E0E7FF' }]}>
                    <Text style={[styles.statusTagText, { color: '#FFFFFF' }]}>
                        {status}
                    </Text>
                </View>
                {isSubstitution && (
                  <View style={[styles.statusTag, { backgroundColor: '#FEE2E2', marginLeft: 8 }]}>
                    <Text style={[styles.statusTagText, { color: '#EF4444' }]}>SUBSTITUTION</Text>
                  </View>
                )}
           </View>
           <Text style={styles.subjectText}>{item.subject_name || item.subject}</Text>
           <Text style={styles.classText}>{item.class_name || item.className || 'Unknown Class'}</Text>
        </View>
        <TouchableOpacity><Ionicons name="ellipsis-horizontal" size={18} color="#94A3B8" /></TouchableOpacity>
      </View>
      <View style={styles.cardFooter}>
         <Ionicons name="person-outline" size={12} color="#94A3B8" style={{ marginRight: 6 }} />
         <Text style={styles.footerText}>{isSubstitution ? 'Substitution Session' : 'Regular Session'}</Text>
      </View>
    </Animated.View>
  );
};

const ScheduleRow = ({ item, index }: { item: any, index: number }) => {
  const isFree = item.type === 'FREE' || !item.subject_name;
  if (isFree) return null;
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={styles.tableRow}>
      <View style={styles.colTime}><Text style={styles.tableValue}>{item.time || item.start_time}</Text></View>
      <View style={styles.colClass}><Text style={styles.tableValueBold}>{item.class_name}</Text></View>
      <View style={styles.colSubject}><View style={styles.subjectBadge}><Text style={styles.subjectBadgeText}>{item.subject_name}</Text></View></View>
      <View style={styles.colStatus}>
        <View style={styles.statusRowRow}>
          <View style={[styles.statusDot, { backgroundColor: item.assignment_type === 'substitute' ? '#F59E0B' : '#10B981' }]} />
          <Text style={[styles.statusLabel, { color: item.assignment_type === 'substitute' ? '#D97706' : '#10B981' }]}>
            {item.assignment_type === 'substitute' ? 'Substitute' : 'Regular'}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.colAction}><Ionicons name="open-outline" size={16} color="#CBD5E1" /></TouchableOpacity>
    </Animated.View>
  );
};

const TeacherTimetableScreen = () => {
  const { authState } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState('Daily');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [freePeriods, setFreePeriods] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  
  const [isLeaveModalVisible, setLeaveModalVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTypePickerVisible, setTypePickerVisible] = useState(false);
  const [dateTarget, setDateTarget] = useState<'start' | 'end'>('start');
  
  const [leaveData, setLeaveData] = useState({
    startDate: new Date(),
    endDate: new Date(),
    type: '',
    reason: ''
  });

  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async (refreshing = false) => {
      try {
        if (!refreshing) setIsLoading(true);
        setError(null);
        const teacherId = authState.user?.id;
        if (!teacherId) return;
        const dateStr = formatNative(selectedDate, 'yyyy-MM-dd');

        // Parallel fetching of all relevant APIs
        const [scheduleRes, freeRes, summaryRes] = await Promise.all([
          apiClient.get(`${ENDPOINTS.TEACHER.SCHEDULE(teacherId)}?date=${dateStr}`),
          apiClient.get(`/teachers/${teacherId}/free-periods?date=${dateStr}`),
          apiClient.get(`/teachers/${teacherId}/dashboard-summary`)
        ]);
        
        if (isMounted) {
          setSchedule(scheduleRes.data?.schedule || scheduleRes.data?.data || (Array.isArray(scheduleRes.data) ? scheduleRes.data : []));
          setFreePeriods(freeRes.data?.freePeriods || []);
          setSummaryData(summaryRes.data?.summary || null);
        }
      } catch (err: any) {
        console.error('Unified teacher data fetch error:', err);
        if (isMounted) setError('Connection error. Failed to sync with server.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };
    fetchAllData();
    return () => { isMounted = false; };
  }, [selectedDate, authState.user?.id]);

  const onRefresh = () => {
    setIsRefreshing(true);
    // Trigger useEffect via a small state ping if needed, or call directly
    // For simplicity, we just trigger the fetching logic
  };

  const handleApplyLeave = async () => {
    if (!leaveData.reason.trim()) {
      Alert.alert('Incomplete Form', 'Please provide a reason for the leave.');
      return;
    }

    if (!leaveData.type) {
      Alert.alert('Incomplete Form', 'Please select a leave type.');
      return;
    }

    // Validation: End date cannot be before start date
    const start = new Date(leaveData.startDate.setHours(0,0,0,0));
    const end = new Date(leaveData.endDate.setHours(0,0,0,0));
    
    if (end < start) {
      Alert.alert('Invalid Date Range', 'The end date cannot be earlier than the start date.');
      return;
    }

    try {
      setIsSubmittingLeave(true);
      const teacherId = authState.user?.id;
      
      const payload = {
        teacher_id: teacherId,
        start_date: formatNative(leaveData.startDate, 'yyyy-MM-dd'),
        end_date: formatNative(leaveData.endDate, 'yyyy-MM-dd'),
        leave_type: leaveData.type || 'Personal',
        reason: leaveData.reason,
      };

      const res = await apiClient.post(ENDPOINTS.TEACHER.SUBMIT_LEAVE, payload);
      
      if (res.data?.success || res.status === 200) {
        Alert.alert('Success', 'Your leave request has been submitted and automated substitutions are being processed.');
        setLeaveModalVisible(false);
        setLeaveData(prev => ({ ...prev, reason: '' }));
      } else {
        throw new Error(res.data?.message || 'Submission failed');
      }
    } catch (err: any) {
      console.error('Leave submission error:', err);
      Alert.alert('Error', err.message || 'Failed to submit leave request');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const regularSessions = useMemo(() => schedule.filter(s => s.subject_name && (s.assignment_type === 'original' || !s.assignment_type)).length, [schedule]);
  const subSlots = useMemo(() => schedule.filter(s => s.assignment_type === 'substitute' || s.status === 'SUBSTITUTION').length, [schedule]);

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Sync to Sunday
    return Array.from({length: 7}).map((_, i) => addDaysNative(startOfWeek, i));
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Top Header */}
      <View style={styles.globalHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Welcome back, {authState.user?.name?.split(' ')[0] || 'Teacher'}</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.titleArea}>
        <Text style={styles.title}>My Teaching Schedule</Text>
        <Text style={styles.subtitle}>{formatNative(selectedDate, 'EEEE, MMMM dd, yyyy')}</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => setSelectedDate(new Date(selectedDate))} colors={['#6366F1']} />}
      >
        <View style={styles.navRow}>
            <View style={styles.viewToggle}>
                {['Daily', 'Weekly'].map(v => (
                    <TouchableOpacity key={v} onPress={() => setViewType(v)} style={[styles.vTab, viewType === v && styles.vTabActive]}>
                        <Text style={[styles.vTabText, viewType === v && styles.vTabTextActive]}>{v}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <ScaleButton 
                style={styles.leaveBtn} 
                onPress={() => setLeaveModalVisible(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.leaveBtnText}>Apply Leave</Text>
            </ScaleButton>
        </View>

        {viewType === 'Weekly' && (
          <View style={styles.weekStripContainer}>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
                {weekDays.map((d, i) => {
                  const isSelected = d.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => setSelectedDate(d)}
                      style={[styles.weekDayBtn, isSelected && styles.weekDayBtnActive]}
                    >
                      <Text style={[styles.weekDayName, isSelected && styles.weekDayNameActive]}>
                        {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                      </Text>
                      <Text style={[styles.weekDayDate, isSelected && styles.weekDayDateActive]}>{d.getDate()}</Text>
                    </TouchableOpacity>
                  );
                })}
             </ScrollView>
          </View>
        )}

        <View style={styles.listContainer}>
            {isLoading ? (
                <View style={styles.empty}><ActivityIndicator color="#6366F1" /></View>
            ) : viewType === 'Daily' ? (
                <View>
                  {schedule.length === 0 && freePeriods.length === 0 && (
                    <View style={styles.empty}><Text style={styles.emptyRowText}>No activities found for today.</Text></View>
                  )}
                  {schedule.map((item, idx) => <ScheduleCard key={`s-${idx}`} item={item} index={idx} />)}
                  
                  {/* Smart Free Periods UI */}
                  {freePeriods.length > 0 && (
                    <View style={styles.freeSummary}>
                       <Text style={styles.freeSummaryTitle}>FREE SPACE AVAILABLE</Text>
                       {freePeriods.map((fp: any, idx: number) => (
                         <View key={`f-${idx}`} style={styles.freeGapRow}>
                             <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                             <Text style={styles.freeGapText}>Gap from {fp.start_time || 'N/A'} to {fp.end_time || 'N/A'}</Text>
                         </View>
                       ))}
                    </View>
                  )}
                </View>
            ) : (
                <View style={styles.tableView}>
                    <View style={styles.tableHead}>
                        <Text style={[styles.tableHeadText, styles.colTime]}>TIME</Text>
                        <Text style={[styles.tableHeadText, styles.colClass]}>CLASS</Text>
                        <Text style={[styles.tableHeadText, styles.colSubject]}>SUBJECT</Text>
                        <Text style={[styles.tableHeadText, styles.colStatus]}>STATUS</Text>
                        <View style={styles.colAction} />
                    </View>
                    {schedule.filter(s => s.subject_name).map((item, idx) => <ScheduleRow key={idx} item={item} index={idx} />)}
                    {schedule.filter(s => s.subject_name).length === 0 && <View style={styles.emptyRow}><Text style={styles.emptyRowText}>No classes assigned to you.</Text></View>}
                </View>
            )}

            <View style={styles.lunchSection}>
                <View style={styles.lLine} /><View style={styles.lMark}><MaterialCommunityIcons name="silverware-fork-knife" size={14} color="#94A3B8" style={{marginRight: 6}} /><Text style={styles.lText}>LUNCH BREAK (11:15 - 12:00)</Text></View><View style={styles.lLine} />
            </View>

            <View style={styles.summaryRow}>
                <View style={[styles.sumCard, {backgroundColor: '#FFFFFF'}]}>
                    <Text style={styles.sumLabel}>REGULAR SESSIONS</Text>
                    <Text style={styles.sumVal}>{regularSessions} Classes</Text>
                </View>
                <View style={[styles.sumCard, {marginLeft: 12, backgroundColor: '#FFFFFF'}]}>
                    <Text style={styles.sumLabel}>SUBSTITUTE TASKS</Text>
                    <Text style={[styles.sumVal, {color: '#F97316'}]}>{subSlots} Slots</Text>
                </View>
            </View>
        </View>

        <TouchableOpacity 
          style={styles.printBtn} 
          onPress={() => Alert.alert('Export to PDF', 'Generating high-resolution timetable document for printing...')}
        >
            <Feather name="printer" size={16} color="#64748B" style={{marginRight: 8}} />
            <Text style={styles.printBtnText}>Export Schedule to PDF</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Apply Leave Modal */}
      <Modal visible={isLeaveModalVisible} transparent animationType="slide" onRequestClose={() => setLeaveModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                <Animated.View entering={FadeInUp.springify()} style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderTitleRow}>
                            <View style={styles.modalIconBox}><Ionicons name="calendar-outline" size={20} color="#8B5CF6" /></View>
                            <View style={{marginLeft: 12}}>
                                <Text style={styles.modalTitle}>Apply Leave</Text>
                                <Text style={styles.modalSub}>Sharnex Management System</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setLeaveModalVisible(false)}><Ionicons name="close" size={24} color="#94A3B8" /></TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                        <View style={styles.formRow}>
                            <View style={styles.formCol}>
                                <Text style={styles.inputLabel}>Start Date</Text>
                                <TouchableOpacity style={styles.inputWrapper} onPress={() => { setDateTarget('start'); setDatePickerVisible(true); }}>
                                    <Text style={styles.textInputVal}>{formatNative(leaveData.startDate, 'MM/dd/yyyy')}</Text>
                                    <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.formCol, {marginLeft: 12}]}>
                                <Text style={styles.inputLabel}>End Date</Text>
                                <TouchableOpacity style={styles.inputWrapper} onPress={() => { setDateTarget('end'); setDatePickerVisible(true); }}>
                                    <Text style={styles.textInputVal}>{formatNative(leaveData.endDate, 'MM/dd/yyyy')}</Text>
                                    <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.formItem}>
                            <Text style={styles.inputLabel}>Leave Type</Text>
                            <TouchableOpacity style={styles.inputWrapper} onPress={() => setTypePickerVisible(true)}>
                                <Text style={leaveData.type ? styles.textInputVal : styles.inputTextPlaceholder}>
                                  {leaveData.type || 'Select the type of leave'}
                                </Text>
                                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formItem}>
                            <Text style={styles.inputLabel}>Reason for Leave</Text>
                            <TextInput 
                                style={[styles.textInputArea, {height: 100}]}
                                placeholder="Provide a brief explanation for your request..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                value={leaveData.reason}
                                onChangeText={(t) => setLeaveData({...leaveData, reason: t})}
                            />
                        </View>

                        <View style={styles.noteBox}>
                            <Text style={styles.noteText}>
                                <Text style={{fontWeight: '800', color: '#7C3AED'}}>Note: </Text>
                                Once submitted, the Sharnex Auto-Substitution system will find cover for your classes automatically. Notifications will be sent to available faculty.
                            </Text>
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity 
                          style={styles.cancelBtn} 
                          onPress={() => setLeaveModalVisible(false)}
                          disabled={isSubmittingLeave}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.submitBtn, isSubmittingLeave && { opacity: 0.7 }]} 
                          onPress={handleApplyLeave}
                          disabled={isSubmittingLeave}
                        >
                            {isSubmittingLeave ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <Text style={styles.submitBtnText}>Submit Request</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Integrated Sub-Overlay Calendar for ultra-stability */}
                    <CustomCalendarPickerOverlay 
                      visible={isDatePickerVisible} 
                      onClose={() => setDatePickerVisible(false)} 
                      initialDate={dateTarget === 'start' ? leaveData.startDate : leaveData.endDate}
                      onSelect={(d) => {
                        if(dateTarget === 'start') setLeaveData({...leaveData, startDate: d});
                        else setLeaveData({...leaveData, endDate: d});
                      }}
                    />

                    {/* Integrated Type Picker Overlay */}
                    <Modal visible={isTypePickerVisible} transparent animationType="fade" onRequestClose={() => setTypePickerVisible(false)}>
                      <TouchableOpacity activeOpacity={1} style={styles.calModalOverlay} onPress={() => setTypePickerVisible(false)}>
                        <Animated.View entering={FadeInDown.springify()} style={[styles.calContainer, { width: '80%', padding: 10 }]}>
                           <Text style={[styles.calTitle, { marginVertical: 15, textAlign: 'center' }]}>Select Leave Type</Text>
                           {['Personal Leave', 'Sick Leave', 'Medical Leave', 'Family Emergency', 'Casual Leave', 'Duty Leave'].map((t, i) => (
                             <TouchableOpacity 
                                key={t} 
                                style={[styles.typeItem, t === leaveData.type && styles.typeItemActive, i === 5 && { borderBottomWidth: 0 }]} 
                                onPress={() => { setLeaveData({...leaveData, type: t}); setTypePickerVisible(false); }}
                             >
                                <Text style={[styles.typeText, t === leaveData.type && styles.typeTextActive]}>{t}</Text>
                                {t === leaveData.type && <Ionicons name="checkmark-circle" size={18} color="#8B5CF6" />}
                             </TouchableOpacity>
                           ))}
                        </Animated.View>
                      </TouchableOpacity>
                    </Modal>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
      </Modal>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="teacher" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFF' },
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
    zIndex: 10,
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  titleArea: { paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 18, fontWeight: '900', color: '#6366F1', marginBottom: 2 },
  subtitle: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  content: { flex: 1 },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  dateControl: { flexDirection: 'row', alignItems: 'center' },
  navText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  viewToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 2, marginHorizontal: 12 },
  vTab: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  vTabActive: { backgroundColor: '#6366F1' },
  vTabText: { fontSize: 9, fontWeight: '700', color: '#64748B' },
  vTabTextActive: { color: '#FFFFFF' },
  leaveBtn: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  leaveBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  
  listContainer: { paddingHorizontal: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F8FAFC', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  freeCard: { borderStyle: 'dashed', backgroundColor: '#FAFAFA', borderColor: '#E2E8F0', height: 80, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  freeTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#64748B' },
  freeTime: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  periodCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  pLabel: { fontSize: 6, fontWeight: '800', color: '#94A3B8', opacity: 0.6 },
  pNum: { fontSize: 13, fontWeight: '900', color: '#1E293B' },
  cardInfo: { flex: 1 },
  tagLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  timeTag: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginRight: 8 },
  statusTag: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  statusTagText: { fontSize: 7, fontWeight: '900' },
  subjectText: { fontSize: 15, fontWeight: '900', color: '#1E293B' },
  classText: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  footerText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  
  tableView: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', padding: 10 },
  tableHead: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 8 },
  tableHeadText: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  colTime: { width: 70 }, colClass: { width: 80 }, colSubject: { flex: 1 }, colStatus: { width: 80 }, colAction: { width: 30, alignItems: 'center' },
  tableValue: { fontSize: 11, color: '#64748B', fontWeight: '600' }, tableValueBold: { fontSize: 11, color: '#1E293B', fontWeight: '800' },
  subjectBadge: { backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  subjectBadgeText: { fontSize: 10, fontWeight: '700', color: '#8B5CF6' },
  statusRowRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusLabel: { fontSize: 10, fontWeight: '700', color: '#10B981' },
  emptyRow: { padding: 40, alignItems: 'center' },
  emptyRowText: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  lunchSection: { flexDirection: 'row', alignItems: 'center', marginVertical: 32 },
  lLine: { flex: 1, height: 1, backgroundColor: '#F1F5F9' },
  lMark: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  lText: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  sumCard: { flex: 1, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
  sumLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8', marginBottom: 2 },
  sumVal: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  printBtn: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 10 },
  printBtnText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  empty: { paddingVertical: 100, alignItems: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 400 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 20}, shadowOpacity: 0.2, shadowRadius: 30, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalHeaderTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modalIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  modalSub: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  modalForm: { padding: 20, maxHeight: height * 0.6 },
  formRow: { flexDirection: 'row', marginBottom: 16 },
  formCol: { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, height: 48 },
  textInputVal: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '600' },
  inputTextPlaceholder: { flex: 1, fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  formItem: { marginBottom: 16 },
  textInputArea: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1E293B', fontWeight: '600' },
  noteBox: { backgroundColor: '#F5F3FF', borderRadius: 12, padding: 16, marginBottom: 10 },
  noteText: { fontSize: 12, color: '#6D28D9', lineHeight: 18, fontWeight: '500' },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  submitBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  calModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  calContainer: { backgroundColor: '#FFF', width: '85%', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  calMonthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
  calMonthText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayBox: { width: '14.28%', alignItems: 'center', marginBottom: 10 },
  calDayLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  calDateBox: { width: '14.28%', height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  calDateActive: { backgroundColor: '#8B5CF6' },
  calDateText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },

  substitutionCard: { borderColor: '#F59E0B', borderLeftWidth: 4 },
  substitutionBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  subText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  typeItem: { paddingVertical: 15, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  typeItemActive: { backgroundColor: '#F5F3FF' },
  typeText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  typeTextActive: { color: '#8B5CF6', fontWeight: '800' },

  weekStripContainer: { marginBottom: 20 },
  weekStrip: { paddingHorizontal: 20, gap: 10 },
  weekDayBtn: { width: 50, height: 75, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  weekDayBtnActive: { backgroundColor: '#6366F1', borderColor: '#6366F1', shadowColor: '#6366F1', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  weekDayName: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginBottom: 6 },
  weekDayNameActive: { color: '#E0E7FF' },
  weekDayDate: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  weekDayDateActive: { color: '#FFF' },

  freeSummary: { marginTop: 20, padding: 20, backgroundColor: '#F5F3FF', borderRadius: 16, borderWidth: 1, borderColor: '#E0E7FF' },
  freeSummaryTitle: { fontSize: 9, fontWeight: '900', color: '#8B5CF6', letterSpacing: 1, marginBottom: 15 },
  freeGapRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  freeGapText: { fontSize: 13, fontWeight: '700', color: '#475569', marginLeft: 10 },
});

export default TeacherTimetableScreen;
