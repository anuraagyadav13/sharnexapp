import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
  Image,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { 
  FadeInRight, 
  SlideInRight,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import { launchCamera, ImagePickerResponse } from 'react-native-image-picker';

let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker not available');
}

import { useAuth } from '../../store/AuthContext';
import apiClient, { getApiErrorMessage } from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Toast, { ToastType } from '../../components/Toast';
import SelectionModal from '../../components/modals/SelectionModal';
import { COUNTRIES } from '../../constants/countries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { id: 'personal', label: 'Personal', icon: 'account-outline' },
  { id: 'bank', label: 'Financial', icon: 'bank-outline' },
  { id: 'face', label: 'Biometric', icon: 'face-recognition' },
];

const PrincipalAddStaffScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  // Form state
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', countryCode: '+91', dob: '', address: '',
    bankName: '', accountNumber: '', accountHolderName: '', accountType: 'Saving', ifscCode: '', paymentMethod: 'Bank Transfer',
    department: '', qualification: '', subject: '', joiningDate: '', experience: '', biography: '',
  });
  const [photo, setPhoto] = useState<string | null>(null);
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
          showToast('Camera permission denied', 'error');
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
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        showToast('Camera error: ' + response.errorMessage, 'error');
      } else if (response.assets && response.assets.length > 0) {
        setPhoto(response.assets[0].uri || null);
        showToast('Biometric photo captured!', 'success');
      }
    });
  };

  const handleOpenDatePicker = (field: 'dob' | 'joiningDate') => {
    console.log('Opening date picker for:', field);
    setDateField(field);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    // Android dismisses on first interaction, so we close it immediately
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    // If user clicked 'Set' or picked a date on iOS
    if (event.type === 'set' && selectedDate) {
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const yyyy = selectedDate.getFullYear();
      const formatted = `${mm}/${dd}/${yyyy}`;
      updateFormData(dateField, formatted);
    }
    
    // Close on iOS only after interaction is done (IOS has an 'always-on' style spinner sometimes)
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

  const handleSubmitStaff = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      showToast('Please provide at least the basic identity details.', 'warning');
      setActiveTab('personal');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: `${formData.countryCode} ${formData.phone}`.trim(),
        // Note: Professional details (subject, qualification, experience) are currently omitted 
        // as the backend 'teachers' table is not available in the database.
        biometricPhoto: photo || null 
      };

      await apiClient.post(ENDPOINTS.PRINCIPAL.ADD_STAFF, payload);
      showToast(`${formData.firstName} registered successfully!`, 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err);
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const indicatorStyle = useAnimatedStyle(() => {
    const activeIndex = TABS.findIndex(t => t.id === activeTab);
    return {
      transform: [{ translateX: withSpring(activeIndex * (SCREEN_WIDTH / TABS.length)) }]
    };
  });

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
        />
      )}

      {/* Standard Header */}
      <View style={styles.globalHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Add New Staff</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity 
              key={tab.id} 
              style={styles.tabItem} 
              onPress={() => setActiveTab(tab.id)}
            >
              <MaterialCommunityIcons 
                name={tab.icon as any} 
                size={22} 
                color={activeTab === tab.id ? '#4F46E5' : '#94A3B8'} 
              />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
          <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
        </View>

        <View style={styles.contentArea}>
          {activeTab === 'personal' && (
            <Animated.View entering={FadeInRight}>
               <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={[styles.sectionIcon, { backgroundColor: '#EEF2FF' }]}>
                      <MaterialCommunityIcons name="account-outline" size={20} color="#6366F1" />
                    </View>
                    <Text style={styles.sectionTitle}>Identity & Contact</Text>
                  </View>
               </View>

               <View style={styles.inputRow}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>FIRST NAME</Text>
                    <TextInput 
                      style={styles.premiumInput} 
                      placeholder="John" 
                      value={formData.firstName}
                      onChangeText={v => updateFormData('firstName', v)}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>LAST NAME</Text>
                    <TextInput 
                      style={styles.premiumInput} 
                      placeholder="Doe" 
                      value={formData.lastName}
                      onChangeText={v => updateFormData('lastName', v)}
                    />
                  </View>
               </View>

               <View style={styles.field}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <TextInput 
                    style={styles.premiumInput} 
                    placeholder="john.doe@example.com" 
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
                      onPress={() => handleOpenSelection('Country Code', 'countryCode', COUNTRIES.map(c => `${c.name} ${c.code}`))}
                    >
                      <Text style={styles.countryCodeText}>{formData.countryCode}</Text>
                      <Ionicons name="chevron-down" size={14} color="#64748B" />
                    </TouchableOpacity>
                    <TextInput 
                      style={styles.phoneInput} 
                      placeholder="9876543210" 
                      value={formData.phone}
                      onChangeText={v => updateFormData('phone', v)}
                      keyboardType="numeric"
                    />
                  </View>
               </View>

               <View style={styles.field}>
                  <Text style={styles.label}>DATE OF BIRTH</Text>
                  <TouchableOpacity 
                    style={styles.premiumInput} 
                    onPress={() => handleOpenDatePicker('dob')}
                  >
                    <Text style={[styles.selectVal, !formData.dob && { color: '#94A3B8' }]}>
                      {formData.dob || 'mm/dd/yyyy'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                  </TouchableOpacity>
               </View>

               <View style={styles.field}>
                  <Text style={styles.label}>RESIDENTIAL ADDRESS</Text>
                  <TextInput 
                    style={[styles.premiumInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]} 
                    placeholder="Enter complete address..." 
                    multiline
                    value={formData.address}
                    onChangeText={v => updateFormData('address', v)}
                  />
               </View>

               <View style={styles.footerRow}>
                   <TouchableOpacity style={styles.primaryNextBtn} onPress={() => setActiveTab('bank')}>
                      <Text style={styles.primaryNextBtnText}>Financial Details</Text>
                   </TouchableOpacity>
                </View>
             </Animated.View>
          )}

          {activeTab === 'bank' && (
            <Animated.View entering={SlideInRight}>
               <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={[styles.sectionIcon, { backgroundColor: '#F0FDF4' }]}>
                      <MaterialCommunityIcons name="bank-outline" size={20} color="#10B981" />
                    </View>
                    <Text style={styles.sectionTitle}>Financial & Bank Details</Text>
                  </View>
               </View>

               <View style={styles.inputRow}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>BANK NAME</Text>
                    <TextInput 
                      style={styles.premiumInput} 
                      placeholder="e.g. HDFC Bank" 
                      value={formData.bankName}
                      onChangeText={v => updateFormData('bankName', v)}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>ACCOUNT NUMBER</Text>
                    <TextInput 
                      style={styles.premiumInput} 
                      placeholder="1234567890" 
                      value={formData.accountNumber}
                      onChangeText={v => updateFormData('accountNumber', v)}
                      keyboardType="numeric"
                    />
                  </View>
               </View>

               <View style={styles.field}>
                  <Text style={styles.label}>ACCOUNT HOLDER NAME</Text>
                  <TextInput 
                    style={styles.premiumInput} 
                    placeholder="As per bank records" 
                    value={formData.accountHolderName}
                    onChangeText={v => updateFormData('accountHolderName', v)}
                  />
               </View>

               <View style={styles.inputRow}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>ACCOUNT TYPE</Text>
                    <TouchableOpacity 
                      style={styles.selectInput}
                      onPress={() => handleOpenSelection('Account Type', 'accountType', ['Saving', 'Current', 'Salary'])}
                    >
                      <Text style={styles.selectVal}>{formData.accountType || 'Saving'}</Text>
                      <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>IFSC / ROUTING CODE</Text>
                    <TextInput 
                      style={styles.premiumInput} 
                      placeholder="e.g. HDFC0001267" 
                      value={formData.ifscCode}
                      onChangeText={v => updateFormData('ifscCode', v)}
                    />
                  </View>
               </View>
               
               <View style={styles.field}>
                  <Text style={styles.label}>SALARY PAYMENT METHOD</Text>
                  <TouchableOpacity 
                    style={styles.selectInput}
                    onPress={() => handleOpenSelection('Payment Method', 'paymentMethod', ['Bank Transfer', 'Check', 'Cash'])}
                  >
                    <Text style={styles.selectVal}>{formData.paymentMethod || 'Bank Transfer'}</Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                  </TouchableOpacity>
               </View>

               <View style={styles.footerRow}>
                  <TouchableOpacity style={styles.outlineBackBtn} onPress={() => setActiveTab('personal')}>
                     <Text style={styles.outlineBackText}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryNextBtn} onPress={() => setActiveTab('face')}>
                     <Text style={styles.primaryNextBtnText}>Biometric Sync</Text>
                  </TouchableOpacity>
               </View>
            </Animated.View>
          )}

          {activeTab === 'face' && (
            <Animated.View entering={SlideInRight}>
               <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={[styles.sectionIcon, { backgroundColor: '#EEF2FF' }]}>
                      <MaterialCommunityIcons name="face-recognition" size={20} color="#6366F1" />
                    </View>
                    <Text style={styles.sectionTitle}>Biometric Enrollment</Text>
                  </View>
               </View>

               <View style={styles.faceEnrollCard}>
                  <View style={styles.faceGraphic}>
                     {photo ? (
                        <Image source={{ uri: photo }} style={styles.capturedPhoto} />
                     ) : (
                        <MaterialCommunityIcons name="face-recognition" size={80} color="#6366F1" />
                     )}
                  </View>
                  <Text style={styles.enrollHint}>Facial data enables automated clock-in/out via campus smart terminals.</Text>
                  <TouchableOpacity style={styles.enrollBtn} onPress={handleLaunchCamera}>
                     <Ionicons name="camera-outline" size={22} color="#FFF" />
                     <Text style={styles.enrollBtnText}>{photo ? 'Retake Photo' : 'Launch Camera'}</Text>
                  </TouchableOpacity>
               </View>

               <View style={styles.legalNotice}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#94A3B8" />
                  <Text style={styles.legalText}>Biometric data is encrypted and stored locally in institutional servers for security compliance.</Text>
               </View>

               <View style={styles.footerRow}>
                  <TouchableOpacity style={styles.outlineBackBtn} onPress={() => setActiveTab('bank')}>
                     <Text style={styles.outlineBackText}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.primarySubmitBtn, isSubmitting && { opacity: 0.7 }]} 
                    onPress={handleSubmitStaff}
                    disabled={isSubmitting}
                  >
                     {isSubmitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                     ) : (
                        <>
                          <Text style={styles.primarySubmitBtnText}>Complete Enrollment</Text>
                          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                        </>
                     )}
                  </TouchableOpacity>
               </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>

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
        onClose={() => setSelectionConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#FAFAFF',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', flex: 1, textAlign: 'center' },
  headerRight: { width: 40 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 16, padding: 4, marginBottom: 20, position: 'relative' },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 5, zIndex: 1 },
  tabLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  activeTabLabel: { color: '#4F46E5' },
  tabIndicator: { position: 'absolute', height: '100%', width: SCREEN_WIDTH / 3 - 16, backgroundColor: '#EEF2FF', borderRadius: 12, top: 4, left: 4 },

  contentArea: { paddingHorizontal: 20 },
  sectionHeader: { marginBottom: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  sectionDesc: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },

  inputRow: { flexDirection: 'row', gap: 10 },
  field: { marginBottom: 15 },
  label: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 6, marginLeft: 4 },
  premiumInput: { backgroundColor: '#FFF', borderRadius: 12, height: 46, paddingHorizontal: 14, fontSize: 14, color: '#1E293B', fontWeight: '600', borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectVal: { fontSize: 13, color: '#1E293B', fontWeight: '600' },
  
  phoneInputRow: { flexDirection: 'row', gap: 10 },
  countryPicker: { backgroundColor: '#FFF', borderRadius: 12, height: 46, width: 75, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  countryCodeText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  phoneInput: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, height: 46, paddingHorizontal: 14, fontSize: 14, color: '#1E293B', fontWeight: '600', borderWidth: 1, borderColor: '#F1F5F9' },
  
  selectInput: { backgroundColor: '#FFF', borderRadius: 12, height: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#F1F5F9' },

  footerRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  primaryNextBtn: { flex: 1, backgroundColor: '#4F46E5', borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  primaryNextBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  outlineBackBtn: { width: 90, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  outlineBackText: { color: '#64748B', fontSize: 13, fontWeight: '700' },

  faceEnrollCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
  faceGraphic: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#FAFBFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#6366F1', overflow: 'hidden' },
  capturedPhoto: { width: '100%', height: '100%' },
  enrollHint: { textAlign: 'center', fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 20, paddingHorizontal: 10, fontWeight: '500' },
  enrollBtn: { backgroundColor: '#6366F1', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  enrollBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  
  legalNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 20 },
  legalText: { flex: 1, fontSize: 11, color: '#94A3B8', fontWeight: '500', lineHeight: 16 },

  primarySubmitBtn: { flex: 1, backgroundColor: '#4F46E5', borderRadius: 12, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  primarySubmitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});

export default PrincipalAddStaffScreen;
