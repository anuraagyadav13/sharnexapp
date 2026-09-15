import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../store/ThemeContext';
import { BusSubHeader } from '../../../components/bus/BusSubHeader';
import { busStore } from '../../../services/busMockData';

interface Props {
  navigation: any;
}

export const AddScheduleScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const buses = busStore.getBuses();
  const routes = busStore.getRoutes();
  const drivers = busStore.getDrivers();

  // Form State
  const [selectedBusReg, setSelectedBusReg] = useState(buses[0]?.registrationNumber || 'KA-01-EQ-9842');
  const [selectedRouteName, setSelectedRouteName] = useState(routes[0]?.name || 'Northern Express Corridor');
  const [selectedDriverName, setSelectedDriverName] = useState(drivers[0]?.fullName || 'Rajesh Kumar');
  const [tripType, setTripType] = useState<'Morning Pickup' | 'Afternoon Drop'>('Morning Pickup');
  const [departureTime, setDepartureTime] = useState('07:15 AM');
  const [arrivalTime, setArrivalTime] = useState('08:00 AM');
  const [effectiveFrom, setEffectiveFrom] = useState('2026-06-01');
  const [effectiveTo, setEffectiveTo] = useState('2026-12-31');

  const [isBusDropdownOpen, setBusDropdownOpen] = useState(false);
  const [isRouteDropdownOpen, setRouteDropdownOpen] = useState(false);
  const [isDriverDropdownOpen, setDriverDropdownOpen] = useState(false);

  const handleSaveSchedule = () => {
    // TODO: replace with API call
    const selectedBus = buses.find(b => b.registrationNumber === selectedBusReg) || buses[0];
    const selectedRoute = routes.find(r => r.name === selectedRouteName) || routes[0];
    const selectedDriver = drivers.find(d => d.fullName === selectedDriverName) || drivers[0];

    busStore.addSchedule({
      busId: selectedBus.id,
      busRegistration: selectedBus.registrationNumber,
      routeId: selectedRoute.id,
      routeName: selectedRoute.name,
      driverId: selectedDriver.id,
      driverName: selectedDriver.fullName,
      tripType,
      departureTime,
      arrivalTime,
      daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      status: 'Active',
      effectiveFrom,
      effectiveTo,
    });

    Alert.alert('Success', 'New bus schedule created & published!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      <BusSubHeader
        activeTab="Schedules"
        navigation={navigation}
        title="Add Bus Schedule"
        isStackSubScreen={true}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.pageTitle}>Create Trip Schedule</Text>
          <Text style={styles.pageSubtitle}>Assign vehicle, driver, and departure timing</Text>
        </View>

        {/* Panel 1: Bus & Driver Assignment */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelTitleRow}>
            <Ionicons name="bus-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
            <Text style={styles.panelTitle}>Bus & Resource Assignment</Text>
          </View>

          {/* Select Bus Dropdown */}
          <Text style={styles.inputLabel}>Select Bus Vehicle *</Text>
          <TouchableOpacity
            style={[styles.dropdownSelect, { borderColor: theme.border }]}
            onPress={() => setBusDropdownOpen(!isBusDropdownOpen)}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]}>{selectedBusReg}</Text>
            <Ionicons name={isBusDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.subtext} />
          </TouchableOpacity>

          {isBusDropdownOpen && (
            <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {buses.map(b => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSelectedBusReg(b.registrationNumber);
                    setBusDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, { color: theme.text }]}>
                    {b.registrationNumber} ({b.make} - {b.capacity} Seats)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Select Route Dropdown */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Select Route Corridor *</Text>
          <TouchableOpacity
            style={[styles.dropdownSelect, { borderColor: theme.border }]}
            onPress={() => setRouteDropdownOpen(!isRouteDropdownOpen)}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]}>{selectedRouteName}</Text>
            <Ionicons name={isRouteDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.subtext} />
          </TouchableOpacity>

          {isRouteDropdownOpen && (
            <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {routes.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSelectedRouteName(r.name);
                    setRouteDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, { color: theme.text }]}>
                    {r.name} ({r.type})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Select Driver Dropdown */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Select Driver *</Text>
          <TouchableOpacity
            style={[styles.dropdownSelect, { borderColor: theme.border }]}
            onPress={() => setDriverDropdownOpen(!isDriverDropdownOpen)}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]}>{selectedDriverName}</Text>
            <Ionicons name={isDriverDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.subtext} />
          </TouchableOpacity>

          {isDriverDropdownOpen && (
            <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {drivers.map(d => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSelectedDriverName(d.fullName);
                    setDriverDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, { color: theme.text }]}>
                    {d.fullName} ({d.licenseType} - Rating {d.rating}★)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Panel 2: Trip Details & Effective Period */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelTitleRow}>
            <Ionicons name="time-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
            <Text style={styles.panelTitle}>Trip Details & Timetable</Text>
          </View>

          {/* Trip Type Toggle */}
          <Text style={styles.inputLabel}>Trip Shift Type *</Text>
          <View style={styles.tripTypeToggleRow}>
            <TouchableOpacity
              style={[
                styles.tripToggleBtn,
                tripType === 'Morning Pickup' && styles.tripToggleBtnActive,
              ]}
              onPress={() => {
                setTripType('Morning Pickup');
                setDepartureTime('07:15 AM');
                setArrivalTime('08:00 AM');
              }}
            >
              <Ionicons
                name="sunny-outline"
                size={16}
                color={tripType === 'Morning Pickup' ? '#FFFFFF' : theme.subtext}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tripToggleText,
                  tripType === 'Morning Pickup' && styles.tripToggleTextActive,
                ]}
              >
                Morning Pickup
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tripToggleBtn,
                tripType === 'Afternoon Drop' && styles.tripToggleBtnActive,
              ]}
              onPress={() => {
                setTripType('Afternoon Drop');
                setDepartureTime('02:30 PM');
                setArrivalTime('03:20 PM');
              }}
            >
              <Ionicons
                name="moon-outline"
                size={16}
                color={tripType === 'Afternoon Drop' ? '#FFFFFF' : theme.subtext}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tripToggleText,
                  tripType === 'Afternoon Drop' && styles.tripToggleTextActive,
                ]}
              >
                Afternoon Drop
              </Text>
            </TouchableOpacity>
          </View>

          {/* Times */}
          <View style={styles.inputRowGroup}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Departure Time</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={departureTime}
                onChangeText={setDepartureTime}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Est. Arrival Time</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={arrivalTime}
                onChangeText={setArrivalTime}
              />
            </View>
          </View>

          {/* Effective Period Dates */}
          <Text style={[styles.inputLabel, { marginTop: 6 }]}>Effective Validity Period</Text>
          <View style={styles.inputRowGroup}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputSubLabel}>Effective From</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={effectiveFrom}
                onChangeText={setEffectiveFrom}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputSubLabel}>Effective To</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={effectiveTo}
                onChangeText={setEffectiveTo}
              />
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: theme.border }]}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.8}
            onPress={handleSaveSchedule}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>Save Schedule</Text>
          </TouchableOpacity>
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
    headerTitleRow: {
      marginBottom: 16,
    },
    pageTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
    },
    pageSubtitle: {
      fontSize: 13,
      color: theme.subtext,
      marginTop: 2,
    },
    panelCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
    },
    panelTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    panelTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
    },
    inputSubLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.subtext,
      marginBottom: 4,
    },
    dropdownSelect: {
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#120D24' : '#F8FAFC',
    },
    dropdownText: {
      fontSize: 14,
      fontWeight: '600',
    },
    dropdownList: {
      borderRadius: 12,
      borderWidth: 1,
      marginTop: 4,
      overflow: 'hidden',
    },
    dropdownOption: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    dropdownOptionText: {
      fontSize: 13,
      fontWeight: '600',
    },
    tripTypeToggleRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    tripToggleBtn: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#120D24' : '#F1F5F9',
    },
    tripToggleBtnActive: {
      backgroundColor: '#7C3AED',
      borderColor: '#7C3AED',
    },
    tripToggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.subtext,
    },
    tripToggleTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    inputRowGroup: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 10,
    },
    textInput: {
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      fontSize: 14,
      backgroundColor: isDarkMode ? '#120D24' : '#F8FAFC',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    submitBtn: {
      flex: 2,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#7C3AED',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
    },
    submitBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
