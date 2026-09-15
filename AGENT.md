# AGENT.md — Persistent Codebase Context File

**Last Updated**: 2026-09-09 (Pass 4 Principal Module Full Parity Audit & Quality Bug Fixes)  
**Repository Root**: `d:\sharenex\sharnexapp\`  
**App Directory**: `d:\sharenex\sharnexapp\MyApp\`  
**Git Branch**: `Arpit/Api`

---

## 1. Project Overview

Sharnex is a comprehensive school management platform designed for educational institutions. It supports three primary user roles: **Student**, **Teacher**, and **Principal (Admin)**, alongside specialized sub-roles like Library Staff.

The mobile React Native app (living in `MyApp/` on branch `Arpit/Api`) is paired with a companion Next.js web application (`sharnex.com`) that shares the exact same PostgreSQL backend database, schema, and API business logic. The mobile app communicates with the hosted backend over HTTPS REST APIs.

---

## 2. Tech Stack

- **Framework**: React Native `0.84.1` with React `19.2.3`.
- **Navigation**: React Navigation v7 (`@react-navigation/native` `^7.2.1`, `@react-navigation/native-stack` `^7.14.9`).
- **State Management**: React Context API (`AuthContext`, `ThemeContext`, `ToastContext`).
- **HTTP Client**: Axios `^1.14.0` wrapped via custom service client `src/services/apiClient.ts`.
- **Storage**: `@react-native-async-storage/async-storage` `^1.24.0`.
- **UI & Animations**: `react-native-reanimated` `^4.3.0`, `react-native-vector-icons` `^10.3.0`, `react-native-safe-area-context` `^5.5.2`.
- **Media, Camera & File Utilities**: `react-native-fs` `^2.20.0`, `xlsx` `^0.18.5`, `react-native-vision-camera` `^4.7.3`, `react-native-html-to-pdf` `^0.12.0`, `react-native-print` `^0.11.0`, `react-native-share` `^12.3.1`, `@notifee/react-native` `^9.1.8`, `react-native-image-picker` `^8.2.1`.

---

## 3. Environment & Running the App

### Command Line Scripts (`package.json`)
- **Start Metro Bundler**: `npm start` or `npx react-native start`
- **Run Android**: `npm run android` or `npx react-native run-android`
- **Run iOS**: `npm run ios` or `npx react-native run-ios`
- **Type Check**: `npx tsc --noEmit` *(Verified Pass 3: returns 0 compilation errors)*

### Dynamic API Base URL Resolution (`src/constants/api.ts`)
The API URL resolves automatically in `resolveBaseUrl()` with the following priority:
1. `process.env.EXPO_PUBLIC_API_URL` or `process.env.API_BASE_URL`
2. `process.env.EXPO_PUBLIC_API_HOST` & `PORT` (or Android emulator fallback `10.0.2.2:3000`)
3. Production URL: `https://www.sharnex.com/api`

### ⚠️ Metro Cache Warning
Source code changes to authentication interceptors (`apiClient.ts`), headers, or network interceptors can be silently cached by Metro. Always clear Metro cache when testing auth or network modifications:
```bash
npx react-native start --reset-cache
```

---

## 4. Folder Structure Map

```
MyApp/
├── App.tsx                     # Main navigation stack, providers, & route registration
├── package.json                # Project dependencies & scripts
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── NavigationDrawer.tsx# Global role-aware side navigation drawer
│   │   ├── StudentHeader.tsx   # Standard header for Student module
│   │   ├── TeacherHeader.tsx   # Standard header for Teacher module
│   │   ├── MarksAuditModal.tsx # Reusable subject marks audit modal
│   │   ├── animations/         # Reanimated button & transition wrappers
│   │   ├── common/             # Skeletons, buttons, & badges
│   │   └── shared/             # App-wide shared headers & modal cards
│   ├── constants/
│   │   ├── api.ts              # Base URL resolution & API ENDPOINTS dictionary
│   │   └── theme.ts            # Palette, tokens (LIGHT_COLORS, DARK_COLORS, BRAND)
│   ├── screens/                # Screen implementations grouped by role
│   │   ├── auth/               # Login, ForgotPassword, ResetPassword (5 screens)
│   │   ├── student/            # Dashboard, Assignments, Quizzes, Performance (20 screens)
│   │   ├── teacher/            # Dashboard, MarkAttendance, Assignments, Quizzes (27 screens)
│   │   ├── principal/          # Dashboard, Classes, Staff, RMS, Fees, Library (29 screens)
│   │   │   └── bus/            # Bus tracking prototype sub-module (10 screens)
│   │   └── shared/             # AccountSettingsScreen (1 screen)
│   ├── services/               # API Service Layer
│   │   ├── apiClient.ts        # Axios client instance & interceptors
│   │   ├── accountService.ts   # User profile & account API
│   │   ├── studentService.ts   # Student data API endpoints
│   │   ├── teacherService.ts   # Teacher management API endpoints
│   │   ├── principalService.ts # Principal/Admin management API endpoints
│   │   └── messagesService.ts  # Messaging & notifications API
│   ├── store/                  # React Context Providers
│   │   ├── AuthContext.tsx     # Session state & authentication handlers
│   │   ├── ThemeContext.tsx    # Light/Dark theme provider & mode toggle
│   │   └── ToastContext.tsx    # Toast notification system
│   ├── types/                  # TypeScript interfaces & navigation param lists
│   │   └── navigation.ts       # RootStackParamList definition
│   └── utils/                  # Utility helpers (cache, image, formatters)
```

---

## 5. Role-Based Architecture

The codebase enforces clean separation by user role under `src/screens/`:

- **Auth State Resolution**: Role (`student` | `teacher` | `principal` | `library`) is retrieved during login and persisted in `AsyncStorage` under `@auth_state`.
- **Dynamic Navigation Drawer**: `NavigationDrawer.tsx` accepts `role="principal" | "teacher" | "student"` and renders role-specific drawer items.
- **Shared vs Role Headers**:
  - Student screens use `StudentHeader.tsx`.
  - Teacher screens use `TeacherHeader.tsx`.
  - Principal screens use the standard 3-part `appHeader` (`menu/back` | `title` | `avatar`) with safe area padding (`paddingTop: Platform.OS === 'ios' ? 50 : 30`).

---

## 6. Detailed Screen Inventory & Code Verification

### 6.1 Authentication Module (`src/screens/auth/`) — 5 Screens
1. `HomeScreen.tsx`: Landing screen allowing role selection and login navigation. *(Live UI)*
2. `LoginScreen.tsx`: Credential login form. Calls `accountService.login()` at line 142. *(Live API)*
3. `ForgotPasswordScreen.tsx`: Initiates password reset request. Calls `accountService.forgotPassword()` at line 48. *(Live API)*
4. `ResetPasswordScreen.tsx`: Submit reset token and new password. Calls `accountService.resetPassword()` at line 52. *(Live API)*
5. `RegisterScreen.tsx`: Registration form (commented out in `App.tsx:L27`). *(Deferred)*

### 6.2 Student Module (`src/screens/student/`) — 20 Screens (100% Re-Verified Pass 3)
1. `StudentDashboard.tsx`: Overview stats, schedule, assignments, quizzes. Calls `studentService.getMe()` at line 974 to extract `studentDbId` (line 976), then calls `getDashboard(studentDbId)` at line 985 and `getSchedule(studentDbId)` at line 986. On API failure (lines 1034–1040), sets empty state arrays with `notFound: true` — **No silent mock array fallbacks present**. *(Live API & Clean Error Handling)*
2. `AssignmentsScreen.tsx`: Filterable assignments list. Calls `studentService.getAssignments()` at line 140. *(Live API)*
3. `AssignmentDetailsScreen.tsx`: Assignment details view. Calls `studentService.getAssignmentDetails()` at line 66. *(Live API)*
4. `AssignmentSubmitScreen.tsx`: File upload submission. Calls `studentService.submitAssignment()` at line 142. *(Live API)*
5. `AssignmentGradeScreen.tsx`: Teacher grade & feedback view. Calls `studentService.getProfile()` at line 46. *(Live API)*
6. `QuizzesScreen.tsx`: Available quizzes list. Calls `studentService.getQuizzes()` at line 64. *(Live API)*
7. `QuizDetailsScreen.tsx`: Quiz instructions prompt. Calls `studentService.getQuizDetails()` at line 136. *(Live API)*
8. `StartQuizScreen.tsx`: Interactive countdown quiz player. Calls `studentService.startQuiz()` at line 86 and `submitQuiz()` at line 182. *(Live API)*
9. `QuizResultScreen.tsx`: Score breakdown after submission. Calls `studentService.getQuizResult()` at line 55. *(Live API)*
10. `ViewQuizDetailScreen.tsx`: Question-by-question review. Calls `studentService.getQuizDetails()` at line 47. *(Live API)*
11. `PerformanceScreen.tsx`: GPA & subject analytics. Calls `studentService.getInsights()` at line 53. *(Live API)*
12. `StudyMaterialScreen.tsx`: Downloadable class notes. Calls `studentService.getStudyMaterials()` at line 98. *(Live API)*
13. `AttendanceScreen.tsx`: Monthly attendance calendar. Calls `studentService.getAttendance()` at line 210. *(Live API)*
14. `AnnouncementScreen.tsx`: Notice board feed. Calls `studentService.getAnnouncements()` at line 55. Static mock array explicitly removed (line 33 comment); sets `setError('Failed to load announcements')` and empty array `[]` on error (lines 63–64) — **No silent mock fallbacks present**. *(Live API & Clean Error Handling)*
15. `GradesScreen.tsx`: Term-wise subject grades. Calls `studentService.getGrades()` at line 82. *(Live API)*
16. `FeesScreen.tsx`: Invoices & receipts. Calls `studentService.getInvoices()` at line 112 and `getReceipt()` at line 67. *(Live API)*
17. `TimetableScreen.tsx`: Weekly class schedule. Calls `studentService.getTimetable()` at line 178. *(Live API)*
18. `OfficialResultScreen.tsx`: Published RMS report card. Calls `studentService.getOfficialResult()` at line 66. *(Live API)*
19. `ResultManagementScreen.tsx`: Published exam report cards list. Calls `studentService.getOfficialResults()` at line 60. *(Live API)*
20. `Messages.tsx`: Chat messaging interface. Calls `messagesService.getConversations()` at line 243. *(Live API)*

### 6.3 Teacher Module (`src/screens/teacher/`) — 27 Screens
> *Note (Pass 3 Status)*: Teacher module screens were labeled during initial build and have **not** been re-verified line-by-line in Pass 3. Scheduled for dedicated pass.

1. `TeacherDashboard.tsx`: Dashboard summary & quick links. *(Labeled Live API)*
2. `TeacherAttendanceScreen.tsx`: Attendance management hub. *(Labeled Live API)*
3. `TeacherViewAttendanceScreen.tsx`: Attendance logs. *(Labeled Live API)*
4. `TeacherMarkAttendanceScreen.tsx`: Bulk attendance marker. *(Labeled Live API)*
5. `TeacherAssignmentScreen.tsx`: Teacher assignments list. *(Labeled Live API)*
6. `TeacherViewSubmissionScreen.tsx`: Grading submissions. *(Labeled Live API)*
7. `TeacherCreateAssignmentScreen.tsx`: Create assignment form. *(Labeled Live API)*
8. `TeacherEditAssignmentScreen.tsx`: Edit assignment form. *(Labeled Live API)*
9. `TeacherQuizScreen.tsx`: Teacher quizzes list. *(Labeled Live API)*
10. `TeacherCreateQuizScreen.tsx`: Quiz wizard Step 1. *(Labeled Live API)*
11. `TeacherCreateQuizStep2Screen.tsx`: Quiz wizard Step 2. *(Labeled Live API)*
12. `TeacherAddQuestionScreen.tsx`: Question modal editor. *(Labeled Live API)*
13. `TeacherCreateQuizStep3Screen.tsx`: Quiz publishing settings. *(Labeled Live API)*
14. `TeacherViewQuizResultScreen.tsx`: Quiz attempts analytics. *(Labeled Live API)*
15. `TeacherLiveQuizScreen.tsx`: Real-time quiz monitoring. *(Labeled Live API)*
16. `TeacherFreePeriodsScreen.tsx`: Free periods schedule. *(Labeled Live API)*
17. `TeacherStudyMaterialsScreen.tsx`: Upload study materials. *(Labeled Live API)*
18. `TeacherLeaveApplicationScreen.tsx`: Leave application form. *(Labeled Live API)*
19. `TeacherRMSWorkItemsScreen.tsx`: RMS marks entry queue. *(Labeled Live API)*
20. `TeacherRMSMarksSheetScreen.tsx`: Marks entry grid. *(Labeled Live API)*
21. `TeacherRMSReviewItemsScreen.tsx`: Review queue. *(Labeled Live API)*
22. `TeacherRMSReviewSummaryScreen.tsx`: Class marks review summary. *(Labeled Live API)*
23. `TeacherEquipmentRequestsScreen.tsx`: Equipment request form. *(Labeled Live API)*
24. `TeacherAnnouncementsScreen.tsx`: Class announcements. *(Labeled Live API)*
25. `TeacherTimetablePeriodsScreen.tsx`: Teacher timetable periods. *(Labeled Live API)*
26. `TeacherFaceScanScreen.tsx`: Biometric face attendance. *(Labeled Live API)*
27. `TeacherClassStudentsScreen.tsx`: Class student roster. *(Labeled Live API)*

### 6.4 Principal Module (`src/screens/principal/`) — 30 Screens (100% Re-Verified Pass 4)
1. `PrincipalDashboard.tsx`: Metrics overview. Calls `principalService.getDashboardSummary()` at line 76 and `approveEquipmentRequest()` at line 102. Quick action cards directly wired to destination screens. *(Live API)*
2. `PrincipalClassesScreen.tsx`: Academic classes list. Calls `principalService.getClasses()` at line 68. Export button cleanly muted (`opacity: 0.7`) with honest alert at line 124. *(Live API)*
3. `PrincipalClassDetailScreen.tsx`: Class student roster. Calls `principalService.getClassStudents()` at line 49. *(Live API)*
4. `PrincipalAddClassScreen.tsx`: Add class form. Calls `principalService.addClass()` at line 104. *(Live API)*
5. `PrincipalEditClassScreen.tsx`: Edit class details. Calls `principalService.editClass()` at line 118. *(Live API)*
6. `PrincipalManageClassScreen.tsx`: Section mappings. Calls `apiClient.post(/classes/:id/promote-bulk)` at line 155. Dead unused `subjects` state removed. *(Live API)*
7. `PrincipalSubjectsScreen.tsx`: Master subjects list. Calls `apiClient.get(ENDPOINTS.PRINCIPAL.SUBJECTS)` at line 128. Add button navigates to `PrincipalAddSubject`. Dead add modal state & handler removed. *(Live API)*
8. `PrincipalAddSubjectScreen.tsx`: Add subject form. Calls `apiClient.post(ENDPOINTS.PRINCIPAL.SUBJECTS)` at line 54. *(Live API)*
9. `PrincipalEditSubjectScreen.tsx`: Edit subject form. Calls `apiClient.put(ENDPOINTS.PRINCIPAL.SUBJECTS/:id)` at line 54. *(Live API)*
10. `PrincipalStaffScreen.tsx`: Staff roster. Calls `principalService.getTeachers()` at line 151. Export button cleanly muted at line 214. *(Live API)*
11. `PrincipalStaffDetailsScreen.tsx`: Staff profile. Calls `apiClient.get(ENDPOINTS.PRINCIPAL.STAFF/:id)` at line 73. *(Live API)*
12. `PrincipalAddStaffScreen.tsx`: Onboard staff. Calls `principalService.addTeacher()` at line 255. Self-contained search filtering via `SelectionModal`. *(Live API)*
13. `PrincipalEditStaffScreen.tsx`: Edit staff. Calls `principalService.updateTeacher()` at line 213. *(Live API)*
14. `PrincipalTeachersScreen.tsx`: Teacher assignments. Calls `principalService.getTeachers()` at line 53. *(Live API)*
15. `PrincipalMarkStaffAttendanceScreen.tsx`: Staff attendance marker. Calls `apiClient.post(/attendance/face-scan)` at line 225 with 7-second timeout. Log rows feature inline action buttons (View, Edit, Manual OUT, Delete). *(Live API)*
16. `PrincipalStudentDetailsScreen.tsx`: Master student roster / directory with client-side XLSX export. Calls `apiClient.get(ENDPOINTS.PRINCIPAL.ATTENDANCE_SUMMARY)` at line 205. Tapping student navigates to `PrincipalViewStudent`. *(Live API)*
17. `PrincipalAddStudentScreen.tsx`: Enroll student. Calls `principalService.getClasses()` at line 158. Self-contained search filtering via `SelectionModal`. *(Live API)*
18. `PrincipalEditStudentScreen.tsx`: Update student profile. Calls `principalService.getStudentDetail()` at line 127. *(Live API)*
19. `PrincipalViewStudentScreen.tsx`: Detailed individual student profile view (child drill-down from `PrincipalStudentDetailsScreen`). Calls `principalService.getStudentDetail()` at line 38. *(Live API)*
20. `PrincipalCalendarScreen.tsx`: Academic calendar. Calls `apiClient.get(ENDPOINTS.PRINCIPAL.CALENDAR_EVENTS)` at line 81. Export button cleanly muted at line 162. *(Live API)*
21. `PrincipalTimetableScreen.tsx`: Timetable manager. Calls `principalService.getTimetablePeriods()` at line 117. *(Live API)*
22. `PrincipalRMSScreen.tsx`: Exam definitions, View Results, and Global Progress Tracker (with exam context selector, class mapping progress, and Generate/Publish actions). Calls `principalService.getRmsExams()` at line 66. *(Live API)*
23. `PrincipalCreateExamScreen.tsx`: Create/Edit exam. Calls `principalService.getClasses()` at line 75, `getExamDetail()` at line 102, `createExam()` at line 291, `updateExam()` at line 282. *(Live API)*
24. `PrincipalReviewExamScreen.tsx`: Exam overview & subject mapping grid. Calls `principalService.getExamDetail()` at line 45. *(Live API)*
25. `PrincipalAnnouncementsScreen.tsx`: Notice publisher. Calls `principalService.getAnnouncements()` at line 87. *(Live API)*
26. `PrincipalFeesScreen.tsx`: Fees overview & invoices with double-entry receipt PDF generation (`react-native-html-to-pdf`), print (`react-native-print`), and share (`react-native-share`). Calls `principalService.getInvoiceStats()` at line 120. *(Live API)*
27. `PrincipalCreateInvoiceScreen.tsx`: Fee invoice generator. Calls `principalService.getClasses()` at line 77. *(Live API)*
28. `PrincipalEquipmentScreen.tsx`: Equipment request approvals with `isLoading` spinner and `isError` retry UI. Calls `principalService.getPendingEquipmentRequests()` at line 73. Export button cleanly muted at line 188. *(Live API)*
29. `PrincipalLibraryScreen.tsx`: Library catalog, circulation & real camera barcode/ISBN scanner via `react-native-vision-camera` v4 with code scanner and manual fallback. Calls `principalService.getLibraryDashboard()` at line 141. *(Live API)*
30. `PrincipalSyllabusLogsScreen.tsx`: Syllabus completion logs & audit blueprint ("Inspect Blueprint" parity). Calls `apiClient.get(ENDPOINTS.PRINCIPAL.SYLLABUS_LOGS)`. *(Live API)*

---

## 7. Bus Tracking Sub-Module (`src/screens/principal/bus/`) — 10 Screens

The repository contains 10 bus tracking screens:
`BusDashboardScreen.tsx`, `DriverManagementScreen.tsx`, `FleetTrackingScreen.tsx`, `RouteManagementScreen.tsx`, `RouteConfigurationScreen.tsx`, `SchedulesScreen.tsx`, `AddDriverScreen.tsx`, `AddScheduleScreen.tsx`, `AddVehicleScreen.tsx`, `EnrollStudentScreen.tsx`.

### Pass 3 Verification
- **Current Code Status**: Prototype UI relying entirely on static mock arrays (`MOCK_BUSES`, `MOCK_DRIVERS`, `MOCK_ROUTES`).
- **Backend Integration**: Unwired to live backend APIs. Excluded from release audit per explicit instruction.

---

## 8. Complete Confirmed-Endpoints & RMS Expansion Table

*Pass 3 Note: Cross-checked against 176 route handlers in backend zip `HRT-main` (`src/app/api/`).*

| Module | HTTP Method | App Endpoint Path | Backend Route File (`HRT-main`) | Request Payload | Response Payload | Status |
|---|:---:|---|---|---|---|:---:|
| **Auth** | POST | `/auth/login` | `src/app/api/auth/login/route.js` | `{ email, password, role }` | `{ success, token, user }` | Confirmed |
| **Auth** | POST | `/auth/refresh` | `src/app/api/auth/refresh/route.js` | `{ refreshToken }` | `{ accessToken, refreshToken }` | Confirmed |
| **Auth** | GET | `/auth/me` | `src/app/api/auth/me/route.js` | None | `{ success, user }` | Confirmed |
| **Auth** | POST | `/auth/forgot-password` | `src/app/api/auth/forgot-password/route.js` | `{ email }` | `{ message }` | Confirmed |
| **Auth** | POST | `/auth/reset-password` | `src/app/api/auth/reset-password/route.js` | `{ token, password }` | `{ message }` | Confirmed |
| **Student** | GET | `/students/:id/dashboard` | `src/app/api/students/[id]/dashboard/route.js` | None | `{ summary, assignments, quizzes }` | Confirmed |
| **Student** | GET | `/students/:id/schedule` | `src/app/api/students/[id]/schedule/route.js` | None | `{ schedule: [...] }` | Confirmed |
| **Student** | GET | `/students/:id/attendance` | `src/app/api/students/[id]/attendance/route.js` | None | `{ attendance: [...] }` | Confirmed |
| **Student** | GET | `/students/:id/assignments` | `src/app/api/students/[id]/assignments/route.js` | None | `{ assignments: [...] }` | Confirmed |
| **Student** | GET | `/assignments/:id` | `src/app/api/assignments/[id]/route.js` | None | `{ data: Assignment }` | Confirmed |
| **Student** | POST | `/assignments/:id/submissions` | `src/app/api/assignments/[id]/submissions/route.js` | `FormData` (file, notes) | `{ success, submission }` | Confirmed |
| **Student** | GET | `/quizzes` | `src/app/api/quizzes/route.js` | None | `{ quizzes: [...] }` | Confirmed |
| **Student** | GET | `/quizzes/:id/questions` | `src/app/api/quizzes/[id]/questions/route.js` | None | `{ questions: [...] }` | Confirmed |
| **Student** | POST | `/quizzes/:id/submit` | `src/app/api/quizzes/[id]/submit/route.js` | `{ answers: [...] }` | `{ score, percentage, result }` | Confirmed |
| **Student** | GET | `/students/performance` | `src/app/api/students/performance/route.js` | None | `{ performanceData }` | Confirmed |
| **Student** | GET | `/announcements` | `src/app/api/announcements/route.js` | None | `{ announcements: [...] }` | Confirmed |
| **Student** | GET | `/timetable` | `src/app/api/timetable/route.js` | None | `{ timetable: [...] }` | Confirmed |
| **Student** | GET | `/rms/results/student` | `src/app/api/rms/results/student/route.js` | None | `{ results: [...] }` | Confirmed |
| **Teacher** | GET | `/teachers/:id/dashboard-summary` | `src/app/api/teachers/[id]/dashboard-summary/route.js` | None | `{ summary }` | Confirmed |
| **Teacher** | GET | `/teachers/:id/classes` | `src/app/api/teachers/[id]/classes/route.js` | None | `{ classes: [...] }` | Confirmed |
| **Teacher** | GET | `/classes/:classId/students` | `src/app/api/classes/[classId]/students/route.js` | None | `{ students: [...] }` | Confirmed |
| **Teacher** | POST | `/classes/:classId/attendance/bulk` | `src/app/api/classes/[classId]/attendance/bulk/route.js` | `{ date, records: [...] }` | `{ success }` | Confirmed |
| **Teacher** | GET | `/teachers/:id/assignments` | `src/app/api/teachers/[id]/assignments/route.js` | None | `{ assignments: [...] }` | Confirmed |
| **Teacher** | POST | `/teachers/:id/assignments` | `src/app/api/teachers/[id]/assignments/route.js` | `{ title, dueDate, classId }` | `{ success, assignment }` | Confirmed |
| **Teacher** | GET | `/assignments/:id/submissions` | `src/app/api/assignments/[id]/submissions/route.js` | None | `{ submissions: [...] }` | Confirmed |
| **Teacher** | POST | `/quizzes` | `src/app/api/quizzes/route.js` | `{ title, duration, questions }` | `{ success, quizId }` | Confirmed |
| **Principal**| GET | `/institution/dashboard-metrics` | `src/app/api/institution/dashboard-metrics/route.js` | None | `{ metrics }` | Confirmed |
| **Principal**| GET | `/classes` | `src/app/api/classes/route.js` | None | `{ classes: [...] }` | Confirmed |
| **Principal**| POST | `/classes` | `src/app/api/classes/route.js` | `{ name, section, grade }` | `{ success, class }` | Confirmed |
| **Principal**| DELETE | `/classes/:id` | `src/app/api/classes/[id]/route.js` | None | `{ success }` | Confirmed |
| **Principal**| GET | `/subjects` | `src/app/api/subjects/route.js` | None | `{ subjects: [...] }` | Confirmed |
| **Principal**| GET | `/tenants/:institutionId/teachers` | `src/app/api/tenants/[id]/teachers/route.js` | None | `{ teachers: [...] }` | Confirmed |
| **Principal**| GET | `/rms/exams` | `src/app/api/rms/exams/route.js` | None | `{ data: [...] }` | Confirmed |
| **Principal**| GET | `/rms/exams/:id` | `src/app/api/rms/exams/[id]/route.js` | None | `{ data: ExamDetail }` | Confirmed |
| **Principal**| POST | `/rms/exams` | `src/app/api/rms/exams/route.js` | `{ name, examType, academicYear, classes }` | `{ success, id }` | Confirmed |
| **Principal**| PATCH | `/rms/exams/:id` | `src/app/api/rms/exams/[id]/route.js` | `{ name, examType, status, classes }` | `{ success }` | Confirmed |
| **Principal**| DELETE | `/rms/exams/:id` | `src/app/api/rms/exams/[id]/route.js` | None | `{ success }` | Confirmed |
| **Principal**| GET | `/rms/marks/audit/:marksId` | `src/app/api/rms/marks/audit/[marksId]/route.js` | None | `{ history: [...] }` | Confirmed |
| **RMS Core** | POST | `/rms/results/generate` | `src/app/api/rms/results/generate/route.js` | `{ examId, classId }` | `{ success, count }` | Backend available, not called by app yet |
| **RMS Core** | POST | `/rms/results/publish` | `src/app/api/rms/results/publish/route.js` | `{ examId, classId, template }` | `{ success }` | Backend available, not called by app yet |
| **RMS Core** | GET | `/rms/results/preview` | `src/app/api/rms/results/preview/route.js` | `?examId=&classId=` | `{ previewData }` | Backend available, not called by app yet |
| **RMS Core** | GET | `/rms/result-templates` | `src/app/api/rms/result-templates/route.js` | None | `{ templates }` | Backend available, not called by app yet |
| **RMS Core** | GET | `/rms/results/admin` | `src/app/api/rms/results/admin/route.js` | None | `{ results }` | Backend available, not called by app yet |
| **RMS Core** | GET | `/rms/results/admin/student-result` | `src/app/api/rms/results/admin/student-result/route.js` | `?studentId=&examId=` | `{ studentResult }` | Backend available, not called by app yet |
| **RMS Core** | POST | `/rms/marks/review/approve` | `src/app/api/rms/marks/review/approve/route.js` | `{ examId, classId, subjectId }` | `{ success }` | Backend available, defined in `constants/api.ts` |
| **RMS Core** | POST | `/rms/marks/review/reject` | `src/app/api/rms/marks/review/reject/route.js` | `{ examId, classId, subjectId, reason }` | `{ success }` | Backend available, defined in `constants/api.ts` |
| **RMS Core** | POST | `/rms/marks/recall` | `src/app/api/rms/marks/recall/route.js` | `{ examId, classId, subjectId }` | `{ success }` | Backend available, defined in `constants/api.ts` |
| **RMS Core** | GET | `/rms/marks/sheet` | `src/app/api/rms/marks/sheet/route.js` | `?examId=&classId=&subjectId=` | `{ marksSheet }` | Backend available, defined in `constants/api.ts` |
| **RMS Core** | GET | `/rms/marks/review/summary` | `src/app/api/rms/marks/review/summary/route.js` | `?examId=&classId=` | `{ summary }` | Backend available, defined in `constants/api.ts` |
| **RMS Core** | GET | `/rms/marks/review/work-items` | `src/app/api/rms/marks/review/work-items/route.js` | None | `{ workItems }` | Backend available, defined in `constants/api.ts` |
| **RMS Core** | GET | `/rms/marks/work-items` | `src/app/api/rms/marks/work-items/route.js` | None | `{ workItems }` | Backend available, defined in `constants/api.ts` |
| **RMS Core** | POST | `/rms/marks/bulk-save` | `src/app/api/rms/marks/bulk-save/route.js` | `{ examId, classId, subjectId, marks }` | `{ success }` | Backend available, defined in `constants/api.ts` |
| **RMS Core** | POST | `/rms/marks/submit` | `src/app/api/rms/marks/submit/route.js` | `{ examId, classId, subjectId }` | `{ success }` | Backend available, defined in `constants/api.ts` |
| **Messages** | GET | `/messages/contacts` | `src/app/api/messages/contacts/route.js` | None | `{ contacts: [...] }` | Confirmed |
| **Messages** | GET | `/messages?recipientId=:id` | `src/app/api/messages/route.js` | None | `{ messages: [...] }` | Confirmed |
| **Messages** | POST | `/messages` | `src/app/api/messages/route.js` | `{ recipientId, content }` | `{ message }` | Confirmed |

---

## 9. Authentication & Session Handling

- Auth state is persisted in `@react-native-async-storage/async-storage` under key `@auth_state`.
- `getStoredTokens()` reads `accessToken` and `csrfToken`.
- **The `COOKIE_AUTH` Situation**:
  - The backend migrated to HttpOnly cookies for web auth and returns `token: "COOKIE_AUTH"` when raw JWT is omitted.
  - In `apiClient.ts` (lines 263–281):
    ```typescript
    const isValidBearerToken = accessToken && accessToken !== 'COOKIE_AUTH' && accessToken !== 'null' && accessToken !== 'undefined';
    ```
  - `apiClient.ts` skips attaching `Authorization: Bearer COOKIE_AUTH` when `accessToken` is `'COOKIE_AUTH'`.
  - **Constraint**: This block is explicitly preserved and deferred.

---

## 10. API Call Conventions & Known Gotchas

### Standard Service Function Pattern
```typescript
async getExams() {
  const res = await apiClient.get<{ success: boolean; data: RmsExamItem[] }>(ENDPOINTS.PRINCIPAL.RMS_EXAMS);
  return res.data;
}
```

### Known Gotchas
1. **FormData Stringification in Axios 1.x**:
   When posting `FormData` with a global `Content-Type: application/json` default header, Axios 1.x attempts to JSON-stringify the `FormData` body.  
   *Fix*: Pass `transformRequest: (data) => data` and explicit `headers: { 'Content-Type': 'multipart/form-data' }`.
2. **Proxy Crash on Primitive Strings**:
   Proxy handlers crash when target objects are non-object primitives (e.g. raw string SSE events).  
   *Fix*: Guard with `typeof target === 'object' && target !== null`.

---

## 11. Screen Conventions & Standard Patterns

### Standard Screen Template Pattern
Reference Screen: [`PrincipalTimetableScreen.tsx`](file:///d:/sharenex/sharnexapp/MyApp/src/screens/principal/PrincipalTimetableScreen.tsx)
```tsx
const ScreenComponent = ({ navigation }: any) => {
  const { theme, isDarkMode } = useTheme();
  const { authState } = useAuth();
  const styles = getStyles(theme, isDarkMode);

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      
      {/* 3-Part Standard Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle}>Screen Title</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('AccountSettings')}>
          <AvatarUser user={authState.user} />
        </TouchableOpacity>
      </View>

      {/* Screen Body */}
    </View>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
});
```

---

## 12. Navigation Structure

Registered Stack Screens in `App.tsx`:
- **Auth**: `Home`, `Login`, `ForgotPassword`, `ResetPassword`
- **Student**: `StudentDashboard`, `Assignments`, `Quizzes`, `Performance`, `StudyMaterial`, `Attendance`, `OfficialResult`, `ResultManagement`
- **Teacher**: `TeacherDashboard`, `TeacherAttendance`, `TeacherAssignment`, `TeacherQuiz`
- **Principal**: `PrincipalDashboard`, `PrincipalClasses`, `PrincipalClassDetail`, `PrincipalAddClass`, `PrincipalEditClass`, `PrincipalManageClass`, `PrincipalStaff`, `PrincipalStaffDetails`, `PrincipalAddStaff`, `PrincipalEditStaff`, `PrincipalRMS`, `PrincipalCreateExam`, `PrincipalEditExam`, `PrincipalReviewExam`, `PrincipalFees`, `PrincipalCalendar`, `PrincipalLibrary`, `PrincipalEquipment`

---

## 13. Backend Systems — RMS vs Quiz System (Verified Architecture)

Pass 3 verification against `database/migrations/021_add_rms_foundation.sql` and `src/lib/validations/rmsSchemas.js` established that **RMS consists of 3 distinct, decoupled state machines**:

1. **Exam Definition Lifecycle (`exams.status`)**:
   - Enum: `DRAFT` | `ACTIVE` | `COMPLETED` *(Managed by Principal)*
2. **Marks Entry Workflow Status (`marks.workflow_status`)**:
   - Enum: `DRAFT` | `SUBMITTED` | `APPROVED` | `REJECTED` | `LOCKED` *(Teacher entry & Principal review)*
3. **Report Card Result Status (`results.result_status`)**:
   - Enum: `INCOMPLETE` | `GENERATED` | `PUBLISHED` *(Student published report cards)*

- **Quiz System**:
  Auto-graded online quizzes, timers, multiple choice questions, and instant score submission (`/api/quizzes/*`).

---

## 14. Protected / Do-Not-Touch List

1. **`StudentHeader.tsx`**, **`TeacherHeader.tsx`**, **`NavigationDrawer.tsx`**: Never structurally modify.
2. **`COOKIE_AUTH` block in `apiClient.ts` (lines 263–281)**: Out of scope unless instructed.
3. **Shared Layout Helpers**: Preserve theme tokens and safe area margins across shared header components.

---

## 15. Design Source of Truth

The Next.js website (`sharnex.com`) is the authoritative visual reference for all Principal/Admin control screens. Every redesigned principal module screen must visually and behaviorally match its web counterpart.

---

## 16. Open Product & Design Decisions (Evidenced Code Search)

1. **`HALF_DAY` Staff Attendance Status Support (Verified Against Backend)**:
   - **File & Line**: [`PrincipalMarkStaffAttendanceScreen.tsx:L368`](file:///d:/sharenex/sharnexapp/MyApp/src/screens/principal/PrincipalMarkStaffAttendanceScreen.tsx#L368)
   - **Evidence**: `// TODO: Verify if backend supports HALF_DAY status for manual attendance. Currently sending type: 'HALF_DAY'`
   - **Backend Verification**: Verified in `HRT-main/src/app/api/attendance/manual/route.js` lines 66–70: `if (!type || !["IN", "OUT"].includes(type)) return NextResponse.json({ message: "type must be IN or OUT" }, { status: 400 });`.
   - **Conclusion**: The backend strictly validates `type` to be `"IN"` or `"OUT"` only; `HALF_DAY` is rejected with 400. Web reference modal (`ManualAttendanceModal.js`) only provides "Check IN" and "Check OUT". Status should be limited to `IN` and `OUT`.

2. **Student Roll Number Display Fallback (`rollNoStrategy`)**:
   - **File & Line**: [`TeacherViewAttendanceScreen.tsx:L251`](file:///d:/sharenex/sharnexapp/MyApp/src/screens/teacher/TeacherViewAttendanceScreen.tsx#L251)
   - **Evidence**: `{/* Show roll number if available, otherwise show a short ID */}`
   - **Current Fallback**: App displays `rollNo` if populated; if `null`/`undefined`, falls back to displaying `ID: ${studentId.slice(0, 8)}`.

3. **Active Students Count Aggregation Key**:
   - **File & Line**: [`PrincipalDashboard.tsx:L139`](file:///d:/sharenex/sharnexapp/MyApp/src/screens/principal/PrincipalDashboard.tsx#L139)
   - **Evidence**: `const totalStudents = metrics.totalStudents ?? metrics.students ?? 0;`
   - **Current Fallback**: Priority chain checking `totalStudents`, then `students`, then `0`.

4. **Class Permanent Deletion Behavior**:
   - **File & Line**: [`PrincipalClassesScreen.tsx:L95`](file:///d:/sharenex/sharnexapp/MyApp/src/screens/principal/PrincipalClassesScreen.tsx#L95)
   - **Evidence**: `Are you sure you want to permanently delete ${className}? This action cannot be undone.`
   - **Current Fallback**: Prompts confirmation alert and calls `principalService.deleteClass(id)`.

5. **Missing Backend Export Endpoints**:
   - Backend export APIs for Classes, Staff, Fees, Equipment, and Calendar do not exist on the server.
   - **Decision Applied**: Per user preference, export buttons are visually muted (`opacity: 0.7`) and display an honest `"Export Not Available"` alert notification when pressed.

6. **Student Directory vs Profile Screens (`PrincipalStudentDetails` vs `PrincipalViewStudent`)**:
   - **Files**: [`PrincipalStudentDetailsScreen.tsx`](file:///d:/sharenex/sharnexapp/MyApp/src/screens/principal/PrincipalStudentDetailsScreen.tsx) and [`PrincipalViewStudentScreen.tsx`](file:///d:/sharenex/sharnexapp/MyApp/src/screens/principal/PrincipalViewStudentScreen.tsx)
   - **Architecture Verification**: Confirmed not duplicates. Master-detail relationship:
     - `PrincipalStudentDetailsScreen.tsx`: Student Directory list (`/institution/students`), bound to the drawer menu navigation (`"Students details"`).
     - `PrincipalViewStudentScreen.tsx`: Individual Student Profile detail screen (`/institution/students/[id]`), reached via `navigation.navigate('PrincipalViewStudent', { studentId: item.id })` from student cards.

7. **RMS Global Progress Tracker Parity**:
   - **File**: [`PrincipalRMSScreen.tsx`](file:///d:/sharenex/sharnexapp/MyApp/src/screens/principal/PrincipalRMSScreen.tsx)
   - **Status**: Implemented parity with web's `/institution/rms/tracker` by adding a third tab ("Global Progress Tracker") featuring exam context selection, mapped classes & subjects metrics, per-class progress items, and Generate Results (`POST /rms/results/generate`) / Publish Results (`POST /rms/results/publish`) actions.

---

## 17. Working Methods & House Style

- **Automated Audit Scanning Scripts**: Node.js runner scripts executed dynamically in session scratch storage (`<appDataDir>/brain/<conversation-id>/scratch/`) for inspecting line numbers and endpoint call sites.
- **File-Scoped Style Overrides**: Theme overrides are encapsulated via `getStyles(theme, isDarkMode)` functions inside individual screen files rather than mutating shared theme constants.
- **Verification Gate**: `npx tsc --noEmit` is executed after every code edit to guarantee 0 TypeScript compilation errors.

---

## 18. Living Project Changelog

| Date | Module | Action / Audit / Fix | Status |
|---|---|---|:---:|
| **2026-08-10** | Student | ~21 screens audited; performance and official result screens verified | Done |
| **2026-08-11** | Teacher RMS | Audited and redesign-prompted | Done |
| **2026-08-12** | Principal RMS | Implemented Screens A–F (RMS List, View Results tab, Create/Edit Exam, Review Exam, Marks Audit Modal) | Done |
| **2026-08-12** | Principal RMS | Fixed header regression across `PrincipalRMSScreen`, `PrincipalCreateExamScreen`, `PrincipalReviewExamScreen` to match `PrincipalTimetableScreen` | Done |
| **2026-08-12** | Principal Audit | Pre-release audit executed (Bus tracking prototype excluded per user request; resolved 19 findings across Blockers, Majors, and Minors; deleted orphaned legacy file `PrincipalRSMscreen.tsx`; updated export buttons with honest disabled alerts) | Done |
| **2026-08-12** | Core | Created comprehensive `AGENT.md` codebase context file | Done |
| **2026-08-12** | Core Pass 3 | Verified line-by-line against real codebase & 176 backend routes in `HRT-main`; corrected RMS 3-decoupled-state-machines architecture; re-verified 20 Student screens & 29 Principal screens with exact file:line evidence | Verified |
| **2026-08-12** | Core Pass 3.1 | Confirmed StudentDashboard & AnnouncementScreen clean error handling (no mock fallbacks); expanded RMS endpoints in table with confirmation status; documented evidenced open decisions (`HALF_DAY`, `rollNoStrategy`, `metrics.totalStudents`) | Verified |
| **2026-09-09** | Principal Module | Pass 4 full parity audit & quality bug fixes: Real `react-native-vision-camera` v4 barcode/ISBN scanner integrated in `PrincipalLibraryScreen`; resolved dead `activeGuide` with direct navigation in `PrincipalDashboard`; cleaned up dead state/handlers in `PrincipalManageClassScreen` (unused `subjects`) and `PrincipalSubjectsScreen` (dead modal state/handler); added `isLoading`/`isError` feedback in `PrincipalEquipmentScreen`; verified `SelectionModal` self-contained search; verified 100% theme token migration across all 30 Principal screens; confirmed backend `HALF_DAY` rejection via `HRT-main` route inspection; verified student screens master-detail architecture; implemented RMS tracker parity tab in `PrincipalRMSScreen`. | Verified |

---

## 19. How to Verify Work Before Calling It Done

1. Run `npx tsc --noEmit` and confirm **0 errors**. *(Pass 3 verified)*
2. Verify visual appearance in both Light and Dark modes.
3. Confirm code is staged in git without autonomous commits or pushes.

---

## 20. Keep This File Honest

*Instruction for future agents*: If you discover any pattern, file location, or API schema in this codebase that has evolved or differs from what is documented here, update `AGENT.md` as part of your task. Always update the **Last Updated** date at the top of this document.
