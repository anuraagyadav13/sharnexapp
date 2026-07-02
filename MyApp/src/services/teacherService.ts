import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/api';

const teacherService = {
  // ----------------------------------------------------
  // Dashboard & Classes
  // ----------------------------------------------------

  // Gets the main overview data for the teacher's dashboard (like stats, schedule)
  getDashboard(teacherId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.DASHBOARD(teacherId));
  },

  // Fetches a list of all classes that this teacher is assigned to
  getClasses(teacherId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.CLASSES(teacherId));
  },

  // Gets the list of students in a specific class
  getClassStudents(classId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.CLASS_STUDENTS(classId));
  },

  // ----------------------------------------------------
  // Student Attendance
  // ----------------------------------------------------

  // Grabs the attendance records for a specific class (optionally for a specific date)
  getAttendance(classId: string, date?: string) {
    return apiClient.get(
      `${ENDPOINTS.TEACHER.ATTENDANCE(classId)}${date ? `?date=${date}` : ''}`
    );
  },

  // Submits the attendance data (who is present/absent) for a class
  markAttendance(classId: string, data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.MARK_ATTENDANCE(classId), data);
  },

  // ----------------------------------------------------
  // Assignments (Homework / Projects)
  // ----------------------------------------------------

  // Fetches all assignments created by this teacher
  getAssignments(teacherId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.ASSIGNMENTS(teacherId));
  },

  // Creates a brand new assignment for students
  createAssignment(teacherId: string, data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.CREATE_ASSIGNMENT(teacherId), data);
  },

  // Gets all the specific details of a single assignment
  getAssignmentDetails(id: string) {
    return apiClient.get(ENDPOINTS.TEACHER.ASSIGNMENT_DETAILS(id));
  },

  // Updates an existing assignment (e.g., changing the deadline or instructions)
  updateAssignment(id: string, data: any) {
    return apiClient.put(ENDPOINTS.TEACHER.UPDATE_ASSIGNMENT(id), data);
  },

  // Deletes an assignment completely
  deleteAssignment(id: string) {
    return apiClient.delete(ENDPOINTS.TEACHER.DELETE_ASSIGNMENT(id));
  },

  // Sees all the work students have submitted for a specific assignment
  getSubmissions(assignmentId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.SUBMISSIONS(assignmentId));
  },

  // Grades a student's submitted assignment
  gradeSubmission(assignmentId: string, submissionId: string, data: any) {
    return apiClient.put(ENDPOINTS.TEACHER.GRADE_SUBMISSION(assignmentId, submissionId), data);
  },

  // ----------------------------------------------------
  // Quizzes & Tests
  // ----------------------------------------------------

  // Gets a list of all quizzes
  getQuizzes() {
    return apiClient.get(ENDPOINTS.TEACHER.QUIZZES);
  },

  // Gets quizzes created specifically by this teacher
  getTeacherQuizzes(teacherId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.TEACHER_QUIZZES(teacherId));
  },

  // Creates a new quiz
  createQuiz(data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.CREATE_QUIZ, data);
  },

  // Updates an existing quiz's details or questions
  updateQuiz(id: string, data: any) {
    return apiClient.put(ENDPOINTS.TEACHER.UPDATE_QUIZ(id), data);
  },

  // Deletes a quiz
  deleteQuiz(id: string) {
    return apiClient.delete(ENDPOINTS.TEACHER.DELETE_QUIZ(id));
  },

  // Makes a copy of an existing quiz (useful for reusing questions)
  duplicateQuiz(id: string) {
    return apiClient.post(ENDPOINTS.TEACHER.DUPLICATE_QUIZ(id));
  },

  // Gets the final results of a quiz after students have taken it
  getQuizResults(quizId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.QUIZ_RESULTS(quizId));
  },

  // Sees the details of students' attempts at a quiz
  getQuizAttempts(quizId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.QUIZ_ATTEMPTS(quizId));
  },

  // Downloads or exports the quiz attempts (like to a spreadsheet)
  exportQuizAttempts(quizId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.QUIZ_ATTEMPTS_EXPORT(quizId));
  },

  // Monitors a quiz in real-time while students are taking it
  getLiveQuiz(quizId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.QUIZ_LIVE(quizId));
  },

  // ----------------------------------------------------
  // Teacher Profile & Schedule
  // ----------------------------------------------------

  // Gets the teacher's personal profile information (from generic profile API)
  getPersonalInfo() {
    return apiClient.get('/account/profile');
  },

  updatePersonalInfo(data: any) {
    return apiClient.patch('/account/profile', data);
  },

  // Gets the teacher's professional profile information
  getProfile() {
    return apiClient.get(ENDPOINTS.TEACHER.PROFILE);
  },

  // Updates the teacher's personal profile
  updateProfile(data: any) {
    return apiClient.patch(ENDPOINTS.TEACHER.PROFILE, data);
  },

  // Uploads a profile photo
  uploadPhoto(formData: FormData) {
    return apiClient.post('/account/teacher/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Deletes the profile photo
  deletePhoto() {
    return apiClient.delete('/account/teacher/photo');
  },

  // Bank Details
  getBankDetails() {
    return apiClient.get('/account/teacher/bank');
  },
  
  updateBankDetails(data: any) {
    return apiClient.patch('/account/teacher/bank', data);
  },

  // Gets the teacher's daily or weekly class schedule
  getSchedule(teacherId: string, date?: string) {
    return apiClient.get(
      `${ENDPOINTS.TEACHER.SCHEDULE(teacherId)}${date ? `?date=${date}` : ''}`
    );
  },

  // Gets all the configured school periods (Period 1, Lunch, Sports, etc.)
  // This is the SAME endpoint the website uses at /api/timetable/periods
  getTimetablePeriods() {
    return apiClient.get(ENDPOINTS.TEACHER.TIMETABLE_PERIODS);
  },

  // ----------------------------------------------------
  // Result Management System (RMS) - Exams & Grades
  // ----------------------------------------------------

  // Gets the items/exams that the teacher needs to grade
  getRmsWorkItems() {
    return apiClient.get(ENDPOINTS.TEACHER.RMS_WORK_ITEMS);
  },

  // Gets the graded items that are waiting for the teacher to review and approve
  getRmsReviewItems() {
    return apiClient.get(ENDPOINTS.TEACHER.RMS_REVIEW_ITEMS);
  },

  // Submits marks/grades for an exam
  submitRmsMarks(data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.RMS_SUBMIT_MARKS, data);
  },

  // Saves a lot of marks all at once
  bulkSaveRmsMarks(data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.RMS_BULK_SAVE, data);
  },

  // Gets the full marksheet for a specific exam, class, and subject
  getRmsMarksSheet(examId: string, classId: string, subjectId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.RMS_MARKS_SHEET(examId, classId, subjectId));
  },

  // Gets a summary of marks to review before finalizing them
  getRmsReviewSummary(examId: string, classId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.RMS_REVIEW_SUMMARY(examId, classId));
  },

  // Approves the finalized marks
  approveRmsReview(data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.RMS_APPROVE, data);
  },

  // Rejects the marks if something looks wrong
  rejectRmsReview(data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.RMS_REJECT, data);
  },

  // Recalls marks that were already submitted if a mistake was found
  recallRmsMarks(data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.RMS_RECALL, data);
  },

  // Checks the history/audit trail of changes made to marks
  getRmsAudit(marksId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.RMS_AUDIT(marksId));
  },

  // ----------------------------------------------------
  // Study Materials
  // ----------------------------------------------------

  // Gets a list of study materials uploaded by the teacher
  getStudyMaterials() {
    return apiClient.get(ENDPOINTS.TEACHER.STUDY_MATERIALS);
  },

  // Deletes a specific study material
  deleteStudyMaterial(id: string) {
    return apiClient.delete(ENDPOINTS.TEACHER.DELETE_STUDY_MATERIAL(id));
  },

  // ----------------------------------------------------
  // Leaves (Time Off)
  // ----------------------------------------------------

  // Gets the teacher's past and upcoming leave requests
  getLeaves() {
    return apiClient.get(ENDPOINTS.TEACHER.LEAVES);
  },

  // Submits a new request for time off
  submitLeave(data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.SUBMIT_LEAVE, data);
  },

  // ----------------------------------------------------
  // Teacher's Own Attendance
  // ----------------------------------------------------

  // Sees the teacher's own attendance records (e.g., when they checked in)
  getMyAttendance(month?: string) {
    return apiClient.get(
      `${ENDPOINTS.TEACHER.MY_ATTENDANCE}${month ? `?month=${month}` : ''}`
    );
  },

  // Manually submits attendance (if they forgot to scan)
  submitManualAttendance(data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.MY_ATTENDANCE_MANUAL, data);
  },

  // Submits attendance using a face scan (if the school uses facial recognition)
  submitFaceScanAttendance(data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.FACE_SCAN, data);
  },

  // ----------------------------------------------------
  // Equipment Requests (E.g., projectors, lab tools)
  // ----------------------------------------------------

  // Gets a list of things the teacher requested to borrow
  getMyEquipmentRequests() {
    return apiClient.get(ENDPOINTS.TEACHER.EQUIPMENT.MY_REQUESTS);
  },

  // Creates a new request to borrow equipment
  createEquipmentRequest(data: any) {
    return apiClient.post(ENDPOINTS.TEACHER.EQUIPMENT.CREATE, data);
  },

  // Gets the details of a specific equipment request
  getEquipmentRequestDetail(id: string) {
    return apiClient.get(ENDPOINTS.TEACHER.EQUIPMENT.DETAIL(id));
  },

  // Updates a request (e.g., changing the date needed)
  updateEquipmentRequest(id: string, data: any) {
    return apiClient.put(ENDPOINTS.TEACHER.EQUIPMENT.UPDATE(id), data);
  },

  // Formally submits the equipment request for approval
  submitEquipmentRequest(id: string) {
    return apiClient.post(ENDPOINTS.TEACHER.EQUIPMENT.SUBMIT(id));
  },

  // Cancels a request if they don't need the equipment anymore
  cancelEquipmentRequest(id: string) {
    return apiClient.post(ENDPOINTS.TEACHER.EQUIPMENT.CANCEL(id));
  },

  // Acknowledges that they received the equipment
  acknowledgeEquipmentRequest(id: string) {
    return apiClient.post(ENDPOINTS.TEACHER.EQUIPMENT.ACKNOWLEDGE(id));
  },

  // ----------------------------------------------------
  // Announcements & Tasks
  // ----------------------------------------------------

  // Gets any school-wide or teacher-specific announcements
  getAnnouncements() {
    return apiClient.get(ENDPOINTS.TEACHER.ANNOUNCEMENTS);
  },

  // Gets a to-do list of tasks the teacher needs to complete (like grading an exam)
  getPendingTasks(teacherId: string) {
    return apiClient.get(ENDPOINTS.TEACHER.PENDING_TASKS(teacherId));
  }
};

export default teacherService;
