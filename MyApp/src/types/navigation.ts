export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  
  // Student Screens
  StudentDashboard: undefined;
  Assignments: undefined;
  AssignmentDetails: { assignmentId: string };
  AssignmentSubmit: { assignmentId: string };
  AssignmentGrade: undefined;
  Quizzes: undefined;
  QuizDetails: { quizId: string };
  StartQuiz: { quizId: string };
  QuizResult: { quizId: string, timestamp: number };
  ViewQuizDetail: { quizId: string };
  Performance: undefined;
  StudyMaterial: undefined;
  Attendance: undefined;
  Announcements: undefined;
  Grades: undefined;
  Fees: undefined;
  AccountSettings: { targetTab?: 'Personal Details' | 'Parent Information' | 'Preferences' } | undefined;

  OfficialResult: undefined;
  Timetable: undefined;

  // Teacher Screens
  TeacherDashboard: undefined;
  TeacherAttendance: undefined;
  TeacherViewAttendance: { classId: string };
  TeacherMarkAttendance: undefined;
  TeacherAssignment: undefined;
  TeacherViewSubmission: { assignmentId: string };
  TeacherCreateAssignment: undefined;
  TeacherQuiz: undefined;
  TeacherCreateQuiz: undefined;
  TeacherCreateQuizStep2: undefined;
  TeacherAddQuestion: undefined;
  TeacherCreateQuizStep3: undefined;
  TeacherViewQuizResult: { quizId: string };
  TeacherMonitorLive: { quizId: string };

  // Principal Screens
  PrincipalDashboard: undefined;
  PrincipalClasses: undefined;
  PrincipalSubjects: undefined;
  PrincipalStaff: undefined;
  PrincipalMarkStaffAttendance: undefined;
  PrincipalAddStaff: undefined;
  PrincipalStudentDetails: undefined;
  PrincipalAddStudent: undefined;
  PrincipalCalendar: undefined;
  PrincipalTimetable: undefined;
  PrincipalPerformance: undefined;
  PrincipalAnnouncements: undefined;
  PrincipalFees: undefined;
  PrincipalRSM: undefined;
  PrincipalCreateExamScreen: undefined;
};
