import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
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

type StudyMaterialScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudyMaterial'>;

interface Props {
  navigation: StudyMaterialScreenNavigationProp;
}

const MaterialCard = ({ delay, type, title, desc, tags }: any) => {
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.cardContainer}>
       <View style={styles.cardTop}>
         <View style={styles.typePill}>
           <Text style={styles.typePillText}>{type}</Text>
         </View>
         <Text style={styles.cardTitle}>{title}</Text>
       </View>
       <View style={styles.cardDivider} />
       <View style={styles.cardBottom}>
         <Text style={styles.cardDesc}>{desc}</Text>
         <View style={styles.tagsRow}>
           {tags.map((tag: string, index: number) => (
             <View key={index} style={styles.tagPill}>
               <Text style={styles.tagPillText}>{tag}</Text>
             </View>
           ))}
         </View>
         <ScaleButton activeOpacity={0.8} scaleTo={0.97} style={styles.downloadBtn}>
            <Ionicons name="download-outline" size={16} color="#FFFFFF" style={{marginRight: 6}} />
            <Text style={styles.downloadBtnText}>Download</Text>
         </ScaleButton>
       </View>
    </Animated.View>
  );
}

const StudyMaterialScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);
        // 1. Get profile for student ID
        const profileRes = await apiClient.get(ENDPOINTS.STUDENT.PROFILE);
        const studentId = profileRes.data?.id;

        if (!studentId) {
          throw new Error('Student ID not found');
        }

        // 2. Fetch materials
        const res = await apiClient.get(ENDPOINTS.STUDENT.STUDY_MATERIALS(studentId));
        setMaterials(res.data?.materials || res.data?.data || []);
      } catch (err: any) {
        console.error('Failed to fetch materials:', err);
        setMaterials([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  if (isLoading && materials.length === 0) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const firstMaterialSubject = materials.length > 0 ? materials[0].subject : 'Applied Subjects';

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <ScaleButton 
          style={styles.menuHandle} 
          onPress={() => setDrawerOpen(true)}
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Welcome back, {authState.user?.name?.split(' ')[0] || 'Student'}</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
           <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'S'}</Text>
           </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Title */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <Text style={styles.pageTitle}>Study Material</Text>
           <Text style={styles.pageSubtitle}>View your learning resources</Text>
        </Animated.View>

        {/* Info Banner */}
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.infoBanner}>
           <Text style={styles.infoBannerText}>
             Access comprehensive study materials for {firstMaterialSubject}. Download resources for offline study and exam preparation.
           </Text>
        </Animated.View>

        {/* List of study materials */}
        {materials.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#E5E7EB" />
            <Text style={styles.emptyText}>No study materials found</Text>
          </View>
        ) : (
          materials.map((item, index) => (
            <MaterialCard 
              key={item.id}
              delay={150 + index * 50}
              type={item.type || 'PDF Notes'}
              title={item.title}
              desc={item.description}
              tags={[item.subject || 'General', item.category || 'Reference']}
            />
          ))
        )}

      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
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
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
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
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  infoBanner: {
    backgroundColor: '#F3F4F6',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoBannerText: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 18,
  },

  /* Card Styles */
  cardContainer: {
    backgroundColor: '#FAFAFA', 
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden', 
  },
  cardTop: {
    backgroundColor: '#F3F8FF', 
    padding: 16,
  },
  typePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
    backgroundColor: 'transparent'
  },
  typePillText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  cardBottom: {
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  cardDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagPillText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '600',
  },
  downloadBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
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

export default StudyMaterialScreen;
