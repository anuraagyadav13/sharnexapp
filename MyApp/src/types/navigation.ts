export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string };
  
  // Student Screens
  StudentDashboard: undefined;
  Assignments: undefined;
  AssignmentDetails: { assignmentId: string };
  AssignmentSubmit: { assignmentId: string };
  AssignmentGrade: { assignmentId: string };
  Quizzes: undefined;
  QuizDetails: { quizId: string };
  StartQuiz: { quizId: string };
  QuizResult: { quizId: string, timestamp?: number };
  ViewQuizDetail: { quizId: string };
  Performance: undefined;
  StudyMaterial: undefined;
  Attendance: undefined;
  Announcements: undefined;
  Grades: undefined;
  Fees: undefined;
  AccountSettings: { targetTab?: 'Personal Details' | 'Parent Information' | 'Preferences' } | undefined;
  Messages: { recipientId?: string; recipientName?: string } | undefined;

  OfficialResult: { resultId?: string; examId?: string };
  ResultManagement: undefined;
  Timetable: undefined;

  // Teacher Screens
  TeacherDashboard: undefined;
  TeacherAttendance: undefined;
  TeacherViewAttendance: { classId: string, className?: string };
  TeacherMarkAttendance: { classId: string, className?: string };
  TeacherAssignment: undefined;
  TeacherViewSubmission: { 
    assignmentId: string;
    classId?: string;
    title?: string;
    className?: string;
    assignmentTitle?: string;
    dueDate?: string;
    maxMarks?: number;
  };
  TeacherCreateAssignment: undefined;
  TeacherQuiz: undefined;
  TeacherCreateQuiz: { initialQuiz?: any; quizId?: string; updatedQuizData?: any } | undefined;
  TeacherCreateQuizStep2: { quizData: any };
  TeacherAddQuestion: { editQuestion?: any; quizData?: any } | undefined;
  TeacherCreateQuizStep3: { quizData: any };
  TeacherViewQuizResult: { quizId: string };
  TeacherMonitorLive: { quizId: string };
  TeacherResultManagement: undefined;
  TeacherMarksEntry: { 
    examId: string; 
    classId: string; 
    subjectId: string;
    examName: string;
    className: string;
    subjectName: string;
  };
  TeacherReviewSubmission: { 
    examId: string; 
    classId: string; 
    examName: string;
    className: string;
  };
  TeacherStudentResultDetail: {
    studentId: string;
    studentName: string;
    rollNo?: string;
  };
  TeacherTimetable: undefined;
  TeacherSelfAttendance: undefined;
  TeacherEditAssignment: { assignmentId: string };
  TeacherEquipment: undefined;
  TeacherAddEquipmentRequest: { requestId?: string };
  TeacherEquipmentDetail: { requestId: string };
  TeacherPerformance: undefined;
  TeacherStudyMaterial: undefined;

  // Principal Screens
  PrincipalDashboard: undefined;
  PrincipalClasses: undefined;
  PrincipalClassDetail: { classId: string; classData: any };
  PrincipalSubjects: undefined;
  PrincipalStaff: undefined;
  PrincipalTeachers: undefined;
  PrincipalMarkStaffAttendance: undefined;
  PrincipalAddStaff: undefined;
  PrincipalStaffDetails: { staffId: string };
  PrincipalEditStaff: { staffId: string, initialData?: any };
  PrincipalStudentDetails: undefined;
  PrincipalAddStudent: undefined;
  PrincipalEditStudent: { studentId: string };
  PrincipalViewStudent: { studentId: string };
  PrincipalCalendar: undefined;
  PrincipalTimetable: undefined;
  PrincipalAnnouncements: undefined;
  PrincipalFees: undefined;
  PrincipalCreateInvoice: undefined;
  PrincipalRSM: undefined;
  PrincipalRMS: undefined;
  PrincipalReviewExam: { examId: string };
  PrincipalCreateExam: undefined;
  PrincipalEditExam: { examId: string };
  PrincipalAddSubject: undefined;
  PrincipalEditSubject: { subjectId: string, initialData?: any };
  PrincipalAddClass: undefined;
  PrincipalManageClass: { classId: string, className: string };
  PrincipalEditClass: { classId: string; classData?: any };
  PrincipalEquipment: undefined;
  PrincipalLibrary: undefined;

  // Library Admin Module Screens
  LibraryDashboard: undefined;
  LibraryBookCatalog: undefined;
  LibraryCirculation: undefined;
  LibraryCategories: undefined;
  LibraryAnnouncements: undefined;
  LibraryEquipment: undefined;
  LibraryNewSupply: undefined;

  // Principal Bus Tracking Module Screens
  BusDashboard: undefined;
  FleetTracking: undefined;
  AddVehicle: undefined;
  RouteManagement: undefined;
  RouteConfiguration: { routeId?: string } | undefined;
  Schedules: undefined;
  AddSchedule: undefined;
  DriverManagement: undefined;
  AddDriver: undefined;
  EnrollStudent: undefined;
};
