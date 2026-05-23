import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient, { getApiErrorMessage } from '../../services/apiClient';
import { ENDPOINTS } from '../../constants/api';

const InfoField = ({ label, value }: { label: string, value: string | null | undefined }) => (
  <View style={styles.infoField}>
    <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
    <Text style={styles.infoValue}>{value || '-'}</Text>
  </View>
);

const PrincipalViewStudentScreen = ({ navigation, route }: any) => {
  const { studentId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.PRINCIPAL.STUDENT_DETAIL(studentId));
        const rawData = response.data?.data || response.data || {};
        const data = rawData.student || rawData;
        setStudent(data);
      } catch (error) {
        console.error('Failed to fetch student:', error);
        Alert.alert('Error', getApiErrorMessage(error), [
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentData();
  }, [studentId]);

  if (isLoading) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!student) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Back Nav */}
        <TouchableOpacity style={styles.backNav} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={16} color="#3B82F6" />
          <Text style={styles.backNavText}>Back to Students</Text>
        </TouchableOpacity>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{student.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{student.name}</Text>
            <Text style={styles.heroEmail}>{student.email}</Text>
            <View style={styles.heroBadges}>
              <View style={styles.badge}><Text style={styles.badgeText}>Roll No: {student.rollNo || '-'}</Text></View>
              {student.className && (
                <View style={styles.badge}><Text style={styles.badgeText}>Class {student.className} {student.classSection}</Text></View>
              )}
              {student.isApproved && (
                <View style={[styles.badge, { backgroundColor: '#10B981', borderColor: '#10B981' }]}>
                  <Ionicons name="checkmark" size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: '#FFF' }]}>Approved</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={18} color="#6366F1" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <View style={styles.gridRow}>
            <InfoField label="Full Name" value={student.name} />
            <InfoField label="Gender" value={student.gender} />
          </View>
          <View style={styles.gridRow}>
            <InfoField label="Date of Birth" value={formatDate(student.dateOfBirth)} />
            <InfoField label="Admission / Roll No" value={student.rollNo} />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail" size={18} color="#6366F1" />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>
          <View style={styles.gridRow}>
            <InfoField label="Email Address" value={student.email} />
            <InfoField label="Phone Number" value={student.phone} />
          </View>
          <View style={styles.gridRow}>
            <InfoField label="Address" value={student.address} />
          </View>
        </View>

        {/* Parent / Guardian Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={18} color="#6366F1" />
            <Text style={styles.sectionTitle}>Parent / Guardian Information</Text>
          </View>
          <View style={styles.gridRow}>
            <InfoField label="Parent Name" value={student.parentName} />
            <InfoField label="Parent Phone" value={student.parentPhone} />
          </View>
          <View style={styles.gridRow}>
            <InfoField label="Parent Email" value={student.parentEmail} />
            <InfoField label="Relationship" value={student.parentRelationship} />
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={18} color="#6366F1" />
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
          </View>
          <View style={styles.gridRow}>
            <InfoField label="Contact Name" value={student.emergencyName} />
            <InfoField label="Contact Phone" value={student.emergencyPhone} />
          </View>
          <View style={styles.gridRow}>
            <InfoField label="Contact Email" value={student.emergencyEmail} />
            <InfoField label="Relationship" value={student.emergencyRelationship} />
          </View>
        </View>

        {/* Academic Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={18} color="#6366F1" />
            <Text style={styles.sectionTitle}>Academic Information</Text>
          </View>
          <View style={styles.gridRow}>
            <InfoField label="Class" value={student.className ? `${student.className} ${student.classSection || ''}`.trim() : '-'} />
            <InfoField label="Grade" value={student.classGrade} />
          </View>
          <View style={styles.gridRow}>
            <InfoField label="Account Status" value={student.isActive ? 'Active' : 'Inactive'} />
            <InfoField label="Enrolled Since" value={formatDate(student.createdAt)} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },

  backNav: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingTop: Platform.OS === 'ios' ? 40 : 20 },
  backNavText: { color: '#3B82F6', fontSize: 14, fontWeight: '600', marginLeft: 6 },

  heroCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  heroAvatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#A78BFA',
    alignItems: 'center', justifyContent: 'center', marginRight: 20,
    borderWidth: 2, borderColor: '#C4B5FD',
  },
  heroAvatarText: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  heroEmail: { fontSize: 13, color: '#DDD6FE', marginBottom: 12 },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { 
    paddingHorizontal: 10, paddingVertical: 4, 
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row', alignItems: 'center'
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#FFF' },

  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginLeft: 8 },

  gridRow: { flexDirection: 'row', marginBottom: 16, flexWrap: 'wrap', gap: 20 },
  infoField: { flex: 1, minWidth: '45%' },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 6, letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
});

export default PrincipalViewStudentScreen;
