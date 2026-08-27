import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { getCacheBustedUri } from '../../utils/image';
import principalService, {
  ClassItem,
  SubjectItem,
} from '../../services/principalService';

const EXAM_TYPE_OPTIONS = ['MIDTERM', 'FINAL', 'UNIT_TEST', 'QUARTERLY', 'HALF_YEARLY'];
const EXAM_STATUS_OPTIONS = ['DRAFT', 'ACTIVE', 'COMPLETED'];

interface SubjectMappingRow {
  subjectId: string;
  maxMarks: string;
  passMarks: string;
}

interface ClassMappingBlock {
  classId: string;
  subjects: SubjectMappingRow[];
}

export const PrincipalCreateExamScreen = ({ navigation, route }: any) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme, isDarkMode);

  // Check if route params contain examId (Edit mode)
  const examId = route?.params?.examId || null;
  const isEditMode = !!examId;

  // --- Form State ---
  const [examName, setExamName] = useState<string>('');
  const [examType, setExamType] = useState<string>('MIDTERM');
  const [academicYear, setAcademicYear] = useState<string>('2026');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<string>('DRAFT');

  const [classesMapping, setClassesMapping] = useState<ClassMappingBlock[]>([]);

  // --- Data & Modal State ---
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [subjectList, setSubjectList] = useState<SubjectItem[]>([]);

  // Active Dropdown Modal state
  const [activeModal, setActiveModal] = useState<{
    type: 'type' | 'status' | 'class' | 'subject';
    classIndex?: number;
    subjectIndex?: number;
  } | null>(null);

  // Load initial dropdown lists (Classes & Subjects) + Exam details if Edit mode
  const initData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classRes, subjRes] = await Promise.all([
        principalService.getClasses(),
        principalService.getSubjects(),
      ]);

      let classesData: ClassItem[] = [];
      const classObj = classRes?.data || classRes;
      if (classObj && (classObj as any).classes) {
        classesData = (classObj as any).classes;
      } else if (classObj && (classObj as any).data) {
        classesData = Array.isArray((classObj as any).data) ? (classObj as any).data : [(classObj as any).data];
      } else if (Array.isArray(classObj)) {
        classesData = classObj as any;
      }
      setClassList(classesData);

      let subjectsData: SubjectItem[] = [];
      if (subjRes && (subjRes as any).subjects) {
        subjectsData = (subjRes as any).subjects;
      } else if (subjRes && (subjRes as any).data) {
        subjectsData = Array.isArray((subjRes as any).data) ? (subjRes as any).data : [(subjRes as any).data];
      } else if (Array.isArray(subjRes)) {
        subjectsData = subjRes as any;
      }
      setSubjectList(subjectsData);

      // If Edit Mode, fetch existing exam details
      if (isEditMode && examId) {
        const examDetailRes = await principalService.getExamDetail(examId);
        const data = examDetailRes?.data;
        if (data) {
          setExamName(data.name || '');
          setExamType(data.examType || 'MIDTERM');
          setAcademicYear(data.academicYear || '2026');
          setDescription(data.description || '');
          setStatus(data.status || 'DRAFT');

          if (data.classes && Array.isArray(data.classes)) {
            const mapped = data.classes.map((cls) => ({
              classId: cls.classId,
              subjects: Array.isArray(cls.subjects)
                ? cls.subjects.map((s) => ({
                    subjectId: s.subjectId,
                    maxMarks: String(s.maxMarks ?? 100),
                    passMarks: String(s.passMarks ?? 33),
                  }))
                : [],
            }));
            setClassesMapping(mapped);
          }
        }
      }
    } catch (err: any) {
      console.error('[PrincipalCreateExamScreen] init error:', err);
      Alert.alert('Error', 'Failed to load initial configuration data.');
    } finally {
      setIsLoading(false);
    }
  }, [isEditMode, examId]);

  useEffect(() => {
    initData();
  }, [initData]);

  // --- Handlers for Participating Classes & Subjects ---
  const handleAddParticipatingClass = () => {
    setClassesMapping((prev) => [
      ...prev,
      {
        classId: '',
        subjects: [],
      },
    ]);
  };

  const handleRemoveClassBlock = (classIndex: number) => {
    setClassesMapping((prev) => prev.filter((_, idx) => idx !== classIndex));
  };

  const handleSelectClass = (classIndex: number, classId: string) => {
    setClassesMapping((prev) => {
      const copy = [...prev];
      copy[classIndex] = {
        ...copy[classIndex],
        classId,
      };
      return copy;
    });
  };

  const handleAddSubjectToClass = (classIndex: number) => {
    setClassesMapping((prev) => {
      const copy = [...prev];
      const target = copy[classIndex];
      target.subjects = [
        ...target.subjects,
        { subjectId: '', maxMarks: '100', passMarks: '33' },
      ];
      return copy;
    });
  };

  const handleSelectAllSubjectsForClass = (classIndex: number) => {
    if (subjectList.length === 0) {
      Alert.alert('No Subjects Available', 'There are no subjects in the system to select.');
      return;
    }
    setClassesMapping((prev) => {
      const copy = [...prev];
      const target = copy[classIndex];
      const allRows: SubjectMappingRow[] = subjectList.map((s) => ({
        subjectId: s.id,
        maxMarks: '100',
        passMarks: '33',
      }));
      target.subjects = allRows;
      return copy;
    });
  };

  const handleRemoveSubjectRow = (classIndex: number, subjectIndex: number) => {
    setClassesMapping((prev) => {
      const copy = [...prev];
      const target = copy[classIndex];
      target.subjects = target.subjects.filter((_, sIdx) => sIdx !== subjectIndex);
      return copy;
    });
  };

  const handleUpdateSubjectRow = (
    classIndex: number,
    subjectIndex: number,
    field: 'subjectId' | 'maxMarks' | 'passMarks',
    value: string
  ) => {
    setClassesMapping((prev) => {
      const copy = [...prev];
      const target = copy[classIndex];
      const rowCopy = { ...target.subjects[subjectIndex], [field]: value };
      target.subjects[subjectIndex] = rowCopy;
      return copy;
    });
  };

  // --- Form Submission ---
  const handleSubmit = async () => {
    if (!examName.trim()) {
      Alert.alert('Validation Error', 'Please enter an Exam Name.');
      return;
    }
    if (!academicYear.trim()) {
      Alert.alert('Validation Error', 'Please enter an Academic Year.');
      return;
    }

    if (classesMapping.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one participating class.');
      return;
    }

    for (let i = 0; i < classesMapping.length; i++) {
      const c = classesMapping[i];
      if (!c.classId) {
        Alert.alert('Validation Error', `Please select a class for Participating Class #${i + 1}.`);
        return;
      }
      if (c.subjects.length === 0) {
        Alert.alert('Validation Error', `Please add at least one subject to Class #${i + 1}.`);
        return;
      }
      for (let j = 0; j < c.subjects.length; j++) {
        const s = c.subjects[j];
        if (!s.subjectId) {
          Alert.alert('Validation Error', `Please select a subject for Row #${j + 1} in Class #${i + 1}.`);
          return;
        }
        const maxM = Number(s.maxMarks);
        const passM = Number(s.passMarks);
        if (isNaN(maxM) || maxM <= 0) {
          Alert.alert('Validation Error', `Max marks must be a positive number for Subject #${j + 1}.`);
          return;
        }
        if (isNaN(passM) || passM < 0 || passM > maxM) {
          Alert.alert('Validation Error', `Pass marks cannot exceed max marks for Subject #${j + 1}.`);
          return;
        }
      }
    }

    const payload = {
      name: examName.trim(),
      examType,
      academicYear: academicYear.trim(),
      description: description.trim() || undefined,
      status,
      classes: classesMapping.map((c) => ({
        classId: c.classId,
        subjects: c.subjects.map((s) => ({
          subjectId: s.subjectId,
          maxMarks: Number(s.maxMarks),
          passMarks: Number(s.passMarks),
        })),
      })),
    };

    try {
      setIsSubmitting(true);
      if (isEditMode && examId) {
        const res = await principalService.updateExam(examId, payload);
        if (res && res.message && res.success === false) {
          Alert.alert('Update Blocked', res.message);
        } else {
          Alert.alert('Success', 'Exam configuration updated successfully.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      } else {
        const res = await principalService.createExam(payload);
        if (res && res.message && res.success === false) {
          Alert.alert('Creation Blocked', res.message);
        } else {
          Alert.alert('Success', 'Exam definition created successfully.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      }
    } catch (err: any) {
      console.error('[PrincipalCreateExamScreen] Submit error:', err);
      
      let msg = 'Unable to save exam configuration.';
      if (err?.response?.data) {
        const serverData = err.response.data;
        if (serverData.message) {
          msg = serverData.message;
        }
        if (serverData.errors) {
          const errDetails = typeof serverData.errors === 'object'
            ? Object.entries(serverData.errors)
                .map(([key, val]: [string, any]) => `${key}: ${val?._errors?.join(', ') || JSON.stringify(val)}`)
                .join('\n')
            : String(serverData.errors);
          msg += `\n\nValidation Details:\n${errDetails}`;
        }
      } else if (err?.message) {
        msg = err.message;
      }
      
      Alert.alert('Submission Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Shared Standard Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>
          {isEditMode ? 'Edit Exam' : 'Create Exam'}
        </Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
          accessibilityLabel="Account settings"
        >
          {authState.user?.photoUrl ? (
            <Image
              source={{ uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt) }}
              style={styles.headerAvatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sub-Header Container in Body */}
      <View style={styles.subHeaderContainer}>
        <Text style={styles.breadcrumbText}>
          RESULT MANAGEMENT &gt; {isEditMode ? `Edit: ${examName || 'Exam'}` : 'Create Exam'}
        </Text>
        <Text style={styles.headerSubtext}>
          {isEditMode
            ? `Modify configuration and mapping for ${examName || 'examination'}`
            : 'Define the academic scope and rules for this examination.'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading exam configuration...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollBodyContent}>
          {/* Card 1: General Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>General Information</Text>

            <View style={styles.formRow}>
              {/* Exam Name */}
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>EXAM NAME *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Annual Examination 2024"
                  placeholderTextColor={theme.subtext || '#94A3B8'}
                  value={examName}
                  onChangeText={setExamName}
                />
              </View>

              {/* Exam Type */}
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>EXAM TYPE *</Text>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setActiveModal({ type: 'type' })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectText}>{examType}</Text>
                  <Ionicons name="chevron-down" size={18} color={theme.subtext} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.formRow, { marginTop: 16 }]}>
              {/* Academic Year */}
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>ACADEMIC YEAR *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="2026"
                  placeholderTextColor={theme.subtext || '#94A3B8'}
                  value={academicYear}
                  onChangeText={setAcademicYear}
                  keyboardType="numeric"
                />
              </View>

              {/* Status */}
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>STATUS *</Text>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setActiveModal({ type: 'status' })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectText}>
                    {!isEditMode
                      ? status === 'DRAFT'
                        ? 'Save as Draft'
                        : 'Activate Immediately'
                      : status}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={theme.subtext} />
                </TouchableOpacity>
              </View>
            </View>

            {!isEditMode && (
              <Text style={styles.statusHintText}>
                Draft exams are hidden from teachers. Active exams are open for marks entry.
              </Text>
            )}

            {/* Description */}
            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <Text style={styles.fieldLabel}>DESCRIPTION</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Optional notes or context"
                placeholderTextColor={theme.subtext || '#94A3B8'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Card 2: Academic Mapping */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Academic Mapping</Text>
              <TouchableOpacity
                style={styles.addClassLinkBtn}
                onPress={handleAddParticipatingClass}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#7C3AED" />
                <Text style={styles.addClassLinkText}>Add Participating Class</Text>
              </TouchableOpacity>
            </View>

            {classesMapping.length === 0 ? (
              <View style={styles.emptyClassBox}>
                <Text style={styles.emptyClassText}>
                  No participating classes added yet. Click "+ Add Participating Class" above to start mapping.
                </Text>
              </View>
            ) : (
              classesMapping.map((classBlock, cIdx) => {
                const selectedClass = classList.find((c) => c.id === classBlock.classId);

                return (
                  <View key={cIdx} style={styles.classBlockCard}>
                    {/* Participating Class Header */}
                    <View style={styles.classBlockHeader}>
                      <View style={styles.classSelectGroup}>
                        <Ionicons name="school-outline" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>PARTICIPATING CLASS</Text>
                          <TouchableOpacity
                            style={styles.selectBox}
                            onPress={() => setActiveModal({ type: 'class', classIndex: cIdx })}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.selectText}>
                              {selectedClass
                                ? `${selectedClass.name} ${selectedClass.section ? '(' + selectedClass.section + ')' : ''}`
                                : '-- Select Class --'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color={theme.subtext} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveClassBlock(cIdx)}
                        style={styles.deleteBlockBtn}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Subject Mapping Table */}
                    <View style={styles.subjectTableContainer}>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>SUBJECT</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>MAX MARKS</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>PASS MARKS</Text>
                        <View style={{ width: 32 }} />
                      </View>

                      {classBlock.subjects.map((subjRow, sIdx) => {
                        const selectedSubj = subjectList.find((s) => s.id === subjRow.subjectId);

                        return (
                          <View key={sIdx} style={styles.tableBodyRow}>
                            {/* Subject Dropdown */}
                            <TouchableOpacity
                              style={[styles.tableSelectBox, { flex: 2 }]}
                              onPress={() => {
                                if (classBlock.classId) {
                                  setActiveModal({
                                    type: 'subject',
                                    classIndex: cIdx,
                                    subjectIndex: sIdx,
                                  });
                                } else {
                                  Alert.alert('Select Class First', 'Please select a participating class before picking a subject.');
                                }
                              }}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.tableSelectText}>
                                {!classBlock.classId
                                  ? '-- Select Class First --'
                                  : selectedSubj
                                  ? `${selectedSubj.name} ${selectedSubj.code ? '(' + selectedSubj.code + ')' : '(No Code)'}`
                                  : '-- Select Subject --'}
                              </Text>
                              <Ionicons name="chevron-down" size={14} color={theme.subtext} />
                            </TouchableOpacity>

                            {/* Max Marks */}
                            <TextInput
                              style={[styles.tableInput, { flex: 1 }]}
                              value={subjRow.maxMarks}
                              onChangeText={(val) => handleUpdateSubjectRow(cIdx, sIdx, 'maxMarks', val)}
                              keyboardType="numeric"
                            />

                            {/* Pass Marks */}
                            <TextInput
                              style={[styles.tableInput, { flex: 1 }]}
                              value={subjRow.passMarks}
                              onChangeText={(val) => handleUpdateSubjectRow(cIdx, sIdx, 'passMarks', val)}
                              keyboardType="numeric"
                            />

                            {/* Remove Subject */}
                            <TouchableOpacity
                              onPress={() => handleRemoveSubjectRow(cIdx, sIdx)}
                              style={styles.deleteSubjBtn}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        );
                      })}

                      {/* Subject Actions Bar */}
                      <View style={styles.subjActionsRow}>
                        <TouchableOpacity
                          style={styles.addSubjBtn}
                          onPress={() => handleAddSubjectToClass(cIdx)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add" size={14} color="#7C3AED" />
                          <Text style={styles.addSubjBtnText}>Add Subject to Class</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.selectAllBtn}
                          onPress={() => handleSelectAllSubjectsForClass(cIdx)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                          <Text style={styles.selectAllBtnText}>Select All Subjects</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Form Footer Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Save Changes' : 'Create Exam Definition'}
                  </Text>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Selector Modal for Type / Status / Class / Subject */}
      <Modal
        visible={!!activeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>
              {activeModal?.type === 'type'
                ? 'Select Exam Type'
                : activeModal?.type === 'status'
                ? 'Select Status'
                : activeModal?.type === 'class'
                ? 'Select Participating Class'
                : 'Select Subject'}
            </Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {activeModal?.type === 'type' &&
                EXAM_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.dropdownOption,
                      examType === opt && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      setExamType(opt);
                      setActiveModal(null);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{opt}</Text>
                    {examType === opt && <Ionicons name="checkmark" size={18} color="#7C3AED" />}
                  </TouchableOpacity>
                ))}

              {activeModal?.type === 'status' &&
                (!isEditMode ? ['DRAFT', 'ACTIVE'] : EXAM_STATUS_OPTIONS).map((opt) => {
                  const label = !isEditMode
                    ? opt === 'DRAFT'
                      ? 'Save as Draft'
                      : 'Activate Immediately'
                    : opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.dropdownOption,
                        status === opt && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setStatus(opt);
                        setActiveModal(null);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{label}</Text>
                      {status === opt && <Ionicons name="checkmark" size={18} color="#7C3AED" />}
                    </TouchableOpacity>
                  );
                })}

              {activeModal?.type === 'class' &&
                classList.map((cls) => {
                  const cIdx = activeModal.classIndex!;
                  const isSelected = classesMapping[cIdx]?.classId === cls.id;

                  return (
                    <TouchableOpacity
                      key={cls.id}
                      style={[
                        styles.dropdownOption,
                        isSelected && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        handleSelectClass(cIdx, cls.id);
                        setActiveModal(null);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>
                        {cls.name} {cls.section ? `(${cls.section})` : ''}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={18} color="#7C3AED" />}
                    </TouchableOpacity>
                  );
                })}

              {activeModal?.type === 'subject' &&
                subjectList.map((subj) => {
                  const cIdx = activeModal.classIndex!;
                  const sIdx = activeModal.subjectIndex!;
                  const isSelected = classesMapping[cIdx]?.subjects[sIdx]?.subjectId === subj.id;

                  return (
                    <TouchableOpacity
                      key={subj.id}
                      style={[
                        styles.dropdownOption,
                        isSelected && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        handleUpdateSubjectRow(cIdx, sIdx, 'subjectId', subj.id);
                        setActiveModal(null);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>
                        {subj.name} {subj.code ? `(${subj.code})` : '(No Code)'}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={18} color="#7C3AED" />}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === 'ios' ? 50 : 30,
    },
    appHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerBtn: {
      padding: 4,
    },
    appHeaderTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#9F7AEA',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
      shadowColor: '#1E293B',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 6,
    },
    avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    headerAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginLeft: 4,
    },
    subHeaderContainer: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.background,
    },
    breadcrumbText: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.subtext || '#64748B',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    headerSubtext: {
      fontSize: 12,
      color: theme.subtext || '#64748B',
    },
    centerContainer: {
      paddingVertical: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.subtext || '#64748B',
    },
    scrollBody: {
      flex: 1,
    },
    scrollBodyContent: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
    },
    formRow: {
      flexDirection: 'row',
      gap: 12,
    },
    fieldGroup: {
      width: '100%',
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.subtext || '#64748B',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    textInput: {
      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 13,
      color: theme.text,
    },
    textArea: {
      minHeight: 60,
      textAlignVertical: 'top',
    },
    selectBox: {
      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    statusHintText: {
      fontSize: 11,
      color: theme.subtext || '#64748B',
      marginTop: 4,
      fontStyle: 'italic',
    },
    addClassLinkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addClassLinkText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#7C3AED',
    },
    emptyClassBox: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyClassText: {
      fontSize: 12,
      color: theme.subtext || '#64748B',
      textAlign: 'center',
    },
    classBlockCard: {
      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
      marginBottom: 14,
    },
    classBlockHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    classSelectGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    deleteBlockBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
    },
    subjectTableContainer: {
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 10,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: 6,
    },
    tableHeaderCell: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.subtext || '#64748B',
      letterSpacing: 0.5,
    },
    tableBodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    tableSelectBox: {
      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tableSelectText: {
      fontSize: 11,
      color: theme.text,
    },
    tableInput: {
      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 4,
      fontSize: 11,
      textAlign: 'center',
      color: theme.text,
    },
    deleteSubjBtn: {
      padding: 4,
    },
    subjActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#334155' : '#F1F5F9',
    },
    addSubjBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addSubjBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#7C3AED',
    },
    selectAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    selectAllBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#10B981',
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 8,
    },
    cancelButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cancelButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#CBD5E1' : '#475569',
    },
    submitButton: {
      backgroundColor: '#7C3AED',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    submitButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dropdownModalCard: {
      width: '100%',
      maxWidth: 440,
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
    },
    dropdownModalTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 10,
    },
    dropdownOption: {
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownOptionSelected: {
      backgroundColor: isDarkMode ? 'rgba(124, 58, 237, 0.2)' : '#F3E8FF',
    },
    dropdownOptionText: {
      fontSize: 13,
      color: theme.text,
    },
  });

export default PrincipalCreateExamScreen;
