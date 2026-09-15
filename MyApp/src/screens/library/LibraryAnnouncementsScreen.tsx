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
  Modal,
  Alert,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { getCacheBustedUri } from '../../utils/image';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LibraryAnnouncements'>;

interface Props {
  navigation: NavigationProp;
}

interface AnnouncementCard {
  id: string;
  title: string;
  content: string;
  status: 'PUBLISHED' | 'DRAFT';
  date: string;
  author: string;
  role: string;
  startDate: string;
  endDate: string;
  type: string;
  grades: string;
  location: string;
  priority: string;
  audience: string;
  category: 'urgent' | 'general' | 'event' | 'update';
}

const DEFAULT_ANNOUNCEMENTS: AnnouncementCard[] = [
  {
    id: 'ann-1',
    title: 'fairwell',
    content: 'Library farewell celebration event for outgoing batch.',
    status: 'PUBLISHED',
    date: 'May 1, 2026',
    author: 'Anurag',
    role: 'Principal',
    startDate: '05/05/2026',
    endDate: '05/06/2026',
    type: 'Culturals',
    grades: 'All Grades',
    location: 'Auditorium',
    priority: 'normal',
    audience: 'all',
    category: 'general',
  },
  {
    id: 'ann-2',
    title: 'Fairwell Party',
    content: 'Library annual gathering and book recognition award ceremony.',
    status: 'PUBLISHED',
    date: 'May 1, 2026',
    author: 'Anurag',
    role: 'Principal',
    startDate: '05/02/2026',
    endDate: '05/02/2026',
    type: 'Culturals',
    grades: 'All Grades',
    location: 'Main Auditorium',
    priority: 'normal',
    audience: 'all',
    category: 'event',
  },
  {
    id: 'ann-3',
    title: 'School Holiday Notice',
    content: 'Library will remain closed during national holiday.',
    status: 'PUBLISHED',
    date: 'Jan 21, 2026',
    author: 'Anurag',
    role: 'Principal',
    startDate: '26/01/2026',
    endDate: '26/01/2026',
    type: 'Notice',
    grades: 'All Grades',
    location: 'Library Portal',
    priority: 'normal',
    audience: 'all',
    category: 'update',
  },
];

const LibraryAnnouncementsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'All' | 'Published' | 'Draft'>('All');
  const [announcements, setAnnouncements] = useState<AnnouncementCard[]>(DEFAULT_ANNOUNCEMENTS);

  // New Announcement Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'urgent' | 'general' | 'event' | 'update'>('general');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newStatus, setNewStatus] = useState<'Published' | 'Draft'>('Published');
  const [newAudience, setNewAudience] = useState('Target: All Students (Institution-wide)');
  const [newExpiryDate, setNewExpiryDate] = useState('');

  const loadAnnouncements = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.ANNOUNCEMENTS);
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setAnnouncements(
          data.map((a: any, idx: number) => ({
            id: a.id || String(idx),
            title: a.title || 'Announcement',
            content: a.content || '',
            status: a.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
            date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'May 1, 2026',
            author: a.creatorName || authState.user?.name || 'Principal',
            role: a.creatorRole || 'Principal',
            startDate: a.startDate || '05/05/2026',
            endDate: a.endDate || '05/06/2026',
            type: a.type || 'Notice',
            grades: a.grades || 'All Grades',
            location: a.location || 'Library Portal',
            priority: a.priority || 'normal',
            audience: a.targetAudience || 'all',
            category: (a.category as any) || 'general',
          }))
        );
      } else {
        setAnnouncements(DEFAULT_ANNOUNCEMENTS);
      }
    } catch (err) {
      console.warn('[Announcements] Error fetching announcements:', err);
      setAnnouncements(DEFAULT_ANNOUNCEMENTS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [authState.user?.name]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleCreateAnnouncement = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Validation Error', 'Announcement Title is required');
      return;
    }

    try {
      const payload = {
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        priority: newPriority.toLowerCase(),
        status: newStatus === 'Published' ? 'PUBLISHED' : 'DRAFT',
        targetAudience: newAudience,
        expiryDate: newExpiryDate || undefined,
      };

      const res = await apiClient.post(ENDPOINTS.PRINCIPAL.ANNOUNCEMENTS, payload);
      Alert.alert('Success', res.data?.message || 'Announcement created successfully');

      setIsAddModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewCategory('general');
      loadAnnouncements(true);
    } catch (err: any) {
      console.warn('[Announcements] Error creating announcement:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to create announcement';
      Alert.alert('Creation Error', msg);
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (selectedTab === 'Published') return a.status === 'PUBLISHED';
    if (selectedTab === 'Draft') return a.status === 'DRAFT';
    return true;
  });

  const renderAnnouncementCard = ({ item }: { item: AnnouncementCard }) => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, item.status === 'PUBLISHED' ? styles.statusPublished : styles.statusDraft]}>
          <Text style={[styles.statusBadgeText, item.status === 'PUBLISHED' ? styles.statusPublishedText : styles.statusDraftText]}>
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.authorMeta}>{item.date} • {item.author} <Text style={styles.roleTag}>{item.role}</Text></Text>

      <Text style={styles.detailsLine}>
        Start: {item.startDate} | End: {item.endDate} | Type: {item.type} | Grades: {item.grades} | Location: {item.location}
      </Text>

      <View style={styles.tagsRow}>
        <View style={styles.tagPill}><Text style={styles.tagPillText}>{item.priority}</Text></View>
        <View style={styles.tagPill}><Text style={styles.tagPillText}>{item.audience}</Text></View>
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
        <Text style={styles.headerTitle}>Library Announcements</Text>
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
        data={filteredAnnouncements}
        keyExtractor={item => item.id}
        renderItem={renderAnnouncementCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadAnnouncements(true)} colors={['#8B5CF6']} />
        }
        ListHeaderComponent={
          <>
            {/* Banner */}
            <View style={styles.bannerCard}>
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerTitle}>Library Announcements</Text>
                <Text style={styles.bannerSubtitle}>Broadcast updates about new arrivals, schedule changes, or events.</Text>
              </View>
              <TouchableOpacity style={styles.newAnnounceBtn} onPress={() => setIsAddModalOpen(true)}>
                <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.newAnnounceBtnText}>New Announcement</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabsRow}>
              {(['All', 'Published', 'Draft'] as const).map(tab => {
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
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="#8B5CF6" style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={48} color={theme.subtext} />
              <Text style={styles.emptyTitle}>No announcements found</Text>
            </View>
          )
        }
      />

      {/* New Announcement Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="fade" onRequestClose={() => setIsAddModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Announcement</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Announcement Title"
                  placeholderTextColor="#9CA3AF"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Content</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter Announcement Details"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={newContent}
                  onChangeText={setNewContent}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryPillsGrid}>
                  {[
                    { key: 'urgent', label: 'urgent', bg: '#FEE2E2', text: '#EF4444' },
                    { key: 'general', label: 'general', bg: '#D1FAE5', text: '#10B981' },
                    { key: 'event', label: 'event', bg: '#F3E8FF', text: '#9333EA' },
                    { key: 'update', label: 'update', bg: '#E0F2FE', text: '#0284C7' },
                  ].map(cat => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.catPillBtn,
                        { backgroundColor: cat.bg },
                        newCategory === cat.key && { borderWidth: 2, borderColor: cat.text },
                      ]}
                      onPress={() => setNewCategory(cat.key as any)}
                    >
                      <Text style={[styles.catPillText, { color: cat.text }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.rowForm}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Priority</Text>
                  <TextInput
                    style={styles.input}
                    value={newPriority}
                    onChangeText={setNewPriority}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Status</Text>
                  <TextInput
                    style={styles.input}
                    value={newStatus}
                    onChangeText={val => setNewStatus(val as any)}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Audience</Text>
                <TextInput
                  style={styles.input}
                  value={newAudience}
                  onChangeText={setNewAudience}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Expiry Date (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="dd-mm-yyyy"
                  placeholderTextColor="#9CA3AF"
                  value={newExpiryDate}
                  onChangeText={setNewExpiryDate}
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateAnnouncement}>
              <Text style={styles.modalSubmitBtnText}>Create Announcement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    newAnnounceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#8B5CF6',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    newAnnounceBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
    tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 16 },
    tabItem: { paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabItemActive: { borderBottomColor: '#8B5CF6' },
    tabItemText: { fontSize: 13, fontWeight: '600', color: theme.subtext },
    tabItemTextActive: { color: '#8B5CF6', fontWeight: '700' },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
    statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
    statusPublished: { backgroundColor: '#D1FAE5' },
    statusDraft: { backgroundColor: '#F3F4F6' },
    statusBadgeText: { fontSize: 10, fontWeight: '800' },
    statusPublishedText: { color: '#10B981' },
    statusDraftText: { color: '#6B7280' },
    authorMeta: { fontSize: 12, color: theme.subtext, marginBottom: 8 },
    roleTag: { backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: 10, paddingHorizontal: 6, borderRadius: 4 },
    detailsLine: { fontSize: 12, color: theme.text, marginBottom: 12, lineHeight: 18 },
    tagsRow: { flexDirection: 'row', gap: 6 },
    tagPill: { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4 },
    tagPillText: { fontSize: 10, fontWeight: '600', color: theme.subtext },
    emptyContainer: { paddingVertical: 40, alignItems: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 420, borderWidth: 1, borderColor: theme.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 14, backgroundColor: '#2563EB', marginHorizontal: -20, marginTop: -20, paddingHorizontal: 20, paddingTop: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    formGroup: { marginBottom: 12 },
    rowForm: { flexDirection: 'row', gap: 10 },
    label: { fontSize: 12, fontWeight: '700', color: theme.subtext, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 13, color: theme.text, backgroundColor: theme.background },
    textArea: { height: 80, textAlignVertical: 'top', paddingTop: 8 },
    categoryPillsGrid: { flexDirection: 'row', gap: 8 },
    catPillBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    catPillText: { fontSize: 12, fontWeight: '700' },
    modalSubmitBtn: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
    modalSubmitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  });

export default LibraryAnnouncementsScreen;
