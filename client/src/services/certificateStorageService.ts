import type { UploadedCertificateFile } from '../types'

const DB_NAME = 'SprintOS_CertificateStore'
const DB_VERSION = 1
const STORE_NAME = 'certificate_files'

// In-memory fallback if IndexedDB is unavailable (e.g. in certain SSR/test environments)
const memoryStore = new Map<string, UploadedCertificateFile>()

function hasIndexedDB(): boolean {
  return typeof window !== 'undefined' && Boolean(window.indexedDB)
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      reject(new Error('IndexedDB is not supported in this environment'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'storageKey' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function fileToDataUrl(file: File | Blob): Promise<string> {
  const mimeType = file.type || 'application/octet-stream'
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  // Node.js or environment without browser FileReader
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = typeof btoa !== 'undefined'
    ? btoa(binary)
    : ((globalThis as any).Buffer ? (globalThis as any).Buffer.from(binary, 'binary').toString('base64') : '')
  return `data:${mimeType};base64,${base64}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Saves a certificate file (PDF, PNG, JPG, WebP) securely in IndexedDB
 */
export async function saveCertificateFile(
  certId: string,
  file: File
): Promise<UploadedCertificateFile> {
  const dataUrl = await fileToDataUrl(file)
  const storageKey = `cert_file_${certId}`

  const uploadedFile: UploadedCertificateFile = {
    filename: file.name,
    fileType: file.type || 'application/octet-stream',
    fileSize: formatFileSize(file.size),
    uploadedAt: new Date().toISOString(),
    fileData: dataUrl,
    storageKey
  }

  if (!hasIndexedDB()) {
    memoryStore.set(storageKey, uploadedFile)
    return uploadedFile
  }

  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const putReq = store.put({ ...uploadedFile, storageKey })

      putReq.onsuccess = () => resolve()
      putReq.onerror = () => reject(putReq.error)
    })
  } catch (err) {
    memoryStore.set(storageKey, uploadedFile)
  }

  return uploadedFile
}

/**
 * Retrieves a certificate file by certId from IndexedDB or memory fallback
 */
export async function getCertificateFile(
  certId: string
): Promise<UploadedCertificateFile | null> {
  const storageKey = `cert_file_${certId}`

  if (!hasIndexedDB()) {
    return memoryStore.get(storageKey) || null
  }

  try {
    const db = await openDB()
    const result = await new Promise<UploadedCertificateFile | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const getReq = store.get(storageKey)

      getReq.onsuccess = () => resolve(getReq.result || null)
      getReq.onerror = () => reject(getReq.error)
    })

    if (result) return result
  } catch (err) {
    // Fall back to memoryStore
  }

  return memoryStore.get(storageKey) || null
}

/**
 * Deletes a certificate file by certId from IndexedDB
 */
export async function deleteCertificateFile(certId: string): Promise<boolean> {
  const storageKey = `cert_file_${certId}`
  memoryStore.delete(storageKey)

  if (!hasIndexedDB()) {
    return true
  }

  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const delReq = store.delete(storageKey)

      delReq.onsuccess = () => resolve()
      delReq.onerror = () => reject(delReq.error)
    })
    return true
  } catch (err) {
    return true
  }
}
