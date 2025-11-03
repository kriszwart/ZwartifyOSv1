/**
 * RAG Query
 * 
 * Semantic search and retrieval from RAG folders
 */

import { RAGChunk } from './storage'
import { createEmbedding, cosineSimilarity } from './embedder'

// In-memory chunk store (will be replaced with database/vector DB)
const chunkStore = new Map<string, RAGChunk[]>()
export const folderChunks = new Map<string, RAGChunk[]>() // folderId -> chunks

/**
 * Index chunks for a folder
 */
export function indexFolderChunks(folderId: string, chunks: RAGChunk[]): void {
  folderChunks.set(folderId, chunks)
}

/**
 * Search RAG folder with semantic similarity
 */
export async function searchRAGFolder(
  folderId: string,
  query: string,
  limit: number = 5
): Promise<Array<{ chunk: RAGChunk; similarity: number }>> {
  const chunks = folderChunks.get(folderId) || []
  
  if (chunks.length === 0) {
    return []
  }

  // Create query embedding
  const queryEmbedding = await createEmbedding(query)

  // Calculate similarity for each chunk
  const results: Array<{ chunk: RAGChunk; similarity: number }> = []

  for (const chunk of chunks) {
    if (!chunk.embedding) {
      // Create embedding if missing
      chunk.embedding = await createEmbedding(chunk.content)
    }

    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding)
    results.push({ chunk, similarity })
  }

  // Sort by similarity and return top results
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

/**
 * Get context from RAG folder for agent
 */
export async function getRAGContext(
  folderId: string,
  query: string,
  maxChunks: number = 3
): Promise<string> {
  const results = await searchRAGFolder(folderId, query, maxChunks)
  
  if (results.length === 0) {
    return ''
  }

  return results
    .map((result, index) => `[Chunk ${index + 1}]\n${result.chunk.content}`)
    .join('\n\n')
}

/**
 * Build RAG-enhanced prompt
 */
export async function buildRAGPrompt(
  basePrompt: string,
  query: string,
  ragFolderId?: string
): Promise<string> {
  if (!ragFolderId) {
    return basePrompt
  }

  const context = await getRAGContext(ragFolderId, query)
  
  if (!context) {
    return basePrompt
  }

  return `${basePrompt}

You have access to the following relevant information from the knowledge base:

${context}

Use this information to provide accurate, helpful answers. If the information doesn't contain the answer, say so clearly.`
}

