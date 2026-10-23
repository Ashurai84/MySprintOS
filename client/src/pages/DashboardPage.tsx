import React, { useMemo } from 'react'
import { 
  CalendarClock, 
  UserCheck, 
  AlertTriangle, 
  CheckSquare, 
  RotateCcw, 
  ChevronRight,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatFullDate } from '../utils/dateUtils'
import { formatTimeRangeTo12H, formatDuration, getKolkataDateString, getEntriesForDate } from '../utils/timetableUtils'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

interface DashboardPageProps {
  onNavigateToTab: (tab: string, subjectId?: string) => void
  onOpenQuickLecture: () => void
  onOpenQuickTask: (subjectId?: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToTab,
  onOpenQuickTask
}) => {
  const { 
    profile, 
    subjects, 
    lectures, 
    tasks, 
    topicProgress, 
    getAllSubjectAttendanceStats, 
    getSubject,
    timetableEntries
  } = useApp()

  const todayStr = getKolkataDateString()
  const todayFormatted = formatFullDate()

  // Today's Timetable & Lecture sessions
  const todayTimetable = useMemo(() => {
    return getEntriesForDate(timetableEntries, todayStr)
  }, [timetableEntries, todayStr])

  const todayLectures = useMemo(() => {
    return lectures
      .filter(l => l.date === todayStr)
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'))
  }, [lectures, todayStr])

  const todayAttendedCount = todayLectures.filter(l => l.status === 'attended').length

  // Attendance overview
  const allAttendanceStats = getAllSubjectAttendanceStats()
  const warningSubjects = allAttendanceStats.filter(s => s.isWarning)
  const totalAttended = allAttendanceStats.reduce((sum, s) => sum + s.attended, 0)
  const totalHeld = allAttendanceStats.reduce((sum, s) => sum + s.totalHeld, 0)
  const overallPercentage = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 100

  // Subject needing most attention
  const subjectNeedingAttention = useMemo(() => {
    if (warningSubjects.length > 0) {
      return warningSubjects.sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0))[0]
    }
    const lowest = [...allAttendanceStats].sort((a, b) => (a.percentage ?? 100) - (b.percentage ?? 100))[0]
    return lowest || null
  }, [warningSubjects, allAttendanceStats])

  // Pending assignments (max 4)
  const pendingAssignments = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 4)
  }, [tasks])

  // Topics needing revision (max 4)
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
    return list.slice(0, 4)
  }, [subjects, topicProgress, lectures])

  // Next or upcoming session today
  const nextSession = useMemo(() => {
    if (todayTimetable.length === 0) return null
    return todayTimetable[0]
  }, [todayTimetable])

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Bar: Clean single greeting, no duplicate Log Lecture button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] uppercase text-primary border-primary/30">
              {profile.cohort} Cohort
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Semester 5 • 6 Subjects Active
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight mt-1">
            Welcome back, {profile.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {todayFormatted} — Academic overview & daily progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onPress={() => onNavigateToTab('timetable')}
            className="text-xs h-8 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 mr-1 text-primary" />
            Timetable
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => onNavigateToTab('attendance')}
            className="text-xs h-8 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Attendance
          </Button>
        </div>
      </div>

      {/* 2. Top Summary Metrics Grid using shadcn Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Sessions */}
        <Card 
          onClick={() => onNavigateToTab('timetable')}
          className="cursor-pointer hover:border-primary/40 transition-colors"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-xs text-muted-foreground font-medium">Today's Schedule</span>
            <CalendarClock className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold font-mono tracking-tight text-foreground">
              {todayTimetable.length}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {todayAttendedCount} attended • {todayTimetable.length} scheduled
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Overall Attendance */}
        <Card 
          onClick={() => onNavigateToTab('attendance')}
          className="cursor-pointer hover:border-emerald-500/40 transition-colors"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-xs text-muted-foreground font-medium">Overall Attendance</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold font-mono tracking-tight text-foreground">
              {overallPercentage}%
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {totalAttended} of {totalHeld} sessions held
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Pending Workload */}
        <Card 
          onClick={() => onNavigateToTab('assignments')}
          className="cursor-pointer hover:border-primary/40 transition-colors"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-xs text-muted-foreground font-medium">Pending Workload</span>
            <CheckSquare className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold font-mono tracking-tight text-foreground">
              {pendingAssignments.length}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {pendingRevisions.length} topics flagged for review
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Attention Focus */}
        <Card 
          onClick={() => onNavigateToTab('attendance', subjectNeedingAttention?.subjectId)}
          className={`cursor-pointer transition-colors ${
            warningSubjects.length > 0
              ? 'hover:border-destructive/60 border-destructive/20 bg-destructive/5'
              : 'hover:border-primary/40'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-xs text-muted-foreground font-medium">Attention Focus</span>
            <AlertTriangle className={`w-4 h-4 ${warningSubjects.length > 0 ? 'text-destructive' : 'text-primary'}`} />
          </CardHeader>
          <CardContent className="space-y-1">
            {subjectNeedingAttention ? (
              <>
                <div className="text-sm font-semibold truncate text-foreground">
                  {getSubject(subjectNeedingAttention.subjectId)?.name || 'All On Track'}
                </div>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {subjectNeedingAttention.percentage !== null ? `${subjectNeedingAttention.percentage}%` : 'No data'} • min 75% target
                </p>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold text-emerald-400">All 6 on track</div>
                <p className="text-[11px] text-muted-foreground">Target maintained</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Compact Today's Schedule Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Today's Next Session & Schedule
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => onNavigateToTab('timetable')}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 cursor-pointer"
          >
            Full Timetable
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {nextSession ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-secondary/30 border border-border">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                    {nextSession.subjectId || 'S5'}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatTimeRangeTo12H(nextSession.startTime, nextSession.endTime)} • {formatDuration(nextSession.durationMinutes)}
                  </span>
                </div>
                <div className="font-semibold text-sm text-foreground truncate">
                  {getSubject(nextSession.subjectId || '')?.name || 'Class Session'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Faculty: <span className="text-foreground">{nextSession.faculty || 'Assigned Professor'}</span> • {nextSession.classroom || 'Classroom 37'}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onPress={() => onNavigateToTab('timetable')}
                className="text-xs h-8 shrink-0 cursor-pointer"
              >
                View in Timetable
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              <p className="font-medium text-foreground">No sessions scheduled for today ({todayFormatted}).</p>
              <p className="mt-1">Check the weekly matrix for upcoming lectures.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Two-Column Grid: Coursework Deadlines & Revision Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column 1: Coursework Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Upcoming Assignments ({pendingAssignments.length})
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onOpenQuickTask()}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 cursor-pointer"
            >
              + Add
            </Button>
          </CardHeader>
          <CardContent className="pt-3">
            {pendingAssignments.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <p className="font-medium text-foreground">No assignments pending.</p>
                <p className="mt-0.5">All coursework and labs are up to date.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingAssignments.map(task => {
                  const sub = subjects.find(s => s.id === task.subjectId)
                  return (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-md bg-secondary/20 border border-border flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-foreground block truncate">
                          {task.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {sub?.code || 'S5'} • Due {task.deadline}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono h-4 shrink-0">
                        {task.priority}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column 2: Revision Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Topics Due for Revision ({pendingRevisions.length})
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onNavigateToTab('revision')}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 cursor-pointer"
            >
              View Queue
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </CardHeader>
          <CardContent className="pt-3">
            {pendingRevisions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <p className="font-medium text-foreground">No revision topics queued.</p>
                <p className="mt-0.5">Topics marked for self-recall will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingRevisions.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onNavigateToTab('revision')}
                    className="p-2.5 rounded-md bg-secondary/20 border border-border flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-border/80 transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-foreground block truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {item.subjectCode}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono h-4 shrink-0">
                      Review
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
