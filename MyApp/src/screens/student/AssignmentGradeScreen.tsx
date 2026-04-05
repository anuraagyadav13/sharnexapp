import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';

type AssignmentGradeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AssignmentGrade'>;

interface Props {
  navigation: AssignmentGradeNavigationProp;
}

const AssignmentGradeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <Text style={styles.globalHeaderTitle} numberOfLines={1}>Welcome back, Anurag</Text>
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
        
        {/* Blue Hero Header */}
        <View style={styles.heroSection}>
          <ScaleButton 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            scaleTo={0.9}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </ScaleButton>
          
          <Text style={styles.heroTitle}>Assignment Grade</Text>
          <Text style={styles.heroSubtitle}>View your graded assignment results</Text>
        </View>

        <View style={styles.cardsContainer}>
          
          {/* Header Info Section inside body */}
          <Animated.View entering={FadeInUp.delay(50).springify()} style={styles.headerInfoSection}>
            <View style={styles.badgeContainer}>
              <View style={styles.gradedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#00C48C" />
                <Text style={styles.gradedBadgeText}>Completed & Graded</Text>
              </View>
            </View>
            
            <View style={styles.submittedDateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.submittedDateText}>Submitted on Sep 12, 2024</Text>
            </View>

            <Text style={styles.assignmentMainTitle}>Binary Search Tree Assignment</Text>
          </Animated.View>

          {/* Card 1: Assignment Grade */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={[styles.card, styles.gradeCard]}>
            <View style={styles.cardRibbonHeader}>
              <Ionicons name="ribbon-outline" size={18} color="#00C48C" />
              <Text style={styles.cardHeaderTitle}>Assignment Grade</Text>
            </View>

            <View style={styles.gradeCenterCol}>
              <Text style={styles.gradeLetter}>A+</Text>
              <Text style={styles.marksWrapper}>
                <Text style={styles.marksObtained}>90 </Text>
                <Text style={styles.marksTotal}>/ 100 Marks</Text>
              </Text>
            </View>
          </Animated.View>

          {/* Card 2: Instructor Feedback */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={[styles.card, styles.feedbackCard]}>
            <View style={styles.cardFeedbackHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3B82F6" />
              <Text style={styles.cardHeaderTitleFeed}>Instructor Feedback</Text>
            </View>

            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>
                "Outstanding work! Your BST implementation is both efficient and well-documented. The recursive and iterative approaches are correctly implemented, and your test coverage is comprehensive. The time complexity analysis shows deep understanding of the data structure. Keep up the excellent work!"
              </Text>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.instructorProfile}>
              <View style={styles.instructorAvatar}>
                <Text style={styles.instructorAvatarText}>SJ</Text>
              </View>
              <View style={styles.instructorMeta}>
                <Text style={styles.instructorName}>Dr. Sarah Johnson</Text>
                <Text style={styles.instructorRole}>Data Structures Teacher</Text>
              </View>
            </View>
          </Animated.View>

        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 16,
    backgroundColor: '#FFFFFF', 
  },
  globalHeaderTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginRight: 'auto', 
    marginLeft: 32, 
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  scrollContent: {
    paddingBottom: 40, 
  },

  heroSection: {
    backgroundColor: '#4361EE', // matches the vibrant screenshot blue
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  cardsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24, 
    paddingBottom: 40,
    gap: 20,
  },

  headerInfoSection: {
    marginBottom: 6, 
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  gradedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#34D399', 
    backgroundColor: '#ECFDF5', // subtle transparent green background
  },
  gradedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00C48C',
    marginLeft: 6,
  },
  submittedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  submittedDateText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 6,
  },
  assignmentMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, 
    paddingVertical: 24,
    paddingHorizontal: 20,
    // Peak detailing premium shadow as requested
    shadowColor: '#1E293B', 
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08, 
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)', 
  },
  
  // Card 1 Grade
  gradeCard: {
    borderTopWidth: 5,
    borderTopColor: '#00C48C', // rich standard bright teal/green
    alignItems: 'center', // Centers the content within this card
  },
  cardRibbonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
  },
  gradeCenterCol: {
    alignItems: 'center',
  },
  gradeLetter: {
    fontSize: 64,
    fontWeight: '800',
    color: '#00C48C',
    lineHeight: 74,
  },
  marksWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  marksObtained: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  marksTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  
  // Card 2 Feedback
  feedbackCard: {
    borderTopWidth: 5,
    borderTopColor: '#4361EE', // matches hero section blue
    paddingBottom: 24, 
  },
  cardFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderTitleFeed: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 10,
  },
  feedbackBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  feedbackText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.2, // Makes reading longer feedback text more premium
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
    marginHorizontal: -20, 
  },
  instructorProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1', // beautiful blue-violet
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  instructorAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instructorMeta: {
    justifyContent: 'center',
  },
  instructorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  instructorRole: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default AssignmentGradeScreen;
