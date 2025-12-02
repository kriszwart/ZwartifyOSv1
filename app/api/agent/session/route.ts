import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../../backend/utils/errorLogger"
import { 
  createSession, 
  listSessions,
  CreateSessionOptions 
} from "../../../../backend/sessions/sessionManager"

// Route segment configuration
export const dynamic = 'force-dynamic'

/**
 * POST /api/agent/session - Create a new agent session
 * 
 * Body:
 * - agentId: string (required) - ID of the agent
 * - goals?: string[] - Initial goals for the session
 * - context?: object - Initial context data
 * - expiresInMs?: number - Session expiry in milliseconds
 * - maxIterations?: number - Max tool iterations for autonomous mode
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

    const options: CreateSessionOptions = {
      agentId: body.agentId,
      goals: body.goals,
      context: body.context,
      expiresInMs: body.expiresInMs,
      maxIterations: body.maxIterations,
      metadata: body.metadata,
    }

    const session = await createSession(options)

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        agentId: session.agentId,
        status: session.status,
        goals: session.goals,
        context: session.context,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        maxIterations: session.maxIterations,
        currentGoalId: session.currentGoalId,
      },
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'create_session' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}

/**
 * GET /api/agent/session - List sessions
 * 
 * Query params:
 * - status?: 'active' | 'paused' | 'completed' | 'expired'
 * - agentId?: string
 * - limit?: number
 */
export async function GET(request: NextRequest) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'active' | 'paused' | 'completed' | 'expired' | null
    const agentId = searchParams.get('agentId')
    const limit = searchParams.get('limit')

    const sessions = await listSessions({
      status: status || undefined,
      agentId: agentId || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    })

    return NextResponse.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        agentId: s.agentId,
        status: s.status,
        goalCount: s.goals.length,
        completedGoals: s.goals.filter(g => g.status === 'completed').length,
        iterationCount: s.iterationCount,
        maxIterations: s.maxIterations,
        createdAt: s.createdAt.toISOString(),
        lastActivityAt: s.lastActivityAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
      count: sessions.length,
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'list_sessions' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.status }
    )
  }
}



