import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherAddQuestion'>;

const MOCK_EXISTING_QUESTIONS = [
  { id: 1, text: 'What is the value of pi ?', points: 5, difficulty: 'Easy', correct: 'B' },
  { id: 2, text: 'What is the value of pi ?', points: 5, difficulty: 'Easy', correct: 'B' },
  { id: 3, text: 'What is the value of pi ?', points: 5, difficulty: 'Easy', correct: 'B' },
];

const TeacherAddQuestionScreen: React.FC<Props> = ({ navigation }) => {
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
         <Text style={styles.blueTitle}>Add New Question</Text>
         <Text style={styles.blueSubtitle}>Mid-Term Mathematics Examination</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         
         {/* Form Card */}
         <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.mainCard}>
            <Text style={styles.cardTitle}>Create new questions</Text>
            
            {/* Question Text Area */}
            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>Question</Text>
               <TextInput 
                  style={styles.textArea} 
                  placeholder="Enter your question here" 
                  placeholderTextColor="#9CA3AF"
                  multiline={true}
                  textAlignVertical="top"
               />
            </View>

            {/* Points & Difficulty Row */}
            <View style={styles.rowInputsWrapper}>
               <View style={[styles.inputGroup, {flex: 1, marginRight: 16}]}>
                  <Text style={styles.inputLabel}>Points</Text>
                  <TextInput style={styles.textInput} placeholder="2" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
               </View>
               <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.inputLabel}>Difficulty</Text>
                  <TouchableOpacity style={styles.dropdownInput} activeOpacity={0.8}>
                     <Text style={styles.dropdownTextPlaceholder}>Select Difficulty</Text>
                     <Ionicons name="chevron-down" size={16} color="#4B5563" />
                  </TouchableOpacity>
               </View>
            </View>

            {/* Answer Options Box */}
            <View style={styles.answerBox}>
               <View style={styles.answerBoxHeader}>
                  <Text style={styles.answerBoxTitle}>Answer Options</Text>
                  <TouchableOpacity style={styles.addOptionBtn} activeOpacity={0.8}>
                     <Text style={styles.addOptionBtnText}>+ Add option</Text>
                  </TouchableOpacity>
               </View>

               {/* Option 1 (Selected) */}
               <View style={[styles.optionInputRow, styles.optionInputRowSelected]}>
                  <Ionicons name="checkbox" size={20} color="#111827" style={styles.checkboxIcon} />
                  <TextInput 
                     style={styles.optionInputText}
                     placeholder="Enter Option....."
                     placeholderTextColor="#111827"
                     value="Enter Option....."
                  />
               </View>

               {/* Option 2 (Unselected) */}
               <View style={styles.optionInputRow}>
                  <View style={styles.checkboxOutline} />
                  <TextInput 
                     style={styles.optionInputText}
                     placeholder="Enter Option...."
                     placeholderTextColor="#6B7280"
                  />
               </View>

               <Text style={styles.answerBoxFooterHint}>Check the box next to correct answer</Text>
            </View>

            {/* Form Action Buttons */}
            <View style={styles.formActionRow}>
               <TouchableOpacity style={styles.clearFormBtn} activeOpacity={0.8}>
                  <Text style={styles.clearFormBtnText}>Clear Form</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.addQuesBtn} activeOpacity={0.8}>
                  <Text style={styles.addQuesBtnText}>+ Add Question</Text>
               </TouchableOpacity>
            </View>
         </Animated.View>

         {/* Existing Questions Card */}
         <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.mainCard}>
            <Text style={styles.cardTitle}>Questions in This Quiz</Text>
            <Text style={styles.quizSummaryText}>3 Question - Total 15 points</Text>

            <View style={styles.divider} />

            {/* List */}
            {MOCK_EXISTING_QUESTIONS.map((q, index) => (
               <View key={q.id} style={styles.existingQuestionCard}>
                  <View style={styles.existingQuesContent}>
                     <Text style={styles.existingQuesTitle}>{q.id}. {q.text}</Text>
                     <View style={styles.existingQuesMeta}>
                        <Text style={styles.metaGray}>{q.points} points</Text>
                        <Text style={styles.metaGray}>{q.difficulty}</Text>
                        <Text style={styles.metaGray}>Correct : {q.correct}</Text>
                     </View>
                  </View>
                  <View style={styles.existingQuesActions}>
                     <TouchableOpacity style={styles.actionIconBtn} activeOpacity={0.7}>
                        <Ionicons name="create-outline" size={20} color="#111827" />
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.actionIconBtn} activeOpacity={0.7}>
                        <Ionicons name="trash-outline" size={20} color="#111827" />
                     </TouchableOpacity>
                  </View>
               </View>
            ))}
         </Animated.View>

      </ScrollView>

      {/* Bottom Sticky Bar */}
      <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bottomBar}>
         <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8}>
            <Ionicons name="save-outline" size={16} color="#FFFFFF" style={{marginRight: 6}} />
            <Text style={styles.saveBtnText}>Save All Questions</Text>
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
    paddingBottom: 24,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  blueSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#E0E7FF',
  },

  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },

  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: '#111827',
    marginBottom: 8,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: '#111827',
    height: 100,
  },
  rowInputsWrapper: {
    flexDirection: 'row',
  },
  textInput: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownTextPlaceholder: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  answerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  answerBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  answerBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  addOptionBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 8,
  
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,},
  addOptionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  optionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  optionInputRowSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  checkboxIcon: {
    marginRight: 10,
  },
  checkboxOutline: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 12,
  },
  optionInputText: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    padding: 0,
  },
  answerBoxFooterHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    fontWeight: '400',
  },

  formActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  clearFormBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  clearFormBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  addQuesBtn: {
    flex: 1,
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
  addQuesBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  quizSummaryText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
    marginHorizontal: -16,
  },
  existingQuestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  existingQuesContent: {
    flex: 1,
  },
  existingQuesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  existingQuesMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaGray: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  existingQuesActions: {
    flexDirection: 'row',
    gap: 20,
    paddingLeft: 10,
  },
  actionIconBtn: {
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
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    fontWeight: '800',
    color: '#111827',
  },
  saveBtn: {
    flex: 2,
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
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default TeacherAddQuestionScreen;
