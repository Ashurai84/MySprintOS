import React, { useState, useEffect } from 'react'
import { X, Calendar, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getTodayDateString } from '../utils/dateUtils'
import type { Priority, TaskStatus } from '../types'

interface QuickAddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  initialSubjectId?: string
}

export const QuickAddTaskModal: React.FC<QuickAddTaskModalProps> = ({
  isOpen,
  onClose,
  initialSubjectId
}) => {
  const { subjects, addTask } = useApp()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState(initialSubjectId || (subjects[0]?.id ?? ''))
  const [deadline, setDeadline] = useState(getTodayDateString())
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [estimatedHours, setEstimatedHours] = useState('2')
  const [resourceUrl, setResourceUrl] = useState('')
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [error, setError] = useState('')

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
    if (!title.trim()) {
      setError('Task title is required')
      return
    }

    addTask({
      title: title.trim(),
      description: description.trim(),
      subjectId,
      deadline,
      priority,
      status,
      estimatedHours: Number(estimatedHours) || 1,
      actualHours: 0,
      resourceUrl: resourceUrl.trim() || undefined,
      submissionUrl: submissionUrl.trim() || undefined
    })

    // Reset and close
    setTitle('')
    setDescription('')
    setError('')
    setResourceUrl('')
    setSubmissionUrl('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-[#111827] border border-[#23314e] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f293d] bg-[#0e1422]">
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <span>New Academic Task</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#1a2338] transition-colors focus-ring"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                if (error) setError('')
              }}
              placeholder="e.g. Implement Kosaraju SCC Algorithm in C++"
              className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-sm placeholder-slate-500 focus-ring"
              autoFocus
            />
          </div>

          {/* Subject & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Related Subject
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

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs focus-ring"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical / Urgent</option>
              </select>
            </div>
          </div>

          {/* Deadline, Status & Est Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                Deadline
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs font-mono focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs focus-ring"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted (Under Review)</option>
                <option value="completed">Completed & Graded</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Est. Hours
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={estimatedHours}
                onChange={e => setEstimatedHours(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs font-mono focus-ring"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Task Details / Requirements
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Key deliverables, lab instructions or notes..."
              className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs placeholder-slate-500 focus-ring resize-none"
            />
          </div>

          {/* Links (Resource & Submission) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Reference / Guide URL (Optional)
              </label>
              <input
                type="url"
                value={resourceUrl}
                onChange={e => setResourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs placeholder-slate-500 focus-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Submission URL / PR (Optional)
              </label>
              <input
                type="url"
                value={submissionUrl}
                onChange={e => setSubmissionUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-slate-200 text-xs placeholder-slate-500 focus-ring"
              />
            </div>
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
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors focus-ring"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
