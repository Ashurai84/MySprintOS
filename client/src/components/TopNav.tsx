import React, { useState, useEffect } from 'react'
import { Menu, Plus, Calendar, CalendarClock, Clock } from 'lucide-react'
import { formatFullDate } from '../utils/dateUtils'
import { useApp } from '../context/AppContext'
import { Button } from './ui/button'

interface TopNavProps {
  currentTab: string
  setIsMobileOpen: (open: boolean) => void
  onOpenQuickLecture: () => void
  onOpenQuickTask: () => void
}

const tabTitles: Record<string, { title: string; subtitle: string }> = {
  home: { title: 'Home', subtitle: 'Daily Academic Overview & Attendance Status' },
  lectures: { title: 'My Lectures', subtitle: 'Daily Lecture Tracking, Attendance & Notes' },
  timetable: { title: 'Timetable', subtitle: 'Weekly Schedule & 12-Hour Daily Matrix' },
  attendance: { title: 'Attendance', subtitle: 'Subject-Wise Verification & 75% Target Recovery' },
  learning: { title: 'My Learning', subtitle: 'Daily Reflections, Understood Concepts & Questions' },
  assignments: { title: 'Assignments', subtitle: 'Coursework, Labs, Projects & Submissions' },
  subjects: { title: 'Subjects & Syllabus', subtitle: '6 Core Academic Workspaces • Elon Musk Cohort' },
  documents: { title: 'Documents', subtitle: 'In-App Document Reader (PDF, XLSX, DOCX)' },
  revision: { title: 'Revision & Progress', subtitle: 'Topic Review Queue & Daily Self-Recall Checklist' },
  settings: { title: 'Settings', subtitle: 'Academic Configuration, Student Profile & Data Backup' },
  certifications: { title: 'Courses & Certs', subtitle: 'Professional Credentials & Verified Certificates' },
  dashboard: { title: 'Home', subtitle: 'Daily Academic Overview & Attendance Status' },
  tasks: { title: 'Assignments', subtitle: 'Coursework & Deliverables' }
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  setIsMobileOpen,
  onOpenQuickLecture,
  onOpenQuickTask
}) => {
  const { profile } = useApp()
  const info = tabTitles[currentTab] || { title: 'SprintOS', subtitle: 'Academic Command Center' }
  const todayStr = formatFullDate()
  const [time12H, setTime12H] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime12H(now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="sticky top-0 z-30 h-14 bg-card/85 backdrop-blur-md border-b border-border px-4 md:px-8 flex items-center justify-between">
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-1.5 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 md:hidden focus-ring"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm md:text-base font-semibold text-foreground tracking-tight leading-none">
            {info.title}
          </h1>
          <p className="text-[11px] text-muted-foreground hidden sm:block mt-0.5">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: 12-Hour Clock, Date, Essential Actions & Avatar */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* 12-Hour Live Clock */}
        <div 
          className="hidden md:flex items-center gap-1.5 text-xs text-primary bg-secondary/50 border border-border px-2.5 py-1 rounded-md font-mono"
          title="Current IST (12-Hour)"
        >
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>{time12H}</span>
        </div>

        {/* Live Date */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/30 border border-border px-2.5 py-1 rounded-md">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{todayStr}</span>
        </div>

        {/* Quick Add Assignment Button (Secondary) */}
        <Button
          variant="outline"
          size="sm"
          onPress={onOpenQuickTask}
          className="hidden sm:inline-flex text-xs h-8 px-2.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Assignment
        </Button>

        {/* Primary Quick Add Lecture Button */}
        <Button
          variant="default"
          size="sm"
          onPress={onOpenQuickLecture}
          className="text-xs h-8 px-3 font-medium cursor-pointer"
        >
          <CalendarClock className="w-3.5 h-3.5 mr-1" />
          Log Lecture
        </Button>

        {/* Student Avatar */}
        <div 
          className="w-7 h-7 rounded-full bg-secondary text-foreground border border-border flex items-center justify-center text-xs font-semibold ml-1 shrink-0"
          title={`${profile.name} (${profile.cohort})`}
        >
          {profile.name.charAt(0)}
        </div>
      </div>
    </header>
  )
}
