/**
 * Self-Improvement Tool
 * 
 * A tool that agents can call to trigger self-analysis and improvement.
 * Part of the Self-Improvement Loops feature (v1.4.0).
 */

import { getAgentMetrics } from '../analytics/performanceMetrics'
import { analyzeAgentErrors, ErrorAnalysisResult } from '../analytics/errorAnalysis'
import { getToolOptimization, ToolOptimizationResult } from '../improvement/toolOptimizer'
import { getSkillAnalysis, SkillAnalysisResult } from '../improvement/skillAnalyzer'
import { analyzePrompt, PromptAnalysisResult } from '../improvement/promptRefiner'
import { getCurrentAgentId, getCurrentUserPrompt } from './toolContext'
import { getAgent, updateAgent } from '../agents/agentRegistry'

// Build context object from individual functions
function getToolContext(): { agentId?: string; userPrompt?: string } | undefined {
  const agentId = getCurrentAgentId()
  const userPrompt = getCurrentUserPrompt()
  if (!agentId && !userPrompt) return undefined
  return { agentId, userPrompt }
}

interface SelfAnalysisResult {
  agentId: string
  agentName?: string
  overallHealth: 'excellent' | 'good' | 'fair' | 'needs_improvement' | 'critical'
  healthScore: number // 0-100
  summary: string
  metrics: {
    successRate: number
    totalExecutions: number
    trend: 'improving' | 'stable' | 'declining'
  }
  topWeaknesses: Array<{
    area: 'performance' | 'errors' | 'tools' | 'skills' | 'prompt'
    description: string
    severity: 'low' | 'medium' | 'high'
  }>
  topRecommendations: Array<{
    action: string
    expectedImpact: string
    priority: 'low' | 'medium' | 'high'
  }>
}

interface ImprovementApplication {
  type: 'prompt' | 'skill' | 'tool'
  action: string
  success: boolean
  message: string
}

/**
 * Analyze own performance and get insights
 */
async function analyzePerformance(args: { detailed?: boolean }): Promise<SelfAnalysisResult> {
  const context = getToolContext()
  const agentId = context?.agentId || 'unknown'
  
  // Get all analysis data
  const metrics = getAgentMetrics(agentId)
  const errors = analyzeAgentErrors(agentId)
  const tools = getToolOptimization(agentId)
  const skills = await getSkillAnalysis(agentId)
  const prompt = await analyzePrompt(agentId)

  // Calculate overall health score
  let healthScore = 100
  
  // Deduct for low success rate
  if (metrics.successRate < 90) healthScore -= (90 - metrics.successRate) * 0.5
  
  // Deduct for errors
  if (errors.riskLevel === 'critical') healthScore -= 20
  else if (errors.riskLevel === 'high') healthScore -= 10
  else if (errors.riskLevel === 'medium') healthScore -= 5

  // Deduct for skill gaps
  healthScore -= Math.min(skills.skillGaps.length * 3, 15)

  // Deduct for prompt weaknesses
  healthScore -= Math.min(prompt.weaknesses.filter(w => w.severity === 'high').length * 5, 15)

  // Deduct for declining trend
  if (metrics.trends.weekly.trend === 'declining') healthScore -= 10

  healthScore = Math.max(0, Math.min(100, healthScore))

  // Determine overall health
  let overallHealth: SelfAnalysisResult['overallHealth']
  if (healthScore >= 90) overallHealth = 'excellent'
  else if (healthScore >= 75) overallHealth = 'good'
  else if (healthScore >= 60) overallHealth = 'fair'
  else if (healthScore >= 40) overallHealth = 'needs_improvement'
  else overallHealth = 'critical'

  // Gather top weaknesses
  const topWeaknesses: SelfAnalysisResult['topWeaknesses'] = []

  if (metrics.successRate < 80) {
    topWeaknesses.push({
      area: 'performance',
      description: `Success rate is ${metrics.successRate.toFixed(0)}%`,
      severity: metrics.successRate < 50 ? 'high' : 'medium',
    })
  }

  if (errors.riskLevel === 'critical' || errors.riskLevel === 'high') {
    topWeaknesses.push({
      area: 'errors',
      description: `Error risk level is ${errors.riskLevel}`,
      severity: 'high',
    })
  }

  for (const gap of skills.skillGaps.filter(g => g.severity === 'high' || g.severity === 'critical').slice(0, 2)) {
    topWeaknesses.push({
      area: 'skills',
      description: `Missing capability: ${gap.missingCapability}`,
      severity: 'high',
    })
  }

  for (const weak of prompt.weaknesses.filter(w => w.severity === 'high').slice(0, 2)) {
    topWeaknesses.push({
      area: 'prompt',
      description: weak.description,
      severity: 'high',
    })
  }

  // Gather top recommendations
  const topRecommendations: SelfAnalysisResult['topRecommendations'] = []

  for (const imp of tools.potentialImprovements.slice(0, 2)) {
    topRecommendations.push({
      action: imp.action,
      expectedImpact: imp.expectedImpact,
      priority: imp.priority,
    })
  }

  for (const rec of skills.recommendations.filter(r => r.priority >= 7).slice(0, 2)) {
    topRecommendations.push({
      action: rec.title,
      expectedImpact: rec.expectedBenefit,
      priority: 'high',
    })
  }

  for (const imp of prompt.improvements.filter(i => i.confidence > 0.8).slice(0, 2)) {
    topRecommendations.push({
      action: `Prompt: ${imp.reason}`,
      expectedImpact: imp.expectedImpact,
      priority: 'medium',
    })
  }

  // Generate summary
  const summary = generateSummary(overallHealth, healthScore, metrics, topWeaknesses, topRecommendations)

  return {
    agentId,
    agentName: metrics.agentName,
    overallHealth,
    healthScore: Math.round(healthScore),
    summary,
    metrics: {
      successRate: Math.round(metrics.successRate * 10) / 10,
      totalExecutions: metrics.totalExecutions,
      trend: metrics.trends.weekly.trend,
    },
    topWeaknesses: topWeaknesses.slice(0, 5),
    topRecommendations: topRecommendations.slice(0, 5),
  }
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  health: SelfAnalysisResult['overallHealth'],
  score: number,
  metrics: { successRate: number; totalExecutions: number },
  weaknesses: SelfAnalysisResult['topWeaknesses'],
  recommendations: SelfAnalysisResult['topRecommendations']
): string {
  const parts: string[] = []

  // Overall status
  if (health === 'excellent') {
    parts.push(`I'm performing excellently with a ${score}% health score.`)
  } else if (health === 'good') {
    parts.push(`I'm performing well with a ${score}% health score.`)
  } else if (health === 'fair') {
    parts.push(`My performance is fair at ${score}% health. There's room for improvement.`)
  } else if (health === 'needs_improvement') {
    parts.push(`I need improvement. My health score is ${score}%.`)
  } else {
    parts.push(`My performance is critical at ${score}%. Immediate attention needed.`)
  }

  // Metrics
  parts.push(`I've handled ${metrics.totalExecutions} executions with a ${metrics.successRate.toFixed(0)}% success rate.`)

  // Key issues
  const highWeaknesses = weaknesses.filter(w => w.severity === 'high')
  if (highWeaknesses.length > 0) {
    parts.push(`Key issues: ${highWeaknesses.map(w => w.description).join('; ')}.`)
  }

  // Top recommendation
  if (recommendations.length > 0) {
    parts.push(`Top recommendation: ${recommendations[0].action}.`)
  }

  return parts.join(' ')
}

/**
 * Identify specific weaknesses
 */
async function identifyWeaknesses(args: { area?: 'all' | 'errors' | 'tools' | 'skills' | 'prompt' }): Promise<{
  area: string
  weaknesses: Array<{
    category: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    examples?: string[]
    suggestedFix?: string
  }>
}> {
  const context = getToolContext()
  const agentId = context?.agentId || 'unknown'
  const area = args.area || 'all'
  
  const weaknesses: Array<{
    category: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    examples?: string[]
    suggestedFix?: string
  }> = []

  if (area === 'all' || area === 'errors') {
    const errors = analyzeAgentErrors(agentId)
    for (const pattern of errors.topPatterns.slice(0, 3)) {
      weaknesses.push({
        category: `Error: ${pattern.category}`,
        description: pattern.pattern,
        severity: pattern.frequency >= 10 ? 'high' : pattern.frequency >= 5 ? 'medium' : 'low',
        suggestedFix: pattern.suggestedFix,
      })
    }
  }

  if (area === 'all' || area === 'tools') {
    const tools = getToolOptimization(agentId)
    for (const tool of tools.toolEffectiveness.filter(t => t.successRate < 60)) {
      weaknesses.push({
        category: 'Tool Performance',
        description: `${tool.toolName} has only ${tool.successRate.toFixed(0)}% success rate`,
        severity: tool.successRate < 30 ? 'high' : 'medium',
        suggestedFix: 'Review usage patterns or consider alternative tools',
      })
    }
  }

  if (area === 'all' || area === 'skills') {
    const skills = await getSkillAnalysis(agentId)
    for (const gap of skills.skillGaps) {
      weaknesses.push({
        category: 'Skill Gap',
        description: `Missing: ${gap.missingCapability}`,
        severity: gap.severity,
        examples: gap.examples,
        suggestedFix: gap.suggestedSkills.length > 0 
          ? `Consider adding: ${gap.suggestedSkills.join(', ')}` 
          : 'Create custom skill for this capability',
      })
    }
  }

  if (area === 'all' || area === 'prompt') {
    const prompt = await analyzePrompt(agentId)
    for (const weak of prompt.weaknesses) {
      weaknesses.push({
        category: `Prompt: ${weak.category}`,
        description: weak.description,
        severity: weak.severity === 'high' ? 'high' : weak.severity === 'medium' ? 'medium' : 'low',
        suggestedFix: weak.suggestion,
      })
    }
  }

  return {
    area,
    weaknesses: weaknesses.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.severity] - order[b.severity]
    }),
  }
}

/**
 * Get actionable improvement suggestions
 */
async function suggestImprovements(args: { limit?: number }): Promise<{
  improvements: Array<{
    id: string
    type: 'prompt' | 'skill' | 'tool' | 'config'
    action: string
    description: string
    expectedImpact: string
    difficulty: 'easy' | 'medium' | 'hard'
    canAutoApply: boolean
  }>
}> {
  const context = getToolContext()
  const agentId = context?.agentId || 'unknown'
  const limit = args.limit || 10

  const improvements: Array<{
    id: string
    type: 'prompt' | 'skill' | 'tool' | 'config'
    action: string
    description: string
    expectedImpact: string
    difficulty: 'easy' | 'medium' | 'hard'
    canAutoApply: boolean
  }> = []

  // Prompt improvements
  const prompt = await analyzePrompt(agentId)
  for (const imp of prompt.improvements.slice(0, 3)) {
    improvements.push({
      id: imp.id,
      type: 'prompt',
      action: imp.type === 'add' ? 'Add section' : imp.type === 'modify' ? 'Modify' : 'Remove',
      description: imp.reason,
      expectedImpact: imp.expectedImpact,
      difficulty: imp.type === 'add' ? 'easy' : 'medium',
      canAutoApply: true,
    })
  }

  // Skill improvements
  const skills = await getSkillAnalysis(agentId)
  for (const rec of skills.recommendations.slice(0, 3)) {
    improvements.push({
      id: rec.id,
      type: 'skill',
      action: rec.type.replace(/_/g, ' '),
      description: rec.description,
      expectedImpact: rec.expectedBenefit,
      difficulty: rec.type === 'add_skill' ? 'easy' : 'medium',
      canAutoApply: rec.type === 'add_skill' && !!rec.suggestedSkillId,
    })
  }

  // Tool improvements
  const tools = getToolOptimization(agentId)
  for (const imp of tools.potentialImprovements.slice(0, 3)) {
    improvements.push({
      id: `tool-${Math.random().toString(36).slice(2)}`,
      type: 'tool',
      action: 'Optimize usage',
      description: imp.action,
      expectedImpact: imp.expectedImpact,
      difficulty: 'medium',
      canAutoApply: false,
    })
  }

  return {
    improvements: improvements.slice(0, limit),
  }
}

/**
 * Apply an improvement (with safety checks)
 */
async function applyImprovement(args: { 
  improvementId: string
  confirm?: boolean 
}): Promise<ImprovementApplication> {
  const context = getToolContext()
  const agentId = context?.agentId || 'unknown'

  if (!args.confirm) {
    return {
      type: 'prompt',
      action: 'pending',
      success: false,
      message: 'Improvement not applied. Set confirm=true to apply changes.',
    }
  }

  // For now, we'll return a message that the improvement would be applied
  // In production, this would integrate with the actual update mechanisms
  
  return {
    type: 'prompt',
    action: args.improvementId,
    success: false,
    message: 'Auto-apply is disabled for safety. Please review and apply improvements manually through the API or UI.',
  }
}

// Export the tool definition
export const selfImproveTool = {
  name: 'selfImprove',
  description: `Self-improvement tool for agents to analyze their own performance and identify areas for improvement.

Available actions:
- analyzePerformance: Get overall health assessment and key metrics
- identifyWeaknesses: Find specific areas needing improvement
- suggestImprovements: Get actionable improvement recommendations
- applyImprovement: Apply a specific improvement (requires confirmation)

Use this tool to understand how you're performing and what can be improved.`,

  async execute(args: {
    action: 'analyzePerformance' | 'identifyWeaknesses' | 'suggestImprovements' | 'applyImprovement'
    detailed?: boolean
    area?: 'all' | 'errors' | 'tools' | 'skills' | 'prompt'
    limit?: number
    improvementId?: string
    confirm?: boolean
  }): Promise<string> {
    try {
      switch (args.action) {
        case 'analyzePerformance': {
          const result = await analyzePerformance({ detailed: args.detailed })
          return JSON.stringify(result, null, 2)
        }

        case 'identifyWeaknesses': {
          const result = await identifyWeaknesses({ area: args.area })
          return JSON.stringify(result, null, 2)
        }

        case 'suggestImprovements': {
          const result = await suggestImprovements({ limit: args.limit })
          return JSON.stringify(result, null, 2)
        }

        case 'applyImprovement': {
          if (!args.improvementId) {
            return JSON.stringify({ error: 'improvementId is required for applyImprovement action' })
          }
          const result = await applyImprovement({ 
            improvementId: args.improvementId, 
            confirm: args.confirm 
          })
          return JSON.stringify(result, null, 2)
        }

        default:
          return JSON.stringify({ 
            error: `Unknown action: ${args.action}`,
            availableActions: ['analyzePerformance', 'identifyWeaknesses', 'suggestImprovements', 'applyImprovement']
          })
      }
    } catch (error) {
      return JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  }
}

// Tool is exported and registered via tools/index.ts

