import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import ThemeSelectionModal from '../modals/ThemeSelectionModal';
import ScaleButton from '../animations/ScaleButton';

export type BusTabType = 'Dashboard' | 'Fleet Tracking' | 'Routes' | 'Schedules' | 'Driver Management';

interface BusSubHeaderProps {
  activeTab: BusTabType;
  navigation: any;
  onOpenDrawer?: () => void;
  title?: string;
  isStackSubScreen?: boolean;
}

const TABS: { id: BusTabType; routeName: string; icon: string }[] = [
  { id: 'Dashboard', routeName: 'BusDashboard', icon: 'grid-outline' },
  { id: 'Fleet Tracking', routeName: 'FleetTracking', icon: 'bus-outline' },
  { id: 'Routes', routeName: 'RouteManagement', icon: 'map-outline' },
  { id: 'Schedules', routeName: 'Schedules', icon: 'time-outline' },
  { id: 'Driver Management', routeName: 'DriverManagement', icon: 'people-outline' },
];

export const BusSubHeader: React.FC<BusSubHeaderProps> = ({
  activeTab,
  navigation,
  onOpenDrawer,
  title = 'Bus Tracking',
  isStackSubScreen = false,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const [isThemeModalOpen, setThemeModalOpen] = useState(false);
  const styles = getStyles(theme, isDarkMode);

  const handleTabPress = (tab: BusTabType, routeName: string) => {
    if (tab !== activeTab) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={styles.container}>
      {/* Theme Selection Modal */}
      <ThemeSelectionModal
        visible={isThemeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />

      {/* Header — matching standard Principal screens (Classes, Fees, Subjects, Staff) */}
      <View style={styles.globalHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => {
            if (isStackSubScreen) {
              navigation.goBack();
            } else if (onOpenDrawer) {
              onOpenDrawer();
            }
          }}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons
            name={isStackSubScreen ? 'arrow-back' : 'menu'}
            size={28}
            color={theme.text}
          />
        </ScaleButton>

        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtnTransparent}
            onPress={() => setThemeModalOpen(true)}
          >
            <Ionicons
              name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
              size={22}
              color={theme.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })}
          >
            {authState.user?.photoUrl ? (
              <Image source={{ uri: authState.user.photoUrl }} style={styles.headerAvatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'I'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Secondary Tab Bar — Shared sub-navigation across all 5 screens */}
      {!isStackSubScreen && (
        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.75}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => handleTabPress(tab.id, tab.routeName)}
                >
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={isActive ? '#FFFFFF' : theme.subtext}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.id}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Live Server Online Badge */}
          <View style={styles.liveBadgeContainer}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE SERVER ONLINE</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      zIndex: 10,
    },
    globalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 54 : 36,
      paddingBottom: 12,
      backgroundColor: theme.surface,
    },
    menuHandle: {
      paddingRight: 8,
      paddingVertical: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
      marginLeft: 4,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    iconBtnTransparent: {
      padding: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#7C3AED',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
    headerAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    tabContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: isDarkMode ? '#17122C' : '#F5F3FF',
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    tabScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingRight: 8,
    },
    tabButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: 'transparent',
    },
    tabButtonActive: {
      backgroundColor: '#7C3AED',
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.subtext,
    },
    tabTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    liveBadgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
      marginLeft: 4,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#10B981',
      marginRight: 6,
    },
    liveBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#10B981',
      letterSpacing: 0.5,
    },
  });
