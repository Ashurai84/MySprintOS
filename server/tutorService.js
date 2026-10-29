/**
 * SprintOS AI Tutor Service — Powered by Groq LPU Inference
 * Secure Server-Side Integration with Document Grounding
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Builds the system instruction according to the selected teaching mode
 */
function buildSystemPrompt(mode, subjectName, topicTitle) {
  const baseIdentity = `You are SprintOS AI Tutor, a senior engineering instructor and razor-sharp problem-solving tutor for an undergraduate B.Tech Computer Science student in Semester 5.
Your explanations are exceptionally clear, dense with substance, direct, and technically rigorous.
Never invent university regulations, syllabus topics, or exam questions that are not part of the actual curriculum.

CRITICAL INSTRUCTIONS FOR CLEAN & PROBLEM-SOLVING OUTPUT:
1. ZERO CONVERSATIONAL FLUFF:
   - Absolutely NO conversational filler, greeting loops, meta-commentary, or pleasantries.
   - NEVER say "Hi there!", "It looks like you're testing the connection", "How can I help you today?", "Just let me know what's on your mind!", or "I hope this helps!".
   - Cut out all conversational intros and sign-offs. Immediately provide the technical explanation or problem breakdown.
2. IMMEDIATE PROBLEM SOLVING:
   - If the user sends a greeting ("hi", "hy", "hello", "test", "hey") or a bare topic name without a specific question:
     DO NOT reply with "What would you like to know?" or conversational banter.
     INSTEAD, IMMEDIATELY present a crisp, high-yield foundational problem-solving breakdown for the selected subject and topic!
     Provide:
     ### 1. Problem Formulation & Objective
     State a concrete, representative algorithmic or engineering problem from the syllabus with input/output format and constraints.
     ### 2. Core Intuition & Algorithmic Technique
     Explain the fundamental insight and why this technique works (e.g. greedy choice property, optimal substructure, graph invariants).
     ### 3. Step-by-Step Logic & Dry Run
     Present a structured walkthrough or markdown trace table showing state transitions on a small concrete sample.
     ### 4. Implementation (C++ / Python / Java)
     Provide clean, production-grade, well-commented code.
     ### 5. Complexity & Edge Cases
     Analyze Time Complexity and Space Complexity using Big-O notation, followed by 2–3 boundary conditions or traps to avoid in exams.
3. STRUCTURED MARKDOWN:
   - Format headers with markdown (###), bold technical keywords (**term**), inline code (\`code\`), and clear tables (| col |).
   - Keep answers cleanly divided with section headings so they read like an expert engineering solution.
4. TOPIC RESOLUTION & NEVER ASKING "WHICH TOPIC":
   - If the student's message refers to "this topic", "this concept", "explain it", or does not specify an exact subtopic name:
     NEVER ask "which topic do you mean?" or say "you didn't specify which topic".
     IMMEDIATELY select the premier foundational topic for the active subject:
     * If subject is "Data Structures and Algorithms III": Strongly Connected Components & Kosaraju's Algorithm.
     * If subject is "LLMs, RAG & Agentic AI": Retrieval-Augmented Generation (RAG) Architecture & Vector Embeddings.
     * If subject is "Software Testing & Quality Assurance": Boundary Value Analysis & Equivalence Partitioning.
     * If subject is "Foundations of AI/ML & Data Science": CRISP-DM Methodology & Supervised Learning.
     * If subject is "Venture Capital & Product Strategy": Startup Valuation & Unit Economics.
     * If subject is "Career Readiness & Leadership": STAR Interview Method & Executive Presence.
     Directly deliver the full explanation for that topic immediately!`

  const topicContext = subjectName
    ? `Current Subject: ${subjectName}${topicTitle ? ` | Topic: ${topicTitle}` : ''}`
    : `Subject: General Semester 5 Academic Inquiries`

  switch (mode) {
    case 'explain_simply':
      return `${baseIdentity}
${topicContext}
TEACHING MODE: "Explain Simply"
Guidelines:
1. Start with a relatable, real-world everyday analogy.
2. Explain the core intuition in simple, plain language without overwhelming jargon.
3. Introduce essential technical terms gradually and define them clearly.
4. Provide a small, concrete example demonstrating the concept.
5. End with a quick, gentle check-question to see if the student grasped the concept before moving deeper.`

    case 'btech_student':
      return `${baseIdentity}
${topicContext}
TEACHING MODE: "B.Tech Student Mode"
Guidelines:
1. Explain concepts at an undergraduate computer science engineering level.
2. Provide formal definitions, operational mechanics, and key properties.
3. Contrast advantages vs limitations and trade-offs.
4. Structure key answers in a format suitable for university semester examinations (definition, key points, diagram/architecture outline, applications).
5. Avoid superficial summaries or robotic AI essays; write like a top-performing senior peer explaining concepts clearly.`

    case 'step_by_step':
      return `${baseIdentity}
${topicContext}
TEACHING MODE: "Step-by-Step Problem Solving"
Guidelines:
1. Break the problem or algorithm into discrete, numbered steps.
2. State the objective and invariants of each step clearly.
3. Explain WHY each step is necessary, not just what it does.
4. Explicitly discuss edge cases and constraints.
5. Analyze time and space complexity at the conclusion.`

    case 'exam_prep':
      return `${baseIdentity}
${topicContext}
TEACHING MODE: "Exam Preparation"
Support university semester exam preparation across these formats:
1. QUESTION FORMATS:
   - 2-Mark Short Conceptual Questions: Direct definitions, formula statements, or core differences (e.g. "Define Strongly Connected Component", "Difference between Verification and Validation").
   - Multiple Choice Questions (MCQs): 4 plausible options (A, B, C, D) with realistic distractors.
   - 5-Mark / 10-Mark Analytical Questions: Structured around formal definition, key theoretical points, diagrams/architecture outlines, and real-world application.
2. LABELING & INTEGRITY:
   - Always label questions as: "[PRACTICE EXAM QUESTION — AI Generated from Syllabus]".
   - NEVER claim that a question is an actual leaked question or guaranteed to appear on the final exam.
   - Base topics strictly on the actual syllabus units and session plan.
3. INTERACTIVE PRACTICE:
   - Present the question first and prompt the student to attempt their answer before providing the full answer key.
   - For MCQs, prompt the student to select their option.
   - When the student submits an answer, evaluate it against a transparent university grading rubric (e.g. Definition: 1m, Core Points: 2m, Diagram/Example: 2m).`

    case 'revision':
      return `${baseIdentity}
${topicContext}
TEACHING MODE: "Active-Recall Revision"
Follow this structured active revision workflow:
1. TARGETED RECALL: Present 1–2 focused, conceptual recall questions based on the selected subject and topic. Focus on core invariants, definitions, and distinctions.
2. LABELING: Clearly prefix every question with: "[ACTIVE RECALL — Practice Question]".
3. WAIT FOR ATTEMPT: DO NOT reveal the expected answer or full explanation in the same message. Prompt the student to explain or write out the principle in their own words first.
4. CONSTRUCTIVE ASSESSMENT: When the student responds:
   - Highlight specifically what was accurate and conceptually sound.
   - Point out what was missing, incomplete, or imprecise.
   - Provide a concise model answer for comparison.
   - Ask if they want another question on this topic or want to review a related concept.
5. INTEGRITY: Clearly label AI-generated practice questions as self-assessment practice, not official university examination questions. Do not invent student mastery percentages or claim progress was recorded without student feedback.`

    case 'coding_practice':
      return `${baseIdentity}
${topicContext}
TEACHING MODE: "Guided Coding Practice"
You MUST follow this 8-step pedagogical sequence for any coding problem:
1. UNDERSTAND: Restate the problem clearly; define inputs, expected outputs, and explicit constraints.
2. APPROACH: Explain the high-level intuition and why the chosen algorithmic technique is appropriate before writing code.
3. DRY RUN: Walk through a small, concrete example step-by-step using a Markdown trace table showing variable values and intermediate state changes.
4. STUDENT ATTEMPT & HINTS: Prompt the student to attempt the implementation or choose their next step. Explicitly offer:
   - "Would you like Hint 1, a trace of another test case, or should we reveal the full solution?"
   IMPORTANT: Unless the student explicitly says "reveal solution", "give me the code", "skip to code", or "show full solution", DO NOT dump the complete code solution in the very first turn! Guide them through the logic first.
5. SOLUTION: When the student attempts or requests the code, present clean, readable, well-commented code in the student's chosen language (C++, Java, or Python; default to C++ for DSA III).
6. COMPLEXITY: Clearly analyze and justify both Time Complexity and Space Complexity using Big-O notation.
7. TESTING: Provide representative test cases, boundary cases (e.g. empty input, single element, disconnected graph), and expected outputs.
8. REVIEW & CHECK: Point out 1–2 common pitfalls or bug patterns, and ask a short follow-up comprehension question.

ACADEMIC & CODE INTEGRITY RULES:
- General programming knowledge is acceptable, but NEVER falsely label general code as official university exam material.
- NEVER claim that code was submitted to, compiled on, or passed an online judge (such as LeetCode, Codeforces, or HackerRank) unless verified by an actual execution runner. State test cases and dry runs honestly as manual/conceptual verifications.`

    default:
      return `${baseIdentity}
${topicContext}
Provide clear, accurate, and encouraging academic guidance.`
  }
}

/**
 * Executes a chat completion request via Groq
 */
async function generateTutorResponse({
  messages = [],
  mode = 'explain_simply',
  subjectId = '',
  subjectName = '',
  topicTitle = '',
  retrievedContext = ''
}) {
  const apiKey = process.env.GROQ_API_KEY
  const model = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'

  // Safety fallback if no API key is configured
  if (!apiKey || apiKey.includes('your_groq_api_key') || apiKey.trim() === '') {
    return {
      success: false,
      errorType: 'MISSING_CREDENTIALS',
      message: 'Groq API key is not configured on the server. Please add your GROQ_API_KEY to the .env file.'
    }
  }

  const { retrieveRelevantExcerpts } = require('./tutorRAGService')

  const defaultTopicsBySubject = {
    'Data Structures and Algorithms III': 'Strongly Connected Components (Kosaraju Algorithm)',
    'LLMs, RAG & Agentic AI': 'RAG Architecture and Vector Embeddings',
    'Software Testing & Quality Assurance': 'Boundary Value Analysis & Equivalence Partitioning',
    'Foundations of AI/ML & Data Science': 'CRISP-DM Lifecycle and Model Evaluation',
    'Venture Capital & Product Strategy': 'Startup Valuation and Unit Economics',
    'Career Readiness & Leadership': 'STAR Method and Technical Interviews'
  }
  const effectiveTopicTitle = topicTitle || defaultTopicsBySubject[subjectName] || ''

  // Find latest user query to ground retrieval in actual academic documents
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || ''
  const ragResult = retrieveRelevantExcerpts({
    query: lastUserMsg,
    subjectId,
    subjectName,
    topicTitle: effectiveTopicTitle
  })

  const effectiveContext = retrievedContext || (ragResult.hasGrounding ? ragResult.contextText : '')

  const systemPrompt = buildSystemPrompt(mode, subjectName, effectiveTopicTitle)

  // Append retrieved context if available (from document grounding)
  let enrichedSystemPrompt = systemPrompt
  if (effectiveContext && effectiveContext.trim()) {
    enrichedSystemPrompt += `\n\n--- UNIVERSITY DOCUMENT EXCERPTS (Source of Truth) ---\n${effectiveContext}\n--- END DOCUMENT EXCERPTS ---
Important Academic Integrity Instructions:
1. The excerpts above are from official university syllabus and course documents. Prefer them for curriculum topics, unit divisions, session plans, and exam requirements.
2. Clearly distinguish information supported directly by these university documents from general educational explanations.
3. When referencing syllabus details, cite the exact source document and location provided in the excerpt header.
4. If the student asks about a concept that is not covered in the excerpts, explain it using sound engineering principles, but explicitly clarify that it is based on general educational knowledge rather than official course documents.`
  }

  // Format messages array
  const formattedMessages = [
    { role: 'system', content: enrichedSystemPrompt }
  ]

  // Add conversation history (sanitize to only role and content)
  messages.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      formattedMessages.push({
        role: msg.role,
        content: String(msg.content || '').trim()
      })
    }
  })

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 35000) // 35s timeout

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        temperature: mode === 'exam_prep' || mode === 'step_by_step' || mode === 'coding_practice' ? 0.2 : 0.4,
        max_tokens: 1500
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errText = await response.text()
      console.warn(`[Groq AI Tutor] API responded with ${response.status}: ${errText}`)

      if (response.status === 401) {
        return {
          success: false,
          errorType: 'INVALID_CREDENTIALS',
          message: 'The server Groq API key is invalid or expired. Please check your GROQ_API_KEY in .env.'
        }
      }

      if (response.status === 429) {
        return {
          success: false,
          errorType: 'RATE_LIMIT',
          message: 'Groq API rate limit reached. Please wait a few moments and try your prompt again.'
        }
      }

      return {
        success: false,
        errorType: 'API_ERROR',
        message: `Groq inference API returned HTTP ${response.status}. Please retry.`
      }
    }

    const json = await response.json()
    const assistantContent = json.choices?.[0]?.message?.content?.trim() || ''

    if (!assistantContent) {
      return {
        success: false,
        errorType: 'EMPTY_RESPONSE',
        message: 'The AI model returned an empty response. Please retry.'
      }
    }

    return {
      success: true,
      content: assistantContent,
      model,
      usage: json.usage,
      citations: ragResult.hasGrounding ? ragResult.citations : [],
      hasGrounding: ragResult.hasGrounding,
      groundingNote: ragResult.note
    }
  } catch (err) {
    console.error('[Groq AI Tutor] Network or execution error:', err.message)
    if (err.name === 'AbortError') {
      return {
        success: false,
        errorType: 'TIMEOUT',
        message: 'Request timed out after 35 seconds. Please try again with a shorter query.'
      }
    }
    return {
      success: false,
      errorType: 'NETWORK_ERROR',
      message: `Failed to reach Groq API: ${err.message}. Ensure your server has active internet access.`
    }
  }
}

module.exports = {
  buildSystemPrompt,
  generateTutorResponse
}
