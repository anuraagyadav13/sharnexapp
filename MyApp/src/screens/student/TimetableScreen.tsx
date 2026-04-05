import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';

type TimetableNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Timetable'>;

interface Props {
  navigation: TimetableNavigationProp;
}

const TIMES = ['09:00', '09:45', '10:30', '11:15', '12:00', '12:45', '13:30'];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const SCHEDULE_DATA = [
  { day: 'MON', time: '09:45', subject: 'Science', teacher: 'Shubham Mangal' },
  { day: 'MON', time: '10:30', subject: 'Maths', teacher: 'John Doe Updated' },
  { day: 'MON', time: '12:00', subject: 'Computer', teacher: 'Manish Mangal' },
  { day: 'MON', time: '12:45', subject: 'Computer', teacher: 'Manish Mangal' },
  { day: 'MON', time: '13:30', subject: 'english', teacher: 'Shubham Mangal' },

  { day: 'TUE', time: '09:00', subject: 'Science', teacher: 'Shubham Mangal' },
  { day: 'TUE', time: '09:45', subject: 'Maths', teacher: 'John Doe Updated' },
  { day: 'TUE', time: '12:00', subject: 'Hindi', teacher: 'manish chotia' },
  { day: 'TUE', time: '12:45', subject: 'Computer', teacher: 'Manish Mangal' },
  { day: 'TUE', time: '13:30', subject: 'english', teacher: 'Shubham Mangal' },

  { day: 'WED', time: '09:00', subject: 'english', teacher: 'Shubham Mangal' },
  { day: 'WED', time: '09:45', subject: 'english', teacher: 'Shubham Mangal' },
  { day: 'WED', time: '10:30', subject: 'Science', teacher: 'Shubham Mangal' },
  { day: 'WED', time: '12:45', subject: 'Hindi', teacher: 'manish chotia' },

  { day: 'THU', time: '09:00', subject: 'english', teacher: 'Shubham Mangal' },
  { day: 'THU', time: '09:45', subject: 'Computer', teacher: 'Manish Mangal' },
  { day: 'THU', time: '10:30', subject: 'Hindi', teacher: 'manish chotia' },
  { day: 'THU', time: '12:00', subject: 'Science', teacher: 'Shubham Mangal' },
  { day: 'THU', time: '12:45', subject: 'Maths', teacher: 'John Doe Updated' },

  { day: 'FRI', time: '09:00', subject: 'Science', teacher: 'Shubham Mangal' },
  { day: 'FRI', time: '09:45', subject: 'Hindi', teacher: 'manish chotia' },
  { day: 'FRI', time: '10:30', subject: 'Computer', teacher: 'Manish Mangal' },
  { day: 'FRI', time: '12:00', subject: 'Maths', teacher: 'John Doe Updated' },
  { day: 'FRI', time: '12:45', subject: 'Hindi', teacher: 'manish chotia' },
  { day: 'FRI', time: '13:30', subject: 'Maths', teacher: 'John Doe Updated' },

  { day: 'SAT', time: '09:00', subject: 'Hindi', teacher: 'manish chotia' },
  { day: 'SAT', time: '09:45', subject: 'english', teacher: 'Shubham Mangal' },
  { day: 'SAT', time: '10:30', subject: 'Maths', teacher: 'John Doe Updated' },
  { day: 'SAT', time: '12:00', subject: 'Computer', teacher: 'Manish Mangal' },
  { day: 'SAT', time: '13:30', subject: 'Science', teacher: 'Shubham Mangal' }
];

const getCellData = (day: string, time: string) => {
  return SCHEDULE_DATA.find(d => d.day === day && d.time === time);
};

const getSubjectColors = (subject: string) => {
  const norm = subject.toLowerCase().trim();
  if (norm.includes('science')) return { bg: '#EEF2FF', text: '#4338CA', accent: '#6366F1' };
  if (norm.includes('maths')) return { bg: '#FFF1F2', text: '#BE123C', accent: '#F43F5E' };
  if (norm.includes('english')) return { bg: '#F0FDF4', text: '#15803D', accent: '#22C55E' };
  if (norm.includes('computer')) return { bg: '#FFFBEB', text: '#B45309', accent: '#F59E0B' };
  if (norm.includes('hindi')) return { bg: '#FAF5FF', text: '#7E22CE', accent: '#A855F7' };
  return { bg: '#F8FAFC', text: '#334155', accent: '#64748B' };
};

const TimetableScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <TouchableOpacity
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="menu" size={26} color="#111827" />
        </TouchableOpacity>

        <View style={styles.centerHeaderContainer}>
          <Text style={styles.headerTitle}>Weekly Timetable</Text>
          <Text style={styles.headerSubtitle}>Fall Semester</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}
          >
            <Ionicons name="settings-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
          >
            <View style={[styles.avatar, { marginLeft: 12 }]}><Text style={styles.avatarText}>A</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid Container */}
      <View style={styles.gridCanvas}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          <View style={{ flexDirection: 'row', paddingTop: 10 }}>
            {/* Left Time Column Fixed */}
            <View style={styles.timeColumn}>
              <View style={{ height: 40 }} /> {/* Top left corner offset for Day Headers */}
              {TIMES.map(time => {
                if (time === '11:15') {
                  return <View key={time} style={styles.lunchTimeCell}><Text style={styles.timeText}>{time}</Text></View>;
                }
                return (
                  <View key={time} style={styles.timeCell}>
                    <Text style={styles.timeText}>{time}</Text>
                  </View>
                );
              })}
            </View>

            {/* Horizontally Scrollable Days Grid */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Header Row (Days) */}
                <View style={styles.daysHeaderRow}>
                  {DAYS.map(day => {
                    const isToday = day === 'MON';
                    return (
                      <View key={day} style={styles.dayHeaderCell}>
                        <View style={[styles.dayBadge, isToday && styles.dayBadgeActive]}>
                          <Text style={[styles.dayHeaderText, isToday && styles.dayHeaderTextActive]}>{day}</Text>
                        </View>
                      </View>
                    )
                  })}
                </View>

                {/* Schedule Rows */}
                {TIMES.map(time => {
                  if (time === '11:15') {
                    return (
                      <View key={time} style={styles.lunchRowOuter}>
                        <View style={styles.lunchLineIndicator} />
                        <View style={styles.lunchBarWrapper}>
                          <Ionicons name="fast-food-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                          <Text style={styles.lunchText}>LUNCH BREAK</Text>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View key={time} style={styles.gridRow}>
                      {/* Dashed background row line */}
                      <View style={styles.rowDashedLine} />

                      {DAYS.map(day => {
                        const data = getCellData(day, time);

                        return (
                          <View key={day} style={styles.cellOuter}>
                            {data ? (
                              <View style={[styles.card, { backgroundColor: getSubjectColors(data.subject).bg }]}>
                                <View style={[styles.cardAccentLine, { backgroundColor: getSubjectColors(data.subject).accent }]} />
                                <Text style={[styles.subjectText, { color: getSubjectColors(data.subject).text }]}>{data.subject}</Text>
                                <View style={styles.teacherRow}>
                                  <Ionicons name="person" size={10} color={getSubjectColors(data.subject).accent} style={{ marginRight: 4, opacity: 0.6 }} />
                                  <Text style={[styles.teacherText, { color: getSubjectColors(data.subject).text, opacity: 0.8 }]} numberOfLines={1}>
                                    {data.teacher}
                                  </Text>
                                </View>
                              </View>
                            ) : <View style={styles.emptyCard} />}
                          </View>
                        )
                      })}
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          </View>

        </ScrollView>
      </View>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="student"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' }, // Soft blue/gray ambient background
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  menuHandle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerHeaderContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  gridCanvas: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 14,
    borderRadius: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  timeColumn: {
    width: 60,
    paddingRight: 6,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9', // Subtle separator for time col
    zIndex: 10,
  },
  timeCell: {
    height: 96, // Increased height for premium feel
    alignItems: 'center',
    paddingTop: 18,
  },
  lunchTimeCell: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },

  daysHeaderRow: {
    flexDirection: 'row',
    height: 46,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9', // Subtle header separator
  },
  dayHeaderCell: {
    width: 156, // Slightly wider columns
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  dayBadgeActive: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.0,
  },
  dayHeaderTextActive: {
    color: '#FFFFFF',
  },

  gridRow: {
    flexDirection: 'row',
    height: 96,
  },
  rowDashedLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: '#F8FAFC',
    borderStyle: 'dashed', // Awesome premium grid-feel
  },
  cellOuter: {
    width: 156,
    height: 96,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  card: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardAccentLine: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  emptyCard: {
    flex: 1,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    paddingLeft: 4,
    letterSpacing: 0.2,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  teacherText: {
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },

  lunchRowOuter: {
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    width: 6 * 156, // Updates width to match wider cells
  },
  lunchLineIndicator: {
    position: 'absolute',
    top: 19, // exact middle of 38
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E5E7EB',
    borderStyle: 'dashed',
    zIndex: 0,
  },
  lunchBarWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  lunchText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1.5,
  }
});

export default TimetableScreen;
