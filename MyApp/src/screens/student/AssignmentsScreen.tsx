import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

type AssignmentsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Assignments'>;

interface Props {
  navigation: AssignmentsNavigationProp;
}

const SummaryCard = ({ number, label, bgColor, iconName, lineColor, delay, library = 'MaterialCommunityIcons' }: any) => {
  const IconComponent = library === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
  return (
    <Animated.View 
      entering={FadeInUp.delay(delay).springify()} 
      style={[styles.summaryCard, { borderTopColor: lineColor || bgColor }]}
    >
      <View style={[styles.summaryIconBox, { backgroundColor: bgColor }]}>
        <IconComponent name={iconName} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.summaryTextCol}>
        <Text style={styles.summaryNumber}>{number}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
};

const AssignmentCard = ({ category, status, title, subtitle, dueDate, deadlineRelative, isDelayed, delay, onPressView, onPressSubmit }: any) => {
  const isPending = status === 'Pending';
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.assignmentCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{category}</Text>
        </View>
        <View style={[styles.statusBadge, !isPending && styles.statusBadgeSubmitted]}>
          <Text style={[styles.statusBadgeText, !isPending && styles.statusBadgeTextSubmitted]}>{status}</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      
      <View style={styles.cardBottomRow}>
        <View style={styles.cardDateCol}>
          <Text style={styles.cardDueDate}>Due Date : {dueDate}</Text>
          <Text style={[styles.cardRelativeDate, isDelayed && { color: '#EF4444' }]}>
            {deadlineRelative}
          </Text>
        </View>

        <View style={styles.cardActionCol}>
           <ScaleButton style={styles.btnView} activeOpacity={0.7} scaleTo={0.95} onPress={onPressView}>
             <Ionicons name="eye" size={14} color="#3B82F6" style={styles.btnIconLayout} />
             <Text style={styles.btnViewText}>View</Text>
           </ScaleButton>
           
           {isPending ? (
             <ScaleButton style={[styles.btnSubmit, {backgroundColor: '#4F46E5'}]} activeOpacity={0.8} scaleTo={0.95} onPress={onPressSubmit}>
               <Ionicons name="send" size={13} color="#FFFFFF" style={styles.btnIconLayout} />
               <Text style={styles.btnSubmitText}>Submit</Text>
             </ScaleButton>
           ) : (
             <ScaleButton style={[styles.btnSubmit, {backgroundColor: '#10B981'}]} activeOpacity={0.8} scaleTo={0.95}>
               <Ionicons name="download-outline" size={14} color="#FFFFFF" style={styles.btnIconLayout} />
               <Text style={styles.btnSubmitText}>Download</Text>
             </ScaleButton>
           )}
        </View>
      </View>
    </Animated.View>
  );
};

const AssignmentsScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" />

      {/* Top Header matched directly with dashboard */}
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
          <Text style={styles.pageTitle}>Assignments</Text>
          <Text style={styles.pageSubtitle}>View and manage your course assignments</Text>
        </View>

        {/* Top Summaries Grid 2x2 */}
        <View style={styles.summaryGrid}>
          <SummaryCard delay={100} number="4" label="Pending" bgColor="#F97316" lineColor="#3B82F6" iconName="clock-outline" />
          <SummaryCard delay={150} number="4" label="Submitted" bgColor="#10B981" lineColor="#10B981" iconName="check-decagram" />
          <SummaryCard delay={200} number="4" label="Graded" bgColor="#8B5CF6" lineColor="#F59E0B" iconName="star" />
          <SummaryCard delay={250} number="4" label="Upcoming" bgColor="#3B82F6" lineColor="#8B5CF6" iconName="calendar-plus" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Assignments</Text>
        </View>

        {/* Assignment Cards List */}
        <View style={styles.listContainer}>
          <AssignmentCard 
            delay={300}
            category="Data Structures"
            status="Pending"
            title="Binary Search Tree"
            subtitle="Implement BST with all operations and testing"
            dueDate="May 20, 2023"
            deadlineRelative="Tomorrow"
            isDelayed={true}
            onPressView={() => navigation.navigate('AssignmentDetails', { assignmentId: '1' })}
            onPressSubmit={() => navigation.navigate('AssignmentSubmit', { assignmentId: '1' })}
          />
          <AssignmentCard 
            delay={350}
            category="Data Structures"
            status="Pending"
            title="Binary Search Tree"
            subtitle="Implement BST with all operations and testing"
            dueDate="May 20, 2023"
            deadlineRelative="Tomorrow"
            isDelayed={true}
            onPressView={() => navigation.navigate('AssignmentDetails', { assignmentId: '2' })}
            onPressSubmit={() => navigation.navigate('AssignmentSubmit', { assignmentId: '2' })}
          />
          <AssignmentCard 
            delay={400}
            category="Data Structures"
            status="Submitted"
            title="Binary Search Tree"
            subtitle="Implement BST with all operations and testing"
            dueDate="May 20, 2023"
            deadlineRelative="3 Days ago"
            isDelayed={false}
            onPressView={() => navigation.navigate('AssignmentDetails', { assignmentId: '3' })}
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
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60, // Adjust for iOS statusbar
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
    fontSize: 28,
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
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    // Exact border edges from screenshot:
    borderWidth: 1.5,
    borderColor: '#F3F4F6', // Subtle light gray for sides and bottom
    // borderTopColor dynamically bound
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTextCol: {
    justifyContent: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },

  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  listContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5', // Stronger blue from the reference image
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB', // lighter border around the rest
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20, // Fully pill-shaped as per reference
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500', // softer font weight
    color: '#3B82F6',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20, // Fully pill-shaped
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#F59E0B',
  },
  statusBadgeSubmitted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  statusBadgeTextSubmitted: {
    color: '#10B981',
  },
  
  cardTitle: {
    fontSize: 17, // slightly smaller, not super bold
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13, // slightly smaller matching reference
    color: '#6B7280',
    marginBottom: 20, // Space before the bottom row
    fontWeight: '400',
  },
  
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardDateCol: {
    flex: 1,
  },
  cardActionCol: {
    flexDirection: 'row',
    gap: 10,
  },
  
  cardDueDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '400', // lighter font
  },
  cardRelativeDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },

  btnView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // Compact padding
    paddingVertical: 6,
    borderRadius: 6, // Slightly softer radius
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  btnViewText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  btnIconLayout: {
    marginRight: 4,
  },
  btnSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnSubmitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AssignmentsScreen;
