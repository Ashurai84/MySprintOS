import { describe, it, expect } from 'vitest'
import { 
  ALL_WEEK_DAYS, 
  getKolkataDateString, 
  getDayOfWeekFromDate, 
  getEntriesForDate, 
  detectTimetableConflicts, 
  calculateDurationFromTimes, 
  formatDuration,
  formatTimeTo12H,
  formatTimeRangeTo12H 
} from '../utils/timetableUtils'
import { initialTimetableEntries } from '../data/defaultData'
import type { TimetableEntry } from '../types'

describe('Timetable 7-Weekday Support & Navigation (SprintOS)', () => {
  
  // 1. All seven weekdays support
  it('supports all seven weekdays from Monday to Sunday with correct day numbers', () => {
    expect(ALL_WEEK_DAYS.length).toBe(7)
    
    const dayNames = ALL_WEEK_DAYS.map(d => d.name)
    expect(dayNames).toEqual([
      'Monday', 
      'Tuesday', 
      'Wednesday', 
      'Thursday', 
      'Friday', 
      'Saturday', 
      'Sunday'
    ])

    const dayNumbers = ALL_WEEK_DAYS.map(d => d.dayNum)
    expect(dayNumbers).toEqual([1, 2, 3, 4, 5, 6, 0])
  })

  // 2. Asia/Kolkata timezone current date defaulting
  it('returns valid YYYY-MM-DD string adhering to Asia/Kolkata timezone', () => {
    const kolkataDateStr = getKolkataDateString()
    expect(kolkataDateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    // Verify against explicit Intl output
    const expected = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date())

    expect(kolkataDateStr).toBe(expected)
  })

  // 3. Date parsing and navigation without timezone drift
  it('safely parses day of week for any date string without timezone drift', () => {
    // 2026-10-19 is Monday (1)
    expect(getDayOfWeekFromDate('2026-10-19')).toBe(1)
    // 2026-10-20 is Tuesday (2)
    expect(getDayOfWeekFromDate('2026-10-20')).toBe(2)
    // 2026-10-21 is Wednesday (3)
    expect(getDayOfWeekFromDate('2026-10-21')).toBe(3)
    // 2026-10-22 is Thursday (4)
    expect(getDayOfWeekFromDate('2026-10-22')).toBe(4)
    // 2026-10-23 is Friday (5)
    expect(getDayOfWeekFromDate('2026-10-23')).toBe(5)
    // 2026-10-24 is Saturday (6)
    expect(getDayOfWeekFromDate('2026-10-24')).toBe(6)
    // 2026-10-25 is Sunday (0)
    expect(getDayOfWeekFromDate('2026-10-25')).toBe(0)
  })

  // 4. Preservation of historical Thursday & Friday entries
  it('preserves existing historical Thursday and Friday timetable entries intact', () => {
    const thuSlots = getEntriesForDate(initialTimetableEntries, '2026-10-22')
    expect(thuSlots.length).toBe(7)
    expect(thuSlots[0].subjectId).toBe('S5-CS01')
    expect(thuSlots[0].faculty).toBe('Sanjay Sahu (VF)')
    expect(thuSlots[2].slotType).toBe('lunch_break')
    expect(thuSlots[2].durationMinutes).toBe(40)

    const friSlots = getEntriesForDate(initialTimetableEntries, '2026-10-23')
    expect(friSlots.length).toBe(7)
    expect(friSlots[0].slotType).toBe('unassigned')
    expect(friSlots[1].subjectId).toBe('S5-CS01')
    expect(friSlots[1].faculty).toBe('Sanjay Sahu (VF)')
    expect(friSlots[3].slotType).toBe('lunch_break')
  })

  // 5. Empty days handling
  it('returns empty array for unscheduled dates and allows custom schedule blocks', () => {
    // A Sunday with no historical or recurring entries
    const sundaySlots = getEntriesForDate(initialTimetableEntries, '2026-10-25')
    expect(sundaySlots).toEqual([])

    // A Tuesday with no entries
    const tuesdaySlots = getEntriesForDate(initialTimetableEntries, '2026-10-20')
    expect(tuesdaySlots).toEqual([])
  })

  // 6. Independent recurring schedule configuration on any weekday
  it('allows recurring timetable entries to be configured independently for any weekday', () => {
    const customEntries: TimetableEntry[] = [
      {
        id: 'tt-mon-rec',
        dayOfWeek: 1, // Monday recurring
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        slotType: 'lecture',
        subjectId: 'S5-SE01',
        faculty: 'Dr. Software',
        classroom: 'Room 101'
      },
      {
        id: 'tt-sun-rec',
        dayOfWeek: 0, // Sunday recurring
        startTime: '10:00',
        endTime: '12:00',
        durationMinutes: 120,
        slotType: 'lecture',
        subjectId: 'S5-CS01',
        faculty: 'Sanjay Sahu (VF)',
        classroom: 'Lab 2'
      }
    ]

    // Monday 2026-10-19 should resolve the recurring Monday entry
    const monSlots = getEntriesForDate(customEntries, '2026-10-19')
    expect(monSlots.length).toBe(1)
    expect(monSlots[0].id).toBe('tt-mon-rec')
    expect(monSlots[0].subjectId).toBe('S5-SE01')

    // Sunday 2026-10-25 should resolve the recurring Sunday entry
    const sunSlots = getEntriesForDate(customEntries, '2026-10-25')
    expect(sunSlots.length).toBe(1)
    expect(sunSlots[0].id).toBe('tt-sun-rec')
    expect(sunSlots[0].durationMinutes).toBe(120)

    // Wednesday 2026-10-21 has no entries
    expect(getEntriesForDate(customEntries, '2026-10-21')).toEqual([])
  })

  // 7. Separation of date-specific vs recurring entries
  it('prioritizes date-specific entries while allowing non-overlapping recurring entries', () => {
    const entries: TimetableEntry[] = [
      {
        id: 'rec-1',
        dayOfWeek: 1, // Monday recurring
        startTime: '10:00',
        endTime: '11:00',
        durationMinutes: 60,
        slotType: 'lecture',
        subjectId: 'S5-CS01'
      },
      {
        id: 'rec-2',
        dayOfWeek: 1, // Monday recurring
        startTime: '14:00',
        endTime: '15:00',
        durationMinutes: 60,
        slotType: 'lecture',
        subjectId: 'S5-AI01'
      },
      {
        id: 'spec-override',
        dayOfWeek: 1,
        specificDate: '2026-10-26', // One-off substitute on this specific Monday
        startTime: '10:00',
        endTime: '11:00',
        durationMinutes: 60,
        slotType: 'lecture',
        subjectId: 'S5-SS01',
        faculty: 'Prof. Amaan'
      }
    ]

    const slotsOnOct26 = getEntriesForDate(entries, '2026-10-26')
    expect(slotsOnOct26.length).toBe(2)
    // The 10:00 slot is the specific override (S5-SS01)
    expect(slotsOnOct26[0].id).toBe('spec-override')
    expect(slotsOnOct26[0].subjectId).toBe('S5-SS01')
    // The non-overlapping 14:00 recurring slot remains intact
    expect(slotsOnOct26[1].id).toBe('rec-2')

    // On a different Monday (2026-11-02), standard recurring slots apply
    const slotsOnNov02 = getEntriesForDate(entries, '2026-11-02')
    expect(slotsOnNov02.length).toBe(2)
    expect(slotsOnNov02[0].id).toBe('rec-1')
    expect(slotsOnNov02[1].id).toBe('rec-2')
  })

  // 8. Audited Conflict Detection on specific dates
  it('reports zero conflicts for the verified Thursday and Friday historical timetables', () => {
    const thuConflicts = detectTimetableConflicts(initialTimetableEntries, '2026-10-22')
    expect(thuConflicts).toEqual([])

    const friConflicts = detectTimetableConflicts(initialTimetableEntries, '2026-10-23')
    expect(friConflicts).toEqual([])
  })

  it('detects genuine overlapping blocks on the selected date without hiding conflicts', () => {
    const conflictingEntries: TimetableEntry[] = [
      {
        id: 'c-1',
        dayOfWeek: 2, // Tuesday
        specificDate: '2026-10-20',
        startTime: '10:00',
        endTime: '11:30',
        durationMinutes: 90,
        slotType: 'lecture',
        subjectId: 'S5-CS01'
      },
      {
        id: 'c-2',
        dayOfWeek: 2,
        specificDate: '2026-10-20',
        startTime: '11:00', // 30-min overlap
        endTime: '12:00',
        durationMinutes: 60,
        slotType: 'lecture',
        subjectId: 'S5-AI01'
      },
      {
        id: 'c-3-clean',
        dayOfWeek: 2,
        specificDate: '2026-10-20',
        startTime: '13:00',
        endTime: '14:00',
        durationMinutes: 60,
        slotType: 'lecture',
        subjectId: 'S5-MG01'
      }
    ]

    const conflicts = detectTimetableConflicts(conflictingEntries, '2026-10-20')
    expect(conflicts.length).toBe(1)
    expect(conflicts[0].entryId1).toBe('c-1')
    expect(conflicts[0].entryId2).toBe('c-2')
    expect(conflicts[0].message).toContain('overlaps')

    // On a different date without conflicts, it reports 0
    const cleanDayConflicts = detectTimetableConflicts(conflictingEntries, '2026-10-21')
    expect(cleanDayConflicts).toEqual([])
  })

  // 9. Duration and break support across any weekday
  it('supports 40m lunch, 60m, 120m, and variable durations across all weekdays', () => {
    expect(calculateDurationFromTimes('12:20', '13:00')).toBe(40)
    expect(formatDuration(40)).toBe('40 mins')

    expect(calculateDurationFromTimes('10:00', '11:00')).toBe(60)
    expect(formatDuration(60)).toBe('60 mins (1 hr)')

    expect(calculateDurationFromTimes('10:00', '12:00')).toBe(120)
    expect(formatDuration(120)).toBe('120 mins (2 hrs)')

    expect(calculateDurationFromTimes('14:00', '15:30')).toBe(90)
    expect(formatDuration(90)).toBe('90 mins (1.5 hrs)')
  })

  // 10. 12-hour format conversion & range formatting
  it('accurately converts 24-hour times into 12-hour format with AM/PM', () => {
    expect(formatTimeTo12H('10:00')).toBe('10:00 AM')
    expect(formatTimeTo12H('11:10')).toBe('11:10 AM')
    expect(formatTimeTo12H('12:00')).toBe('12:00 PM')
    expect(formatTimeTo12H('12:20')).toBe('12:20 PM')
    expect(formatTimeTo12H('13:00')).toBe('1:00 PM')
    expect(formatTimeTo12H('14:10')).toBe('2:10 PM')
    expect(formatTimeTo12H('15:20')).toBe('3:20 PM')
    expect(formatTimeTo12H('16:00')).toBe('4:00 PM')
    expect(formatTimeTo12H('17:00')).toBe('5:00 PM')
    expect(formatTimeTo12H('09:00')).toBe('9:00 AM')
    expect(formatTimeTo12H('00:00')).toBe('12:00 AM')
    expect(formatTimeTo12H('00:30')).toBe('12:30 AM')
  })

  it('accurately formats start and end time ranges into 12-hour format', () => {
    expect(formatTimeRangeTo12H('10:00', '11:00')).toBe('10:00 AM – 11:00 AM')
    expect(formatTimeRangeTo12H('11:10', '12:10')).toBe('11:10 AM – 12:10 PM')
    expect(formatTimeRangeTo12H('12:20', '13:00')).toBe('12:20 PM – 1:00 PM')
    expect(formatTimeRangeTo12H('13:00', '14:00')).toBe('1:00 PM – 2:00 PM')
    expect(formatTimeRangeTo12H('14:10', '15:10')).toBe('2:10 PM – 3:10 PM')
    expect(formatTimeRangeTo12H('15:20', '16:20')).toBe('3:20 PM – 4:20 PM')
    expect(formatTimeRangeTo12H('16:00', '17:00')).toBe('4:00 PM – 5:00 PM')
  })
})
