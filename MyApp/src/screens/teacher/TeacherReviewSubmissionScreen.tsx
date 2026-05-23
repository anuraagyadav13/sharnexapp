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
  const { theme } = useTheme();
  const { authState } = useAuth();
  
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

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
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, currentStep === step.id && styles.activeStepCircle]}>
                  {currentStep > step.id ? (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepNumber, currentStep === step.id && styles.activeStepNumber]}>{step.id}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, currentStep === step.id && styles.activeStepLabel]}>{step.label}</Text>
              </View>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 20 },

  wizardHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: { marginRight: 16 },
  headerTitleContainer: { flex: 1 },
  wizardTitle: { fontSize: 13, fontWeight: '800', color: '#1E1B4B', letterSpacing: 0.5 },
  wizardSubtitle: { fontSize: 11, fontWeight: '700', color: '#3B82F6', marginTop: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
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
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepCircle: { backgroundColor: '#3B82F6' },
  stepNumber: { fontSize: 11, fontWeight: '800', color: '#9CA3AF' },
  activeStepNumber: { color: '#FFFFFF' },
  stepLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF' },
  activeStepLabel: { color: '#1E1B4B' },
  stepConnector: {
    width: 30,
    height: 1,
    backgroundColor: '#E5E7EB',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
  subjectNameText: { fontSize: 15, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  teacherInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teacherName: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },

  readinessColumn: { flex: 1 },
  readinessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  readinessCardTitle: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', alignSelf: 'flex-start', marginBottom: 20 },
  
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
    // In a real app we'd use SVG for accurate arcs
  },
  readinessValue: { fontSize: 24, fontWeight: '900', color: '#1E1B4B' },
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
  approvalCount: { fontSize: 11, fontWeight: '900', color: '#1E1B4B' },
  progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  emptySubjects: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 14, color: '#9CA3AF' },
});

export default TeacherReviewSubmissionScreen;
