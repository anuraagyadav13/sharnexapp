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

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherMonitorLive'>;

const MOCK_PARTICIPANTS = Array.from({ length: 4 }).map((_, i) => ({
  id: i.toString(),
  name: 'Alex Johnson',
  initials: 'AJ',
  rollNo: '101',
  progress: '100 %',
  stats: [
    { label: 'Score', value: '40/40' },
    { label: 'Score', value: '40/40' },
    { label: 'Score', value: '40/40' },
  ]
}));

const TeacherMonitorLiveScreen: React.FC<Props> = ({ navigation }) => {
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
         <Text style={styles.blueTitle}>Live Exam Monitoring</Text>
         <Text style={styles.blueSubtitle}>English • Grammar Test - Tenses • Completed on Oct 20, 2023</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         
         <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.contentWrapper}>
            <Text style={styles.sectionTitle}>Active Participants</Text>

            {/* List */}
            {MOCK_PARTICIPANTS.map((participant, index) => (
               <View key={participant.id} style={styles.participantCard}>
                  
                  {/* Header */}
                  <View style={styles.cardHeader}>
                     <View style={styles.participantAvatar}>
                        <Text style={styles.participantAvatarText}>{participant.initials}</Text>
                     </View>
                     <View style={styles.nameInfo}>
                        <Text style={styles.name}>{participant.name}</Text>
                        <Text style={styles.rollNo}>Roll No: {participant.rollNo}</Text>
                     </View>
                     <View style={styles.progressPill}>
                        <Text style={styles.progressPillText}>{participant.progress}</Text>
                     </View>
                  </View>

                  {/* Stats Grid */}
                  <View style={styles.statsGrid}>
                     {participant.stats.map((stat, sIndex) => (
                        <View key={sIndex} style={styles.statBox}>
                           <Text style={styles.statLabel}>{stat.label}</Text>
                           <Text style={styles.statValue}>{stat.value}</Text>
                        </View>
                     ))}
                  </View>

               </View>
            ))}

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

  participantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  nameInfo: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  rollNo: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  progressPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    width: '48%', 
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '800',
  },

});

export default TeacherMonitorLiveScreen;
