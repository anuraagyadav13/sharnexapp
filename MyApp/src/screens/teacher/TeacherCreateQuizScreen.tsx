import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherCreateQuiz'>;

const TeacherCreateQuizScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [subject, setSubject] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [duration, setDuration] = useState('');
  
  const [isClassModalVisible, setClassModalVisible] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const teacherId = authState.user?.id;
        if (!teacherId) return;
        const res = await apiClient.get(ENDPOINTS.TEACHER.CLASSES(teacherId));
        setClasses(res.data.classes || []);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, [authState.user?.id]);

  const handleNext = () => {
    if (!title || !selectedClass || !subject || !totalMarks || !duration) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    navigation.navigate('TeacherCreateQuizStep2', {
      quizData: {
        title,
        classId: selectedClass.id,
        className: selectedClass.name,
        subject,
        totalMarks: parseInt(totalMarks),
        duration: parseInt(duration),
        teacherId: authState.user?.id as string,
        institutionId: authState.user?.institutionId as string
      }
    });
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
         <Text style={styles.blueSubtitle}>Design and configure your Quiz</Text>
      </Animated.View>

      {/* Stepper */}
      <View style={styles.stepperContainer}>
         <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
               <Text style={[styles.stepNumber, styles.stepNumberActive]}>1</Text>
            </View>
            <Text style={[styles.stepText, styles.stepTextActive]}>Details</Text>
         </View>
         <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
               <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepText}>Questions</Text>
         </View>
         <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
               <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepText}>Review</Text>
         </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         {/* Main Content Card */}
         <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.mainCard}>
            
            <Text style={styles.cardTitle}>Quiz Details</Text>
            <Text style={styles.cardSubtitle}>Enter basic information about your quiz</Text>

            {/* Quiz Title */}
            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>Quiz Title</Text>
               <TextInput 
                 style={styles.textInput} 
                 placeholder="e.g. Mid-term Exam" 
                 placeholderTextColor="#9CA3AF"
                 value={title}
                 onChangeText={setTitle}
               />
            </View>

            {/* Class Selection */}
            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>Class</Text>
               <TouchableOpacity 
                 style={styles.dropdownInput} 
                 activeOpacity={0.8}
                 onPress={() => setClassModalVisible(true)}
               >
                  <Text style={selectedClass ? styles.dropdownTextValue : styles.dropdownTextPlaceholder}>
                    {selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : 'Select a class'}
                  </Text>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                  ) : (
                    <Ionicons name="caret-down" size={14} color="#111827" />
                  )}
               </TouchableOpacity>
            </View>

            {/* Subject */}
            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>Subject</Text>
               <TextInput 
                 style={styles.textInput} 
                 placeholder="e.g. Mathematics" 
                 placeholderTextColor="#9CA3AF"
                 value={subject}
                 onChangeText={setSubject}
               />
            </View>

            {/* Total Marks */}
            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>Total Marks</Text>
               <TextInput 
                 style={styles.textInput} 
                 placeholder="100" 
                 placeholderTextColor="#9CA3AF" 
                 keyboardType="numeric"
                 value={totalMarks}
                 onChangeText={setTotalMarks}
               />
            </View>

            {/* Duration */}
            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>Duration (minutes)</Text>
               <TextInput 
                 style={styles.textInput} 
                 placeholder="90" 
                 placeholderTextColor="#9CA3AF" 
                 keyboardType="numeric"
                 value={duration}
                 onChangeText={setDuration}
               />
            </View>

         </Animated.View>
      </ScrollView>

      {/* Class Selection Modal */}
      <Modal visible={isClassModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setClassModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={classes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.classSelectItem}
                  onPress={() => {
                    setSelectedClass(item);
                    setSubject(item.subject || '');
                    setClassModalVisible(false);
                  }}
                >
                  <Text style={styles.classSelectText}>{item.name} - {item.section}</Text>
                  <Text style={styles.classSelectSubtext}>{item.subject || 'No subject assigned'}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No classes found</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Bottom Fixed Action Bar */}
      <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bottomBar}>
         <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.nextBtn} activeOpacity={0.8} onPress={handleNext}>
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
  stepNumber: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  stepTextActive: {
    color: '#4F46E5',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 20,
  },

  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: '#111827',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  dropdownTextPlaceholder: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  dropdownTextValue: {
    fontSize: 13,
    color: '#111827',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  classSelectItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  classSelectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  classSelectSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default TeacherCreateQuizScreen;
