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
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherCreateAssignment'>;

const TeacherCreateAssignmentScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
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
        const res = await apiClient.get(ENDPOINTS.TEACHER.CLASSES(teacherId));
        const fetchedClasses = res.normalized?.data?.classes || res.data?.classes || [];
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
    if (!title || !classId) {
      Alert.alert('Error', 'Please enter a title and select a class.');
      return;
    }

    try {
      const teacherId = authState.user?.id;
      if (!teacherId) {
        Alert.alert('Error', 'Unable to identify teacher account. Please sign in again.');
        return;
      }
      setIsPublishing(true);
      await apiClient.post(ENDPOINTS.TEACHER.CREATE_ASSIGNMENT(teacherId), {
        title,
        description: instruction,
        dueDate: dueDate || new Date(Date.now() + 86400000 * 7).toISOString(),
        classId,
        subject: course,
        maxMarks: parseInt(maxMarks) || 100,
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
              <View style={styles.inputWithIcon}>
                 <TextInput 
                    style={[styles.textInput, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]}
                    placeholder="2025-10-15"
                    placeholderTextColor="#9CA3AF"
                    value={dueDate}
                    onChangeText={setDueDate}
                 />
                 <Ionicons name="calendar-outline" size={18} color="#111827" />
              </View>
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

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 16 },

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

  pageTitleWrapper: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#5266EB', marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#7FA4FF', // slightly lighter blue to match the icon bg
    justifyContent: 'center',
    alignItems: 'center',
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#FFFFFF',
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
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },

  radioGroup: {
    gap: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 12,
  },
  radioItemSelected: {
    borderColor: '#5266EB',
    backgroundColor: '#F5F7FF',
  },
  radioIcon: {
    marginRight: 10,
  },
  radioTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  radioSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },

  dashedUploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  dragDropTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  dragDropSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5266EB',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionBtnCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5266EB',
  },
  actionBtnPublish: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5266EB',
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
