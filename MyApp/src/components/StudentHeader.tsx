import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScaleButton from './animations/ScaleButton';
import ThemeToggle from './common/ThemeToggle';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { ThemeMode } from '../constants/theme';
import { getCacheBustedUri } from '../utils/image';


interface StudentHeaderProps {
  title: string;
  navigation: any;
  onMenuPress?: () => void;
  isStackScreen?: boolean;
  isDashboard?: boolean;
}

// Three options for the theme picker
const THEME_OPTIONS: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: 'light', icon: 'sunny-outline', label: 'Light' },
  { mode: 'dark', icon: 'moon-outline', label: 'Dark' },
  { mode: 'system', icon: 'phone-portrait-outline', label: 'System' },
];

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  title,
  navigation,
  onMenuPress,
  isStackScreen = false,
  isDashboard = false,
}) => {
  const { theme, isDarkMode, themeMode, setThemeMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme);

  const [pickerVisible, setPickerVisible] = useState(false);

  const handleLeftPress = () => {
    if (isStackScreen) {
      navigation.goBack();
    } else if (onMenuPress) {
      onMenuPress();
    }
  };

  // Icon shown on the toggle button reflects the ACTIVE mode
  const activeOption = THEME_OPTIONS.find(o => o.mode === themeMode) ?? THEME_OPTIONS[0];

  return (
    <View style={styles.globalHeader}>
      <ScaleButton
        style={styles.menuHandle}
        onPress={handleLeftPress}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        activeOpacity={0.7}
        scaleTo={0.85}
      >
        <Ionicons
          name={isStackScreen ? 'arrow-back' : 'menu'}
          size={28}
          color={theme.text}
        />
      </ScaleButton>

      <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
        {title}
      </Text>

      <View style={styles.headerRight}>
        {isDashboard && (
          <>
            <TouchableOpacity style={styles.iconBtnTransparent}>
              <Ionicons name="notifications-outline" size={22} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtnTransparent}
              onPress={() =>
                navigation.navigate('AccountSettings', { targetTab: 'Preferences' })
              }
            >
              <Ionicons name="settings-outline" size={22} color={theme.text} />
            </TouchableOpacity>

            <ThemeToggle />
          </>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('AccountSettings', { targetTab: 'Personal Details' })
          }
        >
          {authState.user?.photoUrl ||
            authState.user?.profileImage ||
            authState.user?.image ? (
            <Image
              source={{
                uri: getCacheBustedUri(
                  authState.user.photoUrl ||
                    authState.user.profileImage ||
                    authState.user.image,
                  authState.user.photoUpdatedAt
                ),
              }}
              style={styles.headerAvatarImage}
            />

          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {authState.user?.name?.charAt(0) || 'S'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles — called with the active theme each render
// ---------------------------------------------------------------------------
const getStyles = (theme: any) =>
  StyleSheet.create({
    globalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 16,
      backgroundColor: theme.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 8,
      zIndex: 10,
    },
    menuHandle: { paddingRight: 4, paddingVertical: 10 },
    headerTitle: {
      fontSize: 18,
      fontWeight: '500',
      color: theme.primary,
      flex: 1,
      textAlign: 'left',
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    iconBtnTransparent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#9F7AEA',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
      shadowColor: '#1E293B',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 6,
    },
    avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    headerAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginLeft: 4,
    },

    // ---- Theme Picker Modal ----
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: Platform.OS === 'ios' ? 96 : 76,
      paddingRight: 16,
    },
    pickerCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 12,
      minWidth: 220,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pickerTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.subtext,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 8,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 12,
      backgroundColor: theme.iconBackground,
      gap: 6,
    },
    segmentBtnActive: {
      backgroundColor: '#7C3AED',
    },
    segmentLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.subtext,
    },
    segmentLabelActive: {
      color: '#FFFFFF',
    },
  });
