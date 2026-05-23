import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { useTheme } from '../../store/ThemeContext';
import Skeleton from '../../components/common/Skeleton';

const PageSkeleton = () => {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.pageTitleWrapper}>
        <Skeleton width="50%" height={24} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={16} />
      </View>
      <View style={styles.meCard}>
         <Skeleton width="40%" height={20} style={{marginBottom: 10}} />
         <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Skeleton width="30%" height={30} />
            <Skeleton width="40%" height={24} borderRadius={16} />
         </View>
         <Skeleton width="100%" height={6} borderRadius={3} style={{marginTop: 15}} />
      </View>
      <View style={styles.mainCard}>
        <Skeleton width="50%" height={20} style={{marginBottom: 20}} />
        {[1, 2].map(i => (
          <View key={i} style={[styles.classCard, {padding: 15}]}>
            <Skeleton width="60%" height={20} style={{marginBottom: 10}} />
            <Skeleton width="40%" height={14} style={{marginBottom: 15}} />
            <Skeleton width="100%" height={40} borderRadius={8} style={{marginBottom: 10}} />
            <Skeleton width="100%" height={40} borderRadius={8} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherAttendance'>;

const TeacherAttendanceScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const [classes, setClasses] = useState<any[]>([]);
  const [myAttendance, setMyAttendance] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teacherId = authState.user?.id;
        if (!teacherId) return;

        const [classesRes, meRes, summaryRes] = await Promise.all([
          apiClient.get(ENDPOINTS.TEACHER.CLASSES(teacherId)),
          apiClient.get(ENDPOINTS.TEACHER.MY_ATTENDANCE),
          apiClient.get(ENDPOINTS.TEACHER.DASHBOARD(teacherId))
        ]);
        
        // Handle both wrapped and unwrapped (normalized) formats for classes
        const classData = classesRes.data || classesRes;
        const fetchedClasses = Array.isArray(classData) ? classData : (classData.classes || []);
        
        setClasses(fetchedClasses);
        setMyAttendance(meRes.data?.data || meRes.data || null);
        setSummary(summaryRes.data?.summary || null);
      } catch (error) {
        console.error('Failed to fetch attendance portal data:', error);
        // TEMPORARY: Mock data fallback
        setClasses([
          { id: 'c1', name: 'Class 10', section: 'A', totalStudents: 45, grade: 'Secondary', todayStatus: 'marked' },
          { id: 'c2', name: 'Class 9', section: 'B', totalStudents: 38, grade: 'Secondary', todayStatus: 'pending' },
        ]);
        setMyAttendance({ percentage: 94 });
      } finally { setIsLoading(false); }
    };
    fetchData();
  }, [authState.user?.id]);

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {/* Global Header */}
      <View style={[styles.globalHeader, { backgroundColor: theme.surface }]}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
        >
          <Ionicons name="menu" size={28} color={theme.text} />
        </ScaleButton>
        <Text style={[styles.headerTitle, { color: theme.primary }]} numberOfLines={1}>
          Welcome back, {authState.user?.name?.split(' ')[0] || 'Teacher'}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AccountSettings')} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleDarkMode} style={styles.iconBtn}>
            <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: '#A855F7' }]}>
            <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <PageSkeleton />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Page Title Wrapper */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
          <Text style={styles.pageTitle}>Attendance Portal</Text>
          <Text style={styles.pageSubtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        </Animated.View>

        {/* My Attendance Summary Card */}
        {myAttendance && (
          <Animated.View entering={FadeInUp.delay(50).springify()} style={styles.meCard}>
             <View style={styles.meInfo}>
                <View>
                   <Text style={styles.meTitle}>My Attendance</Text>
                   <Text style={styles.meSubtitle}>Current Month Performance</Text>
                </View>
                   <View style={styles.meStatRow}>
                      <View style={styles.meStat}>
                         <Text style={styles.meStatVal}>{myAttendance.percentage || 0}%</Text>
                         <Text style={styles.meStatLab}>Attendance</Text>
                      </View>
                      <TouchableOpacity 
                         style={styles.historyLink} 
                         onPress={() => navigation.navigate('TeacherSelfAttendance')}
                      >
                         <Text style={styles.historyLinkText}>View Detailed Logs</Text>
                         <Ionicons name="arrow-forward" size={12} color="#FFF" />
                      </TouchableOpacity>
                   </View>
                   <View style={styles.meProgressBase}>
                      <View style={[styles.meProgressFill, { width: `${myAttendance.percentage || 0}%` }]} />
                   </View>
             </View>
          </Animated.View>
        )}

        {/* Big White Main Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.mainCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="checkbox" size={20} color="#111827" />
            <Text style={styles.cardHeaderTitle}>Today's Attendance</Text>
          </View>

          {/* List of Classes */}
          {isLoading ? (
            <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />
          ) : classes.length === 0 ? (
            <Text style={styles.emptyText}>No classes assigned to you.</Text>
          ) : (
            classes.map((item, index) => {
              const isMarked = item.todayStatus === 'marked';
              return (
                <Animated.View key={item.id} entering={FadeInUp.delay(150 + index * 100).springify()} style={styles.classCard}>
  
                  {/* Class Info Top Area */}
                  <View style={styles.classInfoContainer}>
                    <View>
                      <Text style={styles.classNameText}>{item.name} - {item.section}</Text>
                      <View style={styles.classMetaRow}>
                        <View style={styles.metaBadge}>
                          <Ionicons name="people" size={13} color="#4F46E5" style={{ marginRight: 6 }} />
                          <Text style={styles.metaText}>{item.totalStudents || 0} Students</Text>
                        </View>
                        <View style={[styles.metaBadge, { marginLeft: 20 }]}>
                          <Ionicons name="book" size={13} color="#3B82F6" style={{ marginRight: 6 }} />
                          <Text style={styles.metaText}>{item.grade || 'General'}</Text>
                        </View>
                      </View>
                    </View>
    
                    {isMarked && (
                      <View style={styles.markedPill}>
                        <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.markedPillText}>Marked</Text>
                      </View>
                    )}
                  </View>
    
                  {/* Action Buttons */}
                  <View style={styles.actionsContainer}>
                    {/* View Details Row */}
                    <TouchableOpacity style={styles.actionBtnWhite} activeOpacity={0.7} onPress={() => navigation.navigate('TeacherViewAttendance', { classId: item.id })}>
                      <View style={styles.actionBtnLeft}>
                        <View style={styles.checkboxOutline}>
                          <Ionicons name="checkmark" size={12} color="#9CA3AF" />
                        </View>
                        <Text style={styles.actionBtnText}>View Attendance Details</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
                    </TouchableOpacity>
    
                    {/* Mark/Edit Row */}
                    <TouchableOpacity style={styles.actionBtnPurple} activeOpacity={0.7} onPress={() => navigation.navigate('TeacherMarkAttendance', { classId: item.id, className: item.name })}>
                      <View style={styles.actionBtnLeft}>
                        <View style={styles.checkboxFilled}>
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        </View>
                        <Text style={styles.actionBtnText}>Mark/Edit Attendance</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
                    </TouchableOpacity>
                  </View>
    
                </Animated.View>
              );
            })
          )}
        </Animated.View>

      </ScrollView>
      )}

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="teacher"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40 },

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
    zIndex: 10,
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBtn: { padding: 4 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 16, marginTop: 20 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#4F46E5', marginBottom: 4 },
  pageSubtitle: { fontSize: 11, color: '#6B7280', fontWeight: '500' },

  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  classCard: {
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  classInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  classNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  classMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  markedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  markedPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  actionsContainer: {
    gap: 12,
  },
  actionBtnWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  actionBtnPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
  },
  actionBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxOutline: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxFilled: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
  meCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  meInfo: { gap: 12 },
  meTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  meSubtitle: { color: '#E0E7FF', fontSize: 10, fontWeight: '500' },
  meStatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meStat: { alignItems: 'flex-start' },
  meStatVal: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  meStatLab: { color: '#E0E7FF', fontSize: 9, fontWeight: '700' },
  historyLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 5 },
  historyLinkText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  meProgressBase: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 12 },
  meProgressFill: { height: 6, backgroundColor: '#FFF', borderRadius: 3 },
});

export default TeacherAttendanceScreen;
