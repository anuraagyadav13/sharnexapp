import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type TimetableNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Timetable'>;

interface Props {
  navigation: TimetableNavigationProp;
}

// TimetableScreen uses theme tokens from useTheme() — local BRAND removed.
// Subject-specific icon colours (iconBg/iconColor per subject) are visual
// identity colours with no equivalent theme token; left as design constants.

const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const getSubjectColors = (subject?: string, isDarkMode?: boolean) => {
  const norm = typeof subject === 'string' ? subject.toLowerCase().trim() : '';
  if (norm.includes('science')) return { iconBg: '#FFEDD5', iconColor: '#C2410C' };
  if (norm.includes('maths')) return { iconBg: '#FCE7F3', iconColor: '#DB2777' };
  if (norm.includes('english')) return { iconBg: '#E0F2FE', iconColor: '#0369A1' };
  if (norm.includes('computer')) return { iconBg: '#E2E8F0', iconColor: '#334155' };
  if (norm.includes('hindi')) return { iconBg: '#CCFBF1', iconColor: '#0F766E' };
  return { iconBg: '#F3E8FF', iconColor: '#7E22CE' };
};

const getSubjectIcon = (subject?: string) => {
  const norm = typeof subject === 'string' ? subject.toLowerCase().trim() : '';
  if (norm.includes('science')) return 'flask';
  if (norm.includes('maths')) return 'calculator';
  if (norm.includes('english')) return 'book';
  if (norm.includes('computer')) return 'laptop';
  if (norm.includes('hindi')) return 'language';
  return 'document-text';
};

const TimetableScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const s = getStyles(theme, isDarkMode);
  const { authState } = useAuth();
  
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'events'>('day');
  
  const [schedule, setSchedule] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentDayKey = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState(currentDayKey);

  const normalizeTime = useCallback((value: string) => {
    if (!value) return '';
    const match = value.match(/(\d{1,2}):(\d{2})/);
    if (!match) return value.trim().slice(0, 5);
    let [_, hours, minutes] = match;
    if (hours.length === 1) hours = `0${hours}`;
    return `${hours}:${minutes}`;
  }, []);

  const calculateStatus = useCallback((startTime: string, endTime: string) => {
    try {
      if (!startTime || !endTime) return 'Upcoming';
      const now = new Date();
      const nStart = normalizeTime(startTime);
      const nEnd = normalizeTime(endTime);
      const [startH, startM] = nStart.split(':').map(Number);
      const [endH, endM] = nEnd.split(':').map(Number);

      const start = new Date(now); start.setHours(startH, startM, 0);
      const end = new Date(now); end.setHours(endH, endM, 0);

      if (now >= start && now <= end) return 'Ongoing';
      if (now > end) return 'Completed';
      return 'Upcoming';
    } catch (e) { return 'Upcoming'; }
  }, [normalizeTime]);

  const normalizeApiData = useCallback((data: any) => {
    const DAY_MAP_IDX = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const flattenedSlots: any[] = [];

    if (Array.isArray(data?.schedule)) {
      data.schedule.forEach((dayData: any) => {
        const dateStr: string = dayData.date || '';
        const dayKey = dateStr
          ? DAY_MAP_IDX[new Date(dateStr + 'T00:00:00').getDay()]
          : currentDayKey;

        (dayData.slots || []).forEach((slot: any) => {
          const start = slot.period?.start || slot.startTime || slot.time || '';
          const end = slot.period?.end || slot.endTime || '';
          
          flattenedSlots.push({
            ...slot,
            day: dayKey,
            subject: typeof slot.subject === 'string' ? slot.subject : slot.subject?.name || 'Subject',
            teacher: slot.teacher || { name: '-' },
            startTime: normalizeTime(start.slice(0, 5)),
            endTime: normalizeTime(end.slice(0, 5)),
            status: slot.status || calculateStatus(start, end),
          });
        });
      });
      return flattenedSlots;
    }

    let slots: any[] = [];
    if (Array.isArray(data)) slots = data;
    else if (Array.isArray(data?.data)) slots = data.data;

    return slots.map((slot: any) => {
      const start = slot.period?.start || slot.startTime || slot.time || '';
      const end = slot.period?.end || slot.endTime || '';
      const day = slot.day || slot.weekDay || slot.dayOfWeek || currentDayKey;
      const teacherRaw = slot.teacher;
      const teacher = typeof teacherRaw === 'string' ? { name: teacherRaw } : teacherRaw || { name: slot.teacherName || '-' };

      return {
        ...slot,
        day,
        subject: typeof slot.subject === 'string' ? slot.subject : slot.subject?.name || slot.subjectName || 'Subject',
        teacher,
        startTime: normalizeTime(start.slice(0, 5)),
        endTime: normalizeTime(end.slice(0, 5)),
        status: slot.status || calculateStatus(start, end),
      };
    });
  }, [currentDayKey, normalizeTime, calculateStatus]);

  const fetchTimetable = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      setSchedule([]);

      const meRes = await studentService.getMe();
      const meData = meRes.normalized?.data;
      const classId = meData?.student?.classId || meData?.classId || '';
      
      if (!classId) throw new Error('Could not resolve classId from /auth/me');

      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      const weekStart = monday.toISOString().split('T')[0];
      
      const res = await studentService.getClassSchedule(classId, weekStart);
      const normalized = normalizeApiData({ schedule: res.normalized?.data });
      
      setSchedule(normalized);
    } catch (err: any) {
      setError(err.message || 'Failed to load timetable.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchTimetable(true);
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    try {
      setIsEventsLoading(true);
      
      const [eventsRes, holidaysRes, examsRes] = await Promise.allSettled([
        studentService.getCalendarEvents(),
        studentService.getCalendarHolidays(),
        studentService.getCalendarExams()
      ]);

      if (eventsRes.status === 'fulfilled') {
        const eData = eventsRes.value?.normalized?.data || eventsRes.value?.data || [];
        setEvents(Array.isArray(eData) ? eData : []);
      }
      
      if (holidaysRes.status === 'fulfilled') {
        const hData = holidaysRes.value?.normalized?.data || holidaysRes.value?.data || [];
        setHolidays(Array.isArray(hData) ? hData : []);
      }

      if (examsRes.status === 'fulfilled') {
        const exData = examsRes.value?.normalized?.data || examsRes.value?.data || [];
        setExams(Array.isArray(exData) ? exData : []);
      }
    } catch (e) {
      // Ignore errors for silent fetching
    } finally {
      setIsEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  useEffect(() => {
    if (activeTab === 'events' && events.length === 0 && holidays.length === 0 && exams.length === 0) {
      fetchCalendarEvents();
    }
  }, [activeTab]);

  const dynamicTimes = useMemo(() => {
    const times = new Set<string>();
    schedule.forEach(item => {
      if (item.startTime) times.add(item.startTime);
    });
    const sorted = Array.from(times).sort();
    return sorted.length > 0 ? sorted : ['09:00', '09:45', '10:30', '11:15', '12:00', '12:45', '13:30'];
  }, [schedule]);

  const scheduleMap = useMemo(() => {
    const dayMap: Record<string, string> = {
      'MONDAY': 'MON', 'TUESDAY': 'TUE', 'WEDNESDAY': 'WED',
      'THURSDAY': 'THU', 'FRIDAY': 'FRI', 'SATURDAY': 'SAT',
      'SUNDAY': 'SUN'
    };

    const map: Record<string, any> = {};
    schedule.forEach(item => {
      let itemDay = typeof item.day === 'string' ? item.day.trim().toUpperCase() : '';
      const normalizedDay = dayMap[itemDay] || itemDay;
      const itemStart = item.startTime;
      map[`${normalizedDay}-${itemStart}`] = item;
    });
    return map;
  }, [schedule]);

  const getCellData = useCallback((day: string, time: string) => {
    return scheduleMap[`${day}-${time}`];
  }, [scheduleMap]);

  const daySchedule = useMemo(() => {
    const slotsForDay = dynamicTimes.map(time => {
      return getCellData(selectedDay, time) || { 
        startTime: time, 
        isFreePeriod: true,
        subject: 'Free period'
      };
    });
    
    // Hardcode lunch break insertion logic as seen in UI design at 11:15
    const withLunch = [];
    let lunchAdded = false;
    for (let slot of slotsForDay) {
      if (slot.startTime >= '11:15' && !lunchAdded) {
        withLunch.push({ type: 'lunch', startTime: '11:15', endTime: '12:00' });
        lunchAdded = true;
      }
      withLunch.push(slot);
    }
    return withLunch;
  }, [selectedDay, dynamicTimes, getCellData]);

  const handleNextDay = () => {
    const idx = ALL_DAYS.indexOf(selectedDay);
    if (idx < ALL_DAYS.length - 1) setSelectedDay(ALL_DAYS[idx + 1]);
  };

  const handlePrevDay = () => {
    const idx = ALL_DAYS.indexOf(selectedDay);
    if (idx > 0) setSelectedDay(ALL_DAYS[idx - 1]);
  };

  // UI RENDERERS
  
  const renderDayTab = () => {
    // Calculate the actual date for the selected day based on the current week
    const now = new Date();
    const currentDayIdx = now.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Calculate distance from today to selected day
    const dayMap: Record<string, number> = { 'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6 };
    const selectedIdx = dayMap[selectedDay];
    
    const diff = selectedIdx - currentDayIdx;
    
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const dateString = targetDate.toLocaleDateString('en-US', dateOptions);

    const isToday = selectedDay === currentDayKey;

    return (
      <View style={s.tabContent}>
        <View style={s.dayDateHeader}>
          <Ionicons name="calendar-outline" size={16} color={theme.subtext} />
          <Text style={s.dayDateText}>{dateString}</Text>
          {isToday && (
            <View style={s.todayBadge}>
              <Text style={s.todayBadgeText}>TODAY</Text>
            </View>
          )}
        </View>

        <View style={s.dayNavControls}>
          <TouchableOpacity style={s.dayNavBtn} onPress={handlePrevDay}>
            <Ionicons name="chevron-back" size={16} color={theme.subtext} />
            <Text style={s.dayNavText}>Prev</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[s.dayNavBtn, isToday && s.dayNavBtnActive]} onPress={() => setSelectedDay(currentDayKey)}>
            <Text style={isToday ? s.dayNavTextActive : s.dayNavText}>Today</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.dayNavBtn} onPress={handleNextDay}>
            <Text style={s.dayNavText}>Next</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.subtext} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          <View style={s.dayTimeline}>
            {daySchedule.map((slot: any, idx: number) => {
              if (slot.type === 'lunch') {
                return (
                  <View key={`lunch-${idx}`} style={s.dayTimelineRow}>
                    <View style={s.dayTimeCol}>
                      <Text style={s.dayTimeStartText}>{slot.startTime}</Text>
                      <Text style={s.dayTimeEndText}>{slot.endTime}</Text>
                    </View>
                    <View style={s.dayTimelineDotCol}>
                      <View style={[s.timelineDot, { backgroundColor: '#CBD5E1' }]} />
                    </View>
                    <View style={s.dayContentCol}>
                      <View style={s.lunchDivider}>
                        <Ionicons name="cafe-outline" size={16} color="#94A3B8" />
                        <Text style={s.lunchText}>LUNCH <Text style={{fontWeight: '400', fontSize: 10}}>(11:15 - 12:00)</Text></Text>
                      </View>
                    </View>
                  </View>
                );
              }

              const isFree = slot.isFreePeriod;
              const colors = isFree ? { iconBg: '#D1FAE5', iconColor: '#059669' } : getSubjectColors(slot.subject, isDarkMode);
              const iconName = isFree ? 'happy-outline' : getSubjectIcon(slot.subject);
              const dotColor = isFree ? '#E2E8F0' : '#A855F7'; // Purple for classes, grey for free
              
              return (
                <View key={`slot-${idx}`} style={s.dayTimelineRow}>
                  <View style={s.dayTimeCol}>
                    <Text style={s.dayTimeStartText}>{slot.startTime}</Text>
                    {slot.endTime && <Text style={s.dayTimeEndText}>{slot.endTime}</Text>}
                  </View>
                  <View style={s.dayTimelineDotCol}>
                    <View style={[s.timelineDot, { backgroundColor: dotColor }]} />
                  </View>
                  <View style={s.dayContentCol}>
                    <View style={[
                      s.dayCard, 
                      { backgroundColor: isFree ? '#F8FAFC' : '#FFFFFF', borderColor: isFree ? '#F1F5F9' : '#F1F5F9', borderWidth: 1, borderStyle: isFree ? 'dashed' : 'solid' }
                    ]}>
                      {/* Left Color Bar */}
                      {!isFree && <View style={[s.dayCardLeftBar, { backgroundColor: '#A855F7' }]} />}
                      
                      <View style={[s.dayCardIconWrapper, { backgroundColor: colors.iconBg }]}>
                        <Ionicons name={iconName} size={18} color={colors.iconColor} />
                      </View>
                      <View style={s.dayCardTextCol}>
                        <Text style={[s.dayCardSubject, isFree && { color: '#94A3B8', fontWeight: '700' }]}>{slot.subject}</Text>
                        {!isFree && (
                          <Text style={s.dayCardTeacher}>
                            {typeof slot.teacher === 'string' ? slot.teacher : slot.teacher?.name || '-'}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderWeekTab = () => {
    return (
      <View style={s.tabContent}>
        <View style={s.gridCanvas}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Header Row */}
                <View style={s.daysHeaderRow}>
                  <View style={s.timeColumnHeader} />
                  {ALL_DAYS.map(day => (
                    <View key={day} style={s.dayHeaderCell}>
                      <Text style={[s.dayHeaderText, selectedDay === day && s.dayHeaderTextActive]}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Rows */}
                {dynamicTimes.map(time => (
                  <React.Fragment key={time}>
                    {/* Lunch Break Interjection */}
                    {time === '11:15' && (
                      <View style={s.gridLunchRow}>
                        <View style={s.timeCell}><Text style={s.timeText}>11:15</Text></View>
                        <View style={s.gridLunchContent}>
                          <Text style={s.gridLunchText}>LUNCH</Text>
                        </View>
                      </View>
                    )}

                    <View style={s.gridRow}>
                      <View style={s.timeCell}>
                        <Text style={s.timeText}>{time}</Text>
                      </View>
                      
                      {ALL_DAYS.map(day => {
                        const data = getCellData(day, time);
                        
                        if (!data) {
                          return (
                            <View key={`${day}-${time}`} style={s.cellOuter}>
                              <View style={s.freePeriodCard}>
                                <Ionicons name="cafe-outline" size={14} color="#CBD5E1" />
                                <Text style={s.freePeriodText}>FREE PERIOD</Text>
                              </View>
                            </View>
                          );
                        }

                        const subjectLabel = typeof data.subject === 'string' ? data.subject : data.subject?.name || 'Subject';
                        const teacherValue = data.teacher;
                        const teacherLabel = typeof teacherValue === 'string' ? teacherValue : teacherValue?.name || '-';

                        return (
                          <View key={`${day}-${time}`} style={s.cellOuter}>
                            <View style={[s.gridCard, { backgroundColor: '#FFFFFF', borderColor: '#F1F5F9', borderWidth: 1 }]}>
                              <Text style={s.gridCardSubject} numberOfLines={1}>{subjectLabel}</Text>
                              <Text style={s.gridCardTeacher} numberOfLines={1}>{teacherLabel}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderEventsTab = () => (
    <ScrollView
      style={s.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[theme.primary]}
          tintColor={theme.primary}
        />
      }
    >
      {/* 1. School Year */}
      <View style={s.eventSection}>
        <View style={s.eventSectionHeader}>
          <Ionicons name="school-outline" size={18} color={theme.primary} />
          <Text style={s.eventSectionTitle}>School Year 2024-2025</Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ gap: 12, paddingRight: 20 }}
          style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {['First', 'Second', 'Third'].map((term, i) => {
            const colors = i === 0 
              ? { bg: '#EEF2FF', border: '#C7D2FE', accent: '#4F46E5', text: '#312E81' }
              : i === 1 
              ? { bg: '#FDF4FF', border: '#F5D0FE', accent: '#C026D3', text: '#701A75' }
              : { bg: '#F0FDF4', border: '#BBF7D0', accent: '#16A34A', text: '#14532D' };

            return (
              <View key={term} style={[s.termCardHorizontal, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={[s.termTitle, { color: colors.accent, marginBottom: 0 }]}>{term} Term</Text>
                  <Ionicons name={i === 0 ? "leaf-outline" : i === 1 ? "snow-outline" : "sunny-outline"} size={16} color={colors.accent} />
                </View>
                <Text style={[s.termDates, { color: colors.text, opacity: 0.8 }]}>
                  {i === 0 ? 'Aug 26 - Dec 20, 2024' : i === 1 ? 'Jan 6 - Apr 11, 2025' : 'Apr 28 - Jun 30, 2025'}
                </Text>
                
                <View style={{ marginTop: 'auto', flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={[s.termDaysVal, { color: colors.text }]}>75</Text>
                  <Text style={[s.termDaysLbl, { color: colors.text, opacity: 0.7 }]}>School Days</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Upcoming Events */}
      <View style={s.eventSection}>
        <View style={s.eventSectionHeader}>
          <Ionicons name="calendar-outline" size={18} color={theme.primary} />
          <Text style={s.eventSectionTitle}>Upcoming Events</Text>
        </View>
        {isEventsLoading ? <ActivityIndicator size="small" color={theme.primary} /> :
         events.length === 0 ? (
           <View style={s.emptyEventCard}><Text style={s.emptyEventText}>No events scheduled.</Text></View>
         ) : (
           events.map((ev, i) => (
             <View key={i} style={s.termCard}>
                <Text style={s.termTitle}>{ev.title}</Text>
                <View style={s.eventRow}>
                  <Ionicons name="calendar-outline" size={14} color={theme.primary} />
                  <Text style={s.eventRowText}>
                    {new Date(ev.start_date).toLocaleDateString()} - {new Date(ev.end_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={s.eventRow}>
                  <Ionicons name="location-outline" size={14} color={theme.subtext} />
                  <Text style={s.eventRowText}>{ev.location || 'N/A'}</Text>
                </View>
                
                <View style={{flexDirection: 'row', gap: 8, marginTop: 8}}>
                  {ev.event_type && <View style={s.tagBadge}><Text style={s.tagText}>{ev.event_type}</Text></View>}
                  {ev.event_priority && <View style={s.tagBadge}><Text style={[s.tagText, {color: theme.primary}]}>{ev.event_priority}</Text></View>}
                </View>
             </View>
           ))
         )
        }
      </View>

      {/* 3. School Holidays */}
      <View style={s.eventSection}>
        <View style={s.eventSectionHeader}>
          <Ionicons name="calendar-outline" size={18} color="#EF4444" />
          <Text style={s.eventSectionTitle}>School Holidays</Text>
        </View>
        {isEventsLoading ? <ActivityIndicator size="small" color="#EF4444" /> :
         holidays.length === 0 ? (
           <View style={s.emptyEventCard}><Text style={s.emptyEventText}>No holidays scheduled.</Text></View>
         ) : (
           holidays.map((hol, i) => (
             <View key={i} style={s.termCard}>
               <Text style={s.termTitle}>{hol.name}</Text>
               <Text style={s.termDates}>{new Date(hol.start_date).toLocaleDateString()} - {new Date(hol.end_date).toLocaleDateString()}</Text>
               <Text style={s.termDaysVal}>{hol.days_count}</Text>
               <Text style={s.termDaysLbl}>Days off</Text>
             </View>
           ))
         )
        }
      </View>

      {/* 4. Exam Schedule */}
      <View style={s.eventSection}>
        <View style={s.eventSectionHeader}>
          <Ionicons name="document-text-outline" size={18} color="#F59E0B" />
          <Text style={s.eventSectionTitle}>Exam Schedule</Text>
        </View>
        {isEventsLoading ? <ActivityIndicator size="small" color="#F59E0B" /> :
         exams.length === 0 ? (
           <View style={s.emptyEventCard}><Text style={s.emptyEventText}>No exams scheduled.</Text></View>
         ) : (
           exams.map((ex, i) => (
             <View key={i} style={s.termCard}>
               <Text style={s.termTitle}>{ex.exam_name}</Text>
               <Text style={s.termDates}>{new Date(ex.start_datetime).toLocaleString()}</Text>
               <Text style={s.termDaysLbl}>{ex.exam_type}</Text>
             </View>
           ))
         )
        }
      </View>
      
      <View style={{height: 40}} />
    </ScrollView>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />
      
      <StudentHeader 
        title=""
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
        isDashboard={true}
      />

      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Weekly Timetable</Text>
        <Text style={s.pageSubtitle}>Manage your class schedule and upcoming lessons</Text>

        <View style={s.tabContainer}>
          <TouchableOpacity style={[s.tabButton, activeTab === 'day' && s.tabButtonActive]} onPress={() => setActiveTab('day')}>
            <Text style={[s.tabText, activeTab === 'day' && s.tabTextActive]}>DAY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabButton, activeTab === 'week' && s.tabButtonActive]} onPress={() => setActiveTab('week')}>
            <Text style={[s.tabText, activeTab === 'week' && s.tabTextActive]}>WEEK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabButton, activeTab === 'events' && s.tabButtonActive]} onPress={() => setActiveTab('events')}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Ionicons name="megaphone-outline" size={14} color={activeTab === 'events' ? '#FFF' : theme.subtext} />
              <Text style={[s.tabText, activeTab === 'events' && s.tabTextActive]}>EVENTS</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.contentArea}>
        {isLoading && schedule.length === 0 ? (
          <ActivityIndicator size="large" color={theme.primary} style={{marginTop: 50}} />
        ) : error ? (
           <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
            <Ionicons name="alert-circle" size={48} color={theme.danger} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Unable to Load Timetable</Text>
            <TouchableOpacity style={{ marginTop: 16, padding: 12, backgroundColor: theme.primary, borderRadius: 8 }} onPress={() => fetchTimetable()}>
              <Text style={{ color: '#FFF' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeTab === 'day' && renderDayTab()}
            {activeTab === 'week' && renderWeekTab()}
            {activeTab === 'events' && renderEventsTab()}
          </>
        )}
      </View>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="student" />
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: theme.surface,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 2,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // DAY TAB
  dayDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  dayDateText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  todayBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  dayNavControls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dayNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  dayNavBtnActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  dayNavText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  dayNavTextActive: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTimeline: {
    paddingBottom: 40,
  },
  dayTimelineRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  dayTimeCol: {
    width: 45,
    alignItems: 'flex-end',
    paddingRight: 10,
    paddingTop: 10,
  },
  dayTimeStartText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  dayTimeEndText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  dayTimelineDotCol: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 14,
  },
  dayContentCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 16,
  },
  dayCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  dayCardLeftBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  dayCardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayCardTextCol: {
    flex: 1,
  },
  dayCardSubject: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  dayCardTeacher: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  lunchDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  lunchText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.subtext,
  },

  // WEEK TAB
  gridCanvas: { flex: 1 },
  timeColumnHeader: { width: 50 },
  daysHeaderRow: { flexDirection: 'row', paddingBottom: 10 },
  dayHeaderCell: { width: 110, alignItems: 'center' },
  dayHeaderText: { fontSize: 12, fontWeight: '800', color: theme.subtext },
  dayHeaderTextActive: { color: theme.primary },
  
  gridRow: { flexDirection: 'row', marginBottom: 12 },
  timeCell: { width: 50, alignItems: 'center', paddingTop: 10 },
  timeText: { fontSize: 11, fontWeight: '800', color: theme.subtext },
  
  cellOuter: { width: 110, paddingHorizontal: 4 },
  gridCard: {
    borderRadius: 12,
    padding: 10,
    minHeight: 60,
  },
  gridCardSubject: { fontSize: 12, fontWeight: '800', color: theme.text, marginBottom: 4 },
  gridCardTeacher: { fontSize: 10, color: theme.subtext },
  
  freePeriodCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freePeriodText: { fontSize: 9, fontWeight: '800', color: theme.subtext, marginTop: 4 },
  
  gridLunchRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  gridLunchContent: { flex: 1, backgroundColor: theme.surface, padding: 8, alignItems: 'center' },
  gridLunchText: { fontSize: 12, fontWeight: '900', color: theme.text, letterSpacing: 2 },

  // EVENTS TAB
  eventSection: {
    marginBottom: 24,
  },
  eventSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  eventSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  termCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.subtext,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  termCardHorizontal: {
    width: 200,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    shadowColor: theme.subtext,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  termTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  termDates: {
    fontSize: 12,
    color: theme.subtext,
    marginBottom: 12,
  },
  termDaysVal: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.text,
  },
  termDaysLbl: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
  },
  emptyEventCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyEventText: {
    fontSize: 13,
    color: theme.subtext,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eventRowText: {
    fontSize: 12,
    color: theme.subtext,
  },
  tagBadge: {
    backgroundColor: theme.iconBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.subtext,
  }
});

export default TimetableScreen;
