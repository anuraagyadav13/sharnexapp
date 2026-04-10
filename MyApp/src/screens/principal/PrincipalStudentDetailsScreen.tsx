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
  ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

const StatCard = React.memo(({ icon, value, label }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statIconTextBox}>
      <View style={styles.statIconBoxSquare}>
        <Ionicons name={icon} size={18} color="#A855F7" />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  </View>
));


const PrincipalStudentDetailsScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activeClassIndex, setActiveClassIndex] = useState(0);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalStudents: 0, avgScore: 0, attendanceRate: 0, activeClasses: 0 });

  // Fetch all classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoadingClasses(true);
        const res = await apiClient.get(ENDPOINTS.PRINCIPAL.CLASSES);
        
        if (!res.data.success) {
          throw new Error(res.data.message || 'Failed to fetch classes');
        }
        
        const classList = res.data.data || [];
        setClasses(classList);
        
        // Compute stats
        setStats({
          totalStudents: classList.reduce((sum: number, c: any) => sum + (c.totalStudents || 0), 0),
          avgScore: 88.7, // This would come from a dedicated API if available
          attendanceRate: 96,
          activeClasses: classList.length
        });
        
        // Fetch students for first class if available
        if (classList.length > 0) {
          await fetchStudentsForClass(classList[0].id || classList[0].name);
        }
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch students when active class changes
  const fetchStudentsForClass = async (classIdentifier: string) => {
    try {
      setIsLoadingStudents(true);
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.STUDENTS, {
        params: { class: classIdentifier }
      });
      
      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to fetch students');
      }
      
      setStudents(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleClassChange = (index: number) => {
    setActiveClassIndex(index);
    if (classes.length > index) {
      fetchStudentsForClass(classes[index].id || classes[index].name);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentClass = classes.length > activeClassIndex ? classes[activeClassIndex] : null;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent={false} />

      {/* Top Standard Header */}
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
          <TouchableOpacity style={styles.iconBtnTransparent}><Ionicons name="notifications-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent} onPress={() => navigation.navigate('AccountSettings')}><Ionicons name="settings-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent}><Ionicons name="moon-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}><View style={styles.avatar}><Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'A'}</Text></View></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionPadding}>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>Students details</Text>
            <Text style={styles.screenSubtitle}>Class-Wise students details</Text>
          </View>

          {/* Stat Cards 2x2 Grid */}
          <View style={styles.statCardsGrid}>
            <View style={styles.statCardRow}>
              <StatCard icon="school-outline" value={stats.totalStudents.toString()} label="Total Students" />
              <StatCard icon="school-outline" value={stats.avgScore.toString()} label="Average Score" />
            </View>
            <View style={styles.statCardRow}>
              <StatCard icon="school-outline" value={`${stats.attendanceRate}%`} label="Attendance Rate" />
              <StatCard icon="school-outline" value={stats.activeClasses.toString()} label="Active Classes" />
            </View>
          </View>

          {/* Class Tabs */}
          <View style={styles.classTabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {isLoadingClasses ? (
                <ActivityIndicator size="small" color="#4F46E5" style={{ marginTop: 8 }} />
              ) : classes.length === 0 ? (
                <Text style={styles.emptyText}>No classes found</Text>
              ) : (
                classes.map((cls, index) => (
                  <TouchableOpacity
                    key={cls.id || index}
                    style={[styles.classTabBtn, activeClassIndex === index && styles.classTabBtnActive]}
                    onPress={() => handleClassChange(index)}
                  >
                    <Text style={[styles.classTabBtnText, activeClassIndex === index && styles.classTabBtnTextActive]}>
                      {cls.name} ({cls.totalStudents || 0})
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          {/* Purple Hero Card */}
          <Animated.View entering={FadeInUp.duration(300)} style={styles.heroCard}>
            <Text style={styles.heroTitle}>{currentClass?.name || 'Select a Class'}</Text>
            <View style={styles.heroTeacherRow}>
              <Ionicons name="people" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroTeacherText}>Class Teacher : {currentClass?.classTeacher || 'N/A'}</Text>
            </View>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{currentClass?.totalStudents || 0}</Text>
                <Text style={styles.heroStatLabel}>Students</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>88.7%</Text>
                <Text style={styles.heroStatLabel}>Avg Score</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>96%</Text>
                <Text style={styles.heroStatLabel}>Attendance</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>--</Text>
                <Text style={styles.heroStatLabel}>Top performer</Text>
              </View>
            </View>
          </Animated.View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={16} color="#6B7280" style={{ marginLeft: 12, marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search Student in ${currentClass?.name || 'class'}`}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtnOutline}>
              <Ionicons name="push-outline" size={16} color="#374151" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnOutlineText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnOutline}>
              <Ionicons name="print-outline" size={16} color="#374151" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnOutlineText}>Print</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnSolid} onPress={() => navigation.navigate('PrincipalAddStudent')}>
              <Text style={styles.actionBtnSolidText}>+ Add Student</Text>
            </TouchableOpacity>
          </View>

          {/* Table Container */}
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Student</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Roll No</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Avg. Grade</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Attendance</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Performance</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Actions</Text>
            </View>
            <View style={styles.tableBodyEmpty}>
              {isLoadingStudents ? (
                <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 40 }} />
              ) : filteredStudents.length === 0 ? (
                <Text style={styles.emptyText}>No students found in this class</Text>
              ) : (
                filteredStudents.map((student: any) => (
                  <View key={student.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{student.name}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>{student.rollNo || '-'}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>{student.cgpa ? student.cgpa.toFixed(1) : '-'}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{student.attendanceRate ? `${student.attendanceRate}%` : '-'}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{student.performance || 'Good'}</Text>
                    <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end', paddingRight: 12 }}>
                      <Ionicons name="ellipsis-vertical" size={16} color="#4F46E5" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  sectionPadding: { paddingHorizontal: 16 },

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
  },
  menuHandle: { paddingRight: 4, paddingVertical: 8 },
  topHeaderTitle: { fontSize: 18, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#A78BFA',
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  titleSection: { marginTop: 10, marginBottom: 20 },
  screenTitle: { fontSize: 26, fontWeight: '700', color: '#3B82F6', letterSpacing: -0.5 },
  screenSubtitle: { color: '#6B7280', fontSize: 12, marginTop: 4, fontWeight: '500' },

  statCardsGrid: { gap: 12, marginBottom: 20 },
  statCardRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  statIconTextBox: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  statIconBoxSquare: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, color: '#374151', fontWeight: '500' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 2 },

  classTabsContainer: { marginBottom: 20 },
  classTabBtn: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  classTabBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  classTabBtnText: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  classTabBtnTextActive: { color: '#FFF' },

  heroCard: {
    backgroundColor: '#7C3AED', // deep purple
    borderRadius: 16,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  heroTeacherRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  heroTeacherText: { color: '#E0E7FF', fontSize: 12, fontWeight: '500' },
  heroStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroStatItem: { alignItems: 'flex-start' },
  heroStatValue: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  heroStatLabel: { color: '#E0E7FF', fontSize: 11, fontWeight: '500' },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: 44,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#111827' },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionBtnOutlineText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  actionBtnSolid: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionBtnSolidText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  tableCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 12,
    minHeight: 200, // as shown in image, empty space below
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableHeaderText: { color: '#9CA3AF', fontSize: 10, fontWeight: '600' },
  tableBodyEmpty: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 30,
    fontWeight: '500',
  },

});

export default PrincipalStudentDetailsScreen;
