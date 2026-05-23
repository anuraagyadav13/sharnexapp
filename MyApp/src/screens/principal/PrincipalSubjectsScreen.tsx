import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown, SlideInDown } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Toast, { ToastType } from '../../components/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PageSkeleton = () => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.pageHeader}>
      <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={16} />
    </View>
    <View style={styles.statsRow}>
      <Skeleton width="48%" height={100} borderRadius={16} />
      <Skeleton width="48%" height={100} borderRadius={16} />
    </View>
    <View style={{ marginTop: 30 }}>
      {[1, 2, 3, 4].map(i => <Skeleton key={i} width="100%" height={80} borderRadius={20} style={{ marginBottom: 12 }} />)}
    </View>
  </ScrollView>
);

const StatCard = ({ title, value, color, icon }: { title: string, value: string | number, color: string, icon: string }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle} numberOfLines={1}>{title}</Text>
  </View>
);

const SubjectCard = ({ item, index, delay, onDelete }: any) => {
  const navigation = useNavigation<any>();
  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1'];
  const brandColor = colors[index % colors.length];

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.subjectCard}>
      <View style={[styles.iconWrapper, { backgroundColor: brandColor + '10' }]}>
        <MaterialCommunityIcons name="book-outline" size={24} color={brandColor} />
      </View>
      <View style={styles.subjectMainInfo}>
        <Text style={styles.subjectName}>{item.name}</Text>
        <Text style={styles.subjectCode}>{item.code || 'NO CODE'}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.circleActionBtn}
          onPress={() => navigation.navigate('PrincipalEditSubject', { 
            subjectId: item.id, 
            initialData: item 
          })}
        >
          <Ionicons name="pencil-outline" size={18} color="#6366F1" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.circleActionBtn, { borderColor: '#FEE2E2' }]} onPress={() => onDelete(item.id)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const PrincipalSubjectsScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubjectForm, setNewSubjectForm] = useState({
    name: '',
    code: '',
  });
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType; onUndo?: () => void }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType = 'info', onUndo?: () => void) => {
    setToast({ visible: true, message, type, onUndo });
  };

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.SUBJECTS);
      const data = res.data.data || res.data || [];
      setSubjects(Array.isArray(data) ? data : data.subjects || []);
    } catch (error) {
      setSubjects([
        { id: '1', name: 'Mathematics', code: 'MATH-10' },
        { id: '2', name: 'Physics', code: 'PHY-10' },
        { id: '3', name: 'Chemistry', code: 'CHEM-10' },
        { id: '4', name: 'Biology', code: 'BIO-10' },
        { id: '5', name: 'Computer Science', code: 'CS-10' },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleAddSubject = async () => {
    if (!newSubjectForm.name) {
      showToast('Subject name is required', 'warning');
      return;
    }
    try {
      setIsLoading(true);
      await apiClient.post(ENDPOINTS.PRINCIPAL.SUBJECTS, {
        name: newSubjectForm.name,
        code: newSubjectForm.code,
      });
      setIsAddModalOpen(false);
      setNewSubjectForm({ name: '', code: '' });
      onRefresh();
      showToast('Subject added to inventory', 'success');
    } catch (error) {
      console.error('Add subject error:', error);
      showToast('Failed to create subject', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    const subToDelete = subjects.find(s => s.id === id);
    if (!subToDelete) return;

    Alert.alert('Delete Subject', `Permanently delete ${subToDelete.name} from curriculum?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          const originalSubjects = [...subjects];
          setSubjects(subjects.filter(s => s.id !== id));
          
          const deleteTimer = setTimeout(async () => {
            try {
              await apiClient.delete(`${ENDPOINTS.PRINCIPAL.SUBJECTS}/${id}`);
            } catch (error) {
              console.error('Subject delete failed:', error);
              setSubjects(originalSubjects);
              showToast('Sync failed. Subject restored.', 'error');
            }
          }, 5000);

          showToast(`Deleted ${subToDelete.name}.`, 'info', () => {
             clearTimeout(deleteTimer);
             setSubjects(originalSubjects);
          });
      } }
    ]);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
          onUndo={toast.onUndo}
        />
      )}

      {/* Global Header - Student Pattern */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color="#4F46E5" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Academic Curriculum</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}>
            <View style={styles.avatarHeader}>
              <Text style={styles.avatarTextHeader}>{authState.user?.name?.charAt(0) || 'A'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !isRefreshing ? (
        <PageSkeleton />
      ) : (
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
        >
          <View style={styles.pageHeader}>
            <View style={styles.titleRow}>
               <View style={{ flex: 1 }}>
                  <Text style={styles.screenTitle}>Subject Inventory</Text>
                  <Text style={styles.screenSubtitle}>Catalog and manage course offerings.</Text>
               </View>
               <TouchableOpacity 
                 style={styles.addNewBtn}
                 onPress={() => navigation.navigate('PrincipalAddSubject')}
               >
                  <Ionicons name="add" size={18} color="#FFF" />
                  <Text style={styles.addNewBtnText}>Add New Subject</Text>
               </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row - Student Pattern */}
          <View style={styles.statsRow}>
            <StatCard title="Total Courses" value={subjects.length} color="#8B5CF6" icon="book-open-variant" />
            <StatCard title="Electives" value="4" color="#F59E0B" icon="bookmark-check-outline" />
            <StatCard title="Core Units" value={subjects.length - 4} color="#3B82F6" icon="book-education-outline" />
          </View>

          {/* Search Bar - Student Pattern */}
          <View style={styles.searchWrapper}>
             <Ionicons name="search-outline" size={20} color="#94A3B8" />
             <TextInput 
               placeholder="Find subjects by name or code..." 
               placeholderTextColor="#94A3B8"
               style={styles.searchInput}
               value={searchQuery}
               onChangeText={setSearchQuery}
             />
          </View>

          {/* Subjects List */}
          <View style={styles.listContainer}>
            {subjects
              .filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.code?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item, index) => (
                <SubjectCard key={item.id} item={item} index={index} delay={index * 50} onDelete={handleDelete} />
              ))}
          </View>
        </ScrollView>
      )}

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header - Student Pattern
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 24,
    backgroundColor: '#FAFAFF',
  },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnHeader: { padding: 4 },
  avatarHeader: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  addNewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  addNewBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  statCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0', width: '31%', minHeight: 110 },
  statIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginTop: 2 },
  statTitle: { fontSize: 9, fontWeight: '700', color: '#6B7280', marginTop: 6, textAlign: 'center', width: '100%', textTransform: 'uppercase' },

  // Search
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, paddingHorizontal: 15, height: 50, borderRadius: 15, borderWidth: 1, borderColor: '#F1F5F9', marginTop: 20, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1F2937', fontWeight: '500' },

  // Cards
  listContainer: { paddingHorizontal: 20 },
  subjectCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  subjectMainInfo: { flex: 1, marginLeft: 15 },
  subjectName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  subjectCode: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  circleActionBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#FFF' },
  modalSheet: { flex: 1, backgroundColor: '#FFF', padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 30 },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 8 },
  premiumInput: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 14, color: '#1E293B', fontWeight: '600', borderWidth: 1, borderColor: '#F1F5F9' },
  primarySubmitBtn: { backgroundColor: '#4F46E5', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primarySubmitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

export default PrincipalSubjectsScreen;
