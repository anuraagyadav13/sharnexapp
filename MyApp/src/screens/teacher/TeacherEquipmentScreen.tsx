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
import { Theme, withAlpha, LIGHT_COLORS } from '../../constants/theme';
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
  const styles = getStyles(theme);
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
      case 'APPROVED': return { bg: withAlpha(theme.success, 0.1), text: theme.success };
      case 'REJECTED': return { bg: withAlpha(theme.danger, 0.1), text: theme.danger };
      case 'NEEDS_CLARIFICATION': return { bg: withAlpha(theme.warning, 0.1), text: theme.warning };
      case 'DRAFT': return { bg: withAlpha(theme.border, 0.5), text: theme.subtext };
      case 'SUBMITTED': return { bg: withAlpha(theme.primary, 0.1), text: theme.primary };
      case 'CLOSED': return { bg: theme.background, text: theme.subtext };
      default: return { bg: withAlpha(theme.border, 0.5), text: theme.subtext };
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT': return { bg: theme.danger, text: theme.onPrimary };
      case 'MEDIUM': return { bg: theme.warning, text: theme.onPrimary };
      case 'LOW': return { bg: theme.success, text: theme.onPrimary };
      default: return { bg: theme.subtext, text: theme.onPrimary };
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
            <Ionicons name="add" size={18} color={theme.onPrimary} />
            <Text style={styles.addBtnText}>Request</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
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
        <Ionicons name="search" size={20} color={theme.subtext} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.subtext}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
      >
        {isLoading && !isRefreshing ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={theme.border} />
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
                    <Ionicons name="calendar-outline" size={14} color={theme.subtext} />
                    <Text style={styles.detailText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="package-variant" size={14} color={theme.subtext} />
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
                      <Ionicons name="eye-outline" size={20} color={theme.primary} />
                    </TouchableOpacity>
                    {(item.status === 'DRAFT' || item.status === 'NEEDS_CLARIFICATION') && (
                      <TouchableOpacity 
                        style={styles.iconAction}
                        onPress={() => navigation.navigate('TeacherAddEquipmentRequest', { requestId: item.id })}
                      >
                        <Ionicons name="pencil-outline" size={20} color={theme.primary} />
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

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: theme.surface,
    shadowColor: theme.shadow,
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
  addBtnText: { color: theme.onPrimary, fontSize: 13, fontWeight: '700', marginLeft: 4 },

  tabsContainer: { backgroundColor: theme.surface, paddingVertical: 10 },
  tabsScrollContent: { paddingHorizontal: 20, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: withAlpha(theme.border, 0.5),
  },
  activeTab: { backgroundColor: theme.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: theme.subtext },
  activeTabText: { color: theme.onPrimary },

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
    shadowColor: theme.border,
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
  priorityText: { fontSize: 10, fontWeight: '800', color: theme.onPrimary },

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
  emptyBtn: { marginTop: 20, backgroundColor: withAlpha(theme.primary, 0.15), paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: theme.primary, fontWeight: '700' },
});

export default TeacherEquipmentScreen;
