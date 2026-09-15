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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LibraryBookCatalog'>;

interface Props {
  navigation: NavigationProp;
}

interface BookItem {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  availableCopies: number;
  totalCopies: number;
}

const DEFAULT_BOOKS: BookItem[] = [
  { id: '1', title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '9780141439518', category: 'Fiction', availableCopies: 6, totalCopies: 6 },
  { id: '2', title: 'Rich Dad Poor Dad', author: 'Robert T. Kiyosaki', isbn: '9781612680194', category: 'Non-Fiction', availableCopies: 9, totalCopies: 9 },
  { id: '3', title: 'The Power of Now', author: 'Eckhart Tolle', isbn: '9781577314806', category: 'Non-Fiction', availableCopies: 5, totalCopies: 5 },
  { id: '4', title: 'Think and Grow Rich', author: 'Napoleon Hill', isbn: '9781585424337', category: 'Non-Fiction', availableCopies: 11, totalCopies: 11 },
  { id: '5', title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Science & Technology', availableCopies: 8, totalCopies: 8 },
  { id: '6', title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', category: 'Science & Technology', availableCopies: 6, totalCopies: 6 },
  { id: '7', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '9780135957059', category: 'Science & Technology', availableCopies: 7, totalCopies: 7 },
];

const LibraryBookCatalogScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [books, setBooks] = useState<BookItem[]>(DEFAULT_BOOKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Register New Book Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newCategory, setNewCategory] = useState('Fiction');
  const [newCopies, setNewCopies] = useState('1');

  const loadBooks = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await libraryService.listBooks({
        limit: 50,
        offset: 0,
        search: searchQuery,
        categoryId: selectedCategory === 'All' ? '' : selectedCategory,
      });
      const data = res.data?.data || res.data;
      if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
        setBooks(
          data.items.map((b: any, idx: number) => ({
            id: b.id || String(idx),
            title: b.title || 'Untitled Book',
            author: b.author || 'Unknown',
            isbn: b.isbn || 'N/A',
            category: b.categoryName || b.category || 'General',
            availableCopies: b.availableCopies ?? b.available_copies ?? 1,
            totalCopies: b.totalCopies ?? b.total_copies ?? 1,
          }))
        );
      } else {
        setBooks(DEFAULT_BOOKS);
      }
    } catch (err: any) {
      console.warn('[BookCatalog] Error loading books:', err);
      if (err?.response?.status === 403) {
        setErrorMessage('You do not have permission to view the book catalog.');
      } else if (err?.response?.status === 401) {
        setErrorMessage('Session expired. Please log in again.');
      } else {
        setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to fetch books.');
      }
      setBooks(DEFAULT_BOOKS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleSaveBook = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Validation Error', 'Book Title is required');
      return;
    }

    try {
      const payload = {
        title: newTitle.trim(),
        author: newAuthor.trim() || undefined,
        isbn: newIsbn.trim() || undefined,
        categoryId: newCategory,
        initialCopies: parseInt(newCopies, 10) || 1,
      };

      const res = await libraryService.createBook(payload);
      Alert.alert('Success', res.data?.message || 'Book registered successfully');

      setIsAddModalOpen(false);
      setNewTitle('');
      setNewAuthor('');
      setNewIsbn('');
      setNewCategory('Fiction');
      setNewCopies('1');
      loadBooks(true);
    } catch (err: any) {
      console.warn('[BookCatalog] Error registering book:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to register book';
      Alert.alert('Registration Error', msg);
    }
  };

  const filteredBooks = books.filter(b => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderBookItem = ({ item }: { item: BookItem }) => (
    <View style={styles.tableRow}>
      <View style={styles.colTitle}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookMeta}>{item.author} • ISBN: {item.isbn}</Text>
      </View>

      <View style={styles.colCategory}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
      </View>

      <View style={styles.colStock}>
        <Text style={styles.stockText}>{item.availableCopies} / {item.totalCopies}</Text>
      </View>

      <TouchableOpacity
        style={styles.auditBtn}
        onPress={() => Alert.alert('Stock Audit', `Auditing copies for "${item.title}"`)}
      >
        <Text style={styles.auditBtnText}>AUDIT</Text>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Book Catalog</Text>
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
        data={filteredBooks}
        keyExtractor={item => item.id}
        renderItem={renderBookItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadBooks(true)} colors={['#8B5CF6']} />
        }
        ListHeaderComponent={
          <>
            {/* Subheader Banner */}
            <View style={styles.bannerCard}>
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerTitle}>Book Catalog</Text>
                <Text style={styles.bannerSubtitle}>Manage titles, metadata, and physical stock.</Text>
              </View>
              <View style={styles.bannerActions}>
                <TouchableOpacity
                  style={styles.bulkImportBtn}
                  onPress={() => Alert.alert('Bulk Import', 'Select CSV or Excel file to bulk import books.')}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color={theme.text} style={{ marginRight: 4 }} />
                  <Text style={styles.bulkImportBtnText}>Bulk Import</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addNewBookBtn}
                  onPress={() => setIsAddModalOpen(true)}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.addNewBookBtnText}>Add New Book</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Controls Bar: Search & Category Filters */}
            <View style={styles.filterBar}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by title, author, or ISBN..."
                  placeholderTextColor={theme.subtext}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, styles.colTitle]}>TITLE & AUTHOR</Text>
              <Text style={[styles.thText, styles.colCategory]}>CATEGORY</Text>
              <Text style={[styles.thText, styles.colStock]}>COPIES</Text>
              <Text style={[styles.thText, { width: 50, textAlign: 'right' }]}>ACTION</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="#8B5CF6" style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color={theme.subtext} />
              <Text style={styles.emptyTitle}>No books found</Text>
              <Text style={styles.emptySub}>No matching books found in the library catalog.</Text>
            </View>
          )
        }
      />

      {/* Register New Book Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="fade" onRequestClose={() => setIsAddModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Book</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter book title"
                placeholderTextColor="#9CA3AF"
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>

            <View style={styles.rowForm}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Author</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Author name"
                  placeholderTextColor="#9CA3AF"
                  value={newAuthor}
                  onChangeText={setNewAuthor}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>ISBN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ISBN number"
                  placeholderTextColor="#9CA3AF"
                  value={newIsbn}
                  onChangeText={setNewIsbn}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Fiction / Non-Fiction / Technology..."
                placeholderTextColor="#9CA3AF"
                value={newCategory}
                onChangeText={setNewCategory}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Initial Physical Copies</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={newCopies}
                onChangeText={setNewCopies}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBook}>
                <Text style={styles.saveBtnText}>Save Record</Text>
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
    bannerCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    bannerInfo: { marginBottom: 12 },
    bannerTitle: { fontSize: 20, fontWeight: '800', color: theme.text },
    bannerSubtitle: { fontSize: 12, color: theme.subtext, marginTop: 2 },
    bannerActions: { flexDirection: 'row', gap: 10 },
    bulkImportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    bulkImportBtnText: { fontSize: 13, fontWeight: '600', color: theme.text },
    addNewBookBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#8B5CF6',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    addNewBookBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
    filterBar: { marginBottom: 16 },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      height: 40,
    },
    searchInput: { flex: 1, fontSize: 13, color: theme.text },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.surface,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    thText: { fontSize: 11, fontWeight: '700', color: theme.subtext },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    colTitle: { flex: 2 },
    colCategory: { flex: 1, paddingHorizontal: 4 },
    colStock: { width: 55, alignItems: 'center' },
    bookTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
    bookMeta: { fontSize: 11, color: theme.subtext, marginTop: 2 },
    categoryBadge: {
      backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    categoryBadgeText: { fontSize: 11, fontWeight: '600', color: theme.text },
    stockText: { fontSize: 12, fontWeight: '700', color: theme.text },
    auditBtn: { paddingVertical: 4, paddingHorizontal: 8 },
    auditBtnText: { fontSize: 11, fontWeight: '800', color: '#8B5CF6' },
    emptyContainer: { paddingVertical: 40, alignItems: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 8 },
    emptySub: { fontSize: 12, color: theme.subtext, marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: theme.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    formGroup: { marginBottom: 12 },
    rowForm: { flexDirection: 'row', gap: 10 },
    label: { fontSize: 12, fontWeight: '700', color: theme.subtext, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 13, color: theme.text, backgroundColor: theme.background },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
    cancelBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    cancelBtnText: { fontSize: 13, fontWeight: '600', color: theme.subtext },
    saveBtn: { backgroundColor: '#8B5CF6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    saveBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  });

export default LibraryBookCatalogScreen;
