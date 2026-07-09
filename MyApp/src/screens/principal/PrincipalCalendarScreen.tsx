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

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.CALENDAR);
      setCalendarData(res.normalized?.data || res.data.data || res.data);
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
      setCalendarData(null);
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

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} translucent />

      {/* Global Header - Student Pattern */}
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

          {/* Hero Section - Modern Date Focus */}
          <Animated.View entering={FadeInUp.duration(400)} style={styles.heroCard}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgLinearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#6366F1" stopOpacity="1" />
                  <Stop offset="1" stopColor="#4F46E5" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#calGrad)" rx={30} ry={30} />
            </Svg>
            <View style={styles.heroContent}>
              <View style={styles.dateCircle}>
                <Text style={styles.dateDay}>{new Date().getDate()}</Text>
                <Text style={styles.dateMonth}>{new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}</Text>
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>Institution Status</Text>
                <Text style={styles.heroDesc}>Session 2025-26 is currently in Term 2. 85% curriculum completion tracked.</Text>
                <View style={styles.heroBadge}>
                   <View style={styles.pulseDot} />
                   <Text style={styles.heroBadgeText}>LIVE OPERATIONS</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Term Timeline */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Academic Terms</Text>
            <TouchableOpacity><Text style={styles.viewAllText}>View History</Text></TouchableOpacity>
          </View>

          <View style={styles.termList}>
            {calendarData?.terms?.map((term: any, index: number) => (
              <Animated.View key={index} entering={FadeInUp.delay(index * 100)} style={styles.termCard}>
                <View style={[styles.termIndicator, { backgroundColor: term.status === 'ONGOING' ? theme.primary : '#CBD5E1' }]} />
                <View style={styles.termMain}>
                  <Text style={styles.termTitle}>{term.title}</Text>
                  <Text style={styles.termPeriod}>{term.date}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: term.status === 'ONGOING' ? (isDarkMode ? '#4F46E530' : '#EEF2FF') : (isDarkMode ? '#334155' : '#F8FAFC') }]}>
                  <Text style={[styles.statusText, { color: term.status === 'ONGOING' ? (isDarkMode ? '#818CF8' : theme.primary) : theme.subtext }]}>{term.status}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Events Grid */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <Text style={styles.sectionTitle}>Institutional Events</Text>
            <TouchableOpacity style={styles.addEventBtn}><Text style={styles.addEventBtnText}>+ New</Text></TouchableOpacity>
          </View>

          <View style={styles.eventsGrid}>
            {calendarData?.events?.map((event: any, index: number) => (
              <TouchableOpacity key={event.id} style={styles.eventCard}>
                <View style={[styles.eventCatBox, { backgroundColor: (event.color || '#4F46E5') + '15' }]}>
                  <MaterialCommunityIcons name="star-outline" size={16} color={event.color || '#4F46E5'} />
                  <Text style={[styles.eventCatText, { color: event.color || '#4F46E5' }]}>{event.category}</Text>
                </View>
                <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                <View style={styles.eventFooter}>
                  <Ionicons name="time-outline" size={14} color="#94A3B8" />
                  <Text style={styles.eventDate}>{event.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Holidays */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <Text style={styles.sectionTitle}>Public Holidays</Text>
          </View>

          <View style={styles.holidaysWrapper}>
            {calendarData?.holidays?.map((holiday: any, index: number) => (
              <View key={index} style={styles.holidayCard}>
                <View style={styles.holidayIconBox}>
                   <MaterialCommunityIcons name="calendar-heart" size={24} color="#F59E0B" />
                </View>
                <View style={styles.holidayMain}>
                  <Text style={styles.holidayName}>{holiday.title}</Text>
                  <Text style={styles.holidayDateRange}>{holiday.date}</Text>
                </View>
                <View style={styles.durationBadge}>
                   <Text style={styles.durationText}>{holiday.days}d</Text>
                </View>
              </View>
            ))}
          </View>

        </ScrollView>
      )}

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header - Student Pattern
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === 'ios'
        ? 60
        : (StatusBar.currentHeight ?? 0),
    paddingBottom: 24,
    backgroundColor: theme.background,
  },
  headerTitle: { fontSize: 16, fontWeight: '500', color: theme.primary, flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatarHeader: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: theme.isDarkMode ? theme.primary : '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  // Hero
  heroCard: { height: 160, borderRadius: 32, marginHorizontal: 20, overflow: 'hidden', padding: 20, justifyContent: 'center' },
  heroContent: { flexDirection: 'row', alignItems: 'center' },
  dateCircle: { width: 85, height: 85, borderRadius: 24, backgroundColor: theme.isDarkMode ? '#334155' : '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8 },
  dateDay: { fontSize: 32, fontWeight: '900', color: theme.text },
  dateMonth: { fontSize: 10, fontWeight: '800', color: '#6366F1', marginTop: -4 },
  heroInfo: { flex: 1, marginLeft: 20 },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  heroDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 4, lineHeight: 16, fontWeight: '500' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 12, gap: 6 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  heroBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Terms
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
  viewAllText: { fontSize: 12, color: theme.isDarkMode ? '#818CF8' : '#4F46E5', fontWeight: '700' },
  termList: { paddingHorizontal: 20, gap: 12 },
  termCard: { backgroundColor: theme.surface, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  termIndicator: { width: 4, height: 35, borderRadius: 2, marginRight: 15 },
  termMain: { flex: 1 },
  termTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
  termPeriod: { fontSize: 11, color: theme.subtext, marginTop: 2, fontWeight: '600' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '800' },

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
});

export default PrincipalCalendarScreen;
