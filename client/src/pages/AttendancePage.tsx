import React, { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Edit2,
  CheckCircle2,
  UserCheck,
  CalendarClock
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

interface AttendancePageProps {
  onOpenQuickLecture?: (subjectId?: string) => void
  onNavigateToLectures?: (subjectId?: string) => void
}

export const AttendancePage: React.FC<AttendancePageProps> = ({
  onOpenQuickLecture: _onOpenQuickLecture,
  onNavigateToLectures
}) => {
  const {
    subjects,
    settings,
    getAllSubjectAttendanceStats,
    lectures,
    updateAttendance,
    getSubjectAttendanceStats
  } = useApp()

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [manualAttended, setManualAttended] = useState<number>(0)
  const [manualTotal, setManualTotal] = useState<number>(0)

  const allStats = getAllSubjectAttendanceStats()
  const threshold = settings.minAttendancePercent

  // Aggregate totals
  const totalAttended = allStats.reduce((acc, s) => acc + s.attended, 0)
  const totalHeld = allStats.reduce((acc, s) => acc + s.totalHeld, 0)
  const totalScheduled = allStats.reduce((acc, s) => acc + s.scheduled, 0)
  const totalAbsent = allStats.reduce((acc, s) => acc + s.absent, 0)
  const totalWarnings = allStats.filter(s => s.isWarning).length

  const overallPercent = totalHeld > 0
    ? Math.round((totalAttended / totalHeld) * 1000) / 10
    : null

  const handleStartManualEdit = (subjectId: string) => {
    const stat = getSubjectAttendanceStats(subjectId)
    setEditingSubjectId(subjectId)
    setManualAttended(stat.attended)
    setManualTotal(stat.totalHeld)
  }

  const handleSaveManualEdit = (subjectId: string) => {
    updateAttendance(subjectId, Number(manualAttended), Number(manualTotal))
    setEditingSubjectId(null)
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Subject-Wise Attendance Center
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
              Min Threshold: {threshold}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Calculated strictly from individual held sessions. Cancelled and future sessions are excluded.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-md bg-secondary/40 border border-border text-xs">
            <span className="text-muted-foreground">Semester Status: </span>
            {overallPercent !== null ? (
              <span className={`font-mono font-semibold ${overallPercent >= threshold ? 'text-emerald-400' : 'text-destructive'}`}>
                {overallPercent}% ({totalAttended}/{totalHeld})
              </span>
            ) : (
              <span className="text-muted-foreground font-mono">No sessions held yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Top Banner Alert (If any subject is below 75%) */}
      {totalWarnings > 0 && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <h4 className="font-semibold text-destructive">
              Attendance Warning: {totalWarnings} Subject{totalWarnings > 1 ? 's' : ''} Below University Mandatory {threshold}% Threshold
            </h4>
            <p className="text-destructive/90 leading-relaxed text-[11px]">
              University regulations require at least {threshold}% attendance per subject to be eligible for end-semester examinations. Check consecutive session targets below.
            </p>
          </div>
        </div>
      )}

      {/* Top KPI Metrics Cards using shadcn Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-xs text-muted-foreground font-medium">Total Held</span>
            <CalendarClock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-0.5">
            <div className="text-2xl font-semibold font-mono tracking-tight text-foreground">
              {totalHeld}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">Across 6 subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-xs text-emerald-400 font-medium">Attended</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="space-y-0.5">
            <div className="text-2xl font-semibold font-mono tracking-tight text-emerald-400">
              {totalAttended}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">Present in class</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-xs text-destructive font-medium">Absent</span>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent className="space-y-0.5">
            <div className="text-2xl font-semibold font-mono tracking-tight text-destructive">
              {totalAbsent}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">Missed lectures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-xs text-primary font-medium">Scheduled</span>
            <CalendarClock className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-0.5">
            <div className="text-2xl font-semibold font-mono tracking-tight text-primary">
              {totalScheduled}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">Upcoming in schedule</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Official Course Breakdowns
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            Attended ÷ (Attended + Absent) × 100
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(subject => {
            const stats = getSubjectAttendanceStats(subject.id)
            const isEditing = editingSubjectId === subject.id
            const subjectLectures = lectures.filter(l => l.subjectId === subject.id)

            return (
              <Card
                key={subject.id}
                className={`transition-all flex flex-col justify-between ${
                  stats.isWarning
                    ? 'border-destructive/40 bg-destructive/5'
                    : stats.isApproaching
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                          {subject.code}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {subject.totalHours} Course Hours
                        </span>
                      </div>
                      <CardTitle className="text-sm font-semibold text-foreground truncate">
                        {subject.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Faculty: <span className="text-foreground">{subject.faculty}</span>
                      </p>
                    </div>

                    {/* Percentage Display Pill */}
                    <div className="text-right shrink-0">
                      {stats.percentage !== null ? (
                        <Badge
                          variant={stats.isWarning ? 'destructive' : stats.isApproaching ? 'outline' : 'secondary'}
                          className={`font-mono text-xs px-2.5 py-1 ${
                            !stats.isWarning && !stats.isApproaching ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : ''
                          }`}
                        >
                          {stats.percentage}%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                          No held data
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Attendance Visual Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1 font-mono">
                      <span>Progress vs {threshold}% target</span>
                      <span className="text-foreground font-medium">
                        {stats.attended} / {stats.totalHeld} held sessions
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden relative border border-border">
                      {/* 75% target marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/60 z-10"
                        style={{ left: `${threshold}%` }}
                        title={`${threshold}% Requirement Marker`}
                      />
                      {stats.percentage !== null && (
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            stats.isWarning ? 'bg-destructive' : stats.isApproaching ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, stats.percentage)}%` }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Metrics Row: Attended, Absent, Scheduled, Cancelled */}
                  <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs">
                    <div className="p-2 rounded-md bg-secondary/30 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Attended</span>
                      <span className="font-mono text-sm font-semibold text-emerald-400">{stats.attended}</span>
                    </div>
                    <div className="p-2 rounded-md bg-secondary/30 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Absent</span>
                      <span className="font-mono text-sm font-semibold text-destructive">{stats.absent}</span>
                    </div>
                    <div className="p-2 rounded-md bg-secondary/30 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Scheduled</span>
                      <span className="font-mono text-sm font-semibold text-primary">{stats.scheduled}</span>
                    </div>
                    <div className="p-2 rounded-md bg-secondary/30 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Cancelled</span>
                      <span className="font-mono text-sm font-semibold text-muted-foreground">{stats.cancelled}</span>
                    </div>
                  </div>

                  {/* Recovery target notice if warning */}
                  {stats.isWarning && (
                    <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-destructive">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Action Required:</span>
                      </div>
                      <p className="leading-relaxed text-[11px]">
                        Attend next <strong className="font-mono underline text-foreground">{stats.consecutiveNeededToReachTarget} consecutive lectures</strong> to reach {threshold}%.
                        {!stats.possibleToReachTarget && (
                          <span className="block text-destructive font-medium mt-0.5">
                            Warning: Exceeds standard remaining hours. Consult faculty mentor.
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Approaching warning */}
                  {stats.isApproaching && (
                    <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs text-[11px]">
                      <strong>Approaching Margin:</strong> Attendance is close to the {threshold}% boundary. Avoid absences.
                    </div>
                  )}

                  {/* Footer Actions: Audit manual correction & View Lectures */}
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    {isEditing ? (
                      <div className="w-full flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs">
                          <label className="text-muted-foreground text-[11px]">Attended:</label>
                          <input
                            type="number"
                            min="0"
                            value={manualAttended}
                            onChange={e => setManualAttended(Math.max(0, Number(e.target.value)))}
                            className="w-12 px-1.5 py-0.5 rounded bg-secondary/50 border border-border text-foreground text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <label className="text-muted-foreground text-[11px]">Total Held:</label>
                          <input
                            type="number"
                            min="0"
                            value={manualTotal}
                            onChange={e => setManualTotal(Math.max(0, Number(e.target.value)))}
                            className="w-12 px-1.5 py-0.5 rounded bg-secondary/50 border border-border text-foreground text-xs font-mono"
                          />
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onPress={() => handleSaveManualEdit(subject.id)}
                          className="h-6 text-[11px] px-2 cursor-pointer font-medium"
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => setEditingSubjectId(null)}
                          className="h-6 text-[11px] px-2 text-muted-foreground cursor-pointer"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => handleStartManualEdit(subject.id)}
                          className="h-7 text-[11px] text-muted-foreground hover:text-foreground px-2 cursor-pointer"
                          title="Manual audit correction"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Correction
                        </Button>

                        {onNavigateToLectures && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => onNavigateToLectures(subject.id)}
                            className="h-7 text-[11px] font-medium text-primary hover:text-primary/80 px-2 cursor-pointer"
                          >
                            <span>Lectures ({subjectLectures.length})</span>
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
