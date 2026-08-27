import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/api';

function parseInsightsSSEResponse(rawStr: string) {
  if (typeof rawStr !== 'string') {
    if (typeof rawStr === 'object' && rawStr !== null) {
      return rawStr;
    }
    return { strengths: [], improve: [], actions: [], motivation: '' };
  }

  let finalText = '';
  // Split raw SSE string on \n\n or \n
  const chunks = rawStr.split(/\n\n|\n/);

  for (let rawChunk of chunks) {
    let line = rawChunk.trim();
    if (!line || line.startsWith(':')) continue;

    if (line.startsWith('data:')) {
      line = line.replace(/^data:\s*/, '').trim();
    }

    // Handle end-of-stream marker
    if (line === '[DONE]') {
      break;
    }

    // Try parsing chunk JSON with per-chunk try/catch
    try {
      const parsed = JSON.parse(line);
      const delta = parsed?.choices?.[0]?.delta;
      if (!delta) continue;

      // EXPLICIT FILTER: Skip any internal reasoning / analysis channel chunks
      if (delta.channel === 'analysis' || delta.reasoning || delta.channel_reasoning) {
        continue;
      }

      if (typeof delta.content === 'string') {
        finalText += delta.content;
      }
    } catch (chunkErr) {
      console.warn('[AI Insights] Warning: Skipping unparseable SSE chunk line:', line);
    }
  }

  // 1. Try parsing JSON if model returned JSON
  const jsonMatch = finalText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const jsonObj = JSON.parse(jsonMatch[0]);
      if (jsonObj && (jsonObj.strengths || jsonObj.improve || jsonObj.actions || jsonObj.motivation)) {
        return {
          strengths: Array.isArray(jsonObj.strengths) ? jsonObj.strengths : [],
          improve: Array.isArray(jsonObj.improve) ? jsonObj.improve : Array.isArray(jsonObj.areasToImprove) ? jsonObj.areasToImprove : [],
          actions: Array.isArray(jsonObj.actions) ? jsonObj.actions : Array.isArray(jsonObj.recommendedActions) ? jsonObj.recommendedActions : [],
          motivation: typeof jsonObj.motivation === 'string' ? jsonObj.motivation : jsonObj.quote || '',
        };
      }
    } catch (e) {
      // Fallback to Markdown Section Parser
    }
  }

  // 2. Generic Markdown Section Parser for **SectionName**
  const sectionMap: Record<string, string[]> = {};
  const textLines = finalText.split('\n');
  let currentHeader = '';

  for (const rawLine of textLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check if trimmed starts with **Header**
    const boldHeaderMatch = trimmed.match(/^\*\*(.+?)\*\*/);

    if (boldHeaderMatch) {
      currentHeader = boldHeaderMatch[1].trim().toLowerCase();
      if (!sectionMap[currentHeader]) {
        sectionMap[currentHeader] = [];
      }
      const remainder = trimmed.replace(/^\*\*(.+?)\*\*/, '').trim();
      if (remainder) {
        sectionMap[currentHeader].push(remainder);
      }
      continue;
    }

    if (currentHeader) {
      if (!sectionMap[currentHeader]) {
        sectionMap[currentHeader] = [];
      }
      sectionMap[currentHeader].push(trimmed);
    }
  }

  // Helper to extract list items or plain text from a section's lines
  const parseSectionLines = (lines: string[] = []) => {
    const bulletItems: string[] = [];
    let plainText = '';

    for (const l of lines) {
      const clean = l.replace(/^[-*•\d+.]+\s*/, '').replace(/^["']|["']$/g, '').trim();

      if (clean) {
        bulletItems.push(clean);
        plainText = plainText ? `${plainText} ${clean}` : clean;
      }
    }

    return { bulletItems, plainText };
  };

  // Find section content by key fuzzy matching
  const findSectionData = (keys: string[]) => {
    for (const key of Object.keys(sectionMap)) {
      if (keys.some(k => key.includes(k))) {
        return parseSectionLines(sectionMap[key]);
      }
    }
    return { bulletItems: [], plainText: '' };
  };

  const strengthsData = findSectionData(['strength']);
  const improveData = findSectionData(['improve', 'area', 'weakness']);
  const actionsData = findSectionData(['action', 'recommend', 'tip', 'next']);
  const motivationData = findSectionData(['motivation', 'quote', 'note']);

  return {
    strengths: strengthsData.bulletItems,
    improve: improveData.bulletItems,
    actions: actionsData.bulletItems,
    motivation: motivationData.plainText || (motivationData.bulletItems.length > 0 ? motivationData.bulletItems.join(' ') : ''),
  };
}

const studentService = {
  // Dashboard
  getDashboard(studentId: string) {
    return apiClient.get(ENDPOINTS.STUDENT.DASHBOARD(studentId));
  },

  getLeaderboard(limit?: number) {
    return apiClient.get(ENDPOINTS.STUDENT.LEADERBOARD(limit));
  },

  // Profile - uses /auth/me (HAR-confirmed working endpoint)
  getMe() {
    return apiClient.get(ENDPOINTS.AUTH.ME);
  },

  // Profile - uses /auth/me (HRT-main route)
  getProfile() {
    return apiClient.get(ENDPOINTS.AUTH.ME);
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

  // Calendar Events
  getCalendarEvents() {
    return apiClient.get(ENDPOINTS.STUDENT.CALENDAR_EVENTS);
  },

  getCalendarHolidays() {
    return apiClient.get(ENDPOINTS.STUDENT.CALENDAR_HOLIDAYS);
  },

  getCalendarExams() {
    return apiClient.get(ENDPOINTS.STUDENT.CALENDAR_EXAMS);
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
  getPerformance() {
    return apiClient.get(
      ENDPOINTS.STUDENT.PERFORMANCE,
    );
  },

  // AI Insights
  async getInsights() {
    const res = await apiClient.post(
      ENDPOINTS.STUDENT.INSIGHTS,
    );
    
    // Resolve raw SSE string payload from response object
    let rawText = '';
    
    if (typeof res === 'string') {
      rawText = res;
    } else if (typeof res?.data === 'string') {
      rawText = res.data;
    } else if (typeof res?.normalized?.data === 'string') {
      rawText = res.normalized.data;
    } else if (typeof res?.data?.data === 'string') {
      rawText = res.data.data;
    } else if (res && typeof res === 'object') {
      const strVal = Object.values(res).find(v => typeof v === 'string' && (v.includes('data:') || v.includes('choices')));
      if (typeof strVal === 'string') {
        rawText = strVal;
      } else {
        rawText = JSON.stringify(res);
      }
    }

    return parseInsightsSSEResponse(rawText);
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

  initiatePayment(data: { invoiceId: string; idempotencyKey: string; paymentMode?: string }) {
    return apiClient.post(
      ENDPOINTS.STUDENT.INITIATE_PAYMENT,
      data,
    );
  },

  verifyPayment(data: { paymentId?: string; razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string; invoiceId?: string; metadata?: any }) {
    return apiClient.post(
      ENDPOINTS.STUDENT.VERIFY_PAYMENT,
      data,
    );
  },

  getReceipt(id: string) {
    return apiClient.get(
      ENDPOINTS.STUDENT.PAYMENT_RECEIPT(id),
    );
  },

  // ─── Official Results (RMS) ────────────────────────────────────────────────
  
  /**
   * GET /api/rms/results/student?page=1&limit=20
   * 
   * Response Envelope:
   * {
   *   success: boolean,
   *   data: Array<{
   *     id: string,               // result uuid
   *     exam_id: string,          // exam uuid
   *     exam_name: string,        // e.g. "Midterm Examination 2025"
   *     academic_year: string,    // e.g. "2024-2025"
   *     exam_type: string,        // e.g. "MIDTERM", "FINAL"
   *     total_marks: number,      // total obtained marks across subjects
   *     max_total: number,        // total max marks possible
   *     percentage: number,       // aggregated percentage
   *     grade: string,            // e.g. "A+", "B"
   *     outcome: string,          // "PASS" | "FAIL"
   *     published_at: string,     // ISO timestamp
   *     result_template: string   // template key
   *   }>,
   *   pagination: {
   *     page: number,
   *     limit: number,
   *     total: number,
   *     totalPages: number
   *   }
   * }
   */
  getOfficialResults(params?: { page?: number; limit?: number }) {
    const query = params ? `?page=${params.page || 1}&limit=${params.limit || 20}` : '';
    return apiClient.get(
      `${ENDPOINTS.STUDENT.OFFICIAL_RESULT_LIST}${query}`,
    );
  },

  /**
   * GET /api/rms/results/student/exam/[examId]
   * 
   * Response Envelope:
   * {
   *   data: {
   *     id: string,                     // result uuid
   *     total_marks: number,            // total marks obtained
   *     max_total: number,              // maximum total marks
   *     percentage: number,             // overall percentage
   *     grade: string,                  // overall grade e.g. "A+"
   *     outcome: string,                // "PASS" | "FAIL"
   *     published_at: string,           // ISO timestamp
   *     result_template: string,        // e.g. "cbse_standard"
   *     exam_name: string,              // e.g. "Annual Board Exam"
   *     academic_year: string,          // e.g. "2024-2025"
   *     exam_type: string,              // e.g. "ANNUAL"
   *     student_name: string,           // student full name
   *     roll_no: string,                // roll number
   *     parent_name: string,            // parent / guardian name
   *     date_of_birth: string,          // DOB string
   *     class_name: string,             // e.g. "Grade 10"
   *     section: string,                // e.g. "A"
   *     class_grade: string,            // grade standard
   *     institution_name: string,       // school name
   *     institution_logo_url: string,   // logo url or null
   *     institution_address: string,    // school address or null
   *     subjects: Array<{
   *       subject_id: string,           // subject uuid
   *       subject_name: string,         // e.g. "Mathematics"
   *       marks_obtained: number,       // obtained score
   *       max_marks: number,            // max possible score
   *       is_failed: boolean,           // true if failed
   *       grade: string,                // subject letter grade
   *       percentage: number,           // subject percentage
   *       is_absent: boolean            // true if marked absent
   *     }>
   *   }
   * }
   * 
   * Note on 404: Returns { message: "Published result not found for this exam" } with status 404
   * when results have not yet been published by institution administrators.
   */
  getOfficialResult(examId: string) {
    return apiClient.get(
      ENDPOINTS.STUDENT.OFFICIAL_RESULT_EXAM(examId),
    );
  },

  /**
   * GET /api/rms/results/student/all
   * 
   * Response Envelope:
   * {
   *   success: true,
   *   data: {
   *     student: {
   *       name: string,
   *       rollNumber: string,
   *       parentName: string,
   *       dateOfBirth: string,
   *       className: string,
   *       section: string,
   *       institutionId: string
   *     },
   *     institutionName: string,
   *     institutionLogoUrl: string | null,
   *     institutionAddress: string | null,
   *     subjects: Array<{ subjectId: string, subjectName: string }>,
   *     exams: Array<{
   *       examId: string,
   *       examName: string,
   *       academicYear: string,
   *       totalMarks: number,
   *       maxTotal: number,
   *       percentage: number,
   *       grade: string,
   *       outcome: string,
   *       publishedAt: string,
   *       subjectMarks: {
   *         [subjectId: string]: {
   *           marks: number,
   *           maxMarks: number,
   *           grade: string
   *         }
   *       }
   *     }>
   *   }
   * }
   */
  getStudentAllResults() {
    return apiClient.get(
      ENDPOINTS.STUDENT.OFFICIAL_RESULT_ALL,
    );
  },

  /**
   * GET /api/rms/results/student/quizzes
   * 
   * Response Envelope:
   * {
   *   success: true,
   *   data: {
   *     student: { name, rollNo, dateOfBirth, parentName, className, section, grade, academicYear },
   *     institution: { name, address, logoUrl },
   *     quizzes: Array<{
   *       quizId: string,
   *       title: string,
   *       subject: string,
   *       classId: string,
   *       className: string,
   *       section: string,
   *       teacherName: string,
   *       questionCount: number,
   *       maxScore: number,
   *       scoreObtained: number | null,
   *       isAttempted: boolean,
   *       submittedAt: string | null,
   *       dueDate: string | null
   *     }>,
   *     summary: { totalQuizzes, attempted, totalScore, totalMaxScore, percentage, grade, outcome }
   *   }
   * }
   */
  getStudentQuizResults() {
    return apiClient.get(
      ENDPOINTS.STUDENT.OFFICIAL_RESULT_QUIZZES,
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

  getStartQuiz(id: string) {
    return apiClient.get(
      ENDPOINTS.STUDENT.QUIZ_DETAILS(id),
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

  // Contact / Support
  contactSupport(data: { fullName: string; email: string; phone?: string; school?: string; message: string }) {
    return apiClient.post(ENDPOINTS.CONTACT, data);
  },
};

export default studentService;