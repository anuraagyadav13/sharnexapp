import React from 'react';
import { Theme } from '../../../constants/theme';
import { useTheme } from '../../../store/ThemeContext';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';


interface FormFieldProps extends TextInputProps {
  label?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, style, ...props }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
  <View style={styles.wrapper}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <TextInput
      placeholderTextColor={theme.subtext}
      style={[styles.input, style]}
      {...props}
    />
  </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    color: theme.placeholder,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: theme.surfaceHigh,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 14,
  },
});

export default FormField;
