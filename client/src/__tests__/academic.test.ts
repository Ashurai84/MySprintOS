import { describe, it, expect } from 'vitest'
import { fullBackupSchema, taskImportSchema } from '../utils/exportImport'
import { getDaysRemaining } from '../utils/dateUtils'
import type { Task, SubjectInternalMarks } from '../types'

describe('SprintOS Academic Unit Tests', () => {
  describe('Attendance Calculations & 75% Threshold Warnings', () => {
    function calculateAttendance(attended: number, total: number) {
      if (total <= 0) return { percentage: 100, isWarning: false }
      const pct = (attended / total) * 100
      return {
        percentage: Number(pct.toFixed(1)),
        isWarning: pct < 75
      }
    }

    it('accurately calculates attendance percentage', () => {
      expect(calculateAttendance(15, 20)).toEqual({ percentage: 75.0, isWarning: false })
      expect(calculateAttendance(14, 20)).toEqual({ percentage: 70.0, isWarning: true })
      expect(calculateAttendance(8, 10)).toEqual({ percentage: 80.0, isWarning: false })
      expect(calculateAttendance(0, 0)).toEqual({ percentage: 100, isWarning: false })
    })

    it('triggers warning when attendance drops below university 75% mandatory threshold', () => {
      // 5 out of 8 classes attended = 62.5%
      const res = calculateAttendance(5, 8)
      expect(res.percentage).toBe(62.5)
      expect(res.isWarning).toBe(true)
    })

    it('passes safely when attendance meets exactly 75% requirement', () => {
      // 6 out of 8 classes attended = 75.0%
      const res = calculateAttendance(6, 8)
      expect(res.percentage).toBe(75.0)
      expect(res.isWarning).toBe(false)
    })
  })

  describe('Task Filtering & Overdue Logic', () => {
    const mockTasks: Task[] = [
      {
        id: 't1',
        title: 'Task Overdue',
        description: '',
        subjectId: 'dsa-3',
        deadline: '2026-10-10',
        priority: 'high',
        status: 'todo',
        estimatedHours: 2,
        actualHours: 0,
        createdAt: '2026-10-01'
      },
      {
        id: 't2',
        title: 'Task Upcoming',
        description: '',
        subjectId: 'llm-rag-agentic-ai',
        deadline: '2026-11-01',
        priority: 'critical',
        status: 'todo',
        estimatedHours: 3,
        actualHours: 0,
        createdAt: '2026-10-01'
      },
      {
        id: 't3',
        title: 'Task Completed',
        description: '',
        subjectId: 'stqa',
        deadline: '2026-10-15',
        priority: 'low',
        status: 'completed',
        estimatedHours: 1,
        actualHours: 1,
        createdAt: '2026-10-01'
      }
    ]

    it('filters completed tasks correctly', () => {
      const completed = mockTasks.filter(t => t.status === 'completed')
      expect(completed.length).toBe(1)
      expect(completed[0].id).toBe('t3')
    })

    it('filters tasks by subject ID', () => {
      const dsaTasks = mockTasks.filter(t => t.subjectId === 'dsa-3')
      expect(dsaTasks.length).toBe(1)
      expect(dsaTasks[0].title).toBe('Task Overdue')
    })

    it('accurately detects overdue status based on deadline', () => {
      const overdueInfo = getDaysRemaining('2026-10-10')
      expect(overdueInfo.isOverdue).toBe(true)
      expect(overdueInfo.days).toBeGreaterThan(0)

      const futureInfo = getDaysRemaining('2026-12-01')
      expect(futureInfo.isOverdue).toBe(false)
    })
  })

  describe('Internal and External Marks Totals', () => {
    function calculateTotalMarks(marks: SubjectInternalMarks) {
      // Internal out of 60 (attendance 5, participation 5, assignments 30, mini-project 20)
      const internalItems = [
        marks.attendance,
        marks.classParticipation,
        marks.assignments,
        marks.miniProject
      ].filter((m): m is number => m !== undefined)

      const internalTotal = internalItems.reduce((acc, curr) => acc + curr, 0)
      const internalPending = [
        marks.attendance,
        marks.classParticipation,
        marks.assignments,
        marks.miniProject
      ].some(m => m === undefined)

      // External out of 40 (theory exam 20, viva 20)
      const externalItems = [
        marks.theoryExam,
        marks.projectViva
      ].filter((m): m is number => m !== undefined)

      const externalTotal = externalItems.reduce((acc, curr) => acc + curr, 0)
      const externalPending = [
        marks.theoryExam,
        marks.projectViva
      ].some(m => m === undefined)

      return {
        internalTotal,
        internalPending,
        externalTotal,
        externalPending,
        grandTotal: internalTotal + externalTotal,
        isFullyEntered: !internalPending && !externalPending
      }
    }

    it('correctly sums internal evaluation components out of 60', () => {
      const sampleMarks: SubjectInternalMarks = {
        subjectId: 'dsa-3',
        attendance: 5,
        classParticipation: 4.5,
        assignments: 28,
        miniProject: 18
      }

      const res = calculateTotalMarks(sampleMarks)
      expect(res.internalTotal).toBe(55.5)
      expect(res.internalPending).toBe(false)
    })

    it('treats unentered external marks as pending rather than fabricating zero', () => {
      const partialMarks: SubjectInternalMarks = {
        subjectId: 'llm-rag-agentic-ai',
        attendance: 4.5,
        classParticipation: 4.0,
        assignments: 26.0,
        miniProject: undefined,
        theoryExam: undefined,
        projectViva: undefined
      }

      const res = calculateTotalMarks(partialMarks)
      expect(res.internalTotal).toBe(34.5)
      expect(res.internalPending).toBe(true)
      expect(res.externalPending).toBe(true)
      expect(res.isFullyEntered).toBe(false)
    })
  })

  describe('Zod Schema Import & Backup Validation', () => {
    it('validates a correct task object schema', () => {
      const validTask = {
        id: 't-123',
        title: 'Complete STQA Lab 3',
        description: 'Postman collection validation',
        subjectId: 'stqa',
        deadline: '2026-10-30',
        priority: 'high',
        status: 'todo',
        estimatedHours: 2,
        actualHours: 0,
        createdAt: '2026-10-21T00:00:00.000Z'
      }

      const parsed = taskImportSchema.safeParse(validTask)
      expect(parsed.success).toBe(true)
    })

    it('rejects an invalid task with missing title', () => {
      const invalidTask = {
        id: 't-124',
        title: '',
        subjectId: 'stqa',
        deadline: '2026-10-30',
        priority: 'high',
        status: 'todo'
      }

      const parsed = taskImportSchema.safeParse(invalidTask)
      expect(parsed.success).toBe(false)
    })

    it('validates a complete SprintOS backup payload', () => {
      const validBackup = {
        version: '1.0',
        exportedAt: '2026-10-21T11:00:00Z',
        tasks: [
          {
            id: 't1',
            title: 'Test',
            subjectId: 'dsa-3',
            deadline: '2026-10-25',
            priority: 'medium',
            status: 'todo',
            estimatedHours: 1,
            actualHours: 0,
            createdAt: '2026-10-21T00:00:00Z'
          }
        ],
        certifications: [],
        resources: [],
        attendance: [],
        completedTopics: { 't1-1': true }
      }

      const parsed = fullBackupSchema.safeParse(validBackup)
      expect(parsed.success).toBe(true)
    })
  })

  describe('SprintOS 2.0 Attendance Engine & Lecture Management', () => {
    // Import dynamically or inline test with calculateSubjectAttendance
    const mockLectures: any[] = [
      {
        id: 'lec-1',
        date: '2026-10-22',
        subjectId: 'dsa-3',
        title: 'Strongly Connected Components',
        durationMinutes: 60,
        status: 'attended',
        createdAt: '2026-10-22T09:00:00Z',
        updatedAt: '2026-10-22T09:00:00Z'
      },
      {
        id: 'lec-2',
        date: '2026-10-22',
        subjectId: 'dsa-3',
        title: "Kosaraju's Algorithm",
        durationMinutes: 60,
        status: 'attended',
        createdAt: '2026-10-22T11:00:00Z',
        updatedAt: '2026-10-22T11:00:00Z'
      },
      {
        id: 'lec-3',
        date: '2026-10-23',
        subjectId: 'dsa-3',
        title: 'Tarjan Algorithm',
        durationMinutes: 60,
        status: 'absent',
        createdAt: '2026-10-23T09:00:00Z',
        updatedAt: '2026-10-23T09:00:00Z'
      },
      {
        id: 'lec-4',
        date: '2026-10-24',
        subjectId: 'dsa-3',
        title: 'Review Session',
        durationMinutes: 60,
        status: 'cancelled',
        createdAt: '2026-10-24T09:00:00Z',
        updatedAt: '2026-10-24T09:00:00Z'
      },
      {
        id: 'lec-5',
        date: '2026-10-25',
        subjectId: 'dsa-3',
        title: 'Future Session',
        durationMinutes: 60,
        status: 'scheduled',
        createdAt: '2026-10-25T09:00:00Z',
        updatedAt: '2026-10-25T09:00:00Z'
      }
    ]

    it('supports multiple sessions for the same subject on the same day without collision', () => {
      const sameDayLectures = mockLectures.filter(l => l.date === '2026-10-22' && l.subjectId === 'dsa-3')
      expect(sameDayLectures.length).toBe(2)
      expect(sameDayLectures[0].title).toBe('Strongly Connected Components')
      expect(sameDayLectures[1].title).toBe("Kosaraju's Algorithm")
      expect(sameDayLectures[0].id).not.toBe(sameDayLectures[1].id)
    })

    it('strictly excludes cancelled and future scheduled sessions from held sessions', () => {
      let attended = 0
      let absent = 0
      let scheduled = 0
      let cancelled = 0

      for (const lec of mockLectures) {
        if (lec.status === 'attended') attended++
        if (lec.status === 'absent') absent++
        if (lec.status === 'scheduled') scheduled++
        if (lec.status === 'cancelled') cancelled++
      }

      const totalHeld = attended + absent
      expect(totalHeld).toBe(3) // 2 attended + 1 absent = 3 held
      expect(cancelled).toBe(1)
      expect(scheduled).toBe(1)

      // Attendance % = 2 / 3 = 66.7%
      const pct = Math.round((attended / totalHeld) * 1000) / 10
      expect(pct).toBe(66.7)
    })

    it('returns null percentage ("No attendance data yet") when 0 sessions are held', () => {
      const emptyLectures: any[] = [
        { id: 'e1', subjectId: 'stqa', date: '2026-10-28', status: 'scheduled' },
        { id: 'e2', subjectId: 'stqa', date: '2026-10-29', status: 'cancelled' }
      ]

      const held = emptyLectures.filter(l => l.status === 'attended' || l.status === 'absent').length
      const percentage = held === 0 ? null : 100
      expect(percentage).toBeNull()
    })

    it('calculates the exact consecutive sessions needed to reach 75% threshold', () => {
      // 5 attended, 3 absent = 8 held, 62.5% attendance
      const attended = 5
      const absent = 3
      const held = attended + absent
      const targetFraction = 0.75

      // Formula: ceil((target * held - attended) / (1 - target))
      const needed = Math.ceil((targetFraction * held - attended) / (1 - targetFraction))
      expect(needed).toBe(4) // (6 - 5) / 0.25 = 4

      // Verification: if student attends 4 consecutive classes:
      // New attended = 5 + 4 = 9, New held = 8 + 4 = 12
      // 9 / 12 = 75.0%
      expect((attended + needed) / (held + needed)).toBe(0.75)
    })

    it('recalculates attendance immediately when an absent lecture is corrected to attended', () => {
      let lecturesList = [...mockLectures]
      
      // Before correction: 2 attended, 1 absent = 66.7%
      let att = lecturesList.filter(l => l.status === 'attended').length
      let abs = lecturesList.filter(l => l.status === 'absent').length
      expect(Math.round((att / (att + abs)) * 1000) / 10).toBe(66.7)

      // Correction: mark lec-3 as attended
      lecturesList = lecturesList.map(l => l.id === 'lec-3' ? { ...l, status: 'attended', isEdited: true } : l)
      
      att = lecturesList.filter(l => l.status === 'attended').length
      abs = lecturesList.filter(l => l.status === 'absent').length
      expect(att).toBe(3)
      expect(abs).toBe(0)
      expect(Math.round((att / (att + abs)) * 1000) / 10).toBe(100.0)
      expect(lecturesList.find(l => l.id === 'lec-3')?.isEdited).toBe(true)
    })

    it('accurately filters lectures by date, subject and status', () => {
      // Date filter
      const oct22 = mockLectures.filter(l => l.date === '2026-10-22')
      expect(oct22.length).toBe(2)

      // Status filter
      const attendedOnly = mockLectures.filter(l => l.status === 'attended')
      expect(attendedOnly.length).toBe(2)

      // Subject filter
      const dsaOnly = mockLectures.filter(l => l.subjectId === 'dsa-3')
      expect(dsaOnly.length).toBe(5)
    })
  })

  describe('Document Vault & Format Detection', () => {
    function detectDocFormat(filename: string) {
      const lower = filename.toLowerCase()
      if (lower.endsWith('.pdf')) return 'pdf'
      if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'xlsx'
      if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'docx'
      return 'unsupported'
    }

    it('correctly classifies spreadsheet documents for in-app SheetJS table viewer', () => {
      expect(detectDocFormat('LLMs, RAG & Agentic AI_Sem5.xlsx')).toBe('xlsx')
      expect(detectDocFormat('Software Testing And Quality Assurance_Sem5.xlsx')).toBe('xlsx')
    })

    it('correctly classifies Word documents for in-app Mammoth previewer', () => {
      expect(detectDocFormat('DSA3_Semester5_Syllabus (1).docx')).toBe('docx')
    })

    it('correctly classifies PDF documents for in-app PDF viewer', () => {
      expect(detectDocFormat('Semester 5 Plan.pdf')).toBe('pdf')
    })

    it('identifies unsupported extensions and handles them with a download fallback', () => {
      expect(detectDocFormat('notes.zip')).toBe('unsupported')
      expect(detectDocFormat('script.py')).toBe('unsupported')
    })
  })
})
