import type { Lecture, SubjectAttendanceStats } from '../types'
import { isSameSubject } from './subjectUtils'

/**
 * Calculates official university attendance statistics for a given subject.
 * 
 * Rules:
 * - Held sessions = Attended + Absent
 * - Breaks and free periods never count toward attendance
 * - Scheduled future sessions are excluded from held
 * - Cancelled sessions are excluded from numerator and denominator
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
    // Strictly exclude any breaks or free periods from attendance
    const titleLower = (l.title || '').toLowerCase()
    if (titleLower.includes('lunch break') || titleLower.includes('short break') || titleLower.includes('free period')) {
      return false
    }
    return isSameSubject(l.subjectId, subjectId)
  })

  let attended = 0
  let absent = 0
  let scheduled = 0
  let cancelled = 0

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
    }
  }

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
    percentage,
    isWarning,
    isApproaching,
    consecutiveNeededToReachTarget,
    possibleToReachTarget
  }
}
