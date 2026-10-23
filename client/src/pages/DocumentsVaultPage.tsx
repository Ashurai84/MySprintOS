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
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button, buttonVariants } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { cn } from 'cn'

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
          variant: 'outline' as const,
          className: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
          label: 'PDF Document',
          viewText: 'View PDF in App'
        }
      case 'xlsx':
        return {
          icon: FileSpreadsheet,
          variant: 'outline' as const,
          className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
          label: 'Excel Spreadsheet (.xlsx)',
          viewText: 'View Spreadsheet in App'
        }
      case 'docx':
        return {
          icon: FileCode,
          variant: 'outline' as const,
          className: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
          label: 'Word Document (.docx)',
          viewText: 'View Document in App'
        }
      default:
        return {
          icon: FileText,
          variant: 'secondary' as const,
          className: '',
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
            <Badge variant="outline" className="text-xs uppercase font-semibold tracking-wider text-primary border-primary/20 bg-primary/5">
              Academic Documents Library
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {allDocs.length + userUploadedDocs.length} Documents Indexed
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mt-1">
            Documents & Official University Syllabi
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Read, search and inspect PDFs, Excel course plans and Word syllabus files directly inside SprintOS without forced downloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsUploadModalOpen(true)}
            className="h-8 text-xs gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>Upload Document</span>
          </Button>

          {masterDoc && (
            <Button
              size="sm"
              onClick={() => openDocumentViewer(masterDoc)}
              className="h-8 text-xs gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Master Plan</span>
            </Button>
          )}
        </div>
      </div>

      {/* 1. Master Academic Plan Feature Hero Card */}
      {masterDoc && (
        <Card className="border-border bg-card p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-xs font-semibold text-rose-400 border-rose-500/30 bg-rose-500/10 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Official PDF • {masterDoc.size}
                </Badge>
                <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/20 bg-emerald-500/10 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Primary Academic Source of Truth
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono">
                  Elon Musk Cohort
                </Badge>
              </div>

              <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                {masterDoc.title}
              </h3>

              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {masterDoc.description}
              </p>

              <div className="text-[11px] text-muted-foreground font-mono pt-1">
                Filename: <code className="text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border">{masterDoc.filename}</code>
              </div>
            </div>

            {/* Action Buttons for Master Plan */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => openDocumentViewer(masterDoc)}
                className="h-8 text-xs gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>View PDF In App</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleInlinePreview(masterDoc.id)}
                className="h-8 text-xs gap-2"
              >
                {inlinePreviewIds[masterDoc.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-primary" />}
                <span>{inlinePreviewIds[masterDoc.id] ? 'Hide Inline View' : 'Toggle Inline View'}</span>
              </Button>

              <div className="flex items-center gap-2">
                <a
                  href={masterDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 h-8 text-xs gap-1.5')}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  <span>New Tab</span>
                </a>

                <a
                  href={masterDoc.url}
                  download={masterDoc.filename}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 h-8 text-xs gap-1.5')}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>

          {/* Embedded PDF Viewer (inline toggle) */}
          {inlinePreviewIds[masterDoc.id] && (
            <div className="mt-5 pt-5 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>In-app Document Preview: {masterDoc.filename}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openDocumentViewer(masterDoc)}
                  className="text-primary hover:text-primary/80 h-7 text-xs gap-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand Fullscreen</span>
                </Button>
              </div>
              <div className="w-full h-[600px] rounded-lg border border-border overflow-hidden bg-white">
                <iframe
                  src={`${masterDoc.url}#toolbar=1`}
                  title="Master Academic Plan PDF"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}
        </Card>
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
            <Button
              key={fmt.id}
              size="sm"
              variant={selectedFormat === fmt.id ? 'default' : 'outline'}
              onClick={() => setSelectedFormat(fmt.id as typeof selectedFormat)}
              className="text-xs h-8 px-3"
            >
              {fmt.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="px-3 py-1.5 h-9 rounded-md bg-card border border-border text-xs text-foreground focus-ring"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search syllabus documents..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs bg-card border-border"
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
            <Card
              key={doc.id}
              className={`p-5 border-border bg-card flex flex-col justify-between transition-all ${
                isInlineOpen ? 'border-primary/50 shadow-md md:col-span-2' : 'hover:border-foreground/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={badge.variant} className={cn('text-[11px] font-mono font-medium flex items-center gap-1.5', badge.className)}>
                        <FormatIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[11px] font-mono">
                        {doc.size}
                      </Badge>
                    </div>

                    <h3 className="text-sm md:text-base font-semibold text-foreground pt-1">
                      {doc.title}
                    </h3>

                    {doc.subjectName && (
                      <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-primary" />
                        <span>{doc.subjectName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {doc.description}
                </p>

                <div className="text-[11px] text-muted-foreground font-mono bg-muted/30 p-2 rounded-md border border-border truncate">
                  File: <span className="text-foreground">{doc.filename}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => openDocumentViewer(doc)}
                    className="flex-1 sm:flex-initial h-8 text-xs gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{badge.viewText}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleInlinePreview(doc.id)}
                    title={isInlineOpen ? 'Collapse Inline' : 'Expand Inline'}
                    className="h-8 w-8 p-0"
                  >
                    {isInlineOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 sm:flex-initial h-8 text-xs gap-1.5')}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                    <span>New Tab</span>
                  </a>

                  <a
                    href={doc.url}
                    download={doc.filename}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 sm:flex-initial h-8 text-xs gap-1.5')}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>

              {/* Inline In-App Document Viewer Expansion */}
              {isInlineOpen && (
                <div className="mt-5 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                    <span className="font-semibold text-foreground">
                      In-App Content Viewer: {doc.filename}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDocumentViewer(doc)}
                      className="text-primary hover:text-primary/80 h-7 text-xs gap-1"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Expand to Fullscreen Modal</span>
                    </Button>
                  </div>

                  {/* PDF Inline */}
                  {doc.type === 'pdf' && (
                    <div className="w-full h-[600px] rounded-lg border border-border overflow-hidden bg-white">
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
                      <div className="p-6 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border">
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
                      <div className="p-6 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border">
                        <FileCode className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-xs">Document preview loading...</p>
                      </div>
                    )
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* User Uploaded Documents Section */}
      {userUploadedDocs.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-base font-bold text-foreground">
            User Uploaded Study Documents ({userUploadedDocs.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userUploadedDocs.map(doc => {
              const badge = getFormatBadge(doc.type)
              const FormatIcon = badge.icon
              const sub = subjects.find(s => s.id === doc.subjectId)
              return (
                <Card key={doc.id} className="p-4 border-border bg-card flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant={badge.variant} className={cn('text-[11px] font-mono font-medium flex items-center gap-1', badge.className)}>
                        <FormatIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground">{doc.size}</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground mt-1.5">{doc.title}</h4>
                    {sub && <p className="text-xs text-muted-foreground">Mapped: {sub.name}</p>}
                    <div className="flex items-center gap-1 flex-wrap mt-2">
                      {doc.tags?.map((t, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Button
                      size="sm"
                      onClick={() => openDocumentViewer(doc)}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View in App</span>
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteDocument(doc.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="w-full max-w-md bg-card border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                <span>Upload Study Document</span>
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsUploadModalOpen(false)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-foreground font-semibold mb-1">Select File (.pdf, .docx, .xlsx, .txt)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.txt"
                  onChange={handleFileChange}
                  className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">Document Title</label>
                <Input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Flow Networks Lecture Slides"
                  className="text-xs bg-muted/40"
                />
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">Subject</label>
                <select
                  value={uploadSubjectId}
                  onChange={e => setUploadSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-foreground text-xs focus-ring"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">Tags (comma-separated)</label>
                <Input
                  type="text"
                  value={uploadTags}
                  onChange={e => setUploadTags(e.target.value)}
                  placeholder="Notes, Slides, Unit 3, Lab"
                  className="text-xs bg-muted/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isDisabled={!selectedFile}
                  className="h-8 text-xs font-semibold"
                >
                  Add Document
                </Button>
              </div>
            </form>
          </Card>
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

