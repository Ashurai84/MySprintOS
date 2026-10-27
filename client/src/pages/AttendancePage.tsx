import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  FileText
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { isSameSubject } from '../utils/subjectUtils'
import type { AttendanceStatus, Lecture, Subject } from '../types'

interface AttendancePageProps {
  onOpenQuickLecture?: (subjectId?: string) => void
  onNavigateToLectures?: (subjectId?: string) => void
}

export const AttendancePage: React.FC<AttendancePageProps> = ({
  onNavigateToLectures
}) => {
  const {
    subjects,
    settings,
    lectures,
    getAllSubjectAttendanceStats,
    getOverallAttendanceStats,
    setLectureStatus,
    addLecture,
    updateLecture,
    deleteLecture
  } = useApp()

  // State
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null)
  const [addingForSubjectId, setAddingForSubjectId] = useState<string | null>(null)
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New lecture form state
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0])
  const [newStartTime, setNewStartTime] = useState('10:00')
  const [newEndTime, setNewEndTime] = useState('11:00')
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('attended')

  // Edit lecture form state
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('attended')

  const threshold = settings.minAttendancePercent

  // Single authoritative aggregate and per-subject statistics
  const subjectStats = useMemo(() => {
    return getAllSubjectAttendanceStats()
  }, [getAllSubjectAttendanceStats])

  const overall = useMemo(() => {
    return getOverallAttendanceStats()
  }, [getOverallAttendanceStats])

  const statsMap = useMemo(() => {
    const map = new Map<string, (typeof subjectStats)[0]>()
    for (const stat of subjectStats) {
      map.set(stat.subjectId, stat)
    }
    return map
  }, [subjectStats])

  // Flash a notification toast
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2800)
  }

  // Toggle subject details
  const handleToggleExpand = (subjectId: string) => {
    setExpandedSubjectId(prev => (prev === subjectId ? null : subjectId))
    setAddingForSubjectId(null)
    setEditingLecture(null)
  }

  // Handle direct attendance toggle on a lecture record
  const handleStatusChange = (lecture: Lecture, newStatus: AttendanceStatus) => {
    if (lecture.status === newStatus) return
    setLectureStatus(lecture.id, newStatus)
    showToast(`Session marked as ${newStatus}`)
  }

  // Start adding a session for a specific subject
  const handleStartAdd = (subject: Subject) => {
    setAddingForSubjectId(subject.id)
    setNewTitle(`${subject.name} Session`)
    setNewDate(new Date().toISOString().split('T')[0])
    setNewStartTime('10:00')
    setNewEndTime('11:00')
    setNewStatus('attended')
    setEditingLecture(null)
  }

  // Save new session
  const handleSaveNewSession = (subject: Subject) => {
    if (!newTitle.trim()) {
      showToast('Session title is required')
      return
    }

    addLecture({
      date: newDate,
      subjectId: subject.id,
      title: newTitle.trim(),
      faculty: subject.faculty,
      startTime: newStartTime,
      endTime: newEndTime,
      durationMinutes: 60,
      status: newStatus,
      notes: `Manual entry for ${subject.code}`
    })

    setAddingForSubjectId(null)
    showToast(`Added session for ${subject.code}`)
  }

  // Start editing a lecture record
  const handleStartEdit = (lec: Lecture) => {
    setEditingLecture(lec)
    setEditTitle(lec.title)
    setEditDate(lec.date)
    setEditStartTime(lec.startTime || '10:00')
    setEditEndTime(lec.endTime || '11:00')
    setEditStatus(lec.status)
    setAddingForSubjectId(null)
  }

  // Save edited lecture record
  const handleSaveEdit = () => {
    if (!editingLecture) return
    if (!editTitle.trim()) {
      showToast('Session title is required')
      return
    }

    updateLecture(editingLecture.id, {
      title: editTitle.trim(),
      date: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
      status: editStatus
    })

    setEditingLecture(null)
    showToast('Lecture record updated')
  }

  // Delete lecture record
  const handleDeleteRecord = (id: string, subjectCode: string) => {
    deleteLecture(id)
    showToast(`Removed lecture record from ${subjectCode}`)
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md bg-foreground px-3.5 py-2 text-xs font-medium text-background shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Attendance
            </h1>
            <span className="text-xs text-muted-foreground font-mono">
              Semester 5
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official attendance tracking based strictly on held sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="font-mono text-xs text-muted-foreground border-border"
          >
            Target: {threshold}%
          </Badge>
          {overall.percentage !== null && (
            <Badge
              variant={overall.isWarning ? 'destructive' : 'secondary'}
              className="font-mono text-xs px-2.5 py-0.5"
            >
              Overall: {overall.percentage}% ({overall.totalAttended}/{overall.totalHeld})
            </Badge>
          )}
        </div>
      </div>

      {/* Warning Banner (Displayed only when attendance is deficient) */}
      {overall.warningCount > 0 && (
        <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
          <div className="space-y-0.5">
            <p className="font-medium text-destructive">
              Attendance Action Required: {overall.warningCount} course
              {overall.warningCount > 1 ? 's' : ''} below the mandatory {threshold}% threshold.
            </p>
            <p className="text-[11px] text-muted-foreground">
              University regulations require maintaining at least {threshold}% attendance per subject for exam eligibility.
            </p>
          </div>
        </div>
      )}

      {/* Compact Summary Section */}
      <div className="rounded-lg border border-border bg-card/40 p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Total Held */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Held Sessions
            </span>
            <div className="font-mono text-xl font-semibold tracking-tight text-foreground">
              {overall.totalHeld}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Conducted classes
            </p>
          </div>

          {/* Attended */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Attended
            </span>
            <div className="font-mono text-xl font-semibold tracking-tight text-emerald-400">
              {overall.totalAttended}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Present in session
            </p>
          </div>

          {/* Absent */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Absent
            </span>
            <div className="font-mono text-xl font-semibold tracking-tight text-destructive">
              {overall.totalAbsent}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Missed classes
            </p>
          </div>

          {/* Overall Percentage */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Aggregate Rate
            </span>
            <div className="font-mono text-xl font-semibold tracking-tight text-foreground">
              {overall.percentage !== null ? `${overall.percentage}%` : '—'}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {overall.totalHeld > 0
                ? `${overall.totalAttended} / ${overall.totalHeld} eligible`
                : 'No sessions held yet'}
            </p>
          </div>
        </div>

        {/* Secondary Detail Row: Scheduled, Cancelled, Unmarked */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Scheduled:{' '}
              <strong className="font-mono text-foreground">
                {overall.totalScheduled}
              </strong>
            </span>
            <span className="text-border">•</span>
            <span>
              Cancelled:{' '}
              <strong className="font-mono text-foreground">
                {overall.totalCancelled}
              </strong>
            </span>
            {overall.totalUnmarked > 0 && (
              <>
                <span className="text-border">•</span>
                <span>
                  Unmarked:{' '}
                  <strong className="font-mono text-amber-400">
                    {overall.totalUnmarked}
                  </strong>
                </span>
              </>
            )}
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            Attended ÷ (Attended + Absent) × 100
          </span>
        </div>
      </div>

      {/* Subject Breakdown Header */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Course Breakdown ({subjects.length} Subjects)
        </h2>
        <span className="text-[11px] text-muted-foreground">
          Click a subject to inspect or correct lecture records
        </span>
      </div>

      {/* Subject List */}
      <div className="space-y-2.5">
        {subjects.map(subject => {
          const stats = statsMap.get(subject.id) || {
            subjectId: subject.id,
            attended: 0,
            absent: 0,
            totalHeld: 0,
            scheduled: 0,
            cancelled: 0,
            unmarked: 0,
            percentage: null,
            isWarning: false,
            isApproaching: false,
            consecutiveNeededToReachTarget: 0,
            possibleToReachTarget: true
          }

          const isExpanded = expandedSubjectId === subject.id
          const subjectLectures = lectures.filter(l =>
            isSameSubject(l.subjectId, subject.id)
          )

          return (
            <div
              key={subject.id}
              className={`rounded-lg border transition-all ${
                isExpanded
                  ? 'border-border bg-card shadow-sm'
                  : 'border-border/80 bg-card/40 hover:border-border'
              }`}
            >
              {/* Row Main Header */}
              <div
                onClick={() => handleToggleExpand(subject.id)}
                className="flex cursor-pointer flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left: Code, Name, Faculty */}
                <div className="flex items-start gap-3 min-w-0">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs shrink-0 text-muted-foreground"
                  >
                    {subject.code}
                  </Badge>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {subject.faculty ? (
                        <span>Faculty: {subject.faculty}</span>
                      ) : (
                        <span>Faculty unassigned</span>
                      )}
                      <span className="mx-1.5 text-border">•</span>
                      <span>{subject.totalHours} hrs</span>
                    </p>
                  </div>
                </div>

                {/* Right: Numbers, Progress, Percentage & Toggle */}
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  {/* Attended / Held count */}
                  <div className="text-right">
                    <div className="font-mono text-xs font-medium text-foreground">
                      {stats.attended} / {stats.totalHeld} held
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {stats.scheduled > 0 && `${stats.scheduled} scheduled`}
                      {stats.absent > 0 && ` • ${stats.absent} absent`}
                    </div>
                  </div>

                  {/* 75% target progress bar */}
                  <div className="w-20 sm:w-28 space-y-1">
                    <div className="relative h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      {/* 75% target notch */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/40 z-10"
                        style={{ left: `${threshold}%` }}
                        title={`Target: ${threshold}%`}
                      />
                      {stats.percentage !== null && (
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            stats.isWarning
                              ? 'bg-destructive'
                              : stats.isApproaching
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, stats.percentage)}%` }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Percentage Pill */}
                  <div className="w-14 text-right">
                    {stats.percentage !== null ? (
                      <Badge
                        variant={stats.isWarning ? 'destructive' : 'secondary'}
                        className={`font-mono text-xs px-2 py-0.5 ${
                          !stats.isWarning && !stats.isApproaching
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : ''
                        }`}
                      >
                        {stats.percentage}%
                      </Badge>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        —
                      </span>
                    )}
                  </div>

                  {/* Expand / Collapse Chevron */}
                  <div className="text-muted-foreground">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Recovery Target Notice if Below 75% */}
              {stats.isWarning && (
                <div className="mx-3.5 mb-3 flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-xs text-destructive">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Needs <strong>+{stats.consecutiveNeededToReachTarget}</strong> consecutive attended session
                      {stats.consecutiveNeededToReachTarget > 1 ? 's' : ''} to reach {threshold}%.
                    </span>
                  </div>
                  {!stats.possibleToReachTarget && (
                    <span className="text-[10px] text-destructive/80 font-medium">
                      Exceeds standard hours
                    </span>
                  )}
                </div>
              )}

              {/* Expanded Inspection & Correction Drawer */}
              {isExpanded && (
                <div className="border-t border-border bg-secondary/10 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">
                        Underlying Lecture Records ({subjectLectures.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => handleStartAdd(subject)}
                        className="h-7 text-xs px-2.5 cursor-pointer"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Log Class
                      </Button>
                      {onNavigateToLectures && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => onNavigateToLectures(subject.id)}
                          className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 cursor-pointer"
                        >
                          Full Details
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Add New Session Form */}
                  {addingForSubjectId === subject.id && (
                    <div className="rounded-md border border-border bg-card p-3 space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="text-xs font-medium text-foreground">
                          Log New Class Session for {subject.code}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => setAddingForSubjectId(null)}
                          className="h-6 w-6 p-0 text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Session Topic / Title
                          </label>
                          <input
                            type="text"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            placeholder="e.g. Graph Algorithms Lab"
                            className="w-full rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Date
                          </label>
                          <input
                            type="date"
                            value={newDate}
                            onChange={e => setNewDate(e.target.value)}
                            className="w-full rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Initial Status
                          </label>
                          <select
                            value={newStatus}
                            onChange={e => setNewStatus(e.target.value as AttendanceStatus)}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                          >
                            <option value="attended">Attended (Present)</option>
                            <option value="absent">Absent (Missed)</option>
                            <option value="scheduled">Scheduled (Upcoming)</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="unmarked">Unmarked</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => setAddingForSubjectId(null)}
                          className="h-7 text-xs text-muted-foreground"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onPress={() => handleSaveNewSession(subject)}
                          className="h-7 text-xs"
                        >
                          Save Record
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Edit Existing Session Form */}
                  {editingLecture && isSameSubject(editingLecture.subjectId, subject.id) && (
                    <div className="rounded-md border border-primary/30 bg-card p-3 space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="text-xs font-medium text-foreground">
                          Edit Lecture Record
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => setEditingLecture(null)}
                          className="h-6 w-6 p-0 text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] text-muted-foreground">
                            Title / Topic
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Date
                          </label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                            className="w-full rounded border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Status
                          </label>
                          <select
                            value={editStatus}
                            onChange={e => setEditStatus(e.target.value as AttendanceStatus)}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                          >
                            <option value="attended">Attended</option>
                            <option value="absent">Absent</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="unmarked">Unmarked</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => setEditingLecture(null)}
                          className="h-7 text-xs text-muted-foreground"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onPress={handleSaveEdit}
                          className="h-7 text-xs"
                        >
                          Update Record
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* List of underlying lectures for this subject */}
                  {subjectLectures.length === 0 ? (
                    <div className="rounded border border-border/50 bg-background/50 p-6 text-center text-xs text-muted-foreground">
                      <p>No lecture records found for this course.</p>
                      <p className="mt-1">
                        Click &ldquo;Log Class&rdquo; above to record an attended or held session.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-md border border-border bg-background/60">
                      {subjectLectures.map(lec => {
                        const isAttended = lec.status === 'attended'
                        const isAbsent = lec.status === 'absent'
                        const isScheduled = lec.status === 'scheduled'
                        const isCancelled = lec.status === 'cancelled'

                        return (
                          <div
                            key={lec.id}
                            className="flex flex-col gap-2.5 p-2.5 sm:flex-row sm:items-center sm:justify-between hover:bg-secondary/20 transition-colors"
                          >
                            {/* Record Info */}
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-medium text-foreground">
                                  {lec.date}
                                </span>
                                {lec.startTime && lec.endTime && (
                                  <span className="font-mono text-[11px] text-muted-foreground">
                                    {lec.startTime}–{lec.endTime}
                                  </span>
                                )}
                                {lec.classroom && (
                                  <span className="text-[11px] text-muted-foreground truncate">
                                    • {lec.classroom}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-foreground/90 font-medium truncate">
                                {lec.title}
                              </p>
                            </div>

                            {/* Status Segmented Controls & Actions */}
                            <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                              {/* Attended Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(lec, 'attended')}
                                className={`h-6 px-2 text-[11px] font-medium rounded transition-colors ${
                                  isAttended
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                                }`}
                                title="Mark as Attended"
                              >
                                Attended
                              </button>

                              {/* Absent Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(lec, 'absent')}
                                className={`h-6 px-2 text-[11px] font-medium rounded transition-colors ${
                                  isAbsent
                                    ? 'bg-destructive/20 text-destructive border border-destructive/30'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                                }`}
                                title="Mark as Absent"
                              >
                                Absent
                              </button>

                              {/* Scheduled Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(lec, 'scheduled')}
                                className={`h-6 px-2 text-[11px] font-medium rounded transition-colors ${
                                  isScheduled
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                                }`}
                                title="Mark as Scheduled"
                              >
                                Scheduled
                              </button>

                              {/* More / Cancelled / Unmarked / Edit / Delete Menu */}
                              <div className="flex items-center gap-1 ml-1 pl-1 border-l border-border">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(lec, 'cancelled')}
                                  className={`h-6 px-1.5 text-[11px] rounded transition-colors ${
                                    isCancelled
                                      ? 'bg-secondary text-foreground font-medium'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                  title="Mark as Cancelled"
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(lec)}
                                  className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                                  title="Edit details"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord(lec.id, subject.code)}
                                  className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  title="Delete record"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
