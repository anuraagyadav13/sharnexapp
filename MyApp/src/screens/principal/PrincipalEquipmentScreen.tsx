import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import principalService, { EquipmentRequestItem } from '../../services/principalService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';

type PrincipalEquipmentNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalEquipment'
>;

interface Props {
  navigation: PrincipalEquipmentNavigationProp;
}

interface ModalState {
  visible: boolean;
  requestId: string;
  action: 'approve' | 'reject';
}

const PrincipalEquipmentScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NEED_CLARIFICATION' | 'RECEIVED'>('SUBMITTED');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const { authState } = useAuth();

  const [requests, setRequests] = useState<EquipmentRequestItem[]>([]);

  // Modal State
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    requestId: '',
    action: 'approve',
  });
  const [remarkInput, setRemarkInput] = useState('');
  const [remarkError, setRemarkError] = useState('');

  const loadData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);

    try {
      const res = await principalService.getPendingEquipmentRequests(selectedTab, 50, 0);
      setRequests(res.data?.data?.items || []);
    } catch (error) {
      console.error('[PrincipalEquipment] Failed to fetch equipment requests:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = useCallback((dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return 'N/A';
    }
  }, []);

  const getPriorityStyles = useCallback((priority: string) => {
    const p = priority?.toUpperCase();
    switch (p) {
      case 'HIGH':
        return { bg: '#FEF2F2', text: '#EF4444' };
      case 'MEDIUM':
        return { bg: '#FFF7ED', text: '#EA580C' };
      case 'LOW':
        return { bg: '#EFF6FF', text: '#3B82F6' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  }, []);

  const handleActionPress = useCallback((requestId: string, action: 'approve' | 'reject') => {
    setRemarkInput('');
    setRemarkError('');
    setModalState({
      visible: true,
      requestId,
      action,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      visible: false,
      requestId: '',
      action: 'approve',
    });
    setRemarkInput('');
    setRemarkError('');
  }, []);

  const handleConfirmAction = useCallback(async () => {
    const { requestId, action } = modalState;
    if (!requestId) return;

    if (action === 'reject' && remarkInput.trim() === '') {
      setRemarkError('Remark is required for rejection');
      return;
    }

    try {
      // Optimistic update
      setRequests((prev) => prev.filter((item) => item.id !== requestId));
      closeModal();

      if (action === 'approve') {
        await principalService.approveEquipmentRequest(requestId, remarkInput);
        Alert.alert('Success', 'Request approved successfully.');
      } else {
        await principalService.rejectEquipmentRequest(requestId, remarkInput);
        Alert.alert('Success', 'Request rejected successfully.');
      }
    } catch (err) {
      console.error(`[PrincipalEquipment] Failed to ${action} request:`, err);
      Alert.alert('Error', `Failed to ${action} request. Please reload and try again.`);
      loadData(); // Reload to sync state
    }
  }, [modalState, remarkInput, closeModal, loadData]);

  const renderRequestCard = useCallback(
    ({ item }: { item: EquipmentRequestItem }) => {
      const priorityStyles = getPriorityStyles(item.priority);
      const itemsCount = parseInt(item.item_count || '0');

      return (
        <View style={styles.requestCard}>
          <View style={styles.cardHeader}>
            <View style={styles.numberBox}>
              <Text style={styles.numberText}>{item.request_number}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityStyles.bg }]}>
              <Text style={[styles.priorityBadgeText, { color: priorityStyles.text }]}>
                {item.priority || 'LOW'}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.teacherText}>{item.teacher_name}</Text>
            <Text style={styles.purposeText}>{item.purpose}</Text>
            <Text style={styles.countText}>{itemsCount} items</Text>

            {item.teacher_note ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Teacher Note:</Text>
                <Text style={styles.noteValue}>{item.teacher_note}</Text>
              </View>
            ) : null}

            {item.principal_remark ? (
              <View style={styles.remarkBox}>
                <Text style={styles.remarkLabel}>Principal Remark:</Text>
                <Text style={styles.remarkValue}>{item.principal_remark}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.dateMeta}>
            <Text style={styles.dateText}>Needed: {formatDate(item.needed_by_date)}</Text>
            <Text style={styles.dateText}>Submitted: {formatDate(item.submitted_at)}</Text>
          </View>

          {item.status === 'SUBMITTED' ? (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleActionPress(item.id, 'reject')}
              >
                <Ionicons name="close-circle-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleActionPress(item.id, 'approve')}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.actionBtnText}>Approve</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: 12, padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280' }}>
                STATUS: {item.status}
              </Text>
            </View>
          )}
        </View>
      );
    },
    [getPriorityStyles, formatDate, handleActionPress]
  );

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Equipment Requests</Text>
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

      {/* Tabs Row */}
      <View style={{ backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
          {[
            { label: 'Pending', status: 'SUBMITTED' },
            { label: 'Approved', status: 'APPROVED' },
            { label: 'Rejected', status: 'REJECTED' },
            { label: 'Clarify', status: 'NEED_CLARIFICATION' },
            { label: 'Received', status: 'RECEIVED' },
          ].map((tab) => {
            const isActive = selectedTab === tab.status;
            return (
              <TouchableOpacity
                key={tab.status}
                style={{
                  backgroundColor: isActive ? theme.primary : theme.background,
                  paddingVertical: 6,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                }}
                onPress={() => setSelectedTab(tab.status as any)}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#FFF' : theme.text }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            colors={['#4F46E5']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color={theme.subtext} />
            <Text style={styles.emptyTitle}>No equipment requests found</Text>
            <Text style={styles.emptySubtitle}>
              There are no equipment requests in this status yet.
            </Text>
          </View>
        }
      />

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />

      {/* Custom Remark Input Modal */}
      <Modal
        visible={modalState.visible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {modalState.action === 'approve' ? 'Approve Request' : 'Reject Request'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {modalState.action === 'approve'
                ? 'Optionally add a remark for the teacher.'
                : 'Please add a reason for rejecting this request.'}
            </Text>

            <TextInput
              style={[styles.modalInput, remarkError ? styles.modalInputError : null]}
              placeholder="Add a remark..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={remarkInput}
              onChangeText={(text) => {
                setRemarkInput(text);
                if (text.trim() !== '') setRemarkError('');
              }}
            />

            {remarkError ? <Text style={styles.errorText}>{remarkError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: modalState.action === 'approve' ? '#10B981' : '#EF4444' },
                ]}
                onPress={handleConfirmAction}
              >
                <Text style={styles.modalConfirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
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
    paddingHorizontal: 24,
    backgroundColor: theme.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
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
  listContent: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  numberBox: {
    backgroundColor: theme.primary + '15',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  numberText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
  },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    marginBottom: 12,
  },
  teacherText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  purposeText: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  countText: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '600',
    marginBottom: 12,
  },
  noteBox: {
    backgroundColor: theme.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  noteLabel: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '600',
    marginBottom: 2,
  },
  noteValue: {
    fontSize: 12,
    color: theme.text,
  },
  remarkBox: {
    backgroundColor: theme.isDarkMode ? '#B4530920' : '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.isDarkMode ? '#B4530940' : '#FDE68A',
  },
  remarkLabel: {
    fontSize: 11,
    color: theme.isDarkMode ? '#FBBF24' : '#D97706',
    fontWeight: '600',
    marginBottom: 2,
  },
  remarkValue: {
    fontSize: 12,
    color: theme.isDarkMode ? '#FBBF24' : '#78350F',
  },
  dateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 12,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  approveBtn: {
    backgroundColor: '#10B981',
    marginLeft: 8,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.subtext,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    color: theme.text,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 8,
    backgroundColor: theme.background,
  },
  modalInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: theme.background,
  },
  modalCancelBtnText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  modalConfirmBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9F7AEA', // Soft purple
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
});

export default PrincipalEquipmentScreen;
