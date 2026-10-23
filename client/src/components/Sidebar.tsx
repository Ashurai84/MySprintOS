import React from 'react'
import { 
  LayoutDashboard, 
  CalendarClock,
  UserCheck, 
  GraduationCap, 
  CheckSquare, 
  BookOpen, 
  FileText, 
  RotateCcw, 
  Settings,
  AlertTriangle,
  Zap,
  ChevronRight,
  Clock,
  Code2,
  Award
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getKolkataDateString, getEntriesForDate } from '../utils/timetableUtils'

interface SidebarProps {
  currentTab: string
  setCurrentTab: (tab: string) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const { profile, lectures, tasks, getAllSubjectAttendanceStats, timetableEntries } = useApp()

  const kolkataTodayStr = getKolkataDateString()
  const todayLecturesCount = lectures.filter(l => l.date === kolkataTodayStr && l.status === 'scheduled').length

  const todayTimetableCount = React.useMemo(() => {
    return getEntriesForDate(timetableEntries, kolkataTodayStr).length
  }, [timetableEntries, kolkataTodayStr])

  const allStats = getAllSubjectAttendanceStats()
  const attendanceWarningCount = allStats.filter(s => s.isWarning).length

  const pendingAssignmentsCount = tasks.filter(t => t.status !== 'completed').length

  const navItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: LayoutDashboard,
      badge: undefined 
    },
    { 
      id: 'timetable', 
      label: 'Timetable', 
      icon: Clock,
      badge: todayTimetableCount > 0 ? `${todayTimetableCount} Today` : '7 Days',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    { 
      id: 'lectures', 
      label: 'My Lectures', 
      icon: CalendarClock,
      badge: todayLecturesCount > 0 ? `${todayLecturesCount} Today` : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    { 
      id: 'attendance', 
      label: 'Attendance', 
      icon: UserCheck,
      badge: attendanceWarningCount > 0 ? `${attendanceWarningCount} Alert` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    { 
      id: 'java-recovery', 
      label: 'Java Recovery', 
      icon: Code2,
      badge: '14 Topics',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    { 
      id: 'learning', 
      label: 'My Learning', 
      icon: GraduationCap,
      badge: undefined 
    },
    { 
      id: 'assignments', 
      label: 'Assignments', 
      icon: CheckSquare,
      badge: pendingAssignmentsCount > 0 ? `${pendingAssignmentsCount}` : undefined,
      badgeColor: 'bg-slate-700 text-slate-300 border-slate-600'
    },
    { 
      id: 'certifications', 
      label: 'Courses & Certs', 
      icon: Award,
      badge: undefined 
    },
    { 
      id: 'subjects', 
      label: 'Subjects & Syllabus', 
      icon: BookOpen,
      badge: '6 Scope' 
    },
    { 
      id: 'documents', 
      label: 'Documents', 
      icon: FileText,
      badge: '7 Files' 
    },
    { 
      id: 'revision', 
      label: 'Revision & Progress', 
      icon: RotateCcw,
      badge: undefined 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      badge: undefined 
    }
  ]

  const handleNavClick = (id: string) => {
    setCurrentTab(id)
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0e1422] border-r border-[#1e293d] flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-[#1e293d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-base">SprintOS</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded">
                  2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Semester 5 • Sprint 2</p>
            </div>
          </div>

          {/* Student & Cohort Pill */}
          <div className="mt-3.5 p-2.5 rounded-md bg-[#131b2e] border border-[#1f2b42] text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Student:</span>
              <span className="font-semibold text-white truncate max-w-[120px]">
                {profile.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Cohort:</span>
              <span className="font-medium text-blue-400">
                {profile.cohort}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left focus-ring ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#151e30]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isActive 
                      ? 'bg-blue-700/60 text-white border-blue-400/40' 
                      : (item.badgeColor || 'bg-[#182338] text-slate-400 border-[#233350]')
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer info: 6 Active Subjects Status */}
        <div className="p-3 border-t border-[#1e293d]">
          {attendanceWarningCount > 0 ? (
            <button
              onClick={() => handleNavClick('attendance')}
              className="w-full p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between text-left hover:bg-rose-500/15 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span className="font-medium text-[11px]">{attendanceWarningCount} Subject &lt; 75%</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
            </button>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-[#111827] border border-[#1d273a] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                6 Subjects Tracked
              </span>
              <span className="font-mono text-slate-500">75% Min</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
