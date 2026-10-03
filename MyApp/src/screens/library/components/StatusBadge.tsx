import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CirculationStatus } from '../types';
import { useTheme } from '../../../store/ThemeContext';

interface StatusBadgeProps {
  status: CirculationStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { theme } = useTheme();

  const STATUS_MAP: Record<CirculationStatus, { bg: string; color: string; label: string }> = {
    issued: { bg: theme.infoBg, color: theme.info, label: 'ISSUED' },
    returned: { bg: theme.successBg, color: theme.success, label: 'RETURNED' },
    overdue: { bg: theme.dangerBg, color: theme.danger, label: 'OVERDUE' },
  };

  const s = STATUS_MAP[status];

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

  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.color + '33' }]}>
      <Text style={[styles.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
};

export default StatusBadge;
