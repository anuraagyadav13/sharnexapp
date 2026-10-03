import React from 'react';
import { useTheme } from '../../../store/ThemeContext';
import { withAlpha } from '../../../constants/theme';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CirculationRecord, CirculationStatus } from '../types';
import { fmtDate, isOverdue } from '../utils';

import StatusBadge from './StatusBadge';
import LibraryButton from './LibraryButton';
import PickerField from './PickerField';
import { CIRCULATION_STATUS_OPTIONS } from '../constants';

interface CirculationTabProps {
  rows: CirculationRecord[];
  filter: string;
  status: string;
  onFilterChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onIssuePress: () => void;
  onReturn: (record: CirculationRecord) => void;
}

function getDisplayStatus(record: CirculationRecord): CirculationStatus {
  if (record.status === 'issued' && isOverdue(record.dueDate, record.returnDate)) {
    return 'overdue';
  }
  return record.status;
}

const CirculationTab: React.FC<CirculationTabProps> = ({
  rows,
  filter,
  status,
  onFilterChange,
  onStatusChange,
  onIssuePress,
  onReturn,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const statusOptions = CIRCULATION_STATUS_OPTIONS.map(o => ({ label: o.label, value: o.value }));

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={theme.subtext} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by book or student…"
            placeholderTextColor={theme.subtext}
            value={filter}
            onChangeText={onFilterChange}
          />
        </View>
        <View style={styles.pickerWrap}>
          <PickerField
            value={status}
            options={statusOptions}
            onSelect={onStatusChange}
            placeholder="All Statuses"
          />
        </View>
        <LibraryButton onPress={onIssuePress} size="sm">+ Issue Book</LibraryButton>
      </View>

      <FlatList
        data={rows}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={40} color={theme.subtext} />
            <Text style={styles.emptyText}>No records found.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const displayStatus = getDisplayStatus(item);
          const overdue = displayStatus === 'overdue';
          const canReturn = item.status === 'issued' || overdue;

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>{item.bookTitle}</Text>
                  <Text style={styles.copyId}>
                    COPY #{item.bookId.toUpperCase()}-{item.copyNum}
                  </Text>
                </View>
                <StatusBadge status={displayStatus} />
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Student</Text>
                  <Text style={styles.metaValue}>{item.studentName}</Text>
                  <Text style={styles.metaSub}>ID: {item.studentId}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Dates</Text>
                  <Text style={styles.dateOut}>OUT: {fmtDate(item.issueDate)}</Text>
                  <Text style={[styles.dateDue, overdue && styles.dateOverdue]}>
                    DUE: {fmtDate(item.dueDate)}
                  </Text>
                  {item.returnDate ? (
                    <Text style={styles.dateRet}>RET: {fmtDate(item.returnDate)}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.cardFooter}>
                {canReturn ? (
                  <LibraryButton variant="ghost" size="sm" onPress={() => onReturn(item)}>
                    ↩ Return
                  </LibraryButton>
                ) : (
                  <TouchableOpacity disabled>
                    <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 14,
    overflow: 'hidden',
  },
  toolbar: {
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 13,
  },
  pickerWrap: {
    marginBottom: -14,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontWeight: '700',
    color: theme.text,
    fontSize: 15,
  },
  copyId: {
    color: theme.primary,
    fontSize: 11,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metaValue: {
    fontWeight: '600',
    color: theme.border,
    fontSize: 13,
  },
  metaSub: {
    color: theme.subtext,
    fontSize: 11,
    marginTop: 2,
  },
  dateOut: {
    color: theme.placeholder,
    fontSize: 12,
  },
  dateDue: {
    fontWeight: '700',
    color: theme.text,
    fontSize: 13,
    marginTop: 2,
  },
  dateOverdue: {
    color: theme.danger,
  },
  dateRet: {
    color: theme.success,
    fontSize: 12,
    marginTop: 2,
  },
  cardFooter: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyText: {
    color: theme.subtext,
    fontSize: 14,
  },
});

export default CirculationTab;
