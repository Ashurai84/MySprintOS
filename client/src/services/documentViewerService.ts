import parsedDocsData from '../data/parsedAcademicDocs.json'

export interface SpreadsheetSheet {
  name: string
  rowCount: number
  headers: string[]
  rows: (string | number)[][]
}

export interface ParsedSpreadsheetDoc {
  type: 'xlsx'
  filename: string
  sheets: SpreadsheetSheet[]
}

export interface ParsedWordDoc {
  type: 'docx'
  filename: string
  html: string
  plainText: string
}

export type ParsedDocument = ParsedSpreadsheetDoc | ParsedWordDoc

export function getParsedDocument(filename: string): ParsedDocument | undefined {
  const docs = parsedDocsData as Record<string, any>
  return docs[filename]
}

export function isSpreadsheet(doc: ParsedDocument): doc is ParsedSpreadsheetDoc {
  return doc.type === 'xlsx'
}

export function isWordDoc(doc: ParsedDocument): doc is ParsedWordDoc {
  return doc.type === 'docx'
}
