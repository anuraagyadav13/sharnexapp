import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  PermissionsAndroid,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import { launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { getApiErrorMessage } from '../../services/apiClient';
import principalService from '../../services/principalService';
import { COUNTRIES } from '../../constants/countries';
import SelectionModal from '../../components/modals/SelectionModal';

const formatDateForApi = (dateStr: string) => {
  if (!dateStr) return '2026-07-08';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return dateStr;
};

type Props = NativeStackScreenProps<RootStackParamList, 'PrincipalEditStaff'>;

const TABS = [
  { id: 'personal', label: 'Personal', icon: 'account-outline' },
  { id: 'bank', label: 'Financial', icon: 'bank-outline' },
  { id: 'face', label: 'Biometric', icon: 'face-recognition' },
];

let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker not available');
}

const PrincipalEditStaffScreen: React.FC<Props> = ({ navigation, route }) => {
  const { staffId, initialData } = route.params;
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || initialData?.name?.split(' ')[0] || '',
    lastName: initialData?.lastName || initialData?.name?.split(' ').slice(1).join(' ') || '',
    email: initialData?.email || '',
    phone: initialData?.phone?.includes(' ') ? initialData.phone.split(' ').slice(1).join(' ') : (initialData?.phone || ''),
    countryCode: initialData?.phone?.includes(' ') ? initialData.phone.split(' ')[0] : '+91',
    dob: initialData?.dob || '',
    address: initialData?.address || '',
    bankName: initialData?.bankName || '',
    accountNumber: initialData?.accountNumber || '',
    accountHolderName: initialData?.accountHolderName || initialData?.name || '',
    accountType: initialData?.accountType || initialData?.bankData?.accountType || 'Saving',
    ifscCode: initialData?.ifscCode || initialData?.bankData?.ifscCode || '',
    paymentMethod: initialData?.paymentMethod || initialData?.bankData?.salaryPaymentMethod || 'Bank Transfer',
    department: initialData?.department || initialData?.profileData?.department || 'Mathematics',
    qualification: initialData?.highestQualification || initialData?.profileData?.highestQualification || '',
    experience: initialData?.yearsOfExperience || initialData?.profileData?.yearsOfExperience || '',
    biography: initialData?.professionalBio || initialData?.profileData?.professionalBio || '',
  });
  const [photo, setPhoto] = useState<string | null>(initialData?.biometricPhoto || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState<'dob'>('dob');

  const [selectionConfig, setSelectionConfig] = useState<{
    visible: boolean;
    title: string;
    field: string;
    options: string[];
  }>({
    visible: false,
    title: '',
    field: '',
    options: []
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenDatePicker = (field: 'dob') => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const handleLaunchCamera = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera access to capture biometric photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const options = {
      mediaType: 'photo' as const,
      cameraType: 'front' as const,
      quality: 0.7 as const,
      saveToPhotos: true,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        // user cancelled
      } else if (response.errorCode) {
        Alert.alert('Camera Error', response.errorMessage || 'Failed to capture image');
      } else if (response.assets && response.assets.length > 0) {
        setPhoto(response.assets[0].uri || null);
        Alert.alert('Success', 'Biometric photo updated!');
      }
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const yyyy = selectedDate.getFullYear();
      const formatted = `${mm}/${dd}/${yyyy}`;
      updateFormData(dateField, formatted);
    }
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const handleOpenSelection = (title: string, field: string, options: string[]) => {
    setSelectionConfig({ visible: true, title, field, options });
  };

  const handleSelectOption = (option: string) => {
    if (selectionConfig.field === 'countryCode') {
      const code = option.split(' ').pop() || option;
      updateFormData(selectionConfig.field, code);
    } else {
      updateFormData(selectionConfig.field, option);
    }
    setSelectionConfig(prev => ({ ...prev, visible: false }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const dept = formData.department || 'Mathematics';

      const payload = {
        name: fullName,
        email: formData.email,
        phone: formData.phone ? `${formData.countryCode} ${formData.phone}`.trim() : '',
        department: dept,
        position: dept,
        profileData: {
          dateOfBirth: formatDateForApi(formData.dob),
          address: formData.address || '',
          department: dept,
          highestQualification: formData.qualification || '',
          yearsOfExperience: Number(formData.experience) || 0,
          professionalBio: formData.biography || '',
        },
        bankData: {
          bankName: formData.bankName || '',
          accountNumber: formData.accountNumber || '',
          accountHolderName: formData.accountHolderName || fullName,
          accountType: formData.accountType || 'Saving',
          ifscCode: formData.ifscCode || '',
          salaryPaymentMethod: formData.paymentMethod || 'Check',
        },
      };

      await principalService.updateTeacher(staffId, payload);
      Alert.alert(
        'Staff Updated',
        `Staff profile for ${fullName} has been updated successfully.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err);
      Alert.alert('Update Error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Staff Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
              onPress={() => setActiveTab(tab.id)}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={18}
                color={isActive ? theme.primary : theme.subtext}
              />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'personal' && (
          <Animated.View entering={FadeInUp.duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Identity & Contact</Text>
              <Text style={styles.sectionSubtitle}>Update basic personal details and contact info</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>FIRST NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={theme.subtext}
                  value={formData.firstName}
                  onChangeText={v => updateFormData('firstName', v)}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>LAST NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={theme.subtext}
                  value={formData.lastName}
                  onChangeText={v => updateFormData('lastName', v)}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={theme.subtext}
                value={formData.email}
                onChangeText={v => updateFormData('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PHONE NUMBER</Text>
              <View style={styles.phoneInputRow}>
                <TouchableOpacity
                  style={styles.countryPicker}
                  onPress={() =>
                    handleOpenSelection(
                      'Country Code',
                      'countryCode',
                      COUNTRIES.map(c => `${c.name} ${c.code}`)
                    )
                  }
                >
                  <Text style={styles.countryCodeText}>{formData.countryCode}</Text>
                  <Ionicons name="chevron-down" size={14} color={theme.subtext} />
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  placeholderTextColor={theme.subtext}
                  value={formData.phone}
                  onChangeText={v => updateFormData('phone', v)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>DATE OF BIRTH</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => handleOpenDatePicker('dob')}
              >
                <Text style={[styles.inputValue, !formData.dob && { color: theme.subtext }]}>
                  {formData.dob || 'mm/dd/yyyy'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>RESIDENTIAL ADDRESS</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                placeholderTextColor={theme.subtext}
                multiline
                value={formData.address}
                onChangeText={v => updateFormData('address', v)}
              />
            </View>

            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setActiveTab('bank')}
              >
                <Text style={styles.nextButtonText}>Financial Details</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {activeTab === 'bank' && (
          <Animated.View entering={SlideInRight.duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Financial & Bank Details</Text>
              <Text style={styles.sectionSubtitle}>Salary payout account specifications</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>BANK NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={theme.subtext}
                  value={formData.bankName}
                  onChangeText={v => updateFormData('bankName', v)}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>ACCOUNT NUMBER</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={theme.subtext}
                  value={formData.accountNumber}
                  onChangeText={v => updateFormData('accountNumber', v)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>ACCOUNT HOLDER NAME</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={theme.subtext}
                value={formData.accountHolderName}
                onChangeText={v => updateFormData('accountHolderName', v)}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>ACCOUNT TYPE</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() =>
                    handleOpenSelection('Account Type', 'accountType', [
                      'Saving',
                      'Current',
                      'Salary',
                    ])
                  }
                >
                  <Text style={styles.inputValue}>{formData.accountType || 'Saving'}</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.subtext} />
                </TouchableOpacity>
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>IFSC / ROUTING CODE</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={theme.subtext}
                  value={formData.ifscCode}
                  onChangeText={v => updateFormData('ifscCode', v)}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PAYMENT METHOD</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() =>
                  handleOpenSelection('Payment Method', 'paymentMethod', [
                    'Bank Transfer',
                    'Check',
                    'Cash',
                  ])
                }
              >
                <Text style={styles.inputValue}>{formData.paymentMethod || 'Bank Transfer'}</Text>
                <Ionicons name="chevron-down" size={16} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={styles.prevButton}
                onPress={() => setActiveTab('personal')}
              >
                <Text style={styles.prevButtonText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setActiveTab('face')}
              >
                <Text style={styles.nextButtonText}>Biometrics</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {activeTab === 'face' && (
          <Animated.View entering={SlideInRight.duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Biometric Records</Text>
              <Text style={styles.sectionSubtitle}>Campus attendance & door access face profile</Text>
            </View>

            <View style={styles.biometricCard}>
              <View style={styles.biometricIconBox}>
                <MaterialCommunityIcons name="face-recognition" size={50} color={theme.primary} />
              </View>
              <Text style={styles.biometricStatus}>
                {photo ? 'Biometric Profile Enrolled' : 'No Face Data Found'}
              </Text>
              <Text style={styles.biometricDesc}>
                {photo
                  ? 'Facial features are synced to hardware smart terminals for auto clock-in.'
                  : 'Capture facial data to enable attendance tracking via smart cameras.'}
              </Text>
              <TouchableOpacity style={styles.updateFaceBtn} onPress={handleLaunchCamera}>
                <Ionicons name="camera-outline" size={18} color="#FFF" />
                <Text style={styles.updateFaceText}>
                  {photo ? 'Retake Face Photo' : 'Capture Face Photo'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={styles.prevButton}
                onPress={() => setActiveTab('bank')}
              >
                <Text style={styles.prevButtonText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Save All Changes</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {showDatePicker && DateTimePicker && (
        <DateTimePicker
          value={
            formData[dateField] ? new Date(formData[dateField]) : new Date()
          }
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
        onClose={() => setSelectionConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerRight: { width: 40 },

    tabBar: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      marginHorizontal: 5,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    activeTabItem: { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' },
    tabLabel: { fontSize: 11, fontWeight: '600', color: theme.subtext },
    activeTabLabel: { color: theme.primary },

    formContainer: { flex: 1, padding: 20 },
    sectionHeader: { marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: theme.text },
    sectionSubtitle: { fontSize: 14, color: theme.subtext, marginTop: 4 },

    row: { flexDirection: 'row', gap: 15 },
    field: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '700', color: theme.subtext, marginBottom: 8, marginLeft: 4 },
    input: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      height: 48,
      paddingHorizontal: 14,
      fontSize: 14,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    inputValue: { fontSize: 14, color: theme.text, fontWeight: '500' },

    phoneInputRow: { flexDirection: 'row', gap: 10 },
    countryPicker: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      height: 48,
      width: 75,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    countryCodeText: { fontSize: 14, fontWeight: '700', color: theme.text },
    phoneInput: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 12,
      height: 48,
      paddingHorizontal: 14,
      fontSize: 14,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },

    nextButton: {
      backgroundColor: '#6366F1',
      borderRadius: 12,
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      gap: 8,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    nextButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

    footerButtons: { flexDirection: 'row', gap: 15, marginTop: 30, alignItems: 'center' },
    prevButton: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 12,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    prevButtonText: { color: theme.subtext, fontSize: 14, fontWeight: '600' },
    submitButton: {
      flex: 2,
      backgroundColor: '#6366F1',
      borderRadius: 12,
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    submitButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

    biometricCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 30,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 20,
    },
    biometricIconBox: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    biometricStatus: { fontSize: 18, fontWeight: '700', color: '#10B981', marginBottom: 10 },
    biometricDesc: { fontSize: 14, color: theme.subtext, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    updateFaceBtn: {
      backgroundColor: '#6366F1',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    updateFaceText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 15, height: 45, marginBottom: 15 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: theme.text },
    optionItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    optionText: { fontSize: 15, color: theme.text, fontWeight: '500' },
  });

export default PrincipalEditStaffScreen;
