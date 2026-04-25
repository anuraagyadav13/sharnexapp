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
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PageSkeleton = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.pageHeader}>
      <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={16} />
    </View>
    <View style={styles.statsRow}>
      <Skeleton width="31%" height={100} borderRadius={16} />
      <Skeleton width="31%" height={100} borderRadius={16} />
      <Skeleton width="31%" height={100} borderRadius={16} />
    </View>
    <View style={{ marginTop: 30 }}>
      <Skeleton width="100%" height={160} borderRadius={20} />
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

const StudentCard = ({ item, index, delay }: any) => {
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
        <TouchableOpacity style={styles.circleActionBtn}>
          <Ionicons name="chevron-forward" size={18} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
           <Text style={styles.metricLabel}>AVG. GRADE</Text>
           <Text style={styles.metricVal}>{item.grade || 'A+'}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
           <Text style={styles.metricLabel}>ATTENDANCE</Text>
           <Text style={[styles.metricVal, { color: '#10B981' }]}>{item.attendanceRate || '95'}%</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
           <Text style={styles.metricLabel}>PERFORMANCE</Text>
           <View style={styles.perfPill}><Text style={styles.perfText}>{item.performance || 'EXCELLENT'}</Text></View>
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
  const [students, setStudents] = useState<any[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.CLASSES);
      const classList = res.data.data || res.data || [];
      setClasses(classList);
      
      if (classList.length > 0) {
        const firstId = classList[0].id || classList[0].name;
        setActiveClassId(firstId);
        fetchStudents(firstId);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setClasses([]);
      setIsLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.STUDENTS, { params: { class: classId } });
      setStudents(res.data.data || res.data || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    } finally {
      setIsLoading(false);
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

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Global Header - Student Pattern */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color="#4F46E5" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Student Directory</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnHeader} onPress={() => navigation.navigate('PrincipalAddStudent')}>
            <Ionicons name="person-add-outline" size={24} color="#4F46E5" />
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
            <Text style={styles.screenTitle}>Academic Roll</Text>
            <Text style={styles.screenSubtitle}>View enrollment data, grades, and attendance class-wise.</Text>
          </View>

          {/* Stats Row - Student Pattern */}
          <View style={styles.statsRow}>
            <StatCard title="Enrolled" value={currentClass?.totalStudents || 0} color="#3B82F6" icon="school-outline" />
            <StatCard title="Avg Attendance" value={currentClass?.avgAttendance || '--'} color="#10B981" icon="calendar-check-outline" />
            <StatCard title="Top Grades" value={currentClass?.topGrades || '--'} color="#8B5CF6" icon="star-outline" />
          </View>

          {/* Class Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.id || cls.name}
                  style={[styles.classTab, activeClassId === (cls.id || cls.name) && styles.classTabActive]}
                  onPress={() => {
                    setActiveClassId(cls.id || cls.name);
                    fetchStudents(cls.id || cls.name);
                  }}
                >
                  <Text style={[styles.classTabText, activeClassId === (cls.id || cls.name) && styles.classTabTextActive]}>{cls.name}</Text>
                  <View style={[styles.countBadge, activeClassId === (cls.id || cls.name) && styles.countBadgeActive]}>
                    <Text style={[styles.countText, activeClassId === (cls.id || cls.name) && styles.countTextActive]}>{cls.totalStudents || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Class Hero Info */}
          <Animated.View entering={FadeInUp.duration(400)} style={styles.classHero}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgLinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#6366F1" stopOpacity="1" />
                  <Stop offset="1" stopColor="#4F46E5" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#heroGrad)" rx={24} ry={24} />
            </Svg>
            <View style={styles.heroContent}>
               <View style={styles.heroMain}>
                  <Text style={styles.heroTitle}>{currentClass?.name || 'Loading...'}</Text>
                  <View style={styles.heroTeacherRow}>
                    <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroTeacherName}>Class Teacher: {currentClass?.teacher || 'TBA'}</Text>
                  </View>
               </View>
               <View style={styles.heroDivider} />
               <View style={styles.heroStats}>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatVal}>{currentClass?.passRate || '--'}</Text>
                    <Text style={styles.heroStatLab}>PASS RATE</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatVal}>{currentClass?.gpaAvg || '--'}</Text>
                    <Text style={styles.heroStatLab}>GPA AVG</Text>
                  </View>
               </View>
            </View>
          </Animated.View>

          {/* Search Bar - Student Pattern */}
          <View style={styles.searchWrapper}>
             <Ionicons name="search-outline" size={20} color="#94A3B8" />
             <TextInput 
               placeholder="Search by student name or roll number..." 
               placeholderTextColor="#94A3B8"
               style={styles.searchInput}
               value={searchQuery}
               onChangeText={setSearchQuery}
             />
          </View>

          {/* Student List */}
          <View style={styles.listContainer}>
            {students
              .filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item, index) => (
                <StudentCard key={item.id} item={item} index={index} delay={index * 50} />
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
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  statCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0', width: '31%', minHeight: 110 },
  statIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginTop: 2 },
  statTitle: { fontSize: 9, fontWeight: '700', color: '#6B7280', marginTop: 6, textAlign: 'center', width: '100%', textTransform: 'uppercase' },

  // Tabs
  tabsContainer: { marginBottom: 20 },
  tabsScroll: { paddingHorizontal: 20, gap: 10 },
  classTab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', gap: 8 },
  classTabActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  classTabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  classTabTextActive: { color: '#FFF' },
  countBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  countText: { fontSize: 10, fontWeight: '800', color: '#6B7280' },
  countTextActive: { color: '#FFF' },

  // Hero
  classHero: { height: 160, borderRadius: 24, marginHorizontal: 20, padding: 20, overflow: 'hidden', justifyContent: 'center' },
  heroContent: { flex: 1, justifyContent: 'space-between' },
  heroMain: {},
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  heroTeacherRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  heroTeacherName: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 },
  heroStats: { flexDirection: 'row', gap: 25 },
  heroStatItem: {},
  heroStatVal: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  heroStatLab: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },

  // Search
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, paddingHorizontal: 15, height: 50, borderRadius: 15, borderWidth: 1, borderColor: '#F1F5F9', marginTop: 25, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1F2937', fontWeight: '500' },

  // List
  listContainer: { paddingHorizontal: 20 },
  studentCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  studentHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  avatarTextMain: { fontSize: 18, fontWeight: '800', color: '#4F46E5' },
  studentMainInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  studentRoll: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  circleActionBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  metricsGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricItem: { alignItems: 'center', flex: 1 },
  metricDivider: { width: 1, height: 30, backgroundColor: '#F1F5F9' },
  metricLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginBottom: 4 },
  metricVal: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  perfPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  perfText: { fontSize: 9, fontWeight: '800', color: '#10B981' },
});

export default PrincipalStudentDetailsScreen;
