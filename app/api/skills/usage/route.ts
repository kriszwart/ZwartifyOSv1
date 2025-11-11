import { NextResponse } from "next/server"
import { getAllSkillUsageStats, getTopUsedSkills, getSkillUsageStats } from "@/lib/analytics/skillUsageTracking"
import { getSkill, listSkills } from "../../../../backend/skills/store"

/**
 * GET /api/skills/usage - Get skill usage statistics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const top = searchParams.get('top') ? parseInt(searchParams.get('top')!, 10) : undefined
    const skillId = searchParams.get('skillId')
    
    if (skillId) {
      // Get usage for specific skill
      const usage = getSkillUsageStats(skillId)
      const skill = getSkill(skillId)
      
      if (!usage) {
        return NextResponse.json({ 
          skillId,
          skillName: skill?.name || 'Unknown',
          usageCount: 0,
          agentsUsing: [],
        })
      }
      
      return NextResponse.json({
        ...usage,
        skillName: skill?.name || usage.skillName,
      })
    }
    
    if (top) {
      // Get top used skills
      const topSkills = getTopUsedSkills(top)
      const skills = listSkills()
      
      // Enrich with skill names
      const enriched = topSkills.map(usage => {
        const skill = skills.find(s => s.id === usage.skillId)
        return {
          ...usage,
          skillName: skill?.name || usage.skillName,
        }
      })
      
      return NextResponse.json({ topSkills: enriched })
    }
    
    // Get all usage stats
    const allStats = getAllSkillUsageStats()
    const skills = listSkills()
    
    // Enrich with skill names
    const enriched = allStats.map(usage => {
      const skill = skills.find(s => s.id === usage.skillId)
      return {
        ...usage,
        skillName: skill?.name || usage.skillName,
      }
    })
    
    return NextResponse.json({ usage: enriched })
  } catch (error) {
    console.error("Error getting skill usage:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get skill usage" },
      { status: 500 }
    )
  }
}

