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
  FlatList,
  Pressable
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Try to import DateTimePicker, fallback to null if not available
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker not available, using fallback pickers');
}

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherCreateQuiz'>;

const TeacherCreateQuizScreen: React.FC<Props> = ({ navigation, route }) => {
  const { authState } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [duration, setDuration] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Date/Time Picker States
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Pre-fill if editing
  useEffect(() => {
    const initialQuiz = route.params?.initialQuiz;
    if (initialQuiz) {
      setTitle(initialQuiz.title || '');
      setDescription(initialQuiz.description || '');
      setSubject(initialQuiz.subject || '');
      setDuration(String(initialQuiz.timeLimit || initialQuiz.duration || '60'));
      setStartDate(initialQuiz.startAt ? new Date(initialQuiz.startAt) : new Date());
      setDueDate(initialQuiz.dueDate ? new Date(initialQuiz.dueDate) : new Date());
      setSelectedClasses(initialQuiz.classes || (initialQuiz.classId ? [initialQuiz.classId] : []));
    }
  }, [route.params?.initialQuiz]);

  useEffect(() => {
    const fetchClassesAndSubjects = async () => {
      try {
        const teacherId = authState.user?.id;
        if (!teacherId) return;
        
        // Fetch classes
        const classesRes = await apiClient.get(ENDPOINTS.TEACHER.CLASSES(teacherId));
        const classesData = classesRes.data || classesRes;
        const fetchedClasses = Array.isArray(classesData) ? classesData : (classesData.classes || []);
        setClasses(fetchedClasses);

        // Derive subjects from the teacher's classes to avoid unsupported endpoints
        const uniqueSubjects = Array.from(
          new Set<string>(
            fetchedClasses
              .map((cls: any) => cls.subject)
              .filter((subject: any) => typeof subject === 'string' && subject.trim() !== '')
          )
        ) as string[];
        setSubjects(uniqueSubjects.map((subject, index) => ({ id: String(index), name: subject })));

        if (!subject && uniqueSubjects.length > 0) {
          setSubject(uniqueSubjects[0]);
        }
      } catch (error) {
        console.error('Failed to fetch classes:', error);
        Alert.alert('Error', 'Failed to load class data');
      }
    };
    fetchClassesAndSubjects();
  }, [authState.user?.id]);

  const toggleClass = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId) 
        : [...prev, classId]
    );
  };

  // Date/Time Picker Handlers
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const newStartDate = new Date(selectedDate);
      newStartDate.setHours(startDate.getHours());
      newStartDate.setMinutes(startDate.getMinutes());
      
      const now = new Date();
      const finalStartDate = newStartDate < now ? now : newStartDate;
      
      setStartDate(finalStartDate);
      
      // Update Due Date keeping the current duration
      const durMinutes = parseInt(duration) || 60;
      setDueDate(new Date(finalStartDate.getTime() + durMinutes * 60000));
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const newStartDate = new Date(startDate);
      newStartDate.setHours(selectedTime.getHours());
      newStartDate.setMinutes(selectedTime.getMinutes());
      
      const now = new Date();
      const finalStartDate = newStartDate < now ? now : newStartDate;
      setStartDate(finalStartDate);
      
      // Update Due Date keeping current duration
      const durMinutes = parseInt(duration) || 60;
      setDueDate(new Date(finalStartDate.getTime() + durMinutes * 60000));
    }
  };

  const onDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(false);
    if (selectedDate) {
      const newDueDate = new Date(selectedDate);
      newDueDate.setHours(dueDate.getHours());
      newDueDate.setMinutes(dueDate.getMinutes());

      if (newDueDate <= startDate) {
        Alert.alert('Invalid Date', 'Due Date must be after the Start Date.');
        return;
      }
      
      setDueDate(newDueDate);
      // SYNC: Update duration based on new due date
      const diffMins = Math.round((newDueDate.getTime() - startDate.getTime()) / 60000);
      setDuration(String(diffMins));
    }
  };

  const onDueTimeChange = (event: any, selectedTime?: Date) => {
    setShowDueTimePicker(false);
    if (selectedTime) {
      const newDueDate = new Date(dueDate);
      newDueDate.setHours(selectedTime.getHours());
      newDueDate.setMinutes(selectedTime.getMinutes());

      if (newDueDate <= startDate) {
        Alert.alert('Invalid Time', 'Due time must be after the start time.');
        return;
      }
      
      setDueDate(newDueDate);
      // SYNC: Update duration based on new due date
      const diffMins = Math.round((newDueDate.getTime() - startDate.getTime()) / 60000);
      setDuration(String(diffMins));
    }
  };

  // SYNC: Re-calculate due date whenever duration string is typed manually
  const handleDurationChange = (text: string) => {
    setDuration(text);
    const durMins = parseInt(text);
    if (!isNaN(durMins) && durMins > 0) {
      setDueDate(new Date(startDate.getTime() + durMins * 60000));
    }
  };

  const handleNext = () => {
    if (!title || selectedClasses.length === 0 || !subject || !duration) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const now = new Date();
    // Buffer of 1 minute to avoid race conditions during selection
    const oneMinuteBuffer = new Date(now.getTime() - 60000);

    if (startDate < oneMinuteBuffer) {
      Alert.alert('Invalid Time', 'Start Date & Time cannot be in the past. Please select a current or future time.');
      return;
    }

    if (dueDate <= startDate) {
      Alert.alert('Invalid Time', 'Due Date & Time must be after the Start Date & Time.');
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Error', 'Please enter a valid number for Duration');
      return;
    }

    navigation.navigate('TeacherCreateQuizStep2', {
      quizData: {
        id: route.params?.initialQuiz?.id,
        title,
        description,
        classes: selectedClasses,
        subject,
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString(),
        duration: durationNum,
        teacherId: authState.user?.id as string,
        institutionId: authState.user?.institutionId as string,
        questions: route.params?.initialQuiz?.questions || []
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
         <Text style={styles.blueTitle}>{route.params?.initialQuiz ? 'Edit Quiz' : 'Create New Quiz'}</Text>
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

            <View style={styles.formRow}>
              {/* Quiz Title */}
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Quiz Title</Text>
                <TextInput 
                  style={styles.textInput} 
                  placeholder="e.g. Mid-term Exam" 
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Subject */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Subject</Text>
                {subjects.length > 0 ? (
                  <>
                    <TouchableOpacity 
                      style={[styles.textInput, styles.dropdownInput]}
                      onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
                    >
                      <Text style={[styles.pickerValueText, !subject && {color: '#9CA3AF'}]}>
                        {subject || 'Select a subject'}
                      </Text>
                      <Ionicons name="caret-down" size={14} color="#6B7280" />
                    </TouchableOpacity>
                    {showSubjectDropdown && (
                      <View style={styles.dropdownMenu}>
                        <ScrollView style={{ maxHeight: 150 }}>
                          {subjects.map((subj) => (
                            <TouchableOpacity
                              key={subj.id}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setSubject(subj.name);
                                setShowSubjectDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{subj.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </>
                ) : (
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Enter a subject"
                    placeholderTextColor="#9CA3AF"
                    value={subject}
                    onChangeText={setSubject}
                  />
                )}
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>Description</Text>
               <TextInput 
                 style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]} 
                 placeholder="Provide a brief description about quiz......" 
                 placeholderTextColor="#9CA3AF"
                 multiline
                 value={description}
                 onChangeText={setDescription}
               />
            </View>

            <View style={styles.formRow}>
              {/* Start Date */}
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TouchableOpacity 
                  style={[styles.textInput, styles.rowInputs]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={[styles.pickerValueText]}>
                    {startDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={16} color="#4F46E5" />
                </TouchableOpacity>
              </View>

              {/* Start Time */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TouchableOpacity 
                  style={[styles.textInput, styles.rowInputs]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={[styles.pickerValueText]}>
                    {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                  <Ionicons name="time-outline" size={16} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formRow}>
              {/* Due Date */}
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Due Date</Text>
                <TouchableOpacity 
                   style={[styles.textInput, styles.rowInputs]}
                   onPress={() => setShowDueDatePicker(true)}
                >
                  <Text style={[styles.pickerValueText]}>
                    {dueDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={16} color="#4F46E5" />
                </TouchableOpacity>
              </View>

              {/* Due Time */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Due Time</Text>
                <TouchableOpacity 
                  style={[styles.textInput, styles.rowInputs]}
                  onPress={() => setShowDueTimePicker(true)}
                >
                  <Text style={[styles.pickerValueText]}>
                    {dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                  <Ionicons name="time-outline" size={16} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formRow}>
              {/* Classes */}
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Classes</Text>
                <View style={styles.checkboxContainer}>
                  {classes.map((cls) => (
                    <TouchableOpacity 
                      key={cls.id} 
                      style={styles.checkboxRow} 
                      onPress={() => toggleClass(cls.id)}
                    >
                      <View style={[styles.checkbox, selectedClasses.includes(cls.id) && styles.checkboxActive]}>
                        {selectedClasses.includes(cls.id) && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                      </View>
                      <Text style={styles.checkboxLabel}>{cls.name} {cls.section}</Text>
                    </TouchableOpacity>
                  ))}
                  {classes.length === 0 && <Text style={styles.emptySmall}>No classes available</Text>}
                </View>
              </View>

              {/* Duration */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Duration</Text>
                <View style={[styles.textInput, styles.rowInputs]}>
                  <TextInput 
                    style={{ flex: 1, padding: 0, fontSize: 13, color: '#1E293B' }}
                    placeholder="Enter duration in minutes" 
                    placeholderTextColor="#9CA3AF" 
                    keyboardType="numeric"
                    value={duration}
                    onChangeText={handleDurationChange}
                  />
                  <Text style={styles.unitLabel}>min</Text>
                </View>
              </View>
            </View>

          </Animated.View>
      </ScrollView>

      {/* Date/Time Pickers */}
      {DateTimePicker && showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
          minimumDate={new Date()}
        />
      )}
      {DateTimePicker && showDueDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display="default"
          onChange={onDueDateChange}
          minimumDate={startDate}
        />
      )}
      {DateTimePicker && showStartTimePicker && (
        <DateTimePicker
          value={startDate}
          mode="time"
          display="default"
          onChange={onStartTimeChange}
        />
      )}
      {DateTimePicker && showDueTimePicker && (
        <DateTimePicker
          value={dueDate}
          mode="time"
          display="default"
          onChange={onDueTimeChange}
        />
      )}

      {/* Bottom Fixed Action Bar */}
      <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bottomBar}>
         <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.nextBtn} activeOpacity={0.8} onPress={handleNext}>
            <Text style={styles.nextBtnText}>{route.params?.initialQuiz ? 'Save & Next' : 'Next Step'}</Text>
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
    borderRadius: 6,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  dropdownTextPlaceholder: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#374151',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  checkboxContainer: {
    marginTop: 4,
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  unitLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptySmall: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerValueText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  
  // Modal Styles
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calModalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calMonthText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  calNavBtn: {
    padding: 8,
  },
  calWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calWeekdayText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    width: 32,
    textAlign: 'center',
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calDayBtn: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  calDayText: {
    fontSize: 13,
    color: '#1E293B',
  },
  calCancelBtn: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  // Time Picker Styles
  timeModalContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  timeModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeSelectionRow: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timeColWrapper: {
    height: '100%',
    width: 60,
  },
  timeCol: {
    flex: 1,
  },
  ampmCol: {
    width: 60,
    marginLeft: 10,
  },
  timeItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  timeItemActive: {
    backgroundColor: '#EEF2FF',
  },
  timeText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  timeTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  timeDivider: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginHorizontal: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  timeModalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeModalCancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
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
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
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
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,},
  nextBtnText: {
    fontSize: 13,
    fontWeight: '700',
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
