import React from 'react';
import { useTheme } from '../../../store/ThemeContext';
import { Theme, withAlpha } from '../../../constants/theme';
import { View, Text, TextInput, FlatList, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Book } from '../types';

import LibraryButton from './LibraryButton';
import PickerField from './PickerField';

interface CatalogTabProps {
  rows: Book[];
  categories: string[];
  filter: string;
  category: string;
  onFilterChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onAddPress: () => void;
  onDelete: (id: string) => void;
}

const CatalogTab: React.FC<CatalogTabProps> = ({
  rows,
  categories,
  filter,
  category,
  onFilterChange,
  onCategoryChange,
  onAddPress,
  onDelete,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const categoryOptions = [
    { label: 'All Categories', value: 'all' },
    ...categories.map(c => ({ label: c, value: c })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={theme.subtext} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author, or ISBN…"
            placeholderTextColor={theme.subtext}
            value={filter}
            onChangeText={onFilterChange}
          />
        </View>
        <View style={styles.pickerWrap}>
          <PickerField
            value={category}
            options={categoryOptions}
            onSelect={onCategoryChange}
            placeholder="All Categories"
          />
        </View>
        <LibraryButton onPress={onAddPress} size="sm">+ Add Book</LibraryButton>
      </View>

      <FlatList
        data={rows}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={40} color={theme.subtext} />
            <Text style={styles.emptyText}>No books found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cover}>{item.cover}</Text>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.author}>{item.author}</Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <Text style={styles.isbn}>{item.isbn}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Copies</Text>
                <Text style={styles.statValue}>{item.copies}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Available</Text>
                <Text style={[styles.statValue, { color: item.available > 0 ? theme.success : theme.danger }]}>
                  {item.available}
                </Text>
              </View>
              <LibraryButton variant="danger" size="sm" onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
                Remove
              </LibraryButton>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  toolbar: {
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  cover: {
    fontSize: 28,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    color: theme.text,
    fontSize: 15,
  },
  author: {
    color: theme.placeholder,
    fontSize: 13,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryPill: {
    backgroundColor: theme.infoBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  categoryText: {
    color: theme.info,
    fontSize: 12,
    fontWeight: '600',
  },
  isbn: {
    color: theme.subtext,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: theme.subtext,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontWeight: '700',
    color: theme.textSecondary,
    fontSize: 16,
  },
  deleteBtn: {
    marginLeft: 'auto',
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

export default CatalogTab;
