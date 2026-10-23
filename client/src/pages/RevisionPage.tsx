import React, { useState, useMemo } from 'react'
import { 
  RotateCcw, 
  CheckCircle2, 
  Star, 
  Clock, 
  Plus, 
  CheckSquare, 
  BrainCircuit
} from 'lucide-react'
import { useApp } from '../context/AppContext'

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
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              Academic Retention & Mastery
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Spaced Review Queue
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1">
            Revision & Progress Center
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Target weak areas, run active self-recall sessions, and log revision time for upcoming internal/external exams.
          </p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors self-start sm:self-auto focus-ring"
        >
          <Plus className="w-4 h-4" />
          <span>Log Revision Session</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293d]">
          <span className="text-xs text-slate-400 block">Revision Queue</span>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {weakTopics.length}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Topics needing review
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293d]">
          <span className="text-xs text-emerald-400 block">Understood Topics</span>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {understoodTopics.length}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Confidence 4–5 / 5
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293d]">
          <span className="text-xs text-blue-400 block">Revision Sessions</span>
          <div className="text-2xl font-bold font-mono text-blue-300 mt-1">
            {revisionSessions.length}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Logged reviews
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293d]">
          <span className="text-xs text-slate-400 block">Exam Timeline</span>
          <div className="text-sm font-bold font-mono text-white mt-2">
            10–22 Dec 2026
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
            Official university dates
          </span>
        </div>
      </div>

      {/* Main Grid: Left Weak Topics & Recall, Right Logged Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Weak Topics Queue & Active Recall Checklist */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Topics Marked for Review ({weakTopics.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Needs Mastery</span>
            </div>

            {weakTopics.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-white">No topics currently flagged for revision.</p>
                <p className="mt-1">Flag challenging lectures or syllabus topics during daily study to populate this queue.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {weakTopics.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[#0b0f19] border border-[#1e293d] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-blue-400 bg-[#162035] px-1.5 py-0.2 rounded border border-[#21304d]">
                          {item.subjectCode}
                        </span>
                        <span className="text-xs font-semibold text-white truncate block">
                          {item.title}
                        </span>
                      </div>
                      {item.date && (
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                          From lecture on {item.date}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSessionSubjectId(item.subjectId)
                          setSessionTopicTitle(item.title)
                          setIsLogModalOpen(true)
                        }}
                        className="px-2.5 py-1 rounded bg-[#162035] hover:bg-blue-600 hover:text-white text-blue-300 border border-[#21304d] text-[11px] font-medium transition-colors"
                      >
                        Revise Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Active Self-Recall Checklist */}
          <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Daily Feynman Self-Recall Checklist
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Active Recall</span>
            </div>

            <p className="text-xs text-slate-300">
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
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-[#0b0f19] border border-[#1e293d] cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!checkedRecall[q.id]}
                    onChange={() => toggleRecallCheck(q.id)}
                    className="mt-0.5 rounded bg-[#0b0f19] border-[#21304d] text-blue-600 focus-ring"
                  />
                  <span className={`text-xs ${checkedRecall[q.id] ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {q.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Revision Log History */}
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Logged Revision Sessions ({revisionSessions.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Verified Activity</span>
            </div>

            {revisionSessions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-white">No revision sessions logged yet.</p>
                <p className="mt-1">Record your study and revision periods to track retention before midterms.</p>
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="mt-4 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Revision</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {revisionSessions.map(session => {
                  const sub = subjects.find(s => s.id === session.subjectId)
                  return (
                    <div
                      key={session.id}
                      className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#1e293d] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-blue-400 font-bold bg-[#162035] px-2 py-0.5 rounded border border-[#21304d]">
                          {sub?.code}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.durationMinutes}m
                          </span>
                          <span>•</span>
                          <span>{session.date}</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {session.topicTitle}
                      </h4>

                      {session.notes && (
                        <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                          {session.notes}
                        </p>
                      )}

                      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          Confidence post-review: {session.confidenceAfter}/5
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Revision Session Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div 
            className="w-full max-w-md bg-[#0f172a] border border-[#1e293d] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293d]">
              <h3 className="text-base font-bold text-white">Log Revision Session</h3>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogRevision} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                <select
                  value={sessionSubjectId}
                  onChange={e => setSessionSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Topic Reviewed *</label>
                <input
                  type="text"
                  required
                  value={sessionTopicTitle}
                  onChange={e => setSessionTopicTitle(e.target.value)}
                  placeholder="e.g. Tarjan SCC implementation & Low-link values"
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={sessionDuration}
                    onChange={e => setSessionDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Confidence (1–5)</label>
                  <select
                    value={sessionConfidence}
                    onChange={e => setSessionConfidence(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring font-mono"
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
                <label className="block text-slate-300 font-semibold mb-1">Key Takeaway / Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="What clicked? What problem did you solve?"
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e293d]">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs"
                >
                  Save Revision Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
