import React, { useState } from 'react'
import { X, Award } from 'lucide-react'
import type { Certification, CertStatus, Subject } from '../types'
import { getTodayDateString } from '../utils/dateUtils'

interface CertificateEditModalProps {
  isOpen: boolean
  onClose: () => void
  cert: Certification | null
  subjects: Subject[]
  onSave: (certData: Partial<Certification>) => void
}

interface CertificateEditFormProps {
  cert: Certification | null
  subjects: Subject[]
  onClose: () => void
  onSave: (certData: Partial<Certification>) => void
}

const CertificateEditForm: React.FC<CertificateEditFormProps> = ({
  cert,
  subjects,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState(cert?.title || '')
  const [provider, setProvider] = useState(cert?.provider || cert?.platform || '')
  const [courseUrl, setCourseUrl] = useState(cert?.courseUrl || '')
  const [relatedSubjectId, setRelatedSubjectId] = useState(cert?.relatedSubjectId || subjects[0]?.id || '')
  const [status, setStatus] = useState<CertStatus>(cert?.status || 'not_started')
  const [progressPercentage, setProgressPercentage] = useState(String(cert?.progressPercentage ?? 0))
  const [targetDate, setTargetDate] = useState(cert?.targetDate || '2026-11-30')
  const [completionDate, setCompletionDate] = useState(cert?.completionDate || '')
  const [certificateUrl, setCertificateUrl] = useState(cert?.certificateUrl || '')
  const [sourceDoc, setSourceDoc] = useState(cert?.sourceDocReference?.documentName || '')
  const [sourceLocation, setSourceLocation] = useState(cert?.sourceDocReference?.location || '')
  const [notes, setNotes] = useState(cert?.notes || '')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !courseUrl.trim()) {
      setError('Title and course link are required.')
      return
    }

    const pct = Math.max(0, Math.min(100, Number(progressPercentage) || 0))

    onSave({
      title: title.trim(),
      platform: provider.trim() || 'External Provider',
      provider: provider.trim() || 'External Provider',
      courseUrl: courseUrl.trim(),
      relatedSubjectId: relatedSubjectId || undefined,
      status,
      progressPercentage: pct,
      targetDate,
      completionDate: status === 'completed' ? (completionDate || getTodayDateString()) : undefined,
      certificateUrl: certificateUrl.trim() || undefined,
      sourceDocReference: sourceDoc ? {
        documentName: sourceDoc.trim(),
        location: sourceLocation.trim() || undefined
      } : cert?.sourceDocReference,
      notes: notes.trim() || undefined
    })

    onClose()
  }

  return (
    <div
      className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#111319] border border-border rounded-xl shadow-2xl p-5 sm:p-6 space-y-4"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          {cert?.id ? 'Edit Certificate Record' : 'Add New Certificate'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Certificate / Course Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Google Data Analytics Professional Certificate"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Provider / Platform *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Coursera / Google / AWS"
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Mapped Syllabus Subject
            </label>
            <select
              value={relatedSubjectId}
              onChange={e => setRelatedSubjectId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">None / General Specialization</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Course / Certificate Destination URL *
          </label>
          <input
            type="url"
            required
            placeholder="https://..."
            value={courseUrl}
            onChange={e => setCourseUrl(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as CertStatus)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="needs_review">Needs Review</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={progressPercentage}
              onChange={e => setProgressPercentage(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground font-mono focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground font-mono focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {status === 'completed' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-[#090a0f] border border-border">
            <div>
              <label className="block text-xs font-medium text-emerald-400 mb-1">Completion Date</label>
              <input
                type="date"
                value={completionDate}
                onChange={e => setCompletionDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#111319] border border-border text-xs text-foreground font-mono focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Verification Link</label>
              <input
                type="url"
                placeholder="https://..."
                value={certificateUrl}
                onChange={e => setCertificateUrl(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#111319] border border-border text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Source Document Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Source Document Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Foundations of AI, ML & Data Science_Sem5.xlsx"
              value={sourceDoc}
              onChange={e => setSourceDoc(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Sheet / Cell / Section
            </label>
            <input
              type="text"
              placeholder="e.g. Sheet 'Certificates', Cell E3"
              value={sourceLocation}
              onChange={e => setSourceLocation(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground font-mono focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Notes & Key Topics
          </label>
          <textarea
            rows={2}
            placeholder="Key concepts, syllabus alignment or project built..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
          >
            {cert?.id ? 'Save Changes' : 'Create Certificate'}
          </button>
        </div>
      </form>
    </div>
  )
}

export const CertificateEditModal: React.FC<CertificateEditModalProps> = ({
  isOpen,
  onClose,
  cert,
  subjects,
  onSave
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <CertificateEditForm
        key={cert?.id || 'new-cert-form'}
        cert={cert}
        subjects={subjects}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  )
}
