import React from 'react';
import { View, Text, TextInput, FlatList, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Book } from '../types';
import { LIBRARY_COLORS } from '../theme';
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
  const categoryOptions = [
    { label: 'All Categories', value: 'all' },
    ...categories.map(c => ({ label: c, value: c })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={LIBRARY_COLORS.textDim} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author, or ISBN…"
            placeholderTextColor={LIBRARY_COLORS.textDim}
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
            <Ionicons name="book-outline" size={40} color={LIBRARY_COLORS.textDim} />
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
                <Text style={[styles.statValue, { color: item.available > 0 ? LIBRARY_COLORS.success : LIBRARY_COLORS.danger }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIBRARY_COLORS.surface,
    borderWidth: 1,
    borderColor: LIBRARY_COLORS.borderLight,
    borderRadius: 14,
    overflow: 'hidden',
  },
  toolbar: {
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: LIBRARY_COLORS.borderLight,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIBRARY_COLORS.card,
    borderWidth: 1,
    borderColor: LIBRARY_COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: LIBRARY_COLORS.text,
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
    backgroundColor: LIBRARY_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIBRARY_COLORS.border,
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
    color: LIBRARY_COLORS.text,
    fontSize: 15,
  },
  author: {
    color: LIBRARY_COLORS.textMuted,
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
    backgroundColor: LIBRARY_COLORS.blueBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  categoryText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  isbn: {
    color: LIBRARY_COLORS.textDim,
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
    color: LIBRARY_COLORS.textDim,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontWeight: '700',
    color: LIBRARY_COLORS.textSecondary,
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
    color: '#4B5563',
    fontSize: 14,
  },
});

export default CatalogTab;
