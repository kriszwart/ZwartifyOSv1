import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../../../backend/utils/errorLogger"
import { 
  getAgentMetrics,
  clearAgentMetrics,
} from "../../../../../backend/analytics/performanceMetrics"
import { getAgent } from "../../../../../backend/agents/agentRegistry"

// Route segment configuration
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/analytics/agent/[id] - Get agent performance metrics
 */
export async function GET(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    
    // Get agent info
    const agent = await getAgent(id)
    const agentName = agent?.name

    // Get metrics
    const metrics = getAgentMetrics(id, agentName)

    return NextResponse.json({
      success: true,
      metrics: {
        agentId: metrics.agentId,
        agentName: metrics.agentName,
        
        // Overall performance
        overview: {
          totalExecutions: metrics.totalExecutions,
          successfulExecutions: metrics.successfulExecutions,
          failedExecutions: metrics.failedExecutions,
          successRate: Math.round(metrics.successRate * 10) / 10,
          errorFrequency: Math.round(metrics.errorFrequency * 10) / 10,
        },
        
        // Timing
        timing: {
          avgResponseTimeMs: Math.round(metrics.avgResponseTimeMs),
          minResponseTimeMs: Math.round(metrics.minResponseTimeMs),
          maxResponseTimeMs: Math.round(metrics.maxResponseTimeMs),
          p95ResponseTimeMs: Math.round(metrics.p95ResponseTimeMs),
        },
        
        // Token usage
        tokens: {
          totalInputTokens: metrics.totalInputTokens,
          totalOutputTokens: metrics.totalOutputTokens,
          avgTokensPerExecution: Math.round(metrics.avgTokensPerExecution),
          estimatedTotalCost: Math.round(metrics.estimatedTotalCost * 100) / 100,
        },
        
        // Tools
        tools: {
          metrics: metrics.toolMetrics.map(t => ({
            toolName: t.toolName,
            totalCalls: t.totalCalls,
            successRate: Math.round(t.successRate * 10) / 10,
            avgDurationMs: Math.round(t.avgDurationMs),
          })),
          mostUsed: metrics.mostUsedTools,
          leastEffective: metrics.leastEffectiveTools,
        },
        
        // Task types
        taskTypes: metrics.taskTypeMetrics.map(t => ({
          taskType: t.taskType,
          totalTasks: t.totalTasks,
          successRate: Math.round(t.successRate * 10) / 10,
          avgDurationMs: Math.round(t.avgDurationMs),
          avgTokens: Math.round(t.avgTokens),
        })),
        
        // Errors
        errors: {
          frequency: Math.round(metrics.errorFrequency * 10) / 10,
          categories: metrics.errorCategories,
        },
        
        // Trends
        trends: {
          daily: {
            trend: metrics.trends.daily.trend,
            changePercent: Math.round(metrics.trends.daily.changePercent * 10) / 10,
            dataPointCount: metrics.trends.daily.dataPoints.length,
          },
          weekly: {
            trend: metrics.trends.weekly.trend,
            changePercent: Math.round(metrics.trends.weekly.changePercent * 10) / 10,
            dataPointCount: metrics.trends.weekly.dataPoints.length,
          },
        },
        
        // Meta
        calculatedAt: metrics.calculatedAt.toISOString(),
        dataRange: {
          start: metrics.dataRangeStart.toISOString(),
          end: metrics.dataRangeEnd.toISOString(),
        },
      },
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'get_agent_metrics' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}

/**
 * DELETE /api/analytics/agent/[id] - Clear agent metrics
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    const cleared = clearAgentMetrics(id)

    return NextResponse.json({
      success: true,
      cleared,
      message: cleared ? 'Metrics cleared' : 'No metrics found',
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'clear_agent_metrics' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}




