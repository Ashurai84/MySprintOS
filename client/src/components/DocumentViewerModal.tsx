import React, { useState, useEffect } from 'react'
import { 
  X, 
  ExternalLink, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  ChevronDown
} from 'lucide-react'
import { officialDocuments, type OfficialDocument } from '../data/officialDocs'
import { getParsedDocument, isSpreadsheet, isWordDoc } from '../services/documentViewerService'
import { SpreadsheetViewer } from './SpreadsheetViewer'
import { DocxViewer } from './DocxViewer'

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDoc: OfficialDocument | null
  onSelectDoc?: (doc: OfficialDocument) => void
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  selectedDoc,
  onSelectDoc
}) => {
  const [currentDoc, setCurrentDoc] = useState<OfficialDocument | null>(selectedDoc)

  useEffect(() => {
    if (selectedDoc) {
      setCurrentDoc(selectedDoc)
    }
  }, [selectedDoc])

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !currentDoc) return null

  const parsedData = getParsedDocument(currentDoc.filename)

  const handleDocChange = (docId: string) => {
    const found = officialDocuments.find(d => d.id === docId)
    if (found) {
      setCurrentDoc(found)
      onSelectDoc?.(found)
    }
  }

  const getDocTypeBadge = (type: OfficialDocument['type']) => {
    switch (type) {
      case 'pdf':
        return {
          icon: FileText,
          label: 'Official PDF Document',
          color: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
        }
      case 'xlsx':
        return {
          icon: FileSpreadsheet,
          label: 'Excel Spreadsheet (.xlsx)',
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        }
      case 'docx':
        return {
          icon: FileCode,
          label: 'Word Document (.docx)',
          color: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
        }
    }
  }

  const badge = getDocTypeBadge(currentDoc.type)
  const BadgeIcon = badge.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0b0f19] border border-[#233352] rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-[#11192a] border-b border-[#1e2d47] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${badge.color}`}>
              <BadgeIcon className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${badge.color}`}>
                  {badge.label}
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-[#162136] px-2 py-0.5 rounded border border-[#233352]">
                  {currentDoc.size}
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight truncate max-w-xl">
                {currentDoc.title}
              </h3>
            </div>
          </div>

          {/* Controls: Document Switcher, Open New Tab, Download, Close */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Switcher Dropdown */}
            <div className="relative">
              <select
                value={currentDoc.id}
                onChange={e => handleDocChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-[#162136] border border-[#233352] text-xs text-slate-200 font-medium hover:border-blue-500/50 focus-ring cursor-pointer"
              >
                {officialDocuments.map(doc => (
                  <option key={doc.id} value={doc.id} className="bg-[#0b0f19] text-slate-200">
                    {doc.type.toUpperCase()}: {doc.filename}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <a
              href={currentDoc.url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#162136] hover:bg-[#1e2d47] text-slate-200 border border-[#233352] text-xs font-medium flex items-center gap-1.5 transition-colors focus-ring"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Open in New Tab</span>
            </a>

            <a
              href={currentDoc.url}
              download={currentDoc.filename}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors focus-ring"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#162136] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-[#233352] hover:border-rose-500/30 transition-colors focus-ring ml-1"
              aria-label="Close document viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 overflow-auto p-3 sm:p-5 bg-[#090e18]">
          {/* PDF Viewer */}
          {currentDoc.type === 'pdf' && (
            <div className="w-full h-[76vh] rounded-xl border border-[#233352] overflow-hidden bg-white shadow-inner">
              <iframe
                src={`${currentDoc.url}#toolbar=1`}
                title={currentDoc.title}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* Spreadsheet Viewer (.xlsx) */}
          {currentDoc.type === 'xlsx' && (
            parsedData && isSpreadsheet(parsedData) ? (
              <SpreadsheetViewer data={parsedData} maxHeight="72vh" />
            ) : (
              <div className="p-8 text-center text-slate-400 bg-[#0c121e] rounded-xl border border-[#1f2d45]">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Spreadsheet preview loading...</p>
              </div>
            )
          )}

          {/* Word Document Viewer (.docx) */}
          {currentDoc.type === 'docx' && (
            parsedData && isWordDoc(parsedData) ? (
              <DocxViewer data={parsedData} maxHeight="72vh" />
            ) : (
              <div className="p-8 text-center text-slate-400 bg-[#0c121e] rounded-xl border border-[#1f2d45]">
                <FileCode className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Document preview loading...</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
