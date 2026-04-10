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
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

const PrincipalPerformanceScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_term');

  // Fetch performance data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiClient.get(ENDPOINTS.PRINCIPAL.PERFORMANCE);
        const data = res.data.data || res.data;
        setPerformanceData(data);
      } catch (error: any) {
        console.error('Failed to fetch performance data:', error);
        setError('Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPerformanceData();
  }, [selectedPeriod]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Re-trigger useEffect
    setSelectedPeriod(selectedPeriod);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />

      {/* Standard Principal Header */}
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
          <TouchableOpacity style={styles.iconBtnTransparent}>
            <Ionicons name="notifications-outline" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent} onPress={() => navigation.navigate('AccountSettings')}>
            <Ionicons name="settings-outline" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'A'}</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Titles */}
        <Animated.View entering={FadeInUp.duration(300)} style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Performance</Text>
          <Text style={styles.pageSubtitle}>View comprehensive analytics and performance reports.</Text>
        </Animated.View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading performance data...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Failed to Load Data</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <Ionicons name="refresh" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Performance Data */}
        {!isLoading && !error && performanceData && (
          <>
            {/* Period Selector */}
            <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.periodSelector}>
              <TouchableOpacity 
                style={[styles.periodBtn, selectedPeriod === 'current_term' && styles.periodBtnActive]}
                onPress={() => setSelectedPeriod('current_term')}
              >
                <Text style={[styles.periodBtnText, selectedPeriod === 'current_term' && styles.periodBtnTextActive]}>
                  Current Term
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.periodBtn, selectedPeriod === 'last_term' && styles.periodBtnActive]}
                onPress={() => setSelectedPeriod('last_term')}
              >
                <Text style={[styles.periodBtnText, selectedPeriod === 'last_term' && styles.periodBtnTextActive]}>
                  Last Term
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.periodBtn, selectedPeriod === 'academic_year' && styles.periodBtnActive]}
                onPress={() => setSelectedPeriod('academic_year')}
              >
                <Text style={[styles.periodBtnText, selectedPeriod === 'academic_year' && styles.periodBtnTextActive]}>
                  Academic Year
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* --- PERFORMANCE OVERVIEW CARD --- */}
            <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <Ionicons name="bar-chart" size={16} color="#3B82F6" style={{marginRight: 8}} />
                <Text style={styles.cardTitle}>Performance Overview</Text>
              </View>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{performanceData.averageScore || '85%'}</Text>
                  <Text style={styles.statLabel}>Average Score</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{performanceData.totalStudents || '1,250'}</Text>
                  <Text style={styles.statLabel}>Total Students</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{performanceData.passingRate || '92%'}</Text>
                  <Text style={styles.statLabel}>Pass Rate</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{performanceData.topPerformers || '156'}</Text>
                  <Text style={styles.statLabel}>Top Performers</Text>
                </View>
              </View>
            </Animated.View>

            {/* --- CLASS PERFORMANCE CARD --- */}
            <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <Ionicons name="school" size={16} color="#3B82F6" style={{marginRight: 8}} />
                <Text style={styles.cardTitle}>Class Performance</Text>
              </View>
              
              {performanceData.classPerformance && performanceData.classPerformance.length > 0 ? (
                <View style={styles.classList}>
                  {performanceData.classPerformance.map((classData: any, index: number) => (
                    <View key={index} style={styles.classItem}>
                      <View style={styles.classInfo}>
                        <Text style={styles.className}>{classData.name || `Class ${index + 1}`}</Text>
                        <Text style={styles.classStats}>
                          Students: {classData.studentCount || 0} | Avg: {classData.averageScore || 'N/A'}%
                        </Text>
                      </View>
                      <View style={styles.classProgress}>
                        <View style={styles.progressBar}>
                          <View 
                            style={[styles.progressFill, { width: `${classData.averageScore || 0}%` }]}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="school-outline" size={32} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>No class performance data available</Text>
                </View>
              )}
            </Animated.View>

            {/* --- PERFORMANCE REPORTS CARD --- */}
            <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.cardContainer}>
              <View style={[styles.cardHeader, {marginBottom: 20}]}>
                <Ionicons name="document-text" size={16} color="#3B82F6" style={{marginRight: 8}} />
                <Text style={styles.cardTitle}>Performance Reports</Text>
              </View>
              
              {performanceData.reports && performanceData.reports.length > 0 ? (
                performanceData.reports.map((report: any, index: number) => (
                  <View key={index} style={styles.reportItemContainer}>
                    <Text style={styles.reportTitle}>{report.title || 'Performance Report'}</Text>
                    <Text style={styles.reportSubtitle}>{report.description || 'Detailed performance analysis'}</Text>
                    <TouchableOpacity style={styles.viewReportBtn}>
                      <Ionicons name="eye" size={14} color="#4F46E5" style={{ marginRight: 6 }} />
                      <Text style={styles.viewReportBtnText}>View Report</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-outline" size={32} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>No reports available</Text>
                </View>
              )}
            </Animated.View>
          </>
        )}

      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' }, // Soft layout background
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 16 },

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
    marginBottom: 8
  },
  menuHandle: { paddingRight: 4, paddingVertical: 8 }, 
  topHeaderTitle: { fontSize: 18, fontWeight: '600', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#A78BFA',
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },

  errorContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#4F46E5',
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  periodBtnTextActive: {
    color: '#FFF',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  classList: {
    marginTop: 16,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  classStats: {
    fontSize: 12,
    color: '#64748B',
  },
  classProgress: {
    width: 80,
    marginLeft: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },

  chartPlaceholderBox: {
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },

  pageTitleContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  pageSubtitle: { color: '#64748B', fontSize: 13, fontWeight: '500' },

  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },

  reportItemContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 20,
  },
  viewReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewReportBtnText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
  }
});

export default PrincipalPerformanceScreen;
