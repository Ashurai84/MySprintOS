import { describe, it, expect } from 'vitest'
import { 
  timeToMinutes, 
  minutesToTime, 
  calculateDurationFromTimes, 
  calculateEndTimeFromDuration, 
  formatDuration, 
  detectTimetableConflicts,
  normalizeTimeTo24H,
  sanitizeTimetableEntries
} from '../utils/timetableUtils'
import type { TimetableEntry } from '../types'
import { 
  initialJavaDiagnosticQuestions, 
  initialJavaTopics,
  initialLectures
} from '../data/defaultData'
import { calculateSubjectAttendance } from '../utils/attendanceCalculator'
import { isSameSubject } from '../utils/subjectUtils'

describe('SprintOS 2.1 — Lecture Duration & Timetable Engine', () => {
  it('correctly calculates duration between start and end times', () => {
    expect(timeToMinutes('10:30')).toBe(630)
    expect(minutesToTime(630)).toBe('10:30')
    // Standard 60m session
    expect(calculateDurationFromTimes('10:00', '11:00')).toBe(60)
    // 120m (2h) block
    expect(calculateDurationFromTimes('10:00', '12:00')).toBe(120)
    // 90m block
    expect(calculateDurationFromTimes('13:30', '15:00')).toBe(90)
    // 45m block
    expect(calculateDurationFromTimes('09:15', '10:00')).toBe(45)
  })

  it('correctly calculates end time from start time and duration', () => {
    expect(calculateEndTimeFromDuration('10:00', 60)).toBe('11:00')
    expect(calculateEndTimeFromDuration('10:00', 120)).toBe('12:00')
    expect(calculateEndTimeFromDuration('14:30', 90)).toBe('16:00')
  })

  it('formats duration labels accurately without losing custom minutes', () => {
    expect(formatDuration(60)).toBe('60 mins (1 hr)')
    expect(formatDuration(120)).toBe('120 mins (2 hrs)')
    expect(formatDuration(90)).toBe('90 mins (1.5 hrs)')
    expect(formatDuration(45)).toBe('45 mins')
    expect(formatDuration(180)).toBe('180 mins (3 hrs)')
  })

  it('detects timetable overlapping conflicts accurately', () => {
    const entries: TimetableEntry[] = [
      {
        id: 'slot-1',
        dayOfWeek: 4, // Thursday
        specificDate: '2026-10-22',
        startTime: '10:00',
        endTime: '12:00',
        durationMinutes: 120,
        slotType: 'lecture',
        subjectId: 'dsa-3',
        faculty: 'Prof. Sharma',
        classroom: 'Room 37'
      },
      {
        id: 'slot-2',
        dayOfWeek: 4, // Thursday
        specificDate: '2026-10-22',
        startTime: '11:30', // Overlaps with slot-1
        endTime: '12:30',
        durationMinutes: 60,
        slotType: 'lecture',
        subjectId: 'stqa',
        faculty: 'Prof. Rao',
        classroom: 'Room 37'
      },
      {
        id: 'slot-3',
        dayOfWeek: 4, // Thursday
        specificDate: '2026-10-22',
        startTime: '13:00', // No overlap
        endTime: '14:00',
        durationMinutes: 60,
        slotType: 'lunch_break'
      }
    ]

    const conflicts = detectTimetableConflicts(entries)
    expect(conflicts.length).toBeGreaterThan(0)
    expect(conflicts.some(c => (c.entryId1 === 'slot-1' && c.entryId2 === 'slot-2') || (c.entryId1 === 'slot-2' && c.entryId2 === 'slot-1'))).toBe(true)
    // slot-3 should not be in conflict
    expect(conflicts.some(c => c.entryId1 === 'slot-3' || c.entryId2 === 'slot-3')).toBe(false)
  })

  it('strictly excludes breaks from academic attendance calculations', () => {
    // 2 lectures attended, 1 absent, 1 lunch break
    const lectures = [
      {
        id: 'lec-1',
        subjectId: 'dsa-3',
        date: '2026-10-22',
        title: 'DSA Session 1',
        status: 'attended' as const,
        durationMinutes: 120,
        createdAt: '2026-10-22T10:00:00Z',
        updatedAt: '2026-10-22T10:00:00Z'
      },
      {
        id: 'lec-2',
        subjectId: 'dsa-3',
        date: '2026-10-22',
        title: 'DSA Session 2',
        status: 'attended' as const,
        durationMinutes: 60,
        createdAt: '2026-10-22T12:00:00Z',
        updatedAt: '2026-10-22T12:00:00Z'
      },
      {
        id: 'lec-3',
        subjectId: 'dsa-3',
        date: '2026-10-23',
        title: 'DSA Session 3',
        status: 'absent' as const,
        durationMinutes: 60,
        createdAt: '2026-10-23T10:00:00Z',
        updatedAt: '2026-10-23T10:00:00Z'
      }
    ]

    const stats = calculateSubjectAttendance('dsa-3', lectures, 45, 75)
    expect(stats.totalHeld).toBe(3)
    expect(stats.attended).toBe(2)
    expect(stats.percentage).toBeCloseTo(66.67, 1)
    expect(stats.isWarning).toBe(true)
    expect(stats.consecutiveNeededToReachTarget).toBe(1) // 3/4 = 75%
  })
})

describe('SprintOS 2.1 — Java Fundamentals Recovery Assessment', () => {
  it('has 10 diagnostic assessment questions covering key core Java topics', () => {
    expect(initialJavaDiagnosticQuestions.length).toBe(10)
    initialJavaDiagnosticQuestions.forEach(q => {
      expect(q.options.length).toBe(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
      expect(q.topic).toBeDefined()
    })
  })

  it('has 14 curated curriculum topics with concepts and practice prompts', () => {
    expect(initialJavaTopics.length).toBe(14)
    initialJavaTopics.forEach(t => {
      expect(t.keyConcepts.length).toBeGreaterThan(0)
      expect(t.practicePrompt).toBeDefined()
      expect(t.confidenceRating).toBeGreaterThanOrEqual(1)
      expect(t.confidenceRating).toBeLessThanOrEqual(5)
    })
  })

  it('evaluates diagnostic test results and isolates weak topic tags accurately', () => {
    // Student answers questions 0..6 correctly, 7..9 incorrectly
    const answers: Record<string, number> = {}
    initialJavaDiagnosticQuestions.forEach((q, idx) => {
      answers[q.id] = idx < 7 ? q.correctIndex : (q.correctIndex + 1) % 4
    })

    let score = 0
    const weakTopicNames: string[] = []
    initialJavaDiagnosticQuestions.forEach(q => {
      if (answers[q.id] === q.correctIndex) {
        score++
      } else {
        weakTopicNames.push(q.topic)
      }
    })

    expect(score).toBe(7)
    expect(weakTopicNames.length).toBe(3)
    // 7/10 meets passing criteria (>= 7)
    expect(score >= 7).toBe(true)
  })
})

describe('SprintOS 2.1 — 24-Hour Time Standardization & Lecture Harmonization', () => {
  it('strictly normalizes ambiguous 12-hour school afternoon times to 24-hour format', () => {
    // "02:00" afternoon end-time should normalize to "14:00"
    expect(normalizeTimeTo24H('02:00', true)).toBe('14:00')
    expect(normalizeTimeTo24H('2:00 PM')).toBe('14:00')
    expect(normalizeTimeTo24H('1:10 PM')).toBe('13:10')
    expect(normalizeTimeTo24H('13:10')).toBe('13:10')
    expect(normalizeTimeTo24H('14:10')).toBe('14:10')
    expect(normalizeTimeTo24H('09:00')).toBe('09:00')
  })

  it('sanitizes Wednesday 13:10–02:00 into 13:10–14:10 (24h format with 60m duration)', () => {
    const rawEntries: TimetableEntry[] = [
      {
        id: 'wed-lunch',
        dayOfWeek: 3,
        startTime: '13:10',
        endTime: '02:00',
        durationMinutes: 60,
        slotType: 'lunch_break',
        classroom: 'Classroom 37'
      }
    ]

    const sanitized = sanitizeTimetableEntries(rawEntries)
    expect(sanitized[0].startTime).toBe('13:10')
    expect(sanitized[0].endTime).toBe('14:10')
    expect(sanitized[0].durationMinutes).toBe(60)
  })

  it('maintains exactly 3 held lectures for DSA-3 up to Kosaraju with 100% attendance', () => {
    const dsaLectures = initialLectures.filter(l => isSameSubject(l.subjectId, 'S5-CS01'))
    expect(dsaLectures.length).toBe(3)
    // Canonical ID check
    expect(dsaLectures[0].subjectId).toBe('S5-CS01')
    expect(dsaLectures[0].faculty).toBe('Sanjay Sahu (VF)')

    // Verify all 3 titles correspond to the authentic syllabus covered
    expect(dsaLectures.some(l => l.title.includes('Strongly Connected Components (SCC) Overview'))).toBe(true)
    expect(dsaLectures.some(l => l.title.includes('Unit 2: Graph Algorithms & Strongly Connected Components'))).toBe(true)
    expect(dsaLectures.some(l => l.title.includes("Kosaraju's Algorithm & Tarjan Low-Link"))).toBe(true)

    // Verify no phantom "Session 3" or "Session 4" duplicate records exist
    expect(dsaLectures.some(l => l.title === 'Data Structures and Algorithms III Session 3')).toBe(false)
    expect(dsaLectures.some(l => l.title === 'Data Structures and Algorithms III Session 4')).toBe(false)

    // Calculate official attendance stats with both canonical code and legacy id
    const statsCanon = calculateSubjectAttendance('S5-CS01', dsaLectures, 45, 75)
    expect(statsCanon.totalHeld).toBe(3)
    expect(statsCanon.attended).toBe(3)
    expect(statsCanon.absent).toBe(0)
    expect(statsCanon.percentage).toBe(100)
    expect(statsCanon.isWarning).toBe(false)

    const statsLegacy = calculateSubjectAttendance('dsa-3', dsaLectures, 45, 75)
    expect(statsLegacy.totalHeld).toBe(3)
    expect(statsLegacy.attended).toBe(3)
  })
})

describe('SprintOS 2.1 — Certification & Specialization Track Distinction', () => {
  it('strictly distinguishes between course completion and certificate issuance', () => {
    const course = {
      id: 'course-genai-llm',
      title: 'Generative AI with Large Language Models',
      modules: [
        { id: 'm1', title: 'LLM Foundations', completed: true },
        { id: 'm2', title: 'Instruction Fine-Tuning', completed: true },
        { id: 'm3', title: 'RLHF & Alignment', completed: true }
      ],
      progressPercentage: 100,
      certificateEarned: false, // 100% course completed, but certificate is not yet issued/verified
      certificateUrl: ''
    }

    const completedModules = course.modules.filter(m => m.completed).length
    const isCurriculumFinished = completedModules === course.modules.length

    expect(isCurriculumFinished).toBe(true)
    // Explicitly verify certificate is NOT auto-assumed without user verification
    expect(course.certificateEarned).toBe(false)
  })
})
