import React, { useState } from 'react'
import {
  ExternalLink,
  Upload,
  CheckCircle2,
  Edit3,
  Trash2,
  Eye
} from 'lucide-react'
import type { Certification, CertStatus, Subject } from '../types'
import { ProviderLogo } from './ProviderLogo'
import { formatDisplayDate } from '../utils/dateUtils'

interface CertificateCardProps {
  cert: Certification
  subject?: Subject
  onEdit: (cert: Certification) => void
  onDelete: (certId: string) => void
  onUpload: (cert: Certification) => void
  onPreview: (cert: Certification) => void
  onStatusChange: (certId: string, status: CertStatus) => void
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  cert,
  subject,
  onEdit,
  onDelete,
  onUpload,
  onPreview,
  onStatusChange
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)

  // Status badge styling
  const getStatusBadge = (s: CertStatus) => {
    switch (s) {
      case 'completed':
        return {
          label: 'Completed',
          class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }
      case 'in_progress':
        return {
          label: 'In Progress',
          class: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        }
      case 'needs_review':
        return {
          label: 'Needs Review',
          class: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }
      case 'not_started':
      case 'planned':
      default:
        return {
          label: 'Not Started',
          class: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }
    }
  }

  const badge = getStatusBadge(cert.status)
  const isUploaded = Boolean(cert.uploadedCertificate || (cert.certificateUrl && cert.certificateUrl.startsWith('data:')))
  const hasExternalVerify = Boolean(cert.certificateUrl && !cert.certificateUrl.startsWith('data:'))

  return (
    <div className="bg-[#111319] border border-border rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-border/80 transition-colors">
      <div className="space-y-3">
        {/* Top bar: Provider & Logo + Status Pill + Edit/Delete */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <ProviderLogo
              provider={cert.provider || cert.platform}
              url={cert.courseUrl}
              size={18}
            />
            <span className="text-xs font-medium text-slate-300 truncate">
              {cert.provider || cert.platform}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick status dropdown selector */}
            <select
              value={cert.status}
              onChange={e => onStatusChange(cert.id, e.target.value as CertStatus)}
              className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border bg-transparent cursor-pointer focus:outline-none ${badge.class}`}
              title="Change certificate status"
            >
              <option value="not_started" className="bg-[#111319] text-slate-300">Not Started</option>
              <option value="in_progress" className="bg-[#111319] text-blue-400">In Progress</option>
              <option value="completed" className="bg-[#111319] text-emerald-400">Completed</option>
              <option value="needs_review" className="bg-[#111319] text-amber-400">Needs Review</option>
            </select>

            <button
              type="button"
              onClick={() => onEdit(cert)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Edit certificate details"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete certificate"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight leading-snug">
            {cert.title}
          </h3>
          {subject && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Mapped to: <span className="text-slate-300 font-medium">{subject.name}</span>
            </p>
          )}
        </div>

        {/* Description or Notes */}
        {(cert.description || cert.notes) && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {cert.description || cert.notes}
          </p>
        )}

        {/* Source Document Reference */}
        {cert.sourceDocReference && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono bg-[#090a0f] px-2.5 py-1.5 rounded-lg border border-border/70 truncate">
            <span className="text-slate-400 font-medium">Source:</span>
            <span className="truncate text-slate-300">{cert.sourceDocReference.documentName}</span>
            {cert.sourceDocReference.location && (
              <>
                <span>•</span>
                <span className="text-slate-400 shrink-0">{cert.sourceDocReference.location}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Dates & Actions */}
      <div className="pt-3 border-t border-border space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          {cert.status === 'completed' && cert.completionDate ? (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed: {formatDisplayDate(cert.completionDate)}
            </span>
          ) : (
            <span>Target: {formatDisplayDate(cert.targetDate || '2026-11-30')}</span>
          )}

          {cert.progressPercentage !== undefined && cert.status === 'in_progress' && (
            <span className="text-blue-400">{cert.progressPercentage}% done</span>
          )}
        </div>

        {/* Action buttons row */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
          {/* Direct link to original course resource */}
          <a
            href={cert.courseUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium flex items-center gap-1.5 transition-colors border border-border"
            title="Open original course or registration page"
          >
            <span>Open Resource</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>

          <div className="flex items-center gap-1.5">
            {/* Preview action if certificate file is uploaded */}
            {(isUploaded || hasExternalVerify) && (
              <button
                type="button"
                onClick={() => onPreview(cert)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5 transition-colors border border-emerald-500/20"
                title="Preview uploaded certificate proof"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            )}

            {/* Upload action for completed certificate */}
            <button
              type="button"
              onClick={() => onUpload(cert)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${isUploaded
                ? 'bg-secondary hover:bg-secondary/80 text-muted-foreground border-border'
                : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
                }`}
              title={isUploaded ? 'Re-upload / replace certificate' : 'Upload certificate file'}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploaded ? 'Replace' : 'Upload File'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#111319] border border-border rounded-xl shadow-2xl p-5 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Delete Certificate?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-200">{cert.title}</strong> from your Certificate Hub? Any uploaded certificate files will also be removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  onDelete(cert.id)
                }}
                className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
