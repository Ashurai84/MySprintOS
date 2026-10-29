import React, { useState } from 'react'
import {
  Sparkles,
  User,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  FileCheck,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info
} from 'lucide-react'
import type { TutorMessage, TutorCitation } from '../../types'

interface TutorMessageItemProps {
  message: TutorMessage
  onRetry?: () => void
}

/**
 * Tokenizes and renders inline markdown with proper user/assistant contrast
 */
const renderInlineText = (text: string, isUserMessage: boolean = false): React.ReactNode => {
  if (!text) return null

  // Match bold (**...**), inline code (`...`), italic (*...*), or urls
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|https?:\/\/[^\s]+)/g
  const parts = text.split(regex)

  return parts.map((part, i) => {
    if (!part) return null

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className={`font-bold ${isUserMessage ? 'text-white' : 'text-zinc-950'}`}>
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className={`px-1.5 py-0.5 mx-0.5 rounded font-mono text-[11px] inline-block font-semibold ${isUserMessage
            ? 'bg-zinc-800 text-white border border-zinc-700'
            : 'bg-zinc-200/90 text-zinc-950 border border-zinc-300'
            }`}
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={i} className={`italic ${isUserMessage ? 'text-zinc-300' : 'text-zinc-600'}`}>
          {part.slice(1, -1)}
        </em>
      )
    }

    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 transition-colors ${isUserMessage ? 'text-white hover:text-zinc-200' : 'text-black font-medium hover:text-zinc-600'
            }`}
        >
          {part}
        </a>
      )
    }

    return <span key={i} className={isUserMessage ? 'text-white' : undefined}>{part}</span>
  })
}

export const TutorMessageItem: React.FC<TutorMessageItemProps> = ({ message, onRetry }) => {
  const isUser = message.role === 'user'
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedCmd, setCopiedCmd] = useState(false)
  const [expandedCitationIds, setExpandedCitationIds] = useState<Record<string, boolean>>({})

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd)
    setCopiedCmd(true)
    setTimeout(() => setCopiedCmd(false), 2000)
  }

  const toggleCitation = (id: string) => {
    setExpandedCitationIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const getSourceIcon = (sourceType?: string, docName?: string) => {
    const name = docName || ''
    if (sourceType === 'xlsx' || name.endsWith('.xlsx')) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
    }
    if (sourceType === 'pdf' || name.endsWith('.pdf')) {
      return <FileCheck className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
    }
    return <FileText className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
  }

  // Parse markdown table rows
  const renderTable = (lines: string[], keyPrefix: number | string, isUserMessage: boolean = false) => {
    if (lines.length < 2) return null
    const headerLine = lines[0]
    const headerCols = headerLine.split('|').map(c => c.trim()).filter(Boolean)

    // Skip separator line (|---|---|)
    const bodyLines = lines.slice(1).filter(l => !l.replace(/[\s|:-]/g, '').length === false && !/^\|[\s\-:|]+\|$/.test(l.trim()))

    return (
      <div key={keyPrefix} className={`my-3 overflow-x-auto rounded-xl border shadow-xs ${isUserMessage ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
        }`}>
        <table className="w-full border-collapse text-left text-xs font-mono">
          <thead>
            <tr className={isUserMessage ? 'bg-zinc-800 border-b border-zinc-700' : 'bg-zinc-100 border-b border-zinc-200'}>
              {headerCols.map((h, i) => (
                <th key={i} className={`px-3 py-2 font-bold tracking-wide ${isUserMessage ? 'text-white' : 'text-zinc-950'}`}>
                  {renderInlineText(h, isUserMessage)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={isUserMessage ? 'divide-y divide-zinc-800' : 'divide-y divide-zinc-200'}>
            {bodyLines.map((rowLine, rIdx) => {
              const cells = rowLine.split('|').map(c => c.trim()).filter(Boolean)
              return (
                <tr key={rIdx} className={isUserMessage ? 'hover:bg-zinc-800/60' : 'hover:bg-zinc-50 odd:bg-zinc-50/50'}>
                  {cells.map((cell, cIdx) => (
                    <td key={cIdx} className={`px-3 py-2 ${isUserMessage ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      {renderInlineText(cell, isUserMessage)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Format message content with clean headings, code blocks, tables, and lists
  const renderFormattedContent = (content: string, isUserMessage: boolean = false) => {
    // Split by code fences ```lang ... ```
    const codeFenceParts = content.split(/(```[\s\S]*?```)/g)

    return codeFenceParts.map((part, partIdx) => {
      // 1. Code block with high contrast dark interior and black copy button
      if (part.startsWith('```') && part.endsWith('```')) {
        const firstLineEnd = part.indexOf('\n')
        const language = part.slice(3, firstLineEnd).trim() || 'code'
        const code = part.slice(firstLineEnd + 1, -3).trim()

        return (
          <div key={partIdx} className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-black text-xs shadow-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-zinc-300 font-mono">
              <span className="uppercase text-[10px] tracking-wider font-semibold text-zinc-200">
                {language}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(code, partIdx)}
                className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Copy code to clipboard"
              >
                {copiedIndex === partIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span className="text-white font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 overflow-x-auto font-mono text-zinc-100 text-xs leading-relaxed bg-black">
              <code>{code}</code>
            </pre>
          </div>
        )
      }

      // 2. Text sections (paragraphs, tables, lists, headers)
      const paragraphs = part.split(/\n\n+/).filter(Boolean)

      return (
        <div key={partIdx} className="space-y-2">
          {paragraphs.map((block, bIdx) => {
            const trimmed = block.trim()
            const lines = trimmed.split('\n')

            // Table check: at least 2 lines with pipe delimiters
            const isTable = lines.length >= 2 && lines.every(l => l.trim().startsWith('|') && l.trim().endsWith('|'))
            if (isTable) {
              return renderTable(lines, `${partIdx}-${bIdx}`, isUserMessage)
            }

            // Heading 1: # Heading
            if (trimmed.startsWith('# ')) {
              return (
                <h1 key={bIdx} className={`text-base sm:text-lg font-bold mt-4 mb-2 pb-1 border-b tracking-tight ${isUserMessage ? 'text-white border-zinc-800' : 'text-zinc-950 border-zinc-200'
                  }`}>
                  {renderInlineText(trimmed.replace(/^#\s+/, ''), isUserMessage)}
                </h1>
              )
            }

            // Heading 2: ## Heading
            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={bIdx} className={`text-sm sm:text-base font-bold mt-3.5 mb-1.5 pb-0.5 border-b tracking-tight ${isUserMessage ? 'text-white border-zinc-800' : 'text-zinc-950 border-zinc-200'
                  }`}>
                  {renderInlineText(trimmed.replace(/^##\s+/, ''), isUserMessage)}
                </h2>
              )
            }

            // Heading 3: ### Heading
            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={bIdx} className={`text-xs sm:text-sm font-bold mt-3 mb-1 ${isUserMessage ? 'text-white' : 'text-zinc-950'
                  }`}>
                  {renderInlineText(trimmed.replace(/^###\s+/, ''), isUserMessage)}
                </h3>
              )
            }

            // Heading 4: #### Heading
            if (trimmed.startsWith('#### ')) {
              return (
                <h4 key={bIdx} className={`text-xs font-semibold mt-2 mb-1 ${isUserMessage ? 'text-white' : 'text-zinc-900'
                  }`}>
                  {renderInlineText(trimmed.replace(/^####\s+/, ''), isUserMessage)}
                </h4>
              )
            }

            // Blockquote: > text
            if (trimmed.startsWith('> ')) {
              return (
                <blockquote key={bIdx} className={`border-l-2 pl-3 py-1.5 my-2 italic text-xs rounded-r ${isUserMessage ? 'border-white bg-zinc-900 text-zinc-200' : 'border-black bg-zinc-100 text-zinc-700'
                  }`}>
                  {renderInlineText(trimmed.replace(/^>\s+/, ''), isUserMessage)}
                </blockquote>
              )
            }

            // Bullet list: - or *
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              const items = trimmed.split(/\n/).filter(Boolean)
              return (
                <ul key={bIdx} className={`list-disc pl-5 space-y-1.5 my-1.5 ${isUserMessage ? 'text-white' : 'text-zinc-800'
                  }`}>
                  {items.map((item, iIdx) => (
                    <li key={iIdx} className="leading-relaxed">
                      {renderInlineText(item.replace(/^[-*]\s+/, ''), isUserMessage)}
                    </li>
                  ))}
                </ul>
              )
            }

            // Numbered list: 1. , 2.
            if (/^\d+\.\s+/.test(trimmed)) {
              const items = trimmed.split(/\n/).filter(Boolean)
              return (
                <ol key={bIdx} className={`list-decimal pl-5 space-y-1.5 my-1.5 ${isUserMessage ? 'text-white' : 'text-zinc-800'
                  }`}>
                  {items.map((item, iIdx) => (
                    <li key={iIdx} className="leading-relaxed">
                      {renderInlineText(item.replace(/^\d+\.\s+/, ''), isUserMessage)}
                    </li>
                  ))}
                </ol>
              )
            }

            // Standard paragraph with inline formatting
            return (
              <p key={bIdx} className={`leading-relaxed my-1.5 text-xs sm:text-sm ${isUserMessage ? 'text-white font-normal' : 'text-zinc-800'
                }`}>
                {renderInlineText(trimmed, isUserMessage)}
              </p>
            )
          })}
        </div>
      )
    })
  }

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const isErrorMsg = Boolean(
    message.isError ||
    message.content?.includes('Could not connect to the SprintOS backend') ||
    message.content?.includes('Failed to reach Groq API') ||
    message.content?.includes('Groq API rate limit') ||
    message.content?.includes('The server Groq API key is invalid')
  )

  const citations: TutorCitation[] = message.citations || []
  const hasCitations = citations.length > 0

  return (
    <div className={`flex gap-3 text-xs sm:text-sm ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-black text-white border border-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[82%] space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`p-4 sm:p-5 rounded-2xl border leading-relaxed ${isUser
            ? 'bg-black text-white border-black rounded-tr-xs shadow-sm'
            : isErrorMsg
              ? 'bg-red-50 border-red-200 text-red-900 rounded-tl-xs shadow-xs'
              : 'bg-white border-zinc-200/90 text-zinc-900 rounded-tl-xs shadow-xs'
            }`}
        >
          {isErrorMsg ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Unable to complete response</span>
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                {message.content}
              </p>
              {message.content?.includes('Could not connect to the SprintOS backend') && (
                <div className="mt-2 p-3 rounded-xl bg-white border border-red-200 text-xs font-mono text-zinc-800 space-y-1.5 shadow-xs">
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">
                    Terminal command to start backend:
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-zinc-100 p-2 rounded-lg border border-zinc-200">
                    <code className="text-black font-bold font-mono text-xs select-all">
                      npm run server
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyCommand('npm run server')}
                      className="px-2.5 py-1 rounded bg-black text-white hover:bg-zinc-800 text-[11px] font-sans font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      {copiedCmd ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-300" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-black text-white hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-white" />
                  <span>Retry Request</span>
                </button>
              )}
            </div>
          ) : (
            renderFormattedContent(message.content, isUser)
          )}
        </div>

        {/* Source Citations & Grounding Indicator */}
        {!isUser && !isErrorMsg && (
          <div className="space-y-1.5 pt-0.5">
            {hasCitations ? (
              <div className="space-y-2">
                {/* Grounding Header Pill */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-900 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-black shrink-0" />
                  <span>University Syllabus Grounded</span>
                  <span className="text-zinc-500 font-normal">({citations.length} verified excerpt{citations.length > 1 ? 's' : ''})</span>
                </div>

                {/* Citation Cards */}
                <div className="space-y-1.5">
                  {citations.map((c, idx) => {
                    const citeKey = c.id || `cite-${idx}`
                    const isExpanded = Boolean(expandedCitationIds[citeKey])

                    return (
                      <div
                        key={citeKey}
                        className="rounded-xl border border-zinc-200/90 bg-white p-3 text-xs transition-colors hover:border-zinc-400 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            {getSourceIcon(c.sourceType, c.documentName)}
                            <span className="font-semibold text-zinc-900 truncate max-w-[280px]">
                              {c.documentName}
                            </span>
                            {c.location && (
                              <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[10px] font-mono text-zinc-800 border border-zinc-200 font-medium shrink-0">
                                {c.location}
                              </span>
                            )}
                          </div>

                          {c.excerpt && (
                            <button
                              type="button"
                              onClick={() => toggleCitation(citeKey)}
                              className="text-[11px] text-zinc-600 hover:text-black flex items-center gap-1 shrink-0 font-mono transition-colors cursor-pointer font-medium"
                              title={isExpanded ? 'Hide source excerpt' : 'View supporting source excerpt'}
                            >
                              <span>{isExpanded ? 'Hide' : 'Excerpt'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3 text-black" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-zinc-600" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Expandable Verbatim Excerpt */}
                        {isExpanded && c.excerpt && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-200 text-[11px] font-mono text-zinc-800 bg-zinc-50 p-2.5 rounded-lg border-l-2 border-black leading-relaxed whitespace-pre-wrap">
                            <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1 font-bold">
                              Official Document Excerpt:
                            </span>
                            "{c.excerpt}"
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              // Ungrounded Notice
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>General Educational Explanation • Not from official university documents</span>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] text-zinc-400 font-mono px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-black text-white border border-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  )
}