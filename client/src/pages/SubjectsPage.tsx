import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  FileText, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Search, 
  ShieldCheck, 
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileCode,
  Eye
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { officialDocuments, type OfficialDocument } from '../data/officialDocs'
import { DocumentViewerModal } from '../components/DocumentViewerModal'

interface SubjectsPageProps {
  initialSubjectId?: string
  onOpenQuickTask: (subjectId?: string) => void
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  initialSubjectId,
  onOpenQuickTask
}) => {
  const { 
    subjects, 
    completedTopics, 
    toggleTopic, 
    notes, 
    addNote, 
    deleteNote,
    addTask,
    getSubjectProgress,
    getSubjectAttendance,
    recordSingleClass,
    getSubject
  } = useApp()

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || subjects[0]?.id || ''
  )
  const [activeTab, setActiveTab] = useState<'syllabus' | 'assignments' | 'resources' | 'notes' | 'attendance'>('syllabus')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  // New Note state
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')

  // Document viewer modal
  const [modalDoc, setModalDoc] = useState<OfficialDocument | null>(null)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)

  const handleOpenDocViewer = (filename?: string) => {
    const targetFilename = filename || selectedSubject?.officialDoc?.filename
    if (!targetFilename) return
    const found = officialDocuments.find(d => d.filename === targetFilename)
    if (found) {
      setModalDoc(found)
      setIsDocModalOpen(true)
    }
  }

  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId)
    }
  }, [initialSubjectId])

  const selectedSubject = getSubject(selectedSubjectId) || subjects[0]

  // Expand all modules for selected subject initially if not set
  useEffect(() => {
    if (selectedSubject) {
      const initialExpanded: Record<string, boolean> = {}
      selectedSubject.modules.forEach((_, idx) => {
        initialExpanded[`mod-${idx}`] = true
      })
      setExpandedModules(initialExpanded)
    }
  }, [selectedSubjectId, selectedSubject])

  const toggleModule = (modKey: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [modKey]: !prev[modKey]
    }))
  }

  // Filter subjects by search
  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.faculty.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const subjectProgress = selectedSubject ? getSubjectProgress(selectedSubject.id) : { completed: 0, total: 0, percentage: 0 }
  const subjectAttendance = selectedSubject ? getSubjectAttendance(selectedSubject.id) : { attended: 0, total: 0, percentage: 100, isWarning: false }
  const subjectNotes = notes.filter(n => n.subjectId === selectedSubject?.id)

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteTitle.trim() || !newNoteContent.trim() || !selectedSubject) return
    addNote({
      subjectId: selectedSubject.id,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      tags: [selectedSubject.code]
    })
    setNewNoteTitle('')
    setNewNoteContent('')
    setIsAddingNote(false)
  }

  const handleConvertAssignmentToTask = (assign: { title: string; description: string; sno: number }) => {
    if (!selectedSubject) return
    addTask({
      title: `${selectedSubject.code}: ${assign.title}`,
      description: assign.description,
      subjectId: selectedSubject.id,
      deadline: '2026-11-15',
      priority: 'high',
      status: 'todo',
      estimatedHours: 3,
      actualHours: 0
    })
    alert(`Created task for assignment: "${assign.title}"`)
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Search and Subject Pill Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search subjects, faculty or codes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#111827] border border-[#1f293d] text-xs text-slate-200 placeholder-slate-500 focus-ring"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {filteredSubjects.map(sub => {
            const isSelected = sub.id === selectedSubject?.id
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-ring ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-[#111827] text-slate-400 hover:text-slate-200 hover:bg-[#162035] border border-[#1f293d]'
                }`}
              >
                {sub.code}
              </button>
            )
          })}
        </div>
      </div>

      {selectedSubject && (
        <div className="space-y-5">
          {/* Subject Detail Header Card */}
          <div className="p-6 rounded-xl bg-[#111827] border border-[#1f293d] shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    {selectedSubject.code}
                  </span>
                  <span className="text-xs text-slate-400 font-mono bg-[#162035] px-2 py-0.5 rounded border border-[#212d45]">
                    {selectedSubject.totalHours} Total Hours
                  </span>
                  <span className="text-xs text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                    {selectedSubject.courseType}
                  </span>
                  <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {selectedSubject.facultyStatus}
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {selectedSubject.name}
                </h2>

                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  {selectedSubject.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>Faculty SME: <strong className="text-slate-200">{selectedSubject.faculty}</strong></span>
                  <span>Cohort: <strong className="text-blue-400">{selectedSubject.cohort}</strong></span>
                </div>
              </div>

              {/* Subject Stats Card */}
              <div className="p-4 rounded-lg bg-[#0c121e] border border-[#1e2a40] shrink-0 min-w-[260px] space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Syllabus Progress</span>
                    <span className="font-mono font-medium text-slate-300">
                      {subjectProgress.completed} / {subjectProgress.total} ({subjectProgress.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#172238] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${subjectProgress.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e2a40] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Attendance</span>
                    <span className={`font-mono font-bold text-sm ${subjectAttendance.isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {subjectAttendance.percentage}%
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {subjectAttendance.attended}/{subjectAttendance.total} held
                    </span>
                  </div>
                  <button
                    onClick={() => recordSingleClass(selectedSubject.id, true)}
                    className="px-2.5 py-1.5 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-[11px] font-medium transition-colors focus-ring"
                  >
                    + Log Class
                  </button>
                </div>
              </div>
            </div>

            {/* Official Syllabus Document Banner */}
            {selectedSubject.officialDoc && (
              <div className="mt-4 p-3.5 rounded-lg bg-[#0c121e] border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedSubject.officialDoc.type === 'xlsx' ? (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    ) : selectedSubject.officialDoc.type === 'docx' ? (
                      <FileCode className="w-4 h-4 text-sky-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">
                        Official Curriculum File:
                      </span>
                      <span className="text-[11px] font-mono text-slate-300">
                        {selectedSubject.officialDoc.filename}
                      </span>
                      <span className="text-[10px] font-mono bg-[#162035] text-slate-300 px-1.5 py-0.2 rounded border border-[#23314e]">
                        {selectedSubject.officialDoc.size}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supplied by university department for {selectedSubject.code}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => handleOpenDocViewer()}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors focus-ring"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Syllabus in App</span>
                  </button>
                  <a
                    href={selectedSubject.officialDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-[#162035] hover:bg-[#1e2a44] text-slate-200 border border-[#233352] text-xs font-medium flex items-center gap-1.5 transition-colors focus-ring"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>Open in New Tab</span>
                  </a>
                  <a
                    href={selectedSubject.officialDoc.url}
                    download={selectedSubject.officialDoc.filename}
                    className="px-3.5 py-2 rounded-lg bg-[#162035] hover:bg-[#1e2a44] text-slate-300 border border-[#233352] text-xs font-medium flex items-center gap-1.5 transition-colors focus-ring"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            )}

            {/* If Subject is pending syllabus file upload (honest note) */}
            {!selectedSubject.hasDetailedSyllabus && (
              <div className="mt-4 p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-blue-400" />
                <span>
                  {selectedSubject.syllabusStatusNote || 'Detailed subject syllabus document pending upload from portal. Faculty verified from Academic Plan.'}
                </span>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-[#1e293d] pb-px">
            <button
              onClick={() => setActiveTab('syllabus')}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'syllabus'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Syllabus Topics ({selectedSubject.modules.reduce((acc, m) => acc + m.topics.length, 0)})</span>
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'assignments'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Assignments ({selectedSubject.assignments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'resources'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Resources ({selectedSubject.resources.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Notes & Summaries ({subjectNotes.length})</span>
            </button>
          </div>

          {/* TAB 1: SYLLABUS TOPICS */}
          {activeTab === 'syllabus' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Check off topics as you attend lectures and complete self-study:</span>
                <span className="font-mono text-slate-300 font-medium">
                  {subjectProgress.completed} of {subjectProgress.total} completed
                </span>
              </div>

              <div className="space-y-3">
                {selectedSubject.modules.map((mod, modIdx) => {
                  const modKey = `mod-${modIdx}`
                  const isExpanded = expandedModules[modKey] ?? true
                  const modCompletedCount = mod.topics.filter(t => completedTopics[t.id]).length

                  return (
                    <div 
                      key={modKey}
                      className="rounded-xl bg-[#111827] border border-[#1e293d] overflow-hidden"
                    >
                      {/* Module Header Accordion Button */}
                      <button
                        onClick={() => toggleModule(modKey)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-[#151f33] transition-colors focus-ring"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#172238] text-blue-400 font-semibold border border-[#233352]">
                            {mod.unitNumber}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {mod.title}
                          </span>
                          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                            ({mod.hours} hrs)
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-400">
                            {modCompletedCount} / {mod.topics.length}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Topics List */}
                      {isExpanded && (
                        <div className="p-4 pt-1 border-t border-[#1b2538] space-y-2 bg-[#0c121e]">
                          {mod.topics.map(topic => {
                            const isDone = Boolean(completedTopics[topic.id])
                            return (
                              <div
                                key={topic.id}
                                onClick={() => toggleTopic(topic.id)}
                                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                                  isDone
                                    ? 'bg-blue-950/20 border-blue-500/30 text-blue-200'
                                    : 'bg-[#111827] border-[#1e293d] text-slate-300 hover:border-[#2b3a55]'
                                }`}
                              >
                                <button
                                  type="button"
                                  className="text-slate-500 hover:text-blue-400 focus-ring"
                                  aria-label="Toggle topic completion"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                                  ) : (
                                    <Circle className="w-4 h-4" />
                                  )}
                                </button>
                                <span className={`text-xs ${isDone ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                                  {topic.title}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Official syllabus assignments & evaluation questions:</span>
                <button
                  onClick={() => onOpenQuickTask(selectedSubject.id)}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 focus-ring"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Task
                </button>
              </div>

              {selectedSubject.assignments.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#111827] border border-[#1e293d] text-center text-slate-400 text-xs">
                  No official assignments listed in document yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {selectedSubject.assignments.map(assign => (
                    <div
                      key={assign.id}
                      className="p-4 rounded-xl bg-[#111827] border border-[#1e293d] flex flex-col justify-between hover:border-[#2c3d5e] transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-[11px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            Assignment #{assign.sno}
                          </span>
                          {assign.co && (
                            <span className="text-[10px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                              {assign.co}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 bg-[#162035] px-1.5 py-0.5 rounded font-mono">
                            {assign.type}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-white leading-snug">
                          {assign.title}
                        </h4>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {assign.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#1f293d] flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {assign.difficulty ? `Difficulty: ${assign.difficulty}` : 'Internal 30m quota'}
                        </span>
                        <button
                          onClick={() => handleConvertAssignmentToTask(assign)}
                          className="px-2.5 py-1.5 rounded bg-[#162035] hover:bg-[#1e2a44] text-slate-200 border border-[#233352] text-xs font-medium transition-colors focus-ring"
                        >
                          + Track as Task
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESOURCES */}
          {activeTab === 'resources' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Verified reading list, textbooks and online materials:</span>
              </div>

              {selectedSubject.resources.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#111827] border border-[#1e293d] text-center text-slate-400 text-xs">
                  No resources registered for this subject yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedSubject.resources.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#111827] border border-[#1e293d] flex items-start justify-between gap-4 hover:border-[#2b3a55] transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {res.title}
                          </span>
                          {res.type && (
                            <span className="text-[10px] text-slate-400 bg-[#162035] px-1.5 py-0.2 rounded font-mono">
                              {res.type}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300">
                          {res.description}
                        </p>
                        {res.author && (
                          <p className="text-[11px] text-slate-400">
                            Author/Publisher: {res.author}
                          </p>
                        )}
                      </div>

                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#162035] hover:bg-[#202d4a] text-slate-200 border border-[#233352] text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors focus-ring"
                      >
                        <span>Open Link</span>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NOTES & LECTURE SUMMARIES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Personal lecture notes and conceptual summaries:
                </span>
                <button
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors focus-ring"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingNote ? 'Cancel' : 'New Note'}</span>
                </button>
              </div>

              {/* Add Note Form */}
              {isAddingNote && (
                <form onSubmit={handleSaveNote} className="p-4 rounded-xl bg-[#0e1422] border border-[#233352] space-y-3">
                  <h4 className="text-xs font-semibold text-white">Add Lecture Summary</h4>
                  <input
                    type="text"
                    required
                    placeholder="Note Title (e.g. Kosaraju Algorithm Edge Cases)"
                    value={newNoteTitle}
                    onChange={e => setNewNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#1f293d] text-xs text-slate-200 placeholder-slate-500 focus-ring"
                  />
                  <textarea
                    rows={4}
                    required
                    placeholder="Write detailed notes, formulas, code snippets..."
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#1f293d] text-xs text-slate-200 placeholder-slate-500 focus-ring resize-none font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Save Note
                    </button>
                  </div>
                </form>
              )}

              {/* Notes List */}
              {subjectNotes.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#111827] border border-[#1e293d] text-center text-slate-400 text-xs">
                  No notes logged for this subject yet. Click "New Note" to record lecture takeaways.
                </div>
              ) : (
                <div className="space-y-3">
                  {subjectNotes.map(note => (
                    <div
                      key={note.id}
                      className="p-4 rounded-xl bg-[#111827] border border-[#1e293d] space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">
                          {note.title}
                        </h4>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded focus-ring"
                          aria-label="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                        {note.content}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-[#1b2538]">
                        <span className="font-mono">
                          Updated: {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          {note.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="bg-[#162035] px-1.5 py-0.2 rounded text-slate-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Official Syllabus Document In-App Viewer Modal */}
      <DocumentViewerModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        selectedDoc={modalDoc}
        onSelectDoc={doc => setModalDoc(doc)}
      />
    </div>
  )
}
