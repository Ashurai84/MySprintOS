import rawAcademicData from './academicData.json'
import { officialDocuments } from './officialDocs'
import type { 
  Subject, 
  Task, 
  Certification, 
  ResourceItem, 
  StudySession, 
  SubjectAttendance, 
  SubjectInternalMarks,
  StudentProfile,
  SubjectNote,
  Lecture,
  TopicLearningRecord,
  AcademicSettings,
  AppDocument,
  RevisionSession,
  TimetableEntry,
  JavaDiagnosticQuestion,
  JavaTopicRecovery,
  EmailReportSettings,
  EnhancedCourse
} from '../types'

import { 
  canonicalSubjectId, 
  getDefaultFacultyForSubject 
} from '../utils/subjectUtils'

export const academicData = rawAcademicData

// The 6 active subjects explicitly designated for SprintOS 2.0 Elon Musk cohort:
export const ACTIVE_SUBJECT_IDS = [
  'S5-CS01',
  'S5-AI01',
  'S5-SE01',
  'S5-MG01',
  'S5-DS01',
  'S5-SS01',
  'dsa-3',
  'llm-rag-agentic-ai',
  'stqa',
  'venture-product-strategy',
  'foundation-aiml-ds',
  'career-readiness-leadership'
]

// Subjects augmented with direct official document references and filtered to the 6 in scope
export const initialSubjects: Subject[] = (rawAcademicData.subjects as Subject[])
  .filter(sub => ACTIVE_SUBJECT_IDS.includes(sub.id) || ACTIVE_SUBJECT_IDS.includes(sub.code))
  .map(sub => {
    const canonicalId = sub.code || canonicalSubjectId(sub.id)
    const verifiedFaculty = getDefaultFacultyForSubject(canonicalId) || sub.faculty
    let docUrl = ''
    let docFilename = ''
    let docType: 'xlsx' | 'docx' | 'pdf' = 'pdf'
    let docSize = ''

    if (canonicalId === 'S5-AI01' || sub.id === 'llm-rag-agentic-ai') {
      docUrl = '/syllabus-docs/LLMs, RAG & Agentic AI_Sem5.xlsx'
      docFilename = 'LLMs, RAG & Agentic AI_Sem5.xlsx'
      docType = 'xlsx'
      docSize = '270 KB'
    } else if (canonicalId === 'S5-CS01' || sub.id === 'dsa-3') {
      docUrl = '/syllabus-docs/DSA3_Semester5_Syllabus (1).docx'
      docFilename = 'DSA3_Semester5_Syllabus (1).docx'
      docType = 'docx'
      docSize = '160 KB'
    } else if (canonicalId === 'S5-SE01' || sub.id === 'stqa') {
      docUrl = '/syllabus-docs/Software Testing And Quality Assurance_Sem5.xlsx'
      docFilename = 'Software Testing And Quality Assurance_Sem5.xlsx'
      docType = 'xlsx'
      docSize = '84 KB'
    } else if (canonicalId === 'S5-DS01' || sub.id === 'foundation-aiml-ds') {
      docUrl = '/syllabus-docs/Foundations of AI, ML & Data Science_Sem5.xlsx'
      docFilename = 'Foundations of AI, ML & Data Science_Sem5.xlsx'
      docType = 'xlsx'
      docSize = '154 KB'
    } else if (canonicalId === 'S5-MG01' || sub.id === 'venture-product-strategy') {
      docUrl = '/syllabus-docs/Venture Capital & Product Strategy_Sem5 .docx'
      docFilename = 'Venture Capital & Product Strategy_Sem5 .docx'
      docType = 'docx'
      docSize = '156 KB'
    } else if (canonicalId === 'S5-SS01' || sub.id === 'career-readiness-leadership') {
      docUrl = '/syllabus-docs/Carrier Readiness & Leadership_Sem5.docx'
      docFilename = 'Carrier Readiness & Leadership_Sem5.docx'
      docType = 'docx'
      docSize = '148 KB'
    }

    return {
      ...sub,
      id: canonicalId,
      code: sub.code || canonicalId,
      faculty: verifiedFaculty,
      officialDoc: {
        url: docUrl,
        filename: docFilename,
        type: docType,
        size: docSize
      }
    }
  })

export const initialProfile: StudentProfile = {
  name: 'Ashutosh Rai',
  program: 'B.Tech Computer Science Engineering',
  cohort: 'Elon Musk',
  semester: 'Semester 5',
  sprint: 'Sprint 2',
  batch: '2024–28',
  academicYear: '2026-27'
}

export const initialAcademicSettings: AcademicSettings = {
  minAttendancePercent: 75,
  internalMarksTotal: 60,
  externalMarksTotal: 40,
  internalBreakdown: {
    attendance: 5,
    classParticipation: 5,
    assignments: 30,
    miniProject: 20
  },
  externalBreakdown: {
    theoryExam: 20,
    projectViva: 20
  }
}

// Clean verified attendance: exactly 3 classes attended & held for DSA-3 up to Kosaraju
export const initialAttendance: SubjectAttendance[] = [
  { subjectId: 'S5-CS01', classesAttended: 3, totalClassesHeld: 3 },
  { subjectId: 'S5-AI01', classesAttended: 1, totalClassesHeld: 1 },
  { subjectId: 'S5-SE01', classesAttended: 0, totalClassesHeld: 0 },
  { subjectId: 'S5-MG01', classesAttended: 2, totalClassesHeld: 2 },
  { subjectId: 'S5-DS01', classesAttended: 0, totalClassesHeld: 0 },
  { subjectId: 'S5-SS01', classesAttended: 1, totalClassesHeld: 1 }
]

// SprintOS Verified Lectures: DSA-3 has exactly 3 lectures up to Kosaraju's Algorithm
export const initialLectures: Lecture[] = [
  // 1. DSA-3 Session 1: SCC Overview (Wednesday)
  {
    id: 'lec-dsa-1',
    date: '2026-10-21',
    subjectId: 'S5-CS01',
    title: 'Strongly Connected Components (SCC) Overview',
    faculty: 'Sanjay Sahu (VF)',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    status: 'attended',
    classroom: 'Classroom 37',
    whatILearned: 'Directed graphs connectivity, SCC definitions, maximal strongly connected subgraphs, and DFS traversal concepts.',
    importantConcepts: ['SCC', 'Directed Graphs', 'DFS Traversal'],
    notes: 'Covered SCC definitions and baseline graph properties.',
    createdAt: '2026-10-21T10:00:00Z',
    updatedAt: '2026-10-21T11:00:00Z'
  },
  // 2. DSA-3 Session 2: Unit 2 Graph Algorithms & Strongly Connected Components (Thursday)
  {
    id: 'lec-dsa-2',
    date: '2026-10-22',
    subjectId: 'S5-CS01',
    title: 'Unit 2: Graph Algorithms & Strongly Connected Components',
    faculty: 'Sanjay Sahu (VF)',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    status: 'attended',
    classroom: 'Classroom 37',
    whatILearned: 'Adjacency list representations, topological sorting ideas, finish times in DFS, and Kosaraju algorithm intuition.',
    importantConcepts: ['Adjacency Lists', 'DFS Finish Times', 'Kosaraju Intuition'],
    notes: 'Classroom 37. Unit 2 graph algorithms syllabus alignment.',
    createdAt: '2026-10-22T10:00:00Z',
    updatedAt: '2026-10-22T11:00:00Z'
  },
  // 3. DSA-3 Session 3: Kosaraju\'s Algorithm & Tarjan Low-Link (Thursday)
  {
    id: 'lec-dsa-3',
    date: '2026-10-22',
    subjectId: 'S5-CS01',
    title: "Kosaraju's Algorithm & Tarjan Low-Link",
    faculty: 'Sanjay Sahu (VF)',
    startTime: '11:10',
    endTime: '12:10',
    durationMinutes: 60,
    status: 'attended',
    classroom: 'Classroom 37',
    whatILearned: "Completed Kosaraju's two-pass algorithm using transposed/reversed graph G^T in O(V+E) time. Analyzed Tarjan low-link values comparison.",
    importantConcepts: ["Kosaraju 2-Pass DFS", "Transposed Graph G^T", "Tarjan Low-Link"],
    notes: "Classroom 37. Lecture complete up to Kosaraju's Algorithm.",
    createdAt: '2026-10-22T11:10:00Z',
    updatedAt: '2026-10-22T12:10:00Z'
  },
  // 4. LLM RAG
  {
    id: 'lec-ai-1',
    date: '2026-10-22',
    subjectId: 'S5-AI01',
    title: 'RAG Architecture & Chunking Strategies',
    faculty: 'Dr. Dipanjan',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    status: 'attended',
    classroom: 'Classroom 37',
    whatILearned: 'Document chunking size trade-offs, overlap windows, and hybrid retrieval with cross-encoders.',
    importantConcepts: ['Chunking', 'Vector Embeddings', 'Hybrid Retrieval'],
    notes: 'Classroom 37.',
    createdAt: '2026-10-22T13:00:00Z',
    updatedAt: '2026-10-22T14:00:00Z'
  },
  // 5. Career Readiness
  {
    id: 'lec-ss-1',
    date: '2026-10-22',
    subjectId: 'S5-SS01',
    title: 'Technical Interviewing & Leadership Frameworks',
    faculty: 'Prof. Amaan',
    startTime: '14:00',
    endTime: '15:00',
    durationMinutes: 60,
    status: 'attended',
    classroom: 'Classroom 37',
    whatILearned: 'STAR framework for behavioral and leadership interviews, system design communication.',
    importantConcepts: ['STAR Method', 'Leadership Frameworks'],
    notes: 'Classroom 37.',
    createdAt: '2026-10-22T14:00:00Z',
    updatedAt: '2026-10-22T15:00:00Z'
  },
  // 6. Venture Capital 1
  {
    id: 'lec-vc-1',
    date: '2026-10-22',
    subjectId: 'S5-MG01',
    title: 'Unit 2: Venture Capital Math & Dilution',
    faculty: 'Mr. Vivekanand Jha',
    startTime: '15:00',
    endTime: '16:00',
    durationMinutes: 60,
    status: 'attended',
    classroom: 'Classroom 37',
    whatILearned: 'Pre-money vs post-money valuation math, ESOP pool impact on founder ownership dilution.',
    importantConcepts: ['Pre-money Valuation', 'Post-money Valuation', 'Dilution'],
    notes: 'Classroom 37.',
    createdAt: '2026-10-22T15:00:00Z',
    updatedAt: '2026-10-22T16:00:00Z'
  },
  // 7. Venture Capital 2
  {
    id: 'lec-vc-2',
    date: '2026-10-22',
    subjectId: 'S5-MG01',
    title: 'Cap Table Modeling & Convertible Notes',
    faculty: 'Mr. Vivekanand Jha',
    startTime: '16:00',
    endTime: '17:00',
    durationMinutes: 60,
    status: 'attended',
    classroom: 'Classroom 37',
    whatILearned: 'SAFEs and convertible note conversion mechanisms with valuation caps and discount rates.',
    importantConcepts: ['SAFE Notes', 'Valuation Cap', 'Cap Table'],
    notes: 'Classroom 37.',
    createdAt: '2026-10-22T16:00:00Z',
    updatedAt: '2026-10-22T17:00:00Z'
  }
]

// Learning Progress records per syllabus topic: Kosaraju topic marked as understood
export const initialTopicProgress: Record<string, TopicLearningRecord> = {
  'dsa-m1-1': {
    topicId: 'dsa-m1-1',
    subjectId: 'dsa-3',
    status: 'understood',
    confidenceRating: 5,
    needsRevision: false,
    personalNotes: "Kosaraju's two-pass DFS on graph and transposed graph G^T understood and coded.",
    updatedAt: '2026-10-22T12:00:00Z'
  },
  'dsa-m1-2': {
    topicId: 'dsa-m1-2',
    subjectId: 'dsa-3',
    status: 'learning',
    confidenceRating: 4,
    needsRevision: false,
    personalNotes: 'Tarjan low-link values and articulation points compared with Kosaraju.',
    updatedAt: '2026-10-22T12:15:00Z'
  }
}


// Revision Sessions collection
export const initialRevisionSessions: RevisionSession[] = []

// Marks record
export const initialMarks: SubjectInternalMarks[] = []

// Tasks collection
export const initialTasks: Task[] = []

// Certifications collection
export const initialCertifications: Certification[] = []

// Study sessions (legacy support)
export const initialStudySessions: StudySession[] = []

// Notes
export const initialNotes: SubjectNote[] = []

// Index the 7 verified academic documents into initial AppDocuments
export const initialAppDocuments: AppDocument[] = officialDocuments.map(doc => ({
  id: doc.id,
  title: doc.title,
  filename: doc.filename,
  type: doc.type,
  size: doc.size,
  subjectId: doc.relatedSubjectId,
  tags: doc.isMasterPlan ? ['Master Plan', 'Regulations', 'Timetable'] : ['Official Syllabus', 'Curriculum'],
  uploadDate: '2026-10-13',
  url: doc.url,
  isOfficial: true,
  isUploaded: false
}))

// Verified curriculum resources directly from the syllabus files
export const initialResources: ResourceItem[] = [
  {
    id: 'res-master-pdf',
    title: 'Sprint 2 Academic Plan & Regulation Document (PDF)',
    subjectId: 'llm-rag-agentic-ai',
    type: 'Standard',
    url: '/syllabus-docs/Sprint 2 Academic Plan 13th Oct 2026.pdf',
    description: 'Official master document containing Odd Semesters Sprint 2 regulations, holiday dates, exam timetable (10-22 Dec 2026), and Elon Musk cohort faculty allocations.',
    tags: ['Academic Plan', 'University PDF', 'Regulations', 'Exams'],
    isFavorite: true,
    isVerifiedLink: true,
    createdAt: '2026-10-12T00:00:00Z',
    isSample: false
  },
  {
    id: 'res-1',
    title: 'Attention Is All You Need (Transformer Paper)',
    subjectId: 'llm-rag-agentic-ai',
    type: 'Research Paper',
    url: 'https://arxiv.org/abs/1706.03762',
    description: 'The seminal 2017 paper by Vaswani et al. introducing multi-head self-attention mechanisms and encoder-decoder architecture.',
    tags: ['Transformers', 'GenAI', 'Architecture'],
    isFavorite: true,
    isVerifiedLink: true,
    createdAt: '2026-10-12T00:00:00Z',
    isSample: false
  },
  {
    id: 'res-2',
    title: 'CP-Algorithms: Strongly Connected Components & Tarjan',
    subjectId: 'dsa-3',
    type: 'Guide',
    url: 'https://cp-algorithms.com/graph/strongly-connected-components.html',
    description: 'Algorithmic breakdown and C++ implementation of Kosaraju and Tarjan low-link methods for DSA III.',
    tags: ['Graphs', 'SCC', 'Algorithms', 'Competitive Programming'],
    isFavorite: true,
    isVerifiedLink: true,
    createdAt: '2026-10-12T00:00:00Z',
    isSample: false
  },
  {
    id: 'res-3',
    title: 'OWASP Top 10 Web Application Security Risks',
    subjectId: 'stqa',
    type: 'Standard',
    url: 'https://owasp.org/www-project-top-ten/',
    description: 'Essential security testing reference for web vulnerabilities including injection, broken auth, and security misconfigurations.',
    tags: ['Security', 'Testing', 'OWASP'],
    isFavorite: false,
    isVerifiedLink: true,
    createdAt: '2026-10-12T00:00:00Z',
    isSample: false
  },
  {
    id: 'res-4',
    title: 'Aswath Damodaran: Startup Valuation & Financial Modeling',
    subjectId: 'venture-product-strategy',
    type: 'Guide',
    url: 'http://pages.stern.nyu.edu/~adamodar/',
    description: 'Valuation tables, discount rate calculators, and corporate finance slides by NYU Stern Professor Aswath Damodaran.',
    tags: ['Valuation', 'Finance', 'Startups', 'Cap Table'],
    isFavorite: true,
    isVerifiedLink: true,
    createdAt: '2026-10-12T00:00:00Z',
    isSample: false
  },
  {
    id: 'res-5',
    title: 'LangChain Python Core Documentation',
    subjectId: 'llm-rag-agentic-ai',
    type: 'Documentation',
    url: 'https://python.langchain.com/docs/',
    description: 'Official API reference and guides for chains, LCEL, agents, memory, and vector stores.',
    tags: ['LangChain', 'RAG', 'Python', 'AI Agents'],
    isFavorite: false,
    isVerifiedLink: true,
    createdAt: '2026-10-13T00:00:00Z',
    isSample: false
  }
]

// -------------------------------------------------------------
// SPRINTOS 2.1 TIMETABLE SEED ENTRIES
// -------------------------------------------------------------

export const initialTimetableEntries: TimetableEntry[] = [
  // Wednesday, 21 October 2026 (Verified from timetable screenshot)
  {
    id: 'tt-wed-1',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '11:10',
    endTime: '12:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'prof . Sanjay Sahu (VF)',
    classroom: 'Classroom 37',
    notes: 'Foundations of Agentic Systems'
  },
  {
    id: 'tt-wed-2',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'prof . Sanjay sahu',
    classroom: 'Classroom 37',
    notes: 'Prompt Engineering & Reasoning Models'
  },
  {
    id: 'tt-wed-3',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '12:20',
    endTime: '13:00',
    durationMinutes: 40,
    slotType: 'lunch_break',
    classroom: 'Cafeteria',
    notes: 'University Lunch Break'
  },
  {
    id: 'tt-wed-4',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '15:20',
    endTime: '16:20',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'Dr. Dipanjan Biswas',
    classroom: 'Classroom 37',
    notes: 'Vector Databases & Similarity Search'
  },

  // Thursday, 22 October 2026 (Verified from timetable screenshot)
  {
    id: 'tt-thu-1',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom 37',
    notes: 'Unit 2: Graph Algorithms & Strongly Connected Components'
  },
  {
    id: 'tt-thu-2',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '11:10',
    endTime: '12:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom 37',
    notes: "Kosaraju's Algorithm & Tarjan Low-Link"
  },
  {
    id: 'tt-thu-3',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '12:20',
    endTime: '13:00',
    durationMinutes: 40,
    slotType: 'lunch_break',
    classroom: 'Cafeteria',
    notes: 'University Lunch Break'
  },
  {
    id: 'tt-thu-4',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'Dr. Dipanjan',
    classroom: 'Classroom 37',
    notes: 'RAG Architecture & Chunking Strategies'
  },
  {
    id: 'tt-thu-5',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '14:00',
    endTime: '15:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-SS01',
    faculty: 'Prof. Amaan',
    classroom: 'Classroom 37',
    notes: 'Technical Interviewing & Leadership Frameworks'
  },
  {
    id: 'tt-thu-6',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '15:00',
    endTime: '16:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-MG01',
    faculty: 'Mr. Vivekanand Jha',
    classroom: 'Classroom 37',
    notes: 'Unit 2: Venture Capital Math & Dilution'
  },
  {
    id: 'tt-thu-7',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '16:00',
    endTime: '17:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-MG01',
    faculty: 'Mr. Vivekanand Jha',
    classroom: 'Classroom 37',
    notes: 'Cap Table Modeling & Convertible Notes'
  },

  // Friday, 23 October 2026 (Verified from timetable screenshot)
  {
    id: 'tt-fri-0',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    slotType: 'unassigned',
    classroom: 'Classroom 37',
    notes: 'Independent Study / Unassigned Slot'
  },
  {
    id: 'tt-fri-1',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom 37',
    notes: 'B-Trees & Multiway Search Trees'
  },
  {
    id: 'tt-fri-2',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '11:10',
    endTime: '12:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom 37',
    notes: 'Red-Black Trees Insertion Balancing'
  },
  {
    id: 'tt-fri-3',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '12:20',
    endTime: '13:00',
    durationMinutes: 40,
    slotType: 'lunch_break',
    classroom: 'Cafeteria',
    notes: 'University Lunch Break'
  },
  {
    id: 'tt-fri-4',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'Dr. Dipanjan',
    classroom: 'Classroom 37',
    notes: 'Agentic Tool Calling & LangGraph Flow'
  },
  {
    id: 'tt-fri-5',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '14:10',
    endTime: '15:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'Dr. Dipanjan',
    classroom: 'Classroom 37',
    notes: 'Multi-Agent Consensus & Memory Management'
  },
  {
    id: 'tt-fri-6',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '15:20',
    endTime: '16:20',
    durationMinutes: 60,
    slotType: 'unassigned',
    classroom: 'Classroom 37',
    notes: 'Lab Practice / Unassigned Slot'
  }
]

// -------------------------------------------------------------
// SPRINTOS 2.1 JAVA RECOVERY SEED DATA
// -------------------------------------------------------------

export const initialJavaTopics: JavaTopicRecovery[] = [
  {
    id: 'java-vars',
    title: 'Variables & Data Types',
    category: 'Syntax & Flow',
    description: 'Primitive types (int, double, char, boolean), wrapper classes, type casting, and variable scope rules.',
    keyConcepts: ['Primitive vs Reference types', 'Widening vs Narrowing casting', 'Variable shadowing'],
    codeSnippet: 'int count = 10;\ndouble price = 19.99;\nchar grade = \'A\';\n// Explicit narrowing cast\nint roundedPrice = (int) price;',
    practicePrompt: 'Declare variables for a student management system: studentId (int), gpa (double), isEnrolled (boolean), and print formatted string.',
    status: 'learning',
    confidenceRating: 4,
    needsRevision: false,
    mistakesLogged: ['Confusing float literal (requires f suffix) with double.']
  },
  {
    id: 'java-operators',
    title: 'Operators & Expressions',
    category: 'Syntax & Flow',
    description: 'Arithmetic, relational, logical (short-circuiting && vs &), bitwise operators and operator precedence.',
    keyConcepts: ['Short-circuit evaluation', 'Ternary operator', 'Unary increment prefix vs postfix'],
    codeSnippet: 'int a = 5;\nint b = ++a; // a=6, b=6\nboolean valid = (a > 0) && (b < 10);',
    practicePrompt: 'Implement leap year check using logical operators: divisible by 4, not by 100 unless divisible by 400.',
    status: 'understood',
    confidenceRating: 5,
    needsRevision: false,
    mistakesLogged: []
  },
  {
    id: 'java-conditionals',
    title: 'Conditional Statements',
    category: 'Syntax & Flow',
    description: 'if-else chains, nested conditionals, and switch statements with pattern matching / enhanced switch.',
    keyConcepts: ['Switch fallthrough without break', 'String matching in switch', 'Ternary conditions'],
    codeSnippet: 'String result = switch (grade) {\n  case \'A\' -> "Excellent";\n  case \'B\' -> "Good";\n  default -> "Needs improvement";\n};',
    practicePrompt: 'Write a program to calculate electricity bill slabs using if-else if conditions.',
    status: 'understood',
    confidenceRating: 4,
    needsRevision: false,
    mistakesLogged: []
  },
  {
    id: 'java-loops',
    title: 'Loops & Iteration',
    category: 'Syntax & Flow',
    description: 'for, enhanced for-each, while, do-while, and break/continue control statements.',
    keyConcepts: ['Off-by-one errors in loop boundaries', 'do-while executes at least once', 'Concurrent modification in for-each'],
    codeSnippet: 'int[] nums = {2, 4, 6, 8};\nfor (int n : nums) {\n  System.out.println(n * 2);\n}',
    practicePrompt: 'Print Floyd\'s triangle or reverse the digits of an integer using a while loop.',
    status: 'understood',
    confidenceRating: 4,
    needsRevision: false,
    mistakesLogged: []
  },
  {
    id: 'java-methods',
    title: 'Methods & Recursion',
    category: 'Syntax & Flow',
    description: 'Method signatures, parameters, pass-by-value semantics, method overloading, and base cases in recursion.',
    keyConcepts: ['Java is strictly pass-by-value', 'Method overloading vs overriding', 'StackOverflowError prevention'],
    codeSnippet: 'public static int factorial(int n) {\n  if (n <= 1) return 1; // base case\n  return n * factorial(n - 1);\n}',
    practicePrompt: 'Write an overloaded search method: search(int[] arr, int target) and search(String[] arr, String target).',
    status: 'learning',
    confidenceRating: 3,
    needsRevision: true,
    mistakesLogged: ['Forgot base case in recursive tree traversal causing stack overflow.']
  },
  {
    id: 'java-arrays',
    title: 'Arrays (1D & 2D)',
    category: 'Syntax & Flow',
    description: 'Array allocation in memory, indexing, multidimensional / jagged arrays, and java.util.Arrays utility.',
    keyConcepts: ['Fixed length after creation', 'Arrays.sort() and binarySearch()', 'ArrayIndexOutOfBoundsException'],
    codeSnippet: 'int[][] matrix = new int[3][3];\nmatrix[0][0] = 1;\nArrays.sort(matrix[0]);',
    practicePrompt: 'Rotate an N x N 2D matrix 90 degrees clockwise in-place.',
    status: 'learning',
    confidenceRating: 3,
    needsRevision: false,
    mistakesLogged: []
  },
  {
    id: 'java-strings',
    title: 'Strings & StringBuilder',
    category: 'Syntax & Flow',
    description: 'String immutability, String pool memory, StringBuilder vs StringBuffer for mutable concatenations.',
    keyConcepts: ['== compares references, .equals() compares value', 'String pool optimization', 'StringBuilder for O(N) loops'],
    codeSnippet: 'StringBuilder sb = new StringBuilder();\nfor (int i = 0; i < 5; i++) {\n  sb.append(i).append(" ");\n}\nString result = sb.toString();',
    practicePrompt: 'Check if a string is a palindrome ignoring cases and non-alphanumeric characters.',
    status: 'understood',
    confidenceRating: 5,
    needsRevision: false,
    mistakesLogged: ['Used == to compare String objects instead of .equals().']
  },
  {
    id: 'java-classes-objects',
    title: 'Classes & Objects',
    category: 'OOP Core',
    description: 'Class anatomy, constructors, this keyword, static fields and methods vs instance members.',
    keyConcepts: ['Constructor overloading', 'static memory allocation in Metaspace', 'Encapsulation with getters/setters'],
    codeSnippet: 'public class Student {\n  private String name;\n  private int id;\n  public Student(String name, int id) {\n    this.name = name;\n    this.id = id;\n  }\n}',
    practicePrompt: 'Design a BankAccount class with deposit, withdraw, balance inquiry, and transaction logging.',
    status: 'learning',
    confidenceRating: 4,
    needsRevision: false,
    mistakesLogged: []
  },
  {
    id: 'java-oop-inheritance',
    title: 'Inheritance & Polymorphism',
    category: 'OOP Core',
    description: 'super keyword, single inheritance with extends, method overriding, and runtime dynamic method dispatch.',
    keyConcepts: ['@Override annotation benefits', 'Dynamic method dispatch', 'super() constructor chaining'],
    codeSnippet: 'class Dog extends Animal {\n  @Override\n  public void makeSound() {\n    System.out.println("Bark");\n  }\n}',
    practicePrompt: 'Create an Employee hierarchy (Developer, Manager, Intern) with calculateBonus() overridden per role.',
    status: 'learning',
    confidenceRating: 3,
    needsRevision: true,
    mistakesLogged: ['Invoked child method on a parent reference without downcasting.']
  },
  {
    id: 'java-oop-abstraction',
    title: 'Abstraction & Interfaces',
    category: 'OOP Core',
    description: 'abstract classes vs interfaces, default and static methods in interfaces, multiple interface implementation.',
    keyConcepts: ['Interfaces support multiple inheritance of type', 'Cannot instantiate abstract class', 'default methods'],
    codeSnippet: 'public interface PaymentGateway {\n  void processPayment(double amount);\n  default void logAudit() { System.out.println("Audited"); }\n}',
    practicePrompt: 'Implement Shape interface with Circle and Rectangle classes computing getArea() and getPerimeter().',
    status: 'learning',
    confidenceRating: 3,
    needsRevision: true,
    mistakesLogged: []
  },
  {
    id: 'java-exceptions',
    title: 'Exception Handling',
    category: 'Data Structures & I/O',
    description: 'Checked vs unchecked exceptions, try-catch-finally, try-with-resources, and custom exception classes.',
    keyConcepts: ['Checked exceptions must be caught or declared', 'try-with-resources closes AutoCloseable', 'Custom exceptions'],
    codeSnippet: 'try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {\n  String line = br.readLine();\n} catch (IOException e) {\n  System.err.println("Read failed: " + e.getMessage());\n}',
    practicePrompt: 'Create an InsufficientBalanceException and throw it when withdrawal exceeds balance.',
    status: 'learning',
    confidenceRating: 3,
    needsRevision: true,
    mistakesLogged: ['Catching generic Exception instead of specific IOException/SQLException.']
  },
  {
    id: 'java-collections',
    title: 'Collections Framework',
    category: 'Data Structures & I/O',
    description: 'ArrayList, LinkedList, HashSet, TreeSet, HashMap, TreeMap, and PriorityQueue operations.',
    keyConcepts: ['HashMap O(1) average lookup vs TreeMap O(log N)', 'equals() and hashCode() contract in HashSet/HashMap', 'Iterator usage'],
    codeSnippet: 'Map<String, Integer> map = new HashMap<>();\nmap.put("DSA3", 45);\nmap.put("AI", 30);\nfor (Map.Entry<String, Integer> e : map.entrySet()) {\n  System.out.println(e.getKey() + ": " + e.getValue());\n}',
    practicePrompt: 'Find the frequency of words in a sentence using HashMap<String, Integer>.',
    status: 'learning',
    confidenceRating: 4,
    needsRevision: false,
    mistakesLogged: ['Forgot to implement hashCode() after overriding equals() in a custom key object.']
  },
  {
    id: 'java-file-io',
    title: 'File Handling & Streams',
    category: 'Data Structures & I/O',
    description: 'File reading and writing using java.nio.file.Files, Path, BufferedReader, and modern Streams API.',
    keyConcepts: ['NIO Files.readAllLines() for small files', 'Buffering for performance', 'Character vs Byte streams'],
    codeSnippet: 'Path path = Paths.get("notes.txt");\nFiles.writeString(path, "SprintOS Study Log", StandardOpenOption.CREATE);',
    practicePrompt: 'Read a CSV file of student grades, parse each line, and print the top 3 scoring students.',
    status: 'not_started',
    confidenceRating: 2,
    needsRevision: true,
    mistakesLogged: []
  },
  {
    id: 'java-generics',
    title: 'Generics & Type Safety',
    category: 'Data Structures & I/O',
    description: 'Generic classes, methods, bounded type parameters (<T extends Comparable<T>>), wildcards (? super, ? extends), and type erasure.',
    keyConcepts: ['Compile-time type safety', 'PECS rule: Producer Extends, Consumer Super', 'Type erasure at runtime'],
    codeSnippet: 'public class Box<T> {\n  private T value;\n  public void set(T val) { this.value = val; }\n  public T get() { return value; }\n}',
    practicePrompt: 'Implement a generic Pair<K, V> class and write a generic method to swap elements in an array.',
    status: 'learning',
    confidenceRating: 3,
    needsRevision: true,
    mistakesLogged: ['Attempted to create generic array new T[10] which violates type erasure.']
  }
]

export const initialJavaDiagnosticQuestions: JavaDiagnosticQuestion[] = [
  {
    id: 'diag-1',
    topic: 'Variables & Data Types',
    question: 'What is the output of: int a = 5; double b = 2; System.out.println(a / b);?',
    options: ['2', '2.5', '2.0', 'Compilation error'],
    correctIndex: 1,
    explanation: 'Because b is a double, integer a is promoted to double before division, yielding 2.5.'
  },
  {
    id: 'diag-2',
    topic: 'Strings & Immutability',
    question: 'What does String s1 = "hello"; String s2 = new String("hello"); System.out.println(s1 == s2); output?',
    options: ['true', 'false', 'Compilation Error', 'NullPointerException'],
    correctIndex: 1,
    explanation: '== compares memory references. s1 points to the string pool, whereas s2 is explicitly created on the heap.'
  },
  {
    id: 'diag-3',
    topic: 'Loops & Flow',
    question: 'How many times will a do-while loop execute if its condition is false from the beginning?',
    options: ['0 times', '1 time', 'Infinite times', 'Throws Exception'],
    correctIndex: 1,
    explanation: 'A do-while loop evaluates its boolean condition after the body executes, guaranteeing at least one run.'
  },
  {
    id: 'diag-4',
    topic: 'OOP & Methods',
    question: 'Which of the following describes method overloading in Java?',
    options: [
      'Same method name and parameters, different return type only',
      'Same method name, different parameter count or types in the same class',
      'Child class providing specific implementation of a parent class method',
      'Marking a method with the static keyword'
    ],
    correctIndex: 1,
    explanation: 'Overloading happens within the same class when methods share a name but differ in parameter count or types.'
  },
  {
    id: 'diag-5',
    topic: 'OOP Core',
    question: 'Can you instantiate an abstract class using the new keyword directly?',
    options: ['Yes, always', 'No, abstract classes cannot be directly instantiated', 'Yes, if it has no abstract methods', 'Only inside the same package'],
    correctIndex: 1,
    explanation: 'Abstract classes are incomplete blueprints and cannot be directly instantiated with new.'
  },
  {
    id: 'diag-6',
    topic: 'Exceptions',
    question: 'Which block in Java exception handling ALWAYS executes regardless of whether an exception was caught or thrown?',
    options: ['catch', 'finally', 'try', 'throws'],
    correctIndex: 1,
    explanation: 'The finally block executes unconditionally (unless System.exit() is called) to release critical resources.'
  },
  {
    id: 'diag-7',
    topic: 'Collections Framework',
    question: 'Which Map implementation guarantees that keys are ordered in their natural ascending sort order?',
    options: ['HashMap', 'LinkedHashMap', 'TreeMap', 'Hashtable'],
    correctIndex: 2,
    explanation: 'TreeMap uses a Red-Black Tree to store keys in sorted natural order or custom Comparator order.'
  },
  {
    id: 'diag-8',
    topic: 'Collections & Set',
    question: 'What happens when you add a duplicate element into a HashSet in Java?',
    options: [
      'Throws DuplicateKeyException',
      'The add() method returns false and the set remains unchanged',
      'Overwrites the entire set',
      'Appends it as a linked list node'
    ],
    correctIndex: 1,
    explanation: 'HashSet rejects duplicates by returning false from add() while keeping the existing element.'
  },
  {
    id: 'diag-9',
    topic: 'Pass-by-value Semantics',
    question: 'In Java, how are object references passed to methods?',
    options: ['Pass by reference', 'Pass by value (the reference copy is passed by value)', 'Pass by pointer', 'Pass by name'],
    correctIndex: 1,
    explanation: 'Java is strictly pass-by-value. For objects, a copy of the memory address reference is passed by value.'
  },
  {
    id: 'diag-10',
    topic: 'File I/O',
    question: 'Which modern Java feature automatically closes files, database connections and sockets when exiting a block?',
    options: ['finally block only', 'try-with-resources statement', 'Garbage collection finalizer', 'synchronized block'],
    correctIndex: 1,
    explanation: 'try-with-resources automatically invokes close() on any object implementing java.lang.AutoCloseable.'
  }
]

// -------------------------------------------------------------
// SPRINTOS 2.1 ENHANCED COURSES & EMAIL REPORTING SEED DATA
// -------------------------------------------------------------

export const initialEnhancedCourses: EnhancedCourse[] = [
  {
    id: 'course-genai-llm',
    title: 'Generative AI with Large Language Models',
    provider: 'DeepLearning.AI & AWS (Coursera)',
    courseUrl: 'https://www.coursera.org/learn/generative-ai-with-llms',
    relatedSubjectId: 'llm-rag-agentic-ai',
    modules: [
      { id: 'm1', title: 'LLM Lifecycle, Transformers & Pre-training', completed: true },
      { id: 'm2', title: 'Fine-Tuning, PEFT & LoRA Adaptation', completed: true },
      { id: 'm3', title: 'RLHF, Alignment & LLM-Powered Reasoning', completed: false }
    ],
    status: 'in_progress',
    progressPercentage: 66,
    startDate: '2026-10-14',
    targetDate: '2026-11-20',
    certificateEarned: false,
    notes: 'Verified syllabus credential for S5-AI01. Completing Module 3 on RLHF next.',
    learningOutcomes: ['Transformer attention math', 'Parameter-efficient fine-tuning (LoRA)', 'Inference optimization']
  },
  {
    id: 'course-dsa-specialization',
    title: 'Data Structures and Algorithms Specialization',
    provider: 'UC San Diego (Coursera)',
    courseUrl: 'https://www.coursera.org/specializations/data-structures-algorithms',
    relatedSubjectId: 'dsa-3',
    modules: [
      { id: 'm1', title: 'Algorithmic Toolbox', completed: true },
      { id: 'm2', title: 'Data Structures: Trees, Hashes & Disjoint Sets', completed: true },
      { id: 'm3', title: 'Algorithms on Graphs: SCC, Dijkstra & MST', completed: true },
      { id: 'm4', title: 'Advanced Algorithms and Complexity', completed: false }
    ],
    status: 'in_progress',
    progressPercentage: 75,
    startDate: '2026-09-01',
    targetDate: '2026-11-30',
    certificateEarned: false,
    notes: 'Unit 2 & 3 graph algorithms align directly with Kosaraju & Tarjan lectures.',
    learningOutcomes: ['SCC graph decomposition', 'Tarjan low-link computation', 'Dynamic programming heuristics']
  },
  {
    id: 'course-software-testing',
    title: 'Software Testing and Automation Specialization',
    provider: 'University of Minnesota (Coursera)',
    courseUrl: 'https://www.coursera.org/specializations/software-testing-automation',
    relatedSubjectId: 'stqa',
    modules: [
      { id: 'm1', title: 'Introduction to Software Testing', completed: true },
      { id: 'm2', title: 'Black-box & White-box Test Coverage', completed: false },
      { id: 'm3', title: 'Automated Testing with Selenium & JUnit', completed: false }
    ],
    status: 'planned',
    progressPercentage: 33,
    startDate: '2026-10-18',
    targetDate: '2026-12-05',
    certificateEarned: false,
    notes: 'Supports S5-SE01 coursework and Postman automated testing lab.',
    learningOutcomes: ['Equivalence partitioning', 'Branch and path coverage', 'JUnit test suites']
  }
]

export const initialEmailSettings: EmailReportSettings = {
  enabled: true,
  recipientEmail: 'ashutosh.rai@university.edu',
  dailyReportTime: '18:00',
  weeklyReportDay: 0,
  weeklyReportTime: '18:00',
  timezone: 'Asia/Kolkata',
  deliveryLogs: []
}

