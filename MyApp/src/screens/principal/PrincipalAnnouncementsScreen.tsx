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
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnnouncementCard = ({ item, index, delay, onDelete }: any) => {
  const getTheme = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'urgent': return { color: '#EF4444', icon: 'alert-decagram-outline' };
      case 'event': return { color: '#8B5CF6', icon: 'calendar-star-outline' };
      case 'update': return { color: '#3B82F6', icon: 'sync-circle-outline' };
      default: return { color: '#10B981', icon: 'bullhorn-outline' };
    }
  };

  const theme = getTheme(item.category);

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.typePill, { backgroundColor: `${theme.color}15` }]}>
          <MaterialCommunityIcons name={theme.icon as any} size={14} color={theme.color} />
          <Text style={[styles.typeText, { color: theme.color }]}>{item.category?.toUpperCase()}</Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>

      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.contentText} numberOfLines={3}>{item.content}</Text>

      <View style={styles.cardBottom}>
        <View style={styles.authorRow}>
           <View style={styles.authorAvatar}><Text style={styles.authorInitial}>{item.author?.charAt(0)}</Text></View>
           <View>
              <Text style={styles.authorName}>{item.author}</Text>
              <View style={styles.targetRow}>
                 <Ionicons name="people-outline" size={12} color="#94A3B8" />
                 <Text style={styles.targetText}>{item.targetAudience || 'General'}</Text>
              </View>
           </View>
        </View>
        <View style={styles.actions}>
           <TouchableOpacity style={styles.circleBtn}><Ionicons name="pencil-outline" size={18} color="#6366F1" /></TouchableOpacity>
           <TouchableOpacity style={[styles.circleBtn, { borderColor: '#FEE2E2' }]} onPress={() => onDelete(item.id)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
           </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const PrincipalAnnouncementsScreen = ({ navigation }: any) => {
  const { authState } = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.ANNOUNCEMENTS);
      const data = res.data.announcements || res.data.data || (Array.isArray(res.data) ? res.data : []);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch announcements:', error);
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setIsRefreshing(true); fetchData(); };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Notice', 'This announcement will be removed from all feeds.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {} }
    ]);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

      {/* Global Header - Student Pattern */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color="#4F46E5" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Institutional Notices</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}>
            <View style={styles.avatarHeader}>
              <Text style={styles.avatarTextHeader}>{authState.user?.name?.charAt(0) || 'A'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.screenTitle}>Broadcast Center</Text>
          <Text style={styles.screenSubtitle}>Manage and distribute official communications across the campus ecosystem.</Text>
        </View>

        {/* Premium Tab Switcher */}
        <View style={styles.tabRow}>
           <View style={styles.tabs}>
              {['All', 'Published', 'Drafts'].map(t => (
                <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
                   <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
           </View>
           <TouchableOpacity style={styles.createBtn}>
              <Ionicons name="add" size={24} color="#FFF" />
           </TouchableOpacity>
        </View>

        {/* Notices List */}
        <View style={styles.list}>
          {isLoading && !isRefreshing ? (
            [1, 2].map(i => <Skeleton key={i} width="100%" height={200} borderRadius={24} style={{ marginBottom: 16 }} />)
          ) : announcements.length === 0 ? (
            <View style={styles.empty}>
               <MaterialCommunityIcons name="bullhorn-variant-outline" size={60} color="#D1D5DB" />
               <Text style={styles.emptyText}>No active announcements found.</Text>
            </View>
          ) : (
            announcements.map((item, index) => (
              <AnnouncementCard key={item.id} item={item} index={index} delay={index * 50} onDelete={handleDelete} />
            ))
          )}
        </View>
      </ScrollView>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Header - Student Pattern
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 24,
    backgroundColor: '#FAFAFF',
  },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatarHeader: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  // Tabs
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 25 },
  tabs: { flex: 1, flexDirection: 'row', backgroundColor: '#FFF', padding: 4, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
  tabActive: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFF' },
  createBtn: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },

  // List
  list: { paddingHorizontal: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  typeText: { fontSize: 10, fontWeight: '900' },
  dateText: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  titleText: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  contentText: { fontSize: 13, color: '#64748B', lineHeight: 20, fontWeight: '500', marginBottom: 20 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  authorInitial: { color: '#4F46E5', fontWeight: '800', fontSize: 14 },
  authorName: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  targetText: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  circleBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '600', marginTop: 15 },
});

export default PrincipalAnnouncementsScreen;
