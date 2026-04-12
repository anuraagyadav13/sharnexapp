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

  OfficialResult: { resultId: string };
  ResultManagement: undefined;
  Timetable: undefined;

  // Teacher Screens
  TeacherDashboard: undefined;
  TeacherAttendance: undefined;
  TeacherViewAttendance: { classId: string, className?: string };
  TeacherMarkAttendance: { classId: string, className?: string };
  TeacherAssignment: undefined;
  TeacherViewSubmission: { assignmentId: string };
  TeacherCreateAssignment: undefined;
  TeacherQuiz: undefined;
  TeacherCreateQuiz: undefined;
  TeacherCreateQuizStep2: { quizData: any };
  TeacherAddQuestion: undefined;
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
  PrincipalCreateExam: undefined;
};
