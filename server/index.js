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
    curriculumMasteryPercentage: 75
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
    curriculumProgress: { totalTopics: 28, understood: 18, learning: 6, needsRevision: 4 },
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
      curriculumMasteryPercentage: 75
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
      curriculumMasteryPercentage: 75
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

// ============================================================================
// CERTIFICATE HUB BACKEND ENDPOINTS
// ============================================================================
let serverCertificates = []

// Get all certificates
app.get('/api/certificates', (req, res) => {
  res.json({ success: true, certificates: serverCertificates })
})

// Create a certificate
app.post('/api/certificates', (req, res) => {
  const cert = req.body
  if (!cert.title || !cert.courseUrl) {
    return res.status(400).json({ success: false, message: 'Title and courseUrl are required.' })
  }
  const newCert = {
    ...cert,
    id: cert.id || `cert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString()
  }
  serverCertificates.unshift(newCert)
  res.status(201).json({ success: true, certificate: newCert })
})

// Update a certificate
app.put('/api/certificates/:id', (req, res) => {
  const { id } = req.params
  const updates = req.body
  const idx = serverCertificates.findIndex(c => c.id === id)
  if (idx === -1) {
    // If not found, add it
    const created = { ...updates, id }
    serverCertificates.push(created)
    return res.json({ success: true, certificate: created })
  }
  serverCertificates[idx] = { ...serverCertificates[idx], ...updates, updatedAt: new Date().toISOString() }
  res.json({ success: true, certificate: serverCertificates[idx] })
})

// Delete a certificate
app.delete('/api/certificates/:id', (req, res) => {
  const { id } = req.params
  serverCertificates = serverCertificates.filter(c => c.id !== id)
  res.json({ success: true, message: 'Certificate deleted' })
})

// Bulk sync from client
app.post('/api/certificates/sync', (req, res) => {
  const { certificates } = req.body
  if (Array.isArray(certificates)) {
    serverCertificates = certificates
  }
  res.json({ success: true, count: serverCertificates.length })
})

// ============================================================================
// AI TUTOR BACKEND ENDPOINTS (SECURE SERVER-SIDE GROQ INTEGRATION)
// ============================================================================
const { generateTutorResponse } = require('./tutorService')

app.post('/api/ai/tutor/chat', async (req, res) => {
  try {
    const { messages, mode, subjectId, subjectName, topicTitle, retrievedContext } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid messages array is required.'
      })
    }

    const result = await generateTutorResponse({
      messages,
      mode: mode || 'explain_simply',
      subjectId: subjectId || '',
      subjectName: subjectName || '',
      topicTitle: topicTitle || '',
      retrievedContext: retrievedContext || ''
    })

    if (!result.success) {
      return res.status(result.errorType === 'MISSING_CREDENTIALS' ? 503 : 502).json(result)
    }

    res.json(result)
  } catch (err) {
    console.error('[SprintOS AI Tutor] Unhandled route error:', err)
    res.status(500).json({
      success: false,
      errorType: 'SERVER_ERROR',
      message: err.message || 'Internal server error processing tutor response.'
    })
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
