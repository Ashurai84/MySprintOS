import React, { useState, useMemo } from 'react'
import { 
  Code2, 
  CheckCircle2, 
  RotateCcw, 
  HelpCircle, 
  AlertTriangle, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Terminal, 
  ArrowRight,
  Trash2
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { initialJavaDiagnosticQuestions } from '../data/defaultData'
import type { JavaTopicRecovery, LearningStatus } from '../types'

interface JavaRecoveryPageProps {
  onNavigateToRevision?: () => void
}

export const JavaRecoveryPage: React.FC<JavaRecoveryPageProps> = ({ onNavigateToRevision }) => {
  const { 
    javaTopics, 
    updateJavaTopic, 
    javaDiagnosticCompleted, 
    javaDiagnosticScore, 
    submitJavaDiagnostic, 
    resetJavaDiagnostic,
    addRevisionSession
  } = useApp()

  // Tabs: 'topics' | 'diagnostic' | 'mistakes'
  const [activeTab, setActiveTab] = useState<'topics' | 'diagnostic' | 'mistakes'>('topics')
  
  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(javaTopics[0]?.id || null)

  // Diagnostic Quiz State
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState<{
    score: number
    total: number
    passed: boolean
    weakTopicIds: string[]
  } | null>(null)

  // New mistake input per topic
  const [newMistakeText, setNewMistakeText] = useState<Record<string, string>>({})

  // Filter topics
  const filteredTopics = useMemo(() => {
    if (selectedCategory === 'all') return javaTopics
    return javaTopics.filter(t => t.category === selectedCategory)
  }, [javaTopics, selectedCategory])

  // Analytics
  const masteryStats = useMemo(() => {
    const total = javaTopics.length
    const understood = javaTopics.filter(t => t.status === 'understood').length
    const learning = javaTopics.filter(t => t.status === 'learning').length
    const needsRevision = javaTopics.filter(t => t.status === 'needs_revision' || t.needsRevision).length
    const avgConfidence = Math.round((javaTopics.reduce((acc, t) => acc + t.confidenceRating, 0) / total) * 10) / 10
    const percentage = Math.round((understood / total) * 100)

    return { total, understood, learning, needsRevision, avgConfidence, percentage }
  }, [javaTopics])

  // Handle Diagnostic submit
  const handleDiagnosticSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = submitJavaDiagnostic(answers)
    setDiagnosticResult(result)
    setQuizSubmitted(true)
  }

  const handleRetakeDiagnostic = () => {
    resetJavaDiagnostic()
    setAnswers({})
    setQuizSubmitted(false)
    setDiagnosticResult(null)
  }

  // Handle Add Mistake
  const handleAddMistake = (topicId: string) => {
    const text = newMistakeText[topicId]?.trim()
    if (!text) return
    const topic = javaTopics.find(t => t.id === topicId)
    if (topic) {
      updateJavaTopic(topicId, {
        mistakesLogged: [...topic.mistakesLogged, text]
      })
      setNewMistakeText(prev => ({ ...prev, [topicId]: '' }))
    }
  }

  const handleRemoveMistake = (topicId: string, index: number) => {
    const topic = javaTopics.find(t => t.id === topicId)
    if (topic) {
      updateJavaTopic(topicId, {
        mistakesLogged: topic.mistakesLogged.filter((_, i) => i !== index)
      })
    }
  }

  // Schedule spaced repetition session for a topic
  const handleScheduleRevision = (topic: JavaTopicRecovery) => {
    addRevisionSession({
      subjectId: 'dsa-3', // linked to DSA III foundations
      topicTitle: `Java Recovery: ${topic.title}`,
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days later
      durationMinutes: 30,
      confidenceAfter: topic.confidenceRating,
      notes: `Review key concepts: ${topic.keyConcepts.join(', ')}`
    })
    updateJavaTopic(topic.id, { needsRevision: true })
    if (onNavigateToRevision) {
      onNavigateToRevision()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293d] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Code2 className="w-6 h-6 text-amber-400" />
              Java Fundamentals Recovery
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
              DSA III Prerequisite Track
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Rebuild core language mastery: syntax, OOP mechanisms, JVM memory models, collections & clean coding patterns
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-[#0e1626] p-1 rounded-lg border border-[#1e293d] text-xs">
          <button
            onClick={() => setActiveTab('topics')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'topics' ? 'bg-amber-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Topic Curriculum (14)
          </button>
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'diagnostic' ? 'bg-amber-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Diagnostic Quiz</span>
            {javaDiagnosticCompleted && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('mistakes')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'mistakes' ? 'bg-amber-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mistake Log
          </button>
        </div>
      </div>

      {/* Analytics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0e1626] border border-[#1e293d]">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider block">Mastery Score</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white font-mono">{masteryStats.percentage}%</span>
            <span className="text-xs text-slate-400">({masteryStats.understood}/{masteryStats.total})</span>
          </div>
          <div className="w-full bg-[#18233a] h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${masteryStats.percentage}%` }}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1626] border border-[#1e293d]">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider block">Avg Confidence</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-bold text-amber-400 font-mono">{masteryStats.avgConfidence}</span>
            <div className="flex items-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <span className="text-xs text-slate-500">/ 5.0</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Self-rated recall</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1626] border border-[#1e293d]">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider block">Needs Revision</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-rose-400 font-mono">{masteryStats.needsRevision}</span>
            <span className="text-xs text-slate-400">topics</span>
          </div>
          <span className="text-[11px] text-rose-300/80 mt-1 block">Prioritize in revision queue</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1626] border border-[#1e293d]">
          <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider block">Diagnostic Status</span>
          <div className="mt-1">
            {javaDiagnosticCompleted ? (
              <div className="flex items-center gap-1.5 text-emerald-300 text-sm font-bold font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Score: {javaDiagnosticScore?.score}/{javaDiagnosticScore?.total}</span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-amber-400">Not Taken Yet</span>
            )}
          </div>
          <button
            onClick={() => setActiveTab('diagnostic')}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-medium mt-1 inline-flex items-center gap-1"
          >
            <span>{javaDiagnosticCompleted ? 'View diagnostic details' : 'Take 10-question quiz'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* TAB 1: CURRICULUM TOPICS */}
      {activeTab === 'topics' && (
        <div className="space-y-4">
          {/* Category filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono">Filter Category:</span>
            {['all', 'Syntax & Flow', 'OOP Core', 'Data Structures & I/O'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'bg-[#10192e] text-slate-400 hover:text-white border border-[#1e293d]'
                }`}
              >
                {cat === 'all' ? 'All Topics (14)' : cat}
              </button>
            ))}
          </div>

          {/* Topics List */}
          <div className="space-y-3">
            {filteredTopics.map(topic => {
              const isExpanded = expandedTopicId === topic.id
              return (
                <div 
                  key={topic.id}
                  className="rounded-xl bg-[#0e1626] border border-[#1e293d] overflow-hidden transition-all"
                >
                  {/* Topic Row Header */}
                  <div 
                    onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#121c32] transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        topic.status === 'understood' 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : topic.status === 'needs_revision'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        <Code2 className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono text-slate-400 bg-[#162138] px-2 py-0.5 rounded border border-[#21304d]">
                            {topic.category}
                          </span>
                          <h3 className="text-sm font-bold text-white tracking-tight">
                            {topic.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {topic.description}
                        </p>
                      </div>
                    </div>

                    {/* Status badge & expansion toggle */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="flex items-center gap-1 text-amber-400 font-mono text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{topic.confidenceRating}/5</span>
                      </div>

                      <select
                        value={topic.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateJavaTopic(topic.id, { status: e.target.value as LearningStatus })}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium focus-ring ${
                          topic.status === 'understood'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                            : topic.status === 'needs_revision'
                            ? 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                            : 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="learning">In Progress</option>
                        <option value="understood">Understood</option>
                        <option value="needs_revision">Needs Revision</option>
                      </select>

                      <button className="text-slate-400 hover:text-white p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content: Key Concepts, Code, Practice & Mistakes */}
                  {isExpanded && (
                    <div className="p-4 pt-2 border-t border-[#1a263e] space-y-4 bg-[#0a101d]">
                      {/* Key Concepts */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Core Conceptual Blueprint
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {topic.keyConcepts.map((concept, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-[#111a2e] border border-[#1e2a44] text-xs text-slate-300">
                              • {concept}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Code Snippet */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-blue-400" />
                            Reference Implementation
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">Java 17+ Syntax</span>
                        </div>
                        <pre className="p-3.5 rounded-xl bg-[#060912] border border-[#1a243a] font-mono text-xs text-amber-200/90 overflow-x-auto leading-relaxed">
                          {topic.codeSnippet}
                        </pre>
                      </div>

                      {/* Practice Exercise */}
                      <div className="p-3 rounded-xl bg-[#111a2f] border border-[#1e2f52] space-y-1">
                        <span className="text-[11px] font-bold text-blue-400 uppercase font-mono">Practice Prompt</span>
                        <p className="text-xs text-slate-200 font-medium">
                          {topic.practicePrompt}
                        </p>
                      </div>

                      {/* Action Bar: Confidence & Revision Scheduling */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#162138]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">Set Confidence:</span>
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => updateJavaTopic(topic.id, { confidenceRating: rating })}
                              className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-colors ${
                                topic.confidenceRating === rating
                                  ? 'bg-amber-500 text-black font-extrabold shadow-xs'
                                  : 'bg-[#152035] text-slate-400 hover:text-white border border-[#233352]'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleScheduleRevision(topic)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Schedule Revision (2d)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DIAGNOSTIC QUIZ */}
      {activeTab === 'diagnostic' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#0e1626] border border-[#1e293d] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                Java Fundamentals Diagnostic Assessment
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                10 conceptual questions spanning memory, OOP dispatch, string pooling, loops, and exceptions.
              </p>
            </div>

            {javaDiagnosticCompleted && (
              <button
                onClick={handleRetakeDiagnostic}
                className="px-3.5 py-1.5 rounded-lg bg-[#141f36] hover:bg-[#1b2b4a] text-slate-300 text-xs font-semibold border border-[#21304d] transition-colors shrink-0"
              >
                Retake Diagnostic
              </button>
            )}
          </div>

          {/* Diagnostic Result Banner */}
          {(diagnosticResult || javaDiagnosticScore) && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              (diagnosticResult?.passed ?? (javaDiagnosticScore?.score ?? 0) >= 7)
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>
                  Assessment Result: {diagnosticResult?.score ?? javaDiagnosticScore?.score} / {diagnosticResult?.total ?? javaDiagnosticScore?.total} Correct ({Math.round(((diagnosticResult?.score ?? javaDiagnosticScore?.score ?? 0) / 10) * 100)}%)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {(diagnosticResult?.passed ?? (javaDiagnosticScore?.score ?? 0) >= 7)
                  ? 'Great baseline! Core OOP and language syntax fundamentals are in place. Focus on Collections and Exception edge cases.'
                  : 'Diagnostic identified foundational gaps in memory references and class inheritance. Priority topics have been flagged for revision in your curriculum.'}
              </p>
            </div>
          )}

          {/* Questions Form */}
          <form onSubmit={handleDiagnosticSubmit} className="space-y-4">
            {initialJavaDiagnosticQuestions.map((q, idx) => {
              const selectedOpt = answers[q.id]
              const showCorrectness = quizSubmitted || javaDiagnosticCompleted

              return (
                <div 
                  key={q.id}
                  className="p-4 rounded-xl bg-[#0e1626] border border-[#1e293d] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Q{idx + 1} • {q.topic}
                    </span>
                    {showCorrectness && (
                      <span className={`text-[11px] font-bold font-mono ${
                        selectedOpt === q.correctIndex ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {selectedOpt === q.correctIndex ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-white">
                    {q.question}
                  </h4>

                  {/* Options */}
                  <div className="space-y-1.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOpt === optIdx
                      const isCorrect = optIdx === q.correctIndex
                      return (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            showCorrectness
                              ? isCorrect
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                                : isSelected
                                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                                : 'bg-[#0b0f19] border-[#1e293d] text-slate-400'
                              : isSelected
                              ? 'bg-blue-950/40 border-blue-500/50 text-white font-medium'
                              : 'bg-[#0b0f19] border-[#1e293d] text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            disabled={quizSubmitted || javaDiagnosticCompleted}
                            checked={isSelected}
                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                            className="rounded-full text-blue-600 focus-ring"
                          />
                          <span>{opt}</span>
                        </label>
                      )
                    })}
                  </div>

                  {/* Explanation if reviewed */}
                  {showCorrectness && (
                    <div className="p-2.5 rounded-lg bg-[#0b101c] border border-[#1a253c] text-xs text-slate-400">
                      <strong className="text-amber-300">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              )
            })}

            {!quizSubmitted && !javaDiagnosticCompleted && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={Object.keys(answers).length < initialJavaDiagnosticQuestions.length}
                  className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Submit Diagnostic Assessment
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 3: MISTAKE LOG */}
      {activeTab === 'mistakes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0e1626] border border-[#1e293d]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Active Java Anti-Pattern & Mistake Journal
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Document edge cases where code failed, wrong syntax was written, or exceptions were triggered during DSA practice.
            </p>
          </div>

          <div className="space-y-3">
            {javaTopics.map(topic => (
              <div key={topic.id} className="p-4 rounded-xl bg-[#0e1626] border border-[#1e293d] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {topic.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {topic.mistakesLogged.length} recorded
                  </span>
                </div>

                {/* Mistakes list */}
                {topic.mistakesLogged.length > 0 ? (
                  <ul className="space-y-1.5">
                    {topic.mistakesLogged.map((m, mIdx) => (
                      <li 
                        key={mIdx} 
                        className="p-2 rounded-lg bg-[#0b0f19] border border-[#1e293d] text-xs text-rose-300 flex items-center justify-between gap-2"
                      >
                        <span>❌ {m}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMistake(topic.id, mIdx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Remove entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No anti-patterns logged yet for this topic.</p>
                )}

                {/* Add mistake input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newMistakeText[topic.id] || ''}
                    onChange={e => setNewMistakeText(prev => ({ ...prev, [topic.id]: e.target.value }))}
                    placeholder="Log a new mistake (e.g. Forgot null check before calling .length())"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#090d17] border border-[#1e2b44] text-xs text-white placeholder-slate-500 focus-ring"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddMistake(topic.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#141f36] hover:bg-[#1b2b4a] text-xs font-semibold text-slate-200 border border-[#21304d] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
