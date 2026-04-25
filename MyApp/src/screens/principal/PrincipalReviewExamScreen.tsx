import React, { useState } from 'react';
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
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PrincipalReviewExamScreen = ({ navigation, route }: any) => {
  const { examId } = route.params || { examId: '1' };
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for review
  const exam = {
    name: 'Final Term Examination',
    type: 'Subjective',
    year: '2026',
    status: 'PENDING REVIEW',
    totalStudents: 45,
    submitted: 42,
    avgScore: '78%',
  };

  const students = [
    { id: 's1', name: 'Arjun Mehta', roll: '101', score: '88/100', status: 'SUBMITTED' },
    { id: 's2', name: 'Priya Sharma', roll: '102', score: '92/100', status: 'SUBMITTED' },
    { id: 's3', name: 'Karan Singh', roll: '103', score: '45/100', status: 'FLAGGED' },
    { id: 's4', name: 'Sanya Iyer', roll: '104', score: '76/100', status: 'SUBMITTED' },
  ];

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Global Header - Student Pattern */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#4F46E5" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Audit Assessment</Text>
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
      >
        <View style={styles.pageHeader}>
          <Text style={styles.screenTitle}>Submission Review</Text>
          <Text style={styles.screenSubtitle}>Validate faculty entries, audit flagged inconsistencies, and authorize certification.</Text>
        </View>

        {/* Premium Audit Hero */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.heroCard}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgLinearGradient id="auditGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#6366F1" stopOpacity="1" />
                  <Stop offset="1" stopColor="#4F46E5" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#auditGrad)" rx={32} ry={32} />
            </Svg>
            <View style={styles.heroContent}>
               <View style={styles.heroTop}>
                  <View style={styles.heroIconBox}>
                     <MaterialCommunityIcons name="file-check-outline" size={28} color="#FFF" />
                  </View>
                  <View style={styles.heroMainText}>
                     <Text style={styles.heroName}>{exam.name}</Text>
                     <Text style={styles.heroMeta}>{exam.type} • {exam.year}</Text>
                  </View>
                  <View style={styles.heroStatus}>
                     <Text style={styles.heroStatusText}>{exam.status}</Text>
                  </View>
               </View>
               
               <View style={styles.heroStats}>
                  <View style={styles.hStat}>
                     <Text style={styles.hStatVal}>{exam.totalStudents}</Text>
                     <Text style={styles.hStatLab}>SCHOLARS</Text>
                  </View>
                  <View style={styles.hStat}>
                     <Text style={styles.hStatVal}>{exam.submitted}</Text>
                     <Text style={styles.hStatLab}>ENTRIES</Text>
                  </View>
                  <View style={styles.hStat}>
                     <Text style={styles.hStatVal}>{exam.avgScore}</Text>
                     <Text style={styles.hStatLab}>MEAN SCORE</Text>
                  </View>
               </View>
            </View>
        </Animated.View>

        {/* List Header */}
        <View style={styles.listHeader}>
           <Text style={styles.sectionTitle}>Scholastic Ledger</Text>
           <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="filter-outline" size={16} color="#4F46E5" />
              <Text style={styles.filterText}>Show Flags</Text>
           </TouchableOpacity>
        </View>

        {/* Student List */}
        <View style={styles.list}>
          {students.map((student, index) => (
            <Animated.View key={student.id} entering={FadeInUp.delay(index * 50)} style={styles.card}>
               <View style={styles.studentRow}>
                  <View style={styles.avatarBox}>
                     <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                     <Text style={styles.studentName}>{student.name}</Text>
                     <Text style={styles.studentRoll}>ROLL NO: {student.roll}</Text>
                  </View>
                  <View style={styles.scoreBox}>
                     <Text style={styles.scoreVal}>{student.score}</Text>
                     {student.status === 'FLAGGED' ? (
                       <View style={styles.flag}>
                          <Ionicons name="alert-circle" size={12} color="#EF4444" />
                          <Text style={styles.flagText}>FLAGGED</Text>
                       </View>
                     ) : (
                       <View style={styles.check}>
                          <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                          <Text style={styles.checkText}>VERIFIED</Text>
                       </View>
                     )}
                  </View>
                  <TouchableOpacity style={styles.nextBtn}>
                     <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
               </View>
            </Animated.View>
          ))}
        </View>

        {/* Multi-tier Actions */}
        <View style={styles.actionGrid}>
           <TouchableOpacity style={styles.rejectBtn}>
              <MaterialCommunityIcons name="undo-variant" size={20} color="#EF4444" />
              <Text style={styles.rejectText}>Return to Faculty</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.approveBtn}>
              <Text style={styles.approveText}>Authorize & Publish</Text>
              <Ionicons name="shield-checkmark" size={20} color="#FFF" />
           </TouchableOpacity>
        </View>

      </ScrollView>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },

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

  // Hero
  heroCard: { height: 200, borderRadius: 32, marginHorizontal: 20, padding: 24, justifyContent: 'center', overflow: 'hidden' },
  heroContent: { flex: 1 },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  heroIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroMainText: { flex: 1, marginLeft: 15 },
  heroName: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  heroMeta: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  heroStatus: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  heroStatusText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  hStat: { alignItems: 'center' },
  hStatVal: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  hStatLab: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', marginTop: 4 },

  // Section
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 35, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  filterText: { fontSize: 11, fontWeight: '800', color: '#4F46E5' },

  // List
  list: { paddingHorizontal: 20, gap: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 15, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#94A3B8' },
  studentInfo: { flex: 1, marginLeft: 15 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  studentRoll: { fontSize: 10, color: '#94A3B8', fontWeight: '800', marginTop: 4 },
  scoreBox: { alignItems: 'flex-end', marginRight: 15 },
  scoreVal: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  flag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  flagText: { fontSize: 9, fontWeight: '900', color: '#EF4444' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  checkText: { fontSize: 9, fontWeight: '900', color: '#10B981' },
  nextBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  // Actions
  actionGrid: { paddingHorizontal: 20, marginTop: 40, gap: 12 },
  approveBtn: { flex: 1, backgroundColor: '#4F46E5', height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, gap: 10 },
  approveText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  rejectBtn: { flex: 1, height: 56, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  rejectText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
});

export default PrincipalReviewExamScreen;