import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../store/ThemeContext';

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
        <Skeleton width="100%" height={160} borderRadius={24} />
      </View>
      <View style={{ marginTop: 30 }}>
        {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={80} borderRadius={20} style={{ marginBottom: 12 }} />)}
      </View>
    </ScrollView>
  );
};

const PrincipalCalendarScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showTermHistory, setShowTermHistory] = useState(false);

  // Endpoint specific state
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [examsList, setExamsList] = useState<any[]>([]);

  // Add Event Form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('Academic');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);

      const [eventsRes, holidaysRes, examsRes] = await Promise.all([
        apiClient.get(ENDPOINTS.PRINCIPAL.CALENDAR_EVENTS).catch(() => ({ data: [] })),
        apiClient.get(ENDPOINTS.PRINCIPAL.CALENDAR_HOLIDAYS).catch(() => ({ data: [] })),
        apiClient.get(ENDPOINTS.PRINCIPAL.CALENDAR_EXAMS).catch(() => ({ data: [] })),
      ]);

      const eventsData = (eventsRes as any).data?.events || (eventsRes as any).data?.data || (Array.isArray((eventsRes as any).data) ? (eventsRes as any).data : []);
      const holidaysData = (holidaysRes as any).data?.holidays || (holidaysRes as any).data?.data || (Array.isArray((holidaysRes as any).data) ? (holidaysRes as any).data : []);
      const examsData = (examsRes as any).data?.exams || (examsRes as any).data?.data || (Array.isArray((examsRes as any).data) ? (examsRes as any).data : []);

      setEventsList(Array.isArray(eventsData) ? eventsData : []);
      setHolidaysList(Array.isArray(holidaysData) ? holidaysData : []);
      setExamsList(Array.isArray(examsData) ? examsData : []);

      try {
        const calRes = await apiClient.get(ENDPOINTS.PRINCIPAL.CALENDAR).catch(() => ({ data: null }));
        if (calRes?.data) {
          setCalendarData((calRes as any).normalized?.data || (calRes as any).data?.data || calRes.data);
        }
      } catch {}

    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleCreateEvent = async () => {
    if (!newEventTitle.trim()) {
      Alert.alert('Validation Required', 'Please enter an event title.');
      return;
    }
    try {
      setIsSubmittingEvent(true);
      const payload = {
        title: newEventTitle.trim(),
        date: newEventDate.trim() || new Date().toISOString().split('T')[0],
        category: newEventCategory,
        description: newEventDesc.trim(),
      };
      await apiClient.post(ENDPOINTS.PRINCIPAL.CALENDAR_EVENTS, payload);
      Alert.alert('Success', 'Event created successfully!');
      setShowAddEventModal(false);
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventDesc('');
      fetchData();
    } catch (error) {
      console.error('Failed to create event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Calculate curriculum progress
  const curriculumProgress = calendarData?.curriculumProgress || 85;
  const progressColor = curriculumProgress >= 80 ? '#10B981' : curriculumProgress >= 60 ? '#F59E0B' : '#EF4444';
  const progressText = curriculumProgress >= 80 ? 'On Track' : curriculumProgress >= 60 ? 'In Progress' : 'Needs Attention';

  // Get current term info
  const currentTerm = calendarData?.terms?.find((t: any) => t.status === 'ONGOING') || calendarData?.terms?.[0];
  const sessionYear = calendarData?.session || '2025-26';

  const displayEvents = eventsList.length > 0 ? eventsList : (calendarData?.events || []);
  const displayHolidays = holidaysList.length > 0 ? holidaysList : (calendarData?.holidays || []);
  const displayExams = examsList.length > 0 ? examsList : (calendarData?.exams || []);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} translucent />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Institution Calendar</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}>
            {authState.user?.photoUrl ? (
              <Image source={{ uri: authState.user.photoUrl }} style={styles.avatarHeader} />
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
            <Text style={styles.screenTitle}>Academic Roadmap</Text>
            <Text style={styles.screenSubtitle}>Align institutional goals with the official academic timeline.</Text>
          </View>

          {/* ===== INSTITUTION STATUS ===== */}
          <Animated.View entering={FadeInUp.duration(400)} style={styles.institutionStatusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusTitleRow}>
                <MaterialCommunityIcons name="school-outline" size={22} color={theme.primary} />
                <Text style={styles.statusTitle}>Institution Status</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: progressColor }]} />
                <Text style={[styles.statusBadgeText, { color: progressColor }]}>{progressText}</Text>
              </View>
            </View>

            <View style={styles.statusContent}>
              <View style={styles.statusInfoRow}>
                <View style={styles.statusInfoItem}>
                  <Text style={styles.statusInfoLabel}>Session</Text>
                  <Text style={styles.statusInfoValue}>{sessionYear}</Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusInfoItem}>
                  <Text style={styles.statusInfoLabel}>Current Term</Text>
                  <Text style={styles.statusInfoValue}>{currentTerm?.title || 'Term 2'}</Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusInfoItem}>
                  <Text style={styles.statusInfoLabel}>Curriculum</Text>
                  <Text style={styles.statusInfoValue}>{curriculumProgress}%</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${curriculumProgress}%`,
                        backgroundColor: progressColor
                      }
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabelText}>0%</Text>
                  <Text style={styles.progressLabelText}>50%</Text>
                  <Text style={styles.progressLabelText}>100%</Text>
                </View>
              </View>

              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.quickStatItem}>
                  <MaterialCommunityIcons name="calendar-check" size={20} color="#10B981" />
                  <View style={styles.quickStatInfo}>
                    <Text style={styles.quickStatValue}>{calendarData?.totalDays || 180}</Text>
                    <Text style={styles.quickStatLabel}>Total Days</Text>
                  </View>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStatItem}>
                  <MaterialCommunityIcons name="calendar-today" size={20} color="#6366F1" />
                  <View style={styles.quickStatInfo}>
                    <Text style={styles.quickStatValue}>{calendarData?.completedDays || 153}</Text>
                    <Text style={styles.quickStatLabel}>Completed</Text>
                  </View>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStatItem}>
                  <MaterialCommunityIcons name="calendar-remove" size={20} color="#F59E0B" />
                  <View style={styles.quickStatInfo}>
                    <Text style={styles.quickStatValue}>{calendarData?.remainingDays || 27}</Text>
                    <Text style={styles.quickStatLabel}>Remaining</Text>
                  </View>
                </View>
              </View>

              {/* Live Operations Badge */}
              <View style={styles.liveBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveBadgeText}>● LIVE OPERATIONS</Text>
                <Text style={styles.liveBadgeSubtext}>• Session {sessionYear} is currently in {currentTerm?.title || 'Term 2'}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Term Timeline */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Academic Terms</Text>
            <TouchableOpacity onPress={() => setShowTermHistory(true)}>
              <Text style={styles.viewAllText}>View History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.termList}>
            {calendarData?.terms?.map((term: any, index: number) => (
              <Animated.View
                key={index}
                entering={FadeInUp.delay(index * 100)}
                style={[
                  styles.termCard,
                  term.status === 'ONGOING' && styles.termCardActive
                ]}
              >
                <View style={[styles.termIndicator, { backgroundColor: term.status === 'ONGOING' ? theme.primary : '#CBD5E1' }]} />
                <View style={styles.termMain}>
                  <Text style={[styles.termTitle, term.status === 'ONGOING' && styles.termTitleActive]}>{term.title}</Text>
                  <Text style={styles.termPeriod}>{term.date}</Text>
                </View>
                <View style={[
                  styles.statusPill,
                  {
                    backgroundColor: term.status === 'ONGOING'
                      ? (isDarkMode ? '#4F46E530' : '#EEF2FF')
                      : (isDarkMode ? '#334155' : '#F8FAFC')
                  }
                ]}>
                  <Text style={[
                    styles.statusText,
                    {
                      color: term.status === 'ONGOING'
                        ? (isDarkMode ? '#818CF8' : theme.primary)
                        : theme.subtext
                    }
                  ]}>
                    {term.status}
                  </Text>
                </View>
                {term.status === 'ONGOING' && (
                  <View style={styles.ongoingBadge}>
                    <Text style={styles.ongoingBadgeText}>CURRENT</Text>
                  </View>
                )}
              </Animated.View>
            ))}
          </View>

          {/* Events Grid */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <Text style={styles.sectionTitle}>Institutional Events</Text>
            <TouchableOpacity
              style={styles.addEventBtn}
              onPress={() => setShowAddEventModal(true)}
            >
              <Text style={styles.addEventBtnText}>+ New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.eventsGrid}>
            {displayEvents.length > 0 ? (
              displayEvents.map((event: any, index: number) => {
                const eventTitle = event.title || event.name || 'Event';
                const eventCat = event.category || event.type || 'General';
                const eventDate = event.date || event.startDate || (event.created_at ? new Date(event.created_at).toLocaleDateString() : 'TBA');
                const eventColor = event.color || '#4F46E5';
                return (
                  <TouchableOpacity
                    key={event.id || index}
                    style={styles.eventCard}
                    onPress={() => Alert.alert(eventTitle, event.description || eventDate)}
                  >
                    <View style={[styles.eventCatBox, { backgroundColor: eventColor + '15' }]}>
                      <MaterialCommunityIcons name="star-outline" size={16} color={eventColor} />
                      <Text style={[styles.eventCatText, { color: eventColor }]}>{eventCat}</Text>
                    </View>
                    <Text style={styles.eventTitle} numberOfLines={2}>{eventTitle}</Text>
                    <View style={styles.eventFooter}>
                      <Ionicons name="time-outline" size={14} color={theme.subtext} />
                      <Text style={styles.eventDate}>{eventDate}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyCardFull}>
                <Text style={styles.emptyText}>No institutional events scheduled</Text>
              </View>
            )}
          </View>

          {/* Public Holidays */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <Text style={styles.sectionTitle}>Public Holidays</Text>
          </View>

          <View style={styles.holidaysWrapper}>
            {displayHolidays.length > 0 ? (
              displayHolidays.map((holiday: any, index: number) => {
                const hTitle = holiday.title || holiday.name || 'Public Holiday';
                const hDate = holiday.date || holiday.startDate || 'TBA';
                const hDays = holiday.days || holiday.duration || '1';
                return (
                  <View key={holiday.id || index} style={styles.holidayCard}>
                    <View style={styles.holidayIconBox}>
                      <MaterialCommunityIcons name="calendar-heart" size={24} color="#F59E0B" />
                    </View>
                    <View style={styles.holidayMain}>
                      <Text style={styles.holidayName}>{hTitle}</Text>
                      <Text style={styles.holidayDateRange}>{hDate}</Text>
                    </View>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{hDays}d</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCardFull}>
                <Text style={styles.emptyText}>No public holidays found</Text>
              </View>
            )}
          </View>

          {/* Upcoming Exams Section */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <Text style={styles.sectionTitle}>Upcoming Exams</Text>
          </View>

          <View style={styles.examsWrapper}>
            {displayExams.length > 0 ? (
              displayExams.map((exam: any, index: number) => {
                const eTitle = exam.title || exam.name || exam.exam_name || exam.subject_name || 'Scheduled Exam';
                const eDate = exam.date || exam.exam_date || exam.startDate || 'TBA';
                const eTime = exam.time || exam.start_time || exam.duration || '09:00 AM';
                const eClass = exam.class_name || exam.className || exam.grade || 'All Classes';
                return (
                  <View key={exam.id || index} style={styles.examCard}>
                    <View style={styles.examIconBox}>
                      <MaterialCommunityIcons name="file-document-edit-outline" size={22} color="#EC4899" />
                    </View>
                    <View style={styles.examMain}>
                      <Text style={styles.examTitle}>{eTitle}</Text>
                      <View style={styles.examMetaRow}>
                        <Ionicons name="calendar-outline" size={12} color={theme.subtext} />
                        <Text style={styles.examMetaText}>{eDate}</Text>
                        <Text style={styles.examMetaDot}>•</Text>
                        <Ionicons name="time-outline" size={12} color={theme.subtext} />
                        <Text style={styles.examMetaText}>{eTime}</Text>
                      </View>
                    </View>
                    <View style={styles.examClassBadge}>
                      <Text style={styles.examClassText}>{eClass}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCardFull}>
                <Text style={styles.emptyText}>No upcoming exams scheduled</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Add Event Modal */}
      <Modal visible={showAddEventModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Event</Text>
              <TouchableOpacity onPress={() => setShowAddEventModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                placeholder="Event Title"
                placeholderTextColor={theme.subtext}
                value={newEventTitle}
                onChangeText={setNewEventTitle}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Date (e.g. YYYY-MM-DD)"
                placeholderTextColor={theme.subtext}
                value={newEventDate}
                onChangeText={setNewEventDate}
              />
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Description"
                placeholderTextColor={theme.subtext}
                value={newEventDesc}
                onChangeText={setNewEventDesc}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSubmittingEvent && { opacity: 0.6 }]}
                onPress={handleCreateEvent}
                disabled={isSubmittingEvent}
              >
                {isSubmittingEvent ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Create Event</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Term History Modal */}
      <Modal visible={showTermHistory} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Term History</Text>
              <TouchableOpacity onPress={() => setShowTermHistory(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {calendarData?.terms?.map((term: any, index: number) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyDot} />
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>{term.title}</Text>
                    <Text style={styles.historyDate}>{term.date}</Text>
                  </View>
                  <View style={[styles.historyStatus, { backgroundColor: term.status === 'ONGOING' ? '#10B981' : '#94A3B8' }]}>
                    <Text style={styles.historyStatusText}>{term.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 0),
    paddingBottom: 24,
    backgroundColor: theme.background,
  },
  headerTitle: { fontSize: 16, fontWeight: '500', color: theme.primary, flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatarHeader: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: theme.isDarkMode ? theme.primary : '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  // STATUS CARD
  institutionStatusCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusContent: {
    gap: 16,
  },
  statusInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.background,
    padding: 14,
    borderRadius: 16,
  },
  statusInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusInfoLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusInfoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  statusDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.border,
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    fontSize: 10,
    color: theme.subtext,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.background,
    padding: 14,
    borderRadius: 16,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  quickStatInfo: {
    gap: 2,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  quickStatLabel: {
    fontSize: 10,
    color: theme.subtext,
    fontWeight: '600',
  },
  quickStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.border,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.isDarkMode ? '#10B98115' : '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  liveBadgeSubtext: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },

  termList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  termCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  termCardActive: {
    borderColor: theme.primary,
  },
  termIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 14,
  },
  termMain: {
    flex: 1,
  },
  termTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  termTitleActive: {
    color: theme.primary,
    fontWeight: '800',
  },
  termPeriod: {
    fontSize: 12,
    color: theme.subtext,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ongoingBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  ongoingBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },

  // Events
  addEventBtn: { backgroundColor: theme.isDarkMode ? '#4F46E530' : '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  addEventBtnText: { color: theme.isDarkMode ? '#818CF8' : '#4F46E5', fontSize: 11, fontWeight: '800' },
  eventsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
  eventCard: { width: (SCREEN_WIDTH - 52) / 2, backgroundColor: theme.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 3 },
  eventCatBox: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 12, gap: 4 },
  eventCatText: { fontSize: 9, fontWeight: '800' },
  eventTitle: { fontSize: 14, fontWeight: '800', color: theme.text, height: 40, lineHeight: 18 },
  eventFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 },
  eventDate: { fontSize: 10, color: theme.subtext, fontWeight: '600' },

  // Holidays
  holidaysWrapper: { paddingHorizontal: 20, gap: 12 },
  holidayCard: { backgroundColor: theme.surface, borderRadius: 24, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  holidayIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.isDarkMode ? '#F59E0B20' : '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  holidayMain: { flex: 1, marginLeft: 15 },
  holidayName: { fontSize: 14, fontWeight: '700', color: theme.text },
  holidayDateRange: { fontSize: 11, color: theme.subtext, marginTop: 2, fontWeight: '600' },
  durationBadge: { borderLeftWidth: 1, borderLeftColor: theme.border, paddingLeft: 15 },
  durationText: { fontSize: 12, fontWeight: '900', color: '#F59E0B' },

  // Upcoming Exams
  examsWrapper: { paddingHorizontal: 20, gap: 12 },
  examCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  examIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.isDarkMode ? '#EC489920' : '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  examMain: { flex: 1 },
  examTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 4 },
  examMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  examMetaText: { fontSize: 11, color: theme.subtext, fontWeight: '500' },
  examMetaDot: { fontSize: 11, color: theme.subtext, marginHorizontal: 2 },
  examClassBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: theme.isDarkMode ? '#6366F120' : '#EEF2FF',
  },
  examClassText: { fontSize: 11, fontWeight: '800', color: theme.primary },
  emptyCardFull: {
    width: '100%',
    backgroundColor: theme.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyText: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  // Full Calendar Button
  fullCalendarBtn: {
    backgroundColor: theme.primary,
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  fullCalendarBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.surface, borderRadius: 28, width: '100%', maxWidth: 400, maxHeight: '80%', padding: 24, borderWidth: 1, borderColor: theme.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.text },
  modalBody: { gap: 16 },
  modalInput: { backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: theme.text, borderWidth: 1, borderColor: theme.border },
  modalTextArea: { height: 100, textAlignVertical: 'top' },
  modalSubmitBtn: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  modalSubmitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // History
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, marginRight: 12 },
  historyContent: { flex: 1 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: theme.text },
  historyDate: { fontSize: 12, color: theme.subtext, marginTop: 2 },
  historyStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  historyStatusText: { color: '#FFF', fontSize: 9, fontWeight: '700' },

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

  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default PrincipalCalendarScreen;