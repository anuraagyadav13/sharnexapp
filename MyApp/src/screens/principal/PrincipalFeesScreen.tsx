import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import principalService, { InvoiceStats, InvoiceItem } from '../../services/principalService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';

const { width } = Dimensions.get('window');

type PrincipalFeesNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalFees'
>;

interface Props {
  navigation: PrincipalFeesNavigationProp;
}

type TabType = 'All' | 'PENDING' | 'PAID' | 'OVERDUE';

const formatRupee = (amount: number) => {
  if (amount === undefined || amount === null) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
};

const PrincipalFeesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const { authState } = useAuth();
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabType>('All');

  const loadData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);

    try {
      const [statsRes, invoicesRes] = await Promise.all([
        principalService.getInvoiceStats(),
        principalService.getInvoices(50),
      ]);

      setStats(statsRes.data?.data || null);
      setInvoices(invoicesRes.data?.data?.invoices || []);
    } catch (error) {
      console.error('[PrincipalFees] Failed to fetch fees/invoice data:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived filter
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedTab === 'All') return true;
      return inv.status === selectedTab;
    });
  }, [invoices, selectedTab]);

  const formatDate = useCallback((dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return 'N/A';
    }
  }, []);

  const getStatusStyles = useCallback((status: string) => {
    const s = status?.toUpperCase();
    if (isDarkMode) {
      switch (s) {
        case 'PAID':
          return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399' };
        case 'PENDING':
          return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24' };
        case 'OVERDUE':
          return { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171' };
        default:
          return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8' };
      }
    } else {
      switch (s) {
        case 'PAID':
          return { bg: '#ECFDF5', text: '#059669' };
        case 'PENDING':
          return { bg: '#FFF7ED', text: '#EA580C' };
        case 'OVERDUE':
          return { bg: '#FEF2F2', text: '#EF4444' };
        default:
          return { bg: '#F3F4F6', text: '#6B7280' };
      }
    }
  }, [isDarkMode]);

  const renderInvoiceCard = useCallback(
    ({ item }: { item: InvoiceItem }) => {
      const statusStyles = getStatusStyles(item.status);

      return (
        <View style={styles.invoiceCard}>
          <View style={styles.cardHeader}>
            <View style={styles.invoiceNumberBox}>
              <Ionicons name="receipt-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={styles.invoiceNumberText}>{item.invoiceNumber}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyles.bg }]}>
              <Text style={[styles.statusText, { color: statusStyles.text }]}>
                {item.status || 'PENDING'}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.studentNameText}>{item.studentName}</Text>
            <Text style={styles.amountText}>{formatRupee(item.totalAmount)}</Text>
            <Text style={styles.descriptionText}>{item.description || 'Tuition Fee'}</Text>
            <Text style={styles.monthText}>
              {item.month || 'December'} · {item.academicYear || '2024-25'}
            </Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardFooter}>
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Due Date:</Text>
              <Text style={styles.dateValue}>{formatDate(item.dueDate)}</Text>
            </View>
            {item.status === 'PAID' && item.paidAt ? (
              <View style={styles.paidInfo}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.paidText}>Paid {formatDate(item.paidAt)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      );
    },
    [getStatusStyles, formatDate]
  );

  const listHeader = useMemo(() => {
    if (!stats) return null;

    const rate = Math.min(100, Math.max(0, stats.collectionRate || 0));

    return (
      <View style={styles.headerContainer}>
        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Fees</Text>
            <Text style={styles.statValueText}>{formatRupee(stats.totalFees)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Collected</Text>
            <Text style={[styles.statValueText, { color: '#059669' }]}>
              {stats.paidCount} inv
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValueText, { color: '#EA580C' }]}>
              {formatRupee(stats.pendingPayments)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Overdue</Text>
            <Text style={[styles.statValueText, { color: '#EF4444' }]}>
              {stats.overdueCount} inv
            </Text>
          </View>
        </View>

        {/* Collection Rate Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Collection Rate</Text>
            <Text style={styles.progressPercentage}>{rate}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${rate}%` }]} />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {(['All', 'PENDING', 'PAID', 'OVERDUE'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, [stats, selectedTab]);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
        <Text style={styles.errorTitle}>Failed to load fees stats</Text>
        <Text style={styles.errorSubtitle}>
          An error occurred while fetching fee statistics and invoices. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Fees Portal</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
        >
          {authState.user?.photoUrl ? (
            <Image source={{ uri: authState.user.photoUrl }} style={styles.headerAvatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoiceCard}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            colors={['#4F46E5']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={theme.subtext} />
            <Text style={styles.emptyTitle}>No {selectedTab.toLowerCase()} invoices</Text>
            <Text style={styles.emptySubtitle}>
              There are no invoices found for the selected filter.
            </Text>
          </View>
        }
      />

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: theme.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerBtn: {
    padding: 4,
  },
  appHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  listContent: {
    paddingBottom: 24,
  },
  headerContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: theme.surface,
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: theme.subtext,
    marginBottom: 6,
    fontWeight: '500',
  },
  statValueText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  progressSection: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: isDarkMode ? '#334155' : '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? '#1E293B' : '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: theme.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.subtext,
  },
  tabTextActive: {
    color: theme.primary,
  },
  invoiceCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceNumberBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    marginBottom: 12,
  },
  studentNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: theme.subtext,
    marginBottom: 4,
  },
  monthText: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    color: theme.subtext,
    marginRight: 4,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
  paidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9F7AEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  headerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 4,
  },
});

export default PrincipalFeesScreen;
