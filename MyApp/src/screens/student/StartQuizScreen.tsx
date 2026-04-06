import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';

type StartQuizNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StartQuiz'>;

interface Props {
  navigation: StartQuizNavigationProp;
}

const StartQuizScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const options = [
    { id: 1, letter: 'A', text: 'O(1) - Constant Time' },
    { id: 2, letter: 'B', text: 'O(n) - Linear Time' },
    { id: 3, letter: 'C', text: 'O(log n) - Logarithmic Time' },
    { id: 4, letter: 'D', text: 'O(n²) - Quadratic Time' },
  ];

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
         <ScaleButton style={styles.menuHandle} onPress={() => {}}>
           <View style={{width: 28}} /> 
         </ScaleButton>
         <Text style={styles.headerTitle} numberOfLines={1}>Welcome back, {authState.user?.name?.split(' ')[0] || 'Student'}</Text>
         <View style={styles.headerRight}>
           <Ionicons name="notifications-outline" size={20} color="#1F2937" />
           <Ionicons name="settings-outline" size={20} color="#1F2937" />
           <Ionicons name="moon-outline" size={20} color="#1F2937" />
           <View style={styles.avatar}>
             <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'S'}</Text>
           </View>
         </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Blue Hero Header Container */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.heroContainer}>
          <ScaleButton 
            style={styles.backButton} 
            activeOpacity={0.7} 
            scaleTo={0.9} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </ScaleButton>

          <Text style={styles.heroTitle}>Data Structures - Weekly Quiz</Text>
          <Text style={styles.heroSubtitle}>Question 1 of 50 • 200 Points Total</Text>
        </Animated.View>

        {/* Global Wrapper for everything below hero */}
        <View style={styles.contentWrapper}>
          
          {/* Top Timer Info Card */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.timerCard}>
             {/* Timer Box */}
             <View style={styles.timerBox}>
                <MaterialCommunityIcons name="clock" size={16} color="#F59E0B" style={{marginRight: 6}} />
                <View>
                  <Text style={styles.timerTextMain}>112 : 32</Text>
                  <Text style={styles.timerTextSub}>Time Remaining</Text>
                </View>
             </View>

             {/* Progress Number */}
             <View style={styles.questionCounterBlock}>
               <Text style={styles.counterCurrent}>1</Text>
               <Text style={styles.counterTotal}>of 50</Text>
             </View>
          </Animated.View>

          {/* Progress Bar (Outside Card) */}
          <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.progressContainer}>
             <View style={styles.progressLabelRow}>
               <Text style={styles.progressLabel}>Quiz Progress</Text>
               <Text style={styles.progressLabel}>0%</Text>
             </View>
             <View style={styles.progressBarTrack}>
                <View style={styles.progressBarFill} />
             </View>
          </Animated.View>

          {/* Actual Question Card */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionNumberCircle}>
                <Text style={styles.questionNumberText}>1</Text>
              </View>
              <Text style={styles.questionMainText}>
                What is the time complexity of accessing an element in an array by index?
              </Text>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>2 Points</Text>
              </View>
            </View>

            <View style={styles.optionsList}>
              {options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                return (
                  <ScaleButton 
                    key={opt.id} 
                    activeOpacity={0.8}
                    scaleTo={0.98}
                    onPress={() => setSelectedOption(opt.id)}
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                  >
                     <View style={[styles.optionLetterBox, isSelected && styles.optionLetterBoxSelected]}>
                       <Text style={[styles.optionLetterText, isSelected && styles.optionLetterTextSelected]}>
                         {opt.letter}
                       </Text>
                     </View>
                     <Text style={[styles.optionTextMain, isSelected && styles.optionTextMainSelected]}>
                       {opt.text}
                     </Text>
                  </ScaleButton>
                )
              })}
            </View>

            <ScaleButton style={styles.flagButton} activeOpacity={0.8} scaleTo={0.97}>
              <Ionicons name="flag" size={14} color="#F59E0B" style={{marginRight: 6}} />
              <Text style={styles.flagButtonText}>Flag for Review</Text>
            </ScaleButton>
          </Animated.View>

          {/* Bottom Action Footer */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.actionFooter}>
            <View style={styles.navigationRow}>
               <ScaleButton style={styles.prevBtn} activeOpacity={0.8} scaleTo={0.95}>
                 <Ionicons name="arrow-back" size={16} color="#4F46E5" style={{marginRight: 6}} />
                 <Text style={styles.prevBtnText}>Previous</Text>
               </ScaleButton>
               
               <ScaleButton style={styles.nextBtn} activeOpacity={0.8} scaleTo={0.95}>
                 <Text style={styles.nextBtnText}>Next</Text>
                 <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{marginLeft: 6}} />
               </ScaleButton>
            </View>
            
            <ScaleButton style={styles.submitBtn} activeOpacity={0.8} scaleTo={0.95} onPress={() => navigation.navigate('QuizResult', { quizId: '1', timestamp: Date.now() })}>
              <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.submitBtnText}>Submit Quiz</Text>
            </ScaleButton>
          </Animated.View>

        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAF9F9' }, 
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 12,
    backgroundColor: '#FAFAFF', 
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: { fontSize: 14, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#A855F7', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  heroContainer: {
    backgroundColor: '#4E5EEE', 
    paddingHorizontal: 20,
    paddingTop: 24, 
    paddingBottom: 36, 
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 12, color: '#E0E7FF', fontWeight: '500' },

  contentWrapper: { paddingHorizontal: 16, marginTop: 16 }, 

  timerCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  
  timerBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', 
    borderWidth: 1, borderColor: '#FDE68A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  timerTextMain: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 2 },
  timerTextSub: { fontSize: 9, color: '#6B7280', fontWeight: '500' },
  
  questionCounterBlock: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  counterCurrent: { fontSize: 26, fontWeight: '400', color: '#3B82F6', lineHeight: 30 },
  counterTotal: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  progressContainer: { marginTop: 24, marginBottom: 20, paddingHorizontal: 2 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 11, fontWeight: '700', color: '#111827' },
  progressBarTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressBarFill: { width: '0%', height: '100%', backgroundColor: '#4F46E5', borderRadius: 3 },

  questionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9'
  },
  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  questionNumberCircle: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#4F46E5',
    justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2,
  },
  questionNumberText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  questionMainText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#111827', lineHeight: 18, marginRight: 8 },
  pointsBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  pointsBadgeText: { color: '#10B981', fontSize: 9, fontWeight: '800' },

  optionsList: { gap: 10, marginBottom: 20 },
  optionItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF'
  },
  optionItemSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' }, 
  
  optionLetterBox: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  optionLetterBoxSelected: { backgroundColor: '#4F46E5' },
  optionLetterText: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
  optionLetterTextSelected: { color: '#FFFFFF' },
  
  optionTextMain: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  optionTextMainSelected: { color: '#4F46E5', fontWeight: '700' },

  flagButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 8, paddingVertical: 10,
  },
  flagButtonText: { color: '#F59E0B', fontSize: 13, fontWeight: '700' },

  actionFooter: { gap: 12 },
  navigationRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  prevBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#4F46E5', borderRadius: 6, paddingVertical: 10, backgroundColor: '#FFFFFF'
  },
  prevBtnText: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },
  
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4E5EEE', borderRadius: 6, paddingVertical: 10,
  },
  nextBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F97316', borderRadius: 6, paddingVertical: 12,
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

export default StartQuizScreen;
