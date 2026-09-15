import React, { useState, useEffect } from 'react';
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
  Image,
  RefreshControl,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { StudentHeader } from '../../components/StudentHeader';
import { useAuth } from '../../store/AuthContext';
import accountService from '../../services/accountService';
import teacherService from '../../services/teacherService';
import principalService from '../../services/principalService';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { ImagePickerModal } from '../../components/common/ImagePickerModal';
import { getCacheBustedUri } from '../../utils/image';
import { invalidateCacheKey, CACHE_KEYS } from '../../utils/cache';

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
}: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Ionicons name={labelIcon} size={13} color={theme.primary} />
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <View
        style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}
      >
        {prefixComponent ? (
          prefixComponent
        ) : (
          <View style={styles.iconBoxContainer}>
            <Ionicons
              name={inputIcon}
              size={15}
              color={theme.primary}
              style={[styles.inputLeftIcon, multiline && { marginTop: 4 }]}
            />
          </View>
        )}
        <TextInput
          style={[styles.textInput, multiline && styles.textInputMultiline]}
          placeholder={placeholder}
          placeholderTextColor={theme.subtext}
          multiline={multiline}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardAppearance={isDarkMode ? 'dark' : 'light'}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons
              name={rightIcon}
              size={18}
              color={theme.text}
              style={styles.inputRightIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const PreferenceToggle = ({
  title,
  description,
  value,
  onValueChange,
}: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  return (
    <View style={styles.toggleCard}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: '#22C55E' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

const AccountSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const { authState, updateUser } = useAuth();
  const role = authState.role?.toLowerCase() || '';
  const isTeacher = role === 'teacher';
  const isInstitution = role === 'institution' || role === 'principal';
  const isLibrary = role === 'library' || role === 'librarian' || role === 'library_admin';
  const isStudent = role === 'student';

  const roleTitle = isInstitution
    ? 'Institution'
    : isTeacher
      ? 'Teacher'
      : isLibrary
        ? 'Library Admin'
        : 'Student';

  const secondaryTabTitle = isInstitution
    ? 'Institution Info'
    : isTeacher
      ? 'Professional Info'
      : isStudent
        ? 'Parent Information'
        : null;

  const [rollNo, setRollNo] = useState('');

  const idLabel = isInstitution
    ? 'PRN2023-01X'
    : isTeacher
      ? 'EMP2023-12A'
      : isLibrary
        ? 'LIB2023-01A'
        : rollNo || 'Student';

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    route.params?.targetTab || 'Personal Details'
  );

  // Profile data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dob: '',
    address: '',
    photo: '',
    biography: '',
  });

  // professional info data
  const [profData, setProfData] = useState({
    employeeId: '',
    qualification: '',
    department: '',
    designation: '',
    specialization: '',
    joiningDate: '',
  });

  // institution data
  const [institutionData, setInstitutionData] = useState({
    name: '',
    schoolType: '',
    affiliation: '',
    phone: '',
    address: '',
  });

  // bank details data
  const [bankData, setBankData] = useState({
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    upiId: '',
  });

  // parent data
  const [parentData, setParentData] = useState({
    name: '',
    relationship: '',
    email: '',
    phone: '',
    address: '',
  });

  // emergency data
  const [emergencyData, setEmergencyData] = useState({
    name: '',
    relationship: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile(false);
  }, [authState.user?.id, role]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfile(true);
    setIsRefreshing(false);
  };

  const fetchProfile = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);

      const prefResponse = await accountService.getPreferences().catch(() => null);
      if (prefResponse?.data?.data || prefResponse?.data) {
        const pref = prefResponse.data.data || prefResponse.data;
        setGradeNotif(pref.gradeNotif ?? true);
        setAssignNotif(pref.assignNotif ?? true);
        setClassNotif(pref.classNotif ?? true);
      }

      if (isTeacher) {
        const [personalResponse, profResponse] = await Promise.all([
          teacherService.getPersonalInfo(),
          teacherService.getProfile(),
        ]);

        const personalRaw = personalResponse.data?.data ?? personalResponse.data ?? {};
        const profRaw = profResponse.data?.data ?? profResponse.data ?? {};

        const fullName = personalRaw.name || '';
        const nameParts = fullName.trim().split(' ');

        let dobString = '';
        const rawDob = profRaw.dateOfBirth || profRaw.dob;
        if (rawDob) {
          dobString = new Date(rawDob).toLocaleDateString('en-GB');
        }

        const teacherPhoto = personalRaw.photoUrl || personalRaw.photo || profRaw.photoUrl || '';
        setProfileData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phone: personalRaw.phone || '',
          email: personalRaw.email || authState.user?.email || '',
          dob: dobString,
          address: personalRaw.address || '',
          photo: teacherPhoto,
          biography: '',
        });
        if (teacherPhoto) {
          updateUser({ photoUrl: teacherPhoto, photoUpdatedAt: Date.now() });
        }

        setProfData({
          employeeId: profRaw.userId || '',
          qualification: profRaw.highestQualification || '',
          department: profRaw.department || '',
          designation: profRaw.designation || '',
          specialization: profRaw.specialization || '',
          joiningDate: profRaw.joiningDate ? new Date(profRaw.joiningDate).toLocaleDateString('en-GB') : '',
        });

        const bankRes = await teacherService.getBankDetails().catch(() => null);
        if (bankRes?.data?.data || bankRes?.data) {
          const bank = bankRes.data.data || bankRes.data;
          setBankData({
            accountNumber: bank.accountNumber || '',
            ifscCode: bank.ifscCode || '',
            bankName: bank.bankName || '',
            branchName: bank.branchName || '',
            upiId: bank.upiId || '',
          });
        }

      } else if (isInstitution) {
        const [instProfileRes, sessionsRes] = await Promise.all([
          principalService.getInstitutionProfile().catch(() => null),
          principalService.getSessions().catch(() => null),
        ]);

        const instRaw: any = (instProfileRes as any)?.data?.data || (instProfileRes as any)?.data || instProfileRes;
        if (instRaw) {
          const instPhoto = instRaw.photoUrl || instRaw.logo || instRaw.photo || '';
          setInstitutionData({
            name: instRaw.name || '',
            schoolType: instRaw.type || instRaw.schoolType || '',
            affiliation: instRaw.board || instRaw.affiliation || '',
            phone: instRaw.phone || '',
            address: instRaw.address || '',
          });
          const adminName = instRaw.adminName || authState.user?.name || '';
          const nameParts = adminName.trim().split(' ');
          setProfileData(prev => ({
            ...prev,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            phone: instRaw.phone || prev.phone,
            email: instRaw.email || authState.user?.email || prev.email,
            address: instRaw.address || prev.address,
            photo: instPhoto || prev.photo,
          }));
          if (instPhoto) {
            updateUser({ photoUrl: instPhoto, photoUpdatedAt: Date.now() });
          }
        }

        const sessList: any = (sessionsRes as any)?.data?.data || (sessionsRes as any)?.data || sessionsRes;
        if (sessList && Array.isArray(sessList)) {
          setSessions(sessList);
        }

      } else {
        const profileResponse = await accountService.getProfile();
        const parentResponse = isStudent ? await accountService.getParentInfo().catch(() => null) : null;

        const profileRaw = profileResponse.data?.data ?? profileResponse.data ?? {};
        const fullName = profileRaw.name || authState.user?.name || '';
        const nameParts = fullName.trim().split(' ');

        if (profileRaw.rollNumber) {
          setRollNo(profileRaw.rollNumber);
        }

        let dobString = '';
        if (profileRaw.dateOfBirth) {
          dobString = new Date(profileRaw.dateOfBirth).toLocaleDateString('en-GB');
        }

        const studentPhoto = profileRaw.avatarUrl || profileRaw.photo || profileRaw.photoUrl || '';
        setProfileData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phone: profileRaw.phoneNumber || profileRaw.phone || '',
          email: profileRaw.email || authState.user?.email || '',
          dob: dobString,
          address: profileRaw.address || '',
          photo: studentPhoto,
          biography: profileRaw.bio || '',
        });
        if (studentPhoto) {
          updateUser({ photoUrl: studentPhoto, photoUpdatedAt: Date.now() });
        }

        if (parentResponse?.data?.data || parentResponse?.data) {
          const parentRaw = parentResponse.data.data || parentResponse.data;
          setParentData({
            name: parentRaw.parentName || parentRaw.name || '',
            relationship: parentRaw.parentRelationship || parentRaw.relationship || '',
            email: parentRaw.parentEmail || parentRaw.email || '',
            phone: parentRaw.parentPhone || parentRaw.phone || '',
            address: parentRaw.address || '',
          });
        }

        // Emergency contact — separate endpoint, fetch in parallel with parent
        const emergencyResponse = isStudent
          ? await accountService.getEmergencyContact().catch(() => null)
          : null;
        if (emergencyResponse?.data?.data || emergencyResponse?.data) {
          const eRaw = emergencyResponse.data.data || emergencyResponse.data;
          setEmergencyData({
            name: eRaw.emergencyName || eRaw.name || '',
            relationship: eRaw.emergencyRelationship || eRaw.relationship || '',
            email: eRaw.emergencyEmail || eRaw.email || '',
            phone: eRaw.emergencyPhone || eRaw.phone || '',
          });
        }
      }
    } catch (error) {
      console.error('[AccountSettings] Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    Keyboard.dismiss();
    try {
      setIsLoading(true);
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();

      if (isTeacher) {
        await teacherService.updatePersonalInfo({
          name: fullName,
          phone: profileData.phone,
          address: profileData.address,
        });

        updateUser({
          name: fullName,
          email: profileData.email,
        });

      } else if (isInstitution) {
        await principalService.updateInstitutionProfile({
          name: institutionData.name || fullName,
          schoolType: institutionData.schoolType || '',
          affiliation: institutionData.affiliation || '',
          phone: profileData.phone,
          address: profileData.address,
        });

        updateUser({
          name: fullName,
          email: profileData.email,
        });

      } else {
        const payload: any = {
          name: fullName,
          phone: profileData.phone,
          address: profileData.address,
          bio: profileData.biography,
        };

        if (profileData.dob) {
          const parts = profileData.dob.split('/');
          if (parts.length === 3) {
            const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00.000Z`;
            payload.dateOfBirth = isoDate;
          }
        }

        const isMockUser = authState.user?.id?.startsWith('usr_') || authState.user?.id === 'student123';
        if (isMockUser) {
          updateUser({
            name: fullName,
            email: profileData.email,
          });
        } else {
          await accountService.updateProfile(payload);
        }
      }

      setTimeout(() => {
        Alert.alert('Success', 'Profile updated successfully.', [
          { text: 'OK', onPress: () => fetchProfile() }
        ]);
      }, 100);
    } catch (error) {
      console.error('[AccountSettings] Profile update error:', error);
      setTimeout(() => Alert.alert('Error', 'Failed to update profile.'), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const saveInstitutionInfo = async () => {
    Keyboard.dismiss();
    try {
      setIsLoading(true);
      await principalService.updateInstitutionProfile({
        name: institutionData.name,
        schoolType: institutionData.schoolType,
        affiliation: institutionData.affiliation,
        phone: institutionData.phone,
        address: institutionData.address,
      });
      setTimeout(() => {
        Alert.alert('Success', 'Institution details updated successfully.', [
          { text: 'OK', onPress: () => fetchProfile() }
        ]);
      }, 100);
    } catch (error) {
      console.error('[AccountSettings] Institution update error:', error);
      setTimeout(() => Alert.alert('Error', 'Failed to update institution profile.'), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfDetails = async () => {
    Keyboard.dismiss();
    try {
      setIsLoading(true);

      const payload: any = {
        department: profData.department,
        qualification: profData.qualification,
        specialization: profData.specialization,
      };

      if (profData.joiningDate) {
        const parts = profData.joiningDate.split('/');
        if (parts.length === 3) {
          payload.joiningDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      await teacherService.updateProfile(payload);
      setTimeout(() => {
        Alert.alert('Success', 'Professional details updated successfully.', [
          { text: 'OK', onPress: () => fetchProfile() }
        ]);
      }, 100);
    } catch (error) {
      console.error('[AccountSettings] Professional details update error:', error);
      setTimeout(() => Alert.alert('Error', 'Failed to update professional details.'), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBankDetails = async () => {
    Keyboard.dismiss();
    try {
      setIsLoading(true);

      const payload = {
        accountNumber: bankData.accountNumber,
        ifscCode: bankData.ifscCode,
        bankName: bankData.bankName,
        branchName: bankData.branchName,
        upiId: bankData.upiId,
      };

      await teacherService.updateBankDetails(payload);
      setTimeout(() => {
        Alert.alert('Success', 'Bank details updated successfully.', [
          { text: 'OK', onPress: () => fetchProfile() }
        ]);
      }, 100);
    } catch (error) {
      console.error('[AccountSettings] Bank details update error:', error);
      setTimeout(() => Alert.alert('Error', 'Failed to update bank details.'), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (field: string, val: boolean) => {
    try {
      let g = gradeNotif;
      let a = assignNotif;
      let c = classNotif;

      if (field === 'grade') { setGradeNotif(val); g = val; }
      if (field === 'assign') { setAssignNotif(val); a = val; }
      if (field === 'class') { setClassNotif(val); c = val; }

      await accountService.updatePreferences({
        gradeNotif: g,
        assignNotif: a,
        classNotif: c,
      });
    } catch (error) {
      console.error('[AccountSettings] Preferences error:', error);
    }
  };

  const changePassword = async () => {
    Keyboard.dismiss();

    if (!passwordData.currentPassword) {
      Alert.alert('Validation Error', 'Please enter your current password.');
      return;
    }
    if (!passwordData.newPassword) {
      Alert.alert('Validation Error', 'Please enter a new password.');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirm password do not match.');
      return;
    }

    try {
      setIsLoading(true);
      await accountService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setTimeout(() => Alert.alert('Success', 'Password changed successfully.'), 100);
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('[AccountSettings] Password change error:', error?.response?.data || error);
      setTimeout(() => Alert.alert('Error', error?.response?.data?.message || 'Failed to change password.'), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEmergencyInfo = async () => {
    Keyboard.dismiss();
    try {
      setIsLoading(true);

      const payload = {
        emergencyName: emergencyData.name,
        emergencyRelationship: emergencyData.relationship,
        emergencyEmail: emergencyData.email,
        emergencyPhone: emergencyData.phone,
      };

      await accountService.updateEmergencyContact(payload);
      setTimeout(() => {
        Alert.alert('Success', 'Emergency contact updated successfully.');
      }, 100);

      fetchProfile();
    } catch (error) {
      console.error('[AccountSettings] Emergency Contact Update Error:', error);
      setTimeout(() => Alert.alert('Error', 'Failed to update emergency contact.'), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const saveParentInfo = async () => {
    Keyboard.dismiss();
    try {
      setIsLoading(true);

      const payload = {
        parentName: parentData.name,
        parentRelationship: parentData.relationship,
        parentEmail: parentData.email,
        parentPhone: parentData.phone,
      };

      await accountService.updateParentInfo(payload);
      setTimeout(() => {
        Alert.alert('Success', 'Parent information updated successfully.');
      }, 100);

      fetchProfile();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[AccountSettings] Parent Update Error:', error.response?.data);
      } else {
        console.error('[AccountSettings] Parent Update Error:', error);
      }
      setTimeout(() => Alert.alert('Error', 'Failed to update parent information.'), 100);
    } finally {
      setIsLoading(false);
    }
  };

  // Preferences State
  const [gradeNotif, setGradeNotif] = useState(true);
  const [assignNotif, setAssignNotif] = useState(true);
  const [classNotif, setClassNotif] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isImagePickerModalOpen, setImagePickerModalOpen] = useState(false);

  const showPhotoOptions = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      Alert.alert('Profile Photo', 'Choose an action', [
        { text: 'Upload Photo', onPress: () => setImagePickerModalOpen(true) },
        { text: 'Remove Photo', onPress: handlePhotoDelete, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' }
      ]);
    }, 100);
  };

  const handleSelectedAssetUpload = async (asset: Asset) => {
    try {
      if (!asset || !asset.uri) return;

      const formData = new FormData();
      formData.append('photo', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'profile_photo.jpg',
      } as any);

      setIsLoading(true);
      let uploadRes: any;
      if (isTeacher) {
        uploadRes = await teacherService.uploadPhoto(formData);
      } else if (isInstitution) {
        uploadRes = await principalService.uploadPhoto(formData);
      } else if (isLibrary) {
        uploadRes = await apiClient.post('/account/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        uploadRes = await accountService.uploadPhoto(formData);
      }

      console.log('[AccountSettings] Photo upload response body:', uploadRes?.data);

      const uploadedUrl =
        uploadRes?.data?.photoUrl ||
        uploadRes?.data?.data?.photoUrl ||
        uploadRes?.data?.avatarUrl ||
        uploadRes?.data?.data?.avatarUrl ||
        uploadRes?.data?.url ||
        uploadRes?.data?.data?.url;

      if (uploadedUrl) {
        updateUser({ photoUrl: uploadedUrl, photoUpdatedAt: Date.now() });
        setProfileData(prev => ({ ...prev, photo: uploadedUrl }));
      }

      invalidateCacheKey(CACHE_KEYS.TEACHER_PROFILE);

      await fetchProfile(true);

      setTimeout(() => {
        Alert.alert('Success', 'Profile photo updated successfully.');
      }, 100);
    } catch (error) {
      console.error('[AccountSettings] Error uploading photo:', error);
      setTimeout(() => Alert.alert('Error', 'Failed to upload photo.'), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoDelete = async () => {
    try {
      setIsLoading(true);
      if (isTeacher) {
        await teacherService.deletePhoto();
      } else if (isInstitution) {
        await principalService.deletePhoto();
      } else if (isLibrary) {
        await apiClient.delete('/account/photo');
      } else {
        await accountService.deletePhoto();
      }

      invalidateCacheKey(CACHE_KEYS.TEACHER_PROFILE);
      updateUser({ photoUrl: '', photoUpdatedAt: Date.now() });
      setProfileData(prev => ({ ...prev, photo: '' }));

      setTimeout(() => {
        Alert.alert('Success', 'Profile photo removed successfully.', [
          { text: 'OK', onPress: () => fetchProfile(true) }
        ]);
      }, 100);
    } catch (error) {
      console.error('[AccountSettings] Error deleting photo:', error);
      setTimeout(() => Alert.alert('Error', 'Failed to remove photo.'), 100);
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(15);
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Sessions State (Institution role)
  const [sessions, setSessions] = useState<any[]>([]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
        translucent={false}
      />

      {/* Untouched Student Header */}
      {role === 'student' ? (
        <StudentHeader
          title="Account Settings"
          navigation={navigation}
          onMenuPress={() => setDrawerOpen(true)}
        />
      ) : (
        /* Untouched Global Header */
        <View style={styles.globalHeader}>
          <TouchableOpacity
            style={styles.menuHandle}
            onPress={() => setDrawerOpen(true)}
          >
            <Ionicons name="menu" size={28} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            Account Settings
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={styles.avatar}
            >
              {authState.user?.photoUrl ? (
                <Image
                  source={{ uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt) }}
                  style={{ width: 34, height: 34, borderRadius: 17 }}
                />
              ) : (

                <Text style={styles.avatarText}>
                  {authState.user?.name?.charAt(0) || 'U'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
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
            onPress={showPhotoOptions}
          >
            <View style={styles.heroAvatar}>
              {authState.user?.photoUrl ? (
                <Image
                  source={{ uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt) }}
                  style={styles.heroAvatarImage}
                />
              ) : (

                <Text style={styles.heroAvatarText}>
                  {authState.user?.name?.charAt(0) || 'U'}
                </Text>
              )}
            </View>
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={12} color="#FFFFFF" />
            </View>
          </ScaleButton>

          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>
              {authState.user?.name || 'User Name'}
            </Text>
            <Text style={styles.heroDetails}>
              {authState.user?.email || 'Email.com'} · ID: {idLabel}
            </Text>
            <View style={styles.heroStatusPill}>
              <View style={styles.heroStatusDot} />
              <Text style={styles.heroStatusText}>Active {roleTitle}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Form Container */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.formContainerCard}
        >
          {/* Navigation Tabs (Segmented Control Feel) */}
          <View style={styles.tabsRowContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabBtn,
                activeTab === 'Personal Details' && styles.tabActive,
              ]}
              onPress={() => setActiveTab('Personal Details')}
            >
              <Ionicons
                name="person"
                size={14}
                color={activeTab === 'Personal Details' ? theme.primary : theme.subtext}
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

            {secondaryTabTitle && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.tabBtn,
                  activeTab === secondaryTabTitle && styles.tabActive,
                ]}
                onPress={() => setActiveTab(secondaryTabTitle)}
              >
                <Ionicons
                  name={isTeacher ? "briefcase" : "people"}
                  size={14}
                  color={activeTab === secondaryTabTitle ? theme.primary : theme.subtext}
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
            )}

            {isTeacher && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.tabBtn,
                  activeTab === 'Bank Details' && styles.tabActive,
                ]}
                onPress={() => setActiveTab('Bank Details')}
              >
                <Ionicons
                  name="card"
                  size={14}
                  color={activeTab === 'Bank Details' ? theme.primary : theme.subtext}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Bank Details' && styles.tabTextActive,
                  ]}
                >
                  Bank Details
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabBtn,
                activeTab === 'Preferences' && styles.tabActive,
              ]}
              onPress={() => setActiveTab('Preferences')}
            >
              <Ionicons
                name="options"
                size={14}
                color={activeTab === 'Preferences' ? theme.primary : theme.subtext}
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
                <View style={styles.sectionIconBadge}>
                  <Ionicons name="school-outline" size={16} color={theme.primary} />
                </View>
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
                label="Last Name"
                labelIcon="person-outline"
                inputIcon="person"
                placeholder="Enter Last Name"
                value={profileData.lastName}
                onChangeText={(text: string) =>
                  setProfileData({ ...profileData, lastName: text })
                }
              />

              {/* Static Read-only Student ID Block */}
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Ionicons name="id-card-outline" size={13} color={theme.primary} />
                  <Text style={styles.labelText}>{roleTitle} ID</Text>
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={10} color={theme.subtext} />
                    <Text style={styles.lockedText}>Locked</Text>
                  </View>
                </View>
                <View style={styles.staticFieldWrapper}>
                  <Ionicons
                    name="business"
                    size={16}
                    color={theme.subtext}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.staticFieldText}>{idLabel}</Text>
                </View>
              </View>

              <InputField
                label="Phone Number"
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
                placeholder="DD/MM/YYYY"
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
                placeholder="Enter your full home address"
                multiline={true}
                value={profileData.address}
                onChangeText={(text: string) =>
                  setProfileData({ ...profileData, address: text })
                }
              />

              {/* Action Buttons */}
              <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => fetchProfile()}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <ScaleButton
                  style={styles.saveBtn}
                  onPress={saveProfile}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.saveBtnText}>Save Profile</Text>
                    </>
                  )}
                </ScaleButton>
              </View>
            </>
          ) : activeTab === secondaryTabTitle ? (
            isInstitution ? (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBadge}>
                    <Ionicons name="business-outline" size={16} color={theme.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Institution Details</Text>
                </View>

                <View style={styles.divider} />

                <InputField
                  label="Institution Name"
                  labelIcon="business-outline"
                  inputIcon="business"
                  placeholder="School / College Name"
                  value={institutionData.name}
                  onChangeText={(text: string) =>
                    setInstitutionData({ ...institutionData, name: text })
                  }
                />

                <InputField
                  label="School Type"
                  labelIcon="school-outline"
                  inputIcon="school"
                  placeholder="e.g. Higher Secondary, K-12"
                  value={institutionData.schoolType}
                  onChangeText={(text: string) =>
                    setInstitutionData({ ...institutionData, schoolType: text })
                  }
                />

                <InputField
                  label="Affiliation / Board"
                  labelIcon="ribbon-outline"
                  inputIcon="ribbon"
                  placeholder="e.g. CBSE, ICSE, State Board"
                  value={institutionData.affiliation}
                  onChangeText={(text: string) =>
                    setInstitutionData({ ...institutionData, affiliation: text })
                  }
                />

                <InputField
                  label="Contact Phone"
                  labelIcon="call-outline"
                  inputIcon="call"
                  placeholder="Institution Contact Number"
                  value={institutionData.phone}
                  onChangeText={(text: string) =>
                    setInstitutionData({ ...institutionData, phone: text })
                  }
                />

                <InputField
                  label="Campus Address"
                  labelIcon="location-outline"
                  inputIcon="home"
                  placeholder="Full Campus Address"
                  multiline={true}
                  value={institutionData.address}
                  onChangeText={(text: string) =>
                    setInstitutionData({ ...institutionData, address: text })
                  }
                />

                <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => fetchProfile()}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <ScaleButton style={styles.saveBtn} onPress={saveInstitutionInfo}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.saveBtnText}>Save Institution</Text>
                      </>
                    )}
                  </ScaleButton>
                </View>

                {/* Active Login Sessions */}
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <View style={styles.sectionIconBadge}>
                    <Ionicons name="desktop-outline" size={16} color={theme.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Active Login Sessions</Text>
                </View>

                <View style={styles.divider} />

                {sessions.length > 0 ? (
                  sessions.map((sess: any, idx: number) => {
                    const isCurrent = sess.isCurrent || idx === 0;
                    return (
                      <View
                        key={sess.id || idx}
                        style={[
                          styles.sessionCard,
                          isCurrent && styles.currentSessionCard,
                        ]}
                      >
                        <View style={styles.sessionHeaderRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons
                              name={sess.device?.toLowerCase().includes('mobile') ? 'hardware-chip-outline' : 'desktop-outline'}
                              size={18}
                              color={isCurrent ? '#10B981' : theme.text}
                            />
                            <Text style={styles.sessionDeviceText}>
                              {sess.device || sess.userAgent || 'Unknown Device'}
                            </Text>
                          </View>
                          {isCurrent && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>Current Session</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.sessionIpText}>
                          IP: {sess.ipAddress || sess.ip || 'N/A'}
                        </Text>
                        <Text style={styles.sessionActiveText}>
                          Last active: {sess.lastActive ? new Date(sess.lastActive).toLocaleString('en-GB') : 'Just now'}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noSessionsText}>No active sessions found.</Text>
                )}
              </>
            ) : isTeacher ? (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBadge}>
                    <Ionicons name="briefcase-outline" size={16} color={theme.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Professional Information</Text>
                </View>

                <View style={styles.divider} />

                {/* Read-only Employee ID */}
                <View style={styles.fieldContainer}>
                  <View style={styles.labelRow}>
                    <Ionicons name="card-outline" size={13} color={theme.primary} />
                    <Text style={styles.labelText}>Employee ID</Text>
                    <View style={styles.lockedBadge}>
                      <Ionicons name="lock-closed" size={10} color={theme.subtext} />
                      <Text style={styles.lockedText}>Locked</Text>
                    </View>
                  </View>
                  <View style={styles.staticFieldWrapper}>
                    <Ionicons name="barcode" size={16} color={theme.subtext} style={{ marginRight: 10 }} />
                    <Text style={styles.staticFieldText}>{profData.employeeId || 'EMP2023-12A'}</Text>
                  </View>
                </View>

                <InputField
                  label="Highest Qualification"
                  labelIcon="school-outline"
                  inputIcon="school"
                  placeholder="e.g. M.Sc, Ph.D, B.Ed"
                  value={profData.qualification}
                  onChangeText={(text: string) =>
                    setProfData({ ...profData, qualification: text })
                  }
                />

                <InputField
                  label="Department"
                  labelIcon="business-outline"
                  inputIcon="business"
                  placeholder="e.g. Science, Mathematics"
                  value={profData.department}
                  onChangeText={(text: string) =>
                    setProfData({ ...profData, department: text })
                  }
                />

                {/* Read-only Designation */}
                <View style={styles.fieldContainer}>
                  <View style={styles.labelRow}>
                    <Ionicons name="ribbon-outline" size={13} color={theme.primary} />
                    <Text style={styles.labelText}>Designation</Text>
                    <View style={styles.lockedBadge}>
                      <Ionicons name="lock-closed" size={10} color={theme.subtext} />
                      <Text style={styles.lockedText}>Locked</Text>
                    </View>
                  </View>
                  <View style={styles.staticFieldWrapper}>
                    <Ionicons name="ribbon" size={16} color={theme.subtext} style={{ marginRight: 10 }} />
                    <Text style={styles.staticFieldText}>{profData.designation || 'Senior Teacher'}</Text>
                  </View>
                </View>

                <InputField
                  label="Specialization"
                  labelIcon="star-outline"
                  inputIcon="star"
                  placeholder="e.g. Organic Chemistry, Physics"
                  value={profData.specialization}
                  onChangeText={(text: string) =>
                    setProfData({ ...profData, specialization: text })
                  }
                />

                <InputField
                  label="Date of Joining"
                  labelIcon="calendar-outline"
                  inputIcon="calendar"
                  placeholder="DD/MM/YYYY"
                  value={profData.joiningDate}
                  rightIcon="calendar"
                  onRightIconPress={() => setShowCalendar(true)}
                  onChangeText={(text: string) =>
                    setProfData({ ...profData, joiningDate: text })
                  }
                />

                <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => fetchProfile()}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <ScaleButton style={styles.saveBtn} onPress={saveProfDetails}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.saveBtnText}>Save Professional Info</Text>
                      </>
                    )}
                  </ScaleButton>
                </View>
              </>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBadge}>
                    <Ionicons name="people-outline" size={16} color={theme.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Parent / Guardian Details</Text>
                </View>

                <View style={styles.divider} />

                <InputField
                  label="Parent / Guardian Name"
                  labelIcon="person-outline"
                  inputIcon="person"
                  placeholder="Enter Parent Name"
                  value={parentData.name}
                  onChangeText={(text: string) =>
                    setParentData({ ...parentData, name: text })
                  }
                />

                <InputField
                  label="Relationship"
                  labelIcon="heart-outline"
                  inputIcon="heart"
                  placeholder="Father / Mother / Guardian"
                  value={parentData.relationship}
                  onChangeText={(text: string) =>
                    setParentData({ ...parentData, relationship: text })
                  }
                />

                <InputField
                  label="Parent Email Address"
                  labelIcon="mail-outline"
                  inputIcon="mail"
                  placeholder="Enter Parent Email"
                  value={parentData.email}
                  onChangeText={(text: string) =>
                    setParentData({ ...parentData, email: text })
                  }
                />

                <InputField
                  label="Parent Phone Number"
                  labelIcon="call-outline"
                  inputIcon="call"
                  placeholder="Enter Parent Phone"
                  value={parentData.phone}
                  onChangeText={(text: string) =>
                    setParentData({ ...parentData, phone: text })
                  }
                />

                <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => fetchProfile()}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <ScaleButton style={styles.saveBtn} onPress={saveParentInfo}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.saveBtnText}>Save Parent Info</Text>
                      </>
                    )}
                  </ScaleButton>
                </View>

                {/* Emergency Contact Section */}
                <View style={[styles.sectionHeader, { marginTop: 28 }]}>
                  <View style={styles.sectionIconBadge}>
                    <Ionicons name="call-outline" size={16} color={theme.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Emergency Contact</Text>
                </View>

                <View style={styles.divider} />

                <InputField
                  label="Emergency Contact Name"
                  labelIcon="person-outline"
                  inputIcon="person"
                  placeholder="Enter emergency contact name"
                  value={emergencyData.name}
                  onChangeText={(text: string) =>
                    setEmergencyData({ ...emergencyData, name: text })
                  }
                />

                <InputField
                  label="Relationship"
                  labelIcon="heart-outline"
                  inputIcon="heart"
                  placeholder="e.g. Father / Mother / Sibling"
                  value={emergencyData.relationship}
                  onChangeText={(text: string) =>
                    setEmergencyData({ ...emergencyData, relationship: text })
                  }
                />

                <InputField
                  label="Emergency Email"
                  labelIcon="mail-outline"
                  inputIcon="mail"
                  placeholder="Enter emergency contact email"
                  value={emergencyData.email}
                  onChangeText={(text: string) =>
                    setEmergencyData({ ...emergencyData, email: text })
                  }
                />

                <InputField
                  label="Emergency Phone"
                  labelIcon="call-outline"
                  inputIcon="call"
                  placeholder="Enter emergency contact phone"
                  value={emergencyData.phone}
                  onChangeText={(text: string) =>
                    setEmergencyData({ ...emergencyData, phone: text })
                  }
                />

                <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => fetchProfile()}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <ScaleButton style={styles.saveBtn} onPress={saveEmergencyInfo}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.saveBtnText}>Save Emergency Contact</Text>
                      </>
                    )}
                  </ScaleButton>
                </View>
              </>
            )
          ) : activeTab === 'Bank Details' && isTeacher ? (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBadge}>
                  <Ionicons name="card-outline" size={16} color={theme.primary} />
                </View>
                <Text style={styles.sectionTitle}>Bank Account Details</Text>
              </View>

              <View style={styles.divider} />

              <InputField
                label="Account Number"
                labelIcon="card-outline"
                inputIcon="card"
                placeholder="Enter Bank Account Number"
                value={bankData.accountNumber}
                onChangeText={(text: string) =>
                  setBankData({ ...bankData, accountNumber: text })
                }
              />

              <InputField
                label="IFSC Code"
                labelIcon="barcode-outline"
                inputIcon="barcode"
                placeholder="e.g. SBIN0001234"
                value={bankData.ifscCode}
                onChangeText={(text: string) =>
                  setBankData({ ...bankData, ifscCode: text })
                }
              />

              <InputField
                label="Bank Name"
                labelIcon="business-outline"
                inputIcon="business"
                placeholder="e.g. State Bank of India"
                value={bankData.bankName}
                onChangeText={(text: string) =>
                  setBankData({ ...bankData, bankName: text })
                }
              />

              <InputField
                label="Branch Name"
                labelIcon="location-outline"
                inputIcon="location"
                placeholder="Enter Branch Name"
                value={bankData.branchName}
                onChangeText={(text: string) =>
                  setBankData({ ...bankData, branchName: text })
                }
              />

              <InputField
                label="UPI ID (Optional)"
                labelIcon="wallet-outline"
                inputIcon="wallet"
                placeholder="e.g. username@upi"
                value={bankData.upiId}
                onChangeText={(text: string) =>
                  setBankData({ ...bankData, upiId: text })
                }
              />

              <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => fetchProfile()}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <ScaleButton style={styles.saveBtn} onPress={saveBankDetails}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.saveBtnText}>Save Bank Details</Text>
                    </>
                  )}
                </ScaleButton>
              </View>
            </>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBadge}>
                  <Ionicons name="options-outline" size={16} color={theme.primary} />
                </View>
                <Text style={styles.sectionTitle}>Notification Preferences</Text>
              </View>

              <View style={styles.divider} />

              <PreferenceToggle
                title="Grade & Assessment Notifications"
                description="Receive instant push notifications when new grades or marks are published"
                value={gradeNotif}
                onValueChange={(val: boolean) => updatePreferences('grade', val)}
              />

              <PreferenceToggle
                title="Assignment & Homework Reminders"
                description="Get alerts for upcoming assignment due dates and pending submissions"
                value={assignNotif}
                onValueChange={(val: boolean) => updatePreferences('assign', val)}
              />

              <PreferenceToggle
                title="Class Announcements & Schedule Changes"
                description="Stay updated with official institution notices and timetable revisions"
                value={classNotif}
                onValueChange={(val: boolean) => updatePreferences('class', val)}
              />

              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <View style={styles.sectionIconBadge}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={theme.primary} />
                </View>
                <Text style={styles.sectionTitle}>Security & Credentials</Text>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.changePasswordCard}
                activeOpacity={0.8}
                onPress={() => setShowPasswordModal(true)}
              >
                <View style={styles.pwdCardLeft}>
                  <View style={styles.pwdIconBadge}>
                    <Ionicons name="lock-closed" size={18} color={theme.primary} />
                  </View>
                  <View>
                    <Text style={styles.pwdCardTitle}>Change Password</Text>
                    <Text style={styles.pwdCardSub}>Update your account security password</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Calendar Selection Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => {}}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <Text style={styles.calendarMonth}>December 2024</Text>
              <TouchableOpacity onPress={() => {}}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarDaysRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <Text key={idx} style={styles.calDayName}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {daysInMonth.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calDayBox,
                    selectedDate === day && styles.calDayActive,
                  ]}
                  onPress={() => {
                    setSelectedDate(day);
                    const formatted = `${String(day).padStart(2, '0')}/12/2024`;
                    if (activeTab === 'Personal Details') {
                      setProfileData(prev => ({ ...prev, dob: formatted }));
                    } else if (activeTab === secondaryTabTitle && isTeacher) {
                      setProfData(prev => ({ ...prev, joiningDate: formatted }));
                    }
                    setShowCalendar(false);
                  }}
                >
                  <Text
                    style={[
                      styles.calDayText,
                      selectedDate === day && styles.calDayTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModalContent}>
            {/* Header */}
            <View style={styles.pwdHeader}>
              <View style={styles.pwdHeaderIcon}>
                <Ionicons name="key" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.pwdHeaderTextContainer}>
                <Text style={styles.pwdHeaderTitle}>Change Password</Text>
                <Text style={styles.pwdHeaderSubtitle}>
                  Enter your current and new password
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
              {/* Requirements Box */}
              <View style={styles.pwdReqBox}>
                <View style={styles.pwdReqHeaderRow}>
                  <Ionicons
                    name="shield-checkmark"
                    size={14}
                    color={theme.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.pwdReqTitle}>Password Requirements</Text>
                </View>
                <View style={styles.pwdReqColumns}>
                  <View style={styles.pwdReqCol}>
                    <View style={styles.pwdReqRow}>
                      <Ionicons name="checkmark-circle" size={12} color={theme.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.pwdReqText}>At least 8 characters</Text>
                    </View>
                    <View style={styles.pwdReqRow}>
                      <Ionicons name="checkmark-circle" size={12} color={theme.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.pwdReqText}>One lowercase letter</Text>
                    </View>
                    <View style={styles.pwdReqRow}>
                      <Ionicons name="checkmark-circle" size={12} color={theme.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.pwdReqText}>One special character</Text>
                    </View>
                  </View>
                  <View style={styles.pwdReqCol}>
                    <View style={styles.pwdReqRow}>
                      <Ionicons name="checkmark-circle" size={12} color={theme.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.pwdReqText}>One uppercase letter</Text>
                    </View>
                    <View style={styles.pwdReqRow}>
                      <Ionicons name="checkmark-circle" size={12} color={theme.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.pwdReqText}>One number</Text>
                    </View>
                    <View style={styles.pwdReqRow}>
                      <Ionicons name="checkmark-circle" size={12} color={theme.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.pwdReqText}>Passwords must match</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Inputs */}
              <InputField
                label="Current Password"
                labelIcon="lock-closed-outline"
                inputIcon="key"
                placeholder="Enter current password"
                secureTextEntry={true}
                value={passwordData.currentPassword}
                onChangeText={(text: string) =>
                  setPasswordData(prev => ({ ...prev, currentPassword: text }))
                }
              />
              <InputField
                label="New Password"
                labelIcon="lock-closed-outline"
                inputIcon="lock-closed"
                placeholder="Enter new password"
                secureTextEntry={true}
                value={passwordData.newPassword}
                onChangeText={(text: string) =>
                  setPasswordData(prev => ({ ...prev, newPassword: text }))
                }
              />
              <InputField
                label="Confirm New Password"
                labelIcon="lock-closed-outline"
                inputIcon="lock-closed"
                placeholder="Re-enter new password"
                secureTextEntry={true}
                value={passwordData.confirmPassword}
                onChangeText={(text: string) =>
                  setPasswordData(prev => ({ ...prev, confirmPassword: text }))
                }
              />

              <View style={[styles.buttonsRow, { marginTop: 12, marginBottom: 20 }]}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowPasswordModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <ScaleButton style={styles.saveBtn} onPress={changePassword}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.saveBtnText}>Update Password</Text>
                    </>
                  )}
                </ScaleButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal Gated Behind Permissions */}
      <ImagePickerModal
        visible={isImagePickerModalOpen}
        onClose={() => setImagePickerModalOpen(false)}
        onImageSelected={handleSelectedAssetUpload}
        title="Update Profile Photo"
      />

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={(role as any) || 'student'}
      />
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },

  /* Untouched Global Header */
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: theme.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
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
  headerAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },

  /* Page Header Title */
  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 14 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  pageSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  /* Modernized Hero ID Card */
  heroCard: {
    backgroundColor: isDarkMode ? '#1E1B4B' : '#F5F3FF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.35)' : '#DDD6FE',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.08,
    shadowRadius: 10,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  heroAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroAvatarText: {
    color: theme.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  heroAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.primary,
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: isDarkMode ? '#1E1B4B' : '#F5F3FF',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  heroDetails: {
    fontSize: 12,
    color: theme.subtext,
    marginBottom: 8,
    fontWeight: '500',
  },
  heroStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
    marginRight: 6,
  },
  heroStatusText: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '700',
  },

  /* Form Container Card */
  formContainerCard: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.25 : 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
    paddingBottom: 24,
  },

  /* Segmented Navigation Tabs */
  tabsRowContainer: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    borderRadius: 16,
    margin: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 5,
    borderRadius: 13,
  },
  tabActive: {
    backgroundColor: theme.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.subtext,
  },
  tabTextActive: {
    color: theme.primary,
    fontWeight: '700',
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 16,
    marginHorizontal: 20,
  },

  /* Input Fields */
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
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    gap: 3,
  },
  lockedText: {
    fontSize: 10,
    color: theme.subtext,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#1E293B' : '#FAFAFA',
    paddingHorizontal: 12,
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  iconBoxContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  inputLeftIcon: {
    marginRight: 0,
  },
  textInput: {
    flex: 1,
    height: 46,
    color: theme.text,
    fontSize: 13,
    fontWeight: '500',
  },
  textInputMultiline: {
    height: 80,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  inputRightIcon: {
    marginLeft: 10,
  },

  /* Static Read-only Field */
  staticFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  staticFieldText: {
    fontSize: 13,
    color: theme.subtext,
    fontWeight: '600',
  },

  /* Preference Toggle Cards */
  toggleCard: {
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.border,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  toggleDesc: {
    fontSize: 12,
    color: theme.subtext,
    lineHeight: 16,
  },

  /* Buttons */
  buttonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    backgroundColor: theme.surface,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: theme.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Change Password Security Card */
  changePasswordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pwdCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pwdIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pwdCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  pwdCardSub: {
    fontSize: 11,
    color: theme.subtext,
    marginTop: 2,
  },

  /* Calendar Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  calendarModalContent: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text,
  },
  calendarDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calDayName: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: theme.subtext,
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
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  calDayText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '600',
  },
  calDayTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  closeModalBtn: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    alignItems: 'center',
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },

  /* Password Modal */
  passwordModalContent: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pwdHeader: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 48,
  },
  pwdHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    backgroundColor: theme.surface,
  },
  pwdReqBox: {
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: -32,
    marginBottom: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.2 : 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pwdReqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pwdReqTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
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
  pwdReqText: {
    fontSize: 11,
    color: theme.text,
    fontWeight: '600',
  },

  /* Sessions Styles */
  sessionCard: {
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentSessionCard: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sessionDeviceText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  currentBadge: {
    backgroundColor: '#10B981',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  sessionIpText: {
    fontSize: 12,
    color: theme.subtext,
    marginBottom: 4,
    fontWeight: '500',
  },
  sessionActiveText: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
  },
  noSessionsText: {
    fontSize: 13,
    color: theme.subtext,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default AccountSettingsScreen;