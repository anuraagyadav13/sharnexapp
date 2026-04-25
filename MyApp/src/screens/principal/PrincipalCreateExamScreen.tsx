import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PrincipalCreateExamScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('MIDTERM');
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!examName) {
      Alert.alert('Configuration Error', 'Please define an official title for the examination.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Mock API logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Examination definition has been published to the portal.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('System Error', 'Failed to synchronize exam definition with the institutional database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Global Header - Student Pattern */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#4F46E5" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Define Examination</Text>
        <View style={styles.headerRight}>
           <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}>
            <View style={styles.avatarHeader}>
              <Text style={styles.avatarTextHeader}>{authState.user?.name?.charAt(0) || 'A'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.pageHeader}>
            <Text style={styles.screenTitle}>Assessment Setup</Text>
            <Text style={styles.screenSubtitle}>Configure examination lifecycle, grading parameters, and academic scope.</Text>
          </View>

          <Animated.View entering={FadeInUp.duration(400)} style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Basic Configuration</Text>
            </View>

            <View style={styles.field}>
               <Text style={styles.label}>OFFICIAL EXAM TITLE</Text>
               <View style={styles.premiumInputBox}>
                  <MaterialCommunityIcons name="file-certificate-outline" size={20} color="#94A3B8" />
                  <TextInput 
                    style={styles.premiumInput} 
                    placeholder="e.g. Annual Final Term 2026" 
                    placeholderTextColor="#94A3B8"
                    value={examName}
                    onChangeText={setExamName}
                  />
               </View>
            </View>

            <View style={styles.inputRow}>
               <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>ASSESSMENT TYPE</Text>
                  <TouchableOpacity style={styles.picker}>
                     <Text style={styles.pickerText}>{examType}</Text>
                     <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                  </TouchableOpacity>
               </View>
               <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>ACADEMIC YEAR</Text>
                  <TextInput 
                    style={styles.premiumInputMinimal} 
                    value={academicYear}
                    onChangeText={setAcademicYear}
                  />
               </View>
            </View>

            <View style={styles.field}>
               <Text style={styles.label}>SCOPE & NOTES</Text>
               <TextInput 
                 style={[styles.premiumInputBox, styles.textArea]} 
                 placeholder="Define the scope or add specific instructions for staff..." 
                 placeholderTextColor="#94A3B8"
                 multiline
                 value={description}
                 onChangeText={setDescription}
               />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100)} style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Academic Mapping</Text>
               <Text style={styles.sectionSubtitleSmall}>Synchronize participative classes and result thresholds.</Text>
            </View>

            <TouchableOpacity style={styles.dashedBtn}>
               <Ionicons name="add-circle-outline" size={22} color="#4F46E5" />
               <Text style={styles.dashedBtnText}>Configure Participating Classes</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.footerActions}>
             <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.primarySubmitBtn, isSubmitting && { opacity: 0.7 }]} 
               onPress={handleCreate}
               disabled={isSubmitting}
             >
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Text style={styles.primarySubmitText}>Publish Definition</Text>
                    <Ionicons name="rocket-outline" size={20} color="#FFF" />
                  </>
                )}
             </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

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

  // Form Sections
  formSection: { paddingHorizontal: 20, marginTop: 32 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  sectionSubtitleSmall: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 4 },
  
  field: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 8 },
  premiumInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  premiumInput: { flex: 1, marginLeft: 12, fontSize: 14, color: '#1E293B', fontWeight: '600' },
  premiumInputMinimal: { backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 56, fontSize: 14, color: '#1E293B', fontWeight: '600', borderWidth: 1, borderColor: '#F1F5F9' },
  inputRow: { flexDirection: 'row', gap: 15 },
  textArea: { height: 120, alignItems: 'flex-start', paddingTop: 15 },
  
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#F1F5F9' },
  pickerText: { fontSize: 14, color: '#1E293B', fontWeight: '700' },

  dashedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF', height: 60, borderRadius: 18, borderStyle: 'dashed', borderWidth: 1, borderColor: '#4F46E5', gap: 10, marginTop: 10 },
  dashedBtnText: { color: '#4F46E5', fontSize: 14, fontWeight: '800' },

  // Footer
  footerActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginTop: 40 },
  secondaryBtn: { flex: 0.35, height: 56, borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  secondaryBtnText: { color: '#64748B', fontWeight: '700', fontSize: 15 },
  primarySubmitBtn: { flex: 1, backgroundColor: '#4F46E5', height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6, gap: 8 },
  primarySubmitText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});

export default PrincipalCreateExamScreen;
