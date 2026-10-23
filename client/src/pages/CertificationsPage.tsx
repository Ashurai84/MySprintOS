import React, { useState } from 'react'
import { 
  Award, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  DownloadCloud, 
  CheckCircle, 
  CheckSquare, 
  Square, 
  ShieldCheck 
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDisplayDate, getTodayDateString } from '../utils/dateUtils'
import type { Certification, CertStatus, CourseStatus } from '../types'

export const CertificationsPage: React.FC = () => {
  const { 
    subjects, 
    certifications, 
    addCertification, 
    updateCertification, 
    deleteCertification,
    importSyllabusCertifications,
    enhancedCourses,
    updateEnhancedCourse
  } = useApp()

  const [activeTab, setActiveTab] = useState<'specializations' | 'custom'>('specializations')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<string>('all')

  // Add / Edit Modal state for custom certifications
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<Certification | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('')
  const [courseUrl, setCourseUrl] = useState('')
  const [relatedSubjectId, setRelatedSubjectId] = useState(subjects[0]?.id || '')
  const [status, setStatus] = useState<CertStatus>('planned')
  const [progressPercentage, setProgressPercentage] = useState('0')
  const [targetDate, setTargetDate] = useState('2026-11-30')
  const [completionDate, setCompletionDate] = useState('')
  const [certificateUrl, setCertificateUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const openAddModal = () => {
    setEditingCert(null)
    setTitle('')
    setPlatform('')
    setCourseUrl('')
    setRelatedSubjectId(subjects[0]?.id || '')
    setStatus('planned')
    setProgressPercentage('0')
    setTargetDate('2026-11-30')
    setCompletionDate('')
    setCertificateUrl('')
    setNotes('')
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (cert: Certification) => {
    setEditingCert(cert)
    setTitle(cert.title)
    setPlatform(cert.platform)
    setCourseUrl(cert.courseUrl)
    setRelatedSubjectId(cert.relatedSubjectId)
    setStatus(cert.status)
    setProgressPercentage(cert.progressPercentage.toString())
    setTargetDate(cert.targetDate)
    setCompletionDate(cert.completionDate || '')
    setCertificateUrl(cert.certificateUrl || '')
    setNotes(cert.notes || '')
    setError('')
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !platform.trim() || !courseUrl.trim()) {
      setError('Title, platform, and course URL are required')
      return
    }

    const pct = Math.max(0, Math.min(100, Number(progressPercentage) || 0))

    if (editingCert) {
      updateCertification(editingCert.id, {
        title: title.trim(),
        platform: platform.trim(),
        courseUrl: courseUrl.trim(),
        relatedSubjectId,
        status,
        progressPercentage: pct,
        targetDate,
        completionDate: status === 'completed' ? (completionDate || getTodayDateString()) : undefined,
        certificateUrl: certificateUrl.trim() || undefined,
        notes: notes.trim() || undefined
      })
    } else {
      addCertification({
        title: title.trim(),
        platform: platform.trim(),
        courseUrl: courseUrl.trim(),
        relatedSubjectId,
        status,
        progressPercentage: pct,
        targetDate,
        completionDate: status === 'completed' ? (completionDate || getTodayDateString()) : undefined,
        certificateUrl: certificateUrl.trim() || undefined,
        notes: notes.trim() || undefined
      })
    }

    setIsModalOpen(false)
  }

  // Toggle module milestone in EnhancedCourse
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

  // Toggle Certificate Earned status explicitly
  const handleToggleCertificate = (courseId: string) => {
    const course = enhancedCourses.find(c => c.id === courseId)
    if (!course) return

    updateEnhancedCourse(courseId, {
      certificateEarned: !course.certificateEarned
    })
  }

  const getStatusBadge = (s: CertStatus | CourseStatus) => {
    switch (s) {
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      case 'in_progress':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
      case 'paused':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      case 'planned':
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30'
    }
  }

  // Filtered custom list
  const filteredCerts = certifications.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (filterSubject !== 'all' && c.relatedSubjectId !== filterSubject) return false
    return true
  })

  return (
    <div className="space-y-6 pb-16">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293d] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-400" />
              Certification & Course Tracking
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
              Sprint 2.1
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track syllabus specializations, modules, course completion & verified certificate issuance separately
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tab Navigation */}
          <div className="flex items-center bg-[#0e1626] p-1 rounded-lg border border-[#1e293d] text-xs">
            <button
              onClick={() => setActiveTab('specializations')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'specializations' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Curriculum Specializations ({enhancedCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'custom' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom Tracked ({certifications.length})
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors focus-ring"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Explicit Distinction Callout Banner */}
      <div className="p-3.5 rounded-xl bg-[#0e1626] border border-[#1e293d] flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-white block">Academic Distinction: Course Completion vs Certificate Issuance</strong>
          <span className="text-slate-400 text-[11px] leading-relaxed block">
            Finishing all course modules marks the course <strong>Completed</strong>. A <strong>Certificate Earned</strong> status is only granted when the university or external platform issues a verified credential link or certificate ID.
          </span>
        </div>
      </div>

      {/* TAB 1: CURRICULUM SPECIALIZATIONS (ENHANCED COURSES) */}
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
                  className="p-5 rounded-2xl bg-[#0e1626] border border-[#1e293d] hover:border-[#2b3c5e] transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Provider & Status Pill */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                        {course.provider}
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(course.status)}`}>
                        {course.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
                        {course.title}
                      </h3>
                      {sub && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Mapped to: <span className="text-slate-300 font-medium">{sub.name} ({sub.code})</span>
                        </p>
                      )}
                    </div>

                    {/* Verified Course Link */}
                    <div>
                      <a
                        href={course.courseUrl || course.verifiedUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium"
                      >
                        <span>Verified Original Syllabus Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                        <span>Modules Completed</span>
                        <span className="font-bold text-white">{completedModules} / {course.modules.length} ({course.progressPercentage}%)</span>
                      </div>
                      <div className="w-full bg-[#162138] h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCourseDone ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${course.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Module Milestones Checklist */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                        Module Milestones
                      </span>
                      <div className="space-y-1">
                        {course.modules.map((mod, idx) => (
                          <div 
                            key={idx}
                            onClick={() => handleToggleModule(course.id, idx)}
                            className="flex items-start gap-2 p-2 rounded-lg bg-[#090e1a] border border-[#1b273d] hover:bg-[#121c32] cursor-pointer transition-colors text-xs text-slate-300"
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

                    {/* Learning Outcomes */}
                    {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#090e1a] border border-[#182338] space-y-1 text-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Key Learning Outcomes:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[11px]">
                          {course.learningOutcomes.map((lo, idx) => (
                            <li key={idx}>{lo}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Footer: Dates & Certificate Distinction */}
                  <div className="pt-3 border-t border-[#1a253c] space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Target: {course.targetDate || '2026-11-30'}</span>
                      {course.completionDate && (
                        <span className="text-emerald-400">Done: {course.completionDate}</span>
                      )}
                    </div>

                    {/* Separate Certificate Status Button */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCertificate(course.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                            course.certificateEarned
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                              : 'bg-[#141f36] text-slate-400 border-[#233554] hover:text-white'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{course.certificateEarned ? 'Certificate Issued ✓' : 'Mark Certificate Earned'}</span>
                        </button>
                      </div>

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

      {/* TAB 2: CUSTOM CERTIFICATIONS */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-48">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0e1626] border border-[#1f293d] text-xs text-slate-200 focus-ring"
              >
                <option value="all">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div className="w-full sm:w-64">
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0e1626] border border-[#1f293d] text-xs text-slate-200 focus-ring"
              >
                <option value="all">All Related Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid of Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCerts.length === 0 ? (
              <div className="col-span-full p-12 rounded-xl bg-[#0e1626] border border-[#1e293d] text-center text-slate-400 text-xs">
                <Award className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-medium text-slate-300">No custom courses match the selected filters.</p>
                <button
                  onClick={importSyllabusCertifications}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#162035] border border-[#22314e] text-blue-300 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#1e2b47]"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  Import Syllabus Certifications
                </button>
              </div>
            ) : (
              filteredCerts.map(cert => {
                const sub = subjects.find(s => s.id === cert.relatedSubjectId)
                const isCompleted = cert.status === 'completed'

                return (
                  <div
                    key={cert.id}
                    className="p-5 rounded-xl bg-[#0e1626] border border-[#1e293d] hover:border-[#2b3a55] transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono font-medium text-blue-400 bg-[#162035] px-2 py-0.5 rounded border border-[#212e47]">
                              {cert.platform}
                            </span>
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(cert.status)}`}>
                              {cert.status.replace('_', ' ')}
                            </span>
                          </div>

                          <h3 className="text-sm font-semibold text-white leading-snug pt-1">
                            {cert.title}
                          </h3>
                          {sub && (
                            <p className="text-[11px] text-slate-400">
                              Mapped to: <span className="text-slate-300">{sub.name}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditModal(cert)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a2338] transition-colors focus-ring"
                            title="Edit course progress"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCertification(cert.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1a2338] transition-colors focus-ring"
                            title="Delete course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {cert.notes && (
                        <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0f19] p-2.5 rounded-lg border border-[#1a2338]">
                          {cert.notes}
                        </p>
                      )}
                    </div>

                    {/* Progress bar & Link footer */}
                    <div className="mt-4 pt-3 border-t border-[#1f293d] space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Course Progress</span>
                          <span className="font-mono font-medium text-slate-200">{cert.progressPercentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#172238] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${cert.progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Target: {formatDisplayDate(cert.targetDate)}
                        </span>

                        <div className="flex items-center gap-2">
                          {cert.certificateUrl && (
                            <a
                              href={cert.certificateUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>View Certificate</span>
                            </a>
                          )}
                          <a
                            href={cert.courseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded bg-[#162035] hover:bg-[#202d4a] text-slate-200 border border-[#233352] text-[11px] font-medium flex items-center gap-1 transition-colors focus-ring"
                          >
                            <span>Open Course</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Certification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0f172a] border border-[#23314e] rounded-xl shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-white">
              {editingCert ? 'Edit Certification' : 'Add Certification Course'}
            </h3>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Building AI Agents with RAG and LangChain"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Platform *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coursera / DeepLearning.AI"
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Related Subject</label>
                  <select
                    value={relatedSubjectId}
                    onChange={e => setRelatedSubjectId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Course URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={courseUrl}
                  onChange={e => setCourseUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as CertStatus)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progressPercentage}
                    onChange={e => setProgressPercentage(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 font-mono focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 font-mono focus-ring"
                  />
                </div>
              </div>

              {status === 'completed' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Completion Date</label>
                    <input
                      type="date"
                      value={completionDate}
                      onChange={e => setCompletionDate(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 font-mono focus-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Certificate URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://coursera.org/verify/..."
                      value={certificateUrl}
                      onChange={e => setCertificateUrl(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Key Takeaways</label>
                <textarea
                  rows={2}
                  placeholder="Key concepts or project built..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#182338] hover:bg-[#202d47] text-slate-300 text-xs font-medium transition-colors focus-ring"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors focus-ring"
                >
                  {editingCert ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
