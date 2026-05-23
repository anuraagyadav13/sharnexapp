import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
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
  subItems?: { id: string; label: string; icon?: string }[];
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
  { 
    id: 'academic', 
    label: 'Academic Structure', 
    icon: 'school-outline',
    subItems: [
      { id: 'classes', label: 'Classes' },
      { id: 'subjects', label: 'Subjects' }
    ]
  },
  { id: '4', label: 'Staff Management', icon: 'people-outline' },
  { id: '5', label: 'Students details', icon: 'person-outline' },
  { id: '6', label: 'Academic Calendar', icon: 'calendar-outline' },
  { id: '7', label: 'Timetable', icon: 'time-outline' },
  { id: '8', label: 'Performance', icon: 'trending-up-outline' },
  { id: '11', label: 'Result Management', icon: 'reader-outline' },
  { id: '9', label: 'Announcements', icon: 'megaphone-outline' },
  { id: '10', label: 'Fees & Payments', icon: 'card-outline' },
  { id: 'equip', label: 'Equipment Requests', icon: 'construct-outline' },
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

  const [expandedItems, setExpandedItems] = useState<string[]>(['academic']);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderMenu = () => {
    let menuItems = STUDENT_MENU;
    if (role === 'teacher') menuItems = TEACHER_MENU;
    if (role === 'admin') menuItems = STUDENT_MENU; 
    if (role === 'principal') menuItems = PRINCIPAL_MENU;

    const getIsActive = (label: string): boolean => {
      switch (label) {
        case 'Home': return currentRouteName === 'PrincipalDashboard' || currentRouteName === 'StudentDashboard' || currentRouteName === 'TeacherDashboard';
        case 'Classes': return currentRouteName === 'PrincipalClasses';
        case 'Subjects': return currentRouteName === 'PrincipalSubjects';
        case 'Staff Management': return currentRouteName === 'PrincipalStaff';
        case 'Students details': return currentRouteName === 'PrincipalStudentDetails';
        case 'Academic Calendar': return currentRouteName === 'PrincipalCalendar' || currentRouteName === 'Calendar';
        case 'Timetable': return currentRouteName === 'PrincipalTimetable' || currentRouteName === 'Timetable' || currentRouteName === 'TeacherTimetable';
        case 'Performance': return currentRouteName === 'PrincipalPerformance' || currentRouteName === 'Performance' || currentRouteName === 'TeacherPerformance';
        case 'Announcements': return currentRouteName === 'PrincipalAnnouncements' || currentRouteName === 'Announcements';
        case 'Fees & Payments': return currentRouteName === 'PrincipalFees' || currentRouteName === 'Fees';
        case 'Result Management': return currentRouteName === 'PrincipalRSM' || currentRouteName === 'ResultManagement' || currentRouteName === 'TeacherResultManagement';
        case 'Account Settings': return currentRouteName === 'AccountSettings';
        default: return false;
      }
    };

    const handleNavigation = (label: string) => {
      onClose();
      setTimeout(() => {
        if (label === 'Home') {
          if (role === 'principal') navigation.navigate('PrincipalDashboard');
          else if (role === 'teacher') navigation.navigate('TeacherDashboard');
          else navigation.navigate('StudentDashboard');
        } else if (label === 'Classes') navigation.navigate('PrincipalClasses');
        else if (label === 'Subjects') navigation.navigate('PrincipalSubjects');
        else if (label === 'Staff Management') navigation.navigate('PrincipalStaff');
        else if (label === 'Students details') navigation.navigate('PrincipalStudentDetails');
        else if (label === 'Academic Calendar') navigation.navigate('PrincipalCalendar');
        else if (label === 'Timetable') {
          if (role === 'principal') navigation.navigate('PrincipalTimetable');
          else if (role === 'teacher') navigation.navigate('TeacherTimetable');
          else navigation.navigate('Timetable');
        } else if (label === 'Performance') navigation.navigate('PrincipalPerformance');
        else if (label === 'Announcements') {
          if (role === 'principal') navigation.navigate('PrincipalAnnouncements');
          else navigation.navigate('Announcements');
        } else if (label === 'Fees & Payments') navigation.navigate('PrincipalFees');
        else if (label === 'Result Management') {
          if (role === 'principal') navigation.navigate('PrincipalRSM');
          else if (role === 'teacher') navigation.navigate('TeacherResultManagement');
        } else if (label === 'Account Settings') navigation.navigate('AccountSettings');
        else if (label === 'Logout') logout();
      }, 250);
    };

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {role === 'principal' && (
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Institution Portal</Text>
            <Text style={styles.headerSubtitle}>Manage your institution</Text>
          </View>
        )}
        {menuItems.map((item) => {
          if (item.isDivider) return <View key={item.id} style={styles.divider} />;

          const isActive = getIsActive(item.label);
          const isExpanded = expandedItems.includes(item.id);

          return (
            <View key={item.id}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.menuItem, isActive && styles.menuItemActive, item.subItems && isExpanded && styles.expandableActive]}
                onPress={() => item.subItems ? toggleExpand(item.id) : handleNavigation(item.label)}
              >
                <Ionicons name={item.icon} size={22} color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.8)'} />
                <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{item.label}</Text>
                {item.subItems && (
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color="rgba(255,255,255,0.6)" 
                    style={{ marginLeft: 'auto' }} 
                  />
                )}
              </TouchableOpacity>

              {item.subItems && isExpanded && (
                <View style={styles.subMenuContainer}>
                  {item.subItems.map(sub => (
                    <TouchableOpacity
                      key={sub.id}
                      style={[styles.subMenuItem, getIsActive(sub.label) && styles.subMenuItemActive]}
                      onPress={() => handleNavigation(sub.label)}
                    >
                      <Text style={[styles.subMenuText, getIsActive(sub.label) && styles.subMenuTextActive]}>
                        {sub.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
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
          <View style={[StyleSheet.absoluteFill, { backgroundColor: role === 'principal' ? '#8B5CF6' : 'rgba(139, 92, 246, 0.95)' }]} />

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
  headerInfo: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    marginTop: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFFFFF',
    paddingLeft: 16,
  },
  expandableActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  subMenuContainer: {
    paddingLeft: 56,
    paddingBottom: 10,
  },
  subMenuItem: {
    paddingVertical: 10,
  },
  subMenuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginRight: 20,
    paddingLeft: 10,
  },
  subMenuText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  subMenuTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 0,
    marginVertical: 10,
  },
});
