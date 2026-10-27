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
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

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
          <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider text-primary border-primary/20 bg-primary/5">
            Preferences & Configuration
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            SprintOS 2.0
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mt-1">
          Settings & Academic Configuration
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure university attendance regulations, evaluation mark weights, student registration, and data backups.
        </p>
      </div>

      {/* 1. Academic Regulations & Evaluation Rules */}
      <Card className="p-5 border-border bg-card space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <Sliders className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">University Regulations & Evaluation Scheme</h3>
            <p className="text-xs text-muted-foreground">Configure attendance thresholds and semester mark weights</p>
          </div>
        </div>

        {settingsSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Academic regulations updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSaveAcademicSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-foreground font-semibold mb-1">
                Minimum Attendance (%)
              </label>
              <Input
                type="number"
                min="50"
                max="100"
                value={minAttendance}
                onChange={e => setMinAttendance(Number(e.target.value))}
                className="text-xs bg-muted/40 font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Default: 75% per subject</span>
            </div>

            <div>
              <label className="block text-foreground font-semibold mb-1">
                Internal Assessment (Marks)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={internalTotal}
                onChange={e => setInternalTotal(Number(e.target.value))}
                className="text-xs bg-muted/40 font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Default: 60 marks</span>
            </div>

            <div>
              <label className="block text-foreground font-semibold mb-1">
                External Assessment (Marks)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={externalTotal}
                onChange={e => setExternalTotal(Number(e.target.value))}
                className="text-xs bg-muted/40 font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">Default: 40 marks</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/20 border border-border text-[11px] text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground block">Verified Evaluation Scheme:</span>
            <div className="flex items-center gap-3 flex-wrap">
              <span>Internal (60M): Attendance (5M) + Class Participation (5M) + Assignments (30M) + Mini Project (20M)</span>
              <span>•</span>
              <span>External (40M): Theory (20M) + Project Viva (20M)</span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs font-semibold"
            >
              Save Regulations
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Student Profile Settings */}
      <Card className="p-5 border-border bg-card space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <User className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Student Registration Profile</h3>
            <p className="text-xs text-muted-foreground">Institutional context and cohort registration</p>
          </div>
        </div>

        {profileSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Profile updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Full Name
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="text-xs bg-muted/40 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Degree Program
              </label>
              <Input
                type="text"
                required
                value={program}
                onChange={e => setProgram(e.target.value)}
                className="text-xs bg-muted/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Cohort
              </label>
              <Input
                type="text"
                required
                value={cohort}
                onChange={e => setCohort(e.target.value)}
                className="text-xs bg-muted/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Batch
              </label>
              <Input
                type="text"
                required
                value={batch}
                onChange={e => setBatch(e.target.value)}
                className="text-xs bg-muted/40"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs font-semibold"
            >
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Daily & Weekly Email Dispatch System */}
      <Card className="p-5 border-border bg-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Automated Email Dispatch System</h3>
              <p className="text-xs text-muted-foreground">Scheduled delivery at 18:00 Asia/Kolkata (Daily concise + Sunday weekly audit)</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono text-primary border-primary/20 bg-primary/5">
            Node / Cron 18:00 IST
          </Badge>
        </div>

        {emailSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Email preferences saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSaveEmailSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Recipient Email Address
            </label>
            <div className="relative">
              <Input
                type="email"
                required
                placeholder="ashutosh.rai@example.com"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                className="pl-9 text-xs bg-muted/40 font-mono"
              />
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 block">
              Automated briefing digests will be dispatched to this email address.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground block">Daily Briefing Digest</span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">Dispatched Monday–Saturday at 18:00 IST</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dailyDigestEnabled}
                  onChange={e => setDailyDigestEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground block">Sunday Comprehensive Digest</span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">Dispatched Sundays at 18:00 IST with analytics</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={weeklyDigestEnabled}
                  onChange={e => setWeeklyDigestEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleOpenPreview('daily')}
                className="h-8 text-xs gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>Preview Daily HTML</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleOpenPreview('weekly')}
                className="h-8 text-xs gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>Preview Weekly HTML</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                isDisabled={testSending}
                onClick={handleSendTestEmail}
                className="h-8 text-xs gap-1.5 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>{testSending ? 'Dispatching...' : 'Send Test Email'}</span>
              </Button>
            </div>

            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs font-semibold"
            >
              Save Email Settings
            </Button>
          </div>

          {testStatus.type !== 'idle' && (
            <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              testStatus.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              {testStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-muted/20 border border-border text-[11px] text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              24/7 Laptop-Off Reliability:
            </span>
            <p>
              The background cron scheduler runs independently via Node.js in <code className="text-foreground">server/</code>. Even when your browser tab is closed or your computer is asleep, deploying this server to a lightweight container or VPS guarantees scheduled 18:00 IST delivery. Duplicate dispatches are prevented by persistent timestamp tracking.
            </p>
          </div>
        </form>
      </Card>

      {/* 4. Export & Import Data */}
      <Card className="p-5 border-border bg-card space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <Download className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Data Export & Backup</h3>
            <p className="text-xs text-muted-foreground">Download your lectures, attendance records, learning reflections and assignments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportJson}
            className="p-3.5 rounded-lg bg-muted/20 border border-border hover:border-primary/40 text-left transition-colors flex flex-col justify-between group focus-ring"
          >
            <div>
              <FileJson className="w-5 h-5 text-primary mb-2" />
              <span className="text-xs font-semibold text-foreground block group-hover:text-primary">
                Full Backup (JSON)
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                Complete database snapshot including lectures and learning logs.
              </p>
            </div>
            <span className="text-[10px] text-primary font-mono mt-3">Download JSON →</span>
          </button>

          <button
            onClick={handleExportTasksCsv}
            className="p-3.5 rounded-lg bg-muted/20 border border-border hover:border-primary/40 text-left transition-colors flex flex-col justify-between group focus-ring"
          >
            <div>
              <FileSpreadsheet className="w-5 h-5 text-primary mb-2" />
              <span className="text-xs font-semibold text-foreground block group-hover:text-primary">
                Assignments (CSV)
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                Export all {tasks.length} assignments with status and deadlines.
              </p>
            </div>
            <span className="text-[10px] text-primary font-mono mt-3">Download CSV →</span>
          </button>

          <button
            onClick={handleExportAttendanceCsv}
            className="p-3.5 rounded-lg bg-muted/20 border border-border hover:border-primary/40 text-left transition-colors flex flex-col justify-between group focus-ring"
          >
            <div>
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 mb-2" />
              <span className="text-xs font-semibold text-foreground block group-hover:text-emerald-300">
                Attendance Log (CSV)
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                Export subject-wise attendance percentages and session counts.
              </p>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-3">Download CSV →</span>
          </button>
        </div>

        {/* Import JSON Section */}
        <div className="pt-3 border-t border-border space-y-2">
          <label className="block text-xs font-medium text-foreground">
            Import Previously Exported Backup (JSON)
          </label>
          <div className="flex items-center gap-3">
            <label className="px-3.5 py-2 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-xs font-medium cursor-pointer transition-colors flex items-center gap-2 focus-ring">
              <Upload className="w-4 h-4 text-primary" />
              <span>Select Backup File...</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-muted-foreground">
              Validates schema automatically before applying changes.
            </span>
          </div>

          {importStatus.type === 'success' && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{importStatus.message}</span>
            </div>
          )}

          {importStatus.type === 'error' && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>
      </Card>

      {/* 5. Advanced Technical Settings (Collapsible) */}
      <Card className="p-5 border-border bg-card space-y-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-left focus-ring"
        >
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Advanced System & Storage Details</h3>
              <p className="text-xs text-muted-foreground">Persistence architecture, reset actions, and local database keys</p>
            </div>
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showAdvanced && (
          <div className="pt-3 border-t border-border space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-muted/20 border border-border text-foreground space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Storage Mode:</span>
                <span className="text-foreground">{storageMode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active Subjects:</span>
                <span className="text-primary">6 (Elon Musk Cohort)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Client Persistence:</span>
                <span className="text-emerald-400">Synchronized on every write across browser reloads</span>
              </div>
            </div>

            {/* Danger Zone: Reset Data */}
            <div className="pt-2 border-t border-border flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Reset Application Data</h4>
                <p className="text-[11px] text-muted-foreground">Clear all local lectures, tasks, and learning notes</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowClearSampleConfirm(true)}
                  className="h-8 text-xs"
                >
                  Clear All User Data
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowResetConfirm(true)}
                  className="h-8 text-xs"
                >
                  Reset to Fresh Slate
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Dialogs */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="w-full max-w-sm bg-card border-border p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Reset All SprintOS Data?
            </h3>
            <p className="text-xs text-muted-foreground">
              This will erase all local lectures, attendance logs, and assignments, restoring the application to an empty clean state.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  resetAllData()
                  setShowResetConfirm(false)
                }}
                className="h-8 text-xs font-semibold"
              >
                Reset Everything
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showClearSampleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="w-full max-w-sm bg-card border-border p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-foreground">Clear All User Data?</h3>
            <p className="text-xs text-muted-foreground">
              This will delete all logged lectures, tasks, and notes while keeping syllabus and document indexes intact.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearSampleConfirm(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  clearSampleData()
                  setShowClearSampleConfirm(false)
                }}
                className="h-8 text-xs font-semibold"
              >
                Clear Data
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Email Report Preview Modal */}
      {previewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <Card className="w-full max-w-2xl bg-card border-border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {previewModal.type === 'daily' ? 'Daily Report Preview (Monday–Saturday 18:00 IST)' : 'Sunday Comprehensive Audit Preview (18:00 IST)'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewModal(prev => ({ ...prev, open: false }))}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-muted/10">
              <iframe
                title="Email Preview"
                srcDoc={previewModal.html}
                className="w-full h-[540px] rounded-lg border border-border bg-white"
              />
            </div>

            <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Dispatched automatically at 18:00 IST to: {recipientEmail || 'ashutosh.rai@example.com'}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreviewModal(prev => ({ ...prev, open: false }))}
                className="h-8 text-xs"
              >
                Close Preview
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

