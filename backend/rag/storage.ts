/**
 * RAG Storage
 * 
 * Handles file storage, metadata, and basic operations for RAG folders
 */

import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

export interface RAGFolder {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, unknown>
}

export interface RAGFile {
  id: string
  folderId: string
  filename: string
  filePath: string
  fileSize: number
  mimeType?: string
  uploadedAt: Date
  processed: boolean
  chunkCount: number
}

export interface RAGChunk {
  id: string
  fileId: string
  chunkIndex: number
  content: string
  embedding?: number[]
  createdAt: Date
}

// In-memory stores (will be replaced with database)
const folders = new Map<string, RAGFolder>()
const files = new Map<string, RAGFile>()
const chunks = new Map<string, RAGChunk>()

// Storage directory (in project root/data/rag)
const STORAGE_DIR = path.join(process.cwd(), 'data', 'rag')

/**
 * Ensure storage directory exists
 */
async function ensureStorageDir(): Promise<void> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating storage directory:', error)
    // Continue anyway - in-memory storage will work
  }
}

// Initialize storage directory
ensureStorageDir()

/**
 * Create a RAG folder
 */
export function createRAGFolder(name: string, metadata?: Record<string, unknown>): RAGFolder {
  const folder: RAGFolder = {
    id: randomUUID(),
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata,
  }

  folders.set(folder.id, folder)
  return folder
}

/**
 * Get RAG folder by ID
 */
export function getRAGFolder(id: string): RAGFolder | undefined {
  return folders.get(id)
}

/**
 * Get RAG folder by name
 */
export function getRAGFolderByName(name: string): RAGFolder | undefined {
  return Array.from(folders.values()).find(f => f.name === name)
}

/**
 * List all RAG folders
 */
export function listRAGFolders(): RAGFolder[] {
  return Array.from(folders.values()).sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  )
}

/**
 * Delete RAG folder
 */
export function deleteRAGFolder(id: string): boolean {
  // Delete associated files
  const folderFiles = Array.from(files.values()).filter(f => f.folderId === id)
  folderFiles.forEach(file => {
    files.delete(file.id)
    // Delete chunks
    Array.from(chunks.values())
      .filter(c => c.fileId === file.id)
      .forEach(c => chunks.delete(c.id))
  })

  return folders.delete(id)
}

/**
 * Add file to RAG folder
 */
export async function addRAGFile(
  folderId: string,
  filename: string,
  fileBuffer: Buffer,
  mimeType?: string
): Promise<RAGFile> {
  const folder = folders.get(folderId)
  if (!folder) {
    throw new Error(`RAG folder not found: ${folderId}`)
  }

  const fileId = randomUUID()
  const filePath = path.join(STORAGE_DIR, folderId, filename)

  try {
    // Ensure folder directory exists
    const folderDir = path.join(STORAGE_DIR, folderId)
    await fs.mkdir(folderDir, { recursive: true })
    
    // Write file
    await fs.writeFile(filePath, fileBuffer)
  } catch (error) {
    console.error('Error writing file:', error)
    // Continue with in-memory storage
  }

  const ragFile: RAGFile = {
    id: fileId,
    folderId,
    filename,
    filePath,
    fileSize: fileBuffer.length,
    mimeType,
    uploadedAt: new Date(),
    processed: false,
    chunkCount: 0,
  }

  files.set(fileId, ragFile)
  folder.updatedAt = new Date()
  folders.set(folderId, folder)

  return ragFile
}

/**
 * Get files in a folder
 */
export function getRAGFiles(folderId: string): RAGFile[] {
  return Array.from(files.values())
    .filter(f => f.folderId === folderId)
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
}

/**
 * Get file by ID
 */
export function getRAGFile(id: string): RAGFile | undefined {
  return files.get(id)
}

/**
 * Delete RAG file
 */
export function deleteRAGFile(id: string): boolean {
  const file = files.get(id)
  if (!file) return false

  // Delete chunks
  Array.from(chunks.values())
    .filter(c => c.fileId === id)
    .forEach(c => chunks.delete(c.id))

  return files.delete(id)
}

/**
 * Supported file types
 */
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  'text/csv',
]

export const SUPPORTED_EXTENSIONS = [
  '.pdf',
  '.txt',
  '.md',
  '.html',
  '.htm',
  '.json',
  '.csv',
  '.log',
  '.py',
  '.js',
  '.ts',
  '.css',
  '.xml',
  '.yaml',
  '.yml',
]

/**
 * Check if file type is supported
 */
export function isFileTypeSupported(filename: string, mimeType?: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  
  if (SUPPORTED_EXTENSIONS.includes(ext)) {
    return true
  }

  if (mimeType && SUPPORTED_MIME_TYPES.includes(mimeType)) {
    return true
  }

  return false
}

/**
 * Update RAG file
 */
export function updateRAGFile(id: string, updates: Partial<RAGFile>): RAGFile | null {
  const file = files.get(id)
  if (!file) return null

  const updated = { ...file, ...updates }
  files.set(id, updated)
  return updated
}

/**
 * Store chunks
 */
export function storeChunks(chunkList: RAGChunk[]): void {
  chunkList.forEach(chunk => {
    chunks.set(chunk.id, chunk)
  })
}

/**
 * Get file size limit (10 MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

