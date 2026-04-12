import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useTheme } from '../../store/ThemeContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ResultManagementNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResultManagement'>;

interface Props {
  navigation: ResultManagementNavigationProp;
}

const ResultManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get(ENDPOINTS.STUDENT.OFFICIAL_RESULT_LIST || '/rms/results/student');
        const data = res.data.data || res.data || [];
        setResults(data);
        if (data.length > 0) {
          // Fetch details for the latest result
          const detailRes = await apiClient.get(ENDPOINTS.STUDENT.OFFICIAL_RESULT(data[0].exam_id || data[0].id));
          setSelectedResult(detailRes.data.data || detailRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch results:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, []);

  const studentInfo = {
    name: selectedResult?.student_name || 'Student',
    roll: selectedResult?.roll_no || 'N/A',
    term: selectedResult?.exam_type || 'N/A',
    class: selectedResult?.class_name || 'N/A',
    totalScore: selectedResult?.percentage ? `${Math.round(selectedResult.percentage)}%` : '0%',
    grade: selectedResult?.grade || 'N/A'
  };

  const performanceData = selectedResult?.subjects || [];

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* Header */}
      <View style={[styles.globalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <ScaleButton 
          style={styles.menuHandle} 
          onPress={() => setDrawerOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={28} color={theme.text} />
        </ScaleButton>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Result Management</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.border + '40' }]}>
            <Ionicons name="notifications-outline" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>DU</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Student Profile Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.profileMain}>
            <View style={[styles.profileAvatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.profileAvatarText}>DU</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: theme.text }]}>{studentInfo.name}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Ionicons name="school-outline" size={12} color={theme.primary} />
                  <Text style={[styles.metaText, { color: theme.subtext }]}> ROLL: {studentInfo.roll}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Ionicons name="calendar-outline" size={12} color={theme.primary} />
                  <Text style={[styles.metaText, { color: theme.subtext }]}> TERM: {studentInfo.term}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Ionicons name="home-outline" size={12} color={theme.primary} />
                  <Text style={[styles.metaText, { color: theme.subtext }]}> CLASS: {studentInfo.class}</Text>
                </View>
                <View style={[styles.miniBadge, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.miniBadgeText, { color: theme.primary }]}>{studentInfo.class}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.scoreSummary, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.scoreValue, { color: '#10B981' }]}>{studentInfo.totalScore}</Text>
              <Text style={[styles.scoreLabel, { color: theme.subtext }]}>TOTAL SCORE</Text>
              <View style={[styles.gradeBadge, { backgroundColor: theme.primary + '15' }]}>
                <Text style={[styles.gradeText, { color: theme.primary }]}>GRADE: {studentInfo.grade}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Change Examination Row */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.examSelectorRow}>
          <View style={styles.selectorLabelCol}>
            <View style={styles.selectorTitleRow}>
              <Ionicons name="funnel-outline" size={16} color={theme.primary} />
              <Text style={[styles.selectorTitle, { color: theme.text }]}>CHANGE EXAMINATION</Text>
            </View>
            <Text style={[styles.selectorSubtitle, { color: theme.subtext }]}>SELECT RESULT CONTEXT FOR DETAILED VIEW</Text>
          </View>
          <TouchableOpacity style={[styles.examPicker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.examPickerText, { color: theme.subtext }]}>NO EXAMS PUBLISHED</Text>
            <Ionicons name="chevron-down" size={18} color={theme.subtext} />
          </TouchableOpacity>
        </Animated.View>

        {/* Performance Sheet */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={[styles.performanceSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sheetTitle, { color: theme.subtext }]}>SUBJECT-WISE PERFORMANCE SHEET</Text>
          
          <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.colSubject, { color: theme.subtext }]}>SUBJECT</Text>
            <Text style={[styles.colMarks, { color: theme.subtext }]}>MARKS</Text>
            <Text style={[styles.colMax, { color: theme.subtext }]}>MAX</Text>
            <Text style={[styles.colGrade, { color: theme.subtext }]}>GRADE</Text>
            <Text style={[styles.colProgress, { color: theme.subtext }]}>PROGRESS</Text>
          </View>

          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.emptyText, { color: theme.subtext, marginTop: 12 }]}>FETCHING PERFORMANCE DATA...</Text>
            </View>
          ) : performanceData.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.background }]}>
                <Ionicons name="information-outline" size={24} color={theme.border} />
              </View>
              <Text style={[styles.emptyText, { color: theme.border }]}>NO SUBJECT DETAILS FOUND.</Text>
            </View>
          ) : (
            performanceData.map((item: any, idx: number) => (
               <View key={idx} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.colSubject, { color: theme.text }]}>{item.subject_name}</Text>
                  <Text style={[styles.colMarks, { color: theme.text }]}>{item.marks_obtained}</Text>
                  <Text style={[styles.colMax, { color: theme.subtext }]}>{item.max_marks}</Text>
                  <Text style={[styles.colGrade, { color: theme.primary, fontWeight: '700' }]}>{item.grade || '-'}</Text>
                  <View style={styles.colProgress}>
                    <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
                      <View style={[styles.progressFill, { width: `${item.percentage || 0}%`, backgroundColor: item.is_failed ? '#EF4444' : '#10B981' }]} />
                    </View>
                  </View>
               </View>
            ))
          )}
        </Animated.View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Animated.View entering={FadeInDown.delay(400).springify()} style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="trophy-outline" size={20} color="#10B981" />
            </View>
            <View>
              <Text style={[styles.summaryLabel, { color: theme.subtext }]}>STATUS</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>PASSED TERM</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).springify()} style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="copy-outline" size={20} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.summaryLabel, { color: theme.subtext }]}>TOTAL SUBJECTS</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>0 Subjects Evaluated</Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="student" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  globalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 12, borderBottomWidth: 1 },
  menuHandle: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  scrollContent: { padding: 16 },
  profileCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20 },
  profileMain: { flexDirection: 'row', alignItems: 'center' },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  profileAvatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 24 },
  profileDetails: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  metaBadge: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 10, fontWeight: '700' },
  miniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniBadgeText: { fontSize: 9, fontWeight: '800' },
  scoreSummary: { padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', minWidth: 100 },
  scoreValue: { fontSize: 24, fontWeight: '900' },
  scoreLabel: { fontSize: 9, fontWeight: '700', marginVertical: 4 },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 4 },
  gradeText: { fontSize: 10, fontWeight: '800' },
  examSelectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  selectorLabelCol: { flex: 1 },
  selectorTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  selectorTitle: { fontSize: 14, fontWeight: '800' },
  selectorSubtitle: { fontSize: 9, fontWeight: '600' },
  examPicker: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, minWidth: 200, justifyContent: 'space-between' },
  examPickerText: { fontSize: 12, fontWeight: '700' },
  performanceSheet: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  sheetTitle: { fontSize: 10, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  tableHeader: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1 },
  colSubject: { flex: 2, fontSize: 10, fontWeight: '700' },
  colMarks: { flex: 1, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  colMax: { flex: 1, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  colGrade: { flex: 1, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  colProgress: { flex: 1, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 12, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  summaryIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { fontSize: 9, fontWeight: '700', marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '800' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, alignItems: 'center' },
  progressBg: { height: 4, width: '100%', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
});

export default ResultManagementScreen;
