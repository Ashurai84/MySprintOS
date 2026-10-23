const cron = require('node-cron')
const nodemailer = require('nodemailer')
const { generateDailyReportHtml, generateWeeklyReportHtml } = require('./reportGenerator')

// In-memory state and logs (can be backed by DB)
let emailSettings = {
  enabled: true,
  dailyReportEnabled: true,
  weeklyReportEnabled: true,
  dailyReportTime: '18:00',
  weeklyReportDay: 'Sunday',
  weeklyReportTime: '18:00',
  recipientEmail: 'ashutosh.rai@university.edu',
  timezone: 'Asia/Kolkata'
}

let deliveryLogs = []
let lastDailySentDate = null
let lastWeeklySentWeek = null

// Transporter configuration: uses env or fallback ethereal/test account
function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    })
  }

  // Fallback simulator transporter if SMTP is not configured yet
  return {
    sendMail: async (mailOptions) => {
      console.log(`[SIMULATED EMAIL DELIVERY] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`)
      return {
        messageId: `simulated-${Date.now()}@sprintos.local`,
        response: '250 Simulated message accepted for delivery'
      }
    }
  }
}

async function sendEmailWithRetry(mailOptions, maxRetries = 2) {
  let attempt = 0
  let lastError = null

  while (attempt <= maxRetries) {
    try {
      const transporter = createTransporter()
      const info = await transporter.sendMail(mailOptions)

      const log = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        reportType: mailOptions.subject.includes('Weekly') ? 'weekly' : 'daily',
        recipient: mailOptions.to,
        status: 'success',
        messageId: info.messageId,
        attempt: attempt + 1
      }
      deliveryLogs.unshift(log)
      if (deliveryLogs.length > 50) deliveryLogs.pop()

      return { success: true, log }
    } catch (err) {
      lastError = err
      attempt++
      if (attempt <= maxRetries) {
        // Wait 1.5s before retry
        await new Promise(r => setTimeout(r, 1500))
      }
    }
  }

  // Sanitized failure log
  const failLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    reportType: mailOptions.subject.includes('Weekly') ? 'weekly' : 'daily',
    recipient: mailOptions.to,
    status: 'failed',
    error: lastError ? lastError.message.replace(/:[^:@]+@/, ':***@') : 'Unknown delivery error',
    attempt
  }
  deliveryLogs.unshift(failLog)
  if (deliveryLogs.length > 50) deliveryLogs.pop()

  return { success: false, log: failLog, error: failLog.error }
}

// Scheduled Cron Job: Runs at 18:00 Asia/Kolkata every day
function initScheduler(getDataCallback) {
  console.log('[SprintOS Scheduler] Initializing cron at 18:00 Asia/Kolkata...')

  // Daily Cron: 18:00 IST (minute 0, hour 18)
  cron.schedule('0 18 * * *', async () => {
    if (!emailSettings.enabled) return
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const dayOfWeek = now.getDay() // 0 = Sunday

    // Sunday = Weekly summary
    if (dayOfWeek === 0 && emailSettings.weeklyReportEnabled) {
      const weekNumber = Math.ceil(now.getDate() / 7)
      const weekKey = `${now.getFullYear()}-W${now.getMonth() + 1}-${weekNumber}`

      // Prevent duplicate
      if (lastWeeklySentWeek === weekKey) {
        console.log(`[SprintOS Scheduler] Weekly report already delivered for ${weekKey}. Skipping.`)
        return
      }

      const data = getDataCallback ? getDataCallback('weekly') : { type: 'weekly' }
      const html = generateWeeklyReportHtml(data)
      const res = await sendEmailWithRetry({
        from: process.env.SMTP_FROM || 'SprintOS Command Center <reports@sprintos.local>',
        to: emailSettings.recipientEmail,
        subject: `SprintOS Weekly Executive Briefing — ${todayStr}`,
        html
      })

      if (res.success) {
        lastWeeklySentWeek = weekKey
      }
      return
    }

    // Monday–Saturday = Daily concise report
    if (emailSettings.dailyReportEnabled) {
      // Prevent duplicate
      if (lastDailySentDate === todayStr) {
        console.log(`[SprintOS Scheduler] Daily report already delivered for ${todayStr}. Skipping.`)
        return
      }

      const data = getDataCallback ? getDataCallback('daily') : { type: 'daily', date: todayStr }
      const html = generateDailyReportHtml(data)
      const res = await sendEmailWithRetry({
        from: process.env.SMTP_FROM || 'SprintOS Command Center <reports@sprintos.local>',
        to: emailSettings.recipientEmail,
        subject: `SprintOS Daily Report — ${todayStr}`,
        html
      })

      if (res.success) {
        lastDailySentDate = todayStr
      }
    }
  }, {
    timezone: 'Asia/Kolkata'
  })
}

module.exports = {
  emailSettings,
  deliveryLogs,
  createTransporter,
  sendEmailWithRetry,
  initScheduler,
  updateSchedulerSettings: (newSettings) => {
    emailSettings = { ...emailSettings, ...newSettings }
  }
}
