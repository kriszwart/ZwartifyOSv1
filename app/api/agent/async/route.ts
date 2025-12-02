import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../../backend/utils/errorLogger"
import { createJob, getQueueStatus } from "../../../../backend/jobs/jobManager"
import { getAgent } from "../../../../backend/agents/agentRegistry"

// Route segment configuration
export const dynamic = 'force-dynamic'

/**
 * POST /api/agent/async - Start an async background job
 * 
 * Body:
 * - agentId: string (required) - ID of the agent to run
 * - input: string (required) - User input/goal
 * - autonomousMode?: boolean - Enable multi-turn autonomous execution
 * - maxToolIterations?: number - Max tool iterations (default: 5)
 * - sessionId?: string - Session ID for state persistence
 * - metadata?: object - Additional metadata
 */
export async function POST(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const body = await request.json()
    
    if (!body.agentId || typeof body.agentId !== 'string') {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      )
    }

    if (!body.input || typeof body.input !== 'string') {
      return NextResponse.json(
        { error: "input is required" },
        { status: 400 }
      )
    }

    // Get agent configuration
    const agent = getAgent(body.agentId)
    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${body.agentId}` },
        { status: 404 }
      )
    }

    // Create background job
    const job = createJob({
      agentId: body.agentId,
      input: body.input,
      options: {
        agentId: body.agentId,
        agentName: agent.name,
        agentPrompt: agent.prompt,
        ragFolderId: agent.ragFolderId,
        useMemory: agent.useMemory !== false,
        skillIds: agent.skillIds,
        autonomousMode: body.autonomousMode ?? false,
        maxToolIterations: body.maxToolIterations ?? 5,
        sessionId: body.sessionId,
      },
      metadata: body.metadata,
    })

    // Get queue status
    const queueStatus = getQueueStatus()

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        agentId: job.agentId,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt.toISOString(),
      },
      queueStatus,
      message: `Job queued. Poll GET /api/jobs/${job.id} for status.`,
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'create_async_job' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.statusCode }
    )
  }
}

/**
 * GET /api/agent/async - Get queue status
 */
export async function GET(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const queueStatus = getQueueStatus()

    return NextResponse.json({
      success: true,
      queue: queueStatus,
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'get_queue_status' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.statusCode }
    )
  }
}



