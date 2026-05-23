import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type AssignmentSubmitNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AssignmentSubmit'>;

interface Props {
  navigation: AssignmentSubmitNavigationProp;
  route?: any;
}

const AssignmentSubmitScreen: React.FC<Props> = ({ navigation, route }) => {
  const { authState } = useAuth();
  const assignmentId = route?.params?.assignmentId;
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiClient.get(ENDPOINTS.STUDENT.ASSIGNMENT_DETAIL(assignmentId));
        const data = res.data.assignment || res.data.data || res.data || {};
        setAssignmentData(data);
      } catch (err: any) {
        console.error('Failed to fetch assignment details:', err);
        setError('Failed to load assignment details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (assignmentId) {
      fetchAssignmentDetails();
    }
  }, [assignmentId]);

  const handleSubmitAssignment = async () => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      Alert.alert('Error', 'Please upload at least one file before submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      const submissionFileUrl = uploadedFiles && uploadedFiles.length > 0 ? uploadedFiles[0].uri || uploadedFiles[0].url : null;
      
      // @ts-ignore
      await apiClient.post(ENDPOINTS.STUDENT.ASSIGNMENT_SUBMIT(assignmentId), {
        submissionFileUrl,
        submissionText: `Submitted via Mobile App at ${new Date().toLocaleString()}`,
        submittedAt: new Date().toISOString()
      });

      Alert.alert('Success', 'Assignment submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      console.error('Failed to submit assignment:', err);
      const errorMessage =
        err.response?.normalized?.message ||
        err.response?.data?.message ||
        'Failed to submit assignment. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <Text style={styles.globalHeaderTitle} numberOfLines={1}>Welcome back, {authState.user?.name?.split(' ')[0] || 'Student'}</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'S'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Blue Hero Header */}
        <View style={styles.heroSection}>
          <ScaleButton
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            scaleTo={0.9}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </ScaleButton>

          <Text style={styles.heroTitle}>Submit Assignment</Text>
          <Text style={styles.heroSubtitle}>Upload your required files and submit</Text>
        </View>

        <View style={styles.cardsContainer}>

          {isLoading ? (
            <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
          ) : error ? (
            <View style={{ padding: 16, backgroundColor: '#FEE2E2', borderRadius: 12 }}>
              <Text style={{ color: '#DC2626', fontWeight: '500' }}>{error}</Text>
            </View>
          ) : !assignmentData ? (
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#9CA3AF' }}>No assignment data found</Text>
          ) : (
            <>

          {/* Card 1: Assignment Information */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={[styles.card, styles.infoCard]}>
            <View style={styles.infoCardHeader}>
              <MaterialCommunityIcons name="clipboard-text" size={20} color="#3B82F6" />
              <Text style={styles.infoCardTitle}>{assignmentData?.title || 'Assignment'}</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>
                  {assignmentData?.due_date || assignmentData?.dueDate ? new Date(assignmentData.due_date || assignmentData.dueDate).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Time Remaining</Text>
                <Text style={[styles.infoValue, { color: '#EF4444' }]}>Calculating...</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Subject</Text>
                <Text style={styles.infoValue}>{assignmentData?.subject || 'N/A'}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{assignmentData?.status || 'Pending'}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Card 2: Upload Files */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.card}>
            <View style={styles.uploadCardHeader}>
              <Ionicons name="cloud-upload" size={22} color="#3B82F6" />
              <Text style={styles.uploadCardTitle}>Upload Files</Text>
            </View>

            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={16} color="#6B7280" style={{ marginRight: 6 }} />
              <Text style={styles.infoBannerText}>Maximum file size: 50 MB per file</Text>
            </View>

            <View style={styles.uploadDashedArea}>
              <Ionicons
                name="cloud-upload"
                size={54}
                color="#4F46E5"
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.dragDropText}>Drag and Drop your files here</Text>
              <Text style={styles.orClickText}>or click the button below to browse files</Text>

              <ScaleButton style={styles.browseButton} activeOpacity={0.8} scaleTo={0.95}>
                <MaterialCommunityIcons name="folder-upload" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.browseButtonText}>Browse files</Text>
              </ScaleButton>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bottomButtonsRow}>
            <ScaleButton style={styles.saveDraftBtn} activeOpacity={0.7} scaleTo={0.95}>
              <MaterialCommunityIcons name="content-save" size={20} color="#3B82F6" />
              <Text style={styles.saveDraftText}>Save As Draft</Text>
            </ScaleButton>

            <ScaleButton 
              style={[styles.submitFinalBtn, isSubmitting && { opacity: 0.7 }]} 
              activeOpacity={0.8} 
              scaleTo={0.95}
              disabled={isSubmitting}
              onPress={handleSubmitAssignment}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginRight: 8, transform: [{ rotate: '-45deg' }] }} />
                  <Text style={styles.submitFinalText}>Submit Assignment</Text>
                </>
              )}
            </ScaleButton>
          </Animated.View>

            </>
          )}
        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  globalHeaderTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginRight: 'auto',
    marginLeft: 32,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  scrollContent: {
    paddingBottom: 40,
  },

  heroSection: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },

  cardsContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    // Peak detailing premium shadow
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },

  infoCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#3B82F6',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 24,
  },
  infoCol: {
    width: '50%',
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },

  uploadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadCardTitle: {
    fontSize: 18,
    fontWeight: '800', // Making it as bold as the screenshot
    color: '#111827',
    marginLeft: 8,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5', // screenshot shows blue here
    marginBottom: 24,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },

  uploadDashedArea: {
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragDropText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    marginBottom: 6,
  },
  orClickText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8, // Light padding for touch target
  },
  saveDraftText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginLeft: 6,
  },
  submitFinalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitFinalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default AssignmentSubmitScreen;
