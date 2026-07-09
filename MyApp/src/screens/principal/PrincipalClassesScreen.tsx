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

  const handleCardPress = useCallback(
    (classItem: ClassItem) => {
      navigation.navigate('PrincipalClassDetail', {
        classId: classItem.id,
        classData: classItem,
      });
    },
    [navigation]
  );

  const renderClassCard = useCallback(
    ({ item }: { item: ClassItem }) => {
      const assignedTeacher = assignmentMap[item.id]?.teacherName || 'No teacher assigned';
      const classNameFull = item.name + (item.section ? ` ${item.section}` : '');

      return (
        <TouchableOpacity
          style={styles.classCard}
          activeOpacity={0.7}
          onPress={() => handleCardPress(item)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.classIconCircle}>
              <MaterialCommunityIcons name="google-classroom" size={24} color="#4F46E5" />
            </View>
            <View style={styles.classNameContainer}>
              <Text style={styles.classNameText}>{classNameFull}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.academicYearBadge}>
                  <Text style={styles.academicYearText}>
                    AY {item.academicYear || '2026'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={{ padding: 8, marginRight: 4 }}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteClass(item.id, classNameFull);
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardBody}>
            <View style={styles.metricItem}>
              <Ionicons name="people-outline" size={16} color="#6B7280" />
              <Text style={styles.metricText}>{item.studentCount || 0} Students</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="person-outline" size={16} color="#6B7280" />
              <Text style={styles.metricText}>{item.teacherCount || 0} Teachers</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.teacherLabel}>Class Teacher:</Text>
            <Text
              style={[
                styles.teacherValue,
                assignedTeacher === 'No teacher assigned' && styles.noTeacherStyle,
              ]}
              numberOfLines={1}
            >
              {assignedTeacher}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [assignmentMap, handleCardPress]
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
        data={classes}
        keyExtractor={(item) => item.id}
        renderItem={renderClassCard}
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
            <MaterialCommunityIcons name="google-classroom" size={64} color={theme.subtext} />
            <Text style={styles.emptyTitle}>No classes found</Text>
            <Text style={styles.emptySubtitle}>
              There are no classes registered in your institution yet.
            </Text>
          </View>
        }
      />

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
});

export default PrincipalClassesScreen;
