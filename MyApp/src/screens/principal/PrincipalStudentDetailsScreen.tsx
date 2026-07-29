import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  FlatList,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useAuth } from '../../store/AuthContext';
import { getCacheBustedUri } from '../../utils/image';

import apiClient from '../../services/apiClient';
import principalService from '../../services/principalService';
import { ENDPOINTS } from '../../constants/api';
import Skeleton from '../../components/common/Skeleton';

let Share: any = null;
try {
  Share = require('react-native-share').default || require('react-native-share');
} catch (error) {
  console.warn('react-native-share not available');
}

const PageSkeleton = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeader}>
        <Skeleton width="45%" height={24} style={{ marginBottom: 6 }} />
        <Skeleton width="65%" height={14} />
      </View>
      <View style={styles.statsGrid}>
        <Skeleton width="31%" height={80} borderRadius={14} />
        <Skeleton width="31%" height={80} borderRadius={14} />
        <Skeleton width="31%" height={80} borderRadius={14} />
      </View>
      <View style={{ paddingHorizontal: 20, marginVertical: 12, flexDirection: 'row', gap: 8 }}>
        <Skeleton width={90} height={34} borderRadius={20} />
        <Skeleton width={90} height={34} borderRadius={20} />
        <Skeleton width={90} height={34} borderRadius={20} />
      </View>
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Skeleton width="100%" height={120} borderRadius={16} />
      </View>
      <View style={{ paddingHorizontal: 20, marginBottom: 16, gap: 10 }}>
        <Skeleton width="100%" height={44} borderRadius={12} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={100} height={36} borderRadius={10} />
          <Skeleton width={130} height={36} borderRadius={10} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        <Skeleton width="100%" height={110} borderRadius={14} />
        <Skeleton width="100%" height={110} borderRadius={14} />
      </View>
    </ScrollView>
  );
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardTop}>
        <View style={styles.statIconWrapper}>
          <Ionicons name={icon} size={14} color={theme.primary} />
        </View>
        <Text style={styles.statTitle} numberOfLines={1}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle ? <Text style={styles.statSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </View>
  );
};

const StudentCard = ({ item, index, delay, onEdit, onView, onDelete, isDeleting }: any) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const photoUri = item.photoUrl || item.profilePhoto;

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.avatarWrapper}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarTextMain}>{item.name ? item.name.charAt(0).toUpperCase() : '?'}</Text>
          )}
        </View>
        <View style={styles.studentMainInfo}>
          <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.rollBadge}>
            <Ionicons name="id-card-outline" size={12} color={theme.subtext} style={{ marginRight: 4 }} />
            <Text style={styles.studentRoll}>Roll: {item.rollNo || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.actionIconsRow}>
          <TouchableOpacity
            style={[styles.actionIconButton, { backgroundColor: theme.primary + '15' }]}
            onPress={onView}
            accessibilityLabel="View student details"
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="eye-outline" size={16} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionIconButton, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
            onPress={onEdit}
            accessibilityLabel="Edit student details"
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="pencil-outline" size={16} color={theme.subtext} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionIconButton, { backgroundColor: '#EF444415' }]}
            onPress={onDelete}
            disabled={isDeleting}
            accessibilityLabel="Delete student"
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={theme.danger || '#EF4444'} />
            ) : (
              <Ionicons name="trash-outline" size={16} color={theme.danger || '#EF4444'} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>AVERAGE GRADE</Text>
          <Text style={[styles.metricVal, !item.grade && { color: theme.subtext }]}>{item.grade || '-'}</Text>
          {!item.grade && <Text style={styles.metricSub}>Grade TBD</Text>}
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>ATTENDANCE</Text>
          <Text style={[styles.metricVal, { color: item.attendanceRate ? '#10B981' : theme.text }]}>
            {item.attendanceRate ? `${item.attendanceRate}%` : '-'}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>PERFORMANCE</Text>
          {item.performance ? (
            <View style={styles.perfPill}><Text style={styles.perfText}>{item.performance}</Text></View>
          ) : (
            <Text style={styles.metricVal}>-</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const PrincipalStudentDetailsScreen = ({ navigation }: any) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { authState } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);

  const fetchAttendanceSummary = useCallback(async () => {
    try {
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.ATTENDANCE_SUMMARY);
      setAttendanceSummary(res.originalData || res.data || res);
    } catch (error) {
      console.error('Failed to fetch attendance summary:', error);
      setAttendanceSummary(null);
    }
  }, []);

  const fetchClasses = useCallback(async (options?: { keepActive?: boolean }) => {
    try {
      if (!isRefreshing && !options?.keepActive) setIsLoading(true);
      const classesRes = await principalService.getClasses();
      const rawClasses = classesRes.data?.classes || (classesRes.data as any)?.data || classesRes.data;
      const classList = Array.isArray(rawClasses) ? rawClasses : [];

      setClasses(classList);

      if (!options?.keepActive) {
        if (classList.length > 0) {
          const firstId = classList[0].id || classList[0].name;
          setActiveClassId(firstId);
        } else {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setClasses([]);
    } finally {
      if (!options?.keepActive) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const fetchStudents = useCallback(async (classId: string) => {
    try {
      setIsLoading(true);
      const studentsRes = await principalService.getStudentsByClass(classId);
      const rawStudents = studentsRes.data?.data || studentsRes.data;
      const studentList = Array.isArray(rawStudents) ? rawStudents : [];
      setAllStudents(studentList);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setAllStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteStudent = useCallback((studentId: string) => {
    Alert.alert('Delete Student', 'Are you sure you want to delete this student?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setIsDeleting(true);
          setDeletingStudentId(studentId);
          try {
            await principalService.deleteStudent(studentId);
            if (activeClassId) {
              await fetchStudents(activeClassId);
            }
            await fetchClasses({ keepActive: true });
          } catch (error) {
            console.error('Failed to delete student:', error);
            Alert.alert('Error', 'Failed to delete student');
          } finally {
            setIsDeleting(false);
            setDeletingStudentId(null);
          }
        }
      }
    ]);
  }, [activeClassId, fetchStudents, fetchClasses]);

  const currentClass = useMemo(() => classes.find(c => (c.id || c.name) === activeClassId), [classes, activeClassId]);
  const currentClassStudents = allStudents;

  const handleExport = useCallback(async () => {
    if (!currentClassStudents || currentClassStudents.length === 0) {
      Alert.alert('Export', 'No students to export.');
      return;
    }
    try {
      setIsExporting(true);
      const XLSX = require('xlsx');
      const RNFS = require('react-native-fs');

      const exportData = currentClassStudents.map(s => ({
        'Roll No': s.rollNo || '-',
        'Name': s.name || '-',
        'Email': s.email || '-',
        'Class': `${s.className || ''} ${s.classSection || ''}`.trim() || '-',
        'Gender': s.gender || '-',
        'DOB': s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '-',
        'Parent Name': s.parentName || '-',
        'Phone': s.phone || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students");
      const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

      const path = `${RNFS.DocumentDirectoryPath}/Students_${currentClass?.name || 'Class'}.xlsx`;
      await RNFS.writeFile(path, wbout, 'ascii');

      if (Share) {
        await Share.open({
          url: `file://${path}`,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          title: 'Export Students List',
        });
      } else {
        Alert.alert('Export Successful', `Students exported successfully to ${path}`);
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share' && error?.name !== 'Error') {
        console.error('Failed to export students:', error);
        Alert.alert('Error', 'Failed to export students.');
      }
    } finally {
      setIsExporting(false);
    }
  }, [currentClassStudents, currentClass]);

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
      fetchAttendanceSummary();
    }, [fetchClasses, fetchAttendanceSummary])
  );

  useEffect(() => {
    if (activeClassId) {
      fetchStudents(activeClassId);
    }
  }, [activeClassId, fetchStudents]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    const tasks: Promise<any>[] = [fetchClasses({ keepActive: true }), fetchAttendanceSummary()];
    if (activeClassId) {
      tasks.push(fetchStudents(activeClassId));
    }
    Promise.all(tasks).finally(() => setIsRefreshing(false));
  }, [fetchClasses, fetchAttendanceSummary, activeClassId, fetchStudents]);

  const getAttendanceRateDisplay = useCallback(() => {
    if (!attendanceSummary) return 'N/A';

    const extractRate = (obj: any): string | null => {
      if (obj === null || obj === undefined) return null;

      if (typeof obj === 'number') {
        return `${Math.round(obj * 10) / 10}%`;
      }

      if (typeof obj === 'string') {
        const cleaned = obj.trim();
        if (cleaned.endsWith('%')) return cleaned;
        const num = parseFloat(cleaned);
        if (!isNaN(num) && num >= 0 && num <= 100) {
          return `${Math.round(num * 10) / 10}%`;
        }
      }

      if (Array.isArray(obj)) {
        if (obj.length === 0) return null;

        let totalPresentSum = 0;
        let totalCountSum = 0;
        let sumRate = 0;
        let countRate = 0;

        for (const item of obj) {
          if (typeof item === 'number') {
            sumRate += item;
            countRate++;
          } else if (typeof item === 'string') {
            const num = parseFloat(item);
            if (!isNaN(num)) {
              sumRate += num;
              countRate++;
            }
          } else if (typeof item === 'object' && item !== null) {
            const p = item.present ?? item.presentCount ?? item.present_count ?? item.totalPresent ?? item.total_present;
            const tot = item.total ?? item.totalCount ?? item.total_count ?? item.totalStudents ?? item.total_students;
            if (typeof p === 'number' && typeof tot === 'number' && tot > 0) {
              totalPresentSum += p;
              totalCountSum += tot;
            }

            const candidateKeys = [
              'avgAttendancePercent', 'avg_attendance_percent', 'avgAttendance', 'avg_attendance',
              'avgPercentage', 'avg_percentage', 'attendancePercent', 'attendance_percent',
              'attendanceRate', 'attendance_rate', 'percentage', 'rate',
              'overallPercentage', 'overall_percentage', 'overallRate', 'overall_rate',
              'overallAttendance', 'overall_attendance', 'overall', 'average', 'averageAttendance',
              'attendance', 'value'
            ];
            for (const k of candidateKeys) {
              if (item[k] !== undefined && item[k] !== null) {
                const num = typeof item[k] === 'number' ? item[k] : parseFloat(item[k]);
                if (!isNaN(num)) {
                  sumRate += num;
                  countRate++;
                  break;
                }
              }
            }
          }
        }

        if (totalCountSum > 0) {
          return `${Math.round((totalPresentSum / totalCountSum) * 1000) / 10}%`;
        }
        if (countRate > 0) {
          return `${Math.round((sumRate / countRate) * 10) / 10}%`;
        }
      }

      if (typeof obj === 'object') {
        const candidateKeys = [
          'avgAttendancePercent', 'avg_attendance_percent', 'avgAttendance', 'avg_attendance',
          'avgPercentage', 'avg_percentage', 'attendancePercent', 'attendance_percent',
          'attendanceRate', 'attendance_rate', 'percentage', 'rate',
          'overallPercentage', 'overall_percentage', 'overallRate', 'overall_rate',
          'overallAttendance', 'overall_attendance', 'overall', 'average', 'averageAttendance',
          'attendance', 'value', 'stat'
        ];

        for (const key of candidateKeys) {
          if (obj[key] !== undefined && obj[key] !== null) {
            const val = obj[key];
            const res = extractRate(val);
            if (res) return res;
          }
        }

        const present = obj.present ?? obj.presentCount ?? obj.present_count ?? obj.totalPresent ?? obj.total_present;
        const total = obj.total ?? obj.totalCount ?? obj.total_count ?? obj.totalStudents ?? obj.total_students;
        if (typeof present === 'number' && typeof total === 'number' && total > 0) {
          return `${Math.round((present / total) * 1000) / 10}%`;
        }

        const subTargets = [obj.data, obj.summary, obj.stats, obj.records, obj.items, obj.attendance];
        for (const sub of subTargets) {
          if (sub) {
            const res = extractRate(sub);
            if (res) return res;
          }
        }
      }

      return null;
    };

    return extractRate(attendanceSummary) || 'N/A';
  }, [attendanceSummary]);

  const getAttendanceSubtitle = useCallback(() => {
    if (!attendanceSummary) return 'Coming soon';
    const data = attendanceSummary.data || attendanceSummary;
    if (data.subtitle) return data.subtitle;
    if (data.label) return data.label;
    if (data.presentCount !== undefined && data.totalCount !== undefined) {
      return `${data.presentCount}/${data.totalCount} present`;
    }
    return undefined;
  }, [attendanceSummary]);

  const attendanceRateDisplay = useMemo(() => getAttendanceRateDisplay(), [getAttendanceRateDisplay]);
  const attendanceSubtitle = useMemo(() => {
    if (attendanceRateDisplay === 'N/A') return 'Coming soon';
    return getAttendanceSubtitle();
  }, [attendanceRateDisplay, getAttendanceSubtitle]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentClassStudents;
    return currentClassStudents.filter(s => {
      return (
        (s.name || '').toLowerCase().includes(q) ||
        (s.rollNo || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.parentName || '').toLowerCase().includes(q)
      );
    });
  }, [currentClassStudents, searchQuery]);

  const renderHeader = useCallback(() => (
    <View>
      <View style={styles.pageHeader}>
        <Text style={styles.screenTitle}>Student Directory</Text>
        <Text style={styles.screenSubtitle}>Class-wise student roster & metrics</Text>
      </View>

      {/* Stats Summary Grid (3 Cards) */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Students"
          value={classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0)}
          icon="people-outline"
        />
        <StatCard
          title="Attendance Rate"
          value={attendanceRateDisplay}
          subtitle={attendanceSubtitle}
          icon="stats-chart-outline"
        />
        <StatCard
          title="Active Classes"
          value={classes.length}
          icon="grid-outline"
        />
      </View>

      {/* Class Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {classes.map((cls) => {
            const clsId = cls.id || cls.name;
            const count = cls.studentCount || 0;
            const isActive = activeClassId === clsId;
            return (
              <TouchableOpacity
                key={clsId}
                style={[styles.classTab, isActive && styles.classTabActive]}
                onPress={() => setActiveClassId(clsId)}
                accessibilityLabel={`Select class ${cls.name || cls.className}`}
              >
                <Text style={[styles.classTabText, isActive && styles.classTabTextActive]}>
                  {cls.name || cls.className} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Class Hero Banner */}
      <Animated.View entering={FadeInUp.duration(400)} style={styles.classHero}>
        <View style={styles.heroMain}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroIconBox}>
              <Ionicons name="school-outline" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle} numberOfLines={1}>{currentClass?.name || 'Loading...'}</Text>
              <Text style={styles.heroTeacherName}>
                Class Teacher: {currentClass?.classTeacherName || currentClass?.teacher || 'TBA'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatVal}>{currentClass?.studentCount || currentClassStudents.length}</Text>
            <Text style={styles.heroStatLab}>Students</Text>
          </View>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatVal}>-</Text>
            <Text style={styles.heroStatLab}>Avg Score</Text>
          </View>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatVal}>-</Text>
            <Text style={styles.heroStatLab}>Attendance</Text>
          </View>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatVal}>-</Text>
            <Text style={styles.heroStatLab}>Top Performer</Text>
          </View>
        </View>
      </Animated.View>

      {/* Actions & Search */}
      <View style={styles.actionsWrapper}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            placeholder={`Search students in ${currentClass?.name || 'Class'}...`}
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionButtonsScroll}>
          <TouchableOpacity
            style={[styles.secondaryBtn, isExporting && { opacity: 0.7 }]}
            onPress={handleExport}
            disabled={isExporting}
            accessibilityLabel="Export student list"
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <>
                <Ionicons name="download-outline" size={16} color={theme.text} />
                <Text style={styles.secondaryBtnText}>Export</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('PrincipalAddStudent')}
            accessibilityLabel="Add new student"
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Add Students</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  ), [classes, activeClassId, attendanceRateDisplay, attendanceSubtitle, currentClass, currentClassStudents.length, searchQuery, isExporting, handleExport, navigation, styles, theme.text]);

  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;
    const isSearchActive = searchQuery.trim().length > 0;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={isSearchActive ? "search-outline" : "people-outline"}
          size={48}
          color={theme.subtext}
        />
        <Text style={styles.emptyTitle}>
          {isSearchActive ? "No results match your search" : "No students found in this class"}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isSearchActive
            ? "Try searching for a different name, roll number, email, or phone."
            : "There are currently no registered students in this class."}
        </Text>
      </View>
    );
  }, [isLoading, searchQuery, styles, theme.subtext]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} translucent />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <ScaleButton onPress={() => setDrawerOpen(true)} accessibilityLabel="Open menu">
          <Ionicons name="menu" size={28} color={theme.text} />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1}>Student Directory</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnHeader} onPress={() => navigation.navigate('PrincipalAddStudent')} accessibilityLabel="Add Student">
            <Ionicons name="person-add-outline" size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')} accessibilityLabel="Account settings">
            {authState.user?.photoUrl ? (
              <Image source={{ uri: getCacheBustedUri(authState.user.photoUrl, authState.user.photoUpdatedAt) }} style={styles.avatarHeader} />
            ) : (

              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !isRefreshing ? (
        <PageSkeleton />
      ) : (
        <FlatList
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          data={filteredStudents}
          keyExtractor={(item, index) => item.id || item._id || String(index)}
          renderItem={({ item, index }) => (
            <View style={styles.listContainer}>
              <StudentCard
                item={item}
                index={index}
                delay={index * 50}
                isDeleting={isDeleting && deletingStudentId === item.id}
                onEdit={() => navigation.navigate('PrincipalEditStudent', { studentId: item.id })}
                onView={() => navigation.navigate('PrincipalViewStudent', { studentId: item.id })}
                onDelete={() => handleDeleteStudent(item.id)}
              />
            </View>
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={() => Keyboard.dismiss()}
        />
      )}

      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Global Header
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 0) + 8,
    paddingBottom: 16,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.text, flex: 1, textAlign: 'center', marginHorizontal: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtnHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Page Header
  pageHeader: { marginBottom: 14, paddingHorizontal: 20, marginTop: 16 },
  screenTitle: { fontSize: 22, fontWeight: '800', color: theme.text, marginBottom: 4, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 13, color: theme.subtext, fontWeight: '500' },

  // Stats Summary Grid (3-column layout)
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  statIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  statTitle: { fontSize: 10, fontWeight: '700', color: theme.subtext, flex: 1 },
  statValue: { fontSize: 18, fontWeight: '900', color: theme.text },
  statSubtitle: { fontSize: 9, color: theme.subtext, marginTop: 2, fontWeight: '500' },

  // Class Tabs
  tabsContainer: { marginBottom: 16 },
  tabsScroll: { paddingHorizontal: 20, gap: 8 },
  classTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  classTabActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  classTabText: { fontSize: 12, fontWeight: '700', color: theme.text },
  classTabTextActive: { color: '#FFF' },

  // Class Hero Banner
  classHero: {
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  heroMain: {},
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  heroTeacherName: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: 2 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between' },
  heroStatItem: { alignItems: 'center', flex: 1 },
  heroStatVal: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  heroStatLab: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Actions & Search
  actionsWrapper: { marginHorizontal: 20, marginTop: 16, marginBottom: 16 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13, color: theme.text },
  actionButtonsScroll: { gap: 8 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
  },
  secondaryBtnText: { fontSize: 12, fontWeight: '700', color: theme.text },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  primaryBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // Student Card List
  listContainer: { paddingHorizontal: 20 },
  studentCard: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  studentHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  avatarTextMain: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  studentMainInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 2 },
  rollBadge: { flexDirection: 'row', alignItems: 'center' },
  studentRoll: { fontSize: 12, color: theme.subtext, fontWeight: '500' },
  actionIconsRow: { flexDirection: 'row', gap: 8 },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, height: 28, backgroundColor: theme.border },
  metricLabel: { fontSize: 9, fontWeight: '800', color: theme.subtext, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricVal: { fontSize: 14, fontWeight: '800', color: theme.text },
  metricSub: { fontSize: 9, color: theme.subtext, marginTop: 2, fontStyle: 'italic' },
  perfPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  perfText: { fontSize: 10, fontWeight: '800', color: '#10B981' },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginTop: 14,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.subtext,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PrincipalStudentDetailsScreen;
