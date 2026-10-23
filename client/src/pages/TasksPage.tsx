import React, { useState } from 'react'
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Search, 
  FileCheck
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getDaysRemaining, formatDisplayDate } from '../utils/dateUtils'
import type { Task, TaskStatus, AssessmentCategory } from '../types'

interface TasksPageProps {
  onOpenQuickTask: (subjectId?: string) => void
}

export const TasksPage: React.FC<TasksPageProps> = ({ onOpenQuickTask }) => {
  const { subjects, tasks, updateTask, deleteTask, toggleTaskStatus } = useApp()

  const [activeView, setActiveView] = useState<'all' | 'pending' | 'submitted' | 'completed' | 'overdue'>('all')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all')
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Edit Task State
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Subject filter
    if (selectedSubjectFilter !== 'all' && task.subjectId !== selectedSubjectFilter) {
      return false
    }

    // Priority filter
    if (selectedPriorityFilter !== 'all' && task.priority !== selectedPriorityFilter) {
      return false
    }

    // Category filter
    if (selectedCategoryFilter !== 'all' && task.assessmentCategory !== selectedCategoryFilter) {
      return false
    }

    // Search query
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      const matchTitle = task.title.toLowerCase().includes(q)
      const matchDesc = task.description.toLowerCase().includes(q)
      if (!matchTitle && !matchDesc) return false
    }

    // View filter
    const deadlineInfo = getDaysRemaining(task.deadline)
    if (activeView === 'pending') {
      return task.status === 'not_started' || task.status === 'todo' || task.status === 'in_progress'
    } else if (activeView === 'submitted') {
      return task.status === 'submitted'
    } else if (activeView === 'completed') {
      return task.status === 'completed'
    } else if (activeView === 'overdue') {
      return deadlineInfo.isOverdue && task.status !== 'completed' && task.status !== 'submitted'
    }

    return true // 'all' view
  })

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      case 'high':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      case 'medium':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
      case 'low':
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30'
    }
  }

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed & Evaluated',
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        }
      case 'submitted':
        return {
          label: 'Submitted (Under Review)',
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        }
      case 'in_progress':
        return {
          label: 'In Progress',
          bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
        }
      case 'not_started':
      case 'todo':
      default:
        return {
          label: 'Not Started',
          bg: 'bg-slate-700/40 text-slate-400 border-slate-600'
        }
    }
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return
    updateTask(editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
      subjectId: editingTask.subjectId,
      deadline: editingTask.deadline,
      priority: editingTask.priority,
      status: editingTask.status,
      assessmentCategory: editingTask.assessmentCategory,
      estimatedHours: Number(editingTask.estimatedHours),
      actualHours: Number(editingTask.actualHours),
      submissionUrl: editingTask.submissionUrl,
      resourceUrl: editingTask.resourceUrl,
      completionNotes: editingTask.completionNotes
    })
    setEditingTask(null)
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              Academic Deliverables
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Coursework, Labs & Mini-Projects
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1">
            Assignments & Coursework
          </h2>
          <p className="text-xs text-slate-400">
            Track submissions, manage lab deadlines, and distinguish submitted work from completed grading.
          </p>
        </div>
        <button
          onClick={() => onOpenQuickTask()}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto focus-ring"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1e293d] overflow-x-auto pb-px">
        {[
          { id: 'all', label: `All Work (${tasks.length})` },
          { id: 'pending', label: `Pending Action (${tasks.filter(t => t.status !== 'completed' && t.status !== 'submitted').length})` },
          { id: 'submitted', label: `Submitted (${tasks.filter(t => t.status === 'submitted').length})` },
          { id: 'completed', label: `Completed (${tasks.filter(t => t.status === 'completed').length})` },
          { id: 'overdue', label: `Overdue (${tasks.filter(t => t.status !== 'completed' && t.status !== 'submitted' && getDaysRemaining(t.deadline).isOverdue).length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as typeof activeView)}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeView === tab.id
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Subject Filter */}
        <div>
          <select
            value={selectedSubjectFilter}
            onChange={e => setSelectedSubjectFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#1e293d] text-xs text-slate-200 focus-ring"
          >
            <option value="all">All 6 Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={selectedPriorityFilter}
            onChange={e => setSelectedPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#1e293d] text-xs text-slate-200 focus-ring"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical / Urgent</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* Assessment Category Filter */}
        <div>
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#1e293d] text-xs text-slate-200 focus-ring"
          >
            <option value="all">All Categories</option>
            <option value="assignment">Assignment</option>
            <option value="mini_project">Mini Project</option>
            <option value="lab">Lab Exercise</option>
            <option value="quiz">Quiz</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#111827] border border-[#1e293d] text-xs text-slate-200 placeholder-slate-500 focus-ring"
          />
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 rounded-xl bg-[#111827] border border-[#1e293d] text-center text-slate-400 text-xs">
            <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">No assignments match current filters.</p>
            <p className="mt-1">Add your lab exercises, project milestones or coursework deliverables.</p>
            <button
              onClick={() => onOpenQuickTask()}
              className="mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Assignment</span>
            </button>
          </div>
        ) : (
          filteredTasks.map(task => {
            const sub = subjects.find(s => s.id === task.subjectId)
            const deadlineInfo = getDaysRemaining(task.deadline)
            const isDone = task.status === 'completed'
            const isSubmitted = task.status === 'submitted'
            const statusInfo = getStatusBadge(task.status)

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl bg-[#111827] border transition-all ${
                  isDone
                    ? 'border-[#1a2335] bg-[#0c111c] opacity-80'
                    : isSubmitted
                    ? 'border-amber-500/30 bg-[#14120e]'
                    : deadlineInfo.isOverdue
                    ? 'border-rose-900/40 hover:border-rose-700/60'
                    : 'border-[#1e293d] hover:border-[#2b3a55]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Checkbox + Details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className="mt-0.5 text-slate-500 hover:text-blue-400 transition-colors focus-ring"
                      aria-label="Toggle task status"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      ) : isSubmitted ? (
                        <FileCheck className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 hover:text-slate-200" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${isDone ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {task.title}
                        </span>
                        {task.assessmentCategory && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#172033] text-blue-300 border border-[#23314e] capitalize">
                            {task.assessmentCategory.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 leading-relaxed pr-2">
                          {task.description}
                        </p>
                      )}

                      {/* Metadata tags */}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 flex-wrap">
                        <span className="font-mono text-blue-400 font-semibold bg-[#172238] px-1.5 py-0.2 rounded border border-[#233352]">
                          {sub?.code || 'S5'}
                        </span>
                        <span className={`px-2 py-0.2 rounded border text-[10px] font-medium uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-0.2 rounded border text-[10px] font-semibold ${statusInfo.bg}`}>
                          {statusInfo.label}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {formatDisplayDate(task.deadline)} ({deadlineInfo.label})
                        </span>
                        {task.estimatedHours > 0 && (
                          <span className="flex items-center gap-1 font-mono text-slate-500">
                            <Clock className="w-3 h-3" />
                            {task.actualHours > 0 ? `${task.actualHours}h / ` : ''}{task.estimatedHours}h est
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action links & buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.submissionUrl && (
                      <a
                        href={task.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-[#162035] transition-colors focus-ring"
                        title="View Submission URL / PR"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-400" />
                      </a>
                    )}
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#162035] transition-colors focus-ring"
                      title="Edit Assignment"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#162035] transition-colors focus-ring"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0f172a] border border-[#1e293d] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293d]">
              <h3 className="text-base font-bold text-white">Edit Assignment Deliverable</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                  <select
                    value={editingTask.subjectId}
                    onChange={e => setEditingTask({ ...editingTask, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={editingTask.assessmentCategory || 'assignment'}
                    onChange={e => setEditingTask({ ...editingTask, assessmentCategory: e.target.value as AssessmentCategory })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="mini_project">Mini Project</option>
                    <option value="lab">Lab Exercise</option>
                    <option value="quiz">Quiz</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Deadline</label>
                  <input
                    type="date"
                    required
                    value={editingTask.deadline}
                    onChange={e => setEditingTask({ ...editingTask, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={e => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted (Under Review)</option>
                    <option value="completed">Completed & Graded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Submission URL / GitHub PR (Optional)</label>
                <input
                  type="url"
                  value={editingTask.submissionUrl || ''}
                  onChange={e => setEditingTask({ ...editingTask, submissionUrl: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={editingTask.description}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293d]">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
