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
import { getCacheBustedUri } from '../../utils/image';

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

const getSubjectColors = (subject?: string, isDarkMode?: boolean) => {
  const norm = typeof subject === 'string' ? subject.toLowerCase().trim() : '';
  if (norm.includes('science') || norm.includes('chem') || norm.includes('bio') || norm.includes('phys'))
    return { iconBg: isDarkMode ? '#7C2D12' : '#FFEDD5', iconColor: isDarkMode ? '#FF8A65' : '#C2410C', barColor: '#C2410C' };
  if (norm.includes('math'))
    return { iconBg: isDarkMode ? '#831843' : '#FCE7F3', iconColor: isDarkMode ? '#F472B6' : '#DB2777', barColor: '#DB2777' };
  if (norm.includes('english') || norm.includes('lit'))
    return { iconBg: isDarkMode ? '#0C4A6E' : '#E0F2FE', iconColor: isDarkMode ? '#38BDF8' : '#0369A1', barColor: '#0369A1' };
  if (norm.includes('computer') || norm.includes('it') || norm.includes('code'))
    return { iconBg: isDarkMode ? '#1E293B' : '#E2E8F0', iconColor: isDarkMode ? '#94A3B8' : '#334155', barColor: '#334155' };
  if (norm.includes('hindi') || norm.includes('lang'))
    return { iconBg: isDarkMode ? '#134E4A' : '#CCFBF1', iconColor: isDarkMode ? '#2DD4BF' : '#0F766E', barColor: '#0F766E' };
  if (norm.includes('social') || norm.includes('hist') || norm.includes('geo'))
    return { iconBg: isDarkMode ? '#365314' : '#ECFDF5', iconColor: isDarkMode ? '#4ADE80' : '#15803D', barColor: '#15803D' };
  return { iconBg: isDarkMode ? '#581C87' : '#F3E8FF', iconColor: isDarkMode ? '#C084FC' : '#7E22CE', barColor: '#7E22CE' };
};

const getSubjectIcon = (subject?: string) => {
  const norm = typeof subject === 'string' ? subject.toLowerCase().trim() : '';
  if (norm.includes('science') || norm.includes('chem') || norm.includes('bio') || norm.includes('phys')) return 'flask-outline';
  if (norm.includes('math')) return 'calculator-outline';
  if (norm.includes('english') || norm.includes('lit')) return 'book-outline';
  if (norm.includes('computer') || norm.includes('it') || norm.includes('code')) return 'laptop-outline';
  if (norm.includes('hindi') || norm.includes('lang')) return 'language-outline';
  if (norm.includes('social') || norm.includes('hist') || norm.includes('geo')) return 'earth-outline';
  return 'document-text-outline';
};

const PrincipalTimetableScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>(getMonday(new Date()));

  // New View Mode & Day Navigation state
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDay, setSelectedDay] = useState<string>(todayStr);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const [scheduleData, setScheduleData] = useState<ClassScheduleResponse | null>(null);

  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => a.period_number - b.period_number);
  }, [periods]);

  // Initial load of classes and periods (UNTOUCHED API LOGIC)
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

  // Fetch schedule when class or week changes (UNTOUCHED API LOGIC)
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
          slots.sort((a, b) => {
            const pA = a.period as any;
            const pB = b.period as any;
            const numA = pA?.period_number ?? (pA?.label ? (pA.label.match(/\d+/)?.[0] ? parseInt(pA.label.match(/\d+/)[0], 10) : 99) : 99);
            const numB = pB?.period_number ?? (pB?.label ? (pB.label.match(/\d+/)?.[0] ? parseInt(pB.label.match(/\d+/)[0], 10) : 99) : 99);
            if (numA !== numB) return numA - numB;
            return (pA?.start || pA?.start_time || '').localeCompare(pB?.start || pB?.start_time || '');
          });

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

  const changeDay = useCallback((offsetDays: number) => {
    setSelectedDay((prevDay) => {
      const d = new Date(prevDay);
      d.setDate(d.getDate() + offsetDays);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const newDayStr = `${year}-${month}-${day}`;

      const mondayOfNewDay = getMonday(d);
      if (mondayOfNewDay !== selectedWeek) {
        setSelectedWeek(mondayOfNewDay);
      }
      return newDayStr;
    });
  }, [selectedWeek]);

  const handleGoToToday = useCallback(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayFormattedStr = `${year}-${month}-${day}`;

    const mondayOfToday = getMonday(d);
    setSelectedWeek(mondayOfToday);
    setSelectedDay(todayFormattedStr);
    setViewMode('day');
  }, []);

  const formatWeekRange = useMemo(() => {
    const mon = new Date(selectedWeek);
    const sat = new Date(mon);
    sat.setDate(mon.getDate() + 5);
    return `${mon.toLocaleDateString('en-GB')} – ${sat.toLocaleDateString('en-GB')}`;
  }, [selectedWeek]);

  const formatDayDisplay = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayName = DAY_NAMES[date.getDay()] ? DAY_NAMES[date.getDay()].substring(0, 3) : '';
    const dayNum = date.getDate();
    const monthName = date.toLocaleString('en-US', { month: 'short' });
    return `${dayName}, ${dayNum} ${monthName}`;
  }, []);

  const getDayHeader = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = DAY_NAMES[date.getDay()] || '';
    const dateFormatted = date.toLocaleDateString('en-GB');
    return `${dayName}, ${dateFormatted}`;
  }, []);

  const formatTime = useCallback((timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    return `${parts[0]}:${parts[1]}`;
  }, []);

  const displaySchedule = useMemo(() => {
    if (!scheduleData?.schedule) return [];
    if (viewMode === 'week') return scheduleData.schedule;

    const match = scheduleData.schedule.filter((day) => {
      const dayDate = day.date ? day.date.split('T')[0] : '';
      return dayDate === selectedDay;
    });

    if (match.length > 0) return match;
    return [{ type: 'day', date: selectedDay, slots: [] }];
  }, [scheduleData, viewMode, selectedDay]);

  const renderDayItem = useCallback(
    ({ item }: { item: ScheduleDay }) => {
      const hasSlots = item.slots && item.slots.length > 0;
      const hasPeriods = sortedPeriods && sortedPeriods.length > 0;
      const dateOnly = item.date ? item.date.split('T')[0] : '';
      const isToday = dateOnly === todayStr;

      return (
        <View style={styles.dayContainer}>
          {/* Day Header with Today Badge */}
          <View style={styles.dayHeaderContainer}>
            <View style={[styles.dayDateHeader, isToday && styles.dayHeaderToday]}>
              <Ionicons name="calendar-outline" size={16} color={isToday ? theme.primary : theme.subtext} />
              <Text style={[styles.dayDateText, isToday && styles.dayHeaderTextToday]}>
                {getDayHeader(item.date)}
              </Text>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>TODAY</Text>
                </View>
              )}
            </View>
          </View>

          {hasSlots || hasPeriods ? (
            <View style={styles.dayTimeline}>
              {hasPeriods ? (
                sortedPeriods.map((period) => {
                  const slot = item.slots?.find(
                    (s) =>
                      s.period?.id === period.id ||
                      s.period?.label?.toLowerCase() === period.label?.toLowerCase()
                  );

                  const isBreak = slot?.period?.is_break || period.is_break || false;

                  const startFormatted = formatTime(slot?.period?.start || period.start_time || '');
                  const endFormatted = formatTime(slot?.period?.end || period.end_time || '');
                  const periodLabelText = period.label
                    ? (period.label.toLowerCase().startsWith('period')
                        ? `Period ${period.period_number}`
                        : period.label)
                    : `Period ${period.period_number}`;

                  if (isBreak) {
                    const breakStart = startFormatted || 'Time TBD';
                    const breakEnd = endFormatted || 'Time TBD';
                    return (
                      <View key={period.id} style={styles.dayTimelineRow}>
                        <View style={styles.dayTimeCol}>
                          <Text style={styles.dayTimeStartText}>{breakStart}</Text>
                          <Text style={styles.dayTimeEndText}>{breakEnd}</Text>
                        </View>
                        <View style={styles.dayTimelineDotCol}>
                          <View style={[styles.timelineDot, { backgroundColor: isDarkMode ? '#FBBF24' : '#D97706' }]} />
                        </View>
                        <View style={styles.dayContentCol}>
                          <View style={styles.lunchDivider}>
                            <Ionicons name="cafe-outline" size={16} color={isDarkMode ? '#FBBF24' : '#D97706'} />
                            <Text style={styles.lunchText}>
                              LUNCH BREAK{' '}
                              <Text style={{ fontWeight: '400', fontSize: 10 }}>
                                ({breakStart} - {breakEnd})
                              </Text>
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }

                  const hasTeacher = !!slot?.teacher?.name;
                  const isAbsent = slot?.teacher?.is_absent || false;
                  const substitutionName = slot?.substitution?.name || null;
                  const isFree = !slot || !hasTeacher || slot.subject === 'Free Period';
                  const subjectName = slot?.subject || 'Free Period';
                  const teacherName = slot?.teacher?.name || '';
                  const colors = isFree
                    ? { iconBg: isDarkMode ? '#1E293B' : '#F1F5F9', iconColor: theme.subtext, barColor: theme.border }
                    : getSubjectColors(subjectName, isDarkMode);
                  const iconName = getSubjectIcon(subjectName);
                  const dotColor = isAbsent
                    ? '#EF4444'
                    : substitutionName
                    ? '#F59E0B'
                    : isFree
                    ? (isDarkMode ? '#475569' : '#CBD5E1')
                    : colors.barColor;

                  return (
                    <View key={period.id} style={styles.dayTimelineRow}>
                      <View style={styles.dayTimeCol}>
                        <Text style={styles.dayTimeStartText}>{startFormatted || '--:--'}</Text>
                        {endFormatted ? <Text style={styles.dayTimeEndText}>{endFormatted}</Text> : null}
                      </View>
                      <View style={styles.dayTimelineDotCol}>
                        <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
                      </View>
                      <View style={styles.dayContentCol}>
                        <View
                          style={[
                            styles.dayCard,
                            {
                              backgroundColor: theme.surface,
                              borderColor: isAbsent ? '#EF4444' : substitutionName ? '#F59E0B' : theme.border,
                              borderStyle: isFree ? 'dashed' : 'solid',
                            },
                          ]}
                        >
                          {!isFree && <View style={[styles.dayCardLeftBar, { backgroundColor: colors.barColor }]} />}

                          <View style={[styles.dayCardIconWrapper, { backgroundColor: colors.iconBg }]}>
                            <Ionicons
                              name={isFree ? 'happy-outline' : iconName}
                              size={18}
                              color={colors.iconColor}
                            />
                          </View>

                          <View style={styles.dayCardTextCol}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text
                                style={[styles.dayCardSubject, isFree && { color: theme.subtext, fontStyle: 'italic' }]}
                                numberOfLines={1}
                              >
                                {subjectName}
                              </Text>
                              {periodLabelText ? (
                                <Text style={styles.periodLabelTag}>{periodLabelText}</Text>
                              ) : null}
                            </View>

                            {hasTeacher ? (
                              <View style={styles.teacherRow}>
                                <Ionicons name="person-outline" size={12} color={theme.subtext} style={{ marginRight: 4 }} />
                                <Text style={styles.dayCardTeacher} numberOfLines={1}>
                                  {teacherName}
                                </Text>
                                {isAbsent && (
                                  <View style={styles.absentBadge}>
                                    <Text style={styles.absentText}>Absent</Text>
                                  </View>
                                )}
                              </View>
                            ) : !isFree ? (
                              <Text style={styles.dayCardTeacher}>No teacher assigned</Text>
                            ) : null}

                            {substitutionName && (
                              <View style={styles.substituteRow}>
                                <MaterialCommunityIcons
                                  name="swap-horizontal"
                                  size={12}
                                  color={isDarkMode ? '#FBBF24' : '#D97706'}
                                  style={{ marginRight: 4 }}
                                />
                                <Text style={styles.substituteText} numberOfLines={1}>
                                  Substituted by: {substitutionName}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                item.slots.map((slot, index) => {
                  const isBreak = slot.period?.is_break || false;
                  const startFormatted = formatTime(slot.period?.start || '');
                  const endFormatted = formatTime(slot.period?.end || '');
                  const label = slot.period?.label || `Slot ${index + 1}`;

                  if (isBreak) {
                    const breakStart = startFormatted || 'Time TBD';
                    const breakEnd = endFormatted || 'Time TBD';
                    return (
                      <View key={`slot-${index}`} style={styles.dayTimelineRow}>
                        <View style={styles.dayTimeCol}>
                          <Text style={styles.dayTimeStartText}>{breakStart}</Text>
                          <Text style={styles.dayTimeEndText}>{breakEnd}</Text>
                        </View>
                        <View style={styles.dayTimelineDotCol}>
                          <View style={[styles.timelineDot, { backgroundColor: isDarkMode ? '#FBBF24' : '#D97706' }]} />
                        </View>
                        <View style={styles.dayContentCol}>
                          <View style={styles.lunchDivider}>
                            <Ionicons name="cafe-outline" size={16} color={isDarkMode ? '#FBBF24' : '#D97706'} />
                            <Text style={styles.lunchText}>
                              LUNCH BREAK{' '}
                              <Text style={{ fontWeight: '400', fontSize: 10 }}>
                                ({breakStart} - {breakEnd})
                              </Text>
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }

                  const hasTeacher = !!slot.teacher?.name;
                  const isAbsent = slot.teacher?.is_absent || false;
                  const substitutionName = slot.substitution?.name || null;
                  const isFree = !hasTeacher || slot.subject === 'Free Period';
                  const subjectName = slot.subject || 'Free Period';
                  const teacherName = slot.teacher?.name || '';
                  const colors = isFree
                    ? { iconBg: isDarkMode ? '#1E293B' : '#F1F5F9', iconColor: theme.subtext, barColor: theme.border }
                    : getSubjectColors(subjectName, isDarkMode);
                  const iconName = getSubjectIcon(subjectName);
                  const dotColor = isAbsent
                    ? '#EF4444'
                    : substitutionName
                    ? '#F59E0B'
                    : isFree
                    ? (isDarkMode ? '#475569' : '#CBD5E1')
                    : colors.barColor;

                  return (
                    <View key={`slot-${index}`} style={styles.dayTimelineRow}>
                      <View style={styles.dayTimeCol}>
                        <Text style={styles.dayTimeStartText}>{startFormatted || '--:--'}</Text>
                        {endFormatted ? <Text style={styles.dayTimeEndText}>{endFormatted}</Text> : null}
                      </View>
                      <View style={styles.dayTimelineDotCol}>
                        <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
                      </View>
                      <View style={styles.dayContentCol}>
                        <View
                          style={[
                            styles.dayCard,
                            {
                              backgroundColor: theme.surface,
                              borderColor: isAbsent ? '#EF4444' : substitutionName ? '#F59E0B' : theme.border,
                              borderStyle: isFree ? 'dashed' : 'solid',
                            },
                          ]}
                        >
                          {!isFree && <View style={[styles.dayCardLeftBar, { backgroundColor: colors.barColor }]} />}

                          <View style={[styles.dayCardIconWrapper, { backgroundColor: colors.iconBg }]}>
                            <Ionicons
                              name={isFree ? 'happy-outline' : iconName}
                              size={18}
                              color={colors.iconColor}
                            />
                          </View>

                          <View style={styles.dayCardTextCol}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text
                                style={[styles.dayCardSubject, isFree && { color: theme.subtext, fontStyle: 'italic' }]}
                                numberOfLines={1}
                              >
                                {subjectName}
                              </Text>
                              <Text style={styles.periodLabelTag}>{label}</Text>
                            </View>

                            {hasTeacher ? (
                              <View style={styles.teacherRow}>
                                <Ionicons name="person-outline" size={12} color={theme.subtext} style={{ marginRight: 4 }} />
                                <Text style={styles.dayCardTeacher} numberOfLines={1}>
                                  {teacherName}
                                </Text>
                                {isAbsent && (
                                  <View style={styles.absentBadge}>
                                    <Text style={styles.absentText}>Absent</Text>
                                  </View>
                                )}
                              </View>
                            ) : !isFree ? (
                              <Text style={styles.dayCardTeacher}>No teacher assigned</Text>
                            ) : null}

                            {substitutionName && (
                              <View style={styles.substituteRow}>
                                <MaterialCommunityIcons
                                  name="swap-horizontal"
                                  size={12}
                                  color={isDarkMode ? '#FBBF24' : '#D97706'}
                                  style={{ marginRight: 4 }}
                                />
                                <Text style={styles.substituteText} numberOfLines={1}>
                                  Substituted by: {substitutionName}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <View style={styles.emptyDayContainer}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={24} color={theme.subtext} style={{ marginBottom: 6 }} />
              <Text style={styles.emptyDayTitle}>No classes scheduled</Text>
              <Text style={styles.emptyDayText}>There are no sessions planned for this day.</Text>
            </View>
          )}
        </View>
      );
    },
    [getDayHeader, todayStr, sortedPeriods, formatTime, theme, isDarkMode, styles]
  );

  const renderWeekTab = useCallback(() => {
    const daysInWeek = scheduleData?.schedule || [];

    if (daysInWeek.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchSchedule(true)}
              colors={[theme.primary]}
            />
          }
        >
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={56} color={theme.subtext} />
            <Text style={styles.emptyTitle}>No schedule available</Text>
            <Text style={styles.emptySubtitle}>
              No working days or slots scheduled for this period.
            </Text>
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={styles.gridCanvas}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchSchedule(true)}
              colors={[theme.primary]}
            />
          }
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <View style={{ paddingTop: 8 }}>
              {/* Header Row */}
              <View style={styles.daysHeaderRow}>
                <View style={styles.timeColumnHeader}>
                  <Text style={styles.timeHeaderTitle}>TIME</Text>
                </View>
                {daysInWeek.map((dayItem) => {
                  const dateStr = dayItem.date ? dayItem.date.split('T')[0] : '';
                  const dateObj = new Date(dayItem.date);
                  const dayShort = DAY_NAMES[dateObj.getDay()] ? DAY_NAMES[dateObj.getDay()].substring(0, 3) : '';
                  const dayNum = dateObj.getDate();
                  const isToday = dateStr === todayStr;

                  return (
                    <View key={dayItem.date} style={[styles.dayHeaderCell, isToday && styles.dayHeaderCellToday]}>
                      <Text style={[styles.dayHeaderTextGrid, isToday && styles.dayHeaderTextGridToday]}>
                        {dayShort.toUpperCase()}
                      </Text>
                      <Text style={[styles.dayHeaderDateGrid, isToday && styles.dayHeaderDateGridToday]}>
                        {dayNum || ''}
                      </Text>
                      {isToday && <View style={styles.todayDotGrid} />}
                    </View>
                  );
                })}
              </View>

              {/* Grid Rows */}
              {sortedPeriods.map((period) => {
                const startFormatted = formatTime(period.start_time || '');
                const endFormatted = formatTime(period.end_time || '');
                const isBreak = period.is_break || false;

                if (isBreak) {
                  const breakStart = startFormatted || 'Time TBD';
                  const breakEnd = endFormatted || 'Time TBD';
                  return (
                    <View key={period.id} style={styles.gridLunchRow}>
                      <View style={styles.timeCell}>
                        <Text style={styles.timeText}>{breakStart}</Text>
                      </View>
                      <View style={styles.gridLunchContent}>
                        <Ionicons name="cafe-outline" size={14} color={isDarkMode ? '#FBBF24' : '#D97706'} style={{ marginRight: 6 }} />
                        <Text style={styles.gridLunchText}>
                          LUNCH BREAK ({breakStart} - {breakEnd})
                        </Text>
                      </View>
                    </View>
                  );
                }

                return (
                  <View key={period.id} style={styles.gridRow}>
                    <View style={styles.timeCell}>
                      <Text style={styles.timeText}>{startFormatted || '--:--'}</Text>
                      <Text style={styles.periodSubText}>P{period.period_number}</Text>
                    </View>

                    {daysInWeek.map((dayItem) => {
                      const slot = dayItem.slots?.find(
                        (s) =>
                          s.period?.id === period.id ||
                          s.period?.label?.toLowerCase() === period.label?.toLowerCase()
                      );

                      const hasTeacher = !!slot?.teacher?.name;
                      const isAbsent = slot?.teacher?.is_absent || false;
                      const substitutionName = slot?.substitution?.name || null;
                      const isFree = !slot || !hasTeacher || slot.subject === 'Free Period';
                      const subjectName = slot?.subject || 'Free Period';
                      const teacherName = slot?.teacher?.name || '';
                      const colors = getSubjectColors(subjectName, isDarkMode);

                      if (isFree) {
                        return (
                          <View key={`${dayItem.date}-${period.id}`} style={styles.cellOuter}>
                            <View style={styles.freePeriodCard}>
                              <Ionicons name="happy-outline" size={14} color={theme.subtext} />
                              <Text style={styles.freePeriodText}>Free Period</Text>
                            </View>
                          </View>
                        );
                      }

                      return (
                        <View key={`${dayItem.date}-${period.id}`} style={styles.cellOuter}>
                          <View
                            style={[
                              styles.gridCard,
                              {
                                backgroundColor: theme.surface,
                                borderColor: isAbsent ? '#EF4444' : substitutionName ? '#F59E0B' : theme.border,
                              },
                            ]}
                          >
                            <View style={[styles.gridCardTopBar, { backgroundColor: colors.barColor }]} />
                            <Text style={styles.gridCardSubject} numberOfLines={1}>
                              {subjectName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                              <Text style={styles.gridCardTeacher} numberOfLines={1}>
                                {teacherName}
                              </Text>
                              {isAbsent && (
                                <View style={styles.compactAbsentBadge}>
                                  <Text style={styles.compactAbsentText}>ABS</Text>
                                </View>
                              )}
                            </View>
                            {substitutionName && (
                              <View style={styles.compactSubBadge}>
                                <MaterialCommunityIcons name="swap-horizontal" size={10} color={isDarkMode ? '#FBBF24' : '#D97706'} />
                                <Text style={styles.compactSubText} numberOfLines={1}>
                                  {substitutionName}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    );
  }, [scheduleData, sortedPeriods, todayStr, formatTime, fetchSchedule, isRefreshing, theme, isDarkMode, styles]);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        <View style={styles.errorBadge}>
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
        </View>
        <Text style={styles.errorTitle}>Failed to load timetable</Text>
        <Text style={styles.errorSubtitle}>
          An error occurred while fetching timetable data. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadInitialData}>
          <Ionicons name="refresh-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header (UNTOUCHED appHeader) */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setDrawerOpen(true)} accessibilityLabel="Open menu">
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Timetable</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })} accessibilityLabel="Account settings">
          {authState.user?.photoUrl ? (
            <Image source={{ uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt) }} style={styles.headerAvatarImage} />
          ) : (

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 1. Week / Day View Toggle Segmented Control */}
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'week' && styles.toggleBtnActive]}
          onPress={() => setViewMode('week')}
          accessibilityLabel="Switch to week view"
        >
          <Ionicons name="calendar-outline" size={14} color={viewMode === 'week' ? '#FFF' : theme.subtext} style={{ marginRight: 6 }} />
          <Text style={[styles.toggleBtnText, viewMode === 'week' && styles.toggleBtnTextActive]}>Week View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'day' && styles.toggleBtnActive]}
          onPress={() => setViewMode('day')}
          accessibilityLabel="Switch to day view"
        >
          <Ionicons name="today-outline" size={14} color={viewMode === 'day' ? '#FFF' : theme.subtext} style={{ marginRight: 6 }} />
          <Text style={[styles.toggleBtnText, viewMode === 'day' && styles.toggleBtnTextActive]}>Day View</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Class Selector Row */}
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
                  accessibilityLabel={`Select class ${nameFull}`}
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

      {/* 3. Week / Day Navigator & Today Button */}
      <View style={styles.weekNavigatorContainer}>
        <View style={styles.weekNavigatorRow}>
          <TouchableOpacity
            style={styles.navArrow}
            onPress={() => (viewMode === 'week' ? changeWeek(-7) : changeDay(-1))}
            accessibilityLabel={viewMode === 'week' ? "Previous week" : "Previous day"}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.weekRangeBox}>
            <MaterialCommunityIcons
              name={viewMode === 'week' ? "calendar-range" : "calendar-today"}
              size={16}
              color={theme.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.weekRangeText}>
              {viewMode === 'week' ? formatWeekRange : formatDayDisplay(selectedDay)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.navArrow}
            onPress={() => (viewMode === 'week' ? changeWeek(7) : changeDay(1))}
            accessibilityLabel={viewMode === 'week' ? "Next week" : "Next day"}
          >
            <Ionicons name="chevron-forward" size={18} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.todayBtn}
            onPress={handleGoToToday}
            accessibilityLabel="Jump to today"
          >
            <Ionicons name="sparkles" size={12} color={theme.primary} style={{ marginRight: 4 }} />
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Schedule List / Skeleton Loading */}
      {isScheduleLoading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonHeaderRow}>
                <View style={[styles.skeletonLine, { width: 70, height: 12 }]} />
                <View style={[styles.skeletonLine, { width: 80, height: 12 }]} />
              </View>
              <View style={[styles.skeletonLine, { width: '60%', height: 16, marginTop: 8 }]} />
              <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: 6 }]} />
            </View>
          ))}
        </View>
      ) : viewMode === 'week' ? (
        renderWeekTab()
      ) : (
        <FlatList
          data={displaySchedule}
          keyExtractor={(item) => item.date}
          renderItem={renderDayItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchSchedule(true)}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={56} color={theme.subtext} />
              <Text style={styles.emptyTitle}>No schedule available</Text>
              <Text style={styles.emptySubtitle}>
                No working days or slots scheduled for this period.
              </Text>
            </View>
          }
        />
      )}

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
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
  errorBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDarkMode ? '#EF444420' : '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // App Header (UNTOUCHED)
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

  // View Toggle (Week / Day)
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: theme.primary,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.subtext,
  },
  toggleBtnTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },

  // Class Selector Row
  classSelectorWrapper: {
    backgroundColor: theme.background,
    paddingVertical: 10,
  },
  classSelectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  classPill: {
    backgroundColor: theme.surface,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  classPillActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  classPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.subtext,
  },
  classPillTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },

  // Week/Day Navigator
  weekNavigatorContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: theme.background,
  },
  weekNavigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  weekRangeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  navArrow: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  weekRangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#3B82F620' : '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3B82F640' : '#BFDBFE',
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },

  // Skeleton Loading
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    borderLeftWidth: 4,
    borderLeftColor: theme.border,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonLine: {
    backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
    borderRadius: 4,
  },

  // List & Day Items
  listContent: {
    paddingBottom: 40,
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayHeaderContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  dayDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dayHeaderToday: {
    backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
    borderColor: theme.primary,
  },
  dayDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginLeft: 8,
    flex: 1,
  },
  dayHeaderTextToday: {
    color: theme.primary,
    fontWeight: '800',
  },
  todayBadge: {
    backgroundColor: theme.primary,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  todayBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  periodLabelTag: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.subtext,
    textTransform: 'uppercase',
    backgroundColor: theme.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },

  // Timeline (Day View)
  dayTimeline: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  dayTimelineRow: {
    flexDirection: 'row',
    minHeight: 75,
    marginBottom: 4,
  },
  dayTimeCol: {
    width: 45,
    alignItems: 'flex-end',
    paddingRight: 10,
    paddingTop: 12,
  },
  dayTimeStartText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.text,
  },
  dayTimeEndText: {
    fontSize: 9,
    color: theme.subtext,
    fontWeight: '600',
    marginTop: 2,
  },
  dayTimelineDotCol: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 14,
    borderWidth: 2,
    borderColor: theme.surface,
  },
  dayContentCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 12,
  },
  dayCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  dayCardLeftBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  dayCardIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
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
    color: theme.text,
    marginBottom: 2,
  },
  dayCardTeacher: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
  },
  lunchDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDarkMode ? '#F59E0B15' : '#FFFBEB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#78350F40' : '#FDE68A',
    marginTop: 4,
  },
  lunchText: {
    fontSize: 12,
    fontWeight: '800',
    color: isDarkMode ? '#FBBF24' : '#D97706',
  },

  // Grid (Week View)
  gridCanvas: {
    flex: 1,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 10,
    alignItems: 'center',
  },
  timeColumnHeader: {
    width: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.subtext,
    letterSpacing: 0.5,
  },
  dayHeaderCell: {
    width: 110,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginHorizontal: 4,
  },
  dayHeaderCellToday: {
    backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
    borderColor: theme.primary,
  },
  dayHeaderTextGrid: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.subtext,
  },
  dayHeaderTextGridToday: {
    color: theme.primary,
  },
  dayHeaderDateGrid: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.text,
    marginTop: 1,
  },
  dayHeaderDateGridToday: {
    color: theme.primary,
  },
  todayDotGrid: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.primary,
    marginTop: 3,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  timeCell: {
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.text,
  },
  periodSubText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.subtext,
    marginTop: 2,
  },
  cellOuter: {
    width: 110,
    paddingHorizontal: 4,
  },
  gridCard: {
    borderRadius: 10,
    padding: 8,
    minHeight: 62,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridCardTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  gridCardSubject: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 2,
  },
  gridCardTeacher: {
    fontSize: 10,
    color: theme.subtext,
    fontWeight: '500',
    flex: 1,
  },
  compactAbsentBadge: {
    backgroundColor: isDarkMode ? '#EF444430' : '#FEE2E2',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 4,
  },
  compactAbsentText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#EF4444',
  },
  compactSubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: isDarkMode ? '#F59E0B20' : '#FFFBEB',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  compactSubText: {
    fontSize: 9,
    fontWeight: '700',
    color: isDarkMode ? '#FBBF24' : '#D97706',
  },
  freePeriodCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    minHeight: 62,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 6,
  },
  freePeriodText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.subtext,
    marginTop: 3,
  },
  gridLunchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  gridLunchContent: {
    flex: 1,
    backgroundColor: isDarkMode ? '#F59E0B15' : '#FFFBEB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#78350F40' : '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  gridLunchText: {
    fontSize: 11,
    fontWeight: '800',
    color: isDarkMode ? '#FBBF24' : '#D97706',
    letterSpacing: 0.5,
  },

  // Badges & Actions
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  absentBadge: {
    backgroundColor: isDarkMode ? '#EF444425' : '#FEE2E2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 6,
  },
  absentText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
  substituteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: isDarkMode ? '#F59E0B15' : '#FFFBEB',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  substituteText: {
    fontSize: 11,
    color: isDarkMode ? '#FBBF24' : '#D97706',
    fontWeight: '700',
  },
  emptyDayContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.border,
  },
  emptyDayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  emptyDayText: {
    fontSize: 11,
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
    fontWeight: '800',
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
    backgroundColor: '#9F7AEA',
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
