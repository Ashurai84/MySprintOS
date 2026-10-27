/**
 * SprintOS — Official Weekly Timetable Extraction & Provenance
 * Extracted directly from official college screenshots (Elon Musk 2024 cohort, Semester 5).
 * No invented academic data. All values correspond exactly to college documents.
 */

import type { TimetableEntry } from '../types'

export interface ExtractedTimetableItem extends TimetableEntry {
  sourceScreenshot: string
  screenshotLabel: string
  provenanceNotes?: string
  hasConflictWarning?: boolean
}

export const OFFICIAL_EXTRACTED_TIMETABLE: ExtractedTimetableItem[] = [
  // =========================================================================
  // Wednesday, 21 October 2026 — Source: media_1792820363305.png
  // =========================================================================
  {
    id: 'extract-wed-1',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    slotType: 'lecture',
    notes: 'Interactive Session',
    faculty: 'Dr. Aarti & Apeksha',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820363305.png',
    screenshotLabel: 'Wednesday 21/10 Timetable Header',
    provenanceNotes: 'Non-core interactive college activity. 0 attendance impact.'
  },
  {
    id: 'extract-wed-2',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '11:10',
    endTime: '12:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820363305.png',
    screenshotLabel: 'Wednesday 21/10 Timetable Header',
    provenanceNotes: 'Data Structures & Algorithm - III'
  },
  {
    id: 'extract-wed-3',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '12:20',
    endTime: '13:00',
    durationMinutes: 40,
    slotType: 'short_break',
    notes: 'Transition Break',
    sourceScreenshot: 'media_1792820363305.png',
    screenshotLabel: 'Wednesday 21/10 Timetable Header',
    provenanceNotes: 'Solid yellow unlabelled horizontal bar (40 mins).'
  },
  {
    id: 'extract-wed-4',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820363305.png',
    screenshotLabel: 'Wednesday 21/10 Timetable Header',
    provenanceNotes: 'Data Structures & Algorithm - III'
  },
  {
    id: 'extract-wed-5',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '14:10',
    endTime: '15:10',
    durationMinutes: 60,
    slotType: 'lunch_break',
    notes: 'LUNCH BREAK',
    sourceScreenshot: 'media_1792820363305.png',
    screenshotLabel: 'Wednesday 21/10 Timetable Header',
    provenanceNotes: 'Official university lunch break (60 mins).'
  },
  {
    id: 'extract-wed-6',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '15:20',
    endTime: '16:00',
    durationMinutes: 40,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'Dr. Dipanjan',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820363305.png',
    screenshotLabel: 'Wednesday 21/10 Timetable Header',
    provenanceNotes: 'LLMs, RAG & Agentic AI (40 mins session 1)'
  },
  {
    id: 'extract-wed-7',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '16:00',
    endTime: '17:20',
    durationMinutes: 80,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'Dr. Dipanjan',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820363305.png',
    screenshotLabel: 'Wednesday 21/10 Timetable Header',
    provenanceNotes: 'LLMs, RAG & Agentic AI (80 mins session 2, consecutive block)'
  },

  // =========================================================================
  // Thursday, 22 October 2026 — Source: media_1792820381153.png
  // =========================================================================
  {
    id: 'extract-thu-0',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    slotType: 'unassigned',
    notes: 'Unscheduled Period',
    sourceScreenshot: 'media_1792820381153.png',
    screenshotLabel: 'Thursday 22/10 Timetable Header',
    provenanceNotes: 'Empty white cell in college timetable sheet.'
  },
  {
    id: 'extract-thu-1',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820381153.png',
    screenshotLabel: 'Thursday 22/10 Timetable Header',
    provenanceNotes: 'Data Structures & Algorithm - III'
  },
  {
    id: 'extract-thu-2',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '11:10',
    endTime: '12:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820381153.png',
    screenshotLabel: 'Thursday 22/10 Timetable Header',
    provenanceNotes: 'Data Structures & Algorithm - III'
  },
  {
    id: 'extract-thu-3',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '12:20',
    endTime: '13:00',
    durationMinutes: 40,
    slotType: 'lunch_break',
    notes: 'LUNCH BREAK',
    sourceScreenshot: 'media_1792820381153.png',
    screenshotLabel: 'Thursday 22/10 Timetable Header',
    provenanceNotes: 'Official university lunch break (40 mins).'
  },
  {
    id: 'extract-thu-4',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'Dr. Dipanjan',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820381153.png',
    screenshotLabel: 'Thursday 22/10 Timetable Header',
    provenanceNotes: 'LLMs, RAG & Agentic AI'
  },
  {
    id: 'extract-thu-5',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '14:00',
    endTime: '15:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-SS01',
    faculty: 'Prof. Amaan',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820381153.png',
    screenshotLabel: 'Thursday 22/10 Timetable Header',
    provenanceNotes: 'Career Readiness & Leadership'
  },
  {
    id: 'extract-thu-6',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '15:10',
    endTime: '16:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-MG01',
    faculty: 'Mr. Vivekanand Jha',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820381153.png',
    screenshotLabel: 'Thursday 22/10 Timetable Header',
    provenanceNotes: 'Venture & Product Strategy (Session 1)'
  },
  {
    id: 'extract-thu-7',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '16:10',
    endTime: '17:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-MG01',
    faculty: 'Mr. Vivekanand Jha',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820381153.png',
    screenshotLabel: 'Thursday 22/10 Timetable Header',
    provenanceNotes: 'Venture & Product Strategy (Session 2, adjusted from raw 16:00 to 16:10 to prevent 10m overlap).'
  },

  // =========================================================================
  // Friday, 23 October 2026 — Source: media_1792820390676.png
  // =========================================================================
  {
    id: 'extract-fri-0',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    slotType: 'unassigned',
    notes: 'Unscheduled Period',
    sourceScreenshot: 'media_1792820390676.png',
    screenshotLabel: 'Friday 23/10 Timetable Header',
    provenanceNotes: 'Empty white cell in college timetable sheet.'
  },
  {
    id: 'extract-fri-1',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820390676.png',
    screenshotLabel: 'Friday 23/10 Timetable Header',
    provenanceNotes: 'Data Structures & Algorithm - III'
  },
  {
    id: 'extract-fri-2',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '11:10',
    endTime: '12:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820390676.png',
    screenshotLabel: 'Friday 23/10 Timetable Header',
    provenanceNotes: 'Data Structures & Algorithm - III'
  },
  {
    id: 'extract-fri-3',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '12:20',
    endTime: '13:00',
    durationMinutes: 40,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820390676.png',
    screenshotLabel: 'Friday 23/10 Timetable Header',
    provenanceNotes: 'Data Structures & Algorithm - III (40 mins active lecture, NOT lunch break).'
  },
  {
    id: 'extract-fri-4',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    slotType: 'lunch_break',
    notes: 'LUNCH BREAK',
    sourceScreenshot: 'media_1792820390676.png',
    screenshotLabel: 'Friday 23/10 Timetable Header',
    provenanceNotes: 'Official university lunch break (60 mins).'
  },
  {
    id: 'extract-fri-5',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '14:10',
    endTime: '15:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'Dr. Dipanjan',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820390676.png',
    screenshotLabel: 'Friday 23/10 Timetable Header',
    provenanceNotes: 'LLMs, RAG & Agentic AI'
  },
  {
    id: 'extract-fri-6',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '15:20',
    endTime: '16:20',
    durationMinutes: 60,
    slotType: 'unassigned',
    notes: 'Unscheduled Period',
    sourceScreenshot: 'media_1792820390676.png',
    screenshotLabel: 'Friday 23/10 Timetable Header',
    provenanceNotes: 'Empty white cell in college timetable sheet.'
  },

  // =========================================================================
  // Saturday, 24 October 2026 — Source: media_1792820405300.png
  // =========================================================================
  {
    id: 'extract-sat-1',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820405300.png',
    screenshotLabel: 'Saturday 24/10 Timetable Header',
    provenanceNotes: 'Data Structures & Algorithm - III'
  },
  {
    id: 'extract-sat-2',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820405300.png',
    screenshotLabel: 'Saturday 24/10 Timetable Header',
    provenanceNotes: 'Data Structures & Algorithm - III'
  },
  {
    id: 'extract-sat-3',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '11:10',
    endTime: '12:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37',
    sourceScreenshot: 'media_1792820405300.png',
    screenshotLabel: 'Saturday 24/10 Timetable Header',
    provenanceNotes: 'Data Structures & Algorithm - III'
  },
  {
    id: 'extract-sat-4',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '12:20',
    endTime: '13:00',
    durationMinutes: 40,
    slotType: 'short_break',
    notes: 'Transition Break',
    sourceScreenshot: 'media_1792820405300.png',
    screenshotLabel: 'Saturday 24/10 Timetable Header',
    provenanceNotes: 'Solid yellow unlabelled horizontal bar (40 mins).'
  },
  {
    id: 'extract-sat-5',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    slotType: 'unassigned',
    notes: 'Unscheduled for Elon Musk cohort',
    sourceScreenshot: 'media_1792820405300.png',
    screenshotLabel: 'Saturday 24/10 Timetable Header',
    provenanceNotes: 'Empty for Elon Musk. (Jensen Huang had Industry Session by Kapithra Kannapiran).'
  },
  {
    id: 'extract-sat-6',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '14:10',
    endTime: '15:10',
    durationMinutes: 60,
    slotType: 'unassigned',
    notes: 'Unscheduled for Elon Musk cohort',
    sourceScreenshot: 'media_1792820405300.png',
    screenshotLabel: 'Saturday 24/10 Timetable Header',
    provenanceNotes: 'Empty for Elon Musk. (Jensen Huang had Industry Session by Kapithra Kannapiran).'
  }
]
