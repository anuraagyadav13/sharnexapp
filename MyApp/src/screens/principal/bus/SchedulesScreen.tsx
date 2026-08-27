import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../store/ThemeContext';
import { NavigationDrawer } from '../../../components/NavigationDrawer';
import { BusSubHeader } from '../../../components/bus/BusSubHeader';
import { busStore, BusSchedule } from '../../../services/busMockData';

interface Props {
  navigation: any;
}

export const SchedulesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [schedules, setSchedules] = useState<BusSchedule[]>(busStore.getSchedules());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = busStore.subscribe(() => {
      setSchedules(busStore.getSchedules());
    });
    return unsubscribe;
  }, []);

  const filteredSchedules = schedules.filter(s => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.id.toLowerCase().includes(query) ||
      s.routeName.toLowerCase().includes(query) ||
      s.busRegistration.toLowerCase().includes(query) ||
      s.driverName.toLowerCase().includes(query)
    );
  });

  const totalCount = schedules.length;
  const activeCount = schedules.filter(s => s.status === 'Active').length;
  const morningCount = schedules.filter(s => s.tripType === 'Morning Pickup').length;
  const afternoonCount = schedules.filter(s => s.tripType === 'Afternoon Drop').length;

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />

      <BusSubHeader
        activeTab="Schedules"
        navigation={navigation}
        onOpenDrawer={() => setDrawerOpen(true)}
        title="Bus Schedules"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Schedules</Text>
            <Text style={styles.screenSubtitle}>Manage departure & route timetables</Text>
          </View>

          <TouchableOpacity
            style={styles.addScheduleBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddSchedule')}
          >
            <Ionicons name="calendar-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addScheduleBtnText}>Add Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by schedule ID, route, bus, driver..."
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stat Row */}
        <View style={styles.statGridRow}>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.statNum}>{totalCount}</Text>
            <Text style={styles.statTxt}>Total Schedules</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>{activeCount}</Text>
            <Text style={styles.statTxt}>Active</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.statNum, { color: '#7C3AED' }]}>{morningCount}</Text>
            <Text style={styles.statTxt}>Morning Trips</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.statNum, { color: '#EC4899' }]}>{afternoonCount}</Text>
            <Text style={styles.statTxt}>Afternoon Trips</Text>
          </View>
        </View>

        {/* Schedule Cards Grid */}
        <View style={styles.cardsGrid}>
          {filteredSchedules.map(item => (
            <View
              key={item.id}
              style={[styles.scheduleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              {/* Top Row: UUID ID + Active Badge */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.idContainer}>
                  <Ionicons name="qr-code-outline" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                  <Text style={styles.uuidText}>{item.id}</Text>
                </View>

                <View style={styles.activePill}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activePillText}>{item.status}</Text>
                </View>
              </View>

              {/* Route Name & Trip Type Pill */}
              <Text style={styles.routeNameTitle}>{item.routeName}</Text>

              <View style={styles.tripTypeRow}>
                <View
                  style={[
                    styles.tripTypePill,
                    item.tripType === 'Morning Pickup'
                      ? (isDarkMode ? { backgroundColor: '#26174A' } : { backgroundColor: '#EDE9FE' })
                      : (isDarkMode ? { backgroundColor: '#3B1A24' } : { backgroundColor: '#FCE7F3' }),
                  ]}
                >
                  <Ionicons
                    name={item.tripType === 'Morning Pickup' ? 'sunny-outline' : 'moon-outline'}
                    size={14}
                    color={item.tripType === 'Morning Pickup' ? '#7C3AED' : '#EC4899'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.tripTypePillText,
                      { color: item.tripType === 'Morning Pickup' ? '#7C3AED' : '#EC4899' },
                    ]}
                  >
                    {item.tripType}
                  </Text>
                </View>

                <Text style={styles.timeSpanText}>
                  {item.departureTime} – {item.arrivalTime}
                </Text>
              </View>

              <View style={styles.cardDivider} />

              {/* Details List */}
              <View style={styles.detailsGroup}>
                <View style={styles.detailRow}>
                  <Ionicons name="bus-outline" size={16} color={theme.subtext} style={{ marginRight: 8 }} />
                  <Text style={styles.detailLabel}>Assigned Bus:</Text>
                  <Text style={styles.detailVal}>{item.busRegistration}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color={theme.subtext} style={{ marginRight: 8 }} />
                  <Text style={styles.detailLabel}>Assigned Driver:</Text>
                  <Text style={styles.detailVal}>{item.driverName}</Text>
                </View>
              </View>

              {/* Days of Week Chips */}
              <View style={styles.daysRow}>
                {['MON', 'TUE', 'WED', 'THU', 'FRI'].map(day => {
                  const isScheduled = item.daysOfWeek.includes(day);
                  return (
                    <View
                      key={day}
                      style={[
                        styles.dayChip,
                        isScheduled && styles.dayChipActive,
                      ]}
                    >
                      <Text style={[styles.dayChipText, isScheduled && styles.dayChipTextActive]}>
                        {day}
                      </Text>
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={styles.editIconBtn}
                  onPress={() => navigation.navigate('AddSchedule')}
                >
                  <Ionicons name="pencil-outline" size={18} color="#7C3AED" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    screenTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
    },
    screenSubtitle: {
      fontSize: 13,
      color: theme.subtext,
      marginTop: 2,
    },
    addScheduleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#7C3AED',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 4,
    },
    addScheduleBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
    },
    statGridRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    statBox: {
      flex: 1,
      borderRadius: 14,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    statNum: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    statTxt: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.subtext,
      marginTop: 2,
    },
    cardsGrid: {
      gap: 14,
    },
    scheduleCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    idContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    uuidText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#7C3AED',
      letterSpacing: 0.5,
    },
    activePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    activeDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#10B981',
      marginRight: 5,
    },
    activePillText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#10B981',
    },
    routeNameTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 8,
    },
    tripTypeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tripTypePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    tripTypePillText: {
      fontSize: 12,
      fontWeight: '700',
    },
    timeSpanText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    cardDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 12,
    },
    detailsGroup: {
      gap: 6,
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 12,
      color: theme.subtext,
      marginRight: 4,
    },
    detailVal: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    daysRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dayChip: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#120D24' : '#F1F5F9',
    },
    dayChipActive: {
      backgroundColor: '#7C3AED',
    },
    dayChipText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
    },
    dayChipTextActive: {
      color: '#FFFFFF',
    },
    editIconBtn: {
      marginLeft: 'auto',
      padding: 4,
    },
  });
