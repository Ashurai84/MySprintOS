import React, { useState } from 'react'
import { X, Upload, FileText, CheckCircle2, AlertCircle, Link as LinkIcon, ShieldCheck } from 'lucide-react'
import type { Certification } from '../types'
import { saveCertificateFile } from '../services/certificateStorageService'
import { getTodayDateString } from '../utils/dateUtils'

interface CertificateUploadModalProps {
  isOpen: boolean
  onClose: () => void
  cert: Certification | null
  onUploaded: (updatedCert: Certification) => void
}

export const CertificateUploadModal: React.FC<CertificateUploadModalProps> = ({
  isOpen,
  onClose,
  cert,
  onUploaded
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [completionDate, setCompletionDate] = useState<string>(cert?.completionDate || getTodayDateString())
  const [externalVerifyUrl, setExternalVerifyUrl] = useState<string>(cert?.certificateUrl || '')
  const [credentialId, setCredentialId] = useState<string>(cert?.credentialId || '')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  if (!isOpen || !cert) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (< 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds 15 MB limit. Please select a smaller file.')
      return
    }

    // Validate type (PDF or images)
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|png|jpe?g|webp)$/i)) {
      setError('Please upload a valid PDF document or PNG/JPG image.')
      return
    }

    setError('')
    setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile && !externalVerifyUrl.trim() && !cert.uploadedCertificate) {
      setError('Please select a certificate file (PDF or image) or enter a verification URL.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      let uploadedFile = cert.uploadedCertificate

      if (selectedFile) {
        uploadedFile = await saveCertificateFile(cert.id, selectedFile)
      }

      const updatedCert: Certification = {
        ...cert,
        status: 'completed',
        progressPercentage: 100,
        completionDate: completionDate || getTodayDateString(),
        certificateUrl: externalVerifyUrl.trim() || uploadedFile?.fileData || cert.certificateUrl,
        credentialId: credentialId.trim() || undefined,
        uploadedCertificate: uploadedFile
      }

      onUploaded(updatedCert)
      onClose()
    } catch (err: any) {
      console.error('Failed to preserve certificate:', err)
      setError(err?.message || 'Failed to upload and save certificate.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[#111319] border border-border rounded-xl shadow-2xl p-5 sm:p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Upload & Preserve Certificate
            </h2>
            <p className="text-xs text-muted-foreground truncate max-w-sm mt-0.5">
              {cert.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File input area */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Certificate Document or Image (PDF, PNG, JPG) *
            </label>
            <div className="border border-dashed border-border rounded-xl p-5 text-center bg-[#090a0f] hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="cert-file-input"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="cert-file-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-semibold text-foreground">{selectedFile.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {(selectedFile.size / 1024).toFixed(0)} KB • Ready to preserve
                    </p>
                  </div>
                ) : cert.uploadedCertificate ? (
                  <div>
                    <p className="text-xs font-medium text-emerald-400 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Previously Uploaded: {cert.uploadedCertificate.filename}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Click to replace with a new file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Click to browse or drop certificate file
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Supports PDF, PNG, JPG up to 15 MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Completion Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Completion Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={completionDate}
                  onChange={e => setCompletionDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground font-mono focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Credential / Certificate ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CERT-849204"
                value={credentialId}
                onChange={e => setCredentialId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* External Verification URL */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              External Issuer Verification Link (Optional)
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://coursera.org/verify/..."
                value={externalVerifyUrl}
                onChange={e => setExternalVerifyUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#090a0f] border border-border text-xs text-foreground focus:border-primary focus:outline-none pl-8"
              />
              <LinkIcon className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Direct verification link provided by Coursera, Google, Microsoft, HackerRank, etc.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Preserve & Mark Completed'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
