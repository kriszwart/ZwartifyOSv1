import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../../backend/utils/errorLogger"
import { getJob, cancelJob, deleteJob, retryJob } from "../../../../backend/jobs/jobManager"

// Route segment configuration
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/jobs/[id] - Get job status and result
 */
export async function GET(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    const job = getJob(id)

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        agentId: job.agentId,
        status: job.status,
        progress: job.progress,
        input: job.input.substring(0, 200) + (job.input.length > 200 ? '...' : ''),
        result: job.result,
        error: job.error,
        createdAt: job.createdAt.toISOString(),
        startedAt: job.startedAt?.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        metadata: job.metadata,
      },
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'get_job' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}

/**
 * PATCH /api/jobs/[id] - Update job (cancel or retry)
 * 
 * Body:
 * - action: 'cancel' | 'retry'
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    const body = await request.json()

    const job = getJob(id)
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      )
    }

    if (!body.action) {
      return NextResponse.json(
        { error: "action is required (cancel or retry)" },
        { status: 400 }
      )
    }

    switch (body.action) {
      case 'cancel': {
        const cancelled = cancelJob(id)
        if (!cancelled) {
          return NextResponse.json(
            { error: "Cannot cancel job - only pending jobs can be cancelled" },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          action: 'cancelled',
          jobId: id,
        })
      }

      case 'retry': {
        const retried = retryJob(id)
        if (!retried) {
          return NextResponse.json(
            { error: "Cannot retry job - only failed jobs can be retried" },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          action: 'retried',
          job: {
            id: retried.id,
            status: retried.status,
            progress: retried.progress,
          },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${body.action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'update_job' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}

/**
 * DELETE /api/jobs/[id] - Delete a completed/failed job
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    const deleted = deleteJob(id)

    if (!deleted) {
      return NextResponse.json(
        { error: "Cannot delete job - job not found or still running" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted: id,
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'delete_job' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}




