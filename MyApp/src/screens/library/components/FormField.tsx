import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { LIBRARY_COLORS } from '../theme';

interface FormFieldProps extends TextInputProps {
  label?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, style, ...props }) => (
  <View style={styles.wrapper}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <TextInput
      placeholderTextColor={LIBRARY_COLORS.textDim}
      style={[styles.input, style]}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    color: LIBRARY_COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: LIBRARY_COLORS.inputBg,
    borderWidth: 1,
    borderColor: LIBRARY_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: LIBRARY_COLORS.text,
    fontSize: 14,
  },
});

export default FormField;
