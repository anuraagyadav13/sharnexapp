import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherCreateQuizStep3'>;

const TeacherCreateQuizStep3Screen: React.FC<Props> = ({ navigation, route }) => {
  const { authState } = useAuth();
  const { quizData } = route.params;
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      
      // Map questions to backend schema
      const mappedQuestions = quizData.questions.map((q: any) => ({
        text: q.text,
        options: q.options.map((opt: any) => ({
          text: opt.value,
          isCorrect: opt.letter === q.correctAnswer
        }))
      }));

      // Calculate dates
      const now = new Date();
      const startDateTime = new Date(now.getTime() + 10 * 60000); // 10 mins from now
      const dueDateTime = new Date(startDateTime.getTime() + quizData.duration * 60000);

      const payload = {
        title: quizData.title,
        subject: quizData.subject,
        classes: [quizData.classId],
        duration: quizData.duration,
        questions: mappedQuestions,
        status: 'published',
        startDateTime: startDateTime.toISOString(),
        dueDateTime: dueDateTime.toISOString(),
        description: `Quiz for ${quizData.className} - ${quizData.subject}`
      };

      await apiClient.post(ENDPOINTS.TEACHER.QUIZZES, payload);
      
      Alert.alert('Success', 'Quiz published successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('TeacherQuiz') }
      ]);
    } catch (error: any) {
      console.error('Failed to publish quiz:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to publish quiz');
    } finally {
      setIsPublishing(false);
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
         <Text style={styles.blueTitle}>Create New Quiz</Text>
         <Text style={styles.blueSubtitle}>Review and Publish your Quiz</Text>
      </Animated.View>

      {/* Stepper */}
      <View style={styles.stepperContainer}>
         <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
               <Text style={[styles.stepNumber, styles.stepNumberActive]}>1</Text>
            </View>
            <Text style={[styles.stepText, styles.stepTextCompleted]}>Details</Text>
         </View>
         <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
               <Text style={[styles.stepNumber, styles.stepNumberActive]}>2</Text>
            </View>
            <Text style={[styles.stepText, styles.stepTextCompleted]}>Questions</Text>
         </View>
         <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
               <Text style={[styles.stepNumber, styles.stepNumberActive]}>3</Text>
            </View>
            <Text style={[styles.stepText, styles.stepTextActive]}>Review</Text>
         </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         
         <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.mainCard}>
            
            <Text style={styles.cardTitle}>Review & Publish</Text>
            <Text style={styles.cardSubtitle}>Review your quiz details before publish</Text>

            <Text style={styles.sectionHeader}>Quiz Summary</Text>

            {/* Grid Information */}
            <View style={styles.gridContainer}>
               
               <View style={styles.gridItemHalf}>
                  <Text style={styles.gridLabel}>Quiz Title</Text>
                  <Text style={styles.gridValue}>{quizData.title}</Text>
               </View>
               <View style={styles.gridItemHalf}>
                  <Text style={styles.gridLabel}>Subject</Text>
                  <Text style={styles.gridValue}>{quizData.subject}</Text>
               </View>

               <View style={styles.gridItemHalf}>
                  <Text style={styles.gridLabel}>Duration</Text>
                  <Text style={styles.gridValue}>{quizData.duration} min</Text>
               </View>
               <View style={styles.gridItemHalf}>
                  <Text style={styles.gridLabel}>Questions</Text>
                  <Text style={styles.gridValue}>{quizData.questions.length}</Text>
               </View>

               <View style={styles.gridItemFull}>
                  <Text style={styles.gridLabel}>Class</Text>
                  <Text style={styles.gridValue}>{quizData.className}</Text>
               </View>

            </View>

            <View style={styles.divider} />

            {/* Description */}
            <View style={styles.descSection}>
               <Text style={styles.gridLabel}>Description</Text>
               <Text style={styles.descValue}>
                  This quiz for {quizData.className} covers the subject {quizData.subject}. 
                  Total questions: {quizData.questions.length}. Total time: {quizData.duration} minutes.
               </Text>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
               <Text style={styles.infoBoxTitle}>Ready To Publish ?</Text>
               <Text style={styles.infoBoxSub}>
                  Once published, students of {quizData.className} will be able to attempt this quiz.
               </Text>
            </View>

         </Animated.View>

      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bottomBar}>
         <TouchableOpacity 
           style={styles.cancelBtn} 
           activeOpacity={0.8} 
           onPress={() => navigation.goBack()}
           disabled={isPublishing}
         >
            <Ionicons name="arrow-back" size={16} color="#111827" style={{marginRight: 6}} />
            <Text style={styles.cancelBtnText}>Previous</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={styles.nextBtn} 
           activeOpacity={0.8} 
           onPress={handlePublish}
           disabled={isPublishing}
         >
            {isPublishing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.nextBtnText}>Publish Quiz</Text>
                <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" style={{marginLeft: 6}} />
              </>
            )}
         </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 110 },

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
  menuHandle: { paddingRight: 10, paddingVertical: 10, width: 28 },
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
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  blueSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#E0E7FF',
  },

  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  stepCircleCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  stepNumber: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  stepTextActive: {
    color: '#4F46E5',
  },
  stepTextCompleted: {
    color: '#22C55E',
  },

  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItemHalf: {
    width: '50%',
    marginBottom: 20,
    paddingRight: 10,
  },
  gridItemFull: {
    width: '100%',
    marginBottom: 20,
  },
  gridLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  descSection: {
    marginBottom: 24,
  },
  descValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 20,
  },

  infoBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 6,
  },
  infoBoxSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B45309',
    lineHeight: 18,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#F8FAFC',
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 12,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,},
  nextBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TeacherCreateQuizStep3Screen;
