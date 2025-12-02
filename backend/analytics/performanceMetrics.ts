/**
 * Performance Metrics System
 * 
 * Track detailed performance metrics per agent for self-improvement loops.
 * Part of the Self-Improvement Loops feature (v1.4.0).
 */

import { randomUUID } from 'crypto'

export interface ToolMetrics {
  toolName: string
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  successRate: number
  avgDurationMs: number
  lastUsed: Date
}

export interface TaskTypeMetrics {
  taskType: string
  totalTasks: number
  successfulTasks: number
  failedTasks: number
  successRate: number
  avgDurationMs: number
  avgTokens: number
  commonErrors: string[]
}

export interface PerformanceTrend {
  period: 'day' | 'week' | 'month'
  dataPoints: Array<{
    date: Date
    successRate: number
    avgDuration: number
    totalExecutions: number
  }>
  trend: 'improving' | 'stable' | 'declining'
  changePercent: number
}

export interface AgentPerformanceMetrics {
  agentId: string
  agentName?: string
  
  // Overall metrics
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  successRate: number
  
  // Timing
  avgResponseTimeMs: number
  minResponseTimeMs: number
  maxResponseTimeMs: number
  p95ResponseTimeMs: number
  
  // Token usage
  totalInputTokens: number
  totalOutputTokens: number
  avgTokensPerExecution: number
  estimatedTotalCost: number
  
  // Tool usage
  toolMetrics: ToolMetrics[]
  mostUsedTools: string[]
  leastEffectiveTools: string[]
  
  // Task types
  taskTypeMetrics: TaskTypeMetrics[]
  
  // Error analysis
  errorFrequency: number // errors per 100 executions
  errorCategories: Record<string, number>
  
  // Trends
  trends: {
    daily: PerformanceTrend
    weekly: PerformanceTrend
  }
  
  // Meta
  calculatedAt: Date
  dataRangeStart: Date
  dataRangeEnd: Date
}

// Execution record for tracking
interface ExecutionRecord {
  id: string
  agentId: string
  agentName?: string
  status: 'success' | 'failure'
  durationMs: number
  inputTokens: number
  outputTokens: number
  toolCalls: Array<{
    toolName: string
    success: boolean
    durationMs: number
  }>
  taskType?: string
  errorCategory?: string
  errorMessage?: string
  timestamp: Date
}

// In-memory storage (can be upgraded to database)
const executionRecords = new Map<string, ExecutionRecord[]>() // agentId -> records
const MAX_RECORDS_PER_AGENT = 1000

/**
 * Record an execution for metrics tracking
 */
export function recordExecution(record: Omit<ExecutionRecord, 'id' | 'timestamp'>): void {
  const fullRecord: ExecutionRecord = {
    ...record,
    id: randomUUID(),
    timestamp: new Date(),
  }

  const records = executionRecords.get(record.agentId) || []
  records.push(fullRecord)

  // Keep only recent records
  if (records.length > MAX_RECORDS_PER_AGENT) {
    records.shift()
  }

  executionRecords.set(record.agentId, records)
}

/**
 * Classify task type from input
 */
export function classifyTaskType(input: string): string {
  const lowered = input.toLowerCase()
  
  if (lowered.includes('create') && lowered.includes('agent')) return 'agent_creation'
  if (lowered.includes('search') || lowered.includes('find')) return 'search'
  if (lowered.includes('analyze') || lowered.includes('analyse')) return 'analysis'
  if (lowered.includes('write') || lowered.includes('draft')) return 'content_generation'
  if (lowered.includes('schedule') || lowered.includes('cron')) return 'scheduling'
  if (lowered.includes('summarize') || lowered.includes('summarise')) return 'summarization'
  if (lowered.includes('translate')) return 'translation'
  if (lowered.includes('code') || lowered.includes('implement')) return 'coding'
  if (lowered.includes('question') || lowered.includes('?')) return 'question_answering'
  
  return 'general'
}

/**
 * Classify error category from error message
 */
export function classifyError(error: string): string {
  const lowered = error.toLowerCase()
  
  if (lowered.includes('rate limit') || lowered.includes('429')) return 'rate_limit'
  if (lowered.includes('timeout') || lowered.includes('timed out')) return 'timeout'
  if (lowered.includes('api key') || lowered.includes('authentication')) return 'auth_error'
  if (lowered.includes('not found') || lowered.includes('404')) return 'not_found'
  if (lowered.includes('tool') && lowered.includes('error')) return 'tool_failure'
  if (lowered.includes('context') || lowered.includes('token')) return 'context_limit'
  if (lowered.includes('network') || lowered.includes('connection')) return 'network_error'
  if (lowered.includes('invalid') || lowered.includes('validation')) return 'validation_error'
  
  return 'unknown'
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0
  const index = Math.ceil((p / 100) * sortedArr.length) - 1
  return sortedArr[Math.max(0, index)]
}

/**
 * Calculate trend from data points
 */
function calculateTrend(dataPoints: Array<{ successRate: number }>): { trend: 'improving' | 'stable' | 'declining'; changePercent: number } {
  if (dataPoints.length < 2) {
    return { trend: 'stable', changePercent: 0 }
  }

  const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2))
  const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2))

  const firstAvg = firstHalf.reduce((sum, dp) => sum + dp.successRate, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, dp) => sum + dp.successRate, 0) / secondHalf.length

  const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

  if (changePercent > 5) return { trend: 'improving', changePercent }
  if (changePercent < -5) return { trend: 'declining', changePercent }
  return { trend: 'stable', changePercent }
}

/**
 * Get performance metrics for an agent
 */
export function getAgentMetrics(agentId: string, agentName?: string): AgentPerformanceMetrics {
  const records = executionRecords.get(agentId) || []
  const now = new Date()

  // Default empty metrics
  if (records.length === 0) {
    return {
      agentId,
      agentName,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      successRate: 0,
      avgResponseTimeMs: 0,
      minResponseTimeMs: 0,
      maxResponseTimeMs: 0,
      p95ResponseTimeMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      avgTokensPerExecution: 0,
      estimatedTotalCost: 0,
      toolMetrics: [],
      mostUsedTools: [],
      leastEffectiveTools: [],
      taskTypeMetrics: [],
      errorFrequency: 0,
      errorCategories: {},
      trends: {
        daily: { period: 'day', dataPoints: [], trend: 'stable', changePercent: 0 },
        weekly: { period: 'week', dataPoints: [], trend: 'stable', changePercent: 0 },
      },
      calculatedAt: now,
      dataRangeStart: now,
      dataRangeEnd: now,
    }
  }

  // Calculate basic metrics
  const successfulRecords = records.filter(r => r.status === 'success')
  const failedRecords = records.filter(r => r.status === 'failure')
  const durations = records.map(r => r.durationMs).sort((a, b) => a - b)

  // Token metrics
  const totalInputTokens = records.reduce((sum, r) => sum + r.inputTokens, 0)
  const totalOutputTokens = records.reduce((sum, r) => sum + r.outputTokens, 0)
  const estimatedCost = (totalInputTokens / 1_000_000 * 3) + (totalOutputTokens / 1_000_000 * 15)

  // Tool metrics
  const toolStats = new Map<string, { total: number; success: number; durations: number[] }>()
  for (const record of records) {
    for (const tc of record.toolCalls) {
      const stats = toolStats.get(tc.toolName) || { total: 0, success: 0, durations: [] }
      stats.total++
      if (tc.success) stats.success++
      stats.durations.push(tc.durationMs)
      toolStats.set(tc.toolName, stats)
    }
  }

  const toolMetrics: ToolMetrics[] = Array.from(toolStats.entries()).map(([toolName, stats]) => ({
    toolName,
    totalCalls: stats.total,
    successfulCalls: stats.success,
    failedCalls: stats.total - stats.success,
    successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
    avgDurationMs: stats.durations.length > 0 
      ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length 
      : 0,
    lastUsed: now, // Simplified
  }))

  const mostUsedTools = [...toolMetrics]
    .sort((a, b) => b.totalCalls - a.totalCalls)
    .slice(0, 5)
    .map(t => t.toolName)

  const leastEffectiveTools = [...toolMetrics]
    .filter(t => t.totalCalls >= 3) // Only tools with enough data
    .sort((a, b) => a.successRate - b.successRate)
    .slice(0, 3)
    .map(t => t.toolName)

  // Task type metrics
  const taskStats = new Map<string, { total: number; success: number; durations: number[]; tokens: number[]; errors: string[] }>()
  for (const record of records) {
    const taskType = record.taskType || 'general'
    const stats = taskStats.get(taskType) || { total: 0, success: 0, durations: [], tokens: [], errors: [] }
    stats.total++
    if (record.status === 'success') stats.success++
    stats.durations.push(record.durationMs)
    stats.tokens.push(record.inputTokens + record.outputTokens)
    if (record.errorMessage) stats.errors.push(record.errorMessage)
    taskStats.set(taskType, stats)
  }

  const taskTypeMetrics: TaskTypeMetrics[] = Array.from(taskStats.entries()).map(([taskType, stats]) => ({
    taskType,
    totalTasks: stats.total,
    successfulTasks: stats.success,
    failedTasks: stats.total - stats.success,
    successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
    avgDurationMs: stats.durations.length > 0 
      ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length 
      : 0,
    avgTokens: stats.tokens.length > 0 
      ? stats.tokens.reduce((a, b) => a + b, 0) / stats.tokens.length 
      : 0,
    commonErrors: [...new Set(stats.errors)].slice(0, 3),
  }))

  // Error categories
  const errorCategories: Record<string, number> = {}
  for (const record of failedRecords) {
    const category = record.errorCategory || 'unknown'
    errorCategories[category] = (errorCategories[category] || 0) + 1
  }

  // Calculate trends
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const dailyRecords = records.filter(r => r.timestamp >= dayAgo)
  const weeklyRecords = records.filter(r => r.timestamp >= weekAgo)

  // Group by hour for daily
  const hourlyGroups = new Map<string, ExecutionRecord[]>()
  for (const r of dailyRecords) {
    const hour = new Date(r.timestamp).toISOString().slice(0, 13)
    const group = hourlyGroups.get(hour) || []
    group.push(r)
    hourlyGroups.set(hour, group)
  }

  const dailyDataPoints = Array.from(hourlyGroups.entries()).map(([hour, recs]) => ({
    date: new Date(hour),
    successRate: recs.filter(r => r.status === 'success').length / recs.length * 100,
    avgDuration: recs.reduce((sum, r) => sum + r.durationMs, 0) / recs.length,
    totalExecutions: recs.length,
  })).sort((a, b) => a.date.getTime() - b.date.getTime())

  // Group by day for weekly
  const dailyGroups = new Map<string, ExecutionRecord[]>()
  for (const r of weeklyRecords) {
    const day = new Date(r.timestamp).toISOString().slice(0, 10)
    const group = dailyGroups.get(day) || []
    group.push(r)
    dailyGroups.set(day, group)
  }

  const weeklyDataPoints = Array.from(dailyGroups.entries()).map(([day, recs]) => ({
    date: new Date(day),
    successRate: recs.filter(r => r.status === 'success').length / recs.length * 100,
    avgDuration: recs.reduce((sum, r) => sum + r.durationMs, 0) / recs.length,
    totalExecutions: recs.length,
  })).sort((a, b) => a.date.getTime() - b.date.getTime())

  const dailyTrend = calculateTrend(dailyDataPoints)
  const weeklyTrend = calculateTrend(weeklyDataPoints)

  return {
    agentId,
    agentName: agentName || records[0]?.agentName,
    totalExecutions: records.length,
    successfulExecutions: successfulRecords.length,
    failedExecutions: failedRecords.length,
    successRate: records.length > 0 ? (successfulRecords.length / records.length) * 100 : 0,
    avgResponseTimeMs: durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0,
    minResponseTimeMs: durations[0] || 0,
    maxResponseTimeMs: durations[durations.length - 1] || 0,
    p95ResponseTimeMs: percentile(durations, 95),
    totalInputTokens,
    totalOutputTokens,
    avgTokensPerExecution: records.length > 0 
      ? (totalInputTokens + totalOutputTokens) / records.length 
      : 0,
    estimatedTotalCost: estimatedCost,
    toolMetrics,
    mostUsedTools,
    leastEffectiveTools,
    taskTypeMetrics,
    errorFrequency: records.length > 0 ? (failedRecords.length / records.length) * 100 : 0,
    errorCategories,
    trends: {
      daily: { 
        period: 'day', 
        dataPoints: dailyDataPoints, 
        trend: dailyTrend.trend, 
        changePercent: dailyTrend.changePercent 
      },
      weekly: { 
        period: 'week', 
        dataPoints: weeklyDataPoints, 
        trend: weeklyTrend.trend, 
        changePercent: weeklyTrend.changePercent 
      },
    },
    calculatedAt: now,
    dataRangeStart: records.length > 0 ? records[0].timestamp : now,
    dataRangeEnd: records.length > 0 ? records[records.length - 1].timestamp : now,
  }
}

/**
 * Get metrics summary for all agents
 */
export function getAllAgentMetricsSummary(): Array<{
  agentId: string
  agentName?: string
  successRate: number
  totalExecutions: number
  trend: 'improving' | 'stable' | 'declining'
}> {
  const summaries: Array<{
    agentId: string
    agentName?: string
    successRate: number
    totalExecutions: number
    trend: 'improving' | 'stable' | 'declining'
  }> = []

  for (const [agentId] of executionRecords) {
    const metrics = getAgentMetrics(agentId)
    summaries.push({
      agentId,
      agentName: metrics.agentName,
      successRate: metrics.successRate,
      totalExecutions: metrics.totalExecutions,
      trend: metrics.trends.weekly.trend,
    })
  }

  return summaries.sort((a, b) => b.totalExecutions - a.totalExecutions)
}

/**
 * Get top performing agents
 */
export function getTopPerformingAgents(limit: number = 5): Array<{
  agentId: string
  agentName?: string
  successRate: number
  totalExecutions: number
}> {
  return getAllAgentMetricsSummary()
    .filter(a => a.totalExecutions >= 5) // Minimum executions for ranking
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, limit)
}

/**
 * Get agents needing attention (declining or low success rate)
 */
export function getAgentsNeedingAttention(): Array<{
  agentId: string
  agentName?: string
  successRate: number
  trend: 'declining' | 'stable'
  reason: string
}> {
  const results: Array<{
    agentId: string
    agentName?: string
    successRate: number
    trend: 'declining' | 'stable'
    reason: string
  }> = []

  for (const [agentId] of executionRecords) {
    const metrics = getAgentMetrics(agentId)
    
    if (metrics.totalExecutions < 3) continue

    if (metrics.trends.weekly.trend === 'declining') {
      results.push({
        agentId,
        agentName: metrics.agentName,
        successRate: metrics.successRate,
        trend: 'declining',
        reason: `Performance declining by ${Math.abs(metrics.trends.weekly.changePercent).toFixed(1)}%`,
      })
    } else if (metrics.successRate < 70) {
      results.push({
        agentId,
        agentName: metrics.agentName,
        successRate: metrics.successRate,
        trend: 'stable',
        reason: `Low success rate: ${metrics.successRate.toFixed(1)}%`,
      })
    }
  }

  return results.sort((a, b) => a.successRate - b.successRate)
}

/**
 * Clear metrics for an agent
 */
export function clearAgentMetrics(agentId: string): boolean {
  return executionRecords.delete(agentId)
}

/**
 * Get raw execution count
 */
export function getExecutionCount(agentId: string): number {
  return executionRecords.get(agentId)?.length || 0
}



