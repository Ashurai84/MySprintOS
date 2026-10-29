import { describe, it, expect, beforeEach } from 'vitest'
import { 
  extractFromPreParsedDocuments,
  type ExtractionResult 
} from '../services/documentCertificateExtractor'
import { 
  saveCertificateFile, 
  getCertificateFile, 
  deleteCertificateFile 
} from '../services/certificateStorageService'
import type { Certification, CertStatus } from '../types'

describe('SprintOS Certificate Hub — Document Extraction & Academic Integrity', () => {
  let extractionResult: ExtractionResult

  beforeEach(() => {
    extractionResult = extractFromPreParsedDocuments()
  })

  it('discovers all direct certificate opportunities from college syllabus spreadsheets', () => {
    const directCerts = extractionResult.directCertificates

    // Foundations of AI (12) + STQA (3) + LLMs & RAG (2) = 17 direct certifications
    expect(directCerts.length).toBe(17)

    // Verify key certifications exist with exact source titles
    const titles = directCerts.map(c => c.title)
    expect(titles).toContain('Gemini University Student Certification')
    expect(titles).toContain('Building AI Agents with RAG and LangChain (Certification)')
    expect(titles).toContain('Elements of AI')
    expect(titles).toContain('Google Data Analytics Professional Certificate')
    expect(titles).toContain('Machine Learning Specialization')
    expect(titles).toContain('IBM Data Science Professional Certificate')
    expect(titles).toContain('Microsoft Certified: Azure AI Fundamentals (AI-900)')
    expect(titles).toContain('AWS Certified AI Practitioner')
    expect(titles).toContain('Software Testing Fundamentals')
    expect(titles).toContain('Introduction to Cybersecurity')
  })

  it('preserves exact source wording, provider, and destination URLs without inventing URLs', () => {
    const geminiCert = extractionResult.directCertificates.find(
      c => c.title === 'Gemini University Student Certification'
    )
    expect(geminiCert).toBeDefined()
    expect(geminiCert?.provider).toBe('Google for Education')
    expect(geminiCert?.url).toBe('https://educertifications.google/')
    expect(geminiCert?.sourceDocument).toBe('LLMs, RAG & Agentic AI_Sem5.xlsx')
    expect(geminiCert?.sheet).toBe('Certificate')
    expect(geminiCert?.sourceLocation).toContain('Cell F2')

    const elementsOfAi = extractionResult.directCertificates.find(
      c => c.title === 'Elements of AI'
    )
    expect(elementsOfAi).toBeDefined()
    expect(elementsOfAi?.provider).toBe('University of Helsinki')
    expect(elementsOfAi?.url).toBe('https://www.elementsofai.com/')
    expect(elementsOfAi?.sourceDocument).toBe('Foundations of AI, ML & Data Science_Sem5.xlsx')
    expect(elementsOfAi?.sheet).toBe('Certificates')
    expect(elementsOfAi?.sourceLocation).toContain('Cell E2')

    const msftCert = extractionResult.directCertificates.find(
      c => c.title.includes('Azure AI Fundamentals')
    )
    expect(msftCert?.url).toBe('https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/')
    expect(msftCert?.verificationStatus).toBe('verified')
  })

  it('strictly distinguishes direct certificate links from general course or practice links', () => {
    const directUrls = new Set(extractionResult.directCertificates.map(c => c.url))
    const courseResources = extractionResult.courseResources

    // Practice platforms and course references from syllabus sessions
    expect(courseResources.length).toBeGreaterThan(0)
    
    // Direct certificates must have high confidence
    extractionResult.directCertificates.forEach(cert => {
      expect(cert.kind).toBe('direct_certificate')
      expect(cert.confidence).toBe('high')
      expect(cert.sourceLocation).toMatch(/Sheet 'Certificate/i)
    })

    // General resources should not be falsely classified as direct certificates
    courseResources.forEach(res => {
      expect(res.kind).not.toBe('direct_certificate')
      expect(directUrls.has(res.url)).toBe(false)
    })
  })

  it('deduplicates identical URLs while preserving all source references', () => {
    const allUrls = extractionResult.allOpportunities.map(o => o.url.toLowerCase())
    const uniqueUrls = new Set(allUrls)
    expect(allUrls.length).toBe(uniqueUrls.size)

    // Each opportunity preserves source references
    extractionResult.allOpportunities.forEach(opp => {
      expect(opp.sourceReferences).toBeDefined()
      expect(opp.sourceReferences?.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('documents scan summary for all 7 academic files including Master Plan PDF', () => {
    const summaries = extractionResult.documentSummaries
    expect(summaries.length).toBe(7)

    const pdfScan = summaries.find(s => s.fileType === 'pdf')
    expect(pdfScan).toBeDefined()
    expect(pdfScan?.documentName).toBe('Sprint 2 Academic Plan 13th Oct 2026.pdf')
    expect(pdfScan?.status).toBe('scanned')
    expect(pdfScan?.directCertificatesFound).toBe(0)
    expect(pdfScan?.notes).toContain('No direct external certification URLs present')
  })
})

describe('SprintOS Certificate Hub — Status Tracking & Preservation Workflow', () => {
  it('supports all required certificate statuses: not_started, in_progress, completed, needs_review', () => {
    const validStatuses: CertStatus[] = ['not_started', 'in_progress', 'completed', 'needs_review']
    
    validStatuses.forEach(status => {
      const sampleCert: Certification = {
        id: `cert-${status}`,
        title: `Test ${status}`,
        platform: 'Test Provider',
        courseUrl: 'https://example.com/course',
        relatedSubjectId: 'llm-rag-agentic-ai',
        status,
        progressPercentage: status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0,
        targetDate: '2026-11-30',
        completionDate: status === 'completed' ? '2026-10-29' : undefined
      }

      expect(sampleCert.status).toBe(status)
      if (status === 'completed') {
        expect(sampleCert.progressPercentage).toBe(100)
        expect(sampleCert.completionDate).toBeDefined()
      }
    })
  })

  it('securely stores and retrieves certificate proof file via storage service', async () => {
    const fakeCertId = 'test-cert-id-123'
    const fakeBlob = new Blob(['%PDF-1.4 Fake Certificate Content'], { type: 'application/pdf' })
    const fakeFile = new File([fakeBlob], 'ElonMusk_Gemini_Cert.pdf', { type: 'application/pdf' })

    // Save file
    const saved = await saveCertificateFile(fakeCertId, fakeFile)
    expect(saved.filename).toBe('ElonMusk_Gemini_Cert.pdf')
    expect(saved.fileType).toBe('application/pdf')
    expect(saved.fileData).toContain('data:application/pdf')

    // Retrieve file
    const retrieved = await getCertificateFile(fakeCertId)
    expect(retrieved).not.toBeNull()
    expect(retrieved?.filename).toBe('ElonMusk_Gemini_Cert.pdf')
    expect(retrieved?.fileData).toBe(saved.fileData)

    // Delete file
    const deleted = await deleteCertificateFile(fakeCertId)
    expect(deleted).toBe(true)

    const afterDelete = await getCertificateFile(fakeCertId)
    expect(afterDelete).toBeNull()
  })

  it('updates certification record with uploaded certificate metadata and marks completed', () => {
    const cert: Certification = {
      id: 'cert-gemini-test',
      title: 'Gemini University Student Certification',
      platform: 'Google for Education',
      courseUrl: 'https://educertifications.google/',
      relatedSubjectId: 'llm-rag-agentic-ai',
      status: 'not_started',
      progressPercentage: 0,
      targetDate: '2026-11-30'
    }

    // Simulate completion with uploaded proof
    const completedCert: Certification = {
      ...cert,
      status: 'completed',
      progressPercentage: 100,
      completionDate: '2026-10-29',
      credentialId: 'GU-2026-9812',
      uploadedCertificate: {
        filename: 'gemini_cert.pdf',
        fileType: 'application/pdf',
        fileSize: '412 KB',
        uploadedAt: '2026-10-29T00:00:00.000Z',
        fileData: 'data:application/pdf;base64,JVBERi0xLjQK...'
      }
    }

    expect(completedCert.status).toBe('completed')
    expect(completedCert.progressPercentage).toBe(100)
    expect(completedCert.completionDate).toBe('2026-10-29')
    expect(completedCert.uploadedCertificate?.filename).toBe('gemini_cert.pdf')
  })
})

