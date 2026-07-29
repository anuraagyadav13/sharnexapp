import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';
import RazorpayCheckout from 'react-native-razorpay';

const { width } = Dimensions.get('window');

type FeesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Fees'>;

interface Props {
  navigation: FeesScreenNavigationProp;
}

const FeesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Active Invoices' | 'Payment History'>('Active Invoices');
  const [invoiceFilter, setInvoiceFilter] = useState<'All' | 'Pending' | 'Overdue' | 'Paid'>('All');
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Checkout Modal State
  const [checkoutInvoice, setCheckoutInvoice] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CARD'>('UPI');

  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);

  const handleReceiptPress = async (paymentId: string) => {
    try {
      setActiveReceiptId(paymentId);
      const res = await studentService.getReceipt(paymentId);
      const receiptData = res.normalized?.data?.data || res.data?.data || res.data;
      setSelectedReceipt(receiptData);
    } catch (err) {
      console.error('Failed to fetch receipt:', err);
      Alert.alert('Error', 'Could not load receipt details');
    } finally {
      setActiveReceiptId(null);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
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
      const pending = invoicesArray.filter((i: any) => getStatusDisplay(i) === 'Pending');
      const overdue = invoicesArray.filter((i: any) => getStatusDisplay(i) === 'Overdue');
      const paid = invoicesArray.filter((i: any) => getStatusDisplay(i) === 'Paid');
      const totalPendingAmount = [...pending, ...overdue].reduce((sum: number, inv: any) => sum + (Number(inv.totalAmount) || 0), 0);
      const totalPaidAmount = paid.reduce((sum: number, inv: any) => sum + (Number(inv.totalAmount) || 0), 0);
      
      setSummary({
        totalPending: totalPendingAmount,
        totalPaid: totalPaidAmount,
        pendingCount: pending.length,
        overdueCount: overdue.length,
        paidCount: paid.length,
        nextDue: overdue.length > 0 ? overdue[0].dueDate : (pending.length > 0 ? pending[0].dueDate : null)
      });
      
    } catch (err: any) {
      console.error('Failed to fetch fee data:', err);
      setError('Failed to load fee information');
      setInvoices([]);
      setHistory([]);
      setSummary({ totalPending: 0, totalPaid: 0, pendingCount: 0, overdueCount: 0, paidCount: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusDisplay = React.useCallback((item: any) => {
    if (item.status === 'PAID') return 'Paid';
    if (item.status === 'PENDING') {
      const now = new Date();
      if (item.dueDate && new Date(item.dueDate) < now) return 'Overdue';
      return 'Pending';
    }
    return item.status;
  }, []);

  const filteredInvoices = React.useMemo(() => {
    let result = invoices.map(item => ({ ...item, displayStatus: getStatusDisplay(item) }));
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
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const res = await studentService.initiatePayment({
        invoiceId: checkoutInvoice.id,
        idempotencyKey: generateIdempotencyKey(),
        paymentMode: paymentMode === 'CARD' ? 'card' : 'upi'
      });
      const responseBody = res.data || res.normalized?.data;
      if (!responseBody?.success && !responseBody?.data) throw new Error(responseBody?.error || 'Failed to initiate order');

      const paymentData = responseBody.data;

      const options: any = {
        description: checkoutInvoice.description || 'Fee Payment',
        image: 'https://sharnex.com/logo.png',
        currency: paymentData.currency || 'INR',
        key: paymentData.key,
        amount: String(paymentData.amountInPaise || Math.round(checkoutInvoice.totalAmount * 100)),
        name: 'Sharnex',
        order_id: paymentData.razorpayOrderId,
        prefill: {
          email: authState.user?.email || '',
          contact: authState.user?.phone || '',
          name: authState.user?.name || ''
        },
        theme: { color: '#7C3AED' }
      };

      // The Android SDK might crash on web-specific displayConfigs
      // if (paymentData.displayConfig) {
      //   options.config = { display: paymentData.displayConfig };
      // }

      RazorpayCheckout.open(options).then(async (razorpayData: any) => {
        setIsLoading(true);
        try {
          await studentService.verifyPayment({
            razorpayPaymentId: razorpayData.razorpay_payment_id,
            razorpayOrderId: razorpayData.razorpay_order_id,
            razorpaySignature: razorpayData.razorpay_signature,
          });
          Alert.alert('Success', 'Payment completed successfully');
          setCheckoutInvoice(null);
          fetchData();
        } catch (e) {
          Alert.alert('Error', 'Payment verification failed');
        } finally {
          setIsLoading(false);
        }
      }).catch((err: any) => {
        const errorMsg = err.message || err.description || JSON.stringify(err);
        Alert.alert('Payment Error', `Failed to open Razorpay.\n\nDetails: ${errorMsg}\n\nDid the API key load?: ${!!options.key}`);
        setIsLoading(false);
      });

    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to initiate checkout');
      setIsLoading(false);
    }
  };

  const renderStats = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScrollContent}>
      {/* TOTAL OUTSTANDING */}
      <View style={[styles.statCard, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]}>
        <View style={styles.statHeader}>
          <Text style={[styles.statTitle, { color: '#7F1D1D' }]}>TOTAL OUTSTANDING</Text>
          <View style={[styles.statIconBox, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="wallet" size={14} color="#FFF" />
          </View>
        </View>
        <Text style={[styles.statValue, { color: '#EF4444' }]}>₹{summary?.totalPending || 0}</Text>
        <Text style={[styles.statSubtitle, { color: '#991B1B' }]}>{(summary?.overdueCount || 0) + (summary?.pendingCount || 0)} active invoice(s) due</Text>
      </View>

      {/* TOTAL PAID */}
      <View style={[styles.statCard, { borderColor: '#D1FAE5', backgroundColor: '#F0FDF4' }]}>
        <View style={styles.statHeader}>
          <Text style={[styles.statTitle, { color: '#064E3B' }]}>TOTAL PAID (THIS TERM)</Text>
          <View style={[styles.statIconBox, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark-circle" size={14} color="#FFF" />
          </View>
        </View>
        <Text style={[styles.statValue, { color: '#10B981' }]}>₹{summary?.totalPaid || 0}</Text>
        <Text style={[styles.statSubtitle, { color: '#065F46' }]}>Successfully verified across ledger</Text>
      </View>

      {/* NEXT DUE */}
      <View style={[styles.statCard, { borderColor: '#FFEDD5', backgroundColor: '#FFF7ED' }]}>
        <View style={styles.statHeader}>
          <Text style={[styles.statTitle, { color: '#7C2D12' }]}>NEXT DUE</Text>
        </View>
        <Text style={[styles.statValue, { color: '#F97316' }]}>
          {summary?.nextDue ? new Date(summary.nextDue).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
        </Text>
        <Text style={[styles.statSubtitle, { color: '#9A3412' }]}>
          {summary?.overdueCount > 0 ? 'Payment overdue' : 'Upcoming due date'}
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      <StudentHeader 
        title="Fees"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
          <View style={styles.doubleEntryBadge}>
            <Ionicons name="sparkles" size={10} color="#7C3AED" />
            <Text style={styles.doubleEntryText}>DOUBLE-ENTRY PROTECTED</Text>
          </View>
          <Text style={styles.pageTitle}>Student Fee Dashboard</Text>
          <Text style={styles.pageSubtitle}>Manage semester invoices, view real-time breakdown, and complete secure UPI or card payments.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).springify()}>
          {renderStats()}
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'Active Invoices' && styles.tabItemActive]} 
            onPress={() => setActiveTab('Active Invoices')}
          >
            <Ionicons name="document-text" size={16} color={activeTab === 'Active Invoices' ? '#7C3AED' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'Active Invoices' && styles.tabTextActive]}>Active Invoices</Text>
            <View style={[styles.tabCountBadge, { backgroundColor: activeTab === 'Active Invoices' ? '#EDE9FE' : '#F1F5F9' }]}>
              <Text style={[styles.tabCountText, { color: activeTab === 'Active Invoices' ? '#7C3AED' : '#64748B' }]}>{(summary?.overdueCount || 0) + (summary?.pendingCount || 0)}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'Payment History' && styles.tabItemActive]} 
            onPress={() => setActiveTab('Payment History')}
          >
            <Ionicons name="receipt" size={16} color={activeTab === 'Payment History' ? '#7C3AED' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'Payment History' && styles.tabTextActive]}>Payment History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {activeTab === 'Active Invoices' && (
            <>
              {/* Filter Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {['All', 'Pending', 'Overdue', 'Paid'].map((f) => (
                  <TouchableOpacity 
                    key={f}
                    style={[styles.filterBtn, invoiceFilter === f && styles.filterBtnActive]}
                    onPress={() => setInvoiceFilter(f as any)}
                  >
                    <Text style={[styles.filterBtnText, invoiceFilter === f && styles.filterBtnTextActive]}>
                      {f === 'All' ? 'All Invoices' : f}
                    </Text>
                    {f === 'All' && <View style={[styles.filterCountBadge, { backgroundColor: '#334155' }]}><Text style={{fontSize:10, color:'#FFF'}}>{invoices.length}</Text></View>}
                    {f === 'Pending' && <View style={[styles.filterCountBadge, { backgroundColor: '#FEF3C7' }]}><Text style={{fontSize:10, color:'#D97706'}}>{summary?.pendingCount || 0}</Text></View>}
                    {f === 'Overdue' && <View style={[styles.filterCountBadge, { backgroundColor: '#FEE2E2' }]}><Text style={{fontSize:10, color:'#EF4444'}}>{summary?.overdueCount || 0}</Text></View>}
                    {f === 'Paid' && <View style={[styles.filterCountBadge, { backgroundColor: '#D1FAE5' }]}><Text style={{fontSize:10, color:'#10B981'}}>{summary?.paidCount || 0}</Text></View>}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {isLoading ? (
                <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }} />
              ) : filteredInvoices.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No active invoices.</Text>
                </View>
              ) : (
                filteredInvoices.map((inv) => (
                  <View key={inv.id} style={[styles.invoiceCardRow, { borderLeftColor: inv.displayStatus === 'Overdue' ? '#EF4444' : inv.displayStatus === 'Paid' ? '#10B981' : '#F59E0B' }]}>
                    <View style={styles.invoiceCardIcon}>
                      <Ionicons name="document-text-outline" size={24} color={inv.displayStatus === 'Overdue' ? '#EF4444' : inv.displayStatus === 'Paid' ? '#10B981' : '#7C3AED'} />
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={styles.invNumberText}>{inv.invoiceNumber}</Text>
                        <View style={[styles.statusBadgeSmall, { backgroundColor: inv.displayStatus === 'Overdue' ? '#FEF2F2' : inv.displayStatus === 'Paid' ? '#F0FDF4' : '#FFFBEB' }]}>
                          {inv.displayStatus === 'Overdue' && <Ionicons name="time-outline" size={10} color="#EF4444" style={{marginRight:2}}/>}
                          {inv.displayStatus === 'Paid' && <Ionicons name="checkmark-circle-outline" size={10} color="#10B981" style={{marginRight:2}}/>}
                          <Text style={[styles.statusBadgeText, { color: inv.displayStatus === 'Overdue' ? '#EF4444' : inv.displayStatus === 'Paid' ? '#10B981' : '#D97706' }]}>{inv.displayStatus}</Text>
                        </View>
                      </View>
                      <Text style={styles.invDescText}>{inv.description || 'Tuition fees'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                        <Text style={styles.invDateText}>Due: {new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      <Text style={styles.invAmountValue}>₹{inv.totalAmount}</Text>
                      {inv.displayStatus !== 'Paid' && (
                        <TouchableOpacity style={styles.payNowBtn} onPress={() => setCheckoutInvoice(inv)}>
                          <Ionicons name="wallet-outline" size={12} color="#FFF" />
                          <Text style={styles.payNowBtnText}>Pay Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'Payment History' && (
            <View style={styles.historyBox}>
              <View style={styles.historyBoxHeader}>
                <View style={{flexDirection: 'row', alignItems:'center'}}>
                  <Ionicons name="lock-closed" size={14} color="#64748B" style={{marginRight:6}}/>
                  <Text style={styles.historyBoxTitle}>CRYPTOGRAPHIC PAYMENT LOG</Text>
                </View>
                <TouchableOpacity onPress={fetchData} style={{flexDirection: 'row', alignItems:'center'}}>
                  <Ionicons name="refresh" size={12} color="#64748B" />
                  <Text style={styles.historyBoxRefresh}>Refresh Ledger</Text>
                </TouchableOpacity>
              </View>
              
              {/* History Header Row */}
              <View style={styles.historyRowHeader}>
                <Text style={[styles.historyColHead, {flex: 2}]}>INVOICE & DESC</Text>
                <Text style={[styles.historyColHead, {flex: 1.5}]}>TIMESTAMP</Text>
                <Text style={[styles.historyColHead, {flex: 1}]}>AMOUNT</Text>
                <Text style={[styles.historyColHead, {flex: 1.5}]}>STATUS</Text>
                <Text style={[styles.historyColHead, {flex: 1, textAlign: 'right'}]}>RECEIPT</Text>
              </View>

              {history.map((item) => (
                <View key={item.id} style={styles.historyRowItem}>
                  <View style={{flex: 2, paddingRight: 8}}>
                    <Text style={styles.histInvNum}>{item.invoiceNumber || item.paymentId}</Text>
                    <Text style={styles.histInvDesc}>{item.gatewayPaymentId || 'N/A'}</Text>
                  </View>
                  <View style={{flex: 1.5}}>
                    <Text style={styles.histText}>{new Date(item.completedAt || item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                    <Text style={styles.histTextLight}>{new Date(item.completedAt || item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.histAmount}>₹{item.amount}</Text>
                  </View>
                  <View style={{flex: 1.5}}>
                    <View style={[styles.histStatusPill, { 
                      backgroundColor: item.status === 'SUCCESS' ? '#ECFDF5' : item.status === 'FAILED' ? '#FEF2F2' : '#FFFBEB',
                      borderColor: item.status === 'SUCCESS' ? '#A7F3D0' : item.status === 'FAILED' ? '#FECACA' : '#FDE68A'
                    }]}>
                      <View style={[styles.histStatusDot, { backgroundColor: item.status === 'SUCCESS' ? '#10B981' : item.status === 'FAILED' ? '#EF4444' : '#F59E0B' }]} />
                      <Text style={[styles.histStatusText, { color: item.status === 'SUCCESS' ? '#059669' : item.status === 'FAILED' ? '#B91C1C' : '#B45309' }]}>
                        {item.status === 'SUCCESS' ? 'Success' : item.status === 'FAILED' ? 'Failed' : 'Processing'}
                      </Text>
                    </View>
                  </View>
                  <View style={{flex: 1, alignItems: 'flex-end'}}>
                    {item.status === 'SUCCESS' ? (
                      <TouchableOpacity style={styles.histReceiptBtn} onPress={() => handleReceiptPress(item.id)}>
                        {activeReceiptId === item.id ? <ActivityIndicator size="small" color="#4F46E5" /> : (
                          <>
                            <Ionicons name="download-outline" size={12} color="#4F46E5" style={{marginRight: 4}}/>
                            <Text style={styles.histReceiptText}>Receipt</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.histNoReceipt}>No receipt</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

        </View>
      </ScrollView>

      {/* Checkout Modal */}
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
                  <Ionicons name="shield-checkmark" size={12} color="#10B981" style={{marginRight:4}}/>
                  <Text style={styles.secureBadgeText}>256-Bit SSL Encrypted Checkout</Text>
                </View>
                <Text style={styles.checkoutTitle}>Fee Checkout</Text>
                <Text style={styles.checkoutSubtitle}>#{checkoutInvoice?.invoiceNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setCheckoutInvoice(null)} style={styles.closeBtnDark}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            {/* Amount Summary */}
            <View style={styles.amountSummaryBox}>
              <View>
                <Text style={styles.summaryLabel}>BASE AMOUNT DUE</Text>
                <Text style={styles.summaryValue}>₹{checkoutInvoice?.totalAmount}</Text>
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={styles.summaryLabel}>DUE DATE</Text>
                <Text style={styles.summaryValueLight}>{new Date(checkoutInvoice?.dueDate || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.methodsContainer}>
              <View style={styles.methodsHeader}>
                <Text style={styles.methodsTitle}>SELECT PAYMENT METHOD</Text>
                <View style={styles.recommendedBadge}>
                  <Ionicons name="sparkles" size={10} color="#059669" style={{marginRight:4}}/>
                  <Text style={styles.recommendedText}>RECOMMENDED UPI FOR 0% FEES</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.methodCard, paymentMode === 'UPI' && styles.methodCardActive]}
                onPress={() => setPaymentMode('UPI')}
              >
                {paymentMode === 'UPI' && <View style={styles.zeroFeePill}><Ionicons name="sparkles" size={10} color="#FFF" style={{marginRight:4}}/><Text style={{fontSize:10, color:'#FFF', fontWeight:'800'}}>Zero Extra Charges</Text></View>}
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View style={[styles.methodIconBox, { backgroundColor: paymentMode === 'UPI' ? '#10B981' : '#F1F5F9' }]}>
                    <Ionicons name="phone-portrait-outline" size={20} color={paymentMode === 'UPI' ? '#FFF' : '#64748B'} />
                  </View>
                  <View style={{flex: 1, paddingLeft: 12}}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={styles.methodTitle}>UPI Instant Pay</Text>
                      <View style={styles.feeBadgeGreen}><Text style={styles.feeBadgeTextGreen}>0% Fee</Text></View>
                    </View>
                    <Text style={styles.methodDesc}>Pay via Google Pay, PhonePe, Paytm, BHIM or any UPI ID</Text>
                    <View style={{flexDirection: 'row', marginTop: 6, alignItems: 'center'}}>
                      <Text style={styles.supportedText}>SUPPORTED:</Text>
                      <Text style={styles.supportedTag}>GPay</Text>
                      <Text style={styles.supportedTag}>PhonePe</Text>
                      <Text style={styles.supportedTag}>Paytm</Text>
                    </View>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <View style={[styles.radioOuter, paymentMode === 'UPI' && styles.radioOuterActive]}>
                      {paymentMode === 'UPI' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.methodAmount}>₹{checkoutInvoice?.totalAmount}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.methodCard, paymentMode === 'CARD' && styles.methodCardActive]}
                onPress={() => setPaymentMode('CARD')}
              >
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View style={[styles.methodIconBox, { backgroundColor: paymentMode === 'CARD' ? '#7C3AED' : '#F1F5F9' }]}>
                    <Ionicons name="card-outline" size={20} color={paymentMode === 'CARD' ? '#FFF' : '#64748B'} />
                  </View>
                  <View style={{flex: 1, paddingLeft: 12}}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={styles.methodTitle}>Cards, Net Banking & Wallets</Text>
                      <View style={styles.feeBadgePurple}><Text style={styles.feeBadgeTextPurple}>2% Fee</Text></View>
                    </View>
                    <Text style={styles.methodDesc}>Credit/Debit cards, Net Banking & Digital Wallets</Text>
                    <View style={{flexDirection: 'row', marginTop: 6, alignItems: 'center'}}>
                      <Ionicons name="wallet-outline" size={12} color="#64748B" style={{marginRight:4}}/>
                      <Text style={styles.supportedText}>2% platform convenience fee applies</Text>
                    </View>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <View style={[styles.radioOuter, paymentMode === 'CARD' && styles.radioOuterActive]}>
                      {paymentMode === 'CARD' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.methodAmount}>₹{checkoutInvoice?.totalAmount}</Text>
                    <Text style={{fontSize: 9, color: '#94A3B8', marginTop: 2}}>(+₹{(checkoutInvoice?.totalAmount * 0.02).toFixed(2)} fee)</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bill Breakdown */}
            <View style={styles.billBox}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Base Fee Amount</Text>
                <Text style={styles.billValue}>₹{checkoutInvoice?.totalAmount}</Text>
              </View>
              <View style={styles.billRow}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                  <Text style={styles.billLabel}>Convenience Fee</Text>
                  {paymentMode === 'UPI' && <View style={styles.exemptBadge}><Text style={styles.exemptBadgeText}>0% Exempt</Text></View>}
                </View>
                <Text style={[styles.billValue, paymentMode === 'UPI' && { color: '#10B981' }]}>
                  {paymentMode === 'UPI' ? 'FREE' : `₹${(checkoutInvoice?.totalAmount * 0.02).toFixed(2)}`}
                </Text>
              </View>
              <View style={styles.billDivider} />
              <View style={styles.billRow}>
                <View>
                  <Text style={styles.billTotalLabel}>Total Payable</Text>
                  <Text style={styles.billTotalSub}>All taxes & charges included</Text>
                </View>
                <Text style={styles.billTotalValue}>
                  ₹{paymentMode === 'UPI' ? checkoutInvoice?.totalAmount : (checkoutInvoice?.totalAmount * 1.02).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Pay Button */}
            <TouchableOpacity 
              style={styles.proceedBtn}
              onPress={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator size="small" color="#FFF" /> : (
                <>
                  <Ionicons name="lock-closed-outline" size={16} color="#FFF" style={{marginRight:8}}/>
                  <Text style={styles.proceedBtnText}>Proceed to Pay ₹{paymentMode === 'UPI' ? checkoutInvoice?.totalAmount : (checkoutInvoice?.totalAmount * 1.02).toFixed(2)}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{marginLeft:8}}/>
                </>
              )}
            </TouchableOpacity>

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

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40 },

  pageTitleWrapper: { paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  doubleEntryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  doubleEntryText: { fontSize: 9, fontWeight: '800', color: '#7C3AED', marginLeft: 4, letterSpacing: 0.5 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 6 },
  pageSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 20 },

  statsScrollContent: { paddingHorizontal: 20, paddingBottom: 10, gap: 16 },
  statCard: { width: 220, padding: 20, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statIconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '900', marginBottom: 4 },
  statSubtitle: { fontSize: 11, fontWeight: '500' },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginTop: 16 },
  tabItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: 16 },
  tabItemActive: { borderBottomColor: '#7C3AED' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748B', marginLeft: 6 },
  tabTextActive: { color: '#7C3AED' },
  tabCountBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  tabCountText: { fontSize: 10, fontWeight: '800' },

  listContainer: { paddingHorizontal: 20, marginTop: 16 },

  filterRow: { paddingBottom: 16, gap: 10 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  filterBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  filterBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterBtnTextActive: { color: '#FFFFFF' },
  filterCountBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 6 },

  invoiceCardRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  invoiceCardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  invNumberText: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginRight: 8 },
  statusBadgeSmall: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  invDescText: { fontSize: 12, color: '#64748B' },
  invDateText: { fontSize: 11, color: '#94A3B8', marginLeft: 4, fontWeight: '500' },
  invAmountValue: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  payNowBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  payNowBtnText: { fontSize: 11, fontWeight: '700', color: '#FFF', marginLeft: 4 },

  historyBox: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  historyBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#F8FAFC' },
  historyBoxTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  historyBoxRefresh: { fontSize: 11, fontWeight: '600', color: '#64748B', marginLeft: 4 },
  historyRowHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  historyColHead: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  historyRowItem: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  histInvNum: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  histInvDesc: { fontSize: 10, color: '#94A3B8' },
  histText: { fontSize: 11, fontWeight: '600', color: '#334155', marginBottom: 2 },
  histTextLight: { fontSize: 10, color: '#94A3B8' },
  histAmount: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  histStatusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
  histStatusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  histStatusText: { fontSize: 10, fontWeight: '700' },
  histReceiptBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  histReceiptText: { fontSize: 10, fontWeight: '700', color: '#4F46E5' },
  histNoReceipt: { fontSize: 10, color: '#94A3B8', fontStyle: 'italic' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#64748B', fontWeight: '500' },

  // Checkout Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
  checkoutModalContent: { width: width * 0.9, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' },
  checkoutHeader: { backgroundColor: '#1E1B4B', padding: 20, flexDirection: 'row', justifyContent: 'space-between' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  secureBadgeText: { fontSize: 9, color: '#10B981', fontWeight: '700' },
  checkoutTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 2 },
  checkoutSubtitle: { fontSize: 12, color: '#818CF8' },
  closeBtnDark: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  
  amountSummaryBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1E1B4B', paddingHorizontal: 20, paddingBottom: 20 },
  summaryLabel: { fontSize: 10, color: '#818CF8', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 28, color: '#FFFFFF', fontWeight: '900' },
  summaryValueLight: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },

  methodsContainer: { padding: 20, backgroundColor: '#FFFFFF' },
  methodsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  methodsTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  recommendedBadge: { flexDirection: 'row', alignItems: 'center' },
  recommendedText: { fontSize: 9, color: '#059669', fontWeight: '800', letterSpacing: 0.5 },
  
  methodCard: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12, position: 'relative' },
  methodCardActive: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  zeroFeePill: { position: 'absolute', top: -10, right: 16, backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, zIndex: 10 },
  methodIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  methodTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginRight: 8 },
  feeBadgeGreen: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  feeBadgeTextGreen: { fontSize: 9, fontWeight: '800', color: '#059669' },
  feeBadgePurple: { backgroundColor: '#EDE9FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  feeBadgeTextPurple: { fontSize: 9, fontWeight: '800', color: '#7C3AED' },
  methodDesc: { fontSize: 11, color: '#64748B', marginTop: 4, lineHeight: 16 },
  supportedText: { fontSize: 9, color: '#94A3B8', fontWeight: '700', marginRight: 6 },
  supportedTag: { fontSize: 9, color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 4, fontWeight: '600' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  radioOuterActive: { borderColor: '#10B981' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  methodAmount: { fontSize: 14, fontWeight: '800', color: '#0F172A' },

  billBox: { marginHorizontal: 20, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  billLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  billValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  exemptBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  exemptBadgeText: { fontSize: 9, fontWeight: '700', color: '#059669' },
  billDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  billTotalLabel: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  billTotalSub: { fontSize: 10, color: '#94A3B8' },
  billTotalValue: { fontSize: 16, fontWeight: '900', color: '#4F46E5' },

  proceedBtn: { flexDirection: 'row', backgroundColor: '#10B981', margin: 20, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  proceedBtnText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
});

export default FeesScreen;
