import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type TimetableNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Timetable'>;

interface Props {
  navigation: TimetableNavigationProp;
}

const TIMES = ['09:00', '09:45', '10:30', '11:15', '12:00', '12:45', '13:30'];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentDayKey = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];

  const normalizeApiData = (data: any) => {
    let result: any[] = [];
    if (Array.isArray(data)) result = data;
    else if (data?.schedule) result = data.schedule;
    else if (data?.schedule?.slots) result = data.schedule.slots;
    else if (data?.items) result = data.items;
    else if (data?.students) result = data.students;
    else if (data?.classes) result = data.classes;
    else if (data?.submissions) result = data.submissions;
    else if (data?.timetable) result = data.timetable;
    else result = [];

    return result.map((item: any) => {
      const startTime =
        item.startTime || item.time || item.period?.start?.slice?.(0, 5) || '';
      const day = item.day ? item.day.toString().toUpperCase() : currentDayKey;
      return {
        ...item,
        day,
        startTime,
      };
    });
  };

  const fetchTimetable = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const profileRes = await apiClient.get(ENDPOINTS.STUDENT.PROFILE);
      const profileData = profileRes.normalized?.data;
      const studentId = profileData?.id;

      if (!studentId) {
        throw new Error('Student ID not found');
      }

      const res = await apiClient.get(ENDPOINTS.STUDENT.SCHEDULE(studentId));
      const scheduleData = res.normalized?.data;
      setSchedule(normalizeApiData(scheduleData));
    } catch (err: any) {
      console.error('Failed to fetch timetable:', err);
      setError('Failed to load timetable. Please try again.');
      setSchedule([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const normalizeTime = React.useCallback((value: string) => {
    if (!value) return '';
    // Extract numbers and colon only (handles "9:00 AM", "09:00:00", etc.)
    const match = value.match(/(\d{1,2}):(\d{2})/);
    if (!match) return value.trim().slice(0, 5);
    
    let [_, hours, minutes] = match;
    // Pad hours with leading zero if needed
    if (hours.length === 1) hours = `0${hours}`;
    return `${hours}:${minutes}`;
  }, []);

  const scheduleMap = React.useMemo(() => {
    const dayMap: { [key: string]: string } = {
      'monday': 'MON', 'tuesday': 'TUE', 'wednesday': 'WED',
      'thursday': 'THU', 'friday': 'FRI', 'saturday': 'SAT',
      'mon': 'MON', 'tue': 'TUE', 'wed': 'WED', 'thu': 'THU', 'fri': 'FRI', 'sat': 'SAT'
    };

    const map: Record<string, any> = {};
    schedule.forEach(item => {
      let itemDay = typeof item.day === 'string' ? item.day.trim().toLowerCase() : '';
      // Convert "monday" -> "MON" or keep "MON" -> "MON"
      const normalizedDay = dayMap[itemDay] || itemDay.toUpperCase();
      const itemStart = typeof item.startTime === 'string' ? normalizeTime(item.startTime) : '';
      
      const key = `${normalizedDay}-${itemStart}`;
      map[key] = item;
    });
    return map;
  }, [schedule, normalizeTime]);

  const getCellData = React.useCallback((day: string, time: string) => {
    const targetTime = normalizeTime(time);
    return scheduleMap[`${day}-${targetTime}`];
  }, [scheduleMap, normalizeTime]);

  if (isLoading && schedule.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' }}>Unable to Load Timetable</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>{error}</Text>
        <TouchableOpacity
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4F46E5', borderRadius: 8 }}
          onPress={() => {
            setError(null);
            fetchTimetable();
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isLoading && schedule.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
        <Ionicons name="calendar-outline" size={64} color="#4F46E5" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' }}>No Data Available</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>Your timetable is empty or not available for today.</Text>
        <TouchableOpacity
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4F46E5', borderRadius: 8 }}
          onPress={fetchTimetable}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Reload</Text>
        </TouchableOpacity>
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

        <View style={styles.centerHeaderContainer}>
          <Text style={styles.headerTitle}>Weekly Timetable</Text>
          <Text style={styles.headerSubtitle}>Standard View</Text>
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
              {TIMES.map(time => {
                if (time === '11:15') {
                  return <View key={time} style={styles.lunchTimeCell}><Text style={styles.timeText}>{time}</Text></View>;
                }
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
                  {DAYS.map(day => {
                    const isToday = day === ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
                    return (
                      <View key={day} style={styles.dayHeaderCell}>
                        <View style={[styles.dayBadge, isToday && styles.dayBadgeActive]}>
                          <Text style={[styles.dayHeaderText, isToday && styles.dayHeaderTextActive]}>{day}</Text>
                        </View>
                      </View>
                    )
                  })}
                </View>

                {/* Schedule Rows */}
                {TIMES.map(time => {
                  if (time === '11:15') {
                    return (
                      <View key={time} style={styles.lunchRowOuter}>
                        <View style={styles.lunchLineIndicator} />
                        <View style={styles.lunchBarWrapper}>
                          <Ionicons name="fast-food-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                          <Text style={styles.lunchText}>LUNCH BREAK</Text>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View key={time} style={styles.gridRow}>
                      {/* Dashed background row line */}
                      <View style={styles.rowDashedLine} />

                      {DAYS.map(day => {
                        const data = getCellData(day, time);
                        const subjectLabel = typeof data?.subject === 'string' ? data.subject : 'Subject';
                        const teacherLabel = typeof data?.teacher === 'string' ? data.teacher : '-';
                        const colors = getSubjectColors(subjectLabel);

                        return (
                          <View key={day} style={styles.cellOuter}>
                            {data ? (
                              <View style={[styles.card, { backgroundColor: colors.bg }]}>
                                <View style={[styles.cardAccentLine, { backgroundColor: colors.accent }]} />
                                <Text style={[styles.subjectText, { color: colors.text }]} numberOfLines={1}>{subjectLabel}</Text>
                                <View style={styles.teacherRow}>
                                  <Ionicons name="person" size={10} color={colors.accent} style={{ marginRight: 4, opacity: 0.6 }} />
                                  <Text style={[styles.teacherText, { color: colors.text, opacity: 0.8 }]} numberOfLines={1}>
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
  }
});

export default TimetableScreen;
