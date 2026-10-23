import React, { useState, useMemo } from 'react'
import { 
  Lightbulb, 
  Calendar, 
  Star, 
  RotateCcw, 
  HelpCircle, 
  CheckCircle2, 
  Search
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { LearningStatus, TopicLearningRecord } from '../types'

interface LearningPageProps {
  onOpenQuickLecture?: (subjectId?: string) => void
  onNavigateToRevision?: () => void
}

export const LearningPage: React.FC<LearningPageProps> = ({
  onOpenQuickLecture: _onOpenQuickLecture,
  onNavigateToRevision: _onNavigateToRevision
}) => {
  const { subjects, lectures, topicProgress, updateTopicProgress, toggleTopicRevision } = useApp()

  const todayStr = new Date().toISOString().split('T')[0]

  // View: 'reflection' | 'progress' | 'doubts'
  const [activeTab, setActiveTab] = useState<'reflection' | 'progress' | 'doubts'>('reflection')
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // 1. Daily Reflection: all lectures on the selected date
  const dateLectures = useMemo(() => {
    return lectures.filter(l => l.date === selectedDate)
  }, [lectures, selectedDate])

  // Dates with lectures for quick reflection date selection
  const lectureDates = useMemo(() => {
    const dates = Array.from(new Set(lectures.map(l => l.date))).sort().reverse()
    if (!dates.includes(todayStr)) {
      dates.unshift(todayStr)
    }
    return dates
  }, [lectures, todayStr])

  // 2. Syllabus Topics combined with user learning progress
  const allSyllabusTopics = useMemo(() => {
    const list: Array<{
      topicId: string
      title: string
      subjectId: string
      subjectCode: string
      subjectName: string
      unitNumber: string
      unitTitle: string
      progress: TopicLearningRecord
    }> = []

    for (const sub of subjects) {
      if (selectedSubjectId !== 'all' && sub.id !== selectedSubjectId) continue

      for (const mod of sub.modules) {
        for (const topic of mod.topics) {
          const rec: TopicLearningRecord = topicProgress[topic.id] || {
            topicId: topic.id,
            subjectId: sub.id,
            status: 'not_started',
            confidenceRating: 1,
            needsRevision: false,
            updatedAt: new Date().toISOString()
          }

          if (statusFilter !== 'all' && rec.status !== statusFilter) continue

          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            const matchTitle = topic.title.toLowerCase().includes(q)
            const matchNotes = rec.personalNotes?.toLowerCase().includes(q)
            const matchQuestions = rec.questionsToAsk?.toLowerCase().includes(q)
            if (!matchTitle && !matchNotes && !matchQuestions) continue
          }

          list.push({
            topicId: topic.id,
            title: topic.title,
            subjectId: sub.id,
            subjectCode: sub.code,
            subjectName: sub.name,
            unitNumber: mod.unitNumber,
            unitTitle: mod.title,
            progress: rec
          })
        }
      }
    }
    return list
  }, [subjects, selectedSubjectId, statusFilter, searchQuery, topicProgress])

  // 3. Doubts / Question queue for professors
  const doubtsQueue = useMemo(() => {
    return lectures
      .filter(l => l.doubtsOrQuestions && l.doubtsOrQuestions.trim().length > 0)
      .map(l => ({
        id: l.id,
        date: l.date,
        subjectId: l.subjectId,
        lectureTitle: l.title,
        question: l.doubtsOrQuestions!,
        faculty: l.faculty
      }))
  }, [lectures])

  const getStatusBadge = (status: LearningStatus) => {
    switch (status) {
      case 'understood':
        return { label: 'Understood', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
      case 'learning':
        return { label: 'Learning In Progress', bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30' }
      case 'needs_revision':
        return { label: 'Needs Revision', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' }
      case 'not_started':
      default:
        return { label: 'Not Started', bg: 'bg-slate-700/40 text-slate-400 border-slate-600' }
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              Active Learning Journal
            </span>
            <span className="text-xs text-slate-400 font-mono">
              6 Subjects • Honest Mastery
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1">
            My Learning & Academic Reflections
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Connect lectures directly to understanding. Record what clicked, track doubts, and flag topics for revision.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-lg border border-[#1e293d] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('reflection')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'reflection' 
                ? 'bg-blue-600 text-white font-semibold shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Reflection
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'progress' 
                ? 'bg-blue-600 text-white font-semibold shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Topic Mastery ({allSyllabusTopics.length})
          </button>
          <button
            onClick={() => setActiveTab('doubts')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'doubts' 
                ? 'bg-blue-600 text-white font-semibold shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Question Queue ({doubtsQueue.length})
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DAILY REFLECTION TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'reflection' && (
        <div className="space-y-5">
          {/* Date Selector */}
          <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-white">Select Reflection Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#21304d] text-xs text-white font-mono focus-ring"
              />
            </div>

            {/* Quick date chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
              <span className="text-[11px] text-slate-500">Recent:</span>
              {lectureDates.slice(0, 4).map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`px-2 py-1 rounded text-[11px] transition-colors border ${
                    selectedDate === d
                      ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                      : 'bg-[#0b0f19] text-slate-400 border-[#1e293d] hover:text-white'
                  }`}
                >
                  {d === todayStr ? 'Today' : d}
                </button>
              ))}
            </div>
          </div>

          {/* Daily reflection content */}
          {dateLectures.length === 0 ? (
            <div className="p-12 rounded-xl bg-[#111827] border border-[#1e293d] text-center text-slate-400 text-xs">
              <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">
                No lectures logged for {selectedDate}.
              </p>
              <p className="mt-1 text-slate-400">
                Log a lecture session from today to review what you learned, concepts covered, and questions for your professor.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Combined reflection across {dateLectures.length} lecture session{dateLectures.length > 1 ? 's' : ''} on {selectedDate}</span>
                <span className="font-mono text-emerald-400">
                  {dateLectures.filter(l => l.status === 'attended').length} Attended
                </span>
              </div>

              {dateLectures.map(lec => {
                const sub = subjects.find(s => s.id === lec.subjectId)
                return (
                  <div 
                    key={lec.id}
                    className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400 bg-[#162035] px-2 py-0.5 rounded border border-[#21304d]">
                            {sub?.code}
                          </span>
                          <span className="text-xs text-slate-300 font-medium">{sub?.name}</span>
                          <span className="text-xs text-slate-500 font-mono">• {lec.durationMinutes}m</span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">
                          {lec.title}
                        </h3>
                      </div>

                      {lec.confidenceRating && (
                        <div className="flex items-center gap-1 bg-[#0b0f19] px-2.5 py-1 rounded-lg border border-[#1e293d]">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-mono font-bold text-amber-300">
                            {lec.confidenceRating}/5
                          </span>
                        </div>
                      )}
                    </div>

                    {/* What I learned */}
                    {lec.whatILearned ? (
                      <div className="p-3.5 rounded-lg bg-[#0b0f19] border border-[#1e293d] text-xs space-y-1">
                        <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                          What I Learned Today
                        </span>
                        <p className="text-slate-200 leading-relaxed">
                          {lec.whatILearned}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        No learning notes recorded for this lecture yet.
                      </p>
                    )}

                    {/* Key Concepts */}
                    {lec.importantConcepts && lec.importantConcepts.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">Concepts Understood:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {lec.importantConcepts.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-[#131e33] border border-[#1f2d48] text-[11px] font-mono text-blue-300">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Doubts / Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {lec.doubtsOrQuestions && (
                        <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
                          <strong className="text-amber-300 block mb-0.5">Question to ask:</strong>
                          {lec.doubtsOrQuestions}
                        </div>
                      )}

                      {lec.examplesOrCode && (
                        <div className="p-3 rounded-lg bg-[#080d16] border border-[#1d293d] text-xs">
                          <strong className="text-slate-400 block mb-1 font-mono text-[11px]">Snippet:</strong>
                          <pre className="text-slate-200 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">
                            {lec.examplesOrCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TOPIC MASTERY PROGRESS TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#1e293d] text-xs text-slate-200 focus-ring"
              >
                <option value="all">All Mastery Statuses</option>
                <option value="understood">Understood</option>
                <option value="learning">Learning In Progress</option>
                <option value="needs_revision">Needs Revision</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search syllabus topic..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#111827] border border-[#1e293d] text-xs text-slate-200 placeholder-slate-500 focus-ring"
              />
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {allSyllabusTopics.map(item => {
              const badge = getStatusBadge(item.progress.status)
              return (
                <div
                  key={item.topicId}
                  className="p-4 rounded-xl bg-[#111827] border border-[#1e293d] hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-blue-400 bg-[#162035] px-2 py-0.5 rounded border border-[#21304d]">
                        {item.subjectCode} • {item.unitNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-slate-400">
                      Module: <span className="text-slate-300">{item.unitTitle}</span>
                    </p>
                  </div>

                  {/* Actions: Mastery status selector & confidence */}
                  <div className="pt-2 border-t border-[#1e293d] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <select
                        value={item.progress.status}
                        onChange={e => updateTopicProgress(item.topicId, item.subjectId, {
                          status: e.target.value as LearningStatus
                        })}
                        className="px-2 py-1 rounded bg-[#0b0f19] border border-[#21304d] text-xs text-slate-200 font-medium focus-ring"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="learning">Learning</option>
                        <option value="understood">Understood</option>
                        <option value="needs_revision">Needs Revision</option>
                      </select>
                    </div>

                    {/* Revision Toggle */}
                    <button
                      onClick={() => toggleTopicRevision(item.topicId, item.subjectId)}
                      className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
                        item.progress.needsRevision
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-[#152033] text-slate-400 hover:text-slate-200 border border-[#21304d]'
                      }`}
                      title="Toggle topic in revision queue"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{item.progress.needsRevision ? 'Queued' : 'Review'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. DOUBTS & QUESTION QUEUE TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'doubts' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-[#111827] border border-[#1e293d] flex items-center gap-2.5 text-xs text-slate-300">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              All unresolved doubts and questions logged during daily lectures are assembled here for your next lab session or faculty office hours.
            </span>
          </div>

          {doubtsQueue.length === 0 ? (
            <div className="p-12 rounded-xl bg-[#111827] border border-[#1e293d] text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No pending doubts in the queue!</p>
              <p className="mt-1">When adding lectures, record any points of confusion to track them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {doubtsQueue.map(item => {
                const sub = subjects.find(s => s.id === item.subjectId)
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#111827] border border-[#1e293d] space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-blue-400 font-bold bg-[#141e33] px-2 py-0.5 rounded border border-[#213152]">
                        {sub?.code}
                      </span>
                      <span className="font-mono">{item.date}</span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-300">
                      From lecture: <span className="text-white font-bold">{item.lectureTitle}</span>
                    </h4>

                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
                      <strong className="text-amber-300 block mb-0.5">Doubt / Question:</strong>
                      {item.question}
                    </div>

                    {item.faculty && (
                      <p className="text-[11px] text-slate-400">
                        Ask: <span className="text-slate-300">{item.faculty}</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
