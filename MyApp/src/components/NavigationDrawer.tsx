import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, TouchableOpacity } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../store/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;
const SWIPE_THRESHOLD = -DRAWER_WIDTH / 3;

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'student' | 'teacher' | 'admin' | 'principal';
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  isDivider?: boolean;
}

const STUDENT_MENU: MenuItem[] = [
  { id: '1', label: 'Home', icon: 'grid-outline' },
  { id: '2', label: 'Assignments', icon: 'clipboard-outline' },
  { id: '3', label: 'Quizzes & Tests', icon: 'time-outline' },
  { id: 'div1', label: '', icon: '', isDivider: true },
  { id: '4', label: 'Performance Trend', icon: 'trending-up-outline' },
  { id: 'timetable', label: 'Timetable', icon: 'calendar-clear-outline' },
  { id: '5', label: 'Study Material', icon: 'book-outline' },
  { id: '6', label: 'Attendance', icon: 'calendar-outline' },
  { id: '7', label: 'Announcements', icon: 'chatbox-ellipses-outline' },
  { id: '8', label: 'Grades & Reports', icon: 'document-text-outline' },
  { id: 'result-mgmt', label: 'Official Result', icon: 'reader-outline' },
  { id: '9', label: 'Fees Portal', icon: 'receipt-outline' },
  { id: 'div2', label: '', icon: '', isDivider: true },
  { id: '10', label: 'Account Settings', icon: 'settings-outline' },
  { id: '11', label: 'Logout', icon: 'log-out-outline' },
];

const PRINCIPAL_MENU: MenuItem[] = [
  { id: '1', label: 'Home', icon: 'grid-outline' },
  { id: '2', label: 'Classes', icon: 'layers-outline' },
  { id: '3', label: 'Subjects', icon: 'pie-chart-outline' },
  { id: '4', label: 'Staff Management', icon: 'trending-up-outline' },
  { id: '5', label: 'Staff Details', icon: 'person-outline' },
  { id: '6', label: 'Academic Calendar', icon: 'calendar-outline' },
  { id: '7', label: 'Time Table', icon: 'chatbox-ellipses-outline' },
  { id: '8', label: 'Performance', icon: 'document-text-outline' },
  { id: '9', label: 'Announcements', icon: 'document-outline' },
  { id: '10', label: 'Fees & Payments', icon: 'document-outline' },
  { id: '11', label: 'Result Management', icon: 'reader-outline' },
  { id: 'div1', label: '', icon: '', isDivider: true },
  { id: '12', label: 'Account Settings', icon: 'settings-outline' },
  { id: '13', label: 'Logout', icon: 'log-out-outline' },
];

const TEACHER_MENU: MenuItem[] = [
  { id: '1', label: 'Home', icon: 'grid-outline' },
  { id: 'timetable', label: 'Timetable', icon: 'calendar-clear-outline' },
  { id: '2', label: 'Class Attendance', icon: 'people-outline' },
  { id: '3', label: 'Assignments', icon: 'document-text-outline' },
  { id: '4', label: 'Exams', icon: 'time-outline' },
  { id: '5', label: 'Study Material', icon: 'book-outline' },
  { id: '6', label: 'Performance Report', icon: 'trending-up-outline' },
  { id: '7', label: 'Announcements', icon: 'megaphone-outline' },
  { id: '8', label: 'Equipment', icon: 'hammer-outline' },
  { id: 'result-mgmt', label: 'Result Management', icon: 'reader-outline' },
  { id: 'my-attendance', label: 'My Attendance', icon: 'person-check-outline' },
  { id: 'div1', label: '', icon: '', isDivider: true },
  { id: '9', label: 'Account Settings', icon: 'settings-outline' },
  { id: '10', label: 'Logout', icon: 'log-out-outline' },
];

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ isOpen, onClose, role = 'student' }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const route = useRoute();
  const currentRouteName = route.name;

  const [isRendered, setIsRendered] = useState(false);
  const translateX = useSharedValue(-DRAWER_WIDTH);

  // Sync state to animations
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      translateX.value = withTiming(0, { duration: 200 });
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(setIsRendered)(false);
        }
      });
    }
  }, [isOpen, translateX]);

  // Handle Swipe Gestures
  const offsetX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart(() => {
      offsetX.value = translateX.value;
    })
    .onUpdate((event) => {
      let nextX = offsetX.value + event.translationX;
      if (nextX > 0) nextX = 0; // Prevent dragging past right edge
      translateX.value = nextX;
    })
    .onEnd((event) => {
      if (translateX.value < SWIPE_THRESHOLD || event.velocityX < -500) {
        translateX.value = withTiming(-DRAWER_WIDTH, { duration: 200 }, () => {
          runOnJS(onClose)();
        });
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  // Animated Styles
  const drawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-DRAWER_WIDTH, 0],
      [0, 0.4],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      display: translateX.value === -DRAWER_WIDTH ? 'none' : 'flex',
    };
  });

  const renderMenu = () => {
    let menuItems = STUDENT_MENU;
    if (role === 'teacher') menuItems = TEACHER_MENU;
    if (role === 'admin') menuItems = STUDENT_MENU; // Mock
    if (role === 'principal') menuItems = PRINCIPAL_MENU;

    const getIsActive = (label: string): boolean => {
      switch (label) {
        case 'Home': case 'Dashboard': case 'Student Dashboard':
          return currentRouteName === 'PrincipalDashboard' || currentRouteName === 'StudentDashboard' || currentRouteName === 'TeacherDashboard';
        case 'Classes': return currentRouteName === 'PrincipalClasses';
        case 'Subjects': return currentRouteName === 'PrincipalSubjects';
        case 'Staff Management': return currentRouteName === 'PrincipalStaff';
        case 'Staff Details': case 'Students details': return currentRouteName === 'PrincipalStudentDetails';
        case 'Academic Calendar': return currentRouteName === 'PrincipalCalendar' || currentRouteName === 'Calendar';
        case 'Time Table': case 'Timetable': return currentRouteName === 'PrincipalTimetable' || currentRouteName === 'Timetable';
        case 'Performance': return currentRouteName === 'PrincipalPerformance' || currentRouteName === 'Performance';
        case 'Announcements': return currentRouteName === 'PrincipalAnnouncements' || currentRouteName === 'Announcements';
        case 'Fees & Payments': case 'Fees Portal': return currentRouteName === 'PrincipalFees' || currentRouteName === 'Fees';
        case 'Result Management': return currentRouteName === 'PrincipalRSM' || currentRouteName === 'ResultManagement' || currentRouteName === 'TeacherResultManagement';
        case 'Account Settings': return currentRouteName === 'AccountSettings';
        case 'Attendance': case 'Class Attendance': return currentRouteName === 'TeacherAttendance' || currentRouteName === 'Attendance' || currentRouteName === 'TeacherViewAttendance';
        case 'Assignments': return currentRouteName === 'TeacherAssignment' || currentRouteName === 'Assignments';
        case 'Quizzes': case 'Quizzes & Tests': case 'Exams': return currentRouteName === 'TeacherQuiz' || currentRouteName === 'Quizzes';
        case 'Time Table': case 'Timetable': return currentRouteName === 'PrincipalTimetable' || currentRouteName === 'Timetable' || currentRouteName === 'TeacherTimetable';
        case 'Live Monitor': return currentRouteName === 'TeacherMonitorLive';
        case 'Study Material': return currentRouteName === 'StudyMaterial';
        case 'Performance Report': return currentRouteName === 'Performance';
        case 'Announcements': return currentRouteName === 'Announcements';
        case 'Result Management': return currentRouteName === 'PrincipalRSM' || currentRouteName === 'ResultManagement' || currentRouteName === 'TeacherResultManagement';
        case 'My Attendance': return currentRouteName === 'TeacherSelfAttendance';
        default: return false;
      }
    };

    return menuItems.map((item) => {
      if (item.isDivider) {
        return <View key={item.id} style={styles.divider} />;
      }

      const isActive = getIsActive(item.label);

      return (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.7}
          style={[styles.menuItem, isActive && styles.menuItemActive]}
          onPress={() => {
            onClose();

            setTimeout(() => {
              if (item.label === 'Home' || item.label === 'Student Dashboard' || item.label === 'Dashboard') {
                if (role === 'principal') navigation.navigate('PrincipalDashboard');
                else if (role === 'teacher') navigation.navigate('TeacherDashboard');
                else navigation.navigate('StudentDashboard');
              } else if (item.label === 'Classes') {
                navigation.navigate('PrincipalClasses');
              } else if (item.label === 'Subjects') {
                navigation.navigate('PrincipalSubjects');
              } else if (item.label === 'Staff Management') {
                navigation.navigate('PrincipalStaff');
              } else if (item.label === 'Staff Details' || item.label === 'Students details') {
                navigation.navigate('PrincipalStudentDetails');
              } else if (item.label === 'Assignments') {
                if (role === 'teacher') navigation.navigate('TeacherAssignment');
                else navigation.navigate('Assignments');
              } else if (item.label === 'Quizzes & Tests' || item.label === 'Quizzes' || item.label === 'Exams') {
                if (role === 'teacher') navigation.navigate('TeacherQuiz');
                else navigation.navigate('Quizzes');
              } else if (item.label === 'Performance Trend' || item.label === 'Performance Report') {
                if (role === 'teacher') navigation.navigate('TeacherPerformance');
                else navigation.navigate('Performance');
              } else if (item.label === 'Performance') {
                navigation.navigate('PrincipalPerformance');
              } else if (item.label === 'Study Material') {
                if (role === 'teacher') navigation.navigate('TeacherStudyMaterial');
                else navigation.navigate('StudyMaterial');
              } else if (item.label === 'Attendance' || item.label === 'Class Attendance') {
                if (role === 'teacher') navigation.navigate('TeacherAttendance');
                else navigation.navigate('Attendance');
              } else if (item.label === 'My Attendance') {
                navigation.navigate('TeacherSelfAttendance');
              } else if (item.label === 'Live Monitor') {
                navigation.navigate('TeacherMonitorLive', { quizId: '1' });
              } else if (item.label === 'Academic Calendar') {
                if (role === 'principal') navigation.navigate('PrincipalCalendar');
              } else if (item.label === 'Announcements') {
                if (role === 'principal') navigation.navigate('PrincipalAnnouncements');
                else navigation.navigate('Announcements');
              } else if (item.label === 'Grades & Reports') {
                navigation.navigate('Grades');
              } else if (item.label === 'Fees Portal' || item.label === 'Fees & Payments') {
                if (role === 'principal') navigation.navigate('PrincipalFees');
                else navigation.navigate('Fees');
              } else if (item.label === 'Time Table' || item.label === 'Timetable') {
                if (role === 'principal') navigation.navigate('PrincipalTimetable');
                else if (role === 'teacher') navigation.navigate('TeacherTimetable');
                else navigation.navigate('Timetable');
              } else if (item.label === 'Result Management') {
                if (role === 'principal') navigation.navigate('PrincipalRSM');
                else if (role === 'teacher') navigation.navigate('TeacherResultManagement');
                else navigation.navigate('ResultManagement');
              } else if (item.label === 'Equipment') {
                navigation.navigate('TeacherEquipment');
              } else if (item.label === 'My Attendance') {
                navigation.navigate('TeacherSelfAttendance');
              } else if (item.label === 'Account Settings') {
                navigation.navigate('AccountSettings');
              } else if (item.label === 'Logout') {
                logout();
              }
            }, 250);
          }}
        >
          <Ionicons name={item.icon} size={22} color={isActive ? '#FFFFFF' : '#E0E7FF'} />
          <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{item.label}</Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Dimmed Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Drawer Container */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.drawerContainer, drawerStyle]}>
          {/* Uniform Semi-transparent overlay background */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(139, 92, 246, 0.95)' }]} />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.menuList}>
            {renderMenu()}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 99,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    // Base transparent, relying on the pseudo gradient
    backgroundColor: 'transparent',
    zIndex: 100,
    paddingTop: 50,
  },
  closeBtn: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: 'rgba(29, 78, 216, 0.6)', // Deep blue solid highlight
    borderLeftWidth: 4,
    borderLeftColor: '#1E3A8A', // Extra dark blue rim
    paddingLeft: 16,
  },
  menuText: {
    marginLeft: 14,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  menuTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 0,
    marginVertical: 10,
  },
});
