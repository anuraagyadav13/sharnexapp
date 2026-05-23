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
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGradesData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. Resolve student ID reliably
      const profileRes = await apiClient.get(ENDPOINTS.STUDENT.PROFILE);
      const studentId = profileRes.normalized?.data?.id || profileRes.normalized?.data?.student?.id || authState.user?.id;

      // 2. Fetch grades and reports
      const res = await apiClient.get(ENDPOINTS.STUDENT.GRADES);
      
      // Handle various response types including normalized
      const data = res.normalized?.data || res.data?.data || res.data;
      const gradeItems = data?.grades?.subjects || data?.subjects || data?.grades || [];
      setGrades(Array.isArray(gradeItems) ? gradeItems : []);
      
      // reports might be in the same payload or separate
      const reportItems = data?.reports || data?.official_results || [];
      setReports(Array.isArray(reportItems) ? reportItems : []);
    } catch (err: any) {
      console.error('Failed to fetch grades:', err);
      setError('Failed to load academic records. Please try again.');
      setGrades([]);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGradesData();
  }, [authState.user?.id]);

  if (isLoading && grades.length === 0 && reports.length === 0) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

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
        {error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle" size={60} color="#EF4444" />
            <Text style={styles.emptyText}>{error}</Text>
            <ScaleButton 
              style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#3B82F6', borderRadius: 8 }}
              onPress={fetchGradesData}
              scaleTo={0.95}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
            </ScaleButton>
          </View>
        ) : (
          <>
            {grades.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="school-outline" size={60} color="#E5E7EB" />
                <Text style={styles.emptyText}>No grade records found</Text>
              </View>
            ) : (
              grades.map((item, index) => {
                const subjectName = typeof item.name === 'object' ? (item.name?.name || 'Subject') : (item.name || item.subject_name || 'Subject');
                const gradeStr = typeof item.grade === 'object' ? (item.grade?.name || item.grade?.label || 'N/A') : String(item.grade || 'N/A');
                const isGradeA = gradeStr.startsWith('A');
                const score = parseFloat(item.score || item.percentage || 0);
                const totalMarks = parseFloat(item.total_marks || 100);
                const percentage = item.percentage || (totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0);
                const passed = percentage >= 40 || !percentage;

                return (
                  <Animated.View 
                    key={item.id || index} 
                    entering={FadeInUp.delay(100 + (index * 50)).springify()} 
                    style={styles.subjectCard}
                  >
                     <View style={styles.cardHeaderRow}>
                       <View>
                         <Text style={styles.subjectName}>{subjectName}</Text>
                         <Text style={styles.teacherName}>{item.exam_name || 'Annual Examination'}</Text>
                       </View>
                       <View style={[styles.statusPill, { backgroundColor: isGradeA ? '#D1FAE5' : '#FEF3C7' }]}>
                         <Text style={[styles.statusText, { color: isGradeA ? '#059669' : '#D97706' }]}>{gradeStr}</Text>
                       </View>
                     </View>
      
                     <View style={styles.divider} />
      
                     <View style={styles.statsRow}>
                       <View style={styles.statCol}>
                         <Text style={styles.statLabel}>Marks</Text>
                         <Text style={styles.statValue}>{score}</Text>
                       </View>
                       <View style={styles.statCol}>
                         <Text style={styles.statLabel}>Total Marks</Text>
                         <Text style={styles.statValue}>{totalMarks}</Text>
                       </View>
                       <View style={styles.statCol}>
                         <Text style={styles.statLabel}>Percentage</Text>
                         <Text style={styles.statValue}>{percentage}%</Text>
                       </View>
                     </View>
      
                     <View style={styles.gradeBox}>
                       <Text style={styles.gradeLabel}>Result Status</Text>
                       <Text style={[styles.gradeValue, { color: passed ? '#059669' : '#EF4444' }]}>
                         {passed ? 'PASSED' : 'RE-EXAM'}
                       </Text>
                     </View>
                  </Animated.View>
                );
              })
            )}

            {/* Official Reports Section */}
            <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.reportsWrapper}>
               <Text style={styles.reportsHeader}>Official Report Cards</Text>
               
               {reports.length === 0 ? (
                 <Text style={[styles.emptyText, { fontSize: 13, marginTop: 0 }]}>No official report cards available yet.</Text>
               ) : (
                 reports.map((report, idx) => (
                   <TouchableOpacity key={report.id || idx} style={styles.reportItem} activeOpacity={0.7}>
                      <View style={styles.pdfIconWrap}>
                         <Ionicons name="document-text" size={18} color="#FFFFFF" />
                         <Text style={styles.pdfIconText}>PDF</Text>
                      </View>
                      <View style={styles.reportContent}>
                         <Text style={styles.reportTitle}>{report.title || 'Academic Report Card'}</Text>
                         <Text style={styles.reportDesc}>{report.description || 'Full term academic performance summary'}</Text>
                         <Text style={styles.reportDate}>{report.date || new Date().toLocaleDateString()}</Text>
                      </View>
                      <Ionicons name="download-outline" size={20} color="#3B82F6" />
                   </TouchableOpacity>
                 ))
               )}
            </Animated.View>
          </>
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
