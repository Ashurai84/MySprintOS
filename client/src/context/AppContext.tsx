import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { 
  Subject, 
  Task, 
  Certification, 
  ResourceItem, 
  StudySession, 
  SubjectAttendance, 
  StudentProfile, 
  SubjectNote,
  Lecture,
  AttendanceStatus,
  TopicLearningRecord,
  AcademicSettings,
  AppDocument,
  RevisionSession,
  SubjectAttendanceStats,
  OverallAttendanceStats,
  TimetableEntry,
  TimetableConflict,
  EnhancedCourse,
  EmailReportSettings
} from '../types'
import { 
  initialSubjects, 
  initialTasks, 
  initialCertifications, 
  initialResources, 
  initialStudySessions, 
  initialNotes, 
  initialProfile,
  initialAcademicSettings,
  initialLectures,
  initialTopicProgress,
  initialAppDocuments,
  initialRevisionSessions,
  initialTimetableEntries,
  initialEnhancedCourses,
  initialEmailSettings
} from '../data/defaultData'
import { loadFromStorage, saveToStorage } from '../utils/storage'
import { calculateSubjectAttendance, calculateOverallAttendance } from '../utils/attendanceCalculator'
import { 
  detectTimetableConflicts, 
  sanitizeTimetableEntries, 
  normalizeTimeTo24H,
  timeToMinutes,
  minutesToTime,
  validateTimes,
  getKolkataDateString
} from '../utils/timetableUtils'
import { 
  canonicalSubjectId, 
  isSameSubject, 
  getDefaultFacultyForSubject 
} from '../utils/subjectUtils'
import { resolveFacultyName, resolveFacultyId } from '../data/facultyData'

export type AppTheme = 'warm-sunset' | 'cyber-violet' | 'deep-sapphire' | 'emerald-matrix'

interface AppContextType {
  subjects: Subject[]
  lectures: Lecture[]
  topicProgress: Record<string, TopicLearningRecord>
  settings: AcademicSettings
  appDocuments: AppDocument[]
  revisionSessions: RevisionSession[]
  tasks: Task[]
  certifications: Certification[]
  resources: ResourceItem[]
  attendance: SubjectAttendance[]
  studySessions: StudySession[]
  notes: SubjectNote[]
  profile: StudentProfile
  completedTopics: Record<string, boolean>
  storageMode: string
  theme: AppTheme
  setTheme: (theme: AppTheme) => void

  // Timetable
  timetableEntries: TimetableEntry[]
  timetableConflicts: TimetableConflict[]
  addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => string
  updateTimetableEntry: (id: string, updates: Partial<TimetableEntry>) => void
  deleteTimetableEntry: (id: string) => void
  logTimetableAsLecture: (timetableId: string, status?: AttendanceStatus, targetDate?: string) => string
  removeTimetableLectureLog: (timetableId: string, targetDate?: string) => void
  getTimetableSlotLecture: (entry: TimetableEntry, targetDate?: string) => Lecture | undefined
  importTimetableEntries: (entries: TimetableEntry[]) => { added: number; updated: number; skipped: number }


  // Enhanced Courses
  enhancedCourses: EnhancedCourse[]
  addEnhancedCourse: (course: Omit<EnhancedCourse, 'id'>) => void
  updateEnhancedCourse: (id: string, updates: Partial<EnhancedCourse>) => void
  deleteEnhancedCourse: (id: string) => void

  // Email Reports
  emailSettings: EmailReportSettings
  updateEmailSettings: (updates: Partial<EmailReportSettings>) => void
  generateDailyReportPayload: () => any
  generateWeeklyReportPayload: () => any

  // Lecture actions
  addLecture: (lecture: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'>) => string
  addMultipleLectures: (lectures: Array<Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'>>) => void
  updateLecture: (id: string, updates: Partial<Lecture>) => void
  deleteLecture: (id: string) => void
  setLectureStatus: (id: string, status: AttendanceStatus) => void

  // Topic learning actions
  updateTopicProgress: (topicId: string, subjectId: string, updates: Partial<TopicLearningRecord>) => void
  toggleTopicRevision: (topicId: string, subjectId: string) => void
  toggleTopic: (topicId: string) => void

  // Document actions
  addDocument: (doc: Omit<AppDocument, 'id' | 'uploadDate'>) => void
  deleteDocument: (id: string) => void

  // Revision actions
  addRevisionSession: (session: Omit<RevisionSession, 'id'>) => void

  // Settings actions
  updateSettings: (newSettings: Partial<AcademicSettings>) => void
  updateProfile: (profile: Partial<StudentProfile>) => void

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskStatus: (id: string) => void

  // Certification actions
  addCertification: (cert: Omit<Certification, 'id'>) => void
  updateCertification: (id: string, updates: Partial<Certification>) => void
  deleteCertification: (id: string) => void
  importSyllabusCertifications: () => void

  // Resource actions
  addResource: (res: Omit<ResourceItem, 'id' | 'createdAt'>) => void
  updateResource: (id: string, updates: Partial<ResourceItem>) => void
  deleteResource: (id: string) => void
  toggleFavoriteResource: (id: string) => void

  // Study sessions & legacy attendance actions
  addStudySession: (session: Omit<StudySession, 'id'>) => void
  updateAttendance: (subjectId: string, attended: number, total: number) => void
  recordSingleClass: (subjectId: string, attended: boolean, durationMinutes?: number) => void

  // Notes
  addNote: (note: Omit<SubjectNote, 'id' | 'updatedAt'>) => void
  updateNote: (id: string, updates: Partial<SubjectNote>) => void
  deleteNote: (id: string) => void

  // Data Management
  clearSampleData: () => void
  resetAllData: () => void
  importBackupData: (jsonStr: string) => { success: boolean; message: string }

  // Helpers
  getSubject: (id: string) => Subject | undefined
  getSubjectProgress: (subjectId: string) => { completed: number; total: number; percentage: number }
  getSubjectAttendance: (subjectId: string) => { attended: number; total: number; percentage: number; isWarning: boolean }
  getSubjectAttendanceStats: (subjectId: string) => SubjectAttendanceStats
  getAllSubjectAttendanceStats: () => SubjectAttendanceStats[]
  getOverallAttendanceStats: () => OverallAttendanceStats
}

/**
 * Harmonizes lecture records across all blocks:
 * - Migrates legacy subject IDs (e.g. 'dsa-3' -> 'S5-CS01', 'llm-rag-agentic-ai' -> 'S5-AI01')
 * - Ensures confirmed faculty Sanjay Sahu (VF) defaults for DSA-3 while preserving user-edited faculty
 * - DSA-3 has precisely 3 lectures completed up to Kosaraju's Algorithm
 * - Strips phantom "Session 3" / "Session 4" dummy duplicate entries created by legacy manual attendance updates
 * - Deduplicates any identical timetable logs so attendance, schedule and dashboard match 100%
 */
function harmonizeLectureRecords(rawLectures: Lecture[]): Lecture[] {
  if (!rawLectures || rawLectures.length === 0) {
    return initialLectures
  }

  // 1. Filter out misleading "Independent Study / Unassigned Slot" entries from lectures.
  // Independent study / unassigned slots are NOT course lectures and must never count toward attendance.
  const nonMisleading = rawLectures.filter(l => {
    const titleLower = (l.title || '').toLowerCase()
    const notesLower = (l.notes || '').toLowerCase()
    if (
      titleLower.includes('independent study') ||
      titleLower.includes('unassigned slot') ||
      titleLower.includes('unassigned') ||
      notesLower.includes('independent study') ||
      notesLower.includes('unassigned slot')
    ) {
      return false
    }
    return true
  })

  // 2. Canonicalize subject IDs, sanitize faculty from single source of truth, and fix time bug
  const migrated: Lecture[] = nonMisleading.map(l => {
    const canonId = canonicalSubjectId(l.subjectId)
    
    // Resolve faculty from single source of truth
    let faculty = l.faculty
    let facultyId = l.facultyId
    if (isSameSubject(canonId, 'S5-AI01')) {
      faculty = 'Dr. Dipanjan Biswas'
      facultyId = 'fac-dipanjan'
    } else if (isSameSubject(canonId, 'S5-CS01')) {
      if (!faculty || faculty.includes('Kunal Suri') || faculty.toLowerCase().includes('kunal')) {
        faculty = 'Sanjay Sahu (VF)'
      }
      facultyId = 'fac-sanjay'
    } else {
      faculty = resolveFacultyName(facultyId, canonId, faculty)
      facultyId = resolveFacultyId(canonId, faculty)
    }

    // Time Sanitization & Fix 10:00 PM rollover bug
    let startTime = l.startTime ? normalizeTimeTo24H(l.startTime) : undefined
    let endTime = l.endTime ? normalizeTimeTo24H(l.endTime, startTime) : undefined
    let durationMinutes = l.durationMinutes || 60

    if (startTime) {
      let startMin = timeToMinutes(startTime)
      let endMin = endTime ? timeToMinutes(endTime) : startMin + durationMinutes

      // Detect the 10:00 PM (22:00) bug on morning classes (e.g. 09:00 to 22:00 for a 60-min session)
      if (endMin - startMin > 4 * 60 && durationMinutes <= 120) {
        endMin = startMin + durationMinutes
        endTime = minutesToTime(endMin)
      }

      // Enforce end > start
      if (endMin <= startMin) {
        endMin = startMin + 60
        endTime = minutesToTime(endMin)
      }

      // Duration is dynamically computed from times, never stored separately out of sync
      durationMinutes = endMin - startMin
    }

    return {
      ...l,
      subjectId: canonId,
      faculty,
      facultyId,
      startTime,
      endTime,
      durationMinutes
    }
  })

  // Authentic covered lectures up to Kosaraju's algorithm
  const isAuthenticDsaLecture = (title: string) => {
    return (
      title.includes("Kosaraju's Algorithm") ||
      title.includes('Unit 2: Graph Algorithms & Strongly Connected Components') ||
      title.includes('Strongly Connected Components (SCC) Overview') ||
      title.includes('SCC Overview')
    )
  }

  let cleaned: Lecture[] = migrated.filter(l => {
    if (isSameSubject(l.subjectId, 'S5-CS01')) {
      // Retain strictly the 3 authentic covered lectures up to Kosaraju
      return isAuthenticDsaLecture(l.title)
    }
    return true
  })

  // Ensure all 7 verified initial lectures exist if not already present
  for (const initLec of initialLectures) {
    const exists = cleaned.some(l => 
      l.id === initLec.id || 
      (isSameSubject(l.subjectId, initLec.subjectId) && l.date === initLec.date && (l.startTime === initLec.startTime || l.title === initLec.title))
    )
    if (!exists) {
      cleaned.push(initLec)
    }
  }

  // Deduplicate exact same (subjectId + title + date + startTime), preserving multiple sessions on the same day
  const seen = new Set<string>()
  cleaned = cleaned.filter(l => {
    const key = `${canonicalSubjectId(l.subjectId)}_${l.title}_${l.date}_${l.startTime || l.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return cleaned
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure storage version migration
  if (typeof window !== 'undefined' && !localStorage.getItem('sprintos_v2_migrated')) {
    localStorage.setItem('sprintos_v2_migrated', 'true')
  }

  // Color Theme: default to Warm Sunset Amber & Gold
  const [theme, setTheme] = useState<AppTheme>(() => 
    loadFromStorage<AppTheme>('sprintos_theme', 'warm-sunset')
  )

  useEffect(() => {
    saveToStorage('sprintos_theme', theme)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  // 1. Subjects: strictly the 6 active ones
  const [subjects] = useState<Subject[]>(initialSubjects)

  // 2. SprintOS 2.0 Daily Lectures - verified & harmonized
  const [lectures, setLectures] = useState<Lecture[]>(() => 
    harmonizeLectureRecords(loadFromStorage<Lecture[]>('lectures_v2', initialLectures))
  )

  // 3. Learning topic progress records
  const [topicProgress, setTopicProgress] = useState<Record<string, TopicLearningRecord>>(() => 
    loadFromStorage<Record<string, TopicLearningRecord>>('topicProgress_v2', initialTopicProgress)
  )

  // 4. Academic Settings (attendance threshold, marks breakdown)
  const [settings, setSettings] = useState<AcademicSettings>(() => 
    loadFromStorage<AcademicSettings>('settings_v2', initialAcademicSettings)
  )

  // 5. Document Library (indexed + user uploaded)
  const [appDocuments, setAppDocuments] = useState<AppDocument[]>(() => 
    loadFromStorage<AppDocument[]>('documents_v2', initialAppDocuments)
  )

  // 6. Revision Sessions
  const [revisionSessions, setRevisionSessions] = useState<RevisionSession[]>(() => 
    loadFromStorage<RevisionSession[]>('revisionSessions_v2', initialRevisionSessions)
  )

  // 7. Tasks & Assignments
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage<Task[]>('tasks', initialTasks))

  // 8. Other collections
  const [certifications, setCertifications] = useState<Certification[]>(() => loadFromStorage<Certification[]>('certifications', initialCertifications))
  const [resources, setResources] = useState<ResourceItem[]>(() => loadFromStorage<ResourceItem[]>('resources', initialResources))
  const [studySessions, setStudySessions] = useState<StudySession[]>(() => loadFromStorage<StudySession[]>('studySessions', initialStudySessions))
  const [notes, setNotes] = useState<SubjectNote[]>(() => loadFromStorage<SubjectNote[]>('notes', initialNotes))
  const [profile, setProfile] = useState<StudentProfile>(() => loadFromStorage<StudentProfile>('profile', initialProfile))
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>(() => loadFromStorage<Record<string, boolean>>('completedTopics', {}))
  const [storageMode] = useState<string>('Local Storage (Persistent & Auditable)')

  // 9. SprintOS 2.1 Timetable: strictly sanitized to 24-hour railway time format
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(() =>
    sanitizeTimetableEntries(loadFromStorage<TimetableEntry[]>('timetable_v2', initialTimetableEntries))
  )


  // 11. SprintOS 2.1 Enhanced Courses
  const [enhancedCourses, setEnhancedCourses] = useState<EnhancedCourse[]>(() =>
    loadFromStorage<EnhancedCourse[]>('enhancedCourses_v2', initialEnhancedCourses)
  )

  // 12. SprintOS 2.1 Email Settings
  const [emailSettings, setEmailSettings] = useState<EmailReportSettings>(() =>
    loadFromStorage<EmailReportSettings>('emailSettings_v2', initialEmailSettings)
  )

  // Timetable conflicts calculated dynamically
  const timetableConflicts = useMemo(() => {
    return detectTimetableConflicts(timetableEntries)
  }, [timetableEntries])

  // Save to storage on changes
  useEffect(() => { saveToStorage('lectures_v2', lectures) }, [lectures])
  useEffect(() => { saveToStorage('topicProgress_v2', topicProgress) }, [topicProgress])
  useEffect(() => { saveToStorage('settings_v2', settings) }, [settings])
  useEffect(() => { saveToStorage('documents_v2', appDocuments) }, [appDocuments])
  useEffect(() => { saveToStorage('revisionSessions_v2', revisionSessions) }, [revisionSessions])
  useEffect(() => { saveToStorage('tasks', tasks) }, [tasks])
  useEffect(() => { saveToStorage('certifications', certifications) }, [certifications])
  useEffect(() => { saveToStorage('resources', resources) }, [resources])
  useEffect(() => { saveToStorage('studySessions', studySessions) }, [studySessions])
  useEffect(() => { saveToStorage('notes', notes) }, [notes])
  useEffect(() => { saveToStorage('profile', profile) }, [profile])
  useEffect(() => { saveToStorage('completedTopics', completedTopics) }, [completedTopics])
  useEffect(() => { saveToStorage('timetable_v2', timetableEntries) }, [timetableEntries])
  // Clean obsolete Java recovery keys
  useEffect(() => {
    try {
      localStorage.removeItem('javaTopics_v2')
      localStorage.removeItem('javaDiagnosticCompleted_v2')
      localStorage.removeItem('javaDiagnosticScore_v2')
    } catch {
      // sandbox / storage unavailable
    }
  }, [])
  useEffect(() => { saveToStorage('enhancedCourses_v2', enhancedCourses) }, [enhancedCourses])
  useEffect(() => { saveToStorage('emailSettings_v2', emailSettings) }, [emailSettings])

  // Dynamic subject attendance stats calculated from lectures
  const attendanceStatsMap = useMemo(() => {
    const map = new Map<string, SubjectAttendanceStats>()
    for (const sub of subjects) {
      map.set(
        sub.id,
        calculateSubjectAttendance(sub.id, lectures, sub.totalHours, settings.minAttendancePercent)
      )
    }
    return map
  }, [subjects, lectures, settings.minAttendancePercent])

  // Backward compatible attendance array
  const attendance: SubjectAttendance[] = useMemo(() => {
    return subjects.map(sub => {
      const stats = attendanceStatsMap.get(sub.id)
      return {
        subjectId: sub.id,
        classesAttended: stats ? stats.attended : 0,
        totalClassesHeld: stats ? stats.totalHeld : 0
      }
    })
  }, [subjects, attendanceStatsMap])

  // --------------------------------------------------------------------------
  // LECTURE ACTIONS
  // --------------------------------------------------------------------------
  const addLecture = (data: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const id = `lec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date().toISOString()
    const canonSubId = canonicalSubjectId(data.subjectId)
    const faculty = resolveFacultyName(data.facultyId, canonSubId, data.faculty)
    const facultyId = data.facultyId || resolveFacultyId(canonSubId, faculty)

    const startTime = data.startTime ? normalizeTimeTo24H(data.startTime) : undefined
    let endTime = data.endTime ? normalizeTimeTo24H(data.endTime, startTime) : undefined
    let durationMinutes = data.durationMinutes || 60

    if (startTime && endTime) {
      const validation = validateTimes(startTime, endTime)
      if (validation.isValid) {
        durationMinutes = validation.durationMinutes
      } else {
        const startMin = timeToMinutes(startTime)
        endTime = minutesToTime(startMin + durationMinutes)
      }
    } else if (startTime && !endTime) {
      endTime = minutesToTime(timeToMinutes(startTime) + durationMinutes)
    }

    const newLec: Lecture = {
      ...data,
      subjectId: canonSubId,
      faculty,
      facultyId,
      startTime,
      endTime,
      durationMinutes,
      id,
      createdAt: now,
      updatedAt: now,
      isEdited: false
    }
    setLectures(prev => [newLec, ...prev])
    return id
  }

  const addMultipleLectures = (lecturesData: Array<Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const now = new Date().toISOString()
    const created: Lecture[] = lecturesData.map((data, idx) => {
      const canonSubId = canonicalSubjectId(data.subjectId)
      const faculty = resolveFacultyName(data.facultyId, canonSubId, data.faculty)
      const facultyId = data.facultyId || resolveFacultyId(canonSubId, faculty)

      const startTime = data.startTime ? normalizeTimeTo24H(data.startTime) : undefined
      let endTime = data.endTime ? normalizeTimeTo24H(data.endTime, startTime) : undefined
      let durationMinutes = data.durationMinutes || 60

      if (startTime && endTime) {
        const validation = validateTimes(startTime, endTime)
        if (validation.isValid) {
          durationMinutes = validation.durationMinutes
        } else {
          const startMin = timeToMinutes(startTime)
          endTime = minutesToTime(startMin + durationMinutes)
        }
      } else if (startTime && !endTime) {
        endTime = minutesToTime(timeToMinutes(startTime) + durationMinutes)
      }

      return {
        ...data,
        subjectId: canonSubId,
        faculty,
        facultyId,
        startTime,
        endTime,
        durationMinutes,
        id: `lec-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        updatedAt: now,
        isEdited: false
      }
    })
    setLectures(prev => [...created, ...prev])
  }

  const updateLecture = (id: string, updates: Partial<Lecture>) => {
    const now = new Date().toISOString()
    setLectures(prev => prev.map(l => {
      if (l.id === id) {
        const merged = { ...l, ...updates }
        const canonSubId = canonicalSubjectId(merged.subjectId)
        const faculty = resolveFacultyName(merged.facultyId, canonSubId, merged.faculty)
        const facultyId = merged.facultyId || resolveFacultyId(canonSubId, faculty)

        let startTime = merged.startTime ? normalizeTimeTo24H(merged.startTime) : undefined
        let endTime = merged.endTime ? normalizeTimeTo24H(merged.endTime, startTime) : undefined
        let durationMinutes = merged.durationMinutes || 60

        if (startTime && endTime) {
          const validation = validateTimes(startTime, endTime)
          if (validation.isValid) {
            durationMinutes = validation.durationMinutes
          } else {
            const startMin = timeToMinutes(startTime)
            endTime = minutesToTime(startMin + durationMinutes)
          }
        } else if (startTime && !endTime) {
          endTime = minutesToTime(timeToMinutes(startTime) + durationMinutes)
        }

        return {
          ...merged,
          subjectId: canonSubId,
          faculty,
          facultyId,
          startTime,
          endTime,
          durationMinutes,
          updatedAt: now,
          isEdited: true
        }
      }
      return l
    }))
  }

  const deleteLecture = (id: string) => {
    setLectures(prev => prev.filter(l => l.id !== id))
  }

  const setLectureStatus = (id: string, status: AttendanceStatus) => {
    const now = new Date().toISOString()
    setLectures(prev => prev.map(l => {
      if (l.id === id) {
        return {
          ...l,
          status,
          updatedAt: now,
          isEdited: true
        }
      }
      return l
    }))
  }

  // --------------------------------------------------------------------------
  // TOPIC LEARNING PROGRESS ACTIONS
  // --------------------------------------------------------------------------
  const updateTopicProgress = (
    topicId: string, 
    subjectId: string, 
    updates: Partial<TopicLearningRecord>
  ) => {
    const now = new Date().toISOString()
    setTopicProgress(prev => {
      const existing = prev[topicId] || {
        topicId,
        subjectId,
        status: 'not_started',
        confidenceRating: 1,
        needsRevision: false,
        updatedAt: now
      }
      return {
        ...prev,
        [topicId]: {
          ...existing,
          ...updates,
          updatedAt: now
        }
      }
    })
  }

  const toggleTopicRevision = (topicId: string, subjectId: string) => {
    const now = new Date().toISOString()
    setTopicProgress(prev => {
      const existing = prev[topicId] || {
        topicId,
        subjectId,
        status: 'not_started',
        confidenceRating: 1,
        needsRevision: false,
        updatedAt: now
      }
      return {
        ...prev,
        [topicId]: {
          ...existing,
          needsRevision: !existing.needsRevision,
          status: !existing.needsRevision ? 'needs_revision' : existing.status,
          updatedAt: now
        }
      }
    })
  }

  const toggleTopic = (topicId: string) => {
    // Keep legacy toggleTopic support
    setCompletedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }))
  }

  // --------------------------------------------------------------------------
  // DOCUMENT ACTIONS
  // --------------------------------------------------------------------------
  const addDocument = (docData: Omit<AppDocument, 'id' | 'uploadDate'>) => {
    const newDoc: AppDocument = {
      ...docData,
      id: `doc-upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      uploadDate: new Date().toISOString().split('T')[0],
      isUploaded: true
    }
    setAppDocuments(prev => [newDoc, ...prev])
  }

  const deleteDocument = (id: string) => {
    setAppDocuments(prev => prev.filter(d => d.id !== id))
  }

  // --------------------------------------------------------------------------
  // REVISION SESSIONS ACTIONS
  // --------------------------------------------------------------------------
  const addRevisionSession = (sessionData: Omit<RevisionSession, 'id'>) => {
    const newSession: RevisionSession = {
      ...sessionData,
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    }
    setRevisionSessions(prev => [newSession, ...prev])

    // Update topic record if linked
    if (sessionData.topicId) {
      updateTopicProgress(sessionData.topicId, sessionData.subjectId, {
        confidenceRating: sessionData.confidenceAfter,
        lastRevisedAt: sessionData.date,
        needsRevision: sessionData.confidenceAfter < 3,
        status: sessionData.confidenceAfter >= 4 ? 'understood' : 'learning'
      })
    }
  }

  // --------------------------------------------------------------------------
  // SETTINGS & PROFILE ACTIONS
  // --------------------------------------------------------------------------
  const updateSettings = (newSettings: Partial<AcademicSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }

  // --------------------------------------------------------------------------
  // TASKS & ASSIGNMENTS ACTIONS
  // --------------------------------------------------------------------------
  const addTask = (newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      isSample: false
    }
    setTasks(prev => [newTask, ...prev])
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates }
        if (updates.status === 'completed' && t.status !== 'completed') {
          updated.completedAt = new Date().toISOString()
        } else if (updates.status && updates.status !== 'completed') {
          updated.completedAt = undefined
        }
        return updated
      }
      return t
    }))
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newStatus = t.status === 'completed' ? 'not_started' : 'completed'
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
        }
      }
      return t
    }))
  }

  // --------------------------------------------------------------------------
  // CERTIFICATION ACTIONS
  // --------------------------------------------------------------------------
  const addCertification = (certData: Omit<Certification, 'id'>) => {
    const newCert: Certification = {
      ...certData,
      id: `cert-${Date.now()}`,
      isSample: false
    }
    setCertifications(prev => [newCert, ...prev])
  }

  const updateCertification = (id: string, updates: Partial<Certification>) => {
    setCertifications(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteCertification = (id: string) => {
    setCertifications(prev => prev.filter(c => c.id !== id))
  }

  const importSyllabusCertifications = () => {
    const existingUrls = new Set(certifications.map(c => c.courseUrl.toLowerCase()))
    const newItems: Certification[] = []

    subjects.forEach(sub => {
      sub.certifications.forEach(sc => {
        if (!existingUrls.has(sc.url.toLowerCase())) {
          newItems.push({
            id: `cert-import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: sc.name,
            platform: sc.platform,
            courseUrl: sc.url,
            relatedSubjectId: sub.id,
            status: 'planned',
            progressPercentage: 0,
            targetDate: '2026-11-30',
            notes: sc.description,
            isSample: false
          })
        }
      })
    })

    if (newItems.length > 0) {
      setCertifications(prev => [...prev, ...newItems])
    }
  }

  // --------------------------------------------------------------------------
  // RESOURCE ACTIONS
  // --------------------------------------------------------------------------
  const addResource = (resData: Omit<ResourceItem, 'id' | 'createdAt'>) => {
    const newRes: ResourceItem = {
      ...resData,
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isSample: false
    }
    setResources(prev => [newRes, ...prev])
  }

  const updateResource = (id: string, updates: Partial<ResourceItem>) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  const deleteResource = (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id))
  }

  const toggleFavoriteResource = (id: string) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // TIMETABLE ACTIONS
  // --------------------------------------------------------------------------
  const addTimetableEntry = (entryData: Omit<TimetableEntry, 'id'>): string => {
    const id = `tt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newEntry: TimetableEntry = {
      ...entryData,
      id
    }
    setTimetableEntries(prev => [...prev, newEntry])
    return id
  }

  const updateTimetableEntry = (id: string, updates: Partial<TimetableEntry>) => {
    setTimetableEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  const deleteTimetableEntry = (id: string) => {
    setTimetableEntries(prev => prev.filter(e => e.id !== id))
  }

  const importTimetableEntries = (entries: TimetableEntry[]): { added: number; updated: number; skipped: number } => {
    let added = 0
    let updated = 0
    let skipped = 0

    const current = [...timetableEntries]
    for (const newEntry of entries) {
      const matchIdx = current.findIndex(e => 
        e.id === newEntry.id || 
        (
          (e.specificDate && newEntry.specificDate ? e.specificDate === newEntry.specificDate : e.dayOfWeek === newEntry.dayOfWeek) &&
          e.startTime === newEntry.startTime &&
          e.endTime === newEntry.endTime &&
          isSameSubject(e.subjectId, newEntry.subjectId)
        )
      )

      if (matchIdx >= 0) {
        const cur = current[matchIdx]
        const isIdentical = 
          cur.faculty === newEntry.faculty &&
          cur.classroom === newEntry.classroom &&
          cur.notes === newEntry.notes &&
          cur.slotType === newEntry.slotType

        if (isIdentical) {
          skipped++
        } else {
          current[matchIdx] = { ...cur, ...newEntry }
          updated++
        }
      } else {
        current.push(newEntry)
        added++
      }
    }

    setTimetableEntries(sanitizeTimetableEntries(current))
    return { added, updated, skipped }
  }

  const getTimetableSlotLecture = (entry: TimetableEntry, targetDate?: string): Lecture | undefined => {
    const lectureDate = targetDate || entry.specificDate || getKolkataDateString()
    const sub = subjects.find(s => isSameSubject(s.id, entry.subjectId))
    const expectedTitle = entry.notes || `${sub?.name || 'Class'} Session`
    return lectures.find(l => 
      l.date === lectureDate && 
      isSameSubject(l.subjectId, entry.subjectId) && 
      (l.startTime === entry.startTime || l.title === expectedTitle)
    )
  }

  const removeTimetableLectureLog = (timetableId: string, targetDate?: string) => {
    const entry = timetableEntries.find(e => e.id === timetableId)
    if (!entry) return
    const existing = getTimetableSlotLecture(entry, targetDate)
    if (existing) {
      deleteLecture(existing.id)
    }
  }

  const logTimetableAsLecture = (
    timetableId: string, 
    status: AttendanceStatus = 'attended',
    targetDate?: string
  ): string => {
    const entry = timetableEntries.find(e => e.id === timetableId)
    if (!entry) return ''
    if (entry.slotType !== 'lecture') return '' // Breaks/free periods/independent study never count toward attendance
    const notesLower = (entry.notes || '').toLowerCase()
    if (notesLower.includes('independent study') || notesLower.includes('unassigned')) return ''

    const lectureDate = targetDate || entry.specificDate || getKolkataDateString()
    const sub = subjects.find(s => isSameSubject(s.id, entry.subjectId))
    const expectedTitle = entry.notes || `${sub?.name || 'Class'} Session`

    // Check if this timetable entry is ALREADY logged to avoid duplicate phantom lectures
    const existing = lectures.find(l => 
      l.date === lectureDate && 
      isSameSubject(l.subjectId, entry.subjectId) && 
      (l.startTime === entry.startTime || l.title === expectedTitle)
    )

    if (existing) {
      updateLecture(existing.id, { status })
      return existing.id
    }

    const canonSubId = canonicalSubjectId(entry.subjectId) || 'S5-CS01'
    const faculty = resolveFacultyName(entry.facultyId, canonSubId, entry.faculty)
    const facultyId = entry.facultyId || resolveFacultyId(canonSubId, faculty)
    const dur = entry.startTime && entry.endTime 
      ? Math.max(15, timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime))
      : (entry.durationMinutes || 60)

    return addLecture({
      date: lectureDate,
      subjectId: canonSubId,
      title: expectedTitle,
      faculty,
      facultyId,
      startTime: entry.startTime,
      endTime: entry.endTime,
      durationMinutes: dur,
      classroom: entry.classroom,
      status,
      notes: entry.classroom ? `Location: ${entry.classroom}. ${entry.notes || ''}`.trim() : entry.notes
    })
  }


  // --------------------------------------------------------------------------
  // ENHANCED COURSE ACTIONS
  // --------------------------------------------------------------------------
  const addEnhancedCourse = (courseData: Omit<EnhancedCourse, 'id'>) => {
    const newCourse: EnhancedCourse = {
      ...courseData,
      id: `course-${Date.now()}`
    }
    setEnhancedCourses(prev => [...prev, newCourse])
  }

  const updateEnhancedCourse = (id: string, updates: Partial<EnhancedCourse>) => {
    setEnhancedCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteEnhancedCourse = (id: string) => {
    setEnhancedCourses(prev => prev.filter(c => c.id !== id))
  }

  // --------------------------------------------------------------------------
  // EMAIL REPORT ACTIONS
  // --------------------------------------------------------------------------
  const updateEmailSettings = (updates: Partial<EmailReportSettings>) => {
    setEmailSettings(prev => ({ ...prev, ...updates }))
  }

  const generateDailyReportPayload = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayLectures = lectures.filter(l => l.date === todayStr)
    const pendingTasks = tasks.filter(t => t.status !== 'completed')
    const completedTasksToday = tasks.filter(t => t.status === 'completed' && t.deadline === todayStr)

    const totalStudyMins = todayLectures.reduce((acc, l) => acc + (l.durationMinutes || 60), 0)

    return {
      type: 'daily',
      date: todayStr,
      studentName: profile.name,
      cohort: profile.cohort,
      batch: profile.batch,
      todayLectures: todayLectures.map(l => ({
        subject: subjects.find(s => s.id === l.subjectId)?.name || l.subjectId,
        title: l.title,
        status: l.status,
        durationMinutes: l.durationMinutes,
        faculty: l.faculty
      })),
      totalStudyMinutes: totalStudyMins,
      attendanceSummary: getAllSubjectAttendanceStats(),
      pendingTasksCount: pendingTasks.length,
      urgentTasks: pendingTasks.filter(t => t.priority === 'high').slice(0, 3),
      completedTasksCount: completedTasksToday.length,
      curriculumMasteryPercentage: (() => {
        const totalS5Topics = subjects.reduce((sum, s) => sum + s.modules.reduce((mSum, m) => mSum + m.topics.length, 0), 0)
        const understood = Object.values(topicProgress).filter(t => t.status === 'understood' || t.confidenceRating >= 4).length
        return totalS5Topics > 0 ? Math.round((understood / totalS5Topics) * 100) : 0
      })()
    }
  }

  const generateWeeklyReportPayload = () => {
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    })

    const weeklyLectures = lectures.filter(l => last7Days.includes(l.date))
    const weeklyAttended = weeklyLectures.filter(l => l.status === 'attended')
    const weeklyStudyMinutes = weeklyLectures.reduce((acc, l) => acc + (l.durationMinutes || 60), 0)

    return {
      type: 'weekly',
      generatedAt: new Date().toISOString(),
      studentName: profile.name,
      cohort: profile.cohort,
      batch: profile.batch,
      attendanceStats: getAllSubjectAttendanceStats(),
      weeklyLecturesCount: weeklyLectures.length,
      weeklyAttendedCount: weeklyAttended.length,
      weeklyStudyHours: Math.round((weeklyStudyMinutes / 60) * 10) / 10,
      tasksOverview: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status !== 'completed').length
      },
      curriculumProgress: (() => {
        const totalS5Topics = subjects.reduce((sum, s) => sum + s.modules.reduce((mSum, m) => mSum + m.topics.length, 0), 0)
        return {
          totalTopics: totalS5Topics,
          understood: Object.values(topicProgress).filter(t => t.status === 'understood' || t.confidenceRating >= 4).length,
          learning: Object.values(topicProgress).filter(t => t.status === 'learning').length,
          needsRevision: Object.values(topicProgress).filter(t => t.status === 'needs_revision' || t.needsRevision).length
        }
      })(),
      coursesProgress: enhancedCourses.map(c => ({
        title: c.title,
        provider: c.provider,
        status: c.status,
        progressPercentage: c.progressPercentage,
        certificateEarned: c.certificateEarned
      }))
    }
  }

  // --------------------------------------------------------------------------
  // LEGACY STUDY SESSIONS & ATTENDANCE ACTIONS
  // --------------------------------------------------------------------------
  const addStudySession = (sessionData: Omit<StudySession, 'id'>) => {
    const newSession: StudySession = {
      ...sessionData,
      id: `session-${Date.now()}`
    }
    setStudySessions(prev => [newSession, ...prev])
  }

  const updateAttendance = (subjectId: string, attended: number, total: number) => {
    const canonicalId = canonicalSubjectId(subjectId)
    const subject = subjects.find(s => isSameSubject(s.id, canonicalId))
    if (!subject) return

    const diffAttended = attended
    const diffAbsent = Math.max(0, total - attended)
    
    // Replace subject's held lectures with these verified counts while preserving existing details
    const otherLectures = lectures.filter(l => !isSameSubject(l.subjectId, canonicalId))
    const existingSubjectLectures = lectures.filter(l => isSameSubject(l.subjectId, canonicalId))
    const newLecs: Lecture[] = []
    const today = new Date().toISOString().split('T')[0]
    
    const existingAttended = existingSubjectLectures.filter(l => l.status === 'attended')
    for (let i = 0; i < diffAttended; i++) {
      if (existingAttended[i]) {
        newLecs.push(existingAttended[i])
      } else {
        newLecs.push({
          id: `lec-manual-att-${canonicalId}-${i}-${Date.now()}`,
          date: today,
          subjectId: canonicalId,
          title: `${subject.name} Session ${i + 1}`,
          faculty: subject.faculty || getDefaultFacultyForSubject(canonicalId),
          durationMinutes: 60,
          status: 'attended',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isEdited: true
        })
      }
    }

    const existingAbsent = existingSubjectLectures.filter(l => l.status === 'absent')
    for (let i = 0; i < diffAbsent; i++) {
      if (existingAbsent[i]) {
        newLecs.push(existingAbsent[i])
      } else {
        newLecs.push({
          id: `lec-manual-abs-${canonicalId}-${i}-${Date.now()}`,
          date: today,
          subjectId: canonicalId,
          title: `${subject.name} Session ${diffAttended + i + 1}`,
          faculty: subject.faculty || getDefaultFacultyForSubject(canonicalId),
          durationMinutes: 60,
          status: 'absent',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isEdited: true
        })
      }
    }

    // Preserve any existing scheduled and cancelled lectures for this subject
    const existingScheduledOrCancelled = existingSubjectLectures.filter(
      l => l.status === 'scheduled' || l.status === 'cancelled'
    )

    setLectures([...otherLectures, ...newLecs, ...existingScheduledOrCancelled])
  }

  const recordSingleClass = (subjectId: string, attended: boolean, durationMinutes: number = 60) => {
    const today = new Date().toISOString().split('T')[0]
    const canonicalId = canonicalSubjectId(subjectId)
    const subject = subjects.find(s => isSameSubject(s.id, canonicalId))
    const existingCount = lectures.filter(l => isSameSubject(l.subjectId, canonicalId)).length
    addLecture({
      date: today,
      subjectId: canonicalId,
      title: `${subject?.name || 'Class'} Session ${existingCount + 1}`,
      faculty: subject?.faculty || getDefaultFacultyForSubject(canonicalId),
      durationMinutes,
      status: attended ? 'attended' : 'absent',
      notes: attended ? 'Attended class session.' : 'Missed class session.'
    })
  }

  // --------------------------------------------------------------------------
  // NOTES ACTIONS
  // --------------------------------------------------------------------------
  const addNote = (noteData: Omit<SubjectNote, 'id' | 'updatedAt'>) => {
    const newNote: SubjectNote = {
      ...noteData,
      id: `note-${Date.now()}`,
      updatedAt: new Date().toISOString()
    }
    setNotes(prev => [newNote, ...prev])
  }

  const updateNote = (id: string, updates: Partial<SubjectNote>) => {
    setNotes(prev => prev.map(n => n.id === id ? {
      ...n,
      ...updates,
      updatedAt: new Date().toISOString()
    } : n))
  }

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  // --------------------------------------------------------------------------
  // DATA MANAGEMENT & BACKUPS
  // --------------------------------------------------------------------------
  const clearSampleData = () => {
    setTasks([])
    setCertifications([])
    setStudySessions([])
    setLectures([])
    setNotes([])
    setTopicProgress({})
    setRevisionSessions([])
  }

  const resetAllData = () => {
    setTasks([])
    setCertifications([])
    setResources(initialResources)
    setStudySessions([])
    setLectures([])
    setTopicProgress({})
    setRevisionSessions([])
    setNotes([])
    setProfile(initialProfile)
    setCompletedTopics({})
    setSettings(initialAcademicSettings)
    setAppDocuments(initialAppDocuments)
    setTimetableEntries(initialTimetableEntries)
    setEnhancedCourses(initialEnhancedCourses)
    setEmailSettings(initialEmailSettings)
  }

  const importBackupData = (jsonStr: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonStr)
      if (parsed.profile) setProfile(parsed.profile)
      if (Array.isArray(parsed.lectures)) setLectures(parsed.lectures)
      if (parsed.topicProgress) setTopicProgress(parsed.topicProgress)
      if (parsed.settings) setSettings(parsed.settings)
      if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks)
      if (Array.isArray(parsed.certifications)) setCertifications(parsed.certifications)
      if (Array.isArray(parsed.resources)) setResources(parsed.resources)
      if (Array.isArray(parsed.documents)) setAppDocuments(parsed.documents)
      if (Array.isArray(parsed.revisionSessions)) setRevisionSessions(parsed.revisionSessions)
      if (Array.isArray(parsed.notes)) setNotes(parsed.notes)
      if (parsed.completedTopics) setCompletedTopics(parsed.completedTopics)
      if (Array.isArray(parsed.timetable)) setTimetableEntries(parsed.timetable)
      if (Array.isArray(parsed.enhancedCourses)) setEnhancedCourses(parsed.enhancedCourses)
      if (parsed.emailSettings) setEmailSettings(parsed.emailSettings)
      return { success: true, message: 'SprintOS backup restored successfully!' }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid backup JSON payload'
      return { success: false, message: `Failed to import data: ${msg}` }
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------
  const getSubject = (id: string) => subjects.find(s => isSameSubject(s.id, id) || isSameSubject(s.code, id))

  const getSubjectProgress = (subjectId: string) => {
    const sub = subjects.find(s => isSameSubject(s.id, subjectId) || isSameSubject(s.code, subjectId))
    if (!sub) return { completed: 0, total: 0, percentage: 0 }
    
    const allTopics = sub.modules.flatMap(m => m.topics)
    const total = allTopics.length
    if (total === 0) return { completed: 0, total: 0, percentage: 0 }

    // Check both learning progress records and completedTopics map
    const completed = allTopics.filter(t => {
      const record = topicProgress[t.id]
      if (record && record.status === 'understood') return true
      return !!completedTopics[t.id]
    }).length

    const percentage = Math.round((completed / total) * 100)
    return { completed, total, percentage }
  }

  const getSubjectAttendanceStats = (subjectId: string): SubjectAttendanceStats => {
    const sub = subjects.find(s => isSameSubject(s.id, subjectId) || isSameSubject(s.code, subjectId))
    const hours = sub ? sub.totalHours : 30
    return calculateSubjectAttendance(subjectId, lectures, hours, settings.minAttendancePercent)
  }

  const getAllSubjectAttendanceStats = (): SubjectAttendanceStats[] => {
    return subjects.map(sub => getSubjectAttendanceStats(sub.id))
  }

  const getOverallAttendanceStats = (): OverallAttendanceStats => {
    const stats = getAllSubjectAttendanceStats()
    return calculateOverallAttendance(stats, settings.minAttendancePercent)
  }

  const getSubjectAttendance = (subjectId: string) => {
    const stats = getSubjectAttendanceStats(subjectId)
    return {
      attended: stats.attended,
      total: stats.totalHeld,
      percentage: stats.percentage !== null ? stats.percentage : 0,
      isWarning: stats.isWarning
    }
  }

  const value = {
    subjects,
    lectures,
    topicProgress,
    settings,
    appDocuments,
    revisionSessions,
    tasks,
    certifications,
    resources,
    attendance,
    studySessions,
    notes,
    profile,
    completedTopics,
    storageMode,
    timetableEntries,
    timetableConflicts,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    importTimetableEntries,
    logTimetableAsLecture,
    removeTimetableLectureLog,
    getTimetableSlotLecture,
    enhancedCourses,
    addEnhancedCourse,
    updateEnhancedCourse,
    deleteEnhancedCourse,
    emailSettings,
    updateEmailSettings,
    generateDailyReportPayload,
    generateWeeklyReportPayload,
    addLecture,
    addMultipleLectures,
    updateLecture,
    deleteLecture,
    setLectureStatus,
    updateTopicProgress,
    toggleTopicRevision,
    toggleTopic,
    addDocument,
    deleteDocument,
    addRevisionSession,
    updateSettings,
    updateProfile,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    addCertification,
    updateCertification,
    deleteCertification,
    importSyllabusCertifications,
    addResource,
    updateResource,
    deleteResource,
    toggleFavoriteResource,
    addStudySession,
    updateAttendance,
    recordSingleClass,
    addNote,
    updateNote,
    deleteNote,
    clearSampleData,
    resetAllData,
    importBackupData,
    getSubject,
    getSubjectProgress,
    getSubjectAttendance,
    getSubjectAttendanceStats,
    getAllSubjectAttendanceStats,
    getOverallAttendanceStats,
    theme,
    setTheme
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
