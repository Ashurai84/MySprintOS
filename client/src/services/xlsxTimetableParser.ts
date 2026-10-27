/**
 * SprintOS — College Timetable XLSX Parser
 * Specifically designed to ingest official weekly college timetable workbooks
 * (e.g. ITM Skills University - School of Futuretech Kharghar).
 *
 * CRITICAL REQUIREMENTS:
 * 1. STRICT COHORT ISOLATION: Parses academic records for "Elon Musk 2024" only.
 * 2. DYNAMIC COLUMN DETECTION: Identifies the cohort column by matching its header dynamically.
 * 3. EXCLUSION AT EXTRACTION: Other cohort columns (e.g. Jensen Huang 2024, Mark Zuckerberg)
 *    are completely excluded at the parsing stage and never enter the resulting dataset.
 * 4. INDEPENDENT DATE EXTRACTION: Extracts the exact calendar date per sheet (e.g. 26/10/2026).
 * 5. NO INVENTED TOPICS: Creates lecture slots with empty topic pointers and scheduled status.
 */

import * as XLSX from 'xlsx'
import type { TimetableEntry, TimetableSlotType } from '../types'
import { 
  normalizeTimeTo24H, 
  timeToMinutes, 
  calculateDurationFromTimes, 
  getDayOfWeekFromDate 
} from '../utils/timetableUtils'
import { canonicalSubjectId } from '../utils/subjectUtils'

export interface ExtractedXlsxSlot extends TimetableEntry {
  sourceSheet: string
  sourceRow: number
  sourceScreenshot: string
  screenshotLabel: string
  provenanceNotes?: string
  hasConflictWarning?: boolean
  conflictDetails?: string
  rawTimingStr?: string
  cohort: string
}

export interface XlsxParseResult {
  success: boolean
  error?: string
  cohortName: string
  otherCohortsFound: string[]
  detectedDates: string[]
  totalEntries: number
  lectureCount: number
  breakCount: number
  unassignedCount: number
  entries: ExtractedXlsxSlot[]
  sheetsProcessed: string[]
  warnings: string[]
}

const DEFAULT_TARGET_COHORT_REGEX = /elon\s*musk(?:\s*2024)?/i
const DEFAULT_TARGET_COHORT_NAME = 'Elon Musk 2024'

/**
 * Extracts a calendar date (YYYY-MM-DD) from text.
 * Matches:
 * - "26/10/2026 (Monday)" -> "2026-10-26"
 * - "26-10-2026" -> "2026-10-26"
 * - "2026-10-26" -> "2026-10-26"
 */
export function extractDateFromCell(text: string): { dateStr?: string; dayName?: string } {
  if (!text) return {}
  const str = String(text).trim()

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/)
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0')
    const month = dmyMatch[2].padStart(2, '0')
    const year = dmyMatch[3]
    const dateStr = `${year}-${month}-${day}`

    // Extract day name if present e.g. "(Monday)"
    const dayMatch = str.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)
    const dayName = dayMatch ? dayMatch[1] : undefined

    return { dateStr, dayName }
  }

  // Match YYYY-MM-DD
  const ymdMatch = str.match(/(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/)
  if (ymdMatch) {
    const year = ymdMatch[1]
    const month = ymdMatch[2].padStart(2, '0')
    const day = ymdMatch[3].padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const dayMatch = str.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)
    return { dateStr, dayName: dayMatch ? dayMatch[1] : undefined }
  }

  return {}
}

/**
 * Parses time range strings such as:
 * - "09:00 AM - 10:00 AM"
 * - "12:20 PM - 1:00 PM"
 * - "12:20 PM - 1:20 PM"
 * - "01:00 PM - 02:00 PM"
 */
export function parseTimeRange(timeStr: string): { startTime: string; endTime: string; durationMinutes: number } | null {
  if (!timeStr) return null
  const cleaned = timeStr.replace(/[–—]/g, '-').trim()
  const parts = cleaned.split('-').map(s => s.trim())
  if (parts.length < 2) return null

  const startPart = parts[0]
  const endPart = parts[1]

  const startTime = normalizeTimeTo24H(startPart)
  const endTime = normalizeTimeTo24H(endPart, startTime)

  const startMin = timeToMinutes(startTime)
  const endMin = timeToMinutes(endTime)

  let durationMinutes = endMin - startMin
  if (durationMinutes <= 0) {
    // If end is less than start, adjust or fallback
    durationMinutes = calculateDurationFromTimes(startTime, endTime)
  }

  return { startTime, endTime, durationMinutes: Math.max(15, durationMinutes) }
}

/**
 * Core workbook parser enforcing strict cohort isolation.
 */
export function parseCollegeTimetableWorkbook(
  workbook: XLSX.WorkBook,
  targetCohortName: string = DEFAULT_TARGET_COHORT_NAME,
  sourceFilename: string = 'college_timetable.xlsx'
): XlsxParseResult {
  const targetRegex = targetCohortName.toLowerCase().includes('elon')
    ? DEFAULT_TARGET_COHORT_REGEX
    : new RegExp(targetCohortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

  const allEntries: ExtractedXlsxSlot[] = []
  const detectedDates: Set<string> = new Set()
  const sheetsProcessed: string[] = []
  const otherCohortsFound: Set<string> = new Set()
  const warnings: string[] = []

  let lectureCount = 0
  let breakCount = 0
  let unassignedCount = 0

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    // Convert sheet to 2D array of rows
    const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { 
      header: 1, 
      defval: '' 
    })
    if (!rawRows || rawRows.length === 0) continue

    // Step 1: Find Date on this sheet (search top 10 rows)
    let sheetDate: string | undefined
    let sheetDayOfWeek = 1 // Default to Mon

    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const row = rawRows[r]
      for (const cell of row) {
        if (!cell) continue
        const { dateStr } = extractDateFromCell(String(cell))
        if (dateStr) {
          sheetDate = dateStr
          detectedDates.add(dateStr)
          sheetDayOfWeek = getDayOfWeekFromDate(dateStr)
          break
        }
      }
      if (sheetDate) break
    }

    // Fallback: If no date in cells, check sheet name (e.g. "Monday", "Tuesday", etc.)
    if (!sheetDate) {
      const dayMap: Record<string, number> = {
        monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0
      }
      const lowerSheet = sheetName.trim().toLowerCase()
      if (dayMap[lowerSheet] !== undefined) {
        sheetDayOfWeek = dayMap[lowerSheet]
      } else {
        // Skip sheets that are not day schedules (e.g. "Instructions", "Summary")
        continue
      }
    }

    // Step 2: Locate Header Row & Identify Cohort Column Dynamically
    let headerRowIdx = -1
    let timeColIdx = 0
    let targetCohortColIdx = -1
    const matchingCohortCols: number[] = []

    for (let r = 0; r < Math.min(12, rawRows.length); r++) {
      const row = rawRows[r]
      const hasTiming = row.some((c, cIdx) => {
        const str = String(c).trim().toLowerCase()
        if (str === 'timing' || str === 'time') {
          timeColIdx = cIdx
          return true
        }
        return false
      })

      if (hasTiming) {
        headerRowIdx = r
        // Scan for cohort columns in this header row
        row.forEach((cellVal, cIdx) => {
          if (cIdx === timeColIdx) return
          const str = String(cellVal).trim()
          if (!str) return

          if (targetRegex.test(str)) {
            matchingCohortCols.push(cIdx)
          } else if (/batch|cohort|huang|zuckerberg|section|btech/i.test(str) || str.length > 3) {
            otherCohortsFound.add(str)
          }
        })
        break
      }
    }

    // Strict validation: Expected cohort header MUST exist on valid timetable sheets
    if (headerRowIdx === -1) {
      warnings.push(`Sheet '${sheetName}' skipped: No 'Timing' header row detected.`)
      continue
    }

    if (matchingCohortCols.length === 0) {
      return {
        success: false,
        error: `Cohort '${targetCohortName}' header was NOT found on sheet '${sheetName}'. Found other cohort headers: [${Array.from(otherCohortsFound).join(', ') || 'None'}]. Import halted to protect academic integrity.`,
        cohortName: targetCohortName,
        otherCohortsFound: Array.from(otherCohortsFound),
        detectedDates: Array.from(detectedDates),
        totalEntries: 0,
        lectureCount: 0,
        breakCount: 0,
        unassignedCount: 0,
        entries: [],
        sheetsProcessed,
        warnings
      }
    }

    if (matchingCohortCols.length > 1) {
      return {
        success: false,
        error: `Multiple columns matched cohort '${targetCohortName}' on sheet '${sheetName}'. Import halted to avoid ambiguous timetable assignment.`,
        cohortName: targetCohortName,
        otherCohortsFound: Array.from(otherCohortsFound),
        detectedDates: Array.from(detectedDates),
        totalEntries: 0,
        lectureCount: 0,
        breakCount: 0,
        unassignedCount: 0,
        entries: [],
        sheetsProcessed,
        warnings
      }
    }

    targetCohortColIdx = matchingCohortCols[0]
    sheetsProcessed.push(sheetName)

    // Step 3: Parse Time Slots ONLY from targetCohortColIdx
    // The format is a 3-row block per slot:
    // Row 0: Timing (Col A) & Subject (Col B)
    // Row 1: "Faculty" (Col A) & Faculty Name (Col B)
    // Row 2: "Classroom No" (Col A) & Room (Col B)
    let r = headerRowIdx + 1
    let slotIdx = 1

    while (r < rawRows.length) {
      const timeCell = String(rawRows[r]?.[timeColIdx] || '').trim()
      if (!timeCell) {
        r++
        continue
      }

      // Check if timeCell contains a valid time range e.g. "09:00 AM - 10:00 AM"
      const parsedTime = parseTimeRange(timeCell)
      if (!parsedTime) {
        r++
        continue
      }

      // Extract cells strictly from the target cohort column
      const subjectCell = String(rawRows[r]?.[targetCohortColIdx] || '').trim()
      const facultyLabelCell = String(rawRows[r + 1]?.[timeColIdx] || '').trim().toLowerCase()
      const roomLabelCell = String(rawRows[r + 2]?.[timeColIdx] || '').trim().toLowerCase()

      let facultyCell = ''
      let roomCell = ''
      let rowsConsumed = 1

      if (facultyLabelCell.includes('faculty')) {
        facultyCell = String(rawRows[r + 1]?.[targetCohortColIdx] || '').trim()
        rowsConsumed = 2
      }

      if (roomLabelCell.includes('classroom') || roomLabelCell.includes('room')) {
        roomCell = String(rawRows[r + 2]?.[targetCohortColIdx] || '').trim()
        rowsConsumed = 3
      }

      // Determine slot type
      let slotType: TimetableSlotType = 'lecture'
      const subLower = subjectCell.toLowerCase()

      const isLunch = subLower.includes('lunch') || 
        String(rawRows[r]?.[0] || '').toLowerCase().includes('lunch') ||
        String(rawRows[r]?.[targetCohortColIdx] || '').toLowerCase().includes('lunch')

      const isBreak = subLower.includes('break') || subLower.includes('recess')

      if (isLunch) {
        slotType = 'lunch_break'
        breakCount++
      } else if (isBreak) {
        slotType = 'short_break'
        breakCount++
      } else if (!subjectCell || subLower.includes('unscheduled') || subLower.includes('independent study') || subLower.includes('free')) {
        slotType = 'unassigned'
        unassignedCount++
      } else {
        slotType = 'lecture'
        lectureCount++
      }

      // Map subject if academic lecture
      let subjectId: string | undefined
      if (slotType === 'lecture' && subjectCell) {
        const canonical = canonicalSubjectId(subjectCell)
        if (canonical) {
          subjectId = canonical
        } else {
          // Check common prefixes
          if (/dsa|data\s*structures/i.test(subjectCell)) subjectId = 'S5-CS01'
          else if (/llm|rag|agentic/i.test(subjectCell)) subjectId = 'S5-CS02'
          else if (/venture|product/i.test(subjectCell)) subjectId = 'S5-MS01'
          else if (/career|leadership/i.test(subjectCell)) subjectId = 'S5-MS02'
          else if (/software\s*testing|stqa/i.test(subjectCell)) subjectId = 'S5-CS03'
          else if (/foundations\s*of\s*ai|data\s*science/i.test(subjectCell)) subjectId = 'S5-CS04'
        }
      }

      const entryId = `xlsx-${sheetDate || sheetName.toLowerCase()}-${slotIdx++}`

      allEntries.push({
        id: entryId,
        dayOfWeek: sheetDayOfWeek,
        specificDate: sheetDate,
        startTime: parsedTime.startTime,
        endTime: parsedTime.endTime,
        durationMinutes: parsedTime.durationMinutes,
        slotType,
        subjectId,
        faculty: facultyCell || undefined,
        classroom: roomCell || undefined,
        notes: slotType === 'lunch_break' 
          ? 'Lunch Break' 
          : slotType === 'unassigned' 
          ? `Unscheduled for ${targetCohortName}` 
          : subjectCell || undefined,
        cohort: targetCohortName,
        sourceSheet: sheetName,
        sourceRow: r + 1,
        sourceScreenshot: sourceFilename,
        screenshotLabel: `${sheetName} (${sheetDate || 'Weekly'})`,
        provenanceNotes: `Extracted strictly from column '${targetCohortName}' (Sheet: ${sheetName}, Row: ${r + 1}). Other cohort data excluded.`,
        rawTimingStr: timeCell
      })

      r += rowsConsumed
    }
  }

  // Step 4: Overlap Detection within each date
  const dateGroups: Record<string, ExtractedXlsxSlot[]> = {}
  allEntries.forEach(entry => {
    const key = entry.specificDate || `day-${entry.dayOfWeek}`
    if (!dateGroups[key]) dateGroups[key] = []
    dateGroups[key].push(entry)
  })

  Object.values(dateGroups).forEach(group => {
    group.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    for (let i = 0; i < group.length - 1; i++) {
      const cur = group[i]
      const next = group[i + 1]
      const curEndMin = timeToMinutes(cur.endTime)
      const nextStartMin = timeToMinutes(next.startTime)
      if (curEndMin > nextStartMin) {
        cur.hasConflictWarning = true
        next.hasConflictWarning = true
        const overlapMins = curEndMin - nextStartMin
        cur.conflictDetails = `Overlaps with next slot (${next.startTime} - ${next.endTime}) by ${overlapMins} min.`
        next.conflictDetails = `Overlaps with previous slot (${cur.startTime} - ${cur.endTime}) by ${overlapMins} min.`
      }
    }
  })

  return {
    success: true,
    cohortName: targetCohortName,
    otherCohortsFound: Array.from(otherCohortsFound),
    detectedDates: Array.from(detectedDates).sort(),
    totalEntries: allEntries.length,
    lectureCount,
    breakCount,
    unassignedCount,
    entries: allEntries,
    sheetsProcessed,
    warnings
  }
}

/**
 * Convenience wrapper for client-side File / ArrayBuffer upload.
 */
export async function parseCollegeTimetableXLSX(
  data: ArrayBuffer | Uint8Array,
  targetCohortName: string = DEFAULT_TARGET_COHORT_NAME,
  sourceFilename: string = 'college_timetable.xlsx'
): Promise<XlsxParseResult> {
  try {
    const workbook = XLSX.read(data, { type: 'array' })
    return parseCollegeTimetableWorkbook(workbook, targetCohortName, sourceFilename)
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to parse Excel workbook: ${err.message || 'Corrupted or unsupported file format'}`,
      cohortName: targetCohortName,
      otherCohortsFound: [],
      detectedDates: [],
      totalEntries: 0,
      lectureCount: 0,
      breakCount: 0,
      unassignedCount: 0,
      entries: [],
      sheetsProcessed: [],
      warnings: []
    }
  }
}
