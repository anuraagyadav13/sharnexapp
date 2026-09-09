import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { StudentHeader } from '../../components/StudentHeader';
import studentService from '../../services/studentService';

type AnnouncementScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Announcements'>;

interface Props {
  navigation: AnnouncementScreenNavigationProp;
}

// Filter configuration matching website parity (AnnouncementsPage)
const FILTER_TABS = [
  { id: 'all', label: 'All', roles: null },
  { id: 'principal', label: 'Principal Office', roles: ['INSTITUTION_ADMIN', 'CENTRAL_ADMIN', 'admin', 'principal'] },
  { id: 'teacher', label: 'Teacher', roles: ['TEACHER', 'teacher'] },
];

const AnnouncementScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const res = await studentService.getAnnouncements();
      const data = res.normalized?.data?.announcements || res.normalized?.data || res.data?.announcements || res.data?.data || res.data || [];
      const announcementsArray = Array.isArray(data) ? data : (data.announcements ? data.announcements : []);
      setAnnouncements(announcementsArray);
    } catch (err: any) {
      console.error('Failed to fetch announcements:', err);
      setError('Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => fetchAnnouncements(true);

  // Filtered announcements based on selected source tab
  const filteredAnnouncements = useMemo(() => {
    const currentTab = FILTER_TABS.find(tab => tab.id === activeFilter);
    if (!currentTab?.roles) return announcements;
    return announcements.filter(a => {
      const role = (a.creatorRole || a.creator_role || a.senderRole || a.role || '').toLowerCase();
      return currentTab.roles.some((r: string) => r.toLowerCase() === role);
    });
  }, [announcements, activeFilter]);

  const formatRole = (role?: string) => {
    if (!role) return 'Office';
    const r = role.toUpperCase();
    if (r === 'CENTRAL_ADMIN') return 'Central Admin';
    if (r === 'INSTITUTION_ADMIN' || r === 'ADMIN' || r === 'PRINCIPAL') return 'Principal Office';
    if (r === 'TEACHER') return 'Teacher';
    if (r === 'STUDENT') return 'Student';
    return role;
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [authState.user?.id]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Global Header */}
      <StudentHeader 
        title="Announcements"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Page Title */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
          <Text style={styles.pageTitle}>Announcements</Text>
          <Text style={styles.pageSubtitle}>Important updates from your school and teachers</Text>
        </Animated.View>

        {/* Source Role Filter Tabs */}
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.tabsContainer}>
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab.id;
            const count = tab.roles
              ? announcements.filter(a => {
                  const role = (a.creatorRole || a.creator_role || a.senderRole || a.role || '').toLowerCase();
                  return tab.roles.some((r: string) => r.toLowerCase() === role);
                }).length
              : announcements.length;

            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveFilter(tab.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Announcement List */}
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={theme.danger} />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                setError(null);
                fetchAnnouncements();
              }}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAnnouncements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color={theme.border} />
            <Text style={styles.emptyText}>
              {announcements.length === 0 ? 'No announcements yet' : 'No announcements for this category'}
            </Text>
            <Text style={[styles.emptyText, { fontSize: 12, marginTop: 4, opacity: 0.6 }]}>
              {announcements.length === 0
                ? 'Check back later for updates from your school'
                : 'Switch tabs to see announcements from other sources'}
            </Text>
          </View>
        ) : (
          filteredAnnouncements.map((item, index) => {
            const isUrgent = item.priority === 'URGENT' || item.priority === 'HIGH';
            const role = item.creatorRole || item.creator_role || item.senderRole || item.role;
            return (
              <Animated.View 
                key={item.id || index} 
                entering={FadeInUp.delay(100 + (index * 50)).springify()} 
                style={[styles.card, { borderLeftColor: isUrgent ? theme.danger : theme.primary }]}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={[styles.priorityPill, { backgroundColor: isUrgent ? (isDarkMode ? theme.iconBackground : theme.iconBoxPurpleBg) : (isDarkMode ? theme.iconBackground : theme.iconBoxBlueBg) }]}>
                    <Ionicons
                      name="alert-circle"
                      size={13}
                      color={isUrgent ? theme.danger : theme.primary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.priorityText, { color: isUrgent ? theme.danger : theme.primary }]}>
                      {item.priority || 'Normal'} priority
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color={theme.subtext} />
                    <Text style={styles.metaText}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={12} color={theme.subtext} />
                    <Text style={styles.metaText}>{item.creatorName || item.sender || 'Office'}</Text>
                  </View>
                  {role && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{formatRole(role)}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.description}>{item.content || item.description}</Text>

                {(item.attachments || []).map((attach: any, idx: number) => {
                  const attachUrl = typeof attach === 'string' ? null : (attach.url || attach.fileUrl || null);
                  const attachName = typeof attach === 'string' ? attach : (attach.name || attach.fileName || 'document.pdf');
                  const hasUrl = !!attachUrl;
                  const AttachWrapper = hasUrl ? TouchableOpacity : View;
                  return (
                    <AttachWrapper
                      key={idx}
                      style={[styles.attachmentBox, !hasUrl && { opacity: 0.55 }]}
                      {...(hasUrl ? {
                        activeOpacity: 0.8,
                        onPress: () => Linking.openURL(attachUrl).catch(() =>
                          Alert.alert('Error', 'Could not open attachment.')
                        ),
                      } : {})}
                    >
                      <View style={styles.pdfIconWrap}>
                        <Ionicons name="document" size={16} color={theme.danger} />
                        <Text style={styles.pdfIconText}>PDF</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.attachmentText} numberOfLines={1}>{attachName}</Text>
                        {!hasUrl && (
                          <Text style={{ fontSize: 10, color: theme.subtext, marginTop: 2 }}>No download link available</Text>
                        )}
                      </View>
                      {hasUrl && (
                        <Ionicons name="download-outline" size={14} color={theme.primary} style={{ marginLeft: 8 }} />
                      )}
                    </AttachWrapper>
                  );
                })}
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={authState.role || 'student'}
      />
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: theme.primary, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  /* Source Role Tabs */
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.subtext,
  },
  tabTextActive: {
    color: theme.white,
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: isDarkMode ? theme.iconBackground : theme.border,
  },
  tabBadgeActive: {
    backgroundColor: theme.white,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.subtext,
  },
  tabBadgeTextActive: {
    color: theme.primary,
  },

  /* Card */
  card: {
    backgroundColor: theme.surface, 
    borderRadius: 12, 
    padding: 16, 
    marginHorizontal: 20,
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: theme.border,
    borderLeftWidth: 4,
    shadowColor: theme.text, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 10, 
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    lineHeight: 20,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: isDarkMode ? theme.iconBackground : theme.iconBoxBlueBg,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.primary,
  },
  description: {
    fontSize: 12.5,
    color: theme.text,
    lineHeight: 18,
    marginBottom: 16,
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  pdfIconWrap: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  pdfIconText: {
    position: 'absolute',
    bottom: 2,
    fontSize: 5,
    fontWeight: '900',
    color: theme.white,
    backgroundColor: theme.danger,
    paddingHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  attachmentText: {
    fontSize: 12,
    color: theme.text,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: theme.subtext,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: theme.white,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default AnnouncementScreen;
