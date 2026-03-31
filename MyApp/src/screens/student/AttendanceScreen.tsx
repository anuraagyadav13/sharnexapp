import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';

type AttendanceScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Attendance'>;

interface Props {
  navigation: AttendanceScreenNavigationProp;
}

const AttendanceScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // Calendar data starting 1 on Sunday, padded to 35 slots to prevent flex wrap spreading
  const daysInMonth = Array.from({ length: 35 }, (_, i) => i < 31 ? i + 1 : null);

  const getDayStyle = (day: number) => {
    // 1st column is Sunday
    if ([1, 8, 15, 22, 29].includes(day)) return 'weekend';
    if ([16, 18].includes(day)) return 'absent';
    return 'present'; 
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F9" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <ScaleButton 
          style={styles.menuHandle} 
          onPress={() => setDrawerOpen(true)}
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={28} color="#1F2937" />
        </ScaleButton>
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Welcome back, Anurag</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>A</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Title */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <Text style={styles.pageTitle}>Attendance</Text>
           <Text style={styles.pageSubtitle}>Track your daily attendance and punctuality</Text>
        </Animated.View>

        {/* Card 1: Attendance Rate Blocks */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.card}>
           <Text style={[styles.cardHeader, {marginBottom: 14}]}>Attendance Rate</Text>
           
           <View style={styles.statsRow}>
              <View style={[styles.statBox, {borderLeftColor: '#3B82F6'}]}>
                 <Text style={styles.statBoxTitle} numberOfLines={1} adjustsFontSizeToFit>Attendance Rate</Text>
                 <Text style={styles.statBoxVal} adjustsFontSizeToFit numberOfLines={1}>95.5 %</Text>
              </View>

              <View style={[styles.statBox, styles.statBoxMid, {borderLeftColor: '#10B981'}]}>
                 <Text style={styles.statBoxTitle} numberOfLines={1} adjustsFontSizeToFit>Days Present</Text>
                 <Text style={styles.statBoxSub} numberOfLines={2}>Total for 2024 - 2025</Text>
                 <Text style={styles.statBoxVal} adjustsFontSizeToFit numberOfLines={1}>142</Text>
              </View>

              <View style={[styles.statBox, {borderLeftColor: '#EF4444'}]}>
                 <Text style={styles.statBoxTitle} numberOfLines={1} adjustsFontSizeToFit>Days Absent</Text>
                 <Text style={styles.statBoxSub} numberOfLines={2}>Requires Attention</Text>
                 <Text style={styles.statBoxVal} adjustsFontSizeToFit numberOfLines={1}>8</Text>
              </View>
           </View>
        </Animated.View>

        {/* Card 2: Calendar */}
        <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.card}>
           <View style={styles.cardRowBetween}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                 <Ionicons name="calendar-outline" size={18} color="#111827" style={{marginRight: 6}} />
                 <Text style={styles.cardHeader}>Dec 2025</Text>
              </View>
              <View style={styles.calArrows}>
                 <TouchableOpacity style={styles.calBtn}>
                   <Ionicons name="chevron-back" size={14} color="#111827" />
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.calBtn}>
                   <Ionicons name="chevron-forward" size={14} color="#111827" />
                 </TouchableOpacity>
              </View>
           </View>

           {/* Days of week */}
           <View style={styles.calDaysHeader}>
             {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
               <Text key={d} style={styles.calDayText}>{d}</Text>
             ))}
           </View>

           {/* Grid */}
           <View style={styles.calGrid}>
             {daysInMonth.map((day, index) => {
               if (day === null) {
                 return <View key={`empty-${index}`} style={{ width: '13%' }} />;
               }
               const stType = getDayStyle(day);
               return (
                 <View key={day} style={[
                   styles.calCell, 
                   stType === 'present' && styles.calCellPresent,
                   stType === 'absent' && styles.calCellAbsent,
                   stType === 'weekend' && styles.calCellWeekend
                 ]}>
                   <Text style={[
                     styles.calCellText,
                     stType === 'present' && styles.calCellTextPresent,
                     stType === 'absent' && styles.calCellTextAbsent,
                   ]}>{day}</Text>
                 </View>
               )
             })}
           </View>

           <View style={styles.calDivider} />
           
           <View style={styles.calLegend}>
             <View style={styles.legendItem}>
                <View style={[styles.legendBox, {backgroundColor: '#A7F3D0'}]} />
                <Text style={styles.legendText}>Present</Text>
             </View>
             <View style={styles.legendItem}>
                <View style={[styles.legendBox, {backgroundColor: '#FECACA'}]} />
                <Text style={styles.legendText}>Absent</Text>
             </View>
           </View>
        </Animated.View>

        {/* Card 3: Recent Records */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.card}>
           <View style={styles.cardRowBetween}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                 <Ionicons name="time-outline" size={18} color="#111827" style={{marginRight: 6}} />
                 <Text style={styles.cardHeader}>Recent Attendance Records</Text>
              </View>
              <TouchableOpacity style={styles.viewAllBtn}>
                 <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
           </View>

           <View style={styles.table}>
             {/* Header */}
             <View style={styles.tableHeaderRow}>
               <Text style={[styles.thText, {flex: 1.5}]}>Date</Text>
               <Text style={[styles.thText, {flex: 1}]}>Day</Text>
               <Text style={[styles.thText, {flex: 1}]}>Status</Text>
               <Text style={[styles.thText, {flex: 1.2}]}>Remark</Text>
             </View>
             
             {/* Rows */}
             {[
               { date: 'Dec 22, 2025', day: 'Monday', status: 'Present', remark: '----' },
               { date: 'Dec 22, 2025', day: 'Monday', status: 'Present', remark: '----' },
               { date: 'Dec 22, 2025', day: 'Monday', status: 'Present', remark: '----' },
               { date: 'Dec 22, 2025', day: 'Monday', status: 'Absent', remark: 'Medical leave' },
             ].map((row, idx) => (
               <View key={idx} style={styles.tableRow}>
                 <Text style={[styles.tdTextBold, {flex: 1.5}]}>{row.date}</Text>
                 <Text style={[styles.tdText, {flex: 1}]}>{row.day}</Text>
                 <View style={[{flex: 1}, styles.tdPillWrap]}>
                   <View style={row.status === 'Present' ? styles.statusPresent : styles.statusAbsent}>
                     <Text style={row.status === 'Present' ? styles.statusTextPresent : styles.statusTextAbsent}>{row.status}</Text>
                   </View>
                 </View>
                 <Text style={[styles.tdText, {flex: 1.2}]}>{row.remark}</Text>
               </View>
             ))}
           </View>
        </Animated.View>

        {/* Card 4: Academic Goal Progress */}
        <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.card}>
           <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
             <Ionicons name="disc-outline" size={20} color="#111827" style={{marginRight: 6}} />
             <Text style={styles.cardHeader}>Academic Goal Progress</Text>
           </View>

           <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
              <Text style={styles.targetTitle}>Target : 95 % Attendance</Text>
              <Text style={styles.targetPercent}>94.7 %</Text>
           </View>

           <View style={styles.progressBarBg}>
             <View style={[styles.progressBarFill, {width: '94.7%'}]} />
           </View>

           <View style={styles.progressMetrics}>
              <Text style={styles.metricText}>Current : 94.7 %</Text>
              <Text style={styles.metricText}>Class Avg : 94.7 %</Text>
              <Text style={styles.metricText}>Remaining : 0.7 %</Text>
           </View>
        </Animated.View>

      </ScrollView>

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
  mainContainer: { flex: 1, backgroundColor: '#FAF9F9' },
  scrollContent: { paddingBottom: 40 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 16,
    backgroundColor: '#FFFFFF', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  pageTitleWrapper: { marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 20,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    marginBottom: 16, borderWidth: 1, borderColor: '#FAFAFA' // Slightly softer border
  },
  cardHeader: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },

  /* Card 1 Stats */
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statBoxMid: {
    marginHorizontal: 8,
  },
  statBoxTitle: { fontSize: 10, fontWeight: '700', color: '#111827', marginBottom: 4 },
  statBoxSub: { fontSize: 8, color: '#9CA3AF', marginBottom: 12, lineHeight: 10 },
  statBoxVal: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 'auto' },

  /* Card 2 Calendar */
  calArrows: { flexDirection: 'row', gap: 6 },
  calBtn: { padding: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  calDaysHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  calDayText: { width: '13%', textAlign: 'center', fontSize: 9, fontWeight: '600', color: '#6B7280' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 0 },
  calCell: {
    width: '13%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
    marginBottom: 6, borderRadius: 6,
  },
  calCellWeekend: { borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  calCellPresent: { backgroundColor: '#D1FAE5' },
  calCellAbsent: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#F87171' },
  calCellText: { fontSize: 11, fontWeight: '600', color: '#111827' },
  calCellTextPresent: { color: '#059669' },
  calCellTextAbsent: { color: '#EF4444' },
  calDivider: { height: 1, backgroundColor: '#E5E7EB', marginTop: 4, marginBottom: 10 },
  calLegend: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 10, fontWeight: '600', color: '#111827' },

  /* Card 3 Table */
  viewAllBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  viewAllText: { fontSize: 10, fontWeight: '600', color: '#374151' },
  table: { marginTop: 4 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, marginBottom: 4 },
  thText: { fontSize: 10, fontWeight: '700', color: '#111827' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tdText: { fontSize: 10, color: '#4B5563', fontWeight: '500' },
  tdTextBold: { fontSize: 10, color: '#111827', fontWeight: '700' },
  tdPillWrap: { alignItems: 'flex-start' },
  statusPresent: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusAbsent: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusTextPresent: { fontSize: 9, color: '#059669', fontWeight: '600' },
  statusTextAbsent: { fontSize: 9, color: '#DC2626', fontWeight: '600' },

  /* Card 4 Target Progress */
  targetTitle: { fontSize: 12, fontWeight: '700', color: '#111827' },
  targetPercent: { fontSize: 14, fontWeight: '800', color: '#3B82F6' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, width: '100%', overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', borderRadius: 3, backgroundColor: '#3B82F6' },
  progressMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricText: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
});

export default AttendanceScreen;
