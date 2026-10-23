import React, { useMemo } from 'react'
import { 
  CalendarClock, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Lightbulb, 
  CheckSquare, 
  RotateCcw, 
  ChevronRight,
  Circle
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatFullDate } from '../utils/dateUtils'
import { formatDuration, formatTimeRangeTo12H } from '../utils/timetableUtils'
import type { Priority } from '../types'

interface DashboardPageProps {
  onNavigateToTab: (tab: string, subjectId?: string) => void
  onOpenQuickLecture: () => void
  onOpenQuickTask: (subjectId?: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToTab,
  onOpenQuickLecture,
  onOpenQuickTask
}) => {
  const { 
    profile, 
    subjects, 
    lectures, 
    tasks, 
    topicProgress, 
    getAllSubjectAttendanceStats, 
    setLectureStatus,
    toggleTaskStatus,
    getSubject
  } = useApp()

  const todayStr = new Date().toISOString().split('T')[0]
  const todayFormatted = formatFullDate()

  // 1. QUESTION 1 & 2: What lectures do I have today? & Which have I attended?
  const todayLectures = useMemo(() => {
    return lectures
      .filter(l => l.date === todayStr)
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'))
  }, [lectures, todayStr])

  const todayAttendedCount = todayLectures.filter(l => l.status === 'attended').length
  const todayScheduledCount = todayLectures.filter(l => l.status === 'scheduled').length

  // Current Week attended vs held
  const weekStats = useMemo(() => {
    const curr = new Date()
    const day = curr.getDay()
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(curr.setDate(diff)).toISOString().split('T')[0]

    const thisWeekLectures = lectures.filter(l => l.date >= monday && l.date <= todayStr)
    const attended = thisWeekLectures.filter(l => l.status === 'attended').length
    const held = thisWeekLectures.filter(l => l.status === 'attended' || l.status === 'absent').length

    return { attended, held }
  }, [lectures, todayStr])

  // 2. QUESTION 3: What did I learn today?
  const todayLearnings = useMemo(() => {
    return todayLectures
      .filter(l => l.whatILearned && l.whatILearned.trim().length > 0)
      .map(l => ({
        id: l.id,
        subjectId: l.subjectId,
        lectureTitle: l.title,
        whatILearned: l.whatILearned!,
        concepts: l.importantConcepts
      }))
  }, [todayLectures])

  // 3. QUESTION 4: What assignments or revisions are pending?
  const pendingAssignments = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 5)
  }, [tasks])

  const pendingRevisions = useMemo(() => {
    const list: Array<{ id: string; title: string; subjectCode: string }> = []
    for (const sub of subjects) {
      for (const mod of sub.modules) {
        for (const topic of mod.topics) {
          const rec = topicProgress[topic.id]
          if (rec && (rec.needsRevision || rec.status === 'needs_revision')) {
            list.push({ id: topic.id, title: topic.title, subjectCode: sub.code })
          }
        }
      }
    }
    for (const lec of lectures) {
      if (lec.needsRevision) {
        const sub = subjects.find(s => s.id === lec.subjectId)
        if (!list.some(item => item.title === lec.title)) {
          list.push({ id: lec.id, title: lec.title, subjectCode: sub?.code || 'S5' })
        }
      }
    }
    return list.slice(0, 5)
  }, [subjects, topicProgress, lectures])

  // 4. QUESTION 5: Which subject needs my attention?
  const allAttendanceStats = getAllSubjectAttendanceStats()
  const subjectNeedingAttention = useMemo(() => {
    // Priority: subject with warning (<75%), then lowest percentage, or approaching
    const warnings = allAttendanceStats.filter(s => s.isWarning)
    if (warnings.length > 0) {
      return warnings.sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0))[0]
    }
    const approaching = allAttendanceStats.filter(s => s.isApproaching)
    if (approaching.length > 0) return approaching[0]

    return null
  }, [allAttendanceStats])

  // Daily Study Checklist State
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({
    cl1: false,
    cl2: false,
    cl3: false,
    cl4: false
  })

  const toggleChecklistItem = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'critical': return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      case 'high': return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      case 'medium': return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
      case 'low': return 'bg-slate-700/40 text-slate-400 border-slate-600'
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header Bar: Date & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              Academic Command Center
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {profile.cohort} Cohort • 6 Subjects
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1">
            Welcome back, {profile.name}
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            {todayFormatted} — Tracking real-time lectures, verified attendance, and syllabus mastery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQuickLecture}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors focus-ring"
          >
            <CalendarClock className="w-4 h-4" />
            <span>Log Daily Lecture</span>
          </button>
        </div>
      </div>

      {/* 2. FIVE QUESTIONS AT A GLANCE (Hero Overview Panel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Q1: Lectures Today */}
        <div 
          onClick={() => onNavigateToTab('lectures')}
          className="p-4 rounded-xl bg-[#111827] border border-[#1e293d] hover:border-blue-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Today's Sessions</span>
            <CalendarClock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {todayLectures.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {todayAttendedCount} attended • {todayScheduledCount} scheduled
          </p>
        </div>

        {/* Q2: Weekly Attendance Pulse */}
        <div 
          onClick={() => onNavigateToTab('attendance')}
          className="p-4 rounded-xl bg-[#111827] border border-[#1e293d] hover:border-emerald-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>This Week's Attendance</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {weekStats.held > 0 
              ? `${Math.round((weekStats.attended / weekStats.held) * 100)}%` 
              : '0 Held'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {weekStats.attended} of {weekStats.held} held sessions
          </p>
        </div>

        {/* Q4: Pending Deadlines */}
        <div 
          onClick={() => onNavigateToTab('assignments')}
          className="p-4 rounded-xl bg-[#111827] border border-[#1e293d] hover:border-amber-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending Workload</span>
            <CheckSquare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {pendingAssignments.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {pendingRevisions.length} topics need revision
          </p>
        </div>

        {/* Q5: Subject Needing Attention */}
        <div 
          onClick={() => onNavigateToTab('attendance', subjectNeedingAttention?.subjectId)}
          className={`p-4 rounded-xl border transition-colors cursor-pointer ${
            subjectNeedingAttention?.isWarning 
              ? 'bg-rose-950/20 border-rose-500/40' 
              : 'bg-[#111827] border-[#1e293d] hover:border-blue-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Subject Needing Attention</span>
            <AlertTriangle className={`w-4 h-4 ${subjectNeedingAttention?.isWarning ? 'text-rose-400' : 'text-blue-400'}`} />
          </div>
          {subjectNeedingAttention ? (
            <>
              <div className="text-sm font-bold text-white mt-1 truncate">
                {getSubject(subjectNeedingAttention.subjectId)?.name || 'Subject'}
              </div>
              <p className="text-[11px] text-rose-300 font-mono mt-0.5">
                {subjectNeedingAttention.percentage !== null ? `${subjectNeedingAttention.percentage}% Attendance` : 'No held data'} ({subjectNeedingAttention.consecutiveNeededToReachTarget} sessions needed)
              </p>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-emerald-300 mt-1">
                All 6 Above {75}% Target
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Attendance is on track
              </p>
            </>
          )}
        </div>
      </div>

      {/* 3. TODAY'S LECTURES (Question 1 & 2 in detail) */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Today's Scheduled & Held Lectures ({todayLectures.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigateToTab('lectures')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 focus-ring"
          >
            <span>Open Lecture Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayLectures.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <CalendarClock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-white">No lectures scheduled or logged for today yet.</p>
            <p className="mt-1">Click below to record today's sessions and take down notes.</p>
            <button
              onClick={onOpenQuickLecture}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Today's Lecture</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayLectures.map(lec => {
              const sub = getSubject(lec.subjectId)
              return (
                <div
                  key={lec.id}
                  className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#1e293d] hover:border-slate-700 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-[#162035] px-2 py-0.5 rounded border border-[#21304d]">
                      {sub?.code} • {lec.startTime ? `${formatTimeRangeTo12H(lec.startTime, lec.endTime || '')} • ` : ''}{formatDuration(lec.durationMinutes)}
                    </span>

                    {/* Quick status pill / buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setLectureStatus(lec.id, 'attended')}
                        className={`px-2 py-0.5 rounded border text-[11px] font-medium transition-colors ${
                          lec.status === 'attended'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-[#152033] text-slate-400 hover:text-emerald-300 border-[#233554]'
                        }`}
                      >
                        Attended
                      </button>
                      <button
                        onClick={() => setLectureStatus(lec.id, 'absent')}
                        className={`px-2 py-0.5 rounded border text-[11px] font-medium transition-colors ${
                          lec.status === 'absent'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-[#152033] text-slate-400 hover:text-rose-300 border-[#233554]'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {lec.title}
                  </h4>

                  {lec.whatILearned && (
                    <p className="text-xs text-slate-300 line-clamp-2 bg-[#080d16] p-2 rounded border border-[#172338]">
                      <strong className="text-blue-300">Takeaway: </strong>
                      {lec.whatILearned}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. SPLIT GRID: Left (Pending Assignments & Revisions) | Right (Daily Study Checklist & Learning Notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Pending Assignments & Revisions */}
        <div className="space-y-4">
          {/* Pending Coursework */}
          <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Pending Coursework & Deadlines ({pendingAssignments.length})
                </h3>
              </div>
              <button
                onClick={() => onOpenQuickTask()}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {pendingAssignments.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                <p>No coursework or lab assignments currently pending.</p>
                <button
                  onClick={() => onOpenQuickTask()}
                  className="mt-2 text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add assignment
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingAssignments.map(task => {
                  const sub = subjects.find(s => s.id === task.subjectId)
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg bg-[#0b0f19] border border-[#1e293d] flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className="mt-0.5 text-slate-500 hover:text-blue-400 transition-colors"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-white truncate block">
                            {task.title}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {sub?.code} • Due {task.deadline}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Topics Marked for Revision */}
          <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Topics Marked for Revision ({pendingRevisions.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('revision')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingRevisions.length === 0 ? (
              <p className="py-6 text-center text-slate-400 text-xs">
                No topics currently flagged for revision.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingRevisions.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-[#0b0f19] border border-[#1e293d] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] font-bold text-blue-400 bg-[#162035] px-1.5 py-0.2 rounded border border-[#21304d]">
                        {item.subjectCode}
                      </span>
                      <span className="font-semibold text-slate-200 truncate">{item.title}</span>
                    </div>
                    <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                      Needs Review
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daily Study Checklist & What Did I Learn Today */}
        <div className="space-y-4">
          {/* Daily Study Checklist */}
          <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Daily Academic Rhythm Checklist
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Today's Routine</span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { id: 'cl1', text: 'Mark attendance for all completed lectures today' },
                { id: 'cl2', text: 'Record core learning takeaways and algorithm code snippets' },
                { id: 'cl3', text: 'Review any questions or doubts to ask in tomorrow\'s lab' },
                { id: 'cl4', text: 'Review 1 weak topic from the spaced revision queue' }
              ].map(item => (
                <label 
                  key={item.id}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-[#0b0f19] border border-[#1e293d] cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.id]}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="mt-0.5 rounded bg-[#0b0f19] border-[#21304d] text-blue-600 focus-ring"
                  />
                  <span className={`text-xs ${checklist[item.id] ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Today's Learning Notes (Question 3) */}
          <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  What I Learned Today ({todayLearnings.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('learning')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <span>Journal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayLearnings.length === 0 ? (
              <p className="py-6 text-center text-slate-400 text-xs">
                No learning reflections recorded today yet. Log a lecture with "What I Learned" to view it here.
              </p>
            ) : (
              <div className="space-y-2">
                {todayLearnings.map(item => {
                  const sub = subjects.find(s => s.id === item.subjectId)
                  return (
                    <div 
                      key={item.id}
                      className="p-3 rounded-lg bg-[#0b0f19] border border-[#1e293d] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-blue-400 font-bold">{sub?.code}</span>
                        <span className="text-slate-400">{item.lectureTitle}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">
                        {item.whatILearned}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. SUBJECTS ATTENDANCE SUMMARY CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              6 Verified University Courses (Elon Musk Cohort)
            </h3>
            <p className="text-xs text-slate-400">
              Live attendance percentages calculated from individual sessions.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('attendance')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Open Attendance Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {subjects.map(subject => {
            const stats = allAttendanceStats.find(s => s.subjectId === subject.id)
            return (
              <div
                key={subject.id}
                onClick={() => onNavigateToTab('subjects', subject.id)}
                className={`p-4 rounded-xl bg-[#111827] border transition-all cursor-pointer flex flex-col justify-between group ${
                  stats?.isWarning 
                    ? 'border-rose-500/40 hover:border-rose-500' 
                    : 'border-[#1e293d] hover:border-blue-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-blue-400 font-semibold">{subject.code}</span>
                    <span className="font-mono text-slate-500">{subject.totalHours} hrs</span>
                  </div>

                  <h4 className="text-sm font-semibold text-white group-hover:text-blue-200 transition-colors mt-1.5 leading-snug line-clamp-2">
                    {subject.name}
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    Faculty: <span className="text-slate-300">{subject.faculty}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1f293d] flex items-center justify-between">
                  <div className="text-xs font-mono">
                    {stats?.percentage !== null ? (
                      <span className={`font-bold ${stats?.isWarning ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {stats?.percentage}% Attendance
                      </span>
                    ) : (
                      <span className="text-slate-500">No held sessions</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {stats?.attended || 0}/{stats?.totalHeld || 0} held
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
