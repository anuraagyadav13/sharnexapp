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
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import { getCacheBustedUri } from '../../utils/image';
import libraryService, { LibraryIssue } from '../../services/libraryService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LibraryCirculation'>;

interface Props {
  navigation: NavigationProp;
}

interface IssueItem {
  id: string;
  borrowerName: string;
  studentId: string;
  bookTitle: string;
  copyNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'RETURNED' | 'ISSUED' | 'OVERDUE' | string;
}

const DEFAULT_ISSUES: IssueItem[] = [
  { id: '1', borrowerName: 'Atharv Ragdwal', studentId: 'stu-1783416958842-9m0ozze', bookTitle: 'Wings of Fire', copyNumber: 'Copy #9788173711466-1-5631', issueDate: '01/08/2026', dueDate: '15/08/2026', status: 'ISSUED' },
  { id: '2', borrowerName: 'Shubham Mangal', studentId: 'stu-1767956039715-f5zf916', bookTitle: 'Atomic Habits', copyNumber: 'Copy #9780735211292-1-4498', issueDate: '25/07/2026', dueDate: '08/08/2026', status: 'ISSUED' },
  { id: '3', borrowerName: 'Anurag Yadav', studentId: 'stu-1783416958843-0001', bookTitle: 'Clean Code', copyNumber: 'Copy #9780132350884-1-1002', issueDate: '10/07/2026', dueDate: '24/07/2026', status: 'RETURNED' },
];

const MOCK_CLASSES = [
  { id: 'c1', name: 'Class 10 - Sec A' },
  { id: 'c2', name: 'Class 10 - Sec B' },
  { id: 'c3', name: 'Class 12 - Sec A' },
];

const MOCK_STUDENTS = [
  { id: 's1', name: 'Atharv Ragdwal', studentId: 'stu-1783416958842-9m0ozze' },
  { id: 's2', name: 'Shubham Mangal', studentId: 'stu-1767956039715-f5zf916' },
  { id: 's3', name: 'Anurag Yadav', studentId: 'stu-1783416958843-0001' },
];

const MOCK_BOOKS = [
  { id: 'b1', title: 'Wings of Fire', copyNumber: 'Copy #9788173711466-1-5631' },
  { id: 'b2', title: 'Atomic Habits', copyNumber: 'Copy #9780735211292-1-4498' },
  { id: 'b3', title: 'Clean Code', copyNumber: 'Copy #9780132350884-1-1002' },
];

const LibraryCirculationScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [issues, setIssues] = useState<IssueItem[]>(DEFAULT_ISSUES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 4-Step Issue Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [classSearch, setClassSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  const loadIssues = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await libraryService.listIssues({
        limit: 50,
        offset: 0,
        status: selectedStatus === 'ALL' ? '' : selectedStatus,
        search: searchQuery,
      });
      const data = res.data?.data || res.data;
      if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
        setIssues(
          data.items.map((item: any, idx: number) => ({
            id: item.id || String(idx),
            borrowerName: item.studentName || item.borrowerName || 'Student Borrower',
            studentId: item.studentRollNumber || item.studentId || 'stu-001',
            bookTitle: item.bookTitle || 'Library Book',
            copyNumber: item.copyNumber || 'Copy #1',
            issueDate: item.issueDate ? new Date(item.issueDate).toLocaleDateString('en-GB') : '01/08/2026',
            dueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-GB') : '15/08/2026',
            status: item.status || 'ISSUED',
          }))
        );
      } else {
        setIssues(DEFAULT_ISSUES);
      }
    } catch (err: any) {
      console.warn('[Circulation] Error loading issues:', err);
      if (err?.response?.status === 403) {
        setErrorMessage('You do not have permission to view circulation records.');
      } else {
        setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to fetch issues.');
      }
      setIssues(DEFAULT_ISSUES);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedStatus]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleFinishIssue = async () => {
    if (!selectedClass || !selectedStudent || !selectedBook) {
      Alert.alert('Incomplete Wizard', 'Please select class, student, and book');
      return;
    }

    try {
      const payload = {
        studentId: selectedStudent.studentId || selectedStudent.id,
        bookId: selectedBook.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const res = await libraryService.issueBook(payload);
      Alert.alert('Success', res.data?.message || 'Book issued successfully');

      setIsWizardOpen(false);
      setStep(1);
      setSelectedClass(null);
      setSelectedStudent(null);
      setSelectedBook(null);
      loadIssues(true);
    } catch (err: any) {
      console.warn('[Circulation] Error issuing book:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to issue book';
      Alert.alert('Issue Error', msg);
    }
  };

  const handleReturnBook = (issueId: string) => {
    Alert.alert('Confirm Return', 'Are you sure you want to mark this book as returned?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Return Book',
        style: 'default',
        onPress: async () => {
          try {
            const res = await libraryService.returnBook(issueId);
            Alert.alert('Returned', res.data?.message || 'Book returned successfully');
            loadIssues(true);
          } catch (err: any) {
            console.warn('[Circulation] Error returning book:', err);
            Alert.alert('Return Error', err?.response?.data?.message || err?.message || 'Failed to return book');
          }
        },
      },
    ]);
  };

  const filteredIssues = issues.filter(item => {
    const matchesSearch =
      item.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const renderIssueRow = ({ item }: { item: IssueItem }) => (
    <View style={styles.tableRow}>
      <View style={styles.colBorrower}>
        <Text style={styles.borrowerName}>{item.borrowerName}</Text>
        <Text style={styles.subId}>{item.studentId}</Text>
      </View>

      <View style={styles.colBook}>
        <Text style={styles.bookTitle}>{item.bookTitle}</Text>
        <Text style={styles.subCopy}>{item.copyNumber}</Text>
      </View>

      <View style={styles.colTimeline}>
        <Text style={styles.timeLabel}>Issue: {item.issueDate}</Text>
        <Text style={styles.timeLabel}>Due: {item.dueDate}</Text>
      </View>

      <View style={styles.colStatus}>
        <View
          style={[
            styles.statusBadge,
            item.status === 'RETURNED'
              ? { backgroundColor: '#ECFDF5' }
              : item.status === 'ISSUED'
              ? { backgroundColor: '#EFF6FF' }
              : { backgroundColor: '#FEF2F2' },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              item.status === 'RETURNED'
                ? { color: '#10B981' }
                : item.status === 'ISSUED'
                ? { color: '#3B82F6' }
                : { color: '#EF4444' },
            ]}
          >
            {item.status}
          </Text>
        </View>
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
        <Text style={styles.headerTitle}>Circulation Management</Text>
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
        data={filteredIssues}
        keyExtractor={item => item.id}
        renderItem={renderIssueRow}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadIssues(true)} colors={['#8B5CF6']} />
        }
        ListHeaderComponent={
          <>
            {/* Banner */}
            <View style={styles.bannerCard}>
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerTitle}>Circulation Management</Text>
                <Text style={styles.bannerSubtitle}>Track book issues, returns, and renewals.</Text>
              </View>
              <TouchableOpacity
                style={styles.issueBookBtn}
                onPress={() => {
                  setStep(1);
                  setIsWizardOpen(true);
                }}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.issueBookBtnText}>Issue Book</Text>
              </TouchableOpacity>
            </View>

            {/* Filter controls */}
            <View style={styles.filterBar}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search student or book..."
                  placeholderTextColor={theme.subtext}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, styles.colBorrower]}>BORROWER DETAILS</Text>
              <Text style={[styles.thText, styles.colBook]}>BOOK ASSET</Text>
              <Text style={[styles.thText, styles.colTimeline]}>TIMELINES</Text>
              <Text style={[styles.thText, styles.colStatus]}>STATUS</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="#8B5CF6" style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="swap-horizontal-outline" size={48} color={theme.subtext} />
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptySub}>No circulation records match your query.</Text>
            </View>
          )
        }
      />

      {/* 4-Step Issue Book Transaction Wizard Modal */}
      <Modal visible={isWizardOpen} transparent animationType="fade" onRequestClose={() => setIsWizardOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Issue Book Transaction</Text>
              <TouchableOpacity onPress={() => setIsWizardOpen(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Stepper Progress Bar */}
            <View style={styles.stepperRow}>
              {[
                { s: 1, label: 'CLASS' },
                { s: 2, label: 'STUDENT' },
                { s: 3, label: 'BOOK' },
                { s: 4, label: 'CONFIRM' },
              ].map((st, idx) => (
                <React.Fragment key={st.s}>
                  <View style={styles.stepCol}>
                    <View style={[styles.stepBadge, step >= st.s && styles.stepBadgeActive]}>
                      <Text style={[styles.stepBadgeText, step >= st.s && styles.stepBadgeTextActive]}>
                        {st.s}
                      </Text>
                    </View>
                    <Text style={styles.stepLabel}>{st.label}</Text>
                  </View>
                  {idx < 3 && <View style={[styles.stepLine, step > st.s && styles.stepLineActive]} />}
                </React.Fragment>
              ))}
            </View>

            {/* Step Content */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <View style={styles.modalSearchBox}>
                  <Ionicons name="search-outline" size={16} color={theme.subtext} style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search classes..."
                    placeholderTextColor="#9CA3AF"
                    value={classSearch}
                    onChangeText={setClassSearch}
                  />
                </View>

                <ScrollView style={{ maxHeight: 200 }}>
                  {MOCK_CLASSES.filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase())).map(cls => (
                    <TouchableOpacity
                      key={cls.id}
                      style={[styles.listItemOption, selectedClass?.id === cls.id && styles.listItemOptionActive]}
                      onPress={() => {
                        setSelectedClass(cls);
                        setStep(2);
                      }}
                    >
                      <Text style={[styles.listItemText, selectedClass?.id === cls.id && styles.listItemTextActive]}>
                        {cls.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepSubTitle}>Select Student in {selectedClass?.name || 'Class'}:</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                  {MOCK_STUDENTS.map(stu => (
                    <TouchableOpacity
                      key={stu.id}
                      style={[styles.listItemOption, selectedStudent?.id === stu.id && styles.listItemOptionActive]}
                      onPress={() => {
                        setSelectedStudent(stu);
                        setStep(3);
                      }}
                    >
                      <Text style={[styles.listItemText, selectedStudent?.id === stu.id && styles.listItemTextActive]}>
                        {stu.name} ({stu.studentId})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepSubTitle}>Select Book from Catalog:</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                  {MOCK_BOOKS.map(bk => (
                    <TouchableOpacity
                      key={bk.id}
                      style={[styles.listItemOption, selectedBook?.id === bk.id && styles.listItemOptionActive]}
                      onPress={() => {
                        setSelectedBook(bk);
                        setStep(4);
                      }}
                    >
                      <Text style={[styles.listItemText, selectedBook?.id === bk.id && styles.listItemTextActive]}>
                        {bk.title} ({bk.copyNumber})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {step === 4 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepSubTitle}>Transaction Summary:</Text>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLine}>Class: <Text style={styles.val}>{selectedClass?.name}</Text></Text>
                  <Text style={styles.summaryLine}>Borrower: <Text style={styles.val}>{selectedStudent?.name}</Text></Text>
                  <Text style={styles.summaryLine}>Book: <Text style={styles.val}>{selectedBook?.title}</Text></Text>
                  <Text style={styles.summaryLine}>Asset #: <Text style={styles.val}>{selectedBook?.copyNumber}</Text></Text>
                  <Text style={styles.summaryLine}>Return Due: <Text style={styles.val}>14 Days from today</Text></Text>
                </View>
              </View>
            )}

            {/* Step Footer */}
            <View style={styles.wizardFooter}>
              <Text style={styles.stepIndicatorText}>STEP {step} OF 4</Text>
              {step > 1 && (
                <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep((step - 1) as any)}>
                  <Text style={styles.backStepBtnText}>Back</Text>
                </TouchableOpacity>
              )}
              {step === 4 && (
                <TouchableOpacity style={styles.confirmBtn} onPress={handleFinishIssue}>
                  <Text style={styles.confirmBtnText}>Confirm Issue</Text>
                </TouchableOpacity>
              )}
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bannerInfo: { flex: 1 },
    bannerTitle: { fontSize: 20, fontWeight: '800', color: theme.text },
    bannerSubtitle: { fontSize: 12, color: theme.subtext, marginTop: 2 },
    issueBookBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#8B5CF6',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    issueBookBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
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
    colBorrower: { flex: 1.2 },
    colBook: { flex: 1.5 },
    colTimeline: { flex: 1 },
    colStatus: { width: 75, alignItems: 'flex-end' },
    borrowerName: { fontSize: 13, fontWeight: '700', color: theme.text },
    subId: { fontSize: 10, color: theme.subtext, marginTop: 2 },
    bookTitle: { fontSize: 13, fontWeight: '700', color: theme.text },
    subCopy: { fontSize: 10, color: theme.subtext, marginTop: 2 },
    timeLabel: { fontSize: 10, color: theme.subtext },
    statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
    statusBadgeText: { fontSize: 10, fontWeight: '700' },
    emptyContainer: { paddingVertical: 40, alignItems: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 8 },
    emptySub: { fontSize: 12, color: theme.subtext, marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 420, borderWidth: 1, borderColor: theme.border },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    stepCol: { alignItems: 'center' },
    stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
    stepBadgeActive: { backgroundColor: '#8B5CF6' },
    stepBadgeText: { fontSize: 12, fontWeight: '700', color: theme.subtext },
    stepBadgeTextActive: { color: '#FFF' },
    stepLabel: { fontSize: 9, fontWeight: '700', color: theme.subtext, marginTop: 4 },
    stepLine: { flex: 1, height: 2, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', marginHorizontal: 6 },
    stepLineActive: { backgroundColor: '#8B5CF6' },
    stepContent: { marginBottom: 16 },
    modalSearchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 10, height: 38, marginBottom: 10 },
    modalSearchInput: { flex: 1, fontSize: 13, color: theme.text },
    listItemOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
    listItemOptionActive: { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' },
    listItemText: { fontSize: 13, color: theme.text },
    listItemTextActive: { fontWeight: '700', color: '#8B5CF6' },
    stepSubTitle: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 10 },
    summaryBox: { backgroundColor: theme.background, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.border, gap: 6 },
    summaryLine: { fontSize: 12, color: theme.subtext },
    val: { fontWeight: '700', color: theme.text },
    wizardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    stepIndicatorText: { fontSize: 11, fontWeight: '700', color: theme.subtext },
    backStepBtn: { paddingVertical: 6, paddingHorizontal: 12 },
    backStepBtnText: { fontSize: 13, fontWeight: '600', color: theme.subtext },
    confirmBtn: { backgroundColor: '#8B5CF6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    confirmBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  });

export default LibraryCirculationScreen;
