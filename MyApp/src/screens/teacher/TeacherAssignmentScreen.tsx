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
import ScaleButton from '../../components/animations/ScaleButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationDrawer } from '../../components/NavigationDrawer';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherAssignment'>;

const MOCK_ASSIGNMENTS = [
  {
    id: 1,
    subject: 'Mathematics',
    title: 'Algebra Problem Set',
    dueDate: 'Due Today • 11 : 59 PM',
    class: 'Class 10-A',
    date: 'Oct 10, 2023',
    maxPoints: 'Max: 20 points',
    submitted: 8,
    total: 10,
    indicatorColor: '#EF4444',
  },
  {
    id: 2,
    subject: 'Mathematics',
    title: 'Algebra Problem Set',
    dueDate: 'Due Today • 11 : 59 PM',
    class: 'Class 10-A',
    date: 'Oct 10, 2023',
    maxPoints: 'Max: 20 points',
    submitted: 8,
    total: 10,
    indicatorColor: '#F97316',
  },
  {
    id: 3,
    subject: 'Mathematics',
    title: 'Algebra Problem Set',
    dueDate: 'Due Today • 11 : 59 PM',
    class: 'Class 10-A',
    date: 'Oct 10, 2023',
    maxPoints: 'Max: 20 points',
    submitted: 8,
    total: 10,
    indicatorColor: '#F97316',
  },
];

const TeacherAssignmentScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

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
        
        {/* Page Title & Add Button */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.pageTitleWrapper}>
           <View style={{flex: 1}}>
              <Text style={styles.pageTitle}>Assignments</Text>
              <Text style={styles.pageSubtitle}>Manage and grade students submission</Text>
           </View>
           <TouchableOpacity style={styles.newAssignmentBtn} activeOpacity={0.8} onPress={() => navigation.navigate('TeacherCreateAssignment')}>
              <Text style={styles.newAssignmentText}>+ New Assignment</Text>
           </TouchableOpacity>
        </Animated.View>

        {/* Assignment Cards List */}
        <View style={styles.listContainer}>
          {MOCK_ASSIGNMENTS.map((item, index) => {
            const progressPercent = (item.submitted / item.total) * 100;

            return (
              <Animated.View 
                 key={item.id} 
                 entering={FadeInUp.delay(100 + index * 100).springify()} 
                 style={[styles.assignmentCard, { borderLeftColor: item.indicatorColor }]}
              >
                 {/* Top Tags */}
                 <View style={styles.tagsContainer}>
                    <View style={styles.dueBadge}>
                       <Ionicons name="alarm-outline" size={13} color="#EF4444" style={{marginRight: 4}} />
                       <Text style={styles.dueBadgeText}>{item.dueDate}</Text>
                    </View>
                 </View>
                 <View style={styles.subjectBadge}>
                    <Text style={styles.subjectBadgeText}>{item.subject}</Text>
                 </View>

                 {/* Title */}
                 <Text style={styles.cardTitle}>{item.title}</Text>

                 {/* Info Row */}
                 <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                       <Ionicons name="people-outline" size={13} color="#9CA3AF" style={{marginRight: 4}}/>
                       <Text style={styles.infoText}>{item.class}</Text>
                    </View>
                    <View style={styles.infoItem}>
                       <Ionicons name="calendar-outline" size={13} color="#9CA3AF" style={{marginRight: 4}}/>
                       <Text style={styles.infoText}>{item.date}</Text>
                    </View>
                    <View style={styles.infoItem}>
                       <Ionicons name="school-outline" size={13} color="#9CA3AF" style={{marginRight: 4}}/>
                       <Text style={styles.infoText}>{item.maxPoints}</Text>
                    </View>
                 </View>

                 {/* Progress Section */}
                 <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                       <Text style={styles.progressLabel}>Submission Progress</Text>
                       <Text style={styles.progressValue}>{item.submitted}/{item.total} Submitted</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                       <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                 </View>

                 {/* Action Buttons Row */}
                 <View style={styles.cardActionsRow}>
                    <TouchableOpacity style={styles.actionBtnView} activeOpacity={0.8} onPress={() => navigation.navigate('TeacherViewSubmission')}>
                       <Ionicons name="eye-outline" size={15} color="#FFFFFF" style={{marginRight: 6}} />
                       <Text style={styles.actionBtnViewText}>View All Submission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnEdit} activeOpacity={0.8}>
                       <Ionicons name="create-outline" size={15} color="#1F2937" style={{marginRight: 4}} />
                       <Text style={styles.actionBtnEditText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnRemind} activeOpacity={0.8}>
                       <Ionicons name="notifications" size={15} color="#FFFFFF" style={{marginRight: 4}} />
                       <Text style={styles.actionBtnRemindText}>Remind</Text>
                    </TouchableOpacity>
                 </View>

              </Animated.View>
            );
          })}
        </View>

      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="teacher"
      />
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
  menuHandle: { paddingRight: 10, paddingVertical: 10 },
  headerTitle: { fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5', 
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
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

  pageTitleWrapper: { 
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: 16, 
     marginTop: 10,
     marginBottom: 20 
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#4F46E5', marginBottom: 4 },
  pageSubtitle: { fontSize: 11, color: '#828282', fontWeight: '500' },
  newAssignmentBtn: {
     backgroundColor: '#4F46E5',
     paddingVertical: 14,
     paddingHorizontal: 12,
     borderRadius: 8,
     shadowColor: '#1E293B',
     shadowOffset: { width: 0, height: 10 },
     shadowOpacity: 0.06,
     shadowRadius: 20,
     elevation: 6,
  },
  newAssignmentText: {
     color: '#FFFFFF',
     fontSize: 11,
     fontWeight: '700',
  },

  listContainer: {
     paddingHorizontal: 16,
  },
  assignmentCard: {
     backgroundColor: '#FFFFFF',
     borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
     borderLeftWidth: 4,
     padding: 24,
     marginBottom: 20,
     shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  tagsContainer: {
     flexDirection: 'row',
     marginBottom: 8,
  },
  dueBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#FEE2E2',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 6,
  },
  dueBadgeText: {
     color: '#EF4444',
     fontSize: 10,
     fontWeight: '600',
  },
  subjectBadge: {
     alignSelf: 'flex-start',
     backgroundColor: '#E0E7FF',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 10,
     marginBottom: 12,
  },
  subjectBadgeText: {
     color: '#4F46E5',
     fontSize: 10,
     fontWeight: '700',
  },
  cardTitle: {
     fontSize: 15,
     fontWeight: '800',
     color: '#111827',
     marginBottom: 6,
  },
  infoRow: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 20,
     gap: 12,
  },
  infoItem: {
     flexDirection: 'row',
     alignItems: 'center',
  },
  infoText: {
     fontSize: 10,
     color: '#9CA3AF',
     fontWeight: '500',
  },

  progressContainer: {
     marginBottom: 20,
  },
  progressHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 6,
  },
  progressLabel: {
     fontSize: 11,
     color: '#9CA3AF',
     fontWeight: '500',
  },
  progressValue: {
     fontSize: 11,
     fontWeight: '800',
     color: '#111827',
  },
  progressBarBg: {
     width: '100%',
     height: 8,
     backgroundColor: '#E5E7EB',
     borderRadius: 4,
     overflow: 'hidden',
  },
  progressBarFill: {
     height: '100%',
     backgroundColor: '#4F46E5',
     borderRadius: 4,
  },

  cardActionsRow: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
  },
  actionBtnView: {
     flex: 1.5,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#4F46E5',
     paddingVertical: 14,
    paddingHorizontal: 20,
     borderRadius: 8,
     marginRight: 8,
  
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,},
  actionBtnViewText: {
     color: '#FFFFFF',
     fontSize: 11,
     fontWeight: '600',
  },
  actionBtnEdit: {
     flex: 0.9,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#F3F4F6',
     paddingVertical: 14,
    paddingHorizontal: 20,
     borderRadius: 8,
     borderWidth: 1,
    borderColor: '#E5E7EB',
     marginRight: 8,
  },
  actionBtnEditText: {
     color: '#1F2937',
     fontSize: 11,
     fontWeight: '700',
  },
  actionBtnRemind: {
     flex: 1.1,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#F97316',
     paddingVertical: 14,
    paddingHorizontal: 20,
     borderRadius: 8,
  },
  actionBtnRemindText: {
     color: '#FFFFFF',
     fontSize: 11,
     fontWeight: '700',
  },
});

export default TeacherAssignmentScreen;
