/**
 * RAG Chunker Module
 * 
 * Handles chunking text and extracting text from various file types
 */

import { RAGChunk } from './storage'
import { randomUUID } from 'crypto'

/**
 * Chunk text into smaller pieces
 * @param text - Text to chunk
 * @param chunkSize - Maximum chunk size in characters
 * @param overlap - Overlap between chunks in characters
 * @returns Array of chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): RAGChunk[] {
  if (!text || text.length === 0) {
    return []
  }

  const chunks: RAGChunk[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const content = text.substring(start, end).trim()

    if (content.length > 0) {
      chunks.push({
        id: randomUUID(),
        fileId: '', // Will be set by caller
        chunkIndex: chunks.length,
        content,
        createdAt: new Date(),
      })
    }

    start = end - overlap
    if (start >= text.length) break
  }

  return chunks
}

/**
 * Extract text from buffer
 * @param buffer - File buffer
 * @param mimeType - MIME type of the file
 * @param filename - Optional filename for context
 * @returns Extracted text
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType?: string,
  filename?: string
): Promise<string> {
  // Basic text extraction
  if (mimeType?.startsWith('text/') || mimeType === 'application/json') {
    return buffer.toString('utf-8')
  }

  // For PDFs, we'd need pdf-parse, but for now return empty
  if (mimeType === 'application/pdf') {
    try {
      // Try dynamic import of pdf-parse if available
      const pdfParseModule = await import('pdf-parse')
      const pdfParse = ('default' in pdfParseModule ? pdfParseModule.default : pdfParseModule) as (buffer: Buffer) => Promise<{ text: string }>
      const pdfData = await pdfParse(buffer)
      return pdfData.text
    } catch (error) {
      // PDF parsing not available, return empty string
      return ''
    }
  }

  // Default: try UTF-8
  try {
    return buffer.toString('utf-8')
  } catch {
    return ''
  }
}

