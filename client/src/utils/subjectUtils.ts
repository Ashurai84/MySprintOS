/**
 * Subject identification and faculty mapping utility for SprintOS
 * Ensures consistent canonical subject IDs (S5-CS01, S5-AI01, etc.)
 * across all cards, views, and historical records.
 */

export const SUBJECT_ID_MAP: Record<string, string> = {
  // Data Structures & Algorithms III
  'dsa-3': 'S5-CS01',
  's5-cs01': 'S5-CS01',
  'S5-CS01': 'S5-CS01',

  // LLMs, RAG & Agentic AI
  'llm-rag-agentic-ai': 'S5-AI01',
  's5-ai01': 'S5-AI01',
  'S5-AI01': 'S5-AI01',

  // Software Testing & Quality Assurance
  'stqa': 'S5-SE01',
  's5-se01': 'S5-SE01',
  'S5-SE01': 'S5-SE01',

  // Venture Capital & Product Strategy
  'venture-product-strategy': 'S5-MG01',
  's5-mg01': 'S5-MG01',
  'S5-MG01': 'S5-MG01',

  // Career Readiness & Leadership
  'career-readiness-leadership': 'S5-SS01',
  's5-ss01': 'S5-SS01',
  'S5-SS01': 'S5-SS01',

  // Foundations of AI/ML & Data Science
  'foundation-aiml-ds': 'S5-DS01',
  's5-ds01': 'S5-DS01',
  'S5-DS01': 'S5-DS01'
}

/**
 * Returns canonical subject ID (e.g. "S5-CS01" for "dsa-3" or "S5-CS01")
 */
export function canonicalSubjectId(id?: string): string {
  if (!id) return ''
  const trimmed = id.trim()
  return SUBJECT_ID_MAP[trimmed] || SUBJECT_ID_MAP[trimmed.toLowerCase()] || trimmed
}

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
