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
  Platform,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../store/AuthContext';
import principalService, {
  ClassItem,
  ClassAssignment,
} from '../../services/principalService';
import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type PrincipalClassesNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrincipalClasses'
>;

interface Props {
  navigation: PrincipalClassesNavigationProp;
}

const PrincipalClassesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { authState } = useAuth();
  const institutionId = authState.user?.institutionId || '';

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');

  const loadData = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setIsError(false);

      try {
        const [classesRes, assignmentsRes] = await Promise.all([
          principalService.getClasses(),
          principalService.getClassAssignments(institutionId),
        ]);

        const classesData = (classesRes as any).data?.classes ?? (Array.isArray((classesRes as any).data) ? (classesRes as any).data : ((classesRes as any).data?.data ?? []));
        setClasses(classesData);
        setAssignments(assignmentsRes.data?.data || assignmentsRes.data || []);
      } catch (error) {
        console.error('[PrincipalClasses] Failed to fetch classes data:', error);
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

  const handleDeleteClass = (id: string, className: string) => {
    Alert.alert(
      'Delete Class',
      `Are you sure you want to permanently delete ${className}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);

              await principalService.deleteClass(id);

              Alert.alert(
                'Success',
                `"${className}" has been deleted successfully.`
              );

              await loadData();

            } catch (error: any) {
              console.error('[PrincipalClasses] Delete failed:', error);

              Alert.alert(
                'Delete Failed',
                error?.response?.data?.message ??
                error?.message ??
                'Unable to delete the selected class.'
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Build class assignment lookup map
  const assignmentMap = useMemo(() => {
    return assignments.reduce((map, a) => {
      if (a.classId) {
        map[a.classId] = a;
      }
      return map;
    }, {} as Record<string, ClassAssignment>);
  }, [assignments]);

  const filteredClasses = useMemo(() => {
    return classes.filter(item => {
      const assignedTeacher = assignmentMap[item.id]?.teacherName || '';
      const searchLower = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !searchLower ||
        item.name?.toLowerCase().includes(searchLower) ||
        item.section?.toLowerCase().includes(searchLower) ||
        item.grade?.toLowerCase().includes(searchLower) ||
        item.academicYear?.toLowerCase().includes(searchLower) ||
        assignedTeacher.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (selectedFilter === 'ASSIGNED') {
        return !!assignmentMap[item.id]?.teacherName;
      } else if (selectedFilter === 'UNASSIGNED') {
        return !assignmentMap[item.id]?.teacherName;
      }

      return true;
    });
  }, [classes, assignmentMap, searchQuery, selectedFilter]);

  const handleCardPress = useCallback(
    (classItem: ClassItem) => {
      navigation.navigate('PrincipalClassDetail', {
        classId: classItem.id,
        classData: classItem,
      });
    },
    [navigation]
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB');
    } catch {
      return '';
    }
  };

  const renderClassCard = useCallback(
    ({ item }: { item: ClassItem }) => {
      const assignedTeacher = item.classTeacherName || assignmentMap[item.id]?.teacherName || 'Not assigned';
      const classNameFull = (item.name || '') + (item.section ? ` - Sec ${item.section}` : '');
      const createdDateFormatted = formatDate(item.createdAt);

      return (
        <TouchableOpacity
          style={styles.classCard}
          activeOpacity={0.7}
          onPress={() => handleCardPress(item)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.classIconCircle}>
              <MaterialCommunityIcons name="google-classroom" size={24} color={theme.primary} />
            </View>
            <View style={styles.classNameContainer}>
              <Text style={styles.classNameText}>{classNameFull}</Text>
              <View style={styles.badgeRow}>
                {!!item.grade && (
                  <View style={[styles.academicYearBadge, { marginRight: 6 }]}>
                    <Text style={styles.academicYearText}>Grade {item.grade}</Text>
                  </View>
                )}
                <View style={styles.academicYearBadge}>
                  <Text style={styles.academicYearText}>
                    AY {item.academicYear || '2026'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {/* <TouchableOpacity
                style={{ padding: 6 }}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate('PrincipalEditClass', { classId: item.id, classData: item });
                }}
              >
                <Ionicons name="pencil-outline" size={18} color={theme.primary} />
              </TouchableOpacity> */}

              <TouchableOpacity
                style={{ padding: 6 }}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteClass(item.id, item.name || 'this class');
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardBody}>
            <View style={styles.metricItem}>
              <Ionicons name="people-outline" size={16} color={theme.subtext} />
              <Text style={styles.metricText}>{item.studentCount ?? 0} Students</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="person-outline" size={16} color={theme.subtext} />
              <Text style={styles.metricText}>{item.teacherCount ?? 0} Teachers</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.teacherLabel}>Class Teacher:</Text>
              <Text
                style={[
                  styles.teacherValue,
                  assignedTeacher === 'Not assigned' && styles.noTeacherStyle,
                ]}
                numberOfLines={1}
              >
                {assignedTeacher}
              </Text>
            </View>
            {!!createdDateFormatted && (
              <Text style={styles.createdDateText}>{createdDateFormatted}</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [assignmentMap, handleCardPress, theme, navigation]
  );

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
        <Text style={styles.errorTitle}>Failed to load classes</Text>
        <Text style={styles.errorSubtitle}>
          An error occurred while fetching the class list. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Classes</Text>
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

      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => item.id}
        renderItem={renderClassCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeaderContainer}>
            <TouchableOpacity
              style={styles.addClassButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PrincipalAddClass')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFF" />
              <Text style={styles.addClassButtonText}>Add New Class</Text>
            </TouchableOpacity>

            <View style={styles.searchWrapper}>
              <Ionicons name="search-outline" size={20} color={theme.subtext} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search classes by name, section, grade..."
                placeholderTextColor={theme.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color={theme.subtext} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filterRow}>
              {(['ALL', 'ASSIGNED', 'UNASSIGNED'] as const).map(filter => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterPill, selectedFilter === filter && styles.filterPillActive]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text style={[styles.filterPillText, selectedFilter === filter && styles.filterPillTextActive]}>
                    {filter === 'ALL' ? 'All' : filter === 'ASSIGNED' ? 'Assigned' : 'Unassigned'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="google-classroom" size={64} color={theme.subtext} />
            <Text style={styles.emptyTitle}>No classes found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'No classes match your search criteria.' : 'There are no classes registered in your institution yet.'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fabButton}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('PrincipalAddClass')}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

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
    padding: 16,
  },
  listHeaderContainer: {
    marginBottom: 16,
  },
  addClassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  addClassButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    height: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterPillActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.subtext,
  },
  filterPillTextActive: {
    color: '#FFF',
  },
  classCard: {
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
    alignItems: 'center',
  },
  classIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  classNameContainer: {
    flex: 1,
  },
  classNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  academicYearBadge: {
    backgroundColor: theme.primary + '15',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  academicYearText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.primary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 13,
    color: theme.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    padding: 10,
    borderRadius: 10,
  },
  teacherLabel: {
    fontSize: 12,
    color: theme.subtext,
    marginRight: 4,
  },
  teacherValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  noTeacherStyle: {
    color: theme.subtext,
    fontStyle: 'italic',
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
    lineHeight: 20,
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
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  createdDateText: {
    fontSize: 11,
    color: theme.subtext,
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default PrincipalClassesScreen;
