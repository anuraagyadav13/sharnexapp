import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherCreateQuizStep2'>;

const MOCK_QUESTIONS = [
  { id: 1, text: 'What is the value of pi ?', correctAnswer: 'A', options: [ { letter: 'A', value: '3.14' }, { letter: 'B', value: '3.15' }, { letter: 'C', value: '3.13' }, { letter: 'D', value: '3.18' } ] },
  { id: 2, text: 'What is the value of pi ?', correctAnswer: 'A', options: [ { letter: 'A', value: '3.14' }, { letter: 'B', value: '3.15' }, { letter: 'C', value: '3.13' }, { letter: 'D', value: '3.18' } ] },
  { id: 3, text: 'What is the value of pi ?', correctAnswer: 'A', options: [ { letter: 'A', value: '3.14' }, { letter: 'B', value: '3.15' }, { letter: 'C', value: '3.13' }, { letter: 'D', value: '3.18' } ] },
];

const TeacherCreateQuizStep2Screen: React.FC<Props> = ({ navigation }) => {
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
         <Text style={styles.blueTitle}>Create New Quiz</Text>
         <Text style={styles.blueSubtitle}>Design and configure your Quiz</Text>
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
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
               <Text style={[styles.stepNumber, styles.stepNumberActive]}>2</Text>
            </View>
            <Text style={[styles.stepText, styles.stepTextActive]}>Questions</Text>
         </View>
         <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
               <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepText}>Review</Text>
         </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         
         <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.contentWrapper}>
            
            {/* Header Row */}
            <View style={styles.headerRow}>
               <View>
                  <Text style={styles.sectionTitle}>Quiz Questions</Text>
                  <Text style={styles.sectionSubtitle}>Add and manage questions for your quiz</Text>
               </View>
               <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => navigation.navigate('TeacherAddQuestion')}>
                  <Text style={styles.addBtnText}>+ Add Question</Text>
               </TouchableOpacity>
            </View>

            {/* Questions List */}
            {MOCK_QUESTIONS.map((q, qIndex) => (
               <View key={q.id} style={styles.questionBlock}>
                  <Text style={styles.questionNumLabel}>Question # {q.id}</Text>
                  <Text style={styles.questionText}>{q.text}</Text>

                  {/* Options */}
                  <View style={styles.optionsContainer}>
                     {q.options.map((opt, optIndex) => {
                        const isCorrect = opt.letter === q.correctAnswer;
                        return (
                           <View key={optIndex} style={[styles.optionRow, isCorrect ? styles.optionRowCorrect : null]}>
                              <View style={[styles.optionLetterCircle, isCorrect ? styles.optionLetterCircleCorrect : null]}>
                                 <Text style={[styles.optionLetter, isCorrect ? styles.optionLetterCorrect : null]}>{opt.letter}</Text>
                              </View>
                              <Text style={styles.optionValue}>{opt.value}</Text>
                           </View>
                        );
                     })}
                  </View>

                  {/* Correct Answer Note */}
                  <Text style={styles.correctNote}>Correct Answer : {q.correctAnswer}</Text>
               </View>
            ))}

         </Animated.View>

      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bottomBar}>
         <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color="#111827" style={{marginRight: 6}} />
            <Text style={styles.cancelBtnText}>Previous</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.nextBtn} activeOpacity={0.8} onPress={() => navigation.navigate('TeacherCreateQuizStep3')}>
            <Text style={styles.nextBtnText}>Next Step</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{marginLeft: 6}} />
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

  contentWrapper: {
    paddingHorizontal: 16,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  addBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  questionBlock: {
    marginBottom: 32,
  },
  questionNumLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 12,
    color: '#111827',
    marginBottom: 20,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  optionRowCorrect: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  optionLetterCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterCircleCorrect: {
    backgroundColor: '#10B981',
  },
  optionLetter: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
  },
  optionLetterCorrect: {
    color: '#FFFFFF',
  },
  optionValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  correctNote: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
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

export default TeacherCreateQuizStep2Screen;
