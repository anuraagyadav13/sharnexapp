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
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Toast, { ToastType } from '../../components/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PrincipalEditClassScreen = ({ navigation, route }: any) => {
  const { classId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allAvailableSubjects, setAllAvailableSubjects] = useState<any[]>([]);
  
  // Selection Modals
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
  const [teacherPickerVisible, setTeacherPickerVisible] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  
  // Form State
  const [form, setForm] = useState({
    name: '',
    section: '',
    grade: '',
    academicYear: '',
    subjects: [] as any[],
  });
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType; onUndo?: () => void }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType = 'info', onUndo?: () => void) => {
    setToast({ visible: true, message, type, onUndo });
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [classRes, subjectsRes, staffRes, allSubsRes] = await Promise.all([
        apiClient.get(`${ENDPOINTS.PRINCIPAL.CLASSES}/${classId}`),
        apiClient.get(`/classes/${classId}/subjects`),
        apiClient.get(ENDPOINTS.PRINCIPAL.STAFF),
        apiClient.get('/subjects'),
      ]);

      const classData = classRes.data.data || classRes.data;
      const classSubjects = subjectsRes.data.classSubjects || [];
      const staffList = staffRes.data.data || staffRes.data.staff || staffRes.data || [];
      const availableSubjects = allSubsRes.data.subjects || [];

      setTeachers(Array.isArray(staffList) ? staffList : []);
      setAllAvailableSubjects(availableSubjects);
      setForm({
        name: classData.name || '',
        section: classData.section || '',
        grade: classData.grade || '',
        academicYear: classData.academicYear || '',
        subjects: classSubjects.map((s: any) => ({
          classSubjectId: s.id,
          subjectId: s.subject_id,
          name: s.subject_name || s.name,
          teacherId: s.teachers && s.teachers.length > 0 ? s.teachers[0].teacher_id : '',
          weeklyPeriods: s.weekly_periods || 1,
        })),
      });

    } catch (error) {
      console.error('Failed to fetch edit data:', error);
      showToast('Could not load class details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classId]);

  const handleUpdate = async () => {
    if (!form.name) {
      showToast('Class Name is a required field.', 'warning');
      return;
    }

    try {
      setIsUpdating(true);
      const payload = {
        name: form.name,
        section: form.section,
        grade: form.grade,
        academicYear: form.academicYear,
        subjects: form.subjects.map(s => ({
          classSubjectId: s.classSubjectId,
          subjectId: s.subjectId,
          teacherId: s.teacherId,
          weeklyPeriods: parseInt(s.weeklyPeriods, 10) || 0,
        })),
      };

      await apiClient.put(`${ENDPOINTS.PRINCIPAL.CLASSES}/${classId}`, payload);
      showToast('Class updated successfully.', 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      console.error('Update failed:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update class.';
      showToast(errorMsg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const addSubjectRow = () => {
    setForm({
      ...form,
      subjects: [...form.subjects, { name: 'Select Subject', subjectId: '', teacherId: '', weeklyPeriods: 1 }]
    });
  };

  const updateSubjectRow = (index: number, data: any) => {
    const newSubs = [...form.subjects];
    newSubs[index] = { ...newSubs[index], ...data };
    setForm({ ...form, subjects: newSubs });
  };

  const removeSubject = (index: number) => {
     const subToRemove = form.subjects[index];
     
     Alert.alert('Remove Subject', `Are you sure you want to remove ${subToRemove.name || 'this subject'} from the list?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
           const originalSubjects = [...form.subjects];
           const newSubs = [...form.subjects];
           newSubs.splice(index, 1);
           setForm({ ...form, subjects: newSubs });
           
           showToast(`Removed ${subToRemove.name || 'Subject'} locally.`, 'info', () => {
              setForm(prev => ({ ...prev, subjects: originalSubjects }));
           });
        }}
     ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading configuration...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.mainContainer}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" />
      
      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
          onUndo={toast.onUndo}
        />
      )}
      
      {/* Header */}
      <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#64748B" />
         </TouchableOpacity>
         <View style={styles.headerTitleContainer}>
            <Text style={styles.headerLabel}>CLASSES</Text>
            <Text style={styles.headerTitle}>Edit Class</Text>
         </View>
         <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.formCard}>
           {/* Basic Info */}
           <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Class Name *</Text>
              <TextInput 
                style={styles.premiumInput} 
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                placeholder="e.g. Class 1" 
                placeholderTextColor="#94A3B8" 
              />
           </View>

           <View style={styles.inputRow}>
              <View style={[styles.inputSection, { flex: 1 }]}>
                 <Text style={styles.inputLabel}>Section (optional)</Text>
                 <TextInput 
                   style={styles.premiumInput} 
                   value={form.section}
                   onChangeText={(text) => setForm({ ...form, section: text })}
                   placeholder="e.g. A, B, Morning" 
                   placeholderTextColor="#94A3B8" 
                 />
              </View>
              <View style={[styles.inputSection, { flex: 1 }]}>
                 <Text style={styles.inputLabel}>Grade (optional)</Text>
                 <TextInput 
                   style={styles.premiumInput} 
                   value={form.grade}
                   onChangeText={(text) => setForm({ ...form, grade: text })}
                   placeholder="e.g. 5, 10, 12" 
                   placeholderTextColor="#94A3B8" 
                 />
              </View>
           </View>

           <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Academic Year</Text>
              <TextInput 
                style={styles.premiumInput} 
                value={form.academicYear}
                onChangeText={(text) => setForm({ ...form, academicYear: text })}
                placeholder="2026" 
                placeholderTextColor="#94A3B8" 
              />
           </View>

           {/* Subjects Section */}
           <View style={styles.subjectsHeader}>
              <Text style={styles.subjectsTitle}>SUBJECTS & TEACHERS</Text>
              <TouchableOpacity onPress={addSubjectRow}>
                 <Text style={styles.addSubjectText}>+ Add Subject</Text>
              </TouchableOpacity>
           </View>

           <View style={styles.subjectsContainer}>
              {form.subjects.length > 0 ? (
                form.subjects.map((sub, index) => (
                  <View key={index} style={styles.subjectRow}>
                     <View style={styles.rowColumnLarge}>
                        <Text style={styles.rowLabel}>SUBJECT *</Text>
                        <TouchableOpacity 
                          style={styles.dropdownBox}
                          onPress={() => {
                            setActiveRowIndex(index);
                            setSubjectPickerVisible(true);
                          }}
                        >
                           <Text style={styles.dropdownText} numberOfLines={1}>{sub.name || 'Select'}</Text>
                           <Ionicons name="chevron-down" size={14} color="#94A3B8" />
                        </TouchableOpacity>
                     </View>

                     <View style={styles.rowColumnLarge}>
                        <Text style={styles.rowLabel}>TEACHER *</Text>
                        <TouchableOpacity 
                          style={styles.dropdownBox}
                          onPress={() => {
                            setActiveRowIndex(index);
                            setTeacherPickerVisible(true);
                          }}
                        >
                           <Text style={styles.dropdownText} numberOfLines={1}>
                              {teachers.find(t => t.id === sub.teacherId)?.name || 'Select'}
                           </Text>
                           <Ionicons name="chevron-down" size={14} color="#94A3B8" />
                        </TouchableOpacity>
                     </View>

                     <View style={styles.rowColumnSmall}>
                        <Text style={styles.rowLabel}>PERIODS *</Text>
                        <TextInput 
                          style={styles.periodsInputBox} 
                          value={String(sub.weeklyPeriods)}
                          onChangeText={(text) => {
                             const cleaned = text.replace(/[^0-9]/g, '');
                             updateSubjectRow(index, { weeklyPeriods: cleaned });
                          }}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                     </View>

                     <TouchableOpacity onPress={() => removeSubject(index)} style={styles.rowDeleteBtn}>
                        <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                     </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptySubjects}>
                   <Text style={styles.emptySubjectsText}>
                      No subjects added yet. Add subjects to define the academic structure.
                   </Text>
                </View>
              )}
           </View>

           {/* Footer Buttons */}
           <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => navigation.goBack()}
              >
                 <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, isUpdating && styles.submitBtnDisabled]} 
                onPress={handleUpdate}
                disabled={isUpdating}
              >
                 {isUpdating ? (
                   <ActivityIndicator size="small" color="#FFF" />
                 ) : (
                   <Text style={styles.submitBtnText}>Update Class</Text>
                 )}
              </TouchableOpacity>
           </View>
        </Animated.View>
      </ScrollView>

      {/* Subject Selection Modal */}
      <Modal visible={subjectPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Subject</Text>
              <TouchableOpacity onPress={() => setSubjectPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {allAvailableSubjects.map((s) => (
                <TouchableOpacity 
                  key={s.id} 
                  style={styles.pickerItem}
                  onPress={() => {
                    if (activeRowIndex !== null) {
                      updateSubjectRow(activeRowIndex, { subjectId: s.id, name: s.name });
                    }
                    setSubjectPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{s.name}</Text>
                  {s.code && <Text style={styles.pickerItemSub}>{s.code}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Teacher Selection Modal */}
      <Modal visible={teacherPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Assign Teacher</Text>
              <TouchableOpacity onPress={() => setTeacherPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              <TouchableOpacity 
                style={styles.removeAssignmentBtn}
                onPress={() => {
                  if (activeRowIndex !== null) updateSubjectRow(activeRowIndex, { teacherId: null });
                  setTeacherPickerVisible(false);
                }}
              >
                <Ionicons name="person-remove-outline" size={20} color="#EF4444" />
                <Text style={styles.removeAssignmentText}>Remove Assignment</Text>
              </TouchableOpacity>

              {teachers.length === 0 ? (
                <View style={styles.emptyTeachersBox}>
                   <Text style={styles.emptyTeachersText}>No teachers found</Text>
                </View>
              ) : (
                teachers.map((t, idx) => {
                  const isSelected = activeRowIndex !== null && form.subjects[activeRowIndex]?.teacherId === t.id;
                  return (
                    <TouchableOpacity 
                      key={t.id} 
                      style={[styles.teacherOption, isSelected && styles.teacherOptionActive]}
                      onPress={() => {
                        if (activeRowIndex !== null) {
                          updateSubjectRow(activeRowIndex, { teacherId: t.id });
                        }
                        setTeacherPickerVisible(false);
                      }}
                    >
                      <View style={styles.teacherIndexBox}>
                         <Text style={styles.teacherIndexText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.teacherDetails}>
                         <Text style={[styles.teacherNameText, isSelected && styles.teacherNameTextActive]}>
                            {t.name || (t.firstName ? `${t.firstName} ${t.lastName}` : 'Unknown Teacher')}
                         </Text>
                         <Text style={styles.teacherEmailText}>{t.email}</Text>
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
                      ) : (
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFF' },
  loadingText: { marginTop: 12, color: '#4F46E5', fontSize: 14, fontWeight: '600' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFAFF',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitleContainer: { flex: 1, marginLeft: 15 },
  headerLabel: { fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 1 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginTop: 2 },
  
  formCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 8 },
  
  inputSection: { marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 15 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  premiumInput: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, height: 52, fontSize: 14, color: '#1E293B', fontWeight: '600', borderWidth: 1, borderColor: '#E2E8F0' },
  
  subjectsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  subjectsTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  addSubjectText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  
  subjectsContainer: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, marginBottom: 25 },
  emptySubjects: { padding: 30, alignItems: 'center' },
  emptySubjectsText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18, fontWeight: '500' },
  
  pickerItemText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  pickerItemSub: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  // Aligned Row Styles
  subjectRow: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  rowColumnLarge: { flex: 2.5, marginRight: 8 },
  rowColumnSmall: { flex: 1.2, marginRight: 8 },
  rowLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8', marginBottom: 6, letterSpacing: 0.5 },
  dropdownBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  dropdownText: { fontSize: 11, fontWeight: '600', color: '#1E293B', flex: 1, marginRight: 4 },
  periodsInputBox: { height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#1E293B' },
  rowDeleteBtn: { height: 40, width: 30, justifyContent: 'center', alignItems: 'center' },
  
  footer: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 12, borderWeight: 1, borderColor: '#E2E8F0', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  submitBtn: { flex: 2, height: 50, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  submitBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  // Picker Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerModal: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '70%', padding: 20 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  pickerList: { flex: 1 },
  pickerItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  teacherOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#FFF' },
  teacherIndexBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  teacherIndexText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  teacherDetails: { flex: 1 },
  teacherNameText: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  teacherNameTextActive: { color: '#4F46E5' },
  teacherOptionActive: { borderColor: '#4F46E5', backgroundColor: '#F5F3FF' },
  teacherEmailText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  removeAssignmentBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 12, backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECACA', gap: 10 },
  removeAssignmentText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  emptyTeachersBox: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTeachersText: { fontSize: 14, color: '#94A3B8', fontWeight: '500', fontStyle: 'italic' },
});

export default PrincipalEditClassScreen;
