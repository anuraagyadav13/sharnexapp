import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { Theme, withAlpha, LIGHT_COLORS } from '../../constants/theme';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';
import { getApiErrorMessage } from '../../services/apiClient';
import RazorpayCheckout from 'react-native-razorpay';
import { generatePDF } from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import Share from 'react-native-share';
import { toFileUri, toRawFilePath } from '../../utils/fileUtils';

const { width } = Dimensions.get('window');

type FeesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Fees'
>;

interface Props {
  navigation: FeesScreenNavigationProp;
}

// ─── HTML Receipt Template ───────────────────────────────────────────────────

function generateReceiptHTML(receipt: any): string {
  const invNum =
    receipt.invoiceNumber ||
    receipt.invoice_number ||
    (receipt.id ? `#${String(receipt.id).slice(0, 8)}` : 'N/A');
  const schoolName =
    receipt.institutionName || receipt.institution_name || 'Sharnex School';
  const completedDate = new Date(
    receipt.completedAt ||
      receipt.completed_at ||
      receipt.createdAt ||
      receipt.created_at ||
      Date.now(),
  ).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const txnId =
    receipt.gatewayPaymentId ||
    receipt.gateway_payment_id ||
    receipt.id ||
    'N/A';
  const amount = Number(receipt.amount || 0).toFixed(2);
  const status = receipt.status || 'PAID';
  const description =
    receipt.description ||
    receipt.invoice_description ||
    'Academic & Tuition Fees';
  const paymentMode =
    receipt.paymentMode || receipt.payment_mode || 'Online Payment';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Receipt - ${invNum}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: ${LIGHT_COLORS.background}; color: ${LIGHT_COLORS.text}; margin: 0; padding: 36px 20px; }
    .receipt-container { max-width: 680px; margin: 0 auto; background: ${LIGHT_COLORS.surface}; border-radius: 16px; border: 1px solid ${LIGHT_COLORS.border}; overflow: hidden; }
    .header { background: ${LIGHT_COLORS.surface}; color: ${LIGHT_COLORS.onPrimary}; padding: 28px 32px; display: flex; justify-content: space-between; align-items: flex-start; }
    .badge { background: ${withAlpha(LIGHT_COLORS.success, 0.2)}; border: 1px solid ${withAlpha(LIGHT_COLORS.success, 0.4)}; color: ${LIGHT_COLORS.success}; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; display: inline-block; margin-bottom: 8px; }
    .title { font-size: 22px; font-weight: 800; margin: 0; color: ${LIGHT_COLORS.onPrimary}; }
    .school { font-size: 13px; color: ${LIGHT_COLORS.border}; margin-top: 4px; }
    .content { padding: 28px 32px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid ${LIGHT_COLORS.background}; }
    .label { font-size: 11px; font-weight: 700; color: ${LIGHT_COLORS.subtext}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .value { font-size: 14px; font-weight: 600; color: ${LIGHT_COLORS.text}; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table th { text-align: left; font-size: 11px; font-weight: 700; color: ${LIGHT_COLORS.subtext}; text-transform: uppercase; padding: 10px 0; border-bottom: 2px solid ${LIGHT_COLORS.border}; }
    .table td { padding: 14px 0; border-bottom: 1px solid ${LIGHT_COLORS.background}; font-size: 13px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; background: ${LIGHT_COLORS.background}; padding: 16px 20px; border-radius: 12px; font-weight: 800; font-size: 17px; margin-bottom: 24px; }
    .footer { text-align: center; font-size: 11px; color: ${LIGHT_COLORS.subtext}; border-top: 1px solid ${LIGHT_COLORS.background}; padding: 18px 32px; background: ${LIGHT_COLORS.background}; }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div>
        <span class="badge">&#10003; Cryptographically Verified</span>
        <h1 class="title">Fee Payment Receipt</h1>
        <div class="school">${schoolName}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: ${LIGHT_COLORS.subtext};">Receipt #</div>
        <div style="font-size: 14px; font-weight: 700; color: ${LIGHT_COLORS.onPrimary};">${invNum}</div>
      </div>
    </div>
    <div class="content">
      <div class="grid">
        <div>
          <div class="label">Date & Time</div>
          <div class="value">${completedDate}</div>
        </div>
        <div>
          <div class="label">Payment Status</div>
          <div class="value" style="color: ${LIGHT_COLORS.success}; font-weight: 700;">&#10003; ${status}</div>
        </div>
        <div>
          <div class="label">Transaction Reference</div>
          <div class="value" style="font-family: monospace; font-size: 12px;">${txnId}</div>
        </div>
        <div>
          <div class="label">Payment Method</div>
          <div class="value">${receipt.paymentMode || 'Online Payment'}</div>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${receipt.description || 'Academic & Tuition Fees'}</td>
            <td style="text-align: right; font-weight: 700;">₹${amount}</td>
          </tr>
        </tbody>
      </table>

      <div class="total-row">
        <span>Total Paid:</span>
        <span style="color: ${LIGHT_COLORS.primary};">₹${amount}</span>
      </div>
    </div>
    <div class="footer">
      Verified by Sharnex Cryptographic Ledger &bull; Official Digital Receipt
    </div>
  </div>
</body>
</html>`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const FeesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { authState } = useAuth();

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Active Invoices' | 'Payment History'>(
    'Active Invoices',
  );
  const [invoiceFilter, setInvoiceFilter] = useState<
    'All' | 'Pending' | 'Overdue' | 'Paid'
  >('All');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Checkout Modal State
  const [checkoutInvoice, setCheckoutInvoice] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CARD'>('UPI');
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleReceiptPress = async (paymentId: string) => {
    try {
      setActiveReceiptId(paymentId);
      const foundInHistory = history.find(p => p.id === paymentId);
      try {
        const res = await studentService.getReceipt(paymentId);
        const receiptData =
          res.normalized?.data?.data || res.data?.data || res.data;
        if (receiptData) {
          setSelectedReceipt({ ...foundInHistory, ...receiptData });
          return;
        }
      } catch (endpointErr) {
        console.warn('getReceipt endpoint call failed, falling back to history item:', endpointErr);
      }
      if (foundInHistory) {
        setSelectedReceipt(foundInHistory);
      } else {
        Alert.alert('Error', 'Could not load receipt details');
      }
    } catch (err) {
      console.error('Failed to fetch receipt:', err);
      Alert.alert('Error', 'Could not load receipt details');
    } finally {
      setActiveReceiptId(null);
    }
  };

  const generateAndHandleReceiptPDF = async (action: 'print' | 'share') => {
    if (!selectedReceipt) return;
    try {
      setIsPrinting(true);
      const html = generateReceiptHTML(selectedReceipt);
      const invNum =
        selectedReceipt.invoiceNumber ||
        selectedReceipt.invoice_number ||
        selectedReceipt.id ||
        'Receipt';
      const file = await generatePDF({
        html,
        fileName: `Receipt_${String(invNum).replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      });

      if (!file?.filePath) {
        throw new Error('PDF generation did not return a valid file path');
      }

      if (action === 'print') {
        await RNPrint.print({ filePath: toRawFilePath(file.filePath) });
      } else {
        await Share.open({
          url: toFileUri(file.filePath),
          type: 'application/pdf',
          title: 'Save or Share Payment Receipt',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('User did not share') ||
        msg.includes('dismiss') ||
        msg.includes('cancel')
      ) {
        return;
      }
      console.error('[FeesScreen] PDF error:', err);
      if (action === 'print') {
        Alert.alert('Print Error', 'Could not open print preview. Please try again.');
      } else {
        Alert.alert(
          'Share Error',
          'Could not generate or share the payment receipt. Please try again.',
        );
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const getStatusDisplay = useCallback((item: any) => {
    if (item.status === 'PAID') return 'Paid';
    if (item.status === 'PENDING') {
      const now = new Date();
      if (item.dueDate && new Date(item.dueDate) < now) return 'Overdue';
      return 'Pending';
    }
    return item.status;
  }, []);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const invRes = await studentService.getInvoices();
        const invData = invRes.data?.data || invRes.data || {};
        const invoicesArray = invData.invoices || invRes.data?.invoices || [];
        setInvoices(Array.isArray(invoicesArray) ? invoicesArray : []);

        const histRes = await studentService.getPaymentHistory();
        const histData = histRes.data?.data || histRes.data || {};
        const paymentsArray = histData.payments || histRes.data?.payments || [];
        setHistory(Array.isArray(paymentsArray) ? paymentsArray : []);

        // Calculate Summary Stats
        const pending = invoicesArray.filter(
          (i: any) => getStatusDisplay(i) === 'Pending',
        );
        const overdue = invoicesArray.filter(
          (i: any) => getStatusDisplay(i) === 'Overdue',
        );
        const paid = invoicesArray.filter(
          (i: any) => getStatusDisplay(i) === 'Paid',
        );
        const totalPendingAmount = [...pending, ...overdue].reduce(
          (sum: number, inv: any) => sum + (Number(inv.totalAmount) || 0),
          0,
        );
        const totalPaidAmount = paid.reduce(
          (sum: number, inv: any) => sum + (Number(inv.totalAmount) || 0),
          0,
        );

        setSummary({
          totalPending: totalPendingAmount,
          totalPaid: totalPaidAmount,
          pendingCount: pending.length,
          overdueCount: overdue.length,
          paidCount: paid.length,
          nextDue:
            overdue.length > 0
              ? overdue[0].dueDate
              : pending.length > 0
              ? pending[0].dueDate
              : null,
        });
      } catch (err: any) {
        console.error('Failed to fetch fee data:', err);
        setError('Failed to load fee information');
        setInvoices([]);
        setHistory([]);
        setSummary({
          totalPending: 0,
          totalPaid: 0,
          pendingCount: 0,
          overdueCount: 0,
          paidCount: 0,
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [getStatusDisplay],
  );

  const onRefresh = () => fetchData(true);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredInvoices = useMemo(() => {
    let result = invoices.map(item => ({
      ...item,
      displayStatus: getStatusDisplay(item),
    }));
    if (invoiceFilter !== 'All') {
      result = result.filter(inv => inv.displayStatus === invoiceFilter);
    }
    return result;
  }, [invoices, invoiceFilter, getStatusDisplay]);

  const handleCheckout = async () => {
    if (!checkoutInvoice) return;
    try {
      setIsLoading(true);
      const generateIdempotencyKey = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
          /[xy]/g,
          function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          },
        );
      };

      const res = await studentService.initiatePayment({
        invoiceId: checkoutInvoice.id,
        idempotencyKey: generateIdempotencyKey(),
        paymentMode: paymentMode === 'CARD' ? 'card' : 'upi',
      });

      const rawRes = res.originalData || res.data;
      const success = rawRes?.success ?? res.normalized?.success ?? true;
      const serverErrMsg =
        rawRes?.error ||
        rawRes?.message ||
        res.normalized?.message ||
        'Failed to initiate order';

      if (!success) {
        throw new Error(serverErrMsg);
      }

      const paymentData =
        rawRes?.data && typeof rawRes.data === 'object'
          ? rawRes.data
          : rawRes;
      const razorpayKey = paymentData?.key || paymentData?.razorpayKey;
      const orderId =
        paymentData?.razorpayOrderId ||
        paymentData?.order_id ||
        paymentData?.orderId ||
        paymentData?.id;
      const amountPaise =
        paymentData?.amountInPaise ??
        paymentData?.amount ??
        Math.round(checkoutInvoice.totalAmount * 100);

      if (!orderId) {
        throw new Error(
          rawRes?.error || 'Order creation failed: missing order_id from server',
        );
      }

      if (!razorpayKey) {
        throw new Error(
          rawRes?.error ||
            'Order creation failed: missing Razorpay key from server',
        );
      }

      const options: any = {
        description: checkoutInvoice.description || 'Fee Payment',
        image: 'https://sharnex.com/logo.png',
        currency: paymentData?.currency || 'INR',
        key: razorpayKey,
        amount: String(amountPaise),
        name: 'Sharnex',
        order_id: orderId,
        prefill: {
          email: authState.user?.email || '',
          contact: authState.user?.phone || '',
          name: authState.user?.name || '',
          method: paymentMode === 'CARD' ? 'card' : 'upi',
        },
        theme: { color: theme.primary },
      };

      RazorpayCheckout.open(options)
        .then(async (razorpayData: any) => {
          setIsLoading(true);
          try {
            await studentService.verifyPayment({
              razorpayPaymentId: razorpayData.razorpay_payment_id,
              razorpayOrderId: razorpayData.razorpay_order_id,
              razorpaySignature: razorpayData.razorpay_signature,
              invoiceId: checkoutInvoice.id,
            });
            Alert.alert('Success', 'Payment completed successfully');
            setCheckoutInvoice(null);
            fetchData();
          } catch (e: any) {
            const verifyErrorMsg = getApiErrorMessage(e);
            Alert.alert(
              'Error',
              `Payment verification failed: ${verifyErrorMsg}`,
            );
          } finally {
            setIsLoading(false);
          }
        })
        .catch((err: any) => {
          const errorMsg =
            err.message ||
            err.description ||
            (typeof err === 'string' ? err : JSON.stringify(err));
          if (
            err?.code === 0 ||
            errorMsg.toLowerCase().includes('cancel') ||
            errorMsg.toLowerCase().includes('closed')
          ) {
            setIsLoading(false);
            return;
          }
          Alert.alert(
            'Payment Error',
            `Failed to process Razorpay checkout.\n\nDetails: ${errorMsg}`,
          );
          setIsLoading(false);
        });
    } catch (e: any) {
      console.log('[PAYMENT_INITIATE_DEBUG_RESPONSE]', {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message,
      });
      const errorMsg = getApiErrorMessage(e);
      Alert.alert('Error', errorMsg);
      setIsLoading(false);
    }
  };

  const renderStats = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.statsScrollContent}
    >
      {/* TOTAL OUTSTANDING */}
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statTitle}>
            TOTAL OUTSTANDING
          </Text>
          <View
            style={[
              styles.statIconBox,
              {
                backgroundColor: isDarkMode
                  ? withAlpha(theme.danger, 0.2)
                  : withAlpha(theme.danger, 0.1),
              },
            ]}
          >
            <Ionicons name="wallet-outline" size={15} color={theme.danger} />
          </View>
        </View>
        <Text style={styles.statValue}>
          ₹{summary?.totalPending || 0}
        </Text>
        <Text style={styles.statSubtitle}>
          {(summary?.overdueCount || 0) + (summary?.pendingCount || 0)} active
          invoice(s) due
        </Text>
      </View>

      {/* TOTAL PAID */}
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statTitle}>
            TOTAL PAID (THIS TERM)
          </Text>
          <View
            style={[
              styles.statIconBox,
              {
                backgroundColor: isDarkMode
                  ? withAlpha(theme.success, 0.2)
                  : withAlpha(theme.success, 0.1),
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={15}
              color={theme.success}
            />
          </View>
        </View>
        <Text style={styles.statValue}>
          ₹{summary?.totalPaid || 0}
        </Text>
        <Text style={styles.statSubtitle}>
          Successfully verified across ledger
        </Text>
      </View>

      {/* NEXT DUE */}
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statTitle}>
            NEXT DUE
          </Text>
          <View
            style={[
              styles.statIconBox,
              {
                backgroundColor: isDarkMode
                  ? withAlpha(theme.warning, 0.2)
                  : withAlpha(theme.warning, 0.1),
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={15}
              color={theme.warning}
            />
          </View>
        </View>
        <Text style={styles.statValue}>
          {summary?.nextDue
            ? new Date(summary.nextDue).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'N/A'}
        </Text>
        <Text style={styles.statSubtitle}>
          {summary?.overdueCount > 0 ? 'Payment overdue' : 'Upcoming due date'}
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <StudentHeader
        title="Fees"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.pageTitleWrapper}
        >
          <View style={styles.doubleEntryBadge}>
            <Ionicons name="sparkles" size={10} color={theme.primary} />
            <Text style={styles.doubleEntryText}>DOUBLE-ENTRY PROTECTED</Text>
          </View>
          <Text style={styles.pageTitle}>Student Fee Dashboard</Text>
          <Text style={styles.pageSubtitle}>
            Manage semester invoices, view real-time breakdown, and complete
            secure UPI or card payments.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()}>
          {renderStats()}
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'Active Invoices' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('Active Invoices')}
          >
            <Ionicons
              name="document-text"
              size={16}
              color={
                activeTab === 'Active Invoices' ? theme.primary : theme.subtext
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'Active Invoices' && styles.tabTextActive,
              ]}
            >
              Active Invoices
            </Text>
            <View
              style={[
                styles.tabCountBadge,
                {
                  backgroundColor:
                    activeTab === 'Active Invoices'
                      ? withAlpha(theme.primary, 0.2)
                      : isDarkMode
                      ? theme.cardNested
                      : theme.iconBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  {
                    color:
                      activeTab === 'Active Invoices'
                        ? theme.primary
                        : theme.subtext,
                  },
                ]}
              >
                {(summary?.overdueCount || 0) + (summary?.pendingCount || 0)}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'Payment History' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('Payment History')}
          >
            <Ionicons
              name="receipt"
              size={16}
              color={
                activeTab === 'Payment History' ? theme.primary : theme.subtext
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'Payment History' && styles.tabTextActive,
              ]}
            >
              Payment History
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {activeTab === 'Active Invoices' && (
            <>
              {/* Filter Row */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {(['All', 'Pending', 'Overdue', 'Paid'] as const).map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.filterBtn,
                      invoiceFilter === f && styles.filterBtnActive,
                    ]}
                    onPress={() => setInvoiceFilter(f)}
                  >
                    <Text
                      style={[
                        styles.filterBtnText,
                        invoiceFilter === f && styles.filterBtnTextActive,
                      ]}
                    >
                      {f === 'All' ? 'All Invoices' : f}
                    </Text>
                    <View
                      style={[
                        styles.filterCountBadge,
                        invoiceFilter === f && styles.filterCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterCountBadgeText,
                          invoiceFilter === f &&
                            styles.filterCountBadgeTextActive,
                        ]}
                      >
                        {f === 'All'
                          ? invoices.length
                          : f === 'Pending'
                          ? summary?.pendingCount || 0
                          : f === 'Overdue'
                          ? summary?.overdueCount || 0
                          : summary?.paidCount || 0}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color={theme.primary}
                  style={{ marginTop: 40 }}
                />
              ) : error ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.danger }]}>
                    {error}
                  </Text>
                </View>
              ) : filteredInvoices.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No active invoices found.</Text>
                </View>
              ) : (
                filteredInvoices.map(inv => {
                  const isOverdue = inv.displayStatus === 'Overdue';
                  const isPaid = inv.displayStatus === 'Paid';
                  const statusColor = isOverdue
                    ? theme.danger
                    : isPaid
                    ? theme.success
                    : theme.warning;
                  return (
                    <View key={inv.id} style={styles.invoiceCard}>
                      {/* Header: Invoice # and Status Badge */}
                      <View style={styles.invoiceCardHeader}>
                        <View style={styles.invoiceNumberRow}>
                          <View style={styles.invoiceIconBox}>
                            <Ionicons
                              name="document-text-outline"
                              size={18}
                              color={theme.primary}
                            />
                          </View>
                          <Text style={styles.invNumberText}>
                            {inv.invoiceNumber}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadgeSmall,
                            {
                              backgroundColor: isOverdue
                                ? isDarkMode
                                  ? withAlpha(theme.danger, 0.2)
                                  : withAlpha(theme.danger, 0.1)
                                : isPaid
                                ? isDarkMode
                                  ? withAlpha(theme.success, 0.2)
                                  : withAlpha(theme.success, 0.1)
                                : isDarkMode
                                ? withAlpha(theme.warning, 0.2)
                                : withAlpha(theme.warning, 0.1),
                            },
                          ]}
                        >
                          {isOverdue && (
                            <Ionicons
                              name="alert-circle-outline"
                              size={12}
                              color={theme.danger}
                              style={{ marginRight: 4 }}
                            />
                          )}
                          {isPaid && (
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={12}
                              color={theme.success}
                              style={{ marginRight: 4 }}
                            />
                          )}
                          {!isOverdue && !isPaid && (
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color={theme.warning}
                              style={{ marginRight: 4 }}
                            />
                          )}
                          <Text
                            style={[
                              styles.statusBadgeText,
                              { color: statusColor },
                            ]}
                          >
                            {inv.displayStatus}
                          </Text>
                        </View>
                      </View>

                      {/* Description */}
                      <Text style={styles.invDescText}>
                        {inv.description || 'Tuition fees'}
                      </Text>

                      {/* Due Date */}
                      <View style={styles.invDateRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color={theme.subtext}
                        />
                        <Text style={styles.invDateText}>
                          Due:{' '}
                          {new Date(inv.dueDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>

                      {/* Divider */}
                      <View style={styles.invoiceDivider} />

                      {/* Footer: Amount & Pay Now Button */}
                      <View style={styles.invoiceCardFooter}>
                        <View>
                          <Text style={styles.invAmountLabel}>AMOUNT DUE</Text>
                          <Text style={styles.invAmountValue}>
                            ₹{inv.totalAmount}
                          </Text>
                        </View>
                        {!isPaid ? (
                          <TouchableOpacity
                            style={styles.payNowBtn}
                            onPress={() => setCheckoutInvoice(inv)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="wallet-outline"
                              size={15}
                              color={theme.onPrimary}
                              style={{ marginRight: 6 }}
                            />
                            <Text style={styles.payNowBtnText}>Pay Now</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.paidCheckBadge}>
                            <Ionicons
                              name="checkmark-circle"
                              size={15}
                              color={theme.success}
                              style={{ marginRight: 4 }}
                            />
                            <Text style={styles.paidCheckText}>Paid</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'Payment History' && (
            <View style={styles.historyBox}>
              <View style={styles.historyBoxHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name="lock-closed"
                    size={14}
                    color={theme.subtext}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.historyBoxTitle}>
                    CRYPTOGRAPHIC PAYMENT LOG
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => fetchData()}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Ionicons name="refresh" size={12} color={theme.primary} />
                  <Text style={styles.historyBoxRefresh}>Refresh Ledger</Text>
                </TouchableOpacity>
              </View>

              {/* History Header Row */}
              <View style={styles.historyRowHeader}>
                <Text style={[styles.historyColHead, { flex: 2 }]}>
                  INVOICE & DESC
                </Text>
                <Text style={[styles.historyColHead, { flex: 1.5 }]}>
                  TIMESTAMP
                </Text>
                <Text style={[styles.historyColHead, { flex: 1 }]}>AMOUNT</Text>
                <Text style={[styles.historyColHead, { flex: 1.5 }]}>STATUS</Text>
                <Text style={[styles.historyColHead, { flex: 1, textAlign: 'right' }]}>
                  RECEIPT
                </Text>
              </View>

              {history.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No payment history recorded.
                  </Text>
                </View>
              ) : (
                history.map(item => {
                  const isSuccess = item.status === 'SUCCESS';
                  const isFailed = item.status === 'FAILED';
                  const pillColor = isSuccess
                    ? theme.success
                    : isFailed
                    ? theme.danger
                    : theme.warning;
                  return (
                    <View key={item.id} style={styles.historyRowItem}>
                      <View style={{ flex: 2, paddingRight: 8 }}>
                        <Text style={styles.histInvNum}>
                          {item.invoiceNumber || item.paymentId}
                        </Text>
                        <Text style={styles.histInvDesc} numberOfLines={1}>
                          {item.gatewayPaymentId || 'N/A'}
                        </Text>
                      </View>
                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.histText}>
                          {new Date(
                            item.completedAt || item.createdAt,
                          ).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text style={styles.histTextLight}>
                          {new Date(
                            item.completedAt || item.createdAt,
                          ).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.histAmount}>₹{item.amount}</Text>
                      </View>
                      <View style={{ flex: 1.5 }}>
                        <View
                          style={[
                            styles.histStatusPill,
                            {
                              backgroundColor: pillColor + '20',
                              borderColor: pillColor,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.histStatusDot,
                              { backgroundColor: pillColor },
                            ]}
                          />
                          <Text
                            style={[
                              styles.histStatusText,
                              { color: pillColor },
                            ]}
                          >
                            {isSuccess
                              ? 'Success'
                              : isFailed
                              ? 'Failed'
                              : 'Processing'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        {isSuccess ? (
                          <TouchableOpacity
                            style={styles.histReceiptBtn}
                            onPress={() => handleReceiptPress(item.id)}
                          >
                            {activeReceiptId === item.id ? (
                              <ActivityIndicator
                                size="small"
                                color={theme.primary}
                              />
                            ) : (
                              <>
                                <Ionicons
                                  name="download-outline"
                                  size={12}
                                  color={theme.primary}
                                  style={{ marginRight: 4 }}
                                />
                                <Text style={styles.histReceiptText}>
                                  Receipt
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.histNoReceipt}>No receipt</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Checkout Modal ── */}
      <Modal
        visible={!!checkoutInvoice}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutInvoice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.checkoutModalContent}>
            {/* Header */}
            <View style={styles.checkoutHeader}>
              <View>
                <View style={styles.secureBadge}>
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={theme.success}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.secureBadgeText}>
                    256-Bit SSL Encrypted Checkout
                  </Text>
                </View>
                <Text style={styles.checkoutTitle}>Fee Checkout</Text>
                <Text style={styles.checkoutSubtitle}>
                  #{checkoutInvoice?.invoiceNumber}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCheckoutInvoice(null)}
                style={styles.closeBtnDark}
              >
                <Ionicons name="close" size={20} color={theme.onPrimary} />
              </TouchableOpacity>
            </View>

            {/* Amount Summary */}
            <View style={styles.amountSummaryBox}>
              <View>
                <Text style={styles.summaryLabel}>BASE AMOUNT DUE</Text>
                <Text style={styles.summaryValue}>
                  ₹{checkoutInvoice?.totalAmount}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summaryLabel}>DUE DATE</Text>
                <Text style={styles.summaryValueLight}>
                  {new Date(
                    checkoutInvoice?.dueDate || new Date(),
                  ).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.methodsContainer}>
              <View style={styles.methodsHeader}>
                <Text style={styles.methodsTitle}>SELECT PAYMENT METHOD</Text>
                <View style={styles.recommendedBadge}>
                  <Ionicons
                    name="sparkles"
                    size={10}
                    color={theme.success}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.recommendedText}>
                    RECOMMENDED UPI FOR 0% FEES
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.methodCard,
                  paymentMode === 'UPI' && styles.methodCardActive,
                ]}
                onPress={() => setPaymentMode('UPI')}
                activeOpacity={0.85}
              >
                <View style={styles.methodCardTopRow}>
                  <View
                    style={[
                      styles.methodIconBox,
                      {
                        backgroundColor:
                          paymentMode === 'UPI'
                            ? theme.primary
                            : isDarkMode
                            ? theme.cardNested
                            : theme.iconBackground,
                      },
                    ]}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
                      size={20}
                      color={
                        paymentMode === 'UPI'
                          ? theme.onPrimary
                          : theme.subtext
                      }
                    />
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.methodTitle}>UPI Instant Pay</Text>
                      <View style={styles.feeBadgeGreen}>
                        <Text style={styles.feeBadgeTextGreen}>0% Extra Fee</Text>
                      </View>
                    </View>
                    <Text style={styles.methodDesc}>
                      Google Pay, PhonePe, Paytm, BHIM or any UPI ID
                    </Text>
                  </View>
                  <View style={styles.methodCardRight}>
                    <View
                      style={[
                        styles.radioOuter,
                        paymentMode === 'UPI' && styles.radioOuterActive,
                      ]}
                    >
                      {paymentMode === 'UPI' && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.methodAmount}>
                      ₹{checkoutInvoice?.totalAmount}
                    </Text>
                  </View>
                </View>
                <View style={styles.zeroFeeInlineRow}>
                  <Ionicons
                    name="sparkles"
                    size={12}
                    color={theme.success}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.zeroFeeInlineText}>
                    Recommended • Zero extra transaction charges
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodCard,
                  paymentMode === 'CARD' && styles.methodCardActive,
                ]}
                onPress={() => setPaymentMode('CARD')}
                activeOpacity={0.85}
              >
                <View style={styles.methodCardTopRow}>
                  <View
                    style={[
                      styles.methodIconBox,
                      {
                        backgroundColor:
                          paymentMode === 'CARD'
                            ? theme.primary
                            : isDarkMode
                            ? theme.cardNested
                            : theme.iconBackground,
                      },
                    ]}
                  >
                    <Ionicons
                      name="card-outline"
                      size={20}
                      color={
                        paymentMode === 'CARD'
                          ? theme.onPrimary
                          : theme.subtext
                      }
                    />
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.methodTitle}>
                        Cards & Net Banking
                      </Text>
                      <View style={styles.feeBadgeNeutral}>
                        <Text style={styles.feeBadgeTextNeutral}>2% Gateway Fee</Text>
                      </View>
                    </View>
                    <Text style={styles.methodDesc}>
                      Visa, Mastercard, RuPay & Net Banking
                    </Text>
                  </View>
                  <View style={styles.methodCardRight}>
                    <View
                      style={[
                        styles.radioOuter,
                        paymentMode === 'CARD' && styles.radioOuterActive,
                      ]}
                    >
                      {paymentMode === 'CARD' && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.methodAmount}>
                      ₹{checkoutInvoice?.totalAmount}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bill Breakdown */}
            <View style={styles.billBox}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Base Fee Amount</Text>
                <Text style={styles.billValue}>
                  ₹{checkoutInvoice?.totalAmount}
                </Text>
              </View>
              <View style={styles.billRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.billLabel}>Convenience Fee</Text>
                  {paymentMode === 'UPI' && (
                    <View style={styles.exemptBadge}>
                      <Text style={styles.exemptBadgeText}>0% Exempt</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.billValue,
                    paymentMode === 'UPI' && { color: theme.success },
                  ]}
                >
                  {paymentMode === 'UPI'
                    ? 'FREE'
                    : `₹${(checkoutInvoice?.totalAmount * 0.02).toFixed(2)}`}
                </Text>
              </View>
              <View style={styles.billDivider} />
              <View style={styles.billRow}>
                <View>
                  <Text style={styles.billTotalLabel}>Total Payable</Text>
                  <Text style={styles.billTotalSub}>
                    All taxes & charges included
                  </Text>
                </View>
                <Text style={styles.billTotalValue}>
                  ₹
                  {paymentMode === 'UPI'
                    ? checkoutInvoice?.totalAmount
                    : (checkoutInvoice?.totalAmount * 1.02).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Pay Button */}
            <TouchableOpacity
              style={styles.proceedBtn}
              onPress={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.onPrimary} />
              ) : (
                <>
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={theme.onPrimary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.proceedBtnText}>
                    Proceed to Pay ₹
                    {paymentMode === 'UPI'
                      ? checkoutInvoice?.totalAmount
                      : (checkoutInvoice?.totalAmount * 1.02).toFixed(2)}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={theme.onPrimary}
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Official PDF Receipt Modal ── */}
      <Modal
        visible={!!selectedReceipt}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.checkoutModalContent}>
            {/* Modal Header */}
            <View style={styles.checkoutHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isDarkMode
                      ? withAlpha(theme.success, 0.25)
                      : withAlpha(theme.success, 0.15),
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={theme.success}
                  />
                </View>
                <View>
                  <Text style={styles.checkoutTitle}>Payment Receipt</Text>
                  <Text style={styles.checkoutSubtitle}>
                    #
                    {selectedReceipt?.invoiceNumber ||
                      selectedReceipt?.invoice_number ||
                      selectedReceipt?.id}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedReceipt(null)}
                style={styles.closeBtnDark}
              >
                <Ionicons name="close" size={20} color={theme.onPrimary} />
              </TouchableOpacity>
            </View>

            {/* Receipt Summary Card */}
            <View
              style={[
                styles.amountSummaryBox,
                {
                  backgroundColor: isDarkMode
                    ? withAlpha(theme.success, 0.15)
                    : withAlpha(theme.success, 0.08),
                  borderColor: theme.success,
                  borderWidth: 1,
                  margin: 16,
                  borderRadius: 12,
                  padding: 14,
                },
              ]}
            >
              <View>
                <Text style={[styles.summaryLabel, { color: theme.success }]}>
                  AMOUNT PAID
                </Text>
                <Text style={[styles.summaryValue, { color: theme.success }]}>
                  ₹{selectedReceipt?.amount || 0}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.summaryLabel, { color: theme.success }]}>
                  STATUS
                </Text>
                <View
                  style={[
                    styles.histStatusPill,
                    {
                      backgroundColor: withAlpha(theme.success, 0.2),
                      borderColor: theme.success,
                      marginTop: 4,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.histStatusDot,
                      { backgroundColor: theme.success },
                    ]}
                  />
                  <Text
                    style={[
                      styles.histStatusText,
                      { color: theme.success },
                    ]}
                  >
                    {selectedReceipt?.status || 'SUCCESS'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Receipt Details Breakdown */}
            <View style={[styles.billBox, { marginBottom: 16 }]}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Invoice Number</Text>
                <Text style={[styles.billValue, { fontWeight: '700' }]}>
                  {selectedReceipt?.invoiceNumber ||
                    selectedReceipt?.invoice_number ||
                    'N/A'}
                </Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Transaction Ref</Text>
                <Text style={[styles.billValue, { fontSize: 11 }]}>
                  {selectedReceipt?.gatewayPaymentId ||
                    selectedReceipt?.gateway_payment_id ||
                    selectedReceipt?.id ||
                    'N/A'}
                </Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Date & Time</Text>
                <Text style={styles.billValue}>
                  {new Date(
                    selectedReceipt?.completedAt ||
                      selectedReceipt?.createdAt ||
                      new Date(),
                  ).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {selectedReceipt?.description ? (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Description</Text>
                  <Text style={styles.billValue}>
                    {selectedReceipt.description}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Modal Actions: Print & Share PDF */}
            <View style={styles.receiptActionsRow}>
              <TouchableOpacity
                style={[
                  styles.receiptActionBtn,
                  styles.receiptActionBtnOutline,
                  isPrinting && { opacity: 0.6 },
                ]}
                onPress={() => generateAndHandleReceiptPDF('print')}
                disabled={isPrinting}
                activeOpacity={0.8}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="print-outline"
                      size={16}
                      color={theme.text}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.receiptActionBtnOutlineText}>Print</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.receiptActionBtn,
                  styles.receiptActionBtnFilled,
                  isPrinting && { opacity: 0.6 },
                ]}
                onPress={() => generateAndHandleReceiptPDF('share')}
                disabled={isPrinting}
                activeOpacity={0.8}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <>
                    <Ionicons
                      name="share-outline"
                      size={16}
                      color={theme.onPrimary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.receiptActionBtnFilledText}>Save PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (theme: Theme, isDarkMode: boolean) =>
  StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingBottom: 40 },

    pageTitleWrapper: {
      paddingHorizontal: 20,
      marginTop: 10,
      marginBottom: 16,
    },
    doubleEntryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 8,
    },
    doubleEntryText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.primary,
      marginLeft: 5,
      letterSpacing: 0.5,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 6,
    },
    pageSubtitle: { fontSize: 13, color: theme.subtext, lineHeight: 19 },

    // Top Summary Stat Cards
    statsScrollContent: { paddingHorizontal: 20, paddingBottom: 10, gap: 12 },
    statCard: {
      width: 210,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      elevation: 1,
    },
    statHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    statTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.subtext,
      letterSpacing: 0.5,
    },
    statIconBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 4,
    },
    statSubtitle: { fontSize: 11, fontWeight: '500', color: theme.subtext },

    // Tabs
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginTop: 12,
    },
    tabItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      marginRight: 8,
    },
    tabItemActive: { borderBottomColor: theme.primary },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.subtext,
      marginLeft: 6,
    },
    tabTextActive: { color: theme.primary, fontWeight: '700' },
    tabCountBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 6,
    },
    tabCountText: { fontSize: 11, fontWeight: '700' },

    listContainer: { paddingHorizontal: 20, marginTop: 16 },

    // Filter Pills
    filterRow: { paddingBottom: 16, gap: 8 },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterBtnActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterBtnText: { fontSize: 12, fontWeight: '600', color: theme.subtext },
    filterBtnTextActive: { color: theme.onPrimary, fontWeight: '700' },
    filterCountBadge: {
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 6,
    },
    filterCountBadgeText: {
      fontSize: 10,
      color: theme.subtext,
      fontWeight: '700',
    },
    filterCountBadgeActive: {
      backgroundColor: isDarkMode
        ? withAlpha(theme.onPrimary, 0.2)
        : withAlpha(theme.onPrimary, 0.25),
    },
    filterCountBadgeTextActive: {
      color: theme.onPrimary,
    },

    // Invoice Card (Active Invoices) - Clean 3-part layout
    invoiceCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 14,
      elevation: 2,
    },
    invoiceCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    invoiceNumberRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    invoiceIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    invNumberText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
    },
    statusBadgeSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    invDescText: {
      fontSize: 13,
      color: theme.subtext,
      lineHeight: 18,
      marginBottom: 8,
    },
    invDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    invDateText: {
      fontSize: 12,
      color: theme.subtext,
      marginLeft: 6,
      fontWeight: '500',
    },
    invoiceDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 14,
    },
    invoiceCardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    invAmountLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    invAmountValue: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
    },
    payNowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      elevation: 2,
      minHeight: 44,
    },
    payNowBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.onPrimary,
      marginLeft: 6,
    },
    paidCheckBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode
        ? withAlpha(theme.success, 0.15)
        : withAlpha(theme.success, 0.08),
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.success,
    },
    paidCheckText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.success,
    },

    // Payment History Table
    historyBox: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      elevation: 1,
    },
    historyBoxHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
    },
    historyBoxTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: 0.3,
    },
    historyBoxRefresh: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
      marginLeft: 4,
    },
    historyRowHeader: {
      flexDirection: 'row',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
    },
    historyColHead: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
      letterSpacing: 0.5,
    },
    historyRowItem: {
      flexDirection: 'row',
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      alignItems: 'center',
    },
    histInvNum: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    histInvDesc: { fontSize: 10, color: theme.subtext },
    histText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    histTextLight: { fontSize: 10, color: theme.subtext },
    histAmount: { fontSize: 13, fontWeight: '700', color: theme.text },
    histStatusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
    histStatusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
    histStatusText: { fontSize: 10, fontWeight: '700' },
    histReceiptBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    histReceiptText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.primary,
    },
    histNoReceipt: {
      fontSize: 11,
      color: theme.subtext,
      fontStyle: 'italic',
    },

    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

    // Checkout Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: withAlpha(theme.overlay, 0.65),
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkoutModalContent: {
      width: width * 0.92,
      maxWidth: 440,
      backgroundColor: theme.surface,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    checkoutHeader: {
      backgroundColor: theme.primary,
      padding: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    secureBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: withAlpha(theme.onPrimary, 0.2),
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginBottom: 6,
    },
    secureBadgeText: {
      fontSize: 10,
      color: theme.onPrimary,
      fontWeight: '700',
    },
    checkoutTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.onPrimary,
      marginBottom: 2,
    },
    checkoutSubtitle: {
      fontSize: 12,
      color: theme.onPrimary,
      opacity: 0.85,
    },
    closeBtnDark: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: withAlpha(theme.onPrimary, 0.2),
      justifyContent: 'center',
      alignItems: 'center',
    },

    amountSummaryBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme.primary,
      paddingHorizontal: 18,
      paddingBottom: 16,
    },
    summaryLabel: {
      fontSize: 10,
      color: theme.onPrimary,
      opacity: 0.85,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    summaryValue: {
      fontSize: 24,
      color: theme.onPrimary,
      fontWeight: '900',
    },
    summaryValueLight: {
      fontSize: 13,
      color: theme.onPrimary,
      fontWeight: '600',
    },

    methodsContainer: { padding: 18, backgroundColor: theme.surface },
    methodsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    methodsTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.subtext,
      letterSpacing: 0.5,
    },
    recommendedBadge: { flexDirection: 'row', alignItems: 'center' },
    recommendedText: {
      fontSize: 10,
      color: theme.success,
      fontWeight: '700',
      letterSpacing: 0.3,
    },

    methodCard: {
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.border,
      marginBottom: 12,
      backgroundColor: theme.surface,
    },
    methodCardActive: {
      borderColor: theme.primary,
      backgroundColor: isDarkMode
        ? withAlpha(theme.primary, 0.12)
        : withAlpha(theme.primary, 0.05),
    },
    methodCardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    methodIconBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    methodTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
      marginRight: 8,
    },
    feeBadgeGreen: {
      backgroundColor: isDarkMode
        ? withAlpha(theme.success, 0.25)
        : withAlpha(theme.success, 0.15),
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    feeBadgeTextGreen: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.success,
    },
    feeBadgeNeutral: {
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    feeBadgeTextNeutral: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.subtext,
    },
    methodDesc: {
      fontSize: 11,
      color: theme.subtext,
      marginTop: 3,
      lineHeight: 15,
    },
    methodCardRight: {
      alignItems: 'flex-end',
    },
    radioOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    radioOuterActive: { borderColor: theme.primary },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    methodAmount: { fontSize: 13, fontWeight: '800', color: theme.text },
    zeroFeeInlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDarkMode
        ? withAlpha(theme.onPrimary, 0.06)
        : withAlpha(theme.overlay, 0.05),
    },
    zeroFeeInlineText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.success,
    },

    billBox: {
      marginHorizontal: 18,
      padding: 14,
      backgroundColor: isDarkMode ? theme.cardNested : theme.iconBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    billRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    billLabel: { fontSize: 12, color: theme.subtext, fontWeight: '500' },
    billValue: { fontSize: 13, fontWeight: '700', color: theme.text },
    exemptBadge: {
      backgroundColor: isDarkMode
        ? withAlpha(theme.success, 0.25)
        : withAlpha(theme.success, 0.15),
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 6,
    },
    exemptBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.success,
    },
    billDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 8,
    },
    billTotalLabel: { fontSize: 13, fontWeight: '800', color: theme.text },
    billTotalSub: { fontSize: 10, color: theme.subtext },
    billTotalValue: {
      fontSize: 16,
      fontWeight: '900',
      color: theme.primary,
    },

    proceedBtn: {
      flexDirection: 'row',
      backgroundColor: theme.primary,
      margin: 18,
      paddingVertical: 14,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 48,
      elevation: 2,
    },
    proceedBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.onPrimary,
    },

    // Receipt Modal Actions
    receiptActionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginHorizontal: 16,
      marginBottom: 20,
    },
    receiptActionBtn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 10,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 46,
    },
    receiptActionBtnOutline: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    receiptActionBtnOutlineText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    receiptActionBtnFilled: {
      backgroundColor: theme.primary,
      elevation: 2,
    },
    receiptActionBtnFilledText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.onPrimary,
    },
  });

export default FeesScreen;
