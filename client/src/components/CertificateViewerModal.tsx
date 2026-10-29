import React, { useEffect } from 'react'
import { X, Download, ExternalLink, FileText, CheckCircle2, Building2 } from 'lucide-react'
import type { Certification } from '../types'
import { ProviderLogo } from './ProviderLogo'

interface CertificateViewerModalProps {
  isOpen: boolean
  onClose: () => void
  cert: Certification | null
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  isOpen,
  onClose,
  cert
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !cert) return null

  const uploaded = cert.uploadedCertificate
  const isPdf = uploaded?.fileType?.includes('pdf') || uploaded?.filename?.toLowerCase().endsWith('.pdf')
  const previewSource = uploaded?.fileData || cert.certificateUrl

  const handleDownload = () => {
    if (!previewSource) return
    const a = document.createElement('a')
    a.href = previewSource
    a.download = uploaded?.filename || `${cert.title.replace(/\s+/g, '_')}_Certificate.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#111319] border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-[#0d0f14] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <ProviderLogo provider={cert.provider || cert.platform} url={cert.courseUrl} size={24} />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-foreground truncate">
                {cert.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {cert.provider || cert.platform}
                </span>
                {cert.completionDate && (
                  <span className="flex items-center gap-1 font-mono text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed: {cert.completionDate}
                  </span>
                )}
                {uploaded && (
                  <span className="font-mono text-xs text-slate-400">
                    {uploaded.filename} ({uploaded.fileSize})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {previewSource && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium flex items-center gap-1.5 transition-colors border border-border"
                title="Download Certificate"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            {cert.certificateUrl && !cert.certificateUrl.startsWith('data:') && (
              <a
                href={cert.certificateUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium flex items-center gap-1.5 transition-colors border border-primary/20"
                title="Open Issuer Verification Link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Verify Online</span>
              </a>
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

        {/* Content Viewer */}
        <div className="flex-1 p-4 bg-[#090a0f] overflow-auto flex items-center justify-center min-h-[50vh]">
          {previewSource ? (
            isPdf ? (
              <iframe
                src={previewSource}
                title={cert.title}
                className="w-full h-[68vh] rounded-lg border border-border bg-white"
              />
            ) : (
              <div className="flex flex-col items-center justify-center max-w-full">
                <img
                  src={previewSource}
                  alt={`Certificate for ${cert.title}`}
                  className="max-h-[68vh] max-w-full object-contain rounded-lg border border-border shadow-md"
                />
              </div>
            )
          ) : (
            <div className="text-center py-12 px-4 space-y-2">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">No certificate file uploaded yet.</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Upload your PDF or image certificate when completed to securely preserve and preview it here anytime.
              </p>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        {cert.sourceDocReference && (
          <div className="px-5 py-2.5 bg-[#0d0f14] border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              Source document: <strong className="text-slate-300 font-mono">{cert.sourceDocReference.documentName}</strong>
            </span>
            {cert.sourceDocReference.location && (
              <span className="font-mono text-slate-400">
                {cert.sourceDocReference.location}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
