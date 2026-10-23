/**
 * SprintOS Single Source of Truth for Faculty Roster
 * Faculty records are referenced by ID across timetable, lectures, and subjects.
 */

export interface FacultyMember {
  id: string
  name: string
  title: string
  defaultSubjectId: string
  email?: string
}

export const FACULTY_ROSTER: FacultyMember[] = [
  {
    id: 'fac-sanjay',
    name: 'Sanjay Sahu (VF)',
    title: 'Visiting Faculty',
    defaultSubjectId: 'S5-CS01'
  },
  {
    id: 'fac-dipanjan',
    name: 'Dr. Dipanjan Biswas',
    title: 'Associate Professor',
    defaultSubjectId: 'S5-AI01'
  },
  {
    id: 'fac-muskan',
    name: 'Ms. Muskan',
    title: 'Assistant Professor',
    defaultSubjectId: 'S5-SE01'
  },
  {
    id: 'fac-vivekanand',
    name: 'Mr. Vivekanand Jha',
    title: 'Industry Mentor & Faculty',
    defaultSubjectId: 'S5-MG01'
  },
  {
    id: 'fac-shreya',
    name: 'Prof. Shreya Raokhonde',
    title: 'Assistant Professor',
    defaultSubjectId: 'S5-DS01'
  },
  {
    id: 'fac-amaan',
    name: 'Prof. Amaan',
    title: 'Faculty & Placement Lead',
    defaultSubjectId: 'S5-SS01'
  }
]

export const FACULTY_BY_ID: Record<string, FacultyMember> = Object.fromEntries(
  FACULTY_ROSTER.map(f => [f.id, f])
)

export const FACULTY_BY_SUBJECT: Record<string, FacultyMember> = Object.fromEntries(
  FACULTY_ROSTER.map(f => [f.defaultSubjectId, f])
)

/**
 * Resolves verified faculty name from faculty ID or subject ID.
 * Always prefers the single source of truth over free-text copies.
 */
export function resolveFacultyName(facultyId?: string, subjectId?: string, fallbackText?: string): string {
  if (facultyId && FACULTY_BY_ID[facultyId]) {
    return FACULTY_BY_ID[facultyId].name
  }
  if (subjectId) {
    const subClean = subjectId.toUpperCase()
    if (FACULTY_BY_SUBJECT[subClean]) {
      return FACULTY_BY_SUBJECT[subClean].name
    }
  }
  // If fallback text is provided, normalize known variations
  if (fallbackText) {
    const lower = fallbackText.toLowerCase()
    if (lower.includes('sanjay')) return 'Sanjay Sahu (VF)'
    if (lower.includes('dipanjan')) return 'Dr. Dipanjan Biswas'
    if (lower.includes('muskan')) return 'Ms. Muskan'
    if (lower.includes('vivekanand')) return 'Mr. Vivekanand Jha'
    if (lower.includes('shreya')) return 'Prof. Shreya Raokhonde'
    if (lower.includes('amaan')) return 'Prof. Amaan'
    return fallbackText.trim()
  }
  return ''
}

/**
 * Resolves verified faculty ID from subject ID or faculty name.
 */
export function resolveFacultyId(subjectId?: string, facultyName?: string): string | undefined {
  if (subjectId && FACULTY_BY_SUBJECT[subjectId.toUpperCase()]) {
    return FACULTY_BY_SUBJECT[subjectId.toUpperCase()].id
  }
  if (facultyName) {
    const lower = facultyName.toLowerCase()
    if (lower.includes('sanjay')) return 'fac-sanjay'
    if (lower.includes('dipanjan')) return 'fac-dipanjan'
    if (lower.includes('muskan')) return 'fac-muskan'
    if (lower.includes('vivekanand')) return 'fac-vivekanand'
    if (lower.includes('shreya')) return 'fac-shreya'
    if (lower.includes('amaan')) return 'fac-amaan'
  }
  return undefined
}
