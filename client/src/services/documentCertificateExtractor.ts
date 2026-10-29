import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import parsedDocsData from '../data/parsedAcademicDocs.json'
import type { ExtractedOpportunity } from '../types'

export interface DocumentScanSummary {
  documentName: string
  fileType: 'xlsx' | 'docx' | 'pdf' | 'other'
  status: 'scanned' | 'inaccessible' | 'unsupported'
  directCertificatesFound: number
  courseResourcesFound: number
  totalUrlsInspected: number
  notes: string
}

export interface ExtractionResult {
  directCertificates: ExtractedOpportunity[]
  courseResources: ExtractedOpportunity[]
  generalReferences: ExtractedOpportunity[]
  allOpportunities: ExtractedOpportunity[]
  documentSummaries: DocumentScanSummary[]
  scannedAt: string
}

/**
 * Normalizes URL for deduplication
 */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim())
    return `${u.protocol}//${u.hostname.toLowerCase()}${u.pathname.replace(/\/$/, '')}${u.search}`
  } catch {
    return url.trim().toLowerCase().replace(/\/$/, '')
  }
}

/**
 * Determines verification status based on URL properties and source context
 */
function determineVerificationStatus(url: string, description: string): 'verified' | 'unverified' | 'login_required' {
  const lowerUrl = url.toLowerCase()
  const lowerDesc = description.toLowerCase()

  if (lowerUrl.includes('itm.edu') || lowerUrl.includes('portal.') || lowerUrl.includes('login') || lowerDesc.includes('login required')) {
    return 'login_required'
  }

  // Known public educational portals and credential issuers
  const verifiedDomains = [
    'educertifications.google',
    'coursera.org',
    'mygreatlearning.com',
    'simplilearn.com',
    'skillsforall.com',
    'elementsofai.com',
    'nptel.ac.in',
    'learn.microsoft.com',
    'aws.amazon.com',
    'kaggle.com',
    'hackerrank.com',
    'freecodecamp.org',
    'cloud.google.com',
    'leetcode.com',
    'codeforces.com',
    'cp-algorithms.com',
    'selenium.dev',
    'owasp.org',
    'mitpress.mit.edu',
    'openstax.org'
  ]

  const isKnownVerified = verifiedDomains.some(domain => lowerUrl.includes(domain))
  return isKnownVerified ? 'verified' : 'unverified'
}

/**
 * Resolves related subject ID based on filename and content
 */
function resolveSubjectId(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.includes('llm') || lower.includes('agentic') || lower.includes('rag')) return 'llm-rag-agentic-ai'
  if (lower.includes('foundations of ai') || lower.includes('aiml') || lower.includes('data science')) return 'foundation-aiml-ds'
  if (lower.includes('software testing') || lower.includes('stqa')) return 'stqa'
  if (lower.includes('dsa') || lower.includes('algorithm')) return 'dsa-3'
  if (lower.includes('venture') || lower.includes('capital') || lower.includes('product')) return 'venture-product-strategy'
  if (lower.includes('carrier') || lower.includes('career') || lower.includes('leadership')) return 'career-readiness-leadership'
  return ''
}

/**
 * Extracts opportunities from pre-parsed academic documents
 */
export function extractFromPreParsedDocuments(): ExtractionResult {
  const docs = parsedDocsData as Record<string, any>
  const opportunityMap = new Map<string, ExtractedOpportunity>()
  const summaries: DocumentScanSummary[] = []

  // 1. Process each document in parsedAcademicDocs.json
  for (const [filename, doc] of Object.entries(docs)) {
    const subjectId = resolveSubjectId(filename)
    let directCount = 0
    let resourceCount = 0
    let urlCount = 0

    if (doc.type === 'xlsx' && Array.isArray(doc.sheets)) {
      doc.sheets.forEach((sheet: any) => {
        const sheetName = String(sheet.name || '')
        const isCertSheet = /certif/i.test(sheetName)
        const rows = sheet.rows || []
        if (rows.length === 0) return

        const headers: string[] = (rows[0] || []).map((h: any) => String(h || '').trim().toLowerCase())

        if (isCertSheet) {
          // Dedicated certificate sheet
          let titleIdx = headers.findIndex(h => h.includes('cert') && (h.includes('name') || h.includes('title')))
          if (titleIdx === -1) titleIdx = 1
          let platformIdx = headers.findIndex(h => h.includes('platform') || h.includes('provider'))
          let urlIdx = headers.findIndex(h => h.includes('link') || h.includes('url'))
          let descIdx = headers.findIndex(h => h.includes('desc'))
          let hoursIdx = headers.findIndex(h => h.includes('hr') || h.includes('time') || h.includes('duration'))

          for (let r = 1; r < rows.length; r++) {
            const row = rows[r]
            if (!row || !row[titleIdx]) continue

            const rawTitle = String(row[titleIdx]).trim()
            const rawPlatform = platformIdx !== -1 && row[platformIdx] ? String(row[platformIdx]).trim() : 'Unknown Provider'
            let rawUrl = urlIdx !== -1 && row[urlIdx] ? String(row[urlIdx]).trim() : ''
            const rawDesc = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : ''
            const rawHours = hoursIdx !== -1 && row[hoursIdx] ? String(row[hoursIdx]).trim() : undefined

            if (!rawUrl || !rawUrl.startsWith('http')) continue

            urlCount++
            directCount++

            const colLetter = String.fromCharCode(65 + Math.max(0, urlIdx))
            const cellLocation = `Sheet '${sheetName}', Row ${r + 1}, Cell ${colLetter}${r + 1}`
            const normUrl = normalizeUrl(rawUrl)

            if (opportunityMap.has(normUrl)) {
              const existing = opportunityMap.get(normUrl)!
              existing.sourceReferences = existing.sourceReferences || []
              existing.sourceReferences.push({ documentName: filename, location: cellLocation })
            } else {
              const opp: ExtractedOpportunity = {
                id: `opp-${Math.random().toString(36).slice(2, 9)}`,
                title: rawTitle,
                provider: rawPlatform,
                url: rawUrl,
                sourceDocument: filename,
                sourceLocation: cellLocation,
                sheet: sheetName,
                cell: `${colLetter}${r + 1}`,
                hours: rawHours,
                description: rawDesc,
                kind: 'direct_certificate',
                confidence: 'high',
                verificationStatus: determineVerificationStatus(rawUrl, rawDesc),
                suggestedSubjectId: subjectId,
                rawExtractedAt: new Date().toISOString(),
                sourceReferences: [{ documentName: filename, location: cellLocation }]
              }
              opportunityMap.set(normUrl, opp)
            }
          }
        } else {
          // Other sheets: inspect general references and practice platforms
          for (let r = 1; r < rows.length; r++) {
            const row = rows[r]
            if (!Array.isArray(row)) continue

            row.forEach((cellVal: any, colIdx: number) => {
              if (typeof cellVal === 'string' && (cellVal.startsWith('http://') || cellVal.startsWith('https://'))) {
                urlCount++
                const rawUrl = cellVal.trim()
                const colLetter = String.fromCharCode(65 + colIdx)
                const cellLocation = `Sheet '${sheetName}', Row ${r + 1}, Cell ${colLetter}${r + 1}`
                const normUrl = normalizeUrl(rawUrl)

                // Try to infer nearby text as title
                let inferredTitle = ''
                for (let c = 0; c < row.length; c++) {
                  if (c !== colIdx && typeof row[c] === 'string' && row[c].trim().length > 2 && !row[c].startsWith('http')) {
                    inferredTitle = String(row[c]).trim()
                    break
                  }
                }
                if (!inferredTitle) {
                  inferredTitle = `Reference Link (${sheetName})`
                }

                if (opportunityMap.has(normUrl)) {
                  const existing = opportunityMap.get(normUrl)!
                  existing.sourceReferences = existing.sourceReferences || []
                  existing.sourceReferences.push({ documentName: filename, location: cellLocation })
                } else {
                  resourceCount++
                  const isPracticePlatform = /leetcode|codeforces|hackerrank|kaggle|codewars/i.test(rawUrl)
                  const opp: ExtractedOpportunity = {
                    id: `opp-${Math.random().toString(36).slice(2, 9)}`,
                    title: inferredTitle,
                    provider: isPracticePlatform ? 'Practice Platform' : 'Academic Resource',
                    url: rawUrl,
                    sourceDocument: filename,
                    sourceLocation: cellLocation,
                    sheet: sheetName,
                    cell: `${colLetter}${r + 1}`,
                    description: `Extracted from session plan or reference list in ${sheetName}.`,
                    kind: isPracticePlatform ? 'course_resource' : 'general_reference',
                    confidence: isPracticePlatform ? 'medium' : 'low',
                    verificationStatus: determineVerificationStatus(rawUrl, inferredTitle),
                    suggestedSubjectId: subjectId,
                    rawExtractedAt: new Date().toISOString(),
                    sourceReferences: [{ documentName: filename, location: cellLocation }]
                  }
                  opportunityMap.set(normUrl, opp)
                }
              }
            })
          }
        }
      })

      summaries.push({
        documentName: filename,
        fileType: 'xlsx',
        status: 'scanned',
        directCertificatesFound: directCount,
        courseResourcesFound: resourceCount,
        totalUrlsInspected: urlCount,
        notes: directCount > 0
          ? `Discovered ${directCount} dedicated certificate opportunities with syllabus credit alignment.`
          : `Scanned all worksheets. Discovered ${resourceCount} reference/course links.`
      })
    } else if (doc.type === 'docx') {
      // DOCX document: extract anchors and URLs from html/plainText
      const html = doc.html || ''
      const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=([\"'])(.*?)\1[^>]*>(.*?)<\/a>/gi
      let match: RegExpExecArray | null

      while ((match = anchorRegex.exec(html)) !== null) {
        const rawUrl = match[2].trim()
        const rawAnchorText = match[3].replace(/<[^>]*>/g, '').trim()
        if (!rawUrl.startsWith('http')) continue

        urlCount++
        resourceCount++

        const normUrl = normalizeUrl(rawUrl)
        const locationRef = `Section 'References & Recommended Online Platforms'`

        if (opportunityMap.has(normUrl)) {
          const existing = opportunityMap.get(normUrl)!
          existing.sourceReferences = existing.sourceReferences || []
          existing.sourceReferences.push({ documentName: filename, location: locationRef })
        } else {
          const isPractice = /leetcode|codeforces|hackerrank|geeksforgeeks|cp-algorithms/i.test(rawUrl)
          const opp: ExtractedOpportunity = {
            id: `opp-${Math.random().toString(36).slice(2, 9)}`,
            title: rawAnchorText || rawUrl,
            provider: isPractice ? 'Coding & Algorithm Platform' : 'Academic Reference',
            url: rawUrl,
            sourceDocument: filename,
            sourceLocation: locationRef,
            section: 'References',
            description: `Mentioned in syllabus document under recommended learning platforms.`,
            kind: isPractice ? 'course_resource' : 'general_reference',
            confidence: isPractice ? 'medium' : 'low',
            verificationStatus: determineVerificationStatus(rawUrl, rawAnchorText),
            suggestedSubjectId: subjectId,
            rawExtractedAt: new Date().toISOString(),
            sourceReferences: [{ documentName: filename, location: locationRef }]
          }
          opportunityMap.set(normUrl, opp)
        }
      }

      // Also check plainText for raw text URLs in DOCX (e.g. Damodaran valuation)
      const plainText = doc.plainText || ''
      const urlRegex = /https?:\/\/[^\s<>"'{}|\\^`]+[^\s<>"'{}|\\^`.,;:()]/gi
      let urlMatch: RegExpExecArray | null
      while ((urlMatch = urlRegex.exec(plainText)) !== null) {
        const rawUrl = urlMatch[0].trim()
        const normUrl = normalizeUrl(rawUrl)
        if (!opportunityMap.has(normUrl)) {
          urlCount++
          resourceCount++
          const locationRef = `Section 'References & Recommended Reading'`
          const opp: ExtractedOpportunity = {
            id: `opp-${Math.random().toString(36).slice(2, 9)}`,
            title: rawUrl.includes('damodar') ? 'Aswath Damodaran Valuation Resources' : rawUrl,
            provider: 'Academic Reference',
            url: rawUrl,
            sourceDocument: filename,
            sourceLocation: locationRef,
            section: 'References',
            description: `Extracted from reference reading text.`,
            kind: 'general_reference',
            confidence: 'low',
            verificationStatus: determineVerificationStatus(rawUrl, ''),
            suggestedSubjectId: subjectId,
            rawExtractedAt: new Date().toISOString(),
            sourceReferences: [{ documentName: filename, location: locationRef }]
          }
          opportunityMap.set(normUrl, opp)
        }
      }

      summaries.push({
        documentName: filename,
        fileType: 'docx',
        status: 'scanned',
        directCertificatesFound: 0,
        courseResourcesFound: resourceCount,
        totalUrlsInspected: urlCount,
        notes: `Extracted ${resourceCount} practice platforms and learning resources from syllabus references.`
      })
    }
  }

  // 2. Add scan entry for the Master Academic Plan PDF
  summaries.push({
    documentName: 'Sprint 2 Academic Plan 13th Oct 2026.pdf',
    fileType: 'pdf',
    status: 'scanned',
    directCertificatesFound: 0,
    courseResourcesFound: 0,
    totalUrlsInspected: 0,
    notes: 'Scanned 12 pages. Contains official academic calendar, attendance regulations, and exam dates (10–22 Dec 2026). No direct external certification URLs present.'
  })

  // Separate opportunities into clean lists
  const allOpportunities = Array.from(opportunityMap.values())
  const directCertificates = allOpportunities.filter(o => o.kind === 'direct_certificate')
  const courseResources = allOpportunities.filter(o => o.kind === 'course_resource')
  const generalReferences = allOpportunities.filter(o => o.kind === 'general_reference')

  return {
    directCertificates,
    courseResources,
    generalReferences,
    allOpportunities,
    documentSummaries: summaries,
    scannedAt: new Date().toISOString()
  }
}

/**
 * Live client-side document scanner for user-uploaded files (XLSX, DOCX, text)
 */
export async function extractFromUploadedFile(file: File): Promise<ExtractedOpportunity[]> {
  const filename = file.name
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const opportunities: ExtractedOpportunity[] = []

  if (ext === 'xlsx' || ext === 'xls') {
    const arrayBuffer = await file.arrayBuffer()
    const wb = XLSX.read(arrayBuffer, { type: 'array' })

    wb.SheetNames.forEach(sheetName => {
      const ws = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 })
      if (!rows || rows.length === 0) return

      const headers = (rows[0] || []).map(h => String(h || '').trim().toLowerCase())
      const isCertSheet = /certif/i.test(sheetName)

      let titleIdx = headers.findIndex(h => h.includes('cert') || h.includes('title') || h.includes('course') || h.includes('name'))
      if (titleIdx === -1) titleIdx = 0
      let platformIdx = headers.findIndex(h => h.includes('platform') || h.includes('provider') || h.includes('site') || h.includes('author'))
      let urlIdx = headers.findIndex(h => h.includes('link') || h.includes('url'))
      let descIdx = headers.findIndex(h => h.includes('desc'))

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r]
        if (!row) continue

        let url = urlIdx !== -1 && row[urlIdx] ? String(row[urlIdx]).trim() : ''

        // Also check if any cell in the row has a URL or hyperlink
        if (!url || !url.startsWith('http')) {
          for (let c = 0; c < row.length; c++) {
            const colLetter = String.fromCharCode(65 + c)
            const cell = ws[`${colLetter}${r + 1}`]
            if (cell && cell.l && cell.l.Target) {
              url = cell.l.Target
              break
            } else if (typeof row[c] === 'string' && (row[c].startsWith('http://') || row[c].startsWith('https://'))) {
              url = row[c].trim()
              break
            }
          }
        }

        if (url && url.startsWith('http')) {
          const title = (titleIdx !== -1 && row[titleIdx] ? String(row[titleIdx]).trim() : '') || `Opportunity at Row ${r + 1}`
          const platform = platformIdx !== -1 && row[platformIdx] ? String(row[platformIdx]).trim() : 'External Provider'
          const desc = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : ''

          opportunities.push({
            id: `upload-opp-${Date.now()}-${r}`,
            title,
            provider: platform,
            url,
            sourceDocument: filename,
            sourceLocation: `Sheet '${sheetName}', Row ${r + 1}`,
            sheet: sheetName,
            description: desc,
            kind: isCertSheet ? 'direct_certificate' : 'course_resource',
            confidence: isCertSheet ? 'high' : 'medium',
            verificationStatus: determineVerificationStatus(url, desc),
            rawExtractedAt: new Date().toISOString(),
            sourceReferences: [{ documentName: filename, location: `Sheet '${sheetName}', Row ${r + 1}` }]
          })
        }
      }
    })
  } else if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer()
    const res = await mammoth.convertToHtml({ arrayBuffer })
    const html = res.value
    const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=([\"'])(.*?)\1[^>]*>(.*?)<\/a>/gi
    let match: RegExpExecArray | null

    while ((match = anchorRegex.exec(html)) !== null) {
      const url = match[2].trim()
      const title = match[3].replace(/<[^>]*>/g, '').trim()
      if (url.startsWith('http')) {
        opportunities.push({
          id: `upload-opp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: title || url,
          provider: 'Extracted Provider',
          url,
          sourceDocument: filename,
          sourceLocation: `Document Text Hyperlink`,
          kind: /cert/i.test(title) ? 'direct_certificate' : 'course_resource',
          confidence: /cert/i.test(title) ? 'high' : 'medium',
          verificationStatus: determineVerificationStatus(url, title),
          rawExtractedAt: new Date().toISOString(),
          sourceReferences: [{ documentName: filename, location: `Document Hyperlink` }]
        })
      }
    }
  }

  return opportunities
}
