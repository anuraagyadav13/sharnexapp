import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Image,
  Platform,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import principalService, { StudentItem } from '../../services/principalService';

type Props = NativeStackScreenProps<RootStackParamList, 'PrincipalClassDetail'>;

const PrincipalClassDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { classData, classId: paramClassId } = route.params;
  const targetClassId = classData?.id || paramClassId;

  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const fetchStudents = useCallback(async (isRefresh = false) => {
    if (!targetClassId) return;
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingStudents(true);
    }

    try {
      const res = await principalService.getClassStudents(targetClassId);
      const studentData = res.data?.students || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setStudents(Array.isArray(studentData) ? studentData : []);
    } catch (error) {
      console.error('[PrincipalClassDetail] Failed to fetch students:', error);
    } finally {
      setIsLoadingStudents(false);
      setIsRefreshing(false);
    }
  }, [targetClassId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const formatDate = useCallback((dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return 'N/A';
    }
  }, []);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const query = studentSearch.trim().toLowerCase();
    return students.filter(s => {
      const name = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
      const roll = (s.rollNumber || s.roll_number || '').toLowerCase();
      return name.includes(query) || roll.includes(query);
    });
  }, [students, studentSearch]);

  const classNameFull = (classData?.name || 'Class Detail') + (classData?.section ? ` - Sec ${classData.section}` : '');

  const renderStudentItem = useCallback(({ item }: { item: StudentItem }) => {
    const studentName = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown Student';
    const rollNo = item.rollNumber || item.roll_number || 'N/A';
    const attendancePct = item.attendancePercentage ?? item.attendance ?? null;
    const isActive = item.isActive !== undefined ? item.isActive : (item.status === 'ACTIVE' || true);

    return (
      <View style={styles.studentCard}>
        {item.avatarUrl || item.photoUrl ? (
          <Image source={{ uri: item.avatarUrl || item.photoUrl }} style={styles.studentAvatarImage} />
        ) : (
          <View style={styles.studentAvatarCircle}>
            <Text style={styles.studentAvatarText}>{studentName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.studentInfoContainer}>
          <Text style={styles.studentNameText}>{studentName}</Text>
          <Text style={styles.studentRollText}>Roll No: {rollNo}</Text>
        </View>
        <View style={styles.studentMetricsContainer}>
          {attendancePct !== null && (
            <View style={styles.attendanceBadge}>
              <Text style={styles.attendanceText}>{attendancePct}% Att.</Text>
            </View>
          )}
          <View style={[styles.statusIndicator, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
        </View>
      </View>
    );
  }, [styles]);

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Class Details</Text>
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
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderStudentItem}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchStudents(true)}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Main Banner */}
            <View style={styles.bannerCard}>
              <View style={styles.bannerIconCircle}>
                <MaterialCommunityIcons name="google-classroom" size={36} color={theme.primary} />
              </View>
              <Text style={styles.bannerClassName}>{classNameFull || 'Class'}</Text>
              <Text style={styles.bannerAcademicYear}>Academic Year {classData?.academicYear || '2026'}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.manageBtn}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('PrincipalManageClass', {
                    classId: targetClassId,
                    className: classData?.name || 'Class',
                  })
                }
              >
                <Ionicons name="options-outline" size={20} color="#FFF" />
                <Text style={styles.manageBtnText}>Manage Class</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editBtn}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('PrincipalEditClass', {
                    classId: targetClassId,
                    classData,
                  })
                }
              >
                <Ionicons name="create-outline" size={20} color={theme.primary} />
                <Text style={styles.editBtnText}>Edit Details</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Information</Text>

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Ionicons name="calendar-outline" size={20} color="#4F46E5" style={styles.infoCardIcon} />
                <Text style={styles.infoCardLabel}>Academic Year</Text>
                <Text style={styles.infoCardValue}>{classData?.academicYear || '2026'}</Text>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="people-outline" size={20} color="#06B6D4" style={styles.infoCardIcon} />
                <Text style={styles.infoCardLabel}>Students</Text>
                <Text style={styles.infoCardValue}>{classData?.studentCount ?? students.length} enrolled</Text>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="person-outline" size={20} color="#10B981" style={styles.infoCardIcon} />
                <Text style={styles.infoCardLabel}>Teachers</Text>
                <Text style={styles.infoCardValue}>{classData?.teacherCount ?? 0} assigned</Text>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="person-circle-outline" size={20} color="#F59E0B" style={styles.infoCardIcon} />
                <Text style={styles.infoCardLabel}>Class Teacher</Text>
                <Text style={styles.infoCardValue} numberOfLines={2}>
                  {classData?.classTeacherName || 'Not assigned'}
                </Text>
              </View>
            </View>

            {/* Date Card */}
            <View style={styles.dateCard}>
              <Ionicons name="time-outline" size={20} color={theme.subtext} style={{ marginRight: 8 }} />
              <Text style={styles.dateLabel}>Created On:</Text>
              <Text style={styles.dateValue}>{formatDate(classData?.createdAt)}</Text>
            </View>

            {/* Students Header & Search */}
            <View style={styles.studentsHeaderContainer}>
              <Text style={styles.sectionTitle}>Enrolled Students ({students.length})</Text>

              <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search student by name or roll no..."
                  placeholderTextColor={theme.placeholder}
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                />
                {!!studentSearch && (
                  <TouchableOpacity onPress={() => setStudentSearch('')}>
                    <Ionicons name="close-circle" size={18} color={theme.subtext} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoadingStudents ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.emptySubtitle, { marginTop: 8 }]}>Loading enrolled students...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={theme.subtext} />
              <Text style={styles.emptyTitle}>No Students Found</Text>
              <Text style={styles.emptySubtitle}>
                {studentSearch ? 'No student matches your search query.' : 'No students have been enrolled in this class yet.'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
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
  scrollContent: {
    padding: 16,
  },
  bannerCard: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  bannerIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerClassName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  bannerAcademicYear: {
    fontSize: 14,
    color: theme.subtext,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  manageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  manageBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  editBtnText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: theme.surface,
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoCardIcon: {
    marginBottom: 12,
  },
  infoCardLabel: {
    fontSize: 12,
    color: theme.subtext,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 13,
    color: theme.subtext,
    marginRight: 4,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  studentsHeaderContainer: {
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.text,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  studentAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  studentAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
  },
  studentInfoContainer: {
    flex: 1,
  },
  studentNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  studentRollText: {
    fontSize: 12,
    color: theme.subtext,
  },
  studentMetricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendanceBadge: {
    backgroundColor: theme.primary + '15',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  attendanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.primary,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.subtext,
    textAlign: 'center',
    marginTop: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9F7AEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  headerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 4,
  },
});

export default PrincipalClassDetailScreen;
