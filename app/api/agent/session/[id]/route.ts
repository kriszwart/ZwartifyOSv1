import { NextRequest, NextResponse } from "next/server"
import { applyMiddleware } from "../../../../../backend/middleware"
import { handleApiError, ErrorCategory } from "../../../../../backend/utils/errorLogger"
import { 
  getSession, 
  updateSession,
  pauseSession,
  resumeSession,
  completeSession,
  deleteSession,
  addGoal,
  updateGoal,
  buildSessionContext,
} from "../../../../../backend/sessions/sessionManager"

// Route segment configuration
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/agent/session/[id] - Get session details
 */
export async function GET(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    const session = await getSession(id)

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    // Include context string for agent integration
    const contextString = buildSessionContext(id)

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        agentId: session.agentId,
        status: session.status,
        goals: session.goals.map(g => ({
          id: g.id,
          description: g.description,
          status: g.status,
          createdAt: g.createdAt.toISOString(),
          completedAt: g.completedAt?.toISOString(),
        })),
        context: session.context,
        history: session.history.map(h => ({
          role: h.role,
          content: h.content,
          timestamp: h.timestamp.toISOString(),
          toolName: h.toolName,
        })),
        toolChain: session.toolChain.map(t => ({
          toolName: t.toolName,
          timestamp: t.timestamp.toISOString(),
        })),
        iterationCount: session.iterationCount,
        maxIterations: session.maxIterations,
        currentGoalId: session.currentGoalId,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        lastActivityAt: session.lastActivityAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        metadata: session.metadata,
      },
      contextString, // Ready-to-use context for agent prompts
    })
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'get_session' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.statusCode }
    )
  }
}

/**
 * PATCH /api/agent/session/[id] - Update session
 * 
 * Body:
 * - action?: 'pause' | 'resume' | 'complete' - Session state actions
 * - context?: object - Update session context
 * - metadata?: object - Update metadata
 * - addGoal?: string - Add a new goal
 * - updateGoal?: { goalId: string, status: string } - Update goal status
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    const body = await request.json()

    const session = getSession(id)
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    // Handle session actions
    if (body.action) {
      let result
      switch (body.action) {
        case 'pause':
          result = pauseSession(id)
          break
        case 'resume':
          result = resumeSession(id)
          break
        case 'complete':
          result = completeSession(id)
          break
        default:
          return NextResponse.json(
            { error: `Unknown action: ${body.action}` },
            { status: 400 }
          )
      }

      if (!result) {
        return NextResponse.json(
          { error: `Cannot ${body.action} session in current state` },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        action: body.action,
        session: {
          id: result.id,
          status: result.status,
        },
      })
    }

    // Handle add goal
    if (body.addGoal && typeof body.addGoal === 'string') {
      const goal = addGoal(id, body.addGoal)
      if (!goal) {
        return NextResponse.json(
          { error: "Failed to add goal" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        goal: {
          id: goal.id,
          description: goal.description,
          status: goal.status,
        },
      })
    }

    // Handle update goal
    if (body.updateGoal) {
      const { goalId, status } = body.updateGoal
      if (!goalId || !status) {
        return NextResponse.json(
          { error: "updateGoal requires goalId and status" },
          { status: 400 }
        )
      }

      const goal = updateGoal(id, goalId, status)
      if (!goal) {
        return NextResponse.json(
          { error: "Goal not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        goal: {
          id: goal.id,
          description: goal.description,
          status: goal.status,
        },
      })
    }

    // Handle context/metadata updates
    const updates: Record<string, unknown> = {}
    if (body.context) updates.context = body.context
    if (body.metadata) updates.metadata = body.metadata

    if (Object.keys(updates).length > 0) {
      const result = updateSession(id, updates as { context?: Record<string, unknown>; metadata?: Record<string, unknown> })
      if (!result) {
        return NextResponse.json(
          { error: "Failed to update session" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        updated: Object.keys(updates),
      })
    }

    return NextResponse.json(
      { error: "No valid update parameters provided" },
      { status: 400 }
    )
  } catch (error) {
    const errorResult = handleApiError(
      error,
      ErrorCategory.SYSTEM_ERROR,
      { operation: 'update_session' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.statusCode }
    )
  }
}

/**
 * DELETE /api/agent/session/[id] - Delete session
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  const middlewareResponse = await applyMiddleware(request)
  if (middlewareResponse) return middlewareResponse

  try {
    const { id } = await context.params
    const deleted = deleteSession(id)

    if (!deleted) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
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
      { operation: 'delete_session' }
    )
    return NextResponse.json(
      { error: errorResult.message },
      { status: errorResult.statusCode }
    )
  }
}



