/**
 * Usage Analytics Utilities
 * 
 * Functions for calculating and aggregating token usage and costs
 */

import { getAllExecutions, getAgentExecutions } from '@/backend/db/logger'

export interface UsageStats {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  totalCost: number
  executionCount: number
  averageTokensPerExecution: number
  averageCostPerExecution: number
}

export interface TimeRange {
  start?: Date
  end?: Date
}

/**
 * Calculate cost from token counts
 * Claude Sonnet 4 pricing: Input $3/1M tokens, Output $15/1M tokens
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000 * 3) + (outputTokens / 1_000_000 * 15)
}

/**
 * Get usage statistics for all agents or a specific agent
 */
export function getUsageStats(agentId?: string, timeRange?: TimeRange): UsageStats {
  const executions = agentId 
    ? getAgentExecutions(agentId, 1000)
    : getAllExecutions(1000)

  // Filter by time range if provided
  let filteredExecutions = executions
  if (timeRange) {
    filteredExecutions = executions.filter(exec => {
      const execTime = exec.startedAt.getTime()
      const startTime = timeRange.start?.getTime() || 0
      const endTime = timeRange.end?.getTime() || Date.now()
      return execTime >= startTime && execTime <= endTime
    })
  }

  // Filter to only completed executions with token usage
  const executionsWithTokens = filteredExecutions.filter(
    exec => exec.status === 'completed' && exec.tokenUsage
  )

  let totalInputTokens = 0
  let totalOutputTokens = 0
  let totalCost = 0

  executionsWithTokens.forEach(exec => {
    if (exec.tokenUsage) {
      totalInputTokens += exec.tokenUsage.inputTokens
      totalOutputTokens += exec.tokenUsage.outputTokens
      totalCost += exec.tokenUsage.estimatedCost
    }
  })

  const totalTokens = totalInputTokens + totalOutputTokens
  const executionCount = executionsWithTokens.length
  const averageTokensPerExecution = executionCount > 0 ? totalTokens / executionCount : 0
  const averageCostPerExecution = executionCount > 0 ? totalCost / executionCount : 0

  return {
    totalTokens,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    totalCost,
    executionCount,
    averageTokensPerExecution: Math.round(averageTokensPerExecution),
    averageCostPerExecution: averageCostPerExecution,
  }
}

/**
 * Get total cost for a time range
 */
export function getTotalCost(timeRange?: TimeRange): number {
  const stats = getUsageStats(undefined, timeRange)
  return stats.totalCost
}

/**
 * Get usage breakdown by agent
 */
export function getUsageByAgent(): Record<string, UsageStats> {
  const allExecutions = getAllExecutions(1000)
  const agentMap: Record<string, UsageStats> = {}

  allExecutions
    .filter(exec => exec.status === 'completed' && exec.tokenUsage)
    .forEach(exec => {
      const agentId = exec.agentId
      if (!agentMap[agentId]) {
        agentMap[agentId] = {
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
          executionCount: 0,
          averageTokensPerExecution: 0,
          averageCostPerExecution: 0,
        }
      }

      if (exec.tokenUsage) {
        agentMap[agentId].totalTokens += exec.tokenUsage.totalTokens
        agentMap[agentId].inputTokens += exec.tokenUsage.inputTokens
        agentMap[agentId].outputTokens += exec.tokenUsage.outputTokens
        agentMap[agentId].totalCost += exec.tokenUsage.estimatedCost
        agentMap[agentId].executionCount++
      }
    })

  // Calculate averages
  Object.keys(agentMap).forEach(agentId => {
    const stats = agentMap[agentId]
    if (stats.executionCount > 0) {
      stats.averageTokensPerExecution = Math.round(stats.totalTokens / stats.executionCount)
      stats.averageCostPerExecution = stats.totalCost / stats.executionCount
    }
  })

  return agentMap
}

