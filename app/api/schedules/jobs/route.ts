import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../../backend/utils/errorLogger"
import { 
  getAllJobHistory, 
  cleanupJobHistory,
  JobHistoryStatus 
} from "../../../../backend/scheduler/manager"

// Route segment configuration
export const dynamic = 'force-dynamic'

/**
 * GET /api/schedules/jobs - List schedule job history
 * 
 * Query params:
 * - status?: 'success' | 'failed' | 'skipped'
 * - agentId?: string
 * - limit?: number
 */
export async function GET(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as JobHistoryStatus | null
    const agentId = searchParams.get('agentId')
    const limit = searchParams.get('limit')

    const history = getAllJobHistory({
      status: status || undefined,
      agentId: agentId || undefined,
      limit: limit ? parseInt(limit, 10) : 50,
    })

    return NextResponse.json({
      success: true,
      jobs: history.map(h => ({
        id: h.id,
        scheduleId: h.scheduleId,
        agentId: h.agentId,
        status: h.status,
        input: h.input?.substring(0, 100),
        output: h.output?.substring(0, 200),
        error: h.error,
        startedAt: h.startedAt.toISOString(),
        completedAt: h.completedAt?.toISOString(),
        durationMs: h.durationMs,
        retryAttempt: h.retryAttempt,
      })),
      count: history.length,
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'list_schedule_jobs' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}

/**
 * DELETE /api/schedules/jobs - Cleanup old job history
 * 
 * Query params:
 * - maxAgeDays?: number (default: 7)
 */
export async function DELETE(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { searchParams } = new URL(request.url)
    const maxAgeDays = parseInt(searchParams.get('maxAgeDays') || '7', 10)
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000

    const cleaned = cleanupJobHistory(maxAgeMs)

    return NextResponse.json({
      success: true,
      cleaned,
      message: `Cleaned up ${cleaned} old job history records`,
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'cleanup_schedule_jobs' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}




