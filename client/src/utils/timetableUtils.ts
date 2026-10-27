import type { TimetableEntry, TimetableConflict } from '../types'
import { canonicalSubjectId, isSameSubject } from './subjectUtils'
import { resolveFacultyName, resolveFacultyId } from '../data/facultyData'

export interface TimeValidationResult {
  isValid: boolean
  error?: string
  durationMinutes: number
}

/**
 * Validates that end time is strictly greater than start time and calculates duration.
 * Duration is always dynamically computed from times, never stored as an out-of-sync value.
 */
export function validateTimes(startTime?: string, endTime?: string): TimeValidationResult {
  if (!startTime || !endTime) {
    return { isValid: false, error: 'Both start time and end time are required.', durationMinutes: 60 }
  }
  const startMin = timeToMinutes(startTime)
  const endMin = timeToMinutes(endTime)
  if (endMin <= startMin) {
    return { isValid: false, error: 'End time must be after start time.', durationMinutes: 0 }
  }
  const duration = endMin - startMin
  if (duration < 15) {
    return { isValid: false, error: 'Duration must be at least 15 minutes.', durationMinutes: duration }
  }
  if (duration > 480) {
    return { isValid: false, error: 'Duration cannot exceed 8 hours.', durationMinutes: duration }
  }
  return { isValid: true, durationMinutes: duration }
}

/**
 * Normalizes any time string (12-hour, AM/PM, or ambiguous afternoon 2-digit) into standard 24-hour HH:MM format.
 * E.g. "02:00" in afternoon context -> "14:00", "2:00 PM" -> "14:00", "10:00" in morning context -> "10:00".
 * Prevents morning hours (7:00 - 11:59) from erroneously rolling over to PM (e.g. 10:00 AM turning into 22:00 PM).
 */
export function normalizeTimeTo24H(timeStr: string, startTimeRef?: string | boolean): string {
  if (!timeStr) return '10:00'
  const trimmed = timeStr.trim().toLowerCase()

  // Case 1: Has AM/PM
  const isPM = trimmed.includes('pm')
  const isAM = trimmed.includes('am')
  const cleanStr = trimmed.replace(/[a-z\s]/g, '')
  const parts = cleanStr.split(':').map(Number)
  let h = isNaN(parts[0]) ? 10 : parts[0]
  const m = isNaN(parts[1]) ? 0 : parts[1]

  if (isPM && h < 12) h += 12
  if (isAM && h === 12) h = 0

  // Case 2: Plain numeric time like "02:00" or "2:00"
  if (!isAM && !isPM) {
    if (typeof startTimeRef === 'string' && startTimeRef) {
      const startMin = timeToMinutes(startTimeRef)
      const currentMin = h * 60 + m
      // Only roll over by 12 hours if current time is strictly before start time
      // AND adding 12 hours produces a daytime end time (<= 20:00) after start
      if (currentMin <= startMin && currentMin + 12 * 60 > startMin && currentMin + 12 * 60 <= 20 * 60) {
        h += 12
      }
    } else if (h >= 1 && h <= 6) {
      // 1:00 to 6:00 without AM is afternoon (13:00 to 18:00) in university schedule
      h += 12
    }
    // 7:00 to 12:00 are morning/noon hours (07:00 to 12:00) and are never converted to PM
  }

  const normH = Math.min(23, Math.max(0, h))
  const normM = Math.min(59, Math.max(0, m))
  return `${String(normH).padStart(2, '0')}:${String(normM).padStart(2, '0')}`
}

/**
 * Converts a HH:MM string to total minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const normalized = normalizeTimeTo24H(timeStr)
  const [h, m] = normalized.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return 0
  return h * 60 + m
}

/**
 * Converts total minutes from midnight to a 24-hour HH:MM string.
 */
export function minutesToTime(totalMinutes: number): string {
  const norm = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60)
  const h = Math.floor(norm / 60)
  const m = norm % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Converts any time string (e.g. "13:00", "09:00", "12:20") into a 12-hour AM/PM format.
 * E.g. "13:00" -> "1:00 PM", "10:00" -> "10:00 AM", "12:20" -> "12:20 PM", "09:00" -> "9:00 AM", "00:00" -> "12:00 AM".
 */
export function formatTimeTo12H(timeStr?: string): string {
  if (!timeStr) return ''
  const trimmed = timeStr.trim().toLowerCase()
  if (trimmed.includes('am') || trimmed.includes('pm')) {
    return timeStr.trim().toUpperCase()
  }
  const parts = trimmed.split(':').map(Number)
  if (isNaN(parts[0])) return timeStr
  let h = parts[0]
  const m = isNaN(parts[1]) ? 0 : parts[1]
  const meridiem = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  const minStr = String(m).padStart(2, '0')
  return `${h}:${minStr} ${meridiem}`
}

/**
 * Formats a start and end time into a clean 12-hour range.
 * E.g. ("10:00", "11:00") -> "10:00 AM – 11:00 AM"
 * E.g. ("12:20", "13:00") -> "12:20 PM – 1:00 PM"
 * E.g. ("13:00", "14:00") -> "1:00 PM – 2:00 PM"
 */
export function formatTimeRangeTo12H(startTime?: string, endTime?: string): string {
  if (!startTime) return ''
  const formattedStart = formatTimeTo12H(startTime)
  if (!endTime) return formattedStart
  const formattedEnd = formatTimeTo12H(endTime)
  return `${formattedStart} – ${formattedEnd}`
}

/**
 * Calculates duration in minutes from startTime to endTime.
 * If endTime appears to be in 12h format (e.g. startTime: "13:10", endTime: "02:00"),
 * it automatically resolves endTime to 24h ("14:00" or "14:10").
 */
export function calculateDurationFromTimes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 60
  const startMin = timeToMinutes(startTime)
  let endMin = timeToMinutes(endTime)

  // Disambiguate if end time rolled over because of 12-hour confusion
  if (endMin <= startMin && endMin + 12 * 60 > startMin) {
    endMin += 12 * 60
  }

  const diff = endMin - startMin
  return diff > 0 ? diff : 60
}

/**
 * Calculates endTime given startTime and duration in minutes, strictly formatted in 24-hour HH:MM.
 */
export function calculateEndTimeFromDuration(startTime: string, durationMinutes: number): string {
  if (!startTime) return ''
  const startMin = timeToMinutes(startTime)
  return minutesToTime(startMin + durationMinutes)
}

/**
 * Formats duration in minutes into a clean readable string.
 * e.g. 60 -> "60 mins (1 hr)", 120 -> "120 mins (2 hrs)", 40 -> "40 mins"
 */
export function formatDuration(durationMinutes: number): string {
  if (!durationMinutes || isNaN(durationMinutes)) return '60 mins'
  if (durationMinutes === 60) return '60 mins (1 hr)'
  if (durationMinutes === 120) return '120 mins (2 hrs)'
  if (durationMinutes === 180) return '180 mins (3 hrs)'
  if (durationMinutes % 60 === 0) {
    return `${durationMinutes} mins (${durationMinutes / 60} hrs)`
  }
  if (durationMinutes % 30 === 0 && durationMinutes > 60) {
    return `${durationMinutes} mins (${(durationMinutes / 60).toFixed(1)} hrs)`
  }
  return `${durationMinutes} mins`
}

/**
 * Safely parses day of week for a YYYY-MM-DD string without timezone offset corruption.
 */
export function getDayOfWeekFromDate(dateStr: string): number {
  if (!dateStr) return 0
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return 0
  return new Date(y, m - 1, d).getDay()
}

/**
 * Sanitizes and normalizes timetable entries to strict 24-hour format,
 * fixes 12h typos (like 13:10–02:00), eliminates redundant duplicate unassigned slots,
 * and ensures canonical subject ID and faculty mappings.
 */
export function sanitizeTimetableEntries(entries: TimetableEntry[]): TimetableEntry[] {
  let cleaned: TimetableEntry[] = []

  for (const entry of entries) {
    let start24 = normalizeTimeTo24H(entry.startTime)
    let end24 = normalizeTimeTo24H(entry.endTime, timeToMinutes(start24) >= 720)

    // Fix inverted timing or 12h mismatch like 13:10 to 02:00 -> should end at 14:10 for 60m duration
    const startMin = timeToMinutes(start24)
    let endMin = timeToMinutes(end24)
    if (endMin <= startMin) {
      if (entry.durationMinutes && entry.durationMinutes > 0) {
        end24 = minutesToTime(startMin + entry.durationMinutes)
      } else {
        end24 = minutesToTime(startMin + 60)
      }
    } else if (entry.durationMinutes && entry.durationMinutes > 0 && Math.abs((endMin - startMin) - entry.durationMinutes) > 0 && (entry.endTime?.includes('02:00') || entry.endTime?.includes('2:00') || entry.endTime?.includes('14:00'))) {
      end24 = minutesToTime(startMin + entry.durationMinutes)
    }

    const duration = calculateDurationFromTimes(start24, end24)

    // Canonicalize subject ID if present or infer from notes
    const canonSubId = canonicalSubjectId(entry.subjectId || entry.notes) || undefined

    // Sanitize faculty strictly from single source of truth (FACULTY_ROSTER)
    let faculty = entry.faculty
    let facultyId = (entry as any).facultyId
    if (canonSubId) {
      if (isSameSubject(canonSubId, 'S5-AI01')) {
        // Enforce Dr. Dipanjan for S5-AI01 (never Sanjay Sahu)
        if (!faculty || faculty.toLowerCase().includes('sahu') || faculty.toLowerCase().includes('sanjay')) {
          faculty = 'Dr. Dipanjan'
        }
        facultyId = 'fac-dipanjan'
      } else if (isSameSubject(canonSubId, 'S5-CS01')) {
        // Enforce Sanjay Sahu (VF) for S5-CS01 (never Kunal Suri)
        if (!faculty || faculty.includes('Kunal Suri') || faculty.toLowerCase().includes('kunal')) {
          faculty = 'Sanjay Sahu (VF)'
        }
        facultyId = 'fac-sanjay'
      } else {
        faculty = resolveFacultyName(facultyId, canonSubId, faculty)
        facultyId = resolveFacultyId(canonSubId, faculty)
      }
    }

    const currentEntryMin = { start: timeToMinutes(start24), end: timeToMinutes(end24) }

    // Check if this is an unassigned or free slot that overlaps with a real scheduled lecture slot
    if (entry.slotType === 'unassigned' || entry.slotType === 'free_period') {
      const overlapsLecture = cleaned.some(existing => {
        if (existing.slotType !== 'lecture') return false
        const sameScope = (entry.specificDate && existing.specificDate && entry.specificDate === existing.specificDate) ||
          (!entry.specificDate && !existing.specificDate && entry.dayOfWeek === existing.dayOfWeek) ||
          (entry.specificDate && !existing.specificDate && getDayOfWeekFromDate(entry.specificDate) === existing.dayOfWeek) ||
          (!entry.specificDate && existing.specificDate && getDayOfWeekFromDate(existing.specificDate) === entry.dayOfWeek)
        if (!sameScope) return false

        const eStart = timeToMinutes(existing.startTime)
        const eEnd = timeToMinutes(existing.endTime)
        return eStart < currentEntryMin.end && eEnd > currentEntryMin.start
      })

      if (overlapsLecture) {
        // Discard duplicate/overlapping unassigned block because a real lecture occupies this slot
        continue
      }
    } else if (entry.slotType === 'lecture') {
      // If adding a real lecture, remove any previous unassigned/free slots that overlap with it
      cleaned = cleaned.filter(existing => {
        if (existing.slotType !== 'unassigned' && existing.slotType !== 'free_period') return true
        const sameScope = (entry.specificDate && existing.specificDate && entry.specificDate === existing.specificDate) ||
          (!entry.specificDate && !existing.specificDate && entry.dayOfWeek === existing.dayOfWeek) ||
          (entry.specificDate && !existing.specificDate && getDayOfWeekFromDate(entry.specificDate) === existing.dayOfWeek) ||
          (!entry.specificDate && existing.specificDate && getDayOfWeekFromDate(existing.specificDate) === entry.dayOfWeek)
        if (!sameScope) return true

        const eStart = timeToMinutes(existing.startTime)
        const eEnd = timeToMinutes(existing.endTime)
        const overlaps = eStart < currentEntryMin.end && eEnd > currentEntryMin.start
        return !overlaps
      })
    }

    cleaned.push({
      ...entry,
      subjectId: canonSubId,
      faculty,
      facultyId,
      startTime: start24,
      endTime: end24,
      durationMinutes: duration
    } as any)
  }

  return cleaned
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

export interface WeekDayInfo {
  name: string
  short: string
  dayNum: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

/**
 * All 7 weekdays supported by SprintOS (Monday to Sunday).
 */
export const ALL_WEEK_DAYS: WeekDayInfo[] = [
  { name: 'Monday', short: 'Mon', dayNum: 1 },
  { name: 'Tuesday', short: 'Tue', dayNum: 2 },
  { name: 'Wednesday', short: 'Wed', dayNum: 3 },
  { name: 'Thursday', short: 'Thu', dayNum: 4 },
  { name: 'Friday', short: 'Fri', dayNum: 5 },
  { name: 'Saturday', short: 'Sat', dayNum: 6 },
  { name: 'Sunday', short: 'Sun', dayNum: 0 }
]

/**
 * Detects overlapping sessions on the same date or same day of week, strictly evaluating 24-hour minutes.
 * If targetDate is provided, detects conflicts strictly among active blocks for that specific date.
 */
export function detectTimetableConflicts(rawEntries: TimetableEntry[], targetDate?: string): TimetableConflict[] {
  if (targetDate) {
    const activeEntries = getEntriesForDate(rawEntries, targetDate)
    const conflicts: TimetableConflict[] = []
    for (let i = 0; i < activeEntries.length; i++) {
      for (let j = i + 1; j < activeEntries.length; j++) {
        const a = activeEntries[i]
        const b = activeEntries[j]
        const aStart = timeToMinutes(a.startTime)
        const aEnd = timeToMinutes(a.endTime)
        const bStart = timeToMinutes(b.startTime)
        const bEnd = timeToMinutes(b.endTime)
        if (aStart < bEnd && aEnd > bStart) {
          conflicts.push({
            entryId1: a.id,
            entryId2: b.id,
            message: `Conflict on ${targetDate}: "${a.slotType === 'lecture' ? a.subjectId : a.slotType}" (${formatTimeRangeTo12H(a.startTime, a.endTime)}) overlaps with "${b.slotType === 'lecture' ? b.subjectId : b.slotType}" (${formatTimeRangeTo12H(b.startTime, b.endTime)})`
          })
        }
      }
    }
    return conflicts
  }

  const entries = sanitizeTimetableEntries(rawEntries)
  const conflicts: TimetableConflict[] = []

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]
      const b = entries[j]

      // Same specific date
      const sameSpecificDate = Boolean(a.specificDate && b.specificDate && a.specificDate === b.specificDate)
      // Same recurring day of week
      const sameRecurringDay = Boolean(!a.specificDate && !b.specificDate && a.dayOfWeek === b.dayOfWeek)

      if (sameSpecificDate || sameRecurringDay) {
        const aStart = timeToMinutes(a.startTime)
        const aEnd = timeToMinutes(a.endTime)
        const bStart = timeToMinutes(b.startTime)
        const bEnd = timeToMinutes(b.endTime)

        if (aStart < bEnd && aEnd > bStart) {
          const context = sameSpecificDate ? `on ${a.specificDate}` : `on recurring day ${a.dayOfWeek}`
          conflicts.push({
            entryId1: a.id,
            entryId2: b.id,
            message: `Time conflict ${context} between "${a.slotType === 'lecture' ? a.subjectId : a.slotType}" (${formatTimeRangeTo12H(a.startTime, a.endTime)}) and "${b.slotType === 'lecture' ? b.subjectId : b.slotType}" (${formatTimeRangeTo12H(b.startTime, b.endTime)})`
          })
        }
      }
    }
  }

  return conflicts
}

/**
 * Returns timetable entries applicable for a given date (YYYY-MM-DD).
 * Prioritizes specificDate overrides; otherwise uses recurring dayOfWeek.
 */
export function getEntriesForDate(rawEntries: TimetableEntry[], dateStr: string): TimetableEntry[] {
  const entries = sanitizeTimetableEntries(rawEntries)
  const targetDayOfWeek = getDayOfWeekFromDate(dateStr)

  // 1. Specific date entries
  const specific = entries.filter(e => e.specificDate === dateStr)
  
  // 2. Recurring entries matching day of week
  const recurring = entries.filter(e => !e.specificDate && e.dayOfWeek === targetDayOfWeek)

  if (specific.length === 0) {
    return recurring.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  }

  // Merge specific entries with any non-overlapping recurring entries
  const nonOverlappingRecurring = recurring.filter(rec => {
    const recStart = timeToMinutes(rec.startTime)
    const recEnd = timeToMinutes(rec.endTime)
    return !specific.some(spec => {
      const specStart = timeToMinutes(spec.startTime)
      const specEnd = timeToMinutes(spec.endTime)
      return recStart < specEnd && recEnd > specStart
    })
  })

  const merged = [...specific, ...nonOverlappingRecurring]
  return merged.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

