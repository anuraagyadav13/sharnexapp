import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn, Layout, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { useTheme } from '../../store/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherReviewSubmission'>;

const TeacherReviewSubmissionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { examId, classId, examName, className } = route.params;
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles({ ...theme, isDarkMode });
  const { authState } = useAuth();
  
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[] | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.TEACHER.RMS_REVIEW_SUMMARY(examId, classId));
      setSummary(res.data.data || {});
    } catch (error) {
      console.error('Failed to fetch review summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'VERIFY SUBJECTS' },
    { id: 2, label: 'ANALYZE RESULTS' },
    { id: 3, label: 'OFFICIAL PUBLISH' },
  ];

  const subjects = summary?.subjects || [];
  const approvedCount = subjects.filter((s: any) => s.status === 'APPROVED').length;
  const totalSubjects = subjects.length || 1;
  const readinessPercent = Math.round((approvedCount / totalSubjects) * 100);

  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerateResults = async () => {
    try {
      setIsSubmitting(true);
      await apiClient.post('/rms/results/generate', { examId, classId });
      Alert.alert('Success', 'Results generated successfully for all students!');
      setIsGenerated(true);
      setCurrentStep(3);
    } catch (err: any) {
      console.error('Failed to generate results:', err);
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to generate results.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await apiClient.post('/rms/results/publish', { examId, classId, template: 'CLASSIC' });
      Alert.alert('Success', 'Examination results published with CLASSIC template!');
      navigation.goBack();
    } catch (err: any) {
      console.error('Failed to publish results:', err);
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to publish examination results.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      await apiClient.post(ENDPOINTS.TEACHER.RMS_REJECT, { examId, classId, reason: 'Returned for revision' });
      Alert.alert('Returned', 'Examination marks returned to faculty for revision.');
      navigation.goBack();
    } catch (err: any) {
      console.error('Failed to reject review:', err);
      Alert.alert('Error', err.message || 'Failed to return examination marks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecall = async () => {
    try {
      setIsSubmitting(true);
      await apiClient.post(ENDPOINTS.TEACHER.RMS_RECALL, { examId, classId });
      Alert.alert('Recalled', 'Marks submission recalled successfully.');
      navigation.goBack();
    } catch (err: any) {
      console.error('Failed to recall marks:', err);
      Alert.alert('Error', err.message || 'Failed to recall marks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAudit = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.TEACHER.RMS_AUDIT(examId || '1'));
      const logs = res.data?.data || res.data?.logs || res.data || [];
      setAuditLogs(Array.isArray(logs) ? logs : [{ action: 'Created', timestamp: new Date().toISOString(), user: 'Faculty' }]);
      setShowAuditModal(true);
    } catch (err: any) {
      console.error('Failed to fetch audit trail:', err);
      Alert.alert('Audit Trail', 'No previous audit modifications recorded for this examination.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Result Analysis Overview</Text>
      <Text style={styles.stepDesc}>Review subject performance metrics before final certification.</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{subjects.length}</Text>
          <Text style={styles.statLab}>TOTAL SUBJECTS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{approvedCount}</Text>
          <Text style={styles.statLab}>APPROVED</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{readinessPercent}%</Text>
          <Text style={styles.statLab}>READINESS</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>Subject Breakdown</Text>
      {subjects.map((sub: any, idx: number) => (
        <View key={sub.id || idx} style={styles.analysisCard}>
          <View style={styles.analysisHeader}>
            <Text style={styles.analysisSubName}>{sub.name}</Text>
            <Text style={[styles.analysisStatus, { color: sub.status === 'APPROVED' ? '#10B981' : '#F59E0B' }]}>
              {sub.status || 'PENDING'}
            </Text>
          </View>
          <View style={styles.analysisRow}>
            <Text style={styles.analysisMeta}>Teacher: {sub.teacherName || 'Assigned Faculty'}</Text>
            <Text style={styles.analysisMeta}>Average Score: {sub.avgScore ? `${sub.avgScore}%` : 'N/A'}</Text>
          </View>
        </View>
      ))}

      {readinessPercent === 100 ? (
        <TouchableOpacity 
          style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleGenerateResults}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionText}>GENERATE RESULTS (100% READY) →</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.disabledGenCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="alert-circle-outline" size={20} color={theme.subtext} />
          <Text style={[styles.disabledGenText, { color: theme.subtext }]}>
            All subject marksheets must be approved before results can be generated ({approvedCount}/{totalSubjects} approved).
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={[styles.publishWarningCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
        <Ionicons name="shield-checkmark" size={36} color={theme.primary} />
        <Text style={[styles.publishWarningTitle, { color: theme.text }]}>Official Certification & Publishing</Text>
        <Text style={[styles.publishWarningDesc, { color: theme.subtext }]}>
          Authorizing this examination will lock all subject marksheets for {className} and publish official report cards to students and parents using the <Text style={{ fontWeight: '700', color: theme.primary }}>CLASSIC</Text> template.
        </Text>
        <Text style={[styles.templateNote, { color: theme.subtext }]}>
          * Note: CBSE template support is reserved for upcoming curriculum release.
        </Text>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity 
          style={[styles.publishBtn, { backgroundColor: theme.primary }, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleApprove}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.publishBtnText}>PUBLISH RESULTS (CLASSIC)</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.rejectBtn} 
          onPress={handleReject}
          disabled={isSubmitting}
        >
          <Ionicons name="return-up-back" size={18} color="#EF4444" />
          <Text style={styles.rejectBtnText}>RETURN TO FACULTY FOR REVISION</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity style={styles.recallBtn} onPress={handleRecall} disabled={isSubmitting}>
            <Ionicons name="refresh" size={16} color="#F59E0B" />
            <Text style={styles.recallBtnText}>Recall Marks</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.auditBtn} onPress={handleViewAudit} disabled={isSubmitting}>
            <Ionicons name="document-text" size={16} color="#6B7280" />
            <Text style={styles.auditBtnText}>View Audit Trail</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Audit Modal */}
      <Modal visible={showAuditModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Examination Audit Trail</Text>
              <TouchableOpacity onPress={() => setShowAuditModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300, marginTop: 12 }}>
              {auditLogs && auditLogs.map((log, idx) => (
                <View key={idx} style={styles.logItem}>
                  <Text style={styles.logAction}>{log.action || 'Modification'}</Text>
                  <Text style={styles.logMeta}>By: {log.user || log.updatedBy || 'Faculty'} • {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Wizard Header */}
      <View style={styles.wizardHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.wizardTitle}>REVIEW SUBMISSION</Text>
            <Text style={styles.wizardSubtitle}>{className} / <Text style={{ color: '#9CA3AF' }}>{examName}</Text></Text>
          </View>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => setCurrentStep(2)}
          >
            <Text style={styles.actionBtnText}>ANALYZE RESULTS</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <TouchableOpacity style={styles.stepItem} onPress={() => setCurrentStep(step.id)}>
                <View style={[styles.stepCircle, currentStep === step.id && styles.activeStepCircle]}>
                  {currentStep > step.id ? (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepNumber, currentStep === step.id && styles.activeStepNumber]}>{step.id}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, currentStep === step.id && styles.activeStepLabel]}>{step.label}</Text>
              </TouchableOpacity>
              {index < steps.length - 1 && <View style={styles.stepConnector} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchSummary} />}
      >
        {currentStep === 1 ? (
          <View style={styles.layoutRow}>
            {/* Main Column: Subject List */}
            <View style={styles.subjectColumn}>
              {isLoading ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
              ) : subjects.length === 0 ? (
                <View style={styles.emptySubjects}>
                  <Ionicons name="documents-outline" size={48} color="#E5E7EB" />
                  <Text style={styles.emptyText}>No subjects submitted for review.</Text>
                </View>
              ) : (
                subjects.map((subject: any, index: number) => (
                  <Animated.View 
                    key={subject.id} 
                    entering={FadeInUp.delay(index * 100).springify()}
                    style={styles.subjectCard}
                  >
                    <View style={styles.subjectCardLeft}>
                      <View style={[styles.subjectStatusBadge, { backgroundColor: subject.status === 'APPROVED' ? '#ECFDF5' : '#FEF3C7' }]}>
                        <Text style={[styles.subjectStatusText, { color: subject.status === 'APPROVED' ? '#10B981' : '#F59E0B' }]}>
                          {subject.status || 'PENDING'}
                        </Text>
                      </View>
                      <Text style={styles.subjectNameText}>{subject.name}</Text>
                      <View style={styles.teacherInfo}>
                        <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.teacherName}>{subject.teacherName || 'Not Assigned'}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#E5E7EB" />
                  </Animated.View>
                ))
              )}
            </View>

            {/* Sidebar Column: Readiness Overview */}
            <View style={styles.readinessColumn}>
              <Animated.View entering={FadeIn.delay(300)} style={styles.readinessCard}>
                <Text style={styles.readinessCardTitle}>CLASS READINESS</Text>
                
                <View style={styles.circleProgressContainer}>
                  <View style={[styles.outerCircle, { borderColor: '#E5E7EB' }]}>
                    <View style={[styles.innerCircle, { borderColor: theme.primary }]}>
                      <Text style={styles.readinessValue}>{readinessPercent}%</Text>
                      <Text style={styles.readinessLabel}>APPROVED</Text>
                    </View>
                    {/* Decorative Progress Arc (Simplified) */}
                    <View style={styles.progressArc} />
                  </View>
                </View>

                <View style={styles.subjectsApprovalContainer}>
                  <View style={styles.approvalLabelRow}>
                    <Text style={styles.approvalLabel}>SUBJECTS APPROVED</Text>
                    <Text style={styles.approvalCount}>{approvedCount}/{totalSubjects}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${readinessPercent}%`, backgroundColor: '#10B981' }]} />
                  </View>
                </View>
              </Animated.View>
            </View>
          </View>
        ) : currentStep === 2 ? (
          renderStep2()
        ) : (
          renderStep3()
        )}
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 20 },

  wizardHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: { marginRight: 16 },
  headerTitleContainer: { flex: 1 },
  wizardTitle: { fontSize: 13, fontWeight: '800', color: theme.text, letterSpacing: 0.5 },
  wizardSubtitle: { fontSize: 11, fontWeight: '700', color: theme.primary, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.isDarkMode ? '#334155' : '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepCircle: { backgroundColor: '#3B82F6' },
  stepNumber: { fontSize: 11, fontWeight: '800', color: theme.subtext },
  activeStepNumber: { color: '#FFFFFF' },
  stepLabel: { fontSize: 10, fontWeight: '800', color: theme.subtext },
  activeStepLabel: { color: theme.text },
  stepConnector: {
    width: 30,
    height: 1,
    backgroundColor: theme.isDarkMode ? '#334155' : '#E5E7EB',
    marginHorizontal: 12,
  },

  layoutRow: {
    flexDirection: SCREEN_WIDTH > 768 ? 'row' : 'column-reverse',
    marginTop: 24,
    gap: 24,
  },
  subjectColumn: { flex: 1.6 },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  subjectCardLeft: { flex: 1 },
  subjectStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 10,
  },
  subjectStatusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  subjectNameText: { fontSize: 15, fontWeight: '800', color: theme.text, marginBottom: 4 },
  teacherInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teacherName: { fontSize: 11, fontWeight: '600', color: theme.subtext },

  readinessColumn: { flex: 1 },
  readinessCard: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  readinessCardTitle: { fontSize: 10, fontWeight: '800', color: theme.subtext, alignSelf: 'flex-start', marginBottom: 20 },
  
  circleProgressContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  outerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  readinessValue: { fontSize: 24, fontWeight: '900', color: theme.text },
  readinessLabel: { fontSize: 9, fontWeight: '800', color: '#10B981', marginTop: 2 },
  progressArc: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    borderColor: '#3B82F6',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },

  subjectsApprovalContainer: { width: '100%' },
  approvalLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  approvalLabel: { fontSize: 9, fontWeight: '800', color: '#3B82F6' },
  approvalCount: { fontSize: 11, fontWeight: '900', color: theme.text },
  progressBarBg: { height: 6, backgroundColor: theme.isDarkMode ? '#334155' : '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  emptySubjects: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 14, color: theme.subtext },

  stepContent: { padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' },
  stepTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 4 },
  stepDesc: { fontSize: 13, color: theme.subtext, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: theme.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900', color: '#7C3AED' },
  statLab: { fontSize: 10, fontWeight: '800', color: theme.subtext, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
  analysisCard: { backgroundColor: theme.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  analysisHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  analysisSubName: { fontSize: 15, fontWeight: '800', color: theme.text },
  analysisStatus: { fontSize: 12, fontWeight: '800' },
  analysisRow: { flexDirection: 'row', justifyContent: 'space-between' },
  analysisMeta: { fontSize: 12, color: theme.subtext, fontWeight: '500' },
  primaryActionBtn: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  primaryActionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  publishWarningCard: { backgroundColor: theme.isDarkMode ? '#312E8140' : '#F5F3FF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: theme.isDarkMode ? '#5B21B6' : '#DDD6FE', alignItems: 'center', marginBottom: 24 },
  publishWarningTitle: { fontSize: 18, fontWeight: '800', color: theme.isDarkMode ? '#DDD6FE' : '#5B21B6', marginTop: 12, marginBottom: 8 },
  publishWarningDesc: { fontSize: 13, color: theme.subtext, textAlign: 'center', lineHeight: 20 },
  templateNote: { fontSize: 11, fontStyle: 'italic', marginTop: 12, textAlign: 'center' },
  actionGrid: { gap: 12 },
  publishBtn: { flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  publishBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  rejectBtn: { flexDirection: 'row', backgroundColor: theme.isDarkMode ? '#7F1D1D40' : '#FEE2E2', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: theme.isDarkMode ? '#991B1B' : '#FECACA' },
  rejectBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 13 },
  secondaryActionsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  recallBtn: { flex: 1, flexDirection: 'row', backgroundColor: theme.isDarkMode ? '#78350F40' : '#FEF3C7', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
  recallBtnText: { color: '#D97706', fontWeight: '700', fontSize: 13 },
  auditBtn: { flex: 1, flexDirection: 'row', backgroundColor: theme.isDarkMode ? '#334155' : '#F3F4F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
  auditBtnText: { color: theme.text, fontWeight: '700', fontSize: 13 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 500 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
  logItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  logAction: { fontSize: 13, fontWeight: '700', color: theme.text },
  logMeta: { fontSize: 11, color: theme.subtext, marginTop: 2 },

  disabledGenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },
  disabledGenText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default TeacherReviewSubmissionScreen;
