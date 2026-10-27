import React, { useState, useMemo, useRef } from 'react'
import { 
  CalendarClock, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Coffee, 
  MapPin, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  X,
  FileSpreadsheet,
  CheckCheck,
  Upload,
  ShieldCheck
} from 'lucide-react'
import { parseCollegeTimetableXLSX } from '../services/xlsxTimetableParser'
import { useApp } from '../context/AppContext'
import type { TimetableEntry, TimetableSlotType, AttendanceStatus } from '../types'
import { 
  formatDuration, 
  calculateDurationFromTimes, 
  calculateEndTimeFromDuration,
  normalizeTimeTo24H,
  formatTimeTo12H,
  formatTimeRangeTo12H,
  getKolkataDateString,
  ALL_WEEK_DAYS,
  getEntriesForDate,
  detectTimetableConflicts,
  getDayOfWeekFromDate,
  validateTimes,
  timeToMinutes
} from '../utils/timetableUtils'
import { 
  canonicalSubjectId, 
  isSameSubject, 
  getDefaultFacultyForSubject 
} from '../utils/subjectUtils'
import { resolveFacultyName, resolveFacultyId } from '../data/facultyData'
import { OFFICIAL_EXTRACTED_TIMETABLE, type ExtractedTimetableItem } from '../data/officialTimetableExtract'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

interface TimetablePageProps {
  onOpenQuickLecture?: (subjectId?: string) => void
  onNavigateToAttendance?: () => void
}

export const TimetablePage: React.FC<TimetablePageProps> = ({ 
  onOpenQuickLecture: _onOpenQuickLecture,
  onNavigateToAttendance
}) => {
  const { 
    subjects, 
    timetableEntries, 
    addTimetableEntry, 
    updateTimetableEntry, 
    deleteTimetableEntry, 
    importTimetableEntries,
    logTimetableAsLecture,
    removeTimetableLectureLog,
    getTimetableSlotLecture,
    getAllSubjectAttendanceStats,
    lectures,
    profile
  } = useApp()

  const subjectStats = useMemo(() => {
    return getAllSubjectAttendanceStats()
  }, [getAllSubjectAttendanceStats, lectures])

  const statsMap = useMemo(() => {
    const map = new Map<string, (typeof subjectStats)[0]>()
    for (const stat of subjectStats) {
      map.set(stat.subjectId, stat)
    }
    return map
  }, [subjectStats])

  // View state: 'day' | 'week'
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  
  // Date state: default to actual current date in Asia/Kolkata timezone
  const [selectedDate, setSelectedDate] = useState<string>(() => getKolkataDateString())
  
  // Modals & Editing
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null)
  const [entryToDelete, setEntryToDelete] = useState<TimetableEntry | null>(null)
  const [quickLogMessage, setQuickLogMessage] = useState<string | null>(null)

  // Official Timetable Import Modal State & XLSX Ingestion
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isParsingXlsx, setIsParsingXlsx] = useState(false)
  const [xlsxParseError, setXlsxParseError] = useState<string | null>(null)
  const [xlsxCohortInfo, setXlsxCohortInfo] = useState<{ target: string; others: string[] } | null>({
    target: 'Elon Musk 2024',
    others: ['Jensen Huang 2024']
  })
  const [autoSyncLectures, setAutoSyncLectures] = useState(true)

  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [extractItems, setExtractItems] = useState<ExtractedTimetableItem[]>(() => [...OFFICIAL_EXTRACTED_TIMETABLE])
  const [selectedExtractIds, setSelectedExtractIds] = useState<Set<string>>(() => new Set(OFFICIAL_EXTRACTED_TIMETABLE.map(e => e.id)))
  const [importDayFilter, setImportDayFilter] = useState<string>('all')
  const [editingExtractItem, setEditingExtractItem] = useState<ExtractedTimetableItem | null>(null)

  // Dynamic available dates in extract (zero hardcoding)
  const availableDatesInExtract = useMemo(() => {
    const dates = new Set<string>()
    extractItems.forEach(e => {
      if (e.specificDate) dates.add(e.specificDate)
    })
    return Array.from(dates).sort()
  }, [extractItems])

  const handleXlsxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsingXlsx(true)
    setXlsxParseError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await parseCollegeTimetableXLSX(arrayBuffer, 'Elon Musk 2024', file.name)

      if (!result.success) {
        setXlsxParseError(result.error || 'Failed to parse college timetable workbook.')
        setIsImportModalOpen(true)
        setIsParsingXlsx(false)
        return
      }

      setExtractItems(result.entries)
      setSelectedExtractIds(new Set(result.entries.map(item => item.id)))
      setXlsxCohortInfo({
        target: result.cohortName,
        others: result.otherCohortsFound
      })
      setImportDayFilter('all')
      setIsImportModalOpen(true)
    } catch (err: any) {
      setXlsxParseError(`Error reading spreadsheet: ${err.message || 'Unknown error'}`)
      setIsImportModalOpen(true)
    } finally {
      setIsParsingXlsx(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleToggleExtractSelect = (id: string) => {
    setSelectedExtractIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAllExtracts = () => {
    setSelectedExtractIds(new Set(extractItems.map(e => e.id)))
  }

  const handleDeselectAllExtracts = () => {
    setSelectedExtractIds(new Set())
  }

  const handleSelectLecturesOnlyExtracts = () => {
    setSelectedExtractIds(new Set(extractItems.filter(e => e.slotType === 'lecture').map(e => e.id)))
  }

  const handleRejectExtractItem = (id: string) => {
    setExtractItems(prev => prev.filter(e => e.id !== id))
    setSelectedExtractIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleSaveEditedExtractItem = (updated: ExtractedTimetableItem) => {
    setExtractItems(prev => prev.map(e => e.id === updated.id ? updated : e))
    setEditingExtractItem(null)
  }

  const handleCommitOfficialImport = () => {
    const toImport = extractItems
      .filter(e => selectedExtractIds.has(e.id))
      .map(({ sourceScreenshot: _s, screenshotLabel: _l, provenanceNotes: _p, hasConflictWarning: _h, ...rest }) => rest as TimetableEntry)

    if (toImport.length === 0) {
      alert('Please select at least one timetable entry to import.')
      return
    }

    const res = importTimetableEntries(toImport)

    let syncedLectures = 0
    if (autoSyncLectures) {
      toImport.forEach(entry => {
        if (entry.slotType === 'lecture' && entry.subjectId) {
          logTimetableAsLecture(entry.id, 'scheduled')
          syncedLectures++
        }
      })
    }

    setQuickLogMessage(
      `Official Timetable Import Complete: ${res.added} added, ${res.updated} updated, ${res.skipped} already current.${
        syncedLectures > 0 ? ` (${syncedLectures} scheduled lectures synced to My Lectures)` : ''
      }`
    )
    setIsImportModalOpen(false)
    setTimeout(() => setQuickLogMessage(null), 5000)
  }

  // Form state
  const [formSlotType, setFormSlotType] = useState<TimetableSlotType>('lecture')
  const [formSubjectId, setFormSubjectId] = useState<string>('S5-CS01')
  const [formStartTime, setFormStartTime] = useState<string>('10:00')
  const [formEndTime, setFormEndTime] = useState<string>('11:00')
  const [formDurationMinutes, setFormDurationMinutes] = useState<number>(60)
  const [formFaculty, setFormFaculty] = useState<string>('')
  const [formClassroom, setFormClassroom] = useState<string>('Classroom 37')
  const [formNotes, setFormNotes] = useState<string>('')
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1) // Default to Monday (1)
  const [formSpecificDate, setFormSpecificDate] = useState<string>(() => getKolkataDateString())
  const [formIsRecurring, setFormIsRecurring] = useState<boolean>(false)

  // Faculty autocomplete / custom add
  const existingFaculties = useMemo(() => {
    const list = new Set<string>()
    subjects.forEach(s => { if (s.faculty) list.add(s.faculty) })
    timetableEntries.forEach(e => { if (e.faculty) list.add(e.faculty) })
    return Array.from(list)
  }, [subjects, timetableEntries])

  // Shift date helper without timezone offset corruption
  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() + days)
    const nextY = dt.getFullYear()
    const nextM = String(dt.getMonth() + 1).padStart(2, '0')
    const nextD = String(dt.getDate()).padStart(2, '0')
    setSelectedDate(`${nextY}-${nextM}-${nextD}`)
  }

  // Calculate day of week for selectedDate (0=Sun, 1=Mon, ..., 6=Sat) safely
  const currentDayOfWeek = useMemo(() => {
    return getDayOfWeekFromDate(selectedDate)
  }, [selectedDate])

  // Filter slots for selectedDate using audited getEntriesForDate (merges specific overrides & recurring)
  const daySlots = useMemo(() => {
    return getEntriesForDate(timetableEntries, selectedDate)
  }, [timetableEntries, selectedDate])

  // Genuine conflicts for selectedDate (in Day view) or across recurring/specific days (in Week view)
  const activeConflicts = useMemo(() => {
    if (viewMode === 'day') {
      return detectTimetableConflicts(timetableEntries, selectedDate)
    } else {
      return detectTimetableConflicts(timetableEntries)
    }
  }, [timetableEntries, selectedDate, viewMode])

  // Synchronize start & end times with duration in form
  const handleStartTimeChange = (newStart: string) => {
    setFormStartTime(newStart)
    if (newStart && formEndTime) {
      const diff = calculateDurationFromTimes(newStart, formEndTime)
      if (diff > 0) setFormDurationMinutes(diff)
    } else if (newStart && formDurationMinutes > 0) {
      setFormEndTime(calculateEndTimeFromDuration(newStart, formDurationMinutes))
    }
  }

  const handleEndTimeChange = (newEnd: string) => {
    setFormEndTime(newEnd)
    if (formStartTime && newEnd) {
      const diff = calculateDurationFromTimes(formStartTime, newEnd)
      if (diff > 0) setFormDurationMinutes(diff)
    }
  }

  const handleDurationPreset = (mins: number) => {
    setFormDurationMinutes(mins)
    if (formStartTime) {
      setFormEndTime(calculateEndTimeFromDuration(formStartTime, mins))
    }
  }

  const handleOpenAddModal = (slotType: TimetableSlotType = 'lecture') => {
    setEditingEntry(null)
    setFormSlotType(slotType)
    const initialSubId = subjects[0]?.id || 'S5-CS01'
    setFormSubjectId(initialSubId)
    setFormStartTime('10:00')
    setFormEndTime('11:00')
    setFormDurationMinutes(60)
    setFormFaculty(subjects[0]?.faculty || getDefaultFacultyForSubject(initialSubId))
    setFormClassroom('Classroom 37')
    setFormNotes('')
    setFormDayOfWeek(currentDayOfWeek)
    setFormSpecificDate(selectedDate)
    setFormIsRecurring(false)
    setIsModalOpen(true)
  }

  const handleOpenAddModalForDay = (dayNum: number, slotType: TimetableSlotType = 'lecture') => {
    setEditingEntry(null)
    setFormSlotType(slotType)
    const initialSubId = subjects[0]?.id || 'S5-CS01'
    setFormSubjectId(initialSubId)
    setFormStartTime('10:00')
    setFormEndTime('11:00')
    setFormDurationMinutes(60)
    setFormFaculty(subjects[0]?.faculty || getDefaultFacultyForSubject(initialSubId))
    setFormClassroom('Classroom 37')
    setFormNotes('')
    setFormDayOfWeek(dayNum)
    setFormSpecificDate(selectedDate)
    setFormIsRecurring(true)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry)
    setFormSlotType(entry.slotType)
    const subId = entry.subjectId ? canonicalSubjectId(entry.subjectId) : (subjects[0]?.id || 'S5-CS01')
    setFormSubjectId(subId)
    setFormStartTime(entry.startTime)
    setFormEndTime(entry.endTime)
    setFormDurationMinutes(entry.durationMinutes)
    setFormFaculty(entry.faculty || '')
    setFormClassroom(entry.classroom || '')
    setFormNotes(entry.notes || '')
    setFormDayOfWeek(entry.dayOfWeek)
    setFormSpecificDate(entry.specificDate || selectedDate)
    setFormIsRecurring(!entry.specificDate)
    setIsModalOpen(true)
  }

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault()
    const normStart = normalizeTimeTo24H(formStartTime)
    const normEnd = normalizeTimeTo24H(formEndTime, normStart)
    const timeValidation = validateTimes(normStart, normEnd)
    if (!timeValidation.isValid) {
      alert(timeValidation.error || 'End time must be after start time.')
      return
    }
    const dur = Math.max(15, timeToMinutes(normEnd) - timeToMinutes(normStart))

    const canonSubId = formSlotType === 'lecture' ? canonicalSubjectId(formSubjectId) : undefined
    const faculty = formSlotType === 'lecture'
      ? resolveFacultyName(undefined, canonSubId, formFaculty)
      : undefined
    const facultyId = formSlotType === 'lecture' ? resolveFacultyId(canonSubId, faculty) : undefined

    const payload = {
      dayOfWeek: formIsRecurring ? formDayOfWeek : new Date(formSpecificDate).getDay(),
      specificDate: formIsRecurring ? undefined : formSpecificDate,
      startTime: normStart,
      endTime: normEnd,
      durationMinutes: dur,
      slotType: formSlotType,
      subjectId: canonSubId,
      faculty,
      facultyId,
      classroom: formClassroom.trim() || undefined,
      notes: formNotes.trim() || undefined
    }

    if (editingEntry) {
      updateTimetableEntry(editingEntry.id, payload)
    } else {
      addTimetableEntry(payload)
    }
    setIsModalOpen(false)
  }

  const isSlotLogged = (entry: TimetableEntry, dateStr?: string) => {
    return !!getTimetableSlotLecture(entry, dateStr || selectedDate)
  }

  const handleToggleAttendance = (entry: TimetableEntry, targetStatus: AttendanceStatus) => {
    const targetDate = entry.specificDate || selectedDate
    const existing = getTimetableSlotLecture(entry, targetDate)
    const sub = subjects.find(s => isSameSubject(s.id, entry.subjectId))
    const subName = sub?.name || 'Class'

    if (existing && existing.status === targetStatus) {
      // User tapped the same status again -> toggle off (reset to unrecorded)
      removeTimetableLectureLog(entry.id, targetDate)
      setQuickLogMessage(`↺ Reset attendance for "${subName}" on ${targetDate}.`)
    } else {
      logTimetableAsLecture(entry.id, targetStatus, targetDate)
      const isPresent = targetStatus === 'attended'
      setQuickLogMessage(
        isPresent
          ? `✓ Marked Present for "${subName}". Attendance updated!`
          : `⚠ Marked Absent for "${subName}". Attendance updated!`
      )
    }
    setTimeout(() => setQuickLogMessage(null), 3500)
  }

  const handleAutoResolveConflicts = () => {
    activeConflicts.forEach(c => {
      const e1 = timetableEntries.find(e => e.id === c.entryId1)
      const e2 = timetableEntries.find(e => e.id === c.entryId2)
      if (e1 && e2) {
        if (e1.slotType === 'unassigned' || e1.slotType === 'free_period') {
          deleteTimetableEntry(e1.id)
        } else if (e2.slotType === 'unassigned' || e2.slotType === 'free_period') {
          deleteTimetableEntry(e2.id)
        }
      }
    })
    setQuickLogMessage('Auto-resolved timetable conflicts for this schedule.')
    setTimeout(() => setQuickLogMessage(null), 4000)
  }

  // Summary counts for selected day
  const lectureSlotCount = useMemo(() => daySlots.filter(s => s.slotType === 'lecture').length, [daySlots])
  const breakSlotCount = useMemo(() => daySlots.filter(s => s.slotType === 'lunch_break' || s.slotType === 'short_break').length, [daySlots])

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              Timetable
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
              {profile.cohort || 'Elon Musk 2024'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Weekly academic schedule, verified faculty & 12-hour slot tracking
          </p>
        </div>

        {/* View Mode & Actions Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented Switch (Linear style) */}
          <div className="inline-flex items-center rounded-md border border-border bg-secondary/40 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'day' 
                  ? 'bg-background text-foreground shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'week' 
                  ? 'bg-background text-foreground shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleXlsxFileUpload}
            className="hidden"
            aria-label="Upload Timetable Excel File"
          />

          <Button
            variant="outline"
            size="sm"
            onPress={() => fileInputRef.current?.click()}
            className="text-xs h-8 px-2.5 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Upload official college timetable spreadsheet (.xlsx)"
            isDisabled={isParsingXlsx}
          >
            <Upload className="w-3.5 h-3.5 mr-1 text-primary" />
            {isParsingXlsx ? 'Parsing...' : 'Upload .xlsx'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onPress={() => setIsImportModalOpen(true)}
            className="text-xs h-8 px-2.5 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Review or re-import extracted timetable entries"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
            Review / Import
          </Button>

          <Button
            variant="default"
            size="sm"
            onPress={() => handleOpenAddModal('lecture')}
            className="text-xs h-8 px-3 font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Block
          </Button>
        </div>
      </div>

      {/* Quick Status Message */}
      {quickLogMessage && (
        <div className="p-2.5 rounded-md bg-secondary/80 border border-border text-foreground text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{quickLogMessage}</span>
          </div>
          {onNavigateToAttendance && (
            <button
              type="button"
              onClick={onNavigateToAttendance}
              className="text-xs text-primary hover:underline font-medium cursor-pointer shrink-0"
            >
              View in Attendance →
            </button>
          )}
        </div>
      )}

      {/* Conflict Warning Banner */}
      {activeConflicts.length > 0 && (
        <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Schedule Conflicts ({activeConflicts.length})</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onPress={handleAutoResolveConflicts}
              className="text-[11px] h-6 px-2 font-medium border-amber-500/40 text-amber-200 hover:bg-amber-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3 mr-1 text-amber-400" />
              Auto-Resolve
            </Button>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-amber-300/80 text-[11px]">
            {activeConflicts.map((c, idx) => (
              <li key={idx}>{c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Clean Date Navigation Bar (Functional Linear Style) */}
      <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-card border border-border flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Previous Day */}
          <Button
            variant="outline"
            size="sm"
            onPress={() => handleShiftDate(-1)}
            className="h-8 w-8 p-0 cursor-pointer shrink-0"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {/* Native HTML Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="h-8 px-2.5 rounded-md bg-secondary/50 border border-border text-xs font-mono text-foreground focus-ring cursor-pointer hover:border-border/80"
            aria-label="Select Date"
          />

          {/* Next Day */}
          <Button
            variant="outline"
            size="sm"
            onPress={() => handleShiftDate(1)}
            className="h-8 w-8 p-0 cursor-pointer shrink-0"
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Today Button */}
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setSelectedDate(getKolkataDateString())}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer font-normal"
            title="Jump to Current Date in Asia/Kolkata (IST)"
          >
            Today
          </Button>

          {/* Formatted Date */}
          <span className="text-xs font-medium text-foreground ml-1 hidden sm:inline-block">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Day & Slot Count Summary Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-xs font-medium text-foreground sm:hidden">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <div className="text-[11px] font-mono text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded border border-border/80">
            {lectureSlotCount} {lectureSlotCount === 1 ? 'lecture' : 'lectures'}
            {breakSlotCount > 0 ? ` • ${breakSlotCount} break` : ''}
          </div>
        </div>
      </div>

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="space-y-2">
          {daySlots.length === 0 ? (
            /* Minimalist Empty State */
            <div className="p-8 sm:p-12 text-center rounded-lg bg-card border border-dashed border-border space-y-3">
              <CalendarClock className="w-8 h-8 text-muted-foreground/60 stroke-[1.5] mx-auto" />
              <div>
                <h3 className="text-sm font-medium text-foreground">No timetable blocks scheduled</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-0.5">
                  No classes or activities found for {selectedDate}. You can add a single lecture or import the weekly timetable workbook.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <Button
                  variant="default"
                  size="sm"
                  onPress={() => handleOpenAddModal('lecture')}
                  className="text-xs h-8 px-3 cursor-pointer font-medium"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Lecture Block
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleOpenAddModalForDay(currentDayOfWeek)}
                  className="text-xs h-8 px-3 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Add Weekly Recurring
                </Button>
              </div>
            </div>
          ) : (
            daySlots.map(slot => {
              const sub = subjects.find(s => s.id === slot.subjectId || isSameSubject(s.id, slot.subjectId))
              const isBreak = slot.slotType === 'lunch_break' || slot.slotType === 'short_break'
              const isFree = slot.slotType === 'free_period' || slot.slotType === 'unassigned'
              const slotLecture = slot.slotType === 'lecture' ? getTimetableSlotLecture(slot, selectedDate) : undefined
              const attendanceStatus = slotLecture?.status
              const subStat = sub ? statsMap.get(sub.id) : undefined

              return (
                <div
                  key={slot.id}
                  className={`group relative flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg border transition-colors ${
                    isBreak
                      ? 'bg-secondary/20 border-border/80 border-l-2 border-l-amber-500/50'
                      : isFree
                      ? 'bg-secondary/10 border-border/60 border-l-2 border-l-muted-foreground/40 opacity-80'
                      : 'bg-card border-border hover:border-border/90 border-l-2 border-l-primary/70'
                  }`}
                >
                  {/* Left Column: Timing & Slot Metadata */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* Time Box (Quiet Monospace Typography) */}
                    <div className="shrink-0 w-28 sm:w-32 bg-secondary/40 py-1.5 px-2 rounded border border-border/80 text-center">
                      <span className="block font-mono text-xs font-semibold text-foreground tracking-tight">
                        {formatTimeRangeTo12H(slot.startTime, slot.endTime)}
                      </span>
                      <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                        {formatDuration(slot.durationMinutes)}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {slot.slotType === 'lecture' && sub && (
                          <Badge variant="outline" className="text-[11px] font-mono text-foreground border-border">
                            {sub.code}
                          </Badge>
                        )}
                        {slot.slotType === 'lunch_break' && (
                          <Badge variant="warning" className="text-[11px] flex items-center gap-1 font-mono">
                            <Coffee className="w-3 h-3" /> Lunch Break
                          </Badge>
                        )}
                        {slot.slotType === 'short_break' && (
                          <Badge variant="warning" className="text-[11px] font-mono">
                            Break
                          </Badge>
                        )}
                        {slot.slotType === 'unassigned' && (
                          <Badge variant="secondary" className="text-[11px] text-muted-foreground font-mono">
                            Unassigned
                          </Badge>
                        )}
                        {slot.slotType === 'free_period' && (
                          <Badge variant="secondary" className="text-[11px] font-mono">
                            Open Study
                          </Badge>
                        )}
                        {slot.classroom && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded border border-border/60 font-mono">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {slot.classroom}
                          </span>
                        )}
                        {slot.isHoliday && (
                          <Badge variant="destructive" className="text-[10px]">
                            Holiday
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-sm font-medium text-foreground tracking-tight leading-snug">
                        {slot.slotType === 'lecture' ? sub?.name || 'Academic Lecture' : slot.slotType === 'lunch_break' ? 'Lunch Break' : slot.notes || 'Open Slot'}
                      </h3>

                      {/* Faculty & Notes */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {resolveFacultyName(slot.facultyId, slot.subjectId, slot.faculty) && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{resolveFacultyName(slot.facultyId, slot.subjectId, slot.faculty)}</span>
                          </span>
                        )}
                        {slot.notes && slot.slotType === 'lecture' && (
                          <span className="text-muted-foreground/80 italic">
                            "{slot.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Attendance Log & Edit / Delete */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-1 md:pt-0">
                    {slot.slotType === 'lecture' && (
                      <div className="flex items-center gap-2">
                        {/* Live Subject Attendance Pill */}
                        {subStat && subStat.percentage !== null && (
                          <Badge 
                            variant={subStat.isWarning ? 'destructive' : 'outline'}
                            className="text-[11px] font-mono border-border text-muted-foreground px-2 py-0.5 hidden sm:inline-flex"
                            title={`Attendance for ${sub?.name || 'Subject'}: ${subStat.attended}/${subStat.totalHeld} held (${subStat.percentage}%)`}
                          >
                            {subStat.attended}/{subStat.totalHeld} ({subStat.percentage}%)
                          </Badge>
                        )}

                        {/* Interactive Present / Absent Segmented Toggle */}
                        <div className="inline-flex items-center rounded-md border border-border bg-secondary/50 p-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(slot, 'attended')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                              attendanceStatus === 'attended'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs font-semibold'
                                : 'text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={attendanceStatus === 'attended' ? 'Click to unmark Present' : 'Mark Present (Attended)'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(slot, 'absent')}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                              attendanceStatus === 'absent'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-xs font-semibold'
                                : 'text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10'
                            }`}
                            title={attendanceStatus === 'absent' ? 'Click to unmark Absent' : 'Mark Absent'}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => handleOpenEditModal(slot)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Edit Block"
                      aria-label="Edit Block"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => setEntryToDelete(slot)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Delete Block"
                      aria-label="Delete Block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* WEEKLY MATRIX VIEW (All 7 Weekdays) */}
      {viewMode === 'week' && (
        <div className="space-y-3">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Regular Weekly Schedule
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              Date-Specific Override
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {ALL_WEEK_DAYS.map(day => {
              const dayEntries = timetableEntries
                .filter(e => e.dayOfWeek === day.dayNum)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))

              return (
                <div key={day.dayNum} className="p-3 rounded-lg bg-card border border-border flex flex-col justify-between">
                  <div>
                    <div className="border-b border-border/80 pb-2 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          {day.name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {dayEntries.length} {dayEntries.length === 1 ? 'slot' : 'slots'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => handleOpenAddModalForDay(day.dayNum)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        title={`Add schedule block for ${day.name}`}
                        aria-label={`Add schedule block for ${day.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {dayEntries.length === 0 ? (
                      <div className="p-4 text-center rounded-md bg-secondary/10 border border-dashed border-border/80 space-y-2 mt-2">
                        <p className="text-[11px] text-muted-foreground">No blocks</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onPress={() => handleOpenAddModalForDay(day.dayNum)}
                          className="text-[10px] h-6 px-2 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 mt-2">
                        {dayEntries.map(entry => {
                          const sub = subjects.find(s => isSameSubject(s.id, entry.subjectId))
                          const isBreak = entry.slotType === 'lunch_break' || entry.slotType === 'short_break'
                          return (
                            <div 
                              key={entry.id}
                              onClick={() => handleOpenEditModal(entry)}
                              className={`p-2 rounded border text-xs cursor-pointer transition-colors hover:border-border/90 ${
                                isBreak
                                  ? 'bg-secondary/20 border-border/80 text-amber-200'
                                  : 'bg-secondary/40 border-border text-foreground'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                                <span>{formatTimeRangeTo12H(entry.startTime, entry.endTime)}</span>
                                <span>{entry.durationMinutes}m</span>
                              </div>
                              <div className="flex items-center justify-between gap-1 mt-1">
                                <p className="font-medium text-xs leading-snug break-words">
                                  {entry.slotType === 'lecture' ? sub?.code || entry.subjectId : entry.slotType.replace('_', ' ').toUpperCase()}
                                </p>
                                {entry.specificDate && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-border text-muted-foreground font-mono shrink-0">
                                    {entry.specificDate.slice(5)}
                                  </Badge>
                                )}
                              </div>
                              {resolveFacultyName(entry.facultyId, entry.subjectId, entry.faculty) && (
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                  {resolveFacultyName(entry.facultyId, entry.subjectId, entry.faculty)}
                                </p>
                              )}
                              {entry.classroom && (
                                <p className="text-[9px] text-muted-foreground/80 truncate mt-0.5 font-mono">
                                  📍 {entry.classroom}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Timetable Modal (Linear Dialog Style) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  {editingEntry ? 'Edit Timetable Block' : 'Add Timetable Block'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto text-xs">
              {/* Slot Type */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Block Type
                </label>
                <select
                  value={formSlotType}
                  onChange={e => setFormSlotType(e.target.value as TimetableSlotType)}
                  className="w-full px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border text-foreground focus-ring"
                >
                  <option value="lecture">Academic Lecture</option>
                  <option value="lunch_break">Lunch Break (Excluded from Attendance)</option>
                  <option value="short_break">Short Break (Excluded from Attendance)</option>
                  <option value="free_period">Free Period (Open Study)</option>
                  <option value="unassigned">Unassigned Slot</option>
                </select>
              </div>

              {/* Subject (Only if Lecture) */}
              {formSlotType === 'lecture' && (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Subject (6 Active Scope)
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={e => {
                      setFormSubjectId(e.target.value)
                      const sel = subjects.find(s => isSameSubject(s.id, e.target.value))
                      if (sel && sel.faculty && !formFaculty) setFormFaculty(sel.faculty)
                    }}
                    className="w-full px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border text-foreground focus-ring font-medium"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name} ({s.totalHours} hrs)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Timing & Duration */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Start {formStartTime && <span className="text-foreground font-mono text-[10px]">({formatTimeTo12H(formStartTime)})</span>}
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={e => handleStartTimeChange(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-md bg-secondary/50 border border-border text-foreground focus-ring font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    End {formEndTime && <span className="text-foreground font-mono text-[10px]">({formatTimeTo12H(formEndTime)})</span>}
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={e => handleEndTimeChange(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-md bg-secondary/50 border border-border text-foreground focus-ring font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="5"
                    required
                    value={formDurationMinutes}
                    onChange={e => setFormDurationMinutes(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-md bg-secondary/50 border border-border text-foreground focus-ring font-mono"
                  />
                </div>
              </div>

              {/* Duration Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground font-mono">Quick Duration:</span>
                {[30, 40, 60, 90, 120, 180].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleDurationPreset(mins)}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                      formDurationMinutes === mins
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
                    }`}
                  >
                    {mins === 60 ? '60m (1h)' : mins === 120 ? '120m (2h)' : mins === 180 ? '180m (3h)' : `${mins}m`}
                  </button>
                ))}
              </div>

              {/* Faculty Selection & Add */}
              {formSlotType === 'lecture' && (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Faculty / Professor
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={formFaculty}
                      onChange={e => setFormFaculty(e.target.value)}
                      placeholder="e.g. Sanjay Sahu (VF) or Dr. Dipanjan"
                      className="w-full px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border text-foreground focus-ring"
                    />
                    {/* Faculty suggestion chips */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">Known Faculty:</span>
                      {existingFaculties.slice(0, 5).map(fac => (
                        <button
                          key={fac}
                          type="button"
                          onClick={() => setFormFaculty(fac)}
                          className="text-[10px] px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 cursor-pointer"
                        >
                          {fac}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Classroom */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Classroom / Location
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formClassroom}
                    onChange={e => setFormClassroom(e.target.value)}
                    placeholder="e.g. Classroom 37"
                    className="w-full px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border text-foreground focus-ring"
                  />
                  {['Classroom 37', 'Classroom 20', 'Lab 4'].map(room => (
                    <button
                      key={room}
                      type="button"
                      onClick={() => setFormClassroom(room)}
                      className="text-[10px] px-2 py-1.5 rounded bg-secondary text-muted-foreground hover:text-foreground border border-border shrink-0 cursor-pointer"
                    >
                      {room}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Recurrence */}
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">
                    Schedule Scope
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={formIsRecurring}
                      onChange={e => setFormIsRecurring(e.target.checked)}
                      className="rounded bg-secondary border-border text-primary focus-ring"
                    />
                    <span>Recurring Every Week</span>
                  </label>
                </div>

                {formIsRecurring ? (
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Day of the Week</label>
                    <select
                      value={formDayOfWeek}
                      onChange={e => setFormDayOfWeek(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border text-foreground"
                    >
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                      <option value={0}>Sunday</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Specific Date</label>
                    <input
                      type="date"
                      value={formSpecificDate}
                      onChange={e => setFormSpecificDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border text-foreground font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Topic / Session Notes
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Unit 2: Graph Algorithms & SCC"
                  className="w-full px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border text-foreground focus-ring"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onPress={() => setIsModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="cursor-pointer font-medium"
                >
                  {editingEntry ? 'Update Block' : 'Save Block'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Timetable Entry Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-destructive/30 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  Confirm Timetable Block Deletion
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to remove this block from the schedule?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-md bg-secondary/30 border border-border space-y-1 text-xs">
              <div className="font-semibold text-foreground">
                {entryToDelete.slotType === 'lecture' 
                  ? `${subjects.find(s => isSameSubject(s.id, entryToDelete.subjectId))?.name || 'Academic Lecture'}` 
                  : entryToDelete.slotType === 'lunch_break' 
                  ? 'Lunch Break' 
                  : entryToDelete.notes || 'Timetable Slot'}
              </div>
              <div className="text-muted-foreground font-mono flex items-center gap-2 flex-wrap">
                <span>{entryToDelete.specificDate || `Every ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][entryToDelete.dayOfWeek]}`}</span>
                <span>•</span>
                <span>{formatTimeRangeTo12H(entryToDelete.startTime, entryToDelete.endTime)}</span>
                {entryToDelete.classroom && (
                  <>
                    <span>•</span>
                    <span>{entryToDelete.classroom}</span>
                  </>
                )}
                {entryToDelete.faculty && (
                  <>
                    <span>•</span>
                    <span>{entryToDelete.faculty}</span>
                  </>
                )}
              </div>
            </div>

            {/* Attendance & Logging Warning */}
            {entryToDelete.slotType === 'lecture' && isSlotLogged(entryToDelete) && (
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs space-y-1">
                <div className="font-semibold text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Related Attendance Log Preserved</span>
                </div>
                <p className="leading-relaxed">
                  This timetable block has already been logged into <strong>My Lectures</strong> and counts toward your attendance. Deleting it from the timetable removes it from this schedule view, but does <strong>NOT</strong> delete your historical lecture record or attendance credit.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onPress={() => setEntryToDelete(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onPress={() => {
                  deleteTimetableEntry(entryToDelete.id)
                  setQuickLogMessage('Removed timetable block from schedule.')
                  setEntryToDelete(null)
                  setTimeout(() => setQuickLogMessage(null), 4000)
                }}
                className="cursor-pointer font-medium"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Official Weekly Timetable Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl max-w-4xl w-full p-4 sm:p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-semibold text-foreground">
                      Official Timetable Import
                    </h2>
                    <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {xlsxCohortInfo?.target || 'Elon Musk 2024'} Only
                    </Badge>
                    {xlsxCohortInfo && xlsxCohortInfo.others.length > 0 && (
                      <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border">
                        Excluded: {xlsxCohortInfo.others.join(', ')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Strict cohort isolation. Zero invented data — verify, edit, or reject before saving.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Parse Error Banner */}
            {xlsxParseError && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/25 text-destructive text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Import Halted</span>
                </div>
                <p>{xlsxParseError}</p>
              </div>
            )}

            {/* Controls Bar: Filters & Selection */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-border/60 shrink-0">
              {/* Dynamic Day filter pills */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] font-medium text-muted-foreground mr-1">Date:</span>
                <button
                  onClick={() => setImportDayFilter('all')}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    importDayFilter === 'all'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({extractItems.length})
                </button>
                {availableDatesInExtract.map(d => {
                  const count = extractItems.filter(e => e.specificDate === d).length
                  const dt = new Date(d + 'T12:00:00')
                  const label = dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
                  return (
                    <button
                      key={d}
                      onClick={() => setImportDayFilter(d)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                        importDayFilter === d
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  )
                })}
              </div>

              {/* Selection actions & Re-upload */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => fileInputRef.current?.click()}
                  className="h-6 text-[10px] px-2 cursor-pointer text-muted-foreground hover:text-foreground"
                  title="Upload another Excel spreadsheet"
                >
                  <Upload className="w-3 h-3 mr-1 text-primary" />
                  Upload .xlsx
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleSelectAllExtracts}
                  className="h-6 text-[10px] px-2 cursor-pointer"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleDeselectAllExtracts}
                  className="h-6 text-[10px] px-2 cursor-pointer"
                >
                  Deselect All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleSelectLecturesOnlyExtracts}
                  className="h-6 text-[10px] px-2 cursor-pointer"
                >
                  Lectures Only
                </Button>
              </div>
            </div>

            {/* List / Preview area */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1 min-h-[200px]">
              {extractItems
                .filter(item => importDayFilter === 'all' || item.specificDate === importDayFilter)
                .map(item => {
                  const isChecked = selectedExtractIds.has(item.id)
                  const sub = subjects.find(s => isSameSubject(s.id, item.subjectId))
                  
                  // Check existing status in current timetable
                  const existingMatch = timetableEntries.find(e => 
                    e.id === item.id || 
                    (
                      (e.specificDate && item.specificDate ? e.specificDate === item.specificDate : e.dayOfWeek === item.dayOfWeek) &&
                      e.startTime === item.startTime &&
                      e.endTime === item.endTime &&
                      isSameSubject(e.subjectId, item.subjectId)
                    )
                  )
                  const isIdentical = existingMatch &&
                    existingMatch.faculty === item.faculty &&
                    existingMatch.classroom === item.classroom &&
                    existingMatch.notes === item.notes &&
                    existingMatch.slotType === item.slotType

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-lg border transition-colors text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                        isChecked 
                          ? 'bg-card border-border' 
                          : 'bg-secondary/20 border-border/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleExtractSelect(item.id)}
                          className="mt-1 rounded bg-secondary border-border text-primary cursor-pointer focus-ring"
                          aria-label={`Select slot ${item.startTime} ${item.notes || sub?.name}`}
                        />
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-medium text-foreground">
                              {formatTimeRangeTo12H(item.startTime, item.endTime)}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({item.durationMinutes}m)
                            </span>
                            <span className="text-[11px] font-medium text-primary">
                              {item.specificDate ? new Date(item.specificDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : `Day ${item.dayOfWeek}`}
                            </span>

                            {/* Slot type badge */}
                            <Badge
                              variant="outline"
                              className="text-[10px] capitalize border-border"
                            >
                              {item.slotType.replace('_', ' ')}
                            </Badge>

                            {/* Match / Conflict Status */}
                            {existingMatch ? (
                              isIdentical ? (
                                <Badge variant="success" className="text-[10px]">
                                  In Schedule
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="text-[10px]">
                                  Will Update
                                </Badge>
                              )
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                                New Block
                              </Badge>
                            )}

                            {item.hasConflictWarning && (
                              <Badge variant="destructive" className="text-[10px]">
                                Overlap Flagged
                              </Badge>
                            )}
                          </div>

                          {/* Subject / Title */}
                          <div className="font-medium text-foreground text-sm flex items-center gap-2 flex-wrap">
                            <span>{sub?.name || item.notes || (item.slotType === 'lunch_break' ? 'Lunch Break' : 'Timetable Slot')}</span>
                            {item.notes && sub && (
                              <span className="text-xs text-muted-foreground">({item.notes})</span>
                            )}
                          </div>

                          {/* Faculty, Classroom, Provenance */}
                          <div className="flex items-center gap-2.5 text-muted-foreground text-[11px] flex-wrap">
                            {item.faculty && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span className="text-foreground">{item.faculty}</span>
                              </span>
                            )}
                            {item.classroom && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span>{item.classroom}</span>
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-muted-foreground/80">
                              📷 {item.sourceScreenshot}
                            </span>
                          </div>

                          {/* Provenance notes */}
                          {item.provenanceNotes && (
                            <p className="text-[10px] text-muted-foreground/80 italic pt-0.5">
                              {item.provenanceNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => setEditingExtractItem(item)}
                          className="h-6 text-xs px-2 cursor-pointer text-muted-foreground hover:text-foreground"
                          title="Edit this entry before importing"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => handleRejectExtractItem(item.id)}
                          className="h-6 text-xs px-2 cursor-pointer text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          title="Reject / Remove from import"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedExtractIds.size}</span> of {extractItems.length} selected.
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={autoSyncLectures}
                    onChange={e => setAutoSyncLectures(e.target.checked)}
                    className="rounded bg-secondary border-border text-primary cursor-pointer focus-ring"
                  />
                  <span>Sync lectures to My Lectures (empty topic pointers)</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setIsImportModalOpen(false)}
                  className="cursor-pointer text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onPress={handleCommitOfficialImport}
                  className="cursor-pointer text-xs h-8 font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  Import Selected ({selectedExtractIds.size})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Extracted Timetable Item Sub-Modal */}
      {editingExtractItem && (
        <div className="fixed inset-0 z-60 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                Edit Extracted Entry Before Import
              </h3>
              <button
                onClick={() => setEditingExtractItem(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close edit modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={editingExtractItem.startTime}
                    onChange={e => {
                      const startTime = e.target.value
                      const dur = editingExtractItem.endTime ? calculateDurationFromTimes(startTime, editingExtractItem.endTime) : editingExtractItem.durationMinutes
                      setEditingExtractItem(prev => prev ? { ...prev, startTime, durationMinutes: dur > 0 ? dur : prev.durationMinutes } : null)
                    }}
                    className="w-full px-2.5 py-1.5 rounded-md bg-secondary border border-border text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={editingExtractItem.endTime}
                    onChange={e => {
                      const endTime = e.target.value
                      const dur = editingExtractItem.startTime ? calculateDurationFromTimes(editingExtractItem.startTime, endTime) : editingExtractItem.durationMinutes
                      setEditingExtractItem(prev => prev ? { ...prev, endTime, durationMinutes: dur > 0 ? dur : prev.durationMinutes } : null)
                    }}
                    className="w-full px-2.5 py-1.5 rounded-md bg-secondary border border-border text-foreground font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Subject</label>
                <select
                  value={editingExtractItem.subjectId || ''}
                  onChange={e => setEditingExtractItem(prev => prev ? { ...prev, subjectId: e.target.value || undefined } : null)}
                  className="w-full px-2.5 py-1.5 rounded-md bg-secondary border border-border text-foreground"
                >
                  <option value="">(Non-Subject / Activity / Break)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code || s.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Faculty (Exact)</label>
                <input
                  type="text"
                  value={editingExtractItem.faculty || ''}
                  onChange={e => setEditingExtractItem(prev => prev ? { ...prev, faculty: e.target.value } : null)}
                  placeholder="e.g. Sanjay Sahu (VF)"
                  className="w-full px-2.5 py-1.5 rounded-md bg-secondary border border-border text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Classroom (Exact)</label>
                <input
                  type="text"
                  value={editingExtractItem.classroom || ''}
                  onChange={e => setEditingExtractItem(prev => prev ? { ...prev, classroom: e.target.value } : null)}
                  placeholder="e.g. Classroom No. - 37"
                  className="w-full px-2.5 py-1.5 rounded-md bg-secondary border border-border text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Session Notes / Provenance Details</label>
                <input
                  type="text"
                  value={editingExtractItem.notes || ''}
                  onChange={e => setEditingExtractItem(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="e.g. Interactive Session"
                  className="w-full px-2.5 py-1.5 rounded-md bg-secondary border border-border text-foreground"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onPress={() => setEditingExtractItem(null)}
                className="cursor-pointer text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onPress={() => handleSaveEditedExtractItem(editingExtractItem)}
                className="cursor-pointer text-xs h-8 font-medium"
              >
                Apply Edit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
