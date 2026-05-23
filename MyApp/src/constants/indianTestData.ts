// Test data with Indian names and content for Sharnex app testing
// This file contains sample data that can be used for testing various features

export const INDIAN_TEST_DATA = {
  students: [
    { id: '1', name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', class: '10A', rollNo: '001' },
    { id: '2', name: 'Vihaan Patel', email: 'vihaan.patel@gmail.com', class: '10A', rollNo: '002' },
    { id: '3', name: 'Arjun Singh', email: 'arjun.singh@gmail.com', class: '10A', rollNo: '003' },
    { id: '4', name: 'Saanvi Gupta', email: 'saanvi.gupta@gmail.com', class: '10B', rollNo: '001' },
    { id: '5', name: 'Anaya Kumar', email: 'anaya.kumar@gmail.com', class: '10B', rollNo: '002' },
    { id: '6', name: 'Reyansh Jain', email: 'reyansh.jain@gmail.com', class: '9A', rollNo: '001' },
    { id: '7', name: 'Myra Reddy', email: 'myra.reddy@gmail.com', class: '9A', rollNo: '002' },
    { id: '8', name: 'Advait Joshi', email: 'advait.joshi@gmail.com', class: '9B', rollNo: '001' },
  ],

  teachers: [
    { id: '1', name: 'Priya Verma', email: 'priya.verma@school.edu.in', subject: 'Mathematics', qualification: 'M.Sc Mathematics, B.Ed' },
    { id: '2', name: 'Rajesh Kumar', email: 'rajesh.kumar@school.edu.in', subject: 'Science', qualification: 'M.Sc Physics, B.Ed' },
    { id: '3', name: 'Anjali Sharma', email: 'anjali.sharma@school.edu.in', subject: 'English', qualification: 'M.A English, B.Ed' },
    { id: '4', name: 'Vikram Singh', email: 'vikram.singh@school.edu.in', subject: 'Social Studies', qualification: 'M.A History, B.Ed' },
    { id: '5', name: 'Kavita Patel', email: 'kavita.patel@school.edu.in', subject: 'Hindi', qualification: 'M.A Hindi, B.Ed' },
  ],

  subjects: [
    'Mathematics',
    'Science (Physics, Chemistry, Biology)',
    'English',
    'Hindi',
    'Social Studies (History, Geography, Civics)',
    'Computer Science',
    'Physical Education',
    'Art Education',
    'Sanskrit',
    'Environmental Science'
  ],

  classes: [
    { id: '1', name: 'Class 9A', teacher: 'Priya Verma', students: 32 },
    { id: '2', name: 'Class 9B', teacher: 'Rajesh Kumar', students: 31 },
    { id: '3', name: 'Class 10A', teacher: 'Anjali Sharma', students: 33 },
    { id: '4', name: 'Class 10B', teacher: 'Vikram Singh', students: 30 },
  ],

  cities: [
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Chennai',
    'Kolkata',
    'Pune',
    'Hyderabad',
    'Ahmedabad',
    'Jaipur',
    'Lucknow'
  ],

  announcements: [
    {
      title: 'Mid-Term Examination Schedule Released',
      content: 'The mid-term examination schedule for the current academic session has been released. All students are requested to check the examination timetable on the school portal. Examinations will be conducted in the main examination hall from 9:00 AM to 12:00 PM. Students must bring their school ID cards and admit cards.',
      priority: 'High',
      date: '2026-04-15'
    },
    {
      title: 'Parent-Teacher Meeting Notice',
      content: 'A parent-teacher meeting has been scheduled for April 25, 2026. Parents are requested to meet their ward\'s class teachers between 9:00 AM to 4:00 PM. Please bring the progress report card for discussion.',
      priority: 'Medium',
      date: '2026-04-10'
    },
    {
      title: 'Sports Day Celebration',
      content: 'Annual Sports Day will be celebrated on April 30, 2026. All students are requested to participate actively. House-wise competitions will be held in various sports categories.',
      priority: 'Low',
      date: '2026-04-08'
    }
  ],

  assignments: [
    {
      title: 'Mathematics Chapter 5 - Quadratic Equations',
      subject: 'Mathematics',
      class: '10A',
      dueDate: '2026-04-20',
      description: 'Solve all problems from Chapter 5. Submit handwritten solutions.',
      teacher: 'Priya Verma'
    },
    {
      title: 'Science Project - Renewable Energy',
      subject: 'Science',
      class: '9A',
      dueDate: '2026-04-25',
      description: 'Prepare a project report on renewable energy sources. Include diagrams and practical applications.',
      teacher: 'Rajesh Kumar'
    }
  ],

  feeStructure: [
    { item: 'Tuition Fee', amount: 15000, frequency: 'Monthly' },
    { item: 'Transportation Fee', amount: 2500, frequency: 'Monthly' },
    { item: 'Examination Fee', amount: 500, frequency: 'Annual' },
    { item: 'Library Fee', amount: 300, frequency: 'Annual' },
    { item: 'Computer Lab Fee', amount: 800, frequency: 'Annual' },
    { item: 'Sports Fee', amount: 400, frequency: 'Annual' }
  ]
};

// Sample API response structures for testing
export const SAMPLE_API_RESPONSES = {
  studentDashboard: {
    attendance: { percentage: 92, present: 23, total: 25 },
    assignments: { pending: 3, submitted: 5, graded: 12 },
    fees: { totalDue: 45000, paid: 30000, pending: 15000 },
    announcements: 2,
    upcomingEvents: [
      { title: 'Mathematics Test', date: '2026-04-18', type: 'exam' },
      { title: 'Sports Day', date: '2026-04-30', type: 'event' }
    ]
  },

  teacherDashboard: {
    classes: 2,
    totalStudents: 63,
    attendanceMarked: 85,
    assignments: { created: 8, pending: 12, graded: 25 },
    quizzes: { created: 3, active: 1 }
  },

  principalDashboard: {
    totalStudents: 245,
    totalTeachers: 15,
    totalClasses: 8,
    feeCollection: { collected: 1250000, pending: 350000, rate: 78 },
    attendance: { average: 89, classesMarked: 6, totalClasses: 8 }
  }
};