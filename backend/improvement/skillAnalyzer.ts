/**
 * Skill Gap Analysis
 * 
 * Identify missing capabilities and suggest improvements for agents.
 * Part of the Self-Improvement Loops feature (v1.4.0).
 */

import { randomUUID } from 'crypto'
import { listSkills, getSkill } from '../skills/store'
import { getAgent, listAgents } from '../agents/agentRegistry'

export interface SkillGap {
  id: string
  taskType: string
  missingCapability: string
  frequency: number // How often this gap was detected
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestedSkills: string[]
  examples: string[]
}

export interface SkillCoverage {
  skillId: string
  skillName: string
  usageCount: number
  successRate: number
  taskTypesServed: string[]
  lastUsed?: Date
}

export interface SkillRecommendation {
  id: string
  agentId: string
  type: 'add_skill' | 'remove_skill' | 'replace_skill' | 'create_skill'
  priority: number // 1-10, higher is more important
  title: string
  description: string
  expectedBenefit: string
  relatedGaps: string[]
  suggestedSkillId?: string
  suggestedSkillName?: string
}

export interface SkillAnalysisResult {
  agentId: string
  currentSkills: SkillCoverage[]
  skillGaps: SkillGap[]
  recommendations: SkillRecommendation[]
  coverageScore: number // 0-100
  improvementPotential: number // 0-100
}

// Track task failures for gap analysis
interface TaskFailure {
  agentId: string
  taskType: string
  input: string
  errorMessage: string
  timestamp: Date
}

// In-memory storage
const taskFailures = new Map<string, TaskFailure[]>() // agentId -> failures
const skillUsageStats = new Map<string, Map<string, { count: number; success: number }>>() // agentId -> (skillId -> stats)
const MAX_FAILURES = 200

// Task type to skill mapping (for recommendations)
const TASK_SKILL_MAPPING: Record<string, string[]> = {
  'content_generation': ['content-writing', 'copywriting', 'creative-writing'],
  'analysis': ['data-analysis', 'research', 'critical-thinking'],
  'coding': ['programming', 'code-review', 'debugging'],
  'search': ['research', 'information-retrieval'],
  'scheduling': ['task-management', 'automation'],
  'summarization': ['content-writing', 'information-extraction'],
  'translation': ['language', 'localization'],
  'agent_creation': ['meta-skills', 'agent-design'],
  'question_answering': ['knowledge-base', 'research'],
  'general': [],
}

// Capability keywords to detect gaps
const CAPABILITY_KEYWORDS: Record<string, string[]> = {
  'api_integration': ['api', 'integration', 'webhook', 'endpoint'],
  'data_processing': ['data', 'parse', 'transform', 'extract'],
  'file_handling': ['file', 'document', 'upload', 'download'],
  'authentication': ['auth', 'login', 'password', 'token'],
  'database': ['database', 'sql', 'query', 'storage'],
  'email': ['email', 'mail', 'send', 'notification'],
  'scheduling': ['schedule', 'cron', 'timer', 'recurring'],
  'analytics': ['analytics', 'metrics', 'tracking', 'report'],
}

/**
 * Record a task failure for gap analysis
 */
export function recordTaskFailure(
  agentId: string,
  taskType: string,
  input: string,
  errorMessage: string
): void {
  const failure: TaskFailure = {
    agentId,
    taskType,
    input: input.substring(0, 500),
    errorMessage,
    timestamp: new Date(),
  }

  const failures = taskFailures.get(agentId) || []
  failures.push(failure)

  if (failures.length > MAX_FAILURES) {
    failures.shift()
  }

  taskFailures.set(agentId, failures)
}

/**
 * Record skill usage
 */
export function recordSkillUsage(
  agentId: string,
  skillId: string,
  success: boolean
): void {
  const agentStats = skillUsageStats.get(agentId) || new Map()
  const stats = agentStats.get(skillId) || { count: 0, success: 0 }

  stats.count++
  if (success) stats.success++

  agentStats.set(skillId, stats)
  skillUsageStats.set(agentId, agentStats)
}

/**
 * Detect missing capability from failure
 */
function detectMissingCapability(failure: TaskFailure): string | null {
  const combined = `${failure.input} ${failure.errorMessage}`.toLowerCase()

  for (const [capability, keywords] of Object.entries(CAPABILITY_KEYWORDS)) {
    if (keywords.some(kw => combined.includes(kw))) {
      return capability
    }
  }

  return null
}

/**
 * Analyze skill gaps for an agent
 */
export function analyzeSkillGaps(agentId: string): SkillGap[] {
  const failures = taskFailures.get(agentId) || []
  if (failures.length === 0) return []

  // Group failures by detected capability gap
  const gapMap = new Map<string, {
    taskTypes: Set<string>
    examples: string[]
    count: number
  }>()

  for (const failure of failures) {
    const capability = detectMissingCapability(failure)
    if (!capability) continue

    const existing = gapMap.get(capability) || {
      taskTypes: new Set(),
      examples: [],
      count: 0,
    }

    existing.taskTypes.add(failure.taskType)
    if (existing.examples.length < 3) {
      existing.examples.push(failure.input.substring(0, 100))
    }
    existing.count++

    gapMap.set(capability, existing)
  }

  // Convert to SkillGap objects
  const gaps: SkillGap[] = []

  for (const [capability, data] of gapMap) {
    // Determine severity based on frequency
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (data.count >= 20) severity = 'critical'
    else if (data.count >= 10) severity = 'high'
    else if (data.count >= 5) severity = 'medium'

    // Find suggested skills
    const suggestedSkills: string[] = []
    for (const taskType of data.taskTypes) {
      const mapped = TASK_SKILL_MAPPING[taskType] || []
      suggestedSkills.push(...mapped)
    }

    gaps.push({
      id: randomUUID(),
      taskType: Array.from(data.taskTypes).join(', '),
      missingCapability: capability.replace(/_/g, ' '),
      frequency: data.count,
      severity,
      suggestedSkills: [...new Set(suggestedSkills)],
      examples: data.examples,
    })
  }

  return gaps.sort((a, b) => b.frequency - a.frequency)
}

/**
 * Analyze current skill coverage for an agent
 */
export function analyzeSkillCoverage(agentId: string): SkillCoverage[] {
  const agent = getAgent(agentId)
  if (!agent || !agent.skillIds) return []

  const agentStats = skillUsageStats.get(agentId) || new Map()
  const coverage: SkillCoverage[] = []

  for (const skillId of agent.skillIds) {
    const skill = getSkill(skillId)
    if (!skill) continue

    const stats = agentStats.get(skillId) || { count: 0, success: 0 }
    const successRate = stats.count > 0 ? (stats.success / stats.count) * 100 : 0

    coverage.push({
      skillId,
      skillName: skill.name,
      usageCount: stats.count,
      successRate,
      taskTypesServed: skill.metadata?.taskTypes as string[] || [],
    })
  }

  return coverage.sort((a, b) => b.usageCount - a.usageCount)
}

/**
 * Generate skill recommendations
 */
export function generateSkillRecommendations(agentId: string): SkillRecommendation[] {
  const gaps = analyzeSkillGaps(agentId)
  const coverage = analyzeSkillCoverage(agentId)
  const allSkills = listSkills()
  const agent = getAgent(agentId)

  const recommendations: SkillRecommendation[] = []
  const currentSkillIds = new Set(agent?.skillIds || [])

  // Recommend skills for gaps
  for (const gap of gaps) {
    if (gap.severity === 'low') continue

    // Find matching skills not currently assigned
    for (const skill of allSkills) {
      if (currentSkillIds.has(skill.id)) continue

      const skillKeywords = skill.name.toLowerCase().split(/\s+/)
      const gapKeywords = gap.missingCapability.toLowerCase().split(/\s+/)
      
      const hasMatch = skillKeywords.some(sk => 
        gapKeywords.some(gk => sk.includes(gk) || gk.includes(sk))
      )

      if (hasMatch) {
        recommendations.push({
          id: randomUUID(),
          agentId,
          type: 'add_skill',
          priority: gap.severity === 'critical' ? 9 : gap.severity === 'high' ? 7 : 5,
          title: `Add "${skill.name}" skill`,
          description: `This skill may address the "${gap.missingCapability}" gap`,
          expectedBenefit: `Could reduce failures in ${gap.taskType} tasks`,
          relatedGaps: [gap.id],
          suggestedSkillId: skill.id,
          suggestedSkillName: skill.name,
        })
      }
    }
  }

  // Recommend removing unused skills
  const unusedSkills = coverage.filter(s => s.usageCount === 0)
  for (const skill of unusedSkills) {
    recommendations.push({
      id: randomUUID(),
      agentId,
      type: 'remove_skill',
      priority: 2,
      title: `Consider removing "${skill.skillName}"`,
      description: 'This skill has never been used',
      expectedBenefit: 'Simplify agent configuration',
      relatedGaps: [],
      suggestedSkillId: skill.skillId,
      suggestedSkillName: skill.skillName,
    })
  }

  // Recommend replacing low-performing skills
  const poorSkills = coverage.filter(s => s.usageCount >= 5 && s.successRate < 50)
  for (const skill of poorSkills) {
    // Find a better alternative
    const alternatives = allSkills.filter(s => 
      !currentSkillIds.has(s.id) && 
      s.category === getSkill(skill.skillId)?.category
    )

    if (alternatives.length > 0) {
      const alt = alternatives[0]
      recommendations.push({
        id: randomUUID(),
        agentId,
        type: 'replace_skill',
        priority: 6,
        title: `Replace "${skill.skillName}" with "${alt.name}"`,
        description: `Current skill has only ${skill.successRate.toFixed(0)}% success rate`,
        expectedBenefit: 'May improve task success rate',
        relatedGaps: [],
        suggestedSkillId: alt.id,
        suggestedSkillName: alt.name,
      })
    }
  }

  // Recommend creating custom skill for persistent gaps
  const persistentGaps = gaps.filter(g => g.severity === 'critical' && g.suggestedSkills.length === 0)
  for (const gap of persistentGaps) {
    recommendations.push({
      id: randomUUID(),
      agentId,
      type: 'create_skill',
      priority: 8,
      title: `Create custom skill for "${gap.missingCapability}"`,
      description: `No existing skill addresses this gap (${gap.frequency} occurrences)`,
      expectedBenefit: 'Custom skill tailored to your needs',
      relatedGaps: [gap.id],
    })
  }

  return recommendations.sort((a, b) => b.priority - a.priority)
}

/**
 * Calculate coverage score
 */
export function calculateCoverageScore(agentId: string): number {
  const gaps = analyzeSkillGaps(agentId)
  const coverage = analyzeSkillCoverage(agentId)

  if (coverage.length === 0) return 50 // No skills assigned

  // Calculate based on:
  // - Number of skills (25%)
  // - Usage distribution (25%)
  // - Success rates (25%)
  // - Inverse of gaps (25%)

  // Skills score
  const skillScore = Math.min(coverage.length / 5, 1) * 25

  // Usage distribution
  const totalUsage = coverage.reduce((sum, s) => sum + s.usageCount, 0)
  const usageScore = totalUsage > 0 ? 25 : 0

  // Success rate
  const avgSuccess = coverage.length > 0
    ? coverage.reduce((sum, s) => sum + s.successRate, 0) / coverage.length
    : 0
  const successScore = (avgSuccess / 100) * 25

  // Gap penalty
  const criticalGaps = gaps.filter(g => g.severity === 'critical').length
  const highGaps = gaps.filter(g => g.severity === 'high').length
  const gapPenalty = Math.min((criticalGaps * 10 + highGaps * 5), 25)
  const gapScore = 25 - gapPenalty

  return Math.round(skillScore + usageScore + successScore + gapScore)
}

/**
 * Calculate improvement potential
 */
export function calculateImprovementPotential(agentId: string): number {
  const gaps = analyzeSkillGaps(agentId)
  const recommendations = generateSkillRecommendations(agentId)

  // Base potential on:
  // - Number of high-priority recommendations
  // - Gap severity distribution
  // - Unused skills ratio

  const highPriorityRecs = recommendations.filter(r => r.priority >= 7).length
  const criticalGaps = gaps.filter(g => g.severity === 'critical').length
  const coverage = analyzeSkillCoverage(agentId)
  const unusedRatio = coverage.length > 0
    ? coverage.filter(s => s.usageCount === 0).length / coverage.length
    : 0

  const recScore = Math.min(highPriorityRecs * 15, 40)
  const gapScore = Math.min(criticalGaps * 20, 40)
  const unusedScore = unusedRatio * 20

  return Math.round(Math.min(recScore + gapScore + unusedScore, 100))
}

/**
 * Get full skill analysis result
 */
export function getSkillAnalysis(agentId: string): SkillAnalysisResult {
  return {
    agentId,
    currentSkills: analyzeSkillCoverage(agentId),
    skillGaps: analyzeSkillGaps(agentId),
    recommendations: generateSkillRecommendations(agentId),
    coverageScore: calculateCoverageScore(agentId),
    improvementPotential: calculateImprovementPotential(agentId),
  }
}

/**
 * Clear analysis data for an agent
 */
export function clearSkillAnalysis(agentId: string): void {
  taskFailures.delete(agentId)
  skillUsageStats.delete(agentId)
}




