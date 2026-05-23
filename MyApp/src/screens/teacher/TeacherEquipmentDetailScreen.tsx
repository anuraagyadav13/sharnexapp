import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherEquipmentDetail'>;

const TeacherEquipmentDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { requestId } = route.params;
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [ackNote, setAckNote] = useState('');

  const fetchDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.TEACHER.EQUIPMENT.DETAIL(requestId));
      setRequest(res.data?.data || res.data);
    } catch (error) {
      console.error('Failed to fetch equipment detail:', error);
      Alert.alert('Error', 'Failed to load request details');
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAction = async (action: 'submit' | 'cancel' | 'acknowledge') => {
    try {
      setIsActionLoading(true);
      let endpoint = '';
      let payload = {};

      if (action === 'submit') endpoint = ENDPOINTS.TEACHER.EQUIPMENT.SUBMIT(requestId);
      else if (action === 'cancel') endpoint = ENDPOINTS.TEACHER.EQUIPMENT.CANCEL(requestId);
      else if (action === 'acknowledge') {
        endpoint = ENDPOINTS.TEACHER.EQUIPMENT.ACKNOWLEDGE(requestId);
        payload = { acknowledgementNote: ackNote };
      }

      await apiClient.post(endpoint, payload);
      Alert.alert('Success', `Request ${action}ed successfully`);
      setShowAcknowledgeModal(false);
      fetchDetail();
    } catch (error: any) {
      console.error(`Failed to ${action} request:`, error);
      Alert.alert('Error', error.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED': return { bg: '#ECFDF5', text: '#10B981', icon: 'checkmark-circle' };
      case 'REJECTED': return { bg: '#FEF2F2', text: '#EF4444', icon: 'close-circle' };
      case 'NEEDS_CLARIFICATION': return { bg: '#FFFBEB', text: '#F59E0B', icon: 'help-circle' };
      case 'DRAFT': return { bg: '#F3F4F6', text: '#6B7280', icon: 'pencil-sharp' };
      case 'SUBMITTED': return { bg: '#EEF2FF', text: '#4F46E5', icon: 'send' };
      case 'PARTIALLY_APPROVED': return { bg: '#F0F9FF', text: '#0EA5E9', icon: 'checkmark-done' };
      case 'ACKNOWLEDGED': return { bg: '#F0FDF4', text: '#16A34A', icon: 'ribbon' };
      default: return { bg: '#F3F4F6', text: '#6B7280', icon: 'information-circle' };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const statusStyle = getStatusStyle(request.status);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{request.request_number}</Text>
          <Text style={styles.headerDate}>Created on {new Date(request.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{(request.status || '').replace(/_/g, ' ')}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* Purpose Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.card}>
          <Text style={styles.sectionTitle}>Request Purpose</Text>
          <Text style={styles.purposeText}>{request.purpose}</Text>
          {request.teacher_note && (
            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>Your Note:</Text>
              <Text style={styles.noteText}>{request.teacher_note}</Text>
            </View>
          )}
          {request.principal_remark && (
            <View style={[styles.noteBox, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
              <Text style={[styles.noteTitle, { color: '#0369A1' }]}>Principal's Remark:</Text>
              <Text style={styles.noteText}>{request.principal_remark}</Text>
            </View>
          )}
        </Animated.View>

        {/* Items List */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.card}>
          <View style={[styles.cardHeader, { marginBottom: 16 }]}>
            <Text style={styles.sectionTitle}>Requested Items ({request.items?.length || 0})</Text>
          </View>
          
          {request.items?.map((item: any, index: number) => (
            <View key={index} style={[styles.itemRow, index === request.items.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                {item.item_note && <Text style={styles.itemNote}>{item.item_note}</Text>}
              </View>
              <View style={styles.quantityBox}>
                <Text style={styles.qtyLabel}>Req: <Text style={styles.qtyVal}>{item.requested_quantity} {item.unit}</Text></Text>
                {item.approved_quantity !== null && (
                  <Text style={[styles.qtyLabel, { color: '#10B981' }]}>Appr: <Text style={styles.qtyVal}>{item.approved_quantity} {item.unit}</Text></Text>
                )}
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Timeline */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.card}>
          <Text style={styles.sectionTitle}>Request Timeline</Text>
          <View style={styles.timeline}>
            {request.timeline?.map((step: any, index: number) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, index === 0 && styles.activeDot]} />
                  {index !== request.timeline.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineRight}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineAction}>{(step.action_type || '').replace(/_/g, ' ')}</Text>
                    <Text style={styles.timelineDate}>{new Date(step.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
                  </View>
                  <Text style={styles.timelineActor}>By {step.actor_name}</Text>
                  {step.remarks && <Text style={styles.timelineRemarks}>{step.remarks}</Text>}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.footer}>
        {request.status === 'DRAFT' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => navigation.navigate('TeacherAddEquipmentRequest', { requestId: request.id })}
            >
              <Text style={styles.editBtnText}>Edit Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.submitBtn]}
              onPress={() => handleAction('submit')}
            >
              <Text style={styles.submitBtnText}>Submit to Principal</Text>
            </TouchableOpacity>
          </View>
        )}

        {(request.status === 'APPROVED' || request.status === 'PARTIALLY_APPROVED') && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.ackBtn]}
            onPress={() => setShowAcknowledgeModal(true)}
          >
            <Ionicons name="checkmark-done" size={20} color="#FFF" />
            <Text style={styles.ackBtnText}>Acknowledge Received Items</Text>
          </TouchableOpacity>
        )}

        {(request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW') && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={() => {
              Alert.alert('Cancel Request', 'Are you sure you want to cancel this equipment request?', [
                { text: 'No', style: 'cancel' },
                { text: 'Yes, Cancel', style: 'destructive', onPress: () => handleAction('cancel') }
              ]);
            }}
          >
            <Text style={styles.cancelBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        )}

        {request.status === 'NEEDS_CLARIFICATION' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.submitBtn]}
            onPress={() => navigation.navigate('TeacherAddEquipmentRequest', { requestId: request.id })}
          >
            <Text style={styles.submitBtnText}>Provide Clarification</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Acknowledge Modal */}
      <Modal visible={showAcknowledgeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(300)} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Acknowledge Receipt</Text>
            <Text style={styles.modalSubtitle}>Please confirm you have received the approved equipment. You can add a note below.</Text>
            
            <TextInput
              style={styles.ackInput}
              placeholder="e.g. Received everything in good condition."
              value={ackNote}
              onChangeText={setAckNote}
              multiline
              numberOfLines={3}
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCloseBtn} 
                onPress={() => setShowAcknowledgeModal(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmBtn}
                onPress={() => handleAction('acknowledge')}
                disabled={isActionLoading}
              >
                {isActionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalConfirmText}>Confirm Receipt</Text>}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  headerDate: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  purposeText: { fontSize: 14, color: '#334155', lineHeight: 22 },
  
  noteBox: { 
    marginTop: 16, 
    backgroundColor: '#F8FAFC', 
    padding: 12, 
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  noteTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  noteText: { fontSize: 13, color: '#475569', lineHeight: 18 },

  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  itemNote: { fontSize: 11, color: '#64748B', marginTop: 2 },
  quantityBox: { alignItems: 'flex-end', gap: 2 },
  qtyLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  qtyVal: { color: '#475569', fontWeight: '700' },

  timeline: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', gap: 16 },
  timelineLeft: { alignItems: 'center', width: 20 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1' },
  activeDot: { backgroundColor: '#4F46E5', transform: [{ scale: 1.2 }] },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  timelineRight: { flex: 1, paddingBottom: 24, paddingRight: 8 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  timelineAction: { fontSize: 13, fontWeight: '700', color: '#1E293B', textTransform: 'capitalize' },
  timelineDate: { fontSize: 11, color: '#94A3B8' },
  timelineActor: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  timelineRemarks: { fontSize: 12, color: '#475569', marginTop: 6, fontStyle: 'italic' },

  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 16, 
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { 
    height: 48, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  editBtnText: { color: '#64748B', fontWeight: '700' },
  submitBtn: { flex: 2, backgroundColor: '#4F46E5' },
  submitBtnText: { color: '#FFF', fontWeight: '700' },
  ackBtn: { backgroundColor: '#10B981', width: '100%' },
  ackBtnText: { color: '#FFF', fontWeight: '700' },
  cancelBtn: { backgroundColor: '#FEF2F2', width: '100%' },
  cancelBtnText: { color: '#EF4444', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 20 },
  ackInput: { 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 12,
    padding: 16, 
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCloseBtn: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { color: '#64748B', fontWeight: '700' },
  modalConfirmBtn: { flex: 2, height: 48, backgroundColor: '#10B981', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalConfirmText: { color: '#FFF', fontWeight: '700' },
});

export default TeacherEquipmentDetailScreen;
