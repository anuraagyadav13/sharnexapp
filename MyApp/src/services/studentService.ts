import apiClient from './apiClient';
import { ENDPOINTS, } from '../constants/api';

const studentService = {
  // Dashboard
  getDashboard(studentId: string) {
    return apiClient.get(ENDPOINTS.STUDENT.DASHBOARD(studentId));
  },

  // Profile - uses /auth/me (HAR-confirmed working endpoint)
  getMe() {
    return apiClient.get(ENDPOINTS.AUTH.ME);
  },

  // Profile (legacy - do not use for timetable)
  getProfile() {
    return apiClient.get(ENDPOINTS.STUDENT.PROFILE);
  },

  // Attendance
  getAttendance(studentId: string) {
    return apiClient.get(ENDPOINTS.STUDENT.ATTENDANCE(studentId));
  },

  // Attendance Report PDF
  getAttendanceReport(studentId: string) {
    return apiClient.get(ENDPOINTS.STUDENT.REPORT(studentId));
  },

  // Schedule
  // Schedule
  getSchedule(studentId: string, date?: string) {
    const selectedDate =
      date ?? new Date().toISOString().split('T')[0];

    return apiClient.get(
      `${ENDPOINTS.STUDENT.SCHEDULE(studentId)}?date=${selectedDate}`,
    );
  },
  getClassSchedule(classId: string, weekStart: string) {
    return apiClient.get(
      `${ENDPOINTS.STUDENT.CLASS_SCHEDULE(classId)}?week=${weekStart}`,
    );
  },

  // Assignments
  getAssignments(studentId: string) {
    return apiClient.get(ENDPOINTS.STUDENT.ASSIGNMENTS(studentId));
  },

  getAssignmentDetails(id: string) {
    return apiClient.get(ENDPOINTS.STUDENT.ASSIGNMENT_DETAIL(id));
  },

  submitAssignment(id: string, data: any) {
    return apiClient.post(
      ENDPOINTS.STUDENT.ASSIGNMENT_SUBMIT(id),
      data,
    );
  },

  // Grades
  getGrades() {
    return apiClient.get(ENDPOINTS.STUDENT.GRADES);
  },

  // Performance
  getPerformance(studentId: string) {
    return apiClient.get(
      ENDPOINTS.STUDENT.PERFORMANCE(studentId),
    );
  },

  // Study Materials
  getStudyMaterials(studentId: string) {
    return apiClient.get(
      ENDPOINTS.STUDENT.STUDY_MATERIALS(studentId),
    );
  },

  downloadMaterial(studentId: string, materialId: string) {
    return apiClient.get(
      ENDPOINTS.STUDENT.STUDY_MATERIAL_DOWNLOAD(
        studentId,
        materialId,
      ),
    );
  },

  // Announcements
  getAnnouncements() {
    return apiClient.get(
      ENDPOINTS.STUDENT.ANNOUNCEMENTS,
    );
  },

  // Timetable
  getTimetable() {
    return apiClient.get(
      ENDPOINTS.STUDENT.TIMETABLE,
    );
  },

  // Fees
  getInvoices() {
    return apiClient.get(
      ENDPOINTS.STUDENT.INVOICES,
    );
  },

  getPaymentHistory() {
    return apiClient.get(
      ENDPOINTS.STUDENT.PAYMENT_HISTORY,
    );
  },

  getReceipt(id: string) {
    return apiClient.get(
      ENDPOINTS.STUDENT.PAYMENT_RECEIPT(id),
    );
  },

  // Official Results
  getOfficialResults() {
    return apiClient.get(
      ENDPOINTS.STUDENT.OFFICIAL_RESULT_LIST,
    );
  },

  getOfficialResult(id: string) {
    return apiClient.get(
      ENDPOINTS.STUDENT.OFFICIAL_RESULT(id),
    );
  },

  // Quizzes
  getQuizzes() {
    return apiClient.get(
      ENDPOINTS.STUDENT.QUIZZES,
    );
  },

  getQuizDetails(id: string) {
    return apiClient.get(
      ENDPOINTS.STUDENT.QUIZ_DETAILS(id),
    );
  },

  startQuiz(id: string) {
    return apiClient.post(
      ENDPOINTS.STUDENT.START_QUIZ(id),
    );
  },

  submitQuiz(id: string, data: any) {
    return apiClient.post(
      ENDPOINTS.STUDENT.SUBMIT_QUIZ(id),
      data,
    );
  },

  getQuizResult(id: string) {
    return apiClient.get(
      ENDPOINTS.STUDENT.QUIZ_RESULT(id),
    );
  },

  getQuizAnalysis(id: string) {
    return apiClient.get(
      ENDPOINTS.STUDENT.QUIZ_ANALYSIS(id),
    );
  },
};

export default studentService;