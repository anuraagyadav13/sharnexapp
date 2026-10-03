import React, { useState, useEffect, useMemo } from 'react';
import { Theme } from '../../constants/theme';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
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
  const styles = getStyles(theme, isDarkMode);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();

  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');

  const fetchMaterials = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const profileRes = await studentService.getProfile();
      const studentId = profileRes.normalized?.data?.id || profileRes.normalized?.data?.student?.id || authState.user?.id;

      if (!studentId) {
        throw new Error('Student ID not found');
      }

      const res = await studentService.getStudyMaterials(studentId);
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

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    materials.forEach(m => {
      const s = m.subject || m.subject_name;
      if (s && typeof s === 'string' && s.trim()) {
        subjects.add(s.trim());
      }
    });
    return Array.from(subjects).sort();
  }, [materials]);

  const uniqueFileTypes = useMemo(() => {
    const types = new Set<string>();
    materials.forEach(m => {
      const t = m.file_type || m.fileType;
      if (t && typeof t === 'string' && t.trim()) {
        types.add(t.trim());
      }
    });
    return Array.from(types).sort();
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || [
        item.title,
        item.description,
        item.subject,
        item.teacher_name,
        item.teacherName,
        item.fileName,
        item.file_name,
      ].some(val => val && String(val).toLowerCase().includes(q));

      const matchesSubject = !selectedSubject ||
        String(item.subject || '').toLowerCase() === selectedSubject.toLowerCase();

      const itemType = item.file_type || item.fileType || '';
      const matchesFileType = !selectedFileType ||
        itemType.toLowerCase() === selectedFileType.toLowerCase();

      return matchesSearch && matchesSubject && matchesFileType;
    });
  }, [materials, searchQuery, selectedSubject, selectedFileType]);

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedSubject !== '' || selectedFileType !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setSelectedFileType('');
  };

  const handleDownloadMaterial = async (item: any) => {
    try {
      const profileRes = await studentService.getProfile();
      const studentId = profileRes.normalized?.data?.id || profileRes.normalized?.data?.student?.id || authState.user?.id;

      if (!studentId || !item?.id) {
        const directUrl = item?.file_url || item?.fileUrl || item?.url;
        if (directUrl) {
          Linking.openURL(directUrl).catch(() => Alert.alert('Error', 'Could not open study material link.'));
          return;
        }
        Alert.alert('Notice', 'No download link available for this study material.');
        return;
      }

      const res = await studentService.downloadMaterial(studentId, item.id);
      const downloadUrl = res.data?.downloadUrl || res.data?.url || res.normalized?.data?.url || item.file_url || item.fileUrl || item.url;

      if (downloadUrl) {
        Linking.openURL(downloadUrl).catch(() => Alert.alert('Error', 'Could not open study material link.'));
      } else {
        Alert.alert('Notice', 'No download link available for this study material.');
      }
    } catch (err) {
      const directUrl = item?.file_url || item?.fileUrl || item?.url;
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
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

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
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
          <Text style={styles.pageTitle}>Study Material</Text>
          <Text style={styles.pageSubtitle}>View your learning resources</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Access comprehensive study materials for {firstMaterialSubject}. Download resources for offline study and exam preparation.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(150).duration(400)} style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search materials..."
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={theme.subtext} />
              </TouchableOpacity>
            )}
          </View>

          {uniqueSubjects.length > 0 && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Subject:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
                <TouchableOpacity
                  style={[styles.pill, selectedSubject === '' && styles.pillActivePrimary]}
                  onPress={() => setSelectedSubject('')}
                >
                  <Text style={[styles.pillText, selectedSubject === '' && styles.pillTextActive]}>All Subjects</Text>
                </TouchableOpacity>
                {uniqueSubjects.map(sub => {
                  const isActive = selectedSubject.toLowerCase() === sub.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={sub}
                      style={[styles.pill, isActive && styles.pillActivePrimary]}
                      onPress={() => setSelectedSubject(isActive ? '' : sub)}
                    >
                      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{sub}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {uniqueFileTypes.length > 0 && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Type:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
                <TouchableOpacity
                  style={[styles.pill, selectedFileType === '' && styles.pillActiveSecondary]}
                  onPress={() => setSelectedFileType('')}
                >
                  <Text style={[styles.pillText, selectedFileType === '' && styles.pillTextActive]}>All Types</Text>
                </TouchableOpacity>
                {uniqueFileTypes.map(ft => {
                  const isActive = selectedFileType.toLowerCase() === ft.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={ft}
                      style={[styles.pill, isActive && styles.pillActiveSecondary]}
                      onPress={() => setSelectedFileType(isActive ? '' : ft)}
                    >
                      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{ft}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {hasActiveFilters && (
            <View style={styles.filterStatusRow}>
              <Text style={styles.filterStatusText}>
                Showing {filteredMaterials.length} of {materials.length} resources
              </Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearFilterText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {filteredMaterials.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color={theme.border} />
            <Text style={styles.emptyText}>
              {materials.length === 0 ? 'No study materials found' : 'No materials match the selected filters'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.resetBtn} onPress={clearFilters}>
                <Text style={styles.resetBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredMaterials.map((item, index) => {
            const fileType = item.file_type || item.fileType || 'PDF';
            const subjectTag = item.subject || 'General';
            const teacherTag = item.teacher_name || item.teacherName || 'Staff';
            return (
              <Animated.View
                key={item.id || index}
                entering={FadeInUp.delay(150 + index * 50).springify()}
                style={styles.cardContainer}
              >
                <View style={styles.cardTop}>
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>{fileType}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.cardBottom}>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                  <View style={styles.tagsRow}>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagPillText}>{subjectTag}</Text>
                    </View>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagPillText}>{teacherTag}</Text>
                    </View>
                  </View>
                  <ScaleButton
                    activeOpacity={0.8}
                    scaleTo={0.97}
                    style={styles.downloadBtn}
                    onPress={() => handleDownloadMaterial(item)}
                  >
                    <Ionicons name="download-outline" size={16} color={theme.surfaceHigh} style={{ marginRight: 6 }} />
                    <Text style={styles.downloadBtnText}>Download</Text>
                  </ScaleButton>
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
    </View>
  );
};

const getStyles = (theme: Theme, isDarkMode: boolean) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 40 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: theme.primary, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  infoBanner: {
    backgroundColor: isDarkMode ? theme.cardNested : theme.faqAnswer,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 11,
    color: theme.subtext,
    lineHeight: 18,
  },

  filterSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.text,
    padding: 0,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.subtext,
    marginRight: 8,
    minWidth: 50,
  },
  pillsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pillActivePrimary: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  pillActiveSecondary: {
    backgroundColor: theme.secondary,
    borderColor: theme.secondary,
  },
  pillText: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '500',
  },
  pillTextActive: {
    color: theme.surfaceHigh,
    fontWeight: '700',
  },
  filterStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingHorizontal: 2,
  },
  filterStatusText: {
    fontSize: 11,
    color: theme.subtext,
  },
  clearFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.primary,
  },

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
    backgroundColor: isDarkMode ? theme.iconBackground : theme.faqAnswer, 
    padding: 16,
  },
  typePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.danger,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  typePillText: {
    color: theme.danger,
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
    backgroundColor: isDarkMode ? theme.iconBackground : theme.iconBoxPurpleBg,
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
    color: theme.surfaceHigh,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: theme.subtext,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resetBtnText: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },
});

export default StudyMaterialScreen;
