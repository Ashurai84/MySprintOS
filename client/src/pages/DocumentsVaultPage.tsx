import React, { useState } from 'react'
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Download, 
  ExternalLink, 
  Search, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  BookOpen, 
  Upload, 
  Maximize2, 
  Trash2, 
  X
} from 'lucide-react'
import { officialDocuments, type OfficialDocument } from '../data/officialDocs'
import { getParsedDocument, isSpreadsheet, isWordDoc } from '../services/documentViewerService'
import { SpreadsheetViewer } from '../components/SpreadsheetViewer'
import { DocxViewer } from '../components/DocxViewer'
import { DocumentViewerModal } from '../components/DocumentViewerModal'
import { useApp } from '../context/AppContext'
import type { AppDocument } from '../types'

export const DocumentsVaultPage: React.FC = () => {
  const { subjects, appDocuments, addDocument, deleteDocument } = useApp()

  const [selectedFormat, setSelectedFormat] = useState<'all' | 'pdf' | 'xlsx' | 'docx' | 'other'>('all')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Inline preview states
  const [inlinePreviewIds, setInlinePreviewIds] = useState<Record<string, boolean>>({})

  // Modal preview state
  const [modalDoc, setModalDoc] = useState<OfficialDocument | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadSubjectId, setUploadSubjectId] = useState(subjects[0]?.id || '')
  const [uploadTags, setUploadTags] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string>('')

  const toggleInlinePreview = (id: string) => {
    setInlinePreviewIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const openDocumentViewer = (doc: OfficialDocument | AppDocument) => {
    const officialFormat: OfficialDocument = {
      id: doc.id,
      title: doc.title,
      filename: doc.filename,
      url: doc.url,
      type: (doc.type === 'pdf' || doc.type === 'xlsx' || doc.type === 'docx') ? doc.type : 'pdf',
      size: doc.size,
      subjectName: subjects.find(s => s.id === ('subjectId' in doc ? doc.subjectId : (doc as OfficialDocument).relatedSubjectId))?.name || 'Curriculum',
      description: 'description' in doc ? (doc.description as string) : `User document tagged: ${doc.tags?.join(', ') || 'General'}`
    }
    setModalDoc(officialFormat)
    setIsModalOpen(true)
  }

  const masterDoc = officialDocuments.find(d => d.isMasterPlan)

  // Combined documents: official documents + uploaded documents
  const allDocs = officialDocuments

  const filteredDocs = allDocs.filter(doc => {
    if (selectedFormat !== 'all' && doc.type !== selectedFormat) return false
    if (selectedSubjectId !== 'all' && doc.relatedSubjectId !== selectedSubjectId && !doc.isMasterPlan) return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      const matchTitle = doc.title.toLowerCase().includes(q)
      const matchFile = doc.filename.toLowerCase().includes(q)
      const matchSub = doc.subjectName?.toLowerCase().includes(q)
      const matchDesc = doc.description.toLowerCase().includes(q)
      if (!matchTitle && !matchFile && !matchSub && !matchDesc) return false
    }
    return true
  })

  // User uploaded documents that aren't already in official list
  const userUploadedDocs = appDocuments.filter(d => d.isUploaded)

  const getFormatBadge = (type: string) => {
    switch (type) {
      case 'pdf':
        return {
          icon: FileText,
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
          label: 'PDF Document',
          viewText: 'View PDF in App'
        }
      case 'xlsx':
        return {
          icon: FileSpreadsheet,
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
          label: 'Excel Spreadsheet (.xlsx)',
          viewText: 'View Spreadsheet in App'
        }
      case 'docx':
        return {
          icon: FileCode,
          bg: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
          label: 'Word Document (.docx)',
          viewText: 'View Document in App'
        }
      default:
        return {
          icon: FileText,
          bg: 'bg-slate-700/40 text-slate-300 border-slate-600',
          label: 'Document File',
          viewText: 'View in App'
        }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''))
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFileBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'other'
    const docType: 'pdf' | 'xlsx' | 'docx' | 'other' = 
      ext === 'pdf' ? 'pdf' : ext === 'xlsx' || ext === 'xls' ? 'xlsx' : ext === 'docx' || ext === 'doc' ? 'docx' : 'other'

    const sizeFormatted = selectedFile.size > 1024 * 1024 
      ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(selectedFile.size / 1024)} KB`

    const tagsArr = uploadTags.split(',').map(t => t.trim()).filter(Boolean)

    addDocument({
      title: uploadTitle.trim() || selectedFile.name,
      filename: selectedFile.name,
      type: docType,
      size: sizeFormatted,
      subjectId: uploadSubjectId || undefined,
      tags: tagsArr.length > 0 ? tagsArr : ['Uploaded File'],
      url: fileBase64 || URL.createObjectURL(selectedFile),
      isUploaded: true,
      fileData: fileBase64
    })

    setSelectedFile(null)
    setFileBase64('')
    setUploadTitle('')
    setUploadTags('')
    setIsUploadModalOpen(false)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              Academic Documents Library
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {allDocs.length + userUploadedDocs.length} Documents Indexed
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1">
            Documents & Official University Syllabi
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Read, search and inspect PDFs, Excel course plans and Word syllabus files directly inside SprintOS without forced downloads.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#162035] hover:bg-[#1f2d4a] text-slate-200 border border-[#21304c] text-xs font-semibold flex items-center gap-1.5 transition-colors focus-ring"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Upload Document</span>
          </button>

          {masterDoc && (
            <button
              onClick={() => openDocumentViewer(masterDoc)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors focus-ring"
            >
              <Eye className="w-4 h-4" />
              <span>View Master Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Master Academic Plan Feature Hero Card */}
      {masterDoc && (
        <div className="p-6 rounded-xl bg-[#111827] border border-slate-700/70 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 rounded flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Official PDF • {masterDoc.size}
                </span>
                <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Primary Academic Source of Truth
                </span>
                <span className="text-xs text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono">
                  Elon Musk Cohort
                </span>
              </div>

              <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
                {masterDoc.title}
              </h3>

              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                {masterDoc.description}
              </p>

              <div className="text-[11px] text-slate-400 font-mono pt-1">
                Filename: <code className="text-slate-200 bg-[#0b0f19] px-2 py-0.5 rounded border border-[#1e293d]">{masterDoc.filename}</code>
              </div>
            </div>

            {/* Action Buttons for Master Plan */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
              <button
                onClick={() => openDocumentViewer(masterDoc)}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors focus-ring"
              >
                <Eye className="w-4 h-4" />
                <span>View PDF In App</span>
              </button>

              <button
                onClick={() => toggleInlinePreview(masterDoc.id)}
                className="px-4 py-2 rounded-lg bg-[#162035] hover:bg-[#1e2d4a] text-slate-200 border border-[#21304c] text-xs font-medium flex items-center justify-center gap-2 transition-colors focus-ring"
              >
                {inlinePreviewIds[masterDoc.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-blue-400" />}
                <span>{inlinePreviewIds[masterDoc.id] ? 'Hide Inline View' : 'Toggle Inline View'}</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={masterDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#162035] hover:bg-[#1e2d4a] text-slate-300 border border-[#21304c] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors focus-ring"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>New Tab</span>
                </a>

                <a
                  href={masterDoc.url}
                  download={masterDoc.filename}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#162035] hover:bg-[#1e2d4a] text-slate-300 border border-[#21304c] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors focus-ring"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>

          {/* Embedded PDF Viewer (inline toggle) */}
          {inlinePreviewIds[masterDoc.id] && (
            <div className="mt-5 pt-5 border-t border-[#1f293d] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>In-app Document Preview: {masterDoc.filename}</span>
                <button
                  onClick={() => openDocumentViewer(masterDoc)}
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand Fullscreen</span>
                </button>
              </div>
              <div className="w-full h-[600px] rounded-lg border border-[#233352] overflow-hidden bg-white">
                <iframe
                  src={`${masterDoc.url}#toolbar=1`}
                  title="Master Academic Plan PDF"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Format Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: `All Files (${allDocs.length + userUploadedDocs.length})` },
            { id: 'pdf', label: 'PDF Documents (1)' },
            { id: 'xlsx', label: 'Excel Spreadsheets (3)' },
            { id: 'docx', label: 'Word Documents (3)' }
          ].map(fmt => (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id as typeof selectedFormat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-ring ${
                selectedFormat === fmt.id
                  ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                  : 'bg-[#111827] text-slate-400 hover:text-slate-200 border border-[#1e293d]'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#111827] border border-[#1f293d] text-xs text-slate-200 focus-ring"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search syllabus documents..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#111827] border border-[#1f293d] text-xs text-slate-200 placeholder-slate-500 focus-ring"
            />
          </div>
        </div>
      </div>

      {/* 3. Grid of All Verified Documents with In-App Previewers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map(doc => {
          const badge = getFormatBadge(doc.type)
          const FormatIcon = badge.icon
          const isInlineOpen = !!inlinePreviewIds[doc.id]
          const parsedData = getParsedDocument(doc.filename)

          return (
            <div
              key={doc.id}
              className={`p-5 rounded-xl bg-[#111827] border transition-all flex flex-col justify-between ${
                isInlineOpen ? 'border-blue-500/50 shadow-md md:col-span-2' : 'border-[#1e293d] hover:border-slate-600'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-mono font-medium flex items-center gap-1.5 ${badge.bg}`}>
                        <FormatIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 bg-[#162035] px-2 py-0.5 rounded border border-[#212e47]">
                        {doc.size}
                      </span>
                    </div>

                    <h3 className="text-sm md:text-base font-semibold text-white pt-1">
                      {doc.title}
                    </h3>

                    {doc.subjectName && (
                      <div className="text-xs text-slate-300 font-medium flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-blue-400" />
                        <span>{doc.subjectName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {doc.description}
                </p>

                <div className="text-[11px] text-slate-400 font-mono bg-[#0c121e] p-2 rounded-lg border border-[#1b2538] truncate">
                  File: <span className="text-slate-200">{doc.filename}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#1f293d] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDocumentViewer(doc)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors focus-ring"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{badge.viewText}</span>
                  </button>

                  <button
                    onClick={() => toggleInlinePreview(doc.id)}
                    title={isInlineOpen ? 'Collapse Inline' : 'Expand Inline'}
                    className="p-2 rounded-lg bg-[#162035] hover:bg-[#1e2d4a] text-slate-300 hover:text-white border border-[#21304c] text-xs transition-colors focus-ring"
                  >
                    {isInlineOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-[#162035] hover:bg-[#1e2d4a] text-slate-200 border border-[#21304c] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors focus-ring"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>New Tab</span>
                  </a>

                  <a
                    href={doc.url}
                    download={doc.filename}
                    className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-[#162035] hover:bg-[#1e2d4a] text-slate-300 border border-[#21304c] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors focus-ring"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              {/* Inline In-App Document Viewer Expansion */}
              {isInlineOpen && (
                <div className="mt-5 pt-4 border-t border-[#1f2d47] space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                    <span className="font-semibold text-slate-300">
                      In-App Content Viewer: {doc.filename}
                    </span>
                    <button
                      onClick={() => openDocumentViewer(doc)}
                      className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Expand to Fullscreen Modal</span>
                    </button>
                  </div>

                  {/* PDF Inline */}
                  {doc.type === 'pdf' && (
                    <div className="w-full h-[600px] rounded-lg border border-[#233352] overflow-hidden bg-white">
                      <iframe
                        src={`${doc.url}#toolbar=1`}
                        title={doc.title}
                        className="w-full h-full border-0"
                      />
                    </div>
                  )}

                  {/* Spreadsheet Inline (.xlsx) */}
                  {doc.type === 'xlsx' && (
                    parsedData && isSpreadsheet(parsedData) ? (
                      <SpreadsheetViewer data={parsedData} maxHeight="500px" />
                    ) : (
                      <div className="p-6 text-center text-slate-400 bg-[#0c121e] rounded-xl border border-[#1f2d45]">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-xs">Spreadsheet preview loading...</p>
                      </div>
                    )
                  )}

                  {/* Word Doc Inline (.docx) */}
                  {doc.type === 'docx' && (
                    parsedData && isWordDoc(parsedData) ? (
                      <DocxViewer data={parsedData} maxHeight="500px" />
                    ) : (
                      <div className="p-6 text-center text-slate-400 bg-[#0c121e] rounded-xl border border-[#1f2d45]">
                        <FileCode className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-xs">Document preview loading...</p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* User Uploaded Documents Section */}
      {userUploadedDocs.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-base font-bold text-white">
            User Uploaded Study Documents ({userUploadedDocs.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userUploadedDocs.map(doc => {
              const badge = getFormatBadge(doc.type)
              const FormatIcon = badge.icon
              const sub = subjects.find(s => s.id === doc.subjectId)
              return (
                <div key={doc.id} className="p-4 rounded-xl bg-[#111827] border border-[#1e293d] flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-mono font-medium flex items-center gap-1 ${badge.bg}`}>
                        <FormatIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{doc.size}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1.5">{doc.title}</h4>
                    {sub && <p className="text-xs text-slate-400">Mapped: {sub.name}</p>}
                    <div className="flex items-center gap-1 flex-wrap mt-2">
                      {doc.tags?.map((t, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#162035] text-slate-300 border border-[#21304d]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1e293d]">
                    <button
                      onClick={() => openDocumentViewer(doc)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View in App</span>
                    </button>

                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293d] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293d]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Upload Study Document</span>
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select File (.pdf, .docx, .xlsx, .txt)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.txt"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Flow Networks Lecture Slides"
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                <select
                  value={uploadSubjectId}
                  onChange={e => setUploadSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={e => setUploadTags(e.target.value)}
                  placeholder="Notes, Slides, Unit 3, Lab"
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#21304d] text-white focus-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e293d]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  Add Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Document Viewer Modal (Opens on View In App Click) */}
      <DocumentViewerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDoc={modalDoc}
        onSelectDoc={doc => setModalDoc(doc)}
      />
    </div>
  )
}
