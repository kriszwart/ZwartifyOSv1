# Caching Layer Implementation Plan

## Overview

Implement a comprehensive caching layer to improve performance, reduce API costs, and provide faster responses for similar queries. The caching system will support semantic similarity matching, RAG query caching, and agent response caching.

## Goals

- **Reduce API Costs**: Cache responses for similar queries to avoid redundant API calls
- **Improve Performance**: Return cached responses instantly for repeated or similar queries
- **Semantic Matching**: Use embeddings to match semantically similar queries, not just exact matches
- **Smart Invalidation**: Intelligent cache expiration based on data freshness needs
- **RAG Optimization**: Cache RAG query results for frequently accessed knowledge

## Current State

- No caching layer exists
- Every agent execution makes full API calls to Claude
- RAG queries are executed fresh each time
- No deduplication of similar queries
- Token costs accumulate for repeated similar queries

## Implementation Plan

### 1. Create Cache Infrastructure (`backend/cache/`)

#### 1.1 Cache Store (`backend/cache/store.ts`)

Create a cache store that supports:
- In-memory cache for development (Map-based)
- Optional Redis integration for production
- TTL (Time-To-Live) management
- Cache size limits (LRU eviction)
- Cache statistics tracking

**Key functions:**
- `get(key: string): Promise<CacheEntry | null>`
- `set(key: string, value: unknown, ttl?: number): Promise<void>`
- `delete(key: string): Promise<void>`
- `clear(): Promise<void>`
- `getStats(): CacheStats`

**Cache entry structure:**
```typescript
interface CacheEntry {
  value: unknown
  timestamp: number
  expiresAt: number
  hitCount: number
  lastAccessed: number
}
```

#### 1.2 Semantic Cache (`backend/cache/semanticCache.ts`)

Implement semantic similarity matching:
- Generate embeddings for queries using existing embedding service
- Store query embeddings with responses
- Find similar queries using cosine similarity
- Configurable similarity threshold (default: 0.85)
- Cache key generation from query hash

**Key functions:**
- `findSimilar(query: string, threshold?: number): Promise<CacheEntry | null>`
- `store(query: string, response: unknown, ttl?: number): Promise<void>`
- `generateEmbedding(text: string): Promise<number[]>`
- `calculateSimilarity(embedding1: number[], embedding2: number[]): number`

### 2. Integrate Caching into Agent Client (`backend/agents/agentClient.ts`)

#### 2.1 Add Cache Support to `run()` Method

- Check cache before making API call
- Generate cache key from input + agent config + context hash
- Store successful responses in cache
- Respect cache TTL settings
- Skip cache for streaming mode (or cache final result)

**Cache key components:**
- Agent ID
- Input text hash
- Agent prompt hash (if changed)
- Skill IDs
- RAG folder ID
- Memory context hash (if using memory)

#### 2.2 Cache Configuration

Add cache options to `AgentRunOptions`:
```typescript
interface CacheOptions {
  enabled: boolean
  ttl: number // seconds
  semanticMatching: boolean
  similarityThreshold: number
}
```

### 3. RAG Query Caching (`backend/rag/query.ts`)

#### 3.1 Cache RAG Query Results

- Cache query results based on query text + folder ID
- Use semantic matching for similar questions
- Cache embedding similarity calculations
- Invalidate cache when RAG folder content changes

**Cache key:**
- RAG folder ID
- Query text hash
- Query embedding (for semantic matching)

#### 3.2 Cache Invalidation

- Invalidate cache when files are added/removed from RAG folder
- Invalidate cache when folder is updated
- TTL-based expiration (default: 1 hour for RAG queries)

### 4. Create Cache API Endpoints (`app/api/cache/`)

#### 4.1 Cache Management API (`app/api/cache/route.ts`)

- `GET /api/cache/stats` - Get cache statistics
- `DELETE /api/cache` - Clear all cache
- `DELETE /api/cache/[key]` - Clear specific cache entry
- `GET /api/cache/keys` - List cache keys (for debugging)

#### 4.2 Cache Configuration API

- `GET /api/cache/config` - Get cache configuration
- `PUT /api/cache/config` - Update cache settings
  - Enable/disable caching
  - Set default TTL
  - Configure similarity threshold
  - Set cache size limits

### 5. Add Cache UI Components

#### 5.1 Cache Stats Dashboard (`app/dashboard/page.tsx`)

Add cache statistics to dashboard:
- Cache hit/miss ratio
- Total cache entries
- Cache size (memory usage)
- Most cached queries
- Cost savings estimate

#### 5.2 Cache Settings Page (`app/settings/page.tsx`)

Add cache configuration UI:
- Enable/disable caching toggle
- TTL configuration
- Similarity threshold slider
- Cache size limit
- Clear cache button
- Cache statistics display

### 6. Cache Invalidation Strategies

#### 6.1 Time-Based Expiration (TTL)

- Default TTL: 1 hour for agent responses
- Default TTL: 1 hour for RAG queries
- Configurable per agent or globally
- Respect data freshness requirements

#### 6.2 Event-Based Invalidation

- Invalidate when agent prompt changes
- Invalidate when RAG folder content changes
- Invalidate when skills are updated
- Invalidate when memory context significantly changes

#### 6.3 Manual Invalidation

- Admin API to clear cache
- UI button to clear cache
- Per-agent cache clearing
- Per-folder cache clearing

### 7. Performance Optimizations

#### 7.1 Embedding Caching

- Cache query embeddings to avoid regenerating
- Reuse embeddings for similarity calculations
- Store embeddings with cache entries

#### 7.2 Batch Operations

- Batch similarity searches when possible
- Optimize cache lookups
- Reduce redundant embedding generations

#### 7.3 Memory Management

- Implement LRU eviction when cache size limit reached
- Monitor memory usage
- Configurable cache size limits

## Files to Create/Modify

### New Files:
1. `backend/cache/store.ts` - Core cache store implementation
2. `backend/cache/semanticCache.ts` - Semantic similarity caching
3. `backend/cache/types.ts` - Cache type definitions
4. `app/api/cache/route.ts` - Cache management API
5. `app/api/cache/stats/route.ts` - Cache statistics API
6. `app/api/cache/config/route.ts` - Cache configuration API

### Modified Files:
1. `backend/agents/agentClient.ts` - Add cache support to run() method
2. `backend/agents/mainAgent.ts` - Pass cache options through
3. `backend/rag/query.ts` - Add RAG query caching
4. `app/dashboard/page.tsx` - Add cache statistics
5. `app/settings/page.tsx` - Add cache configuration UI
6. `backend/config/env.ts` - Add cache configuration environment variables

## Configuration

### Environment Variables

```env
# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=3600  # seconds (1 hour)
CACHE_SEMANTIC_MATCHING=true
CACHE_SIMILARITY_THRESHOLD=0.85
CACHE_MAX_SIZE=1000  # max entries
CACHE_REDIS_URL=  # optional Redis URL for production
```

### Default Settings

- **Enabled**: true (can be disabled per request)
- **Default TTL**: 3600 seconds (1 hour)
- **Semantic Matching**: true
- **Similarity Threshold**: 0.85 (85% similarity)
- **Max Cache Size**: 1000 entries (LRU eviction)

## Success Criteria

- Cache hit rate > 30% for repeated queries
- Response time < 50ms for cached responses
- API cost reduction > 20% for typical usage patterns
- Semantic matching correctly identifies similar queries
- Cache invalidation works correctly on data changes
- Memory usage stays within configured limits
- Cache statistics are accurate and useful

## Technical Considerations

### Embedding Generation

- Reuse existing embedding service from RAG system
- Cache embeddings to avoid regenerating
- Use same embedding model for consistency

### Similarity Calculation

- Use cosine similarity for embedding comparison
- Optimize similarity search (consider approximate nearest neighbor)
- Batch similarity searches when possible

### Cache Storage

- Start with in-memory Map for simplicity
- Design for easy Redis integration later
- Support both development and production environments

### Cache Key Design

- Include all relevant context in cache key
- Hash long inputs to keep keys manageable
- Ensure cache keys are deterministic

### Error Handling

- Cache failures should not break agent execution
- Fallback to non-cached execution on cache errors
- Log cache errors for monitoring

## Future Enhancements

- Redis integration for distributed caching
- Cache warming strategies
- Predictive caching based on usage patterns
- Cache analytics and insights
- Per-user cache isolation
- Cache compression for large responses


