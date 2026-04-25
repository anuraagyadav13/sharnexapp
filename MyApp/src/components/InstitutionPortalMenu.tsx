import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MenuItemProps {
  icon: string;
  label: string;
  isActive?: boolean;
  onPress?: () => void;
  isFontAwesome?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, isActive, onPress, isFontAwesome }) => {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isActive && styles.activeMenuItem]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {isFontAwesome ? (
          <FontAwesome5 name={icon} size={20} color="#FFFFFF" />
        ) : (
          <Icon name={icon} size={24} color="#FFFFFF" />
        )}
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

interface ExpandableMenuItemProps {
  icon: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isFontAwesome?: boolean;
}

const ExpandableMenuItem: React.FC<ExpandableMenuItemProps> = ({
  icon,
  label,
  isOpen,
  onToggle,
  children,
  isFontAwesome,
}) => {
  const animatedHeight = useSharedValue(0);
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    animatedHeight.value = withTiming(isOpen ? 1 : 0, { duration: 300 });
    rotation.value = withTiming(isOpen ? 180 : 0, { duration: 300 });
  }, [isOpen]);

  const contentStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(animatedHeight.value, [0, 1], [0, 80], Extrapolate.CLAMP), 
      opacity: animatedHeight.value,
      overflow: 'hidden',
    };
  });

  const arrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View>
      <TouchableOpacity
        style={[styles.menuItem, isOpen && styles.expandableActive]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {isFontAwesome ? (
            <FontAwesome5 name={icon} size={20} color="#FFFFFF" />
          ) : (
            <Icon name={icon} size={24} color="#FFFFFF" />
          )}
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Animated.View style={arrowStyle}>
          <Icon name="chevron-down" size={24} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
      <Animated.View style={contentStyle}>
        <View style={styles.subMenuContainer}>{children}</View>
      </Animated.View>
    </View>
  );
};

export const InstitutionPortalMenu = () => {
  const [academicOpen, setAcademicOpen] = useState(true);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Institution Portal</Text>
        <Text style={styles.headerSubtitle}>Manage your institution</Text>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <MenuItem icon="home" label="Home" isFontAwesome />
        
        <ExpandableMenuItem
          icon="graduation-cap"
          label="Academic Structure"
          isOpen={academicOpen}
          onToggle={() => setAcademicOpen(!academicOpen)}
          isFontAwesome
        >
          <TouchableOpacity style={[styles.subMenuItem, styles.subMenuItemActive]}>
            <Text style={styles.subMenuLabel}>Classes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.subMenuItem}>
            <Text style={styles.subMenuLabel}>Subjects</Text>
          </TouchableOpacity>
        </ExpandableMenuItem>

        <MenuItem icon="users" label="Staff Management" isFontAwesome />
        <MenuItem icon="file-alt" label="Students details" isFontAwesome />
        <MenuItem icon="calendar-alt" label="Academic Calendar" isFontAwesome />
        <MenuItem icon="clock" label="Timetable" isFontAwesome />
        <MenuItem icon="chart-bar" label="Performance" isFontAwesome />
        <MenuItem icon="check-square" label="Result Management" isFontAwesome />
        <MenuItem icon="megaphone" label="Announcements" isFontAwesome />
        <MenuItem icon="credit-card" label="Fees & Payments" isFontAwesome />
        <MenuItem icon="graduation-cap" label="Equipment Requests" isFontAwesome />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <MenuItem icon="cog" label="Account Settings" isFontAwesome />
        <MenuItem icon="sign-out-alt" label="Logout" isFontAwesome />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B5CF6', // Primary Purple matching the image
    width: 280,
    height: SCREEN_HEIGHT,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  menuScroll: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 2,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  expandableActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    marginHorizontal: 10,
    paddingHorizontal: 10,
  },
  iconContainer: {
    width: 35,
    alignItems: 'center',
  },
  menuLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
    flex: 1,
  },
  subMenuContainer: {
    paddingLeft: 60,
    paddingVertical: 5,
  },
  subMenuItem: {
    paddingVertical: 10,
    marginVertical: 2,
    width: '90%',
  },
  subMenuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  subMenuLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});
