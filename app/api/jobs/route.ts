import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../backend/utils/errorLogger"
import { listJobs, cleanupOldJobs, getQueueStatus, JobStatus } from "../../../backend/jobs/jobManager"

// Route segment configuration
export const dynamic = 'force-dynamic'

/**
 * GET /api/jobs - List jobs with optional filters
 * 
 * Query params:
 * - status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
 * - agentId?: string
 * - limit?: number
 */
export async function GET(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as JobStatus | null
    const agentId = searchParams.get('agentId')
    const limit = searchParams.get('limit')

    const jobs = listJobs({
      status: status || undefined,
      agentId: agentId || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    })

    const queueStatus = getQueueStatus()

    return NextResponse.json({
      success: true,
      jobs: jobs.map(j => ({
        id: j.id,
        agentId: j.agentId,
        status: j.status,
        progress: j.progress,
        hasResult: !!j.result,
        hasError: !!j.error,
        createdAt: j.createdAt.toISOString(),
        completedAt: j.completedAt?.toISOString(),
      })),
      count: jobs.length,
      queue: queueStatus,
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'list_jobs' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}

/**
 * DELETE /api/jobs - Cleanup old jobs
 * 
 * Query params:
 * - maxAgeHours?: number (default: 24)
 */
export async function DELETE(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { searchParams } = new URL(request.url)
    const maxAgeHours = parseInt(searchParams.get('maxAgeHours') || '24', 10)
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000

    const cleaned = cleanupOldJobs(maxAgeMs)

    return NextResponse.json({
      success: true,
      cleaned,
      message: `Cleaned up ${cleaned} old jobs`,
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'cleanup_jobs' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}




