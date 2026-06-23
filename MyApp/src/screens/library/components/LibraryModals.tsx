import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LibraryModal from './LibraryModal';
import FormField from './FormField';
import PickerField from './PickerField';
import LibraryButton from './LibraryButton';
import { LibraryManagement } from '../hooks/useLibraryManagement';
import { STAFF_ROLES } from '../constants';
import { addDays, fmtDate, today } from '../utils';
import { LIBRARY_COLORS } from '../theme';

interface LibraryModalsProps {
  library: LibraryManagement;
}

const LibraryModals: React.FC<LibraryModalsProps> = ({ library }) => {
  const { modals, forms, books, students, categories, actions } = library;
  const { issueForm, setIssueForm, addBookForm, setAddBookForm, addStaffForm, setAddStaffForm, newCategory, setNewCategory } = forms;

  const availableBooks = books
    .filter(b => b.available > 0)
    .map(b => ({ label: `${b.title} (${b.available} available)`, value: b.id }));

  const studentOptions = students.map(s => ({
    label: `${s.name} · ${s.grade}`,
    value: s.id,
  }));

  const categoryOptions = categories.map(c => ({ label: c, value: c }));
  const staffRoleOptions = STAFF_ROLES.map(r => ({ label: r, value: r }));

  return (
    <>
      <LibraryModal
        visible={modals.showIssueModal}
        title="Issue a Book"
        onClose={() => modals.setShowIssueModal(false)}
      >
        <PickerField
          label="Select Book"
          value={issueForm.bookId}
          options={availableBooks}
          placeholder="— Choose a book —"
          onSelect={v => setIssueForm(p => ({ ...p, bookId: v }))}
        />
        <PickerField
          label="Select Student"
          value={issueForm.studentId}
          options={studentOptions}
          placeholder="— Choose a student —"
          onSelect={v => setIssueForm(p => ({ ...p, studentId: v }))}
        />
        <FormField
          label="Loan Period (days)"
          keyboardType="number-pad"
          value={String(issueForm.days)}
          onChangeText={v => setIssueForm(p => ({ ...p, days: Number(v) || 1 }))}
        />
        {issueForm.bookId && issueForm.studentId ? (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              📅 Due date: <Text style={styles.hintBold}>{fmtDate(addDays(today(), issueForm.days))}</Text>
            </Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          <LibraryButton variant="ghost" onPress={() => modals.setShowIssueModal(false)}>Cancel</LibraryButton>
          <LibraryButton onPress={actions.handleIssue}>Issue Book</LibraryButton>
        </View>
      </LibraryModal>

      <LibraryModal
        visible={!!modals.returnTarget}
        title="Confirm Return"
        onClose={() => modals.setReturnTarget(null)}
      >
        <Text style={styles.confirmText}>
          Mark <Text style={styles.confirmBold}>"{modals.returnTarget?.bookTitle}"</Text> as returned by{' '}
          <Text style={styles.confirmBold}>{modals.returnTarget?.studentName}</Text>?
        </Text>
        <View style={styles.actions}>
          <LibraryButton variant="ghost" onPress={() => modals.setReturnTarget(null)}>Cancel</LibraryButton>
          <LibraryButton variant="success" onPress={actions.confirmReturn}>✓ Confirm Return</LibraryButton>
        </View>
      </LibraryModal>

      <LibraryModal
        visible={modals.showAddBookModal}
        title="Add New Book"
        onClose={() => modals.setShowAddBookModal(false)}
      >
        <FormField
          label="ISBN"
          placeholder="e.g. 9780061122415"
          value={addBookForm.isbn}
          onChangeText={v => setAddBookForm(p => ({ ...p, isbn: v }))}
        />
        <FormField
          label="Title *"
          placeholder="Book title"
          value={addBookForm.title}
          onChangeText={v => setAddBookForm(p => ({ ...p, title: v }))}
        />
        <FormField
          label="Author *"
          placeholder="Author name"
          value={addBookForm.author}
          onChangeText={v => setAddBookForm(p => ({ ...p, author: v }))}
        />
        <PickerField
          label="Category"
          value={addBookForm.category}
          options={categoryOptions}
          onSelect={v => setAddBookForm(p => ({ ...p, category: v }))}
        />
        <FormField
          label="Number of Copies"
          keyboardType="number-pad"
          value={String(addBookForm.copies)}
          onChangeText={v => setAddBookForm(p => ({ ...p, copies: Number(v) || 1 }))}
        />
        <View style={styles.actions}>
          <LibraryButton variant="ghost" onPress={() => modals.setShowAddBookModal(false)}>Cancel</LibraryButton>
          <LibraryButton onPress={actions.handleAddBook}>Add Book</LibraryButton>
        </View>
      </LibraryModal>

      <LibraryModal
        visible={modals.showAddStaffModal}
        title="Add Staff Member"
        onClose={() => modals.setShowAddStaffModal(false)}
      >
        <FormField
          label="Full Name *"
          placeholder="e.g. Ms. Sunita Joshi"
          value={addStaffForm.name}
          onChangeText={v => setAddStaffForm(p => ({ ...p, name: v }))}
        />
        <PickerField
          label="Role"
          value={addStaffForm.role}
          options={staffRoleOptions}
          onSelect={v => setAddStaffForm(p => ({ ...p, role: v }))}
        />
        <FormField
          label="Email *"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="staff@school.edu"
          value={addStaffForm.email}
          onChangeText={v => setAddStaffForm(p => ({ ...p, email: v }))}
        />
        <FormField
          label="Phone"
          keyboardType="phone-pad"
          placeholder="+91 98765 43210"
          value={addStaffForm.phone}
          onChangeText={v => setAddStaffForm(p => ({ ...p, phone: v }))}
        />
        <View style={styles.actions}>
          <LibraryButton variant="ghost" onPress={() => modals.setShowAddStaffModal(false)}>Cancel</LibraryButton>
          <LibraryButton onPress={actions.handleAddStaff}>Add Staff</LibraryButton>
        </View>
      </LibraryModal>

      <LibraryModal
        visible={modals.showAddCategoryModal}
        title="Add Category"
        onClose={() => modals.setShowAddCategoryModal(false)}
      >
        <FormField
          label="Category Name *"
          placeholder="e.g. Philosophy"
          value={newCategory}
          onChangeText={setNewCategory}
        />
        <View style={styles.actions}>
          <LibraryButton variant="ghost" onPress={() => modals.setShowAddCategoryModal(false)}>Cancel</LibraryButton>
          <LibraryButton onPress={actions.handleAddCategory}>Add Category</LibraryButton>
        </View>
      </LibraryModal>
    </>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  hintBox: {
    backgroundColor: '#0A1628',
    borderWidth: 1,
    borderColor: LIBRARY_COLORS.blueBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  hintText: {
    fontSize: 13,
    color: '#93C5FD',
  },
  hintBold: {
    fontWeight: '700',
  },
  confirmText: {
    color: LIBRARY_COLORS.textMuted,
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 22,
  },
  confirmBold: {
    color: LIBRARY_COLORS.text,
    fontWeight: '700',
  },
});

export default LibraryModals;
