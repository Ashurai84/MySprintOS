/**
 * SprintOS 2.1 - Client-side HTML Report Preview Renderer
 * Used for instant in-app previews of daily and weekly reports.
 */

export function generateClientDailyHtml(data: {
  date: string
  studentName: string
  cohort: string
  batch: string
  todayLectures: Array<{
    subject: string
    title: string
    status: string
    durationMinutes: number
    faculty?: string
  }>
  totalStudyMinutes: number
  attendanceSummary: Array<{
    subjectId: string
    subjectName: string
    percentage: number
    classesAttended: number
    totalClassesHeld: number
    isWarning: boolean
  }>
  pendingTasksCount: number
  urgentTasks: Array<{
    title: string
    priority: string
    deadline: string
  }>
  completedTasksCount: number
  javaMasteryPercentage: number
}): string {
  const lectureRows = data.todayLectures.length > 0
    ? data.todayLectures.map(l => `
        <tr style="border-bottom: 1px solid #1e293d;">
          <td style="padding: 10px; color: #60a5fa; font-weight: 600;">${l.subject}</td>
          <td style="padding: 10px; color: #ffffff;">${l.title}</td>
          <td style="padding: 10px; color: #94a3b8; font-family: monospace;">${l.durationMinutes}m</td>
          <td style="padding: 10px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; ${
              l.status === 'attended'
                ? 'background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);'
                : 'background: rgba(244, 63, 94, 0.2); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.4);'
            }">
              ${l.status}
            </span>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="4" style="padding: 16px; text-align: center; color: #94a3b8; font-style: italic;">No university lectures scheduled or logged today.</td></tr>`

  const warningAttendance = data.attendanceSummary.filter(s => s.isWarning)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SprintOS Daily Briefing — ${data.date}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293d; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="padding: 24px; background-color: #111c33; border-bottom: 1px solid #1e293d;">
      <div style="font-size: 11px; font-family: monospace; color: #60a5fa; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
        SprintOS 2.1 Daily Dispatch • 18:00 IST
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff;">
        Academic Daily Report: ${data.date}
      </h1>
      <div style="margin-top: 6px; font-size: 12px; color: #94a3b8;">
        Student: <strong style="color: #ffffff;">${data.studentName}</strong> • Cohort: ${data.cohort} • Batch: ${data.batch}
      </div>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      
      <!-- Metric Highlights -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
          <td width="32%" style="background-color: #162035; border: 1px solid #23314e; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Today's Classes</div>
            <div style="font-size: 22px; font-weight: bold; color: #38bdf8; margin-top: 4px;">${data.todayLectures.length}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${Math.round(data.totalStudyMinutes / 60 * 10) / 10} hrs logged</div>
          </td>
          <td width="2%"></td>
          <td width="32%" style="background-color: #162035; border: 1px solid #23314e; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Pending Tasks</div>
            <div style="font-size: 22px; font-weight: bold; color: #fbbf24; margin-top: 4px;">${data.pendingTasksCount}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${data.completedTasksCount} done today</div>
          </td>
          <td width="2%"></td>
          <td width="32%" style="background-color: #162035; border: 1px solid #23314e; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Java Recovery</div>
            <div style="font-size: 22px; font-weight: bold; color: #a78bfa; margin-top: 4px;">${data.javaMasteryPercentage}%</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Curriculum Mastery</div>
          </td>
        </tr>
      </table>

      ${warningAttendance.length > 0 ? `
        <!-- Attendance Warning Alert -->
        <div style="background-color: rgba(225, 29, 72, 0.15); border: 1px solid rgba(225, 29, 72, 0.4); border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
          <div style="color: #fb7185; font-size: 12px; font-weight: bold; display: flex; align-items: center; margin-bottom: 4px;">
            ⚠️ ATTENDANCE WARNING (< 75% THRESHOLD)
          </div>
          <div style="font-size: 12px; color: #fecdd3;">
            You are falling behind university attendance requirements in:
            <ul style="margin: 6px 0 0 0; padding-left: 20px;">
              ${warningAttendance.map(w => `
                <li><strong>${w.subjectName}</strong>: ${w.percentage.toFixed(1)}% (${w.classesAttended}/${w.totalClassesHeld} sessions)</li>
              `).join('')}
            </ul>
          </div>
        </div>
      ` : ''}

      <!-- Today's Lectures -->
      <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #ffffff; margin: 0 0 10px 0;">
        Today's University Lectures
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111827; border: 1px solid #1e293d; border-radius: 8px; font-size: 12px; margin-bottom: 24px; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #162035; text-align: left; color: #94a3b8; font-size: 10px; text-transform: uppercase;">
            <th style="padding: 8px 10px;">Subject</th>
            <th style="padding: 8px 10px;">Topic / Title</th>
            <th style="padding: 8px 10px;">Duration</th>
            <th style="padding: 8px 10px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${lectureRows}
        </tbody>
      </table>

      <!-- Next Actions -->
      <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #ffffff; margin: 0 0 10px 0;">
        High-Priority Deadlines
      </h2>
      ${data.urgentTasks.length > 0 ? `
        <div style="background-color: #111827; border: 1px solid #1e293d; border-radius: 8px; padding: 12px; margin-bottom: 24px;">
          ${data.urgentTasks.map(t => `
            <div style="padding: 6px 0; border-bottom: 1px solid #1e293d; font-size: 12px; display: flex; justify-content: space-between;">
              <span style="color: #ffffff;">• ${t.title}</span>
              <span style="color: #fb7185; font-family: monospace; font-size: 11px;">Due: ${t.deadline}</span>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="background-color: #111827; border: 1px solid #1e293d; border-radius: 8px; padding: 12px; color: #94a3b8; font-size: 12px; margin-bottom: 24px;">
          No critical pending deadlines due today.
        </div>
      `}

    </div>

    <!-- Footer -->
    <div style="padding: 16px 24px; background-color: #111c33; border-top: 1px solid #1e293d; text-align: center; font-size: 11px; color: #64748b;">
      SprintOS 2.1 Personal Academic Command Center • Dispatched automatically via cron at 18:00 Asia/Kolkata
    </div>

  </div>
</body>
</html>
`
}

export function generateClientWeeklyHtml(data: {
  weekRange: string
  studentName: string
  cohort: string
  batch: string
  totalClassesHeld: number
  totalClassesAttended: number
  weeklyAttendancePercentage: number
  studyHoursLogged: number
  subjectBreakdown: Array<{
    subjectName: string
    attended: number
    held: number
    percentage: number
    isWarning: boolean
  }>
  completedTasksCount: number
  pendingTasksCount: number
  javaRecoveryTopicsUnderstood: number
  javaRecoveryTotalTopics: number
  activeCoursesCount: number
}): string {
  const subjectRows = data.subjectBreakdown.map(s => `
    <tr style="border-bottom: 1px solid #1e293d;">
      <td style="padding: 10px; color: #ffffff; font-weight: 600;">${s.subjectName}</td>
      <td style="padding: 10px; color: #94a3b8; font-family: monospace; text-align: center;">${s.attended} / ${s.held}</td>
      <td style="padding: 10px; text-align: right; font-family: monospace; font-weight: bold; ${s.isWarning ? 'color: #fb7185;' : 'color: #34d399;'}">
        ${s.percentage.toFixed(1)}%
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SprintOS Weekly Executive Briefing — ${data.weekRange}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293d; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="padding: 24px; background-color: #111c33; border-bottom: 1px solid #1e293d;">
      <div style="font-size: 11px; font-family: monospace; color: #818cf8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
        SprintOS 2.1 Sunday Executive Audit • 18:00 IST
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff;">
        Weekly Academic Briefing
      </h1>
      <div style="margin-top: 6px; font-size: 12px; color: #94a3b8;">
        Week of ${data.weekRange} • Student: <strong style="color: #ffffff;">${data.studentName}</strong> (${data.cohort})
      </div>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      
      <!-- Metric Highlights -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
          <td width="32%" style="background-color: #162035; border: 1px solid #23314e; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Attendance Rate</div>
            <div style="font-size: 22px; font-weight: bold; color: ${data.weeklyAttendancePercentage >= 75 ? '#34d399' : '#fb7185'}; margin-top: 4px;">
              ${data.weeklyAttendancePercentage.toFixed(1)}%
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${data.totalClassesAttended} / ${data.totalClassesHeld} sessions</div>
          </td>
          <td width="2%"></td>
          <td width="32%" style="background-color: #162035; border: 1px solid #23314e; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Study Hours</div>
            <div style="font-size: 22px; font-weight: bold; color: #38bdf8; margin-top: 4px;">${data.studyHoursLogged}h</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Logged lecture time</div>
          </td>
          <td width="2%"></td>
          <td width="32%" style="background-color: #162035; border: 1px solid #23314e; border-radius: 8px; padding: 12px; text-align: center;">
            <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Java Mastery</div>
            <div style="font-size: 22px; font-weight: bold; color: #a78bfa; margin-top: 4px;">
              ${Math.round((data.javaRecoveryTopicsUnderstood / Math.max(1, data.javaRecoveryTotalTopics)) * 100)}%
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${data.javaRecoveryTopicsUnderstood}/${data.javaRecoveryTotalTopics} topics</div>
          </td>
        </tr>
      </table>

      <!-- Subject Breakdown -->
      <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #ffffff; margin: 0 0 10px 0;">
        Semester 5 Subject Attendance Health
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111827; border: 1px solid #1e293d; border-radius: 8px; font-size: 12px; margin-bottom: 24px; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #162035; text-align: left; color: #94a3b8; font-size: 10px; text-transform: uppercase;">
            <th style="padding: 8px 10px;">Subject</th>
            <th style="padding: 8px 10px; text-align: center;">Attended / Held</th>
            <th style="padding: 8px 10px; text-align: right;">Cumulative %</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
        </tbody>
      </table>

      <!-- Progress Summary -->
      <div style="background-color: #162035; border: 1px solid #23314e; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
        <div style="font-size: 12px; color: #ffffff; font-weight: 600; margin-bottom: 6px;">Sprint Objectives & Momentum:</div>
        <div style="font-size: 12px; color: #94a3b8; line-height: 1.6;">
          • Completed <strong style="color: #ffffff;">${data.completedTasksCount}</strong> assignments and milestones; <strong style="color: #ffffff;">${data.pendingTasksCount}</strong> remain in pipeline.<br>
          • Tracking <strong style="color: #ffffff;">${data.activeCoursesCount}</strong> active professional certification tracks (Coursera GenAI, DSA Specialization, STQA).<br>
          • Java fundamentals recovery is currently at <strong style="color: #ffffff;">${data.javaRecoveryTopicsUnderstood}/${data.javaRecoveryTotalTopics}</strong> topics with full conceptual clarity.
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div style="padding: 16px 24px; background-color: #111c33; border-top: 1px solid #1e293d; text-align: center; font-size: 11px; color: #64748b;">
      SprintOS 2.1 Academic Command Center • Sunday 18:00 IST scheduled digest
    </div>

  </div>
</body>
</html>
`
}
