import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../backend/utils/errorLogger"
import { 
  getAllAgentMetricsSummary,
  getTopPerformingAgents,
  getAgentsNeedingAttention,
} from "../../../backend/analytics/performanceMetrics"

// Route segment configuration
export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics - Get analytics overview
 * 
 * Query params:
 * - view?: 'summary' | 'top' | 'attention' (default: summary)
 * - limit?: number (for top view)
 */
export async function GET(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'summary'
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    switch (view) {
      case 'top': {
        const topAgents = getTopPerformingAgents(limit)
        return NextResponse.json({
          success: true,
          view: 'top',
          agents: topAgents.map(a => ({
            agentId: a.agentId,
            agentName: a.agentName,
            successRate: Math.round(a.successRate * 10) / 10,
            totalExecutions: a.totalExecutions,
          })),
        })
      }

      case 'attention': {
        const needsAttention = getAgentsNeedingAttention()
        return NextResponse.json({
          success: true,
          view: 'attention',
          agents: needsAttention.map(a => ({
            agentId: a.agentId,
            agentName: a.agentName,
            successRate: Math.round(a.successRate * 10) / 10,
            trend: a.trend,
            reason: a.reason,
          })),
        })
      }

      case 'summary':
      default: {
        const allAgents = getAllAgentMetricsSummary()
        
        // Calculate platform-wide stats
        const totalExecutions = allAgents.reduce((sum, a) => sum + a.totalExecutions, 0)
        const weightedSuccessRate = allAgents.length > 0
          ? allAgents.reduce((sum, a) => sum + (a.successRate * a.totalExecutions), 0) / totalExecutions
          : 0

        const improving = allAgents.filter(a => a.trend === 'improving').length
        const declining = allAgents.filter(a => a.trend === 'declining').length
        const stable = allAgents.filter(a => a.trend === 'stable').length

        return NextResponse.json({
          success: true,
          view: 'summary',
          platform: {
            totalAgentsTracked: allAgents.length,
            totalExecutions,
            avgSuccessRate: Math.round(weightedSuccessRate * 10) / 10,
            trends: {
              improving,
              stable,
              declining,
            },
          },
          agents: allAgents.slice(0, 10).map(a => ({
            agentId: a.agentId,
            agentName: a.agentName,
            successRate: Math.round(a.successRate * 10) / 10,
            totalExecutions: a.totalExecutions,
            trend: a.trend,
          })),
        })
      }
    }
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'get_analytics' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}




