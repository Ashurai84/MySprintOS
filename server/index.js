require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { 
  emailSettings, 
  deliveryLogs, 
  sendEmailWithRetry, 
  initScheduler, 
  updateSchedulerSettings 
} = require('./scheduler')
const { generateDailyReportHtml, generateWeeklyReportHtml } = require('./reportGenerator')
const { generateAiBriefing } = require('./aiService')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// In-memory cache of latest state from client if synced
let latestAcademicState = null

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SprintOS 2.1 Backend Server',
    scheduler: 'active',
    timezone: emailSettings.timezone,
    dailyTime: emailSettings.dailyReportTime,
    weeklyDayTime: `${emailSettings.weeklyReportDay} ${emailSettings.weeklyReportTime}`
  })
})

// Sync settings & academic state from client
app.post('/api/email/sync', (req, res) => {
  const { settings, state } = req.body
  if (settings) {
    updateSchedulerSettings(settings)
  }
  if (state) {
    latestAcademicState = state
  }
  res.json({ success: true, settings: emailSettings })
})

// Get delivery logs
app.get('/api/email/logs', (req, res) => {
  res.json({ logs: deliveryLogs })
})

// Generate live HTML preview of Daily Report
app.post('/api/email/preview-daily', (req, res) => {
  const data = req.body.data || latestAcademicState?.daily || {
    date: new Date().toISOString().split('T')[0],
    studentName: 'Ashutosh Rai',
    cohort: 'Elon Musk',
    batch: '2024–28',
    todayLectures: [
      { subject: 'DSA III', title: 'Strongly Connected Components', durationMinutes: 120, status: 'attended' }
    ],
    totalStudyMinutes: 120,
    attendanceSummary: [],
    pendingTasksCount: 2,
    urgentTasks: [{ title: 'Assignment 2: Graph Theory', deadline: '2026-10-25' }],
    completedTasksCount: 1,
    javaMasteryPercentage: 65
  }
  const html = generateDailyReportHtml(data)
  res.send(html)
})

// Generate live HTML preview of Weekly Report
app.post('/api/email/preview-weekly', (req, res) => {
  const data = req.body.data || latestAcademicState?.weekly || {
    generatedAt: new Date().toISOString(),
    studentName: 'Ashutosh Rai',
    cohort: 'Elon Musk',
    batch: '2024–28',
    weeklyStudyHours: 18.5,
    weeklyLecturesCount: 14,
    weeklyAttendedCount: 12,
    attendanceStats: [
      { subjectId: 'dsa-3', attended: 12, totalHeld: 14, percentage: 85.7, isWarning: false },
      { subjectId: 'llm-rag-agentic-ai', attended: 8, totalHeld: 10, percentage: 80.0, isWarning: false }
    ],
    tasksOverview: { total: 10, completed: 7, pending: 3 },
    javaProgress: { totalTopics: 14, understood: 8, learning: 4, needsRevision: 2 },
    coursesProgress: [
      { title: 'Generative AI with Large Language Models', provider: 'DeepLearning.AI', progressPercentage: 60, status: 'in_progress', certificateEarned: false }
    ]
  }
  const html = generateWeeklyReportHtml(data)
  res.send(html)
})

// Trigger a Test Email
app.post('/api/email/test', async (req, res) => {
  const { recipientEmail, reportType = 'daily', sampleData } = req.body
  const targetEmail = recipientEmail || emailSettings.recipientEmail

  if (!targetEmail) {
    return res.status(400).json({ success: false, message: 'Recipient email is required.' })
  }

  const isWeekly = reportType === 'weekly'
  const html = isWeekly 
    ? generateWeeklyReportHtml(sampleData || {}) 
    : generateDailyReportHtml(sampleData || { date: new Date().toISOString().split('T')[0] })

  const result = await sendEmailWithRetry({
    from: process.env.SMTP_FROM || 'SprintOS Command Center <reports@sprintos.local>',
    to: targetEmail,
    subject: `[TEST] SprintOS ${isWeekly ? 'Weekly Summary' : 'Daily Report'} Preview`,
    html
  })

  res.json(result)
})

// Client Frontend Compatibility Endpoints (used by SettingsPage.tsx)
app.get('/api/reports/preview', (req, res) => {
  const type = req.query.type || 'daily'
  const isWeekly = type === 'weekly'
  const html = isWeekly
    ? generateWeeklyReportHtml(latestAcademicState?.weekly || {})
    : generateDailyReportHtml(latestAcademicState?.daily || { date: new Date().toISOString().split('T')[0] })
  res.send(html)
})

app.post('/api/reports/send-test', async (req, res) => {
  const { recipientEmail, reportType = 'daily' } = req.body
  const targetEmail = recipientEmail || emailSettings.recipientEmail

  if (!targetEmail) {
    return res.status(400).json({ success: false, message: 'Recipient email is required.' })
  }

  const isWeekly = reportType === 'weekly'
  const html = isWeekly 
    ? generateWeeklyReportHtml(latestAcademicState?.weekly || {}) 
    : generateDailyReportHtml(latestAcademicState?.daily || { date: new Date().toISOString().split('T')[0] })

  const result = await sendEmailWithRetry({
    from: process.env.SMTP_FROM || 'SprintOS Academic Command Center <reports@sprintos.local>',
    to: targetEmail,
    subject: `[TEST] SprintOS ${isWeekly ? 'Weekly Summary' : 'Daily Report'} Preview`,
    html
  })

  res.json(result)
})

// Generate Groq AI Executive Academic Briefing
app.post('/api/ai/briefing', async (req, res) => {
  try {
    const data = req.body.data || latestAcademicState?.daily || {
      studentName: 'Ashutosh Rai',
      date: new Date().toISOString().split('T')[0],
      todayLectures: [
        { subject: 'DSA III', title: "Kosaraju's Algorithm & Strongly Connected Components", durationMinutes: 120, status: 'attended' }
      ],
      urgentTasks: [{ title: 'Assignment 2: Graph Theory', deadline: '2026-10-25' }],
      javaMasteryPercentage: 65
    }

    const aiBriefing = await generateAiBriefing(data)
    res.json({ success: true, aiBriefing })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Generate Groq AI Briefing AND Dispatch via Email
app.post('/api/ai/send-briefing', async (req, res) => {
  try {
    const { recipientEmail, academicData } = req.body
    const targetEmail = recipientEmail || emailSettings.recipientEmail

    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' })
    }

    const data = academicData || latestAcademicState?.daily || {
      date: new Date().toISOString().split('T')[0],
      studentName: 'Ashutosh Rai',
      cohort: 'Elon Musk',
      batch: '2024–28',
      todayLectures: [
        { subject: 'DSA III', title: "Kosaraju's Algorithm & Strongly Connected Components", durationMinutes: 120, status: 'attended' },
        { subject: 'LLMs, RAG & Agentic AI', title: 'RAG Architecture & Chunking Strategies', durationMinutes: 60, status: 'attended' }
      ],
      totalStudyMinutes: 180,
      attendanceSummary: [{ subjectId: 'S5-CS01', percentage: 100 }, { subjectId: 'S5-AI01', percentage: 100 }],
      pendingTasksCount: 2,
      urgentTasks: [{ title: 'Assignment 2: Graph Theory', deadline: '2026-10-25' }],
      completedTasksCount: 1,
      javaMasteryPercentage: 65
    }

    // 1. Generate AI Briefing using Groq LPU
    const aiBriefing = await generateAiBriefing(data)
    data.aiBriefing = aiBriefing

    // 2. Generate responsive HTML email with embedded AI briefing
    const html = generateDailyReportHtml(data)

    // 3. Send email via SMTP (or simulator)
    const result = await sendEmailWithRetry({
      from: process.env.SMTP_FROM || 'SprintOS Command Center <reports@sprintos.local>',
      to: targetEmail,
      subject: `⚡ [SprintOS AI Briefing] Academic Daily Synthesis — ${data.date}`,
      html
    })

    res.json({ success: result.success, log: result.log, aiBriefing })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Start Scheduler
initScheduler((type) => {
  if (latestAcademicState) {
    return type === 'weekly' ? latestAcademicState.weekly : latestAcademicState.daily
  }
  return { type, date: new Date().toISOString().split('T')[0] }
})

// Listen
app.listen(PORT, () => {
  console.log(`[SprintOS Server] Listening on http://localhost:${PORT}`)
})
