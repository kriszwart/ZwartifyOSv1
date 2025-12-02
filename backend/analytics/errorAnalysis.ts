/**
 * Error Analysis Engine
 * 
 * Analyze failures to extract learnable patterns for self-improvement.
 * Part of the Self-Improvement Loops feature (v1.4.0).
 */

import { randomUUID } from 'crypto'

export type ErrorCategory = 
  | 'tool_failure'
  | 'context_missing'
  | 'timeout'
  | 'rate_limit'
  | 'auth_error'
  | 'validation_error'
  | 'network_error'
  | 'not_found'
  | 'context_limit'
  | 'unknown'

export interface ErrorRecord {
  id: string
  agentId: string
  executionId?: string
  category: ErrorCategory
  message: string
  context: {
    input?: string
    toolName?: string
    taskType?: string
    timestamp: Date
  }
  stackTrace?: string
  metadata?: Record<string, unknown>
}

export interface ErrorPattern {
  id: string
  pattern: string
  category: ErrorCategory
  frequency: number
  firstSeen: Date
  lastSeen: Date
  affectedAgents: string[]
  commonContexts: string[]
  suggestedFix?: string
}

export interface ErrorAnalysisResult {
  agentId: string
  totalErrors: number
  errorsByCategory: Record<ErrorCategory, number>
  topPatterns: ErrorPattern[]
  recentErrors: ErrorRecord[]
  recommendations: ErrorRecommendation[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface ErrorRecommendation {
  id: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: ErrorCategory
  title: string
  description: string
  suggestedAction: string
  affectedExecutions: number
}

// In-memory storage
const errorRecords = new Map<string, ErrorRecord[]>() // agentId -> errors
const errorPatterns = new Map<string, ErrorPattern>() // patternId -> pattern
const MAX_ERRORS_PER_AGENT = 500

/**
 * Record an error for analysis
 */
export function recordError(
  agentId: string,
  error: {
    message: string
    executionId?: string
    input?: string
    toolName?: string
    taskType?: string
    stackTrace?: string
    metadata?: Record<string, unknown>
  }
): ErrorRecord {
  const category = categorizeError(error.message)
  
  const record: ErrorRecord = {
    id: randomUUID(),
    agentId,
    executionId: error.executionId,
    category,
    message: error.message,
    context: {
      input: error.input?.substring(0, 500),
      toolName: error.toolName,
      taskType: error.taskType,
      timestamp: new Date(),
    },
    stackTrace: error.stackTrace,
    metadata: error.metadata,
  }

  // Store record
  const records = errorRecords.get(agentId) || []
  records.push(record)
  
  if (records.length > MAX_ERRORS_PER_AGENT) {
    records.shift()
  }
  
  errorRecords.set(agentId, records)

  // Update patterns
  updatePatterns(record)

  return record
}

/**
 * Categorize an error based on its message
 */
export function categorizeError(message: string): ErrorCategory {
  const lowered = message.toLowerCase()
  
  if (lowered.includes('rate limit') || lowered.includes('429') || lowered.includes('too many requests')) {
    return 'rate_limit'
  }
  if (lowered.includes('timeout') || lowered.includes('timed out') || lowered.includes('deadline')) {
    return 'timeout'
  }
  if (lowered.includes('api key') || lowered.includes('authentication') || lowered.includes('unauthorized') || lowered.includes('401')) {
    return 'auth_error'
  }
  if (lowered.includes('not found') || lowered.includes('404') || lowered.includes('does not exist')) {
    return 'not_found'
  }
  if (lowered.includes('tool') && (lowered.includes('error') || lowered.includes('failed') || lowered.includes('exception'))) {
    return 'tool_failure'
  }
  if (lowered.includes('context') || lowered.includes('token limit') || lowered.includes('too long') || lowered.includes('maximum')) {
    return 'context_limit'
  }
  if (lowered.includes('network') || lowered.includes('connection') || lowered.includes('econnrefused') || lowered.includes('socket')) {
    return 'network_error'
  }
  if (lowered.includes('invalid') || lowered.includes('validation') || lowered.includes('required') || lowered.includes('missing')) {
    return 'validation_error'
  }
  if (lowered.includes('context') && lowered.includes('missing')) {
    return 'context_missing'
  }
  
  return 'unknown'
}

/**
 * Extract a pattern signature from an error message
 */
function extractPatternSignature(message: string): string {
  // Remove specific values to get a pattern
  return message
    .replace(/\b\d+\b/g, '<NUM>') // Numbers
    .replace(/\b[a-f0-9-]{36}\b/gi, '<UUID>') // UUIDs
    .replace(/\b[a-f0-9]{32,}\b/gi, '<HASH>') // Hashes
    .replace(/"[^"]+"/g, '"<STR>"') // Quoted strings
    .replace(/\'[^\']+\'/g, "'<STR>'") // Single-quoted strings
    .replace(/\b\w+@\w+\.\w+\b/g, '<EMAIL>') // Emails
    .replace(/https?:\/\/[^\s]+/g, '<URL>') // URLs
    .substring(0, 200)
    .trim()
}

/**
 * Update error patterns based on new error
 */
function updatePatterns(record: ErrorRecord): void {
  const signature = extractPatternSignature(record.message)
  const patternId = `${record.category}:${signature}`
  
  const existing = errorPatterns.get(patternId)
  
  if (existing) {
    existing.frequency++
    existing.lastSeen = record.context.timestamp
    if (!existing.affectedAgents.includes(record.agentId)) {
      existing.affectedAgents.push(record.agentId)
    }
    if (record.context.taskType && !existing.commonContexts.includes(record.context.taskType)) {
      existing.commonContexts.push(record.context.taskType)
    }
    errorPatterns.set(patternId, existing)
  } else {
    const pattern: ErrorPattern = {
      id: patternId,
      pattern: signature,
      category: record.category,
      frequency: 1,
      firstSeen: record.context.timestamp,
      lastSeen: record.context.timestamp,
      affectedAgents: [record.agentId],
      commonContexts: record.context.taskType ? [record.context.taskType] : [],
      suggestedFix: getSuggestedFix(record.category),
    }
    errorPatterns.set(patternId, pattern)
  }
}

/**
 * Get suggested fix for an error category
 */
function getSuggestedFix(category: ErrorCategory): string {
  switch (category) {
    case 'rate_limit':
      return 'Implement exponential backoff or reduce request frequency. Consider caching responses.'
    case 'timeout':
      return 'Increase timeout limits or break down complex tasks into smaller steps.'
    case 'auth_error':
      return 'Verify API key is valid and has required permissions. Check key expiration.'
    case 'tool_failure':
      return 'Check tool implementation for bugs. Validate input parameters before execution.'
    case 'context_limit':
      return 'Reduce input size, use summarization, or implement chunking for large documents.'
    case 'context_missing':
      return 'Add more context to the prompt or enable RAG for relevant knowledge retrieval.'
    case 'network_error':
      return 'Check network connectivity. Implement retry logic with backoff.'
    case 'validation_error':
      return 'Validate input data before processing. Add better error messages for users.'
    case 'not_found':
      return 'Verify resource exists before accessing. Handle missing resources gracefully.'
    default:
      return 'Review error details and implement appropriate error handling.'
  }
}

/**
 * Generate recommendations from error analysis
 */
function generateRecommendations(
  records: ErrorRecord[],
  patterns: ErrorPattern[]
): ErrorRecommendation[] {
  const recommendations: ErrorRecommendation[] = []

  // Group errors by category
  const byCategory = new Map<ErrorCategory, ErrorRecord[]>()
  for (const record of records) {
    const existing = byCategory.get(record.category) || []
    existing.push(record)
    byCategory.set(record.category, existing)
  }

  // Generate recommendations based on frequency
  for (const [category, catRecords] of byCategory) {
    const frequency = catRecords.length
    const recentCount = catRecords.filter(
      r => r.context.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length

    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (frequency > 50 || recentCount > 10) priority = 'critical'
    else if (frequency > 20 || recentCount > 5) priority = 'high'
    else if (frequency > 10 || recentCount > 2) priority = 'medium'

    recommendations.push({
      id: randomUUID(),
      priority,
      category,
      title: `Address ${category.replace(/_/g, ' ')} errors`,
      description: `${frequency} occurrences total, ${recentCount} in last 24 hours`,
      suggestedAction: getSuggestedFix(category),
      affectedExecutions: frequency,
    })
  }

  // Add pattern-specific recommendations for frequent patterns
  for (const pattern of patterns) {
    if (pattern.frequency >= 5) {
      recommendations.push({
        id: randomUUID(),
        priority: pattern.frequency >= 20 ? 'high' : 'medium',
        category: pattern.category,
        title: `Recurring pattern detected: ${pattern.pattern.substring(0, 50)}...`,
        description: `Seen ${pattern.frequency} times across ${pattern.affectedAgents.length} agents`,
        suggestedAction: pattern.suggestedFix || getSuggestedFix(pattern.category),
        affectedExecutions: pattern.frequency,
      })
    }
  }

  // Sort by priority and frequency
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  return recommendations
    .sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.affectedExecutions - a.affectedExecutions
    })
    .slice(0, 10)
}

/**
 * Analyze errors for an agent
 */
export function analyzeAgentErrors(agentId: string): ErrorAnalysisResult {
  const records = errorRecords.get(agentId) || []
  
  // Count by category
  const errorsByCategory: Record<ErrorCategory, number> = {
    tool_failure: 0,
    context_missing: 0,
    timeout: 0,
    rate_limit: 0,
    auth_error: 0,
    validation_error: 0,
    network_error: 0,
    not_found: 0,
    context_limit: 0,
    unknown: 0,
  }
  
  for (const record of records) {
    errorsByCategory[record.category]++
  }

  // Get relevant patterns
  const relevantPatterns = Array.from(errorPatterns.values())
    .filter(p => p.affectedAgents.includes(agentId))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)

  // Generate recommendations
  const recommendations = generateRecommendations(records, relevantPatterns)

  // Determine risk level
  const recentErrors = records.filter(
    r => r.context.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
  )
  const criticalCategories = ['auth_error', 'rate_limit', 'context_limit']
  const criticalCount = recentErrors.filter(r => criticalCategories.includes(r.category)).length

  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (criticalCount > 5 || recentErrors.length > 20) riskLevel = 'critical'
  else if (criticalCount > 2 || recentErrors.length > 10) riskLevel = 'high'
  else if (recentErrors.length > 5) riskLevel = 'medium'

  return {
    agentId,
    totalErrors: records.length,
    errorsByCategory,
    topPatterns: relevantPatterns,
    recentErrors: records.slice(-10).reverse(),
    recommendations,
    riskLevel,
  }
}

/**
 * Get global error patterns
 */
export function getGlobalPatterns(limit: number = 20): ErrorPattern[] {
  return Array.from(errorPatterns.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit)
}

/**
 * Get error trends over time
 */
export function getErrorTrends(agentId?: string, hours: number = 24): Array<{
  hour: string
  count: number
  byCategory: Record<string, number>
}> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
  
  // Get relevant records
  let records: ErrorRecord[] = []
  if (agentId) {
    records = (errorRecords.get(agentId) || []).filter(r => r.context.timestamp >= cutoff)
  } else {
    for (const agentRecords of errorRecords.values()) {
      records.push(...agentRecords.filter(r => r.context.timestamp >= cutoff))
    }
  }

  // Group by hour
  const hourlyData = new Map<string, { count: number; byCategory: Record<string, number> }>()
  
  for (const record of records) {
    const hour = record.context.timestamp.toISOString().slice(0, 13)
    const existing = hourlyData.get(hour) || { count: 0, byCategory: {} }
    existing.count++
    existing.byCategory[record.category] = (existing.byCategory[record.category] || 0) + 1
    hourlyData.set(hour, existing)
  }

  return Array.from(hourlyData.entries())
    .map(([hour, data]) => ({
      hour,
      count: data.count,
      byCategory: data.byCategory,
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour))
}

/**
 * Find root cause for frequent errors
 */
export function findRootCause(patternId: string): {
  pattern: ErrorPattern | null
  possibleCauses: string[]
  relatedPatterns: ErrorPattern[]
} {
  const pattern = errorPatterns.get(patternId)
  if (!pattern) {
    return { pattern: null, possibleCauses: [], relatedPatterns: [] }
  }

  // Find related patterns (same category or affecting same agents)
  const relatedPatterns = Array.from(errorPatterns.values())
    .filter(p => 
      p.id !== patternId && 
      (p.category === pattern.category || 
       p.affectedAgents.some(a => pattern.affectedAgents.includes(a)))
    )
    .slice(0, 5)

  // Generate possible causes
  const possibleCauses: string[] = []
  
  switch (pattern.category) {
    case 'rate_limit':
      possibleCauses.push('Too many concurrent requests')
      possibleCauses.push('API quota exceeded')
      possibleCauses.push('Missing request throttling')
      break
    case 'timeout':
      possibleCauses.push('Complex task taking too long')
      possibleCauses.push('External service slow response')
      possibleCauses.push('Network latency issues')
      break
    case 'tool_failure':
      possibleCauses.push('Tool implementation bug')
      possibleCauses.push('Invalid input parameters')
      possibleCauses.push('Missing dependencies')
      break
    case 'context_limit':
      possibleCauses.push('Input document too large')
      possibleCauses.push('Conversation history too long')
      possibleCauses.push('Too many tools loaded')
      break
    default:
      possibleCauses.push('Review error details for specific cause')
  }

  // Add context-specific causes
  if (pattern.commonContexts.length > 0) {
    possibleCauses.push(`Often occurs during: ${pattern.commonContexts.join(', ')}`)
  }

  return { pattern, possibleCauses, relatedPatterns }
}

/**
 * Clear errors for an agent
 */
export function clearAgentErrors(agentId: string): boolean {
  return errorRecords.delete(agentId)
}

/**
 * Get error count for an agent
 */
export function getErrorCount(agentId: string): number {
  return errorRecords.get(agentId)?.length || 0
}



