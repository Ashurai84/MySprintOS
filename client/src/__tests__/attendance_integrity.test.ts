import { describe, it, expect } from 'vitest'
import {
  calculateSubjectAttendance,
  calculateOverallAttendance,
  getAttendanceStatusConfig
} from '../utils/attendanceCalculator'
import {
  canonicalSubjectId,
  isSameSubject,
  canonicalSubjectCode
} from '../utils/subjectUtils'
import { initialLectures, initialAttendance, initialSubjects } from '../data/defaultData'
import type { Lecture } from '../types'

describe('SprintOS Attendance Data Integrity Audit & Regression Tests', () => {

  // Test Fixture: The 7 verified held lectures conducted on Oct 21-22, 2026
  const verifiedSevenLectures: Lecture[] = [
    {
      id: 'lec-dsa-1',
      date: '2026-10-21',
      startTime: '09:00',
      endTime: '10:00',
      subjectId: 'S5-CS01',
      title: 'Strongly Connected Components (SCC) Overview',
      faculty: 'Sanjay Sahu (VF)',
      classroom: 'Classroom 37',
      status: 'attended',
      durationMinutes: 60,
      whatILearned: 'Graph basics, component definition',
      createdAt: '2026-10-21T09:00:00Z',
      updatedAt: '2026-10-21T10:00:00Z'
    },
    {
      id: 'lec-dsa-2',
      date: '2026-10-21',
      startTime: '10:00',
      endTime: '11:00',
      subjectId: 'S5-CS01',
      title: 'DFS-based Components & Edge Classification',
      faculty: 'Sanjay Sahu (VF)',
      classroom: 'Classroom 37',
      status: 'attended',
      durationMinutes: 60,
      createdAt: '2026-10-21T10:00:00Z',
      updatedAt: '2026-10-21T11:00:00Z'
    },
    {
      id: 'lec-dsa-3',
      date: '2026-10-22',
      startTime: '11:10',
      endTime: '12:10',
      subjectId: 'S5-CS01',
      title: "Kosaraju's Algorithm — Two-Pass DFS & Transpose Graph",
      faculty: 'Sanjay Sahu (VF)',
      classroom: 'Classroom 37',
      status: 'attended',
      durationMinutes: 60,
      whatILearned: 'Reversed graph G^T traversal',
      importantConcepts: ['Kosaraju', 'Transpose Graph'],
      createdAt: '2026-10-22T11:10:00Z',
      updatedAt: '2026-10-22T12:10:00Z'
    },
    {
      id: 'lec-ai-1',
      date: '2026-10-22',
      startTime: '13:00',
      endTime: '14:00',
      subjectId: 'S5-AI01',
      title: 'Introduction to Prompt Engineering & In-Context Learning',
      faculty: 'Dr. Dipanjan Biswas',
      classroom: 'Classroom 37',
      status: 'attended',
      durationMinutes: 60,
      createdAt: '2026-10-22T13:00:00Z',
      updatedAt: '2026-10-22T14:00:00Z'
    },
    {
      id: 'lec-ss-1',
      date: '2026-10-22',
      startTime: '14:00',
      endTime: '15:00',
      subjectId: 'S5-SS01',
      title: 'Executive Presence & Workplace Communication Dynamics',
      faculty: 'Prof. Amaan',
      classroom: 'Classroom 37',
      status: 'attended',
      durationMinutes: 60,
      createdAt: '2026-10-22T14:00:00Z',
      updatedAt: '2026-10-22T15:00:00Z'
    },
    {
      id: 'lec-vc-1',
      date: '2026-10-22',
      startTime: '15:10',
      endTime: '16:10',
      subjectId: 'S5-MG01',
      title: 'Venture Capital Fundamentals: Fund Economics & Cap Tables',
      faculty: 'Mr. Vivekanand Jha',
      classroom: 'Classroom 37',
      status: 'attended',
      durationMinutes: 60,
      createdAt: '2026-10-22T15:10:00Z',
      updatedAt: '2026-10-22T16:10:00Z'
    },
    {
      id: 'lec-vc-2',
      date: '2026-10-22',
      startTime: '16:10',
      endTime: '17:10',
      subjectId: 'S5-MG01',
      title: 'Product-Market Fit Metrics & Due Diligence Frameworks',
      faculty: 'Mr. Vivekanand Jha',
      classroom: 'Classroom 37',
      status: 'attended',
      durationMinutes: 60,
      createdAt: '2026-10-22T16:10:00Z',
      updatedAt: '2026-10-22T17:10:00Z'
    }
  ]

  // Scenario 1: Seven verified held lectures are counted correctly
  it('1. Correctly counts exactly 7 verified held lectures when fixture contains 7 eligible records', () => {
    const subjects = initialSubjects.map(s => s.id)
    const statsPerSubject = subjects.map(sId => calculateSubjectAttendance(sId, verifiedSevenLectures))
    const overall = calculateOverallAttendance(statsPerSubject)

    expect(overall.totalHeld).toBe(7)
    expect(overall.attended).toBe(7)
    expect(overall.absent).toBe(0)
    expect(overall.unmarked).toBe(0)
    expect(overall.percentage).toBe(100)

    const dsaStats = statsPerSubject.find(s => s.subjectId === 'S5-CS01')!
    expect(dsaStats.totalHeld).toBe(3)
    expect(dsaStats.attended).toBe(3)

    const aiStats = statsPerSubject.find(s => s.subjectId === 'S5-AI01')!
    expect(aiStats.totalHeld).toBe(1)
    expect(aiStats.attended).toBe(1)

    const ssStats = statsPerSubject.find(s => s.subjectId === 'S5-SS01')!
    expect(ssStats.totalHeld).toBe(1)
    expect(ssStats.attended).toBe(1)

    const vcStats = statsPerSubject.find(s => s.subjectId === 'S5-MG01')!
    expect(vcStats.totalHeld).toBe(2)
    expect(vcStats.attended).toBe(2)

    const stqaStats = statsPerSubject.find(s => s.subjectId === 'S5-SE01')!
    expect(stqaStats.totalHeld).toBe(0)
    expect(stqaStats.attended).toBe(0)

    const dsStats = statsPerSubject.find(s => s.subjectId === 'S5-DS01')!
    expect(dsStats.totalHeld).toBe(0)
    expect(dsStats.attended).toBe(0)
  })

  // Scenario 2: Summary totals reconcile with the sum of subject-level totals
  it('2. Summary totals strictly reconcile with the sum of subject-level totals across all statuses', () => {
    const complexLectures: Lecture[] = [
      ...verifiedSevenLectures,
      // Add absent, unmarked, scheduled, cancelled
      {
        id: 'lec-ai-absent',
        date: '2026-10-23',
        startTime: '10:00',
        endTime: '11:00',
        subjectId: 'S5-AI01',
        title: 'RAG Architecture Overview',
        status: 'absent',
        durationMinutes: 60,
        createdAt: '2026-10-23T10:00:00Z',
        updatedAt: '2026-10-23T11:00:00Z'
      },
      {
        id: 'lec-se-unmarked',
        date: '2026-10-23',
        startTime: '11:10',
        endTime: '12:10',
        subjectId: 'S5-SE01',
        title: 'Test Automation Fundamentals',
        status: 'unmarked',
        durationMinutes: 60,
        createdAt: '2026-10-23T11:10:00Z',
        updatedAt: '2026-10-23T12:10:00Z'
      },
      {
        id: 'lec-ds-scheduled',
        date: '2026-10-26',
        startTime: '09:00',
        endTime: '10:00',
        subjectId: 'S5-DS01',
        title: 'Supervised Learning Algorithms',
        status: 'scheduled',
        durationMinutes: 60,
        createdAt: '2026-10-24T10:00:00Z',
        updatedAt: '2026-10-24T10:00:00Z'
      },
      {
        id: 'lec-dsa-cancelled',
        date: '2026-10-24',
        startTime: '09:00',
        endTime: '10:00',
        subjectId: 'S5-CS01',
        title: 'Guest Lecture',
        status: 'cancelled',
        durationMinutes: 60,
        createdAt: '2026-10-24T09:00:00Z',
        updatedAt: '2026-10-24T09:00:00Z'
      }
    ]

    const statsPerSubject = initialSubjects.map(s => calculateSubjectAttendance(s.id, complexLectures))
    const overall = calculateOverallAttendance(statsPerSubject)

    const sumHeld = statsPerSubject.reduce((acc, s) => acc + s.totalHeld, 0)
    const sumAttended = statsPerSubject.reduce((acc, s) => acc + s.attended, 0)
    const sumAbsent = statsPerSubject.reduce((acc, s) => acc + s.absent, 0)
    const sumUnmarked = statsPerSubject.reduce((acc, s) => acc + s.unmarked, 0)
    const sumScheduled = statsPerSubject.reduce((acc, s) => acc + s.scheduled, 0)
    const sumCancelled = statsPerSubject.reduce((acc, s) => acc + s.cancelled, 0)

    expect(overall.totalHeld).toBe(sumHeld)
    expect(overall.attended).toBe(sumAttended)
    expect(overall.absent).toBe(sumAbsent)
    expect(overall.unmarked).toBe(sumUnmarked)
    expect(overall.scheduled).toBe(sumScheduled)
    expect(overall.cancelled).toBe(sumCancelled)
  })

  // Scenario 3: A single lecture is not counted twice (deduplication check)
  it('3. Guarantees two sessions on the same day are both preserved when start times differ, but duplicates are filtered', () => {
    // Two distinct sessions on same day for S5-MG01
    const vc1 = verifiedSevenLectures.find(l => l.id === 'lec-vc-1')!
    const vc2 = verifiedSevenLectures.find(l => l.id === 'lec-vc-2')!

    // Exact duplicate of vc1
    const duplicateVc1: Lecture = {
      ...vc1,
      id: 'lec-vc-1-clone'
    }

    const testList = [vc1, vc2, duplicateVc1]

    // Harmonization deduplication logic: key includes startTime
    const seen = new Set<string>()
    const harmonized: Lecture[] = []
    for (const l of testList) {
      const key = `${canonicalSubjectId(l.subjectId)}_${l.title}_${l.date}_${l.startTime || l.id}`
      if (!seen.has(key)) {
        seen.add(key)
        harmonized.push(l)
      }
    }

    // Duplicate clone is dropped, but distinct vc1 and vc2 are kept
    expect(harmonized.length).toBe(2)
    const stats = calculateSubjectAttendance('S5-MG01', harmonized)
    expect(stats.totalHeld).toBe(2)
    expect(stats.attended).toBe(2)
  })

  // Scenario 4: Scheduled future lectures are excluded from held totals
  it('4. Excludes scheduled future (and past) lectures from held totals and attendance percentage', () => {
    const lectures: Lecture[] = [
      {
        id: 'lec-future-1',
        date: '2026-10-30',
        subjectId: 'S5-SE01',
        title: 'CI/CD Pipelines',
        status: 'scheduled',
        durationMinutes: 60,
        createdAt: '2026-10-24T00:00:00Z',
        updatedAt: '2026-10-24T00:00:00Z'
      },
      {
        id: 'lec-past-scheduled',
        date: '2026-10-15',
        subjectId: 'S5-SE01',
        title: 'Past Scheduled Unconfirmed',
        status: 'scheduled',
        durationMinutes: 60,
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z'
      }
    ]

    const stats = calculateSubjectAttendance('S5-SE01', lectures)
    expect(stats.totalHeld).toBe(0)
    expect(stats.attended).toBe(0)
    expect(stats.absent).toBe(0)
    expect(stats.scheduled).toBe(2)
    expect(stats.percentage).toBeNull() // Not 0%, not 100%, safely null
  })

  // Scenario 5: Cancelled lectures are excluded from attendance percentages
  it('5. Excludes cancelled lectures from the attendance denominator and percentage calculation', () => {
    const lectures: Lecture[] = [
      {
        id: 'lec-att-1',
        date: '2026-10-21',
        subjectId: 'S5-CS01',
        title: 'Lecture 1',
        status: 'attended',
        durationMinutes: 60,
        createdAt: '2026-10-21T00:00:00Z',
        updatedAt: '2026-10-21T00:00:00Z'
      },
      {
        id: 'lec-canc-1',
        date: '2026-10-22',
        subjectId: 'S5-CS01',
        title: 'Cancelled Class (Faculty On Leave)',
        status: 'cancelled',
        durationMinutes: 60,
        createdAt: '2026-10-22T00:00:00Z',
        updatedAt: '2026-10-22T00:00:00Z'
      }
    ]

    const stats = calculateSubjectAttendance('S5-CS01', lectures)
    expect(stats.totalHeld).toBe(1)
    expect(stats.attended).toBe(1)
    expect(stats.cancelled).toBe(1)
    expect(stats.percentage).toBe(100) // Denominator is 1, not 2!
  })

  // Scenario 6: Unmarked attendance does not silently count as present or absent
  it('6. Does not silently count unmarked sessions as attended or absent', () => {
    const lectures: Lecture[] = [
      {
        id: 'lec-att',
        date: '2026-10-21',
        subjectId: 'S5-AI01',
        title: 'Held Session 1',
        status: 'attended',
        durationMinutes: 60,
        createdAt: '2026-10-21T00:00:00Z',
        updatedAt: '2026-10-21T00:00:00Z'
      },
      {
        id: 'lec-unm',
        date: '2026-10-22',
        subjectId: 'S5-AI01',
        title: 'Held Session 2 (Attendance pending confirmation)',
        status: 'unmarked',
        durationMinutes: 60,
        createdAt: '2026-10-22T00:00:00Z',
        updatedAt: '2026-10-22T00:00:00Z'
      }
    ]

    const stats = calculateSubjectAttendance('S5-AI01', lectures)
    expect(stats.unmarked).toBe(1)
    expect(stats.attended).toBe(1)
    expect(stats.absent).toBe(0)
    // Only confirmed attended + absent constitute totalHeld
    expect(stats.totalHeld).toBe(1)
    expect(stats.percentage).toBe(100)
  })

  // Scenario 7: Attended and absent counts produce the exact percentage formula
  it('7. Computes exact percentage using attended / (attended + absent) * 100', () => {
    const lectures: Lecture[] = [
      { id: '1', date: '2026-10-01', subjectId: 'S5-CS01', title: 'L1', status: 'attended', durationMinutes: 60, createdAt: '', updatedAt: '' },
      { id: '2', date: '2026-10-02', subjectId: 'S5-CS01', title: 'L2', status: 'attended', durationMinutes: 60, createdAt: '', updatedAt: '' },
      { id: '3', date: '2026-10-03', subjectId: 'S5-CS01', title: 'L3', status: 'attended', durationMinutes: 60, createdAt: '', updatedAt: '' },
      { id: '4', date: '2026-10-04', subjectId: 'S5-CS01', title: 'L4', status: 'absent', durationMinutes: 60, createdAt: '', updatedAt: '' }
    ]

    const stats = calculateSubjectAttendance('S5-CS01', lectures)
    expect(stats.totalHeld).toBe(4)
    expect(stats.attended).toBe(3)
    expect(stats.absent).toBe(1)
    // 3 / 4 * 100 = 75%
    expect(stats.percentage).toBe(75)
    expect(stats.isWarning).toBe(false)

    // With 1 more absent: 3 / 5 * 100 = 60%
    const withSecondAbsent = [
      ...lectures,
      { id: '5', date: '2026-10-05', subjectId: 'S5-CS01', title: 'L5', status: 'absent' as const, durationMinutes: 60, createdAt: '', updatedAt: '' }
    ]
    const stats2 = calculateSubjectAttendance('S5-CS01', withSecondAbsent)
    expect(stats2.totalHeld).toBe(5)
    expect(stats2.percentage).toBe(60)
    expect(stats2.isWarning).toBe(true)
  })

  // Scenario 8: Subject with zero eligible sessions does not display a misleading percentage
  it('8. Returns percentage: null when zero eligible sessions are recorded (prevents NaN / Infinity / false 100%)', () => {
    const emptyLectures: Lecture[] = []
    const stats = calculateSubjectAttendance('S5-DS01', emptyLectures)

    expect(stats.totalHeld).toBe(0)
    expect(stats.attended).toBe(0)
    expect(stats.absent).toBe(0)
    expect(stats.percentage).toBeNull()

    const overall = calculateOverallAttendance([stats])
    expect(overall.percentage).toBeNull()
  })

  // Scenario 9: Editing attendance updates the summary and subject breakdown
  it('9. Re-evaluating calculations after a status change dynamically updates both subject and overall attendance', () => {
    let lectures = [...verifiedSevenLectures]

    // Initial state: 7 attended, 0 absent
    let stats = initialSubjects.map(s => calculateSubjectAttendance(s.id, lectures))
    let overall = calculateOverallAttendance(stats)
    expect(overall.attended).toBe(7)
    expect(overall.absent).toBe(0)
    expect(overall.percentage).toBe(100)

    // Action: User corrects 'lec-dsa-3' from 'attended' to 'absent'
    lectures = lectures.map(l => l.id === 'lec-dsa-3' ? { ...l, status: 'absent' as const } : l)

    stats = initialSubjects.map(s => calculateSubjectAttendance(s.id, lectures))
    overall = calculateOverallAttendance(stats)

    // Overall now: 6 attended, 1 absent, total held 7 -> 86%
    expect(overall.totalHeld).toBe(7)
    expect(overall.attended).toBe(6)
    expect(overall.absent).toBe(1)
    expect(overall.percentage).toBe(85.7) // 6/7 = 85.7% rounded to 1 decimal place

    // Subject breakdown for DSA: 2 attended, 1 absent -> 67%
    const dsaStats = stats.find(s => s.subjectId === 'S5-CS01')!
    expect(dsaStats.totalHeld).toBe(3)
    expect(dsaStats.attended).toBe(2)
    expect(dsaStats.absent).toBe(1)
    expect(dsaStats.percentage).toBe(66.7)
    expect(dsaStats.isWarning).toBe(true)
  })

  // Scenario 10: Subject IDs and Timetable Aliases are mapped correctly
  it('10. Resolves canonical IDs and aliases across all 6 active Semester 5 subjects', () => {
    // 1. DSA III
    expect(canonicalSubjectId('S5-CS01')).toBe('S5-CS01')
    expect(canonicalSubjectId('dsa-3')).toBe('S5-CS01')
    expect(canonicalSubjectCode('S5-CS01')).toBe('S5-CS01')

    // 2. LLMs, RAG & Agentic AI (handles timetable code S5-CS02 alias)
    expect(canonicalSubjectId('S5-AI01')).toBe('S5-AI01')
    expect(canonicalSubjectId('llm-rag-agentic-ai')).toBe('S5-AI01')
    expect(canonicalSubjectId('S5-CS02')).toBe('S5-AI01')
    expect(isSameSubject('S5-CS02', 'S5-AI01')).toBe(true)

    // 3. Venture Capital & Product Strategy (handles timetable code S5-MS01 alias)
    expect(canonicalSubjectId('S5-MG01')).toBe('S5-MG01')
    expect(canonicalSubjectId('venture-product-strategy')).toBe('S5-MG01')
    expect(canonicalSubjectId('S5-MS01')).toBe('S5-MG01')
    expect(isSameSubject('S5-MS01', 'S5-MG01')).toBe(true)

    // 4. Software Testing & QA (handles timetable code S5-CS03 alias)
    expect(canonicalSubjectId('S5-SE01')).toBe('S5-SE01')
    expect(canonicalSubjectId('software-testing-qa')).toBe('S5-SE01')
    expect(canonicalSubjectId('S5-CS03')).toBe('S5-SE01')
    expect(isSameSubject('S5-CS03', 'S5-SE01')).toBe(true)

    // 5. Foundations of AI/ML & Data Science
    expect(canonicalSubjectId('S5-DS01')).toBe('S5-DS01')
    expect(canonicalSubjectId('foundations-aiml-data-science')).toBe('S5-DS01')

    // 6. Career Readiness & Leadership
    expect(canonicalSubjectId('S5-SS01')).toBe('S5-SS01')
    expect(canonicalSubjectId('career-readiness-leadership')).toBe('S5-SS01')
  })

  // Scenario 11: Historical data remains intact
  it('11. Preserves existing student notes, concepts, and timestamps when inspecting default records', () => {
    const kosarajuLecture = initialLectures.find(l => l.id === 'lec-dsa-3')
    expect(kosarajuLecture).toBeDefined()
    expect(kosarajuLecture?.whatILearned).toBeDefined()
    expect(kosarajuLecture?.whatILearned).toContain('Kosaraju')
    expect(kosarajuLecture?.status).toBe('attended')

    // Initial attendance matches 7 verified classes conducted
    const totalConductedInAttendance = initialAttendance.reduce((acc, a) => acc + a.classesAttended, 0)
    expect(totalConductedInAttendance).toBe(7)
  })

  // Scenario 12: Status configuration provides safe labels and badges
  it('12. Validates attendance status configuration for all statuses including unmarked', () => {
    const attendedCfg = getAttendanceStatusConfig('attended')
    expect(attendedCfg.label).toBe('Attended')

    const absentCfg = getAttendanceStatusConfig('absent')
    expect(absentCfg.label).toBe('Absent')

    const scheduledCfg = getAttendanceStatusConfig('scheduled')
    expect(scheduledCfg.label).toBe('Scheduled')

    const cancelledCfg = getAttendanceStatusConfig('cancelled')
    expect(cancelledCfg.label).toBe('Cancelled')

    const unmarkedCfg = getAttendanceStatusConfig('unmarked')
    expect(unmarkedCfg.label).toBe('Unmarked')
  })
})
