import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../store/ThemeContext';
import { withAlpha, LIGHT_COLORS } from '../../constants/theme';
import { StudentHeader } from '../../components/StudentHeader';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import libraryService, { LibraryIssue, LibraryBookItem } from '../../services/libraryService';

type LibraryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentLibrary'>;

interface Props {
  navigation: LibraryScreenNavigationProp;
}

const PAGE_SIZE = 8;

const LibraryScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-books' | 'browse'>('my-books');

  // Portfolio state
  const [portfolio, setPortfolio] = useState<{ activeIssues: LibraryIssue[]; history: LibraryIssue[] }>({
    activeIssues: [],
    history: [],
  });
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioRefreshing, setPortfolioRefreshing] = useState(false);

  // Books catalog state
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [books, setBooks] = useState<LibraryBookItem[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [booksLoading, setBooksLoading] = useState(false);

  // Fetch student portfolio
  const fetchPortfolio = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setPortfolioRefreshing(true);
      } else {
        setPortfolioLoading(true);
      }

      const res = await libraryService.getStudentPortfolio();
      const data = res.data?.data;
      if (data) {
        setPortfolio({
          activeIssues: Array.isArray(data.activeIssues) ? data.activeIssues : [],
          history: Array.isArray(data.history) ? data.history : [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch student library portfolio:', error);
    } finally {
      setPortfolioLoading(false);
      setPortfolioRefreshing(false);
    }
  }, []);

  // Fetch book catalog
  const fetchBooks = useCallback(async () => {
    try {
      setBooksLoading(true);
      const res = await libraryService.listBooks({
        search: searchTerm.trim() || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });

      const responseData = res.data?.data;
      const fetchedBooks = responseData?.books || responseData?.items || [];
      const total = responseData?.pagination?.total ?? fetchedBooks.length;

      setBooks(fetchedBooks);
      setTotalBooks(total);
    } catch (error) {
      console.error('Failed to fetch library books:', error);
      setBooks([]);
      setTotalBooks(0);
    } finally {
      setBooksLoading(false);
    }
  }, [searchTerm, page]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchBooks();
    }
  }, [activeTab, fetchBooks]);

  const onRefresh = () => {
    fetchPortfolio(true);
    if (activeTab === 'browse') {
      fetchBooks();
    }
  };

  const activeIssues = portfolio?.activeIssues || [];
  const history = portfolio?.history || [];
  const overdueCount = activeIssues.filter(i => (i.status || '').toUpperCase() === 'OVERDUE').length;
  const totalBorrowed = activeIssues.length + history.length;
  const totalPages = Math.ceil(totalBooks / PAGE_SIZE);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      {/* Global Student Header */}
      <StudentHeader
        title="Library Hub"
        navigation={navigation}
        onMenuPress={() => setDrawerOpen(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={portfolioRefreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header Section */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.headerSection}>
          <Text style={styles.screenTitle}>Library Hub</Text>
          <Text style={styles.screenSubtitle}>
            Browse our collection and manage your borrowed books.
          </Text>
        </Animated.View>

        {/* Quick Portfolio Stats */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.statsContainer}>
          <View style={[styles.statCard, { borderLeftColor: theme.primary }]}>
            <View style={[styles.statIconBox, { backgroundColor: isDarkMode ? theme.iconBackground : theme.iconBoxBlueBg }]}>
              <Ionicons name="bookmark-outline" size={20} color={theme.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Active Issues</Text>
              {portfolioLoading ? (
                <ActivityIndicator size="small" color={theme.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
              ) : (
                <Text style={styles.statValue}>{activeIssues.length}</Text>
              )}
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: theme.danger }]}>
            <View style={[styles.statIconBox, { backgroundColor: withAlpha(theme.danger, 0.2) }]}>
              <Ionicons name="time-outline" size={20} color={theme.danger} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Overdue Items</Text>
              {portfolioLoading ? (
                <ActivityIndicator size="small" color={theme.danger} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
              ) : (
                <Text style={[styles.statValue, { color: overdueCount > 0 ? theme.danger : theme.text }]}>
                  {overdueCount}
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: theme.success }]}>
            <View style={[styles.statIconBox, { backgroundColor: withAlpha(theme.success, 0.2) }]}>
              <Ionicons name="person-circle-outline" size={20} color={theme.success} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Books Borrowed (Total)</Text>
              {portfolioLoading ? (
                <ActivityIndicator size="small" color={theme.success} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
              ) : (
                <Text style={styles.statValue}>{totalBorrowed}</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Tab Selector */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'my-books' && styles.tabButtonActive]}
            onPress={() => setActiveTab('my-books')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="bookmark-outline"
              size={16}
              color={activeTab === 'my-books' ? theme.surfaceHigh : theme.subtext}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabButtonText, activeTab === 'my-books' && styles.tabButtonTextActive]}>
              My Books
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'browse' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('browse');
              setPage(0);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="book-outline"
              size={16}
              color={activeTab === 'browse' ? theme.surfaceHigh : theme.subtext}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabButtonText, activeTab === 'browse' && styles.tabButtonTextActive]}>
              Browse Catalog
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Tab 1: My Books */}
        {activeTab === 'my-books' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
            <Text style={styles.sectionHeader}>Currently At Hand</Text>

            {portfolioLoading && !portfolioRefreshing ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : activeIssues.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={48} color={theme.border} />
                <Text style={styles.emptyText}>
                  You haven&apos;t borrowed any books recently.
                </Text>
              </View>
            ) : (
              activeIssues.map((issue, index) => {
                const isOverdue = (issue.status || '').toUpperCase() === 'OVERDUE';
                const formattedDueDate = issue.dueDate
                  ? new Date(issue.dueDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'N/A';

                return (
                  <Animated.View
                    key={issue.id || index}
                    entering={FadeInUp.delay(100 + index * 50).duration(300)}
                    style={[
                      styles.issueCard,
                      isOverdue && styles.issueCardOverdue,
                    ]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.fieldLabelMicro}>TITLE</Text>
                        <Text style={styles.issueBookTitle}>{issue.bookTitle}</Text>
                        <Text style={styles.issueBookAuthor}>{issue.author}</Text>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          isOverdue ? styles.badgeDanger : styles.badgeInfo,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isOverdue ? styles.badgeTextDanger : styles.badgeTextInfo,
                          ]}
                        >
                          {issue.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooterRow}>
                      <View>
                        <Text style={styles.fieldLabelMicro}>DUE DATE</Text>
                        <Text
                          style={[
                            styles.dueDateText,
                            isOverdue && { color: theme.danger },
                          ]}
                        >
                          {formattedDueDate}
                        </Text>
                      </View>
                      <Text style={styles.copyNumberText}>
                        COPY #{issue.copyNumber || '1'}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })
            )}
          </Animated.View>
        )}

        {/* Tab 2: Browse Catalog */}
        {activeTab === 'browse' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
            {/* Search Input Bar */}
            <View style={styles.searchBar}>
              <Ionicons
                name="search-outline"
                size={18}
                color={theme.subtext}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search our collection..."
                placeholderTextColor={theme.placeholder}
                value={searchTerm}
                onChangeText={text => {
                  setSearchTerm(text);
                  setPage(0);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchTerm('');
                    setPage(0);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color={theme.subtext} />
                </TouchableOpacity>
              )}
            </View>

            {/* Books List / Grid */}
            {booksLoading ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : books.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={theme.border} />
                <Text style={styles.emptyText}>No books found matching your search.</Text>
              </View>
            ) : (
              books.map((book, index) => {
                const isAvailable = (book.availableCopies ?? 0) > 0;
                const bookIdShort = (book.id || '').slice(-6).toUpperCase();

                return (
                  <Animated.View
                    key={book.id || index}
                    entering={FadeInUp.delay(80 + index * 40).duration(300)}
                    style={styles.bookCard}
                  >
                    <View style={styles.categoryBadgeRow}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>
                          {book.categoryName || 'General'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                      By {book.author || 'Unknown'}
                    </Text>

                    <View style={styles.bookCardDivider} />

                    <View style={styles.bookCardBottomRow}>
                      <View
                        style={[
                          styles.badge,
                          isAvailable ? styles.badgeSuccess : styles.badgeDanger,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isAvailable ? styles.badgeTextSuccess : styles.badgeTextDanger,
                          ]}
                        >
                          {isAvailable ? `${book.availableCopies} Left` : 'Out of Stock'}
                        </Text>
                      </View>
                      <Text style={styles.bookIdText}>ID: {bookIdShort}</Text>
                    </View>
                  </Animated.View>
                );
              })
            )}

            {/* Pagination Controls */}
            {totalBooks > 0 && (
              <View style={styles.paginationRow}>
                <Text style={styles.paginationLabel}>
                  Showing {page * PAGE_SIZE + 1}–
                  {Math.min((page + 1) * PAGE_SIZE, totalBooks)} of {totalBooks} items
                </Text>
                <View style={styles.paginationButtons}>
                  <TouchableOpacity
                    style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}
                    onPress={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={16}
                      color={page === 0 ? theme.placeholder : theme.primary}
                    />
                    <Text
                      style={[
                        styles.pageButtonText,
                        page === 0 && { color: theme.placeholder },
                      ]}
                    >
                      Back
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.pageButton,
                      page >= totalPages - 1 && styles.pageButtonDisabled,
                    ]}
                    onPress={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    <Text
                      style={[
                        styles.pageButtonText,
                        page >= totalPages - 1 && { color: theme.placeholder },
                      ]}
                    >
                      Next
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={page >= totalPages - 1 ? theme.placeholder : theme.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
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

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingBottom: 40,
    },

    /* Header */
    headerSection: {
      paddingHorizontal: 20,
      marginTop: 12,
      marginBottom: 16,
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.primary,
      marginBottom: 4,
    },
    screenSubtitle: {
      fontSize: 13,
      color: theme.subtext,
      fontWeight: '500',
    },

    /* Top Stats */
    statsContainer: {
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      borderLeftWidth: 4,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    statIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    statContent: {
      flex: 1,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      marginTop: 2,
    },

    /* Tab Bar */
    tabBar: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 18,
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
    },
    tabButtonActive: {
      backgroundColor: theme.primary,
    },
    tabButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.subtext,
    },
    tabButtonTextActive: {
      color: theme.surfaceHigh,
      fontWeight: '700',
    },

    /* Tab Content */
    tabContent: {
      paddingHorizontal: 20,
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 14,
    },

    /* Issue Card */
    issueCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    issueCardOverdue: {
      borderColor: withAlpha(theme.danger, 0.5),
      backgroundColor: withAlpha(theme.danger, 0.12),
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    fieldLabelMicro: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    issueBookTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    issueBookAuthor: {
      fontSize: 12,
      color: theme.subtext,
      fontWeight: '500',
    },
    cardFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    dueDateText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    copyNumberText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.subtext,
    },

    /* Status Badges */
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    badgeInfo: {
      backgroundColor: withAlpha(theme.primary, 0.2),
      borderColor: withAlpha(theme.primary, 0.4),
    },
    badgeTextInfo: {
      color: theme.primary,
      fontSize: 11,
      fontWeight: '700',
    },
    badgeDanger: {
      backgroundColor: withAlpha(theme.danger, 0.2),
      borderColor: withAlpha(theme.danger, 0.4),
    },
    badgeTextDanger: {
      color: theme.danger,
      fontSize: 11,
      fontWeight: '700',
    },
    badgeSuccess: {
      backgroundColor: withAlpha(theme.success, 0.2),
      borderColor: withAlpha(theme.success, 0.4),
    },
    badgeTextSuccess: {
      color: theme.success,
      fontSize: 11,
      fontWeight: '700',
    },

    /* Search Bar */
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      padding: 0,
    },

    /* Book Catalog Card */
    bookCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 2,
    },
    categoryBadgeRow: {
      marginBottom: 10,
    },
    categoryPill: {
      backgroundColor: isDarkMode ? theme.iconBackground : theme.iconBoxBlueBg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    categoryPillText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    bookTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      lineHeight: 22,
      marginBottom: 4,
    },
    bookAuthor: {
      fontSize: 12,
      color: theme.subtext,
      fontWeight: '500',
      marginBottom: 12,
    },
    bookCardDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginBottom: 12,
    },
    bookCardBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bookIdText: {
      fontSize: 11,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontWeight: '700',
      color: theme.subtext,
    },

    /* Pagination */
    paginationRow: {
      marginTop: 10,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    paginationLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.subtext,
    },
    paginationButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    pageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    pageButtonDisabled: {
      opacity: 0.4,
    },
    pageButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
      textTransform: 'uppercase',
    },

    /* States */
    centerLoading: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: '600',
      color: theme.subtext,
      textAlign: 'center',
    },
  });

export default LibraryScreen;
