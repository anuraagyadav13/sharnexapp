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

export const AddVehicleScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  // Form State
  const [regNumber, setRegNumber] = useState('');
  const [capacity, setCapacity] = useState('42');
  const [make, setMake] = useState('Ashok Leyland');
  const [model, setModel] = useState('Falcon 2024');
  const [gpsMethod, setGpsMethod] = useState<'phone' | 'dedicated'>('dedicated');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    if (!regNumber.trim()) {
      errs.regNumber = 'Registration number is required';
    } else if (regNumber.trim().length < 5) {
      errs.regNumber = 'Enter a valid registration number (e.g. KA-01-EQ-9842)';
    }

    const capNum = parseInt(capacity.trim(), 10);
    if (isNaN(capNum) || capNum <= 0 || capNum > 100) {
      errs.capacity = 'Capacity must be between 1 and 100';
    }

    if (!make.trim()) errs.make = 'Vehicle make is required';
    if (!model.trim()) errs.model = 'Vehicle model is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // TODO: replace with API call
    busStore.addBus({
      registrationNumber: regNumber.toUpperCase().trim(),
      make: make.trim(),
      model: model.trim(),
      capacity: parseInt(capacity.trim(), 10),
      gpsTrackingMethod: gpsMethod,
      status: 'Active',
      lastLocation: 'Depot Yard',
      speedKmH: 0,
    });

    Alert.alert('Success', 'New vehicle registered successfully to fleet!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      <BusSubHeader
        activeTab="Fleet Tracking"
        navigation={navigation}
        title="Add New Vehicle"
        isStackSubScreen={true}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.pageTitle}>Vehicle Registration</Text>
          <Text style={styles.pageSubtitle}>Add a new bus to institution tracking</Text>
        </View>

        {/* Panel 1: Vehicle Details */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelTitleRow}>
            <Ionicons name="bus-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
            <Text style={styles.panelTitle}>Vehicle Details</Text>
          </View>

          {/* Registration Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Registration Number *</Text>
            <TextInput
              style={[
                styles.textInput,
                { color: theme.text, borderColor: errors.regNumber ? '#EF4444' : theme.border },
              ]}
              placeholder="e.g. KA-01-EQ-9842"
              placeholderTextColor={theme.placeholder}
              value={regNumber}
              onChangeText={setRegNumber}
              autoCapitalize="characters"
            />
            {errors.regNumber && <Text style={styles.errorText}>{errors.regNumber}</Text>}
          </View>

          {/* Seating Capacity */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Seating Capacity *</Text>
            <TextInput
              style={[
                styles.textInput,
                { color: theme.text, borderColor: errors.capacity ? '#EF4444' : theme.border },
              ]}
              placeholder="e.g. 42"
              placeholderTextColor={theme.placeholder}
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
            />
            {errors.capacity && <Text style={styles.errorText}>{errors.capacity}</Text>}
          </View>

          {/* Make */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Make / Manufacturer *</Text>
            <TextInput
              style={[
                styles.textInput,
                { color: theme.text, borderColor: errors.make ? '#EF4444' : theme.border },
              ]}
              placeholder="e.g. Ashok Leyland / Tata Motors"
              placeholderTextColor={theme.placeholder}
              value={make}
              onChangeText={setMake}
            />
            {errors.make && <Text style={styles.errorText}>{errors.make}</Text>}
          </View>

          {/* Model */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Model & Year *</Text>
            <TextInput
              style={[
                styles.textInput,
                { color: theme.text, borderColor: errors.model ? '#EF4444' : theme.border },
              ]}
              placeholder="e.g. Falcon 2024"
              placeholderTextColor={theme.placeholder}
              value={model}
              onChangeText={setModel}
            />
            {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
          </View>
        </View>

        {/* Panel 2: GPS Tracking Config */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelTitleRow}>
            <Ionicons name="hardware-chip-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
            <Text style={styles.panelTitle}>GPS Tracking Config</Text>
          </View>

          <Text style={styles.inputLabel}>Select Telemetry Hardware Method</Text>

          {/* Toggle Cards */}
          <View style={styles.gpsCardRow}>
            {/* Dedicated GPS Card */}
            <TouchableOpacity
              style={[
                styles.gpsCard,
                gpsMethod === 'dedicated' && styles.gpsCardActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setGpsMethod('dedicated')}
            >
              <View style={styles.gpsCardTop}>
                <Ionicons
                  name="hardware-chip-outline"
                  size={24}
                  color={gpsMethod === 'dedicated' ? '#7C3AED' : theme.subtext}
                />
                {gpsMethod === 'dedicated' && (
                  <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
                )}
              </View>
              <Text
                style={[
                  styles.gpsCardTitle,
                  gpsMethod === 'dedicated' && styles.gpsCardTitleActive,
                ]}
              >
                Dedicated GPS Box
              </Text>
              <Text style={styles.gpsCardSub}>OBD-II / Hardwired OBD device installed in bus dashboard.</Text>
            </TouchableOpacity>

            {/* Driver's Phone Card */}
            <TouchableOpacity
              style={[
                styles.gpsCard,
                gpsMethod === 'phone' && styles.gpsCardActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setGpsMethod('phone')}
            >
              <View style={styles.gpsCardTop}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color={gpsMethod === 'phone' ? '#7C3AED' : theme.subtext}
                />
                {gpsMethod === 'phone' && (
                  <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
                )}
              </View>
              <Text
                style={[
                  styles.gpsCardTitle,
                  gpsMethod === 'phone' && styles.gpsCardTitleActive,
                ]}
              >
                Driver Mobile Phone
              </Text>
              <Text style={styles.gpsCardSub}>Location synced via driver smartphone app GPS background service.</Text>
            </TouchableOpacity>
          </View>

          {/* Informative Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
            <Text style={styles.infoBannerText}>
              {gpsMethod === 'dedicated'
                ? 'Dedicated hardware sends high-frequency 10s ping intervals and engine diagnostics directly to server.'
                : 'Mobile tracking requires driver to accept location permissions when starting assigned schedule trips.'}
            </Text>
          </View>
        </View>

        {/* Bottom Form Buttons */}
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
            onPress={handleSubmit}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>Add Vehicle</Text>
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
    inputGroup: {
      marginBottom: 14,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
    },
    textInput: {
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      fontSize: 14,
      backgroundColor: isDarkMode ? '#120D24' : '#F8FAFC',
    },
    errorText: {
      fontSize: 11,
      color: '#EF4444',
      marginTop: 4,
      fontWeight: '600',
    },
    gpsCardRow: {
      flexDirection: 'row',
      gap: 12,
      marginVertical: 10,
    },
    gpsCard: {
      flex: 1,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: isDarkMode ? '#120D24' : '#F8FAFC',
    },
    gpsCardActive: {
      borderColor: '#7C3AED',
      backgroundColor: isDarkMode ? '#26174A' : '#F5F3FF',
    },
    gpsCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    gpsCardTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    gpsCardTitleActive: {
      color: '#7C3AED',
    },
    gpsCardSub: {
      fontSize: 11,
      color: theme.subtext,
      marginTop: 4,
      lineHeight: 15,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#26174A' : '#F5F3FF',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(124, 58, 237, 0.3)' : '#DDD6FE',
      marginTop: 8,
    },
    infoBannerText: {
      flex: 1,
      fontSize: 12,
      color: theme.text,
      lineHeight: 16,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
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
