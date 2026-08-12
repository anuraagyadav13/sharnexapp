import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/api';

// --- TS Interfaces for Principal API shapes ---

export interface ClassItem {
  id: string;
  name: string;
  section?: string;
  grade?: string;
  academicYear: string;
  studentCount: number;
  teacherCount: number;
  classTeacherName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentItem {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  rollNumber?: string;
  roll_number?: string;
  attendancePercentage?: number;
  attendance?: number;
  status?: string;
  isActive?: boolean;
  avatarUrl?: string;
  photoUrl?: string;
}

export interface SubjectRequest {
  classSubjectId?: string;
  subjectId: string;
  teacherId?: string | null;
  weeklyPeriods?: number;
}

export interface CreateClassRequest {
  name: string;
  section?: string;
  grade?: string;
  academicYear: string;
  institutionId?: string;
  classTeacherId?: string | null;
  subjects?: SubjectRequest[];
}

export interface UpdateClassRequest {
  name: string;
  section?: string;
  grade?: string;
  academicYear: string;
  classTeacherId?: string | null;
  subjects?: SubjectRequest[];
}

export interface ClassResponse {
  classes?: ClassItem[];
  class?: ClassItem;
  data?: ClassItem[] | ClassItem;
}

export interface StudentsResponse {
  students?: StudentItem[];
  data?: StudentItem[];
}

export interface SubjectItem {
  id: string;
  institution_id: string;
  name: string;
  code: string | null;
  normalized_name: string;
}

export interface TeacherItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'TEACHER' | 'LIBRARY_ADMIN' | string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  faceEnrolled: boolean;
  assignedClassesCount: number;
  createdAt: string;
}

export interface ClassAssignment {
  classId: string;
  className: string;
  class: string;
  grade: string | null;
  teacherId: string | null;
  teacherName: string | null;
  role: string | null;
  assignedAt: string;
}

export interface TimetablePeriod {
  id: string;
  institution_id: string;
  period_number: number;
  label: string;
  start_time: string;
  end_time: string;
  is_break: boolean;
}

export interface ScheduleSlot {
  time_slot_id: string;
  period: {
    id: string;
    label: string;
    start: string;
    end: string;
    is_break: boolean;
  };
  subject: string;
  teacher: {
    id: string;
    name: string;
    is_absent: boolean;
  };
  substitution: {
    id: string;
    name: string;
  } | null;
}

export interface ScheduleDay {
  type: string;
  date: string;
  slots: ScheduleSlot[];
}

export interface ClassScheduleResponse {
  institution: {
    working_days: number[];
    periods_per_day: number;
  };
  schedule: ScheduleDay[];
}

export interface RmsExamSubjectConfig {
  id?: string;
  marksId?: string;
  subjectId: string;
  subjectName?: string;
  maxMarks: number;
  passMarks: number;
}

export interface RmsParticipatingClass {
  classId: string;
  className?: string;
  section?: string;
  grade?: string;
  subjects: RmsExamSubjectConfig[];
}

export interface RmsExamItem {
  id: string;
  name: string;
  examType: 'MIDTERM' | 'FINAL' | 'UNIT_TEST' | 'QUARTERLY' | 'HALF_YEARLY' | string;
  academicYear: string;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | string;
  createdAt: string;
  description?: string;
  classes_count?: number;
  _count?: {
    classes: number;
  };
  classes?: RmsParticipatingClass[];
}

export interface RmsExamDetail extends RmsExamItem {
  createdBy?: string;
}

export interface RmsMarksAuditItem {
  id: string;
  marks_id?: string;
  old_marks?: number | null;
  new_marks?: number | null;
  old_status?: string | null;
  new_status?: string | null;
  change_reason?: string | null;
  created_at?: string;
  changed_by_name?: string;
}

export interface AnnouncementItem {
  id: string;
  institutionId: string;
  classId: string | null;
  title: string;
  content: string;
  creatorName: string;
  creatorEmail: string;
  creatorRole: string;
  category: string | null;
  targetAudience: string;
  priority: 'normal' | 'high' | 'urgent' | string;
  status: string;
  views: number;
  createdAt: string;
}

export interface InvoiceStats {
  totalFees: number;
  totalPaid: number;
  totalOverdue: number;
  pendingPayments: number;
  collectionRate: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
  count: number;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  institutionName: string;
  studentId: string;
  studentName: string;
  studentGrade?: string;
  grade: string | null;
  baseAmount: number;
  totalAmount: number;
  currency: string;
  description: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | string;
  dueDate: string;
  paidAt: string | null;
  academicYear: string;
  month: string;
  createdAt: string;
  feeItems?: { description: string; amount: number }[];
}

export interface ReconciliationPayment {
  id: string;
  payment_mode: string;
  base_amount: number;
  gross_amount: number;
  gateway_fee: number;
  gst_on_fee: number;
  settled_amount: number;
  razorpay_payment_id: string | null;
  created_at: string;
  status: string;
}

export interface ReconciliationData {
  totalPayments: number;
  totalBase: number;
  totalGross: number;
  totalSettled: number;
  totalGatewayCost: number;
  totalPpiInterchange: number;
  payments: ReconciliationPayment[];
  discrepancies: any[];
}

export interface EquipmentLineItem {
  id: string;
  item_name?: string;
  itemName?: string;
  requested_quantity?: number | string;
  requestedQuantity?: number | string;
  approved_quantity?: number | string | null;
  approvedQuantity?: number | string | null;
  unit?: string;
  item_note?: string;
  itemNote?: string;
}

export interface EquipmentRequestApprovalItemPayload {
  id: string;
  approvedQuantity: number;
  approvalNote: string;
}

export interface EquipmentRequestItem {
  id: string;
  request_number: string;
  teacher_id: string;
  status: 'SUBMITTED' | string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  purpose: string;
  needed_by_date: string;
  teacher_note: string | null;
  principal_remark: string | null;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  teacher_name: string;
  item_count: string;
  items?: EquipmentLineItem[];
}

export interface EquipmentPagination {
  total: number;
  limit: number;
  offset: number;
}

export interface LibraryDashboardStats {
  totalBooks: number;
  totalCopies?: number;
  activeIssues?: number;
  issuedBooks?: number;
  overdueCount?: number;
  overdueBooks?: number;
  totalCategories?: number;
  staffCount?: number;
}

export interface LibraryCategoryItem {
  id: string;
  name: string;
  description: string;
  created_at: string;
  book_count: string;
}

export interface LibraryIssueItem {
  id: string;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | string;
  issueDate: string;
  dueDate: string;
  studentId: string;
  studentName: string;
  bookTitle: string;
  copyNumber: string;
  className: string;
}

export interface PersonalProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  address: string;
  biography: string;
  photoUrl: string;
}

export interface InstitutionProfileData {
  id: string;
  name: string;
  schoolType: string;
  affiliation: string;
  phone: string;
  email: string;
  address: string;
  plan: string;
  totalStudents: number;
  totalStaff: number;
  logoUrl: string | null;
}

export interface SessionItem {
  id: string;
  deviceInfo: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string | null;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

// --- Service Object ---

const principalService = {
  getClasses() {
    return apiClient.get<ClassResponse>(ENDPOINTS.PRINCIPAL.CLASSES);
  },

  getClassStudents(classId: string) {
    return apiClient.get<StudentsResponse>(ENDPOINTS.PRINCIPAL.CLASS_STUDENTS(classId));
  },

  getStudentsByClass(classId: string) {
    return apiClient.get<StudentsResponse>(ENDPOINTS.PRINCIPAL.CLASS_STUDENTS(classId));
  },

  createClass(payload: CreateClassRequest) {
    return apiClient.post<ClassResponse>(ENDPOINTS.PRINCIPAL.CLASSES, payload);
  },

  updateClass(classId: string, payload: UpdateClassRequest) {
    return apiClient.put<ClassResponse>(`${ENDPOINTS.PRINCIPAL.CLASSES}/${classId}`, payload);
  },

  deleteClass(classId: string) {
    return apiClient.delete<any>(`${ENDPOINTS.PRINCIPAL.CLASSES}/${classId}`);
  },

  getStudentDetail(studentId: string) {
    return apiClient.get<any>(`/students/${studentId}`);
  },

  deleteStudent(studentId: string) {
    return apiClient.delete<any>(ENDPOINTS.PRINCIPAL.DELETE_STUDENT(studentId));
  },

  updateStudent(studentId: string, payload: any) {
    return apiClient.put<any>(ENDPOINTS.PRINCIPAL.UPDATE_STUDENT(studentId), payload);
  },

  createStudent(payload: any) {
    return apiClient.post<any>(ENDPOINTS.PRINCIPAL.CREATE_STUDENT, payload);
  },

  exportStudents(classId: string) {
    return apiClient.get<any>(ENDPOINTS.PRINCIPAL.EXPORT_STUDENTS(classId));
  },

  async getSubjects() {
    const res = await apiClient.get<{ subjects: SubjectItem[] }>(ENDPOINTS.PRINCIPAL.SUBJECTS);
    return res.data;
  },

  getTeachers(institutionId: string) {
    return apiClient.get<{ data: TeacherItem[] }>(ENDPOINTS.PRINCIPAL.TEACHERS(institutionId));
  },

  addTeacher(institutionId: string, payload: any) {
    return apiClient.post(ENDPOINTS.PRINCIPAL.TEACHERS(institutionId), payload);
  },

  updateTeacher(teacherId: string, payload: any) {
    return apiClient.patch(`/teachers/${teacherId}`, payload);
  },

  updateTeacherStatus(teacherId: string, isActive: boolean) {
    return apiClient.patch(`/teachers/${teacherId}`, { isActive });
  },

  getClassAssignments(institutionId: string) {
    return apiClient.get<{ data: ClassAssignment[] }>(ENDPOINTS.PRINCIPAL.CLASS_ASSIGNMENTS(institutionId));
  },
  uploadPhoto(formData: FormData) {
    return apiClient.post('/account/institution/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deletePhoto() {
    return apiClient.delete('/account/institution/photo');
  },

  getTimetablePeriods() {
    return apiClient.get<{ periods: TimetablePeriod[] }>(ENDPOINTS.PRINCIPAL.TIMETABLE_PERIODS);
  },

  getClassSchedule(classId: string, week: string) {
    return apiClient.get<ClassScheduleResponse>(`${ENDPOINTS.PRINCIPAL.CLASS_SCHEDULE(classId)}?week=${week}`);
  },

  async getRmsExams() {
    const res = await apiClient.get<{ success?: boolean; data?: RmsExamItem[]; exams?: RmsExamItem[] }>(`${ENDPOINTS.PRINCIPAL.RMS_EXAMS}?limit=100`);
    return res.data;
  },

  async getExamDetail(id: string) {
    const res = await apiClient.get<{ success?: boolean; data: RmsExamDetail }>(ENDPOINTS.PRINCIPAL.EXAM_DETAIL(id));
    return res.data;
  },

  async createExam(payload: {
    name: string;
    examType: string;
    academicYear: string;
    description?: string;
    status?: string;
    classes: {
      classId: string;
      subjects: { subjectId: string; maxMarks: number; passMarks: number }[];
    }[];
  }) {
    const res = await apiClient.post<{ success?: boolean; message?: string; id?: string }>(ENDPOINTS.PRINCIPAL.RMS_EXAMS, payload);
    return res.data;
  },

  async updateExam(id: string, payload: {
    name?: string;
    examType?: string;
    academicYear?: string;
    description?: string;
    status?: string;
    classes?: {
      classId: string;
      subjects: { subjectId: string; maxMarks: number; passMarks: number }[];
    }[];
  }) {
    const res = await apiClient.patch<{ success?: boolean; message?: string }>(ENDPOINTS.PRINCIPAL.EXAM_DETAIL(id), payload);
    return res.data;
  },

  async deleteExam(id: string) {
    const res = await apiClient.delete<{ success?: boolean; message?: string }>(ENDPOINTS.PRINCIPAL.EXAM_DETAIL(id));
    return res.data;
  },

  async getMarksAuditHistory(marksId: string) {
    const res = await apiClient.get<RmsMarksAuditItem[] | { data: RmsMarksAuditItem[] }>(ENDPOINTS.PRINCIPAL.RMS_MARKS_AUDIT(marksId));
    return res.data;
  },

  getAnnouncements(institutionId: string) {
    return apiClient.get<{ announcements: AnnouncementItem[] }>(
      `${ENDPOINTS.PRINCIPAL.ANNOUNCEMENTS}?institutionId=${institutionId}&limit=10`
    );
  },

  createAnnouncement(payload: any) {
    return apiClient.post<any>(ENDPOINTS.PRINCIPAL.ANNOUNCEMENTS, payload);
  },

  deleteAnnouncement(announcementId: string) {
    return apiClient.delete<any>(`${ENDPOINTS.PRINCIPAL.ANNOUNCEMENTS}/${announcementId}`);
  },

  getInvoiceStats() {
    return apiClient.get<{ data: InvoiceStats }>(ENDPOINTS.PRINCIPAL.INVOICE_STATS);
  },

  getInvoices(limit: number = 50) {
    return apiClient.get<{ data: { invoices: InvoiceItem[] } }>(`${ENDPOINTS.PRINCIPAL.INVOICES}?limit=${limit}`);
  },

  getReconciliation(startDate: string, endDate: string) {
    return apiClient.get<{ success: boolean; data: ReconciliationData }>(
      `${ENDPOINTS.PRINCIPAL.RECONCILIATION}?startDate=${startDate}&endDate=${endDate}`
    );
  },

  createInvoice(payload: {
    studentId: string;
    baseAmount: number;
    description: string;
    dueDate: string;
    month: string;
    academicYear: string;
    feeItems: { description: string; amount: number }[];
  }) {
    return apiClient.post<any>(ENDPOINTS.PRINCIPAL.CREATE_INVOICE, payload);
  },

  updateInvoiceStatus(invoiceId: string, status: string, paymentDetails?: any) {
    return apiClient.patch<any>(ENDPOINTS.PRINCIPAL.INVOICE_STATUS(invoiceId), {
      status,
      ...paymentDetails,
    });
  },

  getPendingEquipmentRequests(status: string = 'SUBMITTED', limit: number = 50, offset: number = 0) {
    return apiClient.get<{ data: { items: EquipmentRequestItem[]; pagination: EquipmentPagination } }>(
      `${ENDPOINTS.PRINCIPAL.EQUIPMENT_PENDING}?status=${status}&limit=${limit}&offset=${offset}`
    );
  },

  getEquipmentRequestDetail(id: string) {
    return apiClient.get<{ data: EquipmentRequestItem }>(`/equipment/requests/${id}`);
  },

  async actionEquipmentRequest(
    id: string,
    action: 'APPROVED' | 'REJECTED',
    remarks?: string,
    items?: EquipmentRequestApprovalItemPayload[]
  ) {
    let payloadItems = items;

    if (action === 'APPROVED' && (!payloadItems || payloadItems.length === 0)) {
      try {
        const detailRes = await this.getEquipmentRequestDetail(id);
        const detailData = (detailRes.data as any)?.data || detailRes.data;
        if (detailData?.items && Array.isArray(detailData.items)) {
          payloadItems = detailData.items.map((i: any) => ({
            id: i.id,
            approvedQuantity: Number(i.requested_quantity ?? i.requestedQuantity ?? i.quantity ?? 1),
            approvalNote: i.approval_note ?? i.approvalNote ?? '',
          }));
        }
      } catch (e) {
        console.warn('[principalService] Could not auto-fetch line items for approval:', e);
      }
    }

    return apiClient.post(ENDPOINTS.PRINCIPAL.EQUIPMENT_ACTION(id), {
      action,
      remarks: remarks ?? '',
      items: payloadItems ?? [],
    }).catch(async (err) => {
      // Fallback to legacy endpoints if /action is not found
      if (err?.response?.status === 404) {
        const endpoint = action === 'APPROVED' ? ENDPOINTS.PRINCIPAL.EQUIPMENT_APPROVE(id) : ENDPOINTS.PRINCIPAL.EQUIPMENT_REJECT(id);
        return apiClient.post(endpoint, { remark: remarks ?? '' });
      }
      throw err;
    });
  },

  approveEquipmentRequest(id: string, remark?: string, items?: EquipmentRequestApprovalItemPayload[]) {
    return this.actionEquipmentRequest(id, 'APPROVED', remark, items);
  },

  rejectEquipmentRequest(id: string, remark: string, items?: EquipmentRequestApprovalItemPayload[]) {
    return this.actionEquipmentRequest(id, 'REJECTED', remark, items);
  },

  getLibraryDashboard() {
    return apiClient.get<{ data: LibraryDashboardStats }>(ENDPOINTS.PRINCIPAL.LIBRARY_DASHBOARD);
  },

  getLibraryCategories() {
    return apiClient.get<{ data: LibraryCategoryItem[] }>(ENDPOINTS.PRINCIPAL.LIBRARY_CATEGORIES);
  },

  getLibraryIssues(limit: number = 10, offset: number = 0) {
    return apiClient.get<{ data: { items: LibraryIssueItem[]; pagination: EquipmentPagination } }>(
      `${ENDPOINTS.PRINCIPAL.LIBRARY_ISSUES}?limit=${limit}&offset=${offset}`
    );
  },

  getLibraryBooks(limit: number = 10, offset: number = 0, query: string = '', categoryId: string = '') {
    let url = `/library/books?limit=${limit}&offset=${offset}`;
    if (query) url += `&search=${encodeURIComponent(query)}`;
    if (categoryId && categoryId !== 'all') url += `&categoryId=${categoryId}`;
    return apiClient.get<{ data: { items: any[]; pagination: { total: number; limit: number; offset: number } } }>(url);
  },

  issueBook(payload: { classId: string; studentId: string; bookId: string; dueDate: string }) {
    return apiClient.post<{ data: any }>(ENDPOINTS.PRINCIPAL.LIBRARY_ISSUES, payload);
  },

  getPersonalProfile() {
    return apiClient.get<PersonalProfileData>(ENDPOINTS.PRINCIPAL.ACCOUNT_PROFILE);
  },

  updatePersonalProfile(data: { name: string; phone: string; address: string; biography: string }) {
    return apiClient.patch<PersonalProfileData>(ENDPOINTS.PRINCIPAL.ACCOUNT_PROFILE, data);
  },

  getInstitutionProfile() {
    return apiClient.get<InstitutionProfileData>(ENDPOINTS.PRINCIPAL.ACCOUNT_INSTITUTION);
  },

  updateInstitutionProfile(data: { name: string; schoolType: string; affiliation: string; phone: string; address: string }) {
    return apiClient.patch<InstitutionProfileData>(ENDPOINTS.PRINCIPAL.ACCOUNT_INSTITUTION, data);
  },

  getSessions() {
    return apiClient.get<{ sessions: SessionItem[] }>(ENDPOINTS.PRINCIPAL.ACCOUNT_SESSIONS);
  },
};

export default principalService;
