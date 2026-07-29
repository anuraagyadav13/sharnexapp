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
  Modal,
  Alert,
  Share,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import { getCacheBustedUri } from '../../utils/image';

import apiClient from '../../services/apiClient';
import principalService, {
  LibraryDashboardStats,
  LibraryCategoryItem,
  LibraryIssueItem,
  TeacherItem,
} from '../../services/principalService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  const styles = getStyles(theme, isDarkMode);
  const { authState } = useAuth();
  const showToast = useCallback((message: string, type: string = 'info') => {
    Alert.alert(type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info', message);
  }, []);
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Catalog tab pagination & states
  const [books, setBooks] = useState<any[]>([]);
  const [booksTotal, setBooksTotal] = useState(0);
  const [booksOffset, setBooksOffset] = useState(0);
  const [isBooksLoading, setIsBooksLoading] = useState(false);
  const [isBooksLoadingMore, setIsBooksLoadingMore] = useState(false);
  const [hasMoreBooks, setHasMoreBooks] = useState(true);

  // Circulation pagination states
  const [issuesTotal, setIssuesTotal] = useState(0);
  const [issuesOffset, setIssuesOffset] = useState(0);
  const [isIssuesLoadingMore, setIsIssuesLoadingMore] = useState(false);
  const [hasMoreIssues, setHasMoreIssues] = useState(true);

  // Issue Book Flow states
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueStep, setIssueStep] = useState(1);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [booksList, setBooksList] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedDueDate, setSelectedDueDate] = useState<Date>(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [isModalActionLoading, setIsModalActionLoading] = useState(false);

  // Staff search state
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Local filtered books state
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);

  // Circulation search & bulk selection states
  const [circulationSearch, setCirculationSearch] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Fines state
  const [showFineModal, setShowFineModal] = useState(false);
  const [selectedStudentFines, setSelectedStudentFines] = useState<any[]>([]);
  const [selectedFineStudentName, setSelectedFineStudentName] = useState('');

  // Analytics states
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Barcode scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  // Book Details Modal states
  const [selectedBookDetails, setSelectedBookDetails] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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
        principalService.getLibraryIssues(10, 0),
        institutionId ? principalService.getTeachers(institutionId) : Promise.resolve({ data: { data: [] } } as any),
      ]);

      setDashboard(dashRes.data?.data || null);
      setCategories(catRes.data?.data || []);

      const items = issuesRes.data?.data?.items || [];
      const total = issuesRes.data?.data?.pagination?.total || 0;
      setIssues(items);
      setIssuesTotal(total);
      setIssuesOffset(0);
      setHasMoreIssues(10 < total);

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

  // Clickable category to filter books
  const handleCategoryPress = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedTab('catalog');
  }, []);

  // Issue Book Modal Handlers
  const handleOpenIssueModal = useCallback(async () => {
    setIsIssueModalOpen(true);
    setIssueStep(1);
    setIsModalActionLoading(true);
    try {
      const res = await principalService.getClasses();
      const resAny = res as any;
      // Diagnostic log — matches PrincipalClassesScreen pattern; remove once classes populate correctly
      console.log('[PrincipalLibrary] getClasses raw res.data:', JSON.stringify(resAny.data));
      const data = resAny.data?.classes ?? (Array.isArray(resAny.data) ? resAny.data : (resAny.data?.data ?? []));
      console.log('[PrincipalLibrary] classesList resolved:', JSON.stringify(data));
      setClassesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[PrincipalLibrary] Failed to load classes:', err);
      Alert.alert('Error', 'Failed to fetch classes. Please try again.');
      setIsIssueModalOpen(false);
    } finally {
      setIsModalActionLoading(false);
    }
  }, []);

  // Fetch catalog books
  const fetchBooks = useCallback(async (offsetVal = 0, isLoadMore = false) => {
    if (isLoadMore) {
      setIsBooksLoadingMore(true);
    } else {
      setIsBooksLoading(true);
    }
    try {
      const res = await principalService.getLibraryBooks(10, offsetVal, debouncedSearchQuery, selectedCategoryId);
      const resData = res.data as any;
      let items: any[] = [];
      let total = 0;
      if (resData) {
        if (Array.isArray(resData)) {
          items = resData;
          total = resData.length;
        } else if (resData.data) {
          if (Array.isArray(resData.data)) {
            items = resData.data;
            total = resData.data.length;
          } else {
            items = resData.data.items || resData.data.books || [];
            total = resData.data.pagination?.total || items.length;
          }
        } else {
          items = resData.items || resData.books || [];
          total = resData.pagination?.total || items.length;
        }
      }

      if (isLoadMore) {
        setBooks(prev => [...prev, ...items]);
      } else {
        setBooks(items);
      }
      setBooksTotal(total);
      setBooksOffset(offsetVal);
      setHasMoreBooks(offsetVal + 10 < total);
    } catch (err) {
      console.error('[PrincipalLibrary] Failed to fetch books:', err);
      if (!isLoadMore) {
        setBooks([]);
      }
    } finally {
      setIsBooksLoading(false);
      setIsBooksLoadingMore(false);
    }
  }, [debouncedSearchQuery, selectedCategoryId]);

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

  // Return book logic
  const handleReturnBook = useCallback((issueId: string, bookTitle: string) => {
    Alert.alert(
      'Confirm Return',
      `Are you sure you want to return "${bookTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          onPress: async () => {
            try {
              setIsLoading(true);
              await apiClient.post(`/library/issues/${issueId}/return`, {
                returnCondition: 'GOOD',
              });

              showToast('✅ Book returned successfully', 'success');
              await loadData(true);
              await fetchBooks(0, false);
            } catch (error: any) {
              showToast(error.response?.data?.message || 'Failed to return book', 'error');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  }, [showToast, loadData, fetchBooks]);

  // Renew book logic
  const handleRenewBook = useCallback((issueId: string, bookTitle: string) => {
    const newDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    Alert.alert(
      'Renew Book',
      `Renew "${bookTitle}" for 14 more days?\nNew due date: ${newDueDate.toLocaleDateString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Renew',
          onPress: async () => {
            try {
              setIsLoading(true);
              await apiClient.post(`/library/issues/${issueId}/renew`, {
                newDueDate: newDueDate.toISOString(),
              });

              showToast('✅ Book renewed successfully', 'success');
              await loadData(true);
            } catch (error: any) {
              showToast(error.response?.data?.message || 'Failed to renew book', 'error');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  }, [showToast, loadData]);

  // Book Details Modal handler
  const viewBookDetails = useCallback((book: any) => {
    setSelectedBookDetails(book);
    setIsDetailsModalOpen(true);
  }, []);

  // Fine Calculation
  const calculateFine = useCallback((dueDate: string, returnedDate?: string) => {
    const due = new Date(dueDate);
    const returned = returnedDate ? new Date(returnedDate) : new Date();
    const daysLate = Math.max(0, Math.ceil((returned.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
    return daysLate * 5; // ₹5 per day
  }, []);

  // Fetch Student Fines
  const fetchStudentFines = useCallback(async (studentId: string, studentName: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/library/fines/student/${studentId}`);
      const finesData = response.data?.data || response.data || [];
      setSelectedStudentFines(Array.isArray(finesData) ? finesData : []);
      setSelectedFineStudentName(studentName);
      setShowFineModal(true);
    } catch (error) {
      showToast('Failed to fetch fines', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Fetch Analytics
  const [analyticsError, setAnalyticsError] = useState(false);
  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setAnalyticsError(false);
      const response = await apiClient.get('/library/analytics');
      setAnalyticsData(response.data?.data || response.data || null);
    } catch (error) {
      console.log('[PrincipalLibrary] Analytics fetch error:', error);
      setAnalyticsData(null);
      setAnalyticsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle Analytics view
  const toggleAnalytics = useCallback(async () => {
    const nextShow = !showAnalytics;
    setShowAnalytics(nextShow);
    if (nextShow && !analyticsData && !analyticsError) {
      await fetchAnalytics();
    }
  }, [showAnalytics, analyticsData, analyticsError, fetchAnalytics]);

  // Export Library Data
  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    try {
      setIsLoading(true);
      showToast('Generating export...', 'info');

      const response = await apiClient.get(`/library/export/${format}`, {
        params: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        }
      });

      const dataStr = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data || 'No export data available');

      await Share.share({
        message: dataStr,
        title: `Library ${format.toUpperCase()} Report`,
      });

      showToast('✅ Export completed', 'success');
    } catch (error: any) {
      console.error('[LibraryExport] Error exporting report:', error);
      showToast('Export failed: ' + (error.message || 'Server error'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Toggle Selection for Bulk Operations
  const toggleIssueSelection = useCallback((issueId: string) => {
    setSelectedIssues(prev =>
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  }, []);

  // Bulk Return operations
  const handleBulkReturn = useCallback(() => {
    if (selectedIssues.length === 0) {
      showToast('No items selected', 'warning');
      return;
    }

    Alert.alert(
      'Bulk Return',
      `Return ${selectedIssues.length} books?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setIsLoading(true);
              await apiClient.post('/library/return/bulk', {
                issueIds: selectedIssues,
                returnedAt: new Date().toISOString(),
              });

              showToast(`✅ ${selectedIssues.length} books returned`, 'success');
              setSelectedIssues([]);
              setIsBulkMode(false);
              await loadData(true);
              await fetchBooks(0, false);
            } catch (error) {
              showToast('Bulk return failed', 'error');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  }, [selectedIssues, showToast, loadData, fetchBooks]);

  // Barcode quick book lookup
  const handleBarcodeScan = useCallback(async (data: string) => {
    setIsScanning(false);
    setScannedBarcode(data);

    try {
      setIsLoading(true);
      const response = await apiClient.get(`/library/books/barcode/${data}`);
      const book = response.data?.data || response.data;

      if (!book || !book.id) {
        showToast('Book not found for this barcode', 'error');
        return;
      }

      Alert.alert(
        'Book Found',
        `Title: ${book.title}\nAuthor: ${book.author}\nAvailable: ${book.availableCopies || 0}`,
        [
          { text: 'OK' },
          {
            text: 'Issue Book',
            onPress: () => {
              setSelectedBookId(book.id);
              handleOpenIssueModal();
            }
          }
        ]
      );
    } catch (error) {
      showToast('Book not found for this barcode', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, handleOpenIssueModal]);

  // renderAnalytics UI helper
  const renderAnalytics = () => {
    if (!showAnalytics) return null;

    const closeBtn = (
      <TouchableOpacity onPress={() => setShowAnalytics(false)}>
        <Ionicons name="close" size={24} color={theme.text} />
      </TouchableOpacity>
    );

    if (analyticsError || !analyticsData) {
      return (
        <View style={styles.analyticsContainer}>
          <View style={styles.analyticsHeader}>
            <Text style={styles.analyticsTitle}>📊 Library Analytics</Text>
            {closeBtn}
          </View>
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Ionicons name="bar-chart-outline" size={40} color={theme.subtext} />
            <Text style={{ fontSize: 14, color: theme.subtext, marginTop: 12, textAlign: 'center' }}>
              {analyticsError ? "Couldn't load analytics data.\nPull to refresh or try again later." : 'No analytics data available.'}
            </Text>
            {analyticsError && (
              <TouchableOpacity
                onPress={fetchAnalytics}
                style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.primary, borderRadius: 8 }}
              >
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    const data = analyticsData.weeklyIssues || [0, 0, 0, 0, 0, 0, 0];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxVal = Math.max(...data, 1);

    return (
      <View style={styles.analyticsContainer}>
        <View style={styles.analyticsHeader}>
          <Text style={styles.analyticsTitle}>📊 Library Analytics</Text>
          {closeBtn}
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Weekly Issues</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingVertical: 10, paddingHorizontal: 4 }}>
            {data.map((val: number, idx: number) => {
              const barHeight = (val / maxVal) * 80;
              return (
                <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
                  {/* Tooltip value */}
                  <Text style={{ fontSize: 10, color: theme.primary, fontWeight: '700', marginBottom: 4 }}>
                    {val}
                  </Text>

                  {/* Bar column */}
                  <View style={{
                    height: 80,
                    width: 12,
                    backgroundColor: isDarkMode ? '#1E293B' : '#E5E7EB',
                    borderRadius: 6,
                    justifyContent: 'flex-end',
                    overflow: 'hidden'
                  }}>
                    <View style={{
                      height: barHeight,
                      width: '100%',
                      backgroundColor: theme.primary,
                      borderRadius: 6
                    }} />
                  </View>

                  {/* Day Label */}
                  <Text style={{ fontSize: 10, color: theme.subtext, marginTop: 8, fontWeight: '600' }}>
                    {days[idx]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderIssueCard = useCallback(
    ({ item }: { item: LibraryIssueItem }) => {
      const statusStyles = getStatusStyles(item.status);
      const isSelected = selectedIssues.includes(item.id);

      return (
        <View style={[styles.issueCard, isSelected && { borderColor: theme.primary, borderWidth: 1 }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
              {isBulkMode && (
                <TouchableOpacity onPress={() => toggleIssueSelection(item.id)} style={{ marginRight: 8 }}>
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={isSelected ? theme.primary : theme.subtext}
                  />
                </TouchableOpacity>
              )}
              <Text style={styles.bookTitleText}>{item.bookTitle}</Text>
            </View>
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
                {item.studentName} · {item.className || '—'}
              </Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="barcode-outline" size={14} color={theme.subtext} style={{ marginRight: 6 }} />
              <Text style={styles.bodyText}>Copy: {item.copyNumber || 'N/A'}</Text>
            </View>
            {item.status === 'OVERDUE' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                <Text style={[styles.fineText, { marginTop: 0 }]}>Overdue</Text>
                <TouchableOpacity
                  onPress={() => fetchStudentFines(item.studentId, item.studentName)}
                  style={{ marginLeft: 10, paddingVertical: 2, paddingHorizontal: 8, backgroundColor: isDarkMode ? '#3B82F630' : '#EFF6FF', borderRadius: 4 }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#818CF8' : '#3B82F6' }}>View Fine</Text>
                </TouchableOpacity>
              </View>
            )}
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

          {item.status !== 'RETURNED' && !isBulkMode && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                onPress={() => handleReturnBook(item.id, item.bookTitle)}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>Return</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
                onPress={() => handleRenewBook(item.id, item.bookTitle)}
              >
                <Ionicons name="refresh-outline" size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>Renew</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    },
    [getStatusStyles, formatDate, isBulkMode, selectedIssues, toggleIssueSelection, handleReturnBook, handleRenewBook, fetchStudentFines, isDarkMode, theme]
  );

  // Circulation search logic
  const filteredIssues = useMemo(() => {
    if (!circulationSearch.trim()) return issues;

    const query = circulationSearch.toLowerCase();
    return issues.filter(issue =>
      issue.bookTitle?.toLowerCase().includes(query) ||
      issue.studentName?.toLowerCase().includes(query) ||
      issue.className?.toLowerCase().includes(query) ||
      issue.status?.toLowerCase().includes(query)
    );
  }, [issues, circulationSearch]);

  const listHeader = useMemo(() => {
    if (!dashboard) return null;

    return (
      <View style={styles.headerContainer}>
        {renderAnalytics()}

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
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryPill}
                    onPress={() => handleCategoryPress(cat.id)}
                  >
                    <Text style={styles.categoryNameText}>{cat.name}</Text>
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountText}>{bookCount}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Circulation Search and Controls */}
        <View style={{ marginBottom: 16 }}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search issues by book, student..."
              placeholderTextColor={theme.placeholder}
              style={styles.searchInput}
              value={circulationSearch}
              onChangeText={setCirculationSearch}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <View style={styles.exportButtons}>
              <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('csv')}>
                <Ionicons name="document-text-outline" size={16} color="#FFF" />
                <Text style={styles.exportBtnText}>CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('pdf')}>
                <Ionicons name="document-outline" size={16} color="#FFF" />
                <Text style={styles.exportBtnText}>PDF</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.exportBtn, { backgroundColor: isBulkMode ? theme.primary : '#6B7280' }]}
                onPress={() => {
                  setIsBulkMode(!isBulkMode);
                  setSelectedIssues([]);
                }}
              >
                <Ionicons name="checkbox-outline" size={16} color="#FFF" />
                <Text style={styles.exportBtnText}>{isBulkMode ? "Cancel Bulk" : "Bulk Mode"}</Text>
              </TouchableOpacity>

              {isBulkMode && (
                <TouchableOpacity
                  style={[styles.exportBtn, { backgroundColor: '#10B981' }]}
                  onPress={handleBulkReturn}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                  <Text style={styles.exportBtnText}>Return Sel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Book Issues</Text>
      </View>
    );
  }, [dashboard, categories, isDarkMode, theme, showAnalytics, analyticsData, circulationSearch, isBulkMode, selectedIssues, handleBulkReturn, handleExport, handleCategoryPress]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Simulated scanner initialization
  useEffect(() => {
    if (isScanning) {
      setHasCameraPermission(true);
    }
  }, [isScanning]);



  // Trigger catalog load when category or query changes
  useEffect(() => {
    fetchBooks(0, false);
  }, [debouncedSearchQuery, selectedCategoryId, fetchBooks]);

  // Client-side filtering for category and search filters
  useEffect(() => {
    let result = books;

    // Category filter
    if (selectedCategoryId !== 'all') {
      result = result.filter(book => book.categoryId === selectedCategoryId || book.category_id === selectedCategoryId || book.category?.id === selectedCategoryId);
    }

    // Search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(book =>
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.isbn?.toLowerCase().includes(query)
      );
    }

    setFilteredBooks(result);
  }, [books, selectedCategoryId, debouncedSearchQuery]);

  // Infinite Scroll for catalog
  const fetchMoreBooks = useCallback(() => {
    if (isBooksLoading || isBooksLoadingMore || !hasMoreBooks) return;
    fetchBooks(booksOffset + 10, true);
  }, [booksOffset, hasMoreBooks, isBooksLoading, isBooksLoadingMore, fetchBooks]);

  // Infinite Scroll for issues
  const fetchMoreIssues = useCallback(async () => {
    if (isIssuesLoadingMore || !hasMoreIssues) return;
    setIsIssuesLoadingMore(true);
    try {
      const nextOffset = issuesOffset + 10;
      const res = await principalService.getLibraryIssues(10, nextOffset);
      const items = res.data?.data?.items || [];
      const total = res.data?.data?.pagination?.total || 0;

      setIssues(prev => [...prev, ...items]);
      setIssuesOffset(nextOffset);
      setHasMoreIssues(nextOffset + 10 < total);
    } catch (err) {
      console.error('[PrincipalLibrary] Failed to fetch more issues:', err);
    } finally {
      setIsIssuesLoadingMore(false);
    }
  }, [issuesOffset, hasMoreIssues, isIssuesLoadingMore]);



  const handleCloseIssueModal = useCallback(() => {
    setIsIssueModalOpen(false);
    setIssueStep(1);
    setSelectedClassId('');
    setSelectedStudentId('');
    setSelectedBookId('');
    setStudentsList([]);
    setBooksList([]);
  }, []);

  const handleSelectClass = useCallback(async (classId: string) => {
    setSelectedClassId(classId);
    setIssueStep(2);
    setIsModalActionLoading(true);
    try {
      const res = await principalService.getStudentsByClass(classId);
      const data = res.data?.data || res.data?.students || res.data || [];
      setStudentsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[PrincipalLibrary] Failed to load students:', err);
      Alert.alert('Error', 'Failed to fetch students. Please try again.');
      setIssueStep(1);
    } finally {
      setIsModalActionLoading(false);
    }
  }, []);

  const handleSelectStudent = useCallback(async (studentId: string) => {
    setSelectedStudentId(studentId);
    setIssueStep(3);
    setIsModalActionLoading(true);
    try {
      const res = await principalService.getLibraryBooks(100, 0);
      const resData = res.data as any;
      let items: any[] = [];
      if (resData) {
        if (Array.isArray(resData)) {
          items = resData;
        } else if (resData.data) {
          if (Array.isArray(resData.data)) {
            items = resData.data;
          } else {
            items = resData.data.items || resData.data.books || [];
          }
        } else {
          items = resData.items || resData.books || [];
        }
      }
      setBooksList(items);
    } catch (err) {
      console.error('[PrincipalLibrary] Failed to load books:', err);
      Alert.alert('Error', 'Failed to fetch available books. Please try again.');
      setIssueStep(2);
    } finally {
      setIsModalActionLoading(false);
    }
  }, []);

  const handleSelectBook = useCallback((bookId: string) => {
    setSelectedBookId(bookId);
    setIssueStep(4);
  }, []);

  const handleConfirmIssue = useCallback(async () => {
    setIsModalActionLoading(true);
    try {
      const payload = {
        classId: selectedClassId,
        studentId: selectedStudentId,
        bookId: selectedBookId,
        dueDate: selectedDueDate.toISOString().split('T')[0]
      };
      await principalService.issueBook(payload);
      Alert.alert('Success', 'Book has been issued successfully.');
      handleCloseIssueModal();
      loadData(true);
      fetchBooks(0, false);
    } catch (err: any) {
      console.error('[PrincipalLibrary] Failed to issue book:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to issue the book. Please try again.';
      Alert.alert('Error', errMsg);
    } finally {
      setIsModalActionLoading(false);
    }
  }, [selectedClassId, selectedStudentId, selectedBookId, selectedDueDate, loadData, fetchBooks, handleCloseIssueModal]);



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
            data={filteredIssues}
            keyExtractor={(item) => item.id}
            renderItem={renderIssueCard}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={fetchMoreIssues}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => isIssuesLoadingMore ? <ActivityIndicator style={{ paddingVertical: 10 }} color={theme.primary} /> : null}
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
              data={filteredBooks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              onEndReached={fetchMoreBooks}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() => isBooksLoadingMore ? <ActivityIndicator style={{ paddingVertical: 10 }} color={theme.primary} /> : null}
              refreshControl={
                <RefreshControl
                  refreshing={isBooksLoading}
                  onRefresh={() => fetchBooks(0, false)}
                  colors={[theme.primary]}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.issueCard, { marginHorizontal: 0 }]}
                  onPress={() => viewBookDetails(item)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.bookTitleText}>{item.title}</Text>
                    <View style={{ backgroundColor: isDarkMode ? '#4F46E530' : '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#818CF8' : '#4F46E5' }}>ISBN: {item.isbn}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: theme.subtext, marginBottom: 4 }}>Author: {item.author}</Text>
                  <Text style={{ fontSize: 12, color: theme.subtext, marginBottom: 8 }}>Category: {item.categoryName || item.category_name || item.category?.name || 'General'}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#334155' : '#F9FAFB', padding: 8, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: theme.subtext }}>Total Copies: {item.totalCopies ?? item.total_copies ?? 0}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>Available: {item.availableCopies ?? item.available_copies ?? 0}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="book-outline" size={64} color={theme.subtext} />
                  <Text style={styles.emptyTitle}>No books found</Text>
                  <Text style={styles.emptySubtitle}>There are no books matching your search query or selected category.</Text>
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
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.issueCard, { marginHorizontal: 0 }]}
                onPress={() => handleCategoryPress(item.id)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.bookTitleText}>{item.name}</Text>
                  <View style={{ backgroundColor: isDarkMode ? '#10B98120' : '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>{item.book_count || 0} Books</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 4 }}>{item.description || 'No description provided.'}</Text>
              </TouchableOpacity>
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
        const filteredStaff = staff.filter(s =>
          s.name?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
          s.email?.toLowerCase().includes(staffSearchQuery.toLowerCase())
        );
        return (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#334155' : '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
                <Ionicons name="search-outline" size={18} color={theme.subtext} />
                <TextInput
                  placeholder="Search staff by name or email..."
                  placeholderTextColor={theme.placeholder}
                  style={{ flex: 1, marginLeft: 8, fontSize: 13, color: theme.text, padding: 0 }}
                  value={staffSearchQuery}
                  onChangeText={setStaffSearchQuery}
                />
              </View>
            </View>
            <FlatList
              data={filteredStaff}
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
          </View>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={toggleAnalytics} style={styles.scanBtn}>
            <Ionicons name="stats-chart-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsScanning(true)} style={styles.scanBtn}>
            <Ionicons name="barcode-outline" size={22} color={theme.primary} />
            <Text style={styles.scanBtnText}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
          >
            {authState.user?.photoUrl ? (
              <Image source={{ uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt) }} style={styles.headerAvatarImage} />
            ) : (

              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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

      {/* Floating Action Button for Issuing Book */}
      {selectedTab === 'circulation' && !isIssueModalOpen && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleOpenIssueModal}
          accessibilityLabel="Issue Book"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.fabText}>Issue Book</Text>
        </TouchableOpacity>
      )}

      {/* Issue Book Modal */}
      <Modal visible={isIssueModalOpen} transparent animationType="slide" onRequestClose={handleCloseIssueModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Issue Book (Step {issueStep}/4)</Text>
              <TouchableOpacity onPress={handleCloseIssueModal} disabled={isModalActionLoading}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {isModalActionLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.modalLoadingText}>Processing...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {issueStep === 1 && (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.modalSubTitle}>Select Class</Text>
                    {classesList.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.modalItemBtn}
                        onPress={() => handleSelectClass(c.id)}
                      >
                        <Text style={styles.modalItemText}>{c.name} {c.section ? `(${c.section})` : ''}</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.subtext} />
                      </TouchableOpacity>
                    ))}
                    {classesList.length === 0 && (
                      <Text style={styles.modalEmptyText}>No classes found.</Text>
                    )}
                  </View>
                )}

                {issueStep === 2 && (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.modalSubTitle}>Select Student</Text>
                    <TouchableOpacity style={styles.modalBackBtn} onPress={() => setIssueStep(1)}>
                      <Ionicons name="arrow-back" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.modalBackBtnText}>Back to Classes</Text>
                    </TouchableOpacity>
                    {studentsList.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={styles.modalItemBtn}
                        onPress={() => handleSelectStudent(s.id)}
                      >
                        <Text style={styles.modalItemText}>{s.name} {s.rollNumber ? `(Roll: ${s.rollNumber})` : ''}</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.subtext} />
                      </TouchableOpacity>
                    ))}
                    {studentsList.length === 0 && (
                      <Text style={styles.modalEmptyText}>No students found in this class.</Text>
                    )}
                  </View>
                )}

                {issueStep === 3 && (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.modalSubTitle}>Select Book</Text>
                    <TouchableOpacity style={styles.modalBackBtn} onPress={() => setIssueStep(2)}>
                      <Ionicons name="arrow-back" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.modalBackBtnText}>Back to Students</Text>
                    </TouchableOpacity>
                    {booksList.map((b) => {
                      const avail = b.availableCopies ?? b.available_copies ?? 1;
                      return (
                        <TouchableOpacity
                          key={b.id}
                          style={[styles.modalItemBtn, avail <= 0 && { opacity: 0.5 }]}
                          disabled={avail <= 0}
                          onPress={() => handleSelectBook(b.id)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.modalItemText}>{b.title}</Text>
                            <Text style={styles.modalItemSubText}>{b.author} · Available: {avail}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={theme.subtext} />
                        </TouchableOpacity>
                      );
                    })}
                    {booksList.length === 0 && (
                      <Text style={styles.modalEmptyText}>No books cataloged.</Text>
                    )}
                  </View>
                )}

                {issueStep === 4 && (
                  <View style={{ gap: 16 }}>
                    <Text style={styles.modalSubTitle}>Choose Due Date</Text>
                    <TouchableOpacity style={styles.modalBackBtn} onPress={() => setIssueStep(3)}>
                      <Ionicons name="arrow-back" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.modalBackBtnText}>Back to Books</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalDateSelector}
                      onPress={() => setShowDueDatePicker(true)}
                    >
                      <Text style={styles.modalDateText}>
                        {selectedDueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                    </TouchableOpacity>

                    {showDueDatePicker && (
                      <DateTimePicker
                        value={selectedDueDate}
                        mode="date"
                        display="default"
                        minimumDate={new Date()}
                        onChange={(event, date) => {
                          setShowDueDatePicker(false);
                          if (date) setSelectedDueDate(date);
                        }}
                      />
                    )}

                    <TouchableOpacity
                      style={styles.modalConfirmBtn}
                      onPress={handleConfirmIssue}
                      disabled={isModalActionLoading}
                    >
                      <Text style={styles.modalConfirmBtnText}>Confirm Issue</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal visible={isScanning} animationType="slide" onRequestClose={() => setIsScanning(false)}>
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          {/* Header */}
          <View style={{ position: 'absolute', top: 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>Simulated Barcode Scanner</Text>
            <TouchableOpacity onPress={() => setIsScanning(false)} style={{ backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0', padding: 8, borderRadius: 20 }}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Viewfinder simulation card */}
          <View style={{
            width: width - 40,
            height: 240,
            borderWidth: 2,
            borderColor: theme.primary,
            borderRadius: 16,
            backgroundColor: isDarkMode ? '#1E293B' : '#EDF2F7',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 24,
            elevation: 4,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.1,
            shadowRadius: 10
          }}>
            {/* Viewfinder Corners */}
            <View style={{ position: 'absolute', top: 20, left: 20, width: 24, height: 24, borderTopWidth: 4, borderLeftWidth: 4, borderColor: theme.primary }} />
            <View style={{ position: 'absolute', top: 20, right: 20, width: 24, height: 24, borderTopWidth: 4, borderRightWidth: 4, borderColor: theme.primary }} />
            <View style={{ position: 'absolute', bottom: 20, left: 20, width: 24, height: 24, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: theme.primary }} />
            <View style={{ position: 'absolute', bottom: 20, right: 20, width: 24, height: 24, borderBottomWidth: 4, borderRightWidth: 4, borderColor: theme.primary }} />

            {/* Laser scanning line simulation */}
            <View style={{
              width: '80%',
              height: 2,
              backgroundColor: '#EF4444',
              position: 'absolute',
              top: '50%',
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 4
            }} />

            <Ionicons name="camera-outline" size={48} color={theme.subtext} style={{ opacity: 0.4 }} />
            <Text style={{ color: theme.subtext, fontSize: 13, marginTop: 12, fontWeight: '600' }}>[ Camera Preview Feed ]</Text>
          </View>

          {/* Manual Entry bar */}
          <View style={{ width: '100%', gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>Enter Barcode manually:</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                placeholder="Type ISBN or barcode..."
                placeholderTextColor={theme.placeholder}
                style={{
                  flex: 1,
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFF',
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: theme.text,
                  fontSize: 14
                }}
                value={scannedBarcode}
                onChangeText={setScannedBarcode}
              />
              <TouchableOpacity
                onPress={() => {
                  if (scannedBarcode.trim()) {
                    handleBarcodeScan(scannedBarcode.trim());
                  } else {
                    showToast('Please type a barcode', 'warning');
                  }
                }}
                style={{
                  backgroundColor: theme.primary,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Submit</Text>
              </TouchableOpacity>
            </View>

            {/* Mock simulator helpers */}
            <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 16, fontWeight: '600' }}>Simulator Quick Scan Demos:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['9780134685991', '9780321125217', '9780201633610'].map((code) => (
                <TouchableOpacity
                  key={code}
                  onPress={() => {
                    setScannedBarcode(code);
                    handleBarcodeScan(code);
                  }}
                  style={{
                    backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8
                  }}
                >
                  <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700' }}>Scan: {code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Book Details Modal */}
      <Modal visible={isDetailsModalOpen} transparent animationType="fade" onRequestClose={() => setIsDetailsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Details</Text>
              <TouchableOpacity onPress={() => setIsDetailsModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedBookDetails && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={{ alignItems: 'center', marginVertical: 16 }}>
                  <Ionicons name="book" size={80} color={theme.primary} />
                  <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 12, textAlign: 'center' }}>
                    {selectedBookDetails.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.subtext, marginTop: 4 }}>
                    By {selectedBookDetails.author}
                  </Text>
                </View>

                <View style={{ gap: 12, marginTop: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 8 }}>
                    <Text style={{ color: theme.subtext }}>ISBN</Text>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedBookDetails.isbn || 'N/A'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 8 }}>
                    <Text style={{ color: theme.subtext }}>Category</Text>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedBookDetails.categoryName || selectedBookDetails.category_name || selectedBookDetails.category?.name || 'General'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 8 }}>
                    <Text style={{ color: theme.subtext }}>Total Copies</Text>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedBookDetails.totalCopies ?? selectedBookDetails.total_copies ?? 0}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 8 }}>
                    <Text style={{ color: theme.subtext }}>Available Copies</Text>
                    <Text style={{ color: '#10B981', fontWeight: '700' }}>{selectedBookDetails.availableCopies ?? selectedBookDetails.available_copies ?? 0}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 8 }}>
                    <Text style={{ color: theme.subtext }}>Publisher</Text>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedBookDetails.publisher || 'N/A'}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { marginTop: 24 }]}
                  onPress={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedBookId(selectedBookDetails.id);
                    handleOpenIssueModal();
                  }}
                  disabled={selectedBookDetails.availableCopies <= 0}
                >
                  <Text style={styles.modalConfirmBtnText}>
                    {selectedBookDetails.availableCopies <= 0 ? "No Copies Available" : "Issue Book"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Fines Modal */}
      <Modal visible={showFineModal} transparent animationType="fade" onRequestClose={() => setShowFineModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fines - {selectedFineStudentName}</Text>
              <TouchableOpacity onPress={() => setShowFineModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {selectedStudentFines.map((fine: any) => (
                <View key={fine.id} style={[styles.modalItemBtn, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.modalItemText}>{fine.bookTitle || 'Book Fine'}</Text>
                    <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>₹{fine.amount}</Text>
                  </View>
                  <Text style={styles.modalItemSubText}>Reason: {fine.reason || 'Overdue Book'}</Text>
                  <Text style={styles.modalItemSubText}>Status: {fine.status || 'UNPAID'}</Text>

                  {fine.status !== 'PAID' && (
                    <TouchableOpacity
                      style={[styles.modalConfirmBtn, { paddingVertical: 8, marginTop: 10, backgroundColor: '#10B981' }]}
                      onPress={async () => {
                        try {
                          setIsLoading(true);
                          await apiClient.post(`/library/fines/${fine.id}/pay`, {
                            paymentMethod: 'CASH',
                            paidAmount: fine.amount
                          });
                          showToast('✅ Fine marked as paid successfully', 'success');
                          setShowFineModal(false);
                          await loadData(true);
                        } catch (error: any) {
                          showToast('Failed to process fine payment', 'error');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      <Text style={[styles.modalConfirmBtnText, { fontSize: 12 }]}>Mark as Paid</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {selectedStudentFines.length === 0 && (
                <Text style={styles.modalEmptyText}>No active fines found for this student.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};
const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
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
    backgroundColor: isDarkMode ? '#6366F120' : '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#6366F140' : '#E0E7FF',
  },
  categoryNameText: {
    fontSize: 12,
    color: isDarkMode ? '#818CF8' : '#4F46E5',
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
    backgroundColor: isDarkMode ? '#334155' : '#F9FAFB',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: theme.primary,
    borderRadius: 28,
    height: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  modalSubTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 10,
  },
  modalLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalLoadingText: {
    marginTop: 12,
    color: theme.subtext,
    fontSize: 14,
  },
  modalItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? '#334155' : '#F9FAFB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  modalItemSubText: {
    fontSize: 12,
    color: theme.subtext,
    marginTop: 2,
  },
  modalEmptyText: {
    fontSize: 14,
    color: theme.subtext,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  modalBackBtnText: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },
  modalDateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? '#334155' : '#F9FAFB',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  modalConfirmBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  modalConfirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: theme.text,
    padding: 0,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  analyticsContainer: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  chartContainer: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  fineText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scanBtnText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default PrincipalLibraryScreen;
