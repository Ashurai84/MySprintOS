import React, { useState, useEffect } from 'react'
import { Menu, Plus, Calendar, CalendarClock, Palette, Clock, Check } from 'lucide-react'
import { formatFullDate } from '../utils/dateUtils'
import { useApp } from '../context/AppContext'
import type { AppTheme } from '../context/AppContext'

interface TopNavProps {
  currentTab: string
  setIsMobileOpen: (open: boolean) => void
  onOpenQuickLecture: () => void
  onOpenQuickTask: () => void
}

const tabTitles: Record<string, { title: string; subtitle: string }> = {
  home: { title: 'Home', subtitle: 'Daily Academic Overview & Attendance Status' },
  lectures: { title: 'My Lectures', subtitle: 'Daily Lecture Tracking, Attendance & Notes' },
  attendance: { title: 'Attendance', subtitle: 'Subject-Wise Verification & 75% Target Recovery' },
  learning: { title: 'My Learning', subtitle: 'Daily Reflections, Understood Concepts & Questions' },
  assignments: { title: 'Assignments', subtitle: 'Coursework, Labs, Projects & Submissions' },
  subjects: { title: 'Subjects & Syllabus', subtitle: '6 Core Academic Workspaces • Elon Musk Cohort' },
  documents: { title: 'Documents', subtitle: 'In-App Document Reader (PDF, XLSX, DOCX)' },
  revision: { title: 'Revision & Progress', subtitle: 'Topic Review Queue & Daily Self-Recall Checklist' },
  settings: { title: 'Settings', subtitle: 'Academic Configuration, Student Profile & Data Backup' },
  // Legacy aliases
  dashboard: { title: 'Home', subtitle: 'Daily Academic Overview & Attendance Status' },
  tasks: { title: 'Assignments', subtitle: 'Coursework & Deliverables' },
  certifications: { title: 'Certifications', subtitle: 'Skill Credentials' },
  resources: { title: 'Resource Library', subtitle: 'Textbooks & Guides' }
}

const themes: Array<{ id: AppTheme; label: string; icon: string; preview: string }> = [
  { id: 'warm-sunset', label: 'Warm Sunset Amber & Gold', icon: '🌅', preview: 'bg-gradient-to-r from-amber-500 to-orange-500' },
  { id: 'cyber-violet', label: 'Midnight Cyber Violet', icon: '🌌', preview: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'emerald-matrix', label: 'Emerald Matrix & Jade', icon: '🌲', preview: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { id: 'deep-sapphire', label: 'Deep Space Sapphire', icon: '🌊', preview: 'bg-gradient-to-r from-blue-500 to-cyan-500' }
]

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  setIsMobileOpen,
  onOpenQuickLecture,
  onOpenQuickTask
}) => {
  const { profile, theme, setTheme } = useApp()
  const info = tabTitles[currentTab] || { title: 'SprintOS', subtitle: 'Academic Command Center' }
  const todayStr = formatFullDate()
  const [isThemeOpen, setIsThemeOpen] = useState(false)
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
    <header className="sticky top-0 z-30 h-16 bg-[#0e1422]/90 backdrop-blur-md border-b border-[#1e293d] px-4 md:px-8 flex items-center justify-between">
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2338] md:hidden focus-ring"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-semibold text-white tracking-tight leading-none">
            {info.title}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: Live Date, 12-Hour Time, Theme Switcher & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* 12-Hour Live Clock Pill */}
        <div 
          className="hidden md:flex items-center gap-1.5 text-xs text-amber-300/90 bg-[#162035] border border-[#21304d] px-2.5 py-1.5 rounded-lg font-mono"
          title="Standard 12-Hour Time"
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{time12H} <span className="text-[10px] text-slate-400">(12h)</span></span>
        </div>

        {/* Live Date Pill */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 bg-[#141d30] border border-[#212e47] px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>{todayStr}</span>
        </div>

        {/* Color Theme Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsThemeOpen(prev => !prev)}
            className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#141d30] hover:bg-[#1f2d4a] border border-[#212e47] px-2.5 py-1.5 rounded-lg transition-colors focus-ring"
            title="Change Web App Color Theme"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Theme</span>
          </button>

          {isThemeOpen && (
            <div 
              className="absolute right-0 mt-2 w-64 bg-[#14110e] border border-[#382c1f] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-2 py-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider border-b border-[#2e2419] mb-1">
                Color Themes
              </div>
              {themes.map(t => {
                const isActive = theme === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id)
                      setIsThemeOpen(false)
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isActive 
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30 font-semibold' 
                        : 'text-slate-300 hover:bg-[#261f18] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{t.icon}</span>
                      <span className="truncate">{t.label}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Add Assignment Button (Secondary) */}
        <button
          onClick={onOpenQuickTask}
          className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-300 bg-[#162035] hover:bg-[#1f2d4a] hover:text-white border border-[#22314e] px-3 py-2 rounded-lg transition-colors focus-ring"
          title="Add coursework or lab deliverable"
        >
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>Assignment</span>
        </button>

        {/* Primary Quick Add Lecture Button */}
        <button
          onClick={onOpenQuickLecture}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-xs px-3.5 py-2 rounded-lg transition-colors focus-ring"
          title="Add a daily lecture session"
        >
          <CalendarClock className="w-4 h-4" />
          <span>Log Lecture</span>
        </button>

        {/* User avatar indicator */}
        <div 
          className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center text-xs font-bold ml-1"
          title={`${profile.name} (${profile.cohort})`}
        >
          {profile.name.charAt(0)}
        </div>
      </div>
    </header>
  )
}
