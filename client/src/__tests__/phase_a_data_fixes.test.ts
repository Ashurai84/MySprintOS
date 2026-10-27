import { describe, it, expect } from 'vitest'
import { 
  normalizeTimeTo24H, 
  formatTimeRangeTo12H, 
  validateTimes, 
  calculateDurationFromTimes,
  sanitizeTimetableEntries
} from '../utils/timetableUtils'
import { 
  resolveFacultyName, 
  resolveFacultyId, 
  FACULTY_ROSTER 
} from '../data/facultyData'
import { calculateSubjectAttendance } from '../utils/attendanceCalculator'
import type { Lecture, TimetableEntry } from '../types'

describe('Phase A — Audit & Data Bug Fixes', () => {
  describe('1. Time Bug & Validation', () => {
    it('normalizes morning 09:00 and 10:00 without rolling over to 22:00 (10:00 PM)', () => {
      const start = normalizeTimeTo24H('09:00')
      const end = normalizeTimeTo24H('10:00', start)
      expect(start).toBe('09:00')
      expect(end).toBe('10:00') // Must be 10:00 AM, never 22:00
    })

    it('formats 09:00 to 10:00 as 9:00 AM – 10:00 AM (NOT 10:00 PM)', () => {
      const formatted = formatTimeRangeTo12H('09:00', '10:00')
      expect(formatted).toBe('9:00 AM – 10:00 AM')
      expect(formatted).not.toContain('PM')
    })

    it('enforces end > start validation and computes duration from times', () => {
      const valid = validateTimes('09:00', '10:00')
      expect(valid.isValid).toBe(true)
      expect(valid.durationMinutes).toBe(60)

      const invalid = validateTimes('11:00', '10:00')
      expect(invalid.isValid).toBe(false)
      expect(invalid.error).toBe('End time must be after start time.')

      const invalidEqual = validateTimes('10:00', '10:00')
      expect(invalidEqual.isValid).toBe(false)
    })

    it('correctly calculates duration between start and end times', () => {
      expect(calculateDurationFromTimes('09:00', '10:00')).toBe(60)
      expect(calculateDurationFromTimes('10:00', '11:30')).toBe(90)
      expect(calculateDurationFromTimes('11:10', '12:10')).toBe(60)
    })
  })

  describe('2. Faculty Inconsistency & Single Source of Truth', () => {
    it('contains all 6 verified faculty members in the canonical roster', () => {
      expect(FACULTY_ROSTER.length).toBe(6)
      const dsaFaculty = FACULTY_ROSTER.find(f => f.defaultSubjectId === 'S5-CS01')
      const aiFaculty = FACULTY_ROSTER.find(f => f.defaultSubjectId === 'S5-AI01')

      expect(dsaFaculty?.name).toBe('Sanjay Sahu (VF)')
      expect(aiFaculty?.name).toBe('Dr. Dipanjan Biswas')
    })

    it('enforces Dr. Dipanjan Biswas for S5-AI01 even if legacy free-text says Sanjay Sahu', () => {
      const faculty = resolveFacultyName(undefined, 'S5-AI01', 'prof. Sanjay Sahu')
      expect(faculty).toBe('Dr. Dipanjan Biswas')
    })

    it('enforces Sanjay Sahu (VF) for S5-CS01 even if legacy free-text says Kunal Suri', () => {
      const faculty = resolveFacultyName(undefined, 'S5-CS01', 'Mr. Kunal Suri')
      expect(faculty).toBe('Sanjay Sahu (VF)')
    })

    it('resolves correct facultyId for each subject', () => {
      expect(resolveFacultyId('S5-CS01')).toBe('fac-sanjay')
      expect(resolveFacultyId('S5-AI01')).toBe('fac-dipanjan')
      expect(resolveFacultyId('S5-SE01')).toBe('fac-muskan')
      expect(resolveFacultyId('S5-MG01')).toBe('fac-vivekanand')
      expect(resolveFacultyId('S5-DS01')).toBe('fac-shreya')
      expect(resolveFacultyId('S5-SS01')).toBe('fac-amaan')
    })

    it('sanitizes timetable entries so S5-AI01 blocks always use Dr. Dipanjan Biswas', () => {
      const corruptedEntries: TimetableEntry[] = [
        {
          id: 'test-tt-1',
          dayOfWeek: 3,
          specificDate: '2026-10-21',
          startTime: '11:10',
          endTime: '12:10',
          durationMinutes: 60,
          slotType: 'lecture',
          subjectId: 'S5-AI01',
          faculty: 'prof . Sanjay Sahu (VF)', // erroneous copy-paste
          classroom: 'Classroom 37'
        }
      ]

      const sanitized = sanitizeTimetableEntries(corruptedEntries)
      expect(sanitized[0].faculty).toMatch(/Dr\. Dipanjan/)
      expect((sanitized[0] as any).facultyId).toBe('fac-dipanjan')
    })
  })

  describe('3. Misleading Logged Entry (Independent Study / Unassigned)', () => {
    it('strictly excludes independent study / unassigned slots from subject attendance calculation', () => {
      const sampleLectures: Lecture[] = [
        {
          id: 'lec-1',
          date: '2026-10-22',
          subjectId: 'S5-CS01',
          title: 'Strongly Connected Components (SCC) Overview',
          status: 'attended',
          durationMinutes: 60,
          createdAt: '2026-10-22T10:00:00Z',
          updatedAt: '2026-10-22T10:00:00Z'
        },
        // Misleading slot erroneously logged with DSA-3 subjectId
        {
          id: 'lec-unassigned',
          date: '2026-10-23',
          subjectId: 'S5-CS01',
          title: 'Independent Study / Unassigned Slot',
          status: 'attended',
          durationMinutes: 60,
          createdAt: '2026-10-23T09:00:00Z',
          updatedAt: '2026-10-23T09:00:00Z'
        }
      ]

      const stats = calculateSubjectAttendance('S5-CS01', sampleLectures, 45, 75)
      // Only 1 real lecture should be counted, NOT 2!
      expect(stats.attended).toBe(1)
      expect(stats.totalHeld).toBe(1)
    })
  })

  describe('4. Clean Single-Calendar-Day Navigation', () => {
    it('shifts selected date by exactly one calendar day without timezone offset drift', () => {
      const shiftDate = (dateStr: string, days: number): string => {
        const [y, m, d] = dateStr.split('-').map(Number)
        const dt = new Date(y, m - 1, d)
        dt.setDate(dt.getDate() + days)
        const nextY = dt.getFullYear()
        const nextM = String(dt.getMonth() + 1).padStart(2, '0')
        const nextD = String(dt.getDate()).padStart(2, '0')
        return `${nextY}-${nextM}-${nextD}`
      }

      expect(shiftDate('2026-10-25', 1)).toBe('2026-10-26')
      expect(shiftDate('2026-10-25', -1)).toBe('2026-10-24')
      expect(shiftDate('2026-10-31', 1)).toBe('2026-11-01')
      expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28')
    })
  })
})

