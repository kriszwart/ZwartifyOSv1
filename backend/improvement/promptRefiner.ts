/**
 * Prompt Refinement System
 * 
 * Enable agents to analyze and improve their system prompts.
 * Part of the Self-Improvement Loops feature (v1.4.0).
 */

import { randomUUID } from 'crypto'
import { getAgent, updateAgent } from '../agents/agentRegistry'

export interface PromptVersion {
  id: string
  agentId: string
  version: number
  prompt: string
  createdAt: Date
  createdBy: 'user' | 'system' | 'agent'
  metrics: PromptMetrics
  active: boolean
}

export interface PromptMetrics {
  executionCount: number
  successCount: number
  failureCount: number
  successRate: number
  avgResponseTime: number
  avgTokens: number
  userRating?: number // 1-5
}

export interface PromptWeakness {
  id: string
  category: 'clarity' | 'specificity' | 'context' | 'examples' | 'constraints' | 'tone'
  description: string
  severity: 'low' | 'medium' | 'high'
  suggestion: string
  affectedTaskTypes?: string[]
}

export interface PromptImprovement {
  id: string
  type: 'add' | 'modify' | 'remove'
  section: string
  originalText?: string
  suggestedText: string
  reason: string
  expectedImpact: string
  confidence: number // 0-1
}

export interface PromptAnalysisResult {
  agentId: string
  currentPrompt: string
  promptLength: number
  wordCount: number
  estimatedTokens: number
  weaknesses: PromptWeakness[]
  improvements: PromptImprovement[]
  overallScore: number // 0-100
  versionHistory: PromptVersion[]
}

// In-memory storage
const promptVersions = new Map<string, PromptVersion[]>() // agentId -> versions
const promptMetrics = new Map<string, PromptMetrics>() // versionId -> metrics
const MAX_VERSIONS = 10

/**
 * Record prompt metrics
 */
export function recordPromptExecution(
  agentId: string,
  success: boolean,
  responseTimeMs: number,
  tokens: number
): void {
  const versions = promptVersions.get(agentId) || []
  const activeVersion = versions.find(v => v.active)
  
  if (!activeVersion) return

  const metrics = activeVersion.metrics
  metrics.executionCount++
  if (success) metrics.successCount++
  else metrics.failureCount++
  metrics.successRate = (metrics.successCount / metrics.executionCount) * 100
  
  // Running average
  metrics.avgResponseTime = (
    (metrics.avgResponseTime * (metrics.executionCount - 1) + responseTimeMs) / 
    metrics.executionCount
  )
  metrics.avgTokens = (
    (metrics.avgTokens * (metrics.executionCount - 1) + tokens) / 
    metrics.executionCount
  )

  // Update in storage
  promptVersions.set(agentId, versions)
}

/**
 * Create initial prompt version for an agent
 */
export function initializePromptVersion(agentId: string, prompt: string): PromptVersion {
  const version: PromptVersion = {
    id: randomUUID(),
    agentId,
    version: 1,
    prompt,
    createdAt: new Date(),
    createdBy: 'user',
    metrics: {
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      avgResponseTime: 0,
      avgTokens: 0,
    },
    active: true,
  }

  promptVersions.set(agentId, [version])
  return version
}

/**
 * Analyze prompt for weaknesses
 */
export function analyzePromptWeaknesses(prompt: string): PromptWeakness[] {
  const weaknesses: PromptWeakness[] = []
  const lowered = prompt.toLowerCase()

  // Check for clarity issues
  if (prompt.length > 2000 && !prompt.includes('\n\n')) {
    weaknesses.push({
      id: randomUUID(),
      category: 'clarity',
      description: 'Long prompt without clear sections',
      severity: 'medium',
      suggestion: 'Break the prompt into clearly labeled sections with headers',
    })
  }

  // Check for specificity
  const vagueWords = ['maybe', 'sometimes', 'might', 'could', 'possibly', 'generally']
  const vagueCount = vagueWords.filter(w => lowered.includes(w)).length
  if (vagueCount >= 2) {
    weaknesses.push({
      id: randomUUID(),
      category: 'specificity',
      description: 'Prompt contains vague language',
      severity: 'medium',
      suggestion: 'Replace vague words with specific instructions and thresholds',
    })
  }

  // Check for missing context
  if (!lowered.includes('role') && !lowered.includes('you are') && !lowered.includes('your job')) {
    weaknesses.push({
      id: randomUUID(),
      category: 'context',
      description: 'No clear role definition',
      severity: 'high',
      suggestion: 'Start with a clear role statement like "You are a [specific role]"',
    })
  }

  // Check for examples
  if (!lowered.includes('example') && !lowered.includes('for instance') && !lowered.includes('such as')) {
    weaknesses.push({
      id: randomUUID(),
      category: 'examples',
      description: 'No examples provided',
      severity: 'low',
      suggestion: 'Add concrete examples of expected input/output patterns',
    })
  }

  // Check for constraints
  const constraintWords = ['must', 'always', 'never', 'required', 'important']
  const constraintCount = constraintWords.filter(w => lowered.includes(w)).length
  if (constraintCount === 0) {
    weaknesses.push({
      id: randomUUID(),
      category: 'constraints',
      description: 'No clear behavioral constraints',
      severity: 'medium',
      suggestion: 'Add clear constraints on what the agent must or must not do',
    })
  }

  // Check for tone guidance
  if (!lowered.includes('tone') && !lowered.includes('style') && !lowered.includes('formal') && !lowered.includes('friendly')) {
    weaknesses.push({
      id: randomUUID(),
      category: 'tone',
      description: 'No tone or style guidance',
      severity: 'low',
      suggestion: 'Specify the desired communication tone and style',
    })
  }

  // Length check
  if (prompt.length < 100) {
    weaknesses.push({
      id: randomUUID(),
      category: 'specificity',
      description: 'Prompt is too short for complex tasks',
      severity: 'high',
      suggestion: 'Expand the prompt with more detailed instructions and context',
    })
  }

  return weaknesses
}

/**
 * Generate improvement suggestions
 */
export function generatePromptImprovements(prompt: string, weaknesses: PromptWeakness[]): PromptImprovement[] {
  const improvements: PromptImprovement[] = []

  for (const weakness of weaknesses) {
    switch (weakness.category) {
      case 'context':
        improvements.push({
          id: randomUUID(),
          type: 'add',
          section: 'Beginning',
          suggestedText: 'You are a specialized AI assistant with expertise in [DOMAIN]. Your primary goal is to [OBJECTIVE].',
          reason: 'Clear role definition improves task focus',
          expectedImpact: 'Better understanding of scope and responsibilities',
          confidence: 0.9,
        })
        break

      case 'examples':
        improvements.push({
          id: randomUUID(),
          type: 'add',
          section: 'End',
          suggestedText: '\n\n## Examples\n\nExample 1:\nInput: [example input]\nOutput: [example output]\n\nExample 2:\nInput: [example input]\nOutput: [example output]',
          reason: 'Examples provide concrete guidance for expected behavior',
          expectedImpact: 'Improved accuracy on similar tasks',
          confidence: 0.85,
        })
        break

      case 'constraints':
        improvements.push({
          id: randomUUID(),
          type: 'add',
          section: 'After role definition',
          suggestedText: '\n\n## Important Guidelines\n- Always [behavior 1]\n- Never [behavior 2]\n- When uncertain, [fallback behavior]',
          reason: 'Clear constraints prevent unwanted behaviors',
          expectedImpact: 'More consistent and predictable responses',
          confidence: 0.88,
        })
        break

      case 'clarity':
        improvements.push({
          id: randomUUID(),
          type: 'modify',
          section: 'Overall structure',
          suggestedText: '# [Agent Name]\n\n## Role\n[role definition]\n\n## Capabilities\n[what you can do]\n\n## Guidelines\n[how to behave]\n\n## Output Format\n[expected format]',
          reason: 'Structured prompts are easier to parse and follow',
          expectedImpact: 'Clearer understanding of expectations',
          confidence: 0.82,
        })
        break

      case 'specificity':
        improvements.push({
          id: randomUUID(),
          type: 'modify',
          section: 'Vague instructions',
          originalText: 'maybe, sometimes, might',
          suggestedText: 'Replace vague words with specific conditions: "When [condition], do [action]"',
          reason: 'Specific instructions reduce ambiguity',
          expectedImpact: 'More deterministic behavior',
          confidence: 0.75,
        })
        break

      case 'tone':
        improvements.push({
          id: randomUUID(),
          type: 'add',
          section: 'Beginning or Guidelines',
          suggestedText: '\n\nCommunication Style:\n- Tone: Professional yet approachable\n- Length: Concise but comprehensive\n- Format: Use bullet points for clarity when appropriate',
          reason: 'Tone guidance ensures consistent user experience',
          expectedImpact: 'More consistent communication style',
          confidence: 0.7,
        })
        break
    }
  }

  return improvements.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Calculate overall prompt score
 */
export function calculatePromptScore(prompt: string, weaknesses: PromptWeakness[]): number {
  let score = 100

  // Deduct for weaknesses
  for (const weakness of weaknesses) {
    switch (weakness.severity) {
      case 'high':
        score -= 15
        break
      case 'medium':
        score -= 8
        break
      case 'low':
        score -= 3
        break
    }
  }

  // Bonus for good practices
  const lowered = prompt.toLowerCase()
  if (prompt.includes('##') || prompt.includes('**')) score += 5 // Structured
  if (lowered.includes('example')) score += 5 // Has examples
  if (lowered.includes('you are')) score += 3 // Has role
  if (prompt.length >= 200 && prompt.length <= 2000) score += 5 // Good length

  return Math.max(0, Math.min(100, score))
}

/**
 * Get prompt analysis for an agent
 */
export async function analyzePrompt(agentId: string): Promise<PromptAnalysisResult> {
  const agent = await getAgent(agentId)
  const prompt = agent?.prompt || ''
  
  const weaknesses = analyzePromptWeaknesses(prompt)
  const improvements = generatePromptImprovements(prompt, weaknesses)
  const score = calculatePromptScore(prompt, weaknesses)
  
  // Estimate tokens (rough: ~4 chars per token)
  const estimatedTokens = Math.ceil(prompt.length / 4)

  return {
    agentId,
    currentPrompt: prompt,
    promptLength: prompt.length,
    wordCount: prompt.split(/\s+/).filter(w => w.length > 0).length,
    estimatedTokens,
    weaknesses,
    improvements,
    overallScore: score,
    versionHistory: promptVersions.get(agentId) || [],
  }
}

/**
 * Apply a prompt improvement (creates new version)
 */
export function applyPromptImprovement(
  agentId: string,
  newPrompt: string,
  createdBy: 'user' | 'system' | 'agent' = 'system'
): PromptVersion | null {
  const versions = promptVersions.get(agentId) || []
  
  // Deactivate current version
  for (const v of versions) {
    v.active = false
  }

  // Get next version number
  const nextVersion = versions.length > 0 
    ? Math.max(...versions.map(v => v.version)) + 1 
    : 1

  // Create new version
  const newVersion: PromptVersion = {
    id: randomUUID(),
    agentId,
    version: nextVersion,
    prompt: newPrompt,
    createdAt: new Date(),
    createdBy,
    metrics: {
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      avgResponseTime: 0,
      avgTokens: 0,
    },
    active: true,
  }

  versions.push(newVersion)

  // Keep only recent versions
  if (versions.length > MAX_VERSIONS) {
    versions.shift()
  }

  promptVersions.set(agentId, versions)

  // Update agent in registry
  updateAgent(agentId, { prompt: newPrompt })

  return newVersion
}

/**
 * Rollback to a previous prompt version
 */
export function rollbackPrompt(agentId: string, versionId: string): PromptVersion | null {
  const versions = promptVersions.get(agentId) || []
  const targetVersion = versions.find(v => v.id === versionId)
  
  if (!targetVersion) return null

  // Deactivate all
  for (const v of versions) {
    v.active = false
  }

  // Create new version from old prompt
  return applyPromptImprovement(agentId, targetVersion.prompt, 'user')
}

/**
 * Compare two prompt versions
 */
export function comparePromptVersions(
  agentId: string,
  version1Id: string,
  version2Id: string
): {
  version1: PromptVersion | null
  version2: PromptVersion | null
  metricsDiff: {
    successRateDiff: number
    responseTimeDiff: number
    tokensDiff: number
  }
  winner: string | null
} {
  const versions = promptVersions.get(agentId) || []
  const v1 = versions.find(v => v.id === version1Id) || null
  const v2 = versions.find(v => v.id === version2Id) || null

  if (!v1 || !v2) {
    return { version1: v1, version2: v2, metricsDiff: { successRateDiff: 0, responseTimeDiff: 0, tokensDiff: 0 }, winner: null }
  }

  const successRateDiff = v2.metrics.successRate - v1.metrics.successRate
  const responseTimeDiff = v2.metrics.avgResponseTime - v1.metrics.avgResponseTime
  const tokensDiff = v2.metrics.avgTokens - v1.metrics.avgTokens

  // Determine winner (better success rate wins, tie goes to faster/cheaper)
  let winner: string | null = null
  if (v1.metrics.executionCount >= 5 && v2.metrics.executionCount >= 5) {
    if (successRateDiff > 5) winner = version2Id
    else if (successRateDiff < -5) winner = version1Id
    else if (responseTimeDiff < 0) winner = version2Id
    else if (responseTimeDiff > 0) winner = version1Id
  }

  return {
    version1: v1,
    version2: v2,
    metricsDiff: {
      successRateDiff,
      responseTimeDiff,
      tokensDiff,
    },
    winner,
  }
}

/**
 * Get version history
 */
export function getPromptVersionHistory(agentId: string): PromptVersion[] {
  return (promptVersions.get(agentId) || []).sort((a, b) => b.version - a.version)
}




