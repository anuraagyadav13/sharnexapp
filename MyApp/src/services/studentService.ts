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

  getStartQuiz(id: string) {
    return apiClient.get(
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