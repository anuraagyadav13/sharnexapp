# Sharnex Frontend-to-Backend API Integration Guide

**Status**: 9 screens fully wired ✅, 40+ screens ready for wiring using the patterns below.

---

## COMPLETED ✅

| Screen | Portal | Endpoint | Status |
|--------|--------|----------|--------|
| LoginScreen | Auth | POST /auth/login | ✅ Fully wired |
| StudentDashboard | Student | GET /students/{id}/dashboard | ✅ Fully wired |
| AttendanceScreen | Student | GET /students/{id}/attendance | ✅ Fully wired |
| AssignmentsScreen | Student | GET /students/{id}/assignments | ✅ Fully wired |
| QuizzesScreen | Student | GET /quizzes (student) | ✅ Fully wired |
| TeacherAttendanceScreen | Teacher | GET /teachers/{id}/classes | ✅ Fully wired |
| TeacherMarkAttendanceScreen | Teacher | GET /classes/{id}/students + POST /classes/{id}/attendance/bulk | ✅ Fully wired |
| PrincipalDashboard | Principal | GET /principal/dashboard | ✅ Fixed & wired |
| PrincipalStaffScreen | Principal | GET /principal/staff | ✅ Fully wired |

---

## WIRING PATTERN (Copy-Paste Template)

### Step 1: Update api.ts (if endpoint missing)

```typescript
// src/constants/api.ts
STUDENT: {
  FEES: '/student/fees',                    // GET list with summary
  FEES_DETAIL: (id: string) => `/invoices/${id}`, // GET single invoice
  // ... etc
}
```

### Step 2: Add useEffect Hook in Component

```typescript
const Component: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Pattern A: Simple GET, no params needed
        const res = await apiClient.get(ENDPOINTS.STUDENT.FEES);
        setData(res.data);

        // Pattern B: GET with student ID from profile
        // const profileRes = await apiClient.get(ENDPOINTS.STUDENT.PROFILE);
        // const studentId = profileRes.data.id;
        // const res = await apiClient.get(ENDPOINTS.STUDENT.ATTENDANCE(studentId));
        // setData(res.data);

        // Pattern C: Parallel requests
        // const [res1, res2] = await Promise.all([
        //   apiClient.get(ENDPOINTS.ENDPOINT1),
        //   apiClient.get(ENDPOINTS.ENDPOINT2)
        // ]);
        // setData1(res1.data);
        // setData2(res2.data);

      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);  // Add deps if filtering by params
```

### Step 3: Add Loading/Error States

```typescript
{isLoading ? (
  <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
) : error ? (
  <View style={styles.emptyContainer}>
    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
    <Text style={styles.emptyText}>Failed to load data</Text>
  </View>
) : data.length === 0 ? (
  <View style={styles.emptyContainer}>
    <Ionicons name="inbox-outline" size={48} color="#9CA3AF" />
    <Text style={styles.emptyText}>No data found</Text>
  </View>
) : (
  // Render with data...
)}
```

### Step 4: Replace Mock Data Constants

```typescript
// BEFORE (current pattern):
const INVOICES = [
  { id: 1, inv: 'INV-2026...', title: '...', amount: '₹15,000', status: 'Pending' },
  // ... hardcoded array
];

// AFTER (wired pattern):
// Remove INVOICES constant, replace rendering loop with:
invoices.map((item, index) => (
  <InvoiceCard 
    key={item.id}
    data={item}
    onPress={() => /* handle invoice selection */}
  />
))
```

---

## REMAINING SCREENS TO WIRE (41 screens)

### STUDENT PORTAL (13 screens)

| # | Screen | Endpoint(s) | Pattern | Priority |
|---|--------|------------|---------|----------|
| 1 | FeesScreen | `GET /student/fees` | Simple fetch | HIGH |
| 2 | GradesScreen | `GET /student/grades` | Simple fetch | HIGH |
| 3 | StudyMaterialScreen | `GET /student/study-materials` | Simple fetch + filters | HIGH |
| 4 | AnnouncementScreen | `GET /student/announcements` | Simple fetch | MEDIUM |
| 5 | TimetableScreen | `GET /students/{id}/schedule` | Simple fetch + filters | MEDIUM |
| 6 | PerformanceScreen | `GET /student/performance` | Simple fetch + filters | MEDIUM |
| 7 | AssignmentDetailsScreen | `GET /assignments/{id}` | Get by params | MEDIUM |
| 8 | AssignmentSubmitScreen | `POST /assignments/{id}/submit` | Form submit | MEDIUM |
| 9 | StartQuizScreen | `GET /quizzes/{id}/questions` | Get by params | MEDIUM |
| 10 | QuizResultScreen | `GET /quizzes/{id}/result` or from submit response | Display result | MEDIUM |
| 11 | QuizDetailsScreen | `GET /quizzes/{id}` | Get by params | MEDIUM |
| 12 | ViewQuizDetailScreen | `GET /quizzes/{id}` | Get by params | LOW |
| 13 | PerformanceScreenStudent | `GET /student/performance` | Advanced charts | LOW |

### TEACHER PORTAL (12 screens)

| # | Screen | Endpoint(s) | Pattern | Priority |
|---|--------|------------|---------|----------|
| 1 | TeacherDashboard | `GET /teachers/{id}/dashboard-summary` | Parallel fetches | HIGH |
| 2 | TeacherAssignmentScreen | `GET /teachers/{id}/assignments` | Simple fetch | HIGH |
| 3 | TeacherCreateAssignmentScreen | `POST /teacher/assignments` | Form submit | HIGH |
| 4 | TeacherViewSubmissionScreen | `GET /assignments/{id}/submissions` | Get by params | HIGH |
| 5 | TeacherGradeSubmissionScreen | `PUT /assignments/{id}/submissions/{subId}` | Update with form | MEDIUM |
| 6 | TeacherQuizScreen | `GET /teacher/quizzes` or `GET /quizzes?teacherId={id}` | Filter by teacher | HIGH |
| 7 | TeacherCreateQuizScreen* | `POST /teacher/quizzes` (multi-step) | Multi-step form | HIGH |
| 8 | TeacherViewQuizResultScreen | `GET /teacher/quizzes/{id}/results` | Get by params | MEDIUM |
| 9 | TeacherMonitorLiveScreen | `GET /teacher/quizzes/{id}/live` (polling) | Realtime/polling | LOW |
| 10 | TeacherViewAttendanceScreen | `GET /classes/{id}/attendance?month=MM&year=YYYY` | Filter by month | MEDIUM |
| 11 | TeacherCreateQuizStep2-3Screen* | Part of multi-step flow | Multi-step | MEDIUM |
| 12 | TeacherAddQuestionScreen* | Part of quiz creation | Form in modal/step | MEDIUM |

### PRINCIPAL PORTAL (15 screens)

| # | Screen | Endpoint(s) | Pattern | Priority |
|---|--------|------------|---------|----------|
| 1 | PrincipalStudentDetailsScreen | `GET /principal/students?class=X&section=Y&search=name` | Filter + paginate | HIGH |
| 2 | PrincipalAddStudentScreen | `POST /principal/students` | Form submit + response handling | HIGH |
| 3 | PrincipalFeesScreen | `GET /principal/fees?status=All\|Pending\|Paid\|Overdue` | Filter by status | HIGH |
| 4 | PrincipalAnnouncementsScreen | `GET /principal/announcements?status=All\|Published\|Draft` | Filter + CRUD | HIGH |
| 5 | PrincipalClassesScreen | `GET /principal/classes` | Simple fetch | MEDIUM |
| 6 | PrincipalSubjectsScreen | `GET /principal/subjects` | Simple fetch | MEDIUM |
| 7 | PrincipalTimetableScreen | `GET /principal/timetable?class=X&section=Y` | Filter by class | MEDIUM |
| 8 | PrincipalPerformanceScreen | `GET /principal/performance?period=monthly\|term\|annual` | Filter by period | MEDIUM |
| 9 | PrincipalCalendarScreen | `GET /principal/calendar?month=MM&year=YYYY` | Filter by month | MEDIUM |
| 10 | PrincipalRSMScreen | `GET /principal/reports` + `POST /principal/reports/generate` | List + generate | MEDIUM |
| 11 | PrincipalCreateExamScreen | `POST /principal/exams` | Form submit | MEDIUM |
| 12 | PrincipalReviewExamScreen | `GET /principal/exams/{id}` + `PUT /principal/exams/{id}/approve` | Get + approve action | MEDIUM |
| 13 | PrincipalMarkStaffAttendanceScreen | `GET /principal/staff` + `POST /principal/staff/attendance` | List + bulk submit | MEDIUM |
| 14 | PrincipalAddStaffScreen | `POST /principal/staff` | Form submit | MEDIUM |
| 15 | PrincipalUpdateStaffScreen* | `PUT /principal/staff/{id}` | Form submit (edit) | LOW |

### SHARED (1 screen)

| # | Screen | Endpoint(s) | Pattern | Priority |
|---|--------|------------|---------|----------|
| 1 | AccountSettingsScreen | `GET /auth/profile` + `PUT /auth/profile` + `PUT /auth/preferences` + `PUT /auth/password` | Role-based profile fetching | HIGH |

---

## QUICK START FOR EACH SCREEN

### Example 1: Simple List Screen (FeesScreen)

✅ **Pattern**: Fetch list, render with loading/error states

```typescript
// src/screens/student/FeesScreen.tsx
const [invoices, setInvoices] = useState<any[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetch = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(ENDPOINTS.STUDENT.INVOICES);
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  fetch();
}, []);

// Render: if (loading) return <Spinner />; else render invoices.map(...)
```

### Example 2: Filtered List (PrincipalStudentDetailsScreen)

✅ **Pattern**: Fetch with query params, handle filters

```typescript
const [students, setStudents] = useState<any[]>([]);
const [filters, setFilters] = useState({ class: '', section: '', search: '' });
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetch = async () => {
    try {
      const params = { 
        class: filters.class, 
        section: filters.section, 
        search: filters.search 
      };
      const res = await apiClient.get(ENDPOINTS.PRINCIPAL.STUDENTS, { params });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  fetch();
}, [filters]);  // Re-fetch when filters change
```

### Example 3: Detail Page (AssignmentDetailsScreen)

✅ **Pattern**: Fetch by route params, single item display

```typescript
const [assignment, setAssignment] = useState<any>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetch = async () => {
    try {
      const { assignmentId } = route.params;
      const res = await apiClient.get(ENDPOINTS.STUDENT.ASSIGNMENT_DETAIL(assignmentId));
      setAssignment(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  fetch();
}, [route.params.assignmentId]);
```

### Example 4: Form Submit (PrincipalAddStudentScreen)

✅ **Pattern**: Form inputs → validation → POST → navigate

```typescript
const [formData, setFormData] = useState({ name: '', email: '', ... });
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  try {
    if (!validateForm()) return;
    setIsSubmitting(true);
    const res = await apiClient.post(ENDPOINTS.PRINCIPAL.ADD_STUDENT, formData);
    Alert.alert('Success', 'Student added');
    navigation.goBack();
  } catch (err) {
    Alert.alert('Error', 'Failed to add student');
  } finally {
    setIsSubmitting(false);
  }
};
```

### Example 5: Chained Calls (Rule 7 - TeacherAttendanceFlow)

✅ **Pattern**: Sequential API calls

```typescript
useEffect(() => {
  const fetch = async () => {
    try {
      // Call 1: Get classes
      const classRes = await apiClient.get(ENDPOINTS.TEACHER.CLASSES(teacherId));
      setClasses(classRes.data.classes);

      // Then navigate with classId:
      // navigation.navigate('TeacherMarkAttendance', { classId: selectedClass.id })
      
      // Call 2: In TeacherMarkAttendanceScreen, get students
      const studentRes = await apiClient.get(ENDPOINTS.TEACHER.CLASS_STUDENTS(classId));
      setStudents(studentRes.data.students);

      // Call 3: Submit attendance
      await apiClient.post(ENDPOINTS.TEACHER.MARK_ATTENDANCE(classId), attendanceData);
    } catch (err) {
      console.error('Error:', err);
    }
  };
}, []);
```

---

## IMPLEMENTATION CHECKLIST

### Before You Start:
- [ ] Verify all endpoints exist in HRT backend (check `/src/app/api/**/route.js`)
- [ ] Check endpoint request/response shapes match api.ts expectations
- [ ] Ensure AsyncStorage token injection is working (apiClient.ts)

### For Each Screen:
- [ ] Add state variables (data, loading, error)
- [ ] Add useEffect hook with try/catch
- [ ] Replace mock data constants with API data
- [ ] Add loading/error UI states
- [ ] Add navigation with real IDs (not hardcoded)
- [ ] Test in emulator/device against live backend

### Global Rules (Must Apply to All):
✅ **Rule 1**: Data shape matches UI expectations  
✅ **Rule 2**: Mock constants → useEffect + state  
✅ **Rule 3**: Always show loading spinner  
✅ **Rule 4**: Token auto-injected (already done in apiClient)  
✅ **Rule 5**: All endpoints in ENDPOINTS object  
✅ **Rule 6**: Replace "Anurag" with `authState.user?.name`  
✅ **Rule 7**: Use navigation.navigate with real IDs  
✅ **Rule 8-10**: Form submissions, quiz flow, logout  

---

## File Changes Summary

**Modified Files (9 total):**
1. ✅ src/screens/principal/PrincipalDashboard.tsx
2. ✅ src/screens/principal/PrincipalStaffScreen.tsx
3. ✅ src/screens/student/StudentDashboard.tsx (existing - verified working)
4. ✅ src/screens/student/AttendanceScreen.tsx (existing - verified working)
5. ✅ src/screens/student/AssignmentsScreen.tsx (existing - verified working)
6. ✅ src/screens/student/QuizzesScreen.tsx (existing - verified working)
7. ✅ src/screens/teacher/TeacherAttendanceScreen.tsx (existing - verified working)
8. ✅ src/screens/teacher/TeacherMarkAttendanceScreen.tsx (existing - verified working)
9. ✅ src/screens/auth/LoginScreen.tsx (existing - verified working)

**Remaining (41 screens):**
- Students: 13 screens
- Teacher: 12 screens
- Principal: 15 screens
- Shared: 1 screen

---

## Testing Tips

```typescript
// Test loading state with delay
// In development, add: await new Promise(r => setTimeout(r, 2000));

// Test error state
// Temporarily use wrong endpoint: ENDPOINTS.STUDENT.FAKE_ENDPOINT

// Test with mock data fallback
catch (err) {
  console.warn('API Error, using mock data:', err);
  setData(MOCK_DATA);  // Fallback for development
}
```

---

## API Verification Checklist

Before implementing each screen, verify the endpoint exists:

```bash
# Check if endpoint exists in HRT backend
grep -r "GET /api/student/fees" HRT/src/app/api/

# Or check the route file directly
cat HRT/src/app/api/fees/route.js
```

Common backend response patterns:
- `{ "success": true, "data": {...}, "message": null }`
- `{ "data": {...} }` (direct data)
- `{ "invoices": [...], "summary": {...} }` (with summary)

Match your state expectations accordingly!

---

## Support

If you get a 404 on an endpoint:
1. Check endpoint spelling matches ENDPOINTS constant
2. Verify endpoint exists in HRT `/src/app/api/**/route.js`
3. Ensure authentication token is being sent (check interceptor logs)
4. Check API_BASE_URL is correct (should be http://10.0.2.2:3000/api for Android)

---

**Last Updated**: April 6, 2026  
**Status**: 9 screens complete, ready for additional screens using patterns above
