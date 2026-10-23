/**
 * SprintOS 2.1 Email Report HTML Generators
 * Formats daily concise reports and Sunday weekly analytics summaries.
 */

function generateDailyReportHtml(data) {
  const {
    date,
    studentName = 'Ashutosh Rai',
    cohort = 'Elon Musk',
    batch = '2024–28',
    todayLectures = [],
    totalStudyMinutes = 0,
    attendanceSummary = [],
    pendingTasksCount = 0,
    urgentTasks = [],
    completedTasksCount = 0,
    javaMasteryPercentage = 0
  } = data

  const lectureRows = todayLectures.length > 0
    ? todayLectures.map(l => `
        <tr style="border-bottom: 1px solid #23314e;">
          <td style="padding: 10px; color: #93c5fd; font-weight: bold;">${l.subject}</td>
          <td style="padding: 10px; color: #ffffff;">${l.title}</td>
          <td style="padding: 10px; color: #94a3b8; font-family: monospace;">${l.durationMinutes}m</td>
          <td style="padding: 10px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; ${
              l.status === 'attended'
                ? 'background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);'
                : 'background: rgba(244, 63, 94, 0.2); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.4);'
            }">
              ${l.status}
            </span>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="4" style="padding: 15px; text-align: center; color: #94a3b8; font-style: italic;">No university lectures scheduled or logged today.</td></tr>`

  const warningAttendance = attendanceSummary.filter(s => s.isWarning)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SprintOS Daily Briefing — ${date}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293d; border-radius: 12px; overflow: hidden;">
    
    <!-- Header -->
    <div style="padding: 24px; background-color: #111c33; border-bottom: 1px solid #1e293d;">
      <div style="font-size: 12px; font-family: monospace; color: #60a5fa; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
        SprintOS 2.1 Daily Dispatch • 18:00 IST
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff;">
        Academic Daily Report: ${date}
      </h1>
      <div style="margin-top: 6px; font-size: 12px; color: #94a3b8;">
        Student: <strong style="color: #ffffff;">${studentName}</strong> | Cohort: ${cohort} (${batch})
      </div>
    </div>

    <!-- Quick KPIs -->
    <div style="display: table; width: 100%; border-bottom: 1px solid #1e293d; background-color: #090e1a;">
      <div style="display: table-cell; width: 33%; padding: 16px; text-align: center; border-right: 1px solid #1e293d;">
        <span style="font-size: 11px; color: #94a3b8; display: block; text-transform: uppercase;">Study Logged</span>
        <span style="font-size: 18px; font-weight: bold; color: #38bdf8; font-family: monospace;">${Math.round(totalStudyMinutes / 60 * 10) / 10} hrs</span>
      </div>
      <div style="display: table-cell; width: 33%; padding: 16px; text-align: center; border-right: 1px solid #1e293d;">
        <span style="font-size: 11px; color: #94a3b8; display: block; text-transform: uppercase;">Pending Tasks</span>
        <span style="font-size: 18px; font-weight: bold; color: #f59e0b; font-family: monospace;">${pendingTasksCount}</span>
      </div>
      <div style="display: table-cell; width: 33%; padding: 16px; text-align: center;">
        <span style="font-size: 11px; color: #94a3b8; display: block; text-transform: uppercase;">Java Mastery</span>
        <span style="font-size: 18px; font-weight: bold; color: #10b981; font-family: monospace;">${javaMasteryPercentage}%</span>
      </div>
    </div>

    <!-- Attendance Warning Alert if any -->
    ${warningAttendance.length > 0 ? `
    <div style="margin: 16px; padding: 12px; background-color: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 8px;">
      <span style="color: #f43f5e; font-weight: bold; font-size: 12px;">⚠️ Attendance Warning:</span>
      <span style="font-size: 12px; color: #fca5a5;">
        ${warningAttendance.map(s => `${s.subjectId} (${s.percentage}%)`).join(', ')} is below the 75% university requirement.
      </span>
    </div>
    ` : ''}

    <!-- Groq AI Executive Academic Briefing -->
    ${data.aiBriefing ? `
    <div style="margin: 16px 20px; padding: 16px; background: linear-gradient(135deg, #131c31 0%, #171c2e 100%); border: 1px solid #3b4d75; border-radius: 8px;">
      <div style="margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: bold; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; font-family: monospace;">⚡ Groq LPU AI Executive Synthesis</span>
      </div>
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #e2e8f0; line-height: 1.5;">
        ${data.aiBriefing.summary}
      </p>
      <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 10px; border-left: 3px solid #38bdf8; padding-left: 10px; background-color: rgba(56, 189, 248, 0.05); padding: 8px 10px; border-radius: 4px;">
        <strong style="color: #38bdf8;">Strategic Insight:</strong> ${data.aiBriefing.strategicTakeaway}
      </div>
      ${Array.isArray(data.aiBriefing.nextSteps) ? `
        <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Tonight's Action Focus:</div>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
          ${data.aiBriefing.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
    ` : ''}

    <!-- Today's Lecture Sessions -->
    <div style="padding: 20px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
        Today's Lecture Sessions (${todayLectures.length})
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #162035; color: #94a3b8; text-align: left; font-size: 11px;">
            <th style="padding: 8px 10px;">Subject</th>
            <th style="padding: 8px 10px;">Topic</th>
            <th style="padding: 8px 10px;">Duration</th>
            <th style="padding: 8px 10px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${lectureRows}
        </tbody>
      </table>
    </div>

    <!-- Urgent Action Items -->
    ${urgentTasks.length > 0 ? `
    <div style="padding: 0 20px 20px 20px;">
      <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #f59e0b;">
        Urgent Academic Assignments
      </h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #e2e8f0; line-height: 1.6;">
        ${urgentTasks.map(t => `<li><strong>${t.title}</strong> — Due: ${t.deadline}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="padding: 16px 20px; background-color: #0b0f19; border-top: 1px solid #1e293d; font-size: 11px; color: #64748b; text-align: center;">
      SprintOS Semester 5 Academic Command Center • Scheduled delivery at 18:00 Asia/Kolkata
    </div>
  </div>
</body>
</html>
  `
}

function generateWeeklyReportHtml(data) {
  const {
    generatedAt = new Date().toISOString(),
    studentName = 'Ashutosh Rai',
    cohort = 'Elon Musk',
    batch = '2024–28',
    attendanceStats = [],
    weeklyLecturesCount = 0,
    weeklyAttendedCount = 0,
    weeklyStudyHours = 0,
    tasksOverview = { total: 0, completed: 0, pending: 0 },
    javaProgress = { totalTopics: 14, understood: 0, learning: 0, needsRevision: 0 },
    coursesProgress = []
  } = data

  const attendanceRows = attendanceStats.map(s => `
    <tr style="border-bottom: 1px solid #1e293d;">
      <td style="padding: 8px 10px; color: #ffffff; font-weight: bold;">${s.subjectId}</td>
      <td style="padding: 8px 10px; color: #94a3b8; font-family: monospace;">${s.attended} / ${s.totalHeld}</td>
      <td style="padding: 8px 10px; font-family: monospace; font-weight: bold; color: ${s.isWarning ? '#f43f5e' : '#34d399'};">
        ${s.percentage !== null ? `${s.percentage}%` : 'Not Held Yet'}
      </td>
      <td style="padding: 8px 10px; color: #94a3b8; font-size: 11px;">
        ${s.isWarning ? `<span style="color: #fca5a5;">Need +${s.consecutiveNeededToReachTarget} sessions</span>` : '<span style="color: #6ee7b7;">Safe (≥ 75%)</span>'}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SprintOS Weekly Executive Digest</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0;">
  <div style="max-width: 640px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293d; border-radius: 12px; overflow: hidden;">
    
    <!-- Header -->
    <div style="padding: 24px; background-color: #111c33; border-bottom: 1px solid #1e293d;">
      <div style="font-size: 12px; font-family: monospace; color: #a78bfa; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
        SprintOS 2.1 Sunday Executive Summary
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff;">
        Weekly Academic Performance Report
      </h1>
      <div style="margin-top: 6px; font-size: 12px; color: #94a3b8;">
        Student: <strong style="color: #ffffff;">${studentName}</strong> | Cohort: ${cohort} (${batch})
      </div>
    </div>

    <!-- Weekly Summary KPI Grid -->
    <div style="display: table; width: 100%; border-bottom: 1px solid #1e293d; background-color: #090e1a;">
      <div style="display: table-cell; width: 25%; padding: 14px 10px; text-align: center; border-right: 1px solid #1e293d;">
        <span style="font-size: 10px; color: #94a3b8; display: block; text-transform: uppercase;">Weekly Study</span>
        <span style="font-size: 16px; font-weight: bold; color: #38bdf8; font-family: monospace;">${weeklyStudyHours}h</span>
      </div>
      <div style="display: table-cell; width: 25%; padding: 14px 10px; text-align: center; border-right: 1px solid #1e293d;">
        <span style="font-size: 10px; color: #94a3b8; display: block; text-transform: uppercase;">Classes Attended</span>
        <span style="font-size: 16px; font-weight: bold; color: #34d399; font-family: monospace;">${weeklyAttendedCount} / ${weeklyLecturesCount}</span>
      </div>
      <div style="display: table-cell; width: 25%; padding: 14px 10px; text-align: center; border-right: 1px solid #1e293d;">
        <span style="font-size: 10px; color: #94a3b8; display: block; text-transform: uppercase;">Tasks Completed</span>
        <span style="font-size: 16px; font-weight: bold; color: #f59e0b; font-family: monospace;">${tasksOverview.completed}</span>
      </div>
      <div style="display: table-cell; width: 25%; padding: 14px 10px; text-align: center;">
        <span style="font-size: 10px; color: #94a3b8; display: block; text-transform: uppercase;">Java Mastery</span>
        <span style="font-size: 16px; font-weight: bold; color: #a78bfa; font-family: monospace;">${javaProgress.understood} / 14</span>
      </div>
    </div>

    <!-- Subject Attendance Matrix -->
    <div style="padding: 20px;">
      <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
        Subject Attendance Status (6 Scope Subjects)
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #162035; color: #94a3b8; text-align: left; font-size: 11px;">
            <th style="padding: 8px 10px;">Subject Code</th>
            <th style="padding: 8px 10px;">Attended / Held</th>
            <th style="padding: 8px 10px;">Percentage</th>
            <th style="padding: 8px 10px;">Threshold Status</th>
          </tr>
        </thead>
        <tbody>
          ${attendanceRows}
        </tbody>
      </table>
    </div>

    <!-- Certification & Specialization Progress -->
    ${coursesProgress.length > 0 ? `
    <div style="padding: 0 20px 20px 20px;">
      <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #60a5fa;">
        Curriculum Specializations Track
      </h3>
      <div style="background-color: #0b0f19; border: 1px solid #1e293d; border-radius: 8px; padding: 12px; font-size: 12px;">
        ${coursesProgress.map(c => `
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #ffffff; font-weight: bold;">${c.title}</span>
              <span style="color: #94a3b8; font-family: monospace;">${c.progressPercentage}%</span>
            </div>
            <div style="font-size: 11px; color: #64748b;">
              Status: ${c.status} | Certificate: ${c.certificateEarned ? '✓ Earned & Verified' : 'In Progress (Unverified)'}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="padding: 16px 20px; background-color: #0b0f19; border-top: 1px solid #1e293d; font-size: 11px; color: #64748b; text-align: center;">
      SprintOS Automated Weekly Cloud Report • Evaluated Sunday 18:00 Asia/Kolkata
    </div>
  </div>
</body>
</html>
  `
}

module.exports = {
  generateDailyReportHtml,
  generateWeeklyReportHtml
}
