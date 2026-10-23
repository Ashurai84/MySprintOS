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
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button, buttonVariants } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { cn } from 'cn'

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
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search subjects, faculty or codes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs bg-card border-border"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {filteredSubjects.map(sub => {
            const isSelected = sub.id === selectedSubject?.id
            return (
              <Button
                key={sub.id}
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`font-mono text-xs px-3 py-1 h-8 ${
                  isSelected ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {sub.code}
              </Button>
            )
          })}
        </div>
      </div>

      {selectedSubject && (
        <div className="space-y-5">
          {/* Subject Detail Header Card */}
          <Card className="border-border bg-card p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs font-semibold text-primary border-primary/30 bg-primary/10">
                    {selectedSubject.code}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-xs text-muted-foreground">
                    {selectedSubject.totalHours} Total Hours
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedSubject.courseType}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/20 bg-emerald-500/10 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {selectedSubject.facultyStatus}
                  </Badge>
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                  {selectedSubject.name}
                </h2>

                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {selectedSubject.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span>Faculty SME: <strong className="text-foreground">{selectedSubject.faculty}</strong></span>
                  <span>Cohort: <strong className="text-primary font-mono">{selectedSubject.cohort}</strong></span>
                </div>
              </div>

              {/* Subject Stats Card */}
              <div className="p-4 rounded-lg bg-muted/40 border border-border shrink-0 min-w-[260px] space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Syllabus Progress</span>
                    <span className="font-mono font-medium text-foreground">
                      {subjectProgress.completed} / {subjectProgress.total} ({subjectProgress.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${subjectProgress.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Attendance</span>
                    <span className={`font-mono font-bold text-sm ${subjectAttendance.isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {subjectAttendance.percentage}%
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      {subjectAttendance.attended}/{subjectAttendance.total} held
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => recordSingleClass(selectedSubject.id, true)}
                    className="h-7 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    + Log Class
                  </Button>
                </div>
              </div>
            </div>

            {/* Official Syllabus Document Banner */}
            {selectedSubject.officialDoc && (
              <div className="mt-5 p-3.5 rounded-lg bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-card border border-border text-foreground shrink-0">
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
                      <span className="text-xs font-semibold text-foreground">
                        Curriculum File:
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {selectedSubject.officialDoc.filename}
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-mono h-4 px-1.5">
                        {selectedSubject.officialDoc.size}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Supplied by university department for {selectedSubject.code}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => handleOpenDocViewer()}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View in App</span>
                  </Button>
                  <a
                    href={selectedSubject.officialDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 text-xs gap-1.5')}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                    <span>New Tab</span>
                  </a>
                  <a
                    href={selectedSubject.officialDoc.url}
                    download={selectedSubject.officialDoc.filename}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 text-xs gap-1.5')}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            )}

            {/* If Subject is pending syllabus file upload (honest note) */}
            {!selectedSubject.hasDetailedSyllabus && (
              <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border text-muted-foreground text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-primary" />
                <span>
                  {selectedSubject.syllabusStatusNote || 'Detailed subject syllabus document pending upload from portal. Faculty verified from Academic Plan.'}
                </span>
              </div>
            )}
          </Card>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
            <Button
              size="sm"
              variant={activeTab === 'syllabus' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('syllabus')}
              className="text-xs h-8 gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Syllabus Topics ({selectedSubject.modules.reduce((acc, m) => acc + m.topics.length, 0)})</span>
            </Button>

            <Button
              size="sm"
              variant={activeTab === 'assignments' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('assignments')}
              className="text-xs h-8 gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Assignments ({selectedSubject.assignments.length})</span>
            </Button>

            <Button
              size="sm"
              variant={activeTab === 'resources' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('resources')}
              className="text-xs h-8 gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Resources ({selectedSubject.resources.length})</span>
            </Button>

            <Button
              size="sm"
              variant={activeTab === 'notes' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('notes')}
              className="text-xs h-8 gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Notes & Summaries ({subjectNotes.length})</span>
            </Button>
          </div>

          {/* TAB 1: SYLLABUS TOPICS */}
          {activeTab === 'syllabus' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Check off topics as you attend lectures and complete self-study:</span>
                <span className="font-mono text-foreground font-medium">
                  {subjectProgress.completed} of {subjectProgress.total} completed
                </span>
              </div>

              <div className="space-y-3">
                {selectedSubject.modules.map((mod, modIdx) => {
                  const modKey = `mod-${modIdx}`
                  const isExpanded = expandedModules[modKey] ?? true
                  const modCompletedCount = mod.topics.filter(t => completedTopics[t.id]).length

                  return (
                    <Card 
                      key={modKey}
                      className="border-border bg-card overflow-hidden"
                    >
                      {/* Module Header Accordion Button */}
                      <button
                        onClick={() => toggleModule(modKey)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors focus-ring"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs font-semibold text-primary border-primary/20 bg-primary/5">
                            {mod.unitNumber}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">
                            {mod.title}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                            ({mod.hours} hrs)
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground">
                            {modCompletedCount} / {mod.topics.length}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Topics List */}
                      {isExpanded && (
                        <div className="p-4 pt-2 border-t border-border space-y-2 bg-muted/10">
                          {mod.topics.map(topic => {
                            const isDone = Boolean(completedTopics[topic.id])
                            return (
                              <div
                                key={topic.id}
                                onClick={() => toggleTopic(topic.id)}
                                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                                  isDone
                                    ? 'bg-primary/5 border-primary/20 text-foreground'
                                    : 'bg-card border-border text-foreground hover:border-foreground/20'
                                }`}
                              >
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-primary focus-ring"
                                  aria-label="Toggle topic completion"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20" />
                                  ) : (
                                    <Circle className="w-4 h-4" />
                                  )}
                                </button>
                                <span className={`text-xs ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {topic.title}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Official syllabus assignments & evaluation questions:</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenQuickTask(selectedSubject.id)}
                  className="text-primary hover:text-primary/80 h-7 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Task
                </Button>
              </div>

              {selectedSubject.assignments.length === 0 ? (
                <Card className="p-8 border-border bg-card text-center text-muted-foreground text-xs">
                  No official assignments listed in document yet.
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {selectedSubject.assignments.map(assign => (
                    <Card
                      key={assign.id}
                      className="p-4 border-border bg-card flex flex-col justify-between hover:border-foreground/20 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline" className="font-mono text-[11px] text-primary border-primary/20 bg-primary/5 font-semibold">
                            Assignment #{assign.sno}
                          </Badge>
                          {assign.co && (
                            <Badge variant="secondary" className="text-[10px] font-mono">
                              {assign.co}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                            {assign.type}
                          </Badge>
                        </div>

                        <h4 className="text-sm font-semibold text-foreground leading-snug">
                          {assign.title}
                        </h4>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {assign.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {assign.difficulty ? `Difficulty: ${assign.difficulty}` : 'Internal 30m quota'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConvertAssignmentToTask(assign)}
                          className="h-7 text-xs"
                        >
                          + Track as Task
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESOURCES */}
          {activeTab === 'resources' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Verified reading list, textbooks and online materials:</span>
              </div>

              {selectedSubject.resources.length === 0 ? (
                <Card className="p-8 border-border bg-card text-center text-muted-foreground text-xs">
                  No resources registered for this subject yet.
                </Card>
              ) : (
                <div className="space-y-2.5">
                  {selectedSubject.resources.map((res, idx) => (
                    <Card
                      key={idx}
                      className="p-4 border-border bg-card flex items-start justify-between gap-4 hover:border-foreground/20 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {res.title}
                          </span>
                          {res.type && (
                            <Badge variant="secondary" className="text-[10px] font-mono">
                              {res.type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {res.description}
                        </p>
                        {res.author && (
                          <p className="text-[11px] text-muted-foreground">
                            Author/Publisher: {res.author}
                          </p>
                        )}
                      </div>

                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 text-xs gap-1.5 shrink-0')}
                      >
                        <span>Open Link</span>
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                      </a>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NOTES & LECTURE SUMMARIES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Personal lecture notes and conceptual summaries:
                </span>
                <Button
                  size="sm"
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingNote ? 'Cancel' : 'New Note'}</span>
                </Button>
              </div>

              {/* Add Note Form */}
              {isAddingNote && (
                <Card className="p-4 border-border bg-card space-y-3">
                  <h4 className="text-xs font-semibold text-foreground">Add Lecture Summary</h4>
                  <form onSubmit={handleSaveNote} className="space-y-3">
                    <Input
                      type="text"
                      required
                      placeholder="Note Title (e.g. Kosaraju Algorithm Edge Cases)"
                      value={newNoteTitle}
                      onChange={e => setNewNoteTitle(e.target.value)}
                      className="text-xs bg-muted/40"
                    />
                    <textarea
                      rows={4}
                      required
                      placeholder="Write detailed notes, formulas, code snippets..."
                      value={newNoteContent}
                      onChange={e => setNewNoteContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus-ring resize-none font-mono"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingNote(false)}
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        Save Note
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Notes List */}
              {subjectNotes.length === 0 ? (
                <Card className="p-8 border-border bg-card text-center text-muted-foreground text-xs">
                  No notes logged for this subject yet. Click "New Note" to record lecture takeaways.
                </Card>
              ) : (
                <div className="space-y-3">
                  {subjectNotes.map(note => (
                    <Card
                      key={note.id}
                      className="p-4 border-border bg-card space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">
                          {note.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNote(note.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed font-sans">
                        {note.content}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border">
                        <span className="font-mono">
                          Updated: {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          {note.tags.map((tag, tIdx) => (
                            <Badge key={tIdx} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
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

