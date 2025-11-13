/**
 * RAG Embedder Module
 * 
 * Handles creating embeddings for RAG chunks
 * Note: This is a stub implementation. Full embedding support requires an embedding service.
 */

/**
 * Create embedding for text
 * @param text - Text to embed
 * @returns Embedding vector (stub: returns empty array)
 */
export async function createEmbedding(text: string): Promise<number[]> {
  // Stub implementation - returns empty array
  // In production, this would call an embedding service (OpenAI, Cohere, etc.)
  // For now, return empty array to allow RAG to work without embeddings
  return []
}

