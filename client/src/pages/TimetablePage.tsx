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
  getDayOfWeekFromDate
} from '../utils/timetableUtils'
import { 
  canonicalSubjectId, 
  isSameSubject, 
  getDefaultFacultyForSubject 
} from '../utils/subjectUtils'

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
    const normEnd = normalizeTimeTo24H(formEndTime, true)
    const dur = Number(formDurationMinutes) || calculateDurationFromTimes(normStart, normEnd)

    const payload = {
      dayOfWeek: formIsRecurring ? formDayOfWeek : new Date(formSpecificDate).getDay(),
      specificDate: formIsRecurring ? undefined : formSpecificDate,
      startTime: normStart,
      endTime: normEnd,
      durationMinutes: dur,
      slotType: formSlotType,
      subjectId: formSlotType === 'lecture' ? canonicalSubjectId(formSubjectId) : undefined,
      faculty: formSlotType === 'lecture' ? formFaculty.trim() || undefined : undefined,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293d] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-blue-400" />
              University Timetable & Faculty
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
              12-Hour AM/PM Time
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official timetable blocks, faculty assignments, classroom locations & schedule conflict warnings in 12-hour format
          </p>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#0e1626] p-1 rounded-lg border border-[#1e293d] text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'day' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Day Schedule
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'week' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly Matrix
            </button>
          </div>

          <button
            onClick={() => handleOpenAddModal('lecture')}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Block</span>
          </button>
        </div>
      </div>

      {/* Quick Status Message */}
      {quickLogMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{quickLogMessage}</span>
        </div>
      )}

      {/* Conflict Warning Banner */}
      {activeConflicts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-bold text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Timetable Conflicts Detected for {viewMode === 'day' ? selectedDate : 'Weekly Schedule'} ({activeConflicts.length})</span>
            </div>
            <button
              onClick={handleAutoResolveConflicts}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-semibold transition-colors flex items-center gap-1 text-[11px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Resolve Conflicts & Align 24h</span>
            </button>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-amber-300/90 text-[11px]">
            {activeConflicts.map((c, idx) => (
              <li key={idx}>{c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[#0e1626] border border-[#1e293d]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShiftDate(-1)}
            className="p-1.5 rounded-lg bg-[#141f36] hover:bg-[#1b2b4a] text-slate-300 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#080d1a] border border-[#213254] text-xs font-mono text-white focus-ring"
          />

          <button
            onClick={() => handleShiftDate(1)}
            className="p-1.5 rounded-lg bg-[#141f36] hover:bg-[#1b2b4a] text-slate-300 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-slate-300 hidden md:inline ml-2">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Quick jump presets to verified screenshot dates and Today in Asia/Kolkata */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500">Quick Jump:</span>
          <button
            onClick={() => setSelectedDate(kolkataToday)}
            className={`text-[11px] px-2.5 py-1 rounded font-mono transition-colors ${
              selectedDate === kolkataToday
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-[#141f36] text-slate-400 hover:text-white border border-[#213254]'
            }`}
          >
            Today (IST)
          </button>
          <button
            onClick={() => setSelectedDate('2026-10-22')}
            className={`text-[11px] px-2.5 py-1 rounded font-mono transition-colors ${
              selectedDate === '2026-10-22'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-[#141f36] text-slate-400 hover:text-white border border-[#213254]'
            }`}
          >
            Thu 22 Oct (Historical)
          </button>
          <button
            onClick={() => setSelectedDate('2026-10-23')}
            className={`text-[11px] px-2.5 py-1 rounded font-mono transition-colors ${
              selectedDate === '2026-10-23'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-[#141f36] text-slate-400 hover:text-white border border-[#213254]'
            }`}
          >
            Fri 23 Oct (Historical)
          </button>
        </div>
      </div>

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="space-y-3">
          {daySlots.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0b0f19] border border-dashed border-[#1e293d] space-y-3">
              <CalendarClock className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Timetable Blocks Scheduled</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No lectures or timetable blocks scheduled for {selectedDate}. You can add a date-specific lecture or set up a recurring weekly schedule for {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                <button
                  onClick={() => handleOpenAddModal('lecture')}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add One-Off Lecture</span>
                </button>
                <button
                  onClick={() => handleOpenAddModalForDay(currentDayOfWeek)}
                  className="px-4 py-2 rounded-lg bg-[#141f36] hover:bg-[#1e2c4c] text-blue-300 border border-blue-500/30 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Recurring Schedule</span>
                </button>
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
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isBreak
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : isFree
                      ? 'bg-slate-900/40 border-slate-700/50'
                      : 'bg-[#0e1626] border-[#1e293d] hover:border-[#2b3c5e]'
                  }`}
                >
                  {/* Left Column: Timing & Slot Type Indicator */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="text-center shrink-0 w-32 sm:w-36 bg-[#090e1a] p-2 rounded-lg border border-[#1b273d]">
                      <span className="block font-mono text-xs sm:text-sm font-bold text-blue-400">
                        {formatTimeRangeTo12H(slot.startTime, slot.endTime)}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {formatDuration(slot.durationMinutes)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {slot.slotType === 'lecture' && sub && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                            {sub.code}
                          </span>
                        )}
                        {slot.slotType === 'lunch_break' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Coffee className="w-3 h-3" /> Lunch Break
                          </span>
                        )}
                        {slot.slotType === 'short_break' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Short Break
                          </span>
                        )}
                        {slot.slotType === 'unassigned' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            Unassigned Slot
                          </span>
                        )}
                        {slot.slotType === 'free_period' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Free Period
                          </span>
                        )}
                        {slot.classroom && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-[#131d33] px-2 py-0.5 rounded border border-[#21304d]">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            {slot.classroom}
                          </span>
                        )}
                        {slot.isHoliday && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Holiday Exception
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white mt-1">
                        {slot.slotType === 'lecture' ? sub?.name || 'Academic Lecture' : slot.slotType === 'lunch_break' ? 'University Lunch Break' : 'Open Slot'}
                      </h3>

                      {/* Faculty & Notes */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                        {slot.faculty && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <User className="w-3 h-3 text-blue-400" />
                            Faculty: <strong className="text-white">{slot.faculty}</strong>
                          </span>
                        )}
                        {slot.notes && (
                          <span className="text-slate-400 italic">
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
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Logged
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickLog(slot, 'attended')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                            title="Log as Attended Lecture"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Log Attended</span>
                          </button>
                          <button
                            onClick={() => handleQuickLog(slot, 'absent')}
                            className="px-2.5 py-1 rounded-lg bg-[#141f36] hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-xs font-medium border border-[#213254] transition-colors"
                            title="Log as Absent Lecture"
                          >
                            <span>Absent</span>
                          </button>
                        </div>
                      )
                    )}

                    <button
                      onClick={() => handleOpenEditModal(slot)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#18243c] transition-colors"
                      title="Edit Block"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEntryToDelete(slot)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#18243c] transition-colors"
                      title="Delete Block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* WEEKLY MATRIX VIEW (All 7 Weekdays) */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {ALL_WEEK_DAYS.map(day => {
            const dayEntries = timetableEntries
              .filter(e => e.dayOfWeek === day.dayNum)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))

            return (
              <div key={day.dayNum} className="p-3 rounded-xl bg-[#0e1626] border border-[#1e293d] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="border-b border-[#1b273d] pb-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {day.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {dayEntries.length} {dayEntries.length === 1 ? 'slot' : 'slots'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenAddModalForDay(day.dayNum)}
                      className="p-1 rounded hover:bg-blue-600/20 text-slate-400 hover:text-blue-300 transition-colors"
                      title={`Add schedule block for ${day.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {dayEntries.length === 0 ? (
                    <div className="p-4 text-center rounded-lg bg-[#080d1a]/50 border border-dashed border-[#1b2844] space-y-2 mt-3">
                      <p className="text-[11px] text-slate-400">No scheduled blocks</p>
                      <button
                        onClick={() => handleOpenAddModalForDay(day.dayNum)}
                        className="px-2 py-1 rounded bg-[#141f36] hover:bg-blue-600/30 text-blue-300 border border-blue-500/20 text-[10px] font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Schedule</span>
                      </button>
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
                            className={`p-2 rounded-lg border text-xs cursor-pointer hover:border-blue-500 transition-all ${
                              isBreak
                                ? 'bg-amber-950/20 border-amber-500/20 text-amber-300'
                                : 'bg-[#080d1a] border-[#1b2844] text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                              <span>{formatTimeRangeTo12H(entry.startTime, entry.endTime)}</span>
                              <span>{entry.durationMinutes}m</span>
                            </div>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <p className="font-bold text-xs truncate">
                                {entry.slotType === 'lecture' ? sub?.code || entry.subjectId : entry.slotType.replace('_', ' ').toUpperCase()}
                              </p>
                              {entry.specificDate ? (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-300/80 font-mono shrink-0">
                                  {entry.specificDate.slice(5)}
                                </span>
                              ) : (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-300/80 font-mono shrink-0">
                                  Weekly
                                </span>
                              )}
                            </div>
                            {entry.faculty && (
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {entry.faculty}
                              </p>
                            )}
                            {entry.classroom && (
                              <p className="text-[9px] text-slate-500 truncate mt-0.5 font-mono">
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
      )}

      {/* Add / Edit Timetable Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-[#0f172a] border border-[#1e293d] rounded-2xl shadow-2xl overflow-hidden my-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#1e293d] flex items-center justify-between bg-[#111c33]">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {editingEntry ? 'Edit Timetable Block' : 'Add Timetable Block'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
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
              <div className="pt-3 border-t border-[#1e293d] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-[#141f36] hover:bg-[#1b2b4a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs transition-colors"
                >
                  {editingEntry ? 'Update Block' : 'Save Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Timetable Entry Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Confirm Timetable Block Deletion
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to remove this block from the schedule?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#1e293d] space-y-1.5 text-xs">
              <div className="font-bold text-white">
                {entryToDelete.slotType === 'lecture' 
                  ? `${subjects.find(s => isSameSubject(s.id, entryToDelete.subjectId))?.name || 'Academic Lecture'}` 
                  : entryToDelete.slotType === 'lunch_break' 
                  ? 'Lunch Break' 
                  : entryToDelete.notes || 'Timetable Slot'}
              </div>
              <div className="text-slate-400 font-mono flex items-center gap-2 flex-wrap">
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
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Related Attendance Log Preserved</span>
                </div>
                <p className="leading-relaxed">
                  This timetable block has already been logged into <strong>My Lectures</strong> and counts toward your attendance. Deleting it from the timetable removes it from this schedule view, but does <strong>NOT</strong> delete your historical lecture record or attendance credit.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-[#1e293d] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white bg-[#1e293b] hover:bg-[#283548] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTimetableEntry(entryToDelete.id)
                  setQuickLogMessage('Removed timetable block from schedule.')
                  setEntryToDelete(null)
                  setTimeout(() => setQuickLogMessage(null), 4000)
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
