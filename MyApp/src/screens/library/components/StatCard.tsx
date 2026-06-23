import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ACCENT_MAP, AccentColor, LIBRARY_COLORS } from '../theme';

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  accent: AccentColor;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, accent }) => {
  const colors = ACCENT_MAP[accent];

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

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIBRARY_COLORS.card,
    borderWidth: 1,
    borderColor: LIBRARY_COLORS.border,
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
    color: LIBRARY_COLORS.textDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    color: LIBRARY_COLORS.text,
    lineHeight: 28,
  },
});

export default StatCard;
