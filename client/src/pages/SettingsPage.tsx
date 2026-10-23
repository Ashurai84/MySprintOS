import React, { useState } from 'react'
import { 
  User, 
  Download, 
  Upload, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  FileJson,
  Sliders,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  Eye,
  Clock,
  ShieldCheck,
  X
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { 
  downloadJsonFile, 
  downloadCsvFile, 
  exportTasksToCsv, 
  exportAttendanceToCsv 
} from '../utils/exportImport'
import { generateClientDailyHtml, generateClientWeeklyHtml } from '../utils/reportPreview'

export const SettingsPage: React.FC = () => {
  const { 
    profile, 
    updateProfile, 
    settings,
    updateSettings,
    storageMode, 
    tasks, 
    lectures,
    topicProgress,
    appDocuments,
    revisionSessions,
    certifications, 
    resources, 
    attendance, 
    completedTopics, 
    subjects,
    clearSampleData, 
    resetAllData, 
    importBackupData,
    timetableEntries,
    javaTopics,
    enhancedCourses,
    emailSettings,
    updateEmailSettings,
    generateDailyReportPayload,
    generateWeeklyReportPayload
  } = useApp()

  // Profile Form state
  const [name, setName] = useState(profile.name)
  const [program, setProgram] = useState(profile.program)
  const [cohort, setCohort] = useState(profile.cohort)
  const [batch, setBatch] = useState(profile.batch)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Academic Settings State
  const [minAttendance, setMinAttendance] = useState(settings.minAttendancePercent)
  const [internalTotal, setInternalTotal] = useState(settings.internalMarksTotal)
  const [externalTotal, setExternalTotal] = useState(settings.externalMarksTotal)
  const [settingsSuccess, setSettingsSuccess] = useState(false)

  // Email Dispatch State
  const [recipientEmail, setRecipientEmail] = useState(emailSettings.recipientEmail || '')
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(emailSettings.dailyDigestEnabled ?? true)
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(emailSettings.weeklyDigestEnabled ?? true)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [previewModal, setPreviewModal] = useState<{ open: boolean; type: 'daily' | 'weekly'; html: string }>({
    open: false,
    type: 'daily',
    html: ''
  })
  const [testSending, setTestSending] = useState(false)
  const [testStatus, setTestStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  })

  // Advanced section toggle
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Import State
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  })

  // Confirmation dialogs
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showClearSampleConfirm, setShowClearSampleConfirm] = useState(false)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      name: name.trim(),
      program: program.trim(),
      cohort: cohort.trim(),
      batch: batch.trim()
    })
    setProfileSuccess(true)
    setTimeout(() => setProfileSuccess(false), 2000)
  }

  const handleSaveAcademicSettings = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings({
      minAttendancePercent: Number(minAttendance) || 75,
      internalMarksTotal: Number(internalTotal) || 60,
      externalMarksTotal: Number(externalTotal) || 40
    })
    setSettingsSuccess(true)
    setTimeout(() => setSettingsSuccess(false), 2000)
  }

  const handleSaveEmailSettings = (e: React.FormEvent) => {
    e.preventDefault()
    updateEmailSettings({
      recipientEmail: recipientEmail.trim(),
      dailyDigestEnabled,
      weeklyDigestEnabled
    })
    setEmailSuccess(true)
    setTimeout(() => setEmailSuccess(false), 2000)
  }

  const handleOpenPreview = async (type: 'daily' | 'weekly') => {
    try {
      const res = await fetch(`http://localhost:3001/api/reports/preview?type=${type}`)
      if (res.ok) {
        const data = await res.json()
        if (data.html) {
          setPreviewModal({ open: true, type, html: data.html })
          return
        }
      }
    } catch {
      // Backend server not running, fallback to client-side rendered HTML preview
    }

    if (type === 'daily') {
      const payload = generateDailyReportPayload()
      const html = generateClientDailyHtml(payload)
      setPreviewModal({ open: true, type, html })
    } else {
      const payload = generateWeeklyReportPayload()
      const html = generateClientWeeklyHtml(payload)
      setPreviewModal({ open: true, type, html })
    }
  }

  const handleSendTestEmail = async () => {
    if (!recipientEmail) {
      setTestStatus({ type: 'error', message: 'Please enter a valid recipient email address first.' })
      return
    }
    setTestSending(true)
    setTestStatus({ type: 'idle', message: '' })
    try {
      const res = await fetch('http://localhost:3001/api/reports/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestStatus({ type: 'success', message: `Test email successfully dispatched to ${recipientEmail}!` })
      } else {
        setTestStatus({
          type: 'error',
          message: data.message || 'Dispatch failed. Verify SMTP settings in server/.env.'
        })
      }
    } catch {
      setTestStatus({
        type: 'error',
        message: 'Could not connect to background scheduler backend (http://localhost:3001). Run "npm --prefix server start" to launch background dispatcher.'
      })
    } finally {
      setTestSending(false)
    }
  }

  const handleExportJson = () => {
    const backup = {
      version: '2.1',
      exportedAt: new Date().toISOString(),
      profile,
      settings,
      lectures,
      topicProgress,
      tasks,
      certifications,
      resources,
      documents: appDocuments,
      revisionSessions,
      attendance,
      completedTopics,
      timetable: timetableEntries,
      javaTopics,
      enhancedCourses,
      emailSettings
    }
    const filename = `sprintos-backup-${new Date().toISOString().split('T')[0]}.json`
    downloadJsonFile(filename, backup)
  }

  const handleExportTasksCsv = () => {
    const csv = exportTasksToCsv(tasks)
    const filename = `sprintos-assignments-${new Date().toISOString().split('T')[0]}.csv`
    downloadCsvFile(filename, csv)
  }

  const handleExportAttendanceCsv = () => {
    const subjectMap: Record<string, string> = {}
    subjects.forEach(s => { subjectMap[s.id] = s.name })
    const csv = exportAttendanceToCsv(attendance, subjectMap)
    const filename = `sprintos-attendance-${new Date().toISOString().split('T')[0]}.csv`
    downloadCsvFile(filename, csv)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        const result = importBackupData(content)
        if (result.success) {
          setImportStatus({ type: 'success', message: result.message })
        } else {
          setImportStatus({ type: 'error', message: result.message })
        }
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
            Preferences & Configuration
          </span>
          <span className="text-xs text-slate-400 font-mono">
            SprintOS 2.0
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1">
          Settings & Academic Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure university attendance regulations, evaluation mark weights, student registration, and data backups.
        </p>
      </div>

      {/* 1. Academic Regulations & Evaluation Rules */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#1e293d]">
          <Sliders className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">University Regulations & Evaluation Scheme</h3>
            <p className="text-xs text-slate-400">Configure attendance thresholds and semester mark weights</p>
          </div>
        </div>

        {settingsSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Academic regulations updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSaveAcademicSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Minimum Attendance (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={minAttendance}
                onChange={e => setMinAttendance(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-white focus-ring font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 75% per subject</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Internal Assessment (Marks)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={internalTotal}
                onChange={e => setInternalTotal(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-white focus-ring font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 60 marks</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                External Assessment (Marks)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={externalTotal}
                onChange={e => setExternalTotal(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-white focus-ring font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 40 marks</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0b0f19] border border-[#1b2538] text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Verified Evaluation Scheme:</span>
            <div className="flex items-center gap-3 flex-wrap">
              <span>Internal (60M): Attendance (5M) + Class Participation (5M) + Assignments (30M) + Mini Project (20M)</span>
              <span>•</span>
              <span>External (40M): Theory (20M) + Project Viva (20M)</span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus-ring"
            >
              Save Regulations
            </button>
          </div>
        </form>
      </div>

      {/* 2. Student Profile Settings */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#1e293d]">
          <User className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Student Registration Profile</h3>
            <p className="text-xs text-slate-400">Institutional context and cohort registration</p>
          </div>
        </div>

        {profileSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Profile updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Degree Program
              </label>
              <input
                type="text"
                required
                value={program}
                onChange={e => setProgram(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Cohort
              </label>
              <input
                type="text"
                required
                value={cohort}
                onChange={e => setCohort(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Batch
              </label>
              <input
                type="text"
                required
                value={batch}
                onChange={e => setBatch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus-ring"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* 3. Daily & Weekly Email Dispatch System */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293d]">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Automated Email Dispatch System</h3>
              <p className="text-xs text-slate-400">Scheduled delivery at 18:00 Asia/Kolkata (Daily concise + Sunday weekly audit)</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Node / Cron 18:00 IST
          </span>
        </div>

        {emailSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Email preferences saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSaveEmailSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Recipient Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="ashutosh.rai@example.com"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="w-full px-3 py-2 pl-9 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-white focus-ring font-mono"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Automated briefing digests will be dispatched to this email address.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-[#0b0f19] border border-[#1e293d] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Daily Briefing Digest</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Dispatched Monday–Saturday at 18:00 IST</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dailyDigestEnabled}
                  onChange={e => setDailyDigestEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-3 rounded-lg bg-[#0b0f19] border border-[#1e293d] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Sunday Comprehensive Digest</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Dispatched Sundays at 18:00 IST with analytics</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={weeklyDigestEnabled}
                  onChange={e => setWeeklyDigestEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPreview('daily')}
                className="px-3 py-1.5 rounded-lg bg-[#162035] hover:bg-[#1e2c48] border border-[#23314e] text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 focus-ring"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Preview Daily HTML</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenPreview('weekly')}
                className="px-3 py-1.5 rounded-lg bg-[#162035] hover:bg-[#1e2c48] border border-[#23314e] text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 focus-ring"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Preview Weekly HTML</span>
              </button>
              <button
                type="button"
                disabled={testSending}
                onClick={handleSendTestEmail}
                className="px-3 py-1.5 rounded-lg bg-[#162035] hover:bg-[#1e2c48] border border-[#23314e] text-amber-300 hover:text-amber-200 text-xs font-medium transition-colors flex items-center gap-1.5 focus-ring disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>{testSending ? 'Dispatching...' : 'Send Test Email'}</span>
              </button>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus-ring"
            >
              Save Email Settings
            </button>
          </div>

          {testStatus.type !== 'idle' && (
            <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              testStatus.type === 'success' 
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}>
              {testStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-[#0b0f19] border border-[#1b2538] text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              24/7 Laptop-Off Reliability:
            </span>
            <p>
              The background cron scheduler runs independently via Node.js in <code className="text-slate-300">server/</code>. Even when your browser tab is closed or your computer is asleep, deploying this server to a lightweight container or VPS guarantees scheduled 18:00 IST delivery. Duplicate dispatches are prevented by persistent timestamp tracking.
            </p>
          </div>
        </form>
      </div>

      {/* 4. Export & Import Data */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#1e293d]">
          <Download className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Data Export & Backup</h3>
            <p className="text-xs text-slate-400">Download your lectures, attendance records, learning reflections and assignments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportJson}
            className="p-3.5 rounded-lg bg-[#0c121e] border border-[#1b2538] hover:border-blue-500/40 text-left transition-colors flex flex-col justify-between group focus-ring"
          >
            <div>
              <FileJson className="w-5 h-5 text-blue-400 mb-2" />
              <span className="text-xs font-semibold text-white block group-hover:text-blue-300">
                Full Backup (JSON)
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Complete database snapshot including lectures and learning logs.
              </p>
            </div>
            <span className="text-[10px] text-blue-400 font-mono mt-3">Download JSON →</span>
          </button>

          <button
            onClick={handleExportTasksCsv}
            className="p-3.5 rounded-lg bg-[#0c121e] border border-[#1b2538] hover:border-blue-500/40 text-left transition-colors flex flex-col justify-between group focus-ring"
          >
            <div>
              <FileSpreadsheet className="w-5 h-5 text-blue-400 mb-2" />
              <span className="text-xs font-semibold text-white block group-hover:text-blue-300">
                Assignments (CSV)
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Export all {tasks.length} assignments with status and deadlines.
              </p>
            </div>
            <span className="text-[10px] text-blue-400 font-mono mt-3">Download CSV →</span>
          </button>

          <button
            onClick={handleExportAttendanceCsv}
            className="p-3.5 rounded-lg bg-[#0c121e] border border-[#1b2538] hover:border-blue-500/40 text-left transition-colors flex flex-col justify-between group focus-ring"
          >
            <div>
              <FileSpreadsheet className="w-5 h-5 text-cyan-400 mb-2" />
              <span className="text-xs font-semibold text-white block group-hover:text-cyan-300">
                Attendance Log (CSV)
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Export subject-wise attendance percentages and session counts.
              </p>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono mt-3">Download CSV →</span>
          </button>
        </div>

        {/* Import JSON Section */}
        <div className="pt-3 border-t border-[#1e293d] space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Import Previously Exported Backup (JSON)
          </label>
          <div className="flex items-center gap-3">
            <label className="px-3.5 py-2 rounded-lg bg-[#162035] hover:bg-[#1f2d4a] text-slate-200 border border-[#23314e] text-xs font-medium cursor-pointer transition-colors flex items-center gap-2 focus-ring">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Select Backup File...</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-slate-400">
              Validates schema automatically before applying changes.
            </span>
          </div>

          {importStatus.type === 'success' && (
            <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{importStatus.message}</span>
            </div>
          )}

          {importStatus.type === 'error' && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Advanced Technical Settings (Collapsible) */}
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] space-y-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-left focus-ring"
        >
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Advanced System & Storage Details</h3>
              <p className="text-xs text-slate-400">Persistence architecture, reset actions, and local database keys</p>
            </div>
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showAdvanced && (
          <div className="pt-3 border-t border-[#1e293d] space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#0c121e] border border-[#1b2538] text-slate-300 space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Storage Mode:</span>
                <span className="text-white">{storageMode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Subjects:</span>
                <span className="text-blue-400">6 (Elon Musk Cohort)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Client Persistence:</span>
                <span className="text-emerald-400">Synchronized on every write across browser reloads</span>
              </div>
            </div>

            {/* Danger Zone: Reset Data */}
            <div className="pt-2 border-t border-[#1e293d] flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-semibold text-white">Reset Application Data</h4>
                <p className="text-[11px] text-slate-400">Clear all local lectures, tasks, and learning notes</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearSampleConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#162035] hover:bg-[#202d48] text-slate-300 border border-[#233352] text-xs font-medium transition-colors"
                >
                  Clear All User Data
                </button>

                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-medium transition-colors"
                >
                  Reset to Fresh Slate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0f172a] border border-[#1e293d] rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Reset All SprintOS Data?
            </h3>
            <p className="text-xs text-slate-300">
              This will erase all local lectures, attendance logs, and assignments, restoring the application to an empty clean state.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllData()
                  setShowResetConfirm(false)
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearSampleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0f172a] border border-[#1e293d] rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-white">Clear All User Data?</h3>
            <p className="text-xs text-slate-300">
              This will delete all logged lectures, tasks, and notes while keeping syllabus and document indexes intact.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearSampleConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearSampleData()
                  setShowClearSampleConfirm(false)
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Report Preview Modal */}
      {previewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-[#1e293d] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e293d] bg-[#111c33]">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white">
                  {previewModal.type === 'daily' ? 'Daily Report Preview (Monday–Saturday 18:00 IST)' : 'Sunday Comprehensive Audit Preview (18:00 IST)'}
                </span>
              </div>
              <button
                onClick={() => setPreviewModal(prev => ({ ...prev, open: false }))}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-[#0b0f19]">
              <iframe
                title="Email Preview"
                srcDoc={previewModal.html}
                className="w-full h-[540px] rounded-lg border border-[#1e293d] bg-white/5"
              />
            </div>

            <div className="px-5 py-3 border-t border-[#1e293d] bg-[#111827] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Dispatched automatically at 18:00 IST to: {recipientEmail || 'ashutosh.rai@example.com'}
              </span>
              <button
                onClick={() => setPreviewModal(prev => ({ ...prev, open: false }))}
                className="px-3.5 py-1.5 rounded-lg bg-[#162035] hover:bg-[#202d48] text-slate-200 text-xs font-medium transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
