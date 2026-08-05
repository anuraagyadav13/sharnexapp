import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
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

// ANNOUNCEMENTS static mock array removed — data comes from studentService.getAnnouncements() only.

const AnnouncementScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
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
      
      // Fetch announcements using studentService
      const res = await studentService.getAnnouncements();
      
      // Handle various response types including normalized
      const data = res.normalized?.data?.announcements || res.normalized?.data || res.data?.announcements || res.data?.data || res.data || [];
      const announcementsArray = Array.isArray(data) ? data : (data.announcements ? data.announcements : []);
      setAnnouncements(announcementsArray);
    } catch (error: any) {
      console.error('Failed to fetch announcements:', error);
      setError('Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => fetchAnnouncements(true);

  useEffect(() => {
    fetchAnnouncements();
  }, [authState.user?.id]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

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
                setIsLoading(true);
                studentService.getAnnouncements()
                  .then(res => {
                    const data = res.normalized?.data?.announcements || res.normalized?.data || res.data?.announcements || res.data?.data || res.data || [];
                    const arr = Array.isArray(data) ? data : (data.announcements ? data.announcements : []);
                    setAnnouncements(arr);
                  })
                  .catch((e: any) => setError(e?.message || 'Failed to load announcements'))
                  .finally(() => setIsLoading(false));
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color={theme.border} />
            <Text style={styles.emptyText}>No announcements yet</Text>
            <Text style={[styles.emptyText, { fontSize: 12, marginTop: 4, opacity: 0.6 }]}>Check back later for updates from your school</Text>
          </View>
        ) : (
          announcements.map((item, index) => (
            <Animated.View 
              key={item.id} 
              entering={FadeInUp.delay(100 + (index * 50)).springify()} 
              style={[styles.card, { borderLeftColor: item.priority === 'URGENT' || item.priority === 'HIGH' ? theme.danger : theme.primary }]}
            >
               <View style={styles.cardHeaderRow}>
                 <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={[styles.priorityPill, { backgroundColor: item.priority === 'URGENT' || item.priority === 'HIGH' ? (isDarkMode ? '#7F1D1D' : '#FEE2E2') : (isDarkMode ? '#1E3A8A' : '#DBEAFE') }]}>
                    <Ionicons name="alert-circle" size={13} color={item.priority === 'URGENT' || item.priority === 'HIGH' ? theme.danger : theme.primary} style={{marginRight: 4}} />
                    <Text style={[styles.priorityText, { color: item.priority === 'URGENT' || item.priority === 'HIGH' ? theme.danger : theme.primary }]}>
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
          ))
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

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 16,
    backgroundColor: theme.surface, 
    shadowColor: theme.text,
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBtn: { padding: 4 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: theme.primary, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

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
    gap: 16,
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
    color: '#FFFFFF',
    backgroundColor: theme.danger,
    paddingHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden'
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
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: theme.subtext,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
});

export default AnnouncementScreen;
