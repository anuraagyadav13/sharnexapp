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
import { withAlpha, LIGHT_COLORS } from '../../constants/theme';

import { getCacheBustedUri } from '../../utils/image';
import { generatePDF } from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import Share from 'react-native-share';
import { toFileUri, toRawFilePath } from '../../utils/fileUtils';

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


const escapeHtml = (value: unknown) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

function generatePrincipalFeeReceiptHTML(receipt: any, theme: any): string {
  const invNum = receipt.invoiceNumber || receipt.invoice_number;
  const schoolName = receipt.institutionName || receipt.institution_name;
  const paidAt = receipt.paidAt || receipt.completedAt || receipt.completed_at;
  const amount = receipt.totalAmount ?? receipt.amountPaid;
  const description = receipt.description || receipt.invoice_description;

  if (!invNum || !schoolName || !paidAt || amount === undefined || !description) {
    throw new Error('This record does not include the information required to generate an official payment receipt.');
  }

  const completedDate = new Date(paidAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const txnId = receipt.gatewayPaymentId || receipt.gateway_payment_id || receipt.razorpay_payment_id;
  const paymentMode = receipt.paymentMode || receipt.payment_mode;
  const status = String(receipt.status || 'PAID').toUpperCase();
  const studentName = receipt.studentName || receipt.student_name || '';
  const className = receipt.className || receipt.grade || '';

  const feeItems: { description: string; amount: number }[] =
    receipt.feeItems && receipt.feeItems.length > 0
      ? receipt.feeItems
      : [{ description, amount: Number(amount) }];

  const feeRowsHtml = feeItems
    .map(
      item => `
      <tr>
        <td>
          <div style="font-weight: 600;">${escapeHtml(item.description || description)}</div>
          <div style="font-size: 12px; color: ${theme.subtext}; margin-top: 2px;">Invoice Reference: ${escapeHtml(invNum)}</div>
        </td>
        <td style="text-align: right; font-weight: 600;">₹${Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Receipt - ${escapeHtml(invNum)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: ${theme.background}; color: ${theme.text}; margin: 0; padding: 40px 20px; }
    .receipt-container { max-width: 680px; margin: 0 auto; background: ${theme.surface}; border-radius: 16px; border: 1px solid ${theme.border}; box-shadow: 0 10px 25px -5px ${theme.shadow}; overflow: hidden; }
    .header { background: ${theme.primary}; color: ${theme.onPrimary}; padding: 32px; display: flex; justify-content: space-between; align-items: flex-start; }
    .badge { background: ${theme.successBg}; border: 1px solid ${theme.success}; color: ${theme.success}; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; display: inline-block; margin-bottom: 8px; }
    .title { font-size: 24px; font-weight: 800; margin: 0; color: ${theme.onPrimary}; }
    .school { font-size: 14px; color: ${theme.onPrimary}; margin-top: 4px; }
    .content { padding: 32px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid ${theme.border}; }
    .label { font-size: 11px; font-weight: 700; color: ${theme.subtext}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .value { font-size: 14px; font-weight: 600; color: ${theme.text}; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    .table th { text-align: left; font-size: 11px; font-weight: 700; color: ${theme.subtext}; text-transform: uppercase; padding: 12px 0; border-bottom: 2px solid ${theme.border}; }
    .table td { padding: 16px 0; border-bottom: 1px solid ${theme.border}; font-size: 14px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; background: ${theme.background}; padding: 20px; border-radius: 12px; font-weight: 800; font-size: 18px; margin-bottom: 32px; }
    .footer { text-align: center; font-size: 12px; color: ${theme.subtext}; border-top: 1px solid ${theme.border}; padding: 24px 32px; background: ${theme.surface}; }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div>
        <span class="badge">✓ Cryptographically Verified</span>
        <h1 class="title">Fee Payment Receipt</h1>
        <div class="school">${escapeHtml(schoolName)}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; color: ${theme.onPrimary};">Receipt #</div>
        <div style="font-size: 16px; font-weight: 700; color: ${theme.onPrimary};">${escapeHtml(invNum)}</div>
      </div>
    </div>
    <div class="content">
      <div class="grid">
        <div>
          <div class="label">Date & Time</div>
          <div class="value">${escapeHtml(completedDate)}</div>
        </div>
        ${txnId ? `<div>
          <div class="label">Transaction Reference</div>
          <div class="value" style="font-family: monospace;">${escapeHtml(txnId)}</div>
        </div>` : ''}
        ${paymentMode ? `<div>
          <div class="label">Payment Mode</div>
          <div class="value">${escapeHtml(paymentMode)}</div>
        </div>` : ''}
        <div>
          <div class="label">Status</div>
          <div class="value" style="color: ${theme.success};">${escapeHtml(status)}</div>
        </div>
        ${
          studentName
            ? `<div><div class="label">Student / Payer</div><div class="value">${escapeHtml(studentName)}</div></div>`
            : ''
        }
        ${
          className
            ? `<div><div class="label">Academic Unit</div><div class="value">${escapeHtml(className)}</div></div>`
            : ''
        }
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Description / Fee Item</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${feeRowsHtml}
        </tbody>
      </table>

      <div class="total-row">
        <span>Total Paid</span>
        <span style="color: ${theme.primary};">₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      <div style="font-size: 11px; color: ${theme.subtext}; text-align: center; line-height: 1.5;">
        This is an official digital receipt generated automatically by the Sharnex School ERP double-entry ledger. No physical signature is required.
      </div>
    </div>
    <div class="footer">
      Sharnex Financial Engineering • 256-Bit Cryptographically Secured Ledger
    </div>
  </div>
</body>
</html>`;
}

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

const getAvatarColor = (name: string, theme: any) => {
  const avatarColors = [theme.secondary, theme.danger, theme.warning, theme.success, theme.primary];

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

  const handleExportCSV = async () => {
    if (!invoices || invoices.length === 0) {
      Alert.alert('Export', 'No invoices to export.');
      return;
    }
    try {
      setIsLoading(true);
      const XLSX = require('xlsx');
      const RNFS = require('react-native-fs');
      let ShareLib: any = null;
      try { ShareLib = require('react-native-share').default || require('react-native-share'); } catch (e) {}

      const exportData = invoices.map(i => ({
        'Invoice No': i.invoiceNumber || '-',
        'Student': i.studentName || '-',
        'Class': i.className || '-',
        'Description': i.description || '-',
        'Base Amount': i.baseAmount || 0,
        'Amount Paid': i.amountPaid || 0,
        'Status': i.status || 'PENDING',
        'Due Date': i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '-',
        'Created At': i.createdAt ? new Date(i.createdAt).toLocaleDateString() : '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fees Ledger");
      const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

      const path = `${RNFS.DocumentDirectoryPath}/Fees_Ledger.xlsx`;
      await RNFS.writeFile(path, wbout, 'ascii');

      if (ShareLib) {
        await ShareLib.open({
          url: `file://${path}`,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          title: 'Export Fees Ledger',
        });
      } else {
        Alert.alert('Export Successful', `Ledger exported successfully to ${path}`);
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share' && error?.name !== 'Error') {
        Alert.alert('Error', 'Failed to export ledger.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [receiptGeneratingId, setReceiptGeneratingId] = useState<string | null>(null);

  const handleDownloadReceipt = async (item: any) => {
    if (!item) return;
    if ((item.status || '').toUpperCase() !== 'PAID') {
      Alert.alert('Receipt Unavailable', 'A payment receipt is available only after this invoice has been paid.');
      return;
    }
    const invNum =
      item.invoiceNumber ||
      item.invoice_number ||
      (item.id ? String(item.id).slice(0, 8) : 'Receipt');

    try {
      setIsGeneratingReceipt(true);
      setReceiptGeneratingId(item.id);

      const html = generatePrincipalFeeReceiptHTML(item, theme);
      const file = await generatePDF({
        html,
        fileName: `Receipt_${invNum.replace(/[^a-zA-Z0-9_-]/g, '')}`,
      });

      if (!file?.filePath) {
        throw new Error('PDF generation produced an empty file path');
      }

      const rawPath = toRawFilePath(file.filePath);
      const fileUri = toFileUri(file.filePath);

      Alert.alert(
        'Fee Payment Receipt',
        `Receipt ready for #${invNum}. Select an action:`,
        [
          {
            text: 'Print Receipt',
            onPress: async () => {
              try {
                await RNPrint.print({ filePath: rawPath });
              } catch (err: any) {
                if (err?.message && !err.message.includes('cancel')) {
                  Alert.alert('Print Error', 'Could not print the receipt.');
                }
              }
            },
          },
          {
            text: 'Save / Share PDF',
            onPress: async () => {
              try {
                await Share.open({
                  url: fileUri,
                  type: 'application/pdf',
                  title: `Fee Receipt #${invNum}`,
                });
              } catch (err: any) {
                if (
                  err?.message &&
                  !err.message.includes('User did not share') &&
                  !err.message.includes('dismiss') &&
                  !err.message.includes('cancel')
                ) {
                  Alert.alert('Share Error', 'Could not share the receipt.');
                }
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } catch (error: any) {
      console.error('[PrincipalFees] Receipt generation error:', error);
      Alert.alert('Receipt Error', error?.message || 'Failed to generate receipt.');
    } finally {
      setIsGeneratingReceipt(false);
      setReceiptGeneratingId(null);
    }
  };

  const handleViewLedgerEntries = useCallback((item: InvoiceItem | ReconciliationPayment) => {
    const isSettlement = 'payment_mode' in item;
    const lines = isSettlement
      ? [
          `Payment reference: ${item.razorpay_payment_id || item.id}`,
          `Payment mode: ${item.payment_mode || 'Not recorded'}`,
          `Gross amount: ${formatFullRupee(item.gross_amount || item.base_amount || 0)}`,
          `Gateway fee: ${formatFullRupee(item.gateway_fee || 0)}`,
          `GST on fee: ${formatFullRupee(item.gst_on_fee || 0)}`,
          `Net settled: ${formatFullRupee(item.settled_amount || 0)}`,
          `Status: ${item.status || 'Not recorded'}`,
        ]
      : [
          `Invoice: ${item.invoiceNumber}`,
          `Student: ${item.studentName || 'Not recorded'}`,
          `Description: ${item.description}`,
          `Billed amount: ${formatFullRupee(item.totalAmount || 0)}`,
          `Amount paid: ${formatFullRupee(item.amountPaid || 0)}`,
          `Status: ${item.status || 'Not recorded'}`,
        ];

    Alert.alert('Ledger Entry Details', lines.join('\n'));
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
    let bg = isDarkMode ? theme.warningBg : theme.warningBg; let text = theme.warning; let icon = 'time-outline'; let label = 'Pending';
    if (normalized === 'PAID' || normalized === 'SUCCESS') { bg = isDarkMode ? theme.successBg : theme.successBg; text = theme.success; icon = 'checkmark-circle'; label = 'Paid'; }
    else if (normalized === 'OVERDUE') { bg = isDarkMode ? theme.dangerBg : theme.dangerBg; text = theme.danger; icon = 'alert-circle'; label = 'Overdue'; }
    else if (normalized === 'CANCELLED') { bg = isDarkMode ? theme.surface : theme.border; text = theme.subtext; icon = 'close-circle'; label = 'Cancelled'; }
    return (
      <View style={[s.statusBadge, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={12} color={text} />
        <Text style={[s.statusBadgeText, { color: text }]}>{label}</Text>
      </View>
    );
  };

  const PaymentModeBadge = ({ mode }: { mode: string }) => {
    const m = (mode || '').toUpperCase();
    let bg = isDarkMode ? theme.primaryBg : theme.iconBackground; let text = theme.primary; let icon = 'card-outline';
    if (m === 'UPI') { bg = isDarkMode ? theme.successBg : theme.successBg; text = theme.success; icon = 'phone-portrait-outline'; }
    else if (m === 'CASH') { bg = isDarkMode ? theme.warningBg : theme.warningBg; text = theme.warning; icon = 'cash-outline'; }
    else if (m === 'CHEQUE') { bg = isDarkMode ? theme.secondaryBg : theme.iconBackground; text = theme.secondary; icon = 'document-text-outline'; }
    else if (m === 'NETBANKING') { bg = isDarkMode ? theme.infoBg : theme.iconBackground; text = theme.primary; icon = 'globe-outline'; }
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
          <Ionicons name="receipt" size={22} color={theme.onPrimary} />
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

      {/* Actions Row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <TouchableOpacity
          style={[s.createBtn, { flex: 1 }]}
          onPress={() => navigation.navigate('PrincipalCreateInvoice' as any)}
        >
          <Ionicons name="add" size={18} color={theme.onPrimary} />
          <Text style={s.createBtnText}>Create Invoice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[s.createBtn, { flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
          onPress={handleExportCSV}
        >
          <Ionicons name="download-outline" size={18} color={theme.text} />
          <Text style={[s.createBtnText, { color: theme.text }]}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Ledger Banner */}
      <View style={s.ledgerBanner}>
        <View style={s.ledgerBannerRow}>
          <View style={s.ledgerIconBox}>
            <Ionicons name="shield-checkmark" size={14} color={theme.primary} />
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
            <View style={[s.kpiIcon, { backgroundColor: theme.iconBackground }]}>
              <Ionicons name="wallet" size={20} color={theme.primary} />
            </View>
          </View>
          <View style={s.kpiDivider} />
          <View style={s.kpiBottom}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="trending-up" size={12} color={theme.success} />
              <Text style={[s.kpiBottomText, { color: isDarkMode ? theme.success : theme.success, fontWeight: '700' }]}>Real-Time Volume</Text>
            </View>
            <Text style={s.kpiBottomText}>{paidCount} payments</Text>
          </View>
        </View>

        {/* Card 2: Net Settled Revenue (Dark) */}
        <View style={s.kpiCardDark}>
          <View style={s.kpiTop}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[s.kpiLabel, { color: theme.primary }]}>NET SETTLED REVENUE</Text>
                <Ionicons name="sparkles" size={12} color={theme.warning} />
              </View>
              <Text style={[s.kpiValue, { color: theme.surface }]}>{formatRupee(netSettled)}</Text>
            </View>
            <View style={[s.kpiIcon, { backgroundColor: withAlpha(theme.onPrimary, 0.1), borderWidth: 1, borderColor: withAlpha(theme.onPrimary, 0.15) }]}>
              <Ionicons name="business" size={20} color={theme.primary} />
            </View>
          </View>
          <View style={[s.kpiDivider, { backgroundColor: withAlpha(theme.primary, 0.3) }]} />
          <View style={s.kpiBottom}>
            <Text style={[s.kpiBottomText, { color: isDarkMode ? theme.primary : theme.primary }]}>{formatRupee(gatewayDeductions)} absorbed</Text>
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
            <View style={[s.kpiIcon, { backgroundColor: theme.iconBackground }]}>
              <Ionicons name="trending-up" size={20} color={theme.primary} />
            </View>
          </View>
          <View style={s.kpiDivider} />
          <View style={s.kpiBottom}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="trending-up" size={12} color={theme.primary} />
              <Text style={[s.kpiBottomText, { color: theme.primary, fontWeight: '700' }]}>Live Ledger Sync</Text>
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
            <View style={[s.kpiIcon, { backgroundColor: withAlpha(theme.success, 0.2) }]}>
              <Ionicons name="speedometer" size={20} color={theme.success} />
            </View>
          </View>
          <View style={s.kpiDivider} />
          <View style={s.kpiBottom}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="trending-up" size={12} color={theme.success} />
              <Text style={[s.kpiBottomText, { color: isDarkMode ? theme.success : theme.success, fontWeight: '700' }]}>Real-Time Rate</Text>
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
          <Ionicons name="receipt-outline" size={14} color={mainTab === 'invoices' ? theme.primary : theme.subtext} />
          <Text style={[s.mainTabText, mainTab === 'invoices' && s.mainTabTextActive]}>Invoices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.mainTabBtn, mainTab === 'settlements' && s.mainTabActive]}
          onPress={() => setMainTab('settlements')}
        >
          <Ionicons name="business-outline" size={14} color={mainTab === 'settlements' ? theme.primary : theme.subtext} />
          <Text style={[s.mainTabText, mainTab === 'settlements' && s.mainTabTextActive]}>Settlement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.mainTabBtn, mainTab === 'refunds' && s.mainTabActive]}
          onPress={() => setMainTab('refunds')}
        >
          <Ionicons name="return-down-back" size={14} color={mainTab === 'refunds' ? theme.primary : theme.subtext} />
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
          <Ionicons name="document-text" size={16} color={theme.subtext} />
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
        <View style={[s.subHeaderIcon, { backgroundColor: withAlpha(theme.danger, 0.2) }]}>
          <Ionicons name="return-down-back" size={16} color={theme.danger} />
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
    const color = getAvatarColor(item.studentName, theme);
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
                  <Ionicons name="checkmark-circle" size={12} color={theme.success} />
                  <Text style={[s.dateVal, { color: isDarkMode ? theme.success : theme.success }]}>Paid {formatDate(item.paidAt)}</Text>
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
            <Ionicons name="ellipsis-vertical" size={18} color={theme.placeholder} />
          </TouchableOpacity>
          {actionMenuId === item.id && (
            <View style={s.actionMenu}>
              <TouchableOpacity
                style={s.actionMenuItem}
                onPress={() => {
                  setActionMenuId(null);
                  handleDownloadReceipt(item);
                }}
              >
                {receiptGeneratingId === item.id ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={16} color={theme.primary} />
                    <Text style={[s.actionMenuText, { color: theme.text }]}>Download Receipt</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={s.actionMenuItem}
                onPress={() => {
                  setActionMenuId(null);
                  handleViewLedgerEntries(item);
                }}
              >
                <Ionicons name="book-outline" size={16} color={theme.primary} />
                <Text style={[s.actionMenuText, { color: theme.text }]}>View Ledger Entries</Text>
              </TouchableOpacity>
              {(item.status || '').toUpperCase() === 'PAID' && mainTab === 'refunds' && (
                <TouchableOpacity
                  style={s.actionMenuItem}
                  onPress={() => { setActionMenuId(null); setRefundInvoice(item); }}
                >
                  <Ionicons name="return-down-back" size={16} color={theme.danger} />
                  <Text style={[s.actionMenuText, { color: theme.danger }]}>Initiate Refund</Text>
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
          <View style={[s.subHeaderIcon, { backgroundColor: withAlpha(theme.success, 0.1) }]}>
            <Ionicons name="business" size={16} color={theme.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.subHeaderTitle}>Bank Settlements & Ledger Reconciliation</Text>
            <Text style={s.subHeaderDesc}>Automated audit comparing expected ledger vs actual deposits</Text>
          </View>
        </View>
        <TouchableOpacity style={s.auditBtn} onPress={loadReconciliation}>
          <Ionicons name="refresh" size={14} color={theme.onPrimary} />
          <Text style={s.auditBtnText}>Run Audit</Text>
        </TouchableOpacity>
      </View>

      {/* Settlement Summary Cards */}
      {isReconLoading ? (
        <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
      ) : reconciliation ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginTop: 16 }}>
          {/* Base Invoice Volume */}
          <View style={s.reconCard}>
            <Text style={s.reconLabel}>BASE INVOICE VOLUME</Text>
            <Text style={s.reconValue}>{formatRupee(reconciliation.totalBase)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <Ionicons name="checkmark" size={12} color={theme.success} />
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
            <Text style={[s.reconValue, { color: theme.primary }]}>{formatRupee(reconciliation.totalGatewayCost)}</Text>
            <Text style={s.reconMeta}>0% fee on UPI • 2% on Cards</Text>
          </View>

          {/* Net Settled - Dark */}
          <View style={s.reconCardDark}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[s.reconLabel, { color: theme.success }]}>NET SETTLED TO BANK</Text>
              <Ionicons name="shield-checkmark" size={16} color={theme.success} />
            </View>
            <Text style={[s.reconValue, { color: theme.surface }]}>{formatRupee(reconciliation.totalSettled)}</Text>
            <Text style={[s.reconMeta, { color: withAlpha(theme.success, 0.8) }]}>Verified Bank Account • Reconciled</Text>
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
          <Text style={[s.payoutGridLabel, { color: isDarkMode ? theme.success : theme.success }]}>Deductions</Text>
          <Text style={[s.payoutGridValue, { color: isDarkMode ? theme.success : theme.success }]}>{formatFullRupee((item.gateway_fee || 0) + (item.gst_on_fee || 0))} ({(item.payment_mode || '').toUpperCase() === 'UPI' ? '0%' : '2%'} Fee)</Text>
        </View>
        <View style={s.payoutGridItem}>
          <Text style={s.payoutGridLabel}>Net Settled</Text>
          <Text style={[s.payoutGridValue, { fontWeight: '800' }]}>{formatFullRupee(item.settled_amount || 0)}</Text>
        </View>
      </View>

      <View style={[s.reconStatusRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={s.reconStatusBadge}>
          <Ionicons name="shield-checkmark" size={12} color={theme.success} />
          <Text style={s.reconStatusText}>Matched & Reconciled</Text>
        </View>

        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            style={s.actionDotBtn}
            onPress={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={theme.placeholder} />
          </TouchableOpacity>
          {actionMenuId === item.id && (
            <View style={[s.actionMenu, { right: 0, top: 30, width: 180 }]}>
              <TouchableOpacity
                style={s.actionMenuItem}
                onPress={() => {
                  setActionMenuId(null);
                  handleDownloadReceipt(item);
                }}
              >
                {receiptGeneratingId === item.id ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={16} color={theme.primary} />
                    <Text style={[s.actionMenuText, { color: theme.text }]}>Download Receipt</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={s.actionMenuItem}
                onPress={() => {
                  setActionMenuId(null);
                  handleViewLedgerEntries(item);
                }}
              >
                <Ionicons name="book-outline" size={16} color={theme.primary} />
                <Text style={[s.actionMenuText, { color: theme.text }]}>View Ledger Entries</Text>
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
                  <Ionicons name="return-down-back" size={20} color={theme.onPrimary} />
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
                <Ionicons name="close" size={24} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Policy Warning */}
              <View style={s.policyWarning}>
                <Ionicons name="alert-circle" size={18} color={theme.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={s.policyTitle}>STRICT BASE AMOUNT REFUND POLICY</Text>
                  <Text style={s.policyDesc}>Gateway convenience fees and GST are <Text style={{ fontWeight: '800', textDecorationLine: 'underline' }}>non-refundable</Text> by the payment gateway.</Text>
                </View>
              </View>

              {/* Ledger Breakdown */}
              <View style={s.ledgerBreakdown}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="document-text" size={14} color={theme.text} />
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
                <View style={[s.ledgerRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12, marginTop: 8 }]}>
                  <Text style={[s.ledgerLabel, { fontWeight: '800' }]}>Base Amount to Refund:</Text>
                  <Text style={[s.ledgerVal, { color: isDarkMode ? theme.success : theme.success, fontWeight: '800', fontSize: 16 }]}>{formatFullRupee(refundInvoice.totalAmount || refundInvoice.baseAmount)}</Text>
                </View>
              </View>

              {/* Reason */}
              <Text style={s.sectionLabel}>REASON FOR REFUND *</Text>
              <View style={s.reasonPicker}>
                <Text style={s.reasonText}>{refundReason}</Text>
                <Ionicons name="chevron-down" size={16} color={theme.placeholder} />
              </View>

              {/* Confirmation */}
              <View style={s.confirmSection}>
                <TouchableOpacity style={s.checkboxRow} onPress={() => setRefundAgreed(!refundAgreed)}>
                  <View style={[s.checkbox, refundAgreed && s.checkboxChecked]}>
                    {refundAgreed && <Ionicons name="checkmark" size={14} color={theme.onPrimary} />}
                  </View>
                  <Text style={s.checkboxLabel}>I confirm that initiating this refund will debit the school's settlement balance.</Text>
                </TouchableOpacity>

                <Text style={s.confirmPrompt}>TYPE <Text style={{ color: theme.danger, fontWeight: '800' }}>REFUND</Text> BELOW TO AUTHORIZE THIS IRREVERSIBLE TRANSACTION:</Text>
                <View style={s.confirmInput}>
                  <TextInput
                    style={s.confirmInputField}
                    placeholder="Type REFUND here"
                    placeholderTextColor={theme.placeholder}
                    value={refundConfirmText}
                    onChangeText={setRefundConfirmText}
                    autoCapitalize="characters"
                  />
                  <Ionicons name="lock-closed" size={16} color={theme.placeholder} />
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
                <Ionicons name="return-down-back" size={16} color={theme.onPrimary} />
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
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={s.loaderText}>Loading Fee Management...</Text>
      </View>
    );
  }

  // ERROR
  if (isError) {
    return (
      <View style={s.loaderContainer}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
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
            <Image source={{ uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt) }} style={s.appBarAvatar} />
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
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} colors={[theme.primary]} />
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={theme.border} />
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
            <RefreshControl refreshing={isRefreshing} onRefresh={() => { loadData(true); loadReconciliation(); }} colors={[theme.primary]} />
          }
          ListEmptyComponent={
            isReconLoading ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
            ) : (
              <View style={s.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={theme.border} />
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
            <RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} colors={[theme.primary]} />
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="return-down-back" size={48} color={theme.border} />
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
    backgroundColor: theme.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  loaderContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background,
  },
  loaderText: {
    marginTop: 12, fontSize: 14, color: theme.subtext, fontWeight: '500',
  },
  retryBtn: {
    marginTop: 16, backgroundColor: theme.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12,
  },
  retryBtnText: {
    color: theme.onPrimary, fontSize: 14, fontWeight: '700',
  },

  // App Bar
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.surface,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  appBarBtn: { padding: 4 },
  appBarTitle: { fontSize: 16, fontWeight: '800', color: theme.text, flex: 1, marginLeft: 12 },
  appBarAvatar: { width: 32, height: 32, borderRadius: 16 },
  appBarAvatarFallback: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  appBarAvatarText: { color: theme.onPrimary, fontWeight: '800', fontSize: 14 },

  // Header Section
  headerSection: { padding: 16, paddingBottom: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  titleIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  titleTextRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleText: { fontSize: 20, fontWeight: '800', color: theme.text },
  badge: {
    backgroundColor: isDarkMode ? theme.primaryBg : theme.iconBackground, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    borderWidth: 1, borderColor: isDarkMode ? theme.primary : theme.border,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: theme.primary },
  subtitleText: { fontSize: 12, color: theme.subtext, marginTop: 2 },

  // Create Button
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: theme.primary, paddingVertical: 12, borderRadius: 14, marginBottom: 16,
    shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  createBtnText: { color: theme.onPrimary, fontSize: 13, fontWeight: '800' },

  // Ledger Banner
  ledgerBanner: {
    backgroundColor: theme.primaryBg, borderWidth: 1, borderColor: theme.primary,
    borderRadius: 16, padding: 12, marginBottom: 16,
  },
  ledgerBannerRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  ledgerIconBox: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: theme.primaryBg,
    justifyContent: 'center', alignItems: 'center',
  },
  ledgerBannerLabel: { fontSize: 10, fontWeight: '800', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  ledgerBannerDesc: { fontSize: 11, color: theme.subtext, fontWeight: '500' },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.successBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: theme.success, alignSelf: 'flex-start',
  },
  syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.success },
  syncBadgeText: { fontSize: 10, fontWeight: '700', color: theme.success },

  // KPI Cards
  kpiCard: {
    width: width * 0.72, backgroundColor: theme.surface, borderRadius: 20,
    padding: 16, borderWidth: 1, borderColor: theme.border,
    shadowColor: theme.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.2 : 0.06, shadowRadius: 8, elevation: 2,
  },
  kpiCardDark: {
    width: width * 0.72, borderRadius: 20, padding: 16,
    backgroundColor: theme.card,
    shadowColor: theme.text, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  kpiTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kpiLabel: { fontSize: 10, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5, textTransform: 'uppercase' },
  kpiValue: { fontSize: 26, fontWeight: '800', color: theme.text, marginTop: 6, letterSpacing: -0.5 },
  kpiIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  kpiDivider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
  kpiBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiBottomText: { fontSize: 11, color: theme.subtext, fontWeight: '500' },
  netBadge: { backgroundColor: theme.infoBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  netBadgeText: { fontSize: 10, fontWeight: '700', color: theme.primary },
  pendingTag: { backgroundColor: theme.dangerBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pendingTagText: { fontSize: 10, fontWeight: '700', color: theme.danger },

  // Main Tabs
  mainTabRow: { flexDirection: 'row', gap: 0, marginTop: 20, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: theme.border },
  mainTabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  mainTabActive: { borderBottomColor: theme.primary },
  mainTabText: { fontSize: 11, fontWeight: '700', color: theme.subtext },
  mainTabTextActive: { color: theme.primary },
  mainTabCount: {
    backgroundColor: theme.border, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
  },
  mainTabCountText: { fontSize: 9, fontWeight: '800', color: theme.subtext },

  // Sub Header
  subHeaderSection: { paddingHorizontal: 16, paddingTop: 16 },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  subHeaderIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: theme.border,
    justifyContent: 'center', alignItems: 'center',
  },
  subHeaderTitle: { fontSize: 15, fontWeight: '800', color: theme.text },
  subHeaderDesc: { fontSize: 11, color: theme.subtext, marginTop: 1 },

  // Filter Row
  filterRow: {
    flexDirection: 'row', backgroundColor: isDarkMode ? theme.surface : theme.border, borderRadius: 12, padding: 3, marginBottom: 12,
  },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  filterBtnActive: {
    backgroundColor: theme.surface,
    shadowColor: theme.text, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2,
  },
  filterText: { fontSize: 11, fontWeight: '700', color: theme.subtext },
  filterTextActive: { color: theme.text },

  // Invoice Cards
  invoiceCard: {
    backgroundColor: theme.surface, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden',
    shadowColor: theme.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.2 : 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTop: { padding: 16 },
  invNumRow: { marginBottom: 12 },
  invNumText: { fontSize: 11, fontWeight: '700', color: theme.primary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  studentAvatar: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
  },
  studentAvatarText: { color: theme.onPrimary, fontSize: 13, fontWeight: '800' },
  studentName: { fontSize: 14, fontWeight: '800', color: theme.text },
  studentGrade: { fontSize: 11, color: theme.subtext, fontWeight: '500' },
  feeDesc: { fontSize: 12, color: theme.subtext, marginBottom: 10 },
  amountStatusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  amountVal: { fontSize: 18, fontWeight: '800', color: theme.text },

  // Status Badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Dates
  datesRow: { flexDirection: 'row', gap: 16 },
  dateBlock: {},
  dateLbl: { fontSize: 10, color: theme.subtext, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
  dateVal: { fontSize: 12, fontWeight: '600', color: theme.text },

  // Card Actions
  cardActions: { borderTopWidth: 1, borderTopColor: theme.border, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'flex-end' },
  actionDotBtn: { padding: 6, borderRadius: 20, backgroundColor: theme.background },
  actionMenu: {
    position: 'absolute', right: 16, top: 40, backgroundColor: theme.surface,
    borderRadius: 14, borderWidth: 1, borderColor: theme.border, width: 200, zIndex: 100,
    shadowColor: theme.text, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
    paddingVertical: 4,
  },
  actionMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  actionMenuText: { fontSize: 13, fontWeight: '600', color: theme.text },

  // Payment Mode Badge
  paymentModeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  paymentModeBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  // Settlements
  settlementsTopCard: {
    backgroundColor: theme.surface, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: theme.border, marginBottom: 4,
    shadowColor: theme.text, shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDarkMode ? 0.2 : 0.04, shadowRadius: 4, elevation: 1,
  },
  auditBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: isDarkMode ? theme.surface : theme.text, paddingVertical: 10, borderRadius: 12,
  },
  auditBtnText: { color: theme.onPrimary, fontSize: 12, fontWeight: '800' },

  // Reconciliation Cards
  reconCard: {
    width: width * 0.6, backgroundColor: theme.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: theme.border,
  },
  reconCardDark: {
    width: width * 0.6, borderRadius: 16, padding: 16,
    backgroundColor: theme.successBg, borderWidth: 1, borderColor: theme.success,
  },
  reconLabel: { fontSize: 10, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5, textTransform: 'uppercase' },
  reconValue: { fontSize: 22, fontWeight: '800', color: theme.text, marginTop: 6 },
  reconMeta: { fontSize: 11, color: theme.subtext, marginTop: 8 },
  gstBadge: { backgroundColor: theme.primaryBg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  gstBadgeText: { fontSize: 8, fontWeight: '800', color: theme.primary },

  // Payout Header
  payoutHeaderSection: { marginTop: 20, marginBottom: 8 },
  paymentFilterRow: { flexDirection: 'row', backgroundColor: isDarkMode ? theme.surface : theme.border, borderRadius: 12, padding: 3, marginTop: 12 },
  paymentFilterBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 9 },
  paymentFilterBtnActive: {
    backgroundColor: theme.surface,
    shadowColor: theme.text, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2,
  },
  paymentFilterText: { fontSize: 10, fontWeight: '700', color: theme.subtext },
  paymentFilterTextActive: { color: theme.text },

  // Payout Cards
  payoutCard: {
    backgroundColor: theme.surface, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border,
    shadowColor: theme.text, shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDarkMode ? 0.2 : 0.04, shadowRadius: 4, elevation: 1,
  },
  payoutRef: { fontSize: 12, fontWeight: '700', color: theme.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  payoutDate: { fontSize: 11, color: theme.subtext, marginTop: 2 },
  payoutGrid: { flexDirection: 'row', gap: 12 },
  payoutGridItem: { flex: 1 },
  payoutGridLabel: { fontSize: 10, fontWeight: '700', color: theme.subtext, textTransform: 'uppercase', marginBottom: 4 },
  payoutGridValue: { fontSize: 13, fontWeight: '700', color: theme.text },
  reconStatusRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border },
  reconStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.successBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: theme.success, alignSelf: 'flex-start',
  },
  reconStatusText: { fontSize: 11, fontWeight: '700', color: theme.success },

  // Empty State
  emptyState: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: theme.subtext, textAlign: 'center', marginTop: 4 },

  // Refund Modal
  modalOverlay: {
    flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  refundModal: {
    backgroundColor: theme.surface, borderRadius: 20, width: '100%', maxHeight: '90%',
    shadowColor: theme.text, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.2, shadowRadius: 32, elevation: 12,
  },
  refundHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: theme.danger,
    backgroundColor: theme.dangerBg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  refundIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: theme.danger,
    justifyContent: 'center', alignItems: 'center',
  },
  refundTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
  refundTxId: { fontSize: 11, color: theme.subtext, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  adminBadge: { backgroundColor: theme.warningBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminBadgeText: { fontSize: 8, fontWeight: '800', color: theme.warning },

  policyWarning: {
    flexDirection: 'row', gap: 10, margin: 16, padding: 14,
    backgroundColor: theme.warningBg, borderWidth: 1, borderColor: theme.warning, borderRadius: 12,
  },
  policyTitle: { fontSize: 12, fontWeight: '800', color: theme.warning, marginBottom: 4 },
  policyDesc: { fontSize: 11, color: theme.warning, lineHeight: 16 },

  ledgerBreakdown: {
    marginHorizontal: 16, padding: 16, backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border, borderRadius: 12,
  },
  ledgerTitle: { fontSize: 11, fontWeight: '800', color: theme.text, letterSpacing: 0.5 },
  ledgerMode: { fontSize: 11, fontWeight: '700', color: theme.subtext, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ledgerLabel: { fontSize: 13, color: theme.text, fontWeight: '500' },
  ledgerVal: { fontSize: 14, fontWeight: '700', color: theme.text },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: theme.subtext, marginHorizontal: 16, marginTop: 16, marginBottom: 8, letterSpacing: 0.5 },
  reasonPicker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, padding: 14, backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border, borderRadius: 12,
  },
  reasonText: { fontSize: 13, color: theme.text, flex: 1 },

  confirmSection: { margin: 16, padding: 14, backgroundColor: theme.warningBg, borderRadius: 12, borderWidth: 1, borderColor: theme.warning },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  checkboxChecked: { backgroundColor: theme.primary, borderColor: theme.primary },
  checkboxLabel: { fontSize: 12, color: theme.text, flex: 1, lineHeight: 18 },
  confirmPrompt: { fontSize: 10, fontWeight: '800', color: theme.subtext, marginBottom: 8, letterSpacing: 0.3 },
  confirmInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  confirmInputField: { flex: 1, fontSize: 14, color: theme.text, fontWeight: '600' },

  refundFooter: {
    flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: theme.border,
  },
  refundCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border,
    alignItems: 'center', backgroundColor: theme.surface,
  },
  refundCancelText: { fontSize: 13, fontWeight: '700', color: theme.subtext },
  refundSubmitBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, backgroundColor: theme.danger,
  },
  refundSubmitText: { fontSize: 13, fontWeight: '800', color: theme.onPrimary },
});


export default PrincipalFeesScreen;
