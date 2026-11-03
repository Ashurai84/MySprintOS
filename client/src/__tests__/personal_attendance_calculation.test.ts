import { describe, it, expect } from 'vitest'
import {
  calculateSubjectAttendance,
  calculateOverallAttendance,
  formatAttendancePercentage
} from '../utils/attendanceCalculator'
import { initialLectures, initialSubjects } from '../data/defaultData'
import type { Lecture, AttendanceStatus } from '../types'

describe('Personal Attendance Calculation Regression Tests (SprintOS Critical Fix)', () => {
  // Helper to create synthetic lecture test fixtures
  const makeLecture = (
    id: string,
    subjectId: string,
    status?: Lecture['status'],
    date: string = '2026-10-15',
    startTime?: string
  ): Lecture => ({
    id,
    subjectId,
    title: `Lecture ${id}`,
    date,
    startTime: startTime || '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    status: (status as AttendanceStatus) || ('unmarked' as any),
    faculty: 'Sanjay Sahu (VF)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  // Test 1: 40 Present + 5 Absent = 45 Held and 88.89%
  it('1. 40 Present + 5 Absent = 45 Held and 88.89%', () => {
    const lectures: Lecture[] = []
    for (let i = 1; i <= 40; i++) {
      lectures.push(makeLecture(`dsa-p-${i}`, 'S5-CS01', 'attended', `2026-08-${String(i).padStart(2, '0')}`, '09:00'))
    }
    for (let i = 1; i <= 5; i++) {
      lectures.push(makeLecture(`dsa-a-${i}`, 'S5-CS01', 'absent', `2026-09-${String(i).padStart(2, '0')}`, '09:00'))
    }

    const stats = calculateSubjectAttendance('S5-CS01', lectures, 45, 75, 2)
    expect(stats.totalHeld).toBe(45)
    expect(stats.attended).toBe(40)
    expect(stats.absent).toBe(5)
    expect(stats.percentage).toBe(88.89)
    expect(stats.rawPercentage).toBeCloseTo(88.88888888888889, 5)
    expect(formatAttendancePercentage(stats.rawPercentage, 2)).toBe('88.89%')
  })

  // Test 2: 45 Present + 0 Absent = 100%
  it('2. 45 Present + 0 Absent = 100%', () => {
    const lectures: Lecture[] = []
    for (let i = 1; i <= 45; i++) {
      lectures.push(makeLecture(`dsa-p-${i}`, 'S5-CS01', 'attended', `2026-08-${String(i).padStart(2, '0')}`, '10:00'))
    }

    const stats = calculateSubjectAttendance('S5-CS01', lectures, 45, 75, 2)
    expect(stats.totalHeld).toBe(45)
    expect(stats.attended).toBe(45)
    expect(stats.absent).toBe(0)
    expect(stats.percentage).toBe(100)
    expect(stats.rawPercentage).toBe(100)
  })

  // Test 3: 40 Present + 0 Absent + 5 scheduled = 100% of 40 held lectures
  it('3. 40 Present + 0 Absent + 5 scheduled = 100% of 40 held lectures', () => {
    const lectures: Lecture[] = []
    for (let i = 1; i <= 40; i++) {
      lectures.push(makeLecture(`dsa-p-${i}`, 'S5-CS01', 'attended', `2026-08-${String(i).padStart(2, '0')}`, '10:00'))
    }
    for (let i = 1; i <= 5; i++) {
      lectures.push(makeLecture(`dsa-s-${i}`, 'S5-CS01', 'scheduled', `2026-11-${String(i).padStart(2, '0')}`, '10:00'))
    }

    const stats = calculateSubjectAttendance('S5-CS01', lectures, 45, 75, 2)
    expect(stats.totalHeld).toBe(40)
    expect(stats.attended).toBe(40)
    expect(stats.absent).toBe(0)
    expect(stats.scheduled).toBe(5)
    expect(stats.percentage).toBe(100)
  })

  // Test 4: Scheduled and unmarked lectures do not enter the denominator
  it('4. Scheduled and unmarked lectures do not enter the denominator', () => {
    const lectures: Lecture[] = [
      ...Array.from({ length: 10 }, (_, i) => makeLecture(`p-${i}`, 'S5-CS01', 'attended', `2026-08-${i + 1}`)),
      ...Array.from({ length: 2 }, (_, i) => makeLecture(`a-${i}`, 'S5-CS01', 'absent', `2026-09-${i + 1}`)),
      ...Array.from({ length: 8 }, (_, i) => makeLecture(`s-${i}`, 'S5-CS01', 'scheduled', `2026-10-${i + 1}`)),
      ...Array.from({ length: 4 }, (_, i) => makeLecture(`u-${i}`, 'S5-CS01', undefined, `2026-11-${i + 1}`))
    ]

    const stats = calculateSubjectAttendance('S5-CS01', lectures, 45, 75, 1)
    // Only 10 attended + 2 absent = 12 held
    expect(stats.totalHeld).toBe(12)
    expect(stats.attended).toBe(10)
    expect(stats.absent).toBe(2)
    expect(stats.scheduled).toBe(8)
    expect(stats.unmarked).toBe(4)
    expect(stats.percentage).toBe(83.3)
  })

  // Test 5: Cancelled lectures do not enter the denominator
  it('5. Cancelled lectures do not enter the denominator', () => {
    const lectures: Lecture[] = [
      ...Array.from({ length: 15 }, (_, i) => makeLecture(`p-${i}`, 'S5-CS01', 'attended', `2026-08-${i + 1}`)),
      ...Array.from({ length: 5 }, (_, i) => makeLecture(`a-${i}`, 'S5-CS01', 'absent', `2026-09-${i + 1}`)),
      ...Array.from({ length: 7 }, (_, i) => makeLecture(`c-${i}`, 'S5-CS01', 'cancelled', `2026-10-${i + 1}`))
    ]

    const stats = calculateSubjectAttendance('S5-CS01', lectures, 45, 75, 1)
    expect(stats.totalHeld).toBe(20)
    expect(stats.attended).toBe(15)
    expect(stats.absent).toBe(5)
    expect(stats.cancelled).toBe(7)
    expect(stats.percentage).toBe(75)
  })

  // Test 6: Duplicate attendance records do not inflate counts
  it('6. Duplicate attendance records do not inflate counts', () => {
    const lectures: Lecture[] = [
      makeLecture('lec-1', 'S5-CS01', 'attended', '2026-10-01', '10:00'),
      // Duplicate by ID
      makeLecture('lec-1', 'S5-CS01', 'attended', '2026-10-01', '10:00'),
      // Duplicate by Slot (different ID, same subject + date + time)
      makeLecture('lec-dup-slot', 'S5-CS01', 'attended', '2026-10-01', '10:00'),
      // Distinct legitimate second session on same date at different time
      makeLecture('lec-2', 'S5-CS01', 'absent', '2026-10-01', '14:00')
    ]

    const stats = calculateSubjectAttendance('S5-CS01', lectures, 45, 75, 1)
    expect(stats.totalHeld).toBe(2)
    expect(stats.attended).toBe(1)
    expect(stats.absent).toBe(1)
    expect(stats.percentage).toBe(50)
  })

  // Test 7: Marking a lecture Present twice does not double-count it
  it('7. Marking a lecture Present twice does not double-count it', () => {
    const originalLecture = makeLecture('lec-single', 'S5-CS01', 'attended', '2026-10-05', '11:00')
    const doubleMarked = [
      originalLecture,
      { ...originalLecture, id: 'lec-single-dupe', updatedAt: new Date().toISOString() }
    ]

    const stats = calculateSubjectAttendance('S5-CS01', doubleMarked, 45, 75, 1)
    expect(stats.totalHeld).toBe(1)
    expect(stats.attended).toBe(1)
    expect(stats.percentage).toBe(100)
  })

  // Test 8: Changing Present to Absent updates the numerator and percentage correctly
  it('8. Changing Present to Absent updates the numerator and percentage correctly', () => {
    const lectures: Lecture[] = []
    for (let i = 1; i <= 40; i++) {
      lectures.push(makeLecture(`dsa-${i}`, 'S5-CS01', 'attended', `2026-08-${String(i).padStart(2, '0')}`, '09:00'))
    }
    for (let i = 41; i <= 45; i++) {
      lectures.push(makeLecture(`dsa-${i}`, 'S5-CS01', 'absent', `2026-09-${String(i - 40).padStart(2, '0')}`, '09:00'))
    }

    const beforeStats = calculateSubjectAttendance('S5-CS01', lectures, 45, 75, 2)
    expect(beforeStats.attended).toBe(40)
    expect(beforeStats.absent).toBe(5)
    expect(beforeStats.totalHeld).toBe(45)
    expect(beforeStats.percentage).toBe(88.89)

    // User marks lecture 40 as Absent instead of Attended
    const updatedLectures = lectures.map(l =>
      l.id === 'dsa-40' ? { ...l, status: 'absent' as const } : l
    )

    const afterStats = calculateSubjectAttendance('S5-CS01', updatedLectures, 45, 75, 2)
    expect(afterStats.attended).toBe(39)
    expect(afterStats.absent).toBe(6)
    expect(afterStats.totalHeld).toBe(45)
    expect(afterStats.percentage).toBe(86.67)
  })

  // Test 9: Dashboard, Attendance, and My Lectures display consistent figures
  it('9. Dashboard, Attendance, and My Lectures display consistent figures', () => {
    const statsCS01 = calculateSubjectAttendance('S5-CS01', [
      makeLecture('cs-1', 'S5-CS01', 'attended', '2026-10-01', '10:00'),
      makeLecture('cs-2', 'S5-CS01', 'absent', '2026-10-02', '10:00')
    ])
    const statsAI01 = calculateSubjectAttendance('S5-AI01', [
      makeLecture('ai-1', 'S5-AI01', 'attended', '2026-10-01', '11:00')
    ])
    const statsSE01 = calculateSubjectAttendance('S5-SE01', []) // 0 held

    const overall = calculateOverallAttendance([statsCS01, statsAI01, statsSE01])

    expect(overall.totalHeld).toBe(statsCS01.totalHeld + statsAI01.totalHeld + statsSE01.totalHeld)
    expect(overall.totalAttended).toBe(statsCS01.attended + statsAI01.attended + statsSE01.attended)
    expect(overall.totalAbsent).toBe(statsCS01.absent + statsAI01.absent + statsSE01.absent)
    expect(overall.totalHeld).toBe(3)
    expect(overall.totalAttended).toBe(2)
    expect(overall.totalAbsent).toBe(1)
    expect(overall.percentage).toBe(66.7)
  })

  // Test 10: Existing timetable and historical baseline data preserved
  it('10. Preserves verified historical baseline lectures without data corruption', () => {
    // Verified 7 baseline lectures must remain intact
    expect(initialLectures.length).toBe(7)
    const dsaLectures = initialLectures.filter(l => l.subjectId === 'S5-CS01')
    expect(dsaLectures.length).toBe(3)
    expect(dsaLectures.every(l => l.status === 'attended')).toBe(true)

    const subjects = initialSubjects
    expect(subjects.length).toBe(6)
    const dsa = subjects.find(s => s.id === 'S5-CS01')
    expect(dsa?.totalHours).toBe(45)
    expect(dsa?.faculty).toBe('Sanjay Sahu (VF)')
  })
})
