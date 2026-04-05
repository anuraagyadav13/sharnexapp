import React, { useState } from 'react';
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
  KeyboardAvoidingView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';

const StatCard = React.memo(({ color, value, label, subtext }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <View style={styles.statContent}>
      <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
      {subtext ? <Text style={styles.statSubtext}>{subtext}</Text> : null}
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
));

const SubjectItem = ({ item, isLast }: any) => (
  <View style={styles.subjectItemContainer}>
    <View style={styles.subjectCardHeaderRow}>
      <View style={styles.subjectBox}>
        <Text style={styles.subjectBoxText}>{item.name[0]}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.subjectCardTitle}>{item.name}</Text>
        <Text style={styles.subjectCardSubtitle}>Code: {item.code}</Text>
      </View>
      <View style={styles.subjectCardActions}>
        <TouchableOpacity style={styles.actionBtnIcon} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={18} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnIcon} activeOpacity={0.7}>
          <Ionicons name="trash" size={18} color="#111827" />
        </TouchableOpacity>
      </View>
    </View>
    {!isLast && <View style={styles.hrLine} />}
  </View>
);

const DUMMY_SUBJECTS = [
  { id: '1', name: 'Chemistry', code: '--' },
  { id: '2', name: 'Physics', code: '--' },
  { id: '3', name: 'Biology', code: '--' },
  { id: '4', name: 'Mathematics', code: '--' },
  { id: '5', name: 'English', code: '--' },
];

const PrincipalSubjectsScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [subjects, setSubjects] = useState(DUMMY_SUBJECTS);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const newSubject = {
      id: Date.now().toString(),
      name: newSubjectName.trim(),
      code: newSubjectCode.trim() || '--',
    };
    setSubjects([newSubject, ...subjects]);
    setNewSubjectName('');
    setNewSubjectCode('');
    setIsAddModalOpen(false);
  };


  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
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
          Welcome back, Anurag
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
              <Text style={styles.avatarText}>A</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionPadding}>
          {/* Title and Add Button */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.screenTitle}>Subjects Management</Text>
              <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => setIsAddModalOpen(true)}>
                <Text style={styles.addBtnText}>+ Add Subject</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.screenSubtitle}>Manage and add subjects to the curriculum.</Text>
          </View>

          {/* Stat Cards Row */}
          <View style={styles.statCardsRow}>
            <StatCard color="#3B82F6" value={subjects.length.toString()} label="Total Subjects" />
            <StatCard color="#10B981" value={subjects.filter(s => s.code !== '--').length.toString()} label="With Code" />
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarRow}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search by subject name or subject code"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* All Subjects Title */}
          <Text style={styles.allSubjectsTitle}>All Subjects</Text>

          {/* Subject Cards List */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.listContainer}>
            {subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase())).map((item, index, arr) => (
               <SubjectItem key={item.id} item={item} isLast={index === arr.length - 1} />
            ))}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="principal"
      />

      {/* Add Subject Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View entering={FadeInUp.duration(300)} style={styles.modalContent}>
            <View style={styles.modalHeaderContainer}>
              <View>
                <Text style={styles.modalHeaderSubtitle}>SUBJECTS</Text>
                <Text style={styles.modalHeaderTitle}>Add Subject</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Subject Name *</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="e.g. Mathematics, Physics, English" 
              placeholderTextColor="#9CA3AF" 
              value={newSubjectName} 
              onChangeText={setNewSubjectName} 
            />

            <Text style={styles.inputLabel}>Subject Code (optional)</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="e.g. MATH, PHY, ENG" 
              placeholderTextColor="#9CA3AF" 
              value={newSubjectCode} 
              onChangeText={setNewSubjectCode} 
            />

            <View style={[styles.modalFooter, { marginTop: 32 }]}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAddBtn} onPress={handleAddSubject}>
                <Text style={styles.modalAddBtnText}>Create Subject</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  sectionPadding: { paddingHorizontal: 16 },

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

  titleSection: { marginTop: 20, marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  screenTitle: { fontSize: 20, fontWeight: '700', color: '#3B82F6', letterSpacing: -0.25 },
  screenSubtitle: { color: '#6B7280', fontSize: 12 },
  addBtn: { 
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
  addBtnText: { color: '#FFF', fontWeight: '600', fontSize: 12 },

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

  searchBarRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 44, 
    marginBottom: 20, 
    shadowColor: '#1E293B', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 20, 
    elevation: 6 
  },
  searchBarInput: { flex: 1, fontSize: 13, color: '#111827' },

  allSubjectsTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },

  // Subject Card
  listContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6
  },
  subjectItemContainer: {
    flexDirection: 'column',
  },
  subjectCardHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  hrLine: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  subjectBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  subjectBoxText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  subjectCardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  subjectCardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  subjectCardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtnIcon: { alignItems: 'center', justifyContent: 'center' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
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
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 20,
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
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center'
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalAddBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    justifyContent: 'center'
  },
  modalAddBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PrincipalSubjectsScreen;
