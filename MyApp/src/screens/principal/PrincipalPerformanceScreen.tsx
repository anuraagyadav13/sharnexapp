import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
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
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.pageHeader}>
      <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={16} />
    </View>
    <View style={{ marginTop: 20 }}>
      <Skeleton width="100%" height={160} borderRadius={24} />
    </View>
    <View style={styles.statsRowSkeleton}>
      <Skeleton width="48%" height={120} borderRadius={20} />
      <Skeleton width="48%" height={120} borderRadius={20} />
    </View>
  </ScrollView>
);

const StatCard = ({ title, value, color, icon, subtitle }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.statValue, { color: color }]}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statSubtitle}>{subtitle}</Text>
  </View>
);

const PrincipalPerformanceScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [selectedTerm, setSelectedTerm] = useState('Term 1');

  const fetchPerformance = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.PERFORMANCE);
      setPerformanceData(res.normalized?.data || res.data.data || res.data);
    } catch (error) {
      console.error('Failed to fetch performance:', error);
      setPerformanceData(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPerformance();
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Global Header - Student Pattern */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color="#4F46E5" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Institution Insights</Text>
        <View style={styles.headerRight}>
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
            <Text style={styles.screenTitle}>Academic Analytics</Text>
            <Text style={styles.screenSubtitle}>Data-driven insights into institutional performance and growth.</Text>
          </View>

          {/* Hero Analytics - Modern Gauge Style */}
          <Animated.View entering={FadeInUp.duration(400)} style={styles.heroCard}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgLinearGradient id="perfGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#6366F1" stopOpacity="1" />
                  <Stop offset="1" stopColor="#4F46E5" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#perfGrad)" rx={32} ry={32} />
            </Svg>
            <View style={styles.heroContent}>
               <View style={styles.heroMain}>
                  <Text style={styles.heroLabel}>AVERAGE PERFORMANCE</Text>
                  <Text style={styles.heroValue}>{performanceData?.averageScore || '0%'}</Text>
                  <View style={styles.improvementBadge}>
                     <Ionicons name="trending-up" size={14} color="#4ADE80" />
                     <Text style={styles.improvementText}>{performanceData?.improvement || '+0%'} growth</Text>
                  </View>
               </View>
               <View style={styles.heroGraphic}>
                  <MaterialCommunityIcons name="chart-arc" size={80} color="rgba(255,255,255,0.2)" />
               </View>
            </View>
          </Animated.View>

          {/* Term Toggle */}
          <View style={styles.termToggle}>
            {['Term 1', 'Term 2', 'Final'].map(term => (
              <TouchableOpacity 
                key={term} 
                style={[styles.termBtn, selectedTerm === term && styles.termBtnActive]}
                onPress={() => setSelectedTerm(term)}
              >
                <Text style={[styles.termBtnText, selectedTerm === term && styles.termBtnTextActive]}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard 
              title="Pass Ratio" 
              value={performanceData?.passPercentage || '0%'} 
              subtitle="Current academic year" 
              icon="shield-check-outline" 
              color="#10B981" 
            />
            <StatCard 
              title="Elite Scholars" 
              value={performanceData?.topPerformers || '0'} 
              subtitle="Scored above 90%" 
              icon="crown-outline" 
              color="#F59E0B" 
            />
          </View>

          {/* Class-wise leaderboard */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Unit Performance</Text>
            <TouchableOpacity><Text style={styles.viewAllText}>Detailed View</Text></TouchableOpacity>
          </View>

          <View style={styles.leaderboardCard}>
            {performanceData?.classWise?.map((item: any, index: number) => (
              <View key={index} style={[styles.leaderboardItem, index === 0 && { borderTopWidth: 0 }]}>
                <View style={styles.leaderboardRank}>
                   <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.leaderboardMain}>
                  <Text style={styles.leaderboardClass}>{item.name}</Text>
                  <View style={styles.progressTrack}>
                     <View style={[styles.progressFill, { width: `${item.score}%`, backgroundColor: item.score > 80 ? '#10B981' : '#6366F1' }]} />
                  </View>
                </View>
                <Text style={styles.leaderboardScore}>{item.score}%</Text>
              </View>
            ))}
          </View>

          {/* Recent Reports */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <Text style={styles.sectionTitle}>Published Reports</Text>
          </View>
          <View style={styles.reportsWrapper}>
            {performanceData?.recentReports?.map((report: any, index: number) => (
              <TouchableOpacity key={report.id} style={styles.reportItem}>
                <View style={styles.reportIconCircle}>
                   <MaterialCommunityIcons name="file-chart-outline" size={24} color="#6366F1" />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <Text style={styles.reportDate}>{report.date}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
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
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatarHeader: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  // Hero
  heroCard: { height: 180, borderRadius: 32, marginHorizontal: 20, overflow: 'hidden', padding: 24, justifyContent: 'center' },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroMain: { flex: 1 },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroValue: { color: '#FFF', fontSize: 44, fontWeight: '900', marginVertical: 6 },
  improvementBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  improvementText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  heroGraphic: { marginLeft: 20 },

  // Toggle
  termToggle: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, padding: 6, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', marginTop: 25 },
  termBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
  termBtnActive: { backgroundColor: '#4F46E5', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  termBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  termBtnTextActive: { color: '#FFF' },

  // Stats Grid
  statsGrid: { flexDirection: 'row', gap: 15, paddingHorizontal: 20, marginTop: 25 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3 },
  statIconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statTitle: { fontSize: 13, fontWeight: '800', color: '#1E293B', marginTop: 6 },
  statSubtitle: { fontSize: 10, color: '#94A3B8', marginTop: 2, fontWeight: '600' },

  // Leaderboard
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  viewAllText: { fontSize: 12, color: '#4F46E5', fontWeight: '700' },
  leaderboardCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, padding: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  leaderboardRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  rankText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  leaderboardMain: { flex: 1 },
  leaderboardClass: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, width: '90%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  leaderboardScore: { fontSize: 15, fontWeight: '800', color: '#1E293B' },

  // Reports
  reportsWrapper: { paddingHorizontal: 20, gap: 12 },
  reportItem: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  reportIconCircle: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  reportInfo: { flex: 1, marginLeft: 15 },
  reportTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  reportDate: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },

  statsRowSkeleton: { flexDirection: 'row', gap: 15, paddingHorizontal: 20, marginTop: 25 },
});

export default PrincipalPerformanceScreen;
