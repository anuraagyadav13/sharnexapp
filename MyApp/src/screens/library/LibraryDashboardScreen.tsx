import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
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
import ThemeToggle from '../../components/common/ThemeToggle';
import { getCacheBustedUri } from '../../utils/image';
import libraryService from '../../services/libraryService';
import { LibraryDashboardStats } from '../../services/principalService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LibraryDashboard'>;

interface Props {
  navigation: NavigationProp;
}

const LibraryDashboardScreen: React.FC<Props> = ({ navigation }) => {
  console.log('[DEBUG_MOUNT] LibraryDashboard mounted!');
  const { theme, isDarkMode, themeMode, setThemeMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme, isDarkMode);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<LibraryDashboardStats>({
    totalBooks: 25,
    issuedBooks: 0,
    overdueBooks: 0,
    totalCategories: 5,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);

    try {
      const res = await libraryService.getDashboardStats();
      const data = res.data?.data || res.data;
      if (data) {
        setStats({
          totalBooks: data.totalBooks ?? 25,
          issuedBooks: data.issuedBooks ?? data.activeIssues ?? 0,
          overdueBooks: data.overdueBooks ?? data.overdueCount ?? 0,
          totalCategories: data.totalCategories ?? 5,
        });
      }
    } catch (err: any) {
      console.warn('[LibraryDashboard] Error loading stats:', err);
      if (err?.response?.status === 403) {
        setErrorMsg('You do not have permission to view library dashboard statistics.');
      } else {
        setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to load dashboard data.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      {/* Global Dashboard Header */}
      <View style={styles.globalHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color={theme.text} />
        </ScaleButton>

        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
          Welcome back, {authState.user?.name?.split(' ')[0] || 'Librarian'}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnTransparent}>
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtnTransparent}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}
          >
            <Ionicons name="settings-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <ThemeToggle />

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
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadDashboardData(true)}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Banner / Title Row */}
        <View style={styles.heroSection}>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>Library Dashboard</Text>
            <Text style={styles.heroSubtitle}>Overview of library operations and inventory.</Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.primaryAddBtn}
              onPress={() => navigation.navigate('LibraryBookCatalog')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.primaryAddBtnText}>Add Book</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryIssueBtn}
              onPress={() => navigation.navigate('LibraryCirculation')}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal" size={18} color={theme.text} style={{ marginRight: 4 }} />
              <Text style={styles.secondaryIssueBtnText}>Issue/Return</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : (
          <>
            {/* Metric Cards Row */}
            <View style={styles.metricsGrid}>
              {/* Total Books Card */}
              <View style={styles.metricCard}>
                <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="book" size={24} color="#4F46E5" />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricLabel}>TOTAL BOOKS</Text>
                  <Text style={styles.metricValue}>{stats.totalBooks ?? 25}</Text>
                </View>
              </View>

              {/* Issued Books Card */}
              <View style={styles.metricCard}>
                <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="swap-horizontal" size={24} color="#9333EA" />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricLabel}>ISSUED BOOKS</Text>
                  <Text style={styles.metricValue}>{stats.issuedBooks ?? 0}</Text>
                </View>
              </View>

              {/* Overdue Card */}
              <View style={styles.metricCard}>
                <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="close" size={24} color="#EF4444" />
                </View>
                <View style={styles.metricContent}>
                  <Text style={styles.metricLabel}>OVERDUE</Text>
                  <Text style={styles.metricValue}>{stats.overdueBooks ?? 0}</Text>
                </View>
              </View>
            </View>

            {/* Quick Access Navigation Grid */}
            <View style={styles.quickNavGrid}>
              <TouchableOpacity
                style={styles.quickNavCard}
                onPress={() => navigation.navigate('LibraryBookCatalog')}
                activeOpacity={0.8}
              >
                <View style={[styles.quickNavIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="book-outline" size={22} color="#2563EB" />
                </View>
                <Text style={styles.quickNavTitle}>Book Catalog</Text>
                <Text style={styles.quickNavSub}>Manage library inventory</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavCard}
                onPress={() => navigation.navigate('LibraryCirculation')}
                activeOpacity={0.8}
              >
                <View style={[styles.quickNavIcon, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="swap-horizontal-outline" size={22} color="#7C3AED" />
                </View>
                <Text style={styles.quickNavTitle}>Circulation</Text>
                <Text style={styles.quickNavSub}>Handle issues & returns</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavCard}
                onPress={() => navigation.navigate('LibraryAnnouncements')}
                activeOpacity={0.8}
              >
                <View style={[styles.quickNavIcon, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="megaphone-outline" size={22} color="#D97706" />
                </View>
                <Text style={styles.quickNavTitle}>Announcements</Text>
                <Text style={styles.quickNavSub}>Post library updates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickNavCard}
                onPress={() => navigation.navigate('AccountSettings')}
                activeOpacity={0.8}
              >
                <View style={[styles.quickNavIcon, { backgroundColor: '#F3F4F6' }]}>
                  <Ionicons name="chevron-forward-outline" size={22} color="#4B5563" />
                </View>
                <Text style={styles.quickNavTitle}>Settings</Text>
                <Text style={styles.quickNavSub}>Configure portal</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Sharnex LMS. All rights reserved.</Text>
        </View>
      </ScrollView>

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="library" />
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
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
      elevation: 2,
    },
    menuHandle: { padding: 4 },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.primary,
      flex: 1,
      marginLeft: 8,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBtnTransparent: { padding: 4 },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#8B5CF6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    headerAvatarImage: { width: 32, height: 32, borderRadius: 16 },
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    heroSection: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    heroInfo: { marginBottom: 14 },
    heroTitle: { fontSize: 22, fontWeight: '800', color: theme.text, marginBottom: 4 },
    heroSubtitle: { fontSize: 13, color: theme.subtext },
    heroActions: { flexDirection: 'row', gap: 10 },
    primaryAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#8B5CF6',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    primaryAddBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    secondaryIssueBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    secondaryIssueBtnText: { color: theme.text, fontSize: 14, fontWeight: '700' },
    loaderContainer: { paddingVertical: 40, alignItems: 'center' },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    metricCard: {
      flex: 1,
      minWidth: '30%',
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    metricContent: { flex: 1 },
    metricLabel: { fontSize: 10, fontWeight: '700', color: theme.subtext, marginBottom: 2 },
    metricValue: { fontSize: 20, fontWeight: '800', color: theme.text },
    quickNavGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    quickNavCard: {
      width: '48%',
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    quickNavIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    quickNavTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
    quickNavSub: { fontSize: 12, color: theme.subtext },
    footer: { paddingVertical: 20, alignItems: 'center' },
    footerText: { fontSize: 12, color: theme.subtext },
  });

export default LibraryDashboardScreen;
