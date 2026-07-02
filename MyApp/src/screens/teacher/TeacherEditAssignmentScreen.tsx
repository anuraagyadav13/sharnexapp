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

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherEditAssignment'>;

const TeacherEditAssignmentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { assignmentId } = route.params;
  const { authState } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await apiClient.get(ENDPOINTS.TEACHER.ASSIGNMENT_DETAILS(assignmentId));
        const resData = res.data as any;
        const data = resData?.assignment || resData;
        
        setTitle(data.title || '');
        setDescription(data.description || '');
        setSubject(data.subject || '');
        setClassName(data.className || data.class || '');
        setMaxMarks(String(data.maxMarks || data.max_marks || '100'));
        
        if (data.dueDate) {
          const dateStr = data.dueDate.split('T')[0];
          setDueDate(dateStr);
        }
      } catch (e) {
        console.error('Failed to fetch assignment details:', e);
        Alert.alert('Error', 'Could not load assignment details.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [assignmentId]);

  const handleUpdate = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a title.');
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.put(ENDPOINTS.TEACHER.UPDATE_ASSIGNMENT(assignmentId), {
        title,
        description,
        dueDate: dueDate || null,
        maxMarks: parseInt(maxMarks) || 100,
      });
      
      Alert.alert('Success', 'Assignment updated successfully!');
      navigation.goBack();
    } catch (e: any) {
      console.error('Failed to update assignment:', e);
      const errorMessage = e.response?.normalized?.message || e.response?.data?.message || e.message || 'Failed to update assignment.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#5266EB" />
        <Text style={styles.loadingText}>Loading Details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <View style={styles.menuHandle} />
        <Text style={styles.headerTitle} numberOfLines={1}>Edit Assignment</Text>
        <View style={styles.headerRight}>
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <View style={{flex: 1}}>
              <Text style={styles.pageTitle}>Update Assignment</Text>
              <Text style={styles.pageSubtitle}>Modify details for {className}</Text>
           </View>
           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
           </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.formCard}>
           
           <View style={styles.cardHeader}>
              <Ionicons name="create-outline" size={18} color="#5266EB" style={{marginRight: 6}} />
              <Text style={styles.cardTitle}>Basic Information</Text>
           </View>

           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Assignment Title</Text>
              <TextInput 
                 style={styles.textInput}
                 placeholder="Title"
                 value={title}
                 onChangeText={setTitle}
              />
           </View>

           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Subject (read-only)</Text>
              <TextInput 
                 style={[styles.textInput, {backgroundColor: '#F3F4F6'}]}
                 value={subject}
                 editable={false}
              />
           </View>

           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description / Instructions</Text>
              <TextInput 
                 style={[styles.textInput, styles.textArea]}
                 placeholder="Instructions..."
                 multiline
                 numberOfLines={4}
                 value={description}
                 onChangeText={setDescription}
              />
           </View>

           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Due Date (YYYY-MM-DD)</Text>
              <TouchableOpacity 
                style={styles.inputWithIcon} 
                activeOpacity={0.7}
                onPress={() => Alert.alert('Date Picker', 'For now, please enter the date manually.')}
              >
                 <TextInput 
                    style={[styles.textInput, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]}
                    placeholder="2025-10-15"
                    value={dueDate}
                    onChangeText={setDueDate}
                 />
                 <Ionicons name="calendar-outline" size={18} color="#111827" />
              </TouchableOpacity>
           </View>

           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Total Points</Text>
              <TextInput 
                 style={styles.textInput}
                 placeholder="100"
                 keyboardType="numeric"
                 value={maxMarks}
                 onChangeText={setMaxMarks}
              />
           </View>

           <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtnCancel} onPress={() => navigation.goBack()}>
                 <Text style={styles.actionBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtnPublish, isSaving && { opacity: 0.7 }]} 
                onPress={handleUpdate}
                disabled={isSaving}
              >
                 {isSaving ? (
                   <ActivityIndicator color="#FFF" size="small" />
                 ) : (
                   <Text style={styles.actionBtnPublishText}>Save Changes</Text>
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
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, color: '#6B7280', fontWeight: '500' },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    zIndex: 10
  },
  menuHandle: { width: 40 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#5266EB', marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#5266EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },

  fieldContainer: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 14,
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
  },
  actionBtnCancelText: { fontSize: 12, fontWeight: '600', color: '#5266EB' },
  actionBtnPublish: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5266EB',
    borderRadius: 8,
    paddingVertical: 14,
  },
  actionBtnPublishText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
});

export default TeacherEditAssignmentScreen;
