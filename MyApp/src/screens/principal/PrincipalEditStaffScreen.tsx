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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown, SlideInRight } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { COUNTRIES } from '../../constants/countries';

import SelectionModal from '../../components/modals/SelectionModal';

type Props = NativeStackScreenProps<RootStackParamList, 'PrincipalEditStaff'>;

const TABS = [
  { id: 'personal', label: 'Personal', icon: 'account-outline' },
  { id: 'bank', label: 'Financial', icon: 'bank-outline' },
  { id: 'face', label: 'Biometric', icon: 'face-recognition' },
];

import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker not available');
}

const PrincipalEditStaffScreen: React.FC<Props> = ({ navigation, route }) => {
  const { staffId, initialData } = route.params;
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state pre-filled with initialData
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
    accountType: initialData?.accountType || 'Saving',
    ifscCode: initialData?.ifscCode || '',
    paymentMethod: initialData?.paymentMethod || 'Bank Transfer',
  });
  const [photo, setPhoto] = useState<string | null>(initialData?.biometricPhoto || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState<'dob' | 'joiningDate'>('dob');

  // Selection states
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
  const [searchQuery, setSearchQuery] = useState('');

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenDatePicker = (field: 'dob' | 'joiningDate') => {
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
            message: 'App needs camera access to update biometric photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera access is required to capture photos.');
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
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert('Camera Error', response.errorMessage || 'Failed to open camera');
      } else if (response.assets && response.assets.length > 0) {
        setPhoto(response.assets[0].uri || null);
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
      updateFormData(dateField as any, formatted);
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
    if (selectionConfig.field === 'countryCode') {
      const code = option.split(' ').pop() || option;
      updateFormData(selectionConfig.field, code);
    } else {
      updateFormData(selectionConfig.field, option);
    }
    setSelectionConfig(prev => ({ ...prev, visible: false }));
  };

  const handleUpdateStaff = async () => {
    try {
      setIsSubmitting(true);
      const staffData = {
        personalInfo: { 
          firstName: formData.firstName, 
          lastName: formData.lastName, 
          email: formData.email, 
          phone: `${formData.countryCode} ${formData.phone}`.trim(), 
          dateOfBirth: formData.dob, 
          address: formData.address 
        },
        bankDetails: { 
          bankName: formData.bankName, 
          accountNumber: formData.accountNumber, 
          accountHolderName: formData.accountHolderName, 
          accountType: formData.accountType, 
          ifscCode: formData.ifscCode, 
          paymentMethod: formData.paymentMethod 
        },
        biometricPhoto: photo,
        // Professional info removed as per user request (table 'teachers' missing)
      };

      await apiClient.put(`${ENDPOINTS.PRINCIPAL.STAFF}/${staffId}`, staffData);
      Alert.alert('Update Successful', `${formData.firstName}'s profile has been updated.`, [
        { text: 'Okay', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err);
      Alert.alert('Update Failed', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOptions = selectionConfig.options.filter(opt => 
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <ScaleButton onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </ScaleButton>
        <Text style={styles.headerTitle}>Edit Faculty Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity 
            key={tab.id} 
            style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialCommunityIcons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === tab.id ? '#6366F1' : '#94A3B8'} 
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {activeTab === 'personal' && (
            <Animated.View entering={SlideInRight}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Identity & Contact</Text>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>FIRST NAME</Text>
                  <TextInput 
                    style={styles.input}
                    value={formData.firstName}
                    onChangeText={(v) => updateFormData('firstName', v)}
                    placeholder="First Name"
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>LAST NAME</Text>
                  <TextInput 
                    style={styles.input}
                    value={formData.lastName}
                    onChangeText={(v) => updateFormData('lastName', v)}
                    placeholder="Last Name"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput 
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(v) => updateFormData('email', v)}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <View style={styles.phoneInputRow}>
                  <TouchableOpacity 
                    style={styles.countryPicker}
                    onPress={() => handleOpenSelection('Country Code', 'countryCode', COUNTRIES.map(c => `${c.name} ${c.code}`))}
                  >
                    <Text style={styles.countryCodeText}>{formData.countryCode}</Text>
                    <Ionicons name="chevron-down" size={14} color="#64748B" />
                  </TouchableOpacity>
                  <TextInput 
                    style={styles.phoneInput}
                    value={formData.phone}
                    onChangeText={(v) => updateFormData('phone', v)}
                    placeholder="Phone Number"
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
                  <Text style={[styles.inputValue, !formData.dob && { color: '#94A3B8' }]}>
                    {formData.dob || 'MM/DD/YYYY'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6366F1" />
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>RESIDENTIAL ADDRESS</Text>
                <TextInput 
                  style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                  value={formData.address}
                  onChangeText={(v) => updateFormData('address', v)}
                  placeholder="Full Address"
                  multiline
                />
              </View>

              <TouchableOpacity 
                style={styles.nextButton}
                onPress={() => setActiveTab('bank')}
              >
                <Text style={styles.nextButtonText}>Financial Details</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {activeTab === 'bank' && (
            <Animated.View entering={SlideInRight}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bank Account Details</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>BANK NAME</Text>
                <TextInput 
                  style={styles.input}
                  value={formData.bankName}
                  onChangeText={(v) => updateFormData('bankName', v)}
                  placeholder="Bank Name"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>ACCOUNT NUMBER</Text>
                <TextInput 
                  style={styles.input}
                  value={formData.accountNumber}
                  onChangeText={(v) => updateFormData('accountNumber', v)}
                  placeholder="Account Number"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>ACCOUNT HOLDER NAME</Text>
                <TextInput 
                  style={styles.input}
                  value={formData.accountHolderName}
                  onChangeText={(v) => updateFormData('accountHolderName', v)}
                  placeholder="Account Holder Name"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>ACCOUNT TYPE</Text>
                  <TouchableOpacity 
                    style={styles.input}
                    onPress={() => handleOpenSelection('Account Type', 'accountType', ['Saving', 'Current', 'Salary'])}
                  >
                    <Text style={styles.inputValue}>{formData.accountType}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6366F1" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>IFSC CODE</Text>
                  <TextInput 
                    style={styles.input}
                    value={formData.ifscCode}
                    onChangeText={(v) => updateFormData('ifscCode', v)}
                    placeholder="IFSC Code"
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>PAYMENT METHOD</Text>
                <TouchableOpacity 
                  style={styles.input}
                  onPress={() => handleOpenSelection('Payment Method', 'paymentMethod', ['Bank Transfer', 'Check', 'Cash'])}
                >
                  <Text style={styles.inputValue}>{formData.paymentMethod}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6366F1" />
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
            <Animated.View entering={SlideInRight}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Biometric Enrollment</Text>
                <Text style={styles.sectionSubtitle}>Enrollment status and face recognition updates</Text>
              </View>

              <View style={styles.biometricCard}>
                <View style={styles.biometricIconBox}>
                  <MaterialCommunityIcons name="face-recognition" size={60} color="#6366F1" />
                </View>
                <Text style={styles.biometricStatus}>Face Data Active</Text>
                <Text style={styles.biometricDesc}>
                  Facial recognition is active for automated attendance and campus access.
                </Text>
                <TouchableOpacity style={styles.updateFaceBtn} onPress={handleLaunchCamera}>
                  <Ionicons name="camera" size={20} color="#FFF" />
                  <Text style={styles.updateFaceText}>{photo ? 'Retake Photo' : 'Update Biometrics'}</Text>
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
                  onPress={handleUpdateStaff}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Update Profile</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && DateTimePicker && (
        <DateTimePicker
          value={(() => {
            if (formData[dateField as keyof typeof formData]) {
              const d = new Date(formData[dateField as keyof typeof formData]);
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
        onClose={() => setSelectionConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerRight: { width: 40 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
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
  activeTabItem: { backgroundColor: '#EEF2FF' },
  tabLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  activeTabLabel: { color: '#6366F1' },

  formContainer: { flex: 1, padding: 20 },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  sectionSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },

  row: { flexDirection: 'row', gap: 15 },
  field: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputValue: { fontSize: 14, color: '#1E293B', fontWeight: '500' },

  phoneInputRow: { flexDirection: 'row', gap: 10 },
  countryPicker: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    height: 48,
    width: 75,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countryCodeText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  phoneInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    marginTop: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  footerButtons: { flexDirection: 'row', gap: 15, marginTop: 10 },
  prevButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prevButtonText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
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
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  biometricIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  biometricStatus: { fontSize: 18, fontWeight: '700', color: '#10B981', marginBottom: 10 },
  biometricDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
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
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 15, height: 45, marginBottom: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1E293B' },
  optionItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
});

export default PrincipalEditStaffScreen;
