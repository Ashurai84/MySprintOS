import React, { useState, useEffect } from 'react'
import { X, Clock, Calendar, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getTodayDateString } from '../utils/dateUtils'

interface QuickAddStudySessionModalProps {
  isOpen: boolean
  onClose: () => void
  initialSubjectId?: string
}

export const QuickAddStudySessionModal: React.FC<QuickAddStudySessionModalProps> = ({
  isOpen,
  onClose,
  initialSubjectId
}) => {
  const { subjects, addStudySession } = useApp()

  const [subjectId, setSubjectId] = useState(initialSubjectId || (subjects[0]?.id ?? ''))
  const [date, setDate] = useState(getTodayDateString())
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [topicsCovered, setTopicsCovered] = useState('')
  const [notes, setNotes] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (initialSubjectId) {
      setSubjectId(initialSubjectId)
    }
  }, [initialSubjectId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topicsCovered.trim()) return

    addStudySession({
      subjectId,
      date,
      durationMinutes: Number(durationMinutes) || 30,
      topicsCovered: topicsCovered.trim(),
      notes: notes.trim() || undefined
    })

    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      setTopicsCovered('')
      setNotes('')
      onClose()
    }, 600)
  }

  const durationOptions = [30, 45, 60, 90, 120, 180]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-[#111827] border border-[#23314e] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f293d] bg-[#0e1422]">
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Log Study Session</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#1a2338] transition-colors focus-ring"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Study session logged successfully!</span>
            </div>
          )}

          {/* Subject Select */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Subject Studied
            </label>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs focus-ring"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs font-mono focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-400" />
                Duration
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs font-mono focus-ring pr-10"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-mono">
                  mins
                </span>
              </div>
            </div>
          </div>

          {/* Quick duration presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400">Presets:</span>
            {durationOptions.map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => setDurationMinutes(mins.toString())}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                  durationMinutes === mins.toString()
                    ? 'bg-blue-600 text-white border-blue-500 font-medium'
                    : 'bg-[#141d30] text-slate-400 border-[#22314e] hover:text-slate-200'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Topics Covered */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Topics Covered <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={topicsCovered}
              onChange={e => setTopicsCovered(e.target.value)}
              placeholder="e.g. Tarjan SCC Low-Link implementation and test run"
              className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs placeholder-slate-500 focus-ring"
            />
          </div>

          {/* Reflection / Takeaways */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Reflection / Key Takeaways (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What clicked? What requires further practice?"
              className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs placeholder-slate-500 focus-ring resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1f293d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#1a2338] transition-colors focus-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors focus-ring"
            >
              Log Session
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
