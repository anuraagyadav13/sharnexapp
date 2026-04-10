import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput,
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

const PrincipalFeesScreen = ({ navigation }: any) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState('All Fees');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalFees: 0,
    totalCollected: 0,
    collectionRate: 0,
    pendingAmount: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Fee Modal States
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [feeItems, setFeeItems] = useState([{ description: '', amount: '' }]);
  const [dueDate, setDueDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Date Picker States
  const [datePickerTarget, setDatePickerTarget] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch Fees Data
  useEffect(() => {
    const fetchFees = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiClient.get(ENDPOINTS.PRINCIPAL.FEES);
        const data = res.data.data || res.data;
        
        setInvoices(data.invoices || []);
        setSummary({
          totalFees: data.summary?.totalFees || 0,
          totalCollected: data.summary?.totalCollected || 0,
          collectionRate: data.summary?.collectionRate || 0,
          pendingAmount: data.summary?.pendingAmount || 0
        });
      } catch (error: any) {
        console.error('Failed to fetch fees:', error);
        setError('Failed to load fees data');
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFees();
  }, []);

  // Handle Create Fee Form Submission
  const handleCreateFee = async () => {
    if (!selectedClass || selectedStudents.length === 0 || feeItems.some(f => !f.description || !f.amount) || !dueDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const totalAmount = feeItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      
      const feeData = {
        class: selectedClass,
        students: selectedStudents,
        items: feeItems,
        totalAmount,
        dueDate,
        month: selectedMonth
      };

      const res = await apiClient.post(ENDPOINTS.PRINCIPAL.CREATE_FEE, feeData);
      
      Alert.alert('Success', 'Fee invoice created successfully');
      setModalOpen(false);
      // Reset form
      setSelectedClass('');
      setSelectedStudents([]);
      setFeeItems([{ description: '', amount: '' }]);
      setDueDate('');
      setSelectedMonth('');
      // Refresh list
      const refreshRes = await apiClient.get(ENDPOINTS.PRINCIPAL.FEES);
      const data = refreshRes.data.data || refreshRes.data;
      setInvoices(data.invoices || []);
    } catch (error: any) {
      console.error('Failed to create fee:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create fee invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFeeItem = () => {
    setFeeItems([...feeItems, { description: '', amount: '' }]);
  };

  const removeFeeItem = (index: number) => {
    setFeeItems(feeItems.filter((_, i) => i !== index));
  };

  const updateFeeItem = (index: number, field: string, value: string) => {
    const updated = [...feeItems];
    updated[index] = { ...updated[index], [field]: value };
    setFeeItems(updated);
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const generateDates = () => {
    const dates = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) dates.push(null);
    for (let i = 1; i <= daysInMonth; i++) dates.push(i);
    return dates;
  };

  const handleDateSelect = (day: number | null) => {
    if (!day) return;
    const formatted = `${String(currentMonth.getMonth() + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${currentMonth.getFullYear()}`;
    setDueDate(formatted);
    setDatePickerTarget(false);
  };

  // Filter Data based on tabs
  const getFilteredInvoices = () => {
    if (activeTab === 'All Fees') return invoices;
    if (activeTab === 'Pending') return invoices.filter(inv => inv.status === 'PENDING');
    if (activeTab === 'Overdue') return invoices.filter(inv => inv.status === 'OVERDUE');
    if (activeTab === 'Collected') return invoices.filter(inv => inv.status === 'PAID');
    return invoices;
  };

  const currentInvoices = getFilteredInvoices();

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />

      {/* --- Standard Header --- */}
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
          <Text style={styles.pageTitle}>School Fees & Salary Management</Text>
          <Text style={styles.pageSubtitle}>Fee & Salary Management Portal</Text>
        </Animated.View>

        {/* --- Analytics Grid --- */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.statsGridRow}>
          
          <View style={styles.statCard}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={[styles.statIconBox, {backgroundColor: '#ede9fe'}]}>
                <Text style={{color: '#8b5cf6', fontSize: 13, fontWeight: '800'}}>₹</Text>
              </View>
              <View style={{marginLeft: 10}}>
                <Text style={styles.statValue}>₹{summary.totalFees?.toLocaleString() || 0}</Text>
                <Text style={styles.statLabel}>Total Fees This Month</Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={[styles.statIconBox, {backgroundColor: '#dbeafe'}]}>
                <Ionicons name="cash-outline" size={16} color="#3b82f6" />
              </View>
              <View style={{marginLeft: 10}}>
                <Text style={styles.statValue}>₹{summary.totalCollected?.toLocaleString() || 0}</Text>
                <Text style={styles.statLabel}>Total Collected</Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={[styles.statIconBox, {backgroundColor: '#dcfce7'}]}>
                <Ionicons name="bar-chart-outline" size={16} color="#22c55e" />
              </View>
              <View style={{marginLeft: 10}}>
                <Text style={styles.statValue}>{summary.collectionRate?.toFixed(0) || 0}%</Text>
                <Text style={styles.statLabel}>Fees Collection Rate</Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={[styles.statIconBox, {backgroundColor: '#fee2e2'}]}>
                <Ionicons name="time-outline" size={16} color="#ef4444" />
              </View>
              <View style={{marginLeft: 10}}>
                <Text style={styles.statValue}>₹{summary.pendingAmount?.toLocaleString() || 0}</Text>
                <Text style={styles.statLabel}>Pending Payments</Text>
              </View>
            </View>
          </View>

        </Animated.View>

        {/* --- Fee Management List --- */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.managementCard}>
           
           <View style={styles.managementHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                 <View style={styles.headerIconSquare}>
                   <Ionicons name="document-text" size={16} color="#8B5CF6" />
                 </View>
                 <Text style={styles.managementTitle}>Fee Management</Text>
              </View>
              
              <TouchableOpacity style={styles.createInvoiceBtn} onPress={() => setModalOpen(true)}>
                <Ionicons name="add" size={14} color="#FFF" />
                <Text style={styles.createInvoiceBtnText}>Create Invoice</Text>
              </TouchableOpacity>
           </View>

           {/* Tabs */}
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={{paddingRight: 10}}>
              {['All Fees', 'Pending', 'Overdue', 'Collected'].map((tab) => {
                 const isActive = activeTab === tab;
                 return (
                   <TouchableOpacity 
                     key={tab} 
                     style={[styles.tabButton, isActive && styles.tabButtonActive]}
                     onPress={() => setActiveTab(tab)}
                   >
                     <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>{tab}</Text>
                   </TouchableOpacity>
                 );
              })}
           </ScrollView>

           {/* List / Empty State */}
           <View style={styles.listContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 40 }} />
              ) : error ? (
                <View style={styles.emptyStateBox}>
                  <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                  <Text style={styles.emptyStateTitle}>Error Loading Fees</Text>
                  <Text style={styles.emptyStateSub}>{error}</Text>
                </View>
              ) : currentInvoices.length > 0 ? (
                currentInvoices.map((inv, idx) => (
                  <View key={idx} style={styles.invoiceCardRow}>
                    
                    <View style={styles.invRowTop}>
                      <Text style={styles.invIdText}>{inv.id}</Text>
                      <View style={styles.invStatusPill}>
                        <View style={styles.invStatusDot} />
                        <Text style={styles.invStatusText}>{inv.status}</Text>
                      </View>
                    </View>

                    <View style={styles.invRowMiddle}>
                      <View style={{flex: 1}}>
                         <Text style={styles.invLabel}>Student</Text>
                         <Text style={styles.invValueMain}>{inv.student}</Text>
                      </View>
                      <View style={{flex: 1, alignItems: 'flex-end'}}>
                         <Text style={styles.invLabel}>Amount</Text>
                         <Text style={[styles.invValueMain, {color: '#111827'}]}>{inv.amount}</Text>
                      </View>
                    </View>

                    <View style={styles.cardDashedDivider} />

                    <View style={styles.invRowBottom}>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                        <Text style={styles.invDateText}>Issue: {inv.issueDate}</Text>
                      </View>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Ionicons name="warning-outline" size={12} color="#EF4444" />
                        <Text style={styles.invDateText}>Due: {inv.dueDate}</Text>
                      </View>
                    </View>

                  </View>
                ))
              ) : (
                <View style={styles.emptyStateBox}>
                  <View style={styles.emptyIconBox}>
                    <Ionicons name="document-text" size={32} color="#9CA3AF" />
                  </View>
                  <Text style={styles.emptyStateTitle}>No invoices found</Text>
                  <Text style={styles.emptyStateSub}>No {activeTab.toLowerCase()} invoices to display.</Text>
                  
                  <TouchableOpacity style={[styles.createInvoiceBtn, {marginTop: 20}]} onPress={() => setModalOpen(true)}>
                    <Ionicons name="add" size={14} color="#FFF" />
                    <Text style={styles.createInvoiceBtnText}>Create Invoice</Text>
                  </TouchableOpacity>
                </View>
              )}
           </View>

        </Animated.View>

      </ScrollView>

      {/* --- CREATE NEW INVOICE MODAL --- */}
      <Modal visible={isModalOpen} animationType="fade" transparent onRequestClose={() => setModalOpen(false)} statusBarTranslucent>
         <View style={styles.modalOverlay}>
           <View style={styles.modalContentBox}>
              
              <View style={styles.modalHeader}>
                 <Text style={styles.modalHeaderTitle}>Create New Invoice</Text>
                 <TouchableOpacity onPress={() => setModalOpen(false)}>
                   <Ionicons name="close" size={24} color="#6B7280" />
                 </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
                 
                 <View style={styles.inputGroup}>
                   <Text style={styles.modalLabel}>Class <Text style={{color: '#EF4444'}}>*</Text></Text>
                   <View style={styles.dropdownBorderBox}>
                      <View style={[styles.statIconBox, {backgroundColor: '#f3e8ff', width: 28, height: 28, marginRight: 8}]}>
                        <Ionicons name="school" size={14} color="#a855f7" />
                      </View>
                      <Text style={styles.dropdownPlaceholder}>Select a class</Text>
                      <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                   </View>
                 </View>

                 <View style={styles.inputGroup}>
                   <Text style={styles.modalLabel}>Students <Text style={{color: '#EF4444'}}>*</Text></Text>
                   <View style={styles.emptyStudentBox}>
                      <Ionicons name="people" size={28} color="#CBD5E1" />
                      <Text style={styles.emptyStudentText}>Select a class first to view students</Text>
                   </View>
                 </View>

                 <View style={styles.inputGroup}>
                   <Text style={styles.modalLabel}>Fee Items <Text style={{color: '#EF4444'}}>*</Text></Text>
                   <View style={styles.feeItemsTableBorder}>
                      <View style={styles.feeItemsTableHeader}>
                        <Text style={[styles.feeTableHeadText, {flex: 2}]}>DESCRIPTION</Text>
                        <Text style={[styles.feeTableHeadText, {flex: 1}]}>AMOUNT (₹)</Text>
                      </View>
                      
                      {feeItems.map((item, index) => (
                        <View key={index} style={styles.feeItemRow}>
                          <TextInput 
                            style={[styles.feeTextInput, {flex: 2, marginRight: 8}]} 
                            placeholder="e.g., Tuition Fee" 
                            placeholderTextColor="#9CA3AF" 
                            value={item.description}
                            onChangeText={(text) => updateFeeItem(index, 'description', text)}
                          />
                          <TextInput 
                            style={[styles.feeTextInput, {flex: 1}]} 
                            placeholder="0" 
                            keyboardType="numeric" 
                            placeholderTextColor="#9CA3AF"
                            value={item.amount}
                            onChangeText={(text) => updateFeeItem(index, 'amount', text)}
                          />
                          <TouchableOpacity style={{marginLeft: 10, padding: 4}} onPress={() => removeFeeItem(index)}>
                             <Ionicons name="trash" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}

                      <TouchableOpacity style={styles.addFeeItemBtn} onPress={addFeeItem}>
                        <Ionicons name="add" size={14} color="#8B5CF6" />
                        <Text style={styles.addFeeItemBtnText}>Add Fee Item</Text>
                      </TouchableOpacity>
                   </View>
                 </View>

                 <View style={{flexDirection: 'row', justifyContent: 'space-between', gap: 12}}>
                    <View style={[styles.inputGroup, {flex: 1}]}>
                      <Text style={styles.modalLabel}>Due Date <Text style={{color: '#EF4444'}}>*</Text></Text>
                      <TouchableOpacity style={styles.dropdownBorderBox} onPress={() => setDatePickerTarget(true)}>
                         <Text style={[styles.dropdownPlaceholder, dueDate && {color: '#111827'}]}>{dueDate || 'mm/dd/yyyy'}</Text>
                         <Ionicons name="calendar-outline" size={16} color="#111827" />
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.inputGroup, {flex: 1}]}>
                      <Text style={styles.modalLabel}>Month <Text style={{color: '#EF4444'}}>*</Text></Text>
                      <View style={styles.dropdownBorderBox}>
                         <Text style={styles.dropdownPlaceholder}>Select month</Text>
                         <Ionicons name="chevron-down" size={16} color="#111827" />
                      </View>
                    </View>
                 </View>

                 <View style={styles.modalActionRow}>
                   <TouchableOpacity style={styles.modalBtnOutline} onPress={() => setModalOpen(false)}>
                     <Text style={styles.modalBtnOutlineText}>Cancel</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     style={[styles.modalBtnSolid, isSubmitting && {opacity: 0.7}]} 
                     disabled={isSubmitting}
                     onPress={handleCreateFee}
                   >
                     {isSubmitting ? (
                       <ActivityIndicator size="small" color="#FFF" />
                     ) : (
                       <Text style={styles.modalBtnSolidText}>Create Invoice</Text>
                     )}
                   </TouchableOpacity>
                 </View>

              </ScrollView>
           </View>
         </View>
      </Modal>

      {/* --- PURE JAVASCRIPT DATE PICKER --- */}
      <Modal statusBarTranslucent={true} visible={datePickerTarget} transparent animationType="fade" onRequestClose={() => setDatePickerTarget(false)}>
        <View style={[styles.modalOverlay, { zIndex: 999 }]}>
           <View style={styles.calModalContainer}>
             <View style={styles.calHeader}>
               <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}><Ionicons name="chevron-back" size={20} color="#111827" /></TouchableOpacity>
               <Text style={styles.calMonthText}>
                 {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
               </Text>
               <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}><Ionicons name="chevron-forward" size={20} color="#111827" /></TouchableOpacity>
             </View>
             
             <View style={styles.calWeekdaysRow}>
               {['S','M','T','W','T','F','S'].map((wd, i) => <Text key={i} style={styles.calWeekdayText}>{wd}</Text>)}
             </View>
             
             <View style={styles.calDaysGrid}>
               {generateDates().map((day, idx) => (
                 <TouchableOpacity 
                   key={idx} 
                   style={[styles.calDayBtn, !day && {backgroundColor: 'transparent'}]} 
                   onPress={() => handleDateSelect(day)}
                   disabled={!day}
                 >
                   {day && <Text style={styles.calDayText}>{day}</Text>}
                 </TouchableOpacity>
               ))}
             </View>

             <TouchableOpacity style={styles.calCancelBtn} onPress={() => setDatePickerTarget(false)}>
               <Text style={styles.cancelBtnText}>Cancel</Text>
             </TouchableOpacity>
           </View>
        </View>
      </Modal>

      {/* Navigation Drawer */}
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
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

  pageTitleContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  pageSubtitle: { color: '#64748B', fontSize: 13, fontWeight: '500' },

  statsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 24,
    marginBottom: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    justifyContent: 'center',
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },

  managementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  managementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerIconSquare: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  createInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6D28D9', // Deep Purple matching design
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  createInvoiceBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
  },
  tabButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFF',
  },

  listContainer: {
    padding: 16,
    minHeight: 250,
  },
  invoiceCardRow: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  invRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  invStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE047',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  invStatusDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#EAB308', marginRight: 4,
  },
  invStatusText: {
    fontSize: 10, fontWeight: '700', color: '#CA8A04'
  },
  invRowMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  invValueMain: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  cardDashedDivider: {
    height: 1,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  invRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },

  emptyStateBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentBox: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  modalScrollBody: {
    padding: 20,
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
  },
  dropdownBorderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emptyStudentBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderStyle: 'dashed',
    paddingVertical: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  emptyStudentText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 10,
    fontWeight: '500',
  },
  feeItemsTableBorder: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  feeItemsTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  feeTableHeadText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  feeItemRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  feeTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#111827',
  },
  addFeeItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  addFeeItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
    marginLeft: 6,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  modalBtnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  modalBtnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalBtnSolid: {
    flex: 1,
    backgroundColor: '#A78BFA', // Light purple for Review button matching screenshot
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalBtnSolidText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },

  // --- CALENDAR MODAL STYLES ---
  calModalContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calNavBtn: { width: 32, height: 32, backgroundColor: '#F3F4F6', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  calMonthText: { fontSize: 15, fontWeight: '800', color: '#111827' },
  calWeekdaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  calWeekdayText: { width: '14%', textAlign: 'center', fontSize: 11, fontWeight: '800', color: '#9CA3AF' },
  calDaysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  calDayBtn: { width: '14%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 8 },
  calDayText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  calCancelBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' }
});

export default PrincipalFeesScreen;
