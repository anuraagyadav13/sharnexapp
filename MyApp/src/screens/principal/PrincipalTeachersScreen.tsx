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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../store/AuthContext';
import principalService, { TeacherItem } from '../../services/principalService';
import { useTheme } from '../../store/ThemeContext';
import { withAlpha, LIGHT_COLORS } from '../../constants/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

type PrincipalTeachersNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalTeachers'
>;

interface Props {
  navigation: PrincipalTeachersNavigationProp;
}

type TabType = 'All' | 'Active' | 'Verified';

const PrincipalTeachersScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const institutionId = authState.user?.institutionId || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<TabType>('All');

  const loadData = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setIsError(false);

      try {
        const res = await principalService.getTeachers(institutionId);
        setTeachers(res.data?.data || []);
      } catch (error) {
        console.error('[PrincipalTeachers] Failed to fetch teachers:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [institutionId]
  );

  useEffect(() => {
    if (institutionId) {
      loadData();
    }
  }, [institutionId, loadData]);

  // Combined search + tab filtering
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      // Tab check
      if (selectedTab === 'Active' && !teacher.isActive) return false;
      if (selectedTab === 'Verified' && !teacher.isVerified) return false;

      // Search query check
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = teacher.name?.toLowerCase().includes(query);
        const emailMatch = teacher.email?.toLowerCase().includes(query);
        return nameMatch || emailMatch;
      }

      return true;
    });
  }, [teachers, selectedTab, searchQuery]);

  const formatDate = useCallback((dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return 'N/A';
    }
  }, []);

  const renderTeacherCard = useCallback(
    ({ item }: { item: TeacherItem }) => {
      const firstLetter = item.name ? item.name.charAt(0).toUpperCase() : 'T';

      // Badge style configurations
      const roleColor = item.role === 'LIBRARY_ADMIN' ? theme.secondary : theme.primary;
      const roleBg = item.role === 'LIBRARY_ADMIN' ? (withAlpha(theme.primary, 0.2)) : (withAlpha(theme.info, 0.2));

      return (
        <View style={styles.teacherCard}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.teacherName}>{item.name}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.roleBadge, { backgroundColor: roleBg }]}>
                  <Text style={[styles.roleText, { color: roleColor }]}>
                    {item.role || 'TEACHER'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.verifyBadge,
                    { backgroundColor: item.isVerified ? (withAlpha(theme.success, 0.2)) : (withAlpha(theme.subtext, 0.2)) },
                  ]}
                >
                  <Text
                    style={[
                      styles.verifyText,
                      { color: item.isVerified ? theme.success : theme.subtext },
                    ]}
                  >
                    {item.isVerified ? 'Verified' : 'Unverified'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardBody}>
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={16} color={theme.subtext} style={styles.rowIcon} />
              <Text style={styles.detailText}>{item.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color={theme.subtext} style={styles.rowIcon} />
              <Text style={styles.detailText}>{item.phone || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="book-outline" size={16} color={theme.subtext} style={styles.rowIcon} />
              <Text style={styles.detailText}>
                {item.assignedClassesCount || 0} classes assigned
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.joinedText}>Joined {formatDate(item.createdAt)}</Text>
          </View>
        </View>
      );
    },
    [formatDate]
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
        <Text style={styles.errorTitle}>Failed to load teachers</Text>
        <Text style={styles.errorSubtitle}>
          An error occurred while fetching the staff list. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Teachers</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.placeholder} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Filter Row */}
      <View style={styles.tabsRow}>
        {(['All', 'Active', 'Verified'] as TabType[]).map((tab) => (
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
      </View>

      <FlatList
        data={filteredTeachers}
        keyExtractor={(item) => item.id}
        renderItem={renderTeacherCard}
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
            <Ionicons name="people-outline" size={64} color={theme.placeholder} />
            <Text style={styles.emptyTitle}>No teachers found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search query or tab filters.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: any, isDarkMode: boolean = false) => StyleSheet.create({
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
    color: theme.onPrimary,
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
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: theme.border,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: theme.surface,
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.subtext,
  },
  tabTextActive: {
    color: theme.primary,
  },
  listContent: {
    padding: 16,
  },
  teacherCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.onPrimary,
  },
  headerInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  verifyBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  verifyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  cardBody: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowIcon: {
    marginRight: 8,
    width: 16,
  },
  detailText: {
    fontSize: 13,
    color: theme.subtext,
    fontWeight: '500',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  joinedText: {
    fontSize: 12,
    color: theme.placeholder,
    fontWeight: '500',
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
});

export default PrincipalTeachersScreen;
