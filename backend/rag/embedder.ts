/**
 * RAG Embedder
 * 
 * Creates embeddings for text chunks
 * For now, uses a simple approach - can be enhanced with OpenAI/Anthropic embeddings
 */

/**
 * Simple embedding function (placeholder)
 * In production, use OpenAI text-embedding-3-small or similar
 */
export async function createEmbedding(text: string): Promise<number[]> {
  // Placeholder: Return a simple hash-based "embedding"
  // This is NOT a real embedding - just for demonstration
  // TODO: Integrate with OpenAI embeddings API or Anthropic embeddings
  
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0
  }, 0)

  // Create a simple vector (dimension 1536 to match OpenAI)
  const embedding: number[] = []
  for (let i = 0; i < 1536; i++) {
    embedding.push(Math.sin(hash + i) * 0.01)
  }

  return embedding
}

/**
 * Create embeddings for multiple chunks
 */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(text => createEmbedding(text)))
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimension')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * OpenAI embeddings integration (optional)
 */
export async function createOpenAIEmbedding(
  text: string,
  apiKey?: string
): Promise<number[]> {
  // TODO: Implement OpenAI embeddings
  // const response = await fetch('https://api.openai.com/v1/embeddings', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${apiKey}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     model: 'text-embedding-3-small',
  //     input: text,
  //   }),
  // })
  // const data = await response.json()
  // return data.data[0].embedding

  // Fallback to simple embedding
  return createEmbedding(text)
}

