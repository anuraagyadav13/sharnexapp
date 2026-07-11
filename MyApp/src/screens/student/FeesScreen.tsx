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

type FeesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Fees'>;

interface Props {
  navigation: FeesScreenNavigationProp;
}

const INVOICES = [
  { id: 1, inv: 'INV-2026-0115-7822', title: 'January 2026 Tuition Fee', amount: '₹15,000', date: 'Jan 31, 2026', status: 'Pending' },
  { id: 2, inv: 'INV-2026-0115-7822', title: 'January 2026 Tuition Fee', amount: '₹15,000', date: 'Jan 31, 2026', status: 'Overdue' },
  { id: 3, inv: 'INV-2026-0115-7822', title: 'January 2026 Tuition Fee', amount: '₹15,000', date: 'Jan 31, 2026', status: 'Overdue' },
  { id: 4, inv: 'INV-2026-0115-7822', title: 'January 2026 Tuition Fee', amount: '₹15,000', date: 'Jan 31, 2026', status: 'Pending' },
];

const HISTORY = [
  { id: 1, payId: 'PAY-2023-0920-1122', amount: '₹15,000', date: 'September 20, 2023', method: 'Credit Card', invoiceFor: 'INV-2023-0915-4455' },
  { id: 2, payId: 'PAY-2023-0920-1122', amount: '₹15,000', date: 'September 20, 2023', method: 'Credit Card', invoiceFor: 'INV-2023-0915-4455' },
  { id: 3, payId: 'PAY-2023-0920-1122', amount: '₹15,000', date: 'September 20, 2023', method: 'Credit Card', invoiceFor: 'INV-2023-0915-4455' },
];

const FeesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Invoices' | 'History'>('Invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReceiptPress = async (paymentId: string) => {
    try {
      setActiveReceiptId(paymentId);
      const res = await studentService.getReceipt(paymentId);
      // Target the 'data' field inside the response
      const receiptData = res.normalized?.data?.data || res.data?.data || res.data;
      setSelectedReceipt(receiptData);
    } catch (err) {
      console.error('Failed to fetch receipt:', err);
      Alert.alert('Error', 'Could not load receipt details');
    } finally {
      setActiveReceiptId(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (activeTab === 'Invoices') {
          const res = await studentService.getInvoices();
          // Handle multiple response formats
          const responseData = res.data?.data || res.data || {};
          const invoicesArray = responseData.invoices || res.data?.invoices || [];
          setInvoices(Array.isArray(invoicesArray) ? invoicesArray : []);
          setSummary(responseData.summary || { totalPending: 0, pendingCount: 0, overdueCount: 0, collectionRate: 0 });
        } else {
          const res = await studentService.getPaymentHistory();
          // Handle multiple response formats
          const responseData = res.data?.data || res.data || {};
          const paymentsArray = responseData.payments || res.data?.payments || [];
          setHistory(Array.isArray(paymentsArray) ? paymentsArray : []);
        }
      } catch (error: any) {
        console.error('Failed to fetch fee data:', error);
        setError('Failed to load fee information');
        setInvoices([]);
        setHistory([]);
        setSummary({ totalPending: 0, pendingCount: 0, overdueCount: 0, collectionRate: 0 });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const getStatusDisplay = React.useCallback((item: any) => {
    if (item.status === 'PAID') return 'Paid';
    if (item.status === 'PENDING') {
      const now = new Date();
      if (item.dueDate && new Date(item.dueDate) < now) return 'Overdue';
      return 'Pending';
    }
    return item.status;
  }, []);

  const processedInvoices = React.useMemo(() => {
    return invoices.map(item => ({
      ...item,
      displayStatus: getStatusDisplay(item)
    }));
  }, [invoices, getStatusDisplay]);

  const processedHistory = React.useMemo(() => {
    return history.map(item => ({
      ...item,
      displayDate: new Date(item.completedAt || item.createdAt).toLocaleDateString()
    }));
  }, [history]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : (selectedInvoice || selectedReceipt ? "light-content" : "dark-content")} backgroundColor={isDarkMode ? theme.background : (selectedInvoice || selectedReceipt ? 'rgba(0,0,0,0.5)' : theme.background)} />

      {/* Global Header */}
      <StudentHeader 
        title="Fees"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Title */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <Text style={styles.pageTitle}>Fee Portal</Text>
           <Text style={styles.pageSubtitle}>Manage your dues and payment history</Text>
        </Animated.View>

        {/* Hero Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.heroCard}>
           <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
              <Ionicons name="wallet-outline" size={14} color="#FFFFFF" style={{marginRight: 6}} />
              <Text style={styles.heroLabel}>Total Fee Due</Text>
           </View>
           <Text style={styles.heroAmount}>₹ {summary?.totalPending || 0}</Text>
           
           <View style={styles.heroDivider} />

           <View style={styles.heroBottomRow}>
             <View>
                <Text style={styles.heroLabel}>Overall Status</Text>
                <Text style={styles.heroDate}>{summary?.overdueCount > 0 ? `${summary.overdueCount} Overdue Invoices` : 'Up to date'}</Text>
             </View>
             <View style={[styles.heroPill, { backgroundColor: summary?.overdueCount > 0 ? '#F43F5E' : '#10B981' }]}>
                <Text style={styles.heroPillText}>{summary?.pendingCount || 0} Pending</Text>
             </View>
           </View>
        </Animated.View>

        {/* Segmented Tab */}
        <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.tabContainer}>
           <TouchableOpacity 
              style={styles.tabItem} 
              activeOpacity={0.7} 
              onPress={() => setActiveTab('Invoices')}
           >
              <Ionicons name="receipt" size={16} color={activeTab === 'Invoices' ? theme.primary : theme.subtext} style={{marginRight: 6}} />
              <Text style={[styles.tabText, activeTab === 'Invoices' && styles.tabTextActive]}>Invoices</Text>
              {activeTab === 'Invoices' && <View style={styles.tabIndicator} />}
           </TouchableOpacity>

           <TouchableOpacity 
              style={styles.tabItem} 
              activeOpacity={0.7} 
              onPress={() => setActiveTab('History')}
           >
              <Ionicons name="time-outline" size={18} color={activeTab === 'History' ? theme.primary : theme.subtext} style={{marginRight: 6}} />
              <Text style={[styles.tabText, activeTab === 'History' && styles.tabTextActive]}>History</Text>
              {activeTab === 'History' && <View style={styles.tabIndicator} />}
           </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.listContainer}>
           <Text style={styles.listSectionTitle}>{activeTab === 'Invoices' ? 'All Invoices' : 'Payment History'}</Text>

           {isLoading ? (
             <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
           ) : error ? (
             <View style={styles.emptyContainer}>
               <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
               <Text style={styles.emptyText}>{error}</Text>
             </View>
           ) : activeTab === 'Invoices' ? (
             invoices.length === 0 ? (
               <View style={styles.emptyContainer}>
                 <Ionicons name="receipt-outline" size={60} color={theme.subtext} />
                 <Text style={styles.emptyText}>No invoices found</Text>
               </View>
             ) : (
               invoices.map((item, index) => {
                 const displayStatus = getStatusDisplay(item);
                 return (
                   <ScaleButton 
                     key={item.id} 
                     onPress={() => setSelectedInvoice(item)}
                     activeOpacity={0.9} 
                     scaleTo={0.97} 
                     style={[
                       styles.invoiceCard, 
                       { borderLeftColor: displayStatus === 'Paid' ? '#10B981' : displayStatus === 'Overdue' ? '#F43F5E' : '#3B82F6' }
                     ]}
                   >
                     <View style={styles.invRowBeetween}>
                       <Text style={styles.invNumber}>{item.invoiceNumber}</Text>
                       <View style={[
                         styles.statusPill, 
                         displayStatus === 'Paid' ? styles.pillPaid : displayStatus === 'Pending' ? styles.pillPending : styles.pillOverdue
                       ]}>
                         <Text style={[
                           styles.pillText, 
                           displayStatus === 'Paid' ? styles.pillTextPaid : displayStatus === 'Pending' ? styles.pillTextPending : styles.pillTextOverdue
                         ]}>
                           {displayStatus.toUpperCase()}
                         </Text>
                       </View>
                     </View>
                     
                     <Text style={styles.invTitle}>{item.description || `Fee Invoice - ${item.month || 'General'}`}</Text>
                     
                     <View style={[styles.invRowBeetween, { marginTop: 14 }]}>
                       <Text style={styles.invAmount}>₹ {item.totalAmount}</Text>
                       <Text style={styles.invDate}>{new Date(item.dueDate).toLocaleDateString()}</Text>
                     </View>
                   </ScaleButton>
                 );
               })
             )
           ) : (
             history.length === 0 ? (
               <View style={styles.emptyContainer}>
                 <Ionicons name="time-outline" size={60} color="#E5E7EB" />
                 <Text style={styles.emptyText}>No transaction history</Text>
               </View>
             ) : (
               history.map((item, index) => (
                 <View key={item.id} style={styles.historyCard}>
                   <View style={[styles.invRowBeetween, {marginBottom: 8}]}>
                     <Text style={styles.historyPayId}>{item.gatewayPaymentId || `PAY-${item.id.toString().slice(-8)}`}</Text>
                     <Text style={styles.historyAmount}>₹ {item.amount}</Text>
                   </View>
                   <View style={[styles.invRowBeetween, {marginBottom: 16}]}>
                     <Text style={styles.historyDate}>{new Date(item.completedAt || item.createdAt).toLocaleDateString()}</Text>
                     <View style={{flexDirection: 'row', alignItems: 'center'}}>
                       <Ionicons name="card" size={12} color={theme.text} style={{marginRight: 6}} />
                       <Text style={styles.historyMethod}>{item.status}</Text>
                     </View>
                   </View>
                   
                   <View style={styles.historyDivider} />
                   
                   <View style={styles.invRowBeetween}>
                     <Text style={styles.historyFor}>For: <Text style={{fontWeight: '700', color: theme.text}}>{item.invoiceNumber}</Text></Text>
                      <TouchableOpacity 
                        style={styles.receiptPill} 
                        activeOpacity={0.8}
                        onPress={() => handleReceiptPress(item.id)}
                        disabled={!!activeReceiptId}
                      >
                        {activeReceiptId === item.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="receipt" size={11} color="#FFFFFF" style={{marginRight: 4}} />
                            <Text style={styles.receiptText}>Receipt</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                 </View>
               ))
             )
           )}
        </Animated.View>

      </ScrollView>

      <Modal
        visible={!!selectedInvoice}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedInvoice(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedInvoice(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                 {selectedInvoice && (
                   <>
                     <View style={styles.modalHeaderRow}>
                       <View style={{ flex: 1 }}>
                         <Text style={styles.modalTitle}>{selectedInvoice.inv}</Text>
                         <Text style={styles.modalSubtitle}>{selectedInvoice.title}</Text>
                       </View>
                        <TouchableOpacity hitSlop={{top:20, bottom:20, left:20, right:20}} onPress={() => setSelectedInvoice(null)} style={styles.closeBtn}>
                          <Ionicons name="close-outline" size={24} color={theme.text} />
                        </TouchableOpacity>
                     </View>

                     <View style={styles.modalDetailContainer}>
                       <View style={styles.modalDetailRow}>
                         <Text style={styles.modalLabel}>Status</Text>
                         <View style={[
                           styles.statusPill, 
                           getStatusDisplay(selectedInvoice) === 'Paid' ? styles.pillPaid : 
                           getStatusDisplay(selectedInvoice) === 'Pending' ? styles.pillPending : styles.pillOverdue
                         ]}>
                           <Text style={[
                             styles.pillText, 
                             getStatusDisplay(selectedInvoice) === 'Paid' ? styles.pillTextPaid : 
                             getStatusDisplay(selectedInvoice) === 'Pending' ? styles.pillTextPending : styles.pillTextOverdue
                           ]}>
                             {getStatusDisplay(selectedInvoice).toUpperCase()}
                           </Text>
                         </View>
                       </View>
                       
                       <View style={styles.modalDetailRow}>
                         <Text style={styles.modalLabel}>Issue Date</Text>
                         <Text style={styles.modalValueBold}>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</Text>
                       </View>

                       <View style={styles.modalDetailRow}>
                         <Text style={styles.modalLabel}>Due Date</Text>
                         <Text style={styles.modalValueBold}>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</Text>
                       </View>

                       <View style={[styles.modalDetailRow, { borderBottomWidth: 0, marginBottom: 24, paddingBottom: 0 }]}>
                         <Text style={styles.modalLabel}>Total Amount</Text>
                         <Text style={styles.modalAmountBigger}>₹ {selectedInvoice.totalAmount}</Text>
                       </View>

                       {selectedInvoice.status !== 'PAID' && (
                         <ScaleButton activeOpacity={0.9} scaleTo={0.96} style={styles.payCard}>
                             <View style={styles.payIconCircle}>
                                <Ionicons name="card" size={22} color="#FFFFFF" />
                             </View>
                             <Text style={styles.payBtnText}>Pay Full Amount</Text>
                         </ScaleButton>
                       )}

                     </View>
                   </>
                 )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={!!selectedReceipt}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(300)} style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
            {selectedReceipt && (
              <ScrollView showsVerticalScrollIndicator={false}>
                 <View style={[styles.receiptHeader, { backgroundColor: theme.primary }]}>
                  <View style={styles.receiptHeaderTop}>
                    <Ionicons name="school" size={24} color="#FFFFFF" />
                    <TouchableOpacity onPress={() => setSelectedReceipt(null)}>
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.receiptInstName}>{selectedReceipt.institution?.name}</Text>
                  <Text style={styles.receiptInstAddr}>{selectedReceipt.institution?.address}</Text>
                  <View style={styles.receiptBadge}>
                    <Text style={styles.receiptBadgeText}>OFFICIAL RECEIPT</Text>
                  </View>
                </View>

                {/* Receipt Details */}
                <View style={styles.receiptBody}>
                  <View style={styles.receiptRow}>
                    <View style={styles.receiptCol}>
                      <Text style={styles.receiptLabel}>Receipt ID</Text>
                      <Text style={styles.receiptValue}>{selectedReceipt.receiptId}</Text>
                    </View>
                    <View style={[styles.receiptCol, { alignItems: 'flex-end' }]}>
                      <Text style={styles.receiptLabel}>Date</Text>
                      <Text style={styles.receiptValue}>{new Date(selectedReceipt.date).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptCol}>
                    <Text style={styles.receiptLabel}>Student Name</Text>
                    <Text style={styles.receiptValueBig}>{selectedReceipt.student?.name}</Text>
                    <Text style={styles.receiptSubValue}>Roll No: {selectedReceipt.student?.rollNo} • Class: {selectedReceipt.student?.grade}</Text>
                  </View>

                  <View style={[styles.receiptDivider, { marginVertical: 20 }]} />

                  <Text style={styles.receiptLabel}>Payment Details</Text>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDesc}>{selectedReceipt.description}</Text>
                    <Text style={styles.receiptAmount}>₹ {selectedReceipt.amount}</Text>
                  </View>

                  <View style={styles.receiptTotalBox}>
                    <Text style={styles.receiptTotalLabel}>TOTAL PAID</Text>
                    <Text style={styles.receiptTotalValue}>₹ {selectedReceipt.amount}</Text>
                  </View>

                  <View style={styles.receiptFooter}>
                    <Text style={styles.receiptFooterText}>Transaction ID: {selectedReceipt.transactionId}</Text>
                    <Text style={styles.receiptFooterText}>Status: {selectedReceipt.status}</Text>
                    <View style={styles.receiptCheckCircle}>
                      <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                    </View>
                    <Text style={styles.verifiedText}>Verified by Sharnex</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </Animated.View>
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
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 16,
    backgroundColor: theme.surface, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary, 
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: theme.primary, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  /* Hero Card */
  heroCard: {
    backgroundColor: theme.primary, 
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroLabel: {
    fontSize: 11,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.2,
    marginVertical: 16,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroDate: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 2,
  },
  heroPill: {
    backgroundColor: '#F43F5E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroPillText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Tab Segment */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    paddingVertical: 6,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.subtext,
  },
  tabTextActive: {
    color: theme.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -6,
    width: '40%',
    height: 3,
    backgroundColor: theme.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  /* List Container */
  listContainer: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 16,
  },
  invoiceCard: {
    backgroundColor: theme.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden', 
  },
  invRowBeetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.text,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillPending: {
    backgroundColor: theme.isDarkMode ? '#78350F30' : '#FEF3C7', 
  },
  pillOverdue: {
    backgroundColor: theme.isDarkMode ? '#9D174D30' : '#FCE7F3', 
  },
  pillPaid: {
    backgroundColor: theme.isDarkMode ? '#065F4630' : '#D1FAE5',
  },
  pillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  pillTextPending: {
    color: '#D97706',
  },
  pillTextOverdue: {
    color: '#F43F5E',
  },
  pillTextPaid: {
    color: '#059669',
  },
  invTitle: {
    fontSize: 10,
    color: theme.subtext,
    marginTop: 6,
    fontWeight: '500',
  },
  invAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.primary,
  },
  invDate: {
    fontSize: 10,
    color: theme.subtext,
    fontWeight: '500',
  },
  
  /* History Card Styles */
  historyCard: {
    backgroundColor: theme.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  historyPayId: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.text,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.primary,
  },
  historyDate: {
    fontSize: 10,
    color: theme.subtext,
    fontWeight: '500',
  },
  historyMethod: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.text,
  },
  historyDivider: {
    height: 1,
    backgroundColor: theme.border, 
    marginBottom: 12,
  },
  historyFor: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
  },
  receiptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  receiptText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  /* Modal Popup Styles */
  modalOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 2,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
  },
  modalDetailContainer: {
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalLabel: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
  },
  modalValueBold: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
  },
  modalAmountBigger: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  payCard: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  payIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  payBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.subtext,
    marginTop: 16,
  },
  /* Receipt Modal Specific Styles */
  receiptHeader: {
    padding: 24,
    alignItems: 'center',
  },
  receiptHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  receiptInstName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  receiptInstAddr: {
    fontSize: 11,
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  receiptBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 16,
  },
  receiptBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  receiptBody: {
    padding: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptCol: {
    flex: 1,
  },
  receiptLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.subtext,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  receiptValueBig: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  receiptSubValue: {
    fontSize: 11,
    color: theme.subtext,
    marginTop: 2,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 16,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  receiptDesc: {
    fontSize: 13,
    color: theme.subtext,
    flex: 1,
    paddingRight: 20,
  },
  receiptAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  receiptTotalBox: {
    backgroundColor: theme.isDarkMode ? '#334155' : '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  receiptTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.subtext,
  },
  receiptTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.primary,
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  receiptFooterText: {
    fontSize: 10,
    color: theme.subtext,
    marginBottom: 4,
  },
  receiptCheckCircle: {
    marginTop: 16,
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
  },
});

export default FeesScreen;
