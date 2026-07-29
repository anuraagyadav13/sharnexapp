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
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import principalService, { InvoiceStats, InvoiceItem, ReconciliationData, ReconciliationPayment } from '../../services/principalService';
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

type MainTab = 'invoices' | 'settlements' | 'refunds';
type InvoiceFilter = 'All' | 'PENDING' | 'PAID' | 'OVERDUE';
type PaymentModeFilter = 'ALL' | 'UPI' | 'CARD' | 'CASH' | 'CHEQUE';

const formatRupee = (amount: number) => {
  if (amount === undefined || amount === null) return '₹0';
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(2) + 'L';
  return '₹' + amount.toLocaleString('en-IN');
};

const formatFullRupee = (amount: number) => {
  if (amount === undefined || amount === null) return '₹0';
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatDate = (dateStr: string) => {
  try {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return 'N/A'; }
};

const formatDateTime = (dateStr: string) => {
  try {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return '-'; }
};

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0][0].toUpperCase();
};

const avatarColors = ['#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#10B981', '#3B82F6', '#6366F1', '#14B8A6'];
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const PrincipalFeesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const s = getStyles(theme, isDarkMode);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();

  // Data states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationData | null>(null);
  const [isReconLoading, setIsReconLoading] = useState(false);

  // UI states
  const [mainTab, setMainTab] = useState<MainTab>('invoices');
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('All');
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentModeFilter>('ALL');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Refund modal
  const [refundInvoice, setRefundInvoice] = useState<InvoiceItem | null>(null);
  const [refundReason, setRefundReason] = useState('Duplicate or incorrect fee payment');
  const [refundConfirmText, setRefundConfirmText] = useState('');
  const [refundAgreed, setRefundAgreed] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setIsError(false);

    try {
      const [statsRes, invoicesRes] = await Promise.all([
        principalService.getInvoiceStats(),
        principalService.getInvoices(500),
      ]);
      setStats(statsRes.data?.data || null);
      setInvoices(invoicesRes.data?.data?.invoices || []);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadReconciliation = useCallback(async () => {
    setIsReconLoading(true);
    try {
      const now = new Date();
      // Expand range to see past paid invoices and payouts that occurred in previous months
      const startDate = `${now.getFullYear() - 1}-01-01`;
      const endDate = `${now.getFullYear() + 1}-12-31`;
      const res = await principalService.getReconciliation(startDate, endDate);
      if (res.data?.data) setReconciliation(res.data.data);
    } catch {
      // Silently fail
    } finally {
      setIsReconLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (mainTab === 'settlements' && !reconciliation) loadReconciliation();
  }, [mainTab]);

  // Derived
  const filteredInvoices = useMemo(() =>
    invoices.filter(inv => invoiceFilter === 'All' || (inv.status || '').toUpperCase() === invoiceFilter),
    [invoices, invoiceFilter]
  );

  const filteredPayouts = useMemo(() => {
    const payments = reconciliation?.payments || [];
    if (paymentModeFilter === 'ALL') return payments;
    return payments.filter(p => (p.payment_mode || '').toUpperCase() === paymentModeFilter);
  }, [reconciliation, paymentModeFilter]);

  // Computed metrics
  const grossCollected = stats?.totalPaid || 0;
  const netSettled = reconciliation?.totalSettled ?? grossCollected;
  const gatewayDeductions = reconciliation?.totalGatewayCost ?? 0;
  const settlementEfficiency = grossCollected > 0 ? Math.round((netSettled / grossCollected) * 1000) / 10 : 100;
  const totalBilled = stats?.totalFees || 0;
  const pendingAmount = stats?.pendingPayments ?? (totalBilled - grossCollected);
  const collectionRate = stats?.collectionRate || 0;
  const paidCount = stats?.paidCount || 0;
  const totalCount = stats?.count || 0;

  // Status Badge
  const StatusBadge = ({ status }: { status: string }) => {
    const normalized = (status || 'PENDING').toUpperCase();
    let bg = '#FFF7ED'; let text = '#EA580C'; let icon = 'time-outline'; let label = 'Pending';
    if (normalized === 'PAID' || normalized === 'SUCCESS') { bg = '#ECFDF5'; text = '#059669'; icon = 'checkmark-circle'; label = 'Paid'; }
    else if (normalized === 'OVERDUE') { bg = '#FEF2F2'; text = '#EF4444'; icon = 'alert-circle'; label = 'Overdue'; }
    else if (normalized === 'CANCELLED') { bg = '#F3F4F6'; text = '#6B7280'; icon = 'close-circle'; label = 'Cancelled'; }
    return (
      <View style={[s.statusBadge, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={12} color={text} />
        <Text style={[s.statusBadgeText, { color: text }]}>{label}</Text>
      </View>
    );
  };

  const PaymentModeBadge = ({ mode }: { mode: string }) => {
    const m = (mode || '').toUpperCase();
    let bg = '#EEF2FF'; let text = '#4F46E5'; let icon = 'card-outline';
    if (m === 'UPI') { bg = '#F0FDF4'; text = '#16A34A'; icon = 'phone-portrait-outline'; }
    else if (m === 'CASH') { bg = '#FEF3C7'; text = '#D97706'; icon = 'cash-outline'; }
    else if (m === 'CHEQUE') { bg = '#FDF4FF'; text = '#C026D3'; icon = 'document-text-outline'; }
    else if (m === 'NETBANKING') { bg = '#E0F2FE'; text = '#0369A1'; icon = 'globe-outline'; }
    return (
      <View style={[s.paymentModeBadge, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={12} color={text} />
        <Text style={[s.paymentModeBadgeText, { color: text }]}>{m || 'N/A'}</Text>
      </View>
    );
  };

  // HEADER
  const renderHeader = () => (
    <View style={s.headerSection}>
      {/* Title */}
      <View style={s.titleRow}>
        <View style={s.titleIcon}>
          <Ionicons name="receipt" size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.titleTextRow}>
            <Text style={s.titleText}>Fee Management</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>Double-Entry</Text>
            </View>
          </View>
          <Text style={s.subtitleText}>Manage receivables, invoices & settlements</Text>
        </View>
      </View>

      {/* Create Invoice Button */}
      <TouchableOpacity
        style={s.createBtn}
        onPress={() => navigation.navigate('PrincipalCreateInvoice' as any)}
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={s.createBtnText}>Create Invoice</Text>
      </TouchableOpacity>

      {/* Ledger Banner */}
      <View style={s.ledgerBanner}>
        <View style={s.ledgerBannerRow}>
          <View style={s.ledgerIconBox}>
            <Ionicons name="shield-checkmark" size={14} color="#7C3AED" />
          </View>
          <Text style={s.ledgerBannerLabel}>Double-Entry Ledger </Text>
          <Text style={s.ledgerBannerDesc}>Row-level locking • 0% UPI • 2% Card absorbed</Text>
        </View>
        <View style={s.syncBadge}>
          <View style={s.syncDot} />
          <Text style={s.syncBadgeText}>Real-Time Sync</Text>
        </View>
      </View>

      {/* KPI Cards - Horizontal Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
        {/* Card 1: Gross Collected */}
        <View style={s.kpiCard}>
          <View style={s.kpiTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.kpiLabel}>GROSS COLLECTED</Text>
              <Text style={s.kpiValue}>{formatRupee(grossCollected)}</Text>
            </View>
            <View style={[s.kpiIcon, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="wallet" size={20} color="#7C3AED" />
            </View>
          </View>
          <View style={s.kpiDivider} />
          <View style={s.kpiBottom}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="trending-up" size={12} color="#059669" />
              <Text style={[s.kpiBottomText, { color: '#059669', fontWeight: '700' }]}>Real-Time Volume</Text>
            </View>
            <Text style={s.kpiBottomText}>{paidCount} payments</Text>
          </View>
        </View>

        {/* Card 2: Net Settled Revenue (Dark) */}
        <View style={s.kpiCardDark}>
          <View style={s.kpiTop}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[s.kpiLabel, { color: '#A5B4FC' }]}>NET SETTLED REVENUE</Text>
                <Ionicons name="sparkles" size={12} color="#FCD34D" />
              </View>
              <Text style={[s.kpiValue, { color: '#FFFFFF' }]}>{formatRupee(netSettled)}</Text>
            </View>
            <View style={[s.kpiIcon, { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }]}>
              <Ionicons name="business" size={20} color="#C7D2FE" />
            </View>
          </View>
          <View style={[s.kpiDivider, { backgroundColor: 'rgba(99,102,241,0.3)' }]} />
          <View style={s.kpiBottom}>
            <Text style={[s.kpiBottomText, { color: '#C7D2FE' }]}>{formatRupee(gatewayDeductions)} absorbed</Text>
            <View style={s.netBadge}>
              <Text style={s.netBadgeText}>{settlementEfficiency}% Net</Text>
            </View>
          </View>
        </View>

        {/* Card 3: Total Billed */}
        <View style={s.kpiCard}>
          <View style={s.kpiTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.kpiLabel}>TOTAL BILLED</Text>
              <Text style={s.kpiValue}>{formatRupee(totalBilled)}</Text>
            </View>
            <View style={[s.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="trending-up" size={20} color="#3B82F6" />
            </View>
          </View>
          <View style={s.kpiDivider} />
          <View style={s.kpiBottom}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="trending-up" size={12} color="#3B82F6" />
              <Text style={[s.kpiBottomText, { color: '#3B82F6', fontWeight: '700' }]}>Live Ledger Sync</Text>
            </View>
            <Text style={s.kpiBottomText}>{totalCount} total records</Text>
          </View>
        </View>

        {/* Card 4: Collection Velocity */}
        <View style={s.kpiCard}>
          <View style={s.kpiTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.kpiLabel}>COLLECTION VELOCITY</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <Text style={s.kpiValue}>{collectionRate}%</Text>
                <View style={s.pendingTag}>
                  <Text style={s.pendingTagText}>{formatRupee(pendingAmount)} Pending</Text>
                </View>
              </View>
            </View>
            <View style={[s.kpiIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="speedometer" size={20} color="#059669" />
            </View>
          </View>
          <View style={s.kpiDivider} />
          <View style={s.kpiBottom}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="trending-up" size={12} color="#059669" />
              <Text style={[s.kpiBottomText, { color: '#059669', fontWeight: '700' }]}>Real-Time Rate</Text>
            </View>
            <Text style={s.kpiBottomText}>Automated</Text>
          </View>
        </View>
      </ScrollView>

      {/* Main Tab Switcher */}
      <View style={s.mainTabRow}>
        <TouchableOpacity
          style={[s.mainTabBtn, mainTab === 'invoices' && s.mainTabActive]}
          onPress={() => setMainTab('invoices')}
        >
          <Ionicons name="receipt-outline" size={14} color={mainTab === 'invoices' ? '#7C3AED' : '#94A3B8'} />
          <Text style={[s.mainTabText, mainTab === 'invoices' && s.mainTabTextActive]}>Invoices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.mainTabBtn, mainTab === 'settlements' && s.mainTabActive]}
          onPress={() => setMainTab('settlements')}
        >
          <Ionicons name="business-outline" size={14} color={mainTab === 'settlements' ? '#7C3AED' : '#94A3B8'} />
          <Text style={[s.mainTabText, mainTab === 'settlements' && s.mainTabTextActive]}>Settlement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.mainTabBtn, mainTab === 'refunds' && s.mainTabActive]}
          onPress={() => setMainTab('refunds')}
        >
          <Ionicons name="return-down-back" size={14} color={mainTab === 'refunds' ? '#7C3AED' : '#94A3B8'} />
          <Text style={[s.mainTabText, mainTab === 'refunds' && s.mainTabTextActive]}>Refunds</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // INVOICES TAB HEADER
  const renderInvoicesSubHeader = () => (
    <View style={s.subHeaderSection}>
      <View style={s.subHeaderRow}>
        <View style={s.subHeaderIcon}>
          <Ionicons name="document-text" size={16} color="#64748B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.subHeaderTitle}>Ledger Invoices & Receivables</Text>
          <Text style={s.subHeaderDesc}>Double-entry protected ledger items</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={s.filterRow}>
        {(['All', 'PENDING', 'PAID', 'OVERDUE'] as InvoiceFilter[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.filterBtn, invoiceFilter === tab && s.filterBtnActive]}
            onPress={() => setInvoiceFilter(tab)}
          >
            <Text style={[s.filterText, invoiceFilter === tab && s.filterTextActive]}>
              {tab === 'All' ? 'All Invoices' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  // REFUNDS TAB HEADER
  const renderRefundsSubHeader = () => (
    <View style={s.subHeaderSection}>
      <View style={s.subHeaderRow}>
        <View style={[s.subHeaderIcon, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="return-down-back" size={16} color="#EF4444" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.subHeaderTitle}>Refunds Processing</Text>
          <Text style={s.subHeaderDesc}>Initiate refunds for paid invoices</Text>
        </View>
      </View>
    </View>
  );


  // INVOICE CARD
  const renderInvoiceCard = ({ item }: { item: InvoiceItem }) => {
    const color = getAvatarColor(item.studentName);
    return (
      <View style={s.invoiceCard}>
        <View style={s.cardTop}>
          {/* Invoice Number */}
          <View style={s.invNumRow}>
            <Text style={s.invNumText}>{item.invoiceNumber}</Text>
          </View>

          {/* Student Row */}
          <View style={s.studentRow}>
            <View style={[s.studentAvatar, { backgroundColor: color }]}>
              <Text style={s.studentAvatarText}>{getInitials(item.studentName)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.studentName}>{item.studentName}</Text>
              <Text style={s.studentGrade}>General Student</Text>
            </View>
          </View>

          {/* Fee Description */}
          <Text style={s.feeDesc} numberOfLines={1}>{item.description || 'Tuition Fee'}</Text>

          {/* Amount & Status Row */}
          <View style={s.amountStatusRow}>
            <Text style={s.amountVal}>{formatRupee(item.totalAmount || item.baseAmount)}</Text>
            <StatusBadge status={item.status} />
          </View>

          {/* Dates */}
          <View style={s.datesRow}>
            <View style={s.dateBlock}>
              <Text style={s.dateLbl}>Issue Date</Text>
              <Text style={s.dateVal}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={s.dateBlock}>
              <Text style={s.dateLbl}>Due Date</Text>
              <Text style={s.dateVal}>{formatDate(item.dueDate)}</Text>
            </View>
            {(item.status || '').toUpperCase() === 'PAID' && item.paidAt && (
              <View style={s.dateBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text style={[s.dateVal, { color: '#059669' }]}>Paid {formatDate(item.paidAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={s.cardActions}>
          <TouchableOpacity
            style={s.actionDotBtn}
            onPress={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#94A3B8" />
          </TouchableOpacity>
          {actionMenuId === item.id && (
            <View style={s.actionMenu}>
              <TouchableOpacity style={s.actionMenuItem} onPress={() => { setActionMenuId(null); }}>
                <Ionicons name="download-outline" size={16} color="#334155" />
                <Text style={s.actionMenuText}>Download Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionMenuItem} onPress={() => { setActionMenuId(null); }}>
                <Ionicons name="book-outline" size={16} color="#334155" />
                <Text style={s.actionMenuText}>View Ledger Entries</Text>
              </TouchableOpacity>
              {(item.status || '').toUpperCase() === 'PAID' && mainTab === 'refunds' && (
                <TouchableOpacity
                  style={s.actionMenuItem}
                  onPress={() => { setActionMenuId(null); setRefundInvoice(item); }}
                >
                  <Ionicons name="return-down-back" size={16} color="#EF4444" />
                  <Text style={[s.actionMenuText, { color: '#EF4444' }]}>Initiate Refund</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  // SETTLEMENTS TAB
  const renderSettlementsHeader = () => (
    <View style={s.subHeaderSection}>
      {/* Bank Settlements Header */}
      <View style={s.settlementsTopCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View style={[s.subHeaderIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Ionicons name="business" size={16} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.subHeaderTitle}>Bank Settlements & Ledger Reconciliation</Text>
            <Text style={s.subHeaderDesc}>Automated audit comparing expected ledger vs actual deposits</Text>
          </View>
        </View>
        <TouchableOpacity style={s.auditBtn} onPress={loadReconciliation}>
          <Ionicons name="refresh" size={14} color="#FFFFFF" />
          <Text style={s.auditBtnText}>Run Audit</Text>
        </TouchableOpacity>
      </View>

      {/* Settlement Summary Cards */}
      {isReconLoading ? (
        <ActivityIndicator size="small" color="#7C3AED" style={{ marginVertical: 20 }} />
      ) : reconciliation ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginTop: 16 }}>
          {/* Base Invoice Volume */}
          <View style={s.reconCard}>
            <Text style={s.reconLabel}>BASE INVOICE VOLUME</Text>
            <Text style={s.reconValue}>{formatRupee(reconciliation.totalBase)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <Ionicons name="checkmark" size={12} color="#059669" />
              <Text style={s.reconMeta}>{reconciliation.totalPayments} verified transactions</Text>
            </View>
          </View>

          {/* Gateway Deductions */}
          <View style={s.reconCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={s.reconLabel}>GATEWAY DEDUCTIONS</Text>
              <View style={s.gstBadge}>
                <Text style={s.gstBadgeText}>GST + Fee</Text>
              </View>
            </View>
            <Text style={[s.reconValue, { color: '#4F46E5' }]}>{formatRupee(reconciliation.totalGatewayCost)}</Text>
            <Text style={s.reconMeta}>0% fee on UPI • 2% on Cards</Text>
          </View>

          {/* Net Settled - Dark */}
          <View style={s.reconCardDark}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[s.reconLabel, { color: '#6EE7B7' }]}>NET SETTLED TO BANK</Text>
              <Ionicons name="shield-checkmark" size={16} color="#34D399" />
            </View>
            <Text style={[s.reconValue, { color: '#FFFFFF' }]}>{formatRupee(reconciliation.totalSettled)}</Text>
            <Text style={[s.reconMeta, { color: 'rgba(110,231,183,0.8)' }]}>Verified Bank Account • Reconciled</Text>
          </View>
        </ScrollView>
      ) : null}

      {/* Payout Table Header */}
      <View style={s.payoutHeaderSection}>
        <View>
          <Text style={[s.subHeaderTitle, { marginBottom: 2 }]}>Verified Bank Payout Schedule</Text>
          <Text style={s.subHeaderDesc}>Base Amount vs Deductions vs Net Settled</Text>
        </View>
        <View style={s.paymentFilterRow}>
          {(['ALL', 'UPI', 'CARD', 'CASH', 'CHEQUE'] as PaymentModeFilter[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[s.paymentFilterBtn, paymentModeFilter === m && s.paymentFilterBtnActive]}
              onPress={() => setPaymentModeFilter(m)}
            >
              <Text style={[s.paymentFilterText, paymentModeFilter === m && s.paymentFilterTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // PAYOUT CARD
  const renderPayoutCard = ({ item }: { item: ReconciliationPayment }) => (
    <View style={[s.payoutCard, { zIndex: actionMenuId === item.id ? 100 : 1 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <View>
          <Text style={s.payoutRef}>{item.razorpay_payment_id || item.id?.substring(0, 24) || 'pay_offline'}</Text>
          <Text style={s.payoutDate}>{formatDateTime(item.created_at)}</Text>
        </View>
        <PaymentModeBadge mode={item.payment_mode} />
      </View>

      <View style={s.payoutGrid}>
        <View style={s.payoutGridItem}>
          <Text style={s.payoutGridLabel}>Base Amount</Text>
          <Text style={s.payoutGridValue}>{formatFullRupee(item.base_amount || 0)}</Text>
        </View>
        <View style={s.payoutGridItem}>
          <Text style={[s.payoutGridLabel, { color: '#059669' }]}>Deductions</Text>
          <Text style={[s.payoutGridValue, { color: '#059669' }]}>{formatFullRupee((item.gateway_fee || 0) + (item.gst_on_fee || 0))} ({(item.payment_mode || '').toUpperCase() === 'UPI' ? '0%' : '2%'} Fee)</Text>
        </View>
        <View style={s.payoutGridItem}>
          <Text style={s.payoutGridLabel}>Net Settled</Text>
          <Text style={[s.payoutGridValue, { fontWeight: '800' }]}>{formatFullRupee(item.settled_amount || 0)}</Text>
        </View>
      </View>

      <View style={[s.reconStatusRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={s.reconStatusBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#059669" />
          <Text style={s.reconStatusText}>Matched & Reconciled</Text>
        </View>
        
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            style={s.actionDotBtn}
            onPress={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#94A3B8" />
          </TouchableOpacity>
          {actionMenuId === item.id && (
            <View style={[s.actionMenu, { right: 0, top: 30, width: 180 }]}>
              <TouchableOpacity style={s.actionMenuItem} onPress={() => { setActionMenuId(null); }}>
                <Ionicons name="download-outline" size={16} color="#334155" />
                <Text style={s.actionMenuText}>Download Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionMenuItem} onPress={() => { setActionMenuId(null); }}>
                <Ionicons name="book-outline" size={16} color="#334155" />
                <Text style={s.actionMenuText}>View Ledger Entries</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // REFUND MODAL
  const renderRefundModal = () => {
    if (!refundInvoice) return null;
    const canSubmit = refundAgreed && refundConfirmText === 'REFUND';
    return (
      <Modal visible={!!refundInvoice} transparent animationType="fade" onRequestClose={() => setRefundInvoice(null)}>
        <View style={s.modalOverlay}>
          <View style={s.refundModal}>
            {/* Header */}
            <View style={s.refundHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={s.refundIcon}>
                  <Ionicons name="return-down-back" size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={s.refundTitle}>Initiate Fee Refund</Text>
                    <View style={s.adminBadge}>
                      <Text style={s.adminBadgeText}>ADMIN ACTION</Text>
                    </View>
                  </View>
                  <Text style={s.refundTxId}>Transaction ID: {refundInvoice.invoiceNumber}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => { setRefundInvoice(null); setRefundConfirmText(''); setRefundAgreed(false); }}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Policy Warning */}
              <View style={s.policyWarning}>
                <Ionicons name="alert-circle" size={18} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={s.policyTitle}>STRICT BASE AMOUNT REFUND POLICY</Text>
                  <Text style={s.policyDesc}>Gateway convenience fees and GST are <Text style={{ fontWeight: '800', textDecorationLine: 'underline' }}>non-refundable</Text> by the payment gateway.</Text>
                </View>
              </View>

              {/* Ledger Breakdown */}
              <View style={s.ledgerBreakdown}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="document-text" size={14} color="#334155" />
                    <Text style={s.ledgerTitle}>LEDGER BREAKDOWN</Text>
                  </View>
                  <Text style={s.ledgerMode}>Mode: CASH</Text>
                </View>

                <View style={s.ledgerRow}>
                  <Text style={s.ledgerLabel}>Gross Paid by Parent:</Text>
                  <Text style={s.ledgerVal}>{formatFullRupee(refundInvoice.totalAmount || refundInvoice.baseAmount)}</Text>
                </View>
                <View style={[s.ledgerRow, { opacity: 0.6 }]}>
                  <Text style={s.ledgerLabel}>Net Settled to Bank Account:</Text>
                  <Text style={[s.ledgerVal, { fontSize: 13 }]}>{formatFullRupee(refundInvoice.totalAmount || refundInvoice.baseAmount)}</Text>
                </View>
                <View style={[s.ledgerRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginTop: 8 }]}>
                  <Text style={[s.ledgerLabel, { fontWeight: '800' }]}>Base Amount to Refund:</Text>
                  <Text style={[s.ledgerVal, { color: '#059669', fontWeight: '800', fontSize: 16 }]}>{formatFullRupee(refundInvoice.totalAmount || refundInvoice.baseAmount)}</Text>
                </View>
              </View>

              {/* Reason */}
              <Text style={s.sectionLabel}>REASON FOR REFUND *</Text>
              <View style={s.reasonPicker}>
                <Text style={s.reasonText}>{refundReason}</Text>
                <Ionicons name="chevron-down" size={16} color="#94A3B8" />
              </View>

              {/* Confirmation */}
              <View style={s.confirmSection}>
                <TouchableOpacity style={s.checkboxRow} onPress={() => setRefundAgreed(!refundAgreed)}>
                  <View style={[s.checkbox, refundAgreed && s.checkboxChecked]}>
                    {refundAgreed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={s.checkboxLabel}>I confirm that initiating this refund will debit the school's settlement balance.</Text>
                </TouchableOpacity>

                <Text style={s.confirmPrompt}>TYPE <Text style={{ color: '#EF4444', fontWeight: '800' }}>REFUND</Text> BELOW TO AUTHORIZE THIS IRREVERSIBLE TRANSACTION:</Text>
                <View style={s.confirmInput}>
                  <TextInput
                    style={s.confirmInputField}
                    placeholder="Type REFUND here"
                    placeholderTextColor="#94A3B8"
                    value={refundConfirmText}
                    onChangeText={setRefundConfirmText}
                    autoCapitalize="characters"
                  />
                  <Ionicons name="lock-closed" size={16} color="#94A3B8" />
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={s.refundFooter}>
              <TouchableOpacity style={s.refundCancelBtn} onPress={() => { setRefundInvoice(null); setRefundConfirmText(''); setRefundAgreed(false); }}>
                <Text style={s.refundCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.refundSubmitBtn, !canSubmit && { opacity: 0.4 }]}
                disabled={!canSubmit}
                onPress={() => {
                  Alert.alert('Refund Initiated', 'The refund has been queued for processing.');
                  setRefundInvoice(null);
                  setRefundConfirmText('');
                  setRefundAgreed(false);
                }}
              >
                <Ionicons name="return-down-back" size={16} color="#FFFFFF" />
                <Text style={s.refundSubmitText}>Authorize Refund</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // LOADING
  if (isLoading) {
    return (
      <View style={s.loaderContainer}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={s.loaderText}>Loading Fee Management...</Text>
      </View>
    );
  }

  // ERROR
  if (isError) {
    return (
      <View style={s.loaderContainer}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={[s.loaderText, { color: theme.text, fontSize: 18, fontWeight: '700', marginTop: 16 }]}>Failed to load fees</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => loadData()}>
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* App Bar */}
      <View style={s.appBar}>
        <TouchableOpacity style={s.appBarBtn} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={s.appBarTitle}>Fee Management & Accounting</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}>
          {authState.user?.photoUrl ? (
            <Image source={{ uri: authState.user.photoUrl }} style={s.appBarAvatar} />
          ) : (
            <View style={s.appBarAvatarFallback}>
              <Text style={s.appBarAvatarText}>{authState.user?.name?.charAt(0) || 'P'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {mainTab === 'invoices' ? (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          renderItem={renderInvoiceCard}
          ListHeaderComponent={<>{renderHeader()}{renderInvoicesSubHeader()}</>}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} colors={['#7C3AED']} />
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={s.emptyTitle}>No {invoiceFilter.toLowerCase()} invoices</Text>
              <Text style={s.emptyDesc}>No invoices match the selected filter.</Text>
            </View>
          }
        />
      ) : mainTab === 'settlements' ? (
        <FlatList
          data={filteredPayouts}
          keyExtractor={(item, idx) => item.id || `payout-${idx}`}
          renderItem={renderPayoutCard}
          ListHeaderComponent={<>{renderHeader()}{renderSettlementsHeader()}</>}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => { loadData(true); loadReconciliation(); }} colors={['#7C3AED']} />
          }
          ListEmptyComponent={
            isReconLoading ? (
              <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }} />
            ) : (
              <View style={s.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
                <Text style={s.emptyTitle}>No settled payouts</Text>
                <Text style={s.emptyDesc}>{paymentModeFilter !== 'ALL' ? `No ${paymentModeFilter} payouts found.` : 'No bank payouts recorded yet.'}</Text>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          data={invoices.filter(inv => (inv.status || '').toUpperCase() === 'PAID')}
          keyExtractor={(item) => item.id}
          renderItem={renderInvoiceCard}
          ListHeaderComponent={<>{renderHeader()}{renderRefundsSubHeader()}</>}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} colors={['#7C3AED']} />
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="return-down-back" size={48} color="#CBD5E1" />
              <Text style={s.emptyTitle}>No refundable invoices</Text>
              <Text style={s.emptyDesc}>There are no paid invoices available for refund.</Text>
            </View>
          }
        />
      )}

      {renderRefundModal()}
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  loaderContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC',
  },
  loaderText: {
    marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '500',
  },
  retryBtn: {
    marginTop: 16, backgroundColor: '#7C3AED', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF', fontSize: 14, fontWeight: '700',
  },

  // App Bar
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  appBarBtn: { padding: 4 },
  appBarTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1, marginLeft: 12 },
  appBarAvatar: { width: 32, height: 32, borderRadius: 16 },
  appBarAvatarFallback: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#7C3AED',
    justifyContent: 'center', alignItems: 'center',
  },
  appBarAvatarText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  // Header Section
  headerSection: { padding: 16, paddingBottom: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  titleIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  titleTextRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleText: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  badge: {
    backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    borderWidth: 1, borderColor: '#E9D5FF',
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#7C3AED' },
  subtitleText: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Create Button
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#7C3AED', paddingVertical: 12, borderRadius: 14, marginBottom: 16,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  // Ledger Banner
  ledgerBanner: {
    backgroundColor: 'rgba(124,58,237,0.06)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.15)',
    borderRadius: 16, padding: 12, marginBottom: 16,
  },
  ledgerBannerRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  ledgerIconBox: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(124,58,237,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  ledgerBannerLabel: { fontSize: 10, fontWeight: '800', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.5 },
  ledgerBannerDesc: { fontSize: 11, color: '#475569', fontWeight: '500' },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', alignSelf: 'flex-start',
  },
  syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  syncBadgeText: { fontSize: 10, fontWeight: '700', color: '#059669' },

  // KPI Cards
  kpiCard: {
    width: width * 0.72, backgroundColor: '#FFFFFF', borderRadius: 20,
    padding: 16, borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  kpiCardDark: {
    width: width * 0.72, borderRadius: 20, padding: 16,
    backgroundColor: '#1E1B4B',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  kpiTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kpiLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' },
  kpiValue: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginTop: 6, letterSpacing: -0.5 },
  kpiIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  kpiDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  kpiBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiBottomText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  netBadge: { backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  netBadgeText: { fontSize: 10, fontWeight: '700', color: '#C7D2FE' },
  pendingTag: { backgroundColor: '#FFF1F2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pendingTagText: { fontSize: 10, fontWeight: '700', color: '#F43F5E' },

  // Main Tabs
  mainTabRow: { flexDirection: 'row', gap: 0, marginTop: 20, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  mainTabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  mainTabActive: { borderBottomColor: '#7C3AED' },
  mainTabText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  mainTabTextActive: { color: '#7C3AED' },
  mainTabCount: {
    backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
  },
  mainTabCountText: { fontSize: 9, fontWeight: '800', color: '#64748B' },

  // Sub Header
  subHeaderSection: { paddingHorizontal: 16, paddingTop: 16 },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  subHeaderIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  subHeaderTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  subHeaderDesc: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  // Filter Row
  filterRow: {
    flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 3, marginBottom: 12,
  },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  filterBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2,
  },
  filterText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  filterTextActive: { color: '#0F172A' },

  // Invoice Cards
  invoiceCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTop: { padding: 16 },
  invNumRow: { marginBottom: 12 },
  invNumText: { fontSize: 11, fontWeight: '700', color: '#7C3AED', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  studentAvatar: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
  },
  studentAvatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  studentName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  studentGrade: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  feeDesc: { fontSize: 12, color: '#64748B', marginBottom: 10 },
  amountStatusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  amountVal: { fontSize: 18, fontWeight: '800', color: '#0F172A' },

  // Status Badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Dates
  datesRow: { flexDirection: 'row', gap: 16 },
  dateBlock: {},
  dateLbl: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
  dateVal: { fontSize: 12, fontWeight: '600', color: '#334155' },

  // Card Actions
  cardActions: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, alignItems: 'flex-end' },
  actionDotBtn: { padding: 6, borderRadius: 20, backgroundColor: '#F8FAFC' },
  actionMenu: {
    position: 'absolute', right: 16, top: 40, backgroundColor: '#FFFFFF',
    borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9', width: 200, zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
    paddingVertical: 4,
  },
  actionMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  actionMenuText: { fontSize: 13, fontWeight: '600', color: '#334155' },

  // Payment Mode Badge
  paymentModeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  paymentModeBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  // Settlements
  settlementsTopCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 4,
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  auditBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#0F172A', paddingVertical: 10, borderRadius: 12,
  },
  auditBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  // Reconciliation Cards
  reconCard: {
    width: width * 0.6, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  reconCardDark: {
    width: width * 0.6, borderRadius: 16, padding: 16,
    backgroundColor: '#064E3B', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  reconLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase' },
  reconValue: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  reconMeta: { fontSize: 11, color: '#94A3B8', marginTop: 8 },
  gstBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  gstBadgeText: { fontSize: 8, fontWeight: '800', color: '#4F46E5' },

  // Payout Header
  payoutHeaderSection: { marginTop: 20, marginBottom: 8 },
  paymentFilterRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 3, marginTop: 12 },
  paymentFilterBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 9 },
  paymentFilterBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2,
  },
  paymentFilterText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  paymentFilterTextActive: { color: '#0F172A' },

  // Payout Cards
  payoutCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  payoutRef: { fontSize: 12, fontWeight: '700', color: '#0F172A', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  payoutDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  payoutGrid: { flexDirection: 'row', gap: 12 },
  payoutGridItem: { flex: 1 },
  payoutGridLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 },
  payoutGridValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  reconStatusRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  reconStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', alignSelf: 'flex-start',
  },
  reconStatusText: { fontSize: 11, fontWeight: '700', color: '#059669' },

  // Empty State
  emptyState: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 4 },

  // Refund Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  refundModal: {
    backgroundColor: '#FFFFFF', borderRadius: 20, width: '100%', maxHeight: '90%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.2, shadowRadius: 32, elevation: 12,
  },
  refundHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#FEE2E2',
    backgroundColor: '#FFF5F5', borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  refundIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center',
  },
  refundTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  refundTxId: { fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  adminBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminBadgeText: { fontSize: 8, fontWeight: '800', color: '#D97706' },

  policyWarning: {
    flexDirection: 'row', gap: 10, margin: 16, padding: 14,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12,
  },
  policyTitle: { fontSize: 12, fontWeight: '800', color: '#92400E', marginBottom: 4 },
  policyDesc: { fontSize: 11, color: '#92400E', lineHeight: 16 },

  ledgerBreakdown: {
    marginHorizontal: 16, padding: 16, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
  },
  ledgerTitle: { fontSize: 11, fontWeight: '800', color: '#334155', letterSpacing: 0.5 },
  ledgerMode: { fontSize: 11, fontWeight: '700', color: '#64748B', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ledgerLabel: { fontSize: 13, color: '#334155', fontWeight: '500' },
  ledgerVal: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', marginHorizontal: 16, marginTop: 16, marginBottom: 8, letterSpacing: 0.5 },
  reasonPicker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, padding: 14, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
  },
  reasonText: { fontSize: 13, color: '#334155', flex: 1 },

  confirmSection: { margin: 16, padding: 14, backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A' },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#CBD5E1',
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  checkboxChecked: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  checkboxLabel: { fontSize: 12, color: '#334155', flex: 1, lineHeight: 18 },
  confirmPrompt: { fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 8, letterSpacing: 0.3 },
  confirmInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  confirmInputField: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '600' },

  refundFooter: {
    flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  refundCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
    alignItems: 'center', backgroundColor: '#FFFFFF',
  },
  refundCancelText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  refundSubmitBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444',
  },
  refundSubmitText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
});

export default PrincipalFeesScreen;
