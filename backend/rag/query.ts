/**
 * RAG Query Module
 * 
 * Handles querying RAG folders for relevant context
 */

import { getRAGFiles, getRAGFolder } from './storage'
import { RAGChunk } from './storage'

// In-memory chunk index (folderId -> chunks[])
export const folderChunks = new Map<string, RAGChunk[]>()

/**
 * Get RAG context for a query
 * @param folderId - RAG folder ID
 * @param query - Query string to search for
 * @param maxChunks - Maximum number of chunks to return
 * @returns Context string or null if no chunks found
 */
export async function getRAGContext(
  folderId: string,
  query: string,
  maxChunks: number = 5
): Promise<string | null> {
  const chunks = folderChunks.get(folderId) || []
  
  if (chunks.length === 0) {
    return null
  }

  // Simple text matching for now (can be enhanced with semantic search)
  const queryLower = query.toLowerCase()
  const relevantChunks = chunks
    .filter(chunk => chunk.content.toLowerCase().includes(queryLower))
    .slice(0, maxChunks)

  if (relevantChunks.length === 0) {
    // If no exact match, return first few chunks
    return chunks.slice(0, maxChunks).map(c => c.content).join('\n\n')
  }

  return relevantChunks.map(c => c.content).join('\n\n')
}

/**
 * Build RAG-enhanced prompt
 * @param enhancedInput - Already enhanced input
 * @param originalInput - Original user input
 * @param ragFolderId - RAG folder ID
 * @returns Enhanced prompt with RAG context
 */
export async function buildRAGPrompt(
  enhancedInput: string,
  originalInput: string,
  ragFolderId: string
): Promise<string> {
  const folder = getRAGFolder(ragFolderId)
  if (!folder) {
    return enhancedInput
  }

  const context = await getRAGContext(ragFolderId, originalInput, 5)
  
  if (!context) {
    return enhancedInput
  }

  return `## Relevant Context from ${folder.name}

${context}

---

## User Request

${enhancedInput}`
}

/**
 * Index chunks for a folder
 * @param folderId - RAG folder ID
 * @param chunks - Optional chunks to store (if not provided, loads from storage)
 */
export async function indexFolderChunks(folderId: string, chunks?: RAGChunk[]): Promise<void> {
  const folder = getRAGFolder(folderId)
  if (!folder) {
    throw new Error(`Folder not found: ${folderId}`)
  }

  if (chunks) {
    // Store provided chunks
    folderChunks.set(folderId, chunks)
  } else {
    // Initialize empty chunk array if not exists
    if (!folderChunks.has(folderId)) {
      folderChunks.set(folderId, [])
    }
  }
}

