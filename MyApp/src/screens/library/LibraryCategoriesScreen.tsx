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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { getCacheBustedUri } from '../../utils/image';
import libraryService from '../../services/libraryService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LibraryCategories'>;

interface Props {
  navigation: NavigationProp;
}

interface CategoryCard {
  id: string;
  name: string;
  description: string;
  assetCount: number;
}

const DEFAULT_CATEGORIES: CategoryCard[] = [
  {
    id: 'cat-1',
    name: 'Academic / Educational',
    description: 'Books used for study, school, college, exams, and subject learning.',
    assetCount: 0,
  },
  {
    id: 'cat-2',
    name: 'Fiction',
    description: 'Books based on imagination, stories, novels, drama, romance, mystery, etc.',
    assetCount: 0,
  },
  {
    id: 'cat-3',
    name: 'History & Biography',
    description: 'Books about historical events, famous personalities, and life journeys.',
    assetCount: 0,
  },
  {
    id: 'cat-4',
    name: 'Non-Fiction',
    description: 'Books based on real facts, true events, knowledge, and real-life topics.',
    assetCount: 0,
  },
  {
    id: 'cat-5',
    name: 'Science & Technology',
    description: 'Books related to science, computers, engineering, AI, programming, inventions, etc.',
    assetCount: 0,
  },
];

const LibraryCategoriesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categories, setCategories] = useState<CategoryCard[]>(DEFAULT_CATEGORIES);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Category Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [briefDescription, setBriefDescription] = useState('');

  const loadCategories = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await libraryService.listCategories();
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setCategories(
          data.map((c: any, idx: number) => ({
            id: c.id || String(idx),
            name: c.name || c.categoryName || 'Category',
            description: c.description || 'Library category classification',
            assetCount: c.assetCount ?? c.booksCount ?? 0,
          }))
        );
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err: any) {
      console.warn('[Categories] Error loading categories:', err);
      if (err?.response?.status === 403) {
        setErrorMessage('You do not have permission to view categories.');
      } else {
        setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to fetch categories.');
      }
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCommitCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Validation Error', 'Category Name is required');
      return;
    }

    try {
      const payload = {
        name: categoryName.trim(),
        description: briefDescription.trim() || undefined,
      };

      const res = await libraryService.createCategory(payload);
      Alert.alert('Success', res.data?.message || 'Category committed successfully');

      setIsAddModalOpen(false);
      setCategoryName('');
      setBriefDescription('');
      loadCategories(true);
    } catch (err: any) {
      console.warn('[Categories] Error committing category:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to commit category';
      Alert.alert('Commit Error', msg);
    }
  };

  const renderCategoryCard = ({ item }: { item: CategoryCard }) => (
    <View style={styles.categoryCard}>
      <View style={styles.tagIconBox}>
        <Ionicons name="pricetag" size={18} color="#8B5CF6" />
      </View>
      <Text style={styles.catName}>{item.name}</Text>
      <Text style={styles.catDesc}>{item.description}</Text>
      <View style={styles.catFooter}>
        <Text style={styles.assetCountText}>{item.assetCount} ASSETS</Text>
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
        <Text style={styles.headerTitle}>Taxonomy & Categories</Text>
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
        data={categories}
        keyExtractor={item => item.id}
        renderItem={renderCategoryCard}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadCategories(true)} colors={['#8B5CF6']} />
        }
        ListHeaderComponent={
          <View style={styles.bannerCard}>
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerTitle}>Taxonomy & Categories</Text>
              <Text style={styles.bannerSubtitle}>Organize your library collection into logical classifications.</Text>
            </View>
            <TouchableOpacity style={styles.newCategoryBtn} onPress={() => setIsAddModalOpen(true)}>
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.newCategoryBtnText}>New Category</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="#8B5CF6" style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetags-outline" size={48} color={theme.subtext} />
              <Text style={styles.emptyTitle}>No categories found</Text>
            </View>
          )
        }
      />

      {/* New Library Category Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="fade" onRequestClose={() => setIsAddModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Library Category</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>CATEGORY NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Scientific, Fiction, etc."
                placeholderTextColor="#9CA3AF"
                value={categoryName}
                onChangeText={setCategoryName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>BRIEF DESCRIPTION</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Context or Dewey decimal Info..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={briefDescription}
                onChangeText={setBriefDescription}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.commitBtn} onPress={handleCommitCategory}>
                <Text style={styles.commitBtnText}>COMMIT CATEGORY</Text>
              </TouchableOpacity>
            </View>
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
    columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
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
    newCategoryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#8B5CF6',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    newCategoryBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
    categoryCard: {
      width: '48%',
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tagIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#F3E8FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    catName: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 4 },
    catDesc: { fontSize: 11, color: theme.subtext, lineHeight: 16, marginBottom: 12 },
    catFooter: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8 },
    assetCountText: { fontSize: 10, fontWeight: '700', color: theme.subtext },
    emptyContainer: { paddingVertical: 40, alignItems: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: theme.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    formGroup: { marginBottom: 14 },
    label: { fontSize: 11, fontWeight: '700', color: theme.subtext, marginBottom: 4, letterSpacing: 0.5 },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 13, color: theme.text, backgroundColor: theme.background },
    textArea: { height: 75, textAlignVertical: 'top', paddingTop: 8 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
    cancelBtn: { paddingVertical: 8, paddingHorizontal: 14 },
    cancelBtnText: { fontSize: 12, fontWeight: '700', color: theme.subtext },
    commitBtn: { backgroundColor: '#8B5CF6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    commitBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  });

export default LibraryCategoriesScreen;
