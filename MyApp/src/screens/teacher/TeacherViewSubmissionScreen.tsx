import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherViewSubmission'>;

const TeacherViewSubmissionScreen: React.FC<Props> = ({ navigation, route }) => {
  // @ts-ignore
  const { assignmentId, assignmentTitle, className, dueDate, maxMarks } = route.params || {};
  const { authState } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiClient.get(ENDPOINTS.TEACHER.SUBMISSIONS(assignmentId));
        const data = res.normalized?.data || {};
        setSubmissions(Array.isArray(data) ? data : data.submissions || []);
      } catch (error: any) {
        console.error('Failed to fetch submissions:', error);
        setError('Failed to load submissions. Please try again.');
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (assignmentId) fetchSubmissions();
  }, [assignmentId]);

  const handleGradeChange = (id: string, val: string) => {
    setGrades(prev => ({ ...prev, [id]: val }));
  };

  const submitGrade = async (submissionId: string) => {
    try {
      const score = grades[submissionId];
      if (!score) return;
      
      await apiClient.put(ENDPOINTS.TEACHER.GRADE_SUBMISSION(assignmentId, submissionId), {
        marksObtained: parseInt(score),
        feedback: 'Graded via mobile app'
      });
      Alert.alert('Success', 'Grade submitted!');
    } catch (e) {
      console.error('Failed to submit grade:', e);
      Alert.alert('Error', 'Failed to submit grade');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <View style={styles.menuHandle} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Welcome back, {authState.user?.name?.split(' ')[0] || 'Teacher'}</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
          </View>
        </View>
      </View>

      {/* Blue Header Section */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.blueHeader}>
         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
         </TouchableOpacity>
         <Text style={styles.blueTitle}>{assignmentTitle || 'Submissions'}</Text>
         <Text style={styles.blueSubtitle}>Grading Portal</Text>
         
         <View style={styles.infoRow}>
            <View style={styles.infoItem}>
               <Ionicons name="school-outline" size={12} color="#E0E7FF" style={{marginRight: 6}} />
               <Text style={styles.infoText}>{className || 'All Classes'}</Text>
            </View>
            <View style={styles.infoItem}>
               <Ionicons name="calendar-outline" size={12} color="#E0E7FF" style={{marginRight: 6}} />
               <Text style={styles.infoText}>Due: {dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
               <Ionicons name="people-outline" size={12} color="#E0E7FF" style={{marginRight: 6}} />
               <Text style={styles.infoText}>Max: {maxMarks || 100} points</Text>
            </View>
         </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={{ padding: 16, backgroundColor: '#FEE2E2', borderRadius: 12 }}>
            <Text style={{ color: '#DC2626', fontWeight: '500' }}>{error}</Text>
          </View>
        ) : submissions.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#9CA3AF' }}>No submissions found.</Text>
        ) : (
          submissions.map((submission, idx) => (
            <Animated.View key={submission.studentId} entering={FadeInUp.delay(100 + idx * 100).springify()} style={styles.submissionCard}>
               
               {/* Card Header */}
               <View style={styles.cardHeaderRow}>
                  <View>
                     <Text style={styles.studentName}>{submission.studentName}</Text>
                     <Text style={styles.studentId}>ID : {submission.rollNo || 'N/A'}</Text>
                  </View>
                  <Text style={styles.submitTimeText}>{submission.submittedAt}</Text>
               </View>

               {/* File Attachments */}
               <View style={styles.filesContainer}>
                  {submission.files?.map((file: any, fIdx: number) => (
                     <View key={fIdx} style={styles.fileRow}>
                        <View style={styles.pdfIconBox}>
                           <View style={styles.pdfRedBg}>
                              <Text style={styles.pdfIconText}>PDF</Text>
                           </View>
                        </View>
                        <View style={{ flex: 1 }}>
                           <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                           <Text style={styles.fileSize}>{file.size}</Text>
                        </View>
                     </View>
                  ))}
               </View>

               {/* Grade Input */}
               <View style={styles.gradeInputContainer}>
                  <TextInput 
                     style={styles.gradeInput}
                     placeholder={`Enter Grade / ${submission.maxPoints || 100}`}
                     placeholderTextColor="#9CA3AF"
                     keyboardType="numeric"
                     value={grades[submission.studentId] || submission.grade?.toString() || ''}
                     onChangeText={(val) => handleGradeChange(submission.studentId, val)}
                  />
               </View>

               {/* Action Buttons Row */}
               <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.actionBtnDownload, { opacity: submission.files?.length > 0 ? 1 : 0.5 }]} 
                    activeOpacity={0.8} 
                    disabled={!submission.files?.length}
                    onPress={() => {/* Handle view */}}
                  >
                     <Ionicons name="eye-outline" size={16} color="#4F46E5" style={{marginRight: 6}} />
                     <Text style={styles.actionBtnDownloadText}>View File</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtnFeedback, { opacity: submission.id ? 1 : 0.5 }]} 
                    activeOpacity={0.8}
                    disabled={!submission.id}
                    onPress={() => submission.id && submitGrade(submission.id)}
                  >
                     <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{marginRight: 6}} />
                     <Text style={styles.actionBtnFeedbackText}>Save Grade</Text>
                  </TouchableOpacity>
               </View>

            </Animated.View>
          ))
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 16 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: { fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5', 
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  blueHeader: {
    backgroundColor: '#5266EB', // royal blue matching the screenshot
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  blueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  blueSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoRow: {
    gap: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 11,
    color: '#E0E7FF', // faint light blue/white
    fontWeight: '500',
  },

  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  submitTimeText: {
    fontSize: 11,
    color: '#5266EB',
    fontWeight: '500',
    marginTop: 2,
  },

  filesContainer: {
    marginBottom: 20,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  pdfIconBox: {
    marginRight: 12,
  },
  pdfRedBg: {
    backgroundColor: '#FF0000',
    width: 24,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfIconText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  fileName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 11,
    color: '#111827',
  },

  gradeInputContainer: {
    marginBottom: 20,
  },
  gradeInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F8FAFC',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtnDownload: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionBtnDownloadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5266EB',
  },
  actionBtnFeedback: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5266EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionBtnFeedbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TeacherViewSubmissionScreen;
