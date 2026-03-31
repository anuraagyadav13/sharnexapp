import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';

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
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Invoices' | 'History'>('Invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<typeof INVOICES[0] | null>(null);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={selectedInvoice ? "light-content" : "dark-content"} backgroundColor={selectedInvoice ? 'rgba(0,0,0,0.5)' : '#FAF9F9'} />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <ScaleButton 
          style={styles.menuHandle} 
          onPress={() => setDrawerOpen(true)}
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Welcome back, Anurag</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>A</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Title */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <Text style={styles.pageTitle}>FeePortal</Text>
           <Text style={styles.pageSubtitle}>Welcome back! Manage your fees easily</Text>
        </Animated.View>

        {/* Hero Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.heroCard}>
           <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
              <Ionicons name="wallet-outline" size={14} color="#FFFFFF" style={{marginRight: 6}} />
              <Text style={styles.heroLabel}>Total Fee Due</Text>
           </View>
           <Text style={styles.heroAmount}>₹ 4000</Text>
           
           <View style={styles.heroDivider} />

           <View style={styles.heroBottomRow}>
             <View>
                <Text style={styles.heroLabel}>Due Date</Text>
                <Text style={styles.heroDate}>October 31, 20233</Text>
             </View>
             <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>5 Days Left</Text>
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
              <Ionicons name="receipt" size={16} color={activeTab === 'Invoices' ? '#3B82F6' : '#9CA3AF'} style={{marginRight: 6}} />
              <Text style={[styles.tabText, activeTab === 'Invoices' && styles.tabTextActive]}>Invoices</Text>
              {activeTab === 'Invoices' && <View style={styles.tabIndicator} />}
           </TouchableOpacity>

           <TouchableOpacity 
              style={styles.tabItem} 
              activeOpacity={0.7} 
              onPress={() => setActiveTab('History')}
           >
              <Ionicons name="time-outline" size={18} color={activeTab === 'History' ? '#3B82F6' : '#9CA3AF'} style={{marginRight: 6}} />
              <Text style={[styles.tabText, activeTab === 'History' && styles.tabTextActive]}>History</Text>
              {activeTab === 'History' && <View style={styles.tabIndicator} />}
           </TouchableOpacity>
        </Animated.View>

        {/* List Container */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.listContainer}>
           <Text style={styles.listSectionTitle}>{activeTab === 'Invoices' ? 'All Invoices' : 'Payment History'}</Text>

           {activeTab === 'Invoices' ? (
             INVOICES.map((item, index) => (
               <ScaleButton 
                 key={`inv-${index}`} 
                 onPress={() => setSelectedInvoice(item)}
                 activeOpacity={0.9} 
                 scaleTo={0.97} 
                 style={[
                   styles.invoiceCard, 
                   { borderLeftColor: item.status === 'Pending' ? '#3B82F6' : '#F43F5E' }
                 ]}
               >
                 <View style={styles.invRowBeetween}>
                   <Text style={styles.invNumber}>{item.inv}</Text>
                   <View style={[
                     styles.statusPill, 
                     item.status === 'Pending' ? styles.pillPending : styles.pillOverdue
                   ]}>
                     <Text style={[
                       styles.pillText, 
                       item.status === 'Pending' ? styles.pillTextPending : styles.pillTextOverdue
                     ]}>
                       {item.status}
                     </Text>
                   </View>
                 </View>
                 
                 <Text style={styles.invTitle}>{item.title}</Text>
                 
                 <View style={[styles.invRowBeetween, { marginTop: 14 }]}>
                   <Text style={styles.invAmount}>{item.amount}</Text>
                   <Text style={styles.invDate}>{item.date}</Text>
                 </View>
               </ScaleButton>
             ))
           ) : (
             HISTORY.map((item, index) => (
               <View key={`hist-${index}`} style={styles.historyCard}>
                 <View style={[styles.invRowBeetween, {marginBottom: 8}]}>
                   <Text style={styles.historyPayId}>{item.payId}</Text>
                   <Text style={styles.historyAmount}>{item.amount}</Text>
                 </View>
                 <View style={[styles.invRowBeetween, {marginBottom: 16}]}>
                   <Text style={styles.historyDate}>{item.date}</Text>
                   <View style={{flexDirection: 'row', alignItems: 'center'}}>
                     <Ionicons name="card" size={12} color="#111827" style={{marginRight: 6}} />
                     <Text style={styles.historyMethod}>{item.method}</Text>
                   </View>
                 </View>
                 
                 <View style={styles.historyDivider} />
                 
                 <View style={styles.invRowBeetween}>
                   <Text style={styles.historyFor}>For: <Text style={{fontWeight: '700', color: '#111827'}}>{item.invoiceFor}</Text></Text>
                   <TouchableOpacity style={styles.receiptPill} activeOpacity={0.8}>
                     <Ionicons name="receipt" size={11} color="#FFFFFF" style={{marginRight: 4}} />
                     <Text style={styles.receiptText}>Receipt</Text>
                   </TouchableOpacity>
                 </View>
               </View>
             ))
           )}
        </Animated.View>

      </ScrollView>

      {/* Invoice Popup Modal */}
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
                     {/* Header */}
                     <View style={styles.modalHeaderRow}>
                       <View style={{ flex: 1 }}>
                         <Text style={styles.modalTitle}>{selectedInvoice.inv}</Text>
                         <Text style={styles.modalSubtitle}>{selectedInvoice.title}</Text>
                       </View>
                       <TouchableOpacity hitSlop={{top:20, bottom:20, left:20, right:20}} onPress={() => setSelectedInvoice(null)} style={styles.closeBtn}>
                         <Ionicons name="close-outline" size={24} color="#111827" />
                       </TouchableOpacity>
                     </View>

                     {/* Details Area */}
                     <View style={styles.modalDetailContainer}>
                       <View style={styles.modalDetailRow}>
                         <Text style={styles.modalLabel}>Status</Text>
                         <View style={[styles.statusPill, selectedInvoice.status === 'Pending' ? styles.pillPending : styles.pillOverdue]}>
                           <Text style={[styles.pillText, selectedInvoice.status === 'Pending' ? styles.pillTextPending : styles.pillTextOverdue]}>
                             {selectedInvoice.status}
                           </Text>
                         </View>
                       </View>
                       
                       <View style={styles.modalDetailRow}>
                         <Text style={styles.modalLabel}>Issue Date</Text>
                         <Text style={styles.modalValueBold}>January 15, 2026</Text>
                       </View>

                       <View style={styles.modalDetailRow}>
                         <Text style={styles.modalLabel}>Due Date</Text>
                         <Text style={styles.modalValueBold}>October 31, 2023</Text>
                       </View>

                       <View style={[styles.modalDetailRow, { borderBottomWidth: 0, marginBottom: 24, paddingBottom: 0 }]}>
                         <Text style={styles.modalLabel}>Amount</Text>
                         <Text style={styles.modalAmountBigger}>{selectedInvoice.amount}</Text>
                       </View>

                       {/* Interactive Pay Card within Modal */}
                       <ScaleButton activeOpacity={0.9} scaleTo={0.96} style={styles.payCard}>
                           <View style={styles.payIconCircle}>
                              <Ionicons name="card" size={22} color="#FFFFFF" />
                           </View>
                           <Text style={styles.payBtnText}>Pay This Invoice</Text>
                       </ScaleButton>

                     </View>
                   </>
                 )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAF9F9' },
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 16,
    backgroundColor: '#FFFFFF', 
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
    color: '#4F46E5', 
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  /* Hero Card */
  heroCard: {
    backgroundColor: '#4F46E5', 
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#4F46E5',
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
    backgroundColor: '#FFFFFF',
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
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -6,
    width: '40%',
    height: 3,
    backgroundColor: '#3B82F6',
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
    color: '#111827',
    marginBottom: 16,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden', // Ensures the border Left cleanly curves exactly with the main radius
  },
  invRowBeetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillPending: {
    backgroundColor: '#FEF3C7', 
  },
  pillOverdue: {
    backgroundColor: '#FCE7F3', 
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
  invTitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
  },
  invAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B82F6',
  },
  invDate: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  
  /* History Card Styles */
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  historyPayId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B82F6',
  },
  historyDate: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  historyMethod: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#F3F4F6', 
    marginBottom: 12,
  },
  historyFor: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  receiptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4E5EEE',
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
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  closeBtn: {
    padding: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
  },
  modalDetailContainer: {
    // any internal padding if needed
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalValueBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  modalAmountBigger: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  payCard: {
    backgroundColor: '#FFFFFF',
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
    borderColor: '#FAFAFA',
  },
  payIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  payBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  }

});

export default FeesScreen;
