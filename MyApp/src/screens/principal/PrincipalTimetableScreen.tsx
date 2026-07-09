import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../store/AuthContext';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import principalService, {
  ClassItem,
  TimetablePeriod,
  ClassScheduleResponse,
  ScheduleDay,
} from '../../services/principalService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type PrincipalTimetableNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalTimetable'
>;

interface Props {
  navigation: PrincipalTimetableNavigationProp;
}

const getMonday = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().split('T')[0];
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PrincipalTimetableScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>(getMonday(new Date()));

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const [scheduleData, setScheduleData] = useState<ClassScheduleResponse | null>(null);

  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => a.period_number - b.period_number);
  }, [periods]);

  // Initial load of classes and periods
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [periodsRes, classesRes] = await Promise.all([
        principalService.getTimetablePeriods(),
        principalService.getClasses(),
      ]);

      const classesResAny = classesRes as any;
      const periodsResAny = periodsRes as any;
      const classList = classesResAny.data?.classes ?? (Array.isArray(classesResAny.data) ? classesResAny.data : (classesResAny.data?.data ?? []));
      setClasses(classList);
      setPeriods(periodsResAny.data?.periods ?? (Array.isArray(periodsResAny.data) ? periodsResAny.data : (periodsResAny.data?.data ?? [])));

      if (classList.length > 0) {
        setSelectedClassId(classList[0].id);
      }
    } catch (error) {
      console.error('[PrincipalTimetable] Initial fetch failed:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Fetch schedule when class or week changes
  const fetchSchedule = useCallback(
    async (showRefreshIndicator = false) => {
      if (!selectedClassId) return;

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsScheduleLoading(true);
      }

      const processSchedule = (scheduleList: ScheduleDay[]): ScheduleDay[] => {
        return scheduleList.map((day) => {
          const dateObj = new Date(day.date);
          const isSunday = dateObj.getDay() === 0;
          if (isSunday) return day;

          const slots = [...(day.slots || [])];
          const hasLunch = slots.some((s) => {
            const label = s.period?.label?.toLowerCase() || '';
            return label.includes('4') || label.includes('lunch');
          });

          if (!hasLunch) {
            slots.push({
              time_slot_id: `lunch-${day.date}`,
              period: {
                id: 'lunch-period',
                label: 'Lunch',
                start: '11:15:00',
                end: '12:00:00',
                is_break: true,
              },
              subject: '',
              teacher: { id: '', name: '', is_absent: false },
              substitution: null,
            });
          }

          const getPeriodNum = (s: any) => {
            const label = s.period?.label || '';
            if (label.toLowerCase() === 'lunch') return 4;
            const m = label.match(/\d+/);
            return m ? parseInt(m[0], 10) : 99;
          };

          slots.sort((a, b) => getPeriodNum(a) - getPeriodNum(b));

          return { ...day, slots };
        });
      };

      try {
        const res = await principalService.getClassSchedule(selectedClassId, selectedWeek);
        const rawData = res.data;
        if (Array.isArray(rawData)) {
          setScheduleData({
            institution: { working_days: [1, 2, 3, 4, 5], periods_per_day: 8 },
            schedule: processSchedule(rawData),
          });
        } else if (rawData && typeof rawData === 'object') {
          const rawSchedule = (rawData as any).schedule || (rawData as any).data || [];
          setScheduleData({
            institution: (rawData as any).institution || { working_days: [1, 2, 3, 4, 5], periods_per_day: 8 },
            schedule: processSchedule(rawSchedule),
          });
        } else {
          setScheduleData(rawData || null);
        }
      } catch (error) {
        console.error('[PrincipalTimetable] Schedule fetch failed:', error);
        setScheduleData(null);
      } finally {
        setIsRefreshing(false);
        setIsScheduleLoading(false);
      }
    },
    [selectedClassId, selectedWeek]
  );

  useEffect(() => {
    fetchSchedule();
  }, [selectedClassId, selectedWeek, fetchSchedule]);

  const changeWeek = useCallback((offsetDays: number) => {
    setSelectedWeek((prevWeek) => {
      const d = new Date(prevWeek);
      d.setDate(d.getDate() + offsetDays);
      return getMonday(d);
    });
  }, []);

  const formatWeekRange = useMemo(() => {
    const mon = new Date(selectedWeek);
    const sat = new Date(mon);
    sat.setDate(mon.getDate() + 5);
    return `${mon.toLocaleDateString('en-GB')} – ${sat.toLocaleDateString('en-GB')}`;
  }, [selectedWeek]);

  const getDayHeader = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = DAY_NAMES[date.getDay()] || '';
    const dateFormatted = date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    return `${dayName}, ${dateFormatted}`;
  }, []);

  const formatTime = useCallback((timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    return `${parts[0]}:${parts[1]}`;
  }, []);

  const renderSlotItem = useCallback(
    (slot: any, index: number) => {
      const isPeriod4 = slot.period?.label?.toLowerCase() === 'period 4';
      const isBreak = slot.period?.is_break || isPeriod4;
      const startFormatted = isPeriod4 ? '11:15' : formatTime(slot.period?.start || '');
      const endFormatted = isPeriod4 ? '12:00' : formatTime(slot.period?.end || '');
      const timeRange = startFormatted && endFormatted ? `${startFormatted} - ${endFormatted}` : '';
      const label = isPeriod4 ? 'Lunch' : (slot.period?.label || 'Break');

      if (isBreak) {
        return (
          <View key={index} style={styles.breakRow}>
            <Ionicons name="cafe-outline" size={16} color="#D97706" style={{ marginRight: 6 }} />
            <Text style={styles.breakText}>
              {label} ({timeRange})
            </Text>
          </View>
        );
      }

      const hasTeacher = !!slot.teacher?.name;
      const isAbsent = slot.teacher?.is_absent || false;
      const substitutionName = slot.substitution?.name || null;

      return (
        <View key={index} style={styles.slotCard}>
          <View style={styles.slotHeader}>
            <Text style={styles.periodLabel}>{slot.period?.label || 'Slot'}</Text>
            {timeRange ? <Text style={styles.timeRangeText}>{timeRange}</Text> : null}
          </View>
          <View style={styles.slotBody}>
            <Text style={styles.subjectText}>{slot.subject || 'Free Period'}</Text>
            {hasTeacher ? (
              <View style={styles.teacherRow}>
                <Ionicons name="person-outline" size={14} color="#4B5563" style={{ marginRight: 4 }} />
                <Text style={styles.teacherNameText}>{slot.teacher.name}</Text>
                {isAbsent ? (
                  <View style={styles.absentBadge}>
                    <Text style={styles.absentText}>Absent</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text style={styles.freePeriodText}>Free Period</Text>
            )}

            {substitutionName ? (
              <View style={styles.substituteRow}>
                <MaterialCommunityIcons name="swap-horizontal" size={14} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={styles.substituteText}>Substituted by: {substitutionName}</Text>
              </View>
            ) : null}
          </View>
        </View>
      );
    },
    [formatTime]
  );

  const renderPeriodItem = useCallback(
    (period: TimetablePeriod, slot: any) => {
      const isBreak = period.is_break;
      const startFormatted = formatTime(period.start_time || '');
      const endFormatted = formatTime(period.end_time || '');
      const timeRange = startFormatted && endFormatted ? `${startFormatted} - ${endFormatted}` : '';
      const label = period.label || 'Break';

      if (isBreak) {
        return (
          <View key={period.id} style={styles.breakRow}>
            <Ionicons name="cafe-outline" size={16} color="#D97706" style={{ marginRight: 6 }} />
            <Text style={styles.breakText}>
              Period {period.period_number} — {label} ({timeRange})
            </Text>
          </View>
        );
      }

      const displayLabel = (period.label || '').toLowerCase().startsWith('period')
        ? `Period ${period.period_number}`
        : `Period ${period.period_number} — ${period.label || ''}`;

      if (slot) {
        const hasTeacher = !!slot.teacher?.name;
        const isAbsent = slot.teacher?.is_absent || false;
        const substitutionName = slot.substitution?.name || null;

        return (
          <View key={period.id} style={styles.slotCard}>
            <View style={styles.slotHeader}>
              <Text style={styles.periodLabel}>{displayLabel}</Text>
              {timeRange ? <Text style={styles.timeRangeText}>{timeRange}</Text> : null}
            </View>
            <View style={styles.slotBody}>
              <Text style={styles.subjectText}>{slot.subject || 'Free Period'}</Text>
              {hasTeacher ? (
                <View style={styles.teacherRow}>
                  <Ionicons name="person-outline" size={14} color="#4B5563" style={{ marginRight: 4 }} />
                  <Text style={styles.teacherNameText}>{slot.teacher.name}</Text>
                  {isAbsent ? (
                    <View style={styles.absentBadge}>
                      <Text style={styles.absentText}>Absent</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.freePeriodText}>Free Period</Text>
              )}

              {substitutionName ? (
                <View style={styles.substituteRow}>
                  <MaterialCommunityIcons name="swap-horizontal" size={14} color="#D97706" style={{ marginRight: 4 }} />
                  <Text style={styles.substituteText}>Substituted by: {substitutionName}</Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      }

      return (
        <View key={period.id} style={styles.slotCard}>
          <View style={styles.slotHeader}>
            <Text style={styles.periodLabel}>{displayLabel}</Text>
            {timeRange ? <Text style={styles.timeRangeText}>{timeRange}</Text> : null}
          </View>
          <View style={styles.slotBody}>
            <Text style={styles.subjectText}>Free Period</Text>
            <Text style={styles.freePeriodText}>Free Period</Text>
          </View>
        </View>
      );
    },
    [formatTime]
  );

  const renderDayItem = useCallback(
    ({ item }: { item: ScheduleDay }) => {
      const hasSlots = item.slots && item.slots.length > 0;
      const hasPeriods = sortedPeriods && sortedPeriods.length > 0;

      return (
        <View style={styles.dayContainer}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{getDayHeader(item.date)}</Text>
          </View>

          {hasSlots ? (
            <View style={styles.slotsContainer}>
              {hasPeriods ? (
                sortedPeriods.map((period) => {
                  const slot = item.slots.find(
                    (s) =>
                      s.period?.id === period.id ||
                      s.period?.label?.toLowerCase() === period.label?.toLowerCase()
                  );
                  return renderPeriodItem(period, slot);
                })
              ) : (
                item.slots.map((slot, index) => renderSlotItem(slot, index))
              )}
            </View>
          ) : (
            <View style={styles.emptyDayContainer}>
              <Text style={styles.emptyDayText}>No classes scheduled</Text>
            </View>
          )}
        </View>
      );
    },
    [getDayHeader, sortedPeriods, renderPeriodItem, renderSlotItem]
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to load timetable</Text>
        <Text style={styles.errorSubtitle}>
          An error occurred while fetching timetable data. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadInitialData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Timetable</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}>
          {authState.user?.photoUrl ? (
            <Image source={{ uri: authState.user.photoUrl }} style={styles.headerAvatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Class Selector Row */}
      {classes.length > 0 ? (
        <View style={styles.classSelectorWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.classSelectorContent}
          >
            {classes.map((cls) => {
              const nameFull = cls.name + (cls.section ? ` ${cls.section}` : '');
              const isSelected = cls.id === selectedClassId;
              return (
                <TouchableOpacity
                  key={cls.id}
                  style={[styles.classPill, isSelected && styles.classPillActive]}
                  onPress={() => setSelectedClassId(cls.id)}
                >
                  <Text style={[styles.classPillText, isSelected && styles.classPillTextActive]}>
                    {nameFull}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Week Navigator */}
      <View style={styles.weekNavigatorRow}>
        <TouchableOpacity style={styles.navArrow} onPress={() => changeWeek(-7)}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.weekRangeText}>{formatWeekRange}</Text>
        <TouchableOpacity style={styles.navArrow} onPress={() => changeWeek(7)}>
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Schedule list */}
      {isScheduleLoading ? (
        <View style={styles.skeletonContainer}>
          <ActivityIndicator size="small" color="#4F46E5" style={{ marginBottom: 12 }} />
          <Text style={styles.skeletonText}>Loading schedule...</Text>
        </View>
      ) : (
        <FlatList
          data={scheduleData?.schedule || []}
          keyExtractor={(item) => item.date}
          renderItem={renderDayItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchSchedule(true)}
              colors={['#4F46E5']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={theme.subtext} />
              <Text style={styles.emptyTitle}>No schedule available</Text>
              <Text style={styles.emptySubtitle}>
                No working days or slots scheduled for this week.
              </Text>
            </View>
          }
        />
      )}

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: theme.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerBtn: {
    padding: 4,
  },
  appHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  classSelectorWrapper: {
    backgroundColor: theme.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  classSelectorContent: {
    paddingHorizontal: 16,
  },
  classPill: {
    backgroundColor: theme.background,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  classPillActive: {
    backgroundColor: theme.primary,
  },
  classPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.subtext,
  },
  classPillTextActive: {
    color: '#FFF',
  },
  weekNavigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  navArrow: {
    padding: 6,
    backgroundColor: theme.background,
    borderRadius: 8,
  },
  weekRangeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonText: {
    fontSize: 14,
    color: theme.subtext,
  },
  listContent: {
    padding: 16,
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayHeader: {
    backgroundColor: theme.primary + '15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
  },
  slotsContainer: {},
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDarkMode ? '#F59E0B20' : '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  breakText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.isDarkMode ? '#FBBF24' : '#D97706',
  },
  slotCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.subtext,
  },
  timeRangeText: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
  },
  slotBody: {},
  subjectText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherNameText: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '500',
  },
  absentBadge: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  absentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  freePeriodText: {
    fontSize: 13,
    color: theme.subtext,
    fontStyle: 'italic',
  },
  substituteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: theme.isDarkMode ? '#B4530920' : '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  substituteText: {
    fontSize: 11,
    color: theme.isDarkMode ? '#FBBF24' : '#B45309',
    fontWeight: '600',
  },
  emptyDayContainer: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.border,
  },
  emptyDayText: {
    fontSize: 12,
    color: theme.subtext,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: 'center',
  },
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
  headerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 4,
  },
});

export default PrincipalTimetableScreen;
