import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherViewQuizResult'>;

const MOCK_STUDENTS = Array.from({ length: 10 }).map((_, i) => ({
  id: i.toString(),
  name: 'Sara Safari',
  score: '98% (58/60)',
  grade: 'A+',
  time: '38 min',
  status: 'Completed'
}));

const TeacherViewQuizResultScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <View style={styles.menuHandle} />
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

      {/* Blue Header Section */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.blueHeader}>
         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
         </TouchableOpacity>
         <Text style={styles.blueTitle}>Exam Result Analaysis</Text>
         <Text style={styles.blueSubtitle}>English • Grammar Test - Tenses • Completed on Oct 20, 2023</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         
         {/* Stats Cards Row */}
         <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.statsRow}>
            
            {/* Participants Card */}
            <View style={styles.statCard}>
               <View style={[styles.statIconBox, { backgroundColor: '#4F46E5' }]}>
                  <Ionicons name="person" size={20} color="#FFFFFF" />
               </View>
               <View style={styles.statTextCol}>
                  <Text style={styles.statLabel}>Participants</Text>
                  <Text style={styles.statValue}>30/30</Text>
               </View>
            </View>

            {/* Duration Card */}
            <View style={styles.statCard}>
               <View style={[styles.statIconBox, { backgroundColor: '#E06A6A' }]}>
                  <Ionicons name="time" size={20} color="#FFFFFF" />
               </View>
               <View style={styles.statTextCol}>
                  <Text style={styles.statLabel}>Exam Duration</Text>
                  <Text style={styles.statValue}>60 min</Text>
               </View>
            </View>

            {/* Questions Card */}
            <View style={styles.statCard}>
               <View style={[styles.statIconBox, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="help-circle" size={20} color="#FFFFFF" />
               </View>
               <View style={styles.statTextCol}>
                  <Text style={styles.statLabel}>Questions</Text>
                  <Text style={styles.statValue}>30</Text>
               </View>
            </View>

         </Animated.View>

         <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.contentWrapper}>
            <Text style={styles.sectionTitle}>Students Performance</Text>

            {/* Table Container */}
            <View style={styles.tableContainer}>
               
               {/* Table Header */}
               <View style={styles.tableHeader}>
                  <Text style={[styles.thText, { flex: 2 }]}>Student</Text>
                  <Text style={[styles.thText, { flex: 2.2 }]}>Score</Text>
                  <Text style={[styles.thText, { flex: 1.2, textAlign: 'center' }]}>Grade</Text>
                  <Text style={[styles.thText, { flex: 1.8, textAlign: 'center' }]}>Time Taken</Text>
                  <Text style={[styles.thText, { flex: 2, textAlign: 'right' }]}>Status</Text>
               </View>

               {/* Table Rows */}
               {MOCK_STUDENTS.map((student, index) => (
                  <View key={student.id} style={[styles.tableRow, index === MOCK_STUDENTS.length - 1 && styles.lastTableRow]}>
                     <Text style={[styles.tdTextStudent, { flex: 2 }]} numberOfLines={1}>{student.name}</Text>
                     <Text style={[styles.tdTextBase, { flex: 2.2 }]} numberOfLines={1}>{student.score}</Text>
                     <Text style={[styles.tdTextBase, { flex: 1.2, textAlign: 'center' }]}>{student.grade}</Text>
                     <Text style={[styles.tdTextBase, { flex: 1.8, textAlign: 'center' }]}>{student.time}</Text>
                     <View style={[styles.tdStatusWrapper, { flex: 2, alignItems: 'flex-end' }]}>
                        <View style={styles.statusPill}>
                           <Text style={styles.statusPillText}>{student.status}</Text>
                        </View>
                     </View>
                  </View>
               ))}

            </View>
         </Animated.View>

      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
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
    zIndex: 10
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10, width: 28 },
  headerTitle: { fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5', 
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
    marginTop: 4,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  blueHeader: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  blueTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  blueSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#E0E7FF',
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statTextCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '800',
  },

  contentWrapper: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 20,
  },
  
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  thText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastTableRow: {
    borderBottomWidth: 0,
  },
  tdTextStudent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  tdTextBase: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  tdStatusWrapper: {
    justifyContent: 'center',
  },
  statusPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },

});

export default TeacherViewQuizResultScreen;
