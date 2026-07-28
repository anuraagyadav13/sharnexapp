import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Dimensions,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Toast, { ToastType } from '../../components/Toast';
import { useTheme } from '../../store/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Small helper: group classes by academic year for the picker
// ─────────────────────────────────────────────────────────────
const groupByYear = (classes: any[], currentClassYear?: string) => {
  const map: Record<string, any[]> = {};
  for (const cls of classes) {
    const year = cls.academicYear || cls.academic_year || 'Unknown';
    if (!map[year]) map[year] = [];
    map[year].push(cls);
  }
  return map;
};

// ─────────────────────────────────────────────────────────────
// Custom picker item component
// ─────────────────────────────────────────────────────────────
const ClassPickerDropdown = ({
  visible,
  classes,
  currentYear,
  selectedId,
  onSelect,
  onClose,
  theme,
  isDarkMode,
}: any) => {
  const styles = getStyles(theme, isDarkMode);
  const grouped = groupByYear(classes, currentYear);
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.pickerBackdrop} onPress={onClose}>
        <Pressable>
            <View style={styles.pickerDropdown}>
              <TouchableOpacity
                style={[styles.pickerItem, !selectedId && styles.pickerItemSelected]}
                onPress={() => { onSelect(null); onClose(); }}
              >
                <Text style={[styles.pickerItemText, !selectedId && styles.pickerItemTextSelected]}>
                  Select a class...
                </Text>
              </TouchableOpacity>
              {years.map((year) => (
                <View key={year}>
                  <View style={styles.pickerYearHeader}>
                    <Text style={styles.pickerYearText}>
                      {year}
                      {year === String(currentYear) ? ' ← current year' : ''}
                    </Text>
                  </View>
                  {grouped[year].map((cls: any) => (
                    <TouchableOpacity
                      key={cls.id}
                      style={[styles.pickerItem, styles.pickerItemIndented,
                        selectedId === cls.id && styles.pickerItemSelected]}
                      onPress={() => { onSelect(cls); onClose(); }}
                    >
                      <Text style={[styles.pickerItemText, selectedId === cls.id && styles.pickerItemTextSelected]}>
                        {cls.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────
// Promote Entire Class Modal (two-step)
// ─────────────────────────────────────────────────────────────
const PromoteModal = ({
  visible,
  onClose,
  classId,
  classDetails,
  students,
  allClasses,
  onSuccess,
  theme,
  isDarkMode,
  showToast,
}: any) => {
  const styles = getStyles(theme, isDarkMode);
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [rollStrategy, setRollStrategy] = useState<'alphabetical' | 'admission_date'>('alphabetical');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  const currentYear = classDetails?.academicYear || classDetails?.academic_year;
  const selectedYear = selectedClass?.academicYear || selectedClass?.academic_year;
  const isSameYear = currentYear && selectedYear && String(currentYear) === String(selectedYear);

  const activeStudents = students.filter(
    (s: any) => !s.isInactive && !s.is_inactive && s.status !== 'INACTIVE',
  );

  const reset = () => {
    setStep('select');
    setSelectedClass(null);
    setRollStrategy('alphabetical');
    setDropdownVisible(false);
    setIsPromoting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleNext = () => {
    if (!selectedClass) {
      showToast('Please select a target class', 'warning');
      return;
    }
    setStep('confirm');
  };

  const handlePromote = async () => {
    if (!selectedClass) return;
    setIsPromoting(true);
    try {
      await apiClient.post(`/classes/${classId}/promote-bulk`, {
        newClassId: selectedClass.id,
        rollNoStrategy: rollStrategy === 'alphabetical' ? 'alphabetical' : 'admission_date',
      });
      showToast('Class promoted successfully!', 'success');
      reset();
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Promotion failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {step === 'select' ? 'Promote Entire Class' : 'Confirm Promotion'}
                </Text>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>

              {step === 'select' ? (
                // ── STEP 1: Select class + roll strategy ──
                <>
                  <Text style={styles.inputLabel}>
                    Target Class <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>

                  {/* Fake Select */}
                  <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => setDropdownVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.selectBoxText, !selectedClass && { color: theme.subtext }]}>
                      {selectedClass ? selectedClass.name : 'Select a class...'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={theme.subtext} />
                  </TouchableOpacity>

                  {/* Same-year warning */}
                  {isSameYear && (
                    <View style={styles.warningBox}>
                      <Ionicons name="warning-outline" size={18} color="#F59E0B" style={{ marginRight: 8, marginTop: 1 }} />
                      <Text style={styles.warningText}>
                        <Text style={styles.warningBold}>Same academic year. </Text>
                        You are moving students to a class in the same academic year ({currentYear}). This is a lateral transfer, not a year-end promotion.
                      </Text>
                    </View>
                  )}

                  {/* Roll number strategy */}
                  <Text style={[styles.inputLabel, { marginTop: 18 }]}>Roll Number Assignment Strategy</Text>

                  <TouchableOpacity
                    style={styles.radioRow}
                    onPress={() => setRollStrategy('alphabetical')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioOuter, rollStrategy === 'alphabetical' && styles.radioOuterActive]}>
                      {rollStrategy === 'alphabetical' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>Alphabetical (by Student Name)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioRow}
                    onPress={() => setRollStrategy('admission_date')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioOuter, rollStrategy === 'admission_date' && styles.radioOuterActive]}>
                      {rollStrategy === 'admission_date' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>Admission Order (by Join Date)</Text>
                  </TouchableOpacity>

                  {/* Actions */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <ScaleButton
                      style={[styles.primaryBtn, !selectedClass && styles.primaryBtnDisabled]}
                      onPress={handleNext}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryBtnText}>Next</Text>
                    </ScaleButton>
                  </View>
                </>
              ) : (
                // ── STEP 2: Confirm ──
                <>
                  <View style={styles.confirmWarningBox}>
                    <Ionicons name="warning-outline" size={20} color="#F59E0B" style={{ marginRight: 10, marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.confirmWarningTitle}>Are you sure?</Text>
                      <Text style={styles.confirmWarningText}>
                        This action will permanently promote{' '}
                        <Text style={{ fontWeight: '800', color: theme.text }}>
                          {activeStudents.length > 0 ? activeStudents.length : students.length}
                        </Text>{' '}
                        active students to the new class. This is a bulk operation and cannot be easily undone.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('select')}>
                      <Text style={styles.cancelBtnText}>Back</Text>
                    </TouchableOpacity>
                    <ScaleButton
                      style={styles.primaryBtn}
                      onPress={handlePromote}
                      disabled={isPromoting}
                      activeOpacity={0.85}
                    >
                      {isPromoting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Yes, Promote Class</Text>
                      )}
                    </ScaleButton>
                  </View>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>

      {/* Dropdown rendered inside modal so it overlays everything */}
      <ClassPickerDropdown
        visible={dropdownVisible}
        classes={allClasses}
        currentYear={currentYear}
        selectedId={selectedClass?.id}
        onSelect={setSelectedClass}
        onClose={() => setDropdownVisible(false)}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────
const PrincipalManageClassScreen = ({ navigation, route }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const { classId, className } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [classDetails, setClassDetails] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [promoteVisible, setPromoteVisible] = useState(false);

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  const fetchAllData = useCallback(async (refreshing = false) => {
    try {
      if (!refreshing) setIsLoading(true);

      const [detailsRes, studentsRes, classesRes] = await Promise.all([
        apiClient.get(`${ENDPOINTS.PRINCIPAL.CLASSES}/${classId}`),
        apiClient.get(`/classes/${classId}/students`),
        apiClient.get(ENDPOINTS.PRINCIPAL.CLASSES),
      ]);

      setClassDetails(detailsRes.data.data || detailsRes.data);
      setStudents(studentsRes.data.data || studentsRes.data || []);

      // Exclude the current class from the picker
      const classList: any[] = classesRes.data.data || classesRes.data || [];
      setAllClasses(classList.filter((c: any) => c.id !== classId));
    } catch (error) {
      console.error('Failed to fetch class details:', error);
      showToast('Failed to load class information', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAllData(true);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Manage {className}</Text>
        <TouchableOpacity style={styles.headerActionBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor={theme.primary}
          />
        }
      >
        {isLoading && !isRefreshing ? (
          <View style={{ padding: 20 }}>
            <Skeleton width="40%" height={28} borderRadius={8} style={{ marginBottom: 12 }} />
            <Skeleton width="80%" height={20} borderRadius={8} style={{ marginBottom: 20 }} />
            <Skeleton width="100%" height={52} borderRadius={14} style={{ marginBottom: 28 }} />
            <Skeleton width="30%" height={24} borderRadius={8} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={44} borderRadius={10} style={{ marginBottom: 4 }} />
            <Skeleton width="100%" height={68} borderRadius={10} />
          </View>
        ) : (
          <Animated.View entering={FadeInUp.springify()} style={styles.content}>
            {/* Class title */}
            <Text style={styles.classTitle}>
              {classDetails?.name || className}
            </Text>

            {/* Badge row */}
            <View style={styles.badgeRow}>
              <View style={[styles.infoBadge, { backgroundColor: isDarkMode ? '#6366F120' : '#EEF2FF' }]}>
                <Text style={[styles.badgeLabel, { color: '#6366F1' }]}>
                  Section: {classDetails?.section || 'F'}
                </Text>
              </View>
              <View style={[styles.infoBadge, { backgroundColor: isDarkMode ? '#8B5CF620' : '#F5F3FF' }]}>
                <Text style={[styles.badgeLabel, { color: '#8B5CF6' }]}>
                  Grade: {classDetails?.grade || '—'}
                </Text>
              </View>
              <View style={[styles.infoBadge, { backgroundColor: isDarkMode ? '#10B98120' : '#ECFDF5' }]}>
                <Text style={[styles.badgeLabel, { color: '#10B981' }]}>
                  Students: {students.length}
                </Text>
              </View>
              <View style={[styles.infoBadge, { backgroundColor: isDarkMode ? '#F59E0B20' : '#FFFBEB' }]}>
                <Text style={[styles.badgeLabel, { color: '#F59E0B' }]}>
                  Teacher: {classDetails?.teacher_name ? '1' : '0'}
                </Text>
              </View>
            </View>

            {/* Promote CTA */}
            <TouchableOpacity
              style={styles.promoteCta}
              activeOpacity={0.85}
              onPress={() => setPromoteVisible(true)}
            >
              <Ionicons name="arrow-up-circle-outline" size={20} color="#FFF" />
              <Text style={styles.promoteCtaText}>Promote Entire Class</Text>
            </TouchableOpacity>

            {/* Student List */}
            <Text style={styles.sectionTitle}>Student List</Text>

            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, { flex: 2 }]}>NAME</Text>
              <Text style={[styles.columnHeader, { flex: 1 }]}>ROLL NO</Text>
              <Text style={[styles.columnHeader, { flex: 1.4 }]}>ADMISSION DATE</Text>
            </View>

            <View style={styles.tableBody}>
              {students.length > 0 ? (
                students.map((student, index) => (
                  <View
                    key={student.id || index}
                    style={[
                      styles.tableRow,
                      index === students.length - 1 && styles.tableRowLast,
                    ]}
                  >
                    <Text style={[styles.rowName, { flex: 2 }]}>
                      {student.name}
                    </Text>
                    <Text style={[styles.rowText, { flex: 1 }]}>
                      {student.roll_number || student.rollNo || '—'}
                    </Text>
                    <Text style={[styles.rowDate, { flex: 1.4 }]}>
                      {student.admission_date
                        ? new Date(student.admission_date).toLocaleDateString()
                        : student.createdAt
                        ? new Date(student.createdAt).toLocaleDateString()
                        : '—'}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={36} color={theme.subtext} />
                  <Text style={styles.emptyText}>No students in this class</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Promote Modal */}
      <PromoteModal
        visible={promoteVisible}
        onClose={() => setPromoteVisible(false)}
        classId={classId}
        classDetails={classDetails}
        students={students}
        allClasses={allClasses}
        onSuccess={() => fetchAllData(true)}
        theme={theme}
        isDarkMode={isDarkMode}
        showToast={showToast}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    // ── Layout ──
    mainContainer: { flex: 1, backgroundColor: theme.background },
    container: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 48 },

    // ── Header ──
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 24) + 16,
      paddingBottom: 16,
      backgroundColor: theme.background,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 10,
    },
    headerActionBtn: { width: 40 },

    // ── Class title & badges ──
    classTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
      marginTop: 8,
      marginBottom: 14,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    infoBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    badgeLabel: { fontSize: 11, fontWeight: '800' },

    // ── Promote CTA button ──
    promoteCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: '#4F46E5',
      borderRadius: 14,
      paddingVertical: 15,
      marginBottom: 28,
    },
    promoteCtaText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },

    // ── Student table ──
    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 14,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: theme.border,
    },
    columnHeader: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.subtext,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    tableBody: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      alignItems: 'center',
    },
    tableRowLast: { borderBottomWidth: 0 },
    rowName: { fontSize: 14, fontWeight: '700', color: theme.text },
    rowText: { fontSize: 13, color: theme.text },
    rowDate: { fontSize: 13, color: theme.subtext },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 52,
      gap: 10,
    },
    emptyText: { color: theme.subtext, fontSize: 14, fontWeight: '600' },

    // ── Modal overlay / card ──
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
      paddingHorizontal: 0,
    },
    modalCard: {
      backgroundColor: isDarkMode ? '#1E2535' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },

    // ── Select box (fake picker) ──
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    selectBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#2A3245' : '#F1F5F9',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      height: 50,
      marginBottom: 12,
    },
    selectBoxText: {
      fontSize: 15,
      color: theme.text,
      flex: 1,
    },

    // ── Warning box ──
    warningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: isDarkMode ? '#2D1F00' : '#FFFBEB',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F59E0B55',
      padding: 14,
      marginBottom: 6,
    },
    warningText: {
      fontSize: 13,
      color: '#F59E0B',
      flex: 1,
      lineHeight: 19,
    },
    warningBold: {
      fontWeight: '800',
      color: '#F59E0B',
    },

    // ── Radio buttons ──
    radioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterActive: {
      borderColor: '#4F46E5',
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#4F46E5',
    },
    radioLabel: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },

    // ── Modal action buttons ──
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      justifyContent: 'flex-end',
    },
    cancelBtn: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#2A3245' : '#F1F5F9',
      borderWidth: 1,
      borderColor: theme.border,
    },
    cancelBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    primaryBtn: {
      flex: 1,
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor: '#4F46E5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnDisabled: {
      backgroundColor: isDarkMode ? '#3730A3AA' : '#C7D2FE',
    },
    primaryBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFF',
    },

    // ── Confirm warning box ──
    confirmWarningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: isDarkMode ? '#2D1F00' : '#FFFBEB',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#F59E0B55',
      padding: 16,
    },
    confirmWarningTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#F59E0B',
      marginBottom: 6,
    },
    confirmWarningText: {
      fontSize: 13,
      color: theme.subtext,
      lineHeight: 19,
    },

    // ── Picker dropdown ──
    pickerBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    pickerDropdown: {
      backgroundColor: isDarkMode ? '#1E2535' : '#FFFFFF',
      borderRadius: 16,
      overflow: 'hidden',
      maxHeight: SCREEN_WIDTH * 1.1,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pickerYearHeader: {
      backgroundColor: isDarkMode ? '#2A3245' : '#E2E8F0',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    pickerYearText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: 0.3,
    },
    pickerItem: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    pickerItemIndented: {
      paddingLeft: 24,
    },
    pickerItemSelected: {
      backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF',
    },
    pickerItemText: {
      fontSize: 14,
      color: theme.text,
    },
    pickerItemTextSelected: {
      fontWeight: '700',
      color: '#4F46E5',
    },
  });

export default PrincipalManageClassScreen;
