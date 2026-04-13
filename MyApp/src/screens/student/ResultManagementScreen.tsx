import React, { useState, useEffect, useMemo } from 'react';
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
  SafeAreaView,
  RefreshControl,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  FadeIn,
  ZoomIn,
  Layout,
  LinearTransition 
} from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ResultManagementNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResultManagement'>;

interface Props {
  navigation: ResultManagementNavigationProp;
}

const ResultManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  
  const fetchResults = async (refreshing = false) => {
    try {
      if (!refreshing) setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.STUDENT.OFFICIAL_RESULT_LIST || '/rms/results/student');
      const data = res.data?.data || res.data || [];
      setResults(data);
      
      if (data.length > 0) {
        const resultToFetch = selectedResult || data[0];
        const detailRes = await apiClient.get(ENDPOINTS.STUDENT.OFFICIAL_RESULT(resultToFetch.exam_id || resultToFetch.id));
        setSelectedResult(detailRes.data?.data || detailRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchResults(true);
  };

  const studentInfo = useMemo(() => ({
    name: selectedResult?.student_name || authState.user?.name || 'Student',
    roll: selectedResult?.roll_no || 'N/A',
    term: selectedResult?.exam_type || 'N/A',
    class: selectedResult?.class_name || 'N/A',
    totalScore: selectedResult?.percentage ? `${Math.round(selectedResult.percentage)}%` : '0%',
    grade: selectedResult?.grade || 'N/A'
  }), [selectedResult, authState.user]);

  const performanceData = selectedResult?.subjects || [];

  return (
    <SafeAreaView style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />
      
      {/* Premium Global Header */}
      <View style={[styles.globalHeader, { backgroundColor: theme.surface }]}>
        <ScaleButton 
          style={styles.menuHandle} 
          onPress={() => setDrawerOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={28} color={theme.text} />
        </ScaleButton>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Welcome back, {studentInfo.name.split(' ')[0]}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.border + '20' }]}>
            <Ionicons name="notifications-outline" size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.border + '20' }]} onPress={toggleDarkMode}>
            <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: '#A855F7' }]}>
            <Text style={styles.avatarText}>{studentInfo.name.charAt(0)}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
      >
        <View style={styles.titleArea}>
           <Text style={[styles.screenTitle, { color: theme.primary }]}>Academic Results</Text>
           <Text style={[styles.screenSubtitle, { color: theme.subtext }]}>{studentInfo.term} • Performance Overview</Text>
        </View>

        {/* Premium Profile & Summary Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={[styles.profileCardHost]}>
          <View style={[styles.profileCard, { backgroundColor: isDarkMode ? '#1E1B4B' : theme.primary }]}>
             <View style={StyleSheet.absoluteFill}>
                <Svg height="100%" width="100%">
                   <Defs>
                      <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                         <Stop offset="0" stopColor={isDarkMode ? '#312E81' : theme.primary} stopOpacity="1" />
                         <Stop offset="1" stopColor={isDarkMode ? '#1E1B4B' : '#4F46E5'} stopOpacity="0.8" />
                      </SvgLinearGradient>
                   </Defs>
                   <Rect width="100%" height="100%" fill="url(#grad)" rx={24} ry={24} />
                </Svg>
             </View>
             
             <View style={styles.profileContent}>
                <View style={styles.profileTop}>
                   <View style={[styles.profileAvatarWrapper, { borderColor: 'rgba(255,255,255,0.3)' }]}>
                      <Text style={styles.profileAvatarText}>{studentInfo.name.charAt(0)}</Text>
                   </View>
                   <View style={styles.profileMainDetails}>
                      <Text style={styles.profileNameText}>{studentInfo.name}</Text>
                      <View style={styles.profileBadgeRow}>
                         <View style={styles.pillBadge}><Text style={styles.pillBadgeText}>ROLL: {studentInfo.roll}</Text></View>
                         <View style={styles.pillBadge}><Text style={styles.pillBadgeText}>CLASS {studentInfo.class}</Text></View>
                      </View>
                   </View>
                </View>

                <View style={styles.separator} />

                <View style={styles.scoreBoard}>
                   <View style={styles.scoreItem}>
                      <Text style={styles.scoreValueText}>{studentInfo.totalScore}</Text>
                      <Text style={styles.scoreLabelText}>AGGREGATE</Text>
                   </View>
                   <View style={styles.verticalDivider} />
                   <View style={styles.scoreItem}>
                      <Text style={styles.scoreValueText}>{studentInfo.grade}</Text>
                      <Text style={styles.scoreLabelText}>FINAL GRADE</Text>
                   </View>
                   <View style={styles.verticalDivider} />
                   <View style={styles.scoreItem}>
                      <Text style={styles.scoreValueText}>{performanceData.length}</Text>
                      <Text style={styles.scoreLabelText}>SUBJECTS</Text>
                   </View>
                </View>
             </View>
          </View>
        </Animated.View>

        {/* Filter / Exam Selector */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.examFilterRow}>
           <View style={styles.filterLeft}>
              <View style={[styles.filterIconBox, { backgroundColor: theme.primary + '15' }]}>
                 <Ionicons name="filter-outline" size={16} color={theme.primary} />
              </View>
              <Text style={[styles.filterTitle, { color: theme.text }]}>Selected Exam</Text>
           </View>
           <TouchableOpacity style={[styles.examDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.dropdownText, { color: results.length > 0 ? theme.text : theme.subtext }]}>
                 {selectedResult?.exam_type || (results.length > 0 ? 'Select Exam' : 'No Exams Published')}
              </Text>
              <Ionicons name="chevron-down" size={18} color={theme.primary} />
           </TouchableOpacity>
        </Animated.View>

        {/* Performance List */}
        <View style={styles.performanceSection}>
           <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Subject-wise Performance</Text>
              <TouchableOpacity><Text style={[styles.viewAllText, { color: theme.primary }]}>Analysis</Text></TouchableOpacity>
           </View>

           {isLoading ? (
             <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loaderText, { color: theme.subtext }]}>Syncing Academic Records...</Text>
             </View>
           ) : performanceData.length === 0 ? (
             <Animated.View entering={ZoomIn.duration(400)} style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + '10' }]}>
                   <MaterialCommunityIcons name="clipboard-text-search-outline" size={60} color={theme.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Results Yet</Text>
                <Text style={[styles.emptyDesc, { color: theme.subtext }]}>Your performance data will appear here once the school publishes official results.</Text>
             </Animated.View>
           ) : (
             <View style={styles.subjectsList}>
                {performanceData.map((item: any, idx: number) => (
                   <Animated.View 
                    key={idx} 
                    entering={FadeInDown.delay(idx * 50).springify()} 
                    style={[styles.subjectCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                   >
                      <View style={styles.cardIndicatorCol}>
                         <View style={[styles.subjectIconBox, { backgroundColor: theme.primary + '10' }]}>
                            <MaterialCommunityIcons name="book-open-page-variant-outline" size={20} color={theme.primary} />
                         </View>
                         <View style={[styles.vLine, { backgroundColor: theme.border }]} />
                      </View>
                      <View style={styles.subjectMain}>
                         <View style={styles.subTopRow}>
                            <Text style={[styles.subjectName, { color: theme.text }]}>{item.subject_name}</Text>
                            <View style={[styles.gradePill, { backgroundColor: theme.primary + '15' }]}>
                               <Text style={[styles.gradePillText, { color: theme.primary }]}>{item.grade || '-'}</Text>
                            </View>
                         </View>
                         <View style={styles.marksRow}>
                            <Text style={[styles.marksText, { color: theme.subtext }]}>
                               Score: <Text style={{ color: theme.text, fontWeight: '700' }}>{item.marks_obtained}</Text> / {item.max_marks}
                            </Text>
                            <Text style={[styles.percentLabel, { color: item.is_failed ? '#EF4444' : '#10B981' }]}>
                               {Math.round(item.percentage || 0)}%
                            </Text>
                         </View>
                         <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                            <View 
                              style={[
                                styles.progressBarFill, 
                                { 
                                  width: `${item.percentage || 0}%`, 
                                  backgroundColor: item.is_failed ? '#EF4444' : '#10B981' 
                                }
                              ]} 
                            />
                         </View>
                      </View>
                   </Animated.View>
                ))}
             </View>
           )}
        </View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.footerActions}>
           <ScaleButton style={[styles.downloadBtn, { backgroundColor: theme.primary }]}>
              <Feather name="download" size={18} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.downloadBtnText}>Download Official Marksheet</Text>
           </ScaleButton>
           <TouchableOpacity style={styles.printLink}>
              <Ionicons name="print-outline" size={16} color={theme.subtext} />
              <Text style={[styles.printLinkText, { color: theme.subtext }]}>Print Document</Text>
           </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="student" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  globalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'ios' ? 50 : 30, 
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10
  },
  menuHandle: { padding: 8 },
  headerTitle: { fontSize: 13, fontWeight: '600', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  
  scrollContent: { paddingBottom: 40 },
  titleArea: { paddingHorizontal: 20, paddingTop: 24, marginBottom: 20 },
  screenTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 4 },

  profileCardHost: { paddingHorizontal: 20, marginBottom: 24 },
  profileCard: { borderRadius: 24, overflow: 'hidden', elevation: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20 },
  profileContent: { padding: 24 },
  profileTop: { flexDirection: 'row', alignItems: 'center' },
  profileAvatarWrapper: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  profileAvatarText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  profileMainDetails: { marginLeft: 16, flex: 1 },
  profileNameText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  profileBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  pillBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 20 },
  scoreBoard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreItem: { flex: 1, alignItems: 'center' },
  scoreValueText: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  scoreLabelText: { color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },
  verticalDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

  examFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 24 },
  filterLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  filterTitle: { fontSize: 14, fontWeight: '800' },
  examDropdown: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, minWidth: 160, justifyContent: 'space-between' },
  dropdownText: { fontSize: 12, fontWeight: '700' },

  performanceSection: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  viewAllText: { fontSize: 12, fontWeight: '700' },
  
  subjectsList: { gap: 12 },
  subjectCard: { flexDirection: 'row', padding: 16, borderRadius: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardIndicatorCol: { alignItems: 'center', marginRight: 16 },
  subjectIconBox: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  vLine: { width: 2, flex: 1, marginTop: 4, borderRadius: 1 },
  subjectMain: { flex: 1 },
  subTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectName: { fontSize: 15, fontWeight: '800' },
  gradePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  gradePillText: { fontSize: 11, fontWeight: '900' },
  marksRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  marksText: { fontSize: 12 },
  percentLabel: { fontSize: 13, fontWeight: '900' },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  footerActions: { paddingHorizontal: 20, marginTop: 32, alignItems: 'center' },
  downloadBtn: { width: '100%', height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12 },
  downloadBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  printLink: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 6 },
  printLinkText: { fontSize: 13, fontWeight: '600' },

  loaderContainer: { paddingVertical: 60, alignItems: 'center' },
  loaderText: { fontSize: 13, fontWeight: '600', marginTop: 12 },
  
  emptyContainer: { padding: 40, alignItems: 'center', borderRadius: 24, borderWidth: 1, borderStyle: 'dashed' },
  emptyImage: { width: 120, height: 120, marginBottom: 16, opacity: 0.6 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },

  safeArea: { flex: 1 },
});

export default ResultManagementScreen;
