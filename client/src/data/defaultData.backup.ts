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
  EmailReportSettings,
  EnhancedCourse
} from '../types'

export const academicData = rawAcademicData

// The 6 active subjects explicitly designated for SprintOS 2.0 Elon Musk cohort:
export const ACTIVE_SUBJECT_IDS = [
  'dsa-3',
  'llm-rag-agentic-ai',
  'stqa',
  'venture-product-strategy',
  'foundation-aiml-ds',
  'career-readiness-leadership'
]

// Subjects augmented with direct official document references and filtered to the 6 in scope
export const initialSubjects: Subject[] = (rawAcademicData.subjects as Subject[])
  .filter(sub => ACTIVE_SUBJECT_IDS.includes(sub.id))
  .map(sub => {
    let docUrl = ''
    let docFilename = ''
    let docType: 'xlsx' | 'docx' | 'pdf' = 'pdf'
    let docSize = ''

    if (sub.id === 'llm-rag-agentic-ai') {
      docUrl = '/syllabus-docs/LLMs, RAG & Agentic AI_Sem5.xlsx'
      docFilename = 'LLMs, RAG & Agentic AI_Sem5.xlsx'
      docType = 'xlsx'
      docSize = '270 KB'
    } else if (sub.id === 'dsa-3') {
      docUrl = '/syllabus-docs/DSA3_Semester5_Syllabus (1).docx'
      docFilename = 'DSA3_Semester5_Syllabus (1).docx'
      docType = 'docx'
      docSize = '160 KB'
    } else if (sub.id === 'stqa') {
      docUrl = '/syllabus-docs/Software Testing And Quality Assurance_Sem5.xlsx'
      docFilename = 'Software Testing And Quality Assurance_Sem5.xlsx'
      docType = 'xlsx'
      docSize = '84 KB'
    } else if (sub.id === 'foundation-aiml-ds') {
      docUrl = '/syllabus-docs/Foundations of AI, ML & Data Science_Sem5.xlsx'
      docFilename = 'Foundations of AI, ML & Data Science_Sem5.xlsx'
      docType = 'xlsx'
      docSize = '154 KB'
    } else if (sub.id === 'venture-product-strategy') {
      docUrl = '/syllabus-docs/Venture Capital & Product Strategy_Sem5 .docx'
      docFilename = 'Venture Capital & Product Strategy_Sem5 .docx'
      docType = 'docx'
      docSize = '156 KB'
    } else if (sub.id === 'career-readiness-leadership') {
      docUrl = '/syllabus-docs/Carrier Readiness & Leadership_Sem5.docx'
      docFilename = 'Carrier Readiness & Leadership_Sem5.docx'
      docType = 'docx'
      docSize = '148 KB'
    }

    return {
      ...sub,
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
  { subjectId: 'dsa-3', classesAttended: 3, totalClassesHeld: 3 },
  { subjectId: 'llm-rag-agentic-ai', classesAttended: 1, totalClassesHeld: 1 },
  { subjectId: 'stqa', classesAttended: 0, totalClassesHeld: 0 },
  { subjectId: 'venture-product-strategy', classesAttended: 2, totalClassesHeld: 2 },
  { subjectId: 'foundation-aiml-ds', classesAttended: 0, totalClassesHeld: 0 },
  { subjectId: 'career-readiness-leadership', classesAttended: 1, totalClassesHeld: 1 }
]

// SprintOS Verified Lectures: DSA-3 has exactly 3 lectures up to Kosaraju's Algorithm
export const initialLectures: Lecture[] = [
  // 1. DSA-3 Session 1: SCC Overview (Wednesday)
  {
    id: 'lec-dsa-1',
    date: '2026-10-21',
    subjectId: 'dsa-3',
    title: 'Strongly Connected Components (SCC) Overview',
    faculty: 'Sanjay Sahu (VF)',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    status: 'attended',
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
    subjectId: 'dsa-3',
    title: 'Unit 2: Graph Algorithms & Strongly Connected Components',
    faculty: 'Sanjay Sahu (VF)',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    status: 'attended',
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
    subjectId: 'dsa-3',
    title: "Kosaraju's Algorithm & Tarjan Low-Link",
    faculty: 'Sanjay Sahu (VF)',
    startTime: '11:10',
    endTime: '12:10',
    durationMinutes: 60,
    status: 'attended',
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
    subjectId: 'llm-rag-agentic-ai',
    title: 'RAG Architecture & Chunking Strategies',
    faculty: 'Dr. Dipanjan',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    status: 'attended',
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
    subjectId: 'career-readiness-leadership',
    title: 'Technical Interviewing & Leadership Frameworks',
    faculty: 'Prof. Amaan',
    startTime: '14:00',
    endTime: '15:00',
    durationMinutes: 60,
    status: 'attended',
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
    subjectId: 'venture-product-strategy',
    title: 'Unit 2: Venture Capital Math & Dilution',
    faculty: 'Mr. Vivekanand Jha',
    startTime: '15:00',
    endTime: '16:00',
    durationMinutes: 60,
    status: 'attended',
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
    subjectId: 'venture-product-strategy',
    title: 'Cap Table Modeling & Convertible Notes',
    faculty: 'Mr. Vivekanand Jha',
    startTime: '16:00',
    endTime: '17:00',
    durationMinutes: 60,
    status: 'attended',
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
  // Wednesday, 21 October 2026 (Verified from official timetable screenshot)
  {
    id: 'tt-wed-1',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    slotType: 'lecture',
    notes: 'Interactive Session',
    faculty: 'Dr. Aarti & Apeksha',
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-wed-2',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '11:10',
    endTime: '12:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-wed-3',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '12:20',
    endTime: '13:00',
    durationMinutes: 40,
    slotType: 'short_break',
    notes: 'Transition Break'
  },
  {
    id: 'tt-wed-4',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-wed-5',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '14:10',
    endTime: '15:10',
    durationMinutes: 60,
    slotType: 'lunch_break',
    notes: 'LUNCH BREAK'
  },
  {
    id: 'tt-wed-6',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '15:20',
    endTime: '16:00',
    durationMinutes: 40,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'Dr. Dipanjan',
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-wed-7',
    dayOfWeek: 3,
    specificDate: '2026-10-21',
    startTime: '16:00',
    endTime: '17:20',
    durationMinutes: 80,
    slotType: 'lecture',
    subjectId: 'S5-AI01',
    faculty: 'Dr. Dipanjan',
    classroom: 'Classroom No. - 37'
  },

  // Thursday, 22 October 2026 (Verified from official timetable screenshot)
  {
    id: 'tt-thu-0',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    slotType: 'unassigned',
    notes: 'Unscheduled Period'
  },
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
    classroom: 'Classroom No. - 37'
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
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-thu-3',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '12:20',
    endTime: '13:00',
    durationMinutes: 40,
    slotType: 'lunch_break',
    notes: 'LUNCH BREAK'
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
    classroom: 'Classroom No. - 37'
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
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-thu-6',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '15:10',
    endTime: '16:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-MG01',
    faculty: 'Mr. Vivekanand Jha',
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-thu-7',
    dayOfWeek: 4,
    specificDate: '2026-10-22',
    startTime: '16:10',
    endTime: '17:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-MG01',
    faculty: 'Mr. Vivekanand Jha',
    classroom: 'Classroom No. - 37'
  },

  // Friday, 23 October 2026 (Verified from official timetable screenshot)
  {
    id: 'tt-fri-0',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    slotType: 'unassigned',
    notes: 'Unscheduled Period'
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
    classroom: 'Classroom No. - 37'
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
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-fri-3',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '12:20',
    endTime: '13:00',
    durationMinutes: 40,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-fri-4',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    slotType: 'lunch_break',
    notes: 'LUNCH BREAK'
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
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-fri-6',
    dayOfWeek: 5,
    specificDate: '2026-10-23',
    startTime: '15:20',
    endTime: '16:20',
    durationMinutes: 60,
    slotType: 'unassigned',
    notes: 'Unscheduled Period'
  },

  // Saturday, 24 October 2026 (Verified from official timetable screenshot)
  {
    id: 'tt-sat-1',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-sat-2',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-sat-3',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '11:10',
    endTime: '12:10',
    durationMinutes: 60,
    slotType: 'lecture',
    subjectId: 'S5-CS01',
    faculty: 'Sanjay Sahu (VF)',
    classroom: 'Classroom No. - 37'
  },
  {
    id: 'tt-sat-4',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '12:20',
    endTime: '13:00',
    durationMinutes: 40,
    slotType: 'short_break',
    notes: 'Transition Break'
  },
  {
    id: 'tt-sat-5',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    slotType: 'unassigned',
    notes: 'Unscheduled for Elon Musk cohort'
  },
  {
    id: 'tt-sat-6',
    dayOfWeek: 6,
    specificDate: '2026-10-24',
    startTime: '14:10',
    endTime: '15:10',
    durationMinutes: 60,
    slotType: 'unassigned',
    notes: 'Unscheduled for Elon Musk cohort'
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

