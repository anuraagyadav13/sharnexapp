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
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { COUNTRIES } from '../../constants/countries';
import SelectionModal from '../../components/modals/SelectionModal';

let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker not available');
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const initialFormState = {
  firstName: '', lastName: '', dob: '', gender: '',
  email: '', phone: '', address: '', city: '', state: '', postalCode: '',
  guardianName: '', guardianPhone: '', guardianEmail: '', guardianRelation: '',
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactEmail: '', emergencyContactRelation: '',
  classId: '', admissionNumber: '', admissionDate: new Date().toISOString().split('T')[0], previousSchool: '',
  password: '', sendWelcomeEmail: true,
  countryCode: '+91', guardianCountryCode: '+91', emergencyCountryCode: '+91'
};

const FormField = ({ label, value, onChangeText, placeholder, keyboardType, required, onPress, countryCode, onCountryCodePress, secureTextEntry }: any) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label.toUpperCase()} {required && <Text style={{ color: '#EF4444' }}>*</Text>}</Text>
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {countryCode && (
        <TouchableOpacity 
          style={styles.countryCodePicker}
          onPress={onCountryCodePress}
        >
          <Text style={styles.countryCodeText}>{countryCode}</Text>
          <Ionicons name="caret-down" size={10} color="#94A3B8" />
        </TouchableOpacity>
      )}
      {onPress ? (
        <TouchableOpacity 
          style={[styles.premiumInput, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
          onPress={onPress}
        >
          <Text style={[styles.premiumInputText, !value && { color: '#94A3B8' }]}>
            {value || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#94A3B8" />
        </TouchableOpacity>
      ) : (
        <TextInput
          style={[styles.premiumInput, { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
        />
      )}
    </View>
  </View>
);

const PrincipalAddStudentScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
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
    options: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.PRINCIPAL.CLASSES);
        const data = response.data?.data || response.data || [];
        setClasses(data);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      }
    };
    fetchClasses();
  }, []);

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClearForm = () => {
    Alert.alert('Clear Form', 'Are you sure you want to clear all fields?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setFormData({ ...initialFormState }) }
    ]);
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
      updateForm(dateField, formatted);
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
    if (selectionConfig.field.includes('countryCode') || selectionConfig.field.includes('CountryCode')) {
      const code = option.split(' ').pop() || option;
      updateForm(selectionConfig.field, code);
    } else if (selectionConfig.field === 'classId') {
      const selectedClass = classes.find(c => c.name === option || c.className === option);
      updateForm('classId', selectedClass ? (selectedClass.id || selectedClass.name || selectedClass.className) : option);
    } else {
      updateForm(selectionConfig.field, option);
    }
    setSelectionConfig(prev => ({ ...prev, visible: false }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.classId) {
      Alert.alert('Required Fields', 'Please complete all required fields (*).');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone ? `${formData.countryCode} ${formData.phone}`.trim() : '',
        dateOfBirth: formData.dob,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        classId: formData.classId,
        admissionNumber: formData.admissionNumber,
        parentGuardianName: formData.guardianName,
        parentPhoneNumber: formData.guardianPhone ? `${formData.guardianCountryCode} ${formData.guardianPhone}`.trim() : '',
        parentEmail: formData.guardianEmail,
        parentRelationship: formData.guardianRelation,
        emergencyName: formData.emergencyContactName,
        emergencyPhone: formData.emergencyContactPhone ? `${formData.emergencyCountryCode} ${formData.emergencyContactPhone}`.trim() : '',
        emergencyEmail: formData.emergencyContactEmail,
        emergencyRelationship: formData.emergencyContactRelation,
        password: formData.password,
        sendInvite: formData.sendWelcomeEmail
      };

      await apiClient.post('/students', payload);
      Alert.alert('Success', 'Student registration completed successfully.', [
        { text: 'Done', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const { getApiErrorMessage } = require('../../services/apiClient');
      Alert.alert('Registration Failed', getApiErrorMessage(error) || 'Failed to register the student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Header */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Student Registration</Text>
        <View style={styles.headerRight}>
           <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}>
            <View style={styles.avatarHeader}>
              <Text style={styles.avatarTextHeader}>{authState.user?.name?.charAt(0) || 'A'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.pageHeader}>
            <Text style={styles.screenTitle}>Add Student</Text>
            <Text style={styles.screenSubtitle}>Register new students to the school system.</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            <View style={styles.inputRow}>
              <FormField required label="First Name" value={formData.firstName} onChangeText={(v: any) => updateForm('firstName', v)} placeholder="Enter First Name" />
              <FormField required label="Last Name" value={formData.lastName} onChangeText={(v: any) => updateForm('lastName', v)} placeholder="Enter last Name" />
            </View>
            <View style={styles.inputRow}>
              <FormField label="Date of Birth" value={formData.dob} onPress={() => handleOpenDatePicker('dob')} placeholder="mm/dd/yyyy" />
              <FormField label="Gender" value={formData.gender} onPress={() => handleOpenSelection('Gender', 'gender', ['Male', 'Female', 'Other'])} placeholder="Select Gender" />
            </View>
            
            {/* Photo Upload */}
            <View style={styles.field}>
              <Text style={styles.label}>PHOTO</Text>
              <TouchableOpacity style={styles.photoUploadBox}>
                <Ionicons name="cloud-upload-outline" size={32} color="#94A3B8" />
                <Text style={styles.photoUploadText}>Drag and drop a photo here, or click to browse</Text>
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
            <FormField required label="Email Address" value={formData.email} onChangeText={(v: any) => updateForm('email', v)} placeholder="student@example.com" keyboardType="email-address" />
            <FormField 
               label="Phone Number" 
               value={formData.phone} 
               onChangeText={(v: any) => updateForm('phone', v)} 
               placeholder="Enter phone number" 
               keyboardType="phone-pad"
               countryCode={formData.countryCode}
               onCountryCodePress={() => handleOpenSelection('Country Code', 'countryCode', COUNTRIES.map(c => `${c.name} ${c.code}`))}
            />
            <FormField label="Address" value={formData.address} onChangeText={(v: any) => updateForm('address', v)} placeholder="Enter street Address" />
            <View style={styles.inputRow}>
              <FormField label="City" value={formData.city} onChangeText={(v: any) => updateForm('city', v)} placeholder="Enter City" />
              <FormField label="State" value={formData.state} onChangeText={(v: any) => updateForm('state', v)} placeholder="Enter State" />
            </View>
            <FormField label="Postal Code" value={formData.postalCode} onChangeText={(v: any) => updateForm('postalCode', v)} placeholder="Enter Postal code" />
          </View>

          {/* Parent/Guardian Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Parent/Guardian Information</Text>
            </View>
            <FormField label="Parent/Guardian Name" value={formData.guardianName} onChangeText={(v: any) => updateForm('guardianName', v)} placeholder="Enter Parent/Guardian name" />
            <FormField 
              label="Parent Phone Number" 
              value={formData.guardianPhone} 
              onChangeText={(v: any) => updateForm('guardianPhone', v)} 
              placeholder="Enter parent phone number" 
              keyboardType="phone-pad" 
              countryCode={formData.guardianCountryCode}
              onCountryCodePress={() => handleOpenSelection('Guardian Country Code', 'guardianCountryCode', COUNTRIES.map(c => `${c.name} ${c.code}`))}
            />
            <FormField label="Parent Email" value={formData.guardianEmail} onChangeText={(v: any) => updateForm('guardianEmail', v)} placeholder="Enter parent email" keyboardType="email-address" />
            <FormField label="Relationship" value={formData.guardianRelation} onPress={() => handleOpenSelection('Relationship', 'guardianRelation', ['Father', 'Mother', 'Guardian', 'Other'])} placeholder="Select Relationship" />
          </View>

          {/* Emergency Contact */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Emergency Contact</Text>
            </View>
            <FormField label="Contact Name" value={formData.emergencyContactName} onChangeText={(v: any) => updateForm('emergencyContactName', v)} placeholder="Emergency contact name" />
            <FormField 
              label="Contact Phone" 
              value={formData.emergencyContactPhone} 
              onChangeText={(v: any) => updateForm('emergencyContactPhone', v)} 
              placeholder="Emergency phone number" 
              keyboardType="phone-pad" 
              countryCode={formData.emergencyCountryCode}
              onCountryCodePress={() => handleOpenSelection('Emergency Country Code', 'emergencyCountryCode', COUNTRIES.map(c => `${c.name} ${c.code}`))}
            />
            <FormField label="Contact Email" value={formData.emergencyContactEmail} onChangeText={(v: any) => updateForm('emergencyContactEmail', v)} placeholder="Emergency email" keyboardType="email-address" />
            <FormField label="Relationship" value={formData.emergencyContactRelation} onPress={() => handleOpenSelection('Emergency Relationship', 'emergencyContactRelation', ['Father', 'Mother', 'Uncle', 'Aunt', 'Other'])} placeholder="Select Relationship" />
          </View>

          {/* Academic Information */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Academic Information</Text>
            </View>
            <FormField 
              required 
              label="Class" 
              value={classes.find(c => (c.id === formData.classId || c.name === formData.classId || c.className === formData.classId))?.name || classes.find(c => (c.id === formData.classId || c.className === formData.classId))?.className || formData.classId} 
              onPress={() => handleOpenSelection('Select Class', 'classId', classes.map(c => c.name || c.className))} 
              placeholder="Select Class" 
            />
            <FormField label="Admission Number" value={formData.admissionNumber} onChangeText={(v: any) => updateForm('admissionNumber', v)} placeholder="Give Admission number" />
            <FormField label="Admission Date" value={formData.admissionDate} onPress={() => handleOpenDatePicker('admissionDate')} placeholder="mm/dd/yyyy" />
            <FormField label="Previous School" value={formData.previousSchool} onChangeText={(v: any) => updateForm('previousSchool', v)} placeholder="Name of previous school" />
          </View>

          {/* Account & Invite */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Account & Invite</Text>
            </View>
            <FormField label="Password (optional)" value={formData.password} onChangeText={(v: any) => updateForm('password', v)} placeholder="••••••••••••" secureTextEntry={true} />
            <Text style={styles.helperText}>If left blank, a secure temporary password will be generated.</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Send welcome email to student</Text>
              <Switch 
                value={formData.sendWelcomeEmail}
                onValueChange={(v) => updateForm('sendWelcomeEmail', v)}
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
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primarySubmitBtn, isSubmitting && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primarySubmitText}>Register Student</Text>}
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
        onClose={() => setSelectionConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },

  // Header
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 16,
    backgroundColor: '#FAFAFF',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatarHeader: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 4 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 12, color: '#6B7280', fontWeight: '400', lineHeight: 18 },

  // Form Sections
  formSection: { paddingHorizontal: 20, marginTop: 8, marginBottom: 20 },
  sectionHeader: { marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  
  field: { flex: 1, marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  premiumInput: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, color: '#1F2937', fontWeight: '500', borderWidth: 1, borderColor: '#E2E8F0' },
  premiumInputText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  countryCodePicker: { width: 70, height: 46, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  countryCodeText: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  inputRow: { flexDirection: 'row', gap: 12 },

  // Photo Upload
  photoUploadBox: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', justifyContent: 'center' },
  photoUploadText: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 10, marginBottom: 14, fontWeight: '500' },
  browseButton: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  browseButtonText: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },

  // Helper & Switches
  helperText: { fontSize: 11, color: '#94A3B8', marginTop: -6, marginBottom: 16, fontWeight: '500' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  switchLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937' },

  // Footer Actions
  footerActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  clearBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  clearBtnText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  cancelBtnText: { color: '#1F2937', fontWeight: '700', fontSize: 13 },
  primarySubmitBtn: { flex: 1.5, backgroundColor: '#3B82F6', height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  primarySubmitText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

});

export default PrincipalAddStudentScreen;
