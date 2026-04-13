import { Platform } from 'react-native';

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

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/account/password',
    PREFERENCES: '/auth/preferences',
  },
  STUDENT: {
    DASHBOARD: (id: string) => `/students/${id}/dashboard`,
    PROFILE: '/student/profile',
    SCHEDULE: (id: string) => `/students/${id}/schedule`,
    ATTENDANCE: (id: string) => `/students/${id}/attendance`,
    ASSIGNMENTS: (id: string) => `/students/${id}/assignments`,
    ASSIGNMENT_DETAIL: (id: string) => `/assignments/${id}`,
    ASSIGNMENT_SUBMIT: (id: string) => `/assignments/${id}/submissions`,
    GRADES: '/grades',
    INVOICES: '/invoices',
    PAYMENT_HISTORY: '/payments/history',
    QUIZZES: '/quizzes',
    QUIZ_QUESTIONS: (id: string) => `/quizzes/${id}/questions`,
    QUIZ_SUBMIT: (id: string) => `/quizzes/${id}/submit`,
    QUIZ_DETAILS: (id: string) => `/quizzes/${id}`,
    QUIZ_RESULT: (id: string) => `/quizzes/${id}/results`,
    QUIZ_ANALYSIS: (id: string) => `/quizzes/${id}/analysis`,
    PAYMENT_RECEIPT: (id: string) => `/payments/${id}/receipt`,
    STUDY_MATERIALS: (id: string) => `/students/${id}/study-materials`,
    ANNOUNCEMENTS: '/announcements',
    TIMETABLE: '/timetable',
    CLASS_SCHEDULE: (classId: string) => `/classes/${classId}/schedule`,
    PERFORMANCE: (id: string) => `/students/${id}/performance`,
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
    LEAVES: '/timetable/teacher-leave',
    SUBMIT_LEAVE: '/timetable/teacher-leave',
    MY_ATTENDANCE: '/attendance/me',
  },
  PRINCIPAL: {
    DASHBOARD: '/principal/dashboard',
    STAFF: '/principal/staff',
    ADD_STAFF: '/principal/staff',
    STUDENTS: '/principal/students',
    STUDENT_DETAIL: (id: string) => `/principal/students/${id}`,
    ADD_STUDENT: '/principal/students',
    FEES: '/principal/fees',
    CREATE_FEE: '/principal/fees',
    ANNOUNCEMENTS: '/principal/announcements',
    CREATE_ANNOUNCEMENT: '/principal/announcements',
    CLASSES: '/principal/classes',
    SUBJECTS: '/principal/subjects',
    TIMETABLE: '/principal/timetable',
    PERFORMANCE: '/principal/performance',
    CALENDAR: '/principal/calendar',
    CALENDAR_EVENTS: '/principal/calendar/events',
    REPORTS: '/rms/exams',
    EXAMS: '/rms/exams',
    EXAM_DETAIL: (id: string) => `/rms/exams/${id}`,
    APPROVE_EXAM: (id: string) => `/rms/exams/${id}/status`,
    STAFF_ATTENDANCE: '/principal/staff/attendance',
  }
};

