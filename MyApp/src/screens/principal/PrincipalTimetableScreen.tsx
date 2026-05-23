import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

const TOP_TABS = ['Weekly Dashboard', 'Timetable Builder', 'Leave Management', 'Academic Setup', 'Period Settings'];

const STATS = [
  { id: 1, label: 'Classes Scheduled', value: '0', icon: 'calendar', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 2, label: 'Active Substitutions', value: '0', icon: 'swap-horizontal', color: '#F97316', bg: '#FFF7ED' },
  { id: 3, label: 'Week Beginning', value: '2026-03-30', icon: 'time-outline', color: '#10B981', bg: '#ECFDF5' },
];

const PERIODS = [
  { id: 1, name: 'PERIOD 1', time: '09:00 - 09:45', isBreak: false },
  { id: 2, name: 'PERIOD 2', time: '09:45 - 10:30', isBreak: false },
  { id: 3, name: 'PERIOD 3', time: '10:30 - 11:15', isBreak: false },
  { id: 'BREAK', name: 'Lunch', time: '11:15 - 12:00', isBreak: true },
  { id: 4, name: 'PERIOD 4', time: '12:00 - 12:45', isBreak: false },
  { id: 5, name: 'PERIOD 5', time: '12:45 - 13:30', isBreak: false },
  { id: 6, name: 'PERIOD 6', time: '13:30 - 14:15', isBreak: false },
];

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const PrincipalTimetableScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Weekly Dashboard');
  const [activeWeek, setActiveWeek] = useState('This Week');
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timetableData, setTimetableData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time Picker States
  const [timePickerTarget, setTimePickerTarget] = useState<string | null>(null);
  const [newPeriodStart, setNewPeriodStart] = useState('');
  const [newPeriodEnd, setNewPeriodEnd] = useState('');
  const [tempHour, setTempHour] = useState('09');

  // Fetch timetable data
  useEffect(() => {
    const fetchTimetableData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiClient.get(ENDPOINTS.PRINCIPAL.TIMETABLE);
        const data = res.data.data || res.data;
        setTimetableData(data);
      } catch (error: any) {
        console.error('Failed to fetch timetable data:', error);
        setError('Failed to load timetable data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTimetableData();
  }, []);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Re-trigger useEffect
    setTimetableData(null);
  };
  const [tempMin, setTempMin] = useState('00');
  const [tempAmPm, setTempAmPm] = useState('AM');

  const openTimePicker = (target: string) => {
    setTimePickerTarget(target);
    setTempHour('09');
    setTempMin('00');
    setTempAmPm('AM');
  };

  const confirmTimePicker = () => {
    const formatted = `${tempHour}:${tempMin} ${tempAmPm}`;
    if (timePickerTarget === 'start') {
      setNewPeriodStart(formatted);
    } else {
      setNewPeriodEnd(formatted);
    }
    setTimePickerTarget(null);
  };

  // Date Picker States
  const [datePickerTarget, setDatePickerTarget] = useState<string | null>(null); // 'from' | 'to'
  const [leaveFromDate, setLeaveFromDate] = useState('');
  const [leaveToDate, setLeaveToDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const openDatePicker = (target: string) => {
    setDatePickerTarget(target);
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const generateDates = () => {
    const dates = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // adjust for Sunday index mapping visually: Sun=0, Mon=1...
    for (let i = 0; i < firstDay; i++) {
      dates.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(i);
    }
    return dates;
  };

  const handleDateSelect = (day: number | null) => {
    if (!day) return;
    const formatted = `${String(currentMonth.getMonth() + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${currentMonth.getFullYear()}`;
    if (datePickerTarget === 'from') setLeaveFromDate(formatted);
    else setLeaveToDate(formatted);
    setDatePickerTarget(null);
  };

  // --- TAB 1: WEEKLY DASHBOARD ---
  const renderWeeklyDashboard = () => (
    <>
      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitle}>Timetable Management</Text>
        <Text style={styles.pageSubtitle}>Manage class schedules and monitor teacher substitutions.</Text>
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity style={styles.selectClassBtn}>
          <Ionicons name="person-outline" size={14} color="#6B7280" style={{marginRight: 6}} />
          <Text style={styles.selectClassText}>Select Class</Text>
          <Ionicons name="chevron-down" size={16} color="#4B5563" style={{marginLeft: 'auto'}} />
        </TouchableOpacity>

        <View style={styles.weekToggleContainer}>
          {['Prev', 'This', 'Next'].map(week => (
            <TouchableOpacity key={week} style={styles.weekPill} onPress={() => setActiveWeek(week)}>
              <Text style={[styles.weekPillText, activeWeek === week && styles.weekPillTextActive]}>{week}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Animated.View entering={FadeInUp.duration(300)} style={styles.statsRow}>
        <View style={styles.statsGrid}>
          {(timetableData?.stats || STATS).map((stat: any) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: stat.bg || '#F5F3FF' }]}>
                <Ionicons name={stat.icon || 'calendar'} size={18} color={stat.color || '#8B5CF6'} />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(500)} style={styles.gridCanvasOuter}>
        <View style={styles.gridCanvasInner}>
          <View style={{flexDirection: 'row'}}>
            <View style={styles.daysColumn}>
              <View style={styles.cornerCell} />
              {(timetableData?.days || DAYS).map((day: any) => (
                <View key={day} style={styles.dayCell}>
                  <Text style={styles.dayText}>{day}</Text>
                </View>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.gridContentWrapper}>
                <View style={styles.periodsHeaderRow}>
                  {(timetableData?.periods || PERIODS).map((period: any) => (
                    <View key={period.id} style={period.isBreak ? styles.breakHeaderCell : styles.periodCell}>
                      {!period.isBreak && <Text style={styles.periodName}>{period.name}</Text>}
                      <Text style={styles.periodTime}>{period.time}</Text>
                    </View>
                  ))}
                </View>

                {DAYS.map(day => (
                  <View key={day} style={styles.gridRow}>
                    <View style={styles.rowDashedLine} />
                    {PERIODS.map(period => {
                      if (period.isBreak) {
                         return (
                           <View key={`${day}-break`} style={styles.breakCellOuter}>
                              {day === 'WED' && (
                                <View style={styles.breakTextAbsoluteWrapper}>
                                  <Text style={styles.breakVerticalText}>BREAK</Text>
                                </View>
                              )}
                           </View>
                         );
                      }
                      return (
                        <View key={`${day}-${period.id}`} style={styles.contentCell}>
                          <View style={styles.freeCard}>
                            <Text style={styles.freeText}>FREE</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Animated.View>
    </>
  );

  // --- TAB 2: TIMETABLE BUILDER ---
  const renderTimetableBuilder = () => (
    <Animated.View entering={FadeInUp.duration(300)} style={styles.builderLayout}>
      
      {/* Mobile-first: Class Selection Sidebar turned into a Top Card */}
      <View style={[styles.classSubjectsSidebar, { minHeight: 'auto', marginBottom: 20 }]}>
        <Text style={styles.sidebarTitle}>Class Subjects</Text>
        <Text style={styles.pageSubtitle}>Select a class first</Text>
        <View style={styles.emptySidebarState}>
          <Text style={styles.emptySidebarLabel}>Select a class to see available subjects</Text>
        </View>
      </View>

      <View style={styles.builderMainCard}>
        <View style={styles.builderHeader}>
          <View style={styles.builderHeaderTitles}>
            <Text style={styles.pageTitle}>Timetable Template</Text>
            <Text style={styles.pageSubtitle}>Configure recurring schedules.</Text>
          </View>
          <View style={styles.builderActionRow}>
            <TouchableOpacity style={styles.btnYellow}><Ionicons name="flash" size={14} color="#B45309" style={{marginRight:4}} /><Text style={styles.btnYellowText}>Auto-Gen</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnPurple}><Ionicons name="save-outline" size={14} color="#FFF" style={{marginRight:4}} /><Text style={styles.btnPurpleText}>Save</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.builderFilters}>
          <View style={{flex: 1, marginRight: 12}}>
            <Text style={styles.inputMiniLabel}>SELECT CLASS</Text>
            <TouchableOpacity style={styles.dropdownMini}>
              <Text style={styles.dropdownMiniText}>Choose Class...</Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.inputMiniLabel}>ACADEMIC YEAR</Text>
            <TouchableOpacity style={[styles.dropdownMini, {borderWidth: 0}]}>
              <Text style={styles.dropdownMiniBoldText}>2024 - 2025</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Responsive Horizontal Scroll Grid for Builder */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 24}}>
          <View style={styles.builderGridInner}>
             <View style={{flexDirection: 'row'}}>
               <View style={styles.builderTimeColumn}>
                  <View style={styles.builderCornerCell} />
                  {PERIODS.map(p => (
                    <View key={`time-${p.id}`} style={p.isBreak ? styles.builderBreakLabelCell : styles.builderTimeCell}>
                      <Text style={styles.builderTimeBold}>{p.time.split(' - ')[0]}</Text>
                      <Text style={styles.builderTimeMuted}>{p.name}</Text>
                    </View>
                  ))}
               </View>
               <View style={{flex: 1}}>
                 <View style={styles.builderDaysRow}>
                    {DAYS.map(d => (
                      <View key={`day-${d}`} style={styles.builderDayCell}><Text style={styles.builderDayText}>{d}</Text></View>
                    ))}
                 </View>
                 {PERIODS.map(p => (
                    <View key={`row-${p.id}`} style={styles.builderContentRow}>
                      {DAYS.map(d => {
                        if (p.isBreak) {
                          return (
                            <View key={`${d}-${p.id}`} style={styles.builderBreakCell}>
                               {(d === 'WED') && <Text style={styles.breakHorizontalText}>B  R  E  A  K</Text>}
                            </View>
                          );
                        }
                        return (
                          <TouchableOpacity key={`${d}-${p.id}`} style={styles.assignBoxOuter}>
                             <View style={styles.assignBoxInner}>
                               <Text style={styles.assignIcon}>+</Text>
                               <Text style={styles.assignText}>ASSIGN</Text>
                             </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                 ))}
               </View>
             </View>
          </View>
        </ScrollView>
      </View>

    </Animated.View>
  );

  // --- TAB 3: LEAVE MANAGEMENT ---
  const renderLeaveManagement = () => (
    <Animated.View entering={FadeInUp.duration(300)}>
      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitle}>Teacher Leave Management</Text>
        <Text style={styles.pageSubtitle}>Coordinate absences and manage classroom continuity.</Text>
      </View>

      <View style={styles.leaveContainer}>
        {/* Mobile View: Form first */}
        <View style={styles.leaveFormCard}>
           <View style={styles.leaveHeaderIcon}>
              <Ionicons name="calendar" size={16} color="#8B5CF6" />
              <Text style={styles.leaveHeaderTitle}>Request New Leave</Text>
           </View>
           
           <View style={styles.mobileInputGroup}>
             <Text style={styles.inputLabel}>SELECT TEACHER</Text>
             <TouchableOpacity style={styles.dropdownInput}>
               <Text style={styles.dropdownPlaceholder}>Choose a teacher...</Text>
               <Ionicons name="chevron-down" size={16} color="#6B7280" />
             </TouchableOpacity>
           </View>

           <View style={styles.mobileInputRow}>
             <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>FROM DATE</Text>
                <TouchableOpacity style={styles.dateInputWrapper} onPress={() => openDatePicker('from')}>
                   <Text style={[styles.dateInputText, !leaveFromDate && {color: '#9CA3AF'}]}>{leaveFromDate || 'mm/dd/yyyy'}</Text>
                   <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                </TouchableOpacity>
             </View>
             <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>TO DATE</Text>
                <TouchableOpacity style={styles.dateInputWrapper} onPress={() => openDatePicker('to')}>
                   <Text style={[styles.dateInputText, !leaveToDate && {color: '#9CA3AF'}]}>{leaveToDate || 'mm/dd/yyyy'}</Text>
                   <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                </TouchableOpacity>
             </View>
           </View>

           <View style={styles.mobileInputGroup}>
             <Text style={styles.inputLabel}>REASON FOR LEAVE</Text>
             <TextInput 
               style={styles.textAreaMobile} 
               placeholder="Explain the reason for absence..." 
               placeholderTextColor="#9CA3AF"
               multiline 
             />
           </View>

           <TouchableOpacity style={styles.submitBtn}>
             <Text style={styles.submitBtnText}>Process Leave Request</Text>
           </TouchableOpacity>
        </View>

        {/* Right Content stacked below for Mobile */}
        <View style={styles.leaveRightContent}>
           <View style={styles.mobileInputRow}>
             <View style={[styles.statCardSlim, {flex: 1}]}>
                <Text style={styles.slimStatLabel}>Active Leaves</Text>
                <Text style={styles.slimStatValue}>00</Text>
             </View>
             <View style={[styles.statCardSlim, {flex: 1.2}]}>
                <Text style={styles.slimStatLabel}>Coverage</Text>
                <View style={{flexDirection:'row', alignItems:'center', marginTop:2}}>
                   <Text style={styles.slimStatValue}>Auto</Text>
                   <View style={styles.engineBadge}><Text style={styles.engineBadgeText}>ENGINE ACTIVE</Text></View>
                </View>
             </View>
           </View>

           <View style={styles.infoBannerPurple}>
              <Ionicons name="information-circle-outline" size={18} color="#9333EA" style={{marginTop:2}} />
              <View style={{marginLeft: 10, flex: 1}}>
                 <Text style={styles.infoBannerTitle}>Real-time Substitution Engine</Text>
                 <Text style={styles.infoBannerDesc}>Processing a leave automatically triggers the substitution engine to find optimal covers based on schedule and subject expertise.</Text>
              </View>
           </View>

           <View style={styles.leaveTableCard}>
              <View style={styles.tableHeaderSection}><Text style={styles.tableCardTitle}>Active Leaves & Covers</Text></View>
              <View style={styles.tableColsRow}>
                <Text style={[styles.colHeader, {flex: 1}]}>TEACHER</Text>
                <Text style={[styles.colHeader, {flex: 1, textAlign: 'center'}]}>DURATION</Text>
                <Text style={[styles.colHeader, {flex: 1, textAlign: 'right'}]}>STATUS</Text>
              </View>
              <View style={styles.emptyTableState}>
                 <Text style={styles.emptyTableLabel}>No active leave requests</Text>
              </View>
           </View>
        </View>
      </View>
    </Animated.View>
  );

  // --- TAB 4: ACADEMIC SETUP ---
  const renderAcademicSetup = () => (
    <Animated.View entering={FadeInUp.duration(300)}>
      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitle}>Academic Setup</Text>
        <Text style={styles.pageSubtitle}>Define subjects for each class and assign teachers.</Text>
      </View>
      <View style={{paddingHorizontal: 16, marginBottom: 20}}>
        <Text style={styles.inputMiniLabel}>SELECT CLASS</Text>
        <TouchableOpacity style={styles.dropdownInput}>
          <Text style={styles.dropdownPlaceholder}>Choose a class...</Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.massiveEmptyCard}>
        <Ionicons name="school-outline" size={40} color="#CBD5E1" style={{marginBottom: 12}} />
        <Text style={styles.massiveEmptyTitle}>Select a class to manage subjects</Text>
        <Text style={styles.massiveEmptySub}>Choose a class above to add subjects and assign teachers.</Text>
      </View>
    </Animated.View>
  );

  // --- TAB 5: PERIOD SETTINGS ---
  const renderPeriodSettings = () => (
    <Animated.View entering={FadeInUp.duration(300)}>
      <View style={[styles.pageTitleContainer, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}]}>
        <View style={{flex: 1}}>
          <Text style={styles.pageTitle}>Period Settings</Text>
          <Text style={styles.pageSubtitle}>Define the general schedule.</Text>
        </View>
        <TouchableOpacity style={styles.btnPurpleSolid} onPress={() => setIsAddPeriodOpen(true)}>
          <Text style={styles.btnPurpleSolidText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.periodLayout}>
        <View style={styles.infoBannerLightPurple}>
          <View style={styles.infoIconCube}>
            <Ionicons name="cube-outline" size={16} color="#9333EA" />
          </View>
          <View style={{marginLeft: 12, flex: 1}}>
             <Text style={styles.infoBannerTitleLine}>How periods work</Text>
             <Text style={styles.infoBannerDescLine}>Periods defined here will be used to generate grids. Mark breaks like Lunch with the "Is Break" toggle so subjects cannot be scheduled.</Text>
          </View>
        </View>

        <View style={styles.periodListWrapper}>
          {PERIODS.map(p => (
            <View key={p.id} style={styles.periodListRow}>
              <View style={[styles.periodNumberBox, p.isBreak && styles.periodNumberBoxBreak]}>
                <Text style={[styles.periodNumberText, p.isBreak && styles.periodNumberTextBreak]}>
                  {p.isBreak ? '4' : p.id}
                </Text>
              </View>
              <View style={styles.periodListDetails}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.periodListTitle}>{p.name}</Text>
                  {p.isBreak && <View style={styles.breakMiniBadge}><Text style={styles.breakMiniBadgeText}>BREAK</Text></View>}
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                   <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                   <Text style={styles.periodListTimeText}>{p.time}</Text>
                </View>
              </View>
              {p.id === 1 && (
                <View style={styles.periodActionIcons}>
                   <Ionicons name="pencil" size={16} color="#9CA3AF" style={{marginHorizontal:8}}/>
                   <Ionicons name="trash-outline" size={16} color="#9CA3AF" style={{marginHorizontal:8}}/>
                </View>
              )}
            </View>
          ))}
        </View>

        {isAddPeriodOpen && (
          <Animated.View entering={FadeInUp} style={styles.addPeriodDrawer}>
            <View style={styles.addPeriodHeader}>
              <Text style={styles.addPeriodTitle}>+ New Period Configuration</Text>
            </View>
            
            {/* Mobile Stacked Form layout */}
            <View style={styles.mobileFormColumn}>
               <View style={styles.mobileInputGroup}>
                 <Text style={styles.inputMiniLabelLine}>LABEL (E.G., PERIOD 1, LUNCH)</Text>
                 <TextInput style={styles.flatInput} placeholder="Label" placeholderTextColor="#9CA3AF"/>
               </View>
               
               <View style={styles.mobileInputRow}>
                 <View style={{flex: 1}}>
                   <Text style={styles.inputMiniLabelLine}>START TIME</Text>
                   <TouchableOpacity style={styles.timeInputBox} onPress={() => openTimePicker('start')}>
                     <Text style={{color: newPeriodStart ? '#111827' : '#9CA3AF', fontSize: 13}}>{newPeriodStart || '--:-- --'}</Text>
                     <Ionicons name="time-outline" size={14} color="#6B7280" />
                   </TouchableOpacity>
                 </View>
                 <View style={{flex: 1}}>
                   <Text style={styles.inputMiniLabelLine}>END TIME</Text>
                   <TouchableOpacity style={styles.timeInputBox} onPress={() => openTimePicker('end')}>
                     <Text style={{color: newPeriodEnd ? '#111827' : '#9CA3AF', fontSize: 13}}>{newPeriodEnd || '--:-- --'}</Text>
                     <Ionicons name="time-outline" size={14} color="#6B7280" />
                   </TouchableOpacity>
                 </View>
               </View>

               <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
                  <View style={styles.checkboxOutline} />
                  <Text style={{marginLeft: 8, fontSize: 13, fontWeight: '600', color: '#374151'}}>Is Break</Text>
               </View>
            </View>
            
            <View style={styles.addPeriodFooter}>
               <TouchableOpacity onPress={() => setIsAddPeriodOpen(false)} style={{marginRight: 16}}>
                 <Text style={styles.cancelTextBtn}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.btnPurpleSolid} onPress={() => setIsAddPeriodOpen(false)}>
                 <Text style={styles.btnPurpleSolidText}>+ Add Period</Text>
               </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />

      <View style={styles.topHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={26} color="#111827" />
        </ScaleButton>
        <Text style={styles.topHeaderTitle} numberOfLines={1}>Welcome back, {authState.user?.name?.split(' ')[0] || 'Admin'}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnTransparent}><Ionicons name="notifications-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent} onPress={() => navigation.navigate('AccountSettings')}><Ionicons name="settings-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}><View style={styles.avatar}><Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'A'}</Text></View></TouchableOpacity>
        </View>
      </View>

      <Modal statusBarTranslucent={true} visible={!!timePickerTarget} transparent animationType="fade" onRequestClose={() => setTimePickerTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerContainer}>
            <Text style={styles.timePickerTitle}>Set {timePickerTarget === 'start' ? 'Start Time' : 'End Time'}</Text>
            
            <Text style={styles.timeSectionLabel}>Hour</Text>
            <View style={styles.timeGridRow}>
              {['08', '09', '10', '11', '12', '01', '02', '03'].map(h => (
                <TouchableOpacity key={h} style={[styles.timeChip, tempHour === h && styles.timeChipActive]} onPress={() => setTempHour(h)}>
                  <Text style={[styles.timeChipText, tempHour === h && styles.timeChipTextActive]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.timeSectionLabel}>Minute</Text>
            <View style={styles.timeGridRow}>
              {['00', '15', '30', '45'].map(m => (
                <TouchableOpacity key={m} style={[styles.timeChip, tempMin === m && styles.timeChipActive]} onPress={() => setTempMin(m)}>
                  <Text style={[styles.timeChipText, tempMin === m && styles.timeChipTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timeGridRowCentered}>
              <TouchableOpacity style={[styles.timeAmPmBtn, tempAmPm === 'AM' && styles.timeAmPmBtnActive]} onPress={() => setTempAmPm('AM')}><Text style={[styles.timeAmPmText, tempAmPm==='AM' && styles.timeChipTextActive]}>AM</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.timeAmPmBtn, tempAmPm === 'PM' && styles.timeAmPmBtnActive]} onPress={() => setTempAmPm('PM')}><Text style={[styles.timeAmPmText, tempAmPm==='PM' && styles.timeChipTextActive]}>PM</Text></TouchableOpacity>
            </View>

            <View style={styles.timePickerFooter}>
              <TouchableOpacity onPress={() => setTimePickerTarget(null)} style={{marginRight: 16}}><Text style={styles.cancelTextBtn}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnPurpleSolid} onPress={confirmTimePicker}><Text style={styles.btnPurpleSolidText}>Set Time</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- PURE JAVASCRIPT DATE PICKER --- */}
      <Modal statusBarTranslucent={true} visible={!!datePickerTarget} transparent animationType="fade" onRequestClose={() => setDatePickerTarget(null)}>
        <View style={styles.modalOverlay}>
           <View style={styles.calModalContainer}>
             <View style={styles.calHeader}>
               <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}><Ionicons name="chevron-back" size={20} color="#111827" /></TouchableOpacity>
               <Text style={styles.calMonthText}>
                 {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
               </Text>
               <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}><Ionicons name="chevron-forward" size={20} color="#111827" /></TouchableOpacity>
             </View>
             
             <View style={styles.calWeekdaysRow}>
               {['S','M','T','W','T','F','S'].map((wd, i) => <Text key={i} style={styles.calWeekdayText}>{wd}</Text>)}
             </View>
             
             <View style={styles.calDaysGrid}>
               {generateDates().map((day, idx) => (
                 <TouchableOpacity 
                   key={idx} 
                   style={[styles.calDayBtn, !day && {backgroundColor: 'transparent'}]} 
                   onPress={() => handleDateSelect(day)}
                   disabled={!day}
                 >
                   {day && <Text style={styles.calDayText}>{day}</Text>}
                 </TouchableOpacity>
               ))}
             </View>

             <TouchableOpacity style={styles.calCancelBtn} onPress={() => setDatePickerTarget(null)}>
               <Text style={styles.cancelTextBtn}>Cancel</Text>
             </TouchableOpacity>
           </View>
        </View>
      </Modal>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading timetable data...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Failed to Load Data</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <Ionicons name="refresh" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <>
            <View style={styles.tabsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                {TOP_TABS.map(tab => (
                  <TouchableOpacity 
                    key={tab} 
                    style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                    onPress={() => setActiveTab(tab)}
                  >
                    {tab === 'Weekly Dashboard' ? <Ionicons name="grid-outline" size={14} color={activeTab === tab ? '#FFF' : '#6B7280'} style={styles.tabIcon} /> :
                     tab === 'Timetable Builder' ? <Ionicons name="calendar-outline" size={14} color={activeTab === tab ? '#FFF' : '#6B7280'} style={styles.tabIcon} /> :
                     tab === 'Leave Management' ? <Ionicons name="people-outline" size={14} color={activeTab === tab ? '#FFF' : '#6B7280'} style={styles.tabIcon} /> :
                     <Ionicons name="settings-outline" size={14} color={activeTab === tab ? '#FFF' : '#6B7280'} style={styles.tabIcon} />
                    }
                    <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {activeTab === 'Weekly Dashboard' && renderWeeklyDashboard()}
            {activeTab === 'Timetable Builder' && renderTimetableBuilder()}
            {activeTab === 'Leave Management' && renderLeaveManagement()}
            {activeTab === 'Academic Setup' && renderAcademicSetup()}
            {activeTab === 'Period Settings' && renderPeriodSettings()}
          </>
        )}

      </ScrollView>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },

  errorContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16, backgroundColor: '#FFF', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  menuHandle: { paddingRight: 4, paddingVertical: 8 }, 
  topHeaderTitle: { fontSize: 18, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#A78BFA', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  tabsContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabsScroll: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 12 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#A855F7' },
  tabIcon: { marginRight: 6 },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  tabBtnTextActive: { color: '#FFF' },

  pageTitleContainer: { paddingHorizontal: 16, marginTop: 24, marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  pageSubtitle: { color: '#6B7280', fontSize: 13, fontWeight: '400' },

  // --- MOBILE FORM UTILS (USED ACROSS TABS) ---
  mobileFormColumn: { display: 'flex', flexDirection: 'column', gap: 20 },
  mobileInputGroup: { display: 'flex', flexDirection: 'column' },
  mobileInputRow: { flexDirection: 'row', gap: 12 },

  // --- DASHBOARD STYLES ---
  filtersRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20, gap: 12 },
  selectClassBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 14, flex: 1.1 },
  selectClassText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  weekToggleContainer: { flex: 0.9, flexDirection: 'row', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: '#FFF' },
  weekPill: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#F3F4F6' },
  weekPillText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  weekPillTextActive: { color: '#8B5CF6' },

  // Modified stats for Mobile View
  statsRow: { paddingHorizontal: 16, marginBottom: 24 },
  statsGrid: { flexDirection: 'column', gap: 12 }, // Stacked on very small screens or use wrap
  statCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 24, flexDirection: 'row', alignItems: 'center' },
  statIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statTextContainer: { flex: 1 },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111827' },

  gridCanvasOuter: { paddingHorizontal: 16, marginBottom: 20 },
  gridCanvasInner: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  daysColumn: { width: 60, borderRightWidth: 1, borderRightColor: '#F3F4F6', backgroundColor: '#FFF', zIndex: 2 },
  cornerCell: { height: 60, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dayCell: { height: 70, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 11, fontWeight: '800', color: '#4B5563' },
  
  gridContentWrapper: { paddingRight: 16 },
  periodsHeaderRow: { flexDirection: 'row', height: 60, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  periodCell: { width: 120, justifyContent: 'center', alignItems: 'center' },
  periodName: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 4 },
  periodTime: { fontSize: 11, fontWeight: '800', color: '#374151' },
  breakHeaderCell: { width: 40, justifyContent: 'center', alignItems: 'center' },
  
  gridRow: { flexDirection: 'row', height: 70 },
  rowDashedLine: { position: 'absolute', top: 0, left: 0, right: 0, borderTopWidth: 1, borderColor: '#F3F4F6', borderStyle: 'dashed' },
  contentCell: { width: 120, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 10 },
  freeCard: { width: '100%', height: '100%', borderRadius: 8, borderWidth: 1.5, borderColor: '#F4F4F5', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  freeText: { fontSize: 10, fontWeight: '800', color: '#D4D4D8', letterSpacing: 0.5 },
  
  breakCellOuter: { width: 40, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F8FAFC', backgroundColor: '#FAFAFA', position: 'relative' },
  breakTextAbsoluteWrapper: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', width: 40, height: 70, zIndex: 10 },
  breakVerticalText: { width: 150, textAlign: 'center', fontSize: 12, fontWeight: '800', color: '#D1D5DB', letterSpacing: 3, transform: [{ rotate: '-90deg' }] },

  // --- BUILDER STYLES (MOBILE ALIGNED) ---
  builderLayout: { paddingHorizontal: 16 },
  builderMainCard: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 24, marginBottom: 20 },
  classSubjectsSidebar: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, minHeight: 120, justifyContent:'center' },
  builderHeader: { flexDirection: 'column', gap: 12, marginBottom: 20 },
  builderHeaderTitles: {},
  builderActionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnYellow: { flex: 1, justifyContent:'center', flexDirection: 'row', backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnYellowText: { color: '#B45309', fontWeight: '700', fontSize: 12 },
  btnPurple: { flex: 1, justifyContent:'center', flexDirection: 'row', backgroundColor: '#D8B4FE', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnPurpleText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  builderFilters: { flexDirection: 'row', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 16 },
  inputMiniLabel: { fontSize: 9, fontWeight: '800', color: '#6B7280', marginBottom: 6 },
  dropdownMini: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dropdownMiniText: { fontSize: 13, color: '#111827', fontWeight: '600' },
  dropdownMiniBoldText: { fontSize: 13, color: '#111827', fontWeight: '800' },

  sidebarTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  emptySidebarState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  emptySidebarLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  builderGridInner: { borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, overflow: 'hidden' },
  builderTimeColumn: { width: 70, borderRightWidth: 1, borderRightColor: '#F3F4F6', backgroundColor: '#FFF' },
  builderCornerCell: { height: 40, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  builderTimeCell: { height: 75, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  builderBreakLabelCell: { height: 40, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F8FAFC', backgroundColor:'#FAFAFA' },
  builderTimeBold: { fontSize: 12, fontWeight: '800', color: '#111827' },
  builderTimeMuted: { fontSize: 9, fontWeight: '600', color: '#9CA3AF', marginTop: 2 },
  builderDaysRow: { flexDirection: 'row', height: 40, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFF' },
  builderDayCell: { width: 120, justifyContent: 'center', alignItems: 'center' },
  builderDayText: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1 },
  builderContentRow: { flexDirection: 'row' },
  assignBoxOuter: { width: 120, height: 75, justifyContent: 'center', alignItems: 'center', padding: 6 },
  assignBoxInner: { width: '100%', height: '100%', borderRadius: 8, borderWidth: 1.5, borderColor: '#F4F4F5', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  assignIcon: { color: '#CBD5E1', fontSize: 18, fontWeight: '300' },
  assignText: { color: '#D1D5DB', fontSize: 9, fontWeight: '800', marginTop: -2 },
  builderBreakCell: { width: 120, height: 40, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  breakHorizontalText: { fontSize: 11, fontWeight: '800', color: '#D1D5DB', letterSpacing: 4 },

  // --- LEAVE MANAGEMENT STYLES (MOBILE ALIGNED) ---
  leaveContainer: { paddingHorizontal: 16, flexDirection: 'column', gap: 20 },
  leaveFormCard: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 24 },
  leaveHeaderIcon: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  leaveHeaderTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginLeft: 8 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', marginBottom: 8 },
  dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 14, height: 44, width: '100%' },
  dropdownPlaceholder: { fontSize: 13, color: '#9CA3AF', fontWeight:'500' },
  dateInputWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 14, height: 44, width: '100%' },
  dateInputText: { fontSize: 13, color: '#111827' },
  textAreaMobile: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, height: 100, textAlignVertical: 'top', fontSize: 13, backgroundColor: '#FFF', width: '100%' },
  submitBtn: { backgroundColor: '#9333EA', paddingVertical: 14,
    paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  
  leaveRightContent: { flex: 1, display: 'flex', gap: 20 },
  statCardSlim: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 16 },
  slimStatLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
  slimStatValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  engineBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  engineBadgeText: { fontSize: 8, fontWeight: '800', color: '#4F46E5' },
  infoBannerPurple: { backgroundColor: '#FAF5FF', borderRadius: 12, padding: 16, flexDirection: 'row', borderWidth: 1, borderColor: '#F3E8FF' },
  infoBannerTitle: { fontSize: 12, fontWeight: '800', color: '#6B21A8', marginBottom: 4 },
  infoBannerDesc: { fontSize: 11, color: '#9333EA', lineHeight: 16 },
  leaveTableCard: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  tableHeaderSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tableCardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  tableColsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  colHeader: { fontSize: 10, fontWeight: '800', color: '#9CA3AF' },
  emptyTableState: { paddingVertical: 40, alignItems: 'center' },
  emptyTableLabel: { fontSize: 13, color: '#D1D5DB', fontWeight: '500', fontStyle: 'italic' },

  // --- ACADEMIC SETUP STYLES ---
  massiveEmptyCard: { marginHorizontal: 16, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 80, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  massiveEmptyTitle: { fontSize: 16, fontWeight: '800', color: '#6B7280', marginBottom: 8, textAlign: 'center' },
  massiveEmptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  // --- PERIOD SETTINGS STYLES ---
  btnPurpleSolid: { backgroundColor: '#9333EA', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnPurpleSolidText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  periodLayout: { paddingHorizontal: 16 },
  infoBannerLightPurple: { backgroundColor: '#FAF5FF', borderRadius: 12, padding: 16, flexDirection: 'row', marginBottom: 20 },
  infoIconCube: { backgroundColor: '#F3E8FF', width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  infoBannerTitleLine: { fontSize: 13, fontWeight: '800', color: '#6B21A8', marginBottom: 4 },
  infoBannerDescLine: { fontSize: 11, color: '#6B7280', lineHeight: 16 },
  periodListWrapper: { gap: 10, marginBottom: 20 },
  periodListRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 14 },
  periodNumberBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  periodNumberText: { color: '#9333EA', fontSize: 12, fontWeight: '800' },
  periodNumberBoxBreak: { backgroundColor: '#FFF7ED' },
  periodNumberTextBreak: { color: '#F97316' },
  periodListDetails: { flex: 1 },
  periodListTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  periodListTimeText: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginLeft: 4 },
  breakMiniBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  breakMiniBadgeText: { fontSize: 9, fontWeight: '800', color: '#F97316' },
  periodActionIcons: { flexDirection: 'row' },
  addPeriodDrawer: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  addPeriodHeader: { marginBottom: 20 },
  addPeriodTitle: { fontSize: 14, fontWeight: '800', color: '#6B21A8' },
  inputMiniLabelLine: { fontSize: 10, fontWeight: '800', color: '#6B7280', marginBottom: 6 },
  flatInput: { height: 44, width: '100%', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#FFF' },
  timeInputBox: { height: 44, width: '100%', flexDirection: 'row', alignItems:'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 12, backgroundColor: '#FFF' },
  checkboxOutline: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#9CA3AF' },
  addPeriodFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  cancelTextBtn: { fontSize: 13, fontWeight: '700', color: '#6B7280' },

  // --- TIME PICKER MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  timePickerContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  timePickerTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12, textAlign: 'center' },
  timeSectionLabel: { fontSize: 11, fontWeight: '800', color: '#6B7280', marginBottom: 8, marginTop: 10 },
  timeGridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { width: '22%', aspectRatio: 1.5, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: '#F3F4F6' },
  timeChipActive: { backgroundColor: '#9333EA' },
  timeChipText: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
  timeChipTextActive: { color: '#FFF' },
  timeGridRowCentered: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24, marginBottom: 10 },
  timeAmPmBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  timeAmPmBtnActive: { backgroundColor: '#9333EA', borderColor: '#9333EA' },
  timeAmPmText: { fontSize: 14, fontWeight: '800', color: '#4B5563' },
  timePickerFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },

  // --- DATE PICKER MODAL STYLES ---
  calModalContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calNavBtn: { width: 32, height: 32, backgroundColor: '#F3F4F6', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  calMonthText: { fontSize: 15, fontWeight: '800', color: '#111827' },
  calWeekdaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  calWeekdayText: { width: '14%', textAlign: 'center', fontSize: 11, fontWeight: '800', color: '#9CA3AF' },
  calDaysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  calDayBtn: { width: '14%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 8 },
  calDayText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  calCancelBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' }

});

export default PrincipalTimetableScreen;
