import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../store/ThemeContext';

export type AccentColor = 'blue' | 'purple' | 'red' | 'amber' | 'green';

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  accent: AccentColor;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, accent }) => {
  const { theme } = useTheme();

  const accentColors = useMemo(() => ({
    blue:   { bg: theme.infoBg,    icon: theme.info },
    purple: { bg: theme.iconBackground, icon: theme.accent },
    red:    { bg: theme.dangerBg,  icon: theme.danger },
    amber:  { bg: theme.warningBg, icon: theme.warning },
    green:  { bg: theme.successBg, icon: theme.success },
  }), [theme]);

  const colors = accentColors[accent];

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minWidth: 160,
      marginRight: 12,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      fontSize: 22,
    },
    content: {
      flex: 1,
    },
    label: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    value: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.text,
      lineHeight: 28,
    },
  }), [theme]);

  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: colors.bg }]}>
        <Text style={[styles.icon, { color: colors.icon }]}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
};

export default StatCard;
