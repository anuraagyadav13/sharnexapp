import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'PrincipalClassDetail'>;

const PrincipalClassDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { classData } = route.params;
  const { authState } = useAuth();
  const formatDate = useCallback((dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return 'N/A';
    }
  }, []);

  const classNameFull = classData.name + (classData.section ? ` ${classData.section}` : '');

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconCircle}>
            <MaterialCommunityIcons name="google-classroom" size={36} color="#4F46E5" />
          </View>
          <Text style={styles.bannerClassName}>{classNameFull}</Text>
          <Text style={styles.bannerAcademicYear}>Academic Year {classData.academicYear || '2026'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Information</Text>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Ionicons name="calendar-outline" size={20} color="#4F46E5" style={styles.infoCardIcon} />
            <Text style={styles.infoCardLabel}>Academic Year</Text>
            <Text style={styles.infoCardValue}>{classData.academicYear || '2026'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="people-outline" size={20} color="#06B6D4" style={styles.infoCardIcon} />
            <Text style={styles.infoCardLabel}>Students</Text>
            <Text style={styles.infoCardValue}>{classData.studentCount || 0} enrolled</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="person-outline" size={20} color="#10B981" style={styles.infoCardIcon} />
            <Text style={styles.infoCardLabel}>Teachers</Text>
            <Text style={styles.infoCardValue}>{classData.teacherCount || 0} assigned</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="person-circle-outline" size={20} color="#F59E0B" style={styles.infoCardIcon} />
            <Text style={styles.infoCardLabel}>Class Teacher</Text>
            <Text style={styles.infoCardValue} numberOfLines={2}>
              {classData.classTeacherName || 'Not assigned'}
            </Text>
          </View>
        </View>

        {/* Date Card */}
        <View style={styles.dateCard}>
          <Ionicons name="time-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
          <Text style={styles.dateLabel}>Created On:</Text>
          <Text style={styles.dateValue}>{formatDate(classData.createdAt)}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBtn: {
    padding: 4,
  },
  appHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollContent: {
    padding: 16,
  },
  bannerCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerClassName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  bannerAcademicYear: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#FFF',
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoCardIcon: {
    marginBottom: 12,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 16,
  },
  dateLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 4,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
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

export default PrincipalClassDetailScreen;
