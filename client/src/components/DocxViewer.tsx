import React, { useState } from 'react'
import { Search, Printer, Sparkles, BookOpen } from 'lucide-react'
import type { ParsedWordDoc } from '../services/documentViewerService'

interface DocxViewerProps {
  data: ParsedWordDoc
  maxHeight?: string
}

export const DocxViewer: React.FC<DocxViewerProps> = ({
  data,
  maxHeight = '550px'
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  // If search query is provided, highlight occurrences in HTML
  const displayHtml = React.useMemo(() => {
    if (!searchQuery.trim()) return data.html

    try {
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(?![^<]*>)(${escaped})`, 'gi')
      return data.html.replace(regex, '<mark class="bg-amber-400/30 text-amber-200 px-1 rounded border border-amber-400/50">$1</mark>')
    } catch {
      return data.html
    }
  }, [data.html, searchQuery])

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${data.filename}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; color: #111; }
              table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 13px; }
              th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
              th { background: #f0f0f0; }
              h1, h2, h3 { color: #111; }
            </style>
          </head>
          <body>
            <h2>${data.filename}</h2>
            <hr/>
            ${data.html}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  return (
    <div className="flex flex-col rounded-xl bg-[#0c121e] border border-[#1e2d47] overflow-hidden shadow-lg">
      {/* Top Bar */}
      <div className="p-3 bg-[#11192a] border-b border-[#1e2d47] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-200 truncate">
            Document Reader: {data.filename}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search within document */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Find in syllabus..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0a0f1a] border border-[#1f2d47] text-xs text-slate-200 placeholder-slate-500 focus-ring"
            />
          </div>

          <button
            onClick={handlePrint}
            title="Print or Save as PDF"
            className="p-1.5 rounded-lg bg-[#162136] hover:bg-[#1f2d47] text-slate-300 hover:text-white border border-[#233352] transition-colors focus-ring"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Formatted HTML Document Container */}
      <div 
        className="p-6 md:p-8 overflow-auto bg-[#0a0f1a] text-slate-200"
        style={{ maxHeight }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Document Content */}
          <div 
            className="document-reader"
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-[#0e1524] border-t border-[#1e2d47] flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Rich Document Reader • Zero download required</span>
        </div>
        <div className="font-mono text-[10px] text-slate-500">
          Source: Official University DOCX
        </div>
      </div>
    </div>
  )
}
