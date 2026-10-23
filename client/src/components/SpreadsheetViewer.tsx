import React, { useState, useMemo } from 'react'
import { Search, FileSpreadsheet, Layers, Sparkles } from 'lucide-react'
import type { ParsedSpreadsheetDoc } from '../services/documentViewerService'

interface SpreadsheetViewerProps {
  data: ParsedSpreadsheetDoc
  maxHeight?: string
}

export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({
  data,
  maxHeight = '550px'
}) => {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const activeSheet = data.sheets[activeSheetIndex] || data.sheets[0]

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!activeSheet) return []
    if (!searchQuery.trim()) return activeSheet.rows

    const q = searchQuery.toLowerCase().trim()
    return activeSheet.rows.filter((row, idx) => {
      // Always include header row 0 in filtering context if user is searching data
      if (idx === 0) return true
      return row.some(cell => String(cell).toLowerCase().includes(q))
    })
  }, [activeSheet, searchQuery])

  if (!activeSheet) {
    return (
      <div className="p-8 text-center text-slate-400 bg-[#0c121e] rounded-xl border border-[#1f2d45]">
        <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm font-medium">No sheet data available in this spreadsheet.</p>
      </div>
    )
  }

  // Calculate max columns to ensure uniform grid
  const maxCols = Math.max(...activeSheet.rows.map(r => r.length), 1)

  return (
    <div className="flex flex-col rounded-xl bg-[#0c121e] border border-[#1e2d47] overflow-hidden shadow-lg">
      {/* Top Bar: Sheet tabs and Search */}
      <div className="p-3 bg-[#11192a] border-b border-[#1e2d47] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sheet Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Sheets:
          </span>
          {data.sheets.map((sheet, index) => {
            const isActive = index === activeSheetIndex
            return (
              <button
                key={sheet.name}
                onClick={() => {
                  setActiveSheetIndex(index)
                  setSearchQuery('')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all focus-ring flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-[#162136] text-slate-300 hover:text-white hover:bg-[#1f2d47] border border-[#233352]'
                }`}
              >
                <span>{sheet.name}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${
                  isActive ? 'bg-blue-800 text-blue-100' : 'bg-[#0d1424] text-slate-400'
                }`}>
                  {sheet.rows.length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input and Row Counter */}
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder={`Search in "${activeSheet.name}"...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0a0f1a] border border-[#1f2d47] text-xs text-slate-200 placeholder-slate-500 focus-ring"
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-[#162136] px-2 py-1 rounded border border-[#233352] whitespace-nowrap">
            {filteredRows.length} {filteredRows.length === 1 ? 'row' : 'rows'}
          </span>
        </div>
      </div>

      {/* Spreadsheet Grid Container */}
      <div 
        className="overflow-auto relative bg-[#090e18]"
        style={{ maxHeight }}
      >
        <table className="w-full border-collapse text-left text-xs font-normal">
          <thead className="sticky top-0 z-20 bg-[#141d30] border-b-2 border-blue-500/40 shadow-xs">
            <tr>
              <th className="w-12 px-2.5 py-2 text-center text-[11px] font-mono text-slate-400 bg-[#141d30] border-r border-[#202f4a] shrink-0">
                #
              </th>
              {Array.from({ length: maxCols }).map((_, colIdx) => {
                // Column letters (A, B, C... Z, AA...)
                const colLetter = String.fromCharCode(65 + (colIdx % 26))
                const headerText = activeSheet.headers[colIdx] || colLetter
                return (
                  <th
                    key={colIdx}
                    className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-200 uppercase tracking-wider bg-[#141d30] border-r border-[#202f4a] whitespace-nowrap min-w-[120px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{headerText}</span>
                      <span className="text-[9px] font-mono text-slate-500">{colLetter}</span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#172338]">
            {filteredRows.length === 0 ? (
              <tr>
                <td 
                  colSpan={maxCols + 1}
                  className="px-6 py-12 text-center text-slate-400 text-xs"
                >
                  <p>No rows matched your search "{searchQuery}".</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-blue-400 hover:underline font-medium"
                  >
                    Clear search filter
                  </button>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rowIdx) => {
                const isHeaderRow = rowIdx === 0 && !searchQuery
                return (
                  <tr
                    key={rowIdx}
                    className={`transition-colors ${
                      isHeaderRow 
                        ? 'bg-[#152033] font-semibold text-white' 
                        : rowIdx % 2 === 0 
                          ? 'bg-[#090e18] hover:bg-[#121c2e]' 
                          : 'bg-[#0d1422] hover:bg-[#121c2e]'
                    }`}
                  >
                    {/* Row Index Number */}
                    <td className="px-2.5 py-2 text-center font-mono text-[10px] text-slate-500 bg-[#0e1626]/80 border-r border-[#1a273f] select-none">
                      {rowIdx + 1}
                    </td>

                    {/* Cells */}
                    {Array.from({ length: maxCols }).map((_, colIdx) => {
                      const cellValue = row[colIdx] !== undefined ? String(row[colIdx]) : ''
                      const isHighlighted = searchQuery && cellValue.toLowerCase().includes(searchQuery.toLowerCase())

                      return (
                        <td
                          key={colIdx}
                          className="px-3.5 py-2 border-r border-[#172338] text-slate-300 align-top text-xs leading-relaxed max-w-md break-words"
                        >
                          {isHighlighted ? (
                            <span className="bg-amber-400/20 text-amber-200 px-1 rounded border border-amber-400/40">
                              {cellValue}
                            </span>
                          ) : (
                            cellValue || <span className="text-slate-600 font-mono text-[11px]">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Sheet Footer Information */}
      <div className="p-2.5 bg-[#0e1524] border-t border-[#1e2d47] flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Sheet: <strong className="text-slate-200">{activeSheet.name}</strong></span>
        </div>
        <div className="font-mono text-[10px] text-slate-500">
          Spreadsheet parsed offline • Zero download required
        </div>
      </div>
    </div>
  )
}
