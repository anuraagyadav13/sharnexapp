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
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';
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

  // Tab counts for modern live count badges
  const tabCounts = useMemo(() => {
    return {
      All: invoices.length,
      PENDING: invoices.filter((i) => i.status === 'PENDING').length,
      PAID: stats?.paidCount ?? invoices.filter((i) => i.status === 'PAID').length,
      OVERDUE: stats?.overdueCount ?? invoices.filter((i) => i.status === 'OVERDUE').length,
    };
  }, [invoices, stats]);

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
          return { bg: 'rgba(16, 185, 129, 0.16)', text: '#34D399', dot: '#10B981' };
        case 'PENDING':
          return { bg: 'rgba(245, 158, 11, 0.16)', text: '#FBBF24', dot: '#F59E0B' };
        case 'OVERDUE':
          return { bg: 'rgba(239, 68, 68, 0.16)', text: '#F87171', dot: '#EF4444' };
        default:
          return { bg: 'rgba(148, 163, 184, 0.16)', text: '#94A3B8', dot: '#64748B' };
      }
    } else {
      switch (s) {
        case 'PAID':
          return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
        case 'PENDING':
          return { bg: '#FFF7ED', text: '#C2410C', dot: '#F59E0B' };
        case 'OVERDUE':
          return { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' };
        default:
          return { bg: '#F1F5F9', text: '#475569', dot: '#64748B' };
      }
    }
  }, [isDarkMode]);

  const getLeftBorderColor = useCallback((status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'PAID':
        return '#10B981';
      case 'PENDING':
        return '#F59E0B';
      case 'OVERDUE':
        return '#EF4444';
      default:
        return '#94A3B8';
    }
  }, []);

  const renderInvoiceCard = useCallback(
    ({ item, index }: { item: InvoiceItem; index: number }) => {
      const statusStyles = getStatusStyles(item.status);
      const topAccentColor = getLeftBorderColor(item.status);

      return (
        <Animated.View entering={FadeInUp.delay(100 + (index % 8) * 50).duration(350)}>
          <TouchableOpacity activeOpacity={0.88} style={styles.invoiceCard}>
            {/* Top Status Accent Bar */}
            <View style={[styles.topAccentBar, { backgroundColor: topAccentColor }]} />

            {/* Header: Student Name & Status Badge */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.studentInfoGroup}>
                <Text style={styles.studentNameText} numberOfLines={1}>
                  {item.studentName}
                </Text>
                <View style={styles.invoiceNumberChip}>
                  <Ionicons name="receipt-outline" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.invoiceNumberText}>{item.invoiceNumber}</Text>
                </View>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: statusStyles.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusStyles.dot }]} />
                <Text style={[styles.statusText, { color: statusStyles.text }]}>
                  {item.status || 'PENDING'}
                </Text>
              </View>
            </View>

            {/* Body: Hero Amount & Fee Metadata */}
            <View style={styles.cardBodySection}>
              <View style={styles.amountRow}>
                <Text style={styles.amountText}>{formatRupee(item.totalAmount)}</Text>
                <View style={styles.feeMonthTag}>
                  <Text style={styles.feeMonthText}>
                    {item.month || 'December'} · {item.academicYear || '2024-25'}
                  </Text>
                </View>
              </View>
              <Text style={styles.descriptionText}>{item.description || 'Tuition Fee'}</Text>
            </View>

            <View style={styles.cardDivider} />

            {/* Footer: Date Info & Paid Timestamp */}
            <View style={styles.cardFooterRow}>
              <View style={styles.dateInfoGroup}>
                <Ionicons name="calendar-outline" size={14} color={theme.subtext} style={{ marginRight: 5 }} />
                <Text style={styles.dateLabel}>Due Date:</Text>
                <Text style={styles.dateValue}>{formatDate(item.dueDate)}</Text>
              </View>

              {item.status === 'PAID' && item.paidAt ? (
                <View style={styles.paidInfoBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.paidText}>Paid {formatDate(item.paidAt)}</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [getStatusStyles, getLeftBorderColor, formatDate, theme, styles]
  );

  const listHeader = useMemo(() => {
    if (!stats) return null;

    const rate = Math.min(100, Math.max(0, stats.collectionRate || 0));

    // Circular Progress Constants (74x74 SVG Hero)
    const size = 74;
    const strokeWidth = 7;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * rate) / 100;

    const tabLabels: Record<TabType, string> = {
      All: 'All',
      PENDING: 'Pending',
      PAID: 'Paid',
      OVERDUE: 'Overdue',
    };

    const isHealthy = rate >= 75;

    return (
      <View style={styles.headerContainer}>
        {/* Editorial Stats Grid */}
        <Animated.View entering={FadeInUp.delay(50).duration(400)}>
          {/* Dominant Hero Card: Total Fees */}
          <View style={styles.heroStatCard}>
            <View style={styles.heroCardHeaderRow}>
              <View style={styles.heroIconBox}>
                <Ionicons name="wallet" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroStatLabel}>Total Expected Fees</Text>
                <Text style={styles.heroStatSub}>Academic Session Summary</Text>
              </View>
            </View>
            <Text style={styles.heroStatValueText}>{formatRupee(stats.totalFees)}</Text>
          </View>

          {/* Secondary 3-Card Grid Row */}
          <View style={styles.secondaryStatsRow}>
            {/* Collected */}
            <View style={[styles.secondaryCard, { borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#D1FAE5' }]}>
              <View style={[styles.miniIconCircle, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
              <Text style={styles.secondaryLabel}>Collected</Text>
              <Text style={[styles.secondaryValueText, { color: isDarkMode ? '#34D399' : '#059669' }]}>
                {stats.paidCount} inv
              </Text>
            </View>

            {/* Pending */}
            <View style={[styles.secondaryCard, { borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#FEF3C7' }]}>
              <View style={[styles.miniIconCircle, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB' }]}>
                <Ionicons name="time" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.secondaryLabel}>Pending</Text>
              <Text style={[styles.secondaryValueText, { color: isDarkMode ? '#FBBF24' : '#D97706' }]}>
                {formatRupee(stats.pendingPayments)}
              </Text>
            </View>

            {/* Overdue */}
            <View style={[styles.secondaryCard, { borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2' }]}>
              <View style={[styles.miniIconCircle, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' }]}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
              </View>
              <Text style={styles.secondaryLabel}>Overdue</Text>
              <Text style={[styles.secondaryValueText, { color: isDarkMode ? '#F87171' : '#DC2626' }]}>
                {stats.overdueCount} inv
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Collection Rate Hero Moment */}
        <Animated.View entering={FadeInUp.delay(180).duration(400)}>
          <View style={styles.collectionHeroSection}>
            <View style={styles.progressRow}>
              <View style={styles.circularWrapper}>
                <Svg width={size} height={size}>
                  <Defs>
                    <SvgLinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor={theme.primary} />
                      <Stop offset="100%" stopColor={isHealthy ? '#10B981' : '#F59E0B'} />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={isDarkMode ? '#334155' : '#E2E8F0'}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="url(#ringGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    transform={`rotate(-90 ${center} ${center})`}
                  />
                </Svg>
                <View style={styles.circularCenterText}>
                  <Text style={styles.progressPercentage}>{rate}%</Text>
                </View>
              </View>

              <View style={styles.progressTextContainer}>
                <View style={styles.healthStatusHeaderRow}>
                  <Text style={styles.progressTitle}>Fee Collection Rate</Text>
                  <View style={[styles.healthIndicatorDot, { backgroundColor: isHealthy ? '#10B981' : '#F59E0B' }]} />
                </View>
                <Text style={styles.progressSubtitle}>
                  {isHealthy
                    ? 'Healthy overall collection performance across classes'
                    : 'Follow-up recommended for high overdue balance'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Filter Segmented Control Tabs */}
        <Animated.View entering={FadeInUp.delay(260).duration(400)}>
          <View style={styles.segmentedControlBar}>
            {(['All', 'PENDING', 'PAID', 'OVERDUE'] as TabType[]).map((tab) => {
              const isActive = selectedTab === tab;
              const count = tabCounts[tab];
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                  onPress={() => setSelectedTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                    {tabLabels[tab]}
                  </Text>
                  <View style={[styles.badgeChip, isActive && styles.badgeChipActive]}>
                    <Text style={[styles.badgeChipText, isActive && styles.badgeChipTextActive]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    );
  }, [stats, selectedTab, tabCounts, theme, isDarkMode, styles]);

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
        <View style={styles.errorIconWrapper}>
          <Ionicons name="alert-circle" size={48} color={theme.danger} />
        </View>
        <Text style={styles.errorTitle}>Failed to load fees stats</Text>
        <Text style={styles.errorSubtitle}>
          An error occurred while fetching fee statistics and invoices. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryBtn} activeOpacity={0.85} onPress={() => loadData()}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Header — Strictly Preserved Untouched */}
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
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={44} color={theme.subtext} />
            </View>
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
    paddingHorizontal: 28,
    backgroundColor: theme.background,
  },
  errorIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Untouched App Header */
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

  /* FlatList & Containers */
  listContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    padding: 16,
  },

  /* Dominant Hero Card (Total Fees) */
  heroStatCard: {
    backgroundColor: isDarkMode ? '#1E1B4B' : '#F5F3FF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.35)' : '#DDD6FE',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heroCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  heroStatLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  heroStatSub: {
    fontSize: 11,
    color: theme.subtext,
    marginTop: 2,
  },
  heroStatValueText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: -0.5,
  },

  /* Secondary Stats 3-Column Row */
  secondaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 3,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  miniIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryLabel: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '600',
    marginBottom: 4,
  },
  secondaryValueText: {
    fontSize: 14,
    fontWeight: '800',
  },

  /* Collection Rate Hero Section */
  collectionHeroSection: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDarkMode ? 0.25 : 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circularWrapper: {
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  circularCenterText: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  progressTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  healthStatusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  healthIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  progressSubtitle: {
    fontSize: 12,
    color: theme.subtext,
    lineHeight: 17,
  },

  /* Segmented Control Bar */
  segmentedControlBar: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    borderRadius: 24,
    padding: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: theme.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.subtext,
    opacity: 0.8,
  },
  segmentTextActive: {
    color: theme.primary,
    fontWeight: '700',
    opacity: 1,
  },
  badgeChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
    marginLeft: 5,
  },
  badgeChipActive: {
    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)',
  },
  badgeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.subtext,
  },
  badgeChipTextActive: {
    color: theme.primary,
  },

  /* Modernized Invoice Cards */
  invoiceCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDarkMode ? 0.25 : 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 12,
  },
  studentInfoGroup: {
    flex: 1,
    marginRight: 10,
  },
  studentNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  invoiceNumberChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.subtext,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardBodySection: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.4,
  },
  feeMonthTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
  },
  feeMonthText: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 13,
    color: theme.subtext,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginBottom: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfoGroup: {
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
  paidInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },

  /* Empty State */
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: 'center',
  },
});

export default PrincipalFeesScreen;
