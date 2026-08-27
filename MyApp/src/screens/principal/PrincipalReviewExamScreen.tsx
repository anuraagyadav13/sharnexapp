import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { getCacheBustedUri } from '../../utils/image';
import principalService, { RmsExamDetail } from '../../services/principalService';
import MarksAuditModal from '../../components/MarksAuditModal';

export const PrincipalReviewExamScreen = ({ navigation, route }: any) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme, isDarkMode);

  const examId = route?.params?.examId;

  const [exam, setExam] = useState<RmsExamDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Audit modal state
  const [auditMarksId, setAuditMarksId] = useState<string | null>(null);

  const loadExamDetail = useCallback(async (isRefresh = false) => {
    if (!examId) {
      setError('Exam ID is missing.');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const res = await principalService.getExamDetail(examId);
      if (res && res.data) {
        setExam(res.data);
      } else {
        setError('Exam details not found.');
      }
    } catch (err: any) {
      console.error('[PrincipalReviewExamScreen] Error fetching exam:', err);
      setError(err?.message || 'Unable to fetch exam details.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [examId]);

  useEffect(() => {
    loadExamDetail();
  }, [loadExamDetail]);

  const handleDelete = () => {
    if (!exam) return;
    Alert.alert(
      'Delete Exam Definition',
      `Are you sure you want to delete "${exam.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const res = await principalService.deleteExam(exam.id);
              if (res && res.message && !res.success) {
                Alert.alert('Action Blocked', res.message);
              } else {
                Alert.alert('Success', 'Exam deleted successfully.', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              }
            } catch (err: any) {
              console.error('[PrincipalReviewExamScreen] Delete error:', err);
              const msg = err?.response?.data?.message || err?.message || 'Failed to delete exam.';
              Alert.alert('Cannot Delete Exam', msg);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const totalClasses = exam?.classes?.length || 0;
  const totalSubjectMappings =
    exam?.classes?.reduce((sum, c) => sum + (c.subjects?.length || 0), 0) || 0;

  const isSetupReady = totalClasses > 0 && totalSubjectMappings > 0 && exam?.status !== 'DRAFT';

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
        <Text style={styles.appHeaderTitle}>Exam Overview</Text>
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
          RESULT MANAGEMENT &gt; {exam?.name || 'Exam Detail'}
        </Text>
        <View style={styles.titleRow}>
          <Text style={styles.examTitleText}>{exam?.name || 'Loading Exam...'}</Text>
          {exam?.status ? (
            <View
              style={[
                styles.statusBadge,
                exam.status === 'DRAFT'
                  ? styles.statusBadgeDraft
                  : styles.statusBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  exam.status === 'DRAFT'
                    ? styles.statusTextDraft
                    : styles.statusTextActive,
                ]}
              >
                {exam.status}
              </Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          {exam && (
            <View style={styles.headerActionsRow}>
              <TouchableOpacity
                style={styles.editConfigBtn}
                onPress={() => navigation.navigate('PrincipalEditExam', { examId: exam.id })}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={14} color={theme.text} />
                <Text style={styles.editConfigBtnText}>Edit Config</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {exam ? (
          <Text style={styles.headerSubtext}>
            {exam.examType} | Academic Year: {exam.academicYear}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading exam overview...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadExamDetail()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollBodyContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadExamDetail(true)}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          {/* Summary Stat Cards */}
          <View style={styles.statCardsRow}>
            {/* Card 1: Participating Classes */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="school-outline" size={18} color={theme.subtext} />
                <Text style={styles.statLabel}>PARTICIPATING CLASSES</Text>
              </View>
              <Text style={styles.statVal}>{totalClasses}</Text>
              <Text style={styles.statSubtext}>Total academic grades involved</Text>
            </View>

            {/* Card 2: Subject Mappings */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="clipboard-outline" size={18} color={theme.subtext} />
                <Text style={styles.statLabel}>SUBJECT MAPPINGS</Text>
              </View>
              <Text style={styles.statVal}>{totalSubjectMappings}</Text>
              <Text style={styles.statSubtext}>Total class-subject unique entries</Text>
            </View>

            {/* Card 3: Setup Status */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="checkmark-circle-outline" size={18} color={theme.subtext} />
                <Text style={styles.statLabel}>SETUP STATUS</Text>
              </View>
              <Text
                style={[
                  styles.statValStatus,
                  isSetupReady ? styles.statusReadyText : styles.statusPendingText,
                ]}
              >
                {isSetupReady ? 'READY' : 'DRAFT'}
              </Text>
              <Text style={styles.statSubtext}>
                {isSetupReady
                  ? 'Academic configuration is complete'
                  : 'Configuration pending activation'}
              </Text>
            </View>
          </View>

          {/* Detailed Academic Mapping Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Detailed Academic Mapping</Text>

            {exam?.classes && exam.classes.length > 0 ? (
              exam.classes.map((clsMap, idx) => (
                <View key={clsMap.classId || idx} style={styles.classMappingCard}>
                  {/* Class Card Header */}
                  <View style={styles.classCardHeader}>
                    <View style={styles.classHeaderLeft}>
                      <View style={styles.capIconBox}>
                        <Ionicons name="school-outline" size={18} color={isDarkMode ? '#CBD5E1' : '#475569'} />
                      </View>
                      <View>
                        <Text style={styles.classNameTitle}>
                          {clsMap.className || `CLASS ${clsMap.classId}`}
                        </Text>
                        <Text style={styles.subjCountSubtext}>
                          {clsMap.subjects?.length || 0} SUBJECTS MAPPED
                        </Text>
                      </View>
                    </View>

                    <View style={styles.automatedBadge}>
                      <Text style={styles.automatedBadgeText}>Automated Grading</Text>
                    </View>
                  </View>

                  {/* Subject Grid */}
                  <View style={styles.subjectGrid}>
                    {clsMap.subjects && clsMap.subjects.length > 0 ? (
                      clsMap.subjects.map((subj, sIdx) => (
                        <View key={subj.subjectId || sIdx} style={styles.subjCard}>
                          <View style={styles.subjCardHeader}>
                            <Text style={styles.subjNameText}>
                              {subj.subjectName || `Subject ${subj.subjectId}`}
                            </Text>
                            <View style={styles.subjBadgeRow}>
                              <View style={styles.officialBadge}>
                                <Text style={styles.officialBadgeText}>OFFICIAL</Text>
                              </View>
                              <TouchableOpacity
                                style={styles.viewHistoryBtn}
                                onPress={() =>
                                  setAuditMarksId(
                                    subj.id || subj.marksId || subj.subjectId || `subject-${subj.subjectId}`
                                  )
                                }
                                activeOpacity={0.8}
                              >
                                <Text style={styles.viewHistoryBtnText}>View History</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.marksFooterRow}>
                            <View>
                              <Text style={styles.marksLabel}>MAX MARKS</Text>
                              <Text style={styles.marksValue}>
                                {Number(subj.maxMarks).toFixed(2)}
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.marksLabel}>PASS MARKS</Text>
                              <Text style={styles.marksValue}>
                                {Number(subj.passMarks).toFixed(2)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noSubjText}>No subjects mapped for this class.</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyMappingCard}>
                <Text style={styles.emptyMappingText}>
                  No academic class mappings found for this exam.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Reusable Marks Audit Modal Component */}
      <MarksAuditModal
        visible={!!auditMarksId}
        marksId={auditMarksId}
        onClose={() => setAuditMarksId(null)}
      />
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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    examTitleText: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    statusBadgeActive: {
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
    },
    statusBadgeDraft: {
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    statusTextActive: {
      color: '#10B981',
    },
    statusTextDraft: {
      color: '#F59E0B',
    },
    headerSubtext: {
      fontSize: 11,
      color: theme.subtext || '#64748B',
      marginTop: 2,
    },
    headerActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    editConfigBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
    },
    editConfigBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.text,
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
    },
    deleteBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#EF4444',
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
    errorBox: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDarkMode ? '#991B1B' : '#FCA5A5',
      alignItems: 'center',
      margin: 20,
    },
    errorText: {
      fontSize: 14,
      color: '#EF4444',
      textAlign: 'center',
      marginVertical: 10,
    },
    retryBtn: {
      backgroundColor: '#EF4444',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryBtnText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 13,
    },
    scrollBody: {
      flex: 1,
    },
    scrollBodyContent: {
      padding: 16,
      paddingBottom: 40,
    },
    statCardsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 6,
    },
    statLabel: {
      fontSize: 8,
      fontWeight: '800',
      color: theme.subtext || '#64748B',
      letterSpacing: 0.5,
    },
    statVal: {
      fontSize: 22,
      fontWeight: '900',
      color: theme.text,
    },
    statValStatus: {
      fontSize: 16,
      fontWeight: '900',
    },
    statusReadyText: {
      color: '#10B981',
    },
    statusPendingText: {
      color: '#F59E0B',
    },
    statSubtext: {
      fontSize: 10,
      color: theme.subtext || '#64748B',
      marginTop: 2,
    },
    sectionContainer: {
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 12,
    },
    classMappingCard: {
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      marginBottom: 16,
    },
    classCardHeader: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#F8FAFC',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    classHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    capIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    classNameTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: 0.5,
    },
    subjCountSubtext: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.subtext || '#64748B',
      letterSpacing: 0.5,
    },
    automatedBadge: {
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 16,
    },
    automatedBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#10B981',
    },
    subjectGrid: {
      padding: 12,
      gap: 10,
    },
    subjCard: {
      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.3)' : '#FAF9FF',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
    },
    subjCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    subjNameText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    subjBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    officialBadge: {
      backgroundColor: isDarkMode ? 'rgba(124, 58, 237, 0.2)' : '#F3E8FF',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    officialBadgeText: {
      fontSize: 9,
      fontWeight: '900',
      color: '#7C3AED',
    },
    viewHistoryBtn: {
      backgroundColor: isDarkMode ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(124, 58, 237, 0.4)' : '#DDD6FE',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    viewHistoryBtnText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#7C3AED',
    },
    marksFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    marksLabel: {
      fontSize: 8,
      fontWeight: '800',
      color: theme.subtext || '#94A3B8',
      letterSpacing: 0.5,
    },
    marksValue: {
      fontSize: 13,
      fontWeight: '800',
      color: isDarkMode ? '#CBD5E1' : '#334155',
      marginTop: 1,
    },
    noSubjText: {
      fontSize: 12,
      color: theme.subtext || '#64748B',
      fontStyle: 'italic',
    },
    emptyMappingCard: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyMappingText: {
      fontSize: 12,
      color: theme.subtext || '#64748B',
    },
  });

export default PrincipalReviewExamScreen;