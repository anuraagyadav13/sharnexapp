import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown, SlideInRight } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PrincipalStaffDetails'>;

const TABS = [
  { id: 'personal', label: 'Personal', icon: 'account-outline' },
  { id: 'professional', label: 'Professional', icon: 'briefcase-outline' },
  { id: 'bank', label: 'Financial', icon: 'bank-outline' },
];

import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

const PrincipalStaffDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { staffId } = route.params;
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [staffData, setStaffData] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get(`${ENDPOINTS.PRINCIPAL.STAFF}/${staffId}`);
        setStaffData(res.data.data || res.data);
      } catch (err) {
        console.error('Failed to fetch staff details:', err);
        setStaffData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [staffId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const ReadOnlyField = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.readOnlyInput}>
        <Text style={styles.readOnlyVal}>{value || 'Not Provided'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Elite Curved Header */}
      <View style={styles.heroHeader}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgLinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#4F46E5" stopOpacity="1" />
              <Stop offset="1" stopColor="#7C3AED" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#heroGrad)" />
        </Svg>
        
        <View style={styles.headerTopActions}>
          <TouchableOpacity style={styles.glassBackBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitleText}>Staff Profile</Text>
          <TouchableOpacity style={styles.glassCloseBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroProfileContent}>
          <View style={styles.heroAvatarCircle}>
            <Text style={styles.heroAvatarText}>{staffData?.firstName?.charAt(0) || 'A'}</Text>
            <View style={styles.activeStatusDot} />
          </View>
          <Text style={styles.heroNameText}>{staffData?.firstName} {staffData?.lastName}</Text>
          <View style={styles.glassDeptBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#FFF" />
            <Text style={styles.glassDeptText}>{staffData?.department || 'Faculty'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentBody}>
        {/* Modern Segmented Tabs */}
        <View style={styles.segmentedTabContainer}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentedTabScroll}>
              {TABS.map(tab => (
                <TouchableOpacity 
                  key={tab.id} 
                  style={[styles.segmentedTabBtn, activeTab === tab.id && styles.segmentedTabBtnActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <MaterialCommunityIcons 
                    name={tab.icon as any} 
                    size={18} 
                    color={activeTab === tab.id ? '#FFF' : '#64748B'} 
                  />
                  <Text style={[styles.segmentedTabText, activeTab === tab.id && styles.segmentedTabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
           </ScrollView>
        </View>

        <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScrollContent}>
          
          {activeTab === 'personal' && (
            <Animated.View entering={FadeInUp} style={styles.eliteCard}>
               <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Personal Dossier</Text>
                  <Text style={styles.cardSubtitle}>Primary identification and contact records</Text>
               </View>

               <View style={styles.infoGrid}>
                  <View style={styles.inputRow}>
                    <EliteField icon="account" label="FIRST NAME" value={staffData?.firstName} />
                    <EliteField icon="account-details" label="LAST NAME" value={staffData?.lastName} />
                  </View>

                  <EliteField icon="email-outline" label="EMAIL ADDRESS" value={staffData?.email} color="#3B82F6" />
                  <EliteField icon="phone-outline" label="PHONE NUMBER" value={staffData?.phone} color="#10B981" />
                  
                  <View style={styles.inputRow}>
                    <EliteField icon="calendar-month" label="DATE OF BIRTH" value={staffData?.dob} color="#F59E0B" />
                    <EliteField icon="map-marker-outline" label="LOCATION" value={staffData?.address} color="#EC4899" />
                  </View>
               </View>

               <View style={styles.footerActions}>
                 <TouchableOpacity style={styles.elitePrimaryBtn} onPress={() => setActiveTab('professional')}>
                    <Text style={styles.elitePrimaryBtnText}>Professional Profile</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                 </TouchableOpacity>
               </View>
            </Animated.View>
          )}

          {activeTab === 'professional' && (
            <Animated.View entering={SlideInRight} style={styles.eliteCard}>
               <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Professional Record</Text>
                  <Text style={styles.cardSubtitle}>Academic standing and institutional history</Text>
               </View>

               <View style={styles.infoGrid}>
                  <View style={styles.inputRow}>
                    <EliteField icon="office-building" label="DEPARTMENT" value={staffData?.department} color="#6366F1" />
                    <EliteField icon="school-outline" label="QUALIFICATION" value={staffData?.qualification} color="#8B5CF6" />
                  </View>

                  <View style={styles.inputRow}>
                    <EliteField icon="book-open-variant" label="PRIMARY SUBJECT" value={staffData?.subject} color="#0EA5E9" />
                    <EliteField icon="calendar-check" label="JOINING DATE" value={staffData?.joiningDate} color="#22C55E" />
                  </View>

                  <EliteField icon="timer-outline" label="TOTAL EXPERIENCE" value={`${staffData?.experience || 0} Years`} color="#F97316" />
                  
                  <View style={styles.bioField}>
                    <View style={styles.fieldLabelRow}>
                      <MaterialCommunityIcons name="text-account" size={16} color="#64748B" />
                      <Text style={styles.fieldLabel}>PROFESSIONAL BIOGRAPHY</Text>
                    </View>
                    <View style={styles.bioBox}>
                      <Text style={styles.bioText}>{staffData?.biography || 'Professional background description...'}</Text>
                    </View>
                  </View>
               </View>

               <View style={styles.footerActions}>
                  <TouchableOpacity style={styles.eliteOutlineBtn} onPress={() => setActiveTab('personal')}>
                     <Text style={styles.eliteOutlineBtnText}>Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.elitePrimaryBtn} onPress={() => setActiveTab('bank')}>
                     <Text style={styles.elitePrimaryBtnText}>Financial Details</Text>
                  </TouchableOpacity>
               </View>
            </Animated.View>
          )}

          {activeTab === 'bank' && (
            <Animated.View entering={SlideInRight} style={styles.eliteCard}>
               <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Financial Credentials</Text>
                  <Text style={styles.cardSubtitle}>Secure bank and payroll information</Text>
               </View>

               <View style={styles.infoGrid}>
                  <View style={styles.inputRow}>
                    <EliteField icon="bank-outline" label="BANK NAME" value={staffData?.bankName} color="#10B981" />
                    <EliteField icon="numeric" label="ACCOUNT NO" value={staffData?.accountNumber} color="#3B82F6" />
                  </View>

                  <View style={styles.inputRow}>
                    <EliteField icon="account-tie-outline" label="HOLDER NAME" value={staffData?.accountHolderName} color="#6366F1" />
                    <EliteField icon="credit-card-outline" label="ACCOUNT TYPE" value={staffData?.accountType || 'Saving'} color="#8B5CF6" />
                  </View>

                  <View style={styles.inputRow}>
                    <EliteField icon="barcode" label="IFSC CODE" value={staffData?.ifscCode} color="#EC4899" />
                    <EliteField icon="wallet-outline" label="PAY METHOD" value={staffData?.paymentMethod || 'Bank Transfer'} color="#F59E0B" />
                  </View>
               </View>

               <View style={styles.footerActions}>
                  <TouchableOpacity style={styles.eliteOutlineBtn} onPress={() => setActiveTab('professional')}>
                     <Text style={styles.eliteOutlineBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.eliteSuccessBtn} onPress={() => navigation.goBack()}>
                     <Text style={styles.elitePrimaryBtnText}>Close Record</Text>
                     <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  </TouchableOpacity>
               </View>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const EliteField = ({ icon, label, value, color = '#64748B' }: any) => (
  <View style={styles.eliteFieldContainer}>
    <View style={styles.fieldLabelRow}>
      <MaterialCommunityIcons name={icon} size={14} color={color} />
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
    <View style={styles.fieldValueBox}>
      <Text style={styles.fieldValueText} numberOfLines={1}>{value || 'Not Specified'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F0F2F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' },

  // Elite Hero Header
  heroHeader: { height: 320, paddingBottom: 20 },
  headerTopActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  glassBackBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  glassCloseBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroTitleText: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },

  heroProfileContent: { alignItems: 'center', marginTop: 0 },
  heroAvatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 4, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
  heroAvatarText: { color: '#FFF', fontSize: 42, fontWeight: '900' },
  activeStatusDot: { position: 'absolute', bottom: 5, right: 5, width: 18, height: 18, borderRadius: 9, backgroundColor: '#22C55E', borderWidth: 3, borderColor: '#FFF' },
  heroNameText: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 12, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  glassDeptBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  glassDeptText: { color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

  contentBody: { flex: 1, marginTop: -25, backgroundColor: '#F8FAFC', borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 10 },
  
  // Segmented Tabs
  segmentedTabContainer: { paddingVertical: 15, paddingHorizontal: 20 },
  segmentedTabScroll: { gap: 8 },
  segmentedTabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#F1F5F9' },
  segmentedTabBtnActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  segmentedTabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  segmentedTabTextActive: { color: '#FFF' },

  detailScroll: { flex: 1 },
  detailScrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  eliteCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { marginBottom: 24 },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  cardSubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 2 },

  infoGrid: { gap: 15 },
  eliteFieldContainer: { flex: 1 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  fieldValueBox: { backgroundColor: '#F8FAFC', paddingHorizontal: 14, height: 44, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  fieldValueText: { fontSize: 14, color: '#1E293B', fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: 12, width: '100%' },

  bioField: { marginTop: 8 },
  bioBox: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', marginTop: 8 },
  bioText: { fontSize: 13, color: '#475569', lineHeight: 20, fontWeight: '500' },

  elitePrimaryBtn: { flex: 1, backgroundColor: '#4F46E5', height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  elitePrimaryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  
  eliteOutlineBtn: { height: 48, borderRadius: 14, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFF', flex: 0.5 },
  eliteOutlineBtnText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
  
  eliteSuccessBtn: { flex: 1, backgroundColor: '#10B981', height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },

  footerActions: { flexDirection: 'row', gap: 12, marginTop: 30, width: '100%', alignItems: 'center' },
});

export default PrincipalStaffDetailsScreen;
