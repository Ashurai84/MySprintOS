import { z } from 'zod'
import type { Task, SubjectAttendance } from '../types'

export const taskImportSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().default(''),
  subjectId: z.string(),
  deadline: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['todo', 'in_progress', 'completed']),
  estimatedHours: z.number().default(1),
  actualHours: z.number().default(0),
  resourceUrl: z.string().optional(),
  submissionUrl: z.string().optional(),
  completedAt: z.string().optional(),
  createdAt: z.string().default(() => new Date().toISOString()),
  isSample: z.boolean().optional()
})

export const fullBackupSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  tasks: z.array(taskImportSchema),
  certifications: z.array(z.any()),
  resources: z.array(z.any()),
  attendance: z.array(z.any()),
  completedTopics: z.record(z.string(), z.boolean()).optional()
})

export function downloadJsonFile(filename: string, data: unknown): void {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportTasksToCsv(tasks: Task[]): string {
  const headers = ['ID', 'Title', 'Subject ID', 'Priority', 'Status', 'Deadline', 'Estimated Hours', 'Actual Hours', 'Resource URL', 'Submission URL', 'Completed At']
  const rows = tasks.map(t => [
    `"${t.id}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.subjectId}"`,
    `"${t.priority}"`,
    `"${t.status}"`,
    `"${t.deadline}"`,
    t.estimatedHours,
    t.actualHours,
    `"${t.resourceUrl || ''}"`,
    `"${t.submissionUrl || ''}"`,
    `"${t.completedAt || ''}"`
  ])
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

export function exportAttendanceToCsv(attendance: SubjectAttendance[], subjectNames: Record<string, string>): string {
  const headers = ['Subject ID', 'Subject Name', 'Classes Attended', 'Total Classes Held', 'Attendance %', 'Status (<75% Warning)']
  const rows = attendance.map(a => {
    const pct = a.totalClassesHeld > 0 ? ((a.classesAttended / a.totalClassesHeld) * 100).toFixed(1) : '100.0'
    const warning = Number(pct) < 75 ? 'WARNING' : 'OK'
    return [
      `"${a.subjectId}"`,
      `"${subjectNames[a.subjectId] || a.subjectId}"`,
      a.classesAttended,
      a.totalClassesHeld,
      `"${pct}%"`,
      `"${warning}"`
    ]
  })
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}
