import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { getCacheBustedUri } from '../../utils/image';
import principalService, { EquipmentRequestItem } from '../../services/principalService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LibraryEquipment'>;

interface Props {
  navigation: NavigationProp;
}

type TabType = 'All Requests' | 'Drafts' | 'Approved' | 'Rejected' | 'Closed';

const LibraryEquipmentScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('All Requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<EquipmentRequestItem[]>([]);

  const loadEquipmentRequests = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await principalService.getPendingEquipmentRequests('SUBMITTED', 50, 0);
      const resData = res.data as any;
      const data = resData?.data?.items || resData?.items || [];
      setRequests(data);
    } catch (err) {
      console.warn('[LibraryEquipment] Error loading equipment requests:', err);
      setRequests([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEquipmentRequests();
  }, [loadEquipmentRequests]);

  const filteredRequests = requests.filter(req => {
    const matchesSearch =
      req.request_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderRequestCard = ({ item }: { item: EquipmentRequestItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.requestNum}>{item.request_number}</Text>
        <View style={styles.priorityPill}>
          <Text style={styles.priorityText}>{item.priority || 'MEDIUM'}</Text>
        </View>
      </View>
      <Text style={styles.teacherName}>{item.teacher_name}</Text>
      <Text style={styles.purposeText}>{item.purpose}</Text>
      <Text style={styles.itemCount}>{item.item_count || 1} items requested</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.statusText}>STATUS: {item.status}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.globalHeader}>
        <ScaleButton style={styles.menuHandle} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </ScaleButton>
        <Text style={styles.headerTitle}>Resource Requests</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
        >
          {authState.user?.photoUrl ? (
            <Image
              source={{ uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt) }}
              style={styles.headerAvatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'L'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={item => item.id}
        renderItem={renderRequestCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadEquipmentRequests(true)} colors={['#8B5CF6']} />
        }
        ListHeaderComponent={
          <>
            {/* Subheader Banner */}
            <View style={styles.bannerCard}>
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerTitle}>Equipment Requisitions</Text>
                <Text style={styles.bannerSubtitle}>Manage requests for library supplies, hardware, and furniture.</Text>
              </View>
              <TouchableOpacity
                style={styles.newRequestBtn}
                onPress={() => navigation.navigate('LibraryNewSupply')}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.newRequestBtnText}>New Request</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabsRow}>
              {(['All Requests', 'Drafts', 'Approved', 'Rejected', 'Closed'] as const).map(tab => {
                const active = selectedTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabItem, active && styles.tabItemActive]}
                    onPress={() => setSelectedTab(tab)}
                  >
                    <Text style={[styles.tabItemText, active && styles.tabItemTextActive]}>{tab}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Search Bar */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search requests..."
                placeholderTextColor={theme.subtext}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="#8B5CF6" style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="archive-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>NO REQUESTS FOUND</Text>
              <Text style={styles.emptySub}>
                You haven't initiated any equipment requests yet or no matches found.
              </Text>
            </View>
          )
        }
      />

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="library" />
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: theme.background },
    globalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 50 : 35,
      paddingBottom: 12,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    menuHandle: { padding: 4 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: theme.primary, flex: 1, marginLeft: 8 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    headerAvatarImage: { width: 32, height: 32, borderRadius: 16 },
    listContent: { padding: 16 },
    bannerCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bannerInfo: { flex: 1 },
    bannerTitle: { fontSize: 20, fontWeight: '800', color: theme.text },
    bannerSubtitle: { fontSize: 12, color: theme.subtext, marginTop: 2 },
    newRequestBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#8B5CF6',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    newRequestBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
    tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 16, gap: 8 },
    tabItem: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabItemActive: { borderBottomColor: '#8B5CF6' },
    tabItemText: { fontSize: 12, fontWeight: '600', color: theme.subtext },
    tabItemTextActive: { color: '#8B5CF6', fontWeight: '700' },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      height: 40,
      marginBottom: 16,
    },
    searchInput: { flex: 1, fontSize: 13, color: theme.text },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    requestNum: { fontSize: 14, fontWeight: '800', color: theme.text },
    priorityPill: { backgroundColor: '#FFF7ED', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
    priorityText: { fontSize: 10, fontWeight: '700', color: '#EA580C' },
    teacherName: { fontSize: 13, color: theme.subtext, marginBottom: 4 },
    purposeText: { fontSize: 14, color: theme.text, fontWeight: '600', marginBottom: 8 },
    itemCount: { fontSize: 12, color: theme.subtext },
    cardFooter: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10, marginTop: 10 },
    statusText: { fontSize: 11, fontWeight: '700', color: theme.subtext },
    emptyContainer: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: theme.text, marginTop: 12, letterSpacing: 0.5 },
    emptySub: { fontSize: 13, color: theme.subtext, textAlign: 'center', marginTop: 6, maxWidth: 280, lineHeight: 18 },
  });

export default LibraryEquipmentScreen;
