import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import studentService from '../../services/studentService';

type TimetableNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Timetable'>;

interface Props {
  navigation: TimetableNavigationProp;
}

// const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const getSubjectColors = (subject?: string) => {
  const norm = typeof subject === 'string' ? subject.toLowerCase().trim() : '';
  if (norm.includes('science')) return { bg: '#EEF2FF', text: '#4338CA', accent: '#6366F1' };
  if (norm.includes('maths')) return { bg: '#FFF1F2', text: '#BE123C', accent: '#F43F5E' };
  if (norm.includes('english')) return { bg: '#F0FDF4', text: '#15803D', accent: '#22C55E' };
  if (norm.includes('computer')) return { bg: '#FFFBEB', text: '#B45309', accent: '#F59E0B' };
  if (norm.includes('hindi')) return { bg: '#FAF5FF', text: '#7E22CE', accent: '#A855F7' };
  return { bg: '#F8FAFC', text: '#334155', accent: '#64748B' };
};

const TimetableScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 
  const currentDayKey = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
  const days = React.useMemo(() => {
    if (viewMode === 'week') return ALL_DAYS; // always MON→SAT in order
    // Day mode: show only today, or all if today is weekend
    return ALL_DAYS.includes(currentDayKey) ? [currentDayKey] : ALL_DAYS;
  }, [currentDayKey, viewMode]);

  const normalizeTime = React.useCallback((value: string) => {
    if (!value) return '';
    const match = value.match(/(\d{1,2}):(\d{2})/);
    if (!match) return value.trim().slice(0, 5);
    let [_, hours, minutes] = match;
    if (hours.length === 1) hours = `0${hours}`;
    return `${hours}:${minutes}`;
  }, []);

  const calculateStatus = (startTime: string, endTime: string) => {
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
  };

  const normalizeApiData = (data: any) => {
    const DAY_MAP_IDX = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const flattenedSlots: any[] = [];

    // WEEK view shape: { schedule: [ { date: "2026-06-22", slots: [...] } ] }
    if (Array.isArray(data?.schedule)) {
      data.schedule.forEach((dayData: any) => {
        const dateStr: string = dayData.date || '';
        const dayKey = dateStr
          ? DAY_MAP_IDX[new Date(dateStr + 'T00:00:00').getDay()]
          : currentDayKey;

        (dayData.slots || []).forEach((slot: any) => {
          const start = slot.period?.start || slot.startTime || slot.time || '';
          const end = slot.period?.end || slot.endTime || '';
          const status = dayKey === currentDayKey
            ? calculateStatus(start, end)
            : 'Upcoming';

          flattenedSlots.push({
            ...slot,
            day: dayKey,
            subject: typeof slot.subject === 'string'
              ? slot.subject
              : slot.subject?.name || 'Subject',
            teacher: slot.teacher || { name: '-' },
            startTime: normalizeTime(start.slice(0, 5)),
            endTime: normalizeTime(end.slice(0, 5)),
            status: slot.status || status,
          });
        });
      });
      return flattenedSlots;
    }

    // DAY view shape: array of slots OR { data: [...] }
    let slots: any[] = [];
    if (Array.isArray(data)) slots = data;
    else if (Array.isArray(data?.data)) slots = data.data;

    return slots.map((slot: any) => {
      // Day API returns slot.time as start, slot.endTime as end
      // Week API returns slot.period.start / slot.period.end
      const start = slot.period?.start || slot.startTime || slot.time || '';
      const end = slot.period?.end || slot.endTime || '';
      const day = slot.day || slot.weekDay || slot.dayOfWeek || currentDayKey;

      // Day API returns teacher as plain string; week API returns { id, name }
      const teacherRaw = slot.teacher;
      const teacher = typeof teacherRaw === 'string'
        ? { name: teacherRaw }
        : teacherRaw || { name: slot.teacherName || '-' };

      return {
        ...slot,
        day,
        subject: typeof slot.subject === 'string'
          ? slot.subject
          : slot.subject?.name || slot.subjectName || 'Subject',
        teacher,
        startTime: normalizeTime(start.slice(0, 5)),
        endTime: normalizeTime(end.slice(0, 5)),
        status: slot.status || calculateStatus(start, end),
      };
    });
  };//normalize

  // const fetchTimetable = async () => {
  //   try {
  //     setIsLoading(true);
  //     setError(null);

  //     // Resolve studentId from Profile
  //     const profileRes = await studentService.getProfile();;

  //     const studentId = profileRes.normalized?.data?.id || profileRes.normalized?.data?.student?.id || authState.user?.id || '';

  //     if (!studentId) throw new Error('Could not identify student account.');

  //    const dashRes = await studentService.getDashboard(studentId);

  //     const classId = dashRes.normalized?.data?.student?.classId;

  //     // if (classId) {
  //     //   try {
  //     //     const now = new Date();
  //     //     const day = now.getDay();
  //     //     const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  //     //     const monday = new Date(now.setDate(diff)).toISOString().split('T')[0];
  //     //     const res = await apiClient.get(`${ENDPOINTS.STUDENT.CLASS_SCHEDULE(classId)}?week=${monday}`);
  //     //     console.log('CLASS SCHEDULE RESPONSE:', res.normalized?.data);
  //     //     setSchedule(normalizeApiData(res.normalized?.data));
  //     //     return;
  //     //   } catch (weekErr) { console.warn('Weekly fetch failed, using fallback.'); }
  //     // }
  //     // Skip weekly class schedule for now.
  //     // Use the same API flow as the website.

  //     // const res = await apiClient.get(ENDPOINTS.STUDENT.SCHEDULE(studentId));
  //    const res = await studentService.getSchedule(studentId);

  //     setSchedule(normalizeApiData(res.normalized?.data));

  //   } catch (err: any) {
  //     console.error('Failed to fetch timetable:', err);
  //     setError(err.message || 'Failed to load timetable.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const fetchTimetable = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSchedule([]); // clear stale data before fetching

      // Use /auth/me — HAR-confirmed: returns student.id and classId
      const meRes = await studentService.getMe();
      const meData = meRes.normalized?.data;


      const studentId = meData?.student?.id || '';
      const classId = meData?.student?.classId || meData?.classId || '';
      if (viewMode == 'day') {
        if (!classId) throw new Error('Could not resolve classId from /auth/me');

        // Day mode: reuse the working week endpoint, then filter to today client-side
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now);
        monday.setDate(diff);
        const weekStart = monday.toISOString().split('T')[0];

        const res = await studentService.getClassSchedule(classId, weekStart);

        // normalizeApiData will flatten all week slots; then filter to today
        const allSlots = normalizeApiData({ schedule: res.normalized?.data });
        const todaySlots = allSlots.filter((slot: any) => slot.day === currentDayKey);


        setSchedule(todaySlots);
        return;
      }

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
      return;


    } catch (err: any) {
      console.error('Failed to fetch timetable:', err);
      console.error('[Timetable] error details:', {
        message: err?.message,
        status: err?.response?.status,
        data: JSON.stringify(err?.response?.data),
        code: err?.code,
      });
      setError(err.message || 'Failed to load timetable.');
    } finally {
      setIsLoading(false);
    }
  };
  //changes till here
  useEffect(() => {
    fetchTimetable();
  }, [viewMode]);

  const dynamicTimes = React.useMemo(() => {
    const times = new Set<string>();
    schedule.forEach(item => {
      if (item.startTime) times.add(normalizeTime(item.startTime));
    });
    // Add lunch break as a special marker if you have one, or just sort them
    const sorted = Array.from(times).sort();
    return sorted.length > 0 ? sorted : ['09:00', '10:00', '11:00', '12:00'];
  }, [schedule, normalizeTime]);

  const scheduleMap = React.useMemo(() => {
    const dayMap: { [key: string]: string } = {
      'monday': 'MON', 'tuesday': 'TUE', 'wednesday': 'WED',
      'thursday': 'THU', 'friday': 'FRI', 'saturday': 'SAT',
      'mon': 'MON', 'tue': 'TUE', 'wed': 'WED', 'thu': 'THU', 'fri': 'FRI', 'sat': 'SAT'
    };

    const map: Record<string, any> = {};
    schedule.forEach(item => {
      let itemDay = typeof item.day === 'string' ? item.day.trim().toLowerCase() : '';
      const normalizedDay = dayMap[itemDay] || itemDay.toUpperCase();
      const itemStart = typeof item.startTime === 'string' ? normalizeTime(item.startTime) : '';
      map[`${normalizedDay}-${itemStart}`] = item;
    });
    return map;
  }, [schedule, normalizeTime]);

  const getCellData = React.useCallback((day: string, time: string) => {
    return scheduleMap[`${day}-${time}`];
  }, [scheduleMap]);

  if (isLoading && schedule.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />
        <View style={styles.globalHeader}>
          <TouchableOpacity style={styles.menuHandle} onPress={() => setDrawerOpen(true)}>
            <Ionicons name="menu" size={26} color="#111827" />
          </TouchableOpacity>
          <View style={styles.centerHeaderContainer}>
            <Text style={styles.headerTitle}>
              {viewMode === 'week' ? 'Weekly Timetable' : 'Today Timetable'}
            </Text>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, viewMode === 'day' && styles.modeButtonActive]}
                onPress={() => setViewMode('day')}
              >
                <Text style={[styles.modeButtonText, viewMode === 'day' && styles.modeButtonTextActive]}>Day</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, viewMode === 'week' && styles.modeButtonActive]}
                onPress={() => setViewMode('week')}
              >
                <Text style={[styles.modeButtonText, viewMode === 'week' && styles.modeButtonTextActive]}>Week</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' }}>Unable to Load Timetable</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>{error}</Text>
          <TouchableOpacity
            style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4F46E5', borderRadius: 8 }}
            onPress={() => { setError(null); fetchTimetable(); }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
        <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="student" />
      </View>
    );
  }

  if (!isLoading && !error && schedule.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />
        {/* Header with toggle so user can switch modes */}
        <View style={styles.globalHeader}>
          <TouchableOpacity style={styles.menuHandle} onPress={() => setDrawerOpen(true)}>
            <Ionicons name="menu" size={26} color="#111827" />
          </TouchableOpacity>
          <View style={styles.centerHeaderContainer}>
            <Text style={styles.headerTitle}>
              {viewMode === 'week' ? 'Weekly Timetable' : 'Today Timetable'}
            </Text>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, viewMode === 'day' && styles.modeButtonActive]}
                onPress={() => setViewMode('day')}
              >
                <Text style={[styles.modeButtonText, viewMode === 'day' && styles.modeButtonTextActive]}>Day</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, viewMode === 'week' && styles.modeButtonActive]}
                onPress={() => setViewMode('week')}
              >
                <Text style={[styles.modeButtonText, viewMode === 'week' && styles.modeButtonTextActive]}>Week</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty state */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <Ionicons name="calendar-outline" size={64} color="#4F46E5" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' }}>No Data Available</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
            {viewMode === 'day' ? 'No classes scheduled for today.' : 'No timetable available for this week.'}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4F46E5', borderRadius: 8 }}
            onPress={() => { setError(null); setSchedule([]); fetchTimetable(); }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Reload</Text>
          </TouchableOpacity>
        </View>

        <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="student" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <TouchableOpacity
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="menu" size={26} color="#111827" />
        </TouchableOpacity>
        {/* toogle button */}
        <View style={styles.centerHeaderContainer}>
          <Text style={styles.headerTitle}>
            {viewMode === 'week' ? 'Weekly Timetable' : 'Today Timetable'}
          </Text>

          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                viewMode === 'day' && styles.modeButtonActive,
              ]}
              onPress={() => setViewMode('day')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  viewMode === 'day' && styles.modeButtonTextActive,
                ]}
              >
                Day
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                viewMode === 'week' && styles.modeButtonActive,
              ]}
              onPress={() => setViewMode('week')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  viewMode === 'week' && styles.modeButtonTextActive,
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}
          >
            <Ionicons name="settings-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
          ><View style={[styles.avatar, { marginLeft: 12 }]}><Text style={styles.avatarText}>{String(authState.user?.name ?? 'S').charAt(0)}</Text></View></TouchableOpacity>
        </View>
      </View>

      {/* Grid Container */}
      <View style={styles.gridCanvas}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          <View style={{ flexDirection: 'row', paddingTop: 10 }}>
            {/* Left Time Column Fixed */}
            <View style={styles.timeColumn}>
              <View style={{ height: 40 }} />{/* Top left corner offset for Day Headers */}
              {dynamicTimes.map(time => {
                return (
                  <View key={time} style={styles.timeCell}>
                    <Text style={styles.timeText}>{time}</Text>
                  </View>
                );
              })}
            </View>

            {/* Horizontally Scrollable Days Grid */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Header Row (Days) */}
                <View style={styles.daysHeaderRow}>
                  {days.map(day => {
                    const isToday = day === ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
                    return (
                      <View key={day} style={styles.dayHeaderCell}>
                        <View style={[styles.dayBadge, isToday && styles.dayBadgeActive]}>
                          <Text style={[styles.dayHeaderText, isToday && styles.dayBadgeActive && { color: '#FFF' }]}>{day}</Text>
                        </View>
                      </View>
                    )
                  })}
                </View>

                {/* Schedule Rows */}
                {dynamicTimes.map(time => {
                  return (
                    <View key={time} style={styles.gridRow}>
                      {/* Dashed background row line */}
                      <View style={styles.rowDashedLine} />

                      {days.map(day => {
                        const data = getCellData(day, time);
                        const subjectLabel = typeof data?.subject === 'string' ? data.subject : 'Subject';

                        // Handle Teacher Object + Substitution Logic
                        // const teacherObj = data?.teacher;
                        // const substitutionObj = data?.substitution;
                        // const teacherLabel = substitutionObj ? substitutionObj.name : (teacherObj?.name || '-');
                        // const isSubstituted = !!substitutionObj;
                        const teacherValue = data?.teacher;
                        const substitutionObj = data?.substitution;
                        const teacherLabel = substitutionObj
                          ? substitutionObj.name
                          : typeof teacherValue === 'string'
                            ? teacherValue
                            : teacherValue?.name || '-';
                        const isSubstituted = !!substitutionObj;

                        // Live Status tracking
                        const isOngoing = data?.status === 'Ongoing';
                        const isCompleted = data?.status === 'Completed';

                        const colors = isOngoing
                          ? { bg: '#ECFDF5', accent: '#10B981', text: '#064E3B' } // Vibrant Green for Ongoing
                          : getSubjectColors(subjectLabel);

                        return (
                          <View key={day} style={styles.cellOuter}>
                            {data ? (
                              <View style={[
                                styles.card,
                                { backgroundColor: colors.bg },
                                isOngoing && { borderColor: '#10B981', borderWidth: 2, shadowColor: '#10B981', shadowOpacity: 0.3 }
                              ]}>
                                <View style={[styles.cardAccentLine, { backgroundColor: colors.accent }]} />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Text style={[
                                    styles.subjectText,
                                    { color: colors.text, flex: 1 },
                                    isCompleted && { textDecorationLine: 'line-through', opacity: 0.6 }
                                  ]} numberOfLines={1}>
                                    {subjectLabel}
                                  </Text>
                                  <View style={{ flexDirection: 'row', gap: 2 }}>
                                    {isOngoing && (
                                      <View style={{ backgroundColor: '#10B981', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                                        <Text style={{ fontSize: 7, fontWeight: '900', color: '#FFF' }}>LIVE</Text>
                                      </View>
                                    )}
                                    {isSubstituted && (
                                      <View style={{ backgroundColor: '#F59E0B', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                                        <Text style={{ fontSize: 7, fontWeight: '900', color: '#FFF' }}>SUB</Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                                <View style={styles.teacherRow}>
                                  <Ionicons name="person" size={10} color={colors.accent} style={{ marginRight: 4, opacity: 0.6 }} />
                                  <Text style={[styles.teacherText, { color: colors.text, opacity: isCompleted ? 0.4 : 0.8 }]} numberOfLines={1}>
                                    {teacherLabel}
                                  </Text>
                                </View>
                              </View>
                            ) : <View style={styles.emptyCard} />}
                          </View>
                        )
                      })}
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          </View>

        </ScrollView>
      </View>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' }, // Soft blue/gray ambient background
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  menuHandle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerHeaderContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  gridCanvas: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 14,
    borderRadius: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  timeColumn: {
    width: 60,
    paddingRight: 6,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9', // Subtle separator for time col
    zIndex: 10,
  },
  timeCell: {
    height: 96, // Increased height for premium feel
    alignItems: 'center',
    paddingTop: 18,
  },
  lunchTimeCell: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },

  daysHeaderRow: {
    flexDirection: 'row',
    height: 46,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9', // Subtle header separator
  },
  dayHeaderCell: {
    width: 156, // Slightly wider columns
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  dayBadgeActive: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.0,
  },
  dayHeaderTextActive: {
    color: '#FFFFFF',
  },

  gridRow: {
    flexDirection: 'row',
    height: 96,
  },
  rowDashedLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: '#F8FAFC',
    borderStyle: 'dashed', // Awesome premium grid-feel
  },
  cellOuter: {
    width: 156,
    height: 96,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  card: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardAccentLine: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  emptyCard: {
    flex: 1,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    paddingLeft: 4,
    letterSpacing: 0.2,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  teacherText: {
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },

  lunchRowOuter: {
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    width: 6 * 156, // Updates width to match wider cells
  },
  lunchLineIndicator: {
    position: 'absolute',
    top: 19, // exact middle of 38
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E5E7EB',
    borderStyle: 'dashed',
    zIndex: 0,
  },
  lunchBarWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  lunchText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1.5,
  },
  modeToggle: {
    flexDirection: 'row',
    marginTop: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  modeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#4F46E5',
  },
  modeButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default TimetableScreen;
