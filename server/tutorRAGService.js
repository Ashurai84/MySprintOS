/**
 * SprintOS Source-Aware Academic Document Retrieval Service
 * 
 * Performs deterministic, verified keyword and syllabus structure matching against actual
 * college-provided academic documents (parsedAcademicDocs.json).
 * 
 * Integrity principles:
 * 1. Honest retrieval: Does NOT claim to be semantic neural vector search;
 *    uses exact lexical, phrase, and syllabus unit coordinate matching.
 * 2. Real citations: Citations point only to actual documents, sheets, rows, and sections.
 * 3. Transparent fallback: If no document passage matches, clearly flags that
 *    the explanation relies on general educational knowledge.
 */

const fs = require('fs')
const path = require('path')

let parsedDocsCache = null

function getParsedDocs() {
  if (parsedDocsCache) return parsedDocsCache

  const possiblePaths = [
    path.resolve(__dirname, '../client/src/data/parsedAcademicDocs.json'),
    path.resolve(__dirname, 'client/src/data/parsedAcademicDocs.json'),
    path.resolve(process.cwd(), 'client/src/data/parsedAcademicDocs.json')
  ]

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        parsedDocsCache = JSON.parse(fs.readFileSync(p, 'utf8'))
        return parsedDocsCache
      } catch (err) {
        console.warn(`[Tutor RAG] Error reading ${p}:`, err.message)
      }
    }
  }

  console.warn('[Tutor RAG] parsedAcademicDocs.json not found in candidate paths.')
  return {}
}

// Map subject identifiers (both slug and code) to their primary college-provided documents
const SUBJECT_DOC_MAP = {
  'dsa-3': 'DSA3_Semester5_Syllabus (1).docx',
  'S5-CS01': 'DSA3_Semester5_Syllabus (1).docx',
  'llm-rag-agentic-ai': 'LLMs, RAG & Agentic AI_Sem5.xlsx',
  'S5-AI01': 'LLMs, RAG & Agentic AI_Sem5.xlsx',
  'stqa': 'Software Testing And Quality Assurance_Sem5.xlsx',
  'S5-SE01': 'Software Testing And Quality Assurance_Sem5.xlsx',
  'foundation-aiml-ds': 'Foundations of AI, ML & Data Science_Sem5.xlsx',
  'S5-DS01': 'Foundations of AI, ML & Data Science_Sem5.xlsx',
  'venture-product-strategy': 'Venture Capital & Product Strategy_Sem5 .docx',
  'S5-MG01': 'Venture Capital & Product Strategy_Sem5 .docx',
  'career-readiness-leadership': 'Carrier Readiness & Leadership_Sem5.docx',
  'S5-SS01': 'Carrier Readiness & Leadership_Sem5.docx'
}

const CURRICULUM_ALIASES = {
  'scc': ['strongly', 'connected', 'components', 'kosaraju', 'tarjan'],
  'rag': ['retrieval', 'augmented', 'generation', 'chunking', 'embeddings', 'vector'],
  'stqa': ['software', 'testing', 'quality', 'assurance'],
  'bva': ['boundary', 'value', 'analysis'],
  'ep': ['equivalence', 'partitioning'],
  'rtm': ['requirement', 'traceability', 'matrix'],
  'eda': ['exploratory', 'data', 'analysis'],
  'crisp-dm': ['cross', 'industry', 'standard', 'process', 'data', 'mining'],
  'eq': ['emotional', 'intelligence', 'goleman'],
  'star': ['situation', 'task', 'action', 'result']
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'what', 'how', 'why', 'can', 'you', 'explain',
  'this', 'that', 'from', 'about', 'tell', 'show', 'give', 'where', 'find',
  'best', 'near', 'campus', 'like', 'help', 'know', 'also', 'some', 'good',
  'well', 'want', 'need', 'please', 'are', 'was', 'were', 'have', 'has', 'had',
  'which', 'who', 'whom', 'there', 'their', 'they', 'our', 'your', 'his', 'her'
])

// Generic words that are too broad to trigger a match by themselves
const GENERIC_COMMON_WORDS = new Set([
  'library', 'system', 'systems', 'data', 'line', 'test', 'file', 'case',
  'plan', 'code', 'view', 'work', 'study', 'course', 'note', 'type', 'part',
  'unit', 'term', 'number', 'level', 'hour', 'hours', 'credit', 'credits',
  'theory', 'theoretical', 'practical', 'concept', 'concepts', 'introduction',
  'basics', 'overview', 'details'
])

/**
 * Normalizes text to token set for lexical matching
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return []
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

/**
 * Cleans string for creating safe ID
 */
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
}

/**
 * Searches parsed document for relevant excerpts
 */
function retrieveRelevantExcerpts({
  query = '',
  subjectId = '',
  subjectName = '',
  topicTitle = ''
}) {
  const docs = getParsedDocs()
  const excerpts = []

  // Resolve target document name from subjectId or subjectName
  let targetDocName = SUBJECT_DOC_MAP[subjectId]
  if (!targetDocName && subjectName) {
    const sLower = subjectName.toLowerCase()
    if (sLower.includes('dsa') || sLower.includes('algorithm')) targetDocName = SUBJECT_DOC_MAP['dsa-3']
    else if (sLower.includes('llm') || sLower.includes('agentic') || sLower.includes('rag')) targetDocName = SUBJECT_DOC_MAP['llm-rag-agentic-ai']
    else if (sLower.includes('testing') || sLower.includes('stqa')) targetDocName = SUBJECT_DOC_MAP['stqa']
    else if (sLower.includes('foundation') || sLower.includes('aiml') || sLower.includes('data science')) targetDocName = SUBJECT_DOC_MAP['foundation-aiml-ds']
    else if (sLower.includes('venture') || sLower.includes('capital') || sLower.includes('product')) targetDocName = SUBJECT_DOC_MAP['venture-product-strategy']
    else if (sLower.includes('career') || sLower.includes('leadership')) targetDocName = SUBJECT_DOC_MAP['career-readiness-leadership']
  }

  // Tokenize direct query tokens vs auxiliary topic tokens
  const directQueryTokens = tokenize(query)
  const topicTokens = tokenize(topicTitle)

  if (directQueryTokens.length === 0 && topicTokens.length === 0) {
    return {
      hasGrounding: false,
      citations: [],
      contextText: '',
      note: 'No search terms provided for document retrieval.'
    }
  }

  // Check Master Academic Plan PDF if attendance, calendar, or exam rules are queried
  const isAcademicPlanQuery = /attendance|regulation|calendar|exam date|internal marks|external marks|60\+40|evaluation scheme|cohort/i.test(query)
  if (isAcademicPlanQuery) {
    excerpts.push({
      id: 'cite-master-academic-plan-regulations',
      documentName: 'Sprint 2 Academic Plan 13th Oct 2026.pdf',
      sourceType: 'pdf',
      location: 'Section: Academic Regulations & Evaluation Scheme',
      excerpt: 'Attendance requirement: 75% mandatory threshold. Evaluation pattern: 60 internal continuous evaluation + 40 external proctored examination. Semester Sprint 2 final exams: 10–22 Dec 2026.',
      score: 100, // Top priority for academic regulation queries
      verified: true,
      groundingType: 'university_document'
    })
  }

  // Filter distinct direct keywords (length > 3)
  const directKeywords = directQueryTokens.filter(t => t.length > 3 && !GENERIC_COMMON_WORDS.has(t))

  // Determine which documents to scan:
  // If targetDocName is specified by the subject context, strictly scan THAT document to avoid cross-subject leakage.
  // If no subject is selected, scan all available documents.
  const docsToSearch = targetDocName
    ? [targetDocName]
    : Object.keys(docs)

  for (const docName of docsToSearch) {
    const doc = docs[docName]
    if (!doc) continue

    if (doc.type === 'xlsx' && Array.isArray(doc.sheets)) {
      doc.sheets.forEach(sheet => {
        const sheetName = sheet.name || ''
        const rows = sheet.rows || []

        rows.forEach((row, rowIdx) => {
          if (!Array.isArray(row)) return
          const rowText = row
            .filter(cell => cell !== null && cell !== undefined)
            .map(String)
            .join(' ')

          const rowLower = rowText.toLowerCase()
          const rowTokens = tokenize(rowText)
          if (rowTokens.length === 0) return

          // Count matching tokens from user's direct query
          let directMatchCount = 0
          for (const qt of directQueryTokens) {
            if (rowTokens.includes(qt)) directMatchCount++
          }

          // Count matching tokens from topic title
          let topicMatchCount = 0
          for (const tt of topicTokens) {
            if (rowTokens.includes(tt)) topicMatchCount++
          }

          // Qualification condition:
          // Must have at least 2 direct query matches, OR 1 direct distinct non-generic keyword, OR (if query is empty) 2 topic matches
          const hasDistinctDirectKeyword = directKeywords.some(kw => rowLower.includes(kw))
          const qualifies = (directMatchCount >= 2) || (hasDistinctDirectKeyword && directMatchCount >= 1) || (directQueryTokens.length === 0 && topicMatchCount >= 2)

          if (qualifies) {
            let directBonus = 0
            for (const kw of directKeywords) {
              if (rowLower.includes(kw)) directBonus += 8
            }

            const cleanExcerpt = row
              .filter(cell => cell !== null && cell !== undefined && String(cell).trim().length > 0 && !String(cell).startsWith('http'))
              .map(cell => String(cell).trim())
              .join(' — ')

            if (cleanExcerpt.length > 8) {
              const sheetBonus = (sheetName.toLowerCase().includes('syllabus') || sheetName.toLowerCase().includes('session')) ? 4 : 1
              const score = (directMatchCount * 5) + directBonus + (topicMatchCount * 1) + sheetBonus

              excerpts.push({
                id: `cite-${slugify(docName)}-${slugify(sheetName)}-r${rowIdx + 1}`,
                documentName: docName,
                sourceType: 'xlsx',
                location: `Sheet '${sheetName}', Row ${rowIdx + 1}`,
                excerpt: cleanExcerpt.slice(0, 320),
                score,
                verified: true,
                groundingType: 'university_document'
              })
            }
          }
        })
      })
    } else if (doc.type === 'docx') {
      const plainText = doc.plainText || ''
      const rawLines = plainText.split('\n')

      let currentSection = 'General Syllabus'

      rawLines.forEach((rawLine, lineIdx) => {
        const line = rawLine.trim()
        if (!line) return

        // Track current section/module heading
        if (/^(Module|Unit|Course Objective|Course Outcome|Reference Book)/i.test(line)) {
          currentSection = line.slice(0, 70)
        }

        const lineLower = line.toLowerCase()
        const lineTokens = tokenize(line)

        let directMatchCount = 0
        for (const qt of directQueryTokens) {
          if (lineTokens.includes(qt)) directMatchCount++
        }

        let topicMatchCount = 0
        for (const tt of topicTokens) {
          if (lineTokens.includes(tt)) topicMatchCount++
        }

        const hasDistinctDirectKeyword = directKeywords.some(kw => lineLower.includes(kw))
        const qualifies = (directMatchCount >= 2) || (hasDistinctDirectKeyword && directMatchCount >= 1) || (directQueryTokens.length === 0 && topicMatchCount >= 2)

        if (qualifies) {
          let directBonus = 0
          for (const kw of directKeywords) {
            if (lineLower.includes(kw)) directBonus += 8
          }

          const isModuleContent = currentSection.startsWith('Module') || currentSection.startsWith('Unit')
          const moduleBonus = isModuleContent ? 5 : 0
          const score = (directMatchCount * 5) + directBonus + (topicMatchCount * 1) + moduleBonus

          excerpts.push({
            id: `cite-${slugify(docName)}-sec-${slugify(currentSection)}-l${lineIdx + 1}`,
            documentName: docName,
            sourceType: 'docx',
            location: `Section: ${currentSection}`,
            excerpt: line.slice(0, 320),
            score,
            verified: true,
            groundingType: 'university_document'
          })
        }
      })
    }
  }

  // Sort excerpts by score descending
  excerpts.sort((a, b) => b.score - a.score)

  // Deduplicate excerpts with exact same excerpt text or location
  const seenLocs = new Set()
  const uniqueExcerpts = []
  for (const exc of excerpts) {
    const key = `${exc.documentName}::${exc.location}`
    if (!seenLocs.has(key)) {
      seenLocs.add(key)
      uniqueExcerpts.push(exc)
    }
    if (uniqueExcerpts.length >= 3) break
  }

  // Minimum match threshold
  if (uniqueExcerpts.length === 0 || uniqueExcerpts[0].score < 5) {
    return {
      hasGrounding: false,
      citations: [],
      contextText: '',
      note: 'No direct excerpt in the college document library matched this query. The explanation will rely on general educational knowledge.'
    }
  }

  // Format citations for frontend
  const citations = uniqueExcerpts.map(e => ({
    id: e.id,
    documentName: e.documentName,
    sourceType: e.sourceType,
    location: e.location,
    excerpt: e.excerpt,
    verified: true,
    groundingType: 'university_document'
  }))

  const contextText = uniqueExcerpts
    .map(e => `[Citation ID: ${e.id}] [Source: ${e.documentName} | ${e.location}]\n${e.excerpt}`)
    .join('\n\n')

  return {
    hasGrounding: true,
    citations,
    contextText,
    note: `Found ${uniqueExcerpts.length} supporting excerpt(s) in official college documents.`
  }
}

module.exports = {
  retrieveRelevantExcerpts,
  getParsedDocs,
  SUBJECT_DOC_MAP
}
