export type CirculationStatus = 'issued' | 'returned' | 'overdue';

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  copies: number;
  available: number;
  cover: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  since: string;
}

export interface CirculationRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  copyNum: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: CirculationStatus;
}

export type LibraryTab = 'circulation' | 'catalog' | 'categories' | 'staff';

export interface IssueForm {
  bookId: string;
  studentId: string;
  days: number;
}

export interface AddBookForm {
  isbn: string;
  title: string;
  author: string;
  category: string;
  copies: number;
}

export interface AddStaffForm {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface PickerOption {
  label: string;
  value: string;
}
