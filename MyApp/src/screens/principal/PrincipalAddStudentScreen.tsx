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
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { COUNTRIES } from '../../constants/countries';
import SelectionModal from '../../components/modals/SelectionModal';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker not available');
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PrincipalAddStudentScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', dob: '', gender: '',
    address: '', city: '', state: '', postalCode: '',
    guardianName: '', guardianPhone: '', guardianEmail: '', guardianRelation: '',
    classId: '', rollNo: '', admissionDate: new Date().toISOString().split('T')[0],
    countryCode: '+91', guardianCountryCode: '+91'
  });
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

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenDatePicker = (field: 'dob' | 'admissionDate') => {
    console.log('Opening student date picker for:', field);
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
    // If it's a country selection, extract the code
    if (selectionConfig.field.includes('countryCode') || selectionConfig.field.includes('CountryCode')) {
      const code = option.split(' ').pop() || option;
      updateForm(selectionConfig.field, code);
    } else {
      updateForm(selectionConfig.field, option);
    }
    setSelectionConfig(prev => ({ ...prev, visible: false }));
  };

  const filteredOptions = selectionConfig.options.filter(opt => 
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.classId) {
      Alert.alert('Required Fields', 'Please complete all fields marked with an asterisk (*).');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: `${formData.countryCode} ${formData.phone}`.trim(),
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        class: formData.classId,
        rollNo: formData.rollNo,
        guardianName: formData.guardianName,
        guardianPhone: `${formData.guardianCountryCode} ${formData.guardianPhone}`.trim(),
        guardianEmail: formData.guardianEmail,
        guardianRelation: formData.guardianRelation,
        admissionDate: formData.admissionDate
      };

      await apiClient.post(ENDPOINTS.PRINCIPAL.ADD_STUDENT, payload);
      Alert.alert('Success', 'Student registration completed successfully.', [
        { text: 'Done', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const errorMsg = getApiErrorMessage(error);
      Alert.alert('Registration Failed', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const FormField = ({ label, value, onChangeText, placeholder, keyboardType, required, onPress, countryCode, onCountryCodePress }: any) => (
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
            <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : (
          <TextInput
            style={[styles.premiumInput, { flex: 1 }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            keyboardType={keyboardType}
          />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Global Header - Student Pattern */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#4F46E5" />
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
            <Text style={styles.screenTitle}>Enroll New Scholar</Text>
            <Text style={styles.screenSubtitle}>Add a new student profile to the institutional database.</Text>
          </View>

          {/* Premium Hero Banner */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.heroBanner}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgLinearGradient id="regGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#6366F1" stopOpacity="1" />
                  <Stop offset="1" stopColor="#3B82F6" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#regGrad)" rx={32} ry={32} />
            </Svg>
            <View style={styles.heroContent}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="account-school-outline" size={36} color="#FFF" />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>Academic Profile</Text>
                <Text style={styles.heroSubtitle}>Ensure all identity documents are verified before final submission.</Text>
              </View>
            </View>
          </Animated.View>

          {/* Personal Identity Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Personal Identity</Text>
            </View>
            <View style={styles.inputRow}>
              <FormField required label="First Name" value={formData.firstName} onChangeText={(v: any) => updateForm('firstName', v)} placeholder="John" />
              <FormField required label="Last Name" value={formData.lastName} onChangeText={(v: any) => updateForm('lastName', v)} placeholder="Doe" />
            </View>
            <View style={styles.inputRow}>
              <FormField label="Date of Birth" value={formData.dob} onPress={() => handleOpenDatePicker('dob')} placeholder="YYYY-MM-DD" />
              <FormField label="Gender" value={formData.gender} onChangeText={(v: any) => updateForm('gender', v)} placeholder="Male/Female" />
            </View>
          </View>

          {/* Academic Placement Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Academic Placement</Text>
            </View>
            <View style={styles.inputRow}>
              <FormField required label="Assigned Class" value={formData.classId} onChangeText={(v: any) => updateForm('classId', v)} placeholder="e.g. 10A" />
              <FormField label="Roll Number" value={formData.rollNo} onChangeText={(v: any) => updateForm('rollNo', v)} placeholder="e.g. 24" />
            </View>
            <FormField label="Date of Admission" value={formData.admissionDate} onPress={() => handleOpenDatePicker('admissionDate')} placeholder="YYYY-MM-DD" />
          </View>

          {/* Guardian & Contact Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Guardian & Contact</Text>
            </View>
            <FormField required label="Primary Email" value={formData.email} onChangeText={(v: any) => updateForm('email', v)} placeholder="student@example.com" keyboardType="email-address" />
            <FormField 
               label="Contact Number" 
               value={formData.phone} 
               onChangeText={(v: any) => updateForm('phone', v)} 
               placeholder="9876543210" 
               keyboardType="phone-pad"
               countryCode={formData.countryCode}
               onCountryCodePress={() => handleOpenSelection('Country Code', 'countryCode', COUNTRIES.map(c => `${c.name} ${c.code}`))}
            />
            <FormField label="Guardian Name" value={formData.guardianName} onChangeText={(v: any) => updateForm('guardianName', v)} placeholder="Full legal name" />
            <View style={styles.inputRow}>
              <FormField label="Relation" value={formData.guardianRelation} onChangeText={(v: any) => updateForm('guardianRelation', v)} placeholder="e.g. Mother" />
              <FormField 
                label="Guardian Phone" 
                value={formData.guardianPhone} 
                onChangeText={(v: any) => updateForm('guardianPhone', v)} 
                placeholder="9876..." 
                keyboardType="phone-pad" 
                countryCode={formData.guardianCountryCode}
                onCountryCodePress={() => handleOpenSelection('Guardian Country Code', 'guardianCountryCode', COUNTRIES.map(c => `${c.name} ${c.code}`))}
              />
            </View>
          </View>

          {/* Form Actions */}
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primarySubmitBtn, isSubmitting && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primarySubmitText}>Register Scholar</Text>}
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

  // Header - Student Pattern
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 24,
    backgroundColor: '#FAFAFF',
  },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatarHeader: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  // Hero
  heroBanner: { height: 140, borderRadius: 32, marginHorizontal: 20, padding: 20, justifyContent: 'center', overflow: 'hidden' },
  heroContent: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 65, height: 65, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, marginLeft: 15 },
  heroTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 4, lineHeight: 16, fontWeight: '500' },

  // Form Sections
  formSection: { paddingHorizontal: 20, marginTop: 32 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  
  field: { flex: 1, marginBottom: 15 },
  label: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 6 },
  premiumInput: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 14, height: 44, fontSize: 14, color: '#1E293B', fontWeight: '600', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1, justifyContent: 'center' },
  premiumInputText: { fontSize: 13, color: '#1E293B', fontWeight: '600' },
  countryCodePicker: { width: 60, height: 44, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  countryCodeText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  inputRow: { flexDirection: 'row', gap: 15 },

  // Footer
  footerActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginTop: 40 },
  secondaryBtn: { flex: 0.4, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  secondaryBtnText: { color: '#64748B', fontWeight: '700', fontSize: 14 },
  primarySubmitBtn: { flex: 1, backgroundColor: '#4F46E5', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  primarySubmitText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  selectionCard: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '60%' },
  selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  selectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  selectionItem: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC' },
  selectionItemActive: { backgroundColor: '#4F46E5' },
  selectionItemText: { fontSize: 15, fontWeight: '600', color: '#4F46E5' },
  selectionItemTextActive: { color: '#FFF' },

  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, height: 48, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  searchBar: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1E293B', fontWeight: '600' },
});

export default PrincipalAddStudentScreen;
