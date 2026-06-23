import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StaffMember } from '../types';
import { fmtDate } from '../utils';
import { LIBRARY_COLORS } from '../theme';
import LibraryButton from './LibraryButton';

interface StaffTabProps {
  staff: StaffMember[];
  onAddPress: () => void;
  onRemove: (id: string) => void;
}

const StaffTab: React.FC<StaffTabProps> = ({ staff, onAddPress, onRemove }) => (
  <View style={styles.wrapper}>
    <View style={styles.header}>
      <LibraryButton onPress={onAddPress} size="sm">+ Add Staff</LibraryButton>
    </View>

    <FlatList
      data={staff}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.role}>{item.role}</Text>
            </View>
          </View>

          <View style={styles.contactList}>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={14} color={LIBRARY_COLORS.textMuted} />
              <Text style={styles.contactText}>{item.email}</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={14} color={LIBRARY_COLORS.textMuted} />
              <Text style={styles.contactText}>{item.phone || '—'}</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="calendar-outline" size={14} color={LIBRARY_COLORS.textMuted} />
              <Text style={styles.contactText}>Since {fmtDate(item.since)}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <LibraryButton variant="danger" size="sm" onPress={() => onRemove(item.id)}>
              Remove
            </LibraryButton>
          </View>
        </View>
      )}
    />
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  listContent: {
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    backgroundColor: LIBRARY_COLORS.surface,
    borderWidth: 1,
    borderColor: LIBRARY_COLORS.borderLight,
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: LIBRARY_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    color: LIBRARY_COLORS.text,
    fontSize: 16,
  },
  role: {
    color: LIBRARY_COLORS.textDim,
    fontSize: 13,
    marginTop: 2,
  },
  contactList: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    color: LIBRARY_COLORS.textMuted,
    fontSize: 13,
    flex: 1,
  },
  footer: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
});

export default StaffTab;
