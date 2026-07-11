import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScaleButton from './animations/ScaleButton';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';

interface StudentHeaderProps {
  title: string;
  navigation: any;
  onMenuPress?: () => void;
  isStackScreen?: boolean;
  isDashboard?: boolean;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  title,
  navigation,
  onMenuPress,
  isStackScreen = false,
  isDashboard = false,
}) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme);

  const handleLeftPress = () => {
    if (isStackScreen) {
      navigation.goBack();
    } else if (onMenuPress) {
      onMenuPress();
    }
  };

  return (
    <View style={styles.globalHeader}>
      <ScaleButton
        style={styles.menuHandle}
        onPress={handleLeftPress}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        activeOpacity={0.7}
        scaleTo={0.85}
      >
        <Ionicons name={isStackScreen ? "arrow-back" : "menu"} size={28} color={theme.text} />
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
              onPress={() => navigation.navigate('AccountSettings', { targetTab: 'Preferences' })}
            >
              <Ionicons name="settings-outline" size={22} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtnTransparent}
              onPress={toggleDarkMode}
            >
              <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={22} color={theme.text} />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('AccountSettings', {
              targetTab: 'Personal Details',
            })
          }
        >
          {authState.user?.photoUrl ||
          authState.user?.profileImage ||
          authState.user?.image ? (
            <Image
              source={{
                uri:
                  authState.user.photoUrl ||
                  authState.user.profileImage ||
                  authState.user.image,
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
      textAlign: 'center',
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
  });
