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
  ScrollView,
  Dimensions,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import principalService, {
  LibraryDashboardStats,
  LibraryCategoryItem,
  LibraryIssueItem,
  TeacherItem,
} from '../../services/principalService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';

const { width } = Dimensions.get('window');

type PrincipalLibraryNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalLibrary'
>;

interface Props {
  navigation: PrincipalLibraryNavigationProp;
}

type TabType = 'circulation' | 'catalog' | 'categories' | 'staff';

const PrincipalLibraryScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  const institutionId = authState.user?.institutionId || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const [selectedTab, setSelectedTab] = useState<TabType>('circulation');
  const [dashboard, setDashboard] = useState<LibraryDashboardStats | null>(null);
  const [categories, setCategories] = useState<LibraryCategoryItem[]>([]);
  const [issues, setIssues] = useState<LibraryIssueItem[]>([]);
  const [staff, setStaff] = useState<TeacherItem[]>([]);

  // Catalog tab states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);

    try {
      const [dashRes, catRes, issuesRes, staffRes] = await Promise.all([
        principalService.getLibraryDashboard(),
        principalService.getLibraryCategories(),
        principalService.getLibraryIssues(50, 0),
        institutionId ? principalService.getTeachers(institutionId) : Promise.resolve({ data: { data: [] } } as any),
      ]);

      setDashboard(dashRes.data?.data || null);
      setCategories(catRes.data?.data || []);
      setIssues(issuesRes.data?.data?.items || []);

      const teacherData = staffRes.data?.data ?? staffRes.data ?? [];
      const teachersList = Array.isArray(teacherData) ? teacherData : (teacherData.staff || []);
      const libraryLibrarians = teachersList.filter((t: any) =>
        t.role === 'LIBRARY_ADMIN' ||
        t.role?.toLowerCase().includes('librarian') ||
        t.role?.toLowerCase().includes('library')
      );
      setStaff(libraryLibrarians);
    } catch (error) {
      console.error('[PrincipalLibrary] Failed to fetch library data:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [institutionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = useCallback((dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return 'N/A';
    }
  }, []);

  const getStatusStyles = useCallback((status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'RETURNED':
        return { bg: isDarkMode ? '#10B98120' : '#ECFDF5', text: '#10B981' }; // green
      case 'ISSUED':
        return { bg: isDarkMode ? '#3B82F620' : '#EFF6FF', text: '#3B82F6' }; // blue
      case 'OVERDUE':
        return { bg: isDarkMode ? '#EF444420' : '#FEF2F2', text: '#EF4444' }; // red
      default:
        return { bg: isDarkMode ? '#374151' : '#F3F4F6', text: theme.subtext }; // grey
    }
  }, [isDarkMode, theme]);

  const renderIssueCard = useCallback(
    ({ item }: { item: LibraryIssueItem }) => {
      const statusStyles = getStatusStyles(item.status);

      return (
        <View style={styles.issueCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.bookTitleText}>{item.bookTitle}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyles.bg }]}>
              <Text style={[styles.statusText, { color: statusStyles.text }]}>
                {item.status || 'ISSUED'}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardBody}>
            <View style={styles.row}>
              <Ionicons name="person-outline" size={14} color={theme.subtext} style={{ marginRight: 6 }} />
              <Text style={styles.bodyText}>
                {item.studentName} · {item.className || 'Class 10'}
              </Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="barcode-outline" size={14} color={theme.subtext} style={{ marginRight: 6 }} />
              <Text style={styles.bodyText}>Copy: {item.copyNumber || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Issued</Text>
              <Text style={styles.dateVal}>{formatDate(item.issueDate)}</Text>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Due Date</Text>
              <Text style={[styles.dateVal, item.status === 'OVERDUE' && styles.overdueValText]}>
                {formatDate(item.dueDate)}
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [getStatusStyles, formatDate]
  );

  const listHeader = useMemo(() => {
    if (!dashboard) return null;

    return (
      <View style={styles.headerContainer}>
        {/* Stats row */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Books</Text>
            <Text style={styles.statVal}>{dashboard.totalBooks || 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Copies</Text>
            <Text style={styles.statVal}>{dashboard.totalCopies || 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Issues</Text>
            <Text style={[styles.statVal, { color: isDarkMode ? '#818CF8' : '#3B82F6' }]}>
              {dashboard.activeIssues || 0}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Overdue</Text>
            <Text style={[styles.statVal, { color: '#EF4444' }]}>
              {dashboard.overdueCount || 0}
            </Text>
          </View>
        </View>

        {/* Categories Section */}
        {categories.length > 0 ? (
          <View style={styles.categoriesWrapper}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScrollContent}
            >
              {categories.map((cat) => {
                const bookCount = parseInt(cat.book_count || '0');
                return (
                  <View key={cat.id} style={styles.categoryPill}>
                    <Text style={styles.categoryNameText}>{cat.name}</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{bookCount}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Recent Book Issues</Text>
      </View>
    );
  }, [dashboard, categories]);

  const catalogRows = useMemo(() => {
    return [] as any[];
  }, []);

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
        <Text style={styles.errorTitle}>Failed to load library data</Text>
        <Text style={styles.errorSubtitle}>
          An error occurred while fetching library dashboard and issues. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'circulation':
        return (
          <FlatList
            data={issues}
            keyExtractor={(item) => item.id}
            renderItem={renderIssueCard}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadData(true)}
                colors={[theme.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={64} color={theme.subtext} />
                <Text style={styles.emptyTitle}>No recent book issues</Text>
                <Text style={styles.emptySubtitle}>
                  Active and returned book issues will show up here.
                </Text>
              </View>
            }
          />
        );
      case 'catalog':
        return (
          <View style={{ flex: 1 }}>
            {/* Search and Category Filter */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#334155' : '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 }}>
                <Ionicons name="search-outline" size={18} color={theme.subtext} />
                <TextInput
                  placeholder="Search books by title, author, isbn..."
                  placeholderTextColor={theme.placeholder}
                  style={{ flex: 1, marginLeft: 8, fontSize: 13, color: theme.text, padding: 0 }}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScrollContent}>
                <TouchableOpacity
                  style={[styles.categoryPill, selectedCategoryId === 'all' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => setSelectedCategoryId('all')}
                >
                  <Text style={[styles.categoryNameText, selectedCategoryId === 'all' && { color: '#FFF' }]}>All</Text>
                </TouchableOpacity>
                {categories.map((cat) => {
                  const isActive = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryPill, isActive && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                      onPress={() => setSelectedCategoryId(cat.id)}
                    >
                      <Text style={[styles.categoryNameText, isActive && { color: '#FFF' }]}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <FlatList
              data={catalogRows}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={[styles.issueCard, { marginHorizontal: 0 }]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.bookTitleText}>{item.title}</Text>
                    <View style={{ backgroundColor: isDarkMode ? '#4F46E530' : '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#818CF8' : '#4F46E5' }}>ISBN: {item.isbn}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: theme.subtext, marginBottom: 8 }}>Author: {item.author}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#334155' : '#F9FAFB', padding: 8, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: theme.subtext }}>Total Copies: {item.copies}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>Available: {item.available}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="book-outline" size={64} color={theme.subtext} />
                  <Text style={styles.emptyTitle}>No books found</Text>
                  <Text style={styles.emptySubtitle}>No books found (Catalog API endpoint is not wired in the backend)</Text>
                </View>
              }
            />
          </View>
        );
      case 'categories':
        return (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={[styles.issueCard, { marginHorizontal: 0 }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.bookTitleText}>{item.name}</Text>
                  <View style={{ backgroundColor: isDarkMode ? '#10B98120' : '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>{item.book_count || 0} Books</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 4 }}>{item.description || 'No description provided.'}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="grid-outline" size={64} color={theme.subtext} />
                <Text style={styles.emptyTitle}>No categories found</Text>
              </View>
            }
          />
        );
      case 'staff':
        return (
          <FlatList
            data={staff}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={[styles.issueCard, { marginHorizontal: 0 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? '#4F46E530' : '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDarkMode ? '#818CF8' : '#4F46E5' }}>{item.name?.charAt(0)}</Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: theme.subtext }}>{item.role || 'Librarian'}</Text>
                  </View>
                </View>
                <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="mail-outline" size={14} color={theme.subtext} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, color: theme.text }}>{item.email}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="call-outline" size={14} color={theme.subtext} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, color: theme.text }}>{item.phone || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color={theme.subtext} />
                <Text style={styles.emptyTitle}>No library staff found</Text>
                <Text style={styles.emptySubtitle}>No staff members are currently assigned as librarians.</Text>
              </View>
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Library Portal</Text>
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

      {/* Tabs Selector Bar */}
      <View style={{ flexDirection: 'row', backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border, paddingHorizontal: 8 }}>
        {[
          { id: 'circulation', label: 'Circulation', icon: 'swap-horizontal' },
          { id: 'catalog', label: 'Catalog', icon: 'book-outline' },
          { id: 'categories', label: 'Categories', icon: 'grid-outline' },
          { id: 'staff', label: 'Library Staff', icon: 'people-outline' },
        ].map((t) => {
          const active = selectedTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: 2,
                borderBottomColor: active ? theme.primary : 'transparent',
              }}
              onPress={() => setSelectedTab(t.id as TabType)}
            >
              <Ionicons name={t.icon} size={16} color={active ? theme.primary : theme.subtext} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: active ? theme.primary : theme.subtext, marginTop: 4 }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>{renderTabContent()}</View>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};
const getStyles = (theme: any) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
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
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerBtn: {
    padding: 4,
  },
  appHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  listContent: {
    paddingBottom: 24,
  },
  headerContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: theme.surface,
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: theme.subtext,
    marginBottom: 6,
    fontWeight: '500',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  categoriesWrapper: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
    marginTop: 8,
  },
  catScrollContent: {
    paddingVertical: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDarkMode ? '#6366F120' : '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.isDarkMode ? '#6366F140' : '#E0E7FF',
  },
  categoryNameText: {
    fontSize: 12,
    color: theme.isDarkMode ? '#818CF8' : '#4F46E5',
    fontWeight: '600',
    marginRight: 6,
  },
  categoryCountBadge: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  categoryCountText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '700',
  },
  issueCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginBottom: 10,
  },
  cardBody: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.isDarkMode ? '#334155' : '#F9FAFB',
    padding: 10,
    borderRadius: 10,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: theme.subtext,
    marginBottom: 2,
    fontWeight: '600',
  },
  dateVal: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
  overdueValText: {
    color: '#EF4444',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: 'center',
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
});;

export default PrincipalLibraryScreen;
