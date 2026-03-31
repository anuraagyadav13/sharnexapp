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

const DUMMY_CLASSES = [
  { id: '1', code: 'C1', className: 'Class 1', section: '---', grade: '--', academicYear: '2026', students: '--', teacher: 'ANURAG YADAV' },
  { id: '2', code: 'C1', className: 'Class 1', section: '---', grade: '--', academicYear: '2026', students: '--', teacher: 'ANURAG YADAV' },
  { id: '3', code: 'C1', className: 'Class 1', section: '---', grade: '--', academicYear: '2026', students: '--', teacher: 'ANURAG YADAV' },
  { id: '4', code: 'C1', className: 'Class 1', section: '---', grade: '--', academicYear: '2026', students: '--', teacher: 'ANURAG YADAV' },
  { id: '5', code: 'C1', className: 'Class 1', section: '---', grade: '--', academicYear: '2026', students: '--', teacher: 'ANURAG YADAV' },
];

const PrincipalClassesScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
              <Text style={styles.screenTitle}>Classes Management</Text>
              <TouchableOpacity style={styles.addClassBtn} activeOpacity={0.8} onPress={() => setIsAddModalOpen(true)}>
                <Text style={styles.addClassBtnText}>+ Add Class</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.screenSubtitle}>Manage classes, sections, and academic structure.</Text>
          </View>

          {/* Stat Cards Row */}
          <View style={styles.statCardsRow}>
            <StatCard color="#A855F7" iconBg="#F3E8FF" icon="school" value="5" label="Total Classes" />
            <StatCard color="#3B82F6" iconBg="#EFF6FF" icon="school" value="5" label="Total Classes" />
            <StatCard color="#10B981" iconBg="#ECFDF5" icon="school" value="5" label="Total Classes" />
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
            {DUMMY_CLASSES.filter(c => c.className.toLowerCase().includes(searchQuery.toLowerCase())).map((item, index) => (
              <ClassCard key={item.id} item={item} delay={100 + index * 50} />
            ))}
          </View>
        </View>
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
              <TouchableOpacity>
                <Text style={styles.addSubjectText}>+Add Subject</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.emptySubjectContainer}>
              <Text style={styles.emptySubjectText}>No subjects added yet. Add subjects to define the academic structure.</Text>
            </View>

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

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  sectionPadding: { paddingHorizontal: 16 },

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
  titleSection: { marginTop: 24, marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: '#3B82F6', letterSpacing: -0.25 },
  screenSubtitle: { color: '#6B7280', fontSize: 12 },
  addClassBtn: {
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
  addClassBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  // Stat cards row
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
  statIconBox: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  statContent: { flex: 1, justifyContent: 'center' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },

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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
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

export default PrincipalClassesScreen;
