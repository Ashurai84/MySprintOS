/**
 * Subject identification and faculty mapping utility for SprintOS
 * Ensures consistent canonical subject IDs (S5-CS01, S5-AI01, etc.)
 * across all cards, views, and historical records.
 */

export const SUBJECT_ID_MAP: Record<string, string> = {
  // Data Structures & Algorithms III
  'dsa-3': 'S5-CS01',
  'dsa3': 'S5-CS01',
  'dsa-iii': 'S5-CS01',
  'dsa iii': 'S5-CS01',
  's5-cs01': 'S5-CS01',
  'S5-CS01': 'S5-CS01',
  'data structures and algorithms iii': 'S5-CS01',
  'data structures & algorithms iii': 'S5-CS01',
  'data structures and algorithms - iii': 'S5-CS01',
  'data structures & algorithm - iii': 'S5-CS01',
  'data structures & algorithm iii': 'S5-CS01',
  'data structures and algorithm - iii': 'S5-CS01',
  'data structures & algorithms': 'S5-CS01',

  // LLMs, RAG & Agentic AI
  'llm-rag-agentic-ai': 'S5-AI01',
  's5-ai01': 'S5-AI01',
  'S5-AI01': 'S5-AI01',
  's5-cs02': 'S5-AI01',
  'S5-CS02': 'S5-AI01',
  'llms, rag & agentic ai': 'S5-AI01',
  'llm, rag & agentic ai': 'S5-AI01',
  'llms rag and agentic ai': 'S5-AI01',
  'llms, rag and agentic ai': 'S5-AI01',
  'llms': 'S5-AI01',
  'llm': 'S5-AI01',

  // Software Testing & Quality Assurance
  'stqa': 'S5-SE01',
  'software-testing-qa': 'S5-SE01',
  's5-se01': 'S5-SE01',
  'S5-SE01': 'S5-SE01',
  's5-cs03': 'S5-SE01',
  'S5-CS03': 'S5-SE01',
  'software testing & quality assurance': 'S5-SE01',
  'software testing and quality assurance': 'S5-SE01',
  'software testing & qa': 'S5-SE01',
  'software testing': 'S5-SE01',

  // Venture Capital & Product Strategy
  'venture-product-strategy': 'S5-MG01',
  's5-mg01': 'S5-MG01',
  'S5-MG01': 'S5-MG01',
  's5-ms01': 'S5-MG01',
  'S5-MS01': 'S5-MG01',
  'venture & product strategy': 'S5-MG01',
  'venture and product strategy': 'S5-MG01',
  'venture capital & product strategy': 'S5-MG01',
  'venture capital and product strategy': 'S5-MG01',

  // Career Readiness & Leadership
  'career-readiness-leadership': 'S5-SS01',
  's5-ss01': 'S5-SS01',
  'S5-SS01': 'S5-SS01',
  's5-ms02': 'S5-SS01',
  'S5-MS02': 'S5-SS01',
  'career readiness & leadership': 'S5-SS01',
  'career readiness and leadership': 'S5-SS01',
  'carrier readiness & leadership': 'S5-SS01',
  'carrier readiness and leadership': 'S5-SS01',

  // Foundations of AI/ML & Data Science
  'foundation-aiml-ds': 'S5-DS01',
  'foundations-aiml-data-science': 'S5-DS01',
  's5-ds01': 'S5-DS01',
  'S5-DS01': 'S5-DS01',
  's5-cs04': 'S5-DS01',
  'S5-CS04': 'S5-DS01',
  'foundation of ai/ml & data science': 'S5-DS01',
  'foundations of ai/ml & data science': 'S5-DS01',
  'foundations of ai, ml & data science': 'S5-DS01',
  'foundations of ai, ml and data science': 'S5-DS01'
}

/**
 * Returns canonical subject ID (e.g. "S5-CS01" for "dsa-3" or "Data Structures & Algorithm - III")
 */
export function canonicalSubjectId(id?: string): string {
  if (!id) return ''
  const trimmed = id.trim()
  const direct = SUBJECT_ID_MAP[trimmed] || SUBJECT_ID_MAP[trimmed.toLowerCase()]
  if (direct) return direct

  const lower = trimmed.toLowerCase()
  if (/dsa|data\s*structure/i.test(lower)) return 'S5-CS01'
  if (/llm|rag|agentic/i.test(lower)) return 'S5-AI01'
  if (/software\s*testing|quality\s*assurance|stqa/i.test(lower)) return 'S5-SE01'
  if (/venture|product\s*strategy/i.test(lower)) return 'S5-MG01'
  if (/career|carrier|readiness|leadership/i.test(lower)) return 'S5-SS01'
  if (/foundation.*(?:ai|ml|data\s*science)/i.test(lower)) return 'S5-DS01'

  return trimmed
}

/**
 * Returns canonical subject code (e.g. "S5-CS01" for "dsa-3" or "S5-CS01")
 */
export const canonicalSubjectCode = canonicalSubjectId


/**
 * Compares two subject IDs or codes safely across legacy and canonical formats.
 */
export function isSameSubject(idA?: string, idB?: string): boolean {
  if (!idA || !idB) return false
  return canonicalSubjectId(idA) === canonicalSubjectId(idB)
}

/**
 * Official default faculty assignments per verified academic allocations
 */
export const DEFAULT_FACULTY_MAP: Record<string, string> = {
  'S5-CS01': 'Sanjay Sahu (VF)',
  'S5-AI01': 'Dr. Dipanjan',
  'S5-SS01': 'Prof. Amaan',
  'S5-MG01': 'Mr. Vivekanand Jha',
  'S5-SE01': 'Prof. Harshal Juikar',
  'S5-DS01': 'Prof. Sneha Deshmukh'
}

/**
 * Returns verified default faculty for a given subject code/id
 */
export function getDefaultFacultyForSubject(subjectId?: string): string {
  const canonical = canonicalSubjectId(subjectId)
  return DEFAULT_FACULTY_MAP[canonical] || ''
}
