import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
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

type AssignmentSubmitNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AssignmentSubmit'
>;

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
    DocumentPickerTypes =
      module.types ||
      module.Types ||
      DocumentPicker?.types ||
      DocumentPicker?.Types ||
      module;
  } catch (e) {
    console.error('DocumentPicker failed to load:', e);
  }
};

const AssignmentSubmitScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const { authState } = useAuth();
  const assignmentId = route?.params?.assignmentId;
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [submissionText, setSubmissionText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
      if (!file) return;

      setIsUploading(true);
      setUploadError(null);

      // Construct multipart FormData per React Native convention
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        name: file.name || 'submission_file.pdf',
        type: file.type || 'application/octet-stream',
      } as any);
      formData.append('category', 'assignment-submissions');

      const uploadRes = await studentService.uploadFile(formData);
      const hostedUrl =
        uploadRes.data?.data?.fileUrl ||
        uploadRes.data?.fileUrl ||
        uploadRes.normalized?.data?.fileUrl;

      if (!hostedUrl) {
        throw new Error('Upload succeeded but server did not return a valid file URL.');
      }

      setUploadedFiles([
        {
          uri: file.uri,
          name: file.name || 'document.pdf',
          type: file.type,
          size: file.size,
          remoteUrl: hostedUrl,
        },
      ]);
    } catch (err: any) {
      if (!DocumentPicker?.isCancel?.(err)) {
        console.error('Document picking/upload error:', err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to upload file. Please try again.';
        setUploadError(errMsg);
        Alert.alert('Upload Failed', errMsg);
      }
    } finally {
      setIsUploading(false);
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
    if (isUploading) {
      Alert.alert('Upload in Progress', 'Please wait for your file to finish uploading.');
      return;
    }

    const trimmedText = submissionText.trim();
    const hasText = trimmedText.length > 0;
    const hasFile = uploadedFiles.length > 0 && !!uploadedFiles[0].remoteUrl;

    if (!hasText && !hasFile) {
      Alert.alert(
        'Incomplete Submission',
        'Please provide text submission or upload a file before submitting.',
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await studentService.submitAssignment(assignmentId, {
        submissionText: hasText ? trimmedText : null,
        submissionFileUrl: hasFile ? uploadedFiles[0].remoteUrl : null,
      });

      Alert.alert('Success', 'Assignment submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error('Failed to submit assignment:', err);
      const errorMessage =
        err.response?.normalized?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to submit assignment. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />

      <StudentHeader
        title="Assignment Submission"
        navigation={navigation}
        isStackScreen={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Blue Hero Header */}
        <View style={styles.heroSection}>
          <ScaleButton
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            scaleTo={0.9}
          >
            <Ionicons name="arrow-back" size={20} color={theme.onPrimary} />
          </ScaleButton>

          <Text style={styles.heroTitle}>Submit Assignment</Text>
          <Text style={styles.heroSubtitle}>
            Provide written answers, attach files, or both
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={{ marginTop: 40 }}
            />
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorCardText}>{error}</Text>
            </View>
          ) : !assignmentData ? (
            <Text style={styles.emptyText}>No assignment data found</Text>
          ) : (
            <>
              {/* Card 1: Assignment Information */}
              <Animated.View
                entering={FadeInUp.delay(100).springify()}
                style={[styles.card, styles.infoCard]}
              >
                <View style={styles.infoCardHeader}>
                  <MaterialCommunityIcons
                    name="clipboard-text"
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={styles.infoCardTitle}>
                    {assignmentData?.title || 'Assignment'}
                  </Text>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Due Date</Text>
                    <Text style={styles.infoValue}>
                      {assignmentData?.due_date || assignmentData?.dueDate
                        ? new Date(
                            assignmentData.due_date || assignmentData.dueDate,
                          ).toLocaleDateString()
                        : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Max Marks</Text>
                    <Text style={styles.infoValue}>
                      {assignmentData?.max_marks || assignmentData?.maxMarks || 'N/A'} pts
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Subject</Text>
                    <Text style={styles.infoValue}>
                      {assignmentData?.subject || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={styles.infoValue}>
                      {assignmentData?.status || 'Pending'}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Card 2: Written Submission Text */}
              <Animated.View
                entering={FadeInUp.delay(150).springify()}
                style={styles.card}
              >
                <View style={styles.uploadCardHeader}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={styles.uploadCardTitle}>Submission Text</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Type or paste your written answers/notes below:
                </Text>
                <TextInput
                  style={styles.textInput}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  placeholder="Enter your written submission or notes here..."
                  placeholderTextColor={theme.placeholder}
                  value={submissionText}
                  onChangeText={setSubmissionText}
                />
              </Animated.View>

              {/* Card 3: Upload Files */}
              <Animated.View
                entering={FadeInUp.delay(200).springify()}
                style={styles.card}
              >
                <View style={styles.uploadCardHeader}>
                  <Ionicons name="cloud-upload" size={22} color={theme.primary} />
                  <Text style={styles.uploadCardTitle}>Attach File</Text>
                </View>

                <View style={styles.infoBanner}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={theme.subtext}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.infoBannerText}>
                    Optional if submission text is provided. Max size: 50 MB
                  </Text>
                </View>

                <View style={styles.uploadDashedArea}>
                  {isUploading ? (
                    <View style={styles.uploadingContainer}>
                      <ActivityIndicator size="large" color={theme.primary} />
                      <Text style={styles.uploadingText}>
                        Uploading file to server...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons
                        name="cloud-upload"
                        size={50}
                        color={theme.primary}
                        style={{ marginBottom: 12 }}
                      />
                      <Text style={styles.dragDropText}>
                        Attach homework or document
                      </Text>
                      <Text style={styles.orClickText}>
                        PDF, Word, or image files supported
                      </Text>

                      <ScaleButton
                        style={styles.browseButton}
                        activeOpacity={0.8}
                        scaleTo={0.95}
                        onPress={handlePickFile}
                      >
                        <MaterialCommunityIcons
                          name="folder-upload"
                          size={18}
                          color={theme.onPrimary}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.browseButtonText}>Browse files</Text>
                      </ScaleButton>
                    </>
                  )}
                </View>

                {uploadError && (
                  <View style={styles.uploadErrorBox}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={16}
                      color={theme.danger}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.uploadErrorText}>{uploadError}</Text>
                  </View>
                )}

                {uploadedFiles.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    {uploadedFiles.map((file, index) => (
                      <View key={index} style={styles.fileRow}>
                        <View style={styles.fileInfoRow}>
                          <Ionicons
                            name="document-text"
                            size={20}
                            color={theme.primary}
                            style={{ marginRight: 8 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={styles.fileNameText}
                              numberOfLines={1}
                            >
                              {file.name}
                            </Text>
                            <Text style={styles.fileStatusText}>
                              ✓ Uploaded & Ready
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            setUploadedFiles(prev =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={22}
                            color={theme.danger}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </Animated.View>

              {/* Action Buttons */}
              <Animated.View
                entering={FadeInUp.delay(300).springify()}
                style={styles.bottomButtonsRow}
              >
                <ScaleButton
                  style={[
                    styles.submitFinalBtn,
                    (isSubmitting || isUploading) && { opacity: 0.7 },
                  ]}
                  activeOpacity={0.8}
                  scaleTo={0.95}
                  disabled={isSubmitting || isUploading}
                  onPress={handleSubmitAssignment}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                  ) : (
                    <>
                      <Ionicons
                        name="send"
                        size={18}
                        color={theme.onPrimary}
                        style={{ marginRight: 8, transform: [{ rotate: '-45deg' }] }}
                      />
                      <Text style={styles.submitFinalText}>
                        Submit Assignment
                      </Text>
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

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: theme.background },

    scrollContent: {
      paddingBottom: 40,
    },

    heroSection: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 28,
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
      marginBottom: 14,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.onPrimary,
      marginBottom: 4,
    },
    heroSubtitle: {
      fontSize: 13,
      color: theme.onPrimary,
      opacity: 0.9,
      fontWeight: '400',
    },

    cardsContainer: {
      paddingHorizontal: 16,
      paddingTop: 20,
      gap: 16,
    },

    card: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 18,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },

    errorCard: {
      padding: 16,
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      borderRadius: 12,
      marginHorizontal: 16,
    },
    errorCardText: {
      color: theme.danger,
      fontWeight: '500',
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 40,
      color: theme.subtext,
    },

    infoCard: {
      padding: 18,
    },
    infoCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    infoCardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginLeft: 8,
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: 14,
    },
    infoCol: {
      width: '50%',
    },
    infoLabel: {
      fontSize: 12,
      color: theme.subtext,
      marginBottom: 3,
    },
    infoValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },

    uploadCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    uploadCardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginLeft: 8,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: theme.subtext,
      marginBottom: 10,
    },

    textInput: {
      minHeight: 110,
      backgroundColor: isDarkMode ? theme.background : theme.iconBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
      fontSize: 14,
      color: theme.text,
      lineHeight: 20,
    },

    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? theme.background : theme.iconBackground,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
      marginBottom: 16,
      marginTop: 4,
    },
    infoBannerText: {
      fontSize: 12,
      color: theme.subtext,
      fontWeight: '400',
      flex: 1,
    },

    uploadDashedArea: {
      borderWidth: 1.5,
      borderColor: theme.border,
      borderStyle: 'dashed',
      borderRadius: 14,
      backgroundColor: isDarkMode ? theme.background : theme.iconBackground,
      paddingVertical: 28,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadingContainer: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    uploadingText: {
      marginTop: 10,
      fontSize: 13,
      color: theme.primary,
      fontWeight: '600',
    },
    dragDropText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginTop: 6,
      marginBottom: 4,
    },
    orClickText: {
      fontSize: 12,
      color: theme.subtext,
      marginBottom: 18,
    },
    browseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 8,
    },
    browseButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.onPrimary,
    },

    uploadErrorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      padding: 8,
      borderRadius: 6,
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
    },
    uploadErrorText: {
      fontSize: 12,
      color: theme.danger,
      flex: 1,
    },

    fileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? theme.background : theme.iconBackground,
      padding: 10,
      borderRadius: 8,
      marginBottom: 8,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.border,
    },
    fileInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    fileNameText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '500',
    },
    fileStatusText: {
      color: theme.success,
      fontSize: 11,
      marginTop: 2,
    },

    bottomButtonsRow: {
      paddingTop: 8,
      paddingBottom: 24,
    },
    submitFinalBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      elevation: 3,
    },
    submitFinalText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.onPrimary,
      marginLeft: 8,
    },
  });

export default AssignmentSubmitScreen;
