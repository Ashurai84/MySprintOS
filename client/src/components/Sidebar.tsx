import React from 'react'
import { 
  LayoutDashboard, 
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
  Award
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getKolkataDateString, getEntriesForDate } from '../utils/timetableUtils'
import { Badge } from './ui/badge'

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
  const { profile, tasks, getAllSubjectAttendanceStats, timetableEntries } = useApp()

  const kolkataTodayStr = getKolkataDateString()

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
      badge: todayTimetableCount > 0 ? `${todayTimetableCount} Today` : undefined,
      badgeVariant: 'secondary' as const
    },
    { 
      id: 'attendance', 
      label: 'Attendance', 
      icon: UserCheck,
      badge: attendanceWarningCount > 0 ? `${attendanceWarningCount} Alert` : undefined,
      badgeVariant: 'destructive' as const
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
      badgeVariant: 'outline' as const
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
      badge: undefined 
    },
    { 
      id: 'documents', 
      label: 'Documents', 
      icon: FileText,
      badge: undefined 
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
          className="fixed inset-0 bg-background/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <Zap className="w-4 h-4 fill-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-tight text-foreground text-sm">SprintOS</span>
                <Badge variant="outline" className="text-[10px] uppercase font-mono px-1 py-0 border-primary/30 text-primary">
                  2.0
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Semester 5 • Sprint 2</p>
            </div>
          </div>

          {/* Student & Cohort Pill */}
          <div className="mt-3 p-2 rounded-md bg-secondary/50 border border-border text-xs space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Student</span>
              <span className="font-medium text-foreground truncate max-w-[130px] text-[11px]">
                {profile.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Cohort</span>
              <span className="font-medium text-primary text-[11px]">
                {profile.cohort}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left focus-ring ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <Badge 
                    variant={item.badgeVariant || 'outline'}
                    className="text-[10px] font-mono h-4 px-1.5 py-0 shrink-0"
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer info: 6 Active Subjects Status */}
        <div className="p-3 border-t border-sidebar-border">
          {attendanceWarningCount > 0 ? (
            <button
              onClick={() => handleNavClick('attendance')}
              className="w-full p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between text-left hover:bg-destructive/15 transition-colors focus-ring"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-destructive" />
                <span className="font-medium text-[11px]">{attendanceWarningCount} Subject &lt; 75%</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="px-3 py-2 rounded-md bg-secondary/40 border border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                6 Subjects Active
              </span>
              <span className="font-mono text-muted-foreground/80">75% Min</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
