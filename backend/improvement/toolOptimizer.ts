/**
 * Tool Selection Optimizer
 * 
 * Track and optimize tool usage patterns for improved agent performance.
 * Part of the Self-Improvement Loops feature (v1.4.0).
 */

import { randomUUID } from 'crypto'

export interface ToolUsageRecord {
  id: string
  agentId: string
  toolName: string
  taskType: string
  success: boolean
  durationMs: number
  inputSummary?: string
  timestamp: Date
}

export interface ToolEffectiveness {
  toolName: string
  totalUsage: number
  successCount: number
  failureCount: number
  successRate: number
  avgDurationMs: number
  bestForTaskTypes: string[]
  worstForTaskTypes: string[]
  trend: 'improving' | 'stable' | 'declining'
}

export interface ToolCombination {
  tools: string[]
  frequency: number
  successRate: number
  avgDuration: number
  commonTaskTypes: string[]
}

export interface ToolRecommendation {
  taskType: string
  recommendedTools: Array<{
    toolName: string
    confidence: number // 0-1
    reason: string
  }>
  avoidTools: Array<{
    toolName: string
    reason: string
  }>
}

export interface ToolOptimizationResult {
  agentId: string
  toolEffectiveness: ToolEffectiveness[]
  unusedTools: string[]
  underutilizedTools: string[]
  topCombinations: ToolCombination[]
  recommendations: ToolRecommendation[]
  potentialImprovements: Array<{
    action: string
    expectedImpact: string
    priority: 'low' | 'medium' | 'high'
  }>
}

// In-memory storage
const toolUsage = new Map<string, ToolUsageRecord[]>() // agentId -> records
const toolCombinations = new Map<string, Map<string, ToolCombination>>() // agentId -> (comboKey -> combination)
const MAX_RECORDS = 1000

// Known tools for comparison
const KNOWN_TOOLS = [
  'createAgent',
  'searchTools',
  'hello',
  'mcpClient',
  'formatMarkdown',
  'screenshotDescribe',
]

/**
 * Record tool usage
 */
export function recordToolUsage(
  agentId: string,
  usage: Omit<ToolUsageRecord, 'id' | 'timestamp'>
): ToolUsageRecord {
  const record: ToolUsageRecord = {
    ...usage,
    id: randomUUID(),
    timestamp: new Date(),
  }

  const records = toolUsage.get(agentId) || []
  records.push(record)

  if (records.length > MAX_RECORDS) {
    records.shift()
  }

  toolUsage.set(agentId, records)
  return record
}

/**
 * Record a tool combination (tools used together in one execution)
 */
export function recordToolCombination(
  agentId: string,
  tools: string[],
  success: boolean,
  durationMs: number,
  taskType: string
): void {
  if (tools.length < 2) return

  const sortedTools = [...tools].sort()
  const comboKey = sortedTools.join('+')

  const agentCombos = toolCombinations.get(agentId) || new Map()
  const existing = agentCombos.get(comboKey)

  if (existing) {
    existing.frequency++
    existing.successRate = (existing.successRate * (existing.frequency - 1) + (success ? 100 : 0)) / existing.frequency
    existing.avgDuration = (existing.avgDuration * (existing.frequency - 1) + durationMs) / existing.frequency
    if (!existing.commonTaskTypes.includes(taskType)) {
      existing.commonTaskTypes.push(taskType)
    }
    agentCombos.set(comboKey, existing)
  } else {
    agentCombos.set(comboKey, {
      tools: sortedTools,
      frequency: 1,
      successRate: success ? 100 : 0,
      avgDuration: durationMs,
      commonTaskTypes: [taskType],
    })
  }

  toolCombinations.set(agentId, agentCombos)
}

/**
 * Calculate tool effectiveness for an agent
 */
export function calculateToolEffectiveness(agentId: string): ToolEffectiveness[] {
  const records = toolUsage.get(agentId) || []
  if (records.length === 0) return []

  // Group by tool
  const toolStats = new Map<string, {
    total: number
    success: number
    durations: number[]
    taskTypes: Map<string, { success: number; total: number }>
    recentSuccess: number
    recentTotal: number
  }>()

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  for (const record of records) {
    const stats = toolStats.get(record.toolName) || {
      total: 0,
      success: 0,
      durations: [] as number[],
      taskTypes: new Map(),
      recentSuccess: 0,
      recentTotal: 0,
    }

    stats.total++
    if (record.success) stats.success++
    stats.durations.push(record.durationMs)

    // Track task types
    const taskStats = stats.taskTypes.get(record.taskType) || { success: 0, total: 0 }
    taskStats.total++
    if (record.success) taskStats.success++
    stats.taskTypes.set(record.taskType, taskStats)

    // Track recent performance
    if (record.timestamp.getTime() > oneWeekAgo) {
      stats.recentTotal++
      if (record.success) stats.recentSuccess++
    }

    toolStats.set(record.toolName, stats)
  }

  // Calculate effectiveness
  const effectiveness: ToolEffectiveness[] = []

  for (const [toolName, stats] of toolStats) {
    const successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0
    const avgDuration = stats.durations.length > 0
      ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
      : 0

    // Find best and worst task types
    const taskTypeRankings: Array<{ type: string; successRate: number }> = []
    for (const [taskType, taskStats] of stats.taskTypes) {
      if (taskStats.total >= 2) { // Only consider with enough data
        taskTypeRankings.push({
          type: taskType,
          successRate: (taskStats.success / taskStats.total) * 100,
        })
      }
    }
    taskTypeRankings.sort((a, b) => b.successRate - a.successRate)

    const bestForTaskTypes = taskTypeRankings
      .filter(t => t.successRate >= 80)
      .slice(0, 3)
      .map(t => t.type)

    const worstForTaskTypes = taskTypeRankings
      .filter(t => t.successRate < 50)
      .slice(0, 3)
      .map(t => t.type)

    // Calculate trend
    const recentSuccessRate = stats.recentTotal > 0 
      ? (stats.recentSuccess / stats.recentTotal) * 100 
      : successRate
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable'
    if (recentSuccessRate > successRate + 10) trend = 'improving'
    else if (recentSuccessRate < successRate - 10) trend = 'declining'

    effectiveness.push({
      toolName,
      totalUsage: stats.total,
      successCount: stats.success,
      failureCount: stats.total - stats.success,
      successRate,
      avgDurationMs: avgDuration,
      bestForTaskTypes,
      worstForTaskTypes,
      trend,
    })
  }

  return effectiveness.sort((a, b) => b.totalUsage - a.totalUsage)
}

/**
 * Find unused and underutilized tools
 */
export function findUnderutilizedTools(agentId: string): {
  unused: string[]
  underutilized: string[]
} {
  const records = toolUsage.get(agentId) || []
  const usedTools = new Set(records.map(r => r.toolName))
  
  const unused = KNOWN_TOOLS.filter(t => !usedTools.has(t))
  
  const effectiveness = calculateToolEffectiveness(agentId)
  const avgUsage = effectiveness.length > 0
    ? effectiveness.reduce((sum, e) => sum + e.totalUsage, 0) / effectiveness.length
    : 0

  const underutilized = effectiveness
    .filter(e => e.totalUsage < avgUsage * 0.2 && e.successRate > 70)
    .map(e => e.toolName)

  return { unused, underutilized }
}

/**
 * Get tool recommendations for a task type
 */
export function getToolRecommendations(agentId: string, taskType: string): ToolRecommendation {
  const records = toolUsage.get(agentId) || []
  
  // Filter records for this task type
  const taskRecords = records.filter(r => r.taskType === taskType)
  
  // Calculate success rate per tool for this task
  const toolSuccess = new Map<string, { success: number; total: number }>()
  
  for (const record of taskRecords) {
    const stats = toolSuccess.get(record.toolName) || { success: 0, total: 0 }
    stats.total++
    if (record.success) stats.success++
    toolSuccess.set(record.toolName, stats)
  }

  // Build recommendations
  const recommendedTools: Array<{ toolName: string; confidence: number; reason: string }> = []
  const avoidTools: Array<{ toolName: string; reason: string }> = []

  for (const [toolName, stats] of toolSuccess) {
    if (stats.total < 2) continue

    const successRate = stats.success / stats.total
    
    if (successRate >= 0.8) {
      recommendedTools.push({
        toolName,
        confidence: successRate,
        reason: `${Math.round(successRate * 100)}% success rate for ${taskType} tasks`,
      })
    } else if (successRate < 0.5) {
      avoidTools.push({
        toolName,
        reason: `Only ${Math.round(successRate * 100)}% success rate for this task type`,
      })
    }
  }

  // Sort recommendations by confidence
  recommendedTools.sort((a, b) => b.confidence - a.confidence)

  return {
    taskType,
    recommendedTools: recommendedTools.slice(0, 5),
    avoidTools: avoidTools.slice(0, 3),
  }
}

/**
 * Get top tool combinations
 */
export function getTopCombinations(agentId: string, limit: number = 10): ToolCombination[] {
  const agentCombos = toolCombinations.get(agentId)
  if (!agentCombos) return []

  return Array.from(agentCombos.values())
    .filter(c => c.frequency >= 2)
    .sort((a, b) => {
      // Sort by success rate * frequency
      const scoreA = (a.successRate / 100) * Math.log(a.frequency + 1)
      const scoreB = (b.successRate / 100) * Math.log(b.frequency + 1)
      return scoreB - scoreA
    })
    .slice(0, limit)
}

/**
 * Get full optimization result for an agent
 */
export function getToolOptimization(agentId: string): ToolOptimizationResult {
  const effectiveness = calculateToolEffectiveness(agentId)
  const { unused, underutilized } = findUnderutilizedTools(agentId)
  const topCombinations = getTopCombinations(agentId)

  // Get unique task types
  const records = toolUsage.get(agentId) || []
  const taskTypes = [...new Set(records.map(r => r.taskType))]

  // Get recommendations for each task type
  const recommendations = taskTypes.map(tt => getToolRecommendations(agentId, tt))

  // Generate improvement suggestions
  const potentialImprovements: Array<{
    action: string
    expectedImpact: string
    priority: 'low' | 'medium' | 'high'
  }> = []

  // Check for declining tools
  const decliningTools = effectiveness.filter(e => e.trend === 'declining')
  for (const tool of decliningTools) {
    potentialImprovements.push({
      action: `Investigate declining performance of ${tool.toolName}`,
      expectedImpact: `Could improve success rate from ${tool.successRate.toFixed(0)}%`,
      priority: 'high',
    })
  }

  // Check for underutilized high-performing tools
  for (const toolName of underutilized) {
    const toolStats = effectiveness.find(e => e.toolName === toolName)
    if (toolStats && toolStats.successRate > 80) {
      potentialImprovements.push({
        action: `Use ${toolName} more often - it has high success rate`,
        expectedImpact: `${toolStats.successRate.toFixed(0)}% success rate but rarely used`,
        priority: 'medium',
      })
    }
  }

  // Check for poor-performing tools
  const poorTools = effectiveness.filter(e => e.successRate < 50 && e.totalUsage >= 5)
  for (const tool of poorTools) {
    potentialImprovements.push({
      action: `Review usage of ${tool.toolName} or consider alternatives`,
      expectedImpact: `Currently only ${tool.successRate.toFixed(0)}% success rate`,
      priority: 'high',
    })
  }

  // Suggest trying unused tools
  if (unused.length > 0) {
    potentialImprovements.push({
      action: `Consider using: ${unused.slice(0, 3).join(', ')}`,
      expectedImpact: 'These tools are available but never used',
      priority: 'low',
    })
  }

  return {
    agentId,
    toolEffectiveness: effectiveness,
    unusedTools: unused,
    underutilizedTools: underutilized,
    topCombinations,
    recommendations,
    potentialImprovements,
  }
}

/**
 * Clear tool usage data for an agent
 */
export function clearToolUsage(agentId: string): boolean {
  toolCombinations.delete(agentId)
  return toolUsage.delete(agentId)
}




