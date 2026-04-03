import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { NavigationDrawer } from '../../components/NavigationDrawer';

type QuizzesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Quizzes'>;

interface Props {
  navigation: QuizzesNavigationProp;
}

const SummaryCard = ({ delay, number, label, borderColor }: { delay: number, number: string, label: string, borderColor: string }) => {
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={[styles.summaryCard, { borderTopColor: borderColor }]}>
      <Text style={styles.summaryNumber}>{number}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </Animated.View>
  );
}

const QuizCard = ({ 
  delay, headerTitle, headerBadge, badgeColor, badgeBg, 
  cardBadge, cardBadgeColor, cardBadgeBg, 
  actionBtnText, actionBtnColor, actionBtnBg, actionBtnBorder, actionBtnIcon, onAction 
}: any) => {
  return (
     <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.sectionContainer}>
        <View style={styles.sectionHeaderLine}>
           <Text style={styles.sectionTitle}>{headerTitle}</Text>
           {headerBadge && (
              <View style={[styles.smallBadge, { backgroundColor: badgeBg }]}>
                 <Text style={[styles.smallBadgeText, { color: badgeColor }]}>{headerBadge}</Text>
              </View>
           )}
        </View>

        <View style={styles.quizCard}>
           <View style={styles.quizCardTopRow}>
              <Text style={styles.quizTitle}>Data Structure - Weekly Quiz</Text>
              {cardBadge && (
                 <View style={[styles.cardPill, { backgroundColor: cardBadgeBg, marginLeft: 8 }]}>
                    <Text style={[styles.cardPillText, { color: cardBadgeColor }]}>{cardBadge}</Text>
                 </View>
              )}
           </View>
           <Text style={styles.quizSubtitle}>Comprehensive exam covering Arrays, Linked Lists, Stacks, and Queues</Text>

           <View style={styles.quizGrid}>
              <View style={styles.quizGridCol}>
                 <MaterialCommunityIcons name="book" size={14} color="#4F46E5" />
                 <Text style={styles.quizGridText}>Data Structures</Text>
              </View>
              <View style={styles.quizGridCol}>
                 <Ionicons name="help-circle" size={14} color="#4F46E5" />
                 <Text style={styles.quizGridText}>50 Questions</Text>
              </View>
              <View style={styles.quizGridCol}>
                 <Ionicons name="star" size={14} color="#4F46E5" />
                 <Text style={styles.quizGridText}>100 Points</Text>
              </View>
              <View style={styles.quizGridCol}>
                 <Ionicons name="time" size={14} color="#4F46E5" />
                 <Text style={styles.quizGridText}>120 Minutes</Text>
              </View>
           </View>

           <View style={styles.cardBottomRow}>
              <View style={styles.instructorProfile}>
                 <FontAwesome5 name="chalkboard-teacher" size={16} color="#3B82F6" style={{marginRight: 8}} />
                 <Text style={styles.instructorName}>Dr. Sarah Johnsen</Text>
              </View>

              <ScaleButton 
                 style={[
                   styles.actionBtn, 
                   { backgroundColor: actionBtnBg },
                   actionBtnBorder ? { borderWidth: 1, borderColor: actionBtnBorder } : null
                 ]} 
                 activeOpacity={0.8} 
                 scaleTo={0.95} 
                 onPress={onAction}
              >
                 {actionBtnIcon && <Ionicons name={actionBtnIcon} size={14} color={actionBtnColor} style={styles.btnIconLayout} />}
                 <Text style={[styles.actionBtnText, { color: actionBtnColor }]}>{actionBtnText}</Text>
              </ScaleButton>
           </View>
        </View>
     </Animated.View>
  );
}

const QuizzesScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" />

      {/* Top Header strictly matched with Assignments/Dashboard */}
      <View style={styles.header}>
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
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Quizzes</Text>
          <Text style={styles.pageSubtitle}>Take quiz and view test results</Text>
        </View>

        {/* Top Summaries Grid 2x2 universally matching Assignments geometry */}
        <View style={styles.summaryGrid}>
          <SummaryCard delay={100} number="4" label="Upcoming Quizzes" borderColor="#3B82F6" />
          <SummaryCard delay={150} number="4" label="Active Now" borderColor="#10B981" />
          <SummaryCard delay={200} number="4" label="Completed" borderColor="#F59E0B" />
          <SummaryCard delay={250} number="4" label="Grades" borderColor="#8B5CF6" />
        </View>

        <View style={styles.listsWrapper}>
           {/* Section 1: Active Quiz */}
           <QuizCard 
             delay={300}
             headerTitle="Active Quiz"
             headerBadge="1 Active"
             badgeColor="#10B981"
             badgeBg="#ECFDF5"
             
             actionBtnText="Start Quiz"
             actionBtnColor="#FFFFFF"
             actionBtnBg="#4F46E5" 
             actionBtnIcon="play-circle"
             onAction={() => navigation.navigate('StartQuiz')} 
           />

           {/* Section 2: Upcoming Quizzes */}
           <QuizCard 
             delay={400}
             headerTitle="Upcoming Quizzes"
             headerBadge="3 Upcoming"
             badgeColor="#EF4444"
             badgeBg="#FEF2F2"
             
             cardBadge="Starts May 15"
             cardBadgeColor="#EF4444"
             cardBadgeBg="#FEF2F2"

             actionBtnText="View Details"
             actionBtnColor="#3B82F6" 
             actionBtnBg="#FFFFFF"
             actionBtnBorder="#E5E7EB"
             actionBtnIcon="eye"      
             onAction={() => navigation.navigate('ViewQuizDetail')}
           />

           {/* Section 3: Recently Completed */}
           <QuizCard 
             delay={500}
             headerTitle="Recently Completed"
             headerBadge="4 Completed"
             badgeColor="#3B82F6"
             badgeBg="#EFF6FF"
             
             cardBadge="Completed"
             cardBadgeColor="#3B82F6"
             cardBadgeBg="#EFF6FF"

             actionBtnText="View Analytics"
             actionBtnColor="#FFFFFF"
             actionBtnBg="#10B981" 
             actionBtnIcon="bar-chart-outline" 
             onAction={() => navigation.navigate('QuizDetails')}
           />
        </View>

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
  mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
  scrollContent: { paddingBottom: 40 },
  
  // -- EXACTLY AS ASSIGNMENTS --
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 16,
    backgroundColor: '#FFFFFF', // Using pure white for better contrast with shadow
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

  pageTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28, // Matches Assignments
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 32,
    rowGap: 16,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // Exactly as Assignments
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000', // Exactly as Assignments
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderTopWidth: 2, 
  },
  summaryNumber: {
    fontSize: 20, // Exactly as Assignments
    fontWeight: '800',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500', // Exactly as Assignments
  },

  listsWrapper: {
    paddingHorizontal: 20,
    gap: 24, // Consistent list spacing
  },
  
  sectionContainer: {
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18, // Exactly as Assignments
    fontWeight: '700',
    color: '#111827',
  },
  smallBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20, // Pil shaped like Assignments status
  },
  smallBadgeText: {
    fontSize: 11,
    fontWeight: '500', // Match assignment weight
  },

  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Match assignment
    padding: 18, // Match assignment exactly
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5', // Stronger blue exactly as assignments
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB', // Lighter border matching assignments
  },
  quizCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Matching assignments pill alignment
    marginBottom: 4,
  },
  quizTitle: {
    fontSize: 17, // Same as assignments
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  cardPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20, // Pil shaped 
  },
  cardPillText: {
    fontSize: 11,
    fontWeight: '500', 
  },
  quizSubtitle: {
    fontSize: 13, // Same as assignments
    color: '#6B7280',
    marginBottom: 20, // Pushed away from buttons same as assignments
    fontWeight: '400',
  },

  quizGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
    marginBottom: 20, // Equal spacing before buttons
  },
  quizGridCol: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizGridText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400', 
    marginLeft: 6,
  },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end', // Same as assignments cardBottomRow
  },
  instructorProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  instructorName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14, // Matches assignments btnSubmit
    paddingVertical: 6,
    borderRadius: 6, // Matches assignments
  },
  actionBtnText: {
    fontSize: 13, // Matches assignments
    fontWeight: '600',
  },
  btnIconLayout: {
    marginRight: 4, // Matches assignments
  },
});

export default QuizzesScreen;
