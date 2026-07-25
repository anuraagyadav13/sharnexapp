import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  Image,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../store/AuthContext';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import principalService, { AnnouncementItem } from '../../services/principalService';
import Ionicons from 'react-native-vector-icons/Ionicons';

type PrincipalAnnouncementsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalAnnouncements'
>;

interface Props {
  navigation: PrincipalAnnouncementsNavigationProp;
}

const CATEGORIES = ['general', 'academic', 'event', 'holiday'];
const PRIORITIES = ['normal', 'high', 'urgent'];
const AUDIENCES = ['all', 'teachers', 'students', 'parents'];
const STATUSES = ['published', 'draft'];

const PrincipalAnnouncementsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  const institutionId = authState.user?.institutionId || '';

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Published' | 'Drafts'>('All');

  // Default Expiry Date (30 days from now)
  const defaultExpiryStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);

  // Form State
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    status: 'published',
    targetAudience: 'all',
    expiryDate: defaultExpiryStr,
  });

  const loadData = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setIsError(false);

      try {
        const res = await principalService.getAnnouncements(institutionId);
        const rawAnnounce = (res.data as any)?.announcements || (res.data as any)?.data || res.data;
        const list = Array.isArray(rawAnnounce) ? rawAnnounce : ((rawAnnounce as any)?.announcements || []);
        setAnnouncements(list);
      } catch (error) {
        console.error('[PrincipalAnnouncements] Failed to fetch announcements:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [institutionId]
  );

  useEffect(() => {
    if (institutionId) {
      loadData();
    }
  }, [institutionId, loadData]);

  // Set default expiry date when component mounts/resets
  useEffect(() => {
    setForm(f => ({ ...f, expiryDate: defaultExpiryStr }));
  }, [defaultExpiryStr]);

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
    const p = priority?.toLowerCase();
    if (p === 'urgent') {
      return { bg: isDarkMode ? '#EF444420' : '#FEF2F2', text: '#EF4444' }; // red
    } else if (p === 'high') {
      return { bg: isDarkMode ? '#EA580C20' : '#FFF7ED', text: '#EA580C' }; // orange
    } else {
      return { bg: isDarkMode ? '#374151' : '#F3F4F6', text: theme.subtext }; // grey
    }
  }, [isDarkMode, theme]);

  // Filter calculations & tab counts
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Published') return item.status?.toLowerCase() === 'published';
      if (activeTab === 'Drafts') return item.status?.toLowerCase() === 'draft';
      return true;
    });
  }, [announcements, activeTab]);

  const counts = useMemo(() => {
    const all = announcements.length;
    const published = announcements.filter(item => item.status?.toLowerCase() === 'published').length;
    const drafts = announcements.filter(item => item.status?.toLowerCase() === 'draft').length;
    return { all, published, drafts };
  }, [announcements]);

  const handleCreateAnnouncement = async () => {
    if (!form.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the announcement.');
      return;
    }
    if (!form.content.trim()) {
      Alert.alert('Validation Error', 'Please enter some content for the announcement.');
      return;
    }

    try {
      setIsCreating(true);
      const timestamp = Date.now();
      const rand = Math.random().toString(36).substring(2, 9);
      const idempotencyKey = `announcement-institution-${institutionId}-${timestamp}-${rand}`;

      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        priority: form.priority,
        status: form.status,
        targetAudience: form.targetAudience,
        expiryDate: form.expiryDate || defaultExpiryStr,
        institutionId: institutionId,
        classId: null,
        idempotencyKey: idempotencyKey,
      };

      await principalService.createAnnouncement(payload);
      Alert.alert('Success', 'Announcement created successfully.', [
        {
          text: 'OK',
          onPress: () => {
            setCreateModalOpen(false);
            setForm({
              title: '',
              content: '',
              category: 'general',
              priority: 'normal',
              status: 'published',
              targetAudience: 'all',
              expiryDate: defaultExpiryStr,
            });
            loadData();
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to create announcement:', error);
      Alert.alert('Error', 'Failed to create announcement. Please check details and try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await principalService.deleteAnnouncement(id);
              Alert.alert('Success', 'Announcement deleted successfully.');
              await loadData();
            } catch (error) {
              console.error('Failed to delete announcement:', error);
              Alert.alert('Error', 'Failed to delete announcement. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderAnnouncementCard = useCallback(
    ({ item }: { item: AnnouncementItem }) => {
      const priorityStyles = getPriorityStyles(item.priority);
      const isDraft = item.status?.toLowerCase() === 'draft';

      return (
        <View style={styles.announcementCard}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                <Text style={styles.titleText}>{item.title}</Text>
                {isDraft && (
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>DRAFT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.categoryText}>Category: {item.category || 'General'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityStyles.bg }]}>
                <Text style={[styles.priorityBadgeText, { color: priorityStyles.text }]}>
                  {item.priority ? item.priority.toUpperCase() : 'NORMAL'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteAnnouncement(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.contentParagraph}>
            {item.content}
          </Text>

          <View style={styles.cardDivider} />

          <View style={styles.cardFooter}>
            <View style={styles.creatorMeta}>
              <Ionicons name="person-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={styles.creatorText} numberOfLines={1}>
                {item.creatorName || 'Admin'}
              </Text>
            </View>
            <View style={styles.audienceBadge}>
              <Text style={styles.audienceText}>
                Audience: {item.targetAudience ? item.targetAudience.toUpperCase() : 'ALL'}
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateText}>Posted {formatDate(item.createdAt)}</Text>
          </View>
        </View>
      );
    },
    [getPriorityStyles, formatDate]
  );

  const renderHeader = () => {
    return (
      <View style={styles.headerSection}>
        {/* New Announcement Action Card */}
        <View style={styles.newAnnouncementBanner}>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle}>New Announcement</Text>
            <Text style={styles.bannerDesc}>Broadcast an update, notice, or event to classes or everyone.</Text>
          </View>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => setCreateModalOpen(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.bannerBtnText}>Create New</Text>
          </TouchableOpacity>
        </View>

        {/* Section title & Filters */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Announcements</Text>
        </View>

        {/* Horizontal Status Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['All', 'Published', 'Drafts'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const count = tab === 'All' ? counts.all : tab === 'Published' ? counts.published : counts.drafts;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab}
                </Text>
                <View style={[styles.countBadge, isActive ? styles.countBadgeActive : styles.countBadgeInactive]}>
                  <Text style={[styles.countBadgeText, isActive ? styles.countBadgeTextActive : styles.countBadgeTextInactive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to load announcements</Text>
        <Text style={styles.errorSubtitle}>
          An error occurred while fetching the announcements list. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.globalHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
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

      <FlatList
        data={filteredAnnouncements}
        keyExtractor={(item) => item.id}
        renderItem={renderAnnouncementCard}
        ListHeaderComponent={renderHeader}
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
            <Ionicons name="megaphone-outline" size={64} color={theme.subtext} />
            <Text style={styles.emptyTitle}>No announcements found</Text>
            <Text style={styles.emptySubtitle}>
              There are no announcements matching your selected status filter.
            </Text>
          </View>
        }
      />

      {/* Creation Modal */}
      <Modal
        visible={isCreateModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>New Announcement</Text>
              <TouchableOpacity onPress={() => setCreateModalOpen(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalFormScroll}>
              {/* Title Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Annual Sports Meet 2026"
                  placeholderTextColor="#9CA3AF"
                  value={form.title}
                  onChangeText={(val) => setForm(f => ({ ...f, title: val }))}
                />
              </View>

              {/* Content Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Content *</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  placeholder="Write the detailed announcement message here..."
                  placeholderTextColor="#9CA3AF"
                  value={form.content}
                  onChangeText={(val) => setForm(f => ({ ...f, content: val }))}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Category Options */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.selectorRow}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.selectorPill, form.category === cat && styles.selectorPillActive]}
                      onPress={() => setForm(f => ({ ...f, category: cat }))}
                    >
                      <Text style={[styles.selectorPillText, form.category === cat && styles.selectorPillTextActive]}>
                        {cat.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority Options */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.selectorRow}>
                  {PRIORITIES.map((prio) => (
                    <TouchableOpacity
                      key={prio}
                      style={[styles.selectorPill, form.priority === prio && styles.selectorPillActive]}
                      onPress={() => setForm(f => ({ ...f, priority: prio }))}
                    >
                      <Text style={[styles.selectorPillText, form.priority === prio && styles.selectorPillTextActive]}>
                        {prio.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Target Audience Options */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Target Audience</Text>
                <View style={styles.selectorRow}>
                  {AUDIENCES.map((aud) => (
                    <TouchableOpacity
                      key={aud}
                      style={[styles.selectorPill, form.targetAudience === aud && styles.selectorPillActive]}
                      onPress={() => setForm(f => ({ ...f, targetAudience: aud }))}
                    >
                      <Text style={[styles.selectorPillText, form.targetAudience === aud && styles.selectorPillTextActive]}>
                        {aud.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status Options */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status</Text>
                <View style={styles.selectorRow}>
                  {STATUSES.map((stat) => (
                    <TouchableOpacity
                      key={stat}
                      style={[styles.selectorPill, form.status === stat && styles.selectorPillActive]}
                      onPress={() => setForm(f => ({ ...f, status: stat }))}
                    >
                      <Text style={[styles.selectorPillText, form.status === stat && styles.selectorPillTextActive]}>
                        {stat.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Expiry Date Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Expiry Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={form.expiryDate}
                  onChangeText={(val) => setForm(f => ({ ...f, expiryDate: val }))}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalBtnCancel]}
                  onPress={() => setCreateModalOpen(false)}
                  disabled={isCreating}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalBtnCreate]}
                  onPress={handleCreateAnnouncement}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalBtnCreateText}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.background,
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
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === 'ios'
        ? 60
        : (StatusBar.currentHeight ?? 0),
    paddingBottom: 24,
    backgroundColor: theme.background,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  headerSection: {
    marginBottom: 16,
  },
  // Banner style
  newAnnouncementBanner: {
    backgroundColor: theme.primary + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 10,
  },
  bannerInfo: {
    flex: 1,
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 12,
    color: theme.subtext,
    lineHeight: 16,
  },
  bannerBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  // Filter tabs
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.background,
  },
  filterTabActive: {
    backgroundColor: theme.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    marginRight: 6,
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  countBadge: {
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 6,
  },
  countBadgeActive: {
    backgroundColor: theme.isDarkMode ? '#312E81' : '#312E81',
  },
  countBadgeInactive: {
    backgroundColor: theme.border,
  },
  countBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  countBadgeTextActive: {
    color: '#C7D2FE',
  },
  countBadgeTextInactive: {
    color: theme.subtext,
  },
  // Announcement Card
  announcementCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  draftBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  draftBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#D97706',
  },
  categoryText: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
    marginTop: 2,
  },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  contentParagraph: {
    fontSize: 13,
    color: theme.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  creatorText: {
    fontSize: 12,
    color: theme.text,
    fontWeight: '500',
  },
  audienceBadge: {
    backgroundColor: theme.primary + '15',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  audienceText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.primary,
  },
  dateRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 10,
    color: theme.subtext,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.subtext,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Modal Style
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  closeModalBtn: {
    padding: 4,
  },
  modalFormScroll: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: theme.text,
    backgroundColor: theme.background,
  },
  formInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
  },
  selectorPillActive: {
    backgroundColor: theme.primary + '15',
    borderColor: theme.primary,
  },
  selectorPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.text,
  },
  selectorPillTextActive: {
    color: theme.primary,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: theme.background,
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  modalBtnCreate: {
    backgroundColor: theme.primary,
  },
  modalBtnCreateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
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

export default PrincipalAnnouncementsScreen;
