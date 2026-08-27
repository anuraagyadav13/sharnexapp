import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type GradesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Grades'>;

interface Props {
  navigation: GradesScreenNavigationProp;
}


const GradesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGradesData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // 1. Resolve student ID reliably
      const profileRes = await studentService.getProfile();
      const studentId = profileRes.normalized?.data?.id || profileRes.normalized?.data?.student?.id || authState.user?.id;

      // 2. Fetch grades and reports
      const res = await studentService.getGrades();
      
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
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => fetchGradesData(true);

  const handleReportPress = async (report: any) => {
    try {
      const url = report?.fileUrl || report?.url || report?.downloadUrl;
      if (url) {
        Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open report link.'));
        return;
      }

      // Fallback: Format transcript from grades state for native Share
      const lines: string[] = [
        '📋 ACADEMIC REPORT TRANSCRIPT',
        '═══════════════════════════════',
        `Report  : ${report?.title || 'Academic Report Card'}`,
        `Date    : ${report?.date || new Date().toLocaleDateString()}`,
        '',
        '📊 Subject Grades Breakdown',
        '-------------------------------',
        ...grades.map((g: any) => {
          const sName = typeof g.name === 'object' ? (g.name?.name || 'Subject') : (g.name || g.subject_name || 'Subject');
          const gStr = typeof g.grade === 'object' ? (g.grade?.name || g.grade?.label || 'N/A') : String(g.grade || 'N/A');
          const score = g.score || g.percentage || 0;
          const maxMarks = g.total_marks || 100;
          return `${sName.padEnd(18)}: ${score}/${maxMarks}  Grade: ${gStr}`;
        }),
        '-------------------------------',
        `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      ].filter(Boolean);

      await Share.share({
        message: lines.join('\n'),
        title: report?.title || 'Academic Report Card',
      });
    } catch (err: any) {
      if (err?.message !== 'Share was not shared') {
        Alert.alert('Error', err?.message || 'Failed to open report.');
      }
    }
  };

  useEffect(() => {
    fetchGradesData();
  }, [authState.user?.id]);

  if (isLoading && grades.length === 0 && reports.length === 0) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {/* Global Header */}
      <StudentHeader 
        title="Grades"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        
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
              onPress={() => fetchGradesData()}
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
                   <TouchableOpacity
                     key={report.id || idx}
                     style={styles.reportItem}
                     activeOpacity={0.7}
                     onPress={() => handleReportPress(report)}
                   >
                      <View style={styles.pdfIconWrap}>
                         <Ionicons name="document-text" size={18} color="#FFFFFF" />
                         <Text style={styles.pdfIconText}>PDF</Text>
                      </View>
                      <View style={styles.reportContent}>
                         <Text style={styles.reportTitle}>{report.title || 'Academic Report Card'}</Text>
                         <Text style={styles.reportDesc}>{report.description || 'Full term academic performance summary'}</Text>
                         <Text style={styles.reportDate}>{report.date || new Date().toLocaleDateString()}</Text>
                      </View>
                      <Ionicons name="download-outline" size={20} color={theme.primary} />
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

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 16,
    backgroundColor: theme.surface, 
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
    color: theme.primary, 
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: theme.primary, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  /* Subject Card */
  subjectCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderTopWidth: 4,
    borderTopColor: theme.primary,
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
    color: theme.text,
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 10,
    color: theme.subtext,
    fontWeight: '500',
  },
  statusPill: {
    backgroundColor: theme.isDarkMode ? '#065F4630' : '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.isDarkMode ? '#34D399' : '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 40, 
  },
  statCol: {
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    fontSize: 9,
    color: theme.subtext,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
  gradeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDarkMode ? '#1E293B' : '#F9FAFB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 14,
    gap: 20,
  },
  gradeLabel: {
    fontSize: 10,
    color: theme.subtext,
    fontWeight: '500',
  },
  gradeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.isDarkMode ? '#34D399' : '#059669',
  },

  /* Recent Reports Block */
  reportsWrapper: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  reportsHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 16,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDarkMode ? '#1E293B' : '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  pdfIconWrap: {
    position: 'relative',
    backgroundColor: theme.primary,
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
    color: theme.primary,
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
    color: theme.text,
    marginBottom: 2,
  },
  reportDesc: {
    fontSize: 9,
    color: theme.subtext,
    lineHeight: 13,
  },
  reportDate: {
    fontSize: 8,
    color: theme.subtext,
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
    color: theme.subtext,
  },
});

export default GradesScreen;
