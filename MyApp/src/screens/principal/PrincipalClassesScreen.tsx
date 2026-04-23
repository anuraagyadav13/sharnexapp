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
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';



const StatCard = React.memo(({ color, value, label, subtext }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <View style={styles.statContent}>
      <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
      {subtext ? <Text style={styles.statSubtext}>{subtext}</Text> : null}
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
));

const ClassCard = ({ item, delay }: any) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.classCard}>
    <View style={styles.classCardHeaderRow}>
      <View style={styles.classBox}>
        <Text style={styles.classBoxText}>{item.code}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.classCardTitle}>{item.className}</Text>
        <Text style={styles.classCardSubtitle}>Academic Year {item.academicYear}</Text>
      </View>
      <View style={styles.classCardActions}>
        <TouchableOpacity style={styles.actionBtnIcon} activeOpacity={0.7}><Ionicons name="eye" size={18} color="#111827" /></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnIcon} activeOpacity={0.7}><Ionicons name="trash" size={18} color="#111827" /></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnIcon} activeOpacity={0.7}><Ionicons name="create-outline" size={18} color="#111827" /></TouchableOpacity>
      </View>
    </View>

    <View style={styles.classCardDivider} />

    <View style={styles.classCardInfoContainer}>
      <View style={styles.classCardInfoCol}>
        <Text style={styles.classCardInfoLabel}>SECTION</Text>
        <Text style={styles.classCardInfoValue}>{item.section}</Text>
      </View>
      <View style={styles.verticalDivider} />
      <View style={styles.classCardInfoCol}>
        <Text style={styles.classCardInfoLabel}>GRADE</Text>
        <Text style={styles.classCardInfoValue}>{item.grade}</Text>
      </View>
      <View style={styles.verticalDivider} />
      <View style={styles.classCardInfoCol}>
        <Text style={styles.classCardInfoLabel}>STUDENTS</Text>
        <Text style={styles.classCardInfoValue}>{item.students}</Text>
      </View>
    </View>

    <View style={styles.classCardFooterRow}>
      <View style={styles.classCardAvatar}><Text style={styles.classCardAvatarText}>{item.teacher[0]}</Text></View>
      <Text style={styles.classCardTeacherName}>{item.teacher}</Text>
    </View>
  </Animated.View>
);


const PrincipalClassesScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classesData, setClassesData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch classes data
  useEffect(() => {
    const fetchClassesData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiClient.get(ENDPOINTS.PRINCIPAL.CLASSES);
        const data = res.data.data || res.data;
        setClassesData(data);
      } catch (error: any) {
        console.error('Failed to fetch classes data:', error);
        // TEMPORARY: Mock data fallback for dev work
        setClassesData({
          stats: { totalClasses: 8, activeClasses: 8, totalStudents: 245 },
          classes: [
            { id: '1', code: '10A', className: 'Class 10 - Section A', academicYear: '2026', section: 'A', grade: '10', students: 32, teacher: 'Ms. Anjali Verma' },
            { id: '2', code: '10B', className: 'Class 10 - Section B', academicYear: '2026', section: 'B', grade: '10', students: 30, teacher: 'Mr. Rajesh Kumar' },
            { id: '3', code: '11A', className: 'Class 11 - Science', academicYear: '2026', section: 'A', grade: '11', students: 28, teacher: 'Ms. Emily Rodriguez' },
            { id: '4', code: '11B', className: 'Class 11 - Commerce', academicYear: '2026', section: 'B', grade: '11', students: 35, teacher: 'Mr. David Wilson' },
            { id: '5', code: '12A', className: 'Class 12 - Science', academicYear: '2026', section: 'A', grade: '12', students: 25, teacher: 'Dr. Sarah Smith' },
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchClassesData();
  }, []);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Re-trigger useEffect
    setClassesData(null);
  };

  const handleAddSubjectToClass = () => {
    const newSubject = {
      id: Date.now().toString(),
      name: 'New Assigned Subject',
      teacher: 'Assign Teacher',
    };
    setClassSubjects([...classSubjects, newSubject]);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header matching Dashboard */}
      <View style={styles.globalHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={26} color="#4B5563" />
        </ScaleButton>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Welcome back, {authState.user?.name?.split(' ')[0] || 'Admin'}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnTransparent}>
            <Ionicons name="notifications-outline" size={20} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtnTransparent}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}
          >
            <Ionicons name="settings-outline" size={20} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent}>
            <Ionicons name="moon-outline" size={20} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'A'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>


      {/* Main Content */}
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Loading State */}
        {isLoading && (
          <View style={styles.sectionPadding}>
             <View style={styles.titleSection}>
                <Skeleton width="60%" height={24} style={{marginBottom: 8}} />
                <Skeleton width="80%" height={16} />
             </View>
             <View style={styles.statCardsRow}>
                <Skeleton width="31%" height={100} borderRadius={12} />
                <Skeleton width="31%" height={100} borderRadius={12} />
                <Skeleton width="31%" height={100} borderRadius={12} />
             </View>
             <Skeleton width="100%" height={44} borderRadius={8} style={{marginVertical: 16}} />
             <View style={{gap: 12}}>
                {[1,2,3].map(i => <Skeleton key={i} width="100%" height={140} borderRadius={16} />)}
             </View>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Failed to Load Data</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <Ionicons name="refresh" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <View style={styles.sectionPadding}>
          {/* Title and Add Button */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.screenTitle}>Classes Management</Text>
              <TouchableOpacity style={styles.addClassBtn} activeOpacity={0.8} onPress={() => setIsAddModalOpen(true)}>
                <Text style={styles.addClassBtnText}>+ Add Class</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.screenSubtitle}>Manage classes, sections, and academic structure.</Text>
          </View>

          {/* Stat Cards Row */}
          <View style={styles.statCardsRow}>
            <StatCard 
              color="#3B82F6" 
              value={classesData?.stats?.totalClasses || "5"} 
              label="Total Classes" 
            />
            <StatCard 
              color="#10B981" 
              value={classesData?.stats?.activeClasses || "5"} 
              label="Active Classes" 
            />
            <StatCard 
              color="#EF4444" 
              value={classesData?.stats?.totalStudents || "150"} 
              label="Total Students" 
            />
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarRow}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search classes by name, section, grade"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* All Classes Title */}
          <Text style={styles.allClassesTitle}>All Classes</Text>

          {/* Class Cards List */}
          <View style={styles.listContainer}>
            {(classesData?.classes || []).filter((c: any) => 
              c.className?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.code?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((item: any, index: number) => (
              <ClassCard key={item.id} item={item} delay={100 + index * 50} />
            ))}
          </View>
        </View>
        )}
      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="principal"
      />

      {/* Add Class Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View entering={FadeInUp.duration(300)} style={styles.modalContent}>
            <View style={styles.modalHeaderContainer}>
              <View>
                <Text style={styles.modalHeaderSubtitle}>CLASSES</Text>
                <Text style={styles.modalHeaderTitle}>Add Class</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Class Name</Text>
            <TextInput style={styles.modalInput} placeholder="e.g, Class 1" placeholderTextColor="#9CA3AF" />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Section (optional)</Text>
                <TextInput style={styles.modalInput} placeholder="e.g, A, B" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Grade (optional)</Text>
                <TextInput style={styles.modalInput} placeholder="e.g, 5, 10, 12" placeholderTextColor="#9CA3AF" />
              </View>
            </View>

            <Text style={styles.inputLabel}>Academic Year</Text>
            <TextInput style={styles.modalInput} placeholder="2026" placeholderTextColor="#9CA3AF" keyboardType="numeric" />

            <View style={styles.modalDivider} />

            <View style={styles.modalSectionHeader}>
              <Text style={styles.modalSectionTitle}>SUBJECTS & TEACHERS</Text>
              <TouchableOpacity onPress={handleAddSubjectToClass}>
                <Text style={styles.addSubjectText}>+Add Subject</Text>
              </TouchableOpacity>
            </View>

            {classSubjects.length === 0 ? (
              <View style={styles.emptySubjectContainer}>
                <Text style={styles.emptySubjectText}>No subjects added yet. Add subjects to define the academic structure.</Text>
              </View>
            ) : (
              <View style={{ gap: 8, marginBottom: 24 }}>
                {classSubjects.map((sub: any) => (
                  <View key={sub.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <Ionicons name="book-outline" size={16} color="#4F46E5" style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{sub.name}</Text>
                      <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{sub.teacher}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setClassSubjects(classSubjects.filter((s: any) => s.id !== sub.id))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAddBtn}>
                <Text style={styles.modalAddBtnText}>Add Class</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const baseStyles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  sectionPadding: { paddingHorizontal: 16 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },

  errorContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Header 
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
  menuHandle: { paddingRight: 4, paddingVertical: 8 },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#A78BFA',
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  // Title Section
  titleSection: { marginTop: 20, marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  screenTitle: { fontSize: 20, fontWeight: '700', color: '#3B82F6', letterSpacing: -0.25 },
  screenSubtitle: { color: '#6B7280', fontSize: 12 },
  addClassBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  addClassBtnText: { color: '#FFF', fontWeight: '600', fontSize: 12 },

  // Stat cards row
  statCardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  statCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  statContent: { flex: 1, justifyContent: 'center' },
  statLabel: { fontSize: 11, color: '#111827', fontWeight: '600', marginBottom: 4 },
  statSubtext: { fontSize: 9, color: '#9CA3AF', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 4 },

  // Search bar
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6
  },
  searchBarInput: { flex: 1, fontSize: 13, color: '#111827' },

  // All Classes title
  allClassesTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },

  // Class card
  listContainer: { gap: 12 },
  classCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 0,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
    paddingVertical: 20,
    paddingHorizontal: 18,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6
  },
  classCardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  classBox: { width: 34, height: 34, borderRadius: 6, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  classBoxText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  classCardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  classCardSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  classCardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtnIcon: { alignItems: 'center', justifyContent: 'center' },
  classCardDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  classCardInfoContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0 },
  classCardInfoCol: { flex: 1 },
  classCardInfoLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginBottom: 4 },
  classCardInfoValue: { fontSize: 12, color: '#111827', fontWeight: '600' },
  verticalDivider: { width: 1, height: 20, backgroundColor: '#E5E7EB', marginHorizontal: 12 },

  classCardFooterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  classCardAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  classCardAvatarText: { color: '#FFF', fontWeight: '700', fontSize: 10 },
  classCardTeacherName: { fontSize: 12, color: '#111827', fontWeight: '600' },

  // Add Modal Styles
});

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.8)', // Very dark gray, like screenshot
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669', // Emerald 600
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    marginTop: 24,
  },
  modalInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  addSubjectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptySubjectContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptySubjectText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  modalAddBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalAddBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

});

const styles = { ...baseStyles, ...modalStyles };

export default PrincipalClassesScreen;
