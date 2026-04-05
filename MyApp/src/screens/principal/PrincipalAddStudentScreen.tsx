import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';

const PrincipalAddStudentScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />

      {/* Top Standard Header */}
      <View style={styles.topHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={26} color="#111827" />
        </ScaleButton>

        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          Welcome back, Anurag
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnTransparent}><Ionicons name="notifications-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent} onPress={() => navigation.navigate('AccountSettings')}><Ionicons name="settings-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent}><Ionicons name="moon-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}><View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Blue Hero Box */}
        <View style={styles.heroSection}>
          <TouchableOpacity style={styles.backBtnWrapper} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Add Student</Text>
          <Text style={styles.heroSubtitle}>Register new students to the school system.</Text>
        </View>

        {/* Main Form Card */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.formCard}>
          
          {/* Section 1: Personal Information */}
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="ribbon-outline" size={20} color="#4F46E5" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Last name</Text>
              <TextInput style={styles.textInput} placeholder="Johnson" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Date of birth</Text>
              <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Gender</Text>
              <TextInput style={styles.textInput} placeholder="Select Gender" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.formColFull}>
            <Text style={styles.inputLabel}>Photo</Text>
            <View style={styles.uploadBox}>
              <View style={styles.uploadIconCircle}>
                <Ionicons name="cloud-upload-outline" size={24} color="#FFF" />
              </View>
              <Text style={styles.uploadMainText}>Drag and Drop your files here</Text>
              <Text style={styles.uploadSubText}>or click to browse</Text>
              <TouchableOpacity style={styles.browseBtn} activeOpacity={0.8}>
                <Ionicons name="push-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.browseBtnText}>Browse files</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 2: Contact Information */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Ionicons name="mail-outline" size={20} color="#4F46E5" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={styles.textInput} placeholder="Johnson" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.formColFull}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput style={styles.textInput} placeholder="Johnson" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Postal code</Text>
              <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Parent/Guardian Name</Text>
              <TextInput style={styles.textInput} placeholder="Johnson" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Parent Phone Number</Text>
              <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Parent Email</Text>
              <TextInput style={styles.textInput} placeholder="Johnson" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Relationship</Text>
              <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formCol}>
              {/* Empty col for spacing formatting as per design half width */}
            </View>
          </View>

          {/* Section 3: Emergency Contact Information */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Ionicons name="call-outline" size={20} color="#4F46E5" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Emergency Contact Information</Text>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Contact Name</Text>
              <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput style={styles.textInput} placeholder="Johnson" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Contact Email</Text>
              <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Relationship</Text>
              <TextInput style={styles.textInput} placeholder="Johnson" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          {/* Section 4: Academic Information */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Ionicons name="school-outline" size={20} color="#4F46E5" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Academic Information</Text>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Class</Text>
              <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Admission Number</Text>
              <TextInput style={styles.textInput} placeholder="Johnson" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Admission Date</Text>
              <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.formCol}>
              <Text style={styles.inputLabel}>Previous School</Text>
              <TextInput style={styles.textInput} placeholder="Johnson" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          {/* Section 5: Account & Invite */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Ionicons name="mail-outline" size={20} color="#4F46E5" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Account & Invite</Text>
          </View>

          <View style={styles.formColFull}>
            <Text style={styles.inputLabel}>Password (Optional)</Text>
            <TextInput style={styles.textInput} placeholder="Alex" placeholderTextColor="#9CA3AF" />
            <Text style={styles.helperText}>If left blank, a secure temporary password will be generated.</Text>
          </View>

          {/* Form Actions */}
          <View style={styles.formActionsRow}>
            <TouchableOpacity style={styles.clearBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={16} color="#6B7280" style={{ marginRight: 6 }} />
              <Text style={styles.clearBtnText}>Clear Form</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8}>
              <Text style={styles.submitBtnText}>+ Add Student</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, 
    paddingBottom: 16,
    backgroundColor: '#FFF',
    zIndex: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  menuHandle: { paddingRight: 4, paddingVertical: 8 }, 
  topHeaderTitle: { fontSize: 18, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#A78BFA',
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  heroSection: {
    backgroundColor: '#4F46E5', // vibrant blue/purple
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 24, // Space between hero and form card
  },
  backBtnWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  heroSubtitle: { color: '#E0E7FF', fontSize: 13, fontWeight: '400' },

  formCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 40,
  },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

  formRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  formCol: { flex: 1 },
  formColFull: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 8 },
  textInput: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#FFF',
  },

  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    marginTop: 4,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6', // vibrant blue
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadMainText: { fontSize: 13, fontWeight: '500', color: '#111827', marginBottom: 4 },
  uploadSubText: { fontSize: 12, color: '#9CA3AF', marginBottom: 20 },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,},
  browseBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  helperText: { fontSize: 11, color: '#6B7280', marginTop: 8 },

  formActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 32, gap: 12 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  clearBtnText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

});

export default PrincipalAddStudentScreen;
