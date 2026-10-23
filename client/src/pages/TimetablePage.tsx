import React, { useState, useMemo } from 'react'
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
  X
} from 'lucide-react'
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
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

interface TimetablePageProps {
  onOpenQuickLecture?: (subjectId?: string) => void
}

export const TimetablePage: React.FC<TimetablePageProps> = ({ onOpenQuickLecture: _onOpenQuickLecture }) => {
  const { 
    subjects, 
    timetableEntries, 
    addTimetableEntry, 
    updateTimetableEntry, 
    deleteTimetableEntry, 
    logTimetableAsLecture,
    lectures
  } = useApp()

  // View state: 'day' | 'week'
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  
  // Date state: default to actual current date in Asia/Kolkata timezone
  const kolkataToday = useMemo(() => getKolkataDateString(), [])
  const [selectedDate, setSelectedDate] = useState<string>(() => getKolkataDateString())
  
  // Modals & Editing
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null)
  const [entryToDelete, setEntryToDelete] = useState<TimetableEntry | null>(null)
  const [quickLogMessage, setQuickLogMessage] = useState<string | null>(null)

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

  const handleQuickLog = (entry: TimetableEntry, status: AttendanceStatus = 'attended') => {
    const lectureId = logTimetableAsLecture(entry.id, status)
    if (lectureId) {
      const sub = subjects.find(s => isSameSubject(s.id, entry.subjectId))
      setQuickLogMessage(`Logged "${sub?.name || 'Class'}" as ${status.toUpperCase()} (${entry.durationMinutes} mins) in My Lectures.`)
      setTimeout(() => setQuickLogMessage(null), 4000)
    }
  }

  // Check if a timetable slot has already been logged as a lecture
  const isSlotLogged = (entry: TimetableEntry) => {
    const targetDate = entry.specificDate || selectedDate
    return lectures.some(l => 
      l.date === targetDate && 
      isSameSubject(l.subjectId, entry.subjectId) && 
      (l.startTime === entry.startTime || l.title === entry.notes)
    )
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              University Timetable & Faculty
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
              12-Hour Format
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official timetable blocks, verified faculty assignments & schedule conflict detection
          </p>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-secondary/50 p-1 rounded-md border border-border text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'day' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Day Schedule
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'week' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Weekly Matrix
            </button>
          </div>

          <Button
            variant="default"
            size="sm"
            onPress={() => handleOpenAddModal('lecture')}
            className="text-xs h-8 px-3 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Block
          </Button>
        </div>
      </div>

      {/* Quick Status Message */}
      {quickLogMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{quickLogMessage}</span>
        </div>
      )}

      {/* Conflict Warning Banner */}
      {activeConflicts.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-semibold text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Timetable Conflicts Detected for {viewMode === 'day' ? selectedDate : 'Weekly Schedule'} ({activeConflicts.length})</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onPress={handleAutoResolveConflicts}
              className="text-[11px] h-7 px-2.5 font-medium border-amber-500/40 text-amber-200 hover:bg-amber-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Auto-Resolve & Align 24h
            </Button>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-amber-300/80 text-[11px]">
            {activeConflicts.map((c, idx) => (
              <li key={idx}>{c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onPress={() => handleShiftDate(-1)}
            className="h-8 w-8 p-0 cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-secondary/40 border border-border text-xs font-mono text-foreground focus-ring"
          />

          <Button
            variant="outline"
            size="sm"
            onPress={() => handleShiftDate(1)}
            className="h-8 w-8 p-0 cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <span className="text-xs font-medium text-muted-foreground hidden md:inline ml-2">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Quick jump presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground">Quick Jump:</span>
          <Button
            variant={selectedDate === kolkataToday ? 'default' : 'outline'}
            size="sm"
            onPress={() => setSelectedDate(kolkataToday)}
            className="text-[11px] font-mono h-7 px-2.5 cursor-pointer"
          >
            Today (IST)
          </Button>
          {[
            { date: '2026-10-21', label: 'Wed 21 Oct' },
            { date: '2026-10-22', label: 'Thu 22 Oct' },
            { date: '2026-10-23', label: 'Fri 23 Oct' }
          ]
            .filter(item => item.date !== kolkataToday)
            .map(item => (
              <Button
                key={item.date}
                variant={selectedDate === item.date ? 'default' : 'outline'}
                size="sm"
                onPress={() => setSelectedDate(item.date)}
                className="text-[11px] font-mono h-7 px-2.5 cursor-pointer"
              >
                {item.label}
              </Button>
            ))}
        </div>
      </div>

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="space-y-3">
          {daySlots.length === 0 ? (
            <div className="p-10 text-center rounded-lg bg-card border border-dashed border-border space-y-3">
              <CalendarClock className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">No Timetable Blocks Scheduled</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No lectures or timetable blocks scheduled for {selectedDate}. You can add a date-specific lecture or configure a weekly schedule.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <Button
                  variant="default"
                  size="sm"
                  onPress={() => handleOpenAddModal('lecture')}
                  className="text-xs h-8 px-3 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add One-Off Lecture
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleOpenAddModalForDay(currentDayOfWeek)}
                  className="text-xs h-8 px-3 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Recurring Schedule
                </Button>
              </div>
            </div>
          ) : (
            daySlots.map(slot => {
              const sub = subjects.find(s => s.id === slot.subjectId)
              const isBreak = slot.slotType === 'lunch_break' || slot.slotType === 'short_break'
              const isFree = slot.slotType === 'free_period' || slot.slotType === 'unassigned'
              const alreadyLogged = slot.slotType === 'lecture' && isSlotLogged(slot)

              return (
                <div
                  key={slot.id}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isBreak
                      ? 'bg-amber-950/15 border-amber-500/25'
                      : isFree
                      ? 'bg-secondary/30 border-border'
                      : 'bg-card border-border hover:border-primary/30'
                  }`}
                >
                  {/* Left Column: Timing & Slot Type Indicator */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="text-center shrink-0 w-32 sm:w-36 bg-secondary/40 p-2 rounded-md border border-border">
                      <span className="block font-mono text-xs sm:text-sm font-semibold text-primary">
                        {formatTimeRangeTo12H(slot.startTime, slot.endTime)}
                      </span>
                      <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                        {formatDuration(slot.durationMinutes)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {slot.slotType === 'lecture' && sub && (
                          <Badge variant="outline" className="text-[11px] font-mono text-primary border-primary/30">
                            {sub.code}
                          </Badge>
                        )}
                        {slot.slotType === 'lunch_break' && (
                          <Badge variant="secondary" className="text-[11px] text-amber-300 border-amber-500/30 flex items-center gap-1">
                            <Coffee className="w-3 h-3" /> Lunch Break
                          </Badge>
                        )}
                        {slot.slotType === 'short_break' && (
                          <Badge variant="secondary" className="text-[11px] text-amber-300 border-amber-500/30">
                            Short Break
                          </Badge>
                        )}
                        {slot.slotType === 'unassigned' && (
                          <Badge variant="outline" className="text-[11px] text-muted-foreground border-border">
                            Unassigned Slot
                          </Badge>
                        )}
                        {slot.slotType === 'free_period' && (
                          <Badge variant="secondary" className="text-[11px]">
                            Free Period
                          </Badge>
                        )}
                        {slot.classroom && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 bg-secondary/40 px-2 py-0.5 rounded border border-border">
                            <MapPin className="w-3 h-3 text-destructive" />
                            {slot.classroom}
                          </span>
                        )}
                        {slot.isHoliday && (
                          <Badge variant="destructive" className="text-[10px]">
                            Holiday Exception
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-foreground mt-1">
                        {slot.slotType === 'lecture' ? sub?.name || 'Academic Lecture' : slot.slotType === 'lunch_break' ? 'University Lunch Break' : 'Open Slot'}
                      </h3>

                      {/* Faculty & Notes */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        {resolveFacultyName(slot.facultyId, slot.subjectId, slot.faculty) && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <User className="w-3 h-3" />
                            Faculty: <strong className="text-foreground font-medium">{resolveFacultyName(slot.facultyId, slot.subjectId, slot.faculty)}</strong>
                          </span>
                        )}
                        {slot.notes && (
                          <span className="text-muted-foreground italic">
                            "{slot.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Attendance Log & Edit / Delete */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {slot.slotType === 'lecture' && (
                      alreadyLogged ? (
                        <Badge variant="outline" className="text-xs px-2.5 py-1 text-emerald-400 border-emerald-500/30 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Logged
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="default"
                            size="sm"
                            onPress={() => handleQuickLog(slot, 'attended')}
                            className="h-7 text-xs px-2.5 cursor-pointer font-medium"
                            title="Log as Attended Lecture"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Log Attended
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onPress={() => handleQuickLog(slot, 'absent')}
                            className="h-7 text-xs px-2 cursor-pointer text-muted-foreground hover:text-destructive"
                            title="Log as Absent Lecture"
                          >
                            Absent
                          </Button>
                        </div>
                      )
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => handleOpenEditModal(slot)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Edit Block"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => setEntryToDelete(slot)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Delete Block"
                    >
                      <Trash2 className="w-4 h-4" />
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
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              Regular Weekly Schedule
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Date-Specific Override
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {ALL_WEEK_DAYS.map(day => {
              const dayEntries = timetableEntries
                .filter(e => e.dayOfWeek === day.dayNum)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))

              return (
                <div key={day.dayNum} className="p-3 rounded-lg bg-card border border-border space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="border-b border-border pb-2 flex items-center justify-between">
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
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {dayEntries.length === 0 ? (
                      <div className="p-4 text-center rounded-md bg-secondary/20 border border-dashed border-border space-y-2 mt-2">
                        <p className="text-[11px] text-muted-foreground">No scheduled blocks</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onPress={() => handleOpenAddModalForDay(day.dayNum)}
                          className="text-[10px] h-6 px-2 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Schedule
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {dayEntries.map(entry => {
                          const sub = subjects.find(s => isSameSubject(s.id, entry.subjectId))
                          const isBreak = entry.slotType === 'lunch_break' || entry.slotType === 'short_break'
                          return (
                            <div 
                              key={entry.id}
                              onClick={() => handleOpenEditModal(entry)}
                              className={`p-2 rounded-md border text-xs cursor-pointer transition-all hover:border-primary/40 ${
                                isBreak
                                  ? 'bg-amber-950/15 border-amber-500/20 text-amber-200'
                                  : 'bg-secondary/30 border-border text-foreground'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                                <span>{formatTimeRangeTo12H(entry.startTime, entry.endTime)}</span>
                                <span>{entry.durationMinutes}m</span>
                              </div>
                              <div className="flex items-center justify-between gap-1 mt-1">
                                <p className="font-semibold text-xs leading-snug break-words">
                                  {entry.slotType === 'lecture' ? sub?.code || entry.subjectId : entry.slotType.replace('_', ' ').toUpperCase()}
                                </p>
                                {entry.specificDate && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-300 font-mono shrink-0">
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

      {/* Add / Edit Timetable Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  {editingEntry ? 'Edit Timetable Block' : 'Add Timetable Block'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Slot Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Block Type
                </label>
                <select
                  value={formSlotType}
                  onChange={e => setFormSlotType(e.target.value as TimetableSlotType)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subject (6 Active Scope)
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={e => {
                      setFormSubjectId(e.target.value)
                      const sel = subjects.find(s => isSameSubject(s.id, e.target.value))
                      if (sel && sel.faculty && !formFaculty) setFormFaculty(sel.faculty)
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring font-medium"
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Start Time {formStartTime && <span className="text-blue-400 font-mono text-[10px]">({formatTimeTo12H(formStartTime)})</span>}
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={e => handleStartTimeChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    End Time {formEndTime && <span className="text-blue-400 font-mono text-[10px]">({formatTimeTo12H(formEndTime)})</span>}
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={e => handleEndTimeChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="5"
                    required
                    value={formDurationMinutes}
                    onChange={e => setFormDurationMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring font-mono"
                  />
                </div>
              </div>

              {/* Duration Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-mono">Quick Duration:</span>
                {[30, 40, 60, 90, 120, 180].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleDurationPreset(mins)}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors ${
                      formDurationMinutes === mins
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#152033] text-slate-400 hover:text-white border border-[#233554]'
                    }`}
                  >
                    {mins === 60 ? '60m (1h)' : mins === 120 ? '120m (2h)' : mins === 180 ? '180m (3h)' : `${mins}m`}
                  </button>
                ))}
              </div>

              {/* Faculty Selection & Add */}
              {formSlotType === 'lecture' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Faculty / Professor
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={formFaculty}
                      onChange={e => setFormFaculty(e.target.value)}
                      placeholder="e.g. Sanjay Sahu (VF) or Dr. Dipanjan"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                    />
                    {/* Faculty suggestion chips */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-slate-500">Known Faculty:</span>
                      {existingFaculties.slice(0, 5).map(fac => (
                        <button
                          key={fac}
                          type="button"
                          onClick={() => setFormFaculty(fac)}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#131d33] hover:bg-[#1a2744] text-slate-300 border border-[#203152]"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Classroom / Location
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formClassroom}
                    onChange={e => setFormClassroom(e.target.value)}
                    placeholder="e.g. Classroom 37"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                  />
                  {['Classroom 37', 'Lab 4', 'Auditorium'].map(room => (
                    <button
                      key={room}
                      type="button"
                      onClick={() => setFormClassroom(room)}
                      className="text-[10px] px-2 py-1.5 rounded bg-[#141f36] text-slate-300 border border-[#213254] shrink-0"
                    >
                      {room}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Recurrence */}
              <div className="pt-2 border-t border-[#1e293d] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Schedule Scope
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={formIsRecurring}
                      onChange={e => setFormIsRecurring(e.target.checked)}
                      className="rounded bg-[#0b0f19] border-[#21304d] text-blue-600 focus-ring"
                    />
                    <span>Recurring Every Week</span>
                  </label>
                </div>

                {formIsRecurring ? (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Day of the Week</label>
                    <select
                      value={formDayOfWeek}
                      onChange={e => setFormDayOfWeek(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white"
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
                    <label className="block text-[11px] text-slate-400 mb-1">Specific Date</label>
                    <input
                      type="date"
                      value={formSpecificDate}
                      onChange={e => setFormSpecificDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Topic / Session Notes
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Unit 2: Graph Algorithms & SCC"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
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
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-destructive/30 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">
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
    </div>
  )
}
