import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useState } from 'react';

type PerformanceScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Performance'>;

interface Props {
  navigation: PerformanceScreenNavigationProp;
}

const PerformanceScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Page Titles */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <Text style={styles.pageTitle}>Performance</Text>
           <Text style={styles.pageSubtitle}>Take a look on your Performance</Text>
        </Animated.View>

        {/* Card 1: Performance Overview */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.card}>
           <Text style={styles.cardHeader}>Performance Overview</Text>
           <View style={styles.cardDivider} />
           <View style={styles.gridContainer}>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#9333EA'}]}>70 %</Text>
                 <Text style={styles.gridLbl}>Current GPA</Text>
              </View>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#F97316'}]}>#8</Text>
                 <Text style={styles.gridLbl}>Class Rank</Text>
              </View>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#F59E0B'}]}>+12%</Text>
                 <Text style={styles.gridLbl}>Improvement Rate</Text>
              </View>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#3B82F6'}]}>93.5%</Text>
                 <Text style={styles.gridLbl}>Attendance</Text>
              </View>
           </View>
        </Animated.View>

        {/* Card 2: Overall Performance */}
        <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.card}>
           <View style={styles.cardRowBetween}>
              <Text style={styles.cardHeader}>Overall Performance</Text>
              <View style={styles.improvingPill}>
                 <Ionicons name="arrow-up" size={12} color="#10B981" />
                 <Text style={styles.improvingText}>Improving</Text>
              </View>
           </View>
           <View style={styles.cardDivider} />

           <View style={styles.centerBlock}>
             <Text style={styles.hugePercent}>87.9 %</Text>
             <Text style={styles.hugeSubtitle}>Current Term Average</Text>
           </View>

           <View style={[styles.gridContainer, {marginTop: 6}]}>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#EF4444'}]}>5th</Text>
                 <Text style={styles.gridLbl}>Class Rank</Text>
              </View>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#9333EA', fontSize: 18}]}>A-</Text>
                 <Text style={styles.gridLbl}>Overall Grade</Text>
              </View>
           </View>

           <View style={styles.progressSection}>
             <View style={styles.progressRow}>
               <Text style={styles.progressLbl}>Assignment Completed</Text>
               <Text style={styles.progressVal}>98%</Text>
             </View>
             <View style={styles.progressBarBg}>
               <View style={[styles.progressBarFill, { width: '98%', backgroundColor: '#F97316' }]} />
             </View>
           </View>
        </Animated.View>

        {/* Card 3: Attendance Details */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.card}>
           <Text style={styles.cardHeader}>Attendance Details</Text>
           <View style={styles.cardDivider} />
           
           <View style={styles.centerBlock}>
             <Text style={[styles.hugePercent, {color: '#000', textShadowRadius: 0, textShadowColor: 'transparent'}]}>100 %</Text>
             <Text style={styles.hugeSubtitle}>Current Attendance Rate</Text>
           </View>

           <View style={styles.gridContainer}>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#000'}]}>5/5</Text>
                 <Text style={styles.gridLbl}>This Week</Text>
              </View>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#000'}]}>5/5</Text>
                 <Text style={styles.gridLbl}>This Month</Text>
              </View>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#000'}]}>5/5</Text>
                 <Text style={styles.gridLbl}>This Term</Text>
              </View>
              <View style={styles.gridBox}>
                 <Text style={[styles.gridVal, {color: '#000'}]}>2</Text>
                 <Text style={styles.gridLbl}>Days Absent</Text>
              </View>
           </View>
        </Animated.View>

        {/* Card 4: Subject Performance */}
        <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.card}>
           <Text style={styles.cardHeader}>Subject Performance</Text>
           <View style={styles.cardDivider} />
           
           <View style={styles.subjectBox}>
             <View style={styles.subjectRowBetween}>
                <Text style={styles.subjectName}>Mathematics</Text>
                <Text style={styles.subjectGrade}>A</Text>
             </View>
             
             <View style={[styles.progressBarBg, {marginBottom: 16}]}>
               <View style={[styles.progressBarFill, { width: '92%', backgroundColor: '#F97316' }]} />
             </View>
             
             <View style={styles.subjectRowBetween2}>
                <Text style={styles.subjectSubText}>Score: 92%</Text>
                <Text style={styles.subjectSubText}>Rank: 1st</Text>
             </View>
             
             <View style={[styles.improvingPill, {paddingLeft: 0, marginTop: 4}]}>
                <Ionicons name="arrow-up" size={14} color="#10B981" />
                <Text style={[styles.improvingText, {marginLeft: 4, color: '#10B981'}]}>Improved by 5%</Text>
             </View>
           </View>

           <View style={styles.scrollMoreRow}>
             <Ionicons name="chevron-down" size={14} color="#6B7280" />
             <Text style={styles.scrollMoreText}>Scroll for more subjects</Text>
           </View>
        </Animated.View>

        {/* Card 5: Attendance Analysis */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.card}>
           <Text style={styles.cardHeader}>Attendance Analysis</Text>
           <View style={styles.cardDivider} />

           <View style={styles.chartContainer}>
              {[ 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map((lbl, idx) => (
                <View key={idx} style={styles.chartCol}>
                   <Text style={styles.chartTopLabel}>95%</Text>
                   <View style={styles.chartBarWrapper}>
                      <View style={{height: '15%', backgroundColor: '#2DD4BF'}} />
                      <View style={{height: '35%', backgroundColor: '#0EA5E9'}} />
                      <View style={{height: '50%', backgroundColor: '#0284C7'}} />
                   </View>
                   <Text style={styles.chartBotLabel}>{lbl}</Text>
                </View>
              ))}
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
    paddingTop: 60, 
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
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#3B82F6', marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 20,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9'
  },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeader: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 12 },
  cardDivider: { height: 1, backgroundColor: '#F3F4F6', width: '100%', marginBottom: 16 },

  improvingPill: { flexDirection: 'row', alignItems: 'center' },
  improvingText: { fontSize: 11, fontWeight: '700', color: '#10B981', marginLeft: 2 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  gridBox: { width: '48%', backgroundColor: '#F8FAFC', borderRadius: 8, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  gridVal: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  gridLbl: { fontSize: 10, color: '#6B7280', fontWeight: '500' },

  centerBlock: { alignItems: 'center', marginBottom: 16, marginTop: 4 },
  hugePercent: { 
    fontSize: 34, fontWeight: '900', color: '#3B82F6', marginBottom: 4,
    textShadowColor: 'rgba(59, 130, 246, 0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 8
  },
  hugeSubtitle: { fontSize: 11, color: '#6B7280', fontWeight: '600' },

  progressSection: { marginTop: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLbl: { fontSize: 10, fontWeight: '600', color: '#111827' },
  progressVal: { fontSize: 10, fontWeight: '700', color: '#111827' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  subjectBox: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16,
    borderLeftWidth: 4, borderLeftColor: '#F97316'
  },
  subjectRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subjectName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  subjectGrade: { fontSize: 18, fontWeight: '800', color: '#10B981' },
  subjectRowBetween2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subjectSubText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },

  scrollMoreRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 4 },
  scrollMoreText: { fontSize: 10, color: '#6B7280', fontWeight: '500' },

  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  chartCol: { alignItems: 'center' },
  chartTopLabel: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 12 },
  chartBotLabel: { fontSize: 11, fontWeight: '600', color: '#111827', marginTop: 12 },
  chartBarWrapper: { width: 42, height: 110, borderRadius: 6, overflow: 'hidden' },
});

export default PerformanceScreen;
