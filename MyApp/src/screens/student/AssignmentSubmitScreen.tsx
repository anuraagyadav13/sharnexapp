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
  Image,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type AssignmentSubmitNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AssignmentSubmit'>;

interface Props {
  navigation: AssignmentSubmitNavigationProp;
  route?: any;
}

let DocumentPicker: any = null;
let DocumentPickerTypes: any = null;

const ensureDocumentPicker = () => {
  if (DocumentPicker && DocumentPickerTypes) return;
  try {
    const module = require('@react-native-documents/picker');
    DocumentPicker = module.default || module;
    DocumentPickerTypes = module.types || module.Types || DocumentPicker?.types || DocumentPicker?.Types || module;
  } catch (e) {
    console.error('DocumentPicker failed to load:', e);
  }
};

const AssignmentSubmitScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  const assignmentId = route?.params?.assignmentId;
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickFile = async () => {
    try {
      ensureDocumentPicker();
      if (!DocumentPicker || !DocumentPickerTypes) {
        Alert.alert('Error', 'File picker is not available on this device.');
        return;
      }
      const result = await DocumentPicker.pick({
        type: [DocumentPickerTypes.allFiles],
      });
      const file = Array.isArray(result) ? result[0] : result;
      setUploadedFiles([
        {
          uri: file.uri,
          name: file.name || 'document.pdf',
          type: file.type,
          size: file.size,
        },
      ]);
    } catch (err) {
      if (!DocumentPicker?.isCancel?.(err)) {
        console.error('Document picking error:', err);
      }
    }
  };

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await studentService.getAssignmentDetails(assignmentId);
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
      
      await studentService.submitAssignment(assignmentId, {
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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {/* Global Header */}
      <StudentHeader 
        title="Assignment Submission"
        navigation={navigation}
        isStackScreen={true}
      />

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
            <View style={{ padding: 16, backgroundColor: isDarkMode ? '#7F1D1D30' : '#FEE2E2', borderRadius: 12, marginHorizontal: 16 }}>
              <Text style={{ color: isDarkMode ? '#FCA5A5' : '#DC2626', fontWeight: '500' }}>{error}</Text>
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
              <Ionicons name="cloud-upload" size={22} color={theme.primary} />
              <Text style={styles.uploadCardTitle}>Upload Files</Text>
            </View>

            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={16} color={theme.subtext} style={{ marginRight: 6 }} />
              <Text style={styles.infoBannerText}>Maximum file size: 50 MB per file</Text>
            </View>

            <View style={styles.uploadDashedArea}>
              <Ionicons
                name="cloud-upload"
                size={54}
                color={theme.primary}
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.dragDropText}>Drag and Drop your files here</Text>
              <Text style={styles.orClickText}>or click the button below to browse files</Text>

              <ScaleButton style={styles.browseButton} activeOpacity={0.8} scaleTo={0.95} onPress={handlePickFile}>
                <MaterialCommunityIcons name="folder-upload" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.browseButtonText}>Browse files</Text>
              </ScaleButton>
            </View>

            {uploadedFiles.length > 0 && (
              <View style={{ marginTop: 16 }}>
                {uploadedFiles.map((file, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#1E293B' : '#F3F4F6', padding: 10, borderRadius: 8, marginBottom: 8, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name="document-text" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                      <Text style={{ color: theme.text, fontSize: 13, flex: 1 }} numberOfLines={1}>{file.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bottomButtonsRow}>
            <ScaleButton style={styles.saveDraftBtn} activeOpacity={0.7} scaleTo={0.95}>
              <MaterialCommunityIcons name="content-save" size={20} color={theme.primary} />
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

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: theme.surface,
  },
  globalHeaderTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.primary,
    marginRight: 'auto',
    marginLeft: 32,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  scrollContent: {
    paddingBottom: 40,
  },

  heroSection: {
    backgroundColor: theme.primary,
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
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text,
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
    color: theme.subtext,
    marginBottom: 6,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '600',
  },

  uploadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginLeft: 8,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDarkMode ? '#334155' : '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    marginBottom: 24,
  },
  infoBannerText: {
    fontSize: 13,
    color: theme.subtext,
    fontWeight: '400',
  },

  uploadDashedArea: {
    borderWidth: 1.5,
    borderColor: theme.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: theme.isDarkMode ? '#1E293B' : '#F8FAFC',
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragDropText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginTop: 8,
    marginBottom: 6,
  },
  orClickText: {
    fontSize: 13,
    color: theme.subtext,
    marginBottom: 24,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
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
    paddingHorizontal: 8,
  },
  saveDraftText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.primary,
    marginLeft: 6,
  },
  submitFinalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: theme.primary,
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
