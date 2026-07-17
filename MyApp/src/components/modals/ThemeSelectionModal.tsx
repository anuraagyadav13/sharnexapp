import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { ThemeMode } from '../../constants/theme';

interface ThemeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ThemeSelectionModal: React.FC<ThemeSelectionModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const styles = getStyles(theme);

  const handleSelectMode = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Theme</Text>
          <View style={styles.modalDivider} />

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleSelectMode('light')}
          >
            <View style={styles.optionLeft}>
              <Ionicons
                name="sunny-outline"
                size={20}
                color={themeMode === 'light' ? theme.primary : theme.text}
              />
              <Text
                style={[
                  styles.optionText,
                  themeMode === 'light' && styles.optionTextSelected,
                ]}
              >
                Light
              </Text>
            </View>
            {themeMode === 'light' && (
              <Ionicons name="checkmark" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleSelectMode('dark')}
          >
            <View style={styles.optionLeft}>
              <Ionicons
                name="moon-outline"
                size={20}
                color={themeMode === 'dark' ? theme.primary : theme.text}
              />
              <Text
                style={[
                  styles.optionText,
                  themeMode === 'dark' && styles.optionTextSelected,
                ]}
              >
                Dark
              </Text>
            </View>
            {themeMode === 'dark' && (
              <Ionicons name="checkmark" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => handleSelectMode('system')}
          >
            <View style={styles.optionLeft}>
              <Ionicons
                name="settings-outline"
                size={20}
                color={themeMode === 'system' ? theme.primary : theme.text}
              />
              <Text
                style={[
                  styles.optionText,
                  themeMode === 'system' && styles.optionTextSelected,
                ]}
              >
                System Default
              </Text>
            </View>
            {themeMode === 'system' && (
              <Ionicons name="checkmark" size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
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

export default ThemeSelectionModal;
