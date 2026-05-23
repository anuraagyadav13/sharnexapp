import React, { useState, useEffect } from 'react';
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
  RefreshControl,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StatBox = ({ icon, value, label, color, subtitle }: any) => (
  <View style={styles.statBox}>
    <View style={[styles.statIconCircle, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statSub}>{subtitle}</Text>
  </View>
);

const InvoiceCard = ({ item, index, delay }: any) => {
  const getStatus = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return { color: '#10B981', label: 'Collected' };
      case 'PENDING': return { color: '#F59E0B', label: 'Awaiting' };
      case 'OVERDUE': return { color: '#EF4444', label: 'Defaulted' };
      default: return { color: '#64748B', label: 'Draft' };
    }
  };

  const status = getStatus(item.status);

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>
           <Text style={styles.studentName}>{item.student}</Text>
           <Text style={styles.invoiceId}>{item.id}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${status.color}15` }]}>
           <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.bodyCol}>
           <Text style={styles.bodyLabel}>AMOUNT</Text>
           <Text style={styles.bodyVal}>₹{item.amount?.toLocaleString()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.bodyCol}>
           <Text style={styles.bodyLabel}>DUE DATE</Text>
           <Text style={styles.bodyVal}>{item.dueDate}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
         <View style={styles.footerInfo}>
            <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
            <Text style={styles.footerText}>Issued: {item.issueDate}</Text>
         </View>
         <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>Remind</Text>
         </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const PrincipalFeesScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalFees: 0, totalCollected: 0, collectionRate: 0, pendingAmount: 0 });

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.FEES);
      const data = res.data.data || res.data || {};
      const invoiceList = data.invoices || data.fees || [];
      setInvoices(invoiceList);
      setSummary({
        totalFees: data.summary?.totalFees || 1580000,
        totalCollected: data.summary?.totalCollected || 1240000,
        collectionRate: data.summary?.collectionRate || 78,
        pendingAmount: data.summary?.pendingAmount || 340000
      });
    } catch (error: any) {
      console.error('Failed to fetch fees:', error);
      setInvoices([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setIsRefreshing(true); fetchData(); };

  const filteredInvoices = activeTab === 'All' ? invoices : invoices.filter(inv => {
    if (activeTab === 'Pending') return inv.status === 'PENDING' || inv.status === 'OVERDUE';
    if (activeTab === 'Collected') return inv.status === 'PAID';
    return true;
  });

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Global Header - Student Pattern */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color="#4F46E5" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Financial Dashboard</Text>
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.screenTitle}>Revenue Analytics</Text>
          <Text style={styles.screenSubtitle}>Tracking institutional cash flow and student fee collection metrics.</Text>
        </View>

        {/* Hero Card - Revenue Summary */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.heroCard}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <SvgLinearGradient id="feeGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#6366F1" stopOpacity="1" />
                  <Stop offset="1" stopColor="#4F46E5" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#feeGrad)" rx={32} ry={32} />
            </Svg>
            <View style={styles.heroContent}>
               <View style={styles.heroMain}>
                  <Text style={styles.heroLabel}>TOTAL COLLECTED</Text>
                  <Text style={styles.heroValue}>₹{(summary.totalCollected / 100000).toFixed(1)}L</Text>
                  <View style={styles.progressRow}>
                     <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${summary.collectionRate}%` }]} />
                     </View>
                     <Text style={styles.progressText}>{summary.collectionRate}% of target</Text>
                  </View>
               </View>
               <View style={styles.heroIconBox}>
                  <MaterialCommunityIcons name="finance" size={60} color="rgba(255,255,255,0.2)" />
               </View>
            </View>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
           <StatBox icon="currency-inr" label="Expected" value={`₹${(summary.totalFees / 100000).toFixed(1)}L`} color="#6366F1" subtitle="Academic Year" />
           <StatBox icon="clock-alert-outline" label="Receivable" value={`₹${(summary.pendingAmount / 1000).toFixed(0)}K`} color="#EF4444" subtitle="Outstanding" />
        </View>

        {/* Invoice Management */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Invoice Directory</Text>
           <TouchableOpacity style={styles.createBtn}>
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.createBtnText}>Invoice</Text>
           </TouchableOpacity>
        </View>

        {/* Premium Tab Switcher */}
        <View style={styles.tabRow}>
           {['All', 'Pending', 'Collected'].map(t => (
             <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
             </TouchableOpacity>
           ))}
        </View>

        {/* List */}
        <View style={styles.list}>
          {isLoading && !isRefreshing ? (
            [1, 2, 3].map(i => <Skeleton key={i} width="100%" height={160} borderRadius={24} style={{ marginBottom: 16 }} />)
          ) : filteredInvoices.length === 0 ? (
            <View style={styles.empty}>
               <MaterialCommunityIcons name="file-search-outline" size={60} color="#D1D5DB" />
               <Text style={styles.emptyText}>No financial records found.</Text>
            </View>
          ) : (
            filteredInvoices.map((item, index) => (
              <InvoiceCard key={item.id} item={item} index={index} delay={index * 50} />
            ))
          )}
        </View>

      </ScrollView>

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
  heroCard: { height: 180, borderRadius: 32, marginHorizontal: 20, padding: 24, justifyContent: 'center', overflow: 'hidden' },
  heroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroMain: { flex: 1 },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroValue: { color: '#FFF', fontSize: 44, fontWeight: '900', marginVertical: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  progressBar: { height: 6, flex: 0.6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },
  progressText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  heroIconBox: { marginLeft: 10 },

  // Stats
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginTop: 25 },
  statBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  statIconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  statValue: { fontSize: 24, fontWeight: '900', marginVertical: 4 },
  statSub: { fontSize: 10, color: '#64748B', fontWeight: '600' },

  // Section Header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 35, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  createBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  // Tabs
  tabRow: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, padding: 4, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
  tabActive: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFF' },

  // Cards
  list: { paddingHorizontal: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  studentName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  invoiceId: { fontSize: 12, color: '#94A3B8', fontWeight: '700', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900' },
  cardBody: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F8FAFC', marginBottom: 15 },
  bodyCol: { flex: 1 },
  bodyLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  bodyVal: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginTop: 4 },
  divider: { width: 1, height: 30, backgroundColor: '#F1F5F9', marginHorizontal: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  actionBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, backgroundColor: '#EEF2FF' },
  actionText: { fontSize: 12, fontWeight: '800', color: '#4F46E5' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '600', marginTop: 15 },
});

export default PrincipalFeesScreen;
