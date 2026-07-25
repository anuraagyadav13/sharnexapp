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
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import apiClient from '../../services/apiClient';
import principalService from '../../services/principalService';
import { ENDPOINTS } from '../../constants/api';
import Toast, { ToastType } from '../../components/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PrincipalEditClassScreen = ({ navigation, route }: any) => {
  const { classId, classData: paramClassData } = route.params;
  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [teachersBySubject, setTeachersBySubject] = useState<Record<string, any[]>>({});
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [allAvailableSubjects, setAllAvailableSubjects] = useState<any[]>([]);

  // Selection Modals
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
  const [teacherPickerVisible, setTeacherPickerVisible] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: paramClassData?.name || '',
    section: paramClassData?.section || '',
    grade: paramClassData?.grade || '',
    academicYear: paramClassData?.academicYear || '',
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
      const [classRes, subjectsRes, allSubsRes] = await Promise.all([
        apiClient.get(`${ENDPOINTS.PRINCIPAL.CLASSES}/${classId}`).catch(() => ({ data: null })),
        apiClient.get(`/classes/${classId}/subjects`).catch(() => ({ data: [] })),
        principalService.getSubjects().catch(() => ({ data: [] })),
      ]);

      const fetchedClassData = (classRes as any).data?.data || (classRes as any).data || paramClassData || {};
      const classSubjects = (subjectsRes as any).data?.classSubjects || (subjectsRes as any).data?.subjects || (subjectsRes as any).data?.data || (Array.isArray((subjectsRes as any).data) ? (subjectsRes as any).data : []);

      let availableSubjects = (allSubsRes as any).data?.subjects || (allSubsRes as any).data?.data || (Array.isArray((allSubsRes as any).data) ? (allSubsRes as any).data : []);
      if (!availableSubjects || availableSubjects.length === 0) {
        try {
          const fallbackSubs = await apiClient.get('/subjects');
          availableSubjects = fallbackSubs.data?.subjects || fallbackSubs.data?.data || (Array.isArray(fallbackSubs.data) ? fallbackSubs.data : []);
        } catch { }
      }

      setAllAvailableSubjects(Array.isArray(availableSubjects) ? availableSubjects : []);
      setForm({
        name: fetchedClassData.name || paramClassData?.name || '',
        section: fetchedClassData.section || paramClassData?.section || '',
        grade: fetchedClassData.grade || paramClassData?.grade || '',
        academicYear: fetchedClassData.academicYear || paramClassData?.academicYear || '',
        subjects: classSubjects.map((s: any) => {
          const sId = s.subject_id || s.subjectId || s.id;
          const tId = s.teachers && s.teachers.length > 0 ? (s.teachers[0].teacher_id || s.teachers[0].id) : (s.teacher_id || s.teacherId || '');
          const tName = s.teachers && s.teachers.length > 0 ? (s.teachers[0].teacher_name || s.teachers[0].name) : (s.teacher_name || s.teacherName || '');
          const sName = s.subject_name || s.subjectName || s.name || '';
          return {
            classSubjectId: s.id,
            subjectId: sId,
            name: sName,
            teacherId: tId,
            teacherName: tName,
            weeklyPeriods: s.weekly_periods || s.weeklyPeriods || s.periods || 1,
          };
        }),
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
    if (!form.name.trim()) {
      showToast('Class Name is a required field.', 'warning');
      return;
    }
    if (!form.section.trim()) {
      showToast('Section is a required field.', 'warning');
      return;
    }
    if (!form.academicYear.trim()) {
      showToast('Academic Year is a required field.', 'warning');
      return;
    }

    try {
      setIsUpdating(true);
      const payload = {
        name: form.name.trim(),
        section: form.section.trim(),
        grade: form.grade.trim(),
        academicYear: form.academicYear.trim(),
        subjects: form.subjects.map(s => ({
          classSubjectId: s.classSubjectId,
          subjectId: s.subjectId,
          teacherId: s.teacherId,
          weeklyPeriods: parseInt(s.weeklyPeriods, 10) || 0,
        })),
      };

      await principalService.updateClass(classId, payload as any);
      showToast('Class updated successfully.', 'success');
      setTimeout(() => navigation.goBack(), 1200);
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
      subjects: [...form.subjects, { name: 'Select Subject', subjectId: '', teacherId: '', teacherName: '', weeklyPeriods: 1 }]
    });
  };

  const updateSubjectRow = (index: number, data: any) => {
    const newSubs = [...form.subjects];
    newSubs[index] = { ...newSubs[index], ...data };
    setForm({ ...form, subjects: newSubs });
  };

  const removeSubject = (index: number) => {
    const newSubs = [...form.subjects];
    newSubs.splice(index, 1);
    setForm({ ...form, subjects: newSubs });
  };

  const handleOpenTeacherPicker = (index: number) => {
    setActiveRowIndex(index);
    setTeacherPickerVisible(true);

    const selectedSubject = form.subjects[index];
    const subjectId = selectedSubject?.subjectId;
    if (subjectId && !teachersBySubject[subjectId]) {
      setIsLoadingTeachers(true);
      apiClient.get(`/subjects/${subjectId}/teachers`)
        .then((res) => {
          const teacherList = res.data?.teachers || (Array.isArray(res.data) ? res.data : []);
          setTeachersBySubject(prev => ({ ...prev, [subjectId]: teacherList }));
        })
        .catch((err) => {
          console.error('Failed to fetch teachers for subject:', err);
          setTeachersBySubject(prev => ({ ...prev, [subjectId]: [] }));
        })
        .finally(() => {
          setIsLoadingTeachers(false);
        });
    }
  };

  const getDisplaySubjectName = (sub: any) => {
    if (sub.name && sub.name !== 'Select Subject' && sub.name !== 'Select') {
      return sub.name;
    }
    if (sub.subjectId) {
      const found = allAvailableSubjects.find(s => (s.id || s.subject_id || s.subjectId || s._id) === sub.subjectId);
      if (found) return found.name || found.subject_name || found.subjectName || 'Select';
    }
    return 'Select';
  };

  const getDisplayTeacherName = (sub: any) => {
    if (sub.teacherId) {
      const subjectTeachers = sub.subjectId ? (teachersBySubject[sub.subjectId] || []) : [];
      const found = subjectTeachers.find(t => (t.id || t.teacher_id || t.teacherId || t._id) === sub.teacherId);
      if (found) {
        return found.name || found.teacher_name || found.teacherName || (found.firstName ? `${found.firstName} ${found.lastName || ''}`.trim() : 'Select');
      }
    }
    return sub.teacherName || sub.teacher_name || 'Select';
  };

  const activeSubjectId = activeRowIndex !== null ? form.subjects[activeRowIndex]?.subjectId : null;
  const currentTeachers = activeSubjectId ? (teachersBySubject[activeSubjectId] || []) : [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading configuration...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.mainContainer}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

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
          <Ionicons name="close" size={24} color={theme.text} />
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
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputSection, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Section *</Text>
              <TextInput
                style={styles.premiumInput}
                value={form.section}
                onChangeText={(text) => setForm({ ...form, section: text })}
                placeholder="e.g. A, B, Morning"
                placeholderTextColor={theme.placeholder}
              />
            </View>
            <View style={[styles.inputSection, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Grade (optional)</Text>
              <TextInput
                style={styles.premiumInput}
                value={form.grade}
                onChangeText={(text) => setForm({ ...form, grade: text })}
                placeholder="e.g. 5, 10, 12"
                placeholderTextColor={theme.placeholder}
              />
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Academic Year *</Text>
            <TextInput
              style={styles.premiumInput}
              value={form.academicYear}
              onChangeText={(text) => setForm({ ...form, academicYear: text })}
              placeholder="2026"
              placeholderTextColor={theme.placeholder}
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
                      <Text style={styles.dropdownText} numberOfLines={1}>{getDisplaySubjectName(sub)}</Text>
                      <Ionicons name="chevron-down" size={14} color={theme.subtext} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.rowColumnLarge}>
                    <Text style={styles.rowLabel}>TEACHER *</Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => handleOpenTeacherPicker(index)}
                    >
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {getDisplayTeacherName(sub)}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={theme.subtext} />
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
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
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
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {allAvailableSubjects.map((s, sIdx) => {
                const sId = s.id || s.subject_id || s.subjectId || s._id || String(sIdx);
                const sName = s.name || s.subject_name || s.subjectName || 'Unnamed Subject';
                return (
                  <TouchableOpacity
                    key={sId}
                    style={styles.pickerItem}
                    onPress={() => {
                      if (activeRowIndex !== null) {
                        const currentSub = form.subjects[activeRowIndex];
                        if (currentSub?.subjectId !== sId) {
                          updateSubjectRow(activeRowIndex, { subjectId: sId, name: sName, teacherId: '', teacherName: '' });
                        } else {
                          updateSubjectRow(activeRowIndex, { subjectId: sId, name: sName });
                        }
                      }
                      setSubjectPickerVisible(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{sName}</Text>
                    {s.code && <Text style={styles.pickerItemSub}>{s.code}</Text>}
                  </TouchableOpacity>
                );
              })}
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
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              <TouchableOpacity
                style={styles.removeAssignmentBtn}
                onPress={() => {
                  if (activeRowIndex !== null) updateSubjectRow(activeRowIndex, { teacherId: null, teacherName: '' });
                  setTeacherPickerVisible(false);
                }}
              >
                <Ionicons name="person-remove-outline" size={20} color="#EF4444" />
                <Text style={styles.removeAssignmentText}>Remove Assignment</Text>
              </TouchableOpacity>

              {isLoadingTeachers ? (
                <View style={styles.emptyTeachersBox}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.emptyTeachersText, { marginTop: 10 }]}>Loading teachers...</Text>
                </View>
              ) : currentTeachers.length === 0 ? (
                <View style={styles.emptyTeachersBox}>
                  <Text style={styles.emptyTeachersText}>No teachers found</Text>
                </View>
              ) : (
                currentTeachers.map((t: any, idx: number) => {
                  const tId = t.id || t.teacher_id || t.teacherId || t._id;
                  const tName = t.name || t.teacher_name || t.teacherName || (t.firstName ? `${t.firstName} ${t.lastName || ''}`.trim() : 'Unknown Teacher');
                  const isSelected = activeRowIndex !== null && (form.subjects[activeRowIndex]?.teacherId === tId || form.subjects[activeRowIndex]?.teacherId === t.id);
                  return (
                    <TouchableOpacity
                      key={tId || idx}
                      style={[styles.teacherOption, isSelected && styles.teacherOptionActive]}
                      onPress={() => {
                        if (activeRowIndex !== null) {
                          updateSubjectRow(activeRowIndex, { teacherId: tId, teacherName: tName });
                        }
                        setTeacherPickerVisible(false);
                      }}
                    >
                      <View style={styles.teacherIndexBox}>
                        <Text style={styles.teacherIndexText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.teacherDetails}>
                        <Text style={[styles.teacherNameText, isSelected && styles.teacherNameTextActive]}>
                          {tName}
                        </Text>
                        {!!t.email && <Text style={styles.teacherEmailText}>{t.email}</Text>}
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                      ) : (
                        <Ionicons name="chevron-forward" size={16} color={theme.subtext} />
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

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  loadingText: { marginTop: 12, color: theme.primary, fontSize: 14, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: { flex: 1, marginLeft: 15 },
  headerLabel: { fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 1 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: theme.text, marginTop: 2 },

  formCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },

  inputSection: { marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 15 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8 },
  premiumInput: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 14,
    color: theme.text,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: theme.border,
  },

  subjectsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  subjectsTitle: { fontSize: 11, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5 },
  addSubjectText: { fontSize: 12, fontWeight: '700', color: theme.primary },

  subjectsContainer: {
    backgroundColor: theme.background,
    borderRadius: 16,
    padding: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptySubjects: { padding: 30, alignItems: 'center' },
  emptySubjectsText: { fontSize: 12, color: theme.subtext, textAlign: 'center', lineHeight: 18, fontWeight: '500' },

  pickerItemText: { fontSize: 15, fontWeight: '600', color: theme.text },
  pickerItemSub: { fontSize: 12, color: theme.subtext, fontWeight: '500' },

  // Aligned Row Styles
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rowColumnLarge: { flex: 2.5, marginRight: 8 },
  rowColumnSmall: { flex: 1.2, marginRight: 8 },
  rowLabel: { fontSize: 9, fontWeight: '800', color: theme.subtext, marginBottom: 6, letterSpacing: 0.5 },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  dropdownText: { fontSize: 13, fontWeight: '600', color: theme.text, flex: 1, marginRight: 4 },
  periodsInputBox: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  rowDeleteBtn: { height: 44, width: 34, justifyContent: 'center', alignItems: 'center' },

  footer: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderColor: theme.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
  },
  cancelBtnText: { color: theme.subtext, fontSize: 14, fontWeight: '700' },
  submitBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: { backgroundColor: theme.subtext, shadowOpacity: 0 },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  // Picker Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '70%',
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
  pickerList: { flex: 1 },
  pickerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  teacherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  teacherIndexBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teacherIndexText: { fontSize: 11, fontWeight: '800', color: theme.subtext },
  teacherDetails: { flex: 1 },
  teacherNameText: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 2 },
  teacherNameTextActive: { color: theme.primary },
  teacherOptionActive: { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
  teacherEmailText: { fontSize: 11, color: theme.subtext, fontWeight: '500' },
  removeAssignmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 10,
  },
  removeAssignmentText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  emptyTeachersBox: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTeachersText: { fontSize: 14, color: theme.subtext, fontWeight: '500', fontStyle: 'italic' },
});

export default PrincipalEditClassScreen;
