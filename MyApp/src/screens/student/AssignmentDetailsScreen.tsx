import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../store/AuthContext';

type AssignmentDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AssignmentDetails'>;

interface Props {
  navigation: AssignmentDetailsNavigationProp;
}

const BulletPoint = ({ text }: { text: string }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const AttachmentItem = ({ title, meta }: { title: string, meta: string }) => (
  <ScaleButton style={styles.attachmentItem} activeOpacity={0.8} scaleTo={0.98}>
    <View style={styles.pdfIconContainer}>
      <MaterialCommunityIcons name="file-pdf-box" size={28} color="#FFFFFF" />
      {/* The reference shows a blue icon with 'PDF' inside. 
          We use file-pdf-box from MaterialCommunityIcons as a close match, 
          placed inside a rounded-rect blue box. */}
    </View>
    <View style={styles.attachmentTextCol}>
      <Text style={styles.attachmentTitle}>{title}</Text>
      <Text style={styles.attachmentMeta}>{meta}</Text>
    </View>
  </ScaleButton>
);

const AssignmentDetailsScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <Text style={styles.globalHeaderTitle} numberOfLines={1}>Welcome back, {authState.user?.name?.split(' ')[0] || 'Student'}</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'S'}</Text>
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

          <Text style={styles.heroTitle}>Assignment Details</Text>
          <Text style={styles.heroSubtitle}>View assignment information</Text>
        </View>

        <View style={styles.cardsContainer}>

          {/* Card 1: Assignment Information */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="information" size={16} color="#4F46E5" />
              </View>
              <Text style={styles.cardHeaderTitle}>Assignment Information</Text>
            </View>
            <View style={styles.separator} />

            <View style={styles.cardBody}>
              <Text style={styles.assignmentTitle}>Binary Search</Text>
              <Text style={styles.assignmentMeta}>Subject: Data Structure | Teacher: Dr. Jake Sully</Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Assigned Date</Text>
                  <Text style={styles.infoValue}>May 5, 2023</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Due Date</Text>
                  <Text style={styles.infoValue}>May 20, 2023 (11:59 PM)</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Grade/Marks</Text>
                  <Text style={styles.infoValue}>50</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={styles.infoValue}>Pending</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Card 2: Instruction & Description */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="document-text" size={14} color="#4F46E5" />
              </View>
              <Text style={styles.cardHeaderTitle}>Instruction & Description</Text>
            </View>
            <View style={styles.separator} />

            <View style={styles.cardBody}>
              <Text style={styles.sectionSubtitle}>Instructions</Text>
              <BulletPoint text="Choose your answer from the provided options in the multiple-choice questions." />
              <BulletPoint text="Choose your answer from the provided options in the multiple-choice questions." />
              <BulletPoint text="Choose your answer from the provided option in the multiple-choice questions." />
              <BulletPoint text="Choose your answer from the provided options in the multiple-choice question." />

              <View style={{ height: 16 }} />

              <Text style={styles.sectionSubtitle}>Learning Objectives</Text>
              <BulletPoint text="Choose your answer from the provided options in the multiple-choice questions." />
              <BulletPoint text="Choose your answer from the provided options in the multiple-choice questions." />
              <BulletPoint text="Choose your answer from the provided option in the multiple-choice questions." />
              <BulletPoint text="Choose your answer from the provided options in the multiple-choice question." />
            </View>
          </Animated.View>

          {/* Card 3: Attachments */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="attach" size={16} color="#4F46E5" style={{ transform: [{ rotate: '45deg' }] }} />
              </View>
              <Text style={styles.cardHeaderTitle}>Attachments</Text>
            </View>
            {/* No explicit separator in screenshot for attachments, but looks cleaner with one. I'll omit to be exact. */}
            <View style={{ height: 12 }} />

            <View style={styles.attachmentsContainer}>
              <AttachmentItem title="Assignments Problems.pdf" meta="PDF • 2.4 MB" />
              <AttachmentItem title="Assignments Problems.pdf" meta="PDF • 2.4 MB" />
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
    paddingTop: 60, // Adjust for iOS statusbar
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  globalHeaderTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginRight: 'auto', // Pushes icons to the right
    marginLeft: 32, // To balance and match the screenshot
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
    backgroundColor: '#4F46E5', // Distinct blue from screenshot
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Translucent circle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },

  cardsContainer: {
    paddingHorizontal: 16,
    paddingTop: 24, // Normal distinct space below the blue header
    gap: 16,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // richer, modern curve
    paddingVertical: 22,
    paddingHorizontal: 20,
    shadowColor: '#1E293B', // sophisticated deep shadow tint
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)', // very subtle, rich translucent border
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
    marginHorizontal: -20, // stretch to edges
  },

  cardBody: {},
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  assignmentMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  infoCol: {
    width: '50%',
  },
  infoLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },

  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletDot: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 6,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 11,
    color: '#6B7280',
    flex: 1,
    lineHeight: 16,
  },

  attachmentsContainer: {
    gap: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC', // exact subtle blueish-grey fill
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  pdfIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#4F46E5', // blue icon background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentTextCol: {
    flex: 1,
  },
  attachmentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  attachmentMeta: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});

export default AssignmentDetailsScreen;
