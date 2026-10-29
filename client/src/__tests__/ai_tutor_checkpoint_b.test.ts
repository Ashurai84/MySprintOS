import { describe, it, expect } from 'vitest'
// @ts-expect-error - Server CommonJS module without types
import { retrieveRelevantExcerpts } from '../../../server/tutorRAGService'
import type { TutorCitation, TutorMessage, TutorSession } from '../types'

describe('SprintOS AI Tutor — Checkpoint B: Grounded Retrieval & Verifiable Citations', () => {

  // 1. Correct subject retrieval
  it('retrieves evidence from the correct subject document without cross-contamination', () => {
    // DSA III check: Kosaraju
    const dsaRes = retrieveRelevantExcerpts({
      query: 'Explain Kosaraju algorithm for strongly connected components',
      subjectId: 'dsa-3',
      topicTitle: 'Strongly Connected Components'
    })

    expect(dsaRes.hasGrounding).toBe(true)
    expect(dsaRes.citations.length).toBeGreaterThan(0)
    expect(dsaRes.citations[0].documentName).toBe('DSA3_Semester5_Syllabus (1).docx')
    expect(dsaRes.citations[0].location).toContain('Module I - Graph Algorithms')
    expect(dsaRes.citations[0].excerpt.toLowerCase()).toContain('kosaraju')

    // LLM & RAG check: Document chunking
    const llmRes = retrieveRelevantExcerpts({
      query: 'What are document chunking strategies?',
      subjectId: 'llm-rag-agentic-ai',
      topicTitle: 'RAG Ingestion'
    })

    expect(llmRes.hasGrounding).toBe(true)
    expect(llmRes.citations.length).toBeGreaterThan(0)
    expect(llmRes.citations[0].documentName).toBe('LLMs, RAG & Agentic AI_Sem5.xlsx')
    expect(llmRes.citations[0].location).toMatch(/Sheet '(Syllabus|Session Plan)'/)
    expect(llmRes.citations[0].excerpt.toLowerCase()).toContain('chunking')
  })

  // 2. Disambiguation: Subject filtering prevents unrelated subject matches
  it('does not allow a topic in one subject to incorrectly dominate when another subject is selected', () => {
    // Kosaraju is a DSA topic. If the user is currently in STQA (Software Testing), it must NOT match DSA
    const crossSubjectRes = retrieveRelevantExcerpts({
      query: 'Explain Kosaraju algorithm',
      subjectId: 'stqa',
      subjectName: 'Software Testing & Quality Assurance'
    })

    expect(crossSubjectRes.hasGrounding).toBe(false)
    expect(crossSubjectRes.citations.length).toBe(0)
  })

  // 3. Absent topic returns no fabricated official evidence
  it('returns hasGrounding: false and no citations for topics absent from the college syllabus', () => {
    const absentRes = retrieveRelevantExcerpts({
      query: 'Explain Quantum Superposition and Quantum Key Distribution in Qubits',
      subjectId: 'dsa-3'
    })

    expect(absentRes.hasGrounding).toBe(false)
    expect(absentRes.citations.length).toBe(0)
    expect(absentRes.contextText).toBe('')
    expect(absentRes.note).toContain('No direct excerpt')
  })

  // 4. Citation IDs correspond to retrieved records
  it('generates deterministic citation IDs corresponding to retrieved records', () => {
    const res = retrieveRelevantExcerpts({
      query: 'Boundary value analysis and equivalence partitioning test design',
      subjectId: 'stqa'
    })

    expect(res.hasGrounding).toBe(true)
    expect(res.citations.length).toBeGreaterThan(0)
    
    for (const citation of res.citations) {
      expect(citation.id).toBeDefined()
      expect(citation.id).toMatch(/^cite-/)
      expect(citation.verified).toBe(true)
      expect(citation.groundingType).toBe('university_document')
    }
  })

  // 5. Displayed document and location match the underlying source metadata
  it('ensures documentName and location reflect true source structure without fabrication', () => {
    const res = retrieveRelevantExcerpts({
      query: 'What is the CRISP-DM lifecycle in data science?',
      subjectId: 'foundation-aiml-ds'
    })

    expect(res.hasGrounding).toBe(true)
    const cit = res.citations[0]
    expect(cit.documentName).toBe('Foundations of AI, ML & Data Science_Sem5.xlsx')
    expect(cit.sourceType).toBe('xlsx')
    expect(cit.location).toMatch(/^Sheet '.*', Row \d+$/)
    expect(cit.excerpt.length).toBeGreaterThan(10)
  })

  // 6. Cannot invent a page number or fake cell range
  it('never invents page numbers for DOCX or fake cell coordinates', () => {
    const dsaRes = retrieveRelevantExcerpts({
      query: 'Dynamic programming on trees and bitmask DP',
      subjectId: 'dsa-3'
    })

    expect(dsaRes.hasGrounding).toBe(true)
    const cit = dsaRes.citations[0]
    // DOCX files are plain text extracts, so location must be Section-based, never a fabricated page
    expect(cit.location).toContain('Section:')
    expect(cit.location).not.toContain('Page')
    expect(cit.sourceType).toBe('docx')
  })

  // 7. Empty, malformed, or stop-word only queries fail safely
  it('fails safely with empty or stop-word-only queries', () => {
    const emptyRes = retrieveRelevantExcerpts({ query: '', subjectId: 'dsa-3' })
    expect(emptyRes.hasGrounding).toBe(false)
    expect(emptyRes.citations).toEqual([])

    const stopWordsRes = retrieveRelevantExcerpts({ query: 'what is the and for with', subjectId: 'dsa-3' })
    expect(stopWordsRes.hasGrounding).toBe(false)
    expect(stopWordsRes.citations).toEqual([])

    const malformedRes = retrieveRelevantExcerpts({ query: '??? !!! ... ///', subjectId: 'unknown-subject' })
    expect(malformedRes.hasGrounding).toBe(false)
    expect(malformedRes.citations).toEqual([])
  })

  // 8. Irrelevant general queries are not marked as university grounded
  it('does not present completely irrelevant casual queries as authoritative evidence', () => {
    const casualRes = retrieveRelevantExcerpts({
      query: 'Where can I find the best espresso and iced coffee near the campus library?',
      subjectId: 'dsa-3'
    })

    expect(casualRes.hasGrounding).toBe(false)
    expect(casualRes.citations.length).toBe(0)
  })

  // 9. Master Academic Plan PDF grounding for attendance & exam dates
  it('grounds attendance and exam calendar queries in the Master Academic Plan PDF', () => {
    const planRes = retrieveRelevantExcerpts({
      query: 'What is the mandatory attendance requirement and evaluation pattern for Sprint 2?'
    })

    expect(planRes.hasGrounding).toBe(true)
    expect(planRes.citations.length).toBeGreaterThan(0)
    const pdfCit = planRes.citations.find((c: any) => c.sourceType === 'pdf')
    expect(pdfCit).toBeDefined()
    expect(pdfCit?.documentName).toBe('Sprint 2 Academic Plan 13th Oct 2026.pdf')
    expect(pdfCit?.excerpt).toContain('75%')
    expect(pdfCit?.excerpt).toContain('60 internal')
  })

  // 10. Checkpoint A session persistence with Checkpoint B citations
  it('preserves session persistence and correctly models messages with citation metadata', () => {
    const session: TutorSession = {
      id: 'session-rag-test',
      title: 'Kosaraju Algorithm Discussion',
      subjectId: 'dsa-3',
      subjectName: 'Data Structures and Algorithms III',
      mode: 'btech_student',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const citation: TutorCitation = {
      id: 'cite-dsa-sec-module-i-graph-algorithms',
      documentName: 'DSA3_Semester5_Syllabus (1).docx',
      sourceType: 'docx',
      location: 'Section: Module I - Graph Algorithms',
      excerpt: 'SCC Overview, Kosaraju Steps, SCC Coding, Tarjan (Low-Link), SCC via Tarjan',
      verified: true,
      groundingType: 'university_document'
    }

    const assistantMsg: TutorMessage = {
      id: 'msg-rag-1',
      role: 'assistant',
      content: 'Kosaraju algorithm decomposes a directed graph into Strongly Connected Components (SCCs) in linear time O(V + E)...',
      timestamp: new Date().toISOString(),
      mode: 'btech_student',
      citations: [citation],
      hasGrounding: true
    }

    session.messages.push(assistantMsg)

    expect(session.messages.length).toBe(1)
    expect(session.messages[0].citations?.length).toBe(1)
    expect(session.messages[0].citations?.[0].documentName).toBe('DSA3_Semester5_Syllabus (1).docx')
    expect(session.messages[0].citations?.[0].verified).toBe(true)
    expect(session.messages[0].hasGrounding).toBe(true)
  })
})
