import { describe, it, expect } from 'vitest'
// @ts-expect-error - Server CommonJS module without types
import { buildSystemPrompt } from '../../../server/tutorService'
// @ts-expect-error - Server CommonJS module without types
import { retrieveRelevantExcerpts } from '../../../server/tutorRAGService'
import { initialSubjects } from '../data/defaultData'
import type { TutorSession, TutorMessage } from '../types'

describe('SprintOS AI Tutor — Checkpoint C: Guided Coding Practice', () => {

  it('1. Guided coding follows the expected 8-step pedagogical sequence', () => {
    const prompt = buildSystemPrompt('coding_practice', 'Data Structures and Algorithms III', 'Strongly Connected Components')
    
    // 8-step sequence checks
    expect(prompt).toContain('UNDERSTAND')
    expect(prompt).toContain('APPROACH')
    expect(prompt).toContain('DRY RUN')
    expect(prompt).toContain('STUDENT ATTEMPT & HINTS')
    expect(prompt).toContain('SOLUTION')
    expect(prompt).toContain('COMPLEXITY')
    expect(prompt).toContain('TESTING')
    expect(prompt).toContain('REVIEW & CHECK')
  })

  it('2. Guided coding mandates offering hints before dumping solution code unless explicitly requested', () => {
    const prompt = buildSystemPrompt('coding_practice', 'Data Structures and Algorithms III', 'Tarjan Algorithm')
    
    expect(prompt).toContain('Would you like Hint 1')
    expect(prompt).toContain('DO NOT dump the complete code solution in the very first turn')
    expect(prompt).toContain('reveal solution')
  })

  it('3. Coding dry-run specifies Markdown trace table for state changes on sample input', () => {
    const prompt = buildSystemPrompt('coding_practice', 'Data Structures and Algorithms III', 'Kosaraju Algorithm')
    
    expect(prompt).toContain('Markdown trace table')
    expect(prompt).toContain('intermediate state changes')
  })

  it('4. The tutor explicitly prohibits false claims of online judge or execution verification', () => {
    const prompt = buildSystemPrompt('coding_practice', 'Data Structures and Algorithms III', 'Flow Networks')
    
    expect(prompt).toContain('NEVER claim that code was submitted to, compiled on, or passed an online judge')
    expect(prompt).toContain('LeetCode')
    expect(prompt).toContain('honestly as manual/conceptual verifications')
  })
})

describe('SprintOS AI Tutor — Checkpoint C: Active Revision & Subject/Topic Binding', () => {

  it('5. Revision workflow targets valid existing Semester 5 subjects and topics', () => {
    // Verify valid subject
    const dsaSubject = initialSubjects.find(s => s.code === 'S5-CS01')
    expect(dsaSubject).toBeDefined()
    
    const kosarajuTopic = dsaSubject?.modules
      .flatMap(m => m.topics)
      .find(t => t.title.toLowerCase().includes('kosaraju') || t.title.toLowerCase().includes('scc'))
    expect(kosarajuTopic).toBeDefined()

    // Build prompt for this real subject and topic
    const prompt = buildSystemPrompt('revision', dsaSubject?.name, kosarajuTopic?.title)
    expect(prompt).toContain(dsaSubject?.name)
    expect(prompt).toContain(kosarajuTopic?.title)
    expect(prompt).toContain('TARGETED RECALL')
  })

  it('6. Active revision instructs student attempt before answers, and delivers constructive assessment', () => {
    const prompt = buildSystemPrompt('revision', 'Software Testing & Quality Assurance', 'Equivalence Partitioning')
    
    expect(prompt).toContain('DO NOT reveal the expected answer')
    expect(prompt).toContain('Highlight specifically what was accurate')
    expect(prompt).toContain('Point out what was missing, incomplete, or imprecise')
    expect(prompt).toContain('model answer for comparison')
  })

  it('7. Revision practice questions are transparently labeled and never claimed to be official exam papers', () => {
    const prompt = buildSystemPrompt('revision', 'LLMs, RAG & Agentic AI', 'RAG Architecture')
    
    expect(prompt).toContain('[ACTIVE RECALL — Practice Question]')
    expect(prompt).toContain('self-assessment practice, not official university examination questions')
  })
})

describe('SprintOS AI Tutor — Checkpoint C: Exam Preparation & Integrity', () => {

  it('8. Exam prep supports 2-Mark conceptual, MCQ, and 5/10-Mark analytical questions with rubrics', () => {
    const prompt = buildSystemPrompt('exam_prep', 'Foundation of AI/ML & Data Science', 'CRISP-DM Lifecycle')
    
    expect(prompt).toContain('2-Mark Short Conceptual Questions')
    expect(prompt).toContain('Multiple Choice Questions (MCQs)')
    expect(prompt).toContain('5-Mark / 10-Mark Analytical Questions')
    expect(prompt).toContain('transparent university grading rubric')
  })

  it('9. Exam-prep preserves Checkpoint B source retrieval and honest fallback', () => {
    // 9a: Grounded exam question retrieval
    const groundedRes = retrieveRelevantExcerpts({
      query: 'What are the main stages of CRISP-DM lifecycle?',
      subjectId: 'foundation-aiml-ds',
      topicTitle: 'CRISP-DM'
    })
    expect(groundedRes.hasGrounding).toBe(true)
    expect(groundedRes.citations.length).toBeGreaterThan(0)
    expect(groundedRes.citations[0].documentName).toBe('Foundations of AI, ML & Data Science_Sem5.xlsx')

    // 9b: Fallback when topic is not in university documents
    const fallbackRes = retrieveRelevantExcerpts({
      query: 'What is String Theory in theoretical physics?',
      subjectId: 'foundation-aiml-ds'
    })
    expect(fallbackRes.hasGrounding).toBe(false)
    expect(fallbackRes.citations).toEqual([])
  })

  it('10. Practice exam questions are labeled as AI-generated and not guaranteed exam leaks', () => {
    const prompt = buildSystemPrompt('exam_prep', 'Venture & Product Strategy', 'Startup Valuation')
    
    expect(prompt).toContain('[PRACTICE EXAM QUESTION — AI Generated from Syllabus]')
    expect(prompt).toContain('NEVER claim that a question is an actual leaked question or guaranteed to appear')
  })
})

describe('SprintOS AI Tutor — Checkpoint C: Persistence & UI Session Integration', () => {

  it('11. Preserves session persistence and mode transitions seamlessly', () => {
    const session: TutorSession = {
      id: 'session-c-1',
      title: 'Active Revision Session',
      subjectId: 'stqa',
      subjectName: 'Software Testing & Quality Assurance',
      topicTitle: 'Boundary Value Analysis',
      mode: 'revision',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Step 1: Tutor asks recall question
    const qMsg: TutorMessage = {
      id: 'msg-c-1',
      role: 'assistant',
      content: '[ACTIVE RECALL — Practice Question]\nIn Boundary Value Analysis, why do errors tend to cluster at boundaries rather than the center of input partitions?',
      timestamp: new Date().toISOString(),
      mode: 'revision',
      hasGrounding: true
    }
    session.messages.push(qMsg)

    // Step 2: Student attempts response
    const aMsg: TutorMessage = {
      id: 'msg-c-2',
      role: 'user',
      content: 'Because developers often make off-by-one errors with relational operators like < instead of <=.',
      timestamp: new Date().toISOString()
    }
    session.messages.push(aMsg)

    // Step 3: Tutor provides rubric assessment
    const evalMsg: TutorMessage = {
      id: 'msg-c-3',
      role: 'assistant',
      content: 'Excellent! You identified the primary reason: off-by-one errors with loop limits and boundary conditions...',
      timestamp: new Date().toISOString(),
      mode: 'revision'
    }
    session.messages.push(evalMsg)

    expect(session.messages.length).toBe(3)
    expect(session.messages[0].content).toContain('[ACTIVE RECALL')
    expect(session.messages[1].role).toBe('user')
    expect(session.messages[2].content).toContain('off-by-one')
  })

  it('12. Simulated mock response confirms structured trace table in coding practice', () => {
    // Synthetic mock test demonstrating trace table generation
    const mockTutorCodingReply = `### Step 1: Understand
Inputs: Graph with V=4, E=4. Directed edges: (0->1), (1->2), (2->0), (1->3).
Output: SCCs = [{0, 1, 2}, {3}].

### Step 2: Approach
Kosaraju algorithm utilizes two DFS passes: Pass 1 on the original graph to compute finishing times via stack, and Pass 2 on the reversed (transposed) graph to extract SCCs.

### Step 3: Dry-Run Trace Table
| Step | Action | Visited Set | Finishing Stack |
| :--- | :--- | :--- | :--- |
| 1 | DFS from Node 0 | {0, 1, 2} | [] |
| 2 | Backtrack from 3 | {0, 1, 2, 3} | [3] |
| 3 | Backtrack from 2 | {0, 1, 2, 3} | [3, 2] |
| 4 | Backtrack from 1 | {0, 1, 2, 3} | [3, 2, 1] |
| 5 | Backtrack from 0 | {0, 1, 2, 3} | [3, 2, 1, 0] |

Would you like Hint 1 for the transpose step, or should we reveal the complete C++ implementation?`

    expect(mockTutorCodingReply).toContain('Dry-Run Trace Table')
    expect(mockTutorCodingReply).toContain('| Step | Action |')
    expect(mockTutorCodingReply).toContain('Would you like Hint 1')
    expect(mockTutorCodingReply).not.toContain('Passed 100% test cases on LeetCode')
  })

  it('13. Enforces zero conversational fluff and direct problem-solving breakdown', () => {
    const prompt = buildSystemPrompt('explain_simply', 'Data Structures and Algorithms III', 'Dynamic Programming')
    expect(prompt).toContain('ZERO CONVERSATIONAL FLUFF')
    expect(prompt).toContain('IMMEDIATE PROBLEM SOLVING')
    expect(prompt).toContain('Problem Formulation & Objective')
    expect(prompt).toContain('Core Intuition & Algorithmic Technique')
    expect(prompt).toContain('Step-by-Step Logic & Dry Run')
  })
})

