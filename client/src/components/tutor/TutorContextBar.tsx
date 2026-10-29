import React from 'react'
import { BookOpen, SlidersHorizontal, ChevronRight } from 'lucide-react'
import type { Subject, TutorMode } from '../../types'

interface TutorContextBarProps {
  subjects: Subject[]
  selectedSubjectId: string
  selectedTopicId: string
  mode: TutorMode
  onSelectSubject: (subjectId: string) => void
  onSelectTopic: (topicId: string, topicTitle: string) => void
  onSelectMode: (mode: TutorMode) => void
}

export const TUTOR_MODES: Array<{ id: TutorMode; label: string; badge: string; description: string }> = [
  {
    id: 'explain_simply',
    label: 'Explain Simply',
    badge: 'Beginner / Analogy',
    description: 'Everyday analogies, simple terms, small examples, and quick comprehension checks.'
  },
  {
    id: 'btech_student',
    label: 'B.Tech Student',
    badge: 'Undergraduate CSE',
    description: 'Standard engineering depth, definitions, advantages/disadvantages, and exam answer structure.'
  },
  {
    id: 'step_by_step',
    label: 'Step-by-Step',
    badge: 'Logic & Complexity',
    description: 'Detailed numbered breakdown, algorithm invariants, edge cases, and time/space complexity.'
  },
  {
    id: 'exam_prep',
    label: 'Exam Prep',
    badge: 'Practice Questions',
    description: 'Generates syllabus practice questions (MCQs, short/long answers) and prompts you to attempt first.'
  },
  {
    id: 'revision',
    label: 'Active Revision',
    badge: 'Active Recall',
    description: 'Targeted recall questions on core invariants and definitions to test your retention.'
  },
  {
    id: 'coding_practice',
    label: 'Coding Practice',
    badge: 'Guided Dry-Run',
    description: 'Problem clarity, manual trace table dry-run, edge cases, and clean code implementation.'
  }
]

export const TutorContextBar: React.FC<TutorContextBarProps> = ({
  subjects,
  selectedSubjectId,
  selectedTopicId,
  mode,
  onSelectSubject,
  onSelectTopic,
  onSelectMode
}) => {
  const currentSubject = subjects.find(s => s.id === selectedSubjectId)

  // Extract all topics from the chosen subject's syllabus modules
  const availableTopics = React.useMemo(() => {
    if (!currentSubject) return []
    const topics: Array<{ id: string; title: string; unitNumber: string }> = []
    currentSubject.modules.forEach(mod => {
      mod.topics.forEach(t => {
        topics.push({ id: t.id, title: t.title, unitNumber: mod.unitNumber })
      })
    })
    return topics
  }, [currentSubject])

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const topicId = e.target.value
    const found = availableTopics.find(t => t.id === topicId)
    onSelectTopic(topicId, found ? found.title : '')
  }

  return (
    <div className="bg-zinc-50 border-b border-zinc-200 p-3 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Subject & Topic Selectors */}
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-zinc-800 shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-black" />
          <span className="font-semibold text-zinc-950">Syllabus Focus:</span>
        </div>

        {/* Subject dropdown */}
        <select
          value={selectedSubjectId}
          onChange={e => onSelectSubject(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-900 font-medium focus:border-black focus:outline-none max-w-[210px] truncate transition-colors cursor-pointer shadow-xs hover:border-zinc-400"
        >
          <option value="" className="bg-white text-zinc-900">General (All 6 Subjects)</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id} className="bg-white text-zinc-900">
              {s.name} ({s.code})
            </option>
          ))}
        </select>

        {/* Topic dropdown */}
        {currentSubject && (
          <>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0 hidden sm:block" />
            <select
              value={selectedTopicId}
              onChange={handleTopicChange}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:border-black focus:outline-none max-w-[260px] truncate transition-colors cursor-pointer shadow-xs hover:border-zinc-400"
            >
              <option value="" className="bg-white text-zinc-900">Choose Topic ({availableTopics.length} syllabus topics)</option>
              {availableTopics.map(t => (
                <option key={t.id} value={t.id} className="bg-white text-zinc-900">
                  Unit {t.unitNumber}: {t.title}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Teaching Mode Selector */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 text-xs text-zinc-800">
          <SlidersHorizontal className="w-3.5 h-3.5 text-black" />
          <span className="hidden sm:inline font-medium">Mode:</span>
        </div>

        <select
          value={mode}
          onChange={e => onSelectMode(e.target.value as TutorMode)}
          className="text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg bg-black text-white border border-black hover:bg-zinc-800 focus:outline-none cursor-pointer transition-colors shadow-xs"
        >
          {TUTOR_MODES.map(m => (
            <option key={m.id} value={m.id} className="bg-zinc-900 text-white font-sans">
              {m.label} ({m.badge})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
