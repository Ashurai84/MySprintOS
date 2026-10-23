import React, { useState } from 'react'
import { 
  AlertTriangle, 
  ArrowRight,
  Edit2
} from 'lucide-react'
import { useApp } from '../context/AppContext'

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
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              Official University Attendance
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Mandatory Minimum: {threshold}%
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1">
            Subject-Wise Attendance Center
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Real-time percentage calculated strictly from individual held sessions. Cancelled and future scheduled sessions are excluded.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-lg bg-[#111827] border border-[#1e293d] text-xs">
            <span className="text-slate-400">Semester Status: </span>
            {overallPercent !== null ? (
              <span className={`font-mono font-bold ${overallPercent >= threshold ? 'text-emerald-400' : 'text-rose-400'}`}>
                {overallPercent}% Aggregate ({totalAttended}/{totalHeld})
              </span>
            ) : (
              <span className="text-slate-400 font-mono">No sessions held yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Top Banner Alert (If any subject is below 75%) */}
      {totalWarnings > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-rose-300">
              Attendance Warning: {totalWarnings} Subject{totalWarnings > 1 ? 's' : ''} Below University Mandatory {threshold}% Threshold
            </h4>
            <p className="text-rose-200/90 leading-relaxed">
              University regulations require at least {threshold}% attendance per subject to be eligible for end-semester examinations. Check the consecutive session targets below to recover your attendance standing.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293d]">
          <span className="text-xs text-slate-400 block">Total Held Sessions</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {totalHeld}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Across 6 subjects
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293d]">
          <span className="text-xs text-emerald-400 block">Attended Sessions</span>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {totalAttended}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Present in class
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293d]">
          <span className="text-xs text-rose-400 block">Absent Sessions</span>
          <div className="text-2xl font-bold font-mono text-rose-300 mt-1">
            {totalAbsent}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Missed lectures
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-[#1e293d]">
          <span className="text-xs text-blue-400 block">Scheduled Upcoming</span>
          <div className="text-2xl font-bold font-mono text-blue-300 mt-1">
            {totalScheduled}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Awaiting session
          </span>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white tracking-tight flex items-center justify-between">
          <span>Official 6 Course Breakdowns</span>
          <span className="text-xs text-slate-400 font-normal">Formula: Attended ÷ (Attended + Absent) × 100</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(subject => {
            const stats = getSubjectAttendanceStats(subject.id)
            const isEditing = editingSubjectId === subject.id
            const subjectLectures = lectures.filter(l => l.subjectId === subject.id)

            return (
              <div
                key={subject.id}
                className={`p-5 rounded-xl bg-[#111827] border transition-all flex flex-col justify-between ${
                  stats.isWarning 
                    ? 'border-rose-500/50 bg-[#16121a]' 
                    : stats.isApproaching
                    ? 'border-amber-500/40 bg-[#161413]'
                    : 'border-[#1e293d] hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Subject Code & Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400 bg-[#141e33] px-2 py-0.5 rounded border border-[#213152]">
                          {subject.code}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {subject.totalHours} Course Hours
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white tracking-tight mt-1">
                        {subject.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Faculty: <span className="text-slate-300">{subject.faculty}</span>
                      </p>
                    </div>

                    {/* Percentage Display Pill */}
                    <div className="text-right shrink-0">
                      {stats.percentage !== null ? (
                        <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${
                          stats.isWarning
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : stats.isApproaching
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {stats.percentage}%
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded bg-[#0b0f19] text-slate-400 border border-[#1e293d] text-xs font-mono">
                          No held sessions yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attendance Visual Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                      <span>Progress against {threshold}% threshold</span>
                      <span className="text-white font-semibold">
                        {stats.attended} / {stats.totalHeld} held sessions
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#090d16] rounded-full overflow-hidden relative border border-[#1a2538]">
                      {/* 75% target marker */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-500 z-10" 
                        style={{ left: `${threshold}%` }}
                        title={`${threshold}% Requirement Marker`}
                      />
                      {stats.percentage !== null && (
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            stats.isWarning ? 'bg-rose-500' : stats.isApproaching ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, stats.percentage)}%` }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Metrics Row: Attended, Absent, Scheduled, Cancelled */}
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-[#0b0f19] border border-[#1d273a]">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Attended</span>
                      <span className="font-mono text-sm font-bold text-emerald-300">{stats.attended}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0b0f19] border border-[#1d273a]">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Absent</span>
                      <span className="font-mono text-sm font-bold text-rose-300">{stats.absent}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0b0f19] border border-[#1d273a]">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Scheduled</span>
                      <span className="font-mono text-sm font-bold text-blue-300">{stats.scheduled}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0b0f19] border border-[#1d273a]">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Cancelled</span>
                      <span className="font-mono text-sm font-bold text-slate-400">{stats.cancelled}</span>
                    </div>
                  </div>

                  {/* Recovery target notice if warning */}
                  {stats.isWarning && (
                    <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Action Required to Reach {threshold}%:</span>
                      </div>
                      <p className="leading-relaxed">
                        Must attend the next <strong className="font-mono text-white underline">{stats.consecutiveNeededToReachTarget} consecutive lecture sessions</strong> without missing to reach {threshold}%.
                        {!stats.possibleToReachTarget && (
                          <span className="block text-rose-300 font-semibold mt-1">
                            Warning: Exceeds standard estimated remaining course hours. Speak with academic faculty mentor.
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Approaching warning */}
                  {stats.isApproaching && (
                    <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs">
                      <strong>Approaching Margin:</strong> Attendance is close to the {threshold}% boundary. Do not miss upcoming sessions.
                    </div>
                  )}
                </div>

                {/* Footer Actions: Audit manual correction & View Lectures */}
                <div className="mt-4 pt-3 border-t border-[#1e293d] flex items-center justify-between">
                  {isEditing ? (
                    <div className="w-full flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs">
                        <label className="text-slate-400">Attended:</label>
                        <input
                          type="number"
                          min="0"
                          value={manualAttended}
                          onChange={e => setManualAttended(Math.max(0, Number(e.target.value)))}
                          className="w-14 px-1.5 py-1 rounded bg-[#0b0f19] border border-[#233352] text-white text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <label className="text-slate-400">Total Held:</label>
                        <input
                          type="number"
                          min="0"
                          value={manualTotal}
                          onChange={e => setManualTotal(Math.max(0, Number(e.target.value)))}
                          className="w-14 px-1.5 py-1 rounded bg-[#0b0f19] border border-[#233352] text-white text-xs font-mono"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveManualEdit(subject.id)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSubjectId(null)}
                        className="px-2 py-1 rounded text-slate-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartManualEdit(subject.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                        title="Audit-friendly manual correction"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Manual Correction</span>
                      </button>

                      {onNavigateToLectures && (
                        <button
                          onClick={() => onNavigateToLectures(subject.id)}
                          className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                        >
                          <span>View Lectures ({subjectLectures.length})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
