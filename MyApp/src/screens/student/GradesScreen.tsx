import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type GradesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Grades'>;

interface Props {
  navigation: GradesScreenNavigationProp;
}


const GradesScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Get student profile first to find student ID if needed
        const res = await apiClient.get(ENDPOINTS.STUDENT.GRADES);
        const gradeData = res.data.grades?.subjects || res.data.subjects || res.data.data || [];
        setGrades(Array.isArray(gradeData) ? gradeData : []);
      } catch (err: any) {
        console.error('Failed to fetch grades:', err);
        setError('Failed to load grades. Please try again.');
        setGrades([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrades();
  }, []);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <ScaleButton 
          style={styles.menuHandle} 
          onPress={() => setDrawerOpen(true)}
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Welcome back, {authState.user?.name?.split(' ')[0] || 'Student'}</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'S'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Title */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <Text style={styles.pageTitle}>Grades & Reports</Text>
           <Text style={styles.pageSubtitle}>View your grades and academic reports</Text>
        </Animated.View>

        {/* Subjects List */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle" size={60} color="#EF4444" />
            <Text style={styles.emptyText}>{error}</Text>
            <ScaleButton 
              style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#3B82F6', borderRadius: 8 }}
              onPress={() => {
                setError(null);
                setIsLoading(true);
                const fetchGrades = async () => {
                  try {
                    const res = await apiClient.get(ENDPOINTS.STUDENT.GRADES);
                    const gradeData = res.data.subjects || res.data.data || [];
                    setGrades(Array.isArray(gradeData) ? gradeData : []);
                  } catch (err: any) {
                    setError('Failed to load grades. Please try again.');
                  } finally {
                    setIsLoading(false);
                  }
                };
                fetchGrades();
              }}
              scaleTo={0.95}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
            </ScaleButton>
          </View>
        ) : grades.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={60} color="#E5E7EB" />
            <Text style={styles.emptyText}>No grade records found</Text>
          </View>
        ) : (
          grades.map((item, index) => (
            <Animated.View 
              key={item.id || index} 
              entering={FadeInUp.delay(100 + (index * 50)).springify()} 
              style={styles.subjectCard}
            >
               <View style={styles.cardHeaderRow}>
                 <View>
                   <Text style={styles.subjectName}>{item.name || item.subject_name || 'Subject'}</Text>
                   <Text style={styles.teacherName}>{item.exam_name || 'Annual Examination'}</Text>
                 </View>
                 <View style={[styles.statusPill, { backgroundColor: item.grade?.startsWith('A') ? '#D1FAE5' : '#FEF3C7' }]}>
                   <Text style={[styles.statusText, { color: item.grade?.startsWith('A') ? '#059669' : '#D97706' }]}>{item.grade || 'N/A'}</Text>
                 </View>
               </View>

               <View style={styles.divider} />

               <View style={styles.statsRow}>
                 <View style={styles.statCol}>
                   <Text style={styles.statLabel}>Marks</Text>
                   <Text style={styles.statValue}>{item.score || item.percentage || 0}</Text>
                 </View>
                 <View style={styles.statCol}>
                   <Text style={styles.statLabel}>Total Marks</Text>
                   <Text style={styles.statValue}>{item.total_marks || 100}</Text>
                 </View>
                 <View style={styles.statCol}>
                   <Text style={styles.statLabel}>Percentage</Text>
                   <Text style={styles.statValue}>
                     {item.percentage || (item.total_marks ? Math.round((item.score / item.total_marks) * 100) : 0)}%
                   </Text>
                 </View>
               </View>

               <View style={styles.gradeBox}>
                 <Text style={styles.gradeLabel}>Result Status</Text>
                 <Text style={[styles.gradeValue, { color: item.percentage >= 40 || !item.percentage ? '#059669' : '#EF4444' }]}>
                   {item.percentage >= 40 || !item.percentage ? 'PASSED' : 'RE-EXAM'}
                 </Text>
               </View>
            </Animated.View>
          ))
        )}


      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAF9F9' },
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
    color: '#4F46E5', // Maintains system parity
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  /* Subject Card */
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 4,
    borderTopColor: '#3B82F6',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 40, // Keeps the 3 columns compact
  },
  statCol: {
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  gradeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 14,
    gap: 20,
  },
  gradeLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  gradeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },

  /* Recent Reports Block */
  reportsWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  reportsHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  pdfIconWrap: {
    position: 'relative',
    backgroundColor: '#3B82F6',
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  pdfIconText: {
    position: 'absolute',
    bottom: 5,
    fontSize: 6,
    fontWeight: '900',
    color: '#3B82F6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden'
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  reportDesc: {
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 13,
  },
  reportDate: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default GradesScreen;
