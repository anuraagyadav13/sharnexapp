import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/api';

// --- Interfaces for Library Management API ---

export interface LibraryBookItem {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  categoryId?: string;
  categoryName?: string;
  publisher?: string;
  edition?: string;
  language?: string;
  description?: string;
  availableCopies: number;
  totalCopies: number;
  createdAt?: string;
}

export interface LibraryBookPayload {
  title: string;
  author?: string;
  isbn?: string;
  categoryId?: string;
  initialCopies?: number;
  publisher?: string;
  edition?: string;
  language?: string;
  description?: string;
}

export interface LibraryCategory {
  id: string;
  name: string;
  description?: string;
  assetCount?: number;
  created_at?: string;
}

export interface LibraryIssue {
  id: string;
  studentId: string;
  studentName?: string;
  studentRollNumber?: string;
  bookId: string;
  bookTitle?: string;
  isbn?: string;
  copyNumber?: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | string;
  fineAmount?: number;
  fineWaived?: boolean;
}

export interface LibraryDashboardStatsData {
  totalBooks: number;
  totalCopies?: number;
  issuedBooks: number;
  activeIssues?: number;
  overdueBooks: number;
  overdueCount?: number;
  totalCategories: number;
}

export interface LibrarySettingsData {
  maxBooksPerStudent?: number;
  defaultLoanDays?: number;
  finePerDay?: number;
  gracePeriodDays?: number;
}

export interface ListBooksQuery {
  search?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}

export interface ListIssuesQuery {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

const libraryService = {
  // --- BOOKS ---
  listBooks(query?: ListBooksQuery) {
    let url = `/library/books?limit=${query?.limit || 50}&offset=${query?.offset || 0}`;
    if (query?.search) url += `&search=${encodeURIComponent(query.search)}`;
    if (query?.categoryId && query.categoryId !== 'all') url += `&categoryId=${query.categoryId}`;
    return apiClient.get<{ data: { items: LibraryBookItem[]; pagination: { total: number } } }>(url);
  },

  createBook(payload: LibraryBookPayload) {
    return apiClient.post<{ data: LibraryBookItem; message: string }>('/library/books', payload);
  },

  getBookDetail(bookId: string) {
    return apiClient.get<{ data: LibraryBookItem }>(`/library/books/${bookId}`);
  },

  updateBook(bookId: string, payload: Partial<LibraryBookPayload>) {
    return apiClient.put<{ message: string }>(`/library/books/${bookId}`, payload);
  },

  deleteBook(bookId: string) {
    return apiClient.delete<{ message: string }>(`/library/books/${bookId}`);
  },

  bulkImportBooks(books: LibraryBookPayload[]) {
    return apiClient.post<{ data: any[]; message: string }>('/library/books/bulk', { books });
  },

  listBookCopies(bookId: string, query?: { limit?: number; offset?: number }) {
    return apiClient.get<{ data: any[] }>(
      `/library/books/${bookId}/copies?limit=${query?.limit || 20}&offset=${query?.offset || 0}`
    );
  },

  addBookCopies(bookId: string, copies: number) {
    return apiClient.post<{ data: any; message: string }>(`/library/books/${bookId}/copies`, { copies });
  },

  updateCopy(copyId: string, payload: any) {
    return apiClient.put<{ message: string }>(`/library/copies/${copyId}`, payload);
  },

  retireCopy(copyId: string) {
    return apiClient.delete<{ message: string }>(`/library/copies/${copyId}`);
  },

  // --- CIRCULATION ---
  listIssues(query?: ListIssuesQuery) {
    let url = `/library/issues?limit=${query?.limit || 50}&offset=${query?.offset || 0}`;
    if (query?.status && query.status !== 'all') url += `&status=${encodeURIComponent(query.status)}`;
    if (query?.search) url += `&search=${encodeURIComponent(query.search)}`;
    return apiClient.get<{ data: { items: LibraryIssue[]; pagination: { total: number } } }>(url);
  },

  issueBook(payload: { studentId: string; bookId?: string; copyId?: string; dueDate?: string }) {
    return apiClient.post<{ data: any; message: string }>('/library/issues', payload);
  },

  getIssueDetail(issueId: string) {
    return apiClient.get<{ data: LibraryIssue }>(`/library/issues/${issueId}`);
  },

  returnBook(issueId: string, payload?: any) {
    return apiClient.post<{ data: any; message: string }>(`/library/issues/${issueId}/return`, payload || {});
  },

  waiveFine(issueId: string, payload: { reason?: string }) {
    return apiClient.post<{ message: string }>(`/library/issues/${issueId}/waive-fine`, payload);
  },

  markLost(payload: { issueId: string; note?: string }) {
    return apiClient.post<{ data: any; message: string }>('/library/issues/mark-lost', payload);
  },

  listOverdueIssues(query?: { limit?: number; offset?: number }) {
    return apiClient.get<{ data: { items: LibraryIssue[] } }>(
      `/library/issues/overdue?limit=${query?.limit || 50}&offset=${query?.offset || 0}`
    );
  },

  flagOverdueIssues() {
    return apiClient.post<{ data: any; message: string }>('/library/issues/overdue', {});
  },

  // --- CATEGORIES ---
  listCategories() {
    return apiClient.get<{ data: LibraryCategory[] }>('/library/categories');
  },

  createCategory(payload: { name: string; description?: string }) {
    return apiClient.post<{ data: LibraryCategory; message: string }>('/library/categories', payload);
  },

  updateCategory(categoryId: string, payload: { name?: string; description?: string }) {
    return apiClient.put<{ message: string }>(`/library/categories/${categoryId}`, payload);
  },

  deleteCategory(categoryId: string) {
    return apiClient.delete<{ message: string }>(`/library/categories/${categoryId}`);
  },

  // --- DASHBOARD ---
  getDashboardStats() {
    return apiClient.get<{ data: LibraryDashboardStatsData }>('/library/dashboard');
  },

  // --- SETTINGS ---
  getLibrarySettings() {
    return apiClient.get<{ data: LibrarySettingsData }>('/library/settings');
  },

  updateLibrarySettings(payload: LibrarySettingsData) {
    return apiClient.patch<{ success: boolean; message: string }>('/library/settings', payload);
  },
};

export default libraryService;
