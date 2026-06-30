import React, { useState,useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import accountService from '../../services/accountService';
import { ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountSettings'>;

// Reusable Input Field inline component matching the requested UI exactly
const InputField = ({
  label,
  labelIcon,
  inputIcon,
  placeholder,
  rightIcon,
  multiline,
  value,
  onChangeText,
  onRightIconPress,
  prefixComponent,
  secureTextEntry,
}: any) => (
  <View style={styles.fieldContainer}>
    <View style={styles.labelRow}>
      <Ionicons name={labelIcon} size={12} color="#3B82F6" />
      <Text style={styles.labelText}>{label}</Text>
    </View>
    <View
      style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}
    >
      {prefixComponent ? (
        prefixComponent
      ) : (
        <Ionicons
          name={inputIcon}
          size={16}
          color="#6B7280"
          style={[styles.inputLeftIcon, multiline && { marginTop: 14 }]}
        />
      )}
      <TextInput
        style={[styles.textInput, multiline && styles.textInputMultiline]}
  placeholder={placeholder}
  placeholderTextColor="#9CA3AF"
  multiline={multiline}
  value={value}
  onChangeText={onChangeText}
  secureTextEntry={secureTextEntry}
      />
      {rightIcon && (
        <TouchableOpacity
          onPress={onRightIconPress}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons
            name={rightIcon}
            size={18}
            color="#111827"
            style={styles.inputRightIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const PreferenceToggle = ({
  title,
  description,
  value,
  onValueChange,
}: any) => (
  <View style={styles.toggleCard}>
    <View style={{ flex: 1, paddingRight: 10 }}>
      <Text style={styles.toggleTitle}>{title}</Text>
      <Text style={styles.toggleDesc}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#E5E7EB', true: '#22C55E' }}
      thumbColor="#FFFFFF"
    />
  </View>
);

const AccountSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { authState } = useAuth();
  const role = authState.role;
  const isTeacher = role === 'teacher';
  const isInstitution = role === 'principal';
  const roleTitle = isInstitution
    ? 'Institution'
    : isTeacher
      ? 'Teacher'
      : 'Student';
  const secondaryTabTitle = isInstitution
    ? 'Institution Info'
    : isTeacher
      ? 'Professional Info'
      : 'Parent Information';
  const idLabel = isInstitution
    ? 'PRN2023-01X'
    : isTeacher
      ? 'EMP2023-12A'
      : 'CS2023-789';

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dob, setDob] = useState('');
  const [activeTab, setActiveTab] = useState<string>(
    route.params?.targetTab || 'Personal Details',
  );
  const [profileData, setProfileData] = useState({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  dob: '',
  address: '',
});
//parent data state
const [parentData, setParentData] = useState({
  name: '',
  relationship: '',
  email: '',
  phone: '',
  address: '',
});
//emergency data
const [emergencyData, setEmergencyData] = useState({
  name: '',
  relationship: '',
  email: '',
  phone: '',
});

const [isLoading, setIsLoading] = useState(false);
useEffect(() => {
  fetchProfile();
}, []);

const fetchProfile = async () => {
  try {
    setIsLoading(true);

   const response = await accountService.getStudentInfo();
   const parentResponse = await accountService.getParentInfo();
   const parent = parentResponse.data?.data ?? parentResponse.data ?? {};

setParentData({
  name: parent.parentName || '',
  relationship: parent.parentRelationship || '',
  email: parent.parentEmail || '',
  phone: parent.parentPhone || '',
  address: '',
});

const emergencyResponse = await accountService.getEmergencyContact();

const emergency =
  emergencyResponse.data?.data ?? emergencyResponse.data ?? {};

setEmergencyData({
  name: emergency.emergencyName || '',
  relationship: emergency.emergencyRelationship || '',
  email: emergency.emergencyEmail || '',
  phone: emergency.emergencyPhone || '',
});

console.log(
  '[Account Settings] Emergency Response:',
  JSON.stringify(emergency, null, 2),
);

    const data = response.data?.data ?? response.data ?? {};

    const fullName = data.name ?? '';
const nameParts = fullName.trim().split(' ');

setProfileData({
  firstName: nameParts[0] || '',
  lastName: nameParts.slice(1).join(' ') || '',
  phone: data.phone || '',
  email: data.email || '',
  dob: data.dateOfBirth
  ? new Date(data.dateOfBirth).toLocaleDateString('en-GB')
  : '',
  address: data.address || '',
});
  } catch (error) {
    console.log('Profile fetch failed', error);
  } finally {
    setIsLoading(false);
  }
};
const saveParentInfo = async () => {
  try {
    setIsLoading(true);

    const payload = {
      parentName: parentData.name,
      parentRelationship: parentData.relationship,
      parentEmail: parentData.email,
      parentPhone: parentData.phone,
    };

    console.log(
      '[Account Settings] Parent Update Payload:',
      JSON.stringify(payload, null, 2),
    );

    const response = await accountService.updateParentInfo(payload);

    console.log(
      '[Account Settings] Parent Update Response:',
      JSON.stringify(response.data, null, 2),
    );

    Alert.alert('Success', 'Parent information updated successfully.');

    // Refresh the latest data from the backend
    fetchProfile();
  } catch (error) {
    if (axios.isAxiosError(error)) {
  console.log(
    '[Parent Update Error]',
    JSON.stringify(error.response?.data, null, 2),
  );
  console.log('[Parent Update Status]', error.response?.status);
} else {
  console.log(error);
}
    Alert.alert('Error', 'Failed to update parent information.');
  } finally {
    setIsLoading(false);
  }
};

  // Preferences State
  const [gradeNotif, setGradeNotif] = useState(true);
  const [assignNotif, setAssignNotif] = useState(true);
  const [classNotif, setClassNotif] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
          Welcome back, {authState.user?.name?.split(' ')[0] || 'User'}
        </Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {authState.user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.pageTitleWrapper}
        >
          <Text style={styles.pageTitle}>Account Settings</Text>
          <Text style={styles.pageSubtitle}>
            Manage your {roleTitle} account and preferences
          </Text>
        </Animated.View>

        {/* Hero ID Card */}
        <Animated.View
          entering={FadeInUp.delay(100).springify()}
          style={styles.heroCard}
        >
          <ScaleButton
            activeOpacity={0.8}
            scaleTo={0.92}
            style={styles.heroAvatarContainer}
          >
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>
                {authState.user?.name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera-outline" size={12} color="#4F46E5" />
            </View>
          </ScaleButton>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>
              {authState.user?.name || 'User Name'}
            </Text>
            <Text style={styles.heroDetails}>
              {authState.user?.email || 'Email.com'} | ID: {idLabel}
            </Text>
            <View style={styles.heroStatusPill}>
              <Text style={styles.heroStatusText}>Active {roleTitle}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Form Container */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.formContainerCard}
        >
          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'Personal Details' && styles.tabActive,
              ]}
              onPress={() => setActiveTab('Personal Details')}
            >
              <Ionicons
                name="person"
                size={12}
                color={activeTab === 'Personal Details' ? '#3B82F6' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'Personal Details' && styles.tabTextActive,
                ]}
              >
                Personal Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === secondaryTabTitle && styles.tabActive,
              ]}
              onPress={() => setActiveTab(secondaryTabTitle)}
            >
              <Ionicons
                name="people"
                size={12}
                color={activeTab === secondaryTabTitle ? '#3B82F6' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === secondaryTabTitle && styles.tabTextActive,
                ]}
              >
                {secondaryTabTitle}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'Preferences' && styles.tabActive,
              ]}
              onPress={() => setActiveTab('Preferences')}
            >
              <Ionicons
                name="options"
                size={12}
                color={activeTab === 'Preferences' ? '#3B82F6' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'Preferences' && styles.tabTextActive,
                ]}
              >
                Preferences
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'Personal Details' ? (
            <>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Ionicons name="school-outline" size={16} color="#3B82F6" />
                <Text style={styles.sectionTitle}>{roleTitle} Information</Text>
              </View>

              <View style={styles.divider} />

              {/* Fields Loop */}
              <InputField
               label="First Name"
  labelIcon="person-outline"
  inputIcon="person"
  placeholder="Enter First Name"
  value={profileData.firstName}
  onChangeText={(text: string) =>
    setProfileData({ ...profileData, firstName: text })
  }
              />
              <InputField
                label="Last name"
  labelIcon="person-outline"
  inputIcon="person"
  placeholder="Enter Last Name"
  value={profileData.lastName}
  onChangeText={(text: string) =>
    setProfileData({ ...profileData, lastName: text })
  }
              />

              {/* Static Student ID Block */}
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Ionicons name="id-card-outline" size={12} color="#3B82F6" />
                  <Text style={styles.labelText}>{roleTitle} ID</Text>
                </View>
                <View style={styles.staticFieldWrapper}>
                  <Ionicons
                    name="business"
                    size={16}
                    color="#6B7280"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.staticFieldText}>{idLabel}</Text>
                </View>
              </View>

              <InputField
                label="Phone number"
  labelIcon="call-outline"
  inputIcon="call"
  placeholder="Enter Phone Number"
  value={profileData.phone}
  onChangeText={(text: string) =>
    setProfileData({ ...profileData, phone: text })
  }
              />

              <InputField
  label="Email Address"
  labelIcon="mail-outline"
  inputIcon="mail"
  placeholder="Enter Email Address"
  value={profileData.email}
  onChangeText={(text: string) =>
    setProfileData({ ...profileData, email: text })
  }
/>
              <InputField
                label="Date of Birth"
                labelIcon="calendar-outline"
                inputIcon="calendar"
                placeholder="MM/DD/YYYY"
                value={profileData.dob}                
                rightIcon="calendar"
                onRightIconPress={() => setShowCalendar(true)}
                onChangeText={(text: string) =>
                setProfileData({ ...profileData, dob: text })
                  }
              />

              <InputField
  label="Current Address"
  labelIcon="location-outline"
  inputIcon="home"
  placeholder="Enter Full Address"
  multiline
  value={profileData.address}
  onChangeText={(text: string) =>
    setProfileData({ ...profileData, address: text })
  }
/>

              <View style={styles.divider} />

              {/* Action Buttons */}
              <View style={styles.buttonsRow}>
                <ScaleButton
                  activeOpacity={0.8}
                  scaleTo={0.96}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </ScaleButton>
                <ScaleButton
                  activeOpacity={0.9}
                  scaleTo={0.96}
                  style={styles.saveBtn}
                >
                  <Ionicons
                    name="save"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.saveBtnText} >Save Personal Details</Text>
                </ScaleButton>
              </View>
            </>
          ) : activeTab === secondaryTabTitle ? (
            <>
              {/* Parent Section Header */}
              <View style={styles.sectionHeader}>
                <Ionicons name="school-outline" size={16} color="#3B82F6" />
                <Text style={styles.sectionTitle}>{secondaryTabTitle}</Text>
              </View>

              <View style={styles.divider} />

              <InputField
  label="Parent/Guardian Name"
  labelIcon="person-outline"
  inputIcon="person"
  placeholder="Enter Full Name"
  value={parentData.name}
  onChangeText={(text: string) =>
    setParentData({ ...parentData, name: text })
  }
/>
              <InputField
  label="Relationship"
  labelIcon="people-outline"
  inputIcon="person"
  placeholder="Enter Relationship"
  value={parentData.relationship}
  onChangeText={(text: string) =>
    setParentData({ ...parentData, relationship: text })
  }
/>
              <InputField
  label="Email Address"
  labelIcon="mail-outline"
  inputIcon="mail"
  placeholder="Enter Email Address"
  value={parentData.email}
  onChangeText={(text: string) =>
    setParentData({ ...parentData, email: text })
  }
/>
              <InputField
  label="Phone number"
  labelIcon="call-outline"
  inputIcon="call"
  placeholder="Enter Phone Number"
  value={parentData.phone}
  onChangeText={(text: string) =>
    setParentData({ ...parentData, phone: text })
  }
/>
              <InputField
  label="Current Address"
  labelIcon="location-outline"
  inputIcon="home"
  placeholder="Enter Address"
  multiline
  value={parentData.address}
  onChangeText={(text: string) =>
    setParentData({ ...parentData, address: text })
  }
/>

              {/* Emergency Section Header */}
              <View style={[styles.sectionHeader, { paddingTop: 8 }]}>
                <Ionicons name="call-outline" size={16} color="#3B82F6" />
                <Text style={styles.sectionTitle}>
                  Emergency Contact Information
                </Text>
              </View>

              <View style={styles.divider} />

              <InputField
  label="Emergency Contact Name"
  labelIcon="person-outline"
  inputIcon="person"
  placeholder="Enter Name"
  value={emergencyData.name}
  onChangeText={(text: string) =>
    setEmergencyData({ ...emergencyData, name: text })
  }
/>
              <InputField
  label="Relationship"
  labelIcon="people-outline"
  inputIcon="person"
  placeholder="Enter Relationship"
  value={emergencyData.relationship}
  onChangeText={(text: string) =>
    setEmergencyData({ ...emergencyData, relationship: text })
  }
/>
              <InputField
  label="Email Address"
  labelIcon="mail-outline"
  inputIcon="mail"
  placeholder="Enter Email Address"
  value={emergencyData.email}
  onChangeText={(text: string) =>
    setEmergencyData({ ...emergencyData, email: text })
  }
/>
              <InputField
  label="Phone number"
  labelIcon="call-outline"
  inputIcon="call"
  placeholder="Enter Phone Number"
  value={emergencyData.phone}
  onChangeText={(text: string) =>
    setEmergencyData({ ...emergencyData, phone: text })
  }
/>

              <View style={styles.divider} />

              {/* Action Buttons */}
              <View style={styles.buttonsRow}>
                <ScaleButton
                  activeOpacity={0.8}
                  scaleTo={0.96}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </ScaleButton>
                <ScaleButton
  activeOpacity={0.9}
  scaleTo={0.96}
  style={styles.saveBtn}
  onPress={saveParentInfo}
>
                  <Ionicons
                    name="save"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.saveBtnText}>
                    Save {secondaryTabTitle}
                  </Text>
                </ScaleButton>
              </View>
            </>
          ) : activeTab === 'Preferences' ? (
            <>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Ionicons name="options" size={16} color="#3B82F6" />
                <Text style={styles.sectionTitle}>
                  Account Preference & Security
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Toggles */}
              <PreferenceToggle
                title="Grade Notifications"
                description="Get notified when new grades are posted"
                value={gradeNotif}
                onValueChange={setGradeNotif}
              />
              <PreferenceToggle
                title="Assignment Reminders"
                description="Receive reminders for upcoming assignments"
                value={assignNotif}
                onValueChange={setAssignNotif}
              />
              <PreferenceToggle
                title="Class Announcements"
                description="Get notifications for class announcements"
                value={classNotif}
                onValueChange={setClassNotif}
              />

              <View style={{ height: 12 }} />

              {/* Dropdowns */}
              <InputField
                label="Language Preference"
                labelIcon="language"
                inputIcon="language"
                value="English"
                rightIcon="chevron-down"
              />
              <InputField
                label="Communication Preference"
                labelIcon="chatbubbles-outline"
                inputIcon="chatbubbles-outline"
                value="Email Only"
                rightIcon="chevron-down"
              />

              <View style={styles.divider} />

              {/* Action Buttons */}
              <View style={styles.buttonsRow}>
                <ScaleButton
                  activeOpacity={0.8}
                  scaleTo={0.96}
                  style={[
                    styles.cancelBtn,
                    { flex: 1.2, flexDirection: 'row', gap: 6 },
                  ]}
                  onPress={() => setShowPasswordModal(true)}
                >
                  <Ionicons name="key-outline" size={14} color="#111827" />
                  <Text style={[styles.cancelBtnText, { color: '#111827' }]}>
                    Change Password
                  </Text>
                </ScaleButton>
                <ScaleButton
                  activeOpacity={0.9}
                  scaleTo={0.96}
                  style={styles.saveBtn}
                >
                  <Ionicons
                    name="save"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.saveBtnText}>Save Preferences</Text>
                </ScaleButton>
              </View>
            </>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* Calendar Overlay Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.calendarModalContent}
          >
            <View style={styles.calendarHeader}>
              <TouchableOpacity>
                <Ionicons name="chevron-back" size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.calendarMonth}>October 2023</Text>
              <TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarDaysRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={i} style={styles.calDayName}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const isActive = day === 15;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.calDayBox, isActive && styles.calDayActive]}
                    onPress={() => {
                      setDob(`10/${day.toString().padStart(2, '0')}/2023`);
                      setShowCalendar(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isActive && styles.calDayTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Update Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModalContent}>
            <View style={styles.pwdHeader}>
              <View style={styles.pwdHeaderIcon}>
                <Ionicons name="key" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.pwdHeaderTextContainer}>
                <Text style={styles.pwdHeaderTitle}>Update Password</Text>
                <Text style={styles.pwdHeaderSubtitle}>
                  Last changed: 45 days ago
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={styles.pwdCloseBtn}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.pwdBody}>
              {/* Requirements overlapping box */}
              <View style={styles.pwdReqBox}>
                <View style={styles.pwdReqHeaderRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={14}
                    color="#3B82F6"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.pwdReqTitle}>Password Requirements</Text>
                </View>
                <View style={styles.pwdReqColumns}>
                  <View style={styles.pwdReqCol}>
                    <View style={styles.pwdReqRow}>
                      <View style={styles.pwdReqDot} />
                      <Text style={styles.pwdReqText}>
                        At least 8 characters
                      </Text>
                    </View>
                    <View style={styles.pwdReqRow}>
                      <View style={styles.pwdReqDot} />
                      <Text style={styles.pwdReqText}>
                        One lowercase letter
                      </Text>
                    </View>
                    <View style={styles.pwdReqRow}>
                      <View style={styles.pwdReqDot} />
                      <Text style={styles.pwdReqText}>
                        One special character
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pwdReqCol}>
                    <View style={styles.pwdReqRow}>
                      <View style={styles.pwdReqDot} />
                      <Text style={styles.pwdReqText}>
                        One uppercase letter
                      </Text>
                    </View>
                    <View style={styles.pwdReqRow}>
                      <View style={styles.pwdReqDot} />
                      <Text style={styles.pwdReqText}>One number</Text>
                    </View>
                    <View style={styles.pwdReqRow}>
                      <View style={styles.pwdReqDot} />
                      <Text style={styles.pwdReqText}>
                        Passwords must match
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Inputs */}
              <InputField
                label="Current Password"
                labelIcon="lock-closed"
                inputIcon="key"
                placeholder="Enter your current password"
                rightIcon="eye"
                secureTextEntry={true}
              />
              <InputField
                label="New Password"
                labelIcon="lock-closed"
                inputIcon="lock-closed"
                placeholder="Create a strong new password"
                rightIcon="eye"
                secureTextEntry={true}
              />
              <InputField
                label="Confirm New Password"
                labelIcon="lock-closed"
                inputIcon="lock-closed"
                placeholder="Re - enter your new password"
                rightIcon="eye"
                secureTextEntry={true}
              />

              <View style={styles.divider} />

              {/* Buttons */}
              <View style={[styles.buttonsRow, { paddingBottom: 20 }]}>
                <ScaleButton
                  activeOpacity={0.8}
                  scaleTo={0.96}
                  style={styles.cancelBtn}
                  onPress={() => setShowPasswordModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </ScaleButton>
                <ScaleButton
                  activeOpacity={0.9}
                  scaleTo={0.96}
                  style={styles.saveBtn}
                >
                  <Ionicons
                    name="save"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.saveBtnText}>Update Password</Text>
                </ScaleButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={(role as any) || 'student'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAF9F9' },
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 4,
  },
  pageSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  /* Hero ID Card */
  heroCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  heroAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  heroDetails: {
    fontSize: 10,
    color: '#E0E7FF',
    marginBottom: 8,
  },
  heroStatusPill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  heroStatusText: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '700',
  },

  /* Form Container */
  formContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingBottom: 24,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B82F6',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
    marginHorizontal: 20,
  },

  /* Form Fields */
  fieldContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
  },
  inputLeftIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: 44,
    color: '#111827',
    fontSize: 12,
    fontWeight: '500',
  },
  textInputMultiline: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  inputRightIcon: {
    marginLeft: 10,
  },
  prefixSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  prefixSelectText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },

  staticFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  staticFieldText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  /* Buttons */
  buttonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Calendar Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  calendarModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  calendarDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calDayName: {
    width: 32,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  calDayBox: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  calDayActive: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  calDayText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  calDayTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* Preferences Settings */
  toggleCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  toggleDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  /* Password Modal */
  passwordModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  pwdHeader: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 48,
  },
  pwdHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pwdHeaderTextContainer: {
    flex: 1,
    paddingTop: 4,
  },
  pwdHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pwdHeaderSubtitle: {
    fontSize: 12,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  pwdCloseBtn: {
    padding: 4,
  },
  pwdBody: {
    backgroundColor: '#FFFFFF',
  },
  pwdReqBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: -32,
    marginBottom: 24,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pwdReqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pwdReqTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  pwdReqColumns: {
    flexDirection: 'row',
  },
  pwdReqCol: {
    flex: 1,
  },
  pwdReqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pwdReqDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginRight: 8,
  },
  pwdReqText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
  },
});

export default AccountSettingsScreen;