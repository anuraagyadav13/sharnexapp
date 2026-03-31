import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Circle } from 'react-native-svg';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentDashboard'>;

interface Props {
  navigation: DashboardNavigationProp;
}

// --- Icons & Badges Helpers ---
const IconBox = ({ name, color = '#fff', bgColor, size = 50, iconSize = 24, iconLibrary = 'Ionicons' }: { name: string, color?: string, bgColor: string, size?: number, iconSize?: number, iconLibrary?: string }) => {
  const IconComponent = iconLibrary === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.iconBox, { width: size, height: size, backgroundColor: bgColor }]}>
      <IconComponent name={name} size={iconSize} color={color} />
    </View>
  );
};

// --- Subcomponents ---

const QuickActionCard = React.memo(({ title, iconName, bgColor, delay, iconLibrary = 'Ionicons' }: { title: string, iconName: string, bgColor: string, delay: number, iconLibrary?: string }) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.quickActionCard}>
    <TouchableOpacity style={styles.quickActionTouchable} activeOpacity={0.7}>
      <IconBox name={iconName} bgColor={bgColor} iconLibrary={iconLibrary} />
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  </Animated.View>
));

const ScheduleCard = React.memo(({ time, title, teacher, room, color, status, isOngoing, bgStyleColor, borderStyleColor, _progress }: any) => {
  const isSpecialBg = !!bgStyleColor;
  return (
    <View style={[
      styles.scheduleCard,
      isSpecialBg ? {
        backgroundColor: bgStyleColor,
        borderColor: borderStyleColor,
        shadowColor: borderStyleColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6
      } : { borderColor: `${color}40` }
    ]}>
      {/* Left Column (Time) */}
      <View style={styles.scheduleLeftCol}>
        <View style={[styles.scheduleCardIndicator, { backgroundColor: color }]} />
        <View style={styles.scheduleTimeWrapper}>
          <Text style={styles.scheduleTime} numberOfLines={1} adjustsFontSizeToFit>{time}</Text>
        </View>
      </View>

      {/* Right Column (Details) */}
      <View style={styles.scheduleRightCol}>
        <View style={styles.schedulePillRow}>
          <View style={[styles.schedulePill, { backgroundColor: color }]}>
            <Text style={styles.schedulePillText}>{title}</Text>
          </View>
          {isOngoing && (
            <View style={styles.ongoingContainer}>
              <View style={[styles.ongoingDot, { backgroundColor: color }]} />
              <Text style={[styles.ongoingText, { color: color }]}>Ongoing</Text>
            </View>
          )}
          {status === 'Completed' && (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark" size={14} color="#4B5563" />
              <Text style={styles.scheduleStatus}>Completed</Text>
            </View>
          )}
          {status === 'Up next' && (
            <View style={styles.statusContainer}>
              <Ionicons name="ellipse-outline" size={12} color="#4F46E5" />
              <Text style={styles.scheduleUpNext}>Up next</Text>
            </View>
          )}
        </View>

        <Text style={styles.scheduleTeacher}>{teacher}</Text>

        <View style={styles.scheduleBottomRow}>
          <Text style={styles.scheduleRoom}>{room}</Text>
          {isOngoing && (
            <TouchableOpacity style={[styles.joinClassBtn, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
              <Text style={[styles.joinClassBtnText, { color }]}>Join Class →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const EventCard = React.memo(({ title, date, color }: any) => (
  <View style={[styles.eventCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <View style={styles.eventCardContent}>
      <Text style={styles.eventTitle}>{title}</Text>
      <View style={styles.eventDateContainer}>
        <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
        <Text style={styles.eventDateText}>{date}</Text>
      </View>
    </View>
  </View>
));

const TopStudentCard = React.memo(({ rank, name, className, percentage }: any) => (
  <View style={styles.topStudentCard}>
    <View style={styles.rankCircle}>
      <Text style={styles.rankText}>{rank}</Text>
    </View>
    <View style={styles.topStudentInfo}>
      <Text style={styles.topStudentName}>{name}</Text>
      <Text style={styles.topStudentClass}>{className}</Text>
    </View>
    <Text style={styles.topStudentPercentage}>{percentage}</Text>
  </View>
));

  const HelpCenterCard = ({ bgColor, iconName, title, desc }: { bgColor: string, iconName: string, title: string, desc: string }) => (
    <View style={styles.helpCenterCard}>
      <View style={[styles.helpIconContainer, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.helpCardTitle}>{title}</Text>
      <Text style={styles.helpCardDesc}>{desc}</Text>
      <TouchableOpacity style={styles.viewGuidesRow} activeOpacity={0.7}>
        <Text style={styles.helpCardLink}>View Guides</Text>
        <Ionicons name="arrow-forward" size={14} color="#3B82F6" />
      </TouchableOpacity>
    </View>
  );

const FAQItem = React.memo(({ question }: { question: string }) => (
  <TouchableOpacity style={styles.faqCard} activeOpacity={0.7}>
    <Text style={styles.faqQuestion}>{question}</Text>
    <Ionicons name="add" size={20} color="#111827" style={{ fontWeight: 'bold' }} />
  </TouchableOpacity>
));


// --- Main Screen ---
const StudentDashboard: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
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
            <TouchableOpacity style={styles.iconBtn}>
               <Ionicons name="notifications-outline" size={22} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity 
               style={styles.iconBtn}
               onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}
            >
               <Ionicons name="settings-outline" size={22} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
               <Ionicons name="moon-outline" size={22} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity 
               activeOpacity={0.8}
               onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
            >
              <View style={[styles.avatar, {marginLeft: 10}]}>
                <Text style={styles.avatarText}>A</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Premium Hero Banner (Row Layout to match PNG) */}
        <Animated.View entering={FadeInUp.delay(50).springify()} style={styles.heroBannerRow}>
          <View style={styles.heroTextSide}>
            <Text style={styles.heroRowTitle1}>
              Transform <Text style={styles.heroRowTitle2}>School</Text>
            </Text>
            <Text style={styles.heroRowTitle2}>Management with</Text>
            <Text style={styles.heroRowTitle3}>Sharnex</Text>
            <Text style={styles.heroRowSubtitle}>
              An all-in-one platform to streamline attendance, assignments, communication, and analytics for modern educational institutions.
            </Text>
          </View>
          <View style={styles.heroImageSide}>
            <Image
              source={require('../../assets/laptop.png')}
              style={styles.heroRowImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={20} color="#3B82F6" style={styles.sectionIconMargin} />
            <Text style={[styles.sectionTitle, { color: '#3B82F6', fontSize: 18, fontWeight: '700' }]}>Quick Actions</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard delay={100} title="Ask AI" iconName="information-circle" bgColor="#8B5CF6" />
            <QuickActionCard delay={150} title="Submit Work" iconName="document-text" bgColor="#EC4899" />
            <QuickActionCard delay={200} title="Join Class" iconName="school" bgColor="#10B981" />
            <QuickActionCard delay={250} title="Download Report" iconName="file-document" bgColor="#F97316" iconLibrary="MaterialCommunityIcons" />
            <QuickActionCard delay={300} title="View Marks" iconName="stats-chart" bgColor="#D946EF" />
            <QuickActionCard delay={350} title="View Attendance" iconName="checkmark-circle" bgColor="#0EA5E9" />
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#4F46E5" style={styles.sectionIconMargin} />
            <Text style={[styles.sectionTitle, { color: '#4F46E5' }]}>Today’s Schedule</Text>
          </View>
          <View style={styles.scheduleList}>
            <ScheduleCard
              time="08:00 - 09:00" title="Mathematics" teacher="Mrs. Anita Rao" room="Room 101"
              color="#3B82F6" status="Completed" />
            <ScheduleCard
              time="09:15 - 10:15" title="Science" teacher="Mr. John Smith" room="Lab 2"
              color="#059669" isOngoing={true} bgStyleColor="#F0FDF4" borderStyleColor="#86EFAC" progress={65} />
            <ScheduleCard
              time="10:30 - 11:30" title="English" teacher="Ms. Sarah Johnson" room="Room 205"
              color="#D946EF" status="Up next" />
            <ScheduleCard
              time="11:45 - 12:45" title="History" teacher="Mr. David Lee" room="Room 103"
              color="#F97316" status="Up next" />
          </View>
        </View>



        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#4F46E5" style={styles.sectionIconMargin} />
            <Text style={[styles.sectionTitle, { color: '#4F46E5' }]}>Upcoming Events</Text>
          </View>
          <View style={styles.eventList}>
            <EventCard title="Annual Science Fair" date="October 15th" color="#F97316" />
            <EventCard title="Annual Science Fair" date="October 15th" color="#10B981" />
            <EventCard title="Annual Science Fair" date="October 15th" color="#4F46E5" />
          </View>
        </View>

        {/* Top 5 Students */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderSpaceBetween}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="trophy" size={20} color="#4F46E5" style={styles.sectionIconMargin} />
              <Text style={[styles.sectionTitle, { color: '#4F46E5' }]}>Top 5 Students</Text>
            </View>
            <View style={styles.awardBadge}>
              <Text style={styles.awardBadgeText}>2024 Awards</Text>
            </View>
          </View>
          <View style={styles.topStudentList}>
            <TopStudentCard rank="1" name="Aman Sharma" className="Class 12" percentage="99.9%" />
            <TopStudentCard rank="2" name="Aman Sharma" className="Class 12" percentage="99.9%" />
            <TopStudentCard rank="3" name="Aman Sharma" className="Class 12" percentage="99.9%" />
            <TopStudentCard rank="4" name="Aman Sharma" className="Class 12" percentage="99.9%" />
            <TopStudentCard rank="5" name="Aman Sharma" className="Class 12" percentage="99.9%" />
          </View>
        </View>

        {/* Help Center */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={20} color="#4F46E5" style={styles.sectionIconMargin} />
            <Text style={styles.sectionTitle}>Student Help Center</Text>
          </View>
          <View style={styles.helpCenterGrid}>
            <HelpCenterCard bgColor="#4F46E5" iconName="help" title="Assignments & Homework" desc="How to submit assignments, check deadlines, and track your progress." />
            <HelpCenterCard bgColor="#10B981" iconName="bar-chart" title="Grades & Report Cards" desc="Understanding your grades, GPA calculation, and academic progress." />
            <HelpCenterCard bgColor="#EF4444" iconName="tv-outline" title="Technical Support" desc="Troubleshooting login issues, app problems, and technical questions." />
            <HelpCenterCard bgColor="#A855F7" iconName="book" title="Study Resources" desc="Accessing and downloading study materials, notes, and resources." />
            <HelpCenterCard bgColor="#0EA5E9" iconName="chatbubble-ellipses" title="Communication" desc="How to message teachers, ask questions, and get academic help." />
            <HelpCenterCard bgColor="#F97316" iconName="calendar" title="Attendance Tracking" desc="How to check your attendance record and report absences." />
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleNoMargin}>Frequently Asked Questions</Text>
          <View style={styles.eventList}>
            <FAQItem question="How do I submit an assignment online?" />
            <FAQItem question="How do I submit an assignment online?" />
            <FAQItem question="How do I submit an assignment online?" />
            <FAQItem question="How do I submit an assignment online?" />
            <FAQItem question="How do I submit an assignment online?" />
          </View>
        </View>

        {/* Motivational Quote Removed */}

        {/* Need More Help */}
        <View style={styles.needHelpBanner}>
          <View style={StyleSheet.absoluteFill}>
            <Svg height="100%" width="100%">
              <Defs>
                <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0" stopColor="#6366F1" stopOpacity="1" />
                  <Stop offset="1" stopColor="#4F46E5" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#grad)" rx="24" ry="24" />
            </Svg>
          </View>
          <Text style={styles.needHelpTitle}>Need More Help?</Text>
          <Text style={styles.needHelpDesc}>We're here to help you succeed! Contact us for any academic or technical questions.</Text>
          <View style={styles.needHelpButtonsRow}>
            <TouchableOpacity style={styles.helpButtonOutlined}>
              <Text style={styles.helpButtonText}>Technical Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpButtonOutlined}>
              <Text style={styles.helpButtonText}>Ask a Teacher</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Floating Animated Navigation Drawer over the entire screen level */}
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
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  iconBox: { borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  progressCircle: {},
  progressCircleText: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  progressCircleTextValue: { fontSize: 12, fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 24,
    backgroundColor: '#FAFAFF'
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
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

  heroBannerRow: {
    backgroundColor: '#D9DAF9', // matches the new laptop.png background
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingLeft: 16,
    paddingRight: 0,
    overflow: 'hidden',
    minHeight: 180, // prevent collapse and add breathing room
  },
  heroTextSide: {
    width: '58%',
    paddingRight: 8,
    alignItems: 'center',
  },
  heroRowTitle1: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563EB',
    textAlign: 'center',
  },
  heroRowTitle2: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D946EF',
    textAlign: 'center',
  },
  heroRowTitle3: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7C3AED',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroRowSubtitle: {
    fontSize: 10,
    color: '#4B5563',
    lineHeight: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  heroImageSide: {
    width: '42%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  heroRowImage: {
    width: '100%',
    height: 140,
  },

  section: { paddingHorizontal: 20, marginTop: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionHeaderSpaceBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  sectionIconMargin: { marginRight: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#4F46E5', letterSpacing: -0.5 },
  sectionTitleNoMargin: { fontSize: 20, fontWeight: '800', color: '#4F46E5', letterSpacing: -0.5, marginLeft: 0, marginBottom: 16 },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  quickActionCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F8FAFC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4
  },
  quickActionTouchable: { alignItems: 'center' },
  quickActionTitle: { fontSize: 11, fontWeight: '600', color: '#374151', marginTop: 10, textAlign: 'center' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  statCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0', width: '30%' },
  statTitle: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 10, textAlign: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginTop: 4 },

  scheduleList: { gap: 12 },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F8FAFC',
    paddingRight: 10,
    height: 80,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4
  },
  scheduleLeftCol: { flexDirection: 'row', alignItems: 'stretch', width: 145 },
  scheduleCardIndicator: { width: 4, borderRadius: 2, marginVertical: 4, marginLeft: 16, marginRight: 16 },
  scheduleTimeWrapper: { flex: 1, justifyContent: 'center' },
  scheduleTime: { fontSize: 11, fontWeight: '500', color: '#6B7280' },

  scheduleRightCol: { flex: 1, justifyContent: 'center' },
  schedulePillRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  schedulePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  schedulePillText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scheduleStatus: { fontSize: 11, color: '#4B5563', fontWeight: '500' },
  scheduleUpNext: { fontSize: 11, color: '#4F46E5', fontWeight: '500' },
  ongoingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ongoingDot: { width: 6, height: 6, borderRadius: 3 },
  ongoingText: { fontSize: 11, fontWeight: '700' },

  scheduleTeacher: { fontSize: 13, fontWeight: '400', color: '#4B5563', marginBottom: 4 },
  scheduleBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scheduleRoom: { fontSize: 10, color: '#9CA3AF' },
  joinClassBtn: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  joinClassBtnText: { fontSize: 10, fontWeight: '600' },

  eventList: { gap: 12 },
  eventCard: { backgroundColor: '#FFFFFF', borderRadius: 14, flexDirection: 'row', borderWidth: 1, borderColor: '#F8FAFC', shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  eventCardContent: { flex: 1, paddingVertical: 16, paddingLeft: 16, paddingRight: 16 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  eventDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventDateText: { fontSize: 13, color: '#9CA3AF' },

  awardBadge: { backgroundColor: '#F97316', paddingVertical: 6, borderRadius: 16, width: 96, alignItems: 'center', justifyContent: 'center' },
  awardBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  topStudentList: { gap: 8 },
  topStudentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F8FAFC', shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  rankCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { color: '#3B82F6', fontWeight: '700', fontSize: 11 },
  topStudentInfo: { flex: 1 },
  topStudentName: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  topStudentClass: { fontSize: 10, color: '#9CA3AF' },
  topStudentPercentage: { width: 64, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#22C55E' },

  helpCenterGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  helpCenterCard: { width: '48%', height: 204, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#F8FAFC', shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  helpIconContainer: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  helpCardTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 18 },
  helpCardDesc: { fontSize: 10, color: '#6B7280', lineHeight: 14 },
  viewGuidesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  helpCardLink: { fontSize: 11, fontWeight: '700', color: '#3B82F6' },

  faqCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 15, shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  faqQuestion: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 },

  quoteBanner: { display: 'none' },

  needHelpBanner: { paddingVertical: 24, paddingHorizontal: 20, marginHorizontal: 20, marginTop: 32, marginBottom: 40, alignItems: 'center', shadowColor: '#5A67D8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8, overflow: 'hidden', borderRadius: 20 },
  needHelpTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, zIndex: 2 },
  needHelpDesc: { fontSize: 12, color: '#E0E7FF', textAlign: 'center', lineHeight: 18, marginBottom: 20, paddingHorizontal: 10, zIndex: 2 },
  needHelpButtonsRow: { flexDirection: 'row', gap: 12, width: '100%', zIndex: 2 },
  helpButtonOutlined: { flex: 1, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  helpButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' }
});

export default StudentDashboard;
