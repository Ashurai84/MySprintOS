import React, { useState, useMemo } from 'react'
import { 
  Award, 
  Plus, 
  Search, 
  Sparkles, 
  CheckSquare, 
  Square, 
  ShieldCheck, 
  ExternalLink,
  Upload
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getTodayDateString } from '../utils/dateUtils'
import type { Certification, CertStatus, CourseStatus, ExtractedOpportunity } from '../types'
import { CertificateCard } from '../components/CertificateCard'
import { CertificateReviewModal } from '../components/CertificateReviewModal'
import { CertificateUploadModal } from '../components/CertificateUploadModal'
import { CertificateViewerModal } from '../components/CertificateViewerModal'
import { CertificateEditModal } from '../components/CertificateEditModal'
import { deleteCertificateFile } from '../services/certificateStorageService'
import { extractFromPreParsedDocuments } from '../services/documentCertificateExtractor'

export const CertificationsPage: React.FC = () => {
  const { 
    subjects, 
    certifications, 
    addCertification, 
    updateCertification, 
    deleteCertification,
    enhancedCourses,
    updateEnhancedCourse
  } = useApp()

  // Top level views: If user already has custom certificates in the hub, show Hub; otherwise show Curriculum Specializations first so existing courses are always visible
  const [activeTab, setActiveTab] = useState<'hub' | 'specializations'>(() => {
    return certifications.length > 0 ? 'hub' : 'specializations'
  })

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterUploadedOnly, setFilterUploadedOnly] = useState<boolean>(false)

  // Modals state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false)
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null)

  // Document extraction count summary
  const extractionResult = useMemo(() => {
    return extractFromPreParsedDocuments()
  }, [])

  const existingUrlSet = useMemo(() => {
    return new Set(certifications.map(c => c.courseUrl.trim().toLowerCase().replace(/\/$/, '')))
  }, [certifications])

  const unaddedOpportunitiesCount = useMemo(() => {
    return extractionResult.directCertificates.filter(
      o => !existingUrlSet.has(o.url.trim().toLowerCase().replace(/\/$/, ''))
    ).length
  }, [extractionResult, existingUrlSet])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = certifications.length
    const completed = certifications.filter(c => c.status === 'completed').length
    const inProgress = certifications.filter(c => c.status === 'in_progress').length
    const needsReview = certifications.filter(c => c.status === 'needs_review').length
    const uploadedProofs = certifications.filter(c => Boolean(c.uploadedCertificate || c.certificateUrl)).length

    return { total, completed, inProgress, needsReview, uploadedProofs }
  }, [certifications])

  // Filtered certificates list
  const filteredCertificates = useMemo(() => {
    return certifications.filter(cert => {
      // Search query filter (title, provider, notes, source doc)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchTitle = cert.title.toLowerCase().includes(query)
        const matchProvider = (cert.provider || cert.platform || '').toLowerCase().includes(query)
        const matchNotes = (cert.notes || '').toLowerCase().includes(query)
        const matchDoc = (cert.sourceDocReference?.documentName || '').toLowerCase().includes(query)
        if (!matchTitle && !matchProvider && !matchNotes && !matchDoc) {
          return false
        }
      }

      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'not_started' && cert.status !== 'not_started' && cert.status !== 'planned') {
          return false
        }
        if (filterStatus !== 'not_started' && cert.status !== filterStatus) {
          return false
        }
      }

      // Subject filter
      if (filterSubject !== 'all' && cert.relatedSubjectId !== filterSubject) {
        return false
      }

      // Uploaded proof filter
      if (filterUploadedOnly && !cert.uploadedCertificate && !cert.certificateUrl) {
        return false
      }

      return true
    })
  }, [certifications, searchQuery, filterStatus, filterSubject, filterUploadedOnly])

  // Action handlers
  const handleOpenAddModal = () => {
    setSelectedCert(null)
    setIsEditModalOpen(true)
  }

  const handleOpenEditModal = (cert: Certification) => {
    setSelectedCert(cert)
    setIsEditModalOpen(true)
  }

  const handleOpenUploadModal = (cert: Certification) => {
    setSelectedCert(cert)
    setIsUploadModalOpen(true)
  }

  const handleOpenViewerModal = (cert: Certification) => {
    setSelectedCert(cert)
    setIsViewerModalOpen(true)
  }

  const handleDeleteCert = async (certId: string) => {
    await deleteCertificateFile(certId)
    deleteCertification(certId)
  }

  const handleStatusChange = (certId: string, newStatus: CertStatus) => {
    const cert = certifications.find(c => c.id === certId)
    if (!cert) return

    updateCertification(certId, {
      status: newStatus,
      progressPercentage: newStatus === 'completed' ? 100 : cert.progressPercentage,
      completionDate: newStatus === 'completed' ? (cert.completionDate || getTodayDateString()) : cert.completionDate
    })
  }

  const handleSaveCert = (certData: Partial<Certification>) => {
    if (selectedCert) {
      updateCertification(selectedCert.id, certData)
    } else {
      addCertification({
        title: certData.title || '',
        platform: certData.platform || certData.provider || 'External Provider',
        provider: certData.provider || certData.platform || 'External Provider',
        courseUrl: certData.courseUrl || '',
        relatedSubjectId: certData.relatedSubjectId || subjects[0]?.id || '',
        status: certData.status || 'not_started',
        progressPercentage: certData.progressPercentage || 0,
        targetDate: certData.targetDate || '2026-11-30',
        completionDate: certData.completionDate,
        certificateUrl: certData.certificateUrl,
        notes: certData.notes,
        sourceDocReference: certData.sourceDocReference,
        uploadedCertificate: certData.uploadedCertificate
      })
    }
  }

  const handleAddOpportunityFromReview = (opp: ExtractedOpportunity, customStatus: 'not_started' | 'in_progress' = 'not_started') => {
    addCertification({
      title: opp.title,
      platform: opp.provider || 'External Provider',
      provider: opp.provider || 'External Provider',
      courseUrl: opp.url,
      relatedSubjectId: opp.suggestedSubjectId || subjects[0]?.id || '',
      status: customStatus,
      progressPercentage: customStatus === 'in_progress' ? 25 : 0,
      targetDate: '2026-11-30',
      description: opp.description,
      hours: opp.hours,
      verificationStatus: opp.verificationStatus,
      sourceDocReference: {
        documentName: opp.sourceDocument,
        location: opp.sourceLocation,
        sheet: opp.sheet,
        cell: opp.cell,
        page: opp.page,
        section: opp.section
      }
    })
  }

  const handleBatchAddOpportunities = (opps: ExtractedOpportunity[]) => {
    opps.forEach(opp => {
      handleAddOpportunityFromReview(opp, 'not_started')
    })
  }

  const handleEditAndAddOpportunity = (opp: ExtractedOpportunity) => {
    setSelectedCert({
      id: '',
      title: opp.title,
      platform: opp.provider,
      provider: opp.provider,
      courseUrl: opp.url,
      relatedSubjectId: opp.suggestedSubjectId || subjects[0]?.id || '',
      status: 'not_started',
      progressPercentage: 0,
      targetDate: '2026-11-30',
      description: opp.description,
      hours: opp.hours,
      verificationStatus: opp.verificationStatus,
      sourceDocReference: {
        documentName: opp.sourceDocument,
        location: opp.sourceLocation
      }
    })
    setIsReviewModalOpen(false)
    setIsEditModalOpen(true)
  }

  // Toggle module milestone in EnhancedCourse (specializations tab)
  const handleToggleModule = (courseId: string, moduleIndex: number) => {
    const course = enhancedCourses.find(c => c.id === courseId)
    if (!course) return

    const updatedModules = course.modules.map((m, idx) => 
      idx === moduleIndex ? { ...m, completed: !m.completed } : m
    )

    const completedCount = updatedModules.filter(m => m.completed).length
    const pct = Math.round((completedCount / updatedModules.length) * 100)
    const newStatus: CourseStatus = pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : course.status

    updateEnhancedCourse(courseId, {
      modules: updatedModules,
      progressPercentage: pct,
      status: newStatus,
      completionDate: pct === 100 ? getTodayDateString() : undefined
    })
  }

  const handleToggleSpecializationCertificate = (courseId: string) => {
    const course = enhancedCourses.find(c => c.id === courseId)
    if (!course) return

    updateEnhancedCourse(courseId, {
      certificateEarned: !course.certificateEarned
    })
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-primary" />
              Certificate Hub
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono font-medium">
              Document Extracted
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Discover opportunities from college documents, open resources directly, track progress, and securely preserve credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View switcher */}
          <div className="flex items-center bg-[#111319] p-1 rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('hub')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'hub' 
                  ? 'bg-secondary text-foreground font-semibold shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Certificate Hub ({certifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specializations')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'specializations' 
                  ? 'bg-secondary text-foreground font-semibold shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Curriculum Specializations ({enhancedCourses.length})
            </button>
          </div>

          {/* Action buttons */}
          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#161a24] hover:bg-[#1e2330] border border-border text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Discover from Documents</span>
            {unaddedOpportunitiesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground font-mono text-[10px] font-bold">
                {unaddedOpportunitiesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certificate</span>
          </button>
        </div>
      </div>

      {/* Distinction & Provenance Alert Banner */}
      <div className="p-3.5 rounded-xl bg-[#111319] border border-border flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-foreground block">Verified Academic Provenance & Preservation</strong>
          <span className="text-muted-foreground text-[11px] leading-relaxed block">
            Certificates in this hub are extracted directly from official syllabus documents (such as <em>Foundations of AI/ML</em>, <em>STQA</em>, and <em>LLMs & RAG</em>) with exact sheet and cell citations. Completed certificate files are securely preserved in local origin storage.
          </span>
        </div>
      </div>

      {/* VIEW 1: ACTIVE CERTIFICATE HUB */}
      {activeTab === 'hub' && (
        <div className="space-y-5">
          {/* Metric Counter Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#111319] border border-border flex flex-col justify-between">
              <span className="text-xs text-muted-foreground">Total Tracked</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-foreground">{metrics.total}</span>
                <span className="text-[11px] text-muted-foreground font-mono">records</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111319] border border-border flex flex-col justify-between">
              <span className="text-xs text-muted-foreground">Completed (Earned)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-emerald-400">{metrics.completed}</span>
                <span className="text-[11px] text-emerald-400 font-mono">verified</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111319] border border-border flex flex-col justify-between">
              <span className="text-xs text-muted-foreground">In Progress</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-blue-400">{metrics.inProgress}</span>
                <span className="text-[11px] text-blue-400 font-mono">active</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111319] border border-border flex flex-col justify-between">
              <span className="text-xs text-muted-foreground">Preserved Proofs</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-primary">{metrics.uploadedProofs}</span>
                <span className="text-[11px] text-primary font-mono">files & links</span>
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search certificates by title, provider, skills or source doc..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 pl-9 rounded-lg bg-[#111319] border border-border text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#111319] border border-border text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="needs_review">Needs Review</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div className="w-full sm:w-56">
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#111319] border border-border text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">All Related Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            {/* Uploaded only toggle button */}
            <button
              type="button"
              onClick={() => setFilterUploadedOnly(!filterUploadedOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors shrink-0 ${
                filterUploadedOnly 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'bg-[#111319] border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>With Proof</span>
            </button>
          </div>

          {/* Cards Grid */}
          {filteredCertificates.length === 0 ? (
            <div className="p-12 rounded-xl bg-[#111319] border border-border text-center space-y-3">
              <Award className="w-10 h-10 text-muted-foreground mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {certifications.length === 0 
                    ? 'Your Certificate Hub is ready to be populated' 
                    : 'No certificates match the selected filters'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {certifications.length === 0 
                    ? `17 official certificate opportunities are already discovered in your college syllabus spreadsheets (Foundations of AI/ML, STQA, LLMs & RAG). Review and add them with one click.`
                    : 'Try clearing your search term or selecting "All Statuses" to view your records.'}
                </p>
              </div>

              {certifications.length === 0 && (
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors inline-flex items-center gap-2 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Review Discovered College Certifications (17)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCertificates.map(cert => {
                const sub = subjects.find(s => s.id === cert.relatedSubjectId)

                return (
                  <CertificateCard
                    key={cert.id}
                    cert={cert}
                    subject={sub}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteCert}
                    onUpload={handleOpenUploadModal}
                    onPreview={handleOpenViewerModal}
                    onStatusChange={handleStatusChange}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CURRICULUM SPECIALIZATIONS (BACKWARD COMPATIBLE) */}
      {activeTab === 'specializations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {enhancedCourses.map(course => {
              const sub = subjects.find(s => s.id === course.relatedSubjectId)
              const completedModules = course.modules.filter(m => m.completed).length
              const isCourseDone = course.status === 'completed' || completedModules === course.modules.length

              return (
                <div 
                  key={course.id}
                  className="p-5 rounded-xl bg-[#111319] border border-border hover:border-border/80 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
                        {course.provider}
                      </span>
                      <span className="px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground border-border">
                        {course.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight leading-snug">
                        {course.title}
                      </h3>
                      {sub && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Mapped to: <span className="text-slate-300 font-medium">{sub.name} ({sub.code})</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <a
                        href={course.courseUrl || course.verifiedUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                      >
                        <span>Verified Original Syllabus Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1 font-mono">
                        <span>Modules Completed</span>
                        <span className="font-bold text-foreground">{completedModules} / {course.modules.length} ({course.progressPercentage}%)</span>
                      </div>
                      <div className="w-full bg-[#161a24] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCourseDone ? 'bg-emerald-500' : 'bg-primary'
                          }`}
                          style={{ width: `${course.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Module Milestones Checklist */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">
                        Module Milestones
                      </span>
                      <div className="space-y-1">
                        {course.modules.map((mod, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleToggleModule(course.id, idx)}
                            className="flex items-start gap-2 p-2 rounded-lg bg-[#090a0f] border border-border hover:bg-secondary cursor-pointer transition-colors text-xs text-slate-300"
                          >
                            {mod.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                            )}
                            <span className={mod.completed ? 'line-through text-slate-500' : ''}>
                              {mod.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-border space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>Target: {course.targetDate || '2026-11-30'}</span>
                      {course.completionDate && (
                        <span className="text-emerald-400">Done: {course.completionDate}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleSpecializationCertificate(course.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                          course.certificateEarned
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{course.certificateEarned ? 'Certificate Issued ✓' : 'Mark Certificate Earned'}</span>
                      </button>

                      {course.certificateUrl && (
                        <a
                          href={course.certificateUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Proof</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Review Modal for Extracted Opportunities */}
      <CertificateReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        existingCertificates={certifications}
        subjects={subjects}
        onAddOpportunity={handleAddOpportunityFromReview}
        onBatchAddOpportunities={handleBatchAddOpportunities}
        onEditAndAdd={handleEditAndAddOpportunity}
      />

      {/* Edit / Add Modal */}
      <CertificateEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedCert(null)
        }}
        cert={selectedCert}
        subjects={subjects}
        onSave={handleSaveCert}
      />

      {/* Upload Certificate File Modal */}
      <CertificateUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false)
          setSelectedCert(null)
        }}
        cert={selectedCert}
        onUploaded={(updatedCert) => {
          updateCertification(updatedCert.id, updatedCert)
        }}
      />

      {/* Preview / Viewer Modal */}
      <CertificateViewerModal
        isOpen={isViewerModalOpen}
        onClose={() => {
          setIsViewerModalOpen(false)
          setSelectedCert(null)
        }}
        cert={selectedCert}
      />
    </div>
  )
}
