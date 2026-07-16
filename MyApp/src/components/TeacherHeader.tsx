import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScaleButton from './animations/ScaleButton';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';

interface TeacherHeaderProps {
  title: string;
  navigation: any;
  onMenuPress?: () => void;
  isStackScreen?: boolean;
  isDashboard?: boolean;
}

export const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  title,
  navigation,
  onMenuPress,
  isStackScreen = false,
  isDashboard = false,
}) => {
  const { theme, isDarkMode, themeMode, setThemeMode } = useTheme();
  const { authState } = useAuth();
  const [isThemeModalOpen, setThemeModalOpen] = useState(false);
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
              onPress={() => setThemeModalOpen(true)}
            >
              <Ionicons name={isDarkMode ? "moon-outline" : "sunny-outline"} size={22} color={theme.text} />
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
                {authState.user?.name?.charAt(0) || 'T'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={isThemeModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setThemeModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setThemeModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Theme</Text>
            <View style={styles.modalDivider} />
            
            <TouchableOpacity
              style={styles.optionRow}
              onPress={async () => {
                await setThemeMode('light');
                setThemeModalOpen(false);
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="sunny-outline" size={20} color={themeMode === 'light' ? theme.primary : theme.text} />
                <Text style={[styles.optionText, themeMode === 'light' && styles.optionTextSelected]}>Light</Text>
              </View>
              {themeMode === 'light' && <Ionicons name="checkmark" size={20} color={theme.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={async () => {
                await setThemeMode('dark');
                setThemeModalOpen(false);
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="moon-outline" size={20} color={themeMode === 'dark' ? theme.primary : theme.text} />
                <Text style={[styles.optionText, themeMode === 'dark' && styles.optionTextSelected]}>Dark</Text>
              </View>
              {themeMode === 'dark' && <Ionicons name="checkmark" size={20} color={theme.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={async () => {
                await setThemeMode('system');
                setThemeModalOpen(false);
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="settings-outline" size={20} color={themeMode === 'system' ? theme.primary : theme.text} />
                <Text style={[styles.optionText, themeMode === 'system' && styles.optionTextSelected]}>System Default</Text>
              </View>
              {themeMode === 'system' && <Ionicons name="checkmark" size={20} color={theme.primary} />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    modalDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginBottom: 8,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    optionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    optionTextSelected: {
      color: theme.primary,
      fontWeight: '700',
    },
  });
