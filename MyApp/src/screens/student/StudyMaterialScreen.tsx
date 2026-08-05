import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
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

type StudyMaterialScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudyMaterial'>;

interface Props {
  navigation: StudyMaterialScreenNavigationProp;
}

const StudyMaterialScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();

  const MaterialCard = ({ delay, type, title, desc, tags, onPressDownload }: any) => {
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
           <ScaleButton activeOpacity={0.8} scaleTo={0.97} style={styles.downloadBtn} onPress={onPressDownload}>
              <Ionicons name="download-outline" size={16} color="#FFFFFF" style={{marginRight: 6}} />
              <Text style={styles.downloadBtnText}>Download</Text>
           </ScaleButton>
         </View>
      </Animated.View>
    );
  };
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMaterials = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      // 1. Resolve student ID reliably
      const profileRes = await studentService.getProfile();
      const studentId = profileRes.normalized?.data?.id || profileRes.normalized?.data?.student?.id || authState.user?.id;

      if (!studentId) {
        throw new Error('Student ID not found');
      }

      // 2. Fetch materials using the resolved ID
      const res = await studentService.getStudyMaterials(studentId);
      // Handle various response types including normalized
      const materialData = res.normalized?.data?.materials || res.normalized?.data || res.data?.materials || res.data?.data || [];
      setMaterials(Array.isArray(materialData) ? materialData : []);
    } catch (err: any) {
      console.error('Failed to fetch materials:', err);
      setMaterials([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => fetchMaterials(true);

  const handleDownloadMaterial = async (item: any) => {
    try {
      const profileRes = await studentService.getProfile();
      const studentId = profileRes.normalized?.data?.id || profileRes.normalized?.data?.student?.id || authState.user?.id;

      if (!studentId || !item?.id) {
        const directUrl = item?.file_url || item?.url;
        if (directUrl) {
          Linking.openURL(directUrl).catch(() => Alert.alert('Error', 'Could not open study material link.'));
          return;
        }
        Alert.alert('Notice', 'No download link available for this study material.');
        return;
      }

      const res = await studentService.downloadMaterial(studentId, item.id);
      const downloadUrl = res.data?.downloadUrl || res.data?.url || res.normalized?.data?.url || item.file_url || item.url;

      if (downloadUrl) {
        Linking.openURL(downloadUrl).catch(() => Alert.alert('Error', 'Could not open study material link.'));
      } else {
        Alert.alert('Notice', 'No download link available for this study material.');
      }
    } catch (err) {
      const directUrl = item?.file_url || item?.url;
      if (directUrl) {
        Linking.openURL(directUrl).catch(() => Alert.alert('Error', 'Could not open study material link.'));
      } else {
        Alert.alert('Error', 'Failed to download study material.');
      }
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [authState.user?.id]);

  if (isLoading && materials.length === 0) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const firstMaterialSubject = materials.length > 0 ? (materials[0].subject || 'Applied Subjects') : 'Applied Subjects';

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {/* Global Header */}
      <StudentHeader 
        title="Study Material"
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
              key={item.id || index}
              delay={150 + index * 50}
              type={item.file_type || 'PDF'}
              title={item.title}
              desc={item.description}
              tags={[item.subject || 'General', item.teacher_name || 'Staff']}
              onPressDownload={() => handleDownloadMaterial(item)}
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
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: theme.primary, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  infoBanner: {
    backgroundColor: theme.isDarkMode ? '#1E293B' : '#F3F4F6',
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoBannerText: {
    fontSize: 11,
    color: theme.subtext,
    lineHeight: 18,
  },

  /* Card Styles */
  cardContainer: {
    backgroundColor: theme.surface, 
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden', 
  },
  cardTop: {
    backgroundColor: theme.isDarkMode ? '#1E293B' : '#F3F8FF', 
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
    color: theme.text,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.border,
    width: '100%',
  },
  cardBottom: {
    padding: 16,
    backgroundColor: theme.surface,
  },
  cardDesc: {
    fontSize: 12,
    color: theme.subtext,
    lineHeight: 18,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagPill: {
    backgroundColor: theme.isDarkMode ? '#312E8130' : '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagPillText: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  downloadBtn: {
    backgroundColor: theme.primary,
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
    color: theme.subtext,
  },
});

export default StudyMaterialScreen;
