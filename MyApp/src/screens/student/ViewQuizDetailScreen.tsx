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
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../store/AuthContext';
import Animated, { FadeInUp } from 'react-native-reanimated';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';

type ViewQuizDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ViewQuizDetail'>;

interface Props {
  navigation: ViewQuizDetailNavigationProp;
}

const ViewQuizDetailScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <View style={{ width: 28 }} />
        <Text style={styles.headerTitle} numberOfLines={1}>Welcome back, {authState.user?.name?.split(' ')[0] || 'Student'}</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={20} color="#1F2937" />
          <Ionicons name="settings-outline" size={20} color="#1F2937" />
          <Ionicons name="moon-outline" size={20} color="#1F2937" />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'S'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>

        {/* Blue Hero Container */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.heroContainer}>
          <ScaleButton
            style={styles.backButton}
            activeOpacity={0.7}
            scaleTo={0.9}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </ScaleButton>

          <Text style={styles.heroTitle}>Data Structures - Weekly Quiz</Text>
          <Text style={styles.heroSubtitle}>Comprehensive exam covering Arrays, Linked Lists, Stacks, and Queues</Text>
        </Animated.View>

        <View style={styles.contentWrapper}>

          {/* Top Info Highlights Card */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.topHighlightsCard}>
            <View style={styles.highlightCol}>
              <View style={[styles.highlightIconBg, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="time" size={14} color="#4F46E5" />
              </View>
              <Text style={styles.highlightVal}>120 min</Text>
              <Text style={styles.highlightLbl}>Duration</Text>
            </View>

            <View style={styles.highlightCol}>
              <View style={[styles.highlightIconBg, { backgroundColor: '#FAD1E8' }]}>
                <Ionicons name="help-circle" size={14} color="#C026D3" />
              </View>
              <Text style={styles.highlightVal}>50</Text>
              <Text style={styles.highlightLbl}>Questions</Text>
            </View>

            <View style={styles.highlightCol}>
              <View style={[styles.highlightIconBg, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="star" size={14} color="#10B981" />
              </View>
              <Text style={styles.highlightVal}>200</Text>
              <Text style={styles.highlightLbl}>Points</Text>
            </View>
          </Animated.View>

          {/* Complete Information */}
          <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.infoCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="information-circle" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
              <Text style={styles.cardHeaderTitle}>Complete Information</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoRowLeft}>Course</Text>
              <Text style={styles.infoRowRight}>Data Structures</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLeft}>Teacher</Text>
              <Text style={styles.infoRowRight}>Dr. Sarah Johnson</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLeft}>Marks</Text>
              <Text style={styles.infoRowRight}>50</Text>
            </View>

            <View style={styles.warningPill}>
              <Ionicons name="information-circle" size={16} color="#F97316" style={{ marginRight: 6 }} />
              <Text style={styles.warningPillText}>Single Attempt Allowed</Text>
            </View>
          </Animated.View>

          {/* Important Instructions */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.infoCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="information-circle" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
              <Text style={styles.cardHeaderTitle}>Important Instructions</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.instructionItem}>
              <Ionicons name="lock-closed-outline" size={16} color="#3B82F6" style={styles.instIcon} />
              <Text style={styles.instText}><Text style={styles.instBold}>Start Time:</Text> May 25, 2023 • 10:00 AM</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="calendar-outline" size={16} color="#3B82F6" style={styles.instIcon} />
              <Text style={styles.instText}><Text style={styles.instBold}>End Time:</Text> May 25, 2023 • 10:00 AM</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="desktop-outline" size={16} color="#3B82F6" style={styles.instIcon} />
              <Text style={styles.instText}><Text style={styles.instBold}>Browser Requirements:</Text> May 25, 2023 • 10:00 AM</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="close-circle-outline" size={16} color="#3B82F6" style={styles.instIcon} />
              <Text style={styles.instText}><Text style={styles.instBold}>Restriction:</Text> May 25, 2023 • 10:00 AM</Text>
            </View>
          </Animated.View>

          {/* Topic Covered */}
          <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.infoCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="book-outline" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
              <Text style={styles.cardHeaderTitle}>Topic Covered</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.topicsGrid}>
              {[1, 2, 3, 4, 5, 6].map((it) => (
                <View key={it} style={styles.topicBox}>
                  <Text style={styles.topicBoxText}>Arrays &</Text>
                  <Text style={styles.topicBoxText}>Linked List</Text>
                </View>
              ))}
            </View>

          </Animated.View>

        </View>

      </ScrollView>
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
    paddingBottom: 12,
    backgroundColor: '#FAFAFF',
  },
  headerTitle: { fontSize: 14, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#A855F7', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  heroContainer: {
    backgroundColor: '#4E5EEE',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 11, color: '#E0E7FF', fontWeight: '500', lineHeight: 16 },

  contentWrapper: { paddingHorizontal: 16, marginTop: 16 },

  topHighlightsCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 10,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9',
    borderTopWidth: 4, borderTopColor: '#4F46E5',
  },
  highlightCol: { flex: 1, alignItems: 'center' },
  highlightIconBg: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  highlightVal: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 2 },
  highlightLbl: { fontSize: 10, color: '#6B7280', fontWeight: '500' },

  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9'
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  divider: { height: 1, backgroundColor: '#F3F4F6', width: '100%', marginBottom: 12 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoRowLeft: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  infoRowRight: { fontSize: 12, color: '#111827', fontWeight: '600' },

  warningPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED',
    alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 4
  },
  warningPillText: { color: '#F97316', fontSize: 10, fontWeight: '600' },

  instructionItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  instIcon: { marginRight: 8, marginTop: 2 },
  instText: { flex: 1, fontSize: 11, color: '#111827', lineHeight: 18 },
  instBold: { fontWeight: '700' },

  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  topicBox: {
    width: '31%', backgroundColor: '#EEF2FF', borderRadius: 8, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center'
  },
  topicBoxText: { fontSize: 10, color: '#111827', fontWeight: '500', textAlign: 'center' },

});

export default ViewQuizDetailScreen;
