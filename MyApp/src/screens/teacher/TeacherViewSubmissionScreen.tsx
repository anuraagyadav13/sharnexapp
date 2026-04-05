import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherViewSubmission'>;

const MOCK_SUBMISSIONS = [
  {
    id: 1,
    name: 'Aman Kumar',
    stdId: '#0001',
    time: 'Today 10:30 PM',
    files: [
      { name: 'Algebra_Solutions.pdf', size: '2.4 MB' },
      { name: 'Algebra_Solutions.pdf', size: '2.4 MB' }
    ]
  },
  {
    id: 2,
    name: 'Aman Kumar',
    stdId: '#0001',
    time: 'Today 10:30 PM',
    files: [
      { name: 'Algebra_Solutions.pdf', size: '2.4 MB' },
      { name: 'Algebra_Solutions.pdf', size: '2.4 MB' }
    ]
  }
];

const TeacherViewSubmissionScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <View style={styles.menuHandle} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Welcome back, Anurag</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>A</Text>
          </View>
        </View>
      </View>

      {/* Blue Header Section */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.blueHeader}>
         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
         </TouchableOpacity>
         <Text style={styles.blueTitle}>Algebra Submissions</Text>
         <Text style={styles.blueSubtitle}>Algebra Problem Set</Text>
         
         <View style={styles.infoRow}>
            <View style={styles.infoItem}>
               <Ionicons name="school-outline" size={12} color="#E0E7FF" style={{marginRight: 6}} />
               <Text style={styles.infoText}>Class 10-A</Text>
            </View>
            <View style={styles.infoItem}>
               <Ionicons name="calendar-outline" size={12} color="#E0E7FF" style={{marginRight: 6}} />
               <Text style={styles.infoText}>Oct 10, 2023</Text>
            </View>
            <View style={styles.infoItem}>
               <Ionicons name="people-outline" size={12} color="#E0E7FF" style={{marginRight: 6}} />
               <Text style={styles.infoText}>Max: 20 points</Text>
            </View>
         </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Submissions List */}
        {MOCK_SUBMISSIONS.map((submission, idx) => (
          <Animated.View key={submission.id} entering={FadeInUp.delay(100 + idx * 100).springify()} style={styles.submissionCard}>
             
             {/* Card Header */}
             <View style={styles.cardHeaderRow}>
                <View>
                   <Text style={styles.studentName}>{submission.name}</Text>
                   <Text style={styles.studentId}>ID : {submission.stdId}</Text>
                </View>
                <Text style={styles.submitTimeText}>Submitted: {submission.time}</Text>
             </View>

             {/* File Attachments */}
             <View style={styles.filesContainer}>
                {submission.files.map((file, fIdx) => (
                   <View key={fIdx} style={styles.fileRow}>
                      <View style={styles.pdfIconBox}>
                         <View style={styles.pdfRedBg}>
                            <Text style={styles.pdfIconText}>PDF</Text>
                         </View>
                      </View>
                      <View>
                         <Text style={styles.fileName}>{file.name}</Text>
                         <Text style={styles.fileSize}>{file.size}</Text>
                      </View>
                   </View>
                ))}
             </View>

             {/* Grade Input */}
             <View style={styles.gradeInputContainer}>
                <TextInput 
                   style={styles.gradeInput}
                   placeholder="Enter Grade / 20"
                   placeholderTextColor="#9CA3AF"
                   keyboardType="numeric"
                />
             </View>

             {/* Action Buttons Row */}
             <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtnDownload} activeOpacity={0.8}>
                   <Ionicons name="download-outline" size={16} color="#4F46E5" style={{marginRight: 6}} />
                   <Text style={styles.actionBtnDownloadText}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtnFeedback} activeOpacity={0.8}>
                   <Ionicons name="chatbox-ellipses" size={16} color="#FFFFFF" style={{marginRight: 6}} />
                   <Text style={styles.actionBtnFeedbackText}>Feedback</Text>
                </TouchableOpacity>
             </View>

          </Animated.View>
        ))}

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
