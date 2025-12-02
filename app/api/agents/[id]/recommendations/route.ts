import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../../../backend/utils/errorLogger"
import { getSkillAnalysis } from "../../../../../backend/improvement/skillAnalyzer"
import { getToolOptimization } from "../../../../../backend/improvement/toolOptimizer"
import { analyzePrompt } from "../../../../../backend/improvement/promptRefiner"
import { analyzeAgentErrors } from "../../../../../backend/analytics/errorAnalysis"
import { getAgent } from "../../../../../backend/agents/agentRegistry"

// Route segment configuration
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/agents/[id]/recommendations - Get improvement recommendations
 */
export async function GET(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    
    // Verify agent exists
    const agent = await getAgent(id)
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    // Gather all analyses
    const skillAnalysis = getSkillAnalysis(id)
    const toolOptimization = getToolOptimization(id)
    const promptAnalysis = analyzePrompt(id)
    const errorAnalysis = analyzeAgentErrors(id)

    // Combine all recommendations into a unified list
    const allRecommendations: Array<{
      id: string
      source: 'skills' | 'tools' | 'prompt' | 'errors'
      priority: 'low' | 'medium' | 'high' | 'critical'
      title: string
      description: string
      action: string
      expectedImpact: string
    }> = []

    // Add skill recommendations
    for (const rec of skillAnalysis.recommendations.slice(0, 5)) {
      allRecommendations.push({
        id: rec.id,
        source: 'skills',
        priority: rec.priority >= 8 ? 'high' : rec.priority >= 5 ? 'medium' : 'low',
        title: rec.title,
        description: rec.description,
        action: rec.type,
        expectedImpact: rec.expectedBenefit,
      })
    }

    // Add tool recommendations
    for (const imp of toolOptimization.potentialImprovements.slice(0, 5)) {
      allRecommendations.push({
        id: `tool-${Math.random().toString(36).slice(2)}`,
        source: 'tools',
        priority: imp.priority,
        title: imp.action,
        description: imp.expectedImpact,
        action: 'optimize',
        expectedImpact: imp.expectedImpact,
      })
    }

    // Add prompt recommendations
    for (const weak of promptAnalysis.weaknesses.filter(w => w.severity !== 'low').slice(0, 3)) {
      allRecommendations.push({
        id: weak.id,
        source: 'prompt',
        priority: weak.severity === 'high' ? 'high' : 'medium',
        title: `Prompt: ${weak.description}`,
        description: weak.suggestion,
        action: 'refine',
        expectedImpact: 'Improved prompt clarity and effectiveness',
      })
    }

    // Add error recommendations
    for (const rec of errorAnalysis.recommendations.slice(0, 3)) {
      allRecommendations.push({
        id: rec.id,
        source: 'errors',
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        action: rec.suggestedAction,
        expectedImpact: `Address ${rec.affectedExecutions} affected executions`,
      })
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    allRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return NextResponse.json({
      success: true,
      agentId: id,
      agentName: agent.name,
      summary: {
        skillCoverageScore: skillAnalysis.coverageScore,
        promptScore: promptAnalysis.overallScore,
        errorRiskLevel: errorAnalysis.riskLevel,
        improvementPotential: skillAnalysis.improvementPotential,
        totalRecommendations: allRecommendations.length,
      },
      recommendations: allRecommendations,
      details: {
        skills: {
          gaps: skillAnalysis.skillGaps.slice(0, 5),
          coverage: skillAnalysis.currentSkills,
        },
        tools: {
          effectiveness: toolOptimization.toolEffectiveness.slice(0, 5),
          unused: toolOptimization.unusedTools,
        },
        prompt: {
          score: promptAnalysis.overallScore,
          weaknesses: promptAnalysis.weaknesses,
        },
        errors: {
          riskLevel: errorAnalysis.riskLevel,
          topPatterns: errorAnalysis.topPatterns.slice(0, 3),
        },
      },
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'get_recommendations' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}




