import React, { useState, useMemo } from 'react'
import { 
  CalendarClock, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  RotateCcw,
  Star,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { AttendanceStatus, Lecture } from '../types'
import { 
  formatDuration, 
  calculateDurationFromTimes, 
  normalizeTimeTo24H,
  formatTimeRangeTo12H
} from '../utils/timetableUtils'
import { isSameSubject } from '../utils/subjectUtils'
import { QuickAddLectureModal } from '../components/QuickAddLectureModal'

interface LecturesPageProps {
  onOpenAddLecture?: (subjectId?: string) => void
  onEditLecture?: (lecture: Lecture) => void
}

export const LecturesPage: React.FC<LecturesPageProps> = ({
  onOpenAddLecture,
  onEditLecture
}) => {
  const { subjects, lectures, updateLecture, deleteLecture, setLectureStatus, getSubject } = useApp()

  const todayStr = new Date().toISOString().split('T')[0]

  // View state
  const [activeView, setActiveView] = useState<'day' | 'week' | 'all'>('day')
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Expandable cards
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null)
  const [lectureToDelete, setLectureToDelete] = useState<Lecture | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Date navigation helpers
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const handleSetToday = () => {
    setSelectedDate(todayStr)
  }

  // Week calculation for week view
  const weekDates = useMemo(() => {
    const curr = new Date(selectedDate)
    const day = curr.getDay()
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const monday = new Date(curr.setDate(diff))
    
    const dates: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  }, [selectedDate])

  // Filter lectures
  const filteredLectures = useMemo(() => {
    return lectures.filter(lec => {
      // View date filtering
      if (activeView === 'day' && lec.date !== selectedDate) return false
      if (activeView === 'week' && !weekDates.includes(lec.date)) return false

      // Subject filter
      if (selectedSubjectId !== 'all' && !isSameSubject(lec.subjectId, selectedSubjectId)) return false

      // Status filter
      if (selectedStatus !== 'all' && lec.status !== selectedStatus) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = lec.title.toLowerCase().includes(q)
        const matchNotes = lec.notes?.toLowerCase().includes(q)
        const matchLearned = lec.whatILearned?.toLowerCase().includes(q)
        const sub = getSubject(lec.subjectId)
        const matchSub = sub?.name.toLowerCase().includes(q) || sub?.code.toLowerCase().includes(q)
        if (!matchTitle && !matchNotes && !matchLearned && !matchSub) return false
      }

      return true
    }).sort((a, b) => {
      // Sort by date desc, then by startTime (normalized 24h) or createdAt
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      if (a.startTime && b.startTime) return normalizeTimeTo24H(a.startTime).localeCompare(normalizeTimeTo24H(b.startTime))
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [lectures, activeView, selectedDate, weekDates, selectedSubjectId, selectedStatus, searchQuery, getSubject])

  // Summary counts for current view
  const viewCounts = useMemo(() => {
    const list = activeView === 'day' 
      ? lectures.filter(l => l.date === selectedDate)
      : activeView === 'week'
      ? lectures.filter(l => weekDates.includes(l.date))
      : lectures

    return {
      total: list.length,
      attended: list.filter(l => l.status === 'attended').length,
      absent: list.filter(l => l.status === 'absent').length,
      scheduled: list.filter(l => l.status === 'scheduled').length,
      cancelled: list.filter(l => l.status === 'cancelled').length
    }
  }, [lectures, activeView, selectedDate, weekDates])

  const openAddLecture = () => {
    if (onOpenAddLecture) {
      onOpenAddLecture(selectedSubjectId !== 'all' ? selectedSubjectId : undefined)
    } else {
      setEditingLecture(null)
      setIsModalOpen(true)
    }
  }

  const openEditLecture = (lec: Lecture) => {
    if (onEditLecture) {
      onEditLecture(lec)
    } else {
      setEditingLecture(lec)
      setIsModalOpen(true)
    }
  }

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'attended':
        return {
          label: 'Attended',
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400'
        }
      case 'absent':
        return {
          label: 'Absent',
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400'
        }
      case 'scheduled':
        return {
          label: 'Scheduled',
          bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          dot: 'bg-blue-400'
        }
      case 'cancelled':
        return {
          label: 'Cancelled',
          bg: 'bg-slate-700/40 text-slate-400 border-slate-600',
          dot: 'bg-slate-500'
        }
      case 'unmarked':
      default:
        return {
          label: 'Unmarked',
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400'
        }
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              Daily Lecture Management
            </span>
            <span className="text-xs text-slate-400 font-mono">
              6 Subjects • Independent Sessions
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1">
            My Lectures & Class Sessions
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Log lectures, track attendance session-by-session, and record what you learned in class.
          </p>
        </div>

        <button
          onClick={openAddLecture}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors self-start sm:self-auto focus-ring"
        >
          <Plus className="w-4 h-4" />
          <span>Log Lecture</span>
        </button>
      </div>

      {/* Date & View Bar */}
      <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293d] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 bg-[#0b0f19] p-1 rounded-lg border border-[#1e293d] self-start">
          <button
            onClick={() => setActiveView('day')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'day' 
                ? 'bg-blue-600 text-white font-semibold shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => setActiveView('week')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'week' 
                ? 'bg-blue-600 text-white font-semibold shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setActiveView('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === 'all' 
                ? 'bg-blue-600 text-white font-semibold shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All History
          </button>
        </div>

        {/* Date Navigator (Visible in Day & Week views) */}
        {activeView !== 'all' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShiftDate(activeView === 'day' ? -1 : -7)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#162035] border border-[#21304d] transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white font-mono focus-ring"
              />
              {selectedDate !== todayStr && (
                <button
                  onClick={handleSetToday}
                  className="px-2.5 py-1.5 rounded-lg bg-[#162035] hover:bg-[#1e2d4a] text-blue-300 border border-[#233554] text-xs font-medium transition-colors"
                >
                  Today
                </button>
              )}
            </div>

            <button
              onClick={() => handleShiftDate(activeView === 'day' ? 1 : 7)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#162035] border border-[#21304d] transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary Mini-Pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-[#0b0f19] border border-[#1e293d] text-slate-300">
            {viewCounts.total} sessions
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
            {viewCounts.attended} attended
          </span>
          {viewCounts.absent > 0 && (
            <span className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/25 text-rose-300">
              {viewCounts.absent} absent
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Subject Filter */}
        <div>
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#1e293d] text-xs text-slate-200 focus-ring"
          >
            <option value="all">All 6 Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#1e293d] text-xs text-slate-200 focus-ring"
          >
            <option value="all">All Attendance Statuses</option>
            <option value="attended">Attended Sessions</option>
            <option value="scheduled">Scheduled Sessions</option>
            <option value="absent">Absent Sessions</option>
            <option value="cancelled">Cancelled Sessions</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search topic, notes or concepts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#111827] border border-[#1e293d] text-xs text-slate-200 placeholder-slate-500 focus-ring"
          />
        </div>
      </div>

      {/* Lectures List */}
      <div className="space-y-3">
        {filteredLectures.length === 0 ? (
          <div className="p-12 rounded-xl bg-[#111827] border border-[#1e293d] text-center text-slate-400 text-xs">
            <CalendarClock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">
              No lectures recorded for this {activeView === 'day' ? 'date' : activeView === 'week' ? 'week' : 'filter'}.
            </p>
            <p className="mt-1 text-slate-400">
              Log your lectures to record what was taught and verify your attendance accurately.
            </p>
            <button
              onClick={openAddLecture}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log First Lecture</span>
            </button>
          </div>
        ) : (
          filteredLectures.map((lec) => {
            const sub = getSubject(lec.subjectId)
            const badge = getStatusBadge(lec.status)
            const isExpanded = expandedId === lec.id

            return (
              <div
                key={lec.id}
                className="p-4 sm:p-5 rounded-xl bg-[#111827] border border-[#1e293d] hover:border-slate-700 transition-all space-y-3"
              >
                {/* Header row: Subject, Status, Duration, Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-blue-400 bg-[#162035] px-2.5 py-0.5 rounded border border-[#21304d]">
                      {sub?.code || 'S5'}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">
                      {sub?.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold flex items-center gap-1.5 ${badge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                    {lec.isEdited && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700" title="This record was manually modified">
                        Edited
                      </span>
                    )}
                  </div>

                  {/* Quick Attendance Toggle buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => setLectureStatus(lec.id, 'attended')}
                      title="Mark Attended"
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                        lec.status === 'attended'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-[#152033] hover:bg-emerald-950/40 text-slate-400 hover:text-emerald-300 border-[#223352]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium hidden sm:inline">Attended</span>
                    </button>

                    <button
                      onClick={() => setLectureStatus(lec.id, 'absent')}
                      title="Mark Absent"
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                        lec.status === 'absent'
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-[#152033] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border-[#223352]'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium hidden sm:inline">Absent</span>
                    </button>

                    <button
                      onClick={() => openEditLecture(lec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] border border-[#21304d] transition-colors"
                      title="Edit Lecture Notes & Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setLectureToDelete(lec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#1e293b] border border-[#21304d] transition-colors"
                      title="Delete Lecture"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lecture Title & Time Info */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {lec.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono flex-wrap">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {lec.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      {formatDuration(lec.durationMinutes)}
                      {lec.startTime ? ` (${formatTimeRangeTo12H(lec.startTime, lec.endTime)})` : ''}
                    </span>
                    {lec.startTime && lec.endTime && calculateDurationFromTimes(lec.startTime, lec.endTime) !== lec.durationMinutes && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const corrected = calculateDurationFromTimes(lec.startTime!, lec.endTime!)
                          if (corrected > 0) updateLecture(lec.id, { durationMinutes: corrected })
                        }}
                        title={`Time slot spans ${calculateDurationFromTimes(lec.startTime, lec.endTime)} mins. Click to sync.`}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors font-mono"
                      >
                        ⚡ Sync to {calculateDurationFromTimes(lec.startTime, lec.endTime)}m
                      </button>
                    )}
                    {lec.faculty && (
                      <>
                        <span>•</span>
                        <span className="text-slate-300">Faculty: {lec.faculty}</span>
                      </>
                    )}
                    {lec.confidenceRating && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-300">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {lec.confidenceRating}/5
                        </span>
                      </>
                    )}
                    {lec.needsRevision && (
                      <span className="text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.2 rounded border border-amber-500/20 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" />
                        Needs Revision
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Snippet of What I Learned */}
                {lec.whatILearned && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0f19] p-3 rounded-lg border border-[#1b273d]">
                    <strong className="text-blue-300">What I Learned: </strong>
                    {lec.whatILearned}
                  </p>
                )}

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="pt-3 border-t border-[#1e293d] space-y-3 text-xs">
                    {lec.importantConcepts && lec.importantConcepts.length > 0 && (
                      <div>
                        <span className="font-semibold text-slate-300 block mb-1">Key Concepts:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {lec.importantConcepts.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-[#162035] text-blue-300 border border-[#21304d] text-[11px] font-mono">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {lec.doubtsOrQuestions && (
                      <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200">
                        <strong className="text-amber-300">Question for Professor: </strong>
                        {lec.doubtsOrQuestions}
                      </div>
                    )}

                    {lec.examplesOrCode && (
                      <div>
                        <span className="font-semibold text-slate-300 block mb-1 font-mono text-[11px]">
                          Code / Example:
                        </span>
                        <pre className="p-3 rounded-lg bg-[#080c14] border border-[#1b273d] text-slate-200 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                          {lec.examplesOrCode}
                        </pre>
                      </div>
                    )}

                    {lec.notes && (
                      <div className="text-slate-300">
                        <strong className="text-slate-200">Personal Notes: </strong>
                        {lec.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Toggle details button */}
                {(lec.importantConcepts || lec.doubtsOrQuestions || lec.examplesOrCode || lec.notes) && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : lec.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors pt-1"
                  >
                    <span>{isExpanded ? 'Hide Notes & Code' : 'View Full Notes & Code'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add / Edit Lecture Modal (only if not handled by root App) */}
      {!onOpenAddLecture && (
        <QuickAddLectureModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingLecture(null)
          }}
          initialDate={selectedDate}
          initialSubjectId={selectedSubjectId !== 'all' ? selectedSubjectId : undefined}
          editingLecture={editingLecture}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#111827] border border-blue-500/40 text-white text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {lectureToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Confirm Lecture Deletion
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to delete this lecture record?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#1e293d] space-y-1.5 text-xs">
              <div className="font-bold text-white">{lectureToDelete.title}</div>
              <div className="text-slate-400 font-mono flex items-center gap-2 flex-wrap">
                <span>{lectureToDelete.date}</span>
                <span>•</span>
                <span>{getSubject(lectureToDelete.subjectId)?.name || lectureToDelete.subjectId}</span>
                {lectureToDelete.startTime && (
                  <>
                    <span>•</span>
                    <span>{formatTimeRangeTo12H(lectureToDelete.startTime, lectureToDelete.endTime)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Warning impacts */}
            <div className="space-y-2 text-xs">
              {lectureToDelete.status === 'attended' && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200">
                  ⚠️ <strong>Attendance Impact:</strong> This session is currently recorded as <strong>Attended</strong>. Deleting it will decrement your attended session count and recalculate attendance standing for {getSubject(lectureToDelete.subjectId)?.name || 'this subject'}.
                </div>
              )}

              {lectureToDelete.status === 'absent' && (
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300">
                  ℹ️ <strong>Attendance Impact:</strong> This session was recorded as Absent. Deleting it will decrement total classes held.
                </div>
              )}

              {(lectureToDelete.whatILearned || lectureToDelete.notes || (lectureToDelete.importantConcepts && lectureToDelete.importantConcepts.length > 0)) && (
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200">
                  📝 <strong>Learning Content:</strong> Your personal study takeaways, concepts, and notes logged for this session will be removed.
                </div>
              )}

              {lectureToDelete.needsRevision && (
                <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/30 text-blue-200">
                  🔄 <strong>Revision Status:</strong> Active revision tracking flag for this lecture will be removed.
                </div>
              )}

              {lectureToDelete.linkedDocumentIds && lectureToDelete.linkedDocumentIds.length > 0 && (
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300">
                  📎 <strong>Document Links:</strong> {lectureToDelete.linkedDocumentIds.length} syllabus document attachment link(s) will be unlinked.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#1e293d] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLectureToDelete(null)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white bg-[#1e293b] hover:bg-[#283548] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteLecture(lectureToDelete.id)
                  setToastMessage(`Deleted lecture "${lectureToDelete.title}". Recalculated attendance and statistics.`)
                  setLectureToDelete(null)
                  setTimeout(() => setToastMessage(null), 4000)
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
