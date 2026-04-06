import React, { useState } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { useAuth } from '../../store/AuthContext';

const PrincipalAddStaffScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState('personal'); // personal, bank, professional, face
  
  // Calendars
  const [showDOBCalendar, setShowDOBCalendar] = useState(false);
  const [dob, setDob] = useState('');
  const [showJoiningCalendar, setShowJoiningCalendar] = useState(false);
  const [joiningDate, setJoiningDate] = useState('');

  const renderCalendar = (onSelect: (date: string) => void, close: () => void) => (
    <Animated.View entering={FadeInUp.duration(200)} style={styles.calendarDropdown}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity><Ionicons name="chevron-back" size={16} color="#111827" /></TouchableOpacity>
        <Text style={styles.calendarMonthText}>June 2026</Text>
        <TouchableOpacity><Ionicons name="chevron-forward" size={16} color="#111827" /></TouchableOpacity>
      </View>
      <View style={styles.calendarDaysRow}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <Text key={d} style={styles.calendarDayLabel}>{d}</Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {Array.from({ length: 30 }).map((_, i) => {
          const day = i + 1;
          const dateStr = `06/${day.toString().padStart(2, '0')}/2026`;
          return (
            <TouchableOpacity 
              key={day} 
              style={styles.calendarDayCell}
              onPress={() => {
                onSelect(dateStr);
                close();
              }}
            >
              <Text style={styles.calendarDayText}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent={false} />
      
      {/* Top Standard Header */}
      <View style={styles.topHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => navigation.openDrawer && navigation.openDrawer()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={26} color="#4B5563" />
        </ScaleButton>

        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          Welcome back, {authState.user?.name?.split(' ')[0] || 'Admin'}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnTransparent}><Ionicons name="notifications-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent} onPress={() => navigation.navigate('AccountSettings')}><Ionicons name="settings-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent}><Ionicons name="moon-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}><View style={styles.avatar}><Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'A'}</Text></View></TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Purple Header Block */}
        <View style={styles.purpleHeaderBlock}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={{ marginTop: 24 }}>
            <Text style={styles.headerTitle}>Add New Staff Member</Text>
            <Text style={styles.headerSubtitle}>Register a new teacher or administrative staff</Text>
          </View>
        </View>

        {/* Horizontal Scrollable Tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'personal' && styles.tabBtnActive]}
              onPress={() => setActiveTab('personal')}
            >
              <Ionicons name="person" size={14} color={activeTab === 'personal' ? '#FFF' : '#6B7280'} />
              <Text style={[styles.tabBtnText, activeTab === 'personal' && styles.tabBtnTextActive]}>Personal Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'bank' && styles.tabBtnActive, { marginLeft: 10 }]}
              onPress={() => setActiveTab('bank')}
            >
              <Ionicons name="cash-outline" size={14} color={activeTab === 'bank' ? '#FFF' : '#6B7280'} />
              <Text style={[styles.tabBtnText, activeTab === 'bank' && styles.tabBtnTextActive]}>Bank Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'professional' && styles.tabBtnActive, { marginLeft: 10 }]}
              onPress={() => setActiveTab('professional')}
            >
              <Ionicons name="briefcase" size={14} color={activeTab === 'professional' ? '#FFF' : '#6B7280'} />
              <Text style={[styles.tabBtnText, activeTab === 'professional' && styles.tabBtnTextActive]}>Professional Info</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'face' && styles.tabBtnActive, { marginLeft: 10 }]}
              onPress={() => setActiveTab('face')}
            >
              <Ionicons name="camera" size={14} color={activeTab === 'face' ? '#FFF' : '#6B7280'} />
              <Text style={[styles.tabBtnText, activeTab === 'face' && styles.tabBtnTextActive]}>Face Enrollment</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Form Content Area */}
        <ScrollView style={styles.formScrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.formContainer}>
            
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <Animated.View entering={FadeInUp.duration(200)}>
                <View style={styles.formSectionHeader}>
                  <View style={[styles.formSectionIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="person" size={18} color="#3B82F6" />
                  </View>
                  <Text style={styles.formSectionTitle}>Personal Details</Text>
                </View>

                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <TextInput style={styles.textInput} placeholder="e.g. John" placeholderTextColor="#9CA3AF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Last Name</Text>
                    <TextInput style={styles.textInput} placeholder="e.g. Doe" placeholderTextColor="#9CA3AF" />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput style={styles.textInput} placeholder="john.doe@example.com" placeholderTextColor="#9CA3AF" />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput style={styles.textInput} placeholder="+1 (555) 000-0000" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
                </View>

                <View style={[styles.formField, { position: 'relative', zIndex: 10 }]}>
                  <Text style={styles.inputLabel}>Date of Birth</Text>
                  <TouchableOpacity style={styles.dateInput} activeOpacity={0.7} onPress={() => setShowDOBCalendar(!showDOBCalendar)}>
                    <Text style={[styles.dateText, !dob && {color: '#9CA3AF'}]}>{dob || 'mm/dd/yyyy'}</Text>
                    <Ionicons name="calendar-outline" size={18} color="#4B5563" />
                  </TouchableOpacity>
                  {showDOBCalendar && (
                    <View style={{ position: 'absolute', top: 75, left: 0, right: 0, zIndex: 99 }}>
                      {renderCalendar((d) => setDob(d), () => setShowDOBCalendar(false))}
                    </View>
                  )}
                </View>

                <View style={[styles.formField, { zIndex: 1 }]}>
                  <Text style={styles.inputLabel}>Residential Address</Text>
                  <TextInput style={styles.textInput} placeholder="City, State, Country" placeholderTextColor="#9CA3AF" />
                </View>

                <View style={styles.formFooter}>
                  <TouchableOpacity style={styles.cancelBtnTextOnly} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelBtnTextOnlyText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => setActiveTab('bank')}>
                    <Text style={styles.primaryBtnText}>Next Step</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Bank Details Tab */}
            {activeTab === 'bank' && (
              <Animated.View entering={FadeInUp.duration(200)}>
                <View style={styles.formSectionHeader}>
                  <View style={[styles.formSectionIcon, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="cash-outline" size={18} color="#10B981" />
                  </View>
                  <Text style={styles.formSectionTitle}>Bank Account Details</Text>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Bank Name</Text>
                  <TextInput style={styles.textInput} placeholder="e.g. HDFC Bank" placeholderTextColor="#9CA3AF" />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Account Number</Text>
                  <TextInput style={styles.textInput} placeholder="000 000 0000 0000" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Account Holder Name</Text>
                  <TextInput style={styles.textInput} placeholder="Full name as in bank" placeholderTextColor="#9CA3AF" />
                </View>

                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Account Type</Text>
                    <View style={styles.selectInput}>
                      <Text style={styles.selectText}>Saving</Text>
                      <Ionicons name="chevron-down" size={16} color="#4B5563" />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>IFSC Code</Text>
                    <TextInput style={styles.textInput} placeholder="HDFC000123" placeholderTextColor="#9CA3AF" />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Salary Payment Method</Text>
                  <View style={styles.selectInput}>
                    <Text style={styles.selectText}>Bank Transfer</Text>
                    <Ionicons name="chevron-down" size={16} color="#4B5563" />
                  </View>
                </View>

                <View style={styles.formFooterSpaceBetween}>
                  <TouchableOpacity style={styles.outlineBtn} onPress={() => setActiveTab('personal')}>
                    <Text style={styles.outlineBtnText}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => setActiveTab('professional')}>
                    <Text style={styles.primaryBtnText}>Next Step</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Professional Info */}
            {activeTab === 'professional' && (
              <Animated.View entering={FadeInUp.duration(200)}>
                <View style={styles.formSectionHeader}>
                  <View style={[styles.formSectionIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="briefcase" size={18} color="#4F46E5" />
                  </View>
                  <Text style={styles.formSectionTitle}>Professional Information</Text>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Department</Text>
                  <View style={styles.selectInput}>
                    <Text style={styles.selectTextPlaceholder}>Select Department</Text>
                    <Ionicons name="chevron-down" size={16} color="#4B5563" />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Highest Qualification</Text>
                  <TextInput style={styles.textInput} placeholder="e.g. M.Sc Mathematics" placeholderTextColor="#9CA3AF" />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Subject Taught</Text>
                  <TextInput style={styles.textInput} placeholder="e.g. Advanced Calculus" placeholderTextColor="#9CA3AF" />
                </View>

                <View style={[styles.formField, { position: 'relative', zIndex: 10 }]}>
                  <Text style={styles.inputLabel}>Joining Date</Text>
                  <TouchableOpacity style={styles.dateInput} activeOpacity={0.7} onPress={() => setShowJoiningCalendar(!showJoiningCalendar)}>
                    <Text style={[styles.dateText, !joiningDate && {color: '#9CA3AF'}]}>{joiningDate || 'mm/dd/yyyy'}</Text>
                    <Ionicons name="calendar-outline" size={18} color="#4B5563" />
                  </TouchableOpacity>
                  {showJoiningCalendar && (
                    <View style={{ position: 'absolute', top: 75, left: 0, right: 0, zIndex: 99 }}>
                      {renderCalendar((d) => setJoiningDate(d), () => setShowJoiningCalendar(false))}
                    </View>
                  )}
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Years of Experience</Text>
                  <TextInput style={styles.textInput} placeholder="e.g. 5" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Professional Biography</Text>
                  <TextInput 
                    style={styles.textArea} 
                    placeholder="Short description..." 
                    placeholderTextColor="#9CA3AF" 
                    multiline 
                    textAlignVertical="top" 
                  />
                </View>

                <View style={styles.formFooterSpaceBetween}>
                  <TouchableOpacity style={styles.outlineBtn} onPress={() => setActiveTab('bank')}>
                    <Text style={styles.outlineBtnText}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => setActiveTab('face')}>
                    <Text style={styles.primaryBtnText}>Register Teacher</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Face Enrollment */}
            {activeTab === 'face' && (
              <Animated.View entering={FadeInUp.duration(200)}>
                <View style={styles.formSectionHeader}>
                  <View style={[styles.formSectionIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="camera" size={18} color="#3B82F6" />
                  </View>
                  <Text style={styles.formSectionTitle}>Face Enrollment</Text>
                </View>
                <Text style={styles.formSectionSubtitle}>Capture 3 photos for biometric attendance marking</Text>

                <View style={styles.warningBox}>
                  <View style={styles.warningIconCircle}>
                    <Ionicons name="warning" size={16} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.warningTitle}>Registration Required First</Text>
                    <Text style={styles.warningText}>Please complete the registration in the previous steps before enrolling biological data.</Text>
                  </View>
                </View>

                <View style={styles.formFooterSpaceBetweenFace}>
                  <TouchableOpacity style={styles.outlineBtn} onPress={() => setActiveTab('professional')}>
                    <Text style={styles.outlineBtnText}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.disabledBtn} activeOpacity={1}>
                    <Text style={styles.disabledBtnText}>Enroll Face</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFF' },
  keyboardView: { flex: 1 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Avoid dynamic island / notch
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
    zIndex: 10,
  },
  menuHandle: { paddingRight: 4, paddingVertical: 8, display: 'none' }, // hidden on this screen as back btn handles nav
  topHeaderTitle: { fontSize: 18, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#A78BFA',
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  purpleHeaderBlock: {
    backgroundColor: '#4F46E5', // vibrant purple/blue
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 8,
  },
  headerBackBtn: {
    width: 38, height: 38, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginBottom: 2 },
  headerSubtitle: { color: '#E0E7FF', fontSize: 12, fontWeight: '500' },
  
  // Tabs row
  tabsWrapper: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8, // pill shape
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#EEF2FF', // lighter purple tint
    borderColor: '#4F46E5', // vibrant purple border
  },
  tabBtnText: { color: '#6B7280', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  tabBtnTextActive: { color: '#4F46E5' },
  
  // Form Content
  formScrollContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  formContainer: {
    padding: 20,
  },
  formSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  formSectionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  formSectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  formSectionSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20, marginTop: -8 },
  
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  formField: { marginBottom: 20 },
  
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  textInput: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#FFF'
  },
  dateInput: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF'
  },
  dateText: { fontSize: 14, color: '#111827' },
  selectInput: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF',
  },
  selectText: { fontSize: 14, color: '#111827' },
  selectTextPlaceholder: { fontSize: 14, color: '#9CA3AF' },
  textArea: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', backgroundColor: '#FFF',
    height: 80,
  },

  // Calendars styling
  calendarDropdown: {
    backgroundColor: '#FFF',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    marginTop: 6, padding: 16, shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06,
    shadowRadius: 20, elevation: 6,
  },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calendarMonthText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  calendarDaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  calendarDayLabel: { width: 32, textAlign: 'center', fontSize: 13, color: '#6B7280', fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 16, marginBottom: 4 },
  calendarDayText: { fontSize: 14, color: '#111827' },

  // Footer Buttons
  formFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  formFooterSpaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  formFooterSpaceBetweenFace: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  cancelBtnTextOnly: { justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  cancelBtnTextOnlyText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  primaryBtn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  primaryBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  outlineBtn: { borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8, backgroundColor: '#FFF' },
  outlineBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  disabledBtn: { backgroundColor: '#A78BFA', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8 },
  disabledBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  warningBox: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 12 },
  warningIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  warningTitle: { fontSize: 15, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  warningText: { fontSize: 13, color: '#B45309', lineHeight: 20 },

});

export default PrincipalAddStaffScreen;
