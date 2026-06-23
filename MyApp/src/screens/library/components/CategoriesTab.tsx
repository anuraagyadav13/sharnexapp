import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Book } from '../types';
import { LIBRARY_COLORS } from '../theme';
import LibraryButton from './LibraryButton';

interface CategoriesTabProps {
  categories: string[];
  books: Book[];
  onAddPress: () => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ categories, books, onAddPress }) => (
  <View style={styles.wrapper}>
    <View style={styles.header}>
      <LibraryButton onPress={onAddPress} size="sm">+ Add Category</LibraryButton>
    </View>

    <FlatList
      data={categories}
      keyExtractor={item => item}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContent}
      renderItem={({ item: cat }) => {
        const count = books.filter(b => b.category === cat).length;
        const barWidth = Math.max(10, books.length ? (count / books.length) * 100 : 10);

        return (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.emoji}>🏷️</Text>
              <View style={styles.countPill}>
                <Text style={styles.countText}>{count} books</Text>
              </View>
            </View>
            <Text style={styles.name}>{cat}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${barWidth}%` }]} />
            </View>
          </View>
        );
      }}
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
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: LIBRARY_COLORS.surface,
    borderWidth: 1,
    borderColor: LIBRARY_COLORS.borderLight,
    borderRadius: 12,
    padding: 16,
    minWidth: '46%',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  emoji: {
    fontSize: 22,
  },
  countPill: {
    backgroundColor: LIBRARY_COLORS.blueBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  countText: {
    color: LIBRARY_COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  name: {
    fontWeight: '700',
    color: LIBRARY_COLORS.text,
    fontSize: 15,
    marginBottom: 10,
  },
  barTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: LIBRARY_COLORS.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: LIBRARY_COLORS.primary,
  },
});

export default CategoriesTab;
