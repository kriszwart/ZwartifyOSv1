/**
 * Skill Usage Tracking
 *
 * Tracks which skills are used in agent executions and provides analytics
 */

interface SkillUsage {
  skillId: string
  skillName: string
  usageCount: number
  lastUsed?: Date
  agentsUsing: string[] // Agent IDs that use this skill
}

// In-memory usage tracking (simple implementation)
// In production, this would be stored in a database
const skillUsageMap = new Map<string, SkillUsage>()

/**
 * Track skill usage
 */
export function trackSkillUsage(skillIds: string[], agentId: string): void {
  const now = new Date()

  skillIds.forEach(skillId => {
    const existing = skillUsageMap.get(skillId)

    if (existing) {
      existing.usageCount++
      existing.lastUsed = now
      if (!existing.agentsUsing.includes(agentId)) {
        existing.agentsUsing.push(agentId)
      }
    } else {
      skillUsageMap.set(skillId, {
        skillId,
        skillName: '', // Will be filled when queried
        usageCount: 1,
        lastUsed: now,
        agentsUsing: [agentId],
      })
    }
  })
}

/**
 * Get usage statistics for a skill
 */
export function getSkillUsageStats(skillId: string): SkillUsage | undefined {
  return skillUsageMap.get(skillId)
}

/**
 * Get usage statistics for all skills
 */
export function getAllSkillUsageStats(): SkillUsage[] {
  return Array.from(skillUsageMap.values())
}

/**
 * Get top used skills
 */
export function getTopUsedSkills(limit: number = 10): SkillUsage[] {
  return Array.from(skillUsageMap.values())
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit)
}

/**
 * Reset usage statistics (useful for testing)
 */
export function resetUsageStats(): void {
  skillUsageMap.clear()
}
