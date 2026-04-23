import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

type AnnouncementScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Announcements'>;

interface Props {
  navigation: AnnouncementScreenNavigationProp;
}

const ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'Mid-Term Examination Schedule',
    priority: 'High priority',
    time: '2 hrs ago',
    sender: "Institution's Office",
    description: 'The mid-term examination schedule for the current semester has been released. Please check the exam timetable on the school portal. All exams will be conducted in the main examination hall. Students must bring their school ID cards and admit cards.',
    attachments: ['Exam_Schedule.pdf', 'Guidelines.pdf'],
    theme: '#EF4444', // Red
  },
];

const AnnouncementScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 1. Resolve ID reliably based on role
        const isTeacher = authState.role === 'teacher';
        const profileEndpoint = isTeacher ? ENDPOINTS.TEACHER.PROFILE : ENDPOINTS.STUDENT.PROFILE;
        const profileRes = await apiClient.get(profileEndpoint);
        
        // 2. Fetch announcements using the appropriate endpoint
        const announcementEndpoint = isTeacher ? ENDPOINTS.TEACHER.ANNOUNCEMENTS : ENDPOINTS.STUDENT.ANNOUNCEMENTS;
        const res = await apiClient.get(announcementEndpoint);
        
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
      }
    };

    fetchAnnouncements();
  }, [authState.user?.id]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />

      {/* Global Header (Attendance Standard) */}
      <View style={styles.globalHeader}>
        <ScaleButton 
          style={styles.menuHandle} 
          onPress={() => setDrawerOpen(true)}
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
        >
          <Ionicons name="menu" size={28} color="#111827" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Welcome back, {authState.user?.name?.split(' ')[0] || (authState.role === 'teacher' ? 'Teacher' : 'Student')}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AccountSettings')} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.iconBtn}>
            <Ionicons name="moon-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: authState.role === 'teacher' ? '#4F46E5' : '#A855F7' }]}>
             <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || (authState.role === 'teacher' ? 'T' : 'S')}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Title */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <Text style={styles.pageTitle}>Announcements</Text>
           <Text style={styles.pageSubtitle}>Important updates from your school and teachers</Text>
        </Animated.View>

        {/* Announcement List */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={60} color="#E5E7EB" />
            <Text style={styles.emptyText}>No announcements found</Text>
          </View>
        ) : (
          announcements.map((item, index) => (
            <Animated.View 
              key={item.id} 
              entering={FadeInUp.delay(100 + (index * 50)).springify()} 
              style={[styles.card, { borderLeftColor: item.priority === 'URGENT' || item.priority === 'HIGH' ? '#EF4444' : '#3B82F6' }]}
            >
               <View style={styles.cardHeaderRow}>
                 <Text style={styles.cardTitle}>{item.title}</Text>
                 <View style={[styles.priorityPill, { backgroundColor: item.priority === 'URGENT' || item.priority === 'HIGH' ? '#FEE2E2' : '#DBEAFE' }]}>
                   <Ionicons name="alert-circle" size={13} color={item.priority === 'URGENT' || item.priority === 'HIGH' ? '#EF4444' : '#3B82F6'} style={{marginRight: 4}} />
                   <Text style={[styles.priorityText, { color: item.priority === 'URGENT' || item.priority === 'HIGH' ? '#EF4444' : '#3B82F6' }]}>
                     {item.priority || 'Normal'} priority
                   </Text>
                 </View>
               </View>

               <View style={styles.metaRow}>
                 <View style={styles.metaItem}>
                   <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                   <Text style={styles.metaText}>
                     {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                   </Text>
                 </View>
                 <View style={styles.metaItem}>
                   <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                   <Text style={styles.metaText}>{item.creatorName || item.sender || 'Office'}</Text>
                 </View>
               </View>

               <Text style={styles.description}>{item.content || item.description}</Text>

               {(item.attachments || []).map((attach: any, idx: number) => (
                 <TouchableOpacity key={idx} style={styles.attachmentBox} activeOpacity={0.8}>
                   <View style={styles.pdfIconWrap}>
                     <Ionicons name="document" size={16} color="#EF4444" />
                     <Text style={styles.pdfIconText}>PDF</Text>
                   </View>
                   <Text style={styles.attachmentText}>{typeof attach === 'string' ? attach : attach.name || 'document.pdf'}</Text>
                 </TouchableOpacity>
               ))}
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

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FAF9F9' },
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 16,
    backgroundColor: '#FFFFFF', 
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
    color: '#4F46E5', // Matches assignments screen accent
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
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  card: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 16, 
    marginHorizontal: 20,
    marginBottom: 16, 
    // Edge color effect via strict border-left
    borderWidth: 1, 
    borderColor: '#FAFAFA',
    borderLeftWidth: 4,
    shadowColor: '#1E293B', 
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
    color: '#111827',
    lineHeight: 20,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
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
    color: '#9CA3AF',
    fontWeight: '500',
  },
  description: {
    fontSize: 12.5,
    color: '#111827',
    lineHeight: 18,
    marginBottom: 16,
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#EF4444',
    paddingHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden'
  },
  attachmentText: {
    fontSize: 12,
    color: '#111827',
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
    color: '#6B7280',
  },
});

export default AnnouncementScreen;
