import { Platform } from 'react-native';

export const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3000/api' 
  : 'http://localhost:3000/api';



export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/password',
    PREFERENCES: '/auth/preferences',
  },
  STUDENT: {
    DASHBOARD: (id: string) => `/students/${id}/dashboard`,
    PROFILE: '/student/profile',
    SCHEDULE: (id: string) => `/students/${id}/schedule`,
    ATTENDANCE: (id: string) => `/students/${id}/attendance`,
    ASSIGNMENTS: (id: string) => `/students/${id}/assignments`,
    ASSIGNMENT_DETAIL: (id: string) => `/assignments/${id}`,
    ASSIGNMENT_SUBMIT: (id: string) => `/assignments/${id}/submit`,
    GRADES: '/grades',
    INVOICES: '/invoices',
    PAYMENT_HISTORY: '/payments/history',
    QUIZZES: '/quizzes',
    QUIZ_QUESTIONS: (id: string) => `/quizzes/${id}/questions`,
    QUIZ_SUBMIT: (id: string) => `/quizzes/${id}/submit`,
    STUDY_MATERIALS: (id: string) => `/students/${id}/study-materials`,
    ANNOUNCEMENTS: '/announcements',
    TIMETABLE: '/timetable',
    PERFORMANCE: (id: string) => `/students/${id}/performance`,
  },
  TEACHER: {
    DASHBOARD: (id: string) => `/teachers/${id}/dashboard-summary`,
    CLASSES: (id: string) => `/teachers/${id}/classes`,
    CLASS_STUDENTS: (classId: string) => `/classes/${classId}/students`,
    ATTENDANCE: (classId: string) => `/classes/${classId}/attendance`,
    MARK_ATTENDANCE: (classId: string) => `/classes/${classId}/attendance/bulk`,
    ASSIGNMENTS: (id: string) => `/teachers/${id}/assignments`,
    SUBMISSIONS: (assignmentId: string) => `/assignments/${assignmentId}/submissions`,
    GRADE_SUBMISSION: (assignmentId: string, submissionId: string) => `/assignments/${assignmentId}/submissions/${submissionId}`,
    QUIZZES: '/quizzes',
    QUIZ_RESULTS: (quizId: string) => `/teacher/quizzes/${quizId}/results`,
    QUIZ_LIVE: (quizId: string) => `/teacher/quizzes/${quizId}/live`,
    TEACHER_QUIZZES: (teacherId: string) => `/quizzes?teacherId=${teacherId}`,
    CREATE_QUIZ: '/teacher/quizzes',
    CREATE_ASSIGNMENT: '/teacher/assignments',
    PROFILE: '/teacher/profile',
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
    REPORTS: '/principal/reports',
    GENERATE_REPORT: '/principal/reports/generate',
    EXAMS: '/principal/exams',
    EXAM_DETAIL: (id: string) => `/principal/exams/${id}`,
    APPROVE_EXAM: (id: string) => `/principal/exams/${id}/approve`,
    STAFF_ATTENDANCE: '/principal/staff/attendance',
  }
};
