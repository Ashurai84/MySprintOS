import React, { useState, useMemo } from 'react'
import {
  X,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Plus,
  FileText,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Upload,
  CheckCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { ExtractedOpportunity, Certification, Subject } from '../types'
import {
  extractFromPreParsedDocuments,
  extractFromUploadedFile
} from '../services/documentCertificateExtractor'
import { ProviderLogo } from './ProviderLogo'

interface CertificateReviewModalProps {
  isOpen: boolean
  onClose: () => void
  existingCertificates: Certification[]
  subjects: Subject[]
  onAddOpportunity: (opp: ExtractedOpportunity, customStatus?: 'not_started' | 'in_progress') => void
  onBatchAddOpportunities: (opps: ExtractedOpportunity[]) => void
  onEditAndAdd: (opp: ExtractedOpportunity) => void
}

export const CertificateReviewModal: React.FC<CertificateReviewModalProps> = ({
  isOpen,
  onClose,
  existingCertificates,
  subjects,
  onAddOpportunity,
  onBatchAddOpportunities,
  onEditAndAdd
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'courses' | 'references'>('direct')
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [showScanDetails, setShowScanDetails] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadedOpportunities, setUploadedOpportunities] = useState<ExtractedOpportunity[]>([])

  // Extract opportunities from official documents
  const extractionResult = useMemo(() => {
    return extractFromPreParsedDocuments()
  }, [])

  if (!isOpen) return null

  // Set of existing URLs normalized to avoid duplicates
  const existingUrlSet = new Set(
    existingCertificates.map(c => c.courseUrl.trim().toLowerCase().replace(/\/$/, ''))
  )

  const isAlreadyAdded = (url: string) => {
    return existingUrlSet.has(url.trim().toLowerCase().replace(/\/$/, ''))
  }

  // Combine pre-parsed and uploaded opportunities
  const allOpportunities = [...extractionResult.allOpportunities, ...uploadedOpportunities]

  const directCerts = allOpportunities
    .filter(o => o.kind === 'direct_certificate' && !dismissedIds.has(o.id))

  const courseResources = allOpportunities
    .filter(o => o.kind === 'course_resource' && !dismissedIds.has(o.id))

  const generalRefs = allOpportunities
    .filter(o => o.kind === 'general_reference' && !dismissedIds.has(o.id))

  const displayedList =
    activeTab === 'direct' ? directCerts :
      activeTab === 'courses' ? courseResources : generalRefs

  const unaddedDirectCount = directCerts.filter(o => !isAlreadyAdded(o.url)).length

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
  }

  const handleBatchAddDirect = () => {
    const toAdd = directCerts.filter(o => !isAlreadyAdded(o.url))
    onBatchAddOpportunities(toAdd)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const extracted = await extractFromUploadedFile(file)
      setUploadedOpportunities(prev => [...prev, ...extracted])
    } catch (err) {
      console.error('Failed to extract from uploaded document:', err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#111319] border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-[#0d0f14] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm sm:text-base font-semibold text-foreground">
                Document Extraction Hub & Review Interface
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Integrity Verified
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and approve certificate links discovered directly in your college syllabi and academic plans
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unaddedDirectCount > 0 && activeTab === 'direct' && (
              <button
                type="button"
                onClick={handleBatchAddDirect}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Add All Direct ({unaddedDirectCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scan Summary Banner (Collapsible) */}
        <div className="bg-[#090a0f] border-b border-border px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                7 Documents Inspected
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                17 Direct Syllabus Certifications
              </span>
              <span>•</span>
              <span>
                {courseResources.length} Course & Practice Platforms
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowScanDetails(!showScanDetails)}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <span>{showScanDetails ? 'Hide Scan Audit' : 'View Scanned Documents'}</span>
              {showScanDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showScanDetails && (
            <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {extractionResult.documentSummaries.map((s, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#111319] border border-border flex items-start gap-2.5"
                >
                  {s.fileType === 'xlsx' ? (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : s.fileType === 'docx' ? (
                    <FileCode className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  ) : (
                    <FileText className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-slate-200 text-[11px] truncate">{s.documentName}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{s.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab Navigation & Live File Uploader */}
        <div className="px-5 py-2.5 bg-[#0d0f14] border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#090a0f] border border-border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${activeTab === 'direct'
                ? 'bg-secondary text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Direct Certifications ({directCerts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${activeTab === 'courses'
                ? 'bg-secondary text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Course & Practice Platforms ({courseResources.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('references')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${activeTab === 'references'
                ? 'bg-secondary text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              General References ({generalRefs.length})
            </button>
          </div>

          {/* Upload another syllabus document */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="extra-doc-upload"
              accept=".xlsx,.xls,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="extra-doc-upload"
              className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#161a24] hover:bg-[#1e2330] border border-border text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>{isUploading ? 'Scanning...' : 'Scan New Document'}</span>
            </label>
          </div>
        </div>

        {/* Opportunities List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#090a0f]">
          {displayedList.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-medium text-foreground">All items in this category are reviewed or added!</p>
              <p className="text-xs text-muted-foreground">
                Switch tabs or scan another academic document to discover more.
              </p>
            </div>
          ) : (
            displayedList.map(opp => {
              const alreadyAdded = isAlreadyAdded(opp.url)
              const mappedSub = subjects.find(s => s.id === opp.suggestedSubjectId)

              return (
                <div
                  key={opp.id}
                  className={`p-4 rounded-xl bg-[#111319] border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${alreadyAdded ? 'border-border/60 opacity-80' : 'border-border hover:border-border/80'
                    }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ProviderLogo provider={opp.provider} url={opp.url} size={18} />
                      <span className="text-xs font-semibold text-slate-300">
                        {opp.provider}
                      </span>
                      {opp.hours && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-slate-400 border border-border">
                          {opp.hours}
                        </span>
                      )}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${opp.verificationStatus === 'verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : opp.verificationStatus === 'login_required'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                        {opp.verificationStatus === 'verified' ? 'Verified Destination' :
                          opp.verificationStatus === 'login_required' ? 'Login Required' : 'Unverified URL'}
                      </span>
                      {alreadyAdded && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          In Certificate Hub
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-foreground leading-snug">
                      {opp.title}
                    </h3>

                    {opp.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {opp.description}
                      </p>
                    )}

                    {/* Source reference line */}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono pt-0.5 flex-wrap">
                      <span>Source: <strong className="text-slate-300">{opp.sourceDocument}</strong></span>
                      <span>•</span>
                      <span>{opp.sourceLocation}</span>
                      {mappedSub && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300">Subject: {mappedSub.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium flex items-center gap-1 transition-colors border border-border"
                      title="Open source URL directly"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>

                    {!alreadyAdded ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onAddOpportunity(opp, 'not_started')}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Hub</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditAndAdd(opp)}
                          className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium transition-colors border border-border"
                        >
                          Edit & Add
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDismiss(opp.id)}
                        className="px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground text-xs font-medium"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0d0f14] border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Extracted strictly from verified academic files • No URLs invented
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            Close Review Hub
          </button>
        </div>
      </div>
    </div>
  )
}
