/**
 * RAG Chunker
 * 
 * Splits text into chunks for embedding and retrieval
 */

export interface ChunkingStrategy {
  type: 'fixed-size' | 'semantic' | 'sentence'
  chunkSize?: number
  overlap?: number
}

export interface Chunk {
  content: string
  index: number
  metadata?: Record<string, unknown>
}

/**
 * Chunk text using fixed-size strategy
 */
export function chunkFixedSize(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): Chunk[] {
  const chunks: Chunk[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end)
    
    chunks.push({
      content: chunk.trim(),
      index: chunks.length,
    })

    // Move start position with overlap
    start = end - overlap
    if (start >= text.length) break
  }

  return chunks
}

/**
 * Chunk text by sentences
 */
export function chunkBySentences(
  text: string,
  maxChunkSize: number = 1000
): Chunk[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks: Chunk[] = []
  let currentChunk = ''
  let chunkIndex = 0

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex++,
      })
      currentChunk = sentence
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
    })
  }

  return chunks
}

/**
 * Chunk text (auto-select strategy)
 */
export function chunkText(
  text: string,
  strategy: ChunkingStrategy = { type: 'fixed-size', chunkSize: 1000, overlap: 200 }
): Chunk[] {
  switch (strategy.type) {
    case 'fixed-size':
      return chunkFixedSize(
        text,
        strategy.chunkSize || 1000,
        strategy.overlap || 200
      )
    case 'sentence':
      return chunkBySentences(
        text,
        strategy.chunkSize || 1000
      )
    case 'semantic':
      // For now, fall back to fixed-size
      // TODO: Implement semantic chunking
      return chunkFixedSize(
        text,
        strategy.chunkSize || 1000,
        strategy.overlap || 200
      )
    default:
      return chunkFixedSize(text)
  }
}

/**
 * Extract text from buffer based on mime type
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType?: string,
  filename?: string
): Promise<string> {
  // Handle PDF files
  if (mimeType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf')) {
    try {
      // Dynamic import to avoid loading PDF parser unless needed
      const pdfParse = await import('pdf-parse')
      const pdfData = await pdfParse.default(buffer)
      return pdfData.text || ''
    } catch (error) {
      console.error('Error extracting text from PDF:', error)
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // For text files, return the buffer as UTF-8 string
  return buffer.toString('utf-8')
}

