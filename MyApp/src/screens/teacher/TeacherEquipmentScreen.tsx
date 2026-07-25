import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherEquipment'>;

const STATUS_TABS = [
  { label: 'All', value: null },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Clarification', value: 'NEEDS_CLARIFICATION' },
  { label: 'Closed', value: 'CLOSED' },
];

const TeacherEquipmentScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles({ ...theme, isDarkMode });
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const fetchRequests = useCallback(async (refreshing = false) => {
    try {
      if (!refreshing) setIsLoading(true);
      
      const params: any = {};
      if (activeTab) params.status = activeTab;
      if (searchQuery) params.search = searchQuery;

      const res = await apiClient.get(ENDPOINTS.TEACHER.EQUIPMENT.MY_REQUESTS, { params });
      const data = res.data?.data?.items || res.data?.items || [];
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch equipment requests:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRequests(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED': return { bg: '#ECFDF5', text: '#10B981' };
      case 'REJECTED': return { bg: '#FEF2F2', text: '#EF4444' };
      case 'NEEDS_CLARIFICATION': return { bg: '#FFFBEB', text: '#F59E0B' };
      case 'DRAFT': return { bg: '#F3F4F6', text: '#6B7280' };
      case 'SUBMITTED': return { bg: '#EEF2FF', text: '#4F46E5' };
      case 'CLOSED': return { bg: '#F9FAFB', text: '#9CA3AF' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT': return { bg: '#EF4444', text: '#FFF' };
      case 'MEDIUM': return { bg: '#F59E0B', text: '#FFF' };
      case 'LOW': return { bg: '#10B981', text: '#FFF' };
      default: return { bg: '#6B7280', text: '#FFF' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
      
      {/* Attendance-Style Header */}
      <View style={styles.header}>
        <ScaleButton 
          style={styles.menuHandle} 
          onPress={() => setDrawerOpen(true)}
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
        >
          <Ionicons name="menu" size={28} color={theme.text} />
        </ScaleButton>

        <Text style={styles.headerTitle} numberOfLines={1}>Equipment Requests</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => navigation.navigate('TeacherAddEquipmentRequest', {})}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.addBtnText}>Request</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.label}
              style={[styles.tab, activeTab === tab.value && styles.activeTab]}
              onPress={() => setActiveTab(tab.value)}
            >
              <Text style={[styles.tabText, activeTab === tab.value && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {isLoading && !isRefreshing ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No equipment requests found.</Text>
            <TouchableOpacity 
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('TeacherAddEquipmentRequest', {})}
            >
              <Text style={styles.emptyBtnText}>Create Your First Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          requests.map((item, index) => (
            <Animated.View 
              key={item.id} 
              entering={FadeInUp.delay(index * 100).springify()}
              style={styles.requestCard}
            >
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('TeacherEquipmentDetail', { requestId: item.id })}
                style={styles.cardContent}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.requestNumber}>{item.request_number}</Text>
                  <View style={[styles.statusPill, { backgroundColor: getStatusStyle(item.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusStyle(item.status).text }]}>
                      {(item.status || '').replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.purpose} numberOfLines={2}>{item.purpose}</Text>

                <View style={styles.cardDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.detailText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="package-variant" size={14} color="#64748B" />
                    <Text style={styles.detailText}>{item.item_count} Items</Text>
                  </View>
                  <View style={[styles.priorityPill, { backgroundColor: getPriorityStyle(item.priority).bg }]}>
                    <Text style={styles.priorityText}>{item.priority}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.neededBy}>Needed by: {item.needed_by_date ? new Date(item.needed_by_date).toLocaleDateString() : 'N/A'}</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={styles.iconAction}
                      onPress={() => navigation.navigate('TeacherEquipmentDetail', { requestId: item.id })}
                    >
                      <Ionicons name="eye-outline" size={20} color="#6366F1" />
                    </TouchableOpacity>
                    {(item.status === 'DRAFT' || item.status === 'NEEDS_CLARIFICATION') && (
                      <TouchableOpacity 
                        style={styles.iconAction}
                        onPress={() => navigation.navigate('TeacherAddEquipmentRequest', { requestId: item.id })}
                      >
                        <Ionicons name="pencil-outline" size={20} color="#4F46E5" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="teacher"
      />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  addBtn: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 4,
  },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700', marginLeft: 4 },

  tabsContainer: { backgroundColor: theme.surface, paddingVertical: 10 },
  tabsScrollContent: { paddingHorizontal: 20, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.isDarkMode ? '#334155' : '#F1F5F9',
  },
  activeTab: { backgroundColor: theme.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: theme.subtext },
  activeTabText: { color: '#FFF' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
    height: 46,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: theme.text, fontWeight: '500' },

  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  requestCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  requestNumber: { fontSize: 14, fontWeight: '800', color: theme.text },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  
  purpose: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 12 },
  
  cardDetails: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, fontWeight: '600', color: theme.subtext },
  
  priorityPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, fontWeight: '800', color: '#FFF' },

  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border
  },
  neededBy: { fontSize: 12, fontWeight: '600', color: theme.subtext },
  actionRow: { flexDirection: 'row', gap: 12 },
  iconAction: { padding: 4 },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '700', color: theme.subtext },
  emptyBtn: { marginTop: 20, backgroundColor: theme.isDarkMode ? '#312E8140' : '#EEF2FF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: theme.primary, fontWeight: '700' },
});

export default TeacherEquipmentScreen;
