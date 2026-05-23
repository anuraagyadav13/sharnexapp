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
import Toast, { ToastType } from '../../components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'PrincipalEditSubject'>;

const PrincipalEditSubjectScreen: React.FC<Props> = ({ navigation, route }) => {
  const { subjectId, initialData } = route.params;
  const { authState } = useAuth();
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [department, setDepartment] = useState(initialData?.department || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  const handleUpdate = async () => {
    if (!name) {
      showToast('Subject Name is a required field.', 'warning');
      return;
    }

    try {
      setIsUpdating(true);
      await apiClient.put(`${ENDPOINTS.PRINCIPAL.SUBJECTS}/${subjectId}`, {
        name,
        code,
        department,
        description
      });
      showToast('Subject successfully updated!', 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e: any) {
      console.error('Failed to update subject:', e);
      const errorMsg = e.response?.data?.message || 'Unable to update subject. Please verify network connectivity.';
      showToast(errorMsg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
        />
      )}

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <TouchableOpacity style={styles.backBtnHeader} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Institutional Portal</Text>
        <View style={styles.headerRight}>
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'P'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <View style={{flex: 1}}>
              <Text style={styles.pageTitle}>Edit Subject</Text>
              <Text style={styles.pageSubtitle}>Modify existing academic course specifications</Text>
           </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.formCard}>
           <View style={styles.cardHeader}>
              <Ionicons name="book-outline" size={18} color="#5266EB" style={{marginRight: 6}} />
              <Text style={styles.cardTitle}>Update Course Details</Text>
           </View>

           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Subject Name *</Text>
              <TextInput 
                 style={styles.textInput}
                 placeholder="e.g. Mathematics, Physics, English"
                 placeholderTextColor="#9CA3AF"
                 value={name}
                 onChangeText={setName}
              />
           </View>

           <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Subject Code (optional)</Text>
              <TextInput 
                 style={styles.textInput}
                 placeholder="e.g. MATH, PHY, ENG"
                 placeholderTextColor="#9CA3AF"
                 autoCapitalize="characters"
                 value={code}
                 onChangeText={setCode}
              />
           </View>



           <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtnCancel} activeOpacity={0.8} onPress={() => navigation.goBack()}>
                 <Text style={styles.actionBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtnPublish, isUpdating && { opacity: 0.7 }]} 
                activeOpacity={0.8}
                onPress={handleUpdate}
                disabled={isUpdating}
              >
                 {isUpdating ? (
                   <ActivityIndicator color="#FFF" size="small" />
                 ) : (
                   <Text style={styles.actionBtnPublishText}>Update Subject</Text>
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
  backBtnHeader: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#A855F7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  pageTitleWrapper: { marginTop: 20, marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#5266EB', marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#1E293B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  fieldContainer: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 8 },
  textInput: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#1E293B', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  actionBtnCancel: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: 14, paddingVertical: 16 },
  actionBtnCancelText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  actionBtnPublish: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5266EB', borderRadius: 14, paddingVertical: 16, shadowColor: '#5266EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  actionBtnPublishText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default PrincipalEditSubjectScreen;
