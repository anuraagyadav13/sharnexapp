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
import { useTheme } from '../../store/ThemeContext';
import { TeacherHeader } from '../../components/TeacherHeader';
import teacherService from '../../services/teacherService';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherCreateAssignment'>;

const TeacherCreateAssignmentScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [selectedType, setSelectedType] = useState('Homework');
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [course, setCourse] = useState('');
  const [instruction, setInstruction] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [classes, setClasses] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const teacherId = authState.user?.id;
        if (!teacherId) return;
        const res = await teacherService.getClasses(teacherId);
        // More robust parsing for proxied response
        const data = res.data || res;
        const fetchedClasses = Array.isArray(data) ? data : (data.classes || []);
        
        setClasses(fetchedClasses);
        if (fetchedClasses.length > 0) {
          setClassId(fetchedClasses[0].id);
          setCourse(fetchedClasses[0].subject || '');
        }
      } catch (e) {
        console.error('Failed to fetch classes:', e);
      }
    };
    fetchClasses();
  }, [authState.user?.id]);

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter an assignment title.');
      return;
    }
    if (!classId) {
      Alert.alert('Validation Error', 'Please select a target class.');
      return;
    }

    const parsedMaxMarks = parseInt(maxMarks, 10);
    if (isNaN(parsedMaxMarks) || parsedMaxMarks <= 0) {
      Alert.alert('Validation Error', 'Total Points must be a positive integer greater than 0.');
      return;
    }

    let resolvedDueDate = '';
    if (dueDate.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dueDate.trim())) {
        Alert.alert('Validation Error', 'Due Date must be in YYYY-MM-DD format.');
        return;
      }
      const parsedDate = Date.parse(dueDate.trim());
      if (isNaN(parsedDate)) {
        Alert.alert('Validation Error', 'Please enter a valid date.');
        return;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(parsedDate) < today) {
        Alert.alert('Validation Error', 'Due Date cannot be in the past.');
        return;
      }
      resolvedDueDate = new Date(parsedDate).toISOString();
    } else {
      resolvedDueDate = new Date(Date.now() + 86400000 * 7).toISOString(); // Default to 7 days from now
    }

    try {
      const teacherId = authState.user?.id;
      if (!teacherId) {
        Alert.alert('Error', 'Unable to identify teacher account. Please sign in again.');
        return;
      }
      setIsPublishing(true);
      await teacherService.createAssignment(teacherId, {
        title: title.trim(),
        description: instruction,
        dueDate: resolvedDueDate,
        classId,
        subject: course,
        maxMarks: parsedMaxMarks,
        type: selectedType.toLowerCase(),
        teacherId,
        institutionId: authState.user?.institutionId
      });
      Alert.alert('Success', 'Assignment published successfully!');
      navigation.goBack();
    } catch (e: any) {
      console.error('Failed to publish assignment:', e);
      const errorMessage = e.response?.normalized?.message || e.response?.data?.message || e.message || 'Failed to publish assignment. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
      <TeacherHeader
        title="Create Assignment"
        navigation={navigation}
        isStackScreen={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Page Title & Back Button */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <View style={{flex: 1}}>
              <Text style={styles.pageTitle}>Create Assignments</Text>
              <Text style={styles.pageSubtitle}>Assign assignments to students</Text>
           </View>
           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
           </TouchableOpacity>
        </Animated.View>

        {/* Main Form Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.formCard}>
           
           <View style={styles.cardHeader}>
              <Ionicons name="add-circle" size={18} color="#5266EB" style={{marginRight: 6}} />
              <Text style={styles.cardTitle}>Assignments Details</Text>
           </View>

           {/* Assignment Title */}
           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Assignment Title</Text>
              <TextInput 
                 style={styles.textInput}
                 placeholder="e.g. Calculus Derivatives"
                 placeholderTextColor="#9CA3AF"
                 value={title}
                 onChangeText={setTitle}
              />
           </View>

           {/* Class Select (Simplified) */}
           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Target Class</Text>
              <View style={styles.radioGroup}>
                 {classes.map((c) => (
                    <TouchableOpacity 
                      key={c.id}
                      style={[styles.radioItem, classId === c.id && styles.radioItemSelected]} 
                      onPress={() => {
                        setClassId(c.id);
                        setCourse(c.subject || '');
                      }}
                    >
                       <Ionicons 
                          name={classId === c.id ? 'radio-button-on' : 'radio-button-off'} 
                          size={18} color={classId === c.id ? '#5266EB' : '#D1D5DB'} 
                       />
                       <Text style={[styles.radioTitle, { marginLeft: 8 }]}>{c.name} - {c.subject}</Text>
                    </TouchableOpacity>
                 ))}
              </View>
           </View>

           {/* Course */}
           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Course / Subject</Text>
              <TextInput 
                 style={styles.textInput}
                 placeholder="e.g. Mathematics"
                 placeholderTextColor="#9CA3AF"
                 value={course}
                 onChangeText={setCourse}
              />
           </View>

           {/* Assignment Type */}
           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Assignment Type</Text>
              <View style={styles.radioGroup}>
                 {['Quiz', 'Homework', 'Projects'].map(type => (
                   <TouchableOpacity 
                      key={type}
                      style={[styles.radioItem, selectedType === type && styles.radioItemSelected]} 
                      activeOpacity={0.8}
                      onPress={() => setSelectedType(type)}
                   >
                      <Ionicons 
                         name={selectedType === type ? 'radio-button-on' : 'radio-button-off'} 
                         size={20} 
                         color={selectedType === type ? '#5266EB' : '#D1D5DB'} 
                         style={styles.radioIcon} 
                      />
                      <Text style={styles.radioTitle}>{type}</Text>
                   </TouchableOpacity>
                 ))}
              </View>
           </View>

           {/* Instruction */}
           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Instruction</Text>
              <TextInput 
                 style={[styles.textInput, styles.textArea]}
                 placeholder="Enter assignment instructions..."
                 placeholderTextColor="#9CA3AF"
                 multiline
                 numberOfLines={4}
                 value={instruction}
                 onChangeText={setInstruction}
              />
           </View>

           {/* Due Date */}
           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Due Date (YYYY-MM-DD)</Text>
              <TouchableOpacity 
                style={styles.inputWithIcon} 
                activeOpacity={0.7} 
                onPress={() => Alert.alert('Date Picker', 'Date picker implementation coming soon. For now, please enter the date in YYYY-MM-DD format.')}
              >
                 <TextInput 
                    style={[styles.textInput, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]}
                    placeholder="2025-10-15"
                    placeholderTextColor="#9CA3AF"
                    value={dueDate}
                    onChangeText={setDueDate}
                 />
                 <Ionicons name="calendar-outline" size={18} color="#111827" />
              </TouchableOpacity>
           </View>

           {/* Total Points */}
           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Total Points</Text>
              <TextInput 
                 style={styles.textInput}
                 placeholder="100"
                 placeholderTextColor="#9CA3AF"
                 keyboardType="numeric"
                 value={maxMarks}
                 onChangeText={setMaxMarks}
              />
           </View>

           {/* Action Buttons Row */}
           <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtnCancel} activeOpacity={0.8} onPress={() => navigation.goBack()}>
                 <Text style={styles.actionBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtnPublish, isPublishing && { opacity: 0.7 }]} 
                activeOpacity={0.8}
                onPress={handlePublish}
                disabled={isPublishing}
              >
                 {isPublishing ? (
                   <ActivityIndicator color="#FFF" size="small" />
                 ) : (
                   <Text style={styles.actionBtnPublishText}>Publish Assignment</Text>
                 )}
              </TouchableOpacity>
           </View>

        </Animated.View>

      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 16 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: theme.surface,
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
    color: theme.primary, 
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

  pageTitleWrapper: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: theme.primary, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: theme.subtext, fontWeight: '500' },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)', 
    justifyContent: 'center',
    alignItems: 'center',
  },

  formCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },

  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.text,
    backgroundColor: theme.surface,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 12,
    lineHeight: 18,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    paddingHorizontal: 14,
    backgroundColor: theme.surface,
  },

  radioGroup: {
    gap: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    padding: 12,
  },
  radioItemSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.isDarkMode ? '#312E8130' : '#F5F7FF',
  },
  radioIcon: {
    marginRight: 10,
  },
  radioTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
  radioSubtitle: {
    fontSize: 10,
    color: theme.subtext,
    marginTop: 2,
  },

  dashedUploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.border,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: theme.surface,
  },
  dragDropTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  dragDropSubtitle: {
    fontSize: 10,
    color: theme.subtext,
    marginBottom: 20,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  actionBtnCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.isDarkMode ? '#334155' : '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionBtnCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  actionBtnPublish: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionBtnPublishText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TeacherCreateAssignmentScreen;
