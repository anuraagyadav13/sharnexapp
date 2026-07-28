import React, { useState } from 'react';
import {
  TouchableOpacity,
  Modal,
  Pressable,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { ThemeMode } from '../../constants/theme';

const THEME_OPTIONS: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: 'light', icon: 'sunny-outline', label: 'Light' },
  { mode: 'dark', icon: 'moon-outline', label: 'Dark' },
  { mode: 'system', icon: 'phone-portrait-outline', label: 'System' },
];

export interface ThemeToggleProps {
  iconColor?: string;
  buttonStyle?: StyleProp<ViewStyle>;
  iconSize?: number;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  iconColor,
  buttonStyle,
  iconSize = 22,
}) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const styles = getStyles(theme);

  const activeOption =
    THEME_OPTIONS.find(o => o.mode === themeMode) ?? THEME_OPTIONS[0];

  return (
    <>
      <TouchableOpacity
        style={[styles.iconBtnTransparent, buttonStyle]}
        onPress={() => setPickerVisible(true)}
        accessibilityLabel="Change theme"
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeOption.icon}
          size={iconSize}
          color={iconColor || theme.text}
        />
      </TouchableOpacity>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPickerVisible(false)}
        >
          <Pressable style={styles.pickerCard} onPress={() => {}}>
            <Text style={styles.pickerTitle}>Appearance</Text>

            <View style={styles.segmentRow}>
              {THEME_OPTIONS.map(option => {
                const isActive = themeMode === option.mode;
                return (
                  <TouchableOpacity
                    key={option.mode}
                    style={[
                      styles.segmentBtn,
                      isActive ? styles.segmentBtnActive : null,
                    ]}
                    onPress={() => {
                      setThemeMode(option.mode);
                      setPickerVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={isActive ? '#FFFFFF' : theme.subtext}
                    />
                    <Text
                      style={[
                        styles.segmentLabel,
                        isActive ? styles.segmentLabelActive : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    iconBtnTransparent: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    pickerCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pickerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    segmentRow: {
      flexDirection: 'row',
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 8,
    },
    segmentBtnActive: {
      backgroundColor: theme.primary,
    },
    segmentLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.subtext,
    },
    segmentLabelActive: {
      color: '#FFFFFF',
    },
  });

export default ThemeToggle;
