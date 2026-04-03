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


const StatCard = React.memo(({ color, iconBg, icon, value, label }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
));

const SubjectRow = ({ item, delay }: any) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.rowCard}>
    <View style={styles.rowCol1}>
      <View style={styles.subjectIcon}>
        <Text style={styles.subjectIconText}>{item.name[0]}</Text>
      </View>
      <Text style={styles.subjectName}>{item.name}</Text>
    </View>
    <View style={styles.rowCol2}>
      <Text style={styles.subjectCode}>{item.code}</Text>
    </View>
    <View style={styles.rowCol3}>
      <TouchableOpacity style={styles.actionBtn}>
        <Ionicons name="create-outline" size={18} color="#111827" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}>
        <Ionicons name="trash" size={18} color="#111827" />
      </TouchableOpacity>
    </View>
  </Animated.View>
);

const DUMMY_SUBJECTS = [
  { id: '1', name: 'Chemistry', code: '--' },
  { id: '2', name: 'Chemistry', code: '--' },
  { id: '3', name: 'Chemistry', code: '--' },
  { id: '4', name: 'Chemistry', code: '--' },
  { id: '5', name: 'Chemistry', code: '--' },
  { id: '6', name: 'Chemistry', code: '--' },
];

const PrincipalSubjectsScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
              <View>
                <Text style={styles.screenTitle}>Subjects</Text>
                <Text style={styles.screenSubtitle}>Manage and add subjects</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => setIsAddModalOpen(true)}>
                <Text style={styles.addBtnText}>+ Add Subject</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stat Cards */}
          <View style={styles.statCardsRow}>
            <StatCard color="#3B82F6" iconBg="#EFF6FF" icon="book" value="5" label="Total Subjects" />
            <StatCard color="#10B981" iconBg="#ECFDF5" icon="book" value="5" label="With Code" />
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

          {/* List Container */}
          <View style={styles.listContainer}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderCol1}>SUBJECT NAME</Text>
              <Text style={styles.listHeaderCol2}>CODE</Text>
              <Text style={styles.listHeaderCol3}>ACTIONS</Text>
            </View>
            
            <View style={styles.listBody}>
              {DUMMY_SUBJECTS.map((item, index) => (
                <SubjectRow key={index} item={item} delay={100 + index * 50} />
              ))}
            </View>
          </View>
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

            <Text style={styles.inputLabel}>Subject Name</Text>
            <TextInput style={styles.modalInput} placeholder="e.g, Class 1" placeholderTextColor="#9CA3AF" />

            <Text style={styles.inputLabel}>Subject Code (Optional)</Text>
            <TextInput style={styles.modalInput} placeholder="2026" placeholderTextColor="#9CA3AF" />

            <View style={[styles.modalFooter, { marginTop: 32 }]}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAddBtn}>
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

  titleSection: { marginTop: 20, marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#3B82F6', letterSpacing: -0.25 },
  screenSubtitle: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  addBtn: { 
    backgroundColor: '#3B82F6', 
    borderRadius: 8, 
    paddingHorizontal: 14, 
    paddingVertical: 14,
    shadowColor: '#1E293B', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 20, 
    elevation: 6
  },
  addBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  statCardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  statIconBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  statContent: { flex: 1, justifyContent: 'center' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },

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

  listContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  listHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listHeaderCol1: { flex: 2, fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  listHeaderCol2: { flex: 1, fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  listHeaderCol3: { width: 80, fontSize: 10, color: '#9CA3AF', fontWeight: '600', textAlign: 'right' },
  
  listBody: {
    paddingVertical: 8,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowCol1: { flex: 2, flexDirection: 'row', alignItems: 'center' },
  subjectIcon: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  subjectIconText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  subjectName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  
  rowCol2: { flex: 1, justifyContent: 'center' },
  subjectCode: { fontSize: 13, color: '#111827' },
  
  rowCol3: { width: 80, flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  actionBtn: { alignItems: 'center', justifyContent: 'center' },

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
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
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

export default PrincipalSubjectsScreen;
