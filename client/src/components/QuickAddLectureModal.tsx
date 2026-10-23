import React, { useState, useEffect } from 'react'
import { 
  X, 
  CalendarClock, 
  Calendar, 
  Clock, 
  BookOpen, 
  Plus, 
  Trash2, 
  Lightbulb, 
  Code2, 
  HelpCircle, 
  RotateCcw,
  Star,
  AlertTriangle
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { AttendanceStatus, Lecture } from '../types'
import { 
  calculateDurationFromTimes, 
  calculateEndTimeFromDuration,
  normalizeTimeTo24H,
  formatTimeTo12H
} from '../utils/timetableUtils'
import { 
  canonicalSubjectId, 
  isSameSubject, 
  getDefaultFacultyForSubject 
} from '../utils/subjectUtils'

interface QuickAddLectureModalProps {
  isOpen: boolean
  onClose: () => void
  initialSubjectId?: string
  initialDate?: string
  editingLecture?: Lecture | null
}

interface MultiLectureRow {
  subjectId: string
  title: string
  durationMinutes: number
  startTime?: string
  status: AttendanceStatus
}

export const QuickAddLectureModal: React.FC<QuickAddLectureModalProps> = ({
  isOpen,
  onClose,
  initialSubjectId,
  initialDate,
  editingLecture
}) => {
  const { subjects, lectures, addLecture, addMultipleLectures, updateLecture } = useApp()

  const todayStr = new Date().toISOString().split('T')[0]
  const defaultSubId = initialSubjectId || subjects[0]?.id || 'S5-CS01'

  // Mode: 'single' | 'batch'
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Single Lecture Form State
  const [date, setDate] = useState<string>(todayStr)
  const [subjectId, setSubjectId] = useState<string>(defaultSubId)
  const [title, setTitle] = useState<string>('')
  const [faculty, setFaculty] = useState<string>('')
  const [classroom, setClassroom] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [status, setStatus] = useState<AttendanceStatus>('attended')
  const [notes, setNotes] = useState<string>('')
  const [whatILearned, setWhatILearned] = useState<string>('')
  const [conceptsStr, setConceptsStr] = useState<string>('')
  const [examplesOrCode, setExamplesOrCode] = useState<string>('')
  const [doubtsOrQuestions, setDoubtsOrQuestions] = useState<string>('')
  const [homeworkOrFollowup, setHomeworkOrFollowup] = useState<string>('')
  const [confidenceRating, setConfidenceRating] = useState<number>(4)
  const [needsRevision, setNeedsRevision] = useState<boolean>(false)
  const [selectedDocId, setSelectedDocId] = useState<string>('')
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [allowDuplicate, setAllowDuplicate] = useState<boolean>(false)

  // Batch Form State
  const [batchDate, setBatchDate] = useState<string>(todayStr)
  const [batchRows, setBatchRows] = useState<MultiLectureRow[]>([
    { subjectId: defaultSubId, title: '', durationMinutes: 60, status: 'attended' },
    { subjectId: defaultSubId, title: '', durationMinutes: 60, status: 'attended' }
  ])

  // Synchronize start & end times with duration
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart)
    setDuplicateWarning(null)
    if (newStart && endTime) {
      const calc = calculateDurationFromTimes(newStart, endTime)
      if (calc > 0) setDurationMinutes(calc)
    } else if (newStart && durationMinutes > 0) {
      const calculatedEnd = calculateEndTimeFromDuration(newStart, durationMinutes)
      if (calculatedEnd) setEndTime(calculatedEnd)
    }
  }

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd)
    if (startTime && newEnd) {
      const calc = calculateDurationFromTimes(startTime, newEnd)
      if (calc > 0) setDurationMinutes(calc)
    }
  }

  const handleDurationChange = (newMins: number) => {
    const val = Number(newMins) || 60
    setDurationMinutes(val)
    if (startTime) {
      const calculatedEnd = calculateEndTimeFromDuration(startTime, val)
      if (calculatedEnd) setEndTime(calculatedEnd)
    }
  }

  // Reset or populate when editing
  useEffect(() => {
    setDuplicateWarning(null)
    setAllowDuplicate(false)
    if (editingLecture) {
      setMode('single')
      setDate(editingLecture.date)
      setSubjectId(editingLecture.subjectId)
      setTitle(editingLecture.title)
      setFaculty(editingLecture.faculty || '')
      setClassroom(editingLecture.classroom || '')
      setStartTime(editingLecture.startTime || '')
      setEndTime(editingLecture.endTime || '')
      
      // Authoritative duration from record or calculated from times
      const effectiveDuration = editingLecture.durationMinutes || 
        (editingLecture.startTime && editingLecture.endTime 
          ? calculateDurationFromTimes(editingLecture.startTime, editingLecture.endTime) 
          : 60)
      setDurationMinutes(effectiveDuration)
      
      setStatus(editingLecture.status)
      setNotes(editingLecture.notes || '')
      setWhatILearned(editingLecture.whatILearned || '')
      setConceptsStr(editingLecture.importantConcepts ? editingLecture.importantConcepts.join(', ') : '')
      setExamplesOrCode(editingLecture.examplesOrCode || '')
      setDoubtsOrQuestions(editingLecture.doubtsOrQuestions || '')
      setHomeworkOrFollowup(editingLecture.homeworkOrFollowup || '')
      setConfidenceRating(editingLecture.confidenceRating || 4)
      setNeedsRevision(!!editingLecture.needsRevision)
      setSelectedDocId(editingLecture.linkedDocumentIds?.[0] || '')
    } else {
      setDate(initialDate || todayStr)
      setBatchDate(initialDate || todayStr)
      const targetSubId = initialSubjectId || defaultSubId
      setSubjectId(targetSubId)
      const selSub = subjects.find(s => isSameSubject(s.id, targetSubId))
      setFaculty(selSub?.faculty || getDefaultFacultyForSubject(targetSubId))
      setClassroom('Classroom 37')
      setTitle('')
      setStartTime('')
      setEndTime('')
      setDurationMinutes(60)
      setNotes('')
      setWhatILearned('')
      setConceptsStr('')
      setExamplesOrCode('')
      setDoubtsOrQuestions('')
      setHomeworkOrFollowup('')
      setStatus('attended')
      setConfidenceRating(4)
      setNeedsRevision(false)
      setSelectedDocId('')
    }
  }, [editingLecture, initialSubjectId, initialDate, isOpen])

  // Update default faculty when subject changes (only if faculty field is empty or in new creation)
  const handleSubjectChange = (newSubId: string) => {
    setSubjectId(newSubId)
    setDuplicateWarning(null)
    const selSub = subjects.find(s => isSameSubject(s.id, newSubId))
    if (!faculty) {
      setFaculty(selSub?.faculty || getDefaultFacultyForSubject(newSubId))
    }
  }

  const selectedSubject = subjects.find(s => isSameSubject(s.id, subjectId))
  const syllabusTopics = selectedSubject?.modules.flatMap(m => m.topics) || []

  // Add / remove rows in batch mode
  const addBatchRow = () => {
    setBatchRows(prev => [
      ...prev,
      { subjectId, title: '', durationMinutes: 60, status: 'attended' }
    ])
  }

  const removeBatchRow = (index: number) => {
    setBatchRows(prev => prev.filter((_, i) => i !== index))
  }

  const updateBatchRow = (index: number, updates: Partial<MultiLectureRow>) => {
    setBatchRows(prev => prev.map((row, i) => i === index ? { ...row, ...updates } : row))
  }

  // Handle submit single lecture
  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!title.trim()) return

    const normStart = startTime ? normalizeTimeTo24H(startTime) : undefined
    const normEnd = endTime ? normalizeTimeTo24H(endTime, true) : undefined

    // Duplicate lecture guard for new lecture creation
    if (!editingLecture && !allowDuplicate) {
      const duplicate = lectures.find(l => 
        l.date === date && 
        isSameSubject(l.subjectId, subjectId) && 
        ((normStart && l.startTime && normalizeTimeTo24H(l.startTime) === normStart) ||
         l.title.trim().toLowerCase() === title.trim().toLowerCase())
      )
      if (duplicate) {
        setDuplicateWarning(
          `A lecture "${duplicate.title}" is already recorded on ${date}${duplicate.startTime ? ` at ${formatTimeTo12H(duplicate.startTime)}` : ''}. Check the confirmation below to proceed if this is an intentional separate session.`
        )
        return
      }
    }

    setIsSubmitting(true)
    try {
      const concepts = conceptsStr
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)

      const payload = {
        date,
        subjectId: canonicalSubjectId(subjectId),
        title: title.trim(),
        faculty: faculty.trim() || undefined,
        classroom: classroom.trim() || undefined,
        startTime: normStart,
        endTime: normEnd,
        durationMinutes: Number(durationMinutes) || (normStart && normEnd ? calculateDurationFromTimes(normStart, normEnd) : 60),
        status,
        notes: notes.trim() || undefined,
        whatILearned: whatILearned.trim() || undefined,
        importantConcepts: concepts.length > 0 ? concepts : undefined,
        examplesOrCode: examplesOrCode.trim() || undefined,
        doubtsOrQuestions: doubtsOrQuestions.trim() || undefined,
        homeworkOrFollowup: homeworkOrFollowup.trim() || undefined,
        confidenceRating: Number(confidenceRating) || 4,
        needsRevision,
        linkedDocumentIds: selectedDocId ? [selectedDocId] : undefined
      }

      if (editingLecture) {
        updateLecture(editingLecture.id, payload)
      } else {
        addLecture(payload)
      }

      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle submit batch lectures
  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const validRows = batchRows.filter(r => r.title.trim())
    if (validRows.length === 0) return

    setIsSubmitting(true)
    try {
      const payloads = validRows.map(row => {
        const sub = subjects.find(s => s.id === row.subjectId)
        return {
          date: batchDate,
          subjectId: row.subjectId,
          title: row.title.trim(),
          faculty: sub?.faculty,
          startTime: row.startTime ? normalizeTimeTo24H(row.startTime) : undefined,
          durationMinutes: row.durationMinutes || 60,
          status: row.status,
          confidenceRating: 4,
          needsRevision: false
        }
      })

      addMultipleLectures(payloads)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-[#0f172a] border border-[#1e293d] rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1e293d] flex items-center justify-between bg-[#111c33]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {editingLecture ? 'Edit Lecture Session' : 'Log Daily Lecture'}
              </h2>
              <p className="text-xs text-slate-400">
                Track attendance, what you learned, and concepts covered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editingLecture && (
              <div className="flex items-center bg-[#0b1222] p-0.5 rounded-lg border border-[#1e2d4d] text-xs">
                <button
                  type="button"
                  onClick={() => setMode('single')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    mode === 'single'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Session
                </button>
                <button
                  type="button"
                  onClick={() => setMode('batch')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    mode === 'batch'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quick Multi-Add
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {mode === 'single' ? (
          <form onSubmit={handleSubmitSingle} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Row 1: Date & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Lecture Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white focus-ring font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  Subject (6 Available)
                </label>
                <select
                  value={subjectId}
                  onChange={e => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white focus-ring font-medium"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — {s.totalHours} hrs
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Lecture Title & Quick Syllabus Topic Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Topic / Lecture Title <span className="text-rose-400">*</span>
                </label>
                {syllabusTopics.length > 0 && (
                  <span className="text-[11px] text-slate-400">
                    Or pick from syllabus topics below:
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Strongly Connected Components (Tarjan & Kosaraju)"
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white placeholder-slate-500 focus-ring font-medium"
              />

              {/* Syllabus topic suggestion tags */}
              {syllabusTopics.length > 0 && !title && (
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-500">Suggested:</span>
                  {syllabusTopics.slice(0, 4).map(topic => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setTitle(topic.title)}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#131d33] hover:bg-[#1a2744] text-slate-300 border border-[#203152] transition-colors truncate max-w-[200px]"
                    >
                      {topic.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 3: Duration, Times & Attendance Status */}
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Duration
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={durationMinutes}
                      onChange={e => handleDurationChange(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white focus-ring pr-8 font-mono"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-500 font-mono">
                      min
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Start Time {startTime && <span className="text-blue-400 font-mono text-[10px]">({formatTimeTo12H(startTime)})</span>}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => handleStartTimeChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    End Time {endTime && <span className="text-blue-400 font-mono text-[10px]">({formatTimeTo12H(endTime)})</span>}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => handleEndTimeChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as AttendanceStatus)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus-ring ${
                      status === 'attended'
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                        : status === 'absent'
                        ? 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                        : status === 'cancelled'
                        ? 'bg-slate-800 text-slate-300 border-slate-600'
                        : 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                    }`}
                  >
                    <option value="attended">Attended</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="absent">Absent</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Quick Duration Presets */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[10px] text-slate-500 font-mono">Quick Duration:</span>
                {[30, 45, 60, 90, 120, 180].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleDurationChange(mins)}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors ${
                      durationMinutes === mins
                        ? 'bg-blue-600 text-white font-bold shadow-xs border border-blue-500'
                        : 'bg-[#152033] hover:bg-[#1e2d4a] text-slate-400 hover:text-white border border-[#233554]'
                    }`}
                  >
                    {mins === 60 ? '60m (1h)' : mins === 120 ? '120m (2h)' : mins === 180 ? '180m (3h)' : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 4: Faculty & Classroom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Faculty / Instructor
                </label>
                <input
                  type="text"
                  value={faculty}
                  onChange={e => setFaculty(e.target.value)}
                  placeholder="e.g. Sanjay Sahu (VF)"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white placeholder-slate-500 focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Classroom / Location
                </label>
                <input
                  type="text"
                  value={classroom}
                  onChange={e => setClassroom(e.target.value)}
                  placeholder="e.g. Classroom 37"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white placeholder-slate-500 focus-ring"
                />
              </div>
            </div>

            {/* Duplicate Lecture Warning & Confirmation */}
            {duplicateWarning && (
              <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Duplicate Lecture Detected</span>
                </div>
                <p className="leading-relaxed">{duplicateWarning}</p>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-white pt-1">
                  <input
                    type="checkbox"
                    checked={allowDuplicate}
                    onChange={e => setAllowDuplicate(e.target.checked)}
                    className="rounded bg-[#0b0f19] border-amber-500/50 text-amber-500 focus-ring"
                  />
                  <span>Yes, I confirm this is a separate lecture and wish to proceed.</span>
                </label>
              </div>
            )}

            {/* Learning Journal Section */}
            <div className="pt-2 border-t border-[#1e293d] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Learning Journal & Key Takeaways
              </h3>

              {/* What I Learned */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  What did I learn in this lecture?
                </label>
                <textarea
                  rows={2}
                  value={whatILearned}
                  onChange={e => setWhatILearned(e.target.value)}
                  placeholder="Key concepts, algorithms, theorems, or takeaways covered..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white placeholder-slate-500 focus-ring resize-none leading-relaxed"
                />
              </div>

              {/* Important Concepts & Code Snippet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Key Concepts (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={conceptsStr}
                    onChange={e => setConceptsStr(e.target.value)}
                    placeholder="DFS, DFS Low-Link, Bridges, DAG"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white placeholder-slate-500 focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-amber-400" />
                    Doubts or Questions for Professor
                  </label>
                  <input
                    type="text"
                    value={doubtsOrQuestions}
                    onChange={e => setDoubtsOrQuestions(e.target.value)}
                    placeholder="e.g. Why does Kosaraju require transpose?"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white placeholder-slate-500 focus-ring"
                  />
                </div>
              </div>

              {/* Code Snippet / Examples */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-cyan-400" />
                  Code Snippet or Example (Optional)
                </label>
                <textarea
                  rows={2}
                  value={examplesOrCode}
                  onChange={e => setExamplesOrCode(e.target.value)}
                  placeholder="void dfs(int u) { vis[u] = true; ... }"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white placeholder-slate-500 focus-ring font-mono resize-none text-[11px]"
                />
              </div>

              {/* Confidence Rating & Needs Revision */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#0b0f19] border border-[#1f2d48]">
                <div>
                  <span className="block text-xs font-medium text-slate-300 mb-1">
                    Understanding / Confidence Rating
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setConfidenceRating(star)}
                        className="p-1 focus-ring rounded"
                      >
                        <Star className={`w-4 h-4 ${
                          star <= confidenceRating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-slate-600'
                        }`} />
                      </button>
                    ))}
                    <span className="text-xs text-slate-400 ml-2 font-mono">
                      {confidenceRating}/5 ({
                        confidenceRating >= 4 ? 'Understood' : confidenceRating === 3 ? 'Moderate' : 'Needs Review'
                      })
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-2 sm:pt-0">
                  <input
                    type="checkbox"
                    checked={needsRevision}
                    onChange={e => setNeedsRevision(e.target.checked)}
                    className="rounded bg-[#0b0f19] border-[#21304d] text-blue-600 focus-ring w-4 h-4"
                  />
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    Mark for Revision Queue
                  </span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293d]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors disabled:opacity-50"
              >
                {editingLecture ? 'Save Changes' : 'Log Lecture'}
              </button>
            </div>
          </form>
        ) : (
          /* BATCH MULTI-ADD FORM */
          <form onSubmit={handleSubmitBatch} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300">
              <span className="font-semibold text-blue-300">Multi-Session Logging:</span> Log back-to-back lectures or multiple classes on the same day (e.g. 2 DSA III sessions). Each row will create an independent, verifiable lecture record.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Date for all sessions
              </label>
              <input
                type="date"
                required
                value={batchDate}
                onChange={e => setBatchDate(e.target.value)}
                className="w-full sm:w-60 px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white focus-ring font-mono"
              />
            </div>

            {/* Rows list */}
            <div className="space-y-3">
              {batchRows.map((row, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#1e293d] space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 font-mono">
                      Lecture #{idx + 1}
                    </span>
                    {batchRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBatchRow(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Subject</label>
                      <select
                        value={row.subjectId}
                        onChange={e => updateBatchRow(idx, { subjectId: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0f172a] border border-[#23314e] text-xs text-white focus-ring"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.code} — {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">Topic / Title *</label>
                      <input
                        type="text"
                        required
                        value={row.title}
                        onChange={e => updateBatchRow(idx, { title: e.target.value })}
                        placeholder="e.g. Session 1: Strongly Connected Components"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0f172a] border border-[#23314e] text-xs text-white placeholder-slate-500 focus-ring"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Duration</label>
                      <select
                        value={row.durationMinutes}
                        onChange={e => updateBatchRow(idx, { durationMinutes: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0f172a] border border-[#23314e] text-xs text-white focus-ring"
                      >
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                        <option value={60}>60 mins (1 hr)</option>
                        <option value={90}>90 mins (1.5 hrs)</option>
                        <option value={120}>120 mins (2 hrs)</option>
                        <option value={180}>180 mins (3 hrs)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Start Time (Opt)</label>
                      <input
                        type="time"
                        value={row.startTime || ''}
                        onChange={e => updateBatchRow(idx, { startTime: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0f172a] border border-[#23314e] text-xs text-white focus-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                      <select
                        value={row.status}
                        onChange={e => updateBatchRow(idx, { status: e.target.value as AttendanceStatus })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0f172a] border border-[#23314e] text-xs text-white focus-ring font-medium"
                      >
                        <option value="attended">Attended</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="absent">Absent</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addBatchRow}
              className="w-full py-2 rounded-lg border border-dashed border-[#263756] hover:border-blue-500/60 text-xs text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Add Another Lecture Row</span>
            </button>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293d]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || batchRows.every(r => !r.title.trim())}
                className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors disabled:opacity-50"
              >
                Log {batchRows.filter(r => r.title.trim()).length || 1} Lectures
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
