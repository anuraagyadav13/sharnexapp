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
  SafeAreaView,
  TextInput,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import principalService, { RmsExamItem } from '../../services/principalService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
import { NavigationDrawer } from '../../components/NavigationDrawer';

type PrincipalRMSNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalRMS'
>;

interface Props {
  navigation: PrincipalRMSNavigationProp;
}

type TabType = 'All' | 'MIDTERM' | 'FINAL' | 'UNIT_TEST' | 'QUARTERLY';

const PrincipalRMSScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const { authState } = useAuth();
  const [exams, setExams] = useState<RmsExamItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<TabType>('All');
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const loadData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);

    try {
      const res = await principalService.getRmsExams();
      setExams(res.data?.data || []);
    } catch (error) {
      console.error('[PrincipalRMS] Failed to fetch exams:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      // Tab filter
      if (selectedTab !== 'All' && exam.examType !== selectedTab) return false;

      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return exam.name?.toLowerCase().includes(query);
      }

      return true;
    });
  }, [exams, selectedTab, searchQuery]);

  const formatDate = useCallback((dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return 'N/A';
    }
  }, []);

  const getExamTypeStyles = useCallback((type: string) => {
    switch (type) {
      case 'MIDTERM':
        return { bg: isDarkMode ? '#3B82F620' : '#EFF6FF', text: '#3B82F6' }; // blue
      case 'FINAL':
        return { bg: isDarkMode ? '#EF444420' : '#FEF2F2', text: '#EF4444' }; // red
      case 'UNIT_TEST':
        return { bg: isDarkMode ? '#F9731620' : '#FFF7ED', text: '#F97316' }; // orange
      case 'QUARTERLY':
        return { bg: isDarkMode ? '#8B5CF620' : '#F5F3FF', text: '#8B5CF6' }; // purple
      default:
        return { bg: isDarkMode ? '#374151' : '#F3F4F6', text: theme.subtext }; // grey
    }
  }, [isDarkMode, theme]);

  const renderExamCard = useCallback(
    ({ item }: { item: RmsExamItem }) => {
      const typeStyles = getExamTypeStyles(item.examType);
      const isStatusActive = item.status === 'ACTIVE';

      return (
        <TouchableOpacity
          style={styles.examCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PrincipalReviewExam', { examId: item.id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.examNameText}>{item.name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: typeStyles.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeStyles.text }]}>
                {item.examType}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardBody}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" style={styles.rowIcon} />
              <Text style={styles.detailLabel}>Academic Year:</Text>
              <Text style={styles.detailValue}>{item.academicYear || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="grid-outline" size={16} color="#6B7280" style={styles.rowIcon} />
              <Text style={styles.detailLabel}>Classes Count:</Text>
              <Text style={styles.detailValue}>
                {item._count?.classes !== undefined ? `${item._count.classes} classes` : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color="#6B7280" style={styles.rowIcon} />
              <Text style={styles.detailLabel}>Created On:</Text>
              <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isStatusActive ? (isDarkMode ? '#05966920' : '#ECFDF5') : (isDarkMode ? '#374151' : '#F3F4F6') },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: isStatusActive ? '#059669' : theme.subtext },
                ]}
              >
                {item.status || 'INACTIVE'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [getExamTypeStyles, formatDate, navigation]
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>RMS Exams</Text>
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.subtext} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exams by name..."
          placeholderTextColor={theme.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.subtext} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {(['All', 'MIDTERM', 'FINAL', 'UNIT_TEST', 'QUARTERLY'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to load exams</Text>
          <Text style={styles.errorSubtitle}>
            An error occurred while fetching the RMS exams list. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredExams}
          keyExtractor={(item) => item.id}
          renderItem={renderExamCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadData(true)}
              colors={['#4F46E5']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="reader-outline" size={64} color={theme.subtext} />
              <Text style={styles.emptyTitle}>No exams found</Text>
              <Text style={styles.emptySubtitle}>
                No exams found matching your current filters or query.
              </Text>
            </View>
          }

        />

      )}
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.background,
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerBtn: {
    padding: 4,
  },
  appHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
  },
  tabsWrapper: {
    backgroundColor: theme.background,
    marginBottom: 8,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  tabTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  examCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  examNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
    marginRight: 12,
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  cardBody: {},
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowIcon: {
    marginRight: 8,
    width: 16,
  },
  detailLabel: {
    fontSize: 13,
    color: theme.subtext,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 12,
    marginTop: 4,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
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
    backgroundColor: '#9F7AEA',
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
});

export default PrincipalRMSScreen;
