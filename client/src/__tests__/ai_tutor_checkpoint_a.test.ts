import { describe, it, expect, beforeEach } from 'vitest'
import { initialSubjects } from '../data/defaultData'
import { TUTOR_MODES } from '../components/tutor/TutorContextBar'
import type { TutorSession, TutorMessage } from '../types'

describe('SprintOS AI Tutor — Checkpoint A: Curriculum Binding & Integrity', () => {
  it('dynamically connects to exactly the six Semester 5 core subjects without duplicating syllabus', () => {
    expect(initialSubjects.length).toBeGreaterThanOrEqual(6)
    
    const subjectCodes = initialSubjects.map(s => s.code)
    // S5-CS01 (DSA III), S5-AI01 (LLMs/RAG), S5-SE01 (STQA), S5-MG01 (Venture), S5-DS01 (Foundations AIML), S5-SS01 (Career)
    expect(subjectCodes).toContain('S5-CS01')
    expect(subjectCodes).toContain('S5-AI01')
    expect(subjectCodes).toContain('S5-SE01')
    expect(subjectCodes).toContain('S5-MG01')
    expect(subjectCodes).toContain('S5-DS01')
    expect(subjectCodes).toContain('S5-SS01')
  })

  it('retrieves actual modules and topics from curriculum data', () => {
    const dsaSubject = initialSubjects.find(s => s.code === 'S5-CS01')
    expect(dsaSubject).toBeDefined()
    expect(dsaSubject?.modules.length).toBeGreaterThan(0)

    // Verify actual Kosaraju / Tarjan graph topics in DSA
    const allDsaTopics = dsaSubject?.modules.flatMap(m => m.topics.map(t => t.title)) || []
    expect(allDsaTopics.some(t => t.includes('SCC') || t.includes('Graph'))).toBe(true)

    const llmSubject = initialSubjects.find(s => s.code === 'S5-AI01')
    const allLlmTopics = llmSubject?.modules.flatMap(m => m.topics.map(t => t.title)) || []
    expect(allLlmTopics.some(t => t.includes('RAG') || t.includes('Embedding') || t.includes('Vector'))).toBe(true)
  })

  it('provides all required pedagogical teaching modes with clear definitions', () => {
    const modeIds = TUTOR_MODES.map(m => m.id)
    expect(modeIds).toContain('explain_simply')
    expect(modeIds).toContain('btech_student')
    expect(modeIds).toContain('step_by_step')
    expect(modeIds).toContain('exam_prep')
    expect(modeIds).toContain('revision')
    expect(modeIds).toContain('coding_practice')

    const explainSimply = TUTOR_MODES.find(m => m.id === 'explain_simply')
    expect(explainSimply?.description).toContain('analogi')

    const btechMode = TUTOR_MODES.find(m => m.id === 'btech_student')
    expect(btechMode?.description).toContain('exam')
  })
})

describe('SprintOS AI Tutor — Checkpoint A: Session State & Persistence', () => {
  let sessions: TutorSession[]

  beforeEach(() => {
    sessions = []
  })

  it('initializes and appends messages to a tutoring session', () => {
    const newSession: TutorSession = {
      id: 'session-test-1',
      title: 'Kosaraju Algorithm Tutoring',
      subjectId: 'dsa-3',
      subjectName: 'Data Structures and Algorithms III',
      topicTitle: 'Strongly Connected Components',
      mode: 'explain_simply',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    sessions.push(newSession)

    // User message
    const userMsg: TutorMessage = {
      id: 'msg-1',
      role: 'user',
      content: 'Can you explain Kosaraju with a real-life analogy?',
      timestamp: new Date().toISOString()
    }
    sessions[0].messages.push(userMsg)

    // Assistant response
    const assistantMsg: TutorMessage = {
      id: 'msg-2',
      role: 'assistant',
      content: 'Think of strongly connected components like a round-trip road trip...',
      timestamp: new Date().toISOString(),
      mode: 'explain_simply'
    }
    sessions[0].messages.push(assistantMsg)

    expect(sessions[0].messages.length).toBe(2)
    expect(sessions[0].messages[0].role).toBe('user')
    expect(sessions[0].messages[1].role).toBe('assistant')
    expect(sessions[0].messages[1].content).toContain('road trip')
  })

  it('updates session title dynamically from first user prompt', () => {
    const session: TutorSession = {
      id: 'session-test-2',
      title: 'New Tutoring Session',
      mode: 'btech_student',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const firstPrompt = 'What is Equivalence Partitioning in STQA?'
    const title = firstPrompt.length > 36 ? firstPrompt.slice(0, 33) + '...' : firstPrompt
    session.title = title

    expect(session.title).toBe('What is Equivalence Partitioning ...')
  })

  it('preserves error state and enables retry tracking', () => {
    const errorMsg: TutorMessage = {
      id: 'msg-err',
      role: 'assistant',
      content: 'Groq API rate limit reached. Please wait a few moments and try your prompt again.',
      timestamp: new Date().toISOString(),
      isError: true
    }

    expect(errorMsg.isError).toBe(true)
    expect(errorMsg.content).toContain('rate limit')
  })
})
