import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../../store/AuthContext';

const ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'School Holiday Notice',
    status: 'PUBLISHED',
    date: 'Jan 21, 2026',
    author: 'Anurag',
    role: 'Principal',
    content: 'School will remain closed on December 25th for Christmas. All staff and students are requested to note this change.',
    tags: [
      { id: '1', label: 'Update', type: 'blue' },
      { id: '2', label: 'medium priority', type: 'yellow' },
      { id: '3', label: 'all', type: 'lightBlue' }
    ]
  }
];

const PrincipalAnnouncementsScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');

  // Date Picker States
  const [datePickerTarget, setDatePickerTarget] = useState<boolean>(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const generateDates = () => {
    const dates = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) dates.push(null);
    for (let i = 1; i <= daysInMonth; i++) dates.push(i);
    return dates;
  };

  const handleDateSelect = (day: number | null) => {
    if (!day) return;
    const formatted = `${String(currentMonth.getMonth() + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${currentMonth.getFullYear()}`;
    setExpiryDate(formatted);
    setDatePickerTarget(false);
  };

  const renderTag = (tag: any) => {
    let bg = '#F1F5F9';
    let color = '#475569';
    if (tag.type === 'blue') { bg = '#EFF6FF'; color = '#2563EB'; }
    if (tag.type === 'yellow') { bg = '#FEF3C7'; color = '#D97706'; }
    if (tag.type === 'lightBlue') { bg = '#E0F2FE'; color = '#0284C7'; }
    
    return (
      <View key={tag.id} style={[styles.tagPill, { backgroundColor: bg }]}>
        <Text style={[styles.tagText, { color }]}>{tag.label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />

      {/* --- Top Header --- */}
      <View style={styles.topHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={26} color="#111827" />
        </ScaleButton>

        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          Welcome back, {authState.user?.name?.split(' ')[0] || 'Admin'}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnTransparent}>
            <Ionicons name="notifications-outline" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent} onPress={() => navigation.navigate('AccountSettings')}>
            <Ionicons name="settings-outline" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'A'}</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- Page Info --- */}
        <Animated.View entering={FadeInUp.duration(300)} style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Announcements</Text>
          <Text style={styles.pageSubtitle}>Create and manage announcements for teachers, students and parents.</Text>
        </Animated.View>

        {/* --- List Actions / Tabs --- */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.sectionHeaderRow}>
           <Text style={styles.sectionTitle}>Recent Announcements</Text>
           <TouchableOpacity style={styles.newBtn} onPress={() => setIsNewModalOpen(true)}>
             <Ionicons name="add" size={16} color="#FFF" />
             <Text style={styles.newBtnText}>New Announcement</Text>
           </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(150)}>
          <View style={styles.tabsRow}>
            {['All', 'Published', 'Drafts'].map((tab) => (
              <TouchableOpacity key={tab} style={[styles.tabItem, activeTab === tab && styles.tabItemActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* --- Announcement Card / Empty State --- */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.cardsContainer}>
          {activeTab === 'Drafts' ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No announcements yet. Create your first announcement!</Text>
            </View>
          ) : (
            ANNOUNCEMENTS.map(item => (
              <View key={item.id} style={styles.announcementCard}>
                 
                 {/* Header Row */}
                 <View style={styles.cardHeaderRow}>
                   <Text style={styles.cardTitle}>{item.title}</Text>
                   <View style={styles.statusPill}>
                     <Text style={styles.statusPillText}>{item.status}</Text>
                   </View>
                 </View>

                 {/* Meta Data */}
                 <View style={styles.cardMetaRow}>
                   <Text style={styles.metaDataText}>{item.date}</Text>
                   <Text style={styles.metaDataDot}> • </Text>
                   <Text style={styles.metaDataText}>{item.author}</Text>
                   <View style={styles.rolePill}>
                     <Text style={styles.rolePillText}>{item.role}</Text>
                   </View>
                 </View>

                 {/* Body Content */}
                 <View style={styles.cardDashedDivider} />
                 <Text style={styles.cardBodyText}>{item.content}</Text>

                 {/* Tags */}
                 <View style={styles.tagsContainer}>
                   {item.tags.map(tag => renderTag(tag))}
                 </View>

                 <View style={styles.cardDivider} />

                 {/* Actions */}
                 <View style={styles.cardActionsRow}>
                   <TouchableOpacity style={styles.actionBtnOutline}>
                     <Ionicons name="pencil" size={14} color="#475569" style={{marginRight: 6}} />
                     <Text style={styles.actionBtnOutlineText}>Edit Announcement</Text>
                   </TouchableOpacity>

                   <TouchableOpacity style={styles.actionBtnSolidDanger}>
                     <Ionicons name="trash" size={14} color="#FFF" style={{marginRight: 6}} />
                     <Text style={styles.actionBtnSolidDangerText}>Delete</Text>
                   </TouchableOpacity>
                 </View>

              </View>
            ))
          )}
        </Animated.View>

      </ScrollView>

      {/* --- NEW ANNOUNCEMENT MODAL --- */}
      <Modal visible={isNewModalOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setIsNewModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalTopHeader}>
              <Text style={styles.modalTopTitle}>New Announcement</Text>
              <TouchableOpacity onPress={() => setIsNewModalOpen(false)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput style={styles.modalTextInput} placeholder="Enter Announcement Title" placeholderTextColor="#94A3B8" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Content</Text>
                <TextInput style={[styles.modalTextInput, styles.modalTextArea]} multiline placeholder="Enter Announcement Details" placeholderTextColor="#94A3B8" textAlignVertical="top" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  <TouchableOpacity style={[styles.catBox, {backgroundColor: '#FEE2E2', borderColor: selectedCategory==='urgent' ? '#3B82F6': '#FECACA'}, selectedCategory==='urgent' && styles.catBoxSelected]} onPress={() => setSelectedCategory('urgent')}>
                    <Text style={[styles.catText, {color: '#DC2626'}]}>urgent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.catBox, {backgroundColor: '#DCFCE7', borderColor: selectedCategory==='general' ? '#3B82F6': '#bbf7d0'}, selectedCategory==='general' && styles.catBoxSelected]} onPress={() => setSelectedCategory('general')}>
                    <Text style={[styles.catText, {color: '#16A34A'}]}>general</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.catBox, {backgroundColor: '#F3E8FF', borderColor: selectedCategory==='event' ? '#3B82F6': '#E9D5FF'}, selectedCategory==='event' && styles.catBoxSelected]} onPress={() => setSelectedCategory('event')}>
                    <Text style={[styles.catText, {color: '#9333EA'}]}>event</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.catBox, {backgroundColor: '#DBEAFE', borderColor: selectedCategory==='update' ? '#3B82F6': '#BFDBFE'}, selectedCategory==='update' && styles.catBoxSelected]} onPress={() => setSelectedCategory('update')}>
                    <Text style={[styles.catText, {color: '#2563EB'}]}>update</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.inputLabel}>Priority</Text>
                  <TouchableOpacity style={styles.dropdownBox}>
                    <Text style={styles.dropdownText}>Medium</Text>
                    <Ionicons name="chevron-down" size={16} color="#1E293B" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Status</Text>
                  <TouchableOpacity style={styles.dropdownBox}>
                    <Text style={styles.dropdownText}>Published</Text>
                    <Ionicons name="chevron-down" size={16} color="#1E293B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.inputLabel}>Target Audience</Text>
                  <TouchableOpacity style={styles.dropdownBox}>
                    <Text style={styles.dropdownText}>All (Staff, Students)</Text>
                    <Ionicons name="chevron-down" size={16} color="#1E293B" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Expiry Date (Optional)</Text>
                  <TouchableOpacity style={styles.datePickerBox} onPress={() => setDatePickerTarget(true)}>
                    <Text style={[styles.datePickerTextPlaceholder, expiryDate && {color: '#1E293B'}]}>{expiryDate || 'mm/dd/yyyy'}</Text>
                    <Ionicons name="calendar-outline" size={16} color="#1E293B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsNewModalOpen(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.publishBtn} onPress={() => setIsNewModalOpen(false)}>
                  <Text style={styles.publishBtnText}>Publish Announcement</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- PURE JAVASCRIPT DATE PICKER --- */}
      <Modal statusBarTranslucent={true} visible={datePickerTarget} transparent animationType="fade" onRequestClose={() => setDatePickerTarget(false)}>
        <View style={[styles.modalOverlay, { zIndex: 999 }]}>
           <View style={styles.calModalContainer}>
             <View style={styles.calHeader}>
               <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}><Ionicons name="chevron-back" size={20} color="#111827" /></TouchableOpacity>
               <Text style={styles.calMonthText}>
                 {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
               </Text>
               <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}><Ionicons name="chevron-forward" size={20} color="#111827" /></TouchableOpacity>
             </View>
             
             <View style={styles.calWeekdaysRow}>
               {['S','M','T','W','T','F','S'].map((wd, i) => <Text key={i} style={styles.calWeekdayText}>{wd}</Text>)}
             </View>
             
             <View style={styles.calDaysGrid}>
               {generateDates().map((day, idx) => (
                 <TouchableOpacity 
                   key={idx} 
                   style={[styles.calDayBtn, !day && {backgroundColor: 'transparent'}]} 
                   onPress={() => handleDateSelect(day)}
                   disabled={!day}
                 >
                   {day && <Text style={styles.calDayText}>{day}</Text>}
                 </TouchableOpacity>
               ))}
             </View>

             <TouchableOpacity style={styles.calCancelBtn} onPress={() => setDatePickerTarget(false)}>
               <Text style={styles.cancelBtnText}>Cancel</Text>
             </TouchableOpacity>
           </View>
        </View>
      </Modal>

      {/* Navigation Drawer */}
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="Principal" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 16 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, 
    paddingBottom: 16,
    backgroundColor: '#FFF',
    zIndex: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 8
  },
  menuHandle: { paddingRight: 4, paddingVertical: 8 }, 
  topHeaderTitle: { fontSize: 18, fontWeight: '600', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#A78BFA',
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  pageTitleContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  pageSubtitle: { color: '#64748B', fontSize: 13, fontWeight: '500' },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
  },
  newBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600', marginLeft: 4 },

  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 20,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2563EB',
  },

  cardsContainer: {
    marginBottom: 20,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 8,
  },
  statusPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaDataText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  metaDataDot: { fontSize: 12, color: '#94A3B8', marginHorizontal: 4 },
  rolePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  rolePillText: { fontSize: 10, fontWeight: '700', color: '#2563EB' },

  cardBodyText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 20,
  },

  cardDashedDivider: {
    height: 1,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },

  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  actionBtnSolidDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionBtnSolidDangerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },

  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  paginationBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  paginationBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  paginationPageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },

  emptyStateContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  modalTopHeader: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTopTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalScrollBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#FFF',
  },
  modalTextArea: {
    height: 120,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catBox: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: '48%',
    flex: 1,
    alignItems: 'center',
  },
  catBoxSelected: {
    borderWidth: 1.5,
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  dropdownText: {
    fontSize: 13,
    color: '#1E293B',
  },
  datePickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  datePickerTextPlaceholder: {
    fontSize: 13,
    color: '#64748B',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  publishBtn: {
    flex: 1.5,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  publishBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // --- CALENDAR MODAL STYLES ---
  calModalContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calNavBtn: { width: 32, height: 32, backgroundColor: '#F3F4F6', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  calMonthText: { fontSize: 15, fontWeight: '800', color: '#111827' },
  calWeekdaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  calWeekdayText: { width: '14%', textAlign: 'center', fontSize: 11, fontWeight: '800', color: '#9CA3AF' },
  calDaysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  calDayBtn: { width: '14%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 8 },
  calDayText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  calCancelBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' }

});

export default PrincipalAnnouncementsScreen;
