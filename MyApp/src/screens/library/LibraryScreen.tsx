import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast, { ToastType } from '../../components/Toast';
import { useLibraryManagement } from './hooks/useLibraryManagement';
import { LIBRARY_TABS } from './constants';
import { LIBRARY_COLORS } from './theme';
import StatCard from './components/StatCard';
import CirculationTab from './components/CirculationTab';
import CatalogTab from './components/CatalogTab';
import CategoriesTab from './components/CategoriesTab';
import StaffTab from './components/StaffTab';
import LibraryModals from './components/LibraryModals';
import { LibraryTab } from './types';

const LibraryScreen = () => {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({ visible: false, message: '', type: 'success' });

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const library = useLibraryManagement(showToast);
  const { tab, setTab, stats, categories, books, staff } = library;

  const renderTabContent = () => {
    switch (tab) {
      case 'circulation':
        return (
          <CirculationTab
            rows={library.circRows}
            filter={library.circFilter}
            status={library.circStatus}
            onFilterChange={library.setCircFilter}
            onStatusChange={library.setCircStatus}
            onIssuePress={() => library.modals.setShowIssueModal(true)}
            onReturn={library.actions.handleReturn}
          />
        );
      case 'catalog':
        return (
          <CatalogTab
            rows={library.catalogRows}
            categories={categories}
            filter={library.bookFilter}
            category={library.bookCat}
            onFilterChange={library.setBookFilter}
            onCategoryChange={library.setBookCat}
            onAddPress={() => library.modals.setShowAddBookModal(true)}
            onDelete={library.actions.handleDeleteBook}
          />
        );
      case 'categories':
        return (
          <CategoriesTab
            categories={categories}
            books={books}
            onAddPress={() => library.modals.setShowAddCategoryModal(true)}
          />
        );
      case 'staff':
        return (
          <StaffTab
            staff={staff}
            onAddPress={() => library.modals.setShowAddStaffModal(true)}
            onRemove={library.actions.handleRemoveStaff}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={LIBRARY_COLORS.bg} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Library Management</Text>
          <Text style={styles.subtitle}>
            Full administrative control over library assets, circulation, and staff.
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsScroll}
        style={styles.statsContainer}
      >
        <StatCard icon="📚" label="Total Books" value={stats.totalBooks} accent="blue" />
        <StatCard icon="🔄" label="Active Issues" value={stats.activeIssues} accent="purple" />
        <StatCard icon="⚠️" label="Overdue" value={stats.overdueCount} accent="red" />
        <StatCard icon="👤" label="Staff Members" value={stats.staffCount} accent="amber" />
        <StatCard icon="📦" label="Categories" value={stats.categoryCount} accent="green" />
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        style={styles.tabsBar}
      >
        {LIBRARY_TABS.map(t => {
          const active = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.id as LibraryTab)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={t.icon as any}
                size={15}
                color={active ? '#FFFFFF' : LIBRARY_COLORS.textMuted}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.tabContent}>{renderTabContent()}</View>

      <LibraryModals library={library} />

      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(prev => ({ ...prev, visible: false }))}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: LIBRARY_COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: LIBRARY_COLORS.text,
  },
  subtitle: {
    color: LIBRARY_COLORS.textDim,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  statsContainer: {
    maxHeight: 100,
    marginBottom: 16,
  },
  statsScroll: {
    paddingHorizontal: 20,
  },
  tabsBar: {
    maxHeight: 52,
    marginBottom: 16,
  },
  tabsScroll: {
    paddingHorizontal: 20,
    backgroundColor: LIBRARY_COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 4,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: LIBRARY_COLORS.primary,
  },
  tabText: {
    fontWeight: '600',
    fontSize: 13,
    color: LIBRARY_COLORS.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
});

export default LibraryScreen;
