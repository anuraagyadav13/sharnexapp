import { useMemo, useState } from 'react';
import {
  DEFAULT_CATEGORIES,
  INITIAL_BOOKS,
  INITIAL_CIRCULATION,
  INITIAL_STAFF,
  INITIAL_STUDENTS,
} from '../constants';
import {
  AddBookForm,
  AddStaffForm,
  Book,
  CirculationRecord,
  CirculationStatus,
  IssueForm,
  LibraryTab,
  StaffMember,
} from '../types';
import { addDays, isOverdue, today, uid } from '../utils';

export type ToastHandler = (message: string, type?: 'success' | 'error') => void;

export function useLibraryManagement(showToast: ToastHandler) {
  const [tab, setTab] = useState<LibraryTab>('circulation');
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [circulation, setCirculation] = useState<CirculationRecord[]>(INITIAL_CIRCULATION);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState<CirculationRecord | null>(null);

  const [circFilter, setCircFilter] = useState('');
  const [circStatus, setCircStatus] = useState('all');
  const [bookFilter, setBookFilter] = useState('');
  const [bookCat, setBookCat] = useState('all');

  const [issueForm, setIssueForm] = useState<IssueForm>({ bookId: '', studentId: '', days: 14 });
  const [addBookForm, setAddBookForm] = useState<AddBookForm>({
    isbn: '', title: '', author: '', category: 'Fiction', copies: 1,
  });
  const [addStaffForm, setAddStaffForm] = useState<AddStaffForm>({
    name: '', role: 'Assistant Librarian', email: '', phone: '',
  });
  const [newCategory, setNewCategory] = useState('');

  const totalBooks = books.reduce((s, b) => s + b.copies, 0);
  const activeIssues = circulation.filter(c => c.status === 'issued').length;
  const overdueCount = circulation.filter(
    c => c.status === 'overdue' || (c.status === 'issued' && isOverdue(c.dueDate, c.returnDate)),
  ).length;

  const circRows = useMemo(() => {
    return circulation.filter(c => {
      const lc = circFilter.toLowerCase();
      const matchText = !lc || c.bookTitle.toLowerCase().includes(lc) || c.studentName.toLowerCase().includes(lc);
      const matchStatus = circStatus === 'all' || c.status === circStatus;
      return matchText && matchStatus;
    });
  }, [circulation, circFilter, circStatus]);

  const catalogRows = useMemo(() => {
    return books.filter(b => {
      const lc = bookFilter.toLowerCase();
      const matchText = !lc || b.title.toLowerCase().includes(lc) || b.author.toLowerCase().includes(lc) || b.isbn.includes(lc);
      const matchCat = bookCat === 'all' || b.category === bookCat;
      return matchText && matchCat;
    });
  }, [books, bookFilter, bookCat]);

  function handleReturn(circ: CirculationRecord) {
    setReturnTarget(circ);
  }

  function confirmReturn() {
    if (!returnTarget) return;
    setCirculation(prev =>
      prev.map(c =>
        c.id === returnTarget.id ? { ...c, status: 'returned' as CirculationStatus, returnDate: today() } : c,
      ),
    );
    setBooks(prev =>
      prev.map(b => (b.id === returnTarget.bookId ? { ...b, available: b.available + 1 } : b)),
    );
    showToast(`"${returnTarget.bookTitle}" returned successfully`);
    setReturnTarget(null);
  }

  function handleIssue() {
    const book = books.find(b => b.id === issueForm.bookId);
    const student = INITIAL_STUDENTS.find(s => s.id === issueForm.studentId);
    if (!book || !student) {
      showToast('Select a book and student', 'error');
      return;
    }
    if (book.available < 1) {
      showToast('No copies available', 'error');
      return;
    }
    const issue = today();
    const due = addDays(issue, issueForm.days);
    const circ: CirculationRecord = {
      id: 'circ' + uid(),
      bookId: book.id,
      bookTitle: book.title,
      copyNum: String(Math.floor(Math.random() * 9000 + 1000)),
      studentId: student.id,
      studentName: student.name,
      issueDate: issue,
      dueDate: due,
      returnDate: null,
      status: 'issued',
    };
    setCirculation(prev => [circ, ...prev]);
    setBooks(prev => prev.map(b => (b.id === book.id ? { ...b, available: b.available - 1 } : b)));
    showToast(`"${book.title}" issued to ${student.name}`);
    setShowIssueModal(false);
    setIssueForm({ bookId: '', studentId: '', days: 14 });
  }

  function handleAddBook() {
    const { isbn, title, author, category, copies } = addBookForm;
    if (!title || !author) {
      showToast('Title and author are required', 'error');
      return;
    }
    const book: Book = {
      id: 'b' + uid(),
      isbn: isbn || 'N/A',
      title,
      author,
      category,
      copies: Number(copies),
      available: Number(copies),
      cover: '📘',
    };
    setBooks(prev => [...prev, book]);
    showToast(`"${title}" added to catalog`);
    setShowAddBookModal(false);
    setAddBookForm({ isbn: '', title: '', author: '', category: 'Fiction', copies: 1 });
  }

  function handleDeleteBook(id: string) {
    const b = books.find(x => x.id === id);
    if (circulation.some(c => c.bookId === id && c.status === 'issued')) {
      showToast('Cannot delete — copies currently issued', 'error');
      return;
    }
    setBooks(prev => prev.filter(x => x.id !== id));
    if (b) showToast(`"${b.title}" removed`);
  }

  function handleAddStaff() {
    const { name, role, email, phone } = addStaffForm;
    if (!name || !email) {
      showToast('Name and email required', 'error');
      return;
    }
    setStaff(prev => [...prev, { id: 'stf' + uid(), name, role, email, phone, since: today() }]);
    showToast(`${name} added to staff`);
    setShowAddStaffModal(false);
    setAddStaffForm({ name: '', role: 'Assistant Librarian', email: '', phone: '' });
  }

  function handleRemoveStaff(id: string) {
    const s = staff.find(x => x.id === id);
    setStaff(prev => prev.filter(x => x.id !== id));
    if (s) showToast(`${s.name} removed`);
  }

  function handleAddCategory() {
    const cat = newCategory.trim();
    if (!cat || categories.includes(cat)) {
      showToast('Invalid or duplicate category', 'error');
      return;
    }
    setCategories(prev => [...prev, cat]);
    showToast(`Category "${cat}" added`);
    setNewCategory('');
    setShowAddCategoryModal(false);
  }

  return {
    tab,
    setTab,
    books,
    staff,
    circulation,
    categories,
    students: INITIAL_STUDENTS,
    stats: { totalBooks, activeIssues, overdueCount, staffCount: staff.length, categoryCount: categories.length },
    circFilter,
    setCircFilter,
    circStatus,
    setCircStatus,
    bookFilter,
    setBookFilter,
    bookCat,
    setBookCat,
    circRows,
    catalogRows,
    modals: {
      showIssueModal,
      setShowIssueModal,
      showAddBookModal,
      setShowAddBookModal,
      showAddStaffModal,
      setShowAddStaffModal,
      showAddCategoryModal,
      setShowAddCategoryModal,
      returnTarget,
      setReturnTarget,
    },
    forms: {
      issueForm,
      setIssueForm,
      addBookForm,
      setAddBookForm,
      addStaffForm,
      setAddStaffForm,
      newCategory,
      setNewCategory,
    },
    actions: {
      handleReturn,
      confirmReturn,
      handleIssue,
      handleAddBook,
      handleDeleteBook,
      handleAddStaff,
      handleRemoveStaff,
      handleAddCategory,
    },
  };
}

export type LibraryManagement = ReturnType<typeof useLibraryManagement>;
