import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CirculationStatus } from '../types';
import { LIBRARY_COLORS } from '../theme';

interface StatusBadgeProps {
  status: CirculationStatus;
}

const STATUS_MAP: Record<CirculationStatus, { bg: string; color: string; label: string }> = {
  issued: { bg: LIBRARY_COLORS.blueBg, color: LIBRARY_COLORS.primaryLight, label: 'ISSUED' },
  returned: { bg: LIBRARY_COLORS.successBg, color: LIBRARY_COLORS.success, label: 'RETURNED' },
  overdue: { bg: LIBRARY_COLORS.dangerBg, color: LIBRARY_COLORS.danger, label: 'OVERDUE' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = STATUS_MAP[status];

  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.color + '33' }]}>
      <Text style={[styles.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
});

export default StatusBadge;
