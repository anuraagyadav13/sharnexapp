import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import apiClient from '../../services/apiClient';
import principalService from '../../services/principalService';
import { ENDPOINTS } from '../../constants/api';
import { COUNTRIES } from '../../constants/countries';
import SelectionModal from '../../components/modals/SelectionModal';

let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker not available');
}

const initialFormState = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  guardianName: '',
  guardianPhone: '',
  guardianEmail: '',
  guardianRelation: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactEmail: '',
  emergencyContactRelation: '',
  classId: '',
  admissionNumber: '',
  admissionDate: new Date().toISOString().split('T')[0],
  previousSchool: '',
  password: '',
  sendWelcomeEmail: true,
  countryCode: '+91',
  guardianCountryCode: '+91',
  emergencyCountryCode: '+91',
};

const PrincipalAddStudentScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const FormField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    required,
    onPress,
    countryCode,
    onCountryCodePress,
    secureTextEntry,
  }: any) => (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label.toUpperCase()}{' '}
        {required && <Text style={{ color: '#EF4444' }}>*</Text>}
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {countryCode && (
          <TouchableOpacity
            style={styles.countryCodePicker}
            onPress={onCountryCodePress}
          >
            <Text style={styles.countryCodeText}>{countryCode}</Text>
            <Ionicons name="caret-down" size={10} color={theme.subtext} />
          </TouchableOpacity>
        )}
        {onPress ? (
          <TouchableOpacity
            style={[
              styles.premiumInput,
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
            ]}
            onPress={onPress}
          >
            <Text
              style={[styles.premiumInputText, !value && { color: theme.subtext }]}
            >
              {value || placeholder}
            </Text>
            <Ionicons name="chevron-down" size={18} color={theme.subtext} />
          </TouchableOpacity>
        ) : (
          <TextInput
            style={[styles.premiumInput, { flex: 1 }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.subtext}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
          />
        )}
      </View>
    </View>
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ ...initialFormState });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState<'dob' | 'admissionDate'>('dob');
  const [selectionConfig, setSelectionConfig] = useState<{
    visible: boolean;
    title: string;
    field: string;
    options: string[];
  }>({
    visible: false,
    title: '',
    field: '',
    options: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res: any = await principalService.getClasses();
      const rawClasses = res?.data?.data || res?.data || res || [];
      if (Array.isArray(rawClasses)) {
        setClasses(
          rawClasses.map((c: any) => ({
            id: c.id,
            name: `${c.name || c.grade || ''} ${c.section || ''}`.trim() || 'Class',
          }))
        );
      }
    } catch (e) {
      console.warn('Failed to fetch classes', e);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  const updateForm = updateFormData;

  const handleClearForm = () => {
    setFormData({ ...initialFormState });
  };

  const handleOpenDatePicker = (field: 'dob' | 'admissionDate') => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const formatted = `${yyyy}-${mm}-${dd}`;
      updateFormData(dateField, formatted);
    }
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const handleOpenSelection = (title: string, field: string, options: string[]) => {
    setSelectionConfig({ visible: true, title, field, options });
    setSearchQuery('');
  };

  const handleSelectOption = (option: string) => {
    if (
      selectionConfig.field === 'countryCode' ||
      selectionConfig.field === 'guardianCountryCode' ||
      selectionConfig.field === 'emergencyCountryCode'
    ) {
      const code = option.split(' ').pop() || option;
      updateFormData(selectionConfig.field, code);
    } else if (selectionConfig.field === 'classId') {
      const selectedClass = classes.find(c => c.name === option);
      if (selectedClass) {
        updateFormData('classId', selectedClass.id);
      }
    } else {
      updateFormData(selectionConfig.field, option);
    }
    setSelectionConfig(prev => ({ ...prev, visible: false }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      Alert.alert('Required Fields', 'Please fill out first name, last name, and email.');
      return;
    }

    try {
      setIsSubmitting(true);
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const studentPayload = {
        name: fullName,
        email: formData.email,
        phone: formData.phone ? `${formData.countryCode} ${formData.phone}`.trim() : '',
        classId: formData.classId || undefined,
        admissionNumber: formData.admissionNumber || undefined,
        rollNumber: formData.admissionNumber || undefined,
        dateOfBirth: formData.dob || undefined,
        gender: formData.gender || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        postalCode: formData.postalCode || undefined,
        guardianName: formData.guardianName || undefined,
        guardianPhone: formData.guardianPhone
          ? `${formData.guardianCountryCode} ${formData.guardianPhone}`.trim()
          : undefined,
        guardianEmail: formData.guardianEmail || undefined,
        guardianRelation: formData.guardianRelation || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone
          ? `${formData.emergencyCountryCode} ${formData.emergencyContactPhone}`.trim()
          : undefined,
        emergencyContactEmail: formData.emergencyContactEmail || undefined,
        emergencyContactRelation: formData.emergencyContactRelation || undefined,
        sendWelcomeEmail: formData.sendWelcomeEmail,
      };

      await principalService.createStudent(studentPayload);
      Alert.alert('Success', `${fullName} has been enrolled successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Failed to add student. Please try again.';
      Alert.alert('Registration Error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClassNameById = (id: string) => {
    const found = classes.find(c => c.id === id);
    return found ? found.name : '';
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
        translucent
      />

      <View style={styles.globalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Add New Student
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('AccountSettings')}>
            <View style={styles.avatarHeader}>
              <Text style={styles.avatarTextHeader}>
                {authState.user?.name?.charAt(0) || 'P'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHeader}>
            <Text style={styles.screenTitle}>Add Student</Text>
            <Text style={styles.screenSubtitle}>
              Register new students to the school system.
            </Text>
          </View>

          {/* Personal Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            <View style={styles.inputRow}>
              <FormField
                required
                label="First Name"
                value={formData.firstName}
                onChangeText={(v: any) => updateForm('firstName', v)}
                placeholder="Enter First Name"
              />
              <FormField
                required
                label="Last Name"
                value={formData.lastName}
                onChangeText={(v: any) => updateForm('lastName', v)}
                placeholder="Enter last Name"
              />
            </View>
            <View style={styles.inputRow}>
              <FormField
                label="Date of Birth"
                value={formData.dob}
                onPress={() => handleOpenDatePicker('dob')}
                placeholder="mm/dd/yyyy"
              />
              <FormField
                label="Gender"
                value={formData.gender}
                onPress={() =>
                  handleOpenSelection('Gender', 'gender', [
                    'Male',
                    'Female',
                    'Other',
                  ])
                }
                placeholder="Select Gender"
              />
            </View>

            {/* Photo Upload */}
            <View style={styles.field}>
              <Text style={styles.label}>PHOTO</Text>
              <TouchableOpacity style={styles.photoUploadBox}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={32}
                  color="#94A3B8"
                />
                <Text style={styles.photoUploadText}>
                  Drag and drop a photo here, or click to browse
                </Text>
                <View style={styles.browseButton}>
                  <Text style={styles.browseButtonText}>Browse files</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>
            <FormField
              required
              label="Email Address"
              value={formData.email}
              onChangeText={(v: any) => updateForm('email', v)}
              placeholder="student@example.com"
              keyboardType="email-address"
            />
            <FormField
              label="Phone Number"
              value={formData.phone}
              onChangeText={(v: any) => updateForm('phone', v)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              countryCode={formData.countryCode}
              onCountryCodePress={() =>
                handleOpenSelection(
                  'Country Code',
                  'countryCode',
                  COUNTRIES.map(c => `${c.name} ${c.code}`),
                )
              }
            />
            <FormField
              label="Address"
              value={formData.address}
              onChangeText={(v: any) => updateForm('address', v)}
              placeholder="Enter street Address"
            />
            <View style={styles.inputRow}>
              <FormField
                label="City"
                value={formData.city}
                onChangeText={(v: any) => updateForm('city', v)}
                placeholder="Enter City"
              />
              <FormField
                label="State"
                value={formData.state}
                onChangeText={(v: any) => updateForm('state', v)}
                placeholder="Enter State"
              />
            </View>
            <FormField
              label="Postal Code"
              value={formData.postalCode}
              onChangeText={(v: any) => updateForm('postalCode', v)}
              placeholder="Enter Postal code"
            />
          </View>

          {/* Parent/Guardian Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Parent/Guardian Information
              </Text>
            </View>
            <FormField
              label="Parent/Guardian Name"
              value={formData.guardianName}
              onChangeText={(v: any) => updateForm('guardianName', v)}
              placeholder="Enter Parent/Guardian name"
            />
            <FormField
              label="Parent Phone Number"
              value={formData.guardianPhone}
              onChangeText={(v: any) => updateForm('guardianPhone', v)}
              placeholder="Enter parent phone number"
              keyboardType="phone-pad"
              countryCode={formData.guardianCountryCode}
              onCountryCodePress={() =>
                handleOpenSelection(
                  'Guardian Country Code',
                  'guardianCountryCode',
                  COUNTRIES.map(c => `${c.name} ${c.code}`),
                )
              }
            />
            <FormField
              label="Parent Email"
              value={formData.guardianEmail}
              onChangeText={(v: any) => updateForm('guardianEmail', v)}
              placeholder="Enter parent email"
              keyboardType="email-address"
            />
            <FormField
              label="Relationship"
              value={formData.guardianRelation}
              onPress={() =>
                handleOpenSelection('Relationship', 'guardianRelation', [
                  'Father',
                  'Mother',
                  'Guardian',
                  'Other',
                ])
              }
              placeholder="Select Relationship"
            />
          </View>

          {/* Emergency Contact */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emergency Contact</Text>
            </View>
            <FormField
              label="Contact Name"
              value={formData.emergencyContactName}
              onChangeText={(v: any) => updateForm('emergencyContactName', v)}
              placeholder="Emergency contact name"
            />
            <FormField
              label="Contact Phone"
              value={formData.emergencyContactPhone}
              onChangeText={(v: any) => updateForm('emergencyContactPhone', v)}
              placeholder="Emergency phone number"
              keyboardType="phone-pad"
              countryCode={formData.emergencyCountryCode}
              onCountryCodePress={() =>
                handleOpenSelection(
                  'Emergency Country Code',
                  'emergencyCountryCode',
                  COUNTRIES.map(c => `${c.name} ${c.code}`),
                )
              }
            />
            <FormField
              label="Contact Email"
              value={formData.emergencyContactEmail}
              onChangeText={(v: any) => updateForm('emergencyContactEmail', v)}
              placeholder="Emergency email"
              keyboardType="email-address"
            />
            <FormField
              label="Relationship"
              value={formData.emergencyContactRelation}
              onPress={() =>
                handleOpenSelection(
                  'Emergency Relationship',
                  'emergencyContactRelation',
                  ['Father', 'Mother', 'Uncle', 'Aunt', 'Other'],
                )
              }
              placeholder="Select Relationship"
            />
          </View>

          {/* Academic Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Academic Information</Text>
            </View>
            <FormField
              required
              label="Class"
              value={
                classes.find(c => c.id === formData.classId || c.name === formData.classId)?.name ||
                formData.classId
              }
              onPress={() =>
                handleOpenSelection(
                  'Select Class',
                  'classId',
                  classes.map(c => c.name),
                )
              }
              placeholder="Select Class"
            />
            <FormField
              label="Admission Number"
              value={formData.admissionNumber}
              onChangeText={(v: any) => updateForm('admissionNumber', v)}
              placeholder="Give Admission number"
            />
            <FormField
              label="Admission Date"
              value={formData.admissionDate}
              onPress={() => handleOpenDatePicker('admissionDate')}
              placeholder="mm/dd/yyyy"
            />
            <FormField
              label="Previous School"
              value={formData.previousSchool}
              onChangeText={(v: any) => updateForm('previousSchool', v)}
              placeholder="Name of previous school"
            />
          </View>

          {/* Account & Invite */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Account & Invite</Text>
            </View>
            <FormField
              label="Password (optional)"
              value={formData.password}
              onChangeText={(v: any) => updateForm('password', v)}
              placeholder="••••••••••••"
              secureTextEntry={true}
            />
            <Text style={styles.helperText}>
              If left blank, a secure temporary password will be generated.
            </Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Send welcome email to student
              </Text>
              <Switch
                value={formData.sendWelcomeEmail}
                onValueChange={v => updateForm('sendWelcomeEmail', v)}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Form Actions */}
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearForm}>
              <Text style={styles.clearBtnText}>Clear Form</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primarySubmitBtn,
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primarySubmitText}>Register Student</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && DateTimePicker && (
        <DateTimePicker
          value={(() => {
            if (formData[dateField]) {
              const d = new Date(formData[dateField]);
              return isNaN(d.getTime()) ? new Date() : d;
            }
            return new Date();
          })()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      <SelectionModal
        visible={selectionConfig.visible}
        title={selectionConfig.title}
        options={selectionConfig.options}
        onSelect={handleSelectOption}
        onClose={() =>
          setSelectionConfig(prev => ({ ...prev, visible: false }))
        }
      />
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: theme.background },
    container: { flex: 1 },
    scrollContent: { paddingBottom: 60 },

    // Header
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
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 10,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    avatarHeader: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#8B5CF6',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 4 },
    screenTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    screenSubtitle: {
      fontSize: 12,
      color: theme.subtext,
      fontWeight: '400',
      lineHeight: 18,
    },

    // Form Sections
    formSection: { paddingHorizontal: 20, marginTop: 8, marginBottom: 20 },
    sectionHeader: {
      marginBottom: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.3,
    },

    field: { flex: 1, marginBottom: 14 },
    label: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.subtext,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    premiumInput: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 46,
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
      borderWidth: 1,
      borderColor: theme.border,
    },
    premiumInputText: { fontSize: 14, color: theme.text, fontWeight: '500' },
    countryCodePicker: {
      width: 70,
      height: 46,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    countryCodeText: { fontSize: 13, fontWeight: '600', color: theme.text },
    inputRow: { flexDirection: 'row', gap: 12 },

    // Photo Upload
    photoUploadBox: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderStyle: 'dashed',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoUploadText: {
      fontSize: 12,
      color: theme.subtext,
      textAlign: 'center',
      marginTop: 10,
      marginBottom: 14,
      fontWeight: '500',
    },
    browseButton: {
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.02,
      shadowRadius: 4,
      elevation: 1,
    },
    browseButtonText: { fontSize: 13, fontWeight: '700', color: theme.primary },

    // Helper & Switches
    helperText: {
      fontSize: 11,
      color: theme.subtext,
      marginTop: -6,
      marginBottom: 16,
      fontWeight: '500',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    switchLabel: { fontSize: 13, fontWeight: '600', color: theme.text },

    // Footer Actions
    footerActions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 10,
      marginTop: 10,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    clearBtn: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    clearBtnText: { color: theme.subtext, fontWeight: '700', fontSize: 13 },
    cancelBtn: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    cancelBtnText: { color: theme.text, fontWeight: '700', fontSize: 13 },
    primarySubmitBtn: {
      flex: 1.5,
      backgroundColor: '#3B82F6',
      height: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    primarySubmitText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  });

export default PrincipalAddStudentScreen;
