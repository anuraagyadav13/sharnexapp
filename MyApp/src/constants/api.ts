import { Platform } from 'react-native';
import Messages from '../screens/student/Messages';

interface ExpoExtra {
  API_HOST?: string;
  API_PORT?: string;
}

const getExpoExtra = (): ExpoExtra => {
  if (typeof require !== 'function') {
    return {};
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants');
    return Constants?.expoConfig?.extra ?? {};
  } catch {
    return {};
  }
};

const expoExtra = getExpoExtra();

// Override this value when using a physical device or custom backend host.
// For Android emulator use 10.0.2.2, for iOS simulator use localhost.
const API_HOST_OVERRIDE = '';
const API_HOST =
  expoExtra.API_HOST ||
  API_HOST_OVERRIDE ||
  (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
const API_PORT = expoExtra.API_PORT ?? '3000';

export const API_BASE_URL = 'https://sharnex.com/api';
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/account/password',
    PREFERENCES: '/auth/preferences',
  },
  ACCOUNT: {
    PROFILE: '/account/profile',
    STUDENT: '/account/student',
    PARENT: '/account/student/parent',
    EMERGENCY: '/account/student/emergency',
    CHANGE_PASSWORD: '/account/password',
    PREFERENCES: '/account/preferences',
  },
  STUDENT: {
    DASHBOARD: (id: string) => `/students/${id}/dashboard`,
    PROFILE: '/student/profile',
    LEADERBOARD: (limit?: number) => `/students/leaderboard${limit ? `?limit=${limit}` : ''}`,
    SCHEDULE: (id: string) => `/students/${id}/schedule`,
    ATTENDANCE: (id: string) => `/students/${id}/attendance`,
    ASSIGNMENTS: (id: string) => `/students/${id}/assignments`,
    ASSIGNMENT_DETAIL: (id: string) => `/assignments/${id}`,
    ASSIGNMENT_SUBMIT: (id: string) => `/assignments/${id}/submissions`,
    GRADES: '/grades',
    INVOICES: '/invoices',
    PAYMENT_HISTORY: '/payments/history',
    INITIATE_PAYMENT: '/payments/initiate',
    VERIFY_PAYMENT: '/payments/verify',
    QUIZZES: '/quizzes',
    QUIZ_QUESTIONS: (id: string) => `/quizzes/${id}/questions`,
    QUIZ_SUBMIT: (id: string) => `/quizzes/${id}/submit`,
    QUIZ_DETAILS: (id: string) => `/quizzes/${id}`,
    QUIZ_RESULT: (id: string) => `/quizzes/${id}/results`,
    QUIZ_ANALYSIS: (id: string) => `/quizzes/${id}/analysis`,
    PAYMENT_RECEIPT: (id: string) => `/payments/${id}/receipt`,
    PERFORMANCE: '/students/performance',
    INSIGHTS: '/students/insights',
    REPORT: (id: string) => `/students/${id}/report`,
    STUDY_MATERIALS: (id: string) => `/students/${id}/study-materials`,
    STUDY_MATERIAL_DOWNLOAD: (studentId: string, materialId: string) => `/students/${studentId}/study-materials/${materialId}/download`,
    ANNOUNCEMENTS: '/announcements',
    TIMETABLE: '/timetable',
    CLASS_SCHEDULE: (classId: string) => `/classes/${classId}/schedule`,
    CALENDAR_EVENTS: '/calendar/events',
    CALENDAR_HOLIDAYS: '/calendar/holidays',
    CALENDAR_EXAMS: '/calendar/exams',
    OFFICIAL_RESULT: (id: string) => `/rms/results/${id}`,
    OFFICIAL_RESULT_LIST: '/rms/results/student',
    START_QUIZ: (quizId: string) => `/quizzes/${quizId}/start`,
    SUBMIT_QUIZ: (quizId: string) => `/quizzes/${quizId}/submit`,
  },
  TEACHER: {
    DASHBOARD: (id: string) => `/teachers/${id}/dashboard-summary`,
    CLASSES: (id: string) => `/teachers/${id}/classes`,
    CLASS_STUDENTS: (classId: string) => `/classes/${classId}/students`,
    ATTENDANCE: (classId: string) => `/classes/${classId}/attendance`,
    MARK_ATTENDANCE: (classId: string) => `/classes/${classId}/attendance/bulk`,
    ASSIGNMENTS: (id: string) => `/teachers/${id}/assignments`,
    ASSIGNMENT_DETAILS: (id: string) => `/assignments/${id}`,
    UPDATE_ASSIGNMENT: (id: string) => `/assignments/${id}`,
    DELETE_ASSIGNMENT: (id: string) => `/assignments/${id}`,
    SUBMISSIONS: (assignmentId: string) => `/assignments/${assignmentId}/submissions`,
    GRADE_SUBMISSION: (assignmentId: string, submissionId: string) => `/assignments/${assignmentId}/submissions/${submissionId}`,
    QUIZZES: '/quizzes',
    CREATE_QUIZ: '/quizzes',
    UPDATE_QUIZ: (id: string) => `/quizzes/${id}`,
    QUIZ_RESULTS: (quizId: string) => `/teacher/quizzes/${quizId}/results`,
    QUIZ_ATTEMPTS: (quizId: string) => `/teacher/quizzes/${quizId}/attempts`,
    QUIZ_ATTEMPTS_EXPORT: (quizId: string) => `/teacher/quizzes/${quizId}/attempts/export`,
    QUIZ_LIVE: (quizId: string) => `/teacher/quizzes/${quizId}/live`,
    TEACHER_QUIZZES: (teacherId: string) => `/quizzes?teacherId=${teacherId}`,
    DELETE_QUIZ: (id: string) => `/quizzes/${id}`,
    DUPLICATE_QUIZ: (id: string) => `/quizzes/${id}/duplicate`,
    CREATE_ASSIGNMENT: (teacherId: string) => `/teachers/${teacherId}/assignments`,
    PROFILE: '/account/teacher/profile',
    SCHEDULE: (id: string) => `/teachers/${id}/schedule`,
    RMS_WORK_ITEMS: '/rms/marks/work-items',
    RMS_REVIEW_ITEMS: '/rms/marks/review/work-items',
    RMS_SUBMIT_MARKS: '/rms/marks/submit',
    RMS_BULK_SAVE: '/rms/marks/bulk-save',
    RMS_MARKS_SHEET: (examId: string, classId: string, subjectId: string) => `/rms/marks/sheet?examId=${examId}&classId=${classId}&subjectId=${subjectId}`,
    RMS_REVIEW_SUMMARY: (examId: string, classId: string) => `/rms/marks/review/summary?examId=${examId}&classId=${classId}`,
    RMS_APPROVE: '/rms/marks/review/approve',
    RMS_REJECT: '/rms/marks/review/reject',
    RMS_RECALL: '/rms/marks/recall',
    RMS_AUDIT: (marksId: string) => `/rms/marks/audit/${marksId}`,
    STUDY_MATERIALS: '/teachers/study-materials',
    DELETE_STUDY_MATERIAL: (id: string) => `/teachers/study-materials/${id}`,
    LEAVES: '/timetable/teacher-leave',
    SUBMIT_LEAVE: '/timetable/teacher-leave',
    MY_ATTENDANCE: '/attendance/me',
    MY_ATTENDANCE_MANUAL: '/attendance/manual',
    FACE_SCAN: '/attendance/face-scan',
    EQUIPMENT: {
      MY_REQUESTS: '/equipment/requests/my',
      CREATE: '/equipment/requests',
      DETAIL: (id: string) => `/equipment/requests/${id}`,
      UPDATE: (id: string) => `/equipment/requests/${id}`,
      SUBMIT: (id: string) => `/equipment/requests/${id}/submit`,
      CANCEL: (id: string) => `/equipment/requests/${id}/cancel`,
      ACKNOWLEDGE: (id: string) => `/equipment/requests/${id}/acknowledge`,
    },
    ANNOUNCEMENTS: '/announcements',
    PENDING_TASKS: (id: string) => `/teachers/${id}/pending-tasks`,
    // Timetable: periods config (same endpoint used by the website)
    TIMETABLE_PERIODS: '/timetable/periods',
  },
  PRINCIPAL: {
    // Old endpoints to prevent compiler errors on other principal files
    DASHBOARD: '/principal/dashboard',
    DASHBOARD_METRICS: '/institution/dashboard-metrics',
    STAFF: '/principal/staff',
    ADD_STAFF: '/principal/staff',
    STUDENTS: '/principal/students',
    STUDENT_DETAIL: (id: string) => `/principal/students/${id}`,
    ADD_STUDENT: '/principal/students',
    FEES: '/principal/fees',
    CREATE_FEE: '/principal/fees',
    CREATE_ANNOUNCEMENT: '/principal/announcements',
    TIMETABLE: '/principal/timetable',
    PERFORMANCE: '/principal/performance',
    CALENDAR: '/principal/calendar',
    CALENDAR_EVENTS: '/calendar/events',
    CALENDAR_HOLIDAYS: '/calendar/holidays',
    CALENDAR_EXAMS: '/calendar/exams',
    REPORTS: '/rms/exams',
    EXAMS: '/rms/exams',
    EXAM_DETAIL: (id: string) => `/rms/exams/${id}`,
    APPROVE_EXAM: (id: string) => `/rms/exams/${id}/status`,
    STAFF_ATTENDANCE: '/principal/staff/attendance',
    RMS_GENERATE: '/rms/results/generate',
    RMS_PUBLISH: '/rms/results/publish',
    RMS_PREVIEW: '/rms/results/preview',
    RMS_ADMIN: '/rms/results/admin',
    EQUIPMENT_REQUESTS: '/equipment/requests',
    ATTENDANCE: '/attendance',
    ATTENDANCE_SUMMARY: '/institution/attendance-summary',

    // HAR capture verified endpoints
    CLASSES: '/classes',
    SUBJECTS: '/subjects',
    TEACHERS: (institutionId: string) => `/tenants/${institutionId}/teachers`,
    CLASS_ASSIGNMENTS: (institutionId: string) => `/tenants/${institutionId}/class-assignments`,
    TIMETABLE_PERIODS: '/timetable/periods',
    CLASS_SCHEDULE: (classId: string) => `/classes/${classId}/schedule`,
    CLASS_STUDENTS: (classId: string) => `/classes/${classId}/students`,
    DELETE_STUDENT: (id: string) => `/students/${id}`,
    UPDATE_STUDENT: (id: string) => `/students/${id}`,
    CREATE_STUDENT: '/students',
    EXPORT_STUDENTS: (classId: string) => `/classes/${classId}/students/export`,
    RMS_EXAMS: '/rms/exams',
    ANNOUNCEMENTS: '/announcements',
    INVOICE_STATS: '/invoices/stats',
    INVOICES: '/invoices',
    RECONCILIATION: '/payments/reconciliation',
    CREATE_INVOICE: '/invoices',
    INVOICE_STATUS: (id: string) => `/invoices/${id}/status`,
    EQUIPMENT_PENDING: '/equipment/approvals/pending',
    EQUIPMENT_ACTION: (id: string) => `/equipment/approvals/${id}/action`,
    EQUIPMENT_APPROVE: (id: string) => `/equipment/approvals/${id}/approve`,
    EQUIPMENT_REJECT: (id: string) => `/equipment/approvals/${id}/reject`,
    LIBRARY_DASHBOARD: '/library/dashboard',
    LIBRARY_CATEGORIES: '/library/categories',
    LIBRARY_ISSUES: '/library/issues',
    ACCOUNT_PROFILE: '/account/profile',
    ACCOUNT_INSTITUTION: '/account/institution',
    ACCOUNT_SESSIONS: '/account/sessions',
  },
  MESSAGES: {
    CONVERSATION: '/messages',
    CONTACTS: '/messages/contacts',

    MESSAGES: (recipientId: string, limit = 50) =>
      `/messages?recipientId=${recipientId}&limit=${limit}`,

    MESSAGE: '/messages',

    READ: '/messages/read',

    STREAM: '/messages/stream',
  },
};

