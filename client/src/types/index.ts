export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'not_started' | 'todo' | 'in_progress' | 'submitted' | 'completed'
export type CertStatus = 'not_started' | 'in_progress' | 'completed' | 'needs_review' | 'planned' | 'paused'
export type ResourceType = 'Textbook' | 'Research Paper' | 'Documentation' | 'Guide' | 'Practice Platform' | 'Standard' | 'Whitepaper' | 'Open Textbook' | 'Other'
export type AttendanceStatus = 'scheduled' | 'attended' | 'absent' | 'cancelled' | 'unmarked'
export type LearningStatus = 'not_started' | 'learning' | 'understood' | 'needs_revision'
export type AssessmentCategory = 'assignment' | 'mini_project' | 'lab' | 'quiz' | 'revision' | 'other'

export interface TopicItem {
  id: string
  title: string
  completed?: boolean
}

export interface ModuleItem {
  unitNumber: string
  title: string
  hours: number
  topics: TopicItem[]
}

export interface SyllabusAssignment {
  id: string
  sno: number
  co?: string
  type: string
  title: string
  description: string
  difficulty?: string
  unit?: string
}

export interface SyllabusCertification {
  name: string
  platform: string
  hours?: string
  description: string
  url: string
}

export interface SyllabusResource {
  title: string
  type?: string
  url: string
  description: string
  author?: string
  unit?: string
}

export interface Subject {
  id: string
  code: string
  name: string
  totalHours: number
  faculty: string
  facultyStatus: string
  cohort: string
  courseType: string
  hasDetailedSyllabus: boolean
  syllabusStatusNote?: string
  description: string
  modules: ModuleItem[]
  assignments: SyllabusAssignment[]
  certifications: SyllabusCertification[]
  resources: SyllabusResource[]
  officialDoc?: {
    url: string
    filename: string
    type: 'pdf' | 'xlsx' | 'docx'
    size: string
  }
}

export interface SubjectNote {
  id: string
  subjectId: string
  title: string
  content: string
  tags: string[]
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  subjectId: string
  deadline: string // ISO date string YYYY-MM-DD
  priority: Priority
  status: TaskStatus
  assessmentCategory?: AssessmentCategory
  estimatedHours: number
  actualHours: number
  resourceUrl?: string
  submissionUrl?: string
  supportingDocuments?: string[]
  completionNotes?: string
  completedAt?: string
  createdAt: string
  isSample?: boolean
}

export interface SourceDocReference {
  documentName: string
  location?: string
  sheet?: string
  cell?: string
  page?: number
  section?: string
}

export interface UploadedCertificateFile {
  filename: string
  fileType: string
  fileSize: string
  uploadedAt: string
  fileData?: string // base64 or blob preview
  storageKey?: string
}

export interface Certification {
  id: string
  title: string
  platform: string
  provider?: string
  courseUrl: string
  relatedSubjectId?: string
  status: CertStatus
  progressPercentage: number
  targetDate: string
  completionDate?: string
  certificateUrl?: string
  notes?: string
  isSample?: boolean
  sourceDocReference?: SourceDocReference
  uploadedCertificate?: UploadedCertificateFile
  verificationStatus?: 'verified' | 'unverified' | 'login_required'
  hours?: string
  description?: string
  credentialId?: string
}

export interface ExtractedOpportunity {
  id: string
  title: string
  provider: string
  url: string
  sourceDocument: string
  sourceLocation: string
  sheet?: string
  cell?: string
  page?: number
  section?: string
  hours?: string
  description?: string
  kind: 'direct_certificate' | 'course_resource' | 'general_reference'
  confidence: 'high' | 'medium' | 'low'
  verificationStatus: 'verified' | 'unverified' | 'login_required'
  suggestedSubjectId?: string
  rawExtractedAt: string
  sourceReferences?: Array<{ documentName: string; location: string }>
}

export interface ResourceItem {
  id: string
  title: string
  subjectId: string
  type: ResourceType
  url: string
  description: string
  tags: string[]
  isFavorite: boolean
  isVerifiedLink: boolean
  createdAt: string
  isSample?: boolean
}

export interface StudySession {
  id: string
  subjectId: string
  date: string // YYYY-MM-DD
  durationMinutes: number
  topicsCovered: string
  notes?: string
}

export interface SubjectAttendance {
  subjectId: string
  classesAttended: number
  totalClassesHeld: number
}

export interface SubjectInternalMarks {
  subjectId: string
  attendance?: number // max 5
  classParticipation?: number // max 5
  assignments?: number // max 30
  miniProject?: number // max 20
  theoryExam?: number // max 20 (external)
  projectViva?: number // max 20 (external)
}

export interface StudentProfile {
  name: string
  program: string
  cohort: string
  semester: string
  sprint: string
  batch: string
  academicYear: string
}

// -------------------------------------------------------------
// SPRINTOS 2.0 LECTURE, LEARNING & PROGRESS INTERFACES
// -------------------------------------------------------------

export interface Lecture {
  id: string
  date: string // YYYY-MM-DD
  subjectId: string
  title: string // lecture title / topic
  faculty?: string
  facultyId?: string
  startTime?: string // "09:00"
  endTime?: string // "10:00"
  durationMinutes: number // scheduled duration in minutes (e.g. 60)
  status: AttendanceStatus
  classroom?: string // e.g. "Classroom 37"
  notes?: string
  whatILearned?: string
  importantConcepts?: string[]
  examplesOrCode?: string
  doubtsOrQuestions?: string
  homeworkOrFollowup?: string
  confidenceRating?: number // 1 to 5
  needsRevision?: boolean
  linkedDocumentIds?: string[]
  createdAt: string
  updatedAt: string
  isEdited?: boolean // audit-friendly indicator when a record was edited
}

export interface TopicLearningRecord {
  topicId: string
  subjectId: string
  status: LearningStatus
  confidenceRating: number // 1-5
  needsRevision: boolean
  nextRevisionDate?: string // YYYY-MM-DD
  personalNotes?: string
  questionsToAsk?: string
  lastRevisedAt?: string
  updatedAt: string
}

export interface SubjectAttendanceStats {
  subjectId: string
  attended: number
  absent: number
  totalHeld: number
  scheduled: number
  cancelled: number
  unmarked: number
  percentage: number | null // null if totalHeld === 0
  isWarning: boolean // < threshold (e.g. 75%)
  isApproaching: boolean // threshold <= percentage < threshold + 5
  consecutiveNeededToReachTarget: number // consecutive sessions to reach 75%
  possibleToReachTarget: boolean
}

export interface OverallAttendanceStats {
  totalHeld: number
  totalAttended: number
  totalAbsent: number
  totalUnmarked: number
  totalScheduled: number
  totalCancelled: number
  attended: number
  absent: number
  unmarked: number
  scheduled: number
  cancelled: number
  percentage: number | null
  isWarning: boolean
  warningCount: number
}

export interface AcademicSettings {
  minAttendancePercent: number // default 75
  internalMarksTotal: number // default 60
  externalMarksTotal: number // default 40
  internalBreakdown: {
    attendance: number
    classParticipation: number
    assignments: number
    miniProject: number
  }
  externalBreakdown: {
    theoryExam: number
    projectViva: number
  }
}

export interface AppDocument {
  id: string
  title: string
  filename: string
  type: 'pdf' | 'xlsx' | 'docx' | 'other'
  size: string
  subjectId?: string
  tags: string[]
  uploadDate: string
  url: string
  isOfficial?: boolean
  isUploaded?: boolean
  fileData?: string // base64 if uploaded client-side
  linkedLectureIds?: string[]
  linkedTopicIds?: string[]
}

export interface RevisionSession {
  id: string
  date: string
  subjectId: string
  topicId?: string
  topicTitle: string
  durationMinutes: number
  confidenceAfter: number
  notes?: string
}

// -------------------------------------------------------------
// SPRINTOS 2.1 TIMETABLE & FACULTY MANAGEMENT INTERFACES
// -------------------------------------------------------------

export type TimetableSlotType = 'lecture' | 'lunch_break' | 'short_break' | 'free_period' | 'unassigned' | 'independent_study'

export interface TimetableEntry {
  id: string
  dayOfWeek: number // 0 = Sun, 1 = Mon, ..., 4 = Thu, 5 = Fri, 6 = Sat
  specificDate?: string // YYYY-MM-DD for date-specific entries / overrides
  startTime: string // "10:00"
  endTime: string // "11:00"
  durationMinutes: number // 60, 120, custom
  slotType: TimetableSlotType
  subjectId?: string
  faculty?: string
  facultyId?: string
  classroom?: string // e.g. "Classroom 37"
  isHoliday?: boolean
  isRescheduled?: boolean
  rescheduledToDate?: string
  rescheduledToTime?: string
  notes?: string
}

export interface TimetableConflict {
  entryId1: string
  entryId2: string
  message: string
}


// -------------------------------------------------------------
// SPRINTOS 2.1 ENHANCED COURSE & EMAIL REPORTING INTERFACES
// -------------------------------------------------------------

export interface EmailDeliveryLog {
  id: string
  timestamp: string
  type: 'daily' | 'weekly' | 'test'
  recipient: string
  status: 'success' | 'failed'
  details: string
}

export interface EmailReportSettings {
  enabled: boolean
  recipientEmail: string
  dailyReportTime: string // "18:00"
  weeklyReportDay: number // 0 = Sunday
  weeklyReportTime: string // "18:00"
  timezone: string // "Asia/Kolkata"
  dailyDigestEnabled?: boolean
  weeklyDigestEnabled?: boolean
  lastDailySentDate?: string
  lastWeeklySentWeek?: string
  deliveryLogs: EmailDeliveryLog[]
}

export type CourseStatus = CertStatus

export interface EnhancedCourse {
  id: string
  title: string
  provider: string
  courseUrl: string
  verifiedUrl?: string
  relatedSubjectId: string
  modules: Array<{ id: string; title: string; completed: boolean }>
  status: CertStatus
  progressPercentage: number
  startDate?: string
  completionDate?: string
  targetDate?: string
  certificateEarned: boolean
  certificateUrl?: string
  evidenceFileName?: string
  notes?: string
  learningOutcomes?: string[]
}

// -------------------------------------------------------------
// SPRINTOS PERSONALIZED AI TUTOR INTERFACES
// -------------------------------------------------------------

export type TutorMode = 
  | 'explain_simply' 
  | 'btech_student' 
  | 'step_by_step' 
  | 'exam_prep' 
  | 'revision' 
  | 'coding_practice'

export interface TutorCitation {
  id?: string
  documentName: string
  sourceType?: 'xlsx' | 'docx' | 'pdf' | 'curriculum'
  location?: string
  excerpt?: string
  url?: string
  verified?: boolean
  groundingType?: 'university_document' | 'general_educational'
}

export interface TutorMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  mode?: TutorMode
  citations?: TutorCitation[]
  hasGrounding?: boolean
  groundingNote?: string
  isError?: boolean
}

export interface TutorSession {
  id: string
  title: string
  subjectId?: string
  subjectName?: string
  topicId?: string
  topicTitle?: string
  mode: TutorMode
  messages: TutorMessage[]
  createdAt: string
  updatedAt: string
}


