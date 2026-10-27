import type { Lecture, SubjectAttendanceStats, OverallAttendanceStats } from '../types'
import { isSameSubject } from './subjectUtils'

/**
 * Calculates official university attendance statistics for a given subject.
 * 
 * Rules:
 * - Eligible Held sessions = Attended + Absent
 * - Breaks, free periods, independent study and unassigned slots never count toward attendance
 * - Scheduled future sessions are excluded from held
 * - Cancelled sessions are excluded from numerator and denominator
 * - Unmarked sessions do not silently count as attended or absent
 * - Attendance Percentage = (Attended / Held) * 100
 * - If Held == 0: percentage is null ("No attendance data yet")
 * - Warning triggered if percentage < minAttendancePercent (default 75%)
 * - Approaching warning triggered if 75% <= percentage < 80%
 * - Consecutive sessions needed to reach target = ceil((T * Held - Attended) / (1 - T))
 */
export function calculateSubjectAttendance(
  subjectId: string,
  lectures: Lecture[],
  totalCourseHours: number = 30,
  minAttendancePercent: number = 75
): SubjectAttendanceStats {
  const subjectLectures = lectures.filter(l => {
    // Strictly exclude any breaks, free periods, independent study or unassigned slots from attendance
    const titleLower = (l.title || '').toLowerCase()
    const notesLower = (l.notes || '').toLowerCase()
    if (
      titleLower.includes('lunch break') ||
      titleLower.includes('short break') ||
      titleLower.includes('free period') ||
      titleLower.includes('independent study') ||
      titleLower.includes('unassigned') ||
      notesLower.includes('lunch break') ||
      notesLower.includes('short break') ||
      notesLower.includes('free period') ||
      notesLower.includes('independent study') ||
      notesLower.includes('unassigned')
    ) {
      return false
    }
    return isSameSubject(l.subjectId, subjectId)
  })

  let attended = 0
  let absent = 0
  let scheduled = 0
  let cancelled = 0
  let unmarked = 0

  for (const lecture of subjectLectures) {
    switch (lecture.status) {
      case 'attended':
        attended++
        break
      case 'absent':
        absent++
        break
      case 'scheduled':
        scheduled++
        break
      case 'cancelled':
        cancelled++
        break
      case 'unmarked':
        unmarked++
        break
      default:
        // Any unrecognized or omitted status is safely counted as unmarked
        unmarked++
        break
    }
  }

  // Eligible held sessions strictly equal attended + absent
  const totalHeld = attended + absent
  const targetFraction = minAttendancePercent / 100

  if (totalHeld === 0) {
    return {
      subjectId,
      attended: 0,
      absent: 0,
      totalHeld: 0,
      scheduled,
      cancelled,
      unmarked,
      percentage: null,
      isWarning: false,
      isApproaching: false,
      consecutiveNeededToReachTarget: 0,
      possibleToReachTarget: true
    }
  }

  const rawPercent = (attended / totalHeld) * 100
  const percentage = Math.round(rawPercent * 10) / 10

  const isWarning = percentage < minAttendancePercent
  const isApproaching = percentage >= minAttendancePercent && percentage < (minAttendancePercent + 5)

  let consecutiveNeededToReachTarget = 0
  let possibleToReachTarget = true

  if (isWarning) {
    // Formula: ceil((target * held - attended) / (1 - target))
    const numerator = targetFraction * totalHeld - attended
    const denominator = 1 - targetFraction
    consecutiveNeededToReachTarget = Math.max(0, Math.ceil(numerator / denominator))

    // Estimate remaining sessions based on 1-hour sessions:
    // If course is 45 hours and 10 held, approx 35 sessions remain
    const estimatedRemainingSessions = Math.max(0, totalCourseHours - totalHeld)
    if (consecutiveNeededToReachTarget > estimatedRemainingSessions) {
      possibleToReachTarget = false
    }
  }

  return {
    subjectId,
    attended,
    absent,
    totalHeld,
    scheduled,
    cancelled,
    unmarked,
    percentage,
    isWarning,
    isApproaching,
    consecutiveNeededToReachTarget,
    possibleToReachTarget
  }
}

/**
 * Calculates aggregate university attendance statistics across all subjects.
 * 
 * Rules:
 * - Summary totals are derived strictly from the subject breakdown totals.
 * - Total Held = sum(subject.totalHeld)
 * - Total Attended = sum(subject.attended)
 * - Total Absent = sum(subject.absent)
 * - Total Scheduled = sum(subject.scheduled)
 * - Total Cancelled = sum(subject.cancelled)
 * - Total Unmarked = sum(subject.unmarked)
 * - Overall percentage = (totalAttended / totalHeld) * 100 (null if totalHeld === 0)
 * - Zero eligible sessions safely yields null without NaN, Infinity or misleading 100%.
 */
export function calculateOverallAttendance(
  subjectStats: SubjectAttendanceStats[],
  minAttendancePercent: number = 75
): OverallAttendanceStats {
  const totalAttended = subjectStats.reduce((sum, s) => sum + s.attended, 0)
  const totalAbsent = subjectStats.reduce((sum, s) => sum + s.absent, 0)
  const totalHeld = subjectStats.reduce((sum, s) => sum + s.totalHeld, 0)
  const totalUnmarked = subjectStats.reduce((sum, s) => sum + (s.unmarked || 0), 0)
  const totalScheduled = subjectStats.reduce((sum, s) => sum + s.scheduled, 0)
  const totalCancelled = subjectStats.reduce((sum, s) => sum + s.cancelled, 0)
  const warningCount = subjectStats.filter(s => s.isWarning).length

  const percentage = totalHeld > 0
    ? Math.round((totalAttended / totalHeld) * 1000) / 10
    : null

  const isWarning = percentage !== null && percentage < minAttendancePercent

  return {
    totalHeld,
    totalAttended,
    totalAbsent,
    totalUnmarked,
    totalScheduled,
    totalCancelled,
    attended: totalAttended,
    absent: totalAbsent,
    unmarked: totalUnmarked,
    scheduled: totalScheduled,
    cancelled: totalCancelled,
    percentage,
    isWarning,
    warningCount
  }
}

export interface AttendanceStatusVisualConfig {
  label: string
  badge: string
  dot: string
}

export const ATTENDANCE_STATUS_CONFIG: Record<string, AttendanceStatusVisualConfig> = {
  attended: {
    label: 'Attended',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500'
  },
  absent: {
    label: 'Absent',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500'
  },
  scheduled: {
    label: 'Scheduled',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-400'
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-400'
  },
  unmarked: {
    label: 'Unmarked',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-400'
  }
}

export function getAttendanceStatusConfig(status?: string): AttendanceStatusVisualConfig {
  if (!status) return ATTENDANCE_STATUS_CONFIG.scheduled
  return ATTENDANCE_STATUS_CONFIG[status.toLowerCase()] || ATTENDANCE_STATUS_CONFIG.scheduled
}

