/**
 * SprintOS AI Service — Powered by Groq Ultra-Fast LPU Inference
 * Model: qwen/qwen3.8-27b (OpenAI-compatible chat completions)
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Calls Groq AI to generate a personalized executive briefing for daily/weekly academic performance.
 */
async function generateAiBriefing(academicData = {}) {
  const apiKey = process.env.GROQ_API_KEY
  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'

  const studentName = academicData.studentName || 'Ashutosh Rai'
  const date = academicData.date || new Date().toISOString().split('T')[0]
  const lectures = academicData.todayLectures || []
  const attendedCount = lectures.filter(l => l.status === 'attended').length
  const totalHeld = lectures.length
  const urgentTasks = academicData.urgentTasks || []
  const javaMastery = academicData.javaMasteryPercentage || 65

  // Fallback if no API key is provided
  if (!apiKey || apiKey.includes('your_groq_api_key')) {
    return {
      success: true,
      source: 'offline_fallback',
      summary: `Solid momentum today, ${studentName}! You attended ${attendedCount} of ${totalHeld} scheduled sessions. Continue consolidating graph algorithms and vector embeddings.`,
      strategicTakeaway: 'Connecting Kosaraju algorithm graph condensation with retrieval-augmented generation (RAG) chunk graph traversal unlocks deep mental models.',
      nextSteps: [
        'Review Kosaraju Tarjan low-link traversal invariants.',
        'Finalize pending assignments due this weekend.'
      ]
    }
  }

  const prompt = `
Student: ${studentName} (B.Tech CSE Semester 5, Elon Musk Cohort)
Date: ${date}
Sessions Held Today: ${totalHeld} (Attended: ${attendedCount})
Lectures Breakdown: ${JSON.stringify(lectures.map(l => ({ subject: l.subject, title: l.title, status: l.status })))}
Urgent Tasks/Assignments: ${JSON.stringify(urgentTasks.map(t => ({ title: t.title, deadline: t.deadline })))}
Java Recovery Mastery: ${javaMastery}%

Please provide a concise, elite academic briefing with:
1. Executive Summary (1-2 sentences on today's discipline and momentum)
2. Strategic Insight (1 sentence linking today's topics, e.g., graph algorithms with AI retrieval)
3. 2 Actionable Next Steps (clear focus for tonight's study session)

Respond in clean JSON format:
{
  "summary": "...",
  "strategicTakeaway": "...",
  "nextSteps": ["Step 1...", "Step 2..."]
}
`.trim()

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are SprintOS AI, an intelligent academic coach for B.Tech CSE students. Respond ONLY with valid JSON without markdown fences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 350
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.warn(`[Groq AI] API responded with ${response.status}: ${errText}`)
      throw new Error(`Groq API returned ${response.status}`)
    }

    const json = await response.json()
    const content = json.choices?.[0]?.message?.content?.trim() || ''

    // Parse JSON cleanly
    let parsed
    try {
      const cleanJson = content.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim()
      parsed = JSON.parse(cleanJson)
    } catch {
      parsed = {
        summary: content.slice(0, 200),
        strategicTakeaway: 'Continuous revision and topic synthesis drives high academic retention.',
        nextSteps: ['Complete today\'s review problems.', 'Verify assignment deadlines.']
      }
    }

    return {
      success: true,
      source: 'groq',
      model,
      summary: parsed.summary || 'Consistent daily study creates long-term mastery.',
      strategicTakeaway: parsed.strategicTakeaway || 'Synthesize algorithms with software engineering practices.',
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : ['Revise lecture notes.', 'Review weak areas.']
    }
  } catch (err) {
    console.error('[Groq AI] Error calling inference API:', err.message)
    return {
      success: false,
      source: 'error_fallback',
      error: err.message,
      summary: `Discipline maintained for ${date}. You attended ${attendedCount} of ${totalHeld} lectures.`,
      strategicTakeaway: 'Consolidate algorithm invariants and keep attendance above 75% across all subjects.',
      nextSteps: ['Revise Kosaraju algorithm proof.', 'Track project deadlines.']
    }
  }
}

module.exports = {
  generateAiBriefing
}
