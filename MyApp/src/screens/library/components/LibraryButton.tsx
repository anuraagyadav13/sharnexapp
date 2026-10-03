import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../store/ThemeContext';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface LibraryButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

const SIZE_STYLES: Record<ButtonSize, ViewStyle> = {
  sm: { paddingVertical: 6, paddingHorizontal: 12 },
  md: { paddingVertical: 9, paddingHorizontal: 16 },
  lg: { paddingVertical: 11, paddingHorizontal: 22 },
};

const SIZE_TEXT: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: 12 },
  md: { fontSize: 13 },
  lg: { fontSize: 14 },
};

const LibraryButton: React.FC<LibraryButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onPress,
  style,
  disabled,
}) => {
  const { theme } = useTheme();
  
  const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: theme.primary },
    ghost: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
    danger: { backgroundColor: theme.dangerBg, borderWidth: 1, borderColor: theme.danger },
    success: { backgroundColor: theme.successBg, borderWidth: 1, borderColor: theme.success },
  };
  
  const VARIANT_TEXT: Record<ButtonVariant, TextStyle> = {
    primary: { color: theme.onPrimary },
    ghost: { color: theme.subtext },
    danger: { color: theme.danger },
    success: { color: theme.success },
  };

  const styles = StyleSheet.create({
    base: {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontWeight: '600',
    },
    disabled: {
      opacity: 0.5,
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[styles.base, VARIANT_STYLES[variant], SIZE_STYLES[size], disabled && styles.disabled, style]}
    >
      <Text style={[styles.text, VARIANT_TEXT[variant], SIZE_TEXT[size]]}>{children}</Text>
    </TouchableOpacity>
  );
};

export default LibraryButton;
