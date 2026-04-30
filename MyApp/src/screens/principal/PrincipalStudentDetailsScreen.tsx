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
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PageSkeleton = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.pageHeader}>
      <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={16} />
    </View>
    <View style={styles.statsGrid}>
      <Skeleton width="48%" height={90} borderRadius={12} />
      <Skeleton width="48%" height={90} borderRadius={12} />
      <Skeleton width="48%" height={90} borderRadius={12} style={{ marginTop: 12 }} />
      <Skeleton width="48%" height={90} borderRadius={12} style={{ marginTop: 12 }} />
    </View>
    <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
      <Skeleton width="100%" height={160} borderRadius={20} />
    </View>
  </ScrollView>
);

const StatCard = ({ title, value, subtitle }: { title: string, value: string | number, subtitle?: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

const StudentCard = ({ item, index, delay, onEdit, onView }: any) => {
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.avatarWrapper}>
           <Text style={styles.avatarTextMain}>{item.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.studentMainInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentRoll}>Roll No: {item.rollNo || 'N/A'}</Text>
        </View>
        <View style={styles.actionIconsRow}>
          <TouchableOpacity style={styles.actionIconButton} onPress={onView}>
            <Ionicons name="eye-outline" size={16} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconButton} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconButton}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
           <Text style={styles.metricLabel}>AVERAGE GRADE</Text>
           <Text style={styles.metricVal}>{item.grade || '-'}</Text>
           {!item.grade && <Text style={styles.metricSub}>Grade data coming soon</Text>}
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
           <Text style={styles.metricLabel}>ATTENDANCE</Text>
           <Text style={[styles.metricVal, { color: item.attendanceRate ? '#10B981' : '#1F2937' }]}>{item.attendanceRate ? `${item.attendanceRate}%` : '-'}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
           <Text style={styles.metricLabel}>PERFORMANCE</Text>
           {item.performance ? (
             <View style={styles.perfPill}><Text style={styles.perfText}>{item.performance}</Text></View>
           ) : (
             <Text style={styles.metricVal}>-</Text>
           )}
        </View>
      </View>
    </Animated.View>
  );
};

const PrincipalStudentDetailsScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const [classesRes, studentsRes] = await Promise.all([
        apiClient.get(ENDPOINTS.PRINCIPAL.CLASSES),
        apiClient.get(ENDPOINTS.PRINCIPAL.STUDENTS)
      ]);
      const classList = classesRes.data.data || classesRes.data || [];
      const studentList = studentsRes.data.data || studentsRes.data || [];
      
      setClasses(classList);
      setAllStudents(studentList);
      
      if (classList.length > 0) {
        const firstId = classList[0].id || classList[0].name;
        setActiveClassId(firstId);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setClasses([]);
      setAllStudents([]);
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

  const currentClass = classes.find(c => (c.id || c.name) === activeClassId);
  const currentClassStudents = allStudents.filter(s => s.className === currentClass?.name || s.class_name === currentClass?.name || s.className === currentClass?.className);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Student Directory</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnHeader} onPress={() => navigation.navigate('PrincipalAddStudent')}>
            <Ionicons name="person-add-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
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
            <Text style={styles.screenTitle}>Students details</Text>
            <Text style={styles.screenSubtitle}>Class-Wise students details</Text>
          </View>

          {/* Stats Grid (4 Cards) */}
          <View style={styles.statsGrid}>
            <StatCard title="Total Students" value={allStudents.length} />
            <StatCard title="Average Score" value="N/A" subtitle="Coming soon" />
            <StatCard title="Attendance Rate" value="N/A" subtitle="Coming soon" />
            <StatCard title="Active Classes" value={classes.length} />
          </View>

          {/* Class Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {classes.map((cls) => {
                const clsId = cls.id || cls.name;
                const count = allStudents.filter(s => s.className === cls.name || s.class_name === cls.name || s.className === cls.className).length;
                return (
                  <TouchableOpacity
                    key={clsId}
                    style={[styles.classTab, activeClassId === clsId && styles.classTabActive]}
                    onPress={() => setActiveClassId(clsId)}
                  >
                    <Text style={[styles.classTabText, activeClassId === clsId && styles.classTabTextActive]}>{cls.name || cls.className} ({count})</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Class Hero Banner */}
          <Animated.View entering={FadeInUp.duration(400)} style={styles.classHero}>
            <View style={styles.heroMain}>
              <Text style={styles.heroTitle}>{currentClass?.name || 'Loading...'}</Text>
              <Text style={styles.heroTeacherName}>Class Teacher: {currentClass?.teacher || 'TBA'}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatVal}>{currentClassStudents.length}</Text>
                <Text style={styles.heroStatLab}>Students</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatVal}>-</Text>
                <Text style={styles.heroStatLab}>Avg Score</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatVal}>-</Text>
                <Text style={styles.heroStatLab}>Attendance</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatVal}>-</Text>
                <Text style={styles.heroStatLab}>Top performer</Text>
              </View>
            </View>
          </Animated.View>

          {/* Actions & Search */}
          <View style={styles.actionsWrapper}>
            <View style={styles.searchWrapper}>
              <Ionicons name="search-outline" size={18} color="#94A3B8" />
              <TextInput 
                placeholder={`Search students in ${currentClass?.name || 'Class'}...`} 
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionButtonsScroll}>
              <TouchableOpacity style={styles.secondaryBtn}>
                <Ionicons name="download-outline" size={16} color="#4B5563" />
                <Text style={styles.secondaryBtnText}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn}>
                <Ionicons name="print-outline" size={16} color="#4B5563" />
                <Text style={styles.secondaryBtnText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('PrincipalAddStudent')}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Add Students</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Student List */}
          <View style={styles.listContainer}>
            {currentClassStudents
              .filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item, index) => (
              <StudentCard 
                key={item.id} 
                item={item} 
                index={index} 
                delay={index * 50} 
                onEdit={() => navigation.navigate('PrincipalEditStudent', { studentId: item.id })}
                onView={() => navigation.navigate('PrincipalViewStudent', { studentId: item.id })}
              />
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

  // Header
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 16,
    backgroundColor: '#FAFAFF',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnHeader: { padding: 4 },
  avatarHeader: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageHeader: { marginBottom: 12, paddingHorizontal: 20, marginTop: 0 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 2, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 11, color: '#6B7280', fontWeight: '400', lineHeight: 16 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12, rowGap: 8 },
  statCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#F1F5F9' },
  statTitle: { fontSize: 10, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  statSubtitle: { fontSize: 9, color: '#94A3B8', marginTop: 2 },

  // Tabs
  tabsContainer: { marginBottom: 12 },
  tabsScroll: { paddingHorizontal: 20, gap: 8 },
  classTab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  classTabActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  classTabText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  classTabTextActive: { color: '#FFF' },

  // Hero
  classHero: { minHeight: 90, borderRadius: 12, marginHorizontal: 20, padding: 14, backgroundColor: '#6366F1', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  heroMain: {},
  heroTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
  heroTeacherName: { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '400', marginTop: 2 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between' },
  heroStatItem: { alignItems: 'center', flex: 1 },
  heroStatVal: { fontSize: 14, fontWeight: '700', color: '#FFF', marginBottom: 2 },
  heroStatLab: { fontSize: 8, fontWeight: '500', color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' },

  // Actions & Search
  actionsWrapper: { marginHorizontal: 20, marginTop: 16, marginBottom: 20 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 14, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13, color: '#1F2937' },
  actionButtonsScroll: { gap: 8 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  secondaryBtnText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 4 },
  primaryBtnText: { fontSize: 12, fontWeight: '600', color: '#FFF' },

  // List
  listContainer: { paddingHorizontal: 20 },
  studentCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1 },
  studentHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarTextMain: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  studentMainInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  studentRoll: { fontSize: 11, color: '#64748B', marginTop: 2 },
  actionIconsRow: { flexDirection: 'row', gap: 12 },
  actionIconButton: { padding: 4 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  metricItem: { flex: 1 },
  metricDivider: { width: 1, height: '100%', backgroundColor: '#F1F5F9', marginHorizontal: 10 },
  metricLabel: { fontSize: 9, fontWeight: '600', color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase' },
  metricVal: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  metricSub: { fontSize: 9, color: '#94A3B8', marginTop: 2 },
  perfPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  perfText: { fontSize: 9, fontWeight: '600', color: '#10B981' },
});

export default PrincipalStudentDetailsScreen;
