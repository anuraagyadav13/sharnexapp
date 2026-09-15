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

export const AddDriverScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2029-08-15');
  const [licenseType, setLicenseType] = useState<'LMV' | 'HMV' | 'HPMV' | 'PSV'>('HMV');

  // Account Credentials state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    if (!licenseNumber.trim()) errs.licenseNumber = 'License number is required';

    if (password && password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddDriver = () => {
    if (!validateForm()) return;

    // TODO: replace with API call
    busStore.addDriver({
      fullName: fullName.trim(),
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@sharnexbus.com`,
      phone: phone.trim(),
      emergencyContact: emergencyContact.trim() || `${phone.trim()} (Spouse)`,
      licenseNumber: licenseNumber.trim().toUpperCase(),
      licenseExpiry: licenseExpiry,
      licenseType: licenseType,
      status: 'On Duty',
    });

    Alert.alert('Success', `Driver "${fullName}" created successfully!`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      <BusSubHeader
        activeTab="Driver Management"
        navigation={navigation}
        title="Add New Driver"
        isStackSubScreen={true}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.pageTitle}>Driver Registration</Text>
          <Text style={styles.pageSubtitle}>Add certified driver profile & credentials</Text>
        </View>

        {/* Panel 1: Personal Information */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelTitleRow}>
            <Ionicons name="person-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
            <Text style={styles.panelTitle}>Personal Information</Text>
          </View>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={[
                styles.textInput,
                { color: theme.text, borderColor: errors.fullName ? '#EF4444' : theme.border },
              ]}
              placeholder="e.g. Rajesh Kumar"
              placeholderTextColor={theme.placeholder}
              value={fullName}
              onChangeText={setFullName}
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={[
                styles.textInput,
                { color: theme.text, borderColor: errors.phone ? '#EF4444' : theme.border },
              ]}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={theme.placeholder}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="e.g. rajesh.k@sharnexbus.com"
              placeholderTextColor={theme.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Emergency Contact */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Emergency Contact Phone</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="e.g. +91 98765 00001 (Wife)"
              placeholderTextColor={theme.placeholder}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
            />
          </View>
        </View>

        {/* Panel 2: License Details */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelTitleRow}>
            <Ionicons name="card-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
            <Text style={styles.panelTitle}>License Details</Text>
          </View>

          {/* License Number & Expiry */}
          <View style={styles.inputRowGroup}>
            <View style={{ flex: 2 }}>
              <Text style={styles.inputLabel}>Driving License No *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { color: theme.text, borderColor: errors.licenseNumber ? '#EF4444' : theme.border },
                ]}
                placeholder="KA-01-20180049210"
                placeholderTextColor={theme.placeholder}
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                autoCapitalize="characters"
              />
              {errors.licenseNumber && <Text style={styles.errorText}>{errors.licenseNumber}</Text>}
            </View>

            <View style={{ flex: 1.2 }}>
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={licenseExpiry}
                onChangeText={setLicenseExpiry}
              />
            </View>
          </View>

          {/* License Type 2x2 Selectable Card Grid */}
          <Text style={[styles.inputLabel, { marginTop: 10 }]}>License Type Category</Text>
          <View style={styles.licenseGrid}>
            {[
              { type: 'LMV' as const, title: 'LMV', desc: 'Light Motor Vehicle' },
              { type: 'HMV' as const, title: 'HMV', desc: 'Heavy Motor Vehicle' },
              { type: 'HPMV' as const, title: 'HPMV', desc: 'Heavy Passenger' },
              { type: 'PSV' as const, title: 'PSV', desc: 'Public Service Bus' },
            ].map(lic => (
              <TouchableOpacity
                key={lic.type}
                style={[
                  styles.licenseCard,
                  licenseType === lic.type && styles.licenseCardActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setLicenseType(lic.type)}
              >
                <View style={styles.licenseCardTop}>
                  <Text
                    style={[
                      styles.licenseCardTitle,
                      licenseType === lic.type && styles.licenseCardTitleActive,
                    ]}
                  >
                    {lic.title}
                  </Text>
                  {licenseType === lic.type && (
                    <Ionicons name="checkmark-circle" size={18} color="#7C3AED" />
                  )}
                </View>
                <Text style={styles.licenseCardDesc}>{lic.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Panel 3: Account Credentials */}
        <View style={[styles.panelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.panelTitleRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
            <Text style={styles.panelTitle}>Account Credentials</Text>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Initial App Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                placeholder="Enter password..."
                placeholderTextColor={theme.placeholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.subtext}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                placeholder="Confirm password..."
                placeholderTextColor={theme.placeholder}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
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
            onPress={handleAddDriver}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>Add Driver</Text>
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
    inputRowGroup: {
      flexDirection: 'row',
      gap: 12,
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
    licenseGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 8,
    },
    licenseCard: {
      width: '48%',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: isDarkMode ? '#120D24' : '#F8FAFC',
    },
    licenseCardActive: {
      borderColor: '#7C3AED',
      backgroundColor: isDarkMode ? '#26174A' : '#F5F3FF',
    },
    licenseCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    licenseCardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    licenseCardTitleActive: {
      color: '#7C3AED',
    },
    licenseCardDesc: {
      fontSize: 11,
      color: theme.subtext,
    },
    passwordWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      backgroundColor: isDarkMode ? '#120D24' : '#F8FAFC',
    },
    passwordInput: {
      flex: 1,
      fontSize: 14,
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
