import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown, SlideInRight, SlideInDown } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StatusPill = ({ status }: { status: string }) => {
  const getTheme = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'ACTIVE': return { bg: '#DCFCE7', color: '#10B981' };
      case 'DRAFT': return { bg: '#FEF3C7', color: '#F59E0B' };
      default: return { bg: '#F1F5F9', color: '#64748B' };
    }
  };
  const theme = getTheme(status);
  return (
    <View style={[styles.pill, { backgroundColor: theme.bg }]}>
      <Text style={[styles.pillText, { color: theme.color }]}>{status}</Text>
    </View>
  );
};

const PrincipalRSMscreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Definitions');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const [examsRes, classesRes] = await Promise.all([
        apiClient.get(ENDPOINTS.PRINCIPAL.EXAMS),
        apiClient.get(ENDPOINTS.PRINCIPAL.CLASSES)
      ]);
      setExams(examsRes.normalized?.data || examsRes.data.data || []);
      setClasses(classesRes.normalized?.data || classesRes.data.data || []);
    } catch (error) {
      setExams([
        { id: '1', name: 'Annual Examination 2026', type: 'Subjective', year: '2026', status: 'ACTIVE', scope: 'Institutional' },
        { id: '2', name: 'Mid-Term Assessment', type: 'Objective', year: '2026', status: 'DRAFT', scope: 'Class Specific' },
        { id: '3', name: 'Quarterly Review', type: 'Hybrid', year: '2026', status: 'ARCHIVED', scope: 'Institutional' },
      ]);
      setClasses([{ id: 'c1', name: 'Class 10-A' }, { id: 'c2', name: 'Class 12-B' }]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setIsRefreshing(true); fetchData(); };

  const filteredExams = exams.filter(e => 
    e.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Global Header - Student Pattern */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color="#4F46E5" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Result Management</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}>
            <View style={styles.avatarHeader}>
              <Text style={styles.avatarTextHeader}>{authState.user?.name?.charAt(0) || 'A'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.screenTitle}>Academic Records</Text>
          <Text style={styles.screenSubtitle}>Official certification management and institutional result analytics.</Text>
        </View>

        {/* Premium Tab Switcher */}
        <View style={styles.tabRow}>
           {['Definitions', 'Analytics'].map(t => (
             <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
             </TouchableOpacity>
           ))}
        </View>

        {activeTab === 'Definitions' ? (
          <Animated.View entering={FadeInUp}>
            <View style={styles.searchRow}>
               <View style={styles.searchBox}>
                  <Ionicons name="search-outline" size={20} color="#94A3B8" />
                  <TextInput 
                    placeholder="Search examinations..." 
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={setSearchText}
                  />
               </View>
               <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('PrincipalCreateExam')}>
                  <Ionicons name="add" size={24} color="#FFF" />
               </TouchableOpacity>
            </View>

            <View style={styles.list}>
              {isLoading && !isRefreshing ? (
                [1, 2].map(i => <Skeleton key={i} width="100%" height={160} borderRadius={24} style={{ marginBottom: 16 }} />)
              ) : filteredExams.length === 0 ? (
                <View style={styles.empty}>
                   <MaterialCommunityIcons name="file-document-outline" size={60} color="#D1D5DB" />
                   <Text style={styles.emptyText}>No exam definitions found.</Text>
                </View>
              ) : (
                filteredExams.map((exam, index) => (
                  <Animated.View entering={FadeInUp.delay(index * 50)} key={exam.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                       <View style={styles.iconCircle}>
                          <MaterialCommunityIcons name="file-certificate-outline" size={24} color="#4F46E5" />
                       </View>
                       <View style={styles.examMain}>
                          <Text style={styles.examName}>{exam.name}</Text>
                          <Text style={styles.examMeta}>{exam.type} • {exam.year}</Text>
                       </View>
                       <StatusPill status={exam.status} />
                    </View>
                    <View style={styles.cardFooter}>
                       <View style={styles.metaBox}>
                          <Ionicons name="location-outline" size={14} color="#94A3B8" />
                          <Text style={styles.metaBoxText}>{exam.scope}</Text>
                       </View>
                       <View style={styles.actions}>
                          <TouchableOpacity style={styles.actionBtn}><Ionicons name="eye-outline" size={18} color="#6366F1" /></TouchableOpacity>
                          <TouchableOpacity style={styles.actionBtn}><Ionicons name="pencil-outline" size={18} color="#6366F1" /></TouchableOpacity>
                       </View>
                    </View>
                  </Animated.View>
                ))
              )}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={SlideInRight} style={styles.analyticsPanel}>
            <View style={styles.selectionGrid}>
               <Text style={styles.gridLabel}>CONFIGURE ANALYTICS VIEW</Text>
               
               <TouchableOpacity style={styles.picker} onPress={() => setIsExamModalOpen(true)}>
                  <View style={styles.pickerIcon}><MaterialCommunityIcons name="file-certificate" size={20} color="#4F46E5" /></View>
                  <Text style={styles.pickerText}>{selectedExam ? selectedExam.name : 'Select Examination Target'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#94A3B8" />
               </TouchableOpacity>

               <TouchableOpacity style={styles.picker} onPress={() => setIsClassModalOpen(true)}>
                  <View style={styles.pickerIcon}><MaterialCommunityIcons name="google-classroom" size={20} color="#4F46E5" /></View>
                  <Text style={styles.pickerText}>{selectedClass ? selectedClass.name : 'Select Class Unit'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#94A3B8" />
               </TouchableOpacity>

               <TouchableOpacity style={styles.primaryActionBtn}>
                  <Text style={styles.primaryActionText}>Generate Analytics Report</Text>
               </TouchableOpacity>
            </View>

            <View style={styles.emptyResults}>
               <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={80} color="#E2E8F0" />
               <Text style={styles.emptyResultsText}>Select configuration above to synthesize result data.</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Premium Modals */}
      <SelectionModal visible={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} title="Select Examination" data={exams} onSelect={setSelectedExam} />
      <SelectionModal visible={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Select Class Unit" data={classes} onSelect={setSelectedClass} />

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const SelectionModal = ({ visible, onClose, title, data, onSelect }: any) => (
  <Modal visible={visible} transparent animationType="none">
    <View style={styles.modalOverlay}>
       <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
       <Animated.View entering={SlideInDown} style={styles.modalSheet}>
          <View style={styles.modalIndicator} />
          <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>{title}</Text>
             <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Ionicons name="close" size={24} color="#64748B" /></TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={styles.modalItemText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
       </Animated.View>
    </View>
  </Modal>
);

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
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatarHeader: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  // Tabs
  tabRow: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, padding: 4, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 25 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
  tabActive: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFF' },

  // Search
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 25 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', height: 52, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1E293B', fontWeight: '600' },
  addBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },

  // List
  list: { paddingHorizontal: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  examMain: { flex: 1, marginLeft: 15 },
  examName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  examMeta: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  pillText: { fontSize: 10, fontWeight: '900' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  metaBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaBoxText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },

  // Analytics
  analyticsPanel: { paddingHorizontal: 20 },
  selectionGrid: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', gap: 15 },
  gridLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 5 },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  pickerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  pickerText: { flex: 1, fontSize: 14, color: '#1E293B', fontWeight: '700' },
  primaryActionBtn: { backgroundColor: '#4F46E5', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryActionText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  emptyResults: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyResultsText: { marginTop: 15, fontSize: 13, color: '#94A3B8', textAlign: 'center', maxWidth: '80%', fontWeight: '500', lineHeight: 20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  modalItemText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '600', marginTop: 15 },
});

export default PrincipalRSMscreen;
