import React, { useState, useMemo } from 'react'
import { 
  RotateCcw, 
  CheckCircle2, 
  Star, 
  Clock, 
  Plus, 
  CheckSquare, 
  BrainCircuit,
  X
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { cn } from 'cn'

interface RevisionPageProps {
  onNavigateToLearning?: () => void
}

export const RevisionPage: React.FC<RevisionPageProps> = ({
  onNavigateToLearning: _onNavigateToLearning
}) => {
  const { subjects, lectures, topicProgress, revisionSessions, addRevisionSession } = useApp()

  const todayStr = new Date().toISOString().split('T')[0]

  // Form modal state for logging manual revision
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [sessionSubjectId, setSessionSubjectId] = useState<string>(subjects[0]?.id || 'dsa-3')
  const [sessionTopicTitle, setSessionTopicTitle] = useState<string>('')
  const [sessionDuration, setSessionDuration] = useState<number>(30)
  const [sessionConfidence, setSessionConfidence] = useState<number>(4)
  const [sessionNotes, setSessionNotes] = useState<string>('')

  // Self-recall checklist state (local session storage or quick toggle)
  const [checkedRecall, setCheckedRecall] = useState<Record<string, boolean>>({})

  // 1. Weak topics: from topicProgress with confidence <= 2 or needsRevision === true, plus lectures with needsRevision
  const weakTopics = useMemo(() => {
    const list: Array<{
      id: string
      title: string
      subjectId: string
      subjectCode: string
      confidence: number
      source: 'topic' | 'lecture'
      date?: string
    }> = []

    // From topic progress
    for (const sub of subjects) {
      for (const mod of sub.modules) {
        for (const topic of mod.topics) {
          const rec = topicProgress[topic.id]
          if (rec && (rec.needsRevision || rec.confidenceRating <= 2 || rec.status === 'needs_revision')) {
            list.push({
              id: topic.id,
              title: topic.title,
              subjectId: sub.id,
              subjectCode: sub.code,
              confidence: rec.confidenceRating,
              source: 'topic'
            })
          }
        }
      }
    }

    // From lectures flagged needsRevision
    for (const lec of lectures) {
      if (lec.needsRevision) {
        const sub = subjects.find(s => s.id === lec.subjectId)
        if (!list.some(item => item.title.toLowerCase() === lec.title.toLowerCase())) {
          list.push({
            id: lec.id,
            title: lec.title,
            subjectId: lec.subjectId,
            subjectCode: sub?.code || 'S5',
            confidence: lec.confidenceRating || 2,
            source: 'lecture',
            date: lec.date
          })
        }
      }
    }

    return list
  }, [subjects, topicProgress, lectures])

  // 2. Recently understood topics (confidence >= 4 or status === understood)
  const understoodTopics = useMemo(() => {
    const list: Array<{ title: string; subjectCode: string; confidence: number }> = []
    for (const sub of subjects) {
      for (const mod of sub.modules) {
        for (const topic of mod.topics) {
          const rec = topicProgress[topic.id]
          if (rec && (rec.status === 'understood' || rec.confidenceRating >= 4)) {
            list.push({
              title: topic.title,
              subjectCode: sub.code,
              confidence: rec.confidenceRating
            })
          }
        }
      }
    }
    return list
  }, [subjects, topicProgress])

  const handleLogRevision = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionTopicTitle.trim()) return

    addRevisionSession({
      date: todayStr,
      subjectId: sessionSubjectId,
      topicTitle: sessionTopicTitle.trim(),
      durationMinutes: Number(sessionDuration),
      confidenceAfter: Number(sessionConfidence),
      notes: sessionNotes.trim() || undefined
    })

    setSessionTopicTitle('')
    setSessionNotes('')
    setIsLogModalOpen(false)
  }

  const toggleRecallCheck = (id: string) => {
    setCheckedRecall(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider text-primary border-primary/20 bg-primary/5">
              Academic Retention & Mastery
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Spaced Review Queue
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mt-1">
            Revision & Progress Center
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Target weak areas, run active self-recall sessions, and log revision time for upcoming internal/external exams.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsLogModalOpen(true)}
          className="h-8 text-xs gap-1.5 self-start sm:self-auto font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Revision Session</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 border-border bg-card">
          <span className="text-xs text-muted-foreground block">Revision Queue</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {weakTopics.length}
          </div>
          <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block">
            Topics needing review
          </span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <span className="text-xs text-emerald-400 block">Understood Topics</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {understoodTopics.length}
          </div>
          <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block">
            Confidence 4–5 / 5
          </span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <span className="text-xs text-primary block">Revision Sessions</span>
          <div className="text-2xl font-bold font-mono text-primary mt-1">
            {revisionSessions.length}
          </div>
          <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block">
            Logged reviews
          </span>
        </Card>

        <Card className="p-4 border-border bg-card">
          <span className="text-xs text-muted-foreground block">Exam Timeline</span>
          <div className="text-sm font-bold font-mono text-foreground mt-2">
            10–22 Dec 2026
          </div>
          <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block">
            Official university dates
          </span>
        </Card>
      </div>

      {/* Main Grid: Left Weak Topics & Recall, Right Logged Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Weak Topics Queue & Active Recall Checklist */}
        <div className="space-y-4">
          <Card className="p-5 border-border bg-card space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  Topics Marked for Review ({weakTopics.length})
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                Needs Mastery
              </Badge>
            </div>

            {weakTopics.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-foreground">No topics currently flagged for revision.</p>
                <p className="mt-1">Flag challenging lectures or syllabus topics during daily study to populate this queue.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {weakTopics.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] font-bold text-primary border-primary/20 bg-primary/5">
                          {item.subjectCode}
                        </Badge>
                        <span className="text-xs font-semibold text-foreground truncate block">
                          {item.title}
                        </span>
                      </div>
                      {item.date && (
                        <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
                          From lecture on {item.date}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSessionSubjectId(item.subjectId)
                          setSessionTopicTitle(item.title)
                          setIsLogModalOpen(true)
                        }}
                        className="h-7 text-[11px] px-2.5"
                      >
                        Revise Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Daily Active Self-Recall Checklist */}
          <Card className="p-5 border-border bg-card space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  Daily Feynman Self-Recall Checklist
                </h3>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Active Recall
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Test your recall without opening reference notes before calling a topic complete:
            </p>

            <div className="space-y-2 pt-1 text-xs">
              {[
                { id: 'q1', text: 'State the core problem definition in my own words without notes' },
                { id: 'q2', text: 'Write down key time & space complexities from memory' },
                { id: 'q3', text: 'Explain the edge cases or failure modes (e.g. cycles, disconnectivity, null inputs)' },
                { id: 'q4', text: 'Sketch or code the core algorithm/pattern implementation on blank paper' }
              ].map(q => (
                <label 
                  key={q.id}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/20 border border-border cursor-pointer hover:border-foreground/20 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!checkedRecall[q.id]}
                    onChange={() => toggleRecallCheck(q.id)}
                    className="mt-0.5 rounded bg-card border-border text-primary focus-ring"
                  />
                  <span className={cn('text-xs', checkedRecall[q.id] ? 'line-through text-muted-foreground' : 'text-foreground')}>
                    {q.text}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Revision Log History */}
        <Card className="p-5 border-border bg-card flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  Logged Revision Sessions ({revisionSessions.length})
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                Verified Activity
              </Badge>
            </div>

            {revisionSessions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                <Clock className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                <p className="font-semibold text-foreground">No revision sessions logged yet.</p>
                <p className="mt-1">Record your study and revision periods to track retention before midterms.</p>
                <Button
                  size="sm"
                  onClick={() => setIsLogModalOpen(true)}
                  className="mt-4 h-8 text-xs gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Revision</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {revisionSessions.map(session => {
                  const sub = subjects.find(s => s.id === session.subjectId)
                  return (
                    <Card
                      key={session.id}
                      className="p-3.5 bg-muted/20 border-border space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="font-mono text-primary font-bold border-primary/20 bg-primary/5">
                          {sub?.code}
                        </Badge>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.durationMinutes}m
                          </span>
                          <span>•</span>
                          <span>{session.date}</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-foreground tracking-tight">
                        {session.topicTitle}
                      </h4>

                      {session.notes && (
                        <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                          {session.notes}
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          Confidence post-review: {session.confidenceAfter}/5
                        </span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Log Revision Session Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card 
            className="w-full max-w-md bg-card border-border p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Log Revision Session</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLogModalOpen(false)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleLogRevision} className="space-y-3 text-xs">
              <div>
                <label className="block text-foreground font-semibold mb-1">Subject</label>
                <select
                  value={sessionSubjectId}
                  onChange={e => setSessionSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-foreground text-xs focus-ring"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">Topic Reviewed *</label>
                <Input
                  type="text"
                  required
                  value={sessionTopicTitle}
                  onChange={e => setSessionTopicTitle(e.target.value)}
                  placeholder="e.g. Tarjan SCC implementation & Low-link values"
                  className="text-xs bg-muted/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground font-semibold mb-1">Duration (mins)</label>
                  <Input
                    type="number"
                    min="15"
                    step="15"
                    value={sessionDuration}
                    onChange={e => setSessionDuration(Number(e.target.value))}
                    className="text-xs bg-muted/40 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1">Confidence (1–5)</label>
                  <select
                    value={sessionConfidence}
                    onChange={e => setSessionConfidence(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-foreground text-xs focus-ring font-mono"
                  >
                    <option value={1}>1 - Weak / Need Help</option>
                    <option value={2}>2 - Shaky</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - Understood Well</option>
                    <option value={5}>5 - Completely Mastered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">Key Takeaway / Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="What clicked? What problem did you solve?"
                  className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-foreground text-xs focus-ring resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLogModalOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-semibold"
                >
                  Save Revision Log
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

