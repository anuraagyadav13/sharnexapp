import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../store/ThemeContext';
import { BusSubHeader } from '../../../components/bus/BusSubHeader';
import { busStore } from '../../../services/busMockData';

interface Props {
  navigation: any;
}

const MOCK_STUDENTS = [
  { id: 'ST-501', name: 'Aarav Sharma (Class 8-A)' },
  { id: 'ST-502', name: 'Ananya Gupta (Class 10-B)' },
  { id: 'ST-503', name: 'Rahul Verma (Class 6-C)' },
  { id: 'ST-504', name: 'Diya Patel (Class 9-A)' },
];

export const EnrollStudentScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const schedules = busStore.getSchedules();

  // Dropdown states
  const [selectedStudent, setSelectedStudent] = useState(MOCK_STUDENTS[0]);
  const [selectedSchedule, setSelectedSchedule] = useState(schedules[0] || {
    id: 'SCH-8942-X',
    routeName: 'Northern Express Corridor',
    tripType: 'Morning Pickup',
  });
  const [boardingStop, setBoardingStop] = useState('Hebbal Flyover Circle');
  const [dropStop, setDropStop] = useState('School Main Gate');

  const [openDropdown, setOpenDropdown] = useState<'student' | 'schedule' | 'boarding' | 'drop' | null>(null);

  const handleEnrollSubmit = () => {
    // TODO: replace with API call
    busStore.enrollStudent({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      scheduleId: selectedSchedule.id,
      routeName: selectedSchedule.routeName,
      boardingStop: boardingStop,
      dropStop: dropStop,
    });

    Alert.alert('Success', `${selectedStudent.name} has been enrolled on "${selectedSchedule.routeName}"!`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      <BusSubHeader
        activeTab="Dashboard"
        navigation={navigation}
        title="Enroll Student"
        isStackSubScreen={true}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Top Back Link */}
        <TouchableOpacity
          style={styles.backLinkRow}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={16} color="#7C3AED" style={{ marginRight: 4 }} />
          <Text style={styles.backLinkText}>Back to enrollments</Text>
        </TouchableOpacity>

        {/* Centered Main Card */}
        <View style={[styles.mainCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardHeaderIconBox}>
            <Ionicons name="school-outline" size={28} color="#FFFFFF" />
          </View>

          <Text style={styles.cardTitle}>Enroll Student on a Bus Route</Text>
          <Text style={styles.cardSubtitle}>Assign daily transportation corridor and bus stop locations</Text>

          <View style={styles.divider} />

          {/* 1. Student Dropdown */}
          <Text style={styles.inputLabel}>1. Select Student *</Text>
          <TouchableOpacity
            style={[styles.dropdownSelect, { borderColor: theme.border }]}
            onPress={() => setOpenDropdown(openDropdown === 'student' ? null : 'student')}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]}>{selectedStudent.name}</Text>
            <Ionicons name={openDropdown === 'student' ? "chevron-up" : "chevron-down"} size={18} color={theme.subtext} />
          </TouchableOpacity>

          {openDropdown === 'student' && (
            <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {MOCK_STUDENTS.map(st => (
                <TouchableOpacity
                  key={st.id}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSelectedStudent(st);
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, { color: theme.text }]}>{st.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 2. Schedule Dropdown */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>2. Select Route Schedule *</Text>
          <TouchableOpacity
            style={[styles.dropdownSelect, { borderColor: theme.border }]}
            onPress={() => setOpenDropdown(openDropdown === 'schedule' ? null : 'schedule')}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]} numberOfLines={1}>
              {selectedSchedule.routeName} ({selectedSchedule.tripType})
            </Text>
            <Ionicons name={openDropdown === 'schedule' ? "chevron-up" : "chevron-down"} size={18} color={theme.subtext} />
          </TouchableOpacity>

          {openDropdown === 'schedule' && (
            <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {schedules.map(sch => (
                <TouchableOpacity
                  key={sch.id}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSelectedSchedule(sch);
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, { color: theme.text }]}>
                    {sch.routeName} — {sch.tripType} [{sch.id}]
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 3. Boarding Stop Dropdown */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>3. Select Boarding Stop *</Text>
          <TouchableOpacity
            style={[styles.dropdownSelect, { borderColor: theme.border }]}
            onPress={() => setOpenDropdown(openDropdown === 'boarding' ? null : 'boarding')}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]}>{boardingStop}</Text>
            <Ionicons name={openDropdown === 'boarding' ? "chevron-up" : "chevron-down"} size={18} color={theme.subtext} />
          </TouchableOpacity>

          {openDropdown === 'boarding' && (
            <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {['Hebbal Flyover Circle', 'RT Nagar Post Office', 'Cantonment Station', 'School Gate #2'].map(stopName => (
                <TouchableOpacity
                  key={stopName}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setBoardingStop(stopName);
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, { color: theme.text }]}>{stopName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 4. Drop Stop Dropdown */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>4. Select Drop-Off Stop *</Text>
          <TouchableOpacity
            style={[styles.dropdownSelect, { borderColor: theme.border }]}
            onPress={() => setOpenDropdown(openDropdown === 'drop' ? null : 'drop')}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]}>{dropStop}</Text>
            <Ionicons name={openDropdown === 'drop' ? "chevron-up" : "chevron-down"} size={18} color={theme.subtext} />
          </TouchableOpacity>

          {openDropdown === 'drop' && (
            <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {['School Main Gate', 'Jayanagar 4th Block', 'JP Nagar Metro Stn', 'Whitefield Central'].map(stopName => (
                <TouchableOpacity
                  key={stopName}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setDropStop(stopName);
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, { color: theme.text }]}>{stopName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Submit Gradient Button */}
          <TouchableOpacity
            style={styles.submitGradientBtn}
            activeOpacity={0.85}
            onPress={handleEnrollSubmit}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.submitBtnText}>Enroll Student</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    backLinkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    backLinkText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#7C3AED',
    },
    mainCard: {
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDarkMode ? 0 : 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    cardHeaderIconBox: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: '#7C3AED',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 12,
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 5,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
    },
    cardSubtitle: {
      fontSize: 13,
      color: theme.subtext,
      textAlign: 'center',
      marginTop: 4,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 16,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
    },
    dropdownSelect: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#120D24' : '#F8FAFC',
    },
    dropdownText: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    dropdownList: {
      borderRadius: 12,
      borderWidth: 1,
      marginTop: 4,
      overflow: 'hidden',
    },
    dropdownOption: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    dropdownOptionText: {
      fontSize: 13,
      fontWeight: '600',
    },
    submitGradientBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 50,
      borderRadius: 25,
      backgroundColor: '#7C3AED',
      marginTop: 24,
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 5,
    },
    submitBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
