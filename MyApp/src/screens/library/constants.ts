import { Book, CirculationRecord, LibraryTab, StaffMember, Student } from './types';

export const INITIAL_BOOKS: Book[] = [
  { id: 'b001', isbn: '9780061122415', title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', copies: 3, available: 2, cover: '📘' },
  { id: 'b002', isbn: '9780061120084', title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Classic', copies: 2, available: 2, cover: '📗' },
  { id: 'b003', isbn: '9780743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Classic', copies: 2, available: 1, cover: '📙' },
  { id: 'b004', isbn: '9780385333481', title: "The Handmaid's Tale", author: 'Margaret Atwood', category: 'Dystopian', copies: 2, available: 2, cover: '📕' },
  { id: 'b005', isbn: '9780316769174', title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction', copies: 1, available: 1, cover: '📘' },
  { id: 'b006', isbn: '9780140283334', title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', category: 'Classic', copies: 2, available: 2, cover: '📗' },
  { id: 'b007', isbn: '9780679720201', title: '1984', author: 'George Orwell', category: 'Dystopian', copies: 3, available: 3, cover: '📙' },
  { id: 'b008', isbn: '9780140177398', title: 'Brave New World', author: 'Aldous Huxley', category: 'Dystopian', copies: 2, available: 2, cover: '📕' },
  { id: 'b009', isbn: '9780385490818', title: 'The Old Man and the Sea', author: 'Ernest Hemingway', category: 'Fiction', copies: 2, available: 2, cover: '📘' },
  { id: 'b010', isbn: '9780062315007', title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', category: 'Children', copies: 3, available: 3, cover: '📗' },
];

export const INITIAL_STUDENTS: Student[] = [
  { id: 'stu-1767956039715-f5zf916', name: 'Shubham Mangal', email: 'shubham@school.edu', grade: '10-A' },
  { id: 'stu-2847063920461-g7ah127', name: 'Priya Sharma', email: 'priya@school.edu', grade: '11-B' },
  { id: 'stu-3958174031572-h8bi238', name: 'Arjun Patel', email: 'arjun@school.edu', grade: '9-C' },
  { id: 'stu-4069285142683-i9cj349', name: 'Kavya Reddy', email: 'kavya@school.edu', grade: '12-A' },
  { id: 'stu-5170396253794-j0dk450', name: 'Rohan Verma', email: 'rohan@school.edu', grade: '10-B' },
];

export const INITIAL_STAFF: StaffMember[] = [
  { id: 'stf001', name: 'Mrs. Anitha Rao', role: 'Head Librarian', email: 'anitha@school.edu', phone: '+91 98765 43210', since: '2018-06-01' },
  { id: 'stf002', name: 'Mr. Deepak Kumar', role: 'Assistant Librarian', email: 'deepak@school.edu', phone: '+91 87654 32109', since: '2021-03-15' },
];

export const INITIAL_CIRCULATION: CirculationRecord[] = [
  {
    id: 'circ001', bookId: 'b001', bookTitle: 'The Alchemist', copyNum: '1077',
    studentId: 'stu-1767956039715-f5zf916', studentName: 'Shubham Mangal',
    issueDate: '2026-06-04', dueDate: '2026-06-25', returnDate: null, status: 'issued',
  },
  {
    id: 'circ002', bookId: 'b002', bookTitle: 'To Kill a Mockingbird', copyNum: '3252',
    studentId: 'stu-1767956039715-f5zf916', studentName: 'Shubham Mangal',
    issueDate: '2026-04-09', dueDate: '2026-04-22', returnDate: '2026-04-20', status: 'returned',
  },
  {
    id: 'circ003', bookId: 'b003', bookTitle: 'The Great Gatsby', copyNum: '0891',
    studentId: 'stu-2847063920461-g7ah127', studentName: 'Priya Sharma',
    issueDate: '2026-05-15', dueDate: '2026-05-29', returnDate: null, status: 'overdue',
  },
];

export const DEFAULT_CATEGORIES = ['Fiction', 'Classic', 'Dystopian', 'Children', 'Science', 'History', 'Biography', 'Mystery'];

export const LIBRARY_TABS: { id: LibraryTab; label: string; icon: string }[] = [
  { id: 'circulation', label: 'Circulation', icon: 'sync-outline' },
  { id: 'catalog', label: 'Catalog', icon: 'library-outline' },
  { id: 'categories', label: 'Categories', icon: 'pricetag-outline' },
  { id: 'staff', label: 'Library Staff', icon: 'person-outline' },
];

export const STAFF_ROLES = ['Head Librarian', 'Assistant Librarian', 'Catalog Manager', 'Library Aide'];

export const CIRCULATION_STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Issued', value: 'issued' },
  { label: 'Returned', value: 'returned' },
  { label: 'Overdue', value: 'overdue' },
];
