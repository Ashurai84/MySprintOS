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
  FileCheck,
  X
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getDaysRemaining, formatDisplayDate } from '../utils/dateUtils'
import type { Task, TaskStatus, AssessmentCategory } from '../types'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { cn } from 'cn'

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
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10'
      case 'high':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      case 'medium':
        return 'text-primary border-primary/30 bg-primary/10'
      case 'low':
        return 'text-muted-foreground border-border bg-muted/40'
    }
  }

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed & Evaluated',
          className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
        }
      case 'submitted':
        return {
          label: 'Submitted (Under Review)',
          className: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
        }
      case 'in_progress':
        return {
          label: 'In Progress',
          className: 'text-primary border-primary/30 bg-primary/10'
        }
      case 'not_started':
      case 'todo':
      default:
        return {
          label: 'Not Started',
          className: 'text-muted-foreground border-border bg-muted/40'
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
            <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider text-primary border-primary/20 bg-primary/5">
              Academic Deliverables
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Coursework, Labs & Mini-Projects
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mt-1">
            Assignments & Coursework
          </h2>
          <p className="text-xs text-muted-foreground">
            Track submissions, manage lab deadlines, and distinguish submitted work from completed grading.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => onOpenQuickTask()}
          className="h-8 text-xs gap-1.5 self-start sm:self-auto font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Assignment</span>
        </Button>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Work (${tasks.length})` },
          { id: 'pending', label: `Pending Action (${tasks.filter(t => t.status !== 'completed' && t.status !== 'submitted').length})` },
          { id: 'submitted', label: `Submitted (${tasks.filter(t => t.status === 'submitted').length})` },
          { id: 'completed', label: `Completed (${tasks.filter(t => t.status === 'completed').length})` },
          { id: 'overdue', label: `Overdue (${tasks.filter(t => t.status !== 'completed' && t.status !== 'submitted' && getDaysRemaining(t.deadline).isOverdue).length})` }
        ].map(tab => (
          <Button
            key={tab.id}
            size="sm"
            variant={activeView === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveView(tab.id as typeof activeView)}
            className="text-xs h-8 px-3 whitespace-nowrap"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Subject Filter */}
        <div>
          <select
            value={selectedSubjectFilter}
            onChange={e => setSelectedSubjectFilter(e.target.value)}
            className="w-full px-3 py-1.5 h-9 rounded-md bg-card border border-border text-xs text-foreground focus-ring"
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
            className="w-full px-3 py-1.5 h-9 rounded-md bg-card border border-border text-xs text-foreground focus-ring"
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
            className="w-full px-3 py-1.5 h-9 rounded-md bg-card border border-border text-xs text-foreground focus-ring"
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
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs bg-card border-border"
          />
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="p-12 border-border bg-card text-center text-muted-foreground text-xs">
            <CheckSquare className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No assignments match current filters.</p>
            <p className="mt-1">Add your lab exercises, project milestones or coursework deliverables.</p>
            <Button
              size="sm"
              onClick={() => onOpenQuickTask()}
              className="mt-3 h-8 text-xs gap-1 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Assignment</span>
            </Button>
          </Card>
        ) : (
          filteredTasks.map(task => {
            const sub = subjects.find(s => s.id === task.subjectId)
            const deadlineInfo = getDaysRemaining(task.deadline)
            const isDone = task.status === 'completed'
            const isSubmitted = task.status === 'submitted'
            const statusInfo = getStatusBadge(task.status)

            return (
              <Card
                key={task.id}
                className={cn(
                  'p-4 border-border bg-card transition-all',
                  isDone && 'opacity-70 bg-muted/20',
                  isSubmitted && 'border-amber-500/30 bg-amber-500/5',
                  deadlineInfo.isOverdue && !isDone && !isSubmitted && 'border-rose-500/40 bg-rose-500/5'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Checkbox + Details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className="mt-0.5 text-muted-foreground hover:text-primary transition-colors focus-ring"
                      aria-label="Toggle task status"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      ) : isSubmitted ? (
                        <FileCheck className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </span>
                        {task.assessmentCategory && (
                          <Badge variant="secondary" className="text-[10px] font-mono capitalize">
                            {task.assessmentCategory.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed pr-2">
                          {task.description}
                        </p>
                      )}

                      {/* Metadata tags */}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground flex-wrap">
                        <Badge variant="outline" className="font-mono text-primary border-primary/20 bg-primary/5 font-semibold text-[10px]">
                          {sub?.code || 'S5'}
                        </Badge>
                        <Badge variant="outline" className={cn('text-[10px] font-medium uppercase tracking-wider', getPriorityBadge(task.priority))}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className={cn('text-[10px] font-semibold', statusInfo.className)}>
                          {statusInfo.label}
                        </Badge>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {formatDisplayDate(task.deadline)} ({deadlineInfo.label})
                        </span>
                        {task.estimatedHours > 0 && (
                          <span className="flex items-center gap-1 font-mono text-muted-foreground text-[11px]">
                            <Clock className="w-3 h-3" />
                            {task.actualHours > 0 ? `${task.actualHours}h / ` : ''}{task.estimatedHours}h est
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action links & buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {task.submissionUrl && (
                      <a
                        href={task.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors focus-ring"
                        title="View Submission URL / PR"
                      >
                        <ExternalLink className="w-4 h-4 text-primary" />
                      </a>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingTask(task)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Edit Assignment"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteTask(task.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="w-full max-w-lg bg-card border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Edit Assignment Deliverable</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingTask(null)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-foreground font-semibold mb-1">Title</label>
                <Input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="text-xs bg-muted/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground font-semibold mb-1">Subject</label>
                  <select
                    value={editingTask.subjectId}
                    onChange={e => setEditingTask({ ...editingTask, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-foreground text-xs focus-ring"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1">Category</label>
                  <select
                    value={editingTask.assessmentCategory || 'assignment'}
                    onChange={e => setEditingTask({ ...editingTask, assessmentCategory: e.target.value as AssessmentCategory })}
                    className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-foreground text-xs focus-ring"
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
                  <label className="block text-foreground font-semibold mb-1">Deadline</label>
                  <Input
                    type="date"
                    required
                    value={editingTask.deadline}
                    onChange={e => setEditingTask({ ...editingTask, deadline: e.target.value })}
                    className="text-xs bg-muted/40 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={e => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-foreground text-xs focus-ring"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted (Under Review)</option>
                    <option value="completed">Completed & Graded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">Submission URL / GitHub PR (Optional)</label>
                <Input
                  type="url"
                  value={editingTask.submissionUrl || ''}
                  onChange={e => setEditingTask({ ...editingTask, submissionUrl: e.target.value })}
                  placeholder="https://github.com/..."
                  className="text-xs bg-muted/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={editingTask.description}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-foreground text-xs focus-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTask(null)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-semibold"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

