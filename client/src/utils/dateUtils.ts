export function formatDisplayDate(dateStr?: string | Date): string {
  if (!dateStr) return 'No date'
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return dateStr.toString()
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

export function formatFullDate(dateStr?: string | Date): string {
  const date = dateStr ? (typeof dateStr === 'string' ? new Date(dateStr) : dateStr) : new Date()
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

/**
 * Returns current date string formatted as YYYY-MM-DD strictly in Asia/Kolkata timezone.
 */
export function getKolkataDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(date)
}

export function getTodayDateString(): string {
  return getKolkataDateString()
}

export function getDaysRemaining(deadlineStr: string): { days: number; isOverdue: boolean; isToday: boolean; label: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const deadline = new Date(deadlineStr)
  deadline.setHours(0, 0, 0, 0)

  const diffTime = deadline.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return { days: 0, isOverdue: false, isToday: true, label: 'Due today' }
  } else if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays)
    return { days: overdueDays, isOverdue: true, isToday: false, label: `${overdueDays}d overdue` }
  } else {
    return { days: diffDays, isOverdue: false, isToday: false, label: `Due in ${diffDays}d` }
  }
}

export function getSprintTimelineInfo(): {
  currentDay: number
  totalDays: number
  percentage: number
  phase: string
  daysUntilExams: number
} {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const startDate = new Date('2026-10-12')
  const endDate = new Date('2026-12-05')
  const examDate = new Date('2026-12-10')

  const totalSprintTime = endDate.getTime() - startDate.getTime()
  const totalDays = Math.round(totalSprintTime / (1000 * 60 * 60 * 24)) + 1

  const elapsed = now.getTime() - startDate.getTime()
  const currentDay = Math.max(1, Math.min(totalDays, Math.round(elapsed / (1000 * 60 * 60 * 24)) + 1))

  const percentage = Math.max(0, Math.min(100, Math.round((currentDay / totalDays) * 100)))

  const daysUntilExams = Math.max(0, Math.round((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  let phase = 'Teaching & Internal Assessment'
  if (now > endDate && now < examDate) {
    phase = 'Study Break & Exam Prep'
  } else if (now >= examDate) {
    phase = 'End-Semester Examinations'
  }

  return {
    currentDay,
    totalDays,
    percentage,
    phase,
    daysUntilExams
  }
}
