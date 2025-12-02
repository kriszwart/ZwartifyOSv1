import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../../../backend/utils/errorLogger"
import { 
  analyzePrompt,
  applyPromptImprovement,
  rollbackPrompt,
  getPromptVersionHistory,
  comparePromptVersions,
} from "../../../../../backend/improvement/promptRefiner"
import { getAgent } from "../../../../../backend/agents/agentRegistry"

// Route segment configuration
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/agents/[id]/refine-prompt - Analyze current prompt
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

    const analysis = await analyzePrompt(id)

    return NextResponse.json({
      success: true,
      agentId: id,
      agentName: agent.name,
      analysis: {
        promptLength: analysis.promptLength,
        wordCount: analysis.wordCount,
        estimatedTokens: analysis.estimatedTokens,
        overallScore: analysis.overallScore,
        weaknesses: analysis.weaknesses.map(w => ({
          id: w.id,
          category: w.category,
          description: w.description,
          severity: w.severity,
          suggestion: w.suggestion,
        })),
        improvements: analysis.improvements.map(i => ({
          id: i.id,
          type: i.type,
          section: i.section,
          suggestedText: i.suggestedText,
          reason: i.reason,
          expectedImpact: i.expectedImpact,
          confidence: Math.round(i.confidence * 100),
        })),
        versionCount: analysis.versionHistory.length,
      },
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'analyze_prompt' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}

/**
 * POST /api/agents/[id]/refine-prompt - Apply prompt improvement
 * 
 * Body:
 * - action: 'apply' | 'rollback' | 'compare'
 * - newPrompt?: string (for apply)
 * - versionId?: string (for rollback)
 * - version1Id?: string (for compare)
 * - version2Id?: string (for compare)
 */
export async function POST(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    const body = await request.json()

    // Verify agent exists
    const agent = await getAgent(id)
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    switch (body.action) {
      case 'apply': {
        if (!body.newPrompt || typeof body.newPrompt !== 'string') {
          return NextResponse.json(
            { error: "newPrompt is required for apply action" },
            { status: 400 }
          )
        }

        const version = applyPromptImprovement(id, body.newPrompt, 'user')
        if (!version) {
          return NextResponse.json(
            { error: "Failed to apply prompt improvement" },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          action: 'applied',
          version: {
            id: version.id,
            version: version.version,
            createdAt: version.createdAt.toISOString(),
            active: version.active,
          },
          message: `Prompt updated to version ${version.version}`,
        })
      }

      case 'rollback': {
        if (!body.versionId) {
          return NextResponse.json(
            { error: "versionId is required for rollback action" },
            { status: 400 }
          )
        }

        const version = rollbackPrompt(id, body.versionId)
        if (!version) {
          return NextResponse.json(
            { error: "Version not found or rollback failed" },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          action: 'rolledback',
          version: {
            id: version.id,
            version: version.version,
            createdAt: version.createdAt.toISOString(),
            active: version.active,
          },
          message: `Rolled back to create version ${version.version}`,
        })
      }

      case 'compare': {
        if (!body.version1Id || !body.version2Id) {
          return NextResponse.json(
            { error: "version1Id and version2Id are required for compare action" },
            { status: 400 }
          )
        }

        const comparison = comparePromptVersions(id, body.version1Id, body.version2Id)
        
        return NextResponse.json({
          success: true,
          action: 'compared',
          comparison: {
            version1: comparison.version1 ? {
              id: comparison.version1.id,
              version: comparison.version1.version,
              executionCount: comparison.version1.metrics.executionCount,
              successRate: Math.round(comparison.version1.metrics.successRate * 10) / 10,
            } : null,
            version2: comparison.version2 ? {
              id: comparison.version2.id,
              version: comparison.version2.version,
              executionCount: comparison.version2.metrics.executionCount,
              successRate: Math.round(comparison.version2.metrics.successRate * 10) / 10,
            } : null,
            diff: {
              successRateDiff: Math.round(comparison.metricsDiff.successRateDiff * 10) / 10,
              responseTimeDiff: Math.round(comparison.metricsDiff.responseTimeDiff),
              tokensDiff: Math.round(comparison.metricsDiff.tokensDiff),
            },
            winner: comparison.winner,
          },
        })
      }

      case 'history': {
        const history = getPromptVersionHistory(id)
        
        return NextResponse.json({
          success: true,
          action: 'history',
          versions: history.map(v => ({
            id: v.id,
            version: v.version,
            createdAt: v.createdAt.toISOString(),
            createdBy: v.createdBy,
            active: v.active,
            metrics: {
              executionCount: v.metrics.executionCount,
              successRate: Math.round(v.metrics.successRate * 10) / 10,
              avgResponseTime: Math.round(v.metrics.avgResponseTime),
            },
            promptPreview: v.prompt.substring(0, 100) + (v.prompt.length > 100 ? '...' : ''),
          })),
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${body.action}. Use 'apply', 'rollback', 'compare', or 'history'` },
          { status: 400 }
        )
    }
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'refine_prompt' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}




