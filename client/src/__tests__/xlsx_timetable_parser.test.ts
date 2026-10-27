import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { 
  parseCollegeTimetableWorkbook, 
  extractDateFromCell, 
  parseTimeRange 
} from '../services/xlsxTimetableParser'

describe('SprintOS — College Timetable XLSX Parser & Strict Cohort Isolation', () => {

  describe('1. Date & Time Extraction', () => {
    it('extracts date from college header format "26/10/2026 (Monday)"', () => {
      const res = extractDateFromCell('26/10/2026 (Monday)')
      expect(res.dateStr).toBe('2026-10-26')
      expect(res.dayName).toBe('Monday')
    })

    it('extracts date from YYYY-MM-DD or DD-MM-YYYY format', () => {
      const res1 = extractDateFromCell('2026-10-27 (Tuesday)')
      expect(res1.dateStr).toBe('2026-10-27')

      const res2 = extractDateFromCell('28-10-2026')
      expect(res2.dateStr).toBe('2026-10-28')
    })

    it('parses standard morning slot "09:00 AM - 10:00 AM"', () => {
      const parsed = parseTimeRange('09:00 AM - 10:00 AM')
      expect(parsed).not.toBeNull()
      expect(parsed?.startTime).toBe('09:00')
      expect(parsed?.endTime).toBe('10:00')
      expect(parsed?.durationMinutes).toBe(60)
    })

    it('parses afternoon 40-minute slot "12:20 PM - 1:00 PM"', () => {
      const parsed = parseTimeRange('12:20 PM - 1:00 PM')
      expect(parsed).not.toBeNull()
      expect(parsed?.startTime).toBe('12:20')
      expect(parsed?.endTime).toBe('13:00')
      expect(parsed?.durationMinutes).toBe(40)
    })

    it('parses evening slot "04:20 PM - 05:20 PM"', () => {
      const parsed = parseTimeRange('04:20 PM - 05:20 PM')
      expect(parsed).not.toBeNull()
      expect(parsed?.startTime).toBe('16:20')
      expect(parsed?.endTime).toBe('17:20')
      expect(parsed?.durationMinutes).toBe(60)
    })
  })

  describe('2. Strict Cohort Isolation: Elon Musk 2024 Only', () => {
    // Helper to generate a mock workbook matching the college's exact multi-cohort structure
    function createMockCollegeWorkbook(sheets: {
      sheetName: string
      dateText: string
      cohortA_header: string // e.g. "Elon Musk 2024"
      cohortB_header: string // e.g. "Jensen Huang 2024"
      slots: {
        time: string
        subA: string
        facA: string
        roomA: string
        subB: string
        facB: string
        roomB: string
      }[]
    }[]): XLSX.WorkBook {
      const wb = XLSX.utils.book_new()

      sheets.forEach(s => {
        const data: (string | number)[][] = [
          ['ITM SKILLS UNIVERSITY- SCHOOL OF FUTURETECH, KHARGHAR'],
          ['SEMESTER - 5'],
          ['BTECH BATCH 2024 - 28'],
          [s.dateText],
          ['Timing', s.cohortA_header, s.cohortB_header]
        ]

        s.slots.forEach(slot => {
          data.push([slot.time, slot.subA, slot.subB])
          data.push(['Faculty', slot.facA, slot.facB])
          data.push(['Classroom No', slot.roomA, slot.roomB])
        })

        const ws = XLSX.utils.aoa_to_sheet(data)
        XLSX.utils.book_append_sheet(wb, ws, s.sheetName)
      })

      return wb
    }

    it('identifies Elon Musk 2024 column dynamically and completely excludes Jensen Huang data', () => {
      const mockWb = createMockCollegeWorkbook([
        {
          sheetName: 'Monday',
          dateText: '26/10/2026 (Monday)',
          cohortA_header: 'Elon Musk 2024',
          cohortB_header: 'Jensen Huang 2024',
          slots: [
            {
              time: '09:00 AM - 10:00 AM',
              subA: 'Data Structures & Algorithm - III',
              facA: 'Sanjay Sahu (VF)',
              roomA: 'Classroom No. - 20',
              subB: 'Advanced Database Systems',
              facB: 'Mr. Kushal (VF)',
              roomB: 'Classroom No. - 37'
            },
            {
              time: '01:00 PM - 02:00 PM',
              subA: 'LUNCH BREAK',
              facA: '',
              roomA: '',
              subB: 'LUNCH BREAK',
              facB: '',
              roomB: ''
            },
            {
              time: '03:20 PM - 04:20 PM',
              subA: 'Venture & Product Strategy',
              facA: 'Mr. Vivekanand Jha',
              roomA: 'Classroom No. - 20',
              subB: 'Software Testing & Quality Assurance',
              facB: 'Mr. Zahir Mulani',
              roomB: 'Classroom No. - 37'
            }
          ]
        }
      ])

      const result = parseCollegeTimetableWorkbook(mockWb, 'Elon Musk 2024')

      expect(result.success).toBe(true)
      expect(result.cohortName).toBe('Elon Musk 2024')
      expect(result.otherCohortsFound).toContain('Jensen Huang 2024')
      expect(result.detectedDates).toEqual(['2026-10-26'])
      expect(result.totalEntries).toBe(3)
      expect(result.lectureCount).toBe(2)
      expect(result.breakCount).toBe(1)

      // PROVE EXCLUSION: None of Jensen Huang's faculty or subjects exist in the parsed entries
      const allFaculty = result.entries.map(e => e.faculty).filter(Boolean)
      expect(allFaculty).toContain('Sanjay Sahu (VF)')
      expect(allFaculty).toContain('Mr. Vivekanand Jha')
      expect(allFaculty).not.toContain('Mr. Kushal (VF)')
      expect(allFaculty).not.toContain('Mr. Zahir Mulani')

      const allRooms = result.entries.map(e => e.classroom).filter(Boolean)
      expect(allRooms).toEqual(['Classroom No. - 20', 'Classroom No. - 20'])
      expect(allRooms).not.toContain('Classroom No. - 37')

      const allNotes = result.entries.map(e => e.notes)
      expect(allNotes).not.toContain('Advanced Database Systems')
      expect(allNotes).not.toContain('Software Testing & Quality Assurance')
    })

    it('works when Elon Musk 2024 is NOT in column B (dynamic column position)', () => {
      // Swapping cohort columns: Jensen Huang is in Col B, Elon Musk is in Col C
      const mockWb = createMockCollegeWorkbook([
        {
          sheetName: 'Tuesday',
          dateText: '27/10/2026 (Tuesday)',
          cohortA_header: 'Jensen Huang 2024',
          cohortB_header: 'Elon Musk 2024',
          slots: [
            {
              time: '02:10 PM - 03:10 PM',
              subA: 'Other Subject',
              facA: 'Other Faculty',
              roomA: 'Room 99',
              subB: 'LLMs, RAG & Agentic AI',
              facB: 'Dr. Dipanjan',
              roomB: 'Classroom No. - 20'
            }
          ]
        }
      ])

      const result = parseCollegeTimetableWorkbook(mockWb, 'Elon Musk 2024')
      expect(result.success).toBe(true)
      expect(result.entries.length).toBe(1)
      expect(result.entries[0].faculty).toBe('Dr. Dipanjan')
      expect(result.entries[0].classroom).toBe('Classroom No. - 20')
      expect(result.entries[0].notes).toBe('LLMs, RAG & Agentic AI')
      expect(result.entries[0].faculty).not.toBe('Other Faculty')
    })

    it('halts with error if expected cohort header is missing from a sheet', () => {
      const mockWb = createMockCollegeWorkbook([
        {
          sheetName: 'Wednesday',
          dateText: '28/10/2026 (Wednesday)',
          cohortA_header: 'Jensen Huang 2024',
          cohortB_header: 'Mark Zuckerberg 2024',
          slots: [
            {
              time: '09:00 AM - 10:00 AM',
              subA: 'Class A',
              facA: 'Prof A',
              roomA: 'Room A',
              subB: 'Class B',
              facB: 'Prof B',
              roomB: 'Room B'
            }
          ]
        }
      ])

      const result = parseCollegeTimetableWorkbook(mockWb, 'Elon Musk 2024')
      expect(result.success).toBe(false)
      expect(result.error).toContain("Cohort 'Elon Musk 2024' header was NOT found")
      expect(result.entries.length).toBe(0)
    })

    it('halts with error if cohort header is duplicated or ambiguous', () => {
      const mockWb = createMockCollegeWorkbook([
        {
          sheetName: 'Thursday',
          dateText: '29/10/2026 (Thursday)',
          cohortA_header: 'Elon Musk 2024',
          cohortB_header: 'Elon Musk 2024 (Duplicate)',
          slots: [
            {
              time: '09:00 AM - 10:00 AM',
              subA: 'DSA-3',
              facA: 'Sanjay Sahu',
              roomA: 'Room 20',
              subB: 'DSA-3 Alt',
              facB: 'Sanjay Sahu',
              roomB: 'Room 21'
            }
          ]
        }
      ])

      const result = parseCollegeTimetableWorkbook(mockWb, 'Elon Musk 2024')
      expect(result.success).toBe(false)
      expect(result.error).toContain("Multiple columns matched cohort 'Elon Musk 2024'")
      expect(result.entries.length).toBe(0)
    })

    it('flags overlaps when a slot timing conflicts with an adjacent slot', () => {
      const mockWb = createMockCollegeWorkbook([
        {
          sheetName: 'Wednesday',
          dateText: '28/10/2026 (Wednesday)',
          cohortA_header: 'Elon Musk 2024',
          cohortB_header: 'Jensen Huang 2024',
          slots: [
            {
              time: '12:20 PM - 1:20 PM', // Ends at 13:20
              subA: 'Data Structures & Algorithm - III',
              facA: 'Sanjay Sahu (VF)',
              roomA: 'Classroom No. - 20',
              subB: 'DSA-3',
              facB: 'Mr. Kushal',
              roomB: 'Room 37'
            },
            {
              time: '01:00 PM - 02:00 PM', // Starts at 13:00 -> 20 min overlap!
              subA: 'LUNCH BREAK',
              facA: '',
              roomA: '',
              subB: 'LUNCH BREAK',
              facB: '',
              roomB: ''
            }
          ]
        }
      ])

      const result = parseCollegeTimetableWorkbook(mockWb, 'Elon Musk 2024')
      expect(result.success).toBe(true)
      expect(result.entries[0].hasConflictWarning).toBe(true)
      expect(result.entries[0].conflictDetails).toContain('Overlaps with next slot')
      expect(result.entries[1].hasConflictWarning).toBe(true)
    })
  })
})
