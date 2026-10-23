export interface OfficialDocument {
  id: string
  title: string
  filename: string
  url: string
  type: 'pdf' | 'xlsx' | 'docx'
  size: string
  relatedSubjectId?: string
  subjectName?: string
  description: string
  isMasterPlan?: boolean
}

export const officialDocuments: OfficialDocument[] = [
  {
    id: 'doc-master-plan',
    title: 'Sprint 2 Master Academic Plan & Regulations',
    filename: 'Sprint 2 Academic Plan 13th Oct 2026.pdf',
    url: '/syllabus-docs/Sprint 2 Academic Plan 13th Oct 2026.pdf',
    type: 'pdf',
    size: '1.37 MB',
    isMasterPlan: true,
    description: 'Master timetable, cohort faculty allocation (Elon Musk), 75% attendance regulations, exam dates (10–22 Dec 2026), and 60+40 internal/external marks evaluation scheme.'
  },
  {
    id: 'doc-llm',
    title: 'LLMs, RAG & Agentic AI Official Syllabus & Session Plan',
    filename: 'LLMs, RAG & Agentic AI_Sem5.xlsx',
    url: '/syllabus-docs/LLMs, RAG & Agentic AI_Sem5.xlsx',
    type: 'xlsx',
    size: '270 KB',
    relatedSubjectId: 'llm-rag-agentic-ai',
    subjectName: 'LLMs, RAG & Agentic AI',
    description: 'Full spreadsheet containing 5 Units, 30 session breakdowns, 15 assignments with CO mapping, and verified certifications (Gemini, Coursera RAG).'
  },
  {
    id: 'doc-dsa',
    title: 'DSA III & LeetCode Official Syllabus Document',
    filename: 'DSA3_Semester5_Syllabus (1).docx',
    url: '/syllabus-docs/DSA3_Semester5_Syllabus (1).docx',
    type: 'docx',
    size: '160 KB',
    relatedSubjectId: 'dsa-3',
    subjectName: 'Data Structures and Algorithms III',
    description: 'Official course syllabus covering SCC (Kosaraju, Tarjan), Flow Networks, Bitmask DP, Tree DP, Suffix Arrays, Segment Trees, Fenwick Trees, and competitive programming topics.'
  },
  {
    id: 'doc-stqa',
    title: 'Software Testing & Quality Assurance Course Plan',
    filename: 'Software Testing And Quality Assurance_Sem5.xlsx',
    url: '/syllabus-docs/Software Testing And Quality Assurance_Sem5.xlsx',
    type: 'xlsx',
    size: '84 KB',
    relatedSubjectId: 'stqa',
    subjectName: 'Software Testing & Quality Assurance',
    description: 'Complete STQA course spreadsheet with 5 Modules, manual testing test design (EP, BVA), Selenium WebDriver automation, Postman API testing, and JMeter load testing.'
  },
  {
    id: 'doc-fai',
    title: 'Foundations of AI, ML & Data Science Course Spreadsheet',
    filename: 'Foundations of AI, ML & Data Science_Sem5.xlsx',
    url: '/syllabus-docs/Foundations of AI, ML & Data Science_Sem5.xlsx',
    type: 'xlsx',
    size: '154 KB',
    relatedSubjectId: 'foundation-aiml-ds',
    subjectName: 'Foundation of AI/ML & Data Science',
    description: 'Official 30-hour curriculum including CRISP-DM workflow, EDA, descriptive statistics, 15 assignments, 21 reference articles, and 12 industry certification courses.'
  },
  {
    id: 'doc-vps',
    title: 'Venture Capital & Product Strategy Syllabus Document',
    filename: 'Venture Capital & Product Strategy_Sem5 .docx',
    url: '/syllabus-docs/Venture Capital & Product Strategy_Sem5 .docx',
    type: 'docx',
    size: '156 KB',
    relatedSubjectId: 'venture-product-strategy',
    subjectName: 'Venture & Product Strategy',
    description: '15-hour syllabus covering Financial Accounting, Double-entry bookkeeping, Cost Accounting, Break-Even Analysis, Startup Valuation, Cap Tables, and Investor Pitch Decks.'
  },
  {
    id: 'doc-crl',
    title: 'Career Readiness & Leadership Course Specification',
    filename: 'Carrier Readiness & Leadership_Sem5.docx',
    url: '/syllabus-docs/Carrier Readiness & Leadership_Sem5.docx',
    type: 'docx',
    size: '148 KB',
    relatedSubjectId: 'career-readiness-leadership',
    subjectName: 'Career Readiness & Leadership',
    description: 'Syllabus covering leadership mindsets, Daniel Goleman emotional intelligence (EQ), behavioral STAR interview preparation, ATS resume design, and sprint team simulations.'
  }
]
